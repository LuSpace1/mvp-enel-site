import copy

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

    def test_organigrama_incluye_estructura_editable(self):
        organigrama = ensure_published().payload["sections"]["organigrama"]

        self.assertEqual(organigrama["gerente"][0]["nombre"], "Paolo Leidi")
        self.assertTrue(organigrama["gerente"][0]["video_youtube_url"])
        self.assertEqual(len(organigrama["subgerencias"]), 4)
        self.assertEqual(
            organigrama["subgerencias"][0]["areas"][0]["nombre"], "Health & Safety"
        )
        self.assertTrue(organigrama["subgerencias"][0]["video_youtube_url"])
        self.assertEqual(len(organigrama["areas_staff"]), 4)
        self.assertTrue(organigrama["areas_staff"][0]["detalle"][0]["texto"])

    def test_organigrama_permite_editar_fotos_videos_y_areas(self):
        draft = ensure_draft(self.user)
        subgerencia = draft.payload["sections"]["organigrama"]["subgerencias"][0]
        subgerencia["foto"] = "https://example.com/foto.jpg"
        subgerencia["video_youtube_url"] = "https://youtu.be/dQw4w9WgXcQ"
        subgerencia["video_titulo"] = "Nuevo video"
        subgerencia["areas"] = [{"nombre": "Nueva área"}]

        draft = save_draft(self.user, draft.payload, draft.lock_version)
        guardada = draft.payload["sections"]["organigrama"]["subgerencias"][0]

        self.assertEqual(guardada["foto"], "https://example.com/foto.jpg")
        self.assertEqual(guardada["video_youtube_url"], "https://youtu.be/dQw4w9WgXcQ")
        self.assertEqual(guardada["video_titulo"], "Nuevo video")
        self.assertEqual(guardada["areas"], [{"nombre": "Nueva área"}])

    def test_cadena_incluye_etapas_editables(self):
        cadena = ensure_published().payload["sections"]["cadena"]

        self.assertEqual(len(cadena["etapas"]), 6)
        primera = cadena["etapas"][0]
        self.assertEqual(primera["clave"], "customer")
        self.assertTrue(primera["procesos"])
        self.assertEqual(primera["imagen"], "")

    def test_cadena_permite_editar_imagen_y_procesos(self):
        draft = ensure_draft(self.user)
        etapa = draft.payload["sections"]["cadena"]["etapas"][0]
        etapa["imagen"] = "https://example.com/cadena.jpg"
        etapa["titulo"] = "Customer Management editado"
        etapa["procesos"].append(
            {"titulo": "Nuevo proceso", "descripcion": "Descripción del proceso"}
        )

        draft = save_draft(self.user, draft.payload, draft.lock_version)
        guardada = draft.payload["sections"]["cadena"]["etapas"][0]

        self.assertEqual(guardada["imagen"], "https://example.com/cadena.jpg")
        self.assertEqual(guardada["titulo"], "Customer Management editado")
        self.assertEqual(guardada["procesos"][-1]["titulo"], "Nuevo proceso")

    def test_espacios_incluye_galeria_editable(self):
        espacios = ensure_published().payload["sections"]["espacios"]

        self.assertIn("galeria", espacios["instalaciones"][0])
        self.assertEqual(espacios["instalaciones"][0]["galeria"], [])

    def test_espacios_permite_editar_galeria(self):
        draft = ensure_draft(self.user)
        instalacion = draft.payload["sections"]["espacios"]["instalaciones"][0]
        instalacion["galeria"] = [
            {
                "imagen": "https://example.com/foto.jpg",
                "titulo": "Fachada",
                "descripcion": "Acceso principal",
            }
        ]

        draft = save_draft(self.user, draft.payload, draft.lock_version)
        guardada = draft.payload["sections"]["espacios"]["instalaciones"][0]

        self.assertEqual(guardada["galeria"][0]["titulo"], "Fachada")
        self.assertEqual(guardada["galeria"][0]["imagen"], "https://example.com/foto.jpg")

    def test_cierre_incluye_footer_y_redes(self):
        cierre = ensure_published().payload["sections"]["cierre"]

        self.assertEqual(cierre["footer_texto"], "Enel Distribución Chile")
        self.assertEqual(len(cierre["redes"]), 5)
        self.assertEqual(cierre["redes"][0]["red"], "x")

    def test_cierre_permite_editar_footer_y_redes(self):
        draft = ensure_draft(self.user)
        cierre = draft.payload["sections"]["cierre"]
        cierre["footer_texto"] = "Portal Enel"
        cierre["redes"][0]["url"] = "https://example.com/red"

        draft = save_draft(self.user, draft.payload, draft.lock_version)
        guardado = draft.payload["sections"]["cierre"]

        self.assertEqual(guardado["footer_texto"], "Portal Enel")
        self.assertEqual(guardado["redes"][0]["url"], "https://example.com/red")

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

    def test_schema_expone_campos_editables_del_organigrama(self):
        respuesta = self.client.get("/api/cms/admin/schema/")

        self.assertEqual(respuesta.status_code, 200)
        organigrama = next(
            section
            for section in respuesta.data["sections"]
            if section["key"] == "organigrama"
        )
        campos = {field["key"]: field for field in organigrama["fields"]}
        self.assertIn("gerente", campos)
        self.assertIn("subgerencias", campos)
        self.assertIn("areas_staff", campos)

        subgerencia = {field["key"]: field for field in campos["subgerencias"]["item_fields"]}
        self.assertEqual(subgerencia["foto"]["type"], "image")
        self.assertEqual(subgerencia["video_youtube_url"]["type"], "youtube")
        self.assertIn("areas", subgerencia)

    def test_schema_expone_etapas_galeria_y_redes(self):
        respuesta = self.client.get("/api/cms/admin/schema/")

        self.assertEqual(respuesta.status_code, 200)
        secciones = {seccion["key"]: seccion for seccion in respuesta.data["sections"]}
        campos = {
            clave: {field["key"]: field for field in seccion["fields"]}
            for clave, seccion in secciones.items()
        }

        self.assertIn("titulo_prefijo", campos["portada"])
        self.assertIn("etapas", campos["cadena"])
        self.assertIn("portal_kicker", campos["politicas"])
        self.assertIn("footer_texto", campos["cierre"])
        self.assertIn("redes", campos["cierre"])

        self.assertEqual(campos["cadena"]["etapas"]["add_label"], "Agregar etapa")
        etapa = {field["key"]: field for field in campos["cadena"]["etapas"]["item_fields"]}
        self.assertEqual(etapa["imagen"]["type"], "image")
        self.assertEqual(etapa["procesos"]["type"], "list")

        instalacion = {
            field["key"]: field for field in campos["espacios"]["instalaciones"]["item_fields"]
        }
        self.assertEqual(instalacion["galeria"]["type"], "list")
        self.assertEqual(instalacion["galeria"]["add_label"], "Agregar foto")

    def test_descartar_no_deja_cambios_por_defaults_nuevos(self):
        published = ensure_published()
        legacy = copy.deepcopy(published.payload)
        legacy["sections"]["portada"].pop("titulo_prefijo", None)
        legacy["sections"]["cadena"].pop("etapas", None)
        published.payload = legacy
        published.save(update_fields=["payload"])

        ensure_draft(self.user)
        self.client.post("/api/cms/admin/content/discard/")
        respuesta = self.client.get("/api/cms/admin/content/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(respuesta.data["has_unpublished_changes"])

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
