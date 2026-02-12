"""Tests para los endpoints de projects."""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Cliente de prueba."""
    from src.main import app
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_db():
    """Resetea la base de datos entre tests."""
    from src.api.routes.projects import _projects_db
    # Guardar estado original
    original = dict(_projects_db)
    yield
    # Restaurar estado original
    _projects_db.clear()
    _projects_db.update(original)


class TestProjectsEndpoints:
    """Tests para los endpoints de projects."""

    def test_get_all_projects(self, client):
        """Test GET /projects devuelve los 4 proyectos de ejemplo."""
        response = client.get("/projects/")
        assert response.status_code == 200
        projects = response.json()
        assert len(projects) == 4
        assert projects[0]["name"] == "Trabajo"
        assert projects[1]["name"] == "Personal"
        assert projects[2]["name"] == "Estudios"
        assert projects[3]["name"] == "Hogar"

    def test_get_project(self, client):
        """Test GET /projects/{id}."""
        response = client.get("/projects/1")
        assert response.status_code == 200
        project = response.json()
        assert project["name"] == "Trabajo"
        assert project["color"] == "#3498db"

    def test_get_project_not_found(self, client):
        """Test GET /projects/{id} cuando no existe."""
        response = client.get("/projects/999")
        assert response.status_code == 404

    def test_create_project(self, client):
        """Test POST /projects."""
        data = {"name": "Nuevo Proyecto", "color": "#ff5733"}
        response = client.post("/projects/", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["name"] == "Nuevo Proyecto"
        assert result["color"] == "#ff5733"
        assert "id" in result

    def test_create_project_invalid_color(self, client):
        """Test POST /projects con color inválido."""
        data = {"name": "Test", "color": "invalid"}
        response = client.post("/projects/", json=data)
        assert response.status_code == 422

    def test_update_project(self, client):
        """Test PUT /projects/{id}."""
        response = client.put(
            "/projects/1",
            json={"name": "Trabajo Actualizado"}
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Trabajo Actualizado"

    def test_update_project_not_found(self, client):
        """Test PUT /projects/{id} cuando no existe."""
        response = client.put("/projects/999", json={"name": "Test"})
        assert response.status_code == 404

    def test_delete_project(self, client):
        """Test DELETE /projects/{id}."""
        # Crear proyecto para eliminar
        create_response = client.post(
            "/projects/",
            json={"name": "A eliminar", "color": "#000000"}
        )
        project_id = create_response.json()["id"]

        # Eliminar
        response = client.delete(f"/projects/{project_id}")
        assert response.status_code == 204

        # Verificar que no existe
        get_response = client.get(f"/projects/{project_id}")
        assert get_response.status_code == 404

    def test_delete_project_not_found(self, client):
        """Test DELETE /projects/{id} cuando no existe."""
        response = client.delete("/projects/999")
        assert response.status_code == 404
