from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from apps.authentication.models import IdentityAuditSource, Role
from apps.authentication.services.identity_service import IdentityService


class Command(BaseCommand):
    help = (
        "Sincroniza los Django Groups existentes con el catalogo Role (rol tecnico). "
        "No crea grupos nuevos: solo cataloga los que ya existen."
    )

    def handle(self, *args, **options):
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
                f"Catalogo de roles sincronizado: {created} creados, {relinked} vinculados."
            )
        )
