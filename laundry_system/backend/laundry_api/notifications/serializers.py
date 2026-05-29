from rest_framework import serializers
from laundry_api.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'booking', 'title', 'message', 'type', 
                  'is_read', 'read_at', 'icon', 'action_url', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class NotificationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'is_read', 'icon', 'action_url', 'created_at']
        read_only_fields = fields
