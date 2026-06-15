"""
RBAC integration test matrix.

Covers every role × every protected endpoint:
  - ANONYMOUS  (no token)
  - CUSTOMER   (valid token, role=CUSTOMER)
  - DEALER_ADMIN (valid token, role=DEALER_ADMIN, assigned_dealer_id=1)
  - ADMIN      (valid token, role=ADMIN)

All upstream service calls (get_request, post_review, put_request,
delete_request) are mocked so the Node.js database API is not required.

Run with:
    python manage.py test djangoapp.tests
"""

import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, Client

from .views import issue_tokens

User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

DEALER_STUB = {
    "id": 1,
    "dealer_id": 1,
    "name": "Test Dealer",
    "full_name": "Test Dealer",
    "district": "Kampala",
    "city": "Kampala",
    "physical_address": "Plot 1, Test Road",
    "address": "Plot 1, Test Road",
}
MOCK_DEALERS = [DEALER_STUB]
MOCK_DEALER = [DEALER_STUB]
REVIEW_STUB = {
    "id": 1,
    "dealership": 1,
    "review": "Great!",
    "author_id": None,
    "author_username": None,
    "sentiment": "positive",
    "sentiment_status": "completed",
}
UPDATE_OK = {
    "id": 1,
    "dealer_id": 1,
    "name": "Updated",
    "full_name": "Updated",
    "district": "Wakiso",
}


def auth_header(user):
    tokens = issue_tokens(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {tokens['access']}"}


def json_body(data):
    return json.dumps(data)


def make_review_stub(author_id, author_username="testuser"):
    return {
        **REVIEW_STUB,
        "author_id": author_id,
        "author_username": author_username}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

class RbacTestBase(TestCase):
    def setUp(self):
        self.client = Client()

        self.admin = User.objects.create_user(
            username="admin_user",
            password="AdminPass1!",
            email="admin@test.com",
            role=User.Roles.ADMIN,
        )
        # Superuser also gets ADMIN via UserManager
        self.superuser = User.objects.create_superuser(
            username="super_user",
            password="SuperPass1!",
            email="super@test.com",
        )
        self.customer = User.objects.create_user(
            username="customer_user",
            password="CustPass1!",
            email="cust@test.com",
            role=User.Roles.CUSTOMER,
        )
        self.dealer_admin = User.objects.create_user(
            username="dealer_admin_user",
            password="DealerPass1!",
            email="dealer@test.com",
            role=User.Roles.DEALER_ADMIN,
            assigned_dealer_id=1,
        )
        self.dealer_admin_2 = User.objects.create_user(
            username="dealer_admin_2",
            password="DealerPass2!",
            email="dealer2@test.com",
            role=User.Roles.DEALER_ADMIN,
            assigned_dealer_id=2,
        )


# ---------------------------------------------------------------------------
# 1.  Auth endpoints
# ---------------------------------------------------------------------------

class AuthTests(RbacTestBase):

    def test_login_success_returns_tokens_and_profile(self):
        resp = self.client.post(
            "/djangoapp/login/",
            json_body({"userName": "customer_user", "password": "CustPass1!"}),
            content_type="application/json",
        )
        data = resp.json()
        self.assertEqual(resp.status_code, 200)
        self.assertIn("tokens", data)
        self.assertIn("access", data["tokens"])
        self.assertEqual(data["user"]["role"], User.Roles.CUSTOMER)

    def test_login_wrong_password_returns_401(self):
        resp = self.client.post(
            "/djangoapp/login/",
            json_body({"userName": "customer_user", "password": "wrong"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json()["error"]["code"], "INVALID_CREDENTIALS")

    def test_login_missing_fields_returns_400(self):
        resp = self.client.post(
            "/djangoapp/login/",
            json_body({"userName": "customer_user"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["error"]["code"], "MISSING_FIELDS")

    def test_login_rejects_get(self):
        resp = self.client.get("/djangoapp/login/")
        self.assertEqual(resp.status_code, 405)

    def test_registration_creates_customer_and_returns_201(self):
        resp = self.client.post(
            "/djangoapp/register/",
            json_body({"userName": "new_user", "password": "NewPass1!"}),
            content_type="application/json",
        )
        data = resp.json()
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(data["user"]["role"], User.Roles.CUSTOMER)
        self.assertIsNone(data["user"]["assignedDealerId"])

    def test_registration_ignores_client_supplied_role(self):
        resp = self.client.post(
            "/djangoapp/register/",
            json_body(
                {"userName": "hacker", "password": "Pass1!", "role": "ADMIN"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["user"]["role"], User.Roles.CUSTOMER)

    def test_registration_duplicate_username_returns_409(self):
        resp = self.client.post(
            "/djangoapp/register/",
            json_body({"userName": "customer_user", "password": "AnyPass1!"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 409)
        self.assertEqual(resp.json()["error"]["code"], "USERNAME_TAKEN")

    def test_registration_missing_fields_returns_400(self):
        resp = self.client.post(
            "/djangoapp/register/",
            json_body({"userName": "only_name"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)


# ---------------------------------------------------------------------------
# 2.  Admin — create dealership
# ---------------------------------------------------------------------------

MOCK_CREATED_DEALERSHIP = {
    "status": 201,
    "dealership": {
        "id": 99,
        "dealer_id": 99,
        "name": "Kampala Motors",
        "full_name": "Kampala Motors",
        "tin": "1000000099",
        "district": "Kampala",
        "physical_address": "Plot 12, Kampala",
        "email": "info@kampala.example",
    },
    "dealership_id": 99,
}


class CreateDealershipTests(RbacTestBase):

    def _post(self, user, payload):
        headers = auth_header(user) if user else {}
        return self.client.post(
            "/djangoapp/admin/dealerships",
            json_body(payload),
            content_type="application/json",
            **headers,
        )

    @patch("djangoapp.views.post_request",
           return_value=MOCK_CREATED_DEALERSHIP)
    def test_admin_can_create_dealership(self, _mock):
        resp = self._post(self.admin, {
            "name": "Kampala Motors",
            "tin": "1000000099",
            "district": "Kampala",
            "physical_address": "Plot 12, Kampala",
            "email": "info@kampala.example",
        })
        data = resp.json()
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(data["dealership_id"], 99)

    @patch("djangoapp.views.post_request",
           return_value=MOCK_CREATED_DEALERSHIP)
    def test_superuser_can_create_dealership(self, _mock):
        resp = self._post(self.superuser, {
            "name": "Entebbe Autos",
            "tin": "1000000100",
            "district": "Wakiso",
            "physical_address": "Entebbe Road",
            "email": "hello@entebbe.example",
        })
        self.assertEqual(resp.status_code, 201)

    def test_customer_cannot_create_dealership(self):
        resp = self._post(self.customer, {
            "name": "Bad Motors",
            "tin": "1000000000",
            "district": "Nowhere",
            "physical_address": "Nowhere",
            "email": "bad@example.com",
        })
        self.assertEqual(resp.status_code, 403)

    def test_anonymous_cannot_create_dealership(self):
        resp = self._post(None, {
            "name": "Bad Motors",
            "tin": "1000000000",
            "district": "Nowhere",
            "physical_address": "Nowhere",
            "email": "bad@example.com",
        })
        self.assertEqual(resp.status_code, 401)

    def test_missing_fields_returns_400(self):
        resp = self._post(self.admin, {"name": "Incomplete"})
        self.assertEqual(resp.status_code, 400)


# ---------------------------------------------------------------------------
# 3.  Admin — create dealer admin
# ---------------------------------------------------------------------------

class CreateDealerAdminTests(RbacTestBase):

    def _post(self, user, payload):
        headers = auth_header(user) if user else {}
        return self.client.post(
            "/djangoapp/admin/create_dealer_admin",
            json_body(payload),
            content_type="application/json",
            **headers,
        )

    @patch("djangoapp.views.get_request", return_value=MOCK_DEALER)
    def test_admin_can_create_dealer_admin(self, _mock):
        resp = self._post(self.admin, {
            "userName": "new_dealer_admin",
            "password": "Pass1!",
            "assignedDealerId": 5,
        })
        data = resp.json()
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(data["user"]["role"], User.Roles.DEALER_ADMIN)
        self.assertEqual(data["user"]["assignedDealerId"], 5)

    @patch("djangoapp.views.get_request", return_value=MOCK_DEALER)
    def test_superuser_can_create_dealer_admin(self, _mock):
        resp = self._post(self.superuser, {
            "userName": "another_dealer_admin",
            "password": "Pass1!",
            "assignedDealerId": 6,
        })
        self.assertEqual(resp.status_code, 201)

    def test_customer_cannot_create_dealer_admin(self):
        resp = self._post(self.customer, {
            "userName": "bad_actor",
            "password": "Pass1!",
            "assignedDealerId": 5,
        })
        self.assertEqual(resp.status_code, 403)

    def test_dealer_admin_cannot_create_dealer_admin(self):
        resp = self._post(self.dealer_admin, {
            "userName": "bad_actor_2",
            "password": "Pass1!",
            "assignedDealerId": 5,
        })
        self.assertEqual(resp.status_code, 403)

    def test_anonymous_cannot_create_dealer_admin(self):
        resp = self._post(None, {
            "userName": "anon_attempt",
            "password": "Pass1!",
            "assignedDealerId": 5,
        })
        self.assertEqual(resp.status_code, 401)

    def test_missing_dealer_id_returns_400(self):
        resp = self._post(self.admin, {"userName": "da", "password": "Pass1!"})
        self.assertEqual(resp.status_code, 400)

    def test_invalid_dealer_id_returns_400(self):
        resp = self._post(self.admin, {
            "userName": "da",
            "password": "Pass1!",
            "assignedDealerId": -1,
        })
        self.assertEqual(resp.status_code, 400)

    @patch("djangoapp.views.get_request", return_value=MOCK_DEALER)
    def test_duplicate_username_returns_409(self, _mock):
        resp = self._post(self.admin, {
            "userName": "customer_user",
            "password": "Pass1!",
            "assignedDealerId": 3,
        })
        self.assertEqual(resp.status_code, 409)

    @patch("djangoapp.views.get_request", return_value=[])
    def test_unknown_assigned_dealer_returns_404(self, _mock):
        resp = self._post(self.admin, {
            "userName": "orphan_dealer_admin",
            "password": "Pass1!",
            "assignedDealerId": 99999,
        })
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(resp.json()["error"]["code"], "DEALER_NOT_FOUND")


class AdminUserListTests(RbacTestBase):

    def test_admin_can_list_platform_users(self):
        resp = self.client.get("/djangoapp/admin/users",
                               **auth_header(self.admin))
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["status"], 200)
        self.assertTrue(any(user["role"] == "ADMIN" for user in body["users"]))
        self.assertTrue(
            any(user["role"] == "CUSTOMER" for user in body["users"]))

    def test_customer_cannot_list_platform_users(self):
        resp = self.client.get("/djangoapp/admin/users",
                               **auth_header(self.customer))
        self.assertEqual(resp.status_code, 403)

    def test_anonymous_cannot_list_platform_users(self):
        resp = self.client.get("/djangoapp/admin/users")
        self.assertEqual(resp.status_code, 401)


# ---------------------------------------------------------------------------
# 3.  Dealership read (anonymous allowed)
# ---------------------------------------------------------------------------

class DealershipReadTests(RbacTestBase):

    @patch("djangoapp.views.get_request", return_value=MOCK_DEALERS)
    def test_anonymous_can_list_dealers(self, _mock):
        resp = self.client.get("/djangoapp/get_dealers")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("dealers", resp.json())

    @patch("djangoapp.views.get_request", return_value=MOCK_DEALERS)
    def test_customer_can_list_dealers(self, _mock):
        resp = self.client.get("/djangoapp/get_dealers",
                               **auth_header(self.customer))
        self.assertEqual(resp.status_code, 200)

    @patch("djangoapp.views.get_request", return_value=MOCK_DEALER)
    def test_anonymous_can_get_dealer_details(self, _mock):
        resp = self.client.get("/djangoapp/dealer/1")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("dealer", resp.json())

    @patch("djangoapp.views.get_request", return_value=MOCK_DEALER)
    def test_dealer_admin_can_get_dealer_details(self, _mock):
        resp = self.client.get("/djangoapp/dealer/1", **
                               auth_header(self.dealer_admin))
        self.assertEqual(resp.status_code, 200)

    @patch("djangoapp.views.get_request", return_value=MOCK_DEALERS)
    def test_anonymous_can_list_dealers_by_state(self, _mock):
        resp = self.client.get("/djangoapp/get_dealers/TX")
        self.assertEqual(resp.status_code, 200)

    def test_bad_token_on_read_endpoint_returns_401(self):
        resp = self.client.get(
            "/djangoapp/get_dealers",
            HTTP_AUTHORIZATION="Bearer not-a-real-token",
        )
        self.assertEqual(resp.status_code, 401)


# ---------------------------------------------------------------------------
# 4.  Review read (anonymous allowed)
# ---------------------------------------------------------------------------

MOCK_REVIEWS = [make_review_stub(author_id=1)]


class ReviewReadTests(RbacTestBase):

    @patch("djangoapp.views.get_request", return_value=MOCK_REVIEWS)
    def test_anonymous_can_read_reviews(self, _get):
        resp = self.client.get("/djangoapp/reviews/dealer/1")
        self.assertEqual(resp.status_code, 200)
        reviews = resp.json()["reviews"]
        self.assertEqual(reviews[0]["sentiment"], "positive")
        self.assertEqual(reviews[0]["sentiment_status"], "completed")

    @patch("djangoapp.views.get_request", return_value=MOCK_REVIEWS)
    def test_customer_can_read_reviews(self, _get):
        resp = self.client.get(
            "/djangoapp/reviews/dealer/1",
            **auth_header(self.customer),
        )
        self.assertEqual(resp.status_code, 200)

    @patch("djangoapp.views.get_request", return_value=[{
        **REVIEW_STUB,
        "sentiment": None,
        "sentiment_status": "pending",
    }])
    def test_reviews_return_stored_sentiment_without_live_analysis(self, _get):
        resp = self.client.get("/djangoapp/reviews/dealer/1")
        self.assertEqual(resp.status_code, 200)
        review = resp.json()["reviews"][0]
        self.assertIsNone(review["sentiment"])
        self.assertEqual(review["sentiment_status"], "pending")


# ---------------------------------------------------------------------------
# 4b.  Customer "My Reviews" endpoint
# ---------------------------------------------------------------------------

class MyReviewsTests(RbacTestBase):

    @patch("djangoapp.views.get_request")
    def test_customer_can_fetch_only_own_reviews(self, mock_get):
        mock_get.side_effect = [
            [{"id": 1, "full_name": "Dealer One"}],  # /fetchDealers
            [  # /fetchReviews/dealer/1
                {
                    "id": 101,
                    "dealership": 1,
                    "review": "Mine",
                    "author_id": self.customer.id,
                    "sentiment": "positive",
                    "sentiment_status": "completed",
                },
                {"id": 102, "dealership": 1, "review": "Not mine",
                    "author_id": self.admin.id},
            ],
        ]

        resp = self.client.get("/djangoapp/reviews/me",
                               **auth_header(self.customer))
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["status"], 200)
        self.assertEqual(len(body["reviews"]), 1)
        self.assertEqual(body["reviews"][0]["id"], 101)
        self.assertEqual(body["reviews"][0]["dealerName"], "Dealer One")

    def test_anonymous_cannot_fetch_my_reviews(self):
        resp = self.client.get("/djangoapp/reviews/me")
        self.assertEqual(resp.status_code, 401)


# ---------------------------------------------------------------------------
# 5.  Review create
# ---------------------------------------------------------------------------

REVIEW_PAYLOAD = {
    "dealership": 1,
    "review": "Loved it",
    "purchase": True,
    "purchase_date": "2024-01-01",
    "car_make": "Toyota",
    "car_model": "Camry",
    "car_year": 2022,
    "name": "Test User",
    "chassis_number": "ABC123456",
}


class ReviewCreateTests(RbacTestBase):

    def _post(self, user, payload=None):
        headers = auth_header(user) if user else {}
        return self.client.post(
            "/djangoapp/add_review",
            json_body(payload or REVIEW_PAYLOAD),
            content_type="application/json",
            **headers,
        )

    @patch("djangoapp.views.publish_review_sentiment_event", return_value=True)
    @patch("djangoapp.views.verify_chassis", return_value={"verified": True})
    @patch("djangoapp.views.post_review", return_value={"id": 99})
    def test_customer_can_create_review(
            self, mock_post, _mock_verify, _mock_publish):
        resp = self._post(self.customer)
        self.assertEqual(resp.status_code, 200)
        # Authorship is stamped onto the forwarded payload
        call_data = mock_post.call_args[0][0]
        self.assertEqual(call_data["author_id"], self.customer.id)
        self.assertEqual(call_data["author_username"], self.customer.username)
        self.assertNotIn("chassis_number", call_data)

    @patch("djangoapp.views.publish_review_sentiment_event", return_value=True)
    @patch("djangoapp.views.verify_chassis", return_value={"verified": True})
    @patch("djangoapp.views.post_review", return_value={"id": 99})
    def test_admin_can_create_review(
            self,
            _mock_post,
            _mock_verify,
            _mock_publish):
        resp = self._post(self.admin)
        self.assertEqual(resp.status_code, 200)

    def test_dealer_admin_cannot_create_review(self):
        resp = self._post(self.dealer_admin)
        self.assertEqual(resp.status_code, 403)

    def test_anonymous_cannot_create_review(self):
        resp = self._post(None)
        self.assertEqual(resp.status_code, 401)

    def test_invalid_json_returns_400(self):
        resp = self.client.post(
            "/djangoapp/add_review",
            "not-json",
            content_type="application/json",
            **auth_header(self.customer),
        )
        self.assertEqual(resp.status_code, 400)

    def test_get_method_returns_405(self):
        resp = self.client.get("/djangoapp/add_review",
                               **auth_header(self.customer))
        self.assertEqual(resp.status_code, 405)

    @patch("djangoapp.views.verify_chassis", return_value={"verified": True})
    def test_missing_chassis_number_returns_400(self, _mock_verify):
        payload = dict(REVIEW_PAYLOAD)
        payload.pop("chassis_number")
        resp = self._post(self.customer, payload)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["error"]["code"], "CHASSIS_REQUIRED")

    @patch("djangoapp.views.verify_chassis", return_value={"verified": False})
    def test_invalid_chassis_number_blocks_review(self, _mock_verify):
        resp = self._post(self.customer)
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.json()["error"]["code"],
                         "CHASSIS_VERIFICATION_FAILED")

    @patch("djangoapp.views.publish_review_sentiment_event", return_value=True)
    @patch("djangoapp.views.verify_chassis", return_value={"verified": True})
    @patch("djangoapp.views.post_review", return_value={"id": 99})
    def test_chassis_number_is_not_forwarded_to_review_storage(
            self, mock_post, _mock_verify, _mock_publish):
        resp = self._post(self.customer)
        self.assertEqual(resp.status_code, 200)
        call_data = mock_post.call_args[0][0]
        self.assertNotIn("chassis_number", call_data)


UPDATE_REVIEW_PAYLOAD = {"review": "Updated text"}


class SentimentEventTests(RbacTestBase):

    @patch("djangoapp.views.verify_chassis", return_value={"verified": True})
    @patch("djangoapp.views.publish_review_sentiment_event", return_value=True)
    @patch("djangoapp.views.post_review",
           return_value={"id": 99, "sentiment_status": "pending"})
    def test_add_review_publishes_sentiment_event(
            self, mock_post, mock_publish, _mock_verify):
        resp = self.client.post(
            "/djangoapp/add_review",
            json_body(REVIEW_PAYLOAD),
            content_type="application/json",
            **auth_header(self.customer),
        )
        self.assertEqual(resp.status_code, 200)
        mock_publish.assert_called_once_with(
            "review.created",
            99,
            REVIEW_PAYLOAD["review"],
        )

    @patch("djangoapp.views.publish_review_sentiment_event", return_value=True)
    @patch("djangoapp.views.put_request",
           return_value={"id": 1, "sentiment_status": "pending"})
    def test_update_review_text_publishes_sentiment_event(
            self, _put, mock_publish):
        resp = self.client.put(
            "/djangoapp/reviews/1/update",
            json_body(UPDATE_REVIEW_PAYLOAD),
            content_type="application/json",
            **auth_header(self.admin),
        )
        self.assertEqual(resp.status_code, 200)
        mock_publish.assert_called_once_with(
            "review.updated",
            1,
            UPDATE_REVIEW_PAYLOAD["review"],
        )

    @patch("djangoapp.views.publish_review_sentiment_event", return_value=True)
    @patch("djangoapp.views.put_request", return_value={"id": 1})
    def test_update_review_without_text_skips_sentiment_event(
            self, _put, mock_publish):
        resp = self.client.put(
            "/djangoapp/reviews/1/update",
            json_body({"car_make": "Toyota"}),
            content_type="application/json",
            **auth_header(self.admin),
        )
        self.assertEqual(resp.status_code, 200)
        mock_publish.assert_not_called()


# ---------------------------------------------------------------------------
# 6.  Review update
# ---------------------------------------------------------------------------

class ReviewUpdateTests(RbacTestBase):

    def _put(self, user, review_id, payload=None):
        headers = auth_header(user) if user else {}
        return self.client.put(
            f"/djangoapp/reviews/{review_id}/update",
            json_body(payload or UPDATE_REVIEW_PAYLOAD),
            content_type="application/json",
            **headers,
        )

    @patch("djangoapp.views.put_request", return_value=UPDATE_OK)
    @patch("djangoapp.views.get_request",
           return_value=make_review_stub(author_id=None))
    def test_admin_can_update_any_review(self, _get, _put):
        # get_request stub is not called for admin (update.any bypasses
        # ownership check)
        resp = self._put(self.admin, review_id=1)
        self.assertEqual(resp.status_code, 200)
        _get.assert_not_called()

    @patch("djangoapp.views.put_request", return_value=UPDATE_OK)
    def test_customer_can_update_own_review(self, _put):
        own_stub = make_review_stub(author_id=self.customer.id)
        with patch("djangoapp.views.get_request", return_value=own_stub):
            resp = self._put(self.customer, review_id=1)
        self.assertEqual(resp.status_code, 200)

    def test_customer_cannot_update_others_review(self):
        other_stub = make_review_stub(author_id=self.admin.id)
        with patch("djangoapp.views.get_request", return_value=other_stub):
            resp = self._put(self.customer, review_id=1)
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.json()["error"]["code"], "FORBIDDEN")

    def test_dealer_admin_cannot_update_any_review(self):
        resp = self._put(self.dealer_admin, review_id=1)
        self.assertEqual(resp.status_code, 403)

    def test_anonymous_cannot_update_review(self):
        resp = self._put(None, review_id=1)
        self.assertEqual(resp.status_code, 401)

    def test_no_update_fields_returns_400(self):
        own_stub = make_review_stub(author_id=self.customer.id)
        with patch("djangoapp.views.get_request", return_value=own_stub):
            resp = self._put(self.customer, review_id=1,
                             payload={"unknown_field": "x"})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["error"]["code"], "NO_UPDATE_FIELDS")

    def test_review_not_found_returns_404(self):
        with patch("djangoapp.views.get_request", return_value=None):
            resp = self._put(self.customer, review_id=999)
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(resp.json()["error"]["code"], "REVIEW_NOT_FOUND")


# ---------------------------------------------------------------------------
# 7.  Review delete
# ---------------------------------------------------------------------------

class ReviewDeleteTests(RbacTestBase):

    def _delete(self, user, review_id):
        headers = auth_header(user) if user else {}
        return self.client.delete(
            f"/djangoapp/reviews/{review_id}/delete",
            **headers,
        )

    @patch("djangoapp.views.delete_request",
           return_value={"message": "Review deleted."})
    def test_admin_can_delete_any_review(self, _del):
        resp = self._delete(self.admin, review_id=1)
        self.assertEqual(resp.status_code, 200)

    @patch("djangoapp.views.delete_request",
           return_value={"message": "Review deleted."})
    def test_customer_can_delete_own_review(self, _del):
        own_stub = make_review_stub(author_id=self.customer.id)
        with patch("djangoapp.views.get_request", return_value=own_stub):
            resp = self._delete(self.customer, review_id=1)
        self.assertEqual(resp.status_code, 200)

    def test_customer_cannot_delete_others_review(self):
        other_stub = make_review_stub(author_id=self.admin.id)
        with patch("djangoapp.views.get_request", return_value=other_stub):
            resp = self._delete(self.customer, review_id=1)
        self.assertEqual(resp.status_code, 403)

    def test_dealer_admin_cannot_delete_review(self):
        resp = self._delete(self.dealer_admin, review_id=1)
        self.assertEqual(resp.status_code, 403)

    def test_anonymous_cannot_delete_review(self):
        resp = self._delete(None, review_id=1)
        self.assertEqual(resp.status_code, 401)

    def test_wrong_method_returns_405(self):
        resp = self.client.post(
            "/djangoapp/reviews/1/delete",
            **auth_header(self.admin),
        )
        self.assertEqual(resp.status_code, 405)


# ---------------------------------------------------------------------------
# 8.  Dealership update
# ---------------------------------------------------------------------------

UPDATE_DEALER_PAYLOAD = {"district": "Wakiso"}


class DealershipUpdateTests(RbacTestBase):

    def _put(self, user, dealer_id, payload=None):
        headers = auth_header(user) if user else {}
        return self.client.put(
            f"/djangoapp/dealer/{dealer_id}/update",
            json_body(payload or UPDATE_DEALER_PAYLOAD),
            content_type="application/json",
            **headers,
        )

    @patch("djangoapp.views.put_request", return_value=UPDATE_OK)
    def test_admin_can_update_any_dealer(self, _put):
        resp = self._put(self.admin, dealer_id=99)
        self.assertEqual(resp.status_code, 200)

    @patch("djangoapp.views.put_request", return_value=UPDATE_OK)
    def test_dealer_admin_can_update_own_dealer(self, _put):
        # dealer_admin has assigned_dealer_id=1
        resp = self._put(self.dealer_admin, dealer_id=1)
        self.assertEqual(resp.status_code, 200)

    def test_dealer_admin_cannot_update_other_dealer(self):
        # dealer_admin_2 has assigned_dealer_id=2, trying to update dealer 1
        resp = self._put(self.dealer_admin_2, dealer_id=1)
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.json()["error"]["code"], "FORBIDDEN")

    def test_customer_cannot_update_dealer(self):
        resp = self._put(self.customer, dealer_id=1)
        self.assertEqual(resp.status_code, 403)

    def test_anonymous_cannot_update_dealer(self):
        resp = self._put(None, dealer_id=1)
        self.assertEqual(resp.status_code, 401)

    def test_no_update_fields_returns_400(self):
        resp = self._put(self.admin, dealer_id=1, payload={"id": 999})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["error"]["code"], "NO_UPDATE_FIELDS")

    def test_invalid_json_returns_400(self):
        resp = self.client.put(
            "/djangoapp/dealer/1/update",
            "not-json",
            content_type="application/json",
            **auth_header(self.admin),
        )
        self.assertEqual(resp.status_code, 400)

    def test_wrong_method_returns_405(self):
        resp = self.client.post(
            "/djangoapp/dealer/1/update",
            **auth_header(self.admin),
        )
        self.assertEqual(resp.status_code, 405)


# ---------------------------------------------------------------------------
# 9.  Upstream service error propagation
# ---------------------------------------------------------------------------

UPSTREAM_ERROR = {
    "ok": False,
    "status": 503,
    "error": {
        "service": "database-api",
        "message": "Database unavailable.",
    },
}


class UpstreamErrorTests(RbacTestBase):

    @patch("djangoapp.views.get_request", return_value=UPSTREAM_ERROR)
    def test_upstream_error_on_dealers_list_is_surfaced(self, _mock):
        resp = self.client.get("/djangoapp/get_dealers")
        self.assertEqual(resp.status_code, 503)
        body = resp.json()
        self.assertIn("error", body)
        self.assertEqual(body["error"]["code"], "DATABASE_API_ERROR")
        # Internal service details must not leak raw "ok: false" envelope
        self.assertNotIn("ok", body)

    @patch("djangoapp.views.get_request", return_value=UPSTREAM_ERROR)
    def test_upstream_error_on_dealer_details_is_surfaced(self, _mock):
        resp = self.client.get("/djangoapp/dealer/1")
        self.assertEqual(resp.status_code, 503)

    @patch("djangoapp.views.get_request", return_value=UPSTREAM_ERROR)
    def test_upstream_error_on_reviews_is_surfaced(self, _get):
        resp = self.client.get("/djangoapp/reviews/dealer/1")
        self.assertEqual(resp.status_code, 503)

    @patch("djangoapp.views.verify_chassis", return_value={"verified": True})
    @patch("djangoapp.views.post_review", return_value=UPSTREAM_ERROR)
    def test_upstream_error_on_add_review_is_surfaced(self, _mock, _verify):
        resp = self.client.post(
            "/djangoapp/add_review",
            json_body(REVIEW_PAYLOAD),
            content_type="application/json",
            **auth_header(self.customer),
        )
        self.assertEqual(resp.status_code, 503)

    @patch("djangoapp.views.put_request", return_value=UPSTREAM_ERROR)
    def test_upstream_error_on_update_dealer_is_surfaced(self, _mock):
        resp = self.client.put(
            "/djangoapp/dealer/1/update",
            json_body(UPDATE_DEALER_PAYLOAD),
            content_type="application/json",
            **auth_header(self.admin),
        )
        self.assertEqual(resp.status_code, 503)

    @patch("djangoapp.views.put_request", return_value=UPSTREAM_ERROR)
    @patch("djangoapp.views.get_request",
           return_value=make_review_stub(author_id=None))
    def test_upstream_error_on_update_review_is_surfaced(self, _get, _put):
        resp = self.client.put(
            "/djangoapp/reviews/1/update",
            json_body(UPDATE_REVIEW_PAYLOAD),
            content_type="application/json",
            **auth_header(self.admin),
        )
        self.assertEqual(resp.status_code, 503)

    @patch("djangoapp.views.delete_request", return_value=UPSTREAM_ERROR)
    def test_upstream_error_on_delete_review_is_surfaced(self, _mock):
        resp = self.client.delete(
            "/djangoapp/reviews/1/delete",
            **auth_header(self.admin),
        )
        self.assertEqual(resp.status_code, 503)


# ---------------------------------------------------------------------------
# 10.  Token edge cases
# ---------------------------------------------------------------------------

class TokenEdgeCaseTests(RbacTestBase):

    def test_expired_token_returns_401(self):
        import jwt as pyjwt
        from django.conf import settings
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        payload = {
            "sub": str(self.customer.id),
            "username": self.customer.username,
            "role": self.customer.role,
            "assigned_dealer_id": None,
            "iat": int((now - timedelta(hours=2)).timestamp()),
            "type": "access",
            # already expired
            "exp": int((now - timedelta(hours=1)).timestamp()),
        }
        expired_token = pyjwt.encode(
            payload,
            settings.JWT_SIGNING_KEY,
            algorithm=settings.JWT_ALGORITHM)
        resp = self.client.get(
            "/djangoapp/get_dealers",
            HTTP_AUTHORIZATION=f"Bearer {expired_token}",
        )
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json()["error"]["code"], "TOKEN_EXPIRED")

    def test_refresh_token_rejected_on_protected_endpoint(self):
        tokens = issue_tokens(self.customer)
        resp = self.client.post(
            "/djangoapp/add_review",
            json_body(REVIEW_PAYLOAD),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {tokens['refresh']}",
        )
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json()["error"]["code"], "WRONG_TOKEN_TYPE")

    def test_malformed_token_returns_401(self):
        resp = self.client.get(
            "/djangoapp/get_dealers",
            HTTP_AUTHORIZATION="Bearer this.is.garbage",
        )
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json()["error"]["code"], "INVALID_TOKEN")

    def test_missing_bearer_prefix_returns_401(self):
        tokens = issue_tokens(self.customer)
        resp = self.client.post(
            "/djangoapp/add_review",
            json_body(REVIEW_PAYLOAD),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {tokens['access']}",  # wrong scheme
        )
        self.assertEqual(resp.status_code, 401)
