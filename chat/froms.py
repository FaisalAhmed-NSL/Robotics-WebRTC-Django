from django import forms
# from django.contrib.auth.forms import U
from django.contrib.auth.models import User
from .models import UserInfo


class LoginForm(forms.ModelForm):
    # password = forms.CharField(widget=forms.TextInput())
    class Meta:
        model = User
        fields = ['email', "password"] 