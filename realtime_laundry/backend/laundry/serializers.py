from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, LaundryBooking, Payment, OrderTracking, Notification, AdminProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ('user', 'phone_number', 'address', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'title', 'message', 'is_read', 'created_at', 'booking')


class OrderTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderTracking
        fields = ('status', 'timestamp', 'notes')


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('payment_id', 'amount', 'status', 'payment_method', 'created_at', 'paid_at')


class LaundryBookingSerializer(serializers.ModelSerializer):
    payment = PaymentSerializer(read_only=True)
    tracking_history = OrderTrackingSerializer(many=True, read_only=True)
    notifications = NotificationSerializer(many=True, read_only=True)

    class Meta:
        model = LaundryBooking
        fields = (
            'id', 'booking_id', 'full_name', 'hostel_apartment', 'phone_number',
            'laundry_type', 'clothes_count', 'pickup_date', 'pickup_time',
            'delivery_preference', 'special_instructions', 'subtotal', 'gst',
            'total_amount', 'status', 'created_at', 'updated_at',
            'payment', 'tracking_history', 'notifications'
        )


class LaundryBookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaundryBooking
        fields = (
            'full_name', 'hostel_apartment', 'phone_number', 'laundry_type',
            'clothes_count', 'pickup_date', 'pickup_time', 'delivery_preference',
            'special_instructions', 'subtotal', 'gst', 'total_amount'
        )


class AdminProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AdminProfile
        fields = ('user', 'is_active', 'department', 'created_at')
