
from django.urls import re_path
from . import consumers
from django.urls import  path
websocket_urlpatterns = [
    re_path(r'', consumers.ChatConsumer.as_asgi()),
    re_path(r'^peer[12]/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'chat/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi()),
    path('wss://robotics-webrtc-django.onrender.com/', consumers.ChatConsumer.as_asgi()),
    
]