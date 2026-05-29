import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Q
from .models import UserProfile, LaundryBooking, Payment, OrderTracking, Notification, AdminProfile
from .serializers import (
    UserSerializer, UserProfileSerializer, LaundryBookingSerializer,
    LaundryBookingCreateSerializer, PaymentSerializer, NotificationSerializer,
    OrderTrackingSerializer, AdminProfileSerializer
)
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user)
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    try:
        user = User.objects.get(username=username)
        if not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_401_UNAUTHORIZED)
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard(request):
    user = request.user
    bookings = LaundryBooking.objects.filter(user=user)
    
    total_bookings = bookings.count()
    active_orders = bookings.exclude(status='delivered').count()
    pending_payments = Payment.objects.filter(booking__user=user, status='pending').count()
    unread_notifications = Notification.objects.filter(user=user, is_read=False).count()
    
    recent_bookings = bookings.order_by('-created_at')[:5]
    recent_notifications = Notification.objects.filter(user=user).order_by('-created_at')[:5]
    
    return Response({
        'username': user.username,
        'total_bookings': total_bookings,
        'active_orders': active_orders,
        'pending_payments': pending_payments,
        'unread_notifications': unread_notifications,
        'recent_bookings': LaundryBookingSerializer(recent_bookings, many=True).data,
        'recent_notifications': NotificationSerializer(recent_notifications, many=True).data,
    })


class LaundryBookingViewSet(viewsets.ModelViewSet):
    serializer_class = LaundryBookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LaundryBooking.objects.filter(user=self.request.user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = LaundryBookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        booking_id = f"BK{uuid.uuid4().hex[:10].upper()}"
        
        booking = LaundryBooking.objects.create(
            user=request.user,
            booking_id=booking_id,
            **serializer.validated_data
        )
        
        Payment.objects.create(
            booking=booking,
            payment_id=f"PAY{uuid.uuid4().hex[:10].upper()}",
            amount=booking.total_amount,
            status='pending'
        )
        
        OrderTracking.objects.create(
            booking=booking,
            status='confirmed',
            notes='Booking confirmed'
        )
        
        notification = Notification.objects.create(
            user=request.user,
            booking=booking,
            notification_type='booking',
            title='Booking Confirmed',
            message=f'Your laundry booking {booking_id} has been confirmed.'
        )
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_{request.user.id}',
            {
                'type': 'notify_update',
                'message': notification.message,
                'booking_id': booking.id,
            }
        )
        
        return Response(LaundryBookingSerializer(booking).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        booking = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(booking.ORDER_STATUSES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = new_status
        booking.save()
        
        OrderTracking.objects.create(
            booking=booking,
            status=new_status,
            notes=request.data.get('notes', '')
        )
        
        notification = Notification.objects.create(
            user=booking.user,
            booking=booking,
            notification_type='alert',
            title=f'Order Status Update',
            message=f'Your order {booking.booking_id} is now {new_status.replace("_", " ")}'
        )
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_{booking.user.id}',
            {
                'type': 'status_update',
                'booking_id': booking.id,
                'status': new_status,
                'message': notification.message,
            }
        )
        
        return Response(LaundryBookingSerializer(booking).data)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(booking__user=self.request.user).order_by('-created_at')


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})
