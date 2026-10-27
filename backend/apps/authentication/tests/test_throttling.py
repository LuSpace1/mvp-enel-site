from django.contrib.auth.models import Group
from django.core.cache import cache
from django.test import TestCase, override_settings
from oauth2_provider.models import Application
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.authentication.roles import admin_role_name


@override_settings(LOGIN_THROTTLE_RATE="2/min")
class LoginThrottleTests(TestCase):
    """El login se bloquea (429) al superar el limite de intentos por IP."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        cache.clear()

    def test_login_is_throttled_after_limit(self):
        payload = {"username": "A400001", "password": "incorrecta"}

        for _ in range(2):
            response = self.client.post("/api/auth/login/", payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        blocked = self.client.post("/api/auth/login/", payload, format="json")
        self.assertEqual(blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


@override_settings(SCIM_THROTTLE_RATE="2/min")
class ScimThrottleTests(TestCase):
    """El conector SCIM se bloquea (429) al superar el limite configurado."""

    def setUp(self):
        cache.clear()
        admin_group = Group.objects.create(name=admin_role_name())
        self.admin = User.objects.create_user(username="A100001", password="x")
        self.admin.groups.add(admin_group)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def tearDown(self):
        cache.clear()

    def test_scim_is_throttled_after_limit(self):
        for _ in range(2):
            response = self.client.get("/api/scim/v2/Users")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        blocked = self.client.get("/api/scim/v2/Users")
        self.assertEqual(blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


@override_settings(OAUTH_TOKEN_THROTTLE_RATE="2/min")
class OAuthTokenThrottleTests(TestCase):
    """El endpoint OAuth2 de token limita (429) por cliente o IP."""

    def setUp(self):
        cache.clear()
        self.application = Application.objects.create(
            name="CompAC Sandbox",
            client_type=Application.CLIENT_CONFIDENTIAL,
            authorization_grant_type=Application.GRANT_CLIENT_CREDENTIALS,
            client_secret="compac-test-secret",
        )
        self.client = APIClient()

    def tearDown(self):
        cache.clear()

    def _request_token(self, path="/o/token/"):
        return self.client.post(
            path,
            {
                "grant_type": "client_credentials",
                "client_id": self.application.client_id,
                "client_secret": "compac-test-secret",
                "scope": "scim",
            },
        )

    def test_token_endpoint_is_throttled_after_limit(self):
        self.assertEqual(self._request_token().status_code, status.HTTP_200_OK)
        self.assertEqual(self._request_token().status_code, status.HTTP_200_OK)

        blocked = self._request_token()

        self.assertEqual(blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("Retry-After", blocked)

    def test_token_alias_shares_the_same_limit(self):
        self.assertEqual(self._request_token("/token/").status_code, status.HTTP_200_OK)
        self.assertEqual(
            self._request_token("/o/token/").status_code, status.HTTP_200_OK
        )

        blocked = self._request_token("/token/")
        self.assertEqual(blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
