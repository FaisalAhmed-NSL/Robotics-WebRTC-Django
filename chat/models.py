from django.db import models
from django.contrib.auth.models import User

class UserInfo(models.Model):
    ROLE_CHOICES = [
        ("robot", "Robot"),
        ("user", "User"),
        ("admin", "Admin")
        
    ]
    user = models.OneToOneField(User,on_delete=models.CASCADE, primary_key=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES ,blank=False)

    def __str__(self) -> str:
        return self.user.username



