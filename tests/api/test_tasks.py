"""Tests para los endpoints de tasks."""
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
    from src.api.routes.tasks import _tasks_db
    _tasks_db.clear()
    yield
    _tasks_db.clear()


class TestTasksEndpoints:
    """Tests para los endpoints de tasks."""

    def test_get_all_tasks_empty(self, client):
        """Test GET /tasks cuando está vacío."""
        response = client.get("/tasks/")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_task(self, client):
        """Test POST /tasks."""
        data = {"name": "Nueva tarea", "description": "Descripción de prueba"}
        response = client.post("/tasks/", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["name"] == "Nueva tarea"
        assert result["description"] == "Descripción de prueba"
        assert result["completed"] is False
        assert "id" in result
        assert "created_at" in result

    def test_create_task_minimal(self, client):
        """Test POST /tasks solo con nombre."""
        data = {"name": "Tarea mínima"}
        response = client.post("/tasks/", json=data)

        assert response.status_code == 201
        assert response.json()["name"] == "Tarea mínima"
        assert response.json()["description"] is None

    def test_create_task_invalid_empty_name(self, client):
        """Test POST /tasks con nombre vacío."""
        data = {"name": ""}
        response = client.post("/tasks/", json=data)

        assert response.status_code == 422

    def test_get_task(self, client):
        """Test GET /tasks/{id}."""
        # Crear tarea primero
        create_response = client.post("/tasks/", json={"name": "Test"})
        task_id = create_response.json()["id"]

        # Obtener tarea
        response = client.get(f"/tasks/{task_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Test"

    def test_get_task_not_found(self, client):
        """Test GET /tasks/{id} cuando no existe."""
        response = client.get("/tasks/999")
        assert response.status_code == 404

    def test_update_task(self, client):
        """Test PUT /tasks/{id}."""
        # Crear tarea
        create_response = client.post("/tasks/", json={"name": "Original"})
        task_id = create_response.json()["id"]

        # Actualizar
        response = client.put(
            f"/tasks/{task_id}",
            json={"name": "Actualizado", "completed": True}
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Actualizado"
        assert response.json()["completed"] is True

    def test_toggle_task(self, client):
        """Test PATCH /tasks/{id}/toggle."""
        # Crear tarea
        create_response = client.post("/tasks/", json={"name": "Toggle test"})
        task_id = create_response.json()["id"]

        # Toggle primera vez - debe setear completed_at
        response = client.patch(f"/tasks/{task_id}/toggle")
        assert response.status_code == 200
        assert response.json()["completed"] is True
        assert response.json()["completed_at"] is not None

        # Toggle segunda vez - debe limpiar completed_at
        response = client.patch(f"/tasks/{task_id}/toggle")
        assert response.json()["completed"] is False
        assert response.json()["completed_at"] is None

    def test_completed_at_on_update(self, client):
        """Test que completed_at se actualiza correctamente con PUT."""
        # Crear tarea
        create_response = client.post("/tasks/", json={"name": "Update test"})
        task_id = create_response.json()["id"]

        # Actualizar a completed=True
        response = client.put(f"/tasks/{task_id}", json={"completed": True})
        assert response.json()["completed_at"] is not None

        # Actualizar a completed=False
        response = client.put(f"/tasks/{task_id}", json={"completed": False})
        assert response.json()["completed_at"] is None

    def test_delete_task(self, client):
        """Test DELETE /tasks/{id}."""
        # Crear tarea
        create_response = client.post("/tasks/", json={"name": "A eliminar"})
        task_id = create_response.json()["id"]

        # Eliminar
        response = client.delete(f"/tasks/{task_id}")
        assert response.status_code == 204

        # Verificar que no existe
        get_response = client.get(f"/tasks/{task_id}")
        assert get_response.status_code == 404

    def test_delete_task_not_found(self, client):
        """Test DELETE /tasks/{id} cuando no existe."""
        response = client.delete("/tasks/999")
        assert response.status_code == 404

    def test_create_task_with_project_id(self, client):
        """Test POST /tasks con project_id."""
        data = {"name": "Tarea con proyecto", "project_id": 1}
        response = client.post("/tasks/", json=data)

        assert response.status_code == 201
        assert response.json()["project_id"] == 1

    def test_create_task_without_project_id(self, client):
        """Test POST /tasks sin project_id."""
        data = {"name": "Tarea sin proyecto"}
        response = client.post("/tasks/", json=data)

        assert response.status_code == 201
        assert response.json()["project_id"] is None

    def test_update_task_project_id(self, client):
        """Test PUT /tasks/{id} actualizando project_id."""
        # Crear tarea sin proyecto
        create_response = client.post("/tasks/", json={"name": "Test"})
        task_id = create_response.json()["id"]

        # Actualizar con project_id
        response = client.put(f"/tasks/{task_id}", json={"project_id": 2})
        assert response.status_code == 200
        assert response.json()["project_id"] == 2

        # Quitar project_id
        response = client.put(f"/tasks/{task_id}", json={"project_id": None})
        assert response.json()["project_id"] is None


class TestTaskStatus:
    """Tests para la funcionalidad de estados Kanban (TaskStatus)."""

    def test_create_task_has_status_backlog(self, client):
        """Test que una tarea nueva tiene status='backlog' por defecto."""
        data = {"name": "Tarea nueva"}
        response = client.post("/tasks/", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["status"] == "backlog"
        assert result["completed"] is False
        assert result["completed_at"] is None

    def test_update_task_status_to_doing(self, client):
        """Test actualizar status a 'doing' mantiene completed=False."""
        # Crear tarea
        create_response = client.post("/tasks/", json={"name": "Test doing"})
        task_id = create_response.json()["id"]

        # Actualizar status a "doing"
        response = client.put(
            f"/tasks/{task_id}",
            json={"status": "doing"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "doing"
        assert result["completed"] is False
        assert result["completed_at"] is None

    def test_update_task_status_to_done_sets_completed(self, client):
        """Test actualizar status a 'done' sincroniza completed=True."""
        # Crear tarea
        create_response = client.post("/tasks/", json={"name": "Test done"})
        task_id = create_response.json()["id"]

        # Actualizar status a "done"
        response = client.put(
            f"/tasks/{task_id}",
            json={"status": "done"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True
        assert result["completed_at"] is not None

    def test_update_completed_true_sets_status_done(self, client):
        """Test actualizar completed=True sincroniza status='done'."""
        # Crear tarea
        create_response = client.post("/tasks/", json={"name": "Test completed"})
        task_id = create_response.json()["id"]

        # Actualizar completed a True
        response = client.put(
            f"/tasks/{task_id}",
            json={"completed": True}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["completed"] is True
        assert result["status"] == "done"
        assert result["completed_at"] is not None

    def test_patch_status_endpoint(self, client):
        """Test endpoint PATCH /tasks/{id}/status para cambiar status rápidamente."""
        # Crear tarea
        create_response = client.post("/tasks/", json={"name": "Test patch status"})
        task_id = create_response.json()["id"]

        # Cambiar status a "doing" usando PATCH
        response = client.patch(
            f"/tasks/{task_id}/status",
            params={"new_status": "doing"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "doing"
        assert result["completed"] is False
        assert result["completed_at"] is None

        # Cambiar status a "done" usando PATCH
        response = client.patch(
            f"/tasks/{task_id}/status",
            params={"new_status": "done"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True
        assert result["completed_at"] is not None

    def test_status_completed_bidirectional_sync(self, client):
        """Test sincronización bidireccional entre status y completed."""
        # Crear tarea (status=backlog, completed=False)
        create_response = client.post("/tasks/", json={"name": "Sync test"})
        task_id = create_response.json()["id"]
        result = create_response.json()
        assert result["status"] == "backlog"
        assert result["completed"] is False

        # Caso 1: status → completed (backlog → doing)
        response = client.put(f"/tasks/{task_id}", json={"status": "doing"})
        result = response.json()
        assert result["status"] == "doing"
        assert result["completed"] is False
        assert result["completed_at"] is None

        # Caso 2: status → completed (doing → done)
        response = client.put(f"/tasks/{task_id}", json={"status": "done"})
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True
        assert result["completed_at"] is not None

        # Caso 3: completed → status (True → done, ya está en done)
        response = client.put(f"/tasks/{task_id}", json={"completed": True})
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True

        # Caso 4: completed → status (False → backlog)
        response = client.put(f"/tasks/{task_id}", json={"completed": False})
        result = response.json()
        assert result["status"] == "backlog"
        assert result["completed"] is False
        assert result["completed_at"] is None

        # Caso 5: status → completed (backlog → done directo)
        response = client.put(f"/tasks/{task_id}", json={"status": "done"})
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True
        assert result["completed_at"] is not None

        # Caso 6: status → completed (done → backlog)
        response = client.put(f"/tasks/{task_id}", json={"status": "backlog"})
        result = response.json()
        assert result["status"] == "backlog"
        assert result["completed"] is False
        assert result["completed_at"] is None
