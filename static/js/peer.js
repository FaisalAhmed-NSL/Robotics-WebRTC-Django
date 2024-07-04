// map peer usernames to corresponding RTCPeerConnections
// as key value pairs
// const stunServers =  [
//     {
//       url: 'stun:global.stun.twilio.com:3478',
//       urls: 'stun:global.stun.twilio.com:3478'
//     },
//     {
//       url: 'turn:global.turn.twilio.com:3478?transport=udp',
//       username: 'c96cf878c9ef06662d5bed9f56957c33ca9df9fd5ac1a5864a43ef2c0e21deaf',
//       urls: 'turn:global.turn.twilio.com:3478?transport=udp',
//       credential: 'JHtgAzzMVloI1Wmc1GOIudJtEHdtYCKcpaaHxCPzpII='
//     },
//     {
//       url: 'turn:global.turn.twilio.com:3478?transport=tcp',
//       username: 'c96cf878c9ef06662d5bed9f56957c33ca9df9fd5ac1a5864a43ef2c0e21deaf',
//       urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
//       credential: 'JHtgAzzMVloI1Wmc1GOIudJtEHdtYCKcpaaHxCPzpII='
//     },
//     {
//       url: 'turn:global.turn.twilio.com:443?transport=tcp',
//       username: 'c96cf878c9ef06662d5bed9f56957c33ca9df9fd5ac1a5864a43ef2c0e21deaf',
//       urls: 'turn:global.turn.twilio.com:443?transport=tcp',
//       credential: 'JHtgAzzMVloI1Wmc1GOIudJtEHdtYCKcpaaHxCPzpII='
//     }
//   ]

const stunServers =  [{
    urls: [
      'turn:3.109.203.166:3478?transport=udp',
      'turn:3.109.203.166:3478?transport=tcp',
      'turns:3.109.203.166:5349?transport=tcp'
    ],
    username: 'username1',
    credential: 'password1'
  }];
  
var mapPeers = {};

// peers that stream own screen
// to remote peers
var mapScreenPeers = {};

// true if screen is being shared
// false otherwise
var screenShared = false;

const localVideo1 = document.querySelector('#local-video');
const localVideo2 = document.querySelector('#local-video2');

// button to start or stop screen sharing
var btnShareScreen = document.querySelector('#btn-share-screen');

// local video stream
var localStream = new MediaStream();
var localStream2 = new MediaStream();

// local screen stream
// for screen sharing
var localDisplayStream = new MediaStream();

// buttons to toggle self audio and video
btnToggleAudio1 = document.querySelector("#btn-toggle-audio1");
btnToggleVideo1 = document.querySelector("#btn-toggle-video1");

// buttons to toggle self audio and video 2
btnToggleAudio2 = document.querySelector("#btn-toggle-audio2");
btnToggleVideo2 = document.querySelector("#btn-toggle-video2");


var messageInput = document.querySelector('#msg');
var btnSendMsg = document.querySelector('#btn-send-msg');

// button to start or stop screen recording
var btnRecordScreen = document.querySelector('#btn-record-screen');
// object that will start or stop screen recording
var recorder;
// true of currently recording, false otherwise
var recording = false;

var file;

document.getElementById('share-file-button').addEventListener('click', () => {
    document.getElementById('select-file-dialog').style.display = 'block';
});

document.getElementById('cancel-button').addEventListener('click', () => {
    document.getElementById('select-file-input').value = '';
    document.getElementById('select-file-dialog').style.display = 'none';
    document.getElementById('ok-button').disabled = true;
});

document.getElementById('select-file-input').addEventListener('change', (event) => {
    file = event.target.files[0];
    document.getElementById('ok-button').disabled = !file;
});

// ul of messages
var ul = document.querySelector("#message-list");

var loc = window.location;

var endPoint = '';
var wsStart = 'ws://';

if (loc.protocol == 'https:') {
    wsStart = 'wss://';
}

// var endPoint = wsStart + loc.host + loc.pathname;
const endPoint = 'wss://robotics-webrtc-django.onrender.com/';
// console.log(`${wsStart} + ${loc.host} + ${loc.pathname}`,endPoint);
var webSocket;

var usernameInput = document.querySelector('#username');
var username;

var btnJoin = document.querySelector('#btn-join');
// console.log(btnJoin)
// set username
// join room (initiate websocket connection)
// upon button click
const robotVideo = document.querySelector("#robot-video");

const fullScreenToggole = document.querySelector("#fullScreen");
// fullScreenToggole.addEventListener("click", toggleFullscreen)
function toggleFullscreen() {
    console.log("clicked");
    if (robotVideo.requestFullScreen) {
        robotVideo.requestFullScreen();
    } else if (robotVideo.webkitRequestFullScreen) {
        robotVideo.webkitRequestFullScreen();
    } else if (robotVideo.mozRequestFullScreen) {
        robotVideo.mozRequestFullScreen();
    }
}



btnJoin.onclick = () => {
    console.log("Join")
    username = usernameInput.value;

    if (username == '') {
        // ignore if username is empty
        return;
    }

    // clear input
    usernameInput.value = '';
    // disable and vanish input
    btnJoin.disabled = true;
    usernameInput.style.visibility = 'hidden';
    // disable and vanish join button
    btnJoin.disabled = true;
    btnJoin.style.visibility = 'hidden';

    document.querySelector('#label-username').innerHTML = username;
    console.log("end point", endPoint);
    webSocket = new WebSocket(endPoint);

    webSocket.onopen = function (e) {
        console.log('Connection opened! ', e);

        // notify other peers
        sendSignal('new-peer', {
            'local_screen_sharing': false,
        });
    }


    // Sending message 

    webSocket.onmessage = webSocketOnMessage;

    webSocket.onclose = function (e) {
        console.log('Connection closed! ', e);
    }

    webSocket.onerror = function (e) {
        console.log('Error occured! ', e);
    }

    btnSendMsg.disabled = false;
    messageInput.disabled = false;
}

function webSocketOnMessage(event) {
    var parsedData = JSON.parse(event.data);


    var action = parsedData['action'];
    // username of other peer
    var peerUsername = parsedData['peer'];

    console.log('peerUsername: ', peerUsername);
    console.log('action: ', action);

    if (peerUsername == username) {
        // ignore all messages from oneself
        return;
    }



    // boolean value specified by other peer
    // indicates whether the other peer is sharing screen
    var remoteScreenSharing = parsedData['message']['local_screen_sharing'];
    console.log('remoteScreenSharing: ', remoteScreenSharing);



    // channel name of the sender of this message
    // used to send messages back to that sender
    // hence, receiver_channel_name
    var receiver_channel_name = parsedData['message']['receiver_channel_name'];
    console.log('receiver_channel_name: ', receiver_channel_name);


    // in case of new peer
    if (action == 'new-peer') {
        console.log('New peer: ', peerUsername);

        // create new RTCPeerConnection
        createOfferer(peerUsername, false, remoteScreenSharing, receiver_channel_name);

        if (screenShared && !remoteScreenSharing) {
            // if local screen is being shared
            // and remote peer is not sharing screen
            // send offer from screen sharing peer
            console.log('Creating screen sharing offer.');
            createOfferer(peerUsername, true, remoteScreenSharing, receiver_channel_name);
        }

        return;
    }


    // remote_screen_sharing from the remote peer
    // will be local screen sharing info for this peer


    var localScreenSharing = parsedData['message']['remote_screen_sharing'];

    if (action == 'new-offer') {
        console.log('Got new offer from ', peerUsername);

        // create new RTCPeerConnection
        // set offer as remote description
        var offer = parsedData['message']['sdp'];

        // Log SDP
        const sdpLinesOffer = offer['sdp'].split('\n');
        const mLinesOffer = sdpLinesOffer.filter(line => line.startsWith('m='));
        const midLinesOffer = sdpLinesOffer.filter(line => line.startsWith('a=mid'));
        const msidLinesOffer = sdpLinesOffer.filter(line => line.startsWith('a=msid'));

        console.log('Offer SDP - medias:', mLinesOffer);
        console.log('Offer SDP - media index:', midLinesOffer);
        console.log('Offer SDP - media id:', msidLinesOffer);

        var peer = createAnswerer(offer, peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name);


        console.log("Created answerer: ", peer);

        return;
    }


    if (action == 'new-answer') {
        // in case of answer to previous offer
        // get the corresponding RTCPeerConnection
        console.log('Got new answer from ', peerUsername);

        var peer = null;

        if (remoteScreenSharing) {
            // if answerer is screen sharer
            peer = mapPeers[peerUsername + ' Screen'][0];
        } else if (localScreenSharing) {
            // if offerer was screen sharer
            peer = mapScreenPeers[peerUsername][0];
        } else {
            // if both are non-screen sharers
            peer = mapPeers?.[peerUsername]?.[0];
        }

        // get the answer
        var answer = parsedData['message']['sdp'];

        console.log('mapPeers:');
        for (key in mapPeers) {
            console.log(key, ': ', mapPeers[key]);
        }

        console.log('peer: ', peer);

        // Log SDP
        const sdpLinesAnswer = answer['sdp'].split('\n');
        const mLinesAnswer = sdpLinesAnswer.filter(line => line.startsWith('m='));
        const midLinesAnswer = sdpLinesAnswer.filter(line => line.startsWith('a=mid'));
        const msidLinesAnswer = sdpLinesAnswer.filter(line => line.startsWith('a=msid'));

        console.log('Answer SDP - medias:', mLinesAnswer);
        console.log('Answer SDP - media index:', midLinesAnswer);
        console.log('Answer SDP - media id:', msidLinesAnswer);

        // set remote description of the RTCPeerConnection
        peer?.setRemoteDescription(answer);

        return;
    }
}

messageInput.addEventListener('keyup', function (event) {
    if (event.keyCode == 13) {
        // prevent from putting 'Enter' as input
        event.preventDefault();

        // click send message button
        btnSendMsg.click();
    }
});

btnSendMsg.onclick = btnSendMsgOnClick;

// Text message (disabled)
function btnSendMsgOnClick() {
    var message = messageInput.value;

    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Me: " + message));
    ul.appendChild(li);

    var dataChannels = getDataChannels();

    console.log('Sending: ', message);

    // send to all data channels
    for (index in dataChannels) {
        dataChannels[index].send(username + ': ' + message);
    }

    messageInput.value = '';
}

const constraints = {
    'video': {
        width: { max: 320 },
        height: { max: 240 }
    },
    'audio': true
}


const iceConfiguration = {
    iceServers: stunServers
};
// showingController()

navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        const cameras = devices.filter(device => device.kind === 'videoinput');

        // Camera 1
        if (cameras.length >= 1) {
            const cameraId1 = cameras[0].deviceId;
            const videoConstraints1 = {
                width: { max: 320 },
                height: { max: 240 },
                deviceId: { exact: cameraId1 },
            };

            navigator.mediaDevices.getUserMedia({ video: videoConstraints1, audio: { 'echoCancellation': true } })
                .then(stream1 => {

                    localStream = stream1;
                    var mediaTracks1 = stream1.getTracks();

                    for (i = 0; i < mediaTracks1.length; i++) {
                        // console.log(mediaTracks[i]);
                    }

                    localVideo1.srcObject = stream1;
                    localVideo1.muted = true;

                    window.stream1 = stream1; // make variable available to browser console

                    const audioTracks1 = stream1.getAudioTracks();
                    const videoTracks1 = stream1.getVideoTracks();

                    btnToggleAudio1.onclick = function () {
                        audioTracks1[0].enabled = !audioTracks1[0].enabled;
                        btnToggleAudio1.innerHTML = audioTracks1[0].enabled ? 'Audio Mute' : 'Audio Unmute';
                    };

                    btnToggleVideo1.onclick = function () {
                        videoTracks1[0].enabled = !videoTracks1[0].enabled;
                        btnToggleVideo1.innerHTML = videoTracks1[0].enabled ? 'Video Off' : 'Video On';
                    };
                })
                .catch(error => {
                    console.error('Error accessing webcam 1:', error);
                });
        } else {
            console.error('Camera 1 not found');
        }

        // Camera 2
        if (cameras.length >= 2) {
            const cameraId2 = cameras[1].deviceId;
            const videoConstraints2 = {
                width: { max: 320 },
                height: { max: 240 },
                deviceId: { exact: cameraId2 },
            };

            navigator.mediaDevices.getUserMedia({ video: videoConstraints2, audio: false })
                .then(stream2 => {
                    localStream2 = stream2;
                    var mediaTracks2 = stream2.getTracks();

                    for (i = 0; i < mediaTracks2.length; i++) {
                        // console.log(mediaTracks[i]);
                    }

                    localVideo2.srcObject = stream2;
                    localVideo2.muted = true;

                    window.stream2 = stream2; // make variable available to browser console

                    const audioTracks2 = stream2.getAudioTracks();
                    const videoTracks2 = stream2.getVideoTracks();

                    btnToggleAudio2.onclick = function () {
                        audioTracks2[0].enabled = !audioTracks2[0].enabled;
                        btnToggleAudio2.innerHTML = audioTracks2[0].enabled ? 'Back Audio Mute' : 'Back Audio Unmute';
                    };

                    btnToggleVideo2.onclick = function () {
                        videoTracks2[0].enabled = !videoTracks2[0].enabled;
                        btnToggleVideo2.innerHTML = videoTracks2[0].enabled ? 'Back Video Off' : 'Back Video On';
                    };
                })
                .catch(error => {
                    console.error('Error accessing webcam 2:', error);
                });
        } else {
            // If there's only one camera, hide the second camera controls
            document.getElementById('controls2').style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error enumerating devices:', error);
    })

    .then(e => {
        btnShareScreen.onclick = event => {
            if (screenShared) {
                // toggle screenShared
                screenShared = !screenShared;

                // set to own video
                // if screen already shared
                localVideo.srcObject = localStream;
                btnShareScreen.innerHTML = 'Share screen';

                // get screen sharing video element
                var localScreen = document.querySelector('#my-screen-video');
                // remove it
                removeVideo(localScreen);

                // close all screen share peer connections
                var screenPeers = getPeers(mapScreenPeers);
                for (index in screenPeers) {
                    screenPeers[index].close();
                }
                // empty the screen sharing peer storage object
                mapScreenPeers = {};

                return;
            }

            // toggle screenShared
            screenShared = !screenShared;

            navigator.mediaDevices.getDisplayMedia(constraints)
                .then(stream => {
                    localDisplayStream = stream;

                    var mediaTracks = stream.getTracks();
                    for (i = 0; i < mediaTracks.length; i++) {
                        console.log(mediaTracks[i]);
                    }

                    var localScreen = createVideo('my-screen');
                    // set to display stream
                    // if screen not shared
                    localScreen.srcObject = localDisplayStream;

                    // notify other peers
                    // of screen sharing peer
                    sendSignal('new-peer', {
                        'local_screen_sharing': true,
                    });
                })
                .catch(error => {
                    console.log('Error accessing display media.', error);
                });

            btnShareScreen.innerHTML = 'Stop sharing';
        }
    })
    .then(e => {
        btnRecordScreen.addEventListener('click', () => {
            if (recording) {
                // toggle recording
                recording = !recording;

                btnRecordScreen.innerHTML = 'Record Screen';

                recorder.stopRecording(function () {
                    var blob = recorder.getBlob();
                    invokeSaveAsDialog(blob);
                });

                return;
            }

            // toggle recording
            recording = !recording;

            navigator.mediaDevices.getDisplayMedia(constraints)
                .then(stream => {
                    recorder = RecordRTC(stream, {
                        type: 'video',
                        MimeType: 'video/mp4'
                    });
                    recorder.startRecording();

                    var mediaTracks = stream.getTracks();
                    for (i = 0; i < mediaTracks.length; i++) {
                        console.log(mediaTracks[i]);
                    }

                })
                .catch(error => {
                    console.log('Error accessing display media.', error);
                });

            btnRecordScreen.innerHTML = 'Stop Recording';
        });
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });

// send the given action and message
// over the websocket connection
function sendSignal(action, message) {
    webSocket.send(
        JSON.stringify(
            {
                'peer': username,
                'action': action,
                'message': message,
            }
        )
    )
}

// create RTCPeerConnection as offerer
// and store it and its datachannel
// send sdp to remote peer after gathering is complete

/**
 * Creates an offerer for initiating a WebRTC session.
 * The offerer generates an offer describing its local media capabilities and settings,
 * then sends the offer to the remote peer through a signaling mechanism.
 *
 * @returns {RTCSessionDescription} The generated offer describing the local media capabilities and settings.
 * 
 * Peer create offer for the new remote peers
 */

function createOfferer(peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name) {
    var peer = new RTCPeerConnection({
        iceServers: stunServers,
    });

    // add local user media stream tracks
    addLocalTracks(peer, localScreenSharing);

    // create and manage an RTCDataChannel
    var dc = peer.createDataChannel("channel");
    dc.onopen = () => {
        showingController()
        console.log("Connection opened.");
    };
    var remoteVideo = null;
    var remoteVideo1 = null;

    if (!localScreenSharing && !remoteScreenSharing) {
        // none of the peers are sharing screen (normal operation)

        dc.onmessage = dcOnMessage;

        if (peerUsername === "robot") {
            remoteVideo1 = createVideo(peerUsername);
            console.log("peer check", peer);
            console.log('remoteVideo1: ', remoteVideo1.video1);
            console.log('remoteVideo2: ', remoteVideo1.video2);
            setOnTrack2(peer, remoteVideo1.video1, remoteVideo1.video2);

            // Push the new video elements to the array
            mapPeers[peerUsername] = [peer, dc];

        } else {
            remoteVideo1 = createVideo(peerUsername);
            setOnTrack(peer, remoteVideo1);

            // Push the new video element to the array
            mapPeers[peerUsername] = [peer, dc];
        }

        peer.oniceconnectionstatechange = () => {
            console.log("iceConnectionState with peer obj", peer);
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                console.log('Deleting peer: iceConnectionState =', iceConnectionState);
                showingController();
                delete mapPeers[peerUsername];
                if (iceConnectionState != 'closed') {
                    peer.close();
                }
                if (peerUsername === "robot") {
                    removeVideo(remoteVideo1.video1);
                    removeVideo(remoteVideo1.video2);
                } else {
                    removeVideo(remoteVideo1);
                }
            }
        };
    } else if (!localScreenSharing && remoteScreenSharing) {
        // answerer is screen sharing

        dc.onmessage = (e) => {
            console.log('New message from %s\'s screen: ', peerUsername, e.data);
        };

        remoteVideo = createVideo(peerUsername + '-screen');
        setOnTrack(peer, remoteVideo);
        console.log('Remote video source: ', remoteVideo.srcObject);

        // if offer is not for screen sharing peer
        mapPeers[peerUsername + ' Screen'] = [peer, dc];

        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                //changed 12/5/2023
                showingController()
                delete mapPeers[peerUsername + ' Screen'];
                if (iceConnectionState != 'closed') {
                    peer.close();
                }
                removeVideo(remoteVideo);
            }
        };
    } else {
        // offerer itself is sharing screen

        dc.onmessage = (e) => {
            console.log('New message from %s: ', peerUsername, e.data);
        };

        mapScreenPeers[peerUsername] = [peer, dc];

        //chenges by shuvo
        peer.onicecandidateerror = (e) => {
            console.log("on error", e);
        }
        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                //changed 12/5/2023
                showingController()
                delete mapScreenPeers[peerUsername];
                if (iceConnectionState != 'closed') {
                    peer.close();
                }
            }
        };
    }

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            // console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer.localDescription));
            return;
        }

        // event.candidate == null indicates that gathering is complete

        console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.');
        console.log('receiverChannelName: ', receiver_channel_name);



        // Log the SDP before sending the offer
        // console.log('Offer SDP - media: ', peer.localDescription.sdp.match(/m=.*/g));
        // console.log('Offer SDP - media index: ', peer.localDescription.sdp.match(/a=mid.*/g));
        // console.log('Offer SDP - media id: ', peer.localDescription.sdp.match(/a=msid.*/g));

        // send offer to new peer
        // after ice candidate gathering is complete
        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
            'local_screen_sharing': localScreenSharing,
            'remote_screen_sharing': remoteScreenSharing,
        });
    }

    peer.createOffer()
        .then(o => { 
            console.log("o", o);
            peer.setLocalDescription(o)})
        .then(function (event) {
            console.log("Local Description Set successfully.");
        });



    console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);

    return peer;
}

// create RTCPeerConnection as answerer
// and store it and its datachannel
// send sdp to remote peer after gathering is complete

/**
 * Creates an answerer for responding to a received offer in a WebRTC session.
 * The answerer receives the offer from the remote peer, sets it as the remote description,
 * generates an answer describing its local media capabilities and settings, and sends the answer back.
 *
 * @param {RTCSessionDescription} remoteOffer - The offer received from the remote peer.
 * @returns {RTCSessionDescription} The generated answer describing the local media capabilities and settings.
 * 
 * The new peer to join creates answer for the already joined remote peers
 */

function createAnswerer(offer, peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name) {
    var peer = new RTCPeerConnection({
        iceServers: stunServers,
    });

    addLocalTracks(peer, localScreenSharing);

    if (!localScreenSharing && !remoteScreenSharing) {
        // if none are sharing screens (normal operation)

        // set remote video
        // var remoteVideo = createVideo(peerUsername);
        var remoteVideo, remoteVideo1;

        if (peerUsername == "robot") {
            remoteVideo1 = createVideo(peerUsername);

            console.log("peer check", peer);
            console.log('remoteVideo1: ', remoteVideo1.video1);
            console.log('remoteVideo1: ', remoteVideo1.video2);
            setOnTrack2(peer, remoteVideo1.video1, remoteVideo1.video2);

            // it will have an RTCDataChannel
            peer.ondatachannel = e => {
                console.log('e.channel.label: ', e.channel.label);
                peer.dc = e.channel;
                peer.dc.onmessage = dcOnMessage;
                peer.dc.onopen = () => {
                    console.log("Connection opened.");
                    showingController()
                }

                // store the RTCPeerConnection
                // and the corresponding RTCDataChannel
                // after the RTCDataChannel is ready
                // otherwise, peer.dc may be undefined
                // as peer.ondatachannel would not be called yet
                // mapPeers[peerUsername] = [peer, peer.dc];
                // mapPeers[peerUsername] = [peer, dc, remoteVideo1];
                mapPeers[peerUsername] = [peer, peer.dc];

            }
        } else {
            remoteVideo = createVideo(peerUsername);
            setOnTrack(peer, remoteVideo);

            // it will have an RTCDataChannel
            peer.ondatachannel = e => {
                console.log('e.channel.label: ', e.channel.label);
                peer.dc = e.channel;
                peer.dc.onmessage = dcOnMessage;
                peer.dc.onopen = () => {
                    console.log("Connection opened.");
                    showingController()
                }

                // store the RTCPeerConnection
                // and the corresponding RTCDataChannel
                // after the RTCDataChannel is ready
                // otherwise, peer.dc may be undefined
                // as peer.ondatachannel would not be called yet
                // mapPeers[peerUsername] = [peer, peer.dc];
                mapPeers[peerUsername] = [peer, peer.dc];

            }
        }



        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                console.log('Deleting peer: iceConnectionState =', iceConnectionState);
                //changed 12/5/2023
                showingController()
                delete mapPeers[peerUsername];
                if (iceConnectionState != 'closed') {
                    peer.close();
                }

                if (peerUsername == "robot") {
                    removeVideo(remoteVideo1.video1);
                    removeVideo(remoteVideo1.video2);
                }
                else {
                    removeVideo(remoteVideo);
                }
            }
        };
        //chenges by shuvo
        peer.onicecandidateerror = (e) => {
            console.log("on error", e);
        }
    } else if (localScreenSharing && !remoteScreenSharing) {
        // answerer itself is sharing screen

        // it will have an RTCDataChannel
        peer.ondatachannel = e => {
            peer.dc = e.channel;
            peer.dc.onmessage = (evt) => {
                console.log('New message from %s: ', peerUsername, evt.data);
            }
            peer.dc.onopen = () => {
                // controller.style.display = "flex"
                showingController()
                console.log("Connection opened.");
            }

            // this peer is a screen sharer
            // so its connections will be stored in mapScreenPeers
            // store the RTCPeerConnection
            // and the corresponding RTCDataChannel
            // after the RTCDataChannel is ready
            // otherwise, peer.dc may be undefined
            // as peer.ondatachannel would not be called yet
            mapScreenPeers[peerUsername] = [peer, peer.dc];

            peer.oniceconnectionstatechange = () => {
                var iceConnectionState = peer.iceConnectionState;
                if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                    //changed 12/5/2023
                    showingController()
                    delete mapScreenPeers[peerUsername];
                    if (iceConnectionState != 'closed') {
                        peer.close();
                    }
                }
            };
        }
    } else {
        // offerer is sharing screen

        // set remote video
        var remoteVideo = createVideo(peerUsername + '-screen');
        // and add tracks to remote video
        setOnTrack(peer, remoteVideo);

        // it will have an RTCDataChannel
        peer.ondatachannel = e => {
            peer.dc = e.channel;
            peer.dc.onmessage = evt => {
                console.log('New message from %s\'s screen: ', peerUsername, evt.data);
            }
            peer.dc.onopen = () => {
                console.log("Connection opened.");
            }

            // store the RTCPeerConnection
            // and the corresponding RTCDataChannel
            // after the RTCDataChannel is ready
            // otherwise, peer.dc may be undefined
            // as peer.ondatachannel would not be called yet
            mapPeers[peerUsername + ' Screen'] = [peer, peer.dc];

        }
        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                //changed 12/5/2023
                showingController()
                delete mapPeers[peerUsername + ' Screen'];
                if (iceConnectionState != 'closed') {
                    peer.close();

                }
                removeVideo(remoteVideo);
            }
        };
    }

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            // console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer.localDescription));
            return;
        }

        // event.candidate == null indicates that gathering is complete

        console.log('Gathering finished! Sending answer SDP to ', peerUsername, '.');
        console.log('receiverChannelName: ', receiver_channel_name);

        // Log the SDP before sending the offer
        // console.log('Answer SDP - media: ', peer.localDescription.sdp.match(/m=.*/g));
        // console.log('Answer SDP - media index: ', peer.localDescription.sdp.match(/a=mid.*/g));
        // console.log('Answer SDP - media id: ', peer.localDescription.sdp.match(/a=msid.*/g));

        // send answer to offering peer
        // after ice candidate gathering is complete
        // answer needs to send two types of screen sharing data
        // local and remote so that offerer can understand
        // to which RTCPeerConnection this answer belongs

        console.log("Using sendSignal to create answer");
        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
            'local_screen_sharing': localScreenSharing,
            'remote_screen_sharing': remoteScreenSharing,
        });
        console.log("Used sendSignal to create answer");

    }

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log('Set offer from %s.', peerUsername);
            // console.log('Created Answer: ',  peer.createAnswer());
            return peer.createAnswer();
        })
        .then(a => {
            console.log('Setting local answer for %s.', peerUsername);
            return peer.setLocalDescription(a);
        })
        .then(() => {
            console.log('Answer created for %s.', peerUsername);
            console.log('localDescription: ', peer.localDescription);
            console.log('remoteDescription: ', peer.remoteDescription);

        })
        .catch(error => {
            console.log('Error creating answer for %s.', peerUsername);
            console.log(error);
        });

    return peer
}

function dcOnMessage(event) {
    var message = event.data;

    var li = document.createElement("li");
    li.appendChild(document.createTextNode(message));
    ul.appendChild(li);
}

// get all stored data channels
function getDataChannels() {
    var dataChannels = [];

    for (peerUsername in mapPeers) {
        console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);
        var dataChannel = mapPeers[peerUsername][1];
        console.log('dataChannel: ', dataChannel);

        dataChannels.push(dataChannel);
    }

    return dataChannels;
}

// get all stored RTCPeerConnections
// peerStorageObj is an object (either mapPeers or mapScreenPeers)
function getPeers(peerStorageObj) {
    var peers = [];

    for (peerUsername in peerStorageObj) {
        var peer = peerStorageObj[peerUsername][0];
        console.log('peer: ', peer);

        peers.push(peer);
    }

    return peers;
}

// for every new peer
// create video elements based on the username
// assign ids corresponding to the username of the remote peer
function createVideo(peerUsername) {
    var videoContainer = document.querySelector('#remote_users_video');
    // let isSameName = document.getElementById(`${peerUsername}-video`);
    // let isSameName1 = document.getElementById(`${peerUsername}-video1`);
    // let isSameName2 = document.getElementById(`${peerUsername}-video2`);

    // if (isSameName || isSameName1 || isSameName2) {
    //     isSameName.parentElement.remove();
    // }


    if (peerUsername === "robot") {
        var remoteVideo1 = document.createElement('video');
        remoteVideo1.id = `${peerUsername}-video1`;
        remoteVideo1.autoplay = true;
        remoteVideo1.playsinline = true;

        var remoteVideo2 = document.createElement('video');
        remoteVideo2.id = `${peerUsername}-video2`;
        remoteVideo2.autoplay = true;
        remoteVideo2.playsinline = true;

        const pTag = document.createElement("p");
        const pTag2 = document.createElement("p");
        pTag.textContent = peerUsername + ' main';
        pTag2.textContent = peerUsername + ' rear view';

        // wrapper for the first video element
        var videoWrapper1 = document.createElement('div');
        videoWrapper1.classList.add("remote-user");
        videoWrapper1.appendChild(pTag);
        videoWrapper1.appendChild(remoteVideo1);

        // wrapper for the second video element
        var videoWrapper2 = document.createElement('div');
        videoWrapper2.classList.add("remote-user");
        videoWrapper2.appendChild(pTag2);
        videoWrapper2.appendChild(remoteVideo2);

        // add the wrappers to the video container
        videoContainer.appendChild(videoWrapper1);
        videoContainer.appendChild(videoWrapper2);

        return { video1: remoteVideo1, video2: remoteVideo2 };
    } else {
        // For other peers (non-"robot" peers)
        var remoteVideo = document.createElement('video');
        remoteVideo.id = `${peerUsername}-video`;
        remoteVideo.autoplay = true;
        remoteVideo.playsinline = true;

        const pTag = document.createElement("p");
        pTag.textContent = peerUsername;

        // wrapper for the video element
        var videoWrapper = document.createElement('div');
        videoWrapper.classList.add("remote-user");
        videoWrapper.appendChild(pTag);
        videoWrapper.appendChild(remoteVideo);

        // add the wrapper to the video container
        videoContainer.appendChild(videoWrapper);

        return remoteVideo;
    }
}



// set onTrack for RTCPeerConnection
// to add remote tracks to remote stream
// to show video through corresponding remote video element
function setOnTrack(peer, remoteVideo) {
    console.log('Setting ontrack:');
    // create new MediaStream for remote tracks
    var remoteStream = new MediaStream();

    // assign remoteStream as the source for remoteVideo
    remoteVideo.srcObject = remoteStream;

    console.log('remoteVideo: ', remoteVideo.id);

    peer.addEventListener('track', async (event) => {
        console.log('Adding remote track: ', event.track);
        remoteStream.addTrack(event.track, remoteStream);
    });
}

// set onTrack for RTCPeerConnection
// to add remote tracks to remote streams
// to show video through corresponding remote video elements
function setOnTrack2(peer, remoteVideo1, remoteVideo2) {
    console.log('Setting ontrack:');


    peer.onaddstream = (event) => {
        console.log("set on track", event);
        if (event.stream) {
            if (remoteVideo1.srcObject === null) {
                remoteVideo1.srcObject = event.stream;
                console.log("Set on Track Remote Video 2: ", event.stream.id);
            }
            if (event.stream.id != remoteVideo1.srcObject.id) {
                remoteVideo2.srcObject = event.stream;
                console.log("Set on Track Remote Video 1: ", event.stream.id);
            }

        }
    }

}

// called to add appropriate tracks
// to peer
function addLocalTracks(peer, localScreenSharing) {
    if (!localScreenSharing) {
        // if it is not a screen sharing peer
        // add user media tracks
        localStream.getTracks().forEach(track => {
            console.log('Adding localStream track: ', track);
            peer.addTrack(track, localStream);
        });

        localStream2.getTracks().forEach(track => {
            console.log('Adding 2nd localStream track: ', track);
            peer.addTrack(track, localStream2);
        });

        // Print info after adding tracks
        console.log('LocalDisplayStream tracks added to peer:', peer.getSenders().map(sender => sender.track));

        return;
    }

    // if it is a screen sharing peer
    // add display media tracks
    localDisplayStream.getTracks().forEach(track => {
        console.log('Adding localDisplayStream track: ', track);
        peer.addTrack(track, localDisplayStream);
    });
}

function removeVideo(video) {
    // get the video wrapper
    var videoWrapper = video.parentNode;
    // remove it
    if (videoWrapper) videoWrapper.parentNode.removeChild(videoWrapper);
}

showingController()

function showingController() {
    const controller = document.getElementById("controller");
    const robotVideo = document.getElementById("robot-video");
    const robotVideo1 = document.getElementById("robot-video1");
    const robotVideo2 = document.getElementById("robot-video2");

    // console.log("controller",controller);
    if (robotVideo || robotVideo1 || robotVideo2) {
        controller.style.display = "flex"

    } else {
        // if(controller) controller.style.display = "none"
        // controller.style.display = "none"
    }
}
const targetNode = document.getElementById('remote_users_video');

const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // New node(s) added or removed
            const addedNodes = Array.from(mutation.addedNodes);
            const removedNodes = Array.from(mutation.removedNodes);

            // Check if a div was added or removed
            if (addedNodes.some(node => node.nodeName === 'DIV')) {
                console.log('A div was appended');
                //   showingController()
            }

            if (removedNodes.some(node => node.nodeName === 'DIV')) {
                console.log('A div was removed');
                showingController()
            }
        }
    }
});
//   console.log(observer);

// Configuration of the observer:
const config = { childList: true };

// Start observing the target node
observer.observe(targetNode, config);