from django.urls import path
from . import views
from django.conf.urls.static import static
from django.conf import settings


urlpatterns = [
    path("login/" , views.login_user, name="login"),
    path('', views.peer, name='peer'),
    path('logout/', views.logout_user, name="logout")
    # path('peer1/', peer1, name='peer1'),
    # path('peer2/', peer2, name='peer2'),

] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)