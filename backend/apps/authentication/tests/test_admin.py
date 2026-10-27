from django.contrib import admin as django_admin
from django.test import RequestFactory, TestCase

from apps.authentication.admin import UserAdmin
from apps.authentication.models import (
    IdentityAuditAction,
    IdentityAuditLog,
    IdentityAuditSource,
    User,
)


class AdminIdentityMutationsTests(TestCase):
    """El Admin delega perfil, estado y roles a la Service Layer y deja auditoria local."""

    def setUp(self):
        self.actor = User.objects.create_superuser(
            username="A100001",
            email="admin@example.com",
            password="AdminLocal2026!",
        )
        self.target = User.objects.create_user(
            username="A300003",
            password="x",
            first_name="Viejo",
            last_name="Apellido",
            email="viejo@example.com",
        )
        self.user_admin = UserAdmin(User, django_admin.site)
        self.request = RequestFactory().post("/django-admin/authentication/user/")
        self.request.user = self.actor

    def test_admin_user_creation_uses_service_and_audits_local(self):
        user = User(username="A300009", email="nuevo@example.com")
        user.set_password("LocalBootstrap2026!")

        self.user_admin.save_model(self.request, user, object(), change=False)

        self.assertTrue(User.objects.filter(username="A300009").exists())
        log = IdentityAuditLog.objects.get(
            target_user=user,
            action=IdentityAuditAction.USER_PROVISIONED,
        )
        self.assertEqual(log.source, IdentityAuditSource.LOCAL)
        self.assertEqual(log.actor, self.actor)

    def test_admin_profile_change_is_applied_and_audited(self):
        self.target.first_name = "Nuevo"
        self.target.email = "nuevo@example.com"

        self.user_admin.save_model(self.request, self.target, object(), change=True)

        self.target.refresh_from_db()
        self.assertEqual(self.target.first_name, "Nuevo")
        self.assertEqual(self.target.email, "nuevo@example.com")
        log = IdentityAuditLog.objects.get(
            target_user=self.target,
            action=IdentityAuditAction.USER_UPDATED,
        )
        self.assertEqual(log.source, IdentityAuditSource.LOCAL)
        self.assertEqual(log.actor, self.actor)
        self.assertIn("first_name", log.detail)
        self.assertIn("email", log.detail)

    def test_admin_status_change_is_applied_and_audited(self):
        self.target.is_active = False

        self.user_admin.save_model(self.request, self.target, object(), change=True)

        self.target.refresh_from_db()
        self.assertFalse(self.target.is_active)
        log = IdentityAuditLog.objects.get(
            target_user=self.target,
            action=IdentityAuditAction.USER_DEACTIVATED,
        )
        self.assertEqual(log.source, IdentityAuditSource.LOCAL)
        self.assertEqual(log.actor, self.actor)

    def test_admin_cannot_delete_users(self):
        self.assertFalse(
            self.user_admin.has_delete_permission(self.request, self.target)
        )
