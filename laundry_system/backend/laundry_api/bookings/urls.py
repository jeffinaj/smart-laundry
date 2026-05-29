from django.urls import path, include
from rest_framework.routers import DefaultRouter
from laundry_api.bookings import views

router = DefaultRouter()
router.register(r'laundry-types', views.LaundryTypeViewSet, basename='laundry-type')
router.register(r'delivery-preferences', views.DeliveryPreferenceViewSet, basename='delivery-preference')
router.register(r'bookings', views.LaundryBookingViewSet, basename='booking')
router.register(r'tracking', views.OrderTrackingViewSet, basename='tracking')
router.register(r'admin/bookings', views.AdminBookingViewSet, basename='admin-booking')

urlpatterns = [
    path('', include(router.urls)),
]
