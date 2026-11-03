import json
import uuid

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase

from apps.authentication.roles import cms_admin_role_name

from .models import Evento, Opinion, Sesion, Visitante


class RecolectaTests(TestCase):
    def _lote(self, anonymous_id, visitante_id=None, completo=False):
        sesion_id = str(uuid.uuid4())
        carga = {
            "anonymous_id": anonymous_id,
            "visitante_id": visitante_id,
            "sesion": {
                "id": sesion_id,
                "duracion_activa": 90,
                "profundidad": 0.72 if completo else 0.18,
                "secciones_vistas": 8 if completo else 2,
                "completo": completo,
            },
            "eventos": [
                {"nombre": "pagina.vista", "seccion": "portada"},
                {"nombre": "seccion.ver", "seccion": "politicas"},
                {"nombre": "iso.abrir", "seccion": "politicas", "recurso": "iso-9001"},
            ],
        }
        respuesta = self.client.post(
            "/api/analytics/eventos/",
            data=json.dumps(carga),
            content_type="application/json",
        )
        return sesion_id, respuesta

    def test_lote_crea_visita_y_eventos(self):
        _, respuesta = self._lote("navegador-1", completo=True)

        self.assertEqual(respuesta.status_code, 202)
        self.assertEqual(Visitante.objects.count(), 1)
        self.assertEqual(Sesion.objects.count(), 1)
        self.assertEqual(Evento.objects.count(), 3)
        self.assertTrue(Sesion.objects.get().completo)

    def test_completitud_exige_profundidad_minima(self):
        # Llega al cierre pero sin recorrido: el guardarrail lo descarta.
        sesion_id = str(uuid.uuid4())
        carga = {
            "anonymous_id": "navegador-2",
            "sesion": {
                "id": sesion_id,
                "profundidad": 0.1,
                "secciones_vistas": 1,
                "completo": True,
            },
        }
        self.client.post(
            "/api/analytics/eventos/",
            data=json.dumps(carga),
            content_type="application/json",
        )
        self.assertFalse(Sesion.objects.get(id=sesion_id).completo)

    def test_identificacion_rechaza_dominio_ajeno(self):
        respuesta = self.client.post(
            "/api/analytics/identificar/",
            data=json.dumps(
                {"anonymous_id": "dispositivo-x", "email": "persona@gmail.com"}
            ),
            content_type="application/json",
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertFalse(Visitante.objects.filter(email="persona@gmail.com").exists())

    def test_identificacion_queda_sin_verificar(self):
        respuesta = self.client.post(
            "/api/analytics/identificar/",
            data=json.dumps(
                {"anonymous_id": "dispositivo-y", "email": "persona@enel.com"}
            ),
            content_type="application/json",
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(respuesta.json()["email_verificado"])
        self.assertFalse(
            Visitante.objects.get(anonymous_id="dispositivo-y").email_verificado
        )

    def test_identificacion_fusiona_dispositivos(self):
        primero, _ = self._lote("dispositivo-a")
        segundo, _ = self._lote("dispositivo-b")

        respuesta = self.client.post(
            "/api/analytics/identificar/",
            data=json.dumps(
                {"anonymous_id": "dispositivo-b", "email": "Persona@Enel.com"}
            ),
            content_type="application/json",
        )
        visitante_id = respuesta.json()["visitante_id"]

        respuesta = self.client.post(
            "/api/analytics/identificar/",
            data=json.dumps(
                {
                    "anonymous_id": "dispositivo-a",
                    "email": "persona@enel.com",
                    "visitante_id": visitante_id,
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(Visitante.objects.count(), 1)
        self.assertEqual(Visitante.objects.get().email, "persona@enel.com")
        self.assertEqual(
            Sesion.objects.filter(id__in=[primero, segundo])
            .values("visitante")
            .distinct()
            .count(),
            1,
        )

    def test_opinion_de_otra_visita_se_rechaza(self):
        sesion_id, _ = self._lote("dispositivo-c")

        ajena = self.client.post(
            "/api/analytics/opiniones/",
            data=json.dumps(
                {"anonymous_id": "otro", "sesion_id": sesion_id, "puntaje": 1}
            ),
            content_type="application/json",
        )
        propia = self.client.post(
            "/api/analytics/opiniones/",
            data=json.dumps(
                {"anonymous_id": "dispositivo-c", "sesion_id": sesion_id, "puntaje": 4}
            ),
            content_type="application/json",
        )

        self.assertEqual(ajena.status_code, 400)
        self.assertEqual(propia.status_code, 201)
        self.assertEqual(Opinion.objects.count(), 1)

    def test_tablero_requiere_rol_del_cms(self):
        self._lote("dispositivo-d")

        self.assertEqual(
            self.client.get("/api/analytics/admin/dashboard/").status_code, 401
        )

        usuario = get_user_model().objects.create_user(
            username="quality", password="secreto"
        )
        grupo, _ = Group.objects.get_or_create(name=cms_admin_role_name())
        usuario.groups.add(grupo)
        self.client.force_login(usuario)

        respuesta = self.client.get("/api/analytics/admin/dashboard/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json()["resumen"]["visitas"], 1)
