
# from django-channels-webrtc-main.mysite.chat.CAR.car import direction

from django.http import HttpResponse, HttpResponseRedirect,JsonResponse
from django.views.decorators.csrf import csrf_exempt

from django.shortcuts import render, redirect
from .utils import get_turn_info
from .mqtt import mqtt_publish
from .froms import LoginForm
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login,authenticate, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.urls import reverse
from .models import UserInfo
# Create your views here.


def peer1(request):
    # get numb turn info
    context = get_turn_info()
    return render(request, 'chat/peer1.html', context=context)

def peer2(request):
    # get numb turn info
    context = get_turn_info()
    return render(request, 'chat/peer2.html', context=context)

def login_user(request):
    form = AuthenticationForm()
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
           
            if user is not None:
                login(request, user)
                return HttpResponseRedirect(reverse("peer"))
    
    return render(request, "login.html", context={'form': form})

@login_required
def peer(request):
    # get numb turn info
    print("peer function calll")
    context = get_turn_info()
    print('context: ', context)
    userinfo = UserInfo.objects.get(user=request.user)
    # print("user info",userinfo.role)
    if userinfo.role == "robot":
        return render(request, 'robotView.html', context={"hello":context, "role": userinfo.role})

    elif request.method == "POST":
        
        _operation_name = request.POST.get('control')
        print(_operation_name)
        mqtt_publish.main(_operation_name)
    return render(request, 'peernew.html', context={"hello":context, "role": userinfo.role})


def logout_user(req):
    logout(req)
    return HttpResponseRedirect(reverse("login"))


############## Serial#############  
'''

import serial
import time

def initConnection(portNo, baudRate):
    try:
        ser = serial.Serial(portNo, baudRate)
        print("Device Connected")
        return ser
    except:
        print("Not Conected")
        
def sendData(se, data, digits):
    myString = "$"
    for d in data:
        myString += str(d).zfill(digits)
        #print(myString)
    try:
        se.write(myString.encode())
        print(myString)
    except:
        print("Data transmission failed")


ser = initConnection("/dev/ttyACM0", 9600)


############## Control response#############  


import time
#import arduino

def direction(d):
    print(f"call  {d}")
    if d == "forward": forward()
    elif d == "reverse": reverse()
    elif d == "left": left()
    elif d == "right": right()
    elif d == "up": up()
    elif d == "down": down()
    elif d == "head_left": head_left()
    elif d == "head_right": head_right()
    elif d == "head_reset": head_reset()

    else: stop()
# clss direction:
def forward():
    print('forward')
    print("1")
    sendData(ser, [1], 2)
    #time.sleep(1)  

def reverse():
    print('Reverse')
    print("2")
    sendData(ser, [2], 2)
    #time.sleep(1)
    
def left():
    print('left')
    print("3")
    sendData(ser, [3], 2)
    #time.sleep(1)

def right():
    print('right')
    print("4")
    sendData(ser, [4], 2)
    #time.sleep(1)

def stop():
    print("0")
    sendData(ser, [0], 2)
    #time.sleep(1)

def up():
    print("5")
    sendData(ser, [5], 2)
    #time.sleep(1)

def down():
    print("6")
    sendData(ser, [6], 2)
    #time.sleep(1)

def head_left():
    print("7")
    sendData(ser, [7], 2)
    #time.sleep(1)

def head_right():
    print("8")
    sendData(ser, [8], 2)

def head_reset():
    print("9")
    sendData(ser, [9], 2)
    #time.sleep(1)
    '''