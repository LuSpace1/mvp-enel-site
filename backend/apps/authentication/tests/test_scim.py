import json

from django.contrib.auth.models import Group
from django.test import TestCase, override_settings
from oauth2_provider.models import Application
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.authentication.roles import admin_role_name
from apps.authentication.services.identity_service import IdentityService

PATCH_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:PatchOp"
UNKNOWN_USER_ID = "00000000-0000-0000-0000-000000000000"


class ScimApiTests(TestCase):
    """Conector SCIM 2.0: codigos HTTP, meta obligatorio, filtros, paginacion y PatchOp."""

    def setUp(self):
        self.client = APIClient()
        self.admin_group = Group.objects.create(name=admin_role_name())
        self.admin = User.objects.create_user(
            username="A100001", password="AdminLocal2026!"
        )
        self.admin.groups.add(self.admin_group)
        self.client.force_authenticate(user=self.admin)

    # /Users
    def test_create_user_returns_201_with_meta(self):
        payload = {
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
            "userName": "A300003",
            "name": {"givenName": "Carlos", "familyName": "Mendoza"},
            "emails": [{"value": "carlos.mendoza@enel.com"}],
            "active": True,
        }
        response = self.client.post("/api/scim/v2/Users", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["userName"], "A300003")
        self.assertEqual(response.data["name"]["givenName"], "Carlos")
        self.assertEqual(response.data["emails"][0]["value"], "carlos.mendoza@enel.com")
        self.assertIn("meta", response.data)
        self.assertEqual(response.data["meta"]["resourceType"], "User")
        self.assertIn("lastModified", response.data["meta"])
        self.assertIn("/api/scim/v2/Users/", response.data["meta"]["location"])

        user = User.objects.get(username="A300003")
        self.assertFalse(user.has_usable_password())

    def test_scim_media_type_accepted_and_returned(self):
        created = self.client.post(
            "/api/scim/v2/Users",
            {"userName": "A300003"},
            content_type="application/scim+json",
            HTTP_ACCEPT="application/scim+json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.content)
        self.assertIn("application/scim+json", created["Content-Type"])

        listed = self.client.get(
            "/api/scim/v2/Users", HTTP_ACCEPT="application/scim+json"
        )
        self.assertEqual(listed.status_code, status.HTTP_200_OK, listed.content)
        self.assertIn("application/scim+json", listed["Content-Type"])

    def test_create_duplicate_user_returns_409(self):
        User.objects.create_user(username="A300003", password="x")
        response = self.client.post(
            "/api/scim/v2/Users", {"userName": "A300003"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["status"], "409")

    def test_create_user_rejects_invalid_corporate_id(self):
        response = self.client.post(
            "/api/scim/v2/Users", {"userName": "pepito123"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["status"], "400")

    def test_get_user_detail_and_not_found(self):
        user = User.objects.create_user(username="A300003", password="x")

        found = self.client.get(f"/api/scim/v2/Users/{user.id}")
        self.assertEqual(found.status_code, status.HTTP_200_OK)
        self.assertEqual(found.data["id"], str(user.id))

        missing = self.client.get(f"/api/scim/v2/Users/{UNKNOWN_USER_ID}")
        self.assertEqual(missing.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_users_with_filter_and_pagination(self):
        for index in range(3):
            User.objects.create_user(username=f"A30000{index}", password="x")

        filtered = self.client.get('/api/scim/v2/Users?filter=userName eq "A300001"')
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(filtered.data["totalResults"], 1)
        self.assertEqual(filtered.data["Resources"][0]["userName"], "A300001")

        paged = self.client.get("/api/scim/v2/Users?startIndex=2&count=1")
        self.assertEqual(paged.data["startIndex"], 2)
        self.assertEqual(paged.data["itemsPerPage"], 1)
        self.assertEqual(paged.data["totalResults"], 4)
        # Orden por userName: A100001, A300000, A300001, A300002.
        self.assertEqual(paged.data["Resources"][0]["userName"], "A300000")

    def test_list_users_accepts_unquoted_boolean_filter(self):
        User.objects.create_user(username="A300003", password="x", is_active=True)
        User.objects.create_user(username="A300004", password="x", is_active=False)

        response = self.client.get("/api/scim/v2/Users", {"filter": "active eq true"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [resource["userName"] for resource in response.data["Resources"]]
        self.assertIn("A300003", usernames)
        self.assertNotIn("A300004", usernames)

    def test_list_users_rejects_unsupported_filter(self):
        response = self.client.get(
            "/api/scim/v2/Users", {"filter": 'emails.value eq "x@y.cl"'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_user_deactivates_and_returns_204(self):
        user = User.objects.create_user(username="A300003", password="x")
        response = self.client.delete(f"/api/scim/v2/Users/{user.id}")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        user.refresh_from_db()
        self.assertFalse(user.is_active)
        self.assertTrue(User.objects.filter(id=user.id).exists())

    def test_patch_user_with_patchop_replaces_active(self):
        user = User.objects.create_user(username="A300003", password="x")
        payload = {
            "schemas": [PATCH_SCHEMA],
            "Operations": [{"op": "replace", "path": "active", "value": False}],
        }

        disabled = self.client.patch(
            f"/api/scim/v2/Users/{user.id}", payload, format="json"
        )
        self.assertEqual(disabled.status_code, status.HTTP_200_OK)
        self.assertFalse(disabled.data["active"])
        user.refresh_from_db()
        self.assertFalse(user.is_active)

        payload["Operations"][0]["value"] = True
        enabled = self.client.patch(
            f"/api/scim/v2/Users/{user.id}", payload, format="json"
        )
        self.assertEqual(enabled.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_active)

    def test_patch_user_with_patchop_updates_identity_attributes(self):
        user = User.objects.create_user(username="A300003", password="x")
        payload = {
            "schemas": [PATCH_SCHEMA],
            "Operations": [
                {"op": "replace", "path": "name.givenName", "value": "Ana"},
                {"op": "replace", "path": "name.familyName", "value": "Perez"},
                {
                    "op": "replace",
                    "path": "emails",
                    "value": [{"value": "ana.perez@enel.com"}],
                },
                {"op": "replace", "path": "externalId", "value": "EXT-0001"},
            ],
        }

        response = self.client.patch(
            f"/api/scim/v2/Users/{user.id}", payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        user.refresh_from_db()
        self.assertEqual(user.first_name, "Ana")
        self.assertEqual(user.last_name, "Perez")
        self.assertEqual(user.email, "ana.perez@enel.com")
        self.assertEqual(user.enel_id, "EXT-0001")

    def test_patch_user_with_unsupported_patchop_path_returns_400(self):
        user = User.objects.create_user(username="A300003", password="x")
        payload = {
            "schemas": [PATCH_SCHEMA],
            "Operations": [{"op": "replace", "path": "userName", "value": "A999999"}],
        }

        response = self.client.patch(
            f"/api/scim/v2/Users/{user.id}", payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["status"], "400")

    def test_patch_user_accepts_partial_representation(self):
        user = User.objects.create_user(username="A300003", password="x")

        response = self.client.patch(
            f"/api/scim/v2/Users/{user.id}",
            {"emails": [{"value": "parcial@enel.com"}]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.email, "parcial@enel.com")

    def test_partial_patch_text_false_deactivates_user(self):
        user = User.objects.create_user(
            username="A300003", password="x", is_active=True
        )
        response = self.client.patch(
            f"/api/scim/v2/Users/{user.id}", {"active": "false"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertFalse(user.is_active)

    def test_put_user_replaces_attributes_and_ignores_username(self):
        user = User.objects.create_user(
            username="A300003", password="x", first_name="Viejo", last_name="Apellido"
        )
        payload = {
            "userName": "A999999",
            "name": {"givenName": "Ana", "familyName": "Perez"},
            "emails": [{"value": "ana.perez@enel.com"}],
            "active": True,
        }

        response = self.client.put(
            f"/api/scim/v2/Users/{user.id}", payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        user.refresh_from_db()
        self.assertEqual(user.username, "A300003")
        self.assertEqual(user.first_name, "Ana")
        self.assertEqual(user.last_name, "Perez")
        self.assertEqual(user.email, "ana.perez@enel.com")

    def test_get_user_detail_includes_groups(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba_A")
        user = User.objects.create_user(username="A300003", password="x")
        IdentityService.assign_technical_role(user, role)

        response = self.client.get(f"/api/scim/v2/Users/{user.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["groups"],
            [{"value": str(role.id), "display": "Grupo_Prueba_A"}],
        )

    # /Groups
    def test_create_group_returns_201_and_conflict(self):
        payload = {"displayName": "Grupo_Prueba_A"}
        created = self.client.post("/api/scim/v2/Groups", payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data["displayName"], "Grupo_Prueba_A")
        self.assertEqual(created.data["meta"]["resourceType"], "Group")
        self.assertTrue(Group.objects.filter(name="Grupo_Prueba_A").exists())

        duplicate = self.client.post("/api/scim/v2/Groups", payload, format="json")
        self.assertEqual(duplicate.status_code, status.HTTP_409_CONFLICT)

    def test_group_detail_found_and_not_found(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba_A")

        missing = self.client.get(f"/api/scim/v2/Groups/{UNKNOWN_USER_ID}")
        self.assertEqual(missing.status_code, status.HTTP_404_NOT_FOUND)

        found = self.client.get(f"/api/scim/v2/Groups/{role.id}")
        self.assertEqual(found.status_code, status.HTTP_200_OK)
        self.assertEqual(found.data["displayName"], "Grupo_Prueba_A")

    def test_group_list_filter_and_pagination(self):
        IdentityService.ensure_technical_role("Grupo_Prueba_A")
        IdentityService.ensure_technical_role("Grupo_Prueba_B")

        filtered = self.client.get(
            '/api/scim/v2/Groups?filter=displayName eq "Grupo_Prueba_A"'
        )
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(filtered.data["totalResults"], 1)
        self.assertEqual(filtered.data["Resources"][0]["displayName"], "Grupo_Prueba_A")

        paged = self.client.get("/api/scim/v2/Groups?startIndex=1&count=1")
        self.assertEqual(paged.data["itemsPerPage"], 1)
        self.assertGreaterEqual(paged.data["totalResults"], 2)

    def test_patch_group_add_and_remove_members(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba_C")
        user = User.objects.create_user(username="A300003", password="x")

        add_payload = {
            "schemas": [PATCH_SCHEMA],
            "Operations": [
                {"op": "add", "path": "members", "value": [{"value": str(user.id)}]}
            ],
        }
        added = self.client.patch(
            f"/api/scim/v2/Groups/{role.id}", add_payload, format="json"
        )
        self.assertEqual(added.status_code, status.HTTP_200_OK)
        self.assertIn(
            "Grupo_Prueba_C", list(user.groups.values_list("name", flat=True))
        )
        self.assertEqual(
            [member["value"] for member in added.data["members"]], [str(user.id)]
        )

        remove_payload = {
            "schemas": [PATCH_SCHEMA],
            "Operations": [{"op": "remove", "path": f'members[value eq "{user.id}"]'}],
        }
        removed = self.client.patch(
            f"/api/scim/v2/Groups/{role.id}", remove_payload, format="json"
        )
        self.assertEqual(removed.status_code, status.HTTP_200_OK)
        self.assertEqual(removed.data["members"], [])
        self.assertNotIn(
            "Grupo_Prueba_C", list(user.groups.values_list("name", flat=True))
        )

    def test_patch_group_replace_members_leaves_only_requested(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba_C")
        first = User.objects.create_user(username="A300003", password="x")
        second = User.objects.create_user(username="A300004", password="x")
        IdentityService.assign_technical_role(first, role)
        IdentityService.assign_technical_role(second, role)

        payload = {
            "schemas": [PATCH_SCHEMA],
            "Operations": [
                {
                    "op": "replace",
                    "path": "members",
                    "value": [{"value": str(second.id)}],
                }
            ],
        }
        response = self.client.patch(
            f"/api/scim/v2/Groups/{role.id}", payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [member["value"] for member in response.data["members"]], [str(second.id)]
        )
        self.assertFalse(first.groups.filter(name="Grupo_Prueba_C").exists())
        self.assertTrue(second.groups.filter(name="Grupo_Prueba_C").exists())

    def test_patch_group_unknown_member_returns_400(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba_C")
        payload = {
            "schemas": [PATCH_SCHEMA],
            "Operations": [
                {"op": "add", "path": "members", "value": [{"value": UNKNOWN_USER_ID}]}
            ],
        }
        response = self.client.patch(
            f"/api/scim/v2/Groups/{role.id}", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_group_with_unsupported_path_returns_400(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba_C")
        payload = {
            "schemas": [PATCH_SCHEMA],
            "Operations": [{"op": "replace", "path": "displayName", "value": "Otro"}],
        }
        response = self.client.patch(
            f"/api/scim/v2/Groups/{role.id}", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_missing_group_returns_404(self):
        payload = {
            "schemas": [PATCH_SCHEMA],
            "Operations": [
                {
                    "op": "add",
                    "path": "members",
                    "value": [{"value": str(self.admin.id)}],
                }
            ],
        }
        response = self.client.patch(
            f"/api/scim/v2/Groups/{UNKNOWN_USER_ID}", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_group_unknown_member_returns_400(self):
        payload = {
            "displayName": "Grupo_Prueba_A",
            "members": [{"value": UNKNOWN_USER_ID}],
        }
        response = self.client.post("/api/scim/v2/Groups", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Group.objects.filter(name="Grupo_Prueba_A").exists())

    @override_settings(SCIM_ALLOWED_GROUPS=["Grupo_Prueba_A"])
    def test_post_group_enforces_optional_allowlist(self):
        rejected = self.client.post(
            "/api/scim/v2/Groups", {"displayName": "Grupo_No_Permitido"}, format="json"
        )
        self.assertEqual(rejected.status_code, status.HTTP_400_BAD_REQUEST)

        accepted = self.client.post(
            "/api/scim/v2/Groups", {"displayName": "Grupo_Prueba_A"}, format="json"
        )
        self.assertEqual(accepted.status_code, status.HTTP_201_CREATED)

    def test_group_delete_is_not_required_and_not_exposed(self):
        role = IdentityService.ensure_technical_role("Grupo_Prueba_A")
        response = self.client.delete(f"/api/scim/v2/Groups/{role.id}")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        role.refresh_from_db()
        self.assertTrue(role.is_active)

    # /Schemas
    def test_schemas_endpoint_publishes_core_schemas(self):
        response = self.client.get("/api/scim/v2/Schemas")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [schema["id"] for schema in response.data["Resources"]]
        self.assertIn("urn:ietf:params:scim:schemas:core:2.0:User", ids)
        self.assertIn("urn:ietf:params:scim:schemas:core:2.0:Group", ids)

    def test_scim_requires_authentication(self):
        anonymous = APIClient()
        response = anonymous.get("/api/scim/v2/Users")
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_bulk_is_not_exposed(self):
        response = self.client.post("/api/scim/v2/Bulk", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_trailing_slash_is_accepted(self):
        self.assertEqual(
            self.client.get("/api/scim/v2/Users/").status_code, status.HTTP_200_OK
        )
        self.assertEqual(
            self.client.get("/api/scim/v2/Groups/").status_code, status.HTTP_200_OK
        )
        self.assertEqual(
            self.client.get("/api/scim/v2/Schemas/").status_code, status.HTTP_200_OK
        )


class ScimOAuth2Tests(TestCase):
    """Autenticacion OAuth2 Bearer (client_credentials) del conector SCIM."""

    def setUp(self):
        self.client = APIClient()
        self.application = Application.objects.create(
            name="CompAC Sandbox",
            client_type=Application.CLIENT_CONFIDENTIAL,
            authorization_grant_type=Application.GRANT_CLIENT_CREDENTIALS,
            client_secret="compac-test-secret",
        )

    def _request_token(self, scope="scim", path="/o/token/"):
        return self.client.post(
            path,
            {
                "grant_type": "client_credentials",
                "client_id": self.application.client_id,
                "client_secret": "compac-test-secret",
                "scope": scope,
            },
        )

    def test_client_credentials_token_grants_scim_access(self):
        token_response = self._request_token()
        self.assertEqual(
            token_response.status_code, status.HTTP_200_OK, token_response.content
        )
        payload = json.loads(token_response.content)
        self.assertIn("access_token", payload)

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {payload['access_token']}")
        response = client.get("/api/scim/v2/Users")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Resources", response.data)

    def test_token_without_scope_is_rejected(self):
        token_response = self._request_token(scope="")
        self.assertEqual(token_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_endpoint_rejects_unknown_scope(self):
        token_response = self._request_token(scope="read")
        self.assertEqual(token_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_endpoint_alias_at_root(self):
        token_response = self._request_token(path="/token/")
        self.assertEqual(
            token_response.status_code, status.HTTP_200_OK, token_response.content
        )
        self.assertIn("access_token", json.loads(token_response.content))
