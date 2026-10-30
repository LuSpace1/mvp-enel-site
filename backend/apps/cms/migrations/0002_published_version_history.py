from django.db import migrations, models


def forwards(apps, schema_editor):
    """Convierte el historial previo en versiones publicadas numeradas."""
    ContentRevision = apps.get_model("cms", "ContentRevision")
    ContentVersionSequence = apps.get_model("cms", "ContentVersionSequence")

    historicas = list(
        ContentRevision.objects.exclude(status="DRAFT").order_by(
            "published_at", "created_at"
        )
    )
    for indice, revision in enumerate(historicas, start=1):
        payload = revision.payload or {}
        payload.pop("version", None)
        revision.status = "PUBLISHED"
        revision.version_number = indice
        revision.is_current = indice == len(historicas)
        revision.lock_version = 1
        revision.payload = payload
        revision.save(
            update_fields=[
                "status",
                "version_number",
                "is_current",
                "lock_version",
                "payload",
            ]
        )

    for draft in ContentRevision.objects.filter(status="DRAFT"):
        payload = draft.payload or {}
        payload.pop("version", None)
        draft.lock_version = getattr(draft, "version", 1) or 1
        draft.version_number = None
        draft.is_current = False
        draft.payload = payload
        draft.save(
            update_fields=[
                "lock_version",
                "version_number",
                "is_current",
                "payload",
            ]
        )

    ContentVersionSequence.objects.update_or_create(
        pk=1, defaults={"next_number": len(historicas) + 1}
    )


def backwards(apps, schema_editor):
    """Reconstruye el contador antiguo a partir del numero de version."""
    ContentRevision = apps.get_model("cms", "ContentRevision")
    for revision in ContentRevision.objects.all():
        revision.version = revision.version_number or revision.lock_version or 1
        revision.save(update_fields=["version"])


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0001_initial"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="contentrevision",
            name="cms_unique_published_revision",
        ),
        migrations.AddField(
            model_name="contentrevision",
            name="lock_version",
            field=models.PositiveIntegerField(
                default=1,
                help_text="Contador optimista del borrador; no es una version publicada.",
                verbose_name="Version de bloqueo",
            ),
        ),
        migrations.AddField(
            model_name="contentrevision",
            name="version_number",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Solo las publicaciones tienen numero de version.",
                null=True,
                unique=True,
                verbose_name="Numero de version",
            ),
        ),
        migrations.AddField(
            model_name="contentrevision",
            name="is_current",
            field=models.BooleanField(default=False, verbose_name="Vigente"),
        ),
        migrations.AlterField(
            model_name="contentrevision",
            name="status",
            field=models.CharField(
                choices=[("DRAFT", "Borrador"), ("PUBLISHED", "Publicada")],
                db_index=True,
                default="DRAFT",
                max_length=20,
                verbose_name="Estado",
            ),
        ),
        migrations.CreateModel(
            name="ContentVersionSequence",
            fields=[
                (
                    "id",
                    models.PositiveSmallIntegerField(
                        default=1,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "next_number",
                    models.PositiveIntegerField(
                        default=1, verbose_name="Proximo numero de version"
                    ),
                ),
            ],
            options={
                "verbose_name": "Secuencia de versiones",
                "verbose_name_plural": "Secuencia de versiones",
            },
        ),
        migrations.RunPython(forwards, backwards),
        migrations.AddIndex(
            model_name="contentrevision",
            index=models.Index(
                fields=["status", "-version_number"],
                name="cms_revision_version_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="contentrevision",
            constraint=models.UniqueConstraint(
                condition=models.Q(is_current=True),
                fields=("is_current",),
                name="cms_unique_current_version",
            ),
        ),
        migrations.RemoveField(
            model_name="contentrevision",
            name="version",
        ),
    ]
