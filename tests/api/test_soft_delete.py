"""Tests para borrado lógico (soft delete) de tasks y subtasks."""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from datetime import datetime
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


@pytest.mark.asyncio
async def test_soft_delete_task_sets_deleted_at(async_client: AsyncClient):
    """Verificar que DELETE marca deleted_at en lugar de eliminar físicamente."""
    # Crear tarea
    response = await async_client.post("/tasks/", json={"name": "Task to delete"})
    assert response.status_code == 201
    task_id = response.json()["id"]
    assert response.json()["deleted_at"] is None

    # Eliminar tarea
    response = await async_client.delete(f"/tasks/{task_id}")
    assert response.status_code == 204

    # Verificar que existe con show_deleted=true y tiene deleted_at
    response = await async_client.get(f"/tasks/{task_id}?show_deleted=true")
    assert response.status_code == 200
    data = response.json()
    assert data["deleted_at"] is not None
    # Verificar que deleted_at es un timestamp válido
    deleted_at = datetime.fromisoformat(data["deleted_at"].replace("Z", "+00:00"))
    assert isinstance(deleted_at, datetime)


@pytest.mark.asyncio
async def test_get_deleted_task_returns_404(async_client: AsyncClient):
    """GET sin show_deleted retorna 404 para tareas eliminadas."""
    # Crear y eliminar tarea
    response = await async_client.post("/tasks/", json={"name": "Task to delete"})
    task_id = response.json()["id"]
    await async_client.delete(f"/tasks/{task_id}")

    # GET sin show_deleted debe retornar 404
    response = await async_client.get(f"/tasks/{task_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


@pytest.mark.asyncio
async def test_get_deleted_task_with_flag_returns_200(async_client: AsyncClient):
    """GET con show_deleted=true retorna tarea eliminada."""
    # Crear y eliminar tarea
    response = await async_client.post("/tasks/", json={"name": "Task to delete"})
    task_id = response.json()["id"]
    await async_client.delete(f"/tasks/{task_id}")

    # GET con show_deleted=true debe retornar 200
    response = await async_client.get(f"/tasks/{task_id}?show_deleted=true")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["deleted_at"] is not None


@pytest.mark.asyncio
async def test_cascade_soft_delete_to_subtasks(async_client: AsyncClient):
    """DELETE task marca deleted_at en todas sus subtasks (cascada lógica)."""
    # Crear tarea con subtasks
    response = await async_client.post("/tasks/", json={"name": "Parent task"})
    task_id = response.json()["id"]

    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Subtask 1"}
    )
    subtask1_id = response.json()["id"]

    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Subtask 2"}
    )
    subtask2_id = response.json()["id"]

    # Eliminar tarea padre
    response = await async_client.delete(f"/tasks/{task_id}")
    assert response.status_code == 204

    # Verificar que la tarea tiene deleted_at
    response = await async_client.get(f"/tasks/{task_id}?show_deleted=true")
    assert response.status_code == 200
    task_data = response.json()
    assert task_data["deleted_at"] is not None

    # Verificar que ambas subtasks tienen deleted_at con la misma fecha
    subtasks = task_data["subtasks"]
    assert len(subtasks) == 2
    assert all(s["deleted_at"] is not None for s in subtasks)
    # Todas deben tener el mismo deleted_at (mismo timestamp de eliminación)
    deleted_timestamps = [s["deleted_at"] for s in subtasks]
    assert deleted_timestamps[0] == deleted_timestamps[1]
    assert deleted_timestamps[0] == task_data["deleted_at"]


@pytest.mark.asyncio
async def test_auto_complete_ignores_deleted_subtasks(async_client: AsyncClient):
    """Auto-complete solo considera subtasks activas, ignora eliminadas."""
    # Crear tarea con 2 subtasks
    response = await async_client.post("/tasks/", json={"name": "Parent task"})
    task_id = response.json()["id"]

    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Subtask 1"}
    )
    subtask1_id = response.json()["id"]

    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Subtask 2"}
    )
    subtask2_id = response.json()["id"]

    # Completar ambas subtasks (task debe auto-completarse)
    await async_client.patch(f"/tasks/{task_id}/subtasks/{subtask1_id}/toggle")
    await async_client.patch(f"/tasks/{task_id}/subtasks/{subtask2_id}/toggle")

    # Verificar que task está completed
    response = await async_client.get(f"/tasks/{task_id}")
    assert response.json()["completed"] is True
    assert response.json()["status"] == "done"

    # Eliminar subtask1 (la tarea debe seguir completed porque queda 1 activa completada)
    await async_client.delete(f"/tasks/{task_id}/subtasks/{subtask1_id}")

    # Verificar que task sigue completed (solo cuenta subtask2 que está activa)
    response = await async_client.get(f"/tasks/{task_id}")
    assert response.json()["completed"] is True
    assert response.json()["status"] == "done"

    # Descompletar subtask2 (task debe cambiar a incompleted)
    await async_client.patch(f"/tasks/{task_id}/subtasks/{subtask2_id}/toggle")

    # Verificar que task cambió a incompleted
    response = await async_client.get(f"/tasks/{task_id}")
    assert response.json()["completed"] is False
    assert response.json()["status"] == "backlog"


@pytest.mark.asyncio
async def test_update_deleted_task_returns_404(async_client: AsyncClient):
    """PUT/PATCH en tarea eliminada retorna 404."""
    # Crear y eliminar tarea
    response = await async_client.post("/tasks/", json={"name": "Task to delete"})
    task_id = response.json()["id"]
    await async_client.delete(f"/tasks/{task_id}")

    # Intentar actualizar con PUT
    response = await async_client.put(
        f"/tasks/{task_id}",
        json={"name": "Updated name"}
    )
    assert response.status_code == 404

    # Intentar toggle
    response = await async_client.patch(f"/tasks/{task_id}/toggle")
    assert response.status_code == 404

    # Intentar actualizar status
    response = await async_client.patch(
        f"/tasks/{task_id}/status?new_status=done"
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_deleted_subtask_returns_404(async_client: AsyncClient):
    """PUT/PATCH en subtask eliminada retorna 404."""
    # Crear tarea y subtask
    response = await async_client.post("/tasks/", json={"name": "Parent task"})
    task_id = response.json()["id"]

    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Subtask"}
    )
    subtask_id = response.json()["id"]

    # Eliminar subtask
    await async_client.delete(f"/tasks/{task_id}/subtasks/{subtask_id}")

    # Intentar actualizar con PUT
    response = await async_client.put(
        f"/tasks/{task_id}/subtasks/{subtask_id}",
        json={"name": "Updated name"}
    )
    assert response.status_code == 404

    # Intentar toggle
    response = await async_client.patch(
        f"/tasks/{task_id}/subtasks/{subtask_id}/toggle"
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_position_assignment_ignores_deleted(async_client: AsyncClient):
    """CREATE subtask ignora eliminadas al calcular max position."""
    # Crear tarea
    response = await async_client.post("/tasks/", json={"name": "Parent task"})
    task_id = response.json()["id"]

    # Crear 3 subtasks
    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Subtask 1"}
    )
    subtask1_id = response.json()["id"]
    assert response.json()["position"] == 1

    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Subtask 2"}
    )
    subtask2_id = response.json()["id"]
    assert response.json()["position"] == 2

    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Subtask 3"}
    )
    subtask3_id = response.json()["id"]
    assert response.json()["position"] == 3

    # Eliminar subtask2 (position 2)
    await async_client.delete(f"/tasks/{task_id}/subtasks/{subtask2_id}")

    # Crear nueva subtask (debe asignarse position 4, no 2)
    # porque max_position ignora eliminadas y toma el max de activas (3)
    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Subtask 4"}
    )
    assert response.json()["position"] == 4


@pytest.mark.asyncio
async def test_get_all_tasks_filters_deleted_by_default(async_client: AsyncClient):
    """GET /tasks/ no incluye tareas eliminadas por defecto."""
    # Crear 2 tareas, eliminar 1
    response = await async_client.post("/tasks/", json={"name": "Active task"})
    active_id = response.json()["id"]

    response = await async_client.post("/tasks/", json={"name": "Deleted task"})
    deleted_id = response.json()["id"]
    await async_client.delete(f"/tasks/{deleted_id}")

    # GET sin show_deleted debe retornar solo la activa
    response = await async_client.get("/tasks/")
    assert response.status_code == 200
    tasks = response.json()
    task_ids = [t["id"] for t in tasks]
    assert active_id in task_ids
    assert deleted_id not in task_ids

    # GET con show_deleted=true debe retornar ambas
    response = await async_client.get("/tasks/?show_deleted=true")
    assert response.status_code == 200
    tasks = response.json()
    task_ids = [t["id"] for t in tasks]
    assert active_id in task_ids
    assert deleted_id in task_ids


@pytest.mark.asyncio
async def test_get_task_subtasks_filters_deleted_by_default(async_client: AsyncClient):
    """GET /tasks/{id}/subtasks/ no incluye subtasks eliminadas por defecto."""
    # Crear tarea con 2 subtasks, eliminar 1
    response = await async_client.post("/tasks/", json={"name": "Parent task"})
    task_id = response.json()["id"]

    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Active subtask"}
    )
    active_id = response.json()["id"]

    response = await async_client.post(
        f"/tasks/{task_id}/subtasks/",
        json={"name": "Deleted subtask"}
    )
    deleted_id = response.json()["id"]
    await async_client.delete(f"/tasks/{task_id}/subtasks/{deleted_id}")

    # GET sin show_deleted debe retornar solo la activa
    response = await async_client.get(f"/tasks/{task_id}/subtasks/")
    assert response.status_code == 200
    subtasks = response.json()
    subtask_ids = [s["id"] for s in subtasks]
    assert active_id in subtask_ids
    assert deleted_id not in subtask_ids

    # GET con show_deleted=true debe retornar ambas
    response = await async_client.get(f"/tasks/{task_id}/subtasks/?show_deleted=true")
    assert response.status_code == 200
    subtasks = response.json()
    subtask_ids = [s["id"] for s in subtasks]
    assert active_id in subtask_ids
    assert deleted_id in subtask_ids
