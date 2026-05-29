from django.db import models
from django.utils import timezone
from laundry_api.users.models import CustomUser
import uuid


class LaundryType(models.Model):
    """Laundry type options"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    price_per_item = models.DecimalField(max_digits=5, decimal_places=2)
    icon = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'laundry_types'
    
    def __str__(self):
        return self.name


class DeliveryPreference(models.Model):
    """Delivery preference options"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    extra_charge = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    estimated_days = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'delivery_preferences'
    
    def __str__(self):
        return self.name


class LaundryBooking(models.Model):
    """Laundry booking model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Booking Confirmed'),
        ('pickup_assigned', 'Pickup Assigned'),
        ('picked_up', 'Clothes Picked Up'),
        ('washing', 'Washing Started'),
        ('drying', 'Drying Process'),
        ('ready', 'Ready for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    booking_id = models.CharField(max_length=20, unique=True, db_index=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bookings')
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15)
    hostel_apartment = models.CharField(max_length=255)
    
    laundry_type = models.ForeignKey(LaundryType, on_delete=models.SET_NULL, null=True)
    num_clothes = models.IntegerField()
    delivery_preference = models.ForeignKey(DeliveryPreference, on_delete=models.SET_NULL, null=True)
    special_instructions = models.TextField(blank=True)
    
    pickup_date = models.DateTimeField()
    estimated_delivery = models.DateTimeField()
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    gst = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    current_stage = models.IntegerField(default=0)  # 0-7 for tracking progress
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'laundry_bookings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['booking_id']),
        ]
    
    def __str__(self):
        return f"Booking {self.booking_id} - {self.user.username}"
    
    def save(self, *args, **kwargs):
        if not self.booking_id:
            # Generate unique booking ID
            self.booking_id = f"BK{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)


class OrderTracking(models.Model):
    """Order tracking timeline"""
    STAGE_CHOICES = [
        ('confirmed', 'Booking Confirmed'),
        ('pickup_assigned', 'Pickup Assigned'),
        ('picked_up', 'Clothes Picked Up'),
        ('washing', 'Washing Started'),
        ('drying', 'Drying Process'),
        ('ready', 'Ready for Delivery'),
        ('delivered', 'Delivered'),
    ]
    
    booking = models.OneToOneField(LaundryBooking, on_delete=models.CASCADE, 
                                   related_name='tracking')
    
    # Stage tracking
    confirmed_at = models.DateTimeField(null=True, blank=True)
    pickup_assigned_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    washing_started_at = models.DateTimeField(null=True, blank=True)
    drying_started_at = models.DateTimeField(null=True, blank=True)
    ready_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # Staff assignment
    pickup_staff = models.CharField(max_length=255, blank=True)
    delivery_staff = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'order_tracking'
    
    def __str__(self):
        return f"Tracking {self.booking.booking_id}"


class BookingNote(models.Model):
    """Notes and updates for bookings"""
    booking = models.ForeignKey(LaundryBooking, on_delete=models.CASCADE, 
                               related_name='notes')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'booking_notes'
        ordering = ['-created_at']
