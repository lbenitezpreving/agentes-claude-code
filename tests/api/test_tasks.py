"""Tests para los endpoints de tasks con SQLite."""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from src.main import app
from src.api.database import get_db, Base


# Engine de test en memoria
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_async_session_maker = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture
async def test_db():
    """Fixture para crear/destruir tablas en cada test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    """Override de get_db para tests."""
    async with test_async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest.fixture
async def async_client(test_db):
    """Fixture para AsyncClient con BD de test."""
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()


class TestTasksEndpoints:
    """Tests para los endpoints de tasks."""

    @pytest.mark.asyncio
    async def test_get_all_tasks_empty(self, async_client):
        """Test GET /tasks cuando está vacío."""
        response = await async_client.get("/tasks/")
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_create_task(self, async_client):
        """Test POST /tasks."""
        data = {"name": "Nueva tarea", "description": "Descripción de prueba"}
        response = await async_client.post("/tasks/", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["name"] == "Nueva tarea"
        assert result["description"] == "Descripción de prueba"
        assert result["completed"] is False
        assert "id" in result
        assert "created_at" in result

    @pytest.mark.asyncio
    async def test_create_task_minimal(self, async_client):
        """Test POST /tasks solo con nombre."""
        data = {"name": "Tarea mínima"}
        response = await async_client.post("/tasks/", json=data)

        assert response.status_code == 201
        assert response.json()["name"] == "Tarea mínima"
        assert response.json()["description"] is None

    @pytest.mark.asyncio
    async def test_create_task_invalid_empty_name(self, async_client):
        """Test POST /tasks con nombre vacío."""
        data = {"name": ""}
        response = await async_client.post("/tasks/", json=data)

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_task(self, async_client):
        """Test GET /tasks/{id}."""
        # Crear tarea primero
        create_response = await async_client.post("/tasks/", json={"name": "Test"})
        task_id = create_response.json()["id"]

        # Obtener tarea
        response = await async_client.get(f"/tasks/{task_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Test"

    @pytest.mark.asyncio
    async def test_get_task_not_found(self, async_client):
        """Test GET /tasks/{id} cuando no existe."""
        response = await async_client.get("/tasks/999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_task(self, async_client):
        """Test PUT /tasks/{id}."""
        # Crear tarea
        create_response = await async_client.post("/tasks/", json={"name": "Original"})
        task_id = create_response.json()["id"]

        # Actualizar
        response = await async_client.put(
            f"/tasks/{task_id}",
            json={"name": "Actualizado", "completed": True}
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Actualizado"
        assert response.json()["completed"] is True

    @pytest.mark.asyncio
    async def test_toggle_task(self, async_client):
        """Test PATCH /tasks/{id}/toggle."""
        # Crear tarea
        create_response = await async_client.post("/tasks/", json={"name": "Toggle test"})
        task_id = create_response.json()["id"]

        # Toggle primera vez - debe setear completed_at
        response = await async_client.patch(f"/tasks/{task_id}/toggle")
        assert response.status_code == 200
        assert response.json()["completed"] is True
        assert response.json()["completed_at"] is not None

        # Toggle segunda vez - debe limpiar completed_at
        response = await async_client.patch(f"/tasks/{task_id}/toggle")
        assert response.json()["completed"] is False
        assert response.json()["completed_at"] is None

    @pytest.mark.asyncio
    async def test_completed_at_on_update(self, async_client):
        """Test que completed_at se actualiza correctamente con PUT."""
        # Crear tarea
        create_response = await async_client.post("/tasks/", json={"name": "Update test"})
        task_id = create_response.json()["id"]

        # Actualizar a completed=True
        response = await async_client.put(f"/tasks/{task_id}", json={"completed": True})
        assert response.json()["completed_at"] is not None

        # Actualizar a completed=False
        response = await async_client.put(f"/tasks/{task_id}", json={"completed": False})
        assert response.json()["completed_at"] is None

    @pytest.mark.asyncio
    async def test_delete_task(self, async_client):
        """Test DELETE /tasks/{id} - Soft delete."""
        # Crear tarea
        create_response = await async_client.post("/tasks/", json={"name": "A eliminar"})
        task_id = create_response.json()["id"]
        assert create_response.json()["deleted_at"] is None

        # Eliminar (soft delete)
        response = await async_client.delete(f"/tasks/{task_id}")
        assert response.status_code == 204

        # Verificar que no existe sin show_deleted
        get_response = await async_client.get(f"/tasks/{task_id}")
        assert get_response.status_code == 404

        # Verificar que existe con show_deleted y tiene deleted_at
        get_response = await async_client.get(f"/tasks/{task_id}?show_deleted=true")
        assert get_response.status_code == 200
        assert get_response.json()["deleted_at"] is not None

    @pytest.mark.asyncio
    async def test_delete_task_not_found(self, async_client):
        """Test DELETE /tasks/{id} cuando no existe."""
        response = await async_client.delete("/tasks/999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_task_with_project_id(self, async_client):
        """Test POST /tasks con project_id."""
        data = {"name": "Tarea con proyecto", "project_id": 1}
        response = await async_client.post("/tasks/", json=data)

        assert response.status_code == 201
        assert response.json()["project_id"] == 1

    @pytest.mark.asyncio
    async def test_create_task_without_project_id(self, async_client):
        """Test POST /tasks sin project_id."""
        data = {"name": "Tarea sin proyecto"}
        response = await async_client.post("/tasks/", json=data)

        assert response.status_code == 201
        assert response.json()["project_id"] is None

    @pytest.mark.asyncio
    async def test_update_task_project_id(self, async_client):
        """Test PUT /tasks/{id} actualizando project_id."""
        # Crear tarea sin proyecto
        create_response = await async_client.post("/tasks/", json={"name": "Test"})
        task_id = create_response.json()["id"]

        # Actualizar con project_id
        response = await async_client.put(f"/tasks/{task_id}", json={"project_id": 2})
        assert response.status_code == 200
        assert response.json()["project_id"] == 2

        # Quitar project_id
        response = await async_client.put(f"/tasks/{task_id}", json={"project_id": None})
        assert response.json()["project_id"] is None


class TestTaskStatus:
    """Tests para la funcionalidad de estados Kanban (TaskStatus)."""

    @pytest.mark.asyncio
    async def test_create_task_has_status_backlog(self, async_client):
        """Test que una tarea nueva tiene status='backlog' por defecto."""
        data = {"name": "Tarea nueva"}
        response = await async_client.post("/tasks/", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["status"] == "backlog"
        assert result["completed"] is False
        assert result["completed_at"] is None

    @pytest.mark.asyncio
    async def test_update_task_status_to_doing(self, async_client):
        """Test actualizar status a 'doing' mantiene completed=False."""
        # Crear tarea
        create_response = await async_client.post("/tasks/", json={"name": "Test doing"})
        task_id = create_response.json()["id"]

        # Actualizar status a "doing"
        response = await async_client.put(
            f"/tasks/{task_id}",
            json={"status": "doing"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "doing"
        assert result["completed"] is False
        assert result["completed_at"] is None

    @pytest.mark.asyncio
    async def test_update_task_status_to_done_sets_completed(self, async_client):
        """Test actualizar status a 'done' sincroniza completed=True."""
        # Crear tarea
        create_response = await async_client.post("/tasks/", json={"name": "Test done"})
        task_id = create_response.json()["id"]

        # Actualizar status a "done"
        response = await async_client.put(
            f"/tasks/{task_id}",
            json={"status": "done"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True
        assert result["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_update_completed_true_sets_status_done(self, async_client):
        """Test actualizar completed=True sincroniza status='done'."""
        # Crear tarea
        create_response = await async_client.post("/tasks/", json={"name": "Test completed"})
        task_id = create_response.json()["id"]

        # Actualizar completed a True
        response = await async_client.put(
            f"/tasks/{task_id}",
            json={"completed": True}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["completed"] is True
        assert result["status"] == "done"
        assert result["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_patch_status_endpoint(self, async_client):
        """Test endpoint PATCH /tasks/{id}/status para cambiar status rápidamente."""
        # Crear tarea
        create_response = await async_client.post("/tasks/", json={"name": "Test patch status"})
        task_id = create_response.json()["id"]

        # Cambiar status a "doing" usando PATCH
        response = await async_client.patch(
            f"/tasks/{task_id}/status",
            params={"new_status": "doing"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "doing"
        assert result["completed"] is False
        assert result["completed_at"] is None

        # Cambiar status a "done" usando PATCH
        response = await async_client.patch(
            f"/tasks/{task_id}/status",
            params={"new_status": "done"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True
        assert result["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_status_completed_bidirectional_sync(self, async_client):
        """Test sincronización bidireccional entre status y completed."""
        # Crear tarea (status=backlog, completed=False)
        create_response = await async_client.post("/tasks/", json={"name": "Sync test"})
        task_id = create_response.json()["id"]
        result = create_response.json()
        assert result["status"] == "backlog"
        assert result["completed"] is False

        # Caso 1: status → completed (backlog → doing)
        response = await async_client.put(f"/tasks/{task_id}", json={"status": "doing"})
        result = response.json()
        assert result["status"] == "doing"
        assert result["completed"] is False
        assert result["completed_at"] is None

        # Caso 2: status → completed (doing → done)
        response = await async_client.put(f"/tasks/{task_id}", json={"status": "done"})
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True
        assert result["completed_at"] is not None

        # Caso 3: completed → status (True → done, ya está en done)
        response = await async_client.put(f"/tasks/{task_id}", json={"completed": True})
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True

        # Caso 4: completed → status (False → backlog)
        response = await async_client.put(f"/tasks/{task_id}", json={"completed": False})
        result = response.json()
        assert result["status"] == "backlog"
        assert result["completed"] is False
        assert result["completed_at"] is None

        # Caso 5: status → completed (backlog → done directo)
        response = await async_client.put(f"/tasks/{task_id}", json={"status": "done"})
        result = response.json()
        assert result["status"] == "done"
        assert result["completed"] is True
        assert result["completed_at"] is not None

        # Caso 6: status → completed (done → backlog)
        response = await async_client.put(f"/tasks/{task_id}", json={"status": "backlog"})
        result = response.json()
        assert result["status"] == "backlog"
        assert result["completed"] is False
        assert result["completed_at"] is None
