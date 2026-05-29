from django.db import models
from django.contrib.auth.models import User

LAUNDRY_TYPES = [
    ('normal', 'Normal Wash'),
    ('premium', 'Premium Wash'),
    ('dryclean', 'Dry Clean'),
]

ORDER_STATUSES = [
    ('confirmed', 'Booking Confirmed'),
    ('pickup_assigned', 'Pickup Assigned'),
    ('picked_up', 'Clothes Picked Up'),
    ('washing', 'Washing Started'),
    ('drying', 'Drying Process'),
    ('ready', 'Ready for Delivery'),
    ('delivered', 'Delivered'),
]

PAYMENT_STATUSES = [
    ('pending', 'Pending'),
    ('completed', 'Completed'),
    ('failed', 'Failed'),
]

NOTIFICATION_TYPES = [
    ('booking', 'Booking Notification'),
    ('payment', 'Payment Notification'),
    ('delivery', 'Delivery Notification'),
    ('alert', 'Alert'),
]


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} Profile"


class LaundryBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    booking_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=150)
    hostel_apartment = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20)
    laundry_type = models.CharField(max_length=20, choices=LAUNDRY_TYPES)
    clothes_count = models.PositiveIntegerField(default=1)
    pickup_date = models.DateField()
    pickup_time = models.TimeField()
    delivery_preference = models.CharField(max_length=100, blank=True)
    special_instructions = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    gst = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, choices=ORDER_STATUSES, default='confirmed')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking {self.booking_id} - {self.user.username}"

    class Meta:
        ordering = ['-created_at']


class Payment(models.Model):
    booking = models.OneToOneField(LaundryBooking, on_delete=models.CASCADE, related_name='payment')
    payment_id = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUSES, default='pending')
    payment_method = models.CharField(max_length=50, default='online')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payment {self.payment_id} - {self.status}"


class OrderTracking(models.Model):
    booking = models.ForeignKey(LaundryBooking, on_delete=models.CASCADE, related_name='tracking_history')
    status = models.CharField(max_length=30, choices=ORDER_STATUSES)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Tracking {self.booking.booking_id} - {self.status}"

    class Meta:
        ordering = ['-timestamp']


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    booking = models.ForeignKey(LaundryBooking, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=150)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username} - {self.title}"

    class Meta:
        ordering = ['-created_at']


class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    is_active = models.BooleanField(default=True)
    department = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Admin - {self.user.username}"
