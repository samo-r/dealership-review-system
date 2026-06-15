import sys

from django.apps import AppConfig


class DjangoappConfig(AppConfig):
    name = "djangoapp"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        if any(
            command in sys.argv
            for command in ("migrate", "makemigrations", "test", "collectstatic")
        ):
            return

        from djangoapp.sentiment_events import verify_redis_connection

        verify_redis_connection()
