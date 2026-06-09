"""djangoproj URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf.urls.static import static
from django.conf import settings

spa_index_view = TemplateView.as_view(template_name="index.html")

spa_routes = [
    path("", spa_index_view),
    path("home/", spa_index_view),
    path("reviews/", spa_index_view),
    path("login/", spa_index_view),
    path("register/", spa_index_view),
    path("dealers/", spa_index_view),
    path("dealer/<int:dealer_id>", spa_index_view),
    path("dealer/<int:dealer_id>/", spa_index_view),
    path("postreview/<int:dealer_id>", spa_index_view),
    path("postreview/<int:dealer_id>/", spa_index_view),
    path("customer/my-reviews/", spa_index_view),
    path("dealer/dashboard/", spa_index_view),
    path("dealer/inventory/", spa_index_view),
    path("dealer/reviews/", spa_index_view),
    path("dealer/profile/", spa_index_view),
    path("admin/dashboard/", spa_index_view),
    path("admin/dashboard", spa_index_view),
    path("admin/create-dealer-admin/", spa_index_view),
    path("admin/create-dealer-admin", spa_index_view),
    path("admin/dealerships/create/", spa_index_view),
    path("admin/dealerships/create", spa_index_view),
    path("admin/dealerships/", spa_index_view),
    path("admin/dealerships", spa_index_view),
    path("admin/users/create/", spa_index_view),
    path("admin/users/create", spa_index_view),
    path("admin/users/", spa_index_view),
    path("admin/users", spa_index_view),
    path("admin/inventory/", spa_index_view),
    path("admin/inventory", spa_index_view),
    re_path(r"^about/?$", spa_index_view),
    re_path(r"^contact/?$", spa_index_view),
]

urlpatterns = [
    path("djangoapp/", include("djangoapp.urls")),
    *spa_routes,
    path("admin/", admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
