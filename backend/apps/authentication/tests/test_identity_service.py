from io import StringIO

from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase, override_settings

from apps.authentication.models import (
    IdentityAuditAction,
    IdentityAuditLog,
    IdentityAuditSource,
    Role,
    User,
)
from apps.authentication.permissions import is_portal_admin, user_has_group
from apps.authentication.roles import admin_role_name
from apps.authentication.services.identity_service import (
    IdentityError,
    IdentityService,
    UserAlreadyExistsError,
)


class IdentityServiceTests(TestCase):
    """Service Layer de identidad: aprovisionamiento, estado, roles y auditoria."""

    def setUp(self):
        self.role_name = admin_role_name()
        self.admin_group = Group.objects.create(name=self.role_name)
        self.admin = User.objects.create_user(
            username="A100001", password="AdminLocal2026!"
        )

    def test_provision_user_creates_with_unusable_password(self):
        user = IdentityService.provision_user(
            {
                "userName": "A300003",
                "name": {"givenName": "Carlos", "familyName": "Mendoza"},
                "emails": [{"value": "carlos.mendoza@enel.com"}],
                "active": True,
            }
        )

        self.assertEqual(user.username, "A300003")
        self.assertEqual(user.first_name, "Carlos")
        self.assertEqual(user.last_name, "Mendoza")
        self.assertEqual(user.email, "carlos.mendoza@enel.com")
        self.assertEqual(user.enel_id, "A300003")
        self.assertFalse(user.has_usable_password())
        self.assertTrue(
            IdentityAuditLog.objects.filter(
                target_user=user, action=IdentityAuditAction.USER_PROVISIONED
            ).exists()
        )

    def test_provision_user_rejects_invalid_corporate_id(self):
        for username in ("pepito123", "A12345", "A1234567", ""):
            with self.assertRaises(IdentityError):
                IdentityService.provision_user({"userName": username})
        self.assertFalse(
            User.objects.filter(
                username__in=["pepito123", "A12345", "A1234567", ""]
            ).exists()
        )

    def test_provision_duplicate_raises(self):
        User.objects.create_user(username="A300003", password="x")
        with self.assertRaises(UserAlreadyExistsError):
            IdentityService.provision_user({"userName": "A300003"})

    def test_provision_accepts_text_false_as_inactive(self):
        user = IdentityService.provision_user(
            {"userName": "A300003", "active": "false"}
        )
        self.assertFalse(user.is_active)

    def test_provision_uses_external_id_as_enel_id(self):
        user = IdentityService.provision_user(
            {"userName": "A300003", "externalId": "EXT-0099"}
        )
        self.assertEqual(user.enel_id, "EXT-0099")

    def test_update_user_changes_allowed_fields_and_state(self):
        user = IdentityService.provision_user({"userName": "A300003"})
        IdentityService.update_user(
            user,
            {
                "name": {"givenName": "Ana", "familyName": "Rojas"},
                "emails": [{"value": "ana.rojas@enel.com"}],
                "active": False,
            },
        )
        user.refresh_from_db()
        self.assertEqual(user.first_name, "Ana")
        self.assertEqual(user.last_name, "Rojas")
        self.assertEqual(user.email, "ana.rojas@enel.com")
        self.assertFalse(user.is_active)
        actions = set(
            IdentityAuditLog.objects.filter(target_user=user).values_list(
                "action", flat=True
            )
        )
        self.assertIn(IdentityAuditAction.USER_UPDATED, actions)
        self.assertIn(IdentityAuditAction.USER_DEACTIVATED, actions)

    def test_update_user_ignores_username_and_password(self):
        user = IdentityService.provision_user({"userName": "A300003"})
        IdentityService.update_user(
            user,
            {
                "userName": "A999999",
                "password": "IntentoDeCambio1!",
                "name": {"givenName": "Ana"},
                "active": True,
            },
        )
        user.refresh_from_db()
        self.assertEqual(user.username, "A300003")
        self.assertEqual(user.first_name, "Ana")
        self.assertFalse(user.has_usable_password())

    def test_put_can_clear_optional_attributes(self):
        user = IdentityService.provision_user(
            {
                "userName": "A300003",
                "name": {"givenName": "Ana"},
                "emails": [{"value": "ana@enel.com"}],
            }
        )
        IdentityService.update_user(
            user, {"name": {"givenName": "", "familyName": ""}, "emails": []}
        )
        user.refresh_from_db()
        self.assertEqual(user.first_name, "")
        self.assertEqual(user.last_name, "")
        self.assertEqual(user.email, "")

    def test_ensure_technical_role_creates_group_and_catalog(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba")
        self.assertEqual(role.display_name, "Grupo_Prueba")
        self.assertTrue(Group.objects.filter(name="Grupo_Prueba").exists())
        self.assertEqual(role.technical_group.name, "Grupo_Prueba")
        # Es idempotente: no duplica el rol ni el grupo.
        again = IdentityService.ensure_technical_role("Grupo_Prueba")
        self.assertEqual(role.id, again.id)
        self.assertEqual(Role.objects.filter(display_name="Grupo_Prueba").count(), 1)

    def test_assign_and_remove_role_are_audited(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba")
        IdentityService.assign_technical_role(self.admin, role, actor=self.admin)

        self.assertTrue(self.admin.groups.filter(name="Grupo_Prueba").exists())
        self.assertTrue(
            IdentityAuditLog.objects.filter(
                target_user=self.admin,
                action=IdentityAuditAction.ROLE_ASSIGNED,
                source=IdentityAuditSource.SCIM,
            ).exists()
        )

        IdentityService.remove_technical_role(self.admin, role, actor=self.admin)
        self.assertFalse(self.admin.groups.filter(name="Grupo_Prueba").exists())
        self.assertTrue(
            IdentityAuditLog.objects.filter(
                target_user=self.admin,
                action=IdentityAuditAction.ROLE_REMOVED,
                source=IdentityAuditSource.SCIM,
            ).exists()
        )

    def test_assigning_same_role_twice_does_not_duplicate_audit(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba")
        IdentityService.assign_technical_role(self.admin, role)
        IdentityService.assign_technical_role(self.admin, role)
        self.assertEqual(
            IdentityAuditLog.objects.filter(
                target_user=self.admin,
                action=IdentityAuditAction.ROLE_ASSIGNED,
            ).count(),
            1,
        )

    @override_settings(SCIM_ALLOWED_GROUPS=["Grupo_Prueba"])
    def test_scim_group_allowlist_keeps_admin_role_allowed(self):
        self.assertTrue(IdentityService.is_role_allowed(admin_role_name()))
        self.assertTrue(IdentityService.is_role_allowed("Grupo_Prueba"))
        self.assertFalse(IdentityService.is_role_allowed("Grupo_No_Permitido"))

    def test_deactivated_role_does_not_grant_permission(self):
        self.admin.groups.add(self.admin_group)
        self.assertTrue(is_portal_admin(self.admin))

        Role.objects.create(
            display_name=self.role_name,
            technical_group=self.admin_group,
            is_active=False,
        )

        self.assertFalse(is_portal_admin(self.admin))
        self.assertFalse(user_has_group(self.admin, [self.role_name]))
        # La membresia sigue existiendo: la defensa es el catalogo inactivo.
        self.assertTrue(self.admin.groups.filter(name=self.role_name).exists())

    def test_group_without_catalog_entry_still_counts_during_transition(self):
        self.admin.groups.add(self.admin_group)
        self.assertFalse(Role.objects.filter(display_name=self.role_name).exists())
        self.assertTrue(is_portal_admin(self.admin))

    def test_deactivate_user_is_logical_and_audited(self):
        user = IdentityService.provision_user({"userName": "A300003"})
        IdentityService.deactivate_user(user, actor=self.admin)
        user.refresh_from_db()
        self.assertFalse(user.is_active)
        self.assertTrue(User.objects.filter(id=user.id).exists())
        self.assertTrue(
            IdentityAuditLog.objects.filter(
                target_user=user,
                action=IdentityAuditAction.USER_DEACTIVATED,
                source=IdentityAuditSource.SCIM,
            ).exists()
        )

    def test_local_group_creation_and_deletion_are_audited(self):
        group = Group.objects.create(name="Grupo_Prueba_Local")
        created = IdentityAuditLog.objects.filter(
            detail__contains="Grupo creado"
        ).first()
        self.assertIsNotNone(created)
        self.assertEqual(created.source, IdentityAuditSource.LOCAL)

        group.delete()
        removed = IdentityAuditLog.objects.filter(
            detail__contains="Grupo eliminado"
        ).first()
        self.assertIsNotNone(removed)
        self.assertEqual(removed.source, IdentityAuditSource.LOCAL)

    def test_local_group_change_is_audited_as_local(self):
        user = User.objects.create_user(username="A300003", password="x")
        user.groups.add(self.admin_group)

        log = IdentityAuditLog.objects.get(target_user=user)
        self.assertEqual(log.action, IdentityAuditAction.LOCAL_PERMISSION_CHANGE)
        self.assertEqual(log.source, IdentityAuditSource.LOCAL)
        self.assertIn(self.role_name, log.detail)

    def test_service_does_not_duplicate_local_group_audit(self):
        user = User.objects.create_user(username="A300003", password="x")
        role = IdentityService.ensure_technical_role("Grupo_Prueba")
        IdentityService.assign_technical_role(user, role)

        logs = IdentityAuditLog.objects.filter(target_user=user)
        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs.first().source, IdentityAuditSource.SCIM)

    def test_sync_roles_catalogs_existing_groups_without_creating_roles(self):
        Group.objects.create(name="Grupo_Prueba_Sync")
        call_command("sync_roles", stdout=StringIO())

        role = Role.objects.get(display_name="Grupo_Prueba_Sync")
        self.assertEqual(role.technical_group.name, "Grupo_Prueba_Sync")
        # No se crean grupos ni roles adicionales por si solo.
        self.assertFalse(Group.objects.filter(name="Rol_Inventado").exists())

    def test_audit_log_is_append_only(self):
        user = IdentityService.provision_user({"userName": "A300003"})
        log = IdentityAuditLog.objects.get(target_user=user)

        with self.assertRaises(ValidationError):
            log.detail = "alterado"
            log.save()
        with self.assertRaises(ValidationError):
            log.delete()
        with self.assertRaises(ValidationError):
            IdentityAuditLog.objects.filter(pk=log.pk).update(detail="alterado")
        with self.assertRaises(ValidationError):
            IdentityAuditLog.objects.all().delete()

        log.refresh_from_db()
        self.assertNotEqual(log.detail, "alterado")
