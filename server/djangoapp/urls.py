# imports
from django.urls import path
from django.conf.urls.static import static
from django.conf import settings
from . import views

app_name = "djangoapp"
urlpatterns = [
    # # path for registration
    # path for login
    path(route="login/", view=views.login_user, name="login"),
    path(route="logout/", view=views.logout_request, name="logout"),
    path(route="register/", view=views.registration, name="register"),
    path(
        route="admin/create_dealer_admin",
        view=views.create_dealer_admin,
        name="create_dealer_admin",
    ),
    path(
        route="admin/users",
        view=views.list_platform_users,
        name="list_platform_users",
    ),
    path(
        route="admin/dealerships",
        view=views.create_dealership,
        name="create_dealership",
    ),
    path(route="get_cars", view=views.get_cars, name="getcars"),
    path(route="get_dealers", view=views.get_dealerships, name="get_dealers"),
    path(
        route="get_dealers/<str:state>",
        view=views.get_dealerships,
        name="get_dealers_by_state",
    ),
    path(
        route="dealer/<int:dealer_id>",
        view=views.get_dealer_details,
        name="dealer_details",
    ),
    path(
        route="reviews/dealer/<int:dealer_id>",
        view=views.get_dealer_reviews,
        name="dealer_reviews",
    ),
    path(
        route="reviews/me",
        view=views.get_my_reviews,
        name="my_reviews",
    ),
    path(route="add_review", view=views.add_review, name="add_review"),
    path(
        route="dealer/<int:dealer_id>/update",
        view=views.update_dealership,
        name="update_dealership",
    ),
    path(
        route="reviews/<int:review_id>/update",
        view=views.update_review,
        name="update_review",
    ),
    path(
        route="reviews/<int:review_id>/delete",
        view=views.delete_review,
        name="delete_review",
    ),
    # Inventory endpoints
    path(
        route="inventory/dealer/<int:dealer_id>",
        view=views.get_dealer_inventory,
        name="get_dealer_inventory",
    ),
    path(
        route="inventory/dealer/<int:dealer_id>/options",
        view=views.get_dealer_inventory_options,
        name="get_dealer_inventory_options",
    ),
    path(
        route="inventory/add",
        view=views.add_inventory,
        name="add_inventory",
    ),
    path(
        route="inventory/<str:vehicle_id>/update",
        view=views.update_inventory,
        name="update_inventory",
    ),
    path(
        route="inventory/<str:vehicle_id>/delete",
        view=views.delete_inventory,
        name="delete_inventory",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
