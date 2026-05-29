from django.db import models
from laundry_api.bookings.models import LaundryBooking
from laundry_api.users.models import CustomUser
import uuid


class Payment(models.Model):
    """Payment model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('upi', 'UPI'),
        ('netbanking', 'Net Banking'),
        ('wallet', 'Wallet'),
    ]
    
    payment_id = models.CharField(max_length=50, unique=True, db_index=True)
    booking = models.OneToOneField(LaundryBooking, on_delete=models.CASCADE, 
                                   related_name='payment')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='payments')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    transaction_id = models.CharField(max_length=100, blank=True)
    receipt_url = models.URLField(blank=True)
    
    payment_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_id']),
        ]
    
    def __str__(self):
        return f"Payment {self.payment_id} - {self.booking.booking_id}"
    
    def save(self, *args, **kwargs):
        if not self.payment_id:
            self.payment_id = f"PAY{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)


class PaymentHistory(models.Model):
    """Payment history/logs"""
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=20)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payment_history'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.payment.payment_id} - {self.status}"
