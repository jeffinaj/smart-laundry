from django.urls import path, include
from rest_framework.routers import DefaultRouter
from laundry_api.notifications import views

router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
