import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.analytics.models import Visitante


class RegistroPortalTests(TestCase):
    def _registrar(self, **cambios):
        datos = {
            "email": "persona.nueva@enel.com",
            "first_name": "Persona",
            "last_name": "Nueva",
            "password": "ClaveSegura2026",
            "password_confirm": "ClaveSegura2026",
        }
        datos.update(cambios)
        return self.client.post(
            "/api/auth/register/",
            data=json.dumps(datos),
            content_type="application/json",
        )

    def test_registro_crea_cuenta_sin_acceso_al_cms(self):
        respuesta = self._registrar()

        self.assertEqual(respuesta.status_code, 201)
        cuerpo = respuesta.json()
        self.assertIn("access", cuerpo)
        self.assertIn("visitante_id", cuerpo["user"])
        self.assertFalse(cuerpo["user"]["capabilities"]["can_manage_cms"])

        usuario = get_user_model().objects.get(email="persona.nueva@enel.com")
        self.assertTrue(usuario.check_password("ClaveSegura2026"))
        self.assertFalse(usuario.groups.exists())

        visitante = Visitante.objects.get(user=usuario)
        self.assertEqual(visitante.email, "persona.nueva@enel.com")
        self.assertFalse(visitante.email_verificado)

    def test_login_funciona_con_el_correo_registrado(self):
        self._registrar()

        respuesta = self.client.post(
            "/api/auth/login/",
            data=json.dumps(
                {"username": "persona.nueva@enel.com", "password": "ClaveSegura2026"}
            ),
            content_type="application/json",
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertIn("visitante_id", respuesta.json()["user"])

    def test_no_permite_correo_duplicado(self):
        self._registrar()
        respuesta = self._registrar()

        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(
            get_user_model().objects.filter(email="persona.nueva@enel.com").count(), 1
        )

    def test_rechaza_dominio_ajeno(self):
        respuesta = self._registrar(email="persona@gmail.com")

        self.assertEqual(respuesta.status_code, 400)
        self.assertFalse(
            get_user_model().objects.filter(email="persona@gmail.com").exists()
        )

    def test_rechaza_contrasena_debil(self):
        respuesta = self._registrar(password="12345678", password_confirm="12345678")

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("password", respuesta.json())

    def test_me_devuelve_el_visitante(self):
        respuesta = self._registrar()
        access = respuesta.json()["access"]

        perfil = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(perfil.status_code, 200)
        self.assertIn("visitante_id", perfil.json())
