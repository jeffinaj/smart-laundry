import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from laundry_api.bookings.models import LaundryBooking
from laundry_api.notifications.models import Notification


class DashboardConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time dashboard updates"""
    
    async def connect(self):
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser) or user.is_anonymous:
            await self.close()
            return

        self.user_id = user.id
        self.user_group_name = f'user_{self.user_id}'
        
        # Join the user's group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"User {self.user_id} connected to dashboard")
    
    async def disconnect(self, close_code):
        # Leave the user's group
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )
        print(f"User {self.user_id} disconnected from dashboard")
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            if action == 'get_stats':
                stats = await self.get_user_stats()
                await self.send(text_data=json.dumps({
                    'type': 'stats_update',
                    'data': stats
                }))
            
            elif action == 'get_notifications':
                notifications = await self.get_unread_notifications()
                await self.send(text_data=json.dumps({
                    'type': 'notifications_update',
                    'data': notifications
                }))
        
        except Exception as e:
            print(f"Error receiving message: {e}")
    
    async def stats_update(self, event):
        """Handle stats update message"""
        await self.send(text_data=json.dumps({
            'type': 'stats_update',
            'data': event['data']
        }))
    
    async def notification_update(self, event):
        """Handle notification update message"""
        await self.send(text_data=json.dumps({
            'type': 'notification_update',
            'data': event['notification']
        }))
    
    async def booking_update(self, event):
        """Handle booking status update message"""
        await self.send(text_data=json.dumps({
            'type': 'booking_update',
            'booking_id': event['booking_id'],
            'status': event['status'],
            'message': event['message']
        }))
    
    async def payment_update(self, event):
        """Handle payment update message"""
        await self.send(text_data=json.dumps({
            'type': 'payment_update',
            'payment_id': event['payment_id'],
            'status': event['status'],
            'message': event['message']
        }))
    
    @database_sync_to_async
    def get_user_stats(self):
        """Get user dashboard statistics"""
        from django.db.models import Sum, Count
        
        bookings = LaundryBooking.objects.filter(user_id=self.user_id)
        
        return {
            'total_bookings': bookings.count(),
            'active_orders': bookings.filter(status__in=[
                'confirmed', 'pickup_assigned', 'picked_up', 'washing', 'drying', 'ready'
            ]).count(),
            'completed': bookings.filter(status='delivered').count(),
            'total_spent': float(bookings.aggregate(Sum('total_amount'))['total_amount__sum'] or 0),
        }
    
    @database_sync_to_async
    def get_unread_notifications(self):
        """Get unread notifications"""
        notifications = Notification.objects.filter(
            user_id=self.user_id,
            is_read=False
        ).values('id', 'title', 'message', 'type', 'created_at')[:10]
        
        return list(notifications)


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications"""
    
    async def connect(self):
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser) or user.is_anonymous:
            await self.close()
            return

        self.user_id = user.id
        self.user_group_name = f'notifications_{self.user_id}'
        
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )
    
    async def send_notification(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'title': event['title'],
            'message': event['message'],
            'notification_type': event['notification_type'],
            'icon': event.get('icon', ''),
        }))


class OrderTrackingConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for order tracking updates"""
    
    async def connect(self):
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser) or user.is_anonymous:
            await self.close()
            return

        self.booking_id = self.scope['url_route']['kwargs'].get('booking_id')
        self.user_id = user.id
        self.group_name = f'order_{self.booking_id}'
        
        # Verify user has access to this booking
        has_access = await self.verify_booking_access()
        if not has_access:
            await self.close()
            return
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def tracking_update(self, event):
        """Send tracking update"""
        await self.send(text_data=json.dumps({
            'type': 'tracking_update',
            'stage': event['stage'],
            'timestamp': event['timestamp'],
            'status': event['status'],
            'progress_percentage': event['progress_percentage'],
        }))
    
    @database_sync_to_async
    def verify_booking_access(self):
        """Verify user has access to this booking"""
        try:
            LaundryBooking.objects.get(id=self.booking_id, user_id=self.user_id)
            return True
        except LaundryBooking.DoesNotExist:
            return False
