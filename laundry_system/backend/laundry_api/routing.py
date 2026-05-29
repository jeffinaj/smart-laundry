from django.urls import re_path
from laundry_api.core.consumers import DashboardConsumer, NotificationConsumer, OrderTrackingConsumer

websocket_urlpatterns = [
    re_path(r'ws/dashboard/$', DashboardConsumer.as_asgi()),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/tracking/(?P<booking_id>\d+)/$', OrderTrackingConsumer.as_asgi()),
]
