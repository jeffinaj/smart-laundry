from django.urls import path, include
from rest_framework.routers import DefaultRouter
from laundry_api.users.urls import urlpatterns as user_urls
from laundry_api.bookings.urls import urlpatterns as booking_urls
from laundry_api.payments.urls import urlpatterns as payment_urls
from laundry_api.notifications.urls import urlpatterns as notification_urls

urlpatterns = [
    path('auth/', include(user_urls)),
    path('bookings/', include(booking_urls)),
    path('payments/', include(payment_urls)),
    path('notifications/', include(notification_urls)),
]
