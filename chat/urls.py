from django.urls import path
from . import views


urlpatterns = [
    path("login/" , views.login_user, name="login"),
    path('', views.peer, name='peer'),
    path('logout/', views.logout_user, name="logout")
    # path('peer1/', peer1, name='peer1'),
    # path('peer2/', peer2, name='peer2'),
]