# Stage 1: build React SPA
FROM node:20-bookworm-slim AS frontend-build

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
ENV CI=true
RUN npm run build

# Stage 2: Django API + built SPA
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY manage.py .
COPY djangoproj ./djangoproj
COPY djangoapp ./djangoapp
COPY --from=frontend-build /frontend/build ./frontend/build

EXPOSE 8000

# collectstatic gathers CRA assets into STATIC_ROOT for WhiteNoise.
CMD sh -c "python manage.py collectstatic --noinput && python manage.py migrate --noinput && python manage.py ensure_superuser && gunicorn djangoproj.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"
