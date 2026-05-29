from django.contrib import admin
from .models import UserProfile, LaundryBooking, Payment, OrderTracking, Notification, AdminProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'created_at')
    search_fields = ('user__username', 'phone_number')


@admin.register(LaundryBooking)
class LaundryBookingAdmin(admin.ModelAdmin):
    list_display = ('booking_id', 'user', 'full_name', 'laundry_type', 'clothes_count', 'total_amount', 'status', 'created_at')
    list_filter = ('laundry_type', 'status', 'created_at')
    search_fields = ('booking_id', 'full_name', 'user__username')
    readonly_fields = ('booking_id', 'created_at', 'updated_at')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_id', 'booking', 'amount', 'status', 'created_at', 'paid_at')
    list_filter = ('status', 'created_at')
    search_fields = ('payment_id', 'booking__booking_id')
    readonly_fields = ('payment_id', 'created_at', 'updated_at')


@admin.register(OrderTracking)
class OrderTrackingAdmin(admin.ModelAdmin):
    list_display = ('booking', 'status', 'timestamp', 'notes')
    list_filter = ('status', 'timestamp')
    search_fields = ('booking__booking_id', 'notes')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'user__username')
    readonly_fields = ('created_at',)


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__username', 'department')
