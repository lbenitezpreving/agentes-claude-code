"""Tests para los endpoints de subtasks con SQLite."""
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


@pytest.fixture
async def task_with_id(async_client):
    """Fixture que crea una tarea y retorna su ID."""
    response = await async_client.post("/tasks/", json={"name": "Task with subtasks"})
    assert response.status_code == 201
    return response.json()["id"]


class TestSubtasksEndpoints:
    """Tests para los endpoints de subtasks."""

    @pytest.mark.asyncio
    async def test_create_subtask(self, async_client, task_with_id):
        """Test POST /tasks/{task_id}/subtasks/ crea correctamente."""
        data = {"name": "Subtask 1", "position": 1}
        response = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json=data
        )

        assert response.status_code == 201
        result = response.json()
        assert result["name"] == "Subtask 1"
        assert result["task_id"] == task_with_id
        assert result["completed"] is False
        assert result["position"] == 1
        assert "id" in result
        assert "created_at" in result

    @pytest.mark.asyncio
    async def test_list_subtasks_ordered(self, async_client, task_with_id):
        """Test GET retorna subtasks ordenadas por position."""
        # Crear subtasks en orden aleatorio
        await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Third", "position": 3}
        )
        await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "First", "position": 1}
        )
        await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Second", "position": 2}
        )

        # Obtener lista
        response = await async_client.get(f"/tasks/{task_with_id}/subtasks/")

        assert response.status_code == 200
        subtasks = response.json()
        assert len(subtasks) == 3
        # Verificar orden por position
        assert subtasks[0]["name"] == "First"
        assert subtasks[1]["name"] == "Second"
        assert subtasks[2]["name"] == "Third"

    @pytest.mark.asyncio
    async def test_toggle_subtask(self, async_client, task_with_id):
        """Test PATCH alterna completed correctamente."""
        # Crear subtask
        create_response = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Toggle test"}
        )
        subtask_id = create_response.json()["id"]

        # Toggle a completed
        toggle_response = await async_client.patch(
            f"/tasks/{task_with_id}/subtasks/{subtask_id}/toggle"
        )
        assert toggle_response.status_code == 200
        assert toggle_response.json()["completed"] is True
        assert toggle_response.json()["completed_at"] is not None

        # Toggle a incomplete
        toggle_response2 = await async_client.patch(
            f"/tasks/{task_with_id}/subtasks/{subtask_id}/toggle"
        )
        assert toggle_response2.status_code == 200
        assert toggle_response2.json()["completed"] is False
        assert toggle_response2.json()["completed_at"] is None

    @pytest.mark.asyncio
    async def test_auto_complete_task_when_all_done(self, async_client, task_with_id):
        """Test que la tarea se auto-completa cuando TODAS las subtasks están done."""
        # Crear 2 subtasks
        response1 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 1"}
        )
        response2 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 2"}
        )
        subtask1_id = response1.json()["id"]
        subtask2_id = response2.json()["id"]

        # Verificar que task NO está completed
        task_response = await async_client.get(f"/tasks/{task_with_id}")
        assert task_response.json()["completed"] is False
        assert task_response.json()["status"] == "backlog"

        # Completar primera subtask
        await async_client.patch(
            f"/tasks/{task_with_id}/subtasks/{subtask1_id}/toggle"
        )

        # Verificar que task SIGUE sin completar
        task_response = await async_client.get(f"/tasks/{task_with_id}")
        assert task_response.json()["completed"] is False
        assert task_response.json()["status"] == "backlog"

        # Completar segunda subtask
        await async_client.patch(
            f"/tasks/{task_with_id}/subtasks/{subtask2_id}/toggle"
        )

        # AHORA la task DEBE estar completed
        task_response = await async_client.get(f"/tasks/{task_with_id}")
        assert task_response.json()["completed"] is True
        assert task_response.json()["status"] == "done"
        assert task_response.json()["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_revert_task_when_subtask_unchecked(self, async_client, task_with_id):
        """Test que la tarea vuelve a incompleta cuando una subtask se desmarca."""
        # Crear 2 subtasks y completarlas
        response1 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 1"}
        )
        response2 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 2"}
        )
        subtask1_id = response1.json()["id"]
        subtask2_id = response2.json()["id"]

        # Completar ambas
        await async_client.patch(f"/tasks/{task_with_id}/subtasks/{subtask1_id}/toggle")
        await async_client.patch(f"/tasks/{task_with_id}/subtasks/{subtask2_id}/toggle")

        # Verificar que task está completed
        task_response = await async_client.get(f"/tasks/{task_with_id}")
        assert task_response.json()["completed"] is True
        assert task_response.json()["status"] == "done"

        # Desmarcar una subtask
        await async_client.patch(f"/tasks/{task_with_id}/subtasks/{subtask1_id}/toggle")

        # Verificar que task vuelve a incompleta
        task_response = await async_client.get(f"/tasks/{task_with_id}")
        assert task_response.json()["completed"] is False
        assert task_response.json()["status"] == "backlog"
        assert task_response.json()["completed_at"] is None

    @pytest.mark.asyncio
    async def test_delete_subtask_recalculates(self, async_client, task_with_id):
        """Test que el status se recalcula correctamente tras eliminar una subtask."""
        # Crear 3 subtasks
        response1 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 1"}
        )
        response2 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 2"}
        )
        response3 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 3"}
        )
        subtask1_id = response1.json()["id"]
        subtask2_id = response2.json()["id"]
        subtask3_id = response3.json()["id"]

        # Completar las 3
        await async_client.patch(f"/tasks/{task_with_id}/subtasks/{subtask1_id}/toggle")
        await async_client.patch(f"/tasks/{task_with_id}/subtasks/{subtask2_id}/toggle")
        await async_client.patch(f"/tasks/{task_with_id}/subtasks/{subtask3_id}/toggle")

        # Verificar task completed
        task_response = await async_client.get(f"/tasks/{task_with_id}")
        assert task_response.json()["completed"] is True

        # Eliminar una subtask completed
        delete_response = await async_client.delete(
            f"/tasks/{task_with_id}/subtasks/{subtask1_id}"
        )
        assert delete_response.status_code == 204

        # Task DEBE seguir completed (quedan 2, ambas completed)
        task_response = await async_client.get(f"/tasks/{task_with_id}")
        assert task_response.json()["completed"] is True

        # Desmarcar una de las restantes
        await async_client.patch(f"/tasks/{task_with_id}/subtasks/{subtask2_id}/toggle")

        # Ahora task DEBE ser incompleta
        task_response = await async_client.get(f"/tasks/{task_with_id}")
        assert task_response.json()["completed"] is False

    @pytest.mark.asyncio
    async def test_cascade_delete_task(self, async_client, task_with_id):
        """Test que las subtasks se eliminan en cascada con la tarea."""
        # Crear subtasks
        response1 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 1"}
        )
        response2 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 2"}
        )
        subtask1_id = response1.json()["id"]
        subtask2_id = response2.json()["id"]

        # Verificar que existen
        get_response = await async_client.get(f"/tasks/{task_with_id}/subtasks/")
        assert len(get_response.json()) == 2

        # Eliminar la tarea
        delete_task_response = await async_client.delete(f"/tasks/{task_with_id}")
        assert delete_task_response.status_code == 204

        # Verificar que la tarea no existe
        get_task_response = await async_client.get(f"/tasks/{task_with_id}")
        assert get_task_response.status_code == 404

        # Intentar obtener subtasks (debería dar 404 porque task no existe)
        get_subtasks_response = await async_client.get(
            f"/tasks/{task_with_id}/subtasks/"
        )
        assert get_subtasks_response.status_code == 404

    @pytest.mark.asyncio
    async def test_404_invalid_task_id(self, async_client):
        """Test que retorna 404 con task_id inválido."""
        # Intentar obtener subtasks de tarea inexistente
        response = await async_client.get("/tasks/99999/subtasks/")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

        # Intentar crear subtask en tarea inexistente
        create_response = await async_client.post(
            "/tasks/99999/subtasks/",
            json={"name": "Test"}
        )
        assert create_response.status_code == 404

    @pytest.mark.asyncio
    async def test_404_invalid_subtask_id(self, async_client, task_with_id):
        """Test que retorna 404 con subtask_id inválido."""
        response = await async_client.get(
            f"/tasks/{task_with_id}/subtasks/99999"
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_position_auto_assignment(self, async_client, task_with_id):
        """Test auto-asignación de position cuando no se especifica."""
        # Crear subtask sin position
        response1 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 1"}
        )
        assert response1.json()["position"] == 1

        # Crear otra sin position
        response2 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 2"}
        )
        assert response2.json()["position"] == 2

        # Crear otra sin position
        response3 = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Subtask 3"}
        )
        assert response3.json()["position"] == 3

    @pytest.mark.asyncio
    async def test_update_subtask(self, async_client, task_with_id):
        """Test PUT actualiza subtask correctamente."""
        # Crear subtask
        create_response = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "Original name"}
        )
        subtask_id = create_response.json()["id"]

        # Actualizar
        update_response = await async_client.put(
            f"/tasks/{task_with_id}/subtasks/{subtask_id}",
            json={"name": "Updated name", "completed": True, "position": 5}
        )

        assert update_response.status_code == 200
        result = update_response.json()
        assert result["name"] == "Updated name"
        assert result["completed"] is True
        assert result["position"] == 5
        assert result["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_validation_empty_name(self, async_client, task_with_id):
        """Test que rechaza nombre vacío."""
        response = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": ""}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_validation_name_too_long(self, async_client, task_with_id):
        """Test que rechaza nombre muy largo."""
        response = await async_client.post(
            f"/tasks/{task_with_id}/subtasks/",
            json={"name": "x" * 201}
        )
        assert response.status_code == 422
