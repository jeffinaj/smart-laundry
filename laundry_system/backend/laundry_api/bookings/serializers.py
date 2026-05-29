from rest_framework import serializers
from laundry_api.bookings.models import (
    LaundryBooking, OrderTracking, LaundryType, DeliveryPreference, BookingNote
)


class LaundryTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaundryType
        fields = ['id', 'name', 'description', 'price_per_item', 'icon', 'is_active']


class DeliveryPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPreference
        fields = ['id', 'name', 'description', 'extra_charge', 'estimated_days', 'is_active']


class OrderTrackingSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderTracking
        fields = ['id', 'confirmed_at', 'pickup_assigned_at', 'picked_up_at', 
                  'washing_started_at', 'drying_started_at', 'ready_at', 
                  'delivered_at', 'pickup_staff', 'delivery_staff', 
                  'progress_percentage', 'created_at', 'updated_at']
    
    def get_progress_percentage(self, obj):
        """Calculate progress percentage based on completed stages"""
        stages_completed = 0
        if obj.confirmed_at:
            stages_completed += 1
        if obj.pickup_assigned_at:
            stages_completed += 1
        if obj.picked_up_at:
            stages_completed += 1
        if obj.washing_started_at:
            stages_completed += 1
        if obj.drying_started_at:
            stages_completed += 1
        if obj.ready_at:
            stages_completed += 1
        if obj.delivered_at:
            stages_completed += 1
        
        return int((stages_completed / 7) * 100)


class BookingNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingNote
        fields = ['id', 'title', 'content', 'created_at']
        read_only_fields = ['created_at']


class LaundryBookingSerializer(serializers.ModelSerializer):
    laundry_type_details = LaundryTypeSerializer(source='laundry_type', read_only=True)
    delivery_preference_details = DeliveryPreferenceSerializer(source='delivery_preference', read_only=True)
    tracking = OrderTrackingSerializer(read_only=True)
    notes = BookingNoteSerializer(read_only=True, many=True)
    
    class Meta:
        model = LaundryBooking
        fields = ['id', 'booking_id', 'user', 'full_name', 'phone_number', 
                  'hostel_apartment', 'laundry_type', 'laundry_type_details',
                  'num_clothes', 'delivery_preference', 'delivery_preference_details',
                  'special_instructions', 'pickup_date', 'estimated_delivery',
                  'subtotal', 'gst', 'total_amount', 'status', 'current_stage',
                  'tracking', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'booking_id', 'user', 'subtotal', 'gst', 
                           'total_amount', 'created_at', 'updated_at']


class LaundryBookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaundryBooking
        fields = ['full_name', 'phone_number', 'hostel_apartment', 'laundry_type',
                  'num_clothes', 'delivery_preference', 'special_instructions',
                  'pickup_date']
    
    def create(self, validated_data):
        booking = LaundryBooking.objects.create(**validated_data)
        # Create related tracking record
        OrderTracking.objects.create(booking=booking)
        return booking


class LaundryBookingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaundryBooking
        fields = ['status', 'current_stage']
