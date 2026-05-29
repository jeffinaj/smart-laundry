from django.db import models
from laundry_api.users.models import CustomUser
from laundry_api.bookings.models import LaundryBooking


class Notification(models.Model):
    """Notification model"""
    TYPE_CHOICES = [
        ('booking_confirmed', 'Booking Confirmed'),
        ('pickup_assigned', 'Pickup Assigned'),
        ('pickup_completed', 'Pickup Completed'),
        ('washing_started', 'Washing Started'),
        ('washing_completed', 'Washing Completed'),
        ('ready_delivery', 'Ready for Delivery'),
        ('delivery_completed', 'Delivery Completed'),
        ('payment_confirmed', 'Payment Confirmed'),
        ('payment_failed', 'Payment Failed'),
        ('system_message', 'System Message'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    booking = models.ForeignKey(LaundryBooking, on_delete=models.CASCADE, null=True, blank=True)
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    icon = models.CharField(max_length=50, blank=True)
    action_url = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
