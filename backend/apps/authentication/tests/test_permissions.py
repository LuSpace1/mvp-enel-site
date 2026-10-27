from django.contrib.auth.models import Group
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory

from apps.authentication.models import Role, User
from apps.authentication.permissions import (
    HasScimAccess,
    IsPortalAdmin,
    is_portal_admin,
    user_has_group,
)
from apps.authentication.roles import admin_role_name
from apps.authentication.views import MeView


class PortalPermissionTests(TestCase):
    def setUp(self):
        self.group = Group.objects.create(name=admin_role_name())
        self.admin = User.objects.create_user(username="A100001", password="x")
        self.user = User.objects.create_user(username="A300003", password="x")
        self.admin.groups.add(self.group)

    def test_superuser_is_admin_without_group(self):
        self.user.is_superuser = True
        self.user.save(update_fields=["is_superuser"])
        self.assertTrue(is_portal_admin(self.user))

    def test_admin_requires_group(self):
        self.assertTrue(is_portal_admin(self.admin))
        self.assertFalse(is_portal_admin(self.user))

    def test_user_has_group_rejects_inactive_catalog_role(self):
        Role.objects.create(
            display_name=admin_role_name(),
            technical_group=self.group,
            is_active=False,
        )
        self.assertFalse(user_has_group(self.admin, [admin_role_name()]))
        self.assertFalse(is_portal_admin(self.admin))

    @override_settings(PORTAL_ADMIN_ROLE="Custom_Admin")
    def test_admin_role_name_is_configurable(self):
        custom_group = Group.objects.create(name="Custom_Admin")
        self.user.groups.add(custom_group)
        self.assertTrue(is_portal_admin(self.user))
        self.assertFalse(is_portal_admin(self.admin))

    def test_is_portal_admin_permission(self):
        factory = APIRequestFactory()
        request = factory.get("/api/auth/me/")
        request.user = self.admin
        self.assertTrue(IsPortalAdmin().has_permission(request, MeView()))
        anonymous = factory.get("/api/auth/me/")
        anonymous.user = None
        self.assertFalse(IsPortalAdmin().has_permission(anonymous, MeView()))

    def test_scim_access_requires_admin_or_scim_scope(self):
        factory = APIRequestFactory()
        request = factory.get("/api/scim/v2/Users")
        request.user = self.user
        request.auth = None
        self.assertFalse(HasScimAccess().has_permission(request, object()))

        request.user = self.admin
        self.assertTrue(HasScimAccess().has_permission(request, object()))

        class Token:
            scope = "scim"

        request.auth = Token()
        request.user = None
        self.assertTrue(HasScimAccess().has_permission(request, object()))

        request.auth = type("Token", (), {"scope": "read"})()
        self.assertFalse(HasScimAccess().has_permission(request, object()))
