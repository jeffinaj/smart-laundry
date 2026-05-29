from django.apps import AppConfig


class LaundryApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'laundry_api'

    def ready(self):
        import laundry_api.core.signals
