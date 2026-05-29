from django.contrib import admin
from .models import LaundryBooking, Payment, Notification, OrderTracking


@admin.register(LaundryBooking)
class LaundryBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'room_number', 'wash_type', 'clothes_count', 'total_amount', 'status', 'created_at')
    list_filter = ('wash_type', 'status')
    search_fields = ('name', 'room_number', 'phone_number')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'amount', 'status', 'paid_at', 'created_at')
    list_filter = ('status',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'message', 'is_read', 'created_at')
    list_filter = ('is_read',)


@admin.register(OrderTracking)
class OrderTrackingAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'status', 'updated_at')
    list_filter = ('status',)
