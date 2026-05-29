from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from datetime import timedelta
from laundry_api.bookings.models import (
    LaundryBooking, OrderTracking, LaundryType, DeliveryPreference, BookingNote
)
from laundry_api.bookings.serializers import (
    LaundryBookingSerializer, LaundryBookingCreateSerializer,
    LaundryTypeSerializer, DeliveryPreferenceSerializer, BookingNoteSerializer,
    OrderTrackingSerializer
)


class LaundryTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LaundryType.objects.filter(is_active=True)
    serializer_class = LaundryTypeSerializer
    permission_classes = [IsAuthenticated]


class DeliveryPreferenceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DeliveryPreference.objects.filter(is_active=True)
    serializer_class = DeliveryPreferenceSerializer
    permission_classes = [IsAuthenticated]


class LaundryBookingViewSet(viewsets.ModelViewSet):
    serializer_class = LaundryBookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return LaundryBooking.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = LaundryBookingCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Calculate pricing
            laundry_type = LaundryType.objects.get(id=request.data.get('laundry_type'))
            delivery_pref = DeliveryPreference.objects.get(id=request.data.get('delivery_preference'))
            num_clothes = int(request.data.get('num_clothes', 0))
            
            subtotal = laundry_type.price_per_item * num_clothes
            subtotal += delivery_pref.extra_charge
            gst = subtotal * 0.18
            total_amount = subtotal + gst
            
            booking = serializer.save(
                user=request.user,
                subtotal=subtotal,
                gst=gst,
                total_amount=total_amount,
                estimated_delivery=timezone.now() + timedelta(days=delivery_pref.estimated_days),
                status='confirmed'
            )
            
            # Update user statistics
            request.user.total_bookings += 1
            request.user.total_spent += total_amount
            request.user.save()
            
            return Response(
                LaundryBookingSerializer(booking).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status in ['pending', 'confirmed']:
            booking.status = 'cancelled'
            booking.save()
            return Response({'message': 'Booking cancelled successfully'})
        return Response({'error': 'Cannot cancel booking at this stage'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def active_orders(self, request):
        active_statuses = ['confirmed', 'pickup_assigned', 'picked_up', 'washing', 'drying', 'ready']
        bookings = self.get_queryset().filter(status__in=active_statuses)
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        user = request.user
        bookings = self.get_queryset()
        
        stats = {
            'total_bookings': bookings.count(),
            'active_orders': bookings.filter(status__in=[
                'confirmed', 'pickup_assigned', 'picked_up', 'washing', 'drying', 'ready'
            ]).count(),
            'completed': bookings.filter(status='delivered').count(),
            'cancelled': bookings.filter(status='cancelled').count(),
            'total_spent': float(user.total_spent),
        }
        return Response(stats)


class OrderTrackingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderTrackingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return OrderTracking.objects.filter(booking__user=self.request.user)


class BookingNoteViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request, booking_id=None):
        if not booking_id:
            return Response({'error': 'Booking ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        notes = BookingNote.objects.filter(booking_id=booking_id, booking__user=request.user)
        serializer = BookingNoteSerializer(notes, many=True)
        return Response(serializer.data)


class AdminBookingViewSet(viewsets.ModelViewSet):
    """Admin endpoints for managing bookings"""
    serializer_class = LaundryBookingSerializer
    permission_classes = [IsAdminUser]
    queryset = LaundryBooking.objects.all()

    @action(detail=True, methods=['post'])
    def assign_pickup(self, request, pk=None):
        booking = self.get_object()
        staff = request.data.get('staff', '')
        booking.status = 'pickup_assigned'
        booking.save()

        tracking = getattr(booking, 'tracking', None)
        if tracking:
            tracking.pickup_assigned_at = timezone.now()
            tracking.pickup_staff = staff
            tracking.save()

        return Response(LaundryBookingSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        booking = self.get_object()
        status_val = request.data.get('status')
        valid_statuses = [s[0] for s in LaundryBooking.STATUS_CHOICES]
        if status_val not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = status_val
        booking.save()
        return Response(LaundryBookingSerializer(booking).data)
    
    def create(self, request, booking_id=None):
        if not booking_id:
            return Response({'error': 'Booking ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            booking = LaundryBooking.objects.get(id=booking_id, user=request.user)
        except LaundryBooking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = BookingNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(booking=booking)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
