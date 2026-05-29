import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from asgiref.sync import sync_to_async


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        
        if self.user == AnonymousUser():
            await self.close()
            return
        
        self.room_group_name = f'user_{self.user.id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        if self.user != AnonymousUser():
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def notify_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event['message'],
            'booking_id': event.get('booking_id'),
        }))

    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'booking_id': event['booking_id'],
            'status': event['status'],
            'message': event['message'],
        }))

    async def dashboard_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': event['data'],
        }))
