from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from apps.authentication.models import IdentityAuditSource, Role
from apps.authentication.roles import core_technical_roles
from apps.authentication.services.identity_service import IdentityService


class Command(BaseCommand):
    help = "Sincroniza y asegura que los roles técnicos base (como CMS_Admin) existan en el catálogo y en Django Groups."

    def handle(self, *args, **options):
        # Asegurar primero que existan los roles técnicos fundamentales de la app
        for role_name in core_technical_roles():
            IdentityService.ensure_technical_role(
                role_name,
                source=IdentityAuditSource.LOCAL,
            )

        # Sincronizar cualquier otro grupo de Django existente
        created = 0
        relinked = 0
        for group in Group.objects.all():
            role = Role.objects.filter(display_name=group.name).first()
            if role is None:
                IdentityService.ensure_technical_role(
                    group.name,
                    source=IdentityAuditSource.LOCAL,
                )
                created += 1
            elif role.technical_group_id is None:
                IdentityService.ensure_technical_role(
                    group.name,
                    source=IdentityAuditSource.LOCAL,
                )
                relinked += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Catálogo de roles sincronizado: base verificada, {created} creados, {relinked} vinculados."
            )
        )
