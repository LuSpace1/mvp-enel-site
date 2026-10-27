from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import IdentityAuditLog, User
from apps.authentication.roles import admin_role_name
from apps.authentication.services.identity_service import IdentityService


class AuthenticationTests(TestCase):
    """Login humano por JWT, perfil y consultas de usuarios."""

    def setUp(self):
        self.client = APIClient()
        self.admin_group = Group.objects.create(name=admin_role_name())
        self.admin = User.objects.create_user(
            username="A100001",
            password="AdminLocal2026!",
            first_name="Admin",
            last_name="Portal",
            email="admin@example.com",
        )
        self.admin.groups.add(self.admin_group)

        self.user = User.objects.create_user(
            username="A300003",
            password="UsuarioLocal2026!",
            first_name="Carlos",
            last_name="Mendoza",
            email="carlos@example.com",
        )

    def test_login_success_returns_tokens_and_profile(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "A300003", "password": "UsuarioLocal2026!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "A300003")
        self.assertEqual(response.data["user"]["roles"], [])

    def test_admin_login_exposes_proposed_role(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "A100001", "password": "AdminLocal2026!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["roles"], [admin_role_name()])

    def test_login_invalid_credentials(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "A300003", "password": "Incorrecta"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_of_deactivated_user_is_rejected(self):
        IdentityService.deactivate_user(self.user)
        response = self.client.post(
            "/api/auth/login/",
            {"username": "A300003", "password": "UsuarioLocal2026!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn("access", response.data)

    def test_token_of_deactivated_user_is_rejected_on_next_request(self):
        login = self.client.post(
            "/api/auth/login/",
            {"username": "A300003", "password": "UsuarioLocal2026!"},
            format="json",
        )
        token = login.data["access"]
        IdentityService.deactivate_user(self.user)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "A100001")
        self.assertEqual(response.data["roles"], [admin_role_name()])

    def test_me_endpoint_unauthenticated(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_list_is_admin_only(self):
        self.client.force_authenticate(user=self.user)
        forbidden = self.client.get("/api/auth/users/")
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        allowed = self.client.get("/api/auth/users/")
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertIn("results", allowed.data)
        usernames = [item["username"] for item in allowed.data["results"]]
        self.assertIn("A100001", usernames)
        self.assertIn("A300003", usernames)

    def test_current_is_available_to_authenticated_users(self):
        self.client.force_authenticate(user=self.user)
        current = self.client.get("/api/auth/users/current/")
        self.assertEqual(current.status_code, status.HTTP_200_OK)
        self.assertEqual(current.data["username"], "A300003")

    def test_identity_audit_is_admin_only(self):
        IdentityService.provision_user({"userName": "A400001"})
        self.client.force_authenticate(user=self.user)
        forbidden = self.client.get("/api/auth/identity-audit/")
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        allowed = self.client.get("/api/auth/identity-audit/")
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(allowed.data["count"], 1)

    def test_refresh_rotation_invalidates_previous_token(self):
        login = self.client.post(
            "/api/auth/login/",
            {"username": "A300003", "password": "UsuarioLocal2026!"},
            format="json",
        )
        original_refresh = login.data["refresh"]

        rotated = self.client.post(
            "/api/auth/token/refresh/", {"refresh": original_refresh}, format="json"
        )
        self.assertEqual(rotated.status_code, status.HTTP_200_OK)
        self.assertIn("refresh", rotated.data)

        replay = self.client.post(
            "/api/auth/token/refresh/", {"refresh": original_refresh}, format="json"
        )
        self.assertEqual(replay.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_anonymous_registration_or_password_recovery_routes(self):
        for path in (
            "/api/auth/anonymous/",
            "/api/auth/register/",
            "/api/auth/password-reset/",
            "/api/auth/password/reset/",
        ):
            response = self.client.post(path, {}, format="json")
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, path)

    def test_login_writes_no_identity_audit_log(self):
        before = IdentityAuditLog.objects.count()
        self.client.post(
            "/api/auth/login/",
            {"username": "A300003", "password": "UsuarioLocal2026!"},
            format="json",
        )
        self.assertEqual(IdentityAuditLog.objects.count(), before)
