import sys

from django.apps import AppConfig


class DjangoappConfig(AppConfig):
    name = "djangoapp"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        skip_commands = (
            "migrate",
            "makemigrations",
            "test",
            "collectstatic",
        )
        if any(command in sys.argv for command in skip_commands):
            return

        from djangoapp.sentiment_events import verify_redis_connection

        verify_redis_connection()
