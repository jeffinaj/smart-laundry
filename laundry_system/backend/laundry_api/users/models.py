from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class CustomUser(AbstractUser):
    """Extended User model with additional fields"""
    phone_number = models.CharField(max_length=15, blank=True)
    hostel_apartment = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    total_bookings = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name_plural = 'users'
    
    def __str__(self):
        return f"{self.username} - {self.email}"


class AdminUser(models.Model):
    """Admin user model for staff management"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=[
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('manager', 'Manager'),
    ])
    permissions = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_users'
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"
