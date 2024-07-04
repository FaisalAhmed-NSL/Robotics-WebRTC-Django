import paho.mqtt.publish as publish
import json
# import time

#broker address
broker_address = "172.16.16.54"
#Topic
DATA_SEND = "home/arduino"


def main(direction):
    payload = {'direction': direction}
    publish.single(DATA_SEND, json.dumps(payload), hostname=broker_address)
    #time.sleep(5)
