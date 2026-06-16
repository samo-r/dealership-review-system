FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY manage.py .
COPY djangoproj ./djangoproj
COPY djangoapp ./djangoapp

EXPOSE 8000

# Railway injects PORT and DATABASE_URL when Postgres is linked.
CMD sh -c "python manage.py migrate --noinput && python manage.py ensure_superuser && gunicorn djangoproj.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"
