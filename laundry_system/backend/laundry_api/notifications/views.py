from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from laundry_api.notifications.models import Notification
from laundry_api.notifications.serializers import NotificationSerializer, NotificationListSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['get'])
    def list_unread(self, request):
        """Get all unread notifications"""
        notifications = self.get_queryset().filter(is_read=False)
        serializer = NotificationListSerializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response(NotificationSerializer(notification).data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read"""
        notifications = self.get_queryset().filter(is_read=False)
        count = notifications.update(is_read=True, read_at=timezone.now())
        return Response({'marked_as_read': count})
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get notifications by type"""
        notification_type = request.query_params.get('type')
        if not notification_type:
            return Response({'error': 'Type parameter required'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        notifications = self.get_queryset().filter(type=notification_type)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear_old(self, request):
        """Clear old read notifications (older than 30 days)"""
        from datetime import timedelta
        from django.utils import timezone
        
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted, _ = Notification.objects.filter(
            user=request.user,
            is_read=True,
            created_at__lt=cutoff_date
        ).delete()
        
        return Response({'deleted': deleted})
