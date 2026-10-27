from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.authentication.roles import admin_role_name
from content.models import VideoLink


class ContentEndpointsTests(TestCase):
    """Los endpoints de contenido existentes se conservan y solo restringen la escritura."""

    def setUp(self):
        self.client = APIClient()
        self.video = VideoLink.objects.create(
            title="Video de prueba",
            youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            section_identifier="hero_main",
        )
        self.group = Group.objects.create(name=admin_role_name())
        self.admin = User.objects.create_user(username="A100001", password="x")
        self.admin.groups.add(self.group)
        self.user = User.objects.create_user(username="A300003", password="x")

    def test_public_video_list_remains_public(self):
        response = self.client.get("/api/videos/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        # Sin paginacion global: se mantiene la forma de lista original.
        if isinstance(data, dict) and "results" in data:
            data = data["results"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Video de prueba")

    def test_admin_video_endpoints_require_portal_admin(self):
        anonymous = self.client.post(
            "/api/admin/videos/",
            {
                "title": "Nuevo",
                "youtube_url": "https://youtu.be/x",
                "section_identifier": "nuevo",
            },
            format="json",
        )
        self.assertIn(
            anonymous.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

        self.client.force_authenticate(user=self.user)
        forbidden = self.client.post(
            "/api/admin/videos/",
            {
                "title": "Nuevo",
                "youtube_url": "https://youtu.be/x",
                "section_identifier": "nuevo",
            },
            format="json",
        )
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        allowed = self.client.post(
            "/api/admin/videos/",
            {
                "title": "Nuevo",
                "youtube_url": "https://youtu.be/x",
                "section_identifier": "nuevo",
            },
            format="json",
        )
        self.assertEqual(allowed.status_code, status.HTTP_201_CREATED)

    def test_admin_video_detail_is_preserved(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"/api/admin/videos/{self.video.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["download_url"], self.video.youtube_url)
