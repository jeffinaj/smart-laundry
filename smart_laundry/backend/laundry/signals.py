from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LaundryBooking, Payment, Notification, OrderTracking


@receiver(post_save, sender=LaundryBooking)
def create_related_records(sender, instance, created, **kwargs):
    if created:
        Payment.objects.create(
            booking=instance,
            amount=instance.total_amount,
            status='pending',
        )
        OrderTracking.objects.create(booking=instance, status='confirmed')
        Notification.objects.create(
            user=instance.user,
            message='Your booking has been confirmed.',
        )
