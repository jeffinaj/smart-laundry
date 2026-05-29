from django.urls import path
from . import views

app_name = 'laundry'

urlpatterns = [
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('csrf/', views.csrf_cookie_view, name='csrf'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('bookings/', views.bookings_view, name='bookings'),
    path('bookings/<int:pk>/', views.booking_detail_view, name='booking_detail'),
    path('payments/', views.payments_view, name='payments'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('trackings/<int:booking_id>/', views.order_tracking_view, name='trackings'),
    path('admin/send-notification/', views.admin_send_notification, name='admin_send_notification'),
]
