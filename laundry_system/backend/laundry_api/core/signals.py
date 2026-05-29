from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from laundry_api.bookings.models import LaundryBooking, OrderTracking
from laundry_api.payments.models import Payment
from laundry_api.notifications.models import Notification


channel_layer = get_channel_layer()


@receiver(post_save, sender=LaundryBooking)
def booking_status_changed(sender, instance, created, **kwargs):
    """Signal handler when booking status changes"""
    
    # Send WebSocket update
    async_to_sync(channel_layer.group_send)(
        f'user_{instance.user_id}',
        {
            'type': 'booking_update',
            'booking_id': instance.booking_id,
            'status': instance.status,
            'message': f'Your booking {instance.booking_id} status updated to {instance.get_status_display()}'
        }
    )
    
    # Create notification
    if not created:
        notification_type_map = {
            'confirmed': 'booking_confirmed',
            'pickup_assigned': 'pickup_assigned',
            'picked_up': 'pickup_completed',
            'washing': 'washing_started',
            'drying': 'washing_completed',
            'ready': 'ready_delivery',
            'delivered': 'delivery_completed',
        }
        
        notification_type = notification_type_map.get(instance.status, 'system_message')
        
        Notification.objects.create(
            user=instance.user,
            booking=instance,
            title=f'Order {instance.booking_id} Status Update',
            message=f'Your laundry order has been {instance.get_status_display()}',
            type=notification_type,
            icon='📦' if instance.status == 'ready' else '✅',
            action_url=f'/tracking/{instance.id}'
        )
        
        # Send notification via WebSocket
        async_to_sync(channel_layer.group_send)(
            f'notifications_{instance.user_id}',
            {
                'type': 'send_notification',
                'title': f'Order {instance.booking_id} Updated',
                'message': f'Status: {instance.get_status_display()}',
                'notification_type': notification_type,
                'icon': '📦',
            }
        )


@receiver(post_save, sender=OrderTracking)
def tracking_updated(sender, instance, **kwargs):
    """Signal handler when order tracking is updated"""
    
    # Calculate progress percentage
    stages_completed = 0
    for field in ['confirmed_at', 'pickup_assigned_at', 'picked_up_at',
                  'washing_started_at', 'drying_started_at', 'ready_at', 'delivered_at']:
        if getattr(instance, field):
            stages_completed += 1
    
    progress_percentage = int((stages_completed / 7) * 100)
    
    # Get current stage
    stage_map = {
        'confirmed': instance.confirmed_at,
        'pickup_assigned': instance.pickup_assigned_at,
        'picked_up': instance.picked_up_at,
        'washing': instance.washing_started_at,
        'drying': instance.drying_started_at,
        'ready': instance.ready_at,
        'delivered': instance.delivered_at,
    }
    
    current_stage = None
    for stage, timestamp in reversed(list(stage_map.items())):
        if timestamp:
            current_stage = stage
            break
    
    # Send WebSocket update
    async_to_sync(channel_layer.group_send)(
        f'order_{instance.booking_id}',
        {
            'type': 'tracking_update',
            'stage': current_stage or 'pending',
            'timestamp': str(stage_map.get(current_stage) or ''),
            'status': instance.booking.status,
            'progress_percentage': progress_percentage,
        }
    )


@receiver(post_save, sender=Payment)
def payment_status_changed(sender, instance, created, **kwargs):
    """Signal handler when payment status changes"""
    
    if instance.status == 'completed':
        # Send WebSocket update
        async_to_sync(channel_layer.group_send)(
            f'user_{instance.user_id}',
            {
                'type': 'payment_update',
                'payment_id': instance.payment_id,
                'status': 'completed',
                'message': f'Payment of ₹{instance.total_amount} completed successfully'
            }
        )
        
        # Create notification
        Notification.objects.create(
            user=instance.user,
            booking=instance.booking,
            title='Payment Successful',
            message=f'Payment of ₹{instance.total_amount} has been received',
            type='payment_confirmed',
            icon='💳',
            action_url=f'/payments/{instance.id}'
        )
        
        # Update user statistics
        instance.user.save()
