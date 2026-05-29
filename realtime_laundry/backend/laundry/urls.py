from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'bookings', views.LaundryBookingViewSet, basename='booking')
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('dashboard/', views.get_dashboard, name='dashboard'),
    path('', include(router.urls)),
]
