"""
ASGI config for laundry_system project with Django Channels.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from laundry_api.core.middleware import TokenAuthMiddleware
import laundry_api.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'laundry_system.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddleware(
        URLRouter(
            laundry_api.routing.websocket_urlpatterns
        )
    ),
})
