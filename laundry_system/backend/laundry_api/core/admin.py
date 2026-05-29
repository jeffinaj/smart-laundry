from django.contrib.admin import site, register
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from laundry_api.users.models import CustomUser, AdminUser
from laundry_api.bookings.models import LaundryBooking, LaundryType, DeliveryPreference, OrderTracking
from laundry_api.payments.models import Payment
from laundry_api.notifications.models import Notification


@register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'total_bookings', 'total_spent', 'is_verified')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('username', 'email', 'phone_number')


@register(AdminUser)
class AdminUserAdmin:
    list_display = ('user', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__username',)


@register(LaundryType)
class LaundryTypeAdmin:
    list_display = ('name', 'price_per_item', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)


@register(DeliveryPreference)
class DeliveryPreferenceAdmin:
    list_display = ('name', 'extra_charge', 'estimated_days', 'is_active')
    list_filter = ('is_active',)


@register(LaundryBooking)
class LaundryBookingAdmin:
    list_display = ('booking_id', 'user', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'created_at', 'laundry_type')
    search_fields = ('booking_id', 'user__username', 'full_name')
    readonly_fields = ('booking_id', 'created_at', 'updated_at')


@register(OrderTracking)
class OrderTrackingAdmin:
    list_display = ('booking', 'confirmed_at', 'delivered_at')
    list_filter = ('confirmed_at', 'delivered_at')
    search_fields = ('booking__booking_id',)


@register(Payment)
class PaymentAdmin:
    list_display = ('payment_id', 'user', 'amount', 'status', 'payment_date')
    list_filter = ('status', 'payment_date', 'payment_method')
    search_fields = ('payment_id', 'user__username')
    readonly_fields = ('payment_id', 'created_at', 'updated_at')


@register(Notification)
class NotificationAdmin:
    list_display = ('title', 'user', 'type', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('title', 'user__username')
    readonly_fields = ('created_at',)
