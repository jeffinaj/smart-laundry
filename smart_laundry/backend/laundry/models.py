from django.db import models
from django.contrib.auth.models import User

WASH_TYPES = [
    ('normal', 'Normal'),
    ('premium', 'Premium'),
    ('dryclean', 'Dry Clean'),
]

ORDER_STATUSES = [
    ('confirmed', 'Booking Confirmed'),
    ('pickup_assigned', 'Pickup Assigned'),
    ('picked_up', 'Clothes Picked Up'),
    ('washing', 'Washing in Progress'),
    ('ready', 'Ready for Delivery'),
    ('delivered', 'Delivered'),
]

PAYMENT_STATUS = [
    ('pending', 'Pending'),
    ('paid', 'Paid'),
    ('failed', 'Failed'),
]

class LaundryBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    name = models.CharField(max_length=120)
    room_number = models.CharField(max_length=80)
    phone_number = models.CharField(max_length=20)
    clothes_type = models.CharField(max_length=100)
    clothes_count = models.PositiveIntegerField(default=1)
    wash_type = models.CharField(max_length=20, choices=WASH_TYPES)
    pickup_date = models.DateField()
    pickup_time = models.TimeField()
    special_instructions = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=30, choices=ORDER_STATUSES, default='confirmed')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking #{self.id} - {self.name}"


class Payment(models.Model):
    booking = models.OneToOneField(LaundryBooking, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payment #{self.id} - {self.status}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message}"


class OrderTracking(models.Model):
    booking = models.ForeignKey(LaundryBooking, on_delete=models.CASCADE, related_name='trackings')
    status = models.CharField(max_length=30, choices=ORDER_STATUSES, default='confirmed')
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['updated_at']

    def __str__(self):
        return f"Track {self.booking.id} - {self.status}"
