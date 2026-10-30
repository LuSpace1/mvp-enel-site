from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import ContentRevision
from .services import (
    RevisionConflict,
    discard_draft,
    ensure_draft,
    ensure_published,
    list_versions,
    publish,
    restore_revision,
    save_draft,
)


class VersioningTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="editor", password="test"
        )

    def _publicar(self) -> ContentRevision:
        draft = ensure_draft(self.user)
        return publish(self.user, expected_lock_version=draft.lock_version)

    def test_publicacion_inicial_es_v1(self):
        published = ensure_published()

        self.assertEqual(published.version_number, 1)
        self.assertTrue(published.is_current)

    def test_guardar_borrador_no_consume_versiones(self):
        published = ensure_published()
        draft = ensure_draft(self.user)

        for _ in range(3):
            draft = save_draft(self.user, draft.payload, draft.lock_version)

        self.assertEqual(draft.lock_version, 4)
        self.assertEqual(
            ContentRevision.objects.filter(status="PUBLISHED").count(), 1
        )
        self.assertEqual(ensure_published().version_number, 1)
        self.assertEqual(published.version_number, 1)

    def test_publicar_asigna_numeros_secuenciales(self):
        self._publicar()
        self._publicar()

        numeros = list(
            ContentRevision.objects.filter(status="PUBLISHED")
            .order_by("version_number")
            .values_list("version_number", flat=True)
        )
        self.assertEqual(numeros, [1, 2, 3])

        vigentes = ContentRevision.objects.filter(is_current=True)
        self.assertEqual(vigentes.count(), 1)
        self.assertEqual(vigentes.get().version_number, 3)

    def test_borrador_no_aparece_en_versiones(self):
        self._publicar()
        ensure_draft(self.user)

        versiones = list(list_versions())

        self.assertTrue(versiones)
        self.assertTrue(all(v.status == "PUBLISHED" for v in versiones))

    def test_restaurar_publica_version_nueva(self):
        v1 = ensure_published()
        v2 = self._publicar()

        draft = restore_revision(self.user, v1)
        v3 = publish(self.user, expected_lock_version=draft.lock_version)

        self.assertEqual(
            [v1.version_number, v2.version_number, v3.version_number], [1, 2, 3]
        )
        self.assertEqual(v3.payload, v1.payload)
        self.assertTrue(v3.is_current)
        self.assertFalse(ContentRevision.objects.get(pk=v2.pk).is_current)

    def test_no_restaura_la_version_vigente(self):
        vigente = ensure_published()

        with self.assertRaises(RevisionConflict):
            restore_revision(self.user, vigente)

    def test_lock_version_obsoleto_no_pisa_el_borrador(self):
        draft = ensure_draft(self.user)

        with self.assertRaises(RevisionConflict):
            save_draft(self.user, draft.payload, draft.lock_version + 10)

    def test_descartar_vuelve_a_la_version_vigente(self):
        published = ensure_published()
        draft = ensure_draft(self.user)
        payload = draft.payload
        payload["sections"]["portada"]["titulo_destacado"] = "Cambio temporal"
        draft = save_draft(self.user, payload, draft.lock_version)

        self.assertNotEqual(draft.payload, published.payload)

        draft = discard_draft(self.user)

        self.assertEqual(draft.payload, published.payload)
        self.assertGreater(draft.lock_version, 1)


class CmsApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="root", password="test"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_flujo_publicar_crea_version_nueva(self):
        respuesta = self.client.get("/api/cms/admin/content/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertIsNone(respuesta.data["draft"])
        self.assertEqual(respuesta.data["published"]["number"], 1)

        respuesta = self.client.post("/api/cms/admin/content/editing/")
        self.assertEqual(respuesta.status_code, 201)
        draft = respuesta.data["draft"]
        self.assertEqual(draft["lock_version"], 1)
        self.assertIsNone(draft["number"])

        respuesta = self.client.put(
            "/api/cms/admin/content/",
            {"payload": draft["payload"], "lock_version": 1},
            format="json",
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["draft"]["lock_version"], 2)

        respuesta = self.client.post(
            "/api/cms/admin/publish/",
            {"lock_version": 2, "message": "Prueba de version"},
            format="json",
        )
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data["published"]["number"], 2)
        self.assertIsNone(respuesta.data["draft"])

        respuesta = self.client.get("/api/cms/admin/revisions/")
        self.assertEqual(respuesta.status_code, 200)
        numeros = [revision["number"] for revision in respuesta.data["results"]]
        vigentes = [revision["is_current"] for revision in respuesta.data["results"]]
        self.assertEqual(numeros, [2, 1])
        self.assertEqual(vigentes, [True, False])

    def test_conflicto_de_lock_version(self):
        draft = self.client.post("/api/cms/admin/content/editing/").data["draft"]

        respuesta = self.client.put(
            "/api/cms/admin/content/",
            {"payload": draft["payload"], "lock_version": 99},
            format="json",
        )

        self.assertEqual(respuesta.status_code, 409)
        self.assertEqual(respuesta.data["code"], "revision_conflict")
        self.assertEqual(respuesta.data["current_lock_version"], 1)
