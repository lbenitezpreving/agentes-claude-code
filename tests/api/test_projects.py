"""Tests para los endpoints de projects con SQLite."""
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
async def seed_projects(async_client):
    """Fixture para crear los 4 proyectos de ejemplo."""
    projects_data = [
        {"name": "Trabajo", "color": "#3498db"},
        {"name": "Personal", "color": "#2ecc71"},
        {"name": "Estudios", "color": "#9b59b6"},
        {"name": "Hogar", "color": "#e74c3c"},
    ]

    for proj_data in projects_data:
        await async_client.post("/projects/", json=proj_data)


class TestProjectsEndpoints:
    """Tests para los endpoints de projects."""

    @pytest.mark.asyncio
    async def test_get_all_projects(self, async_client, seed_projects):
        """Test GET /projects devuelve los 4 proyectos de ejemplo."""
        response = await async_client.get("/projects/")
        assert response.status_code == 200
        projects = response.json()
        assert len(projects) == 4
        assert projects[0]["name"] == "Trabajo"
        assert projects[1]["name"] == "Personal"
        assert projects[2]["name"] == "Estudios"
        assert projects[3]["name"] == "Hogar"

    @pytest.mark.asyncio
    async def test_get_project(self, async_client, seed_projects):
        """Test GET /projects/{id}."""
        # Obtener lista primero para saber el ID
        list_response = await async_client.get("/projects/")
        project_id = list_response.json()[0]["id"]

        response = await async_client.get(f"/projects/{project_id}")
        assert response.status_code == 200
        project = response.json()
        assert project["name"] == "Trabajo"
        assert project["color"] == "#3498db"

    @pytest.mark.asyncio
    async def test_get_project_not_found(self, async_client):
        """Test GET /projects/{id} cuando no existe."""
        response = await async_client.get("/projects/999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_project(self, async_client):
        """Test POST /projects."""
        data = {"name": "Nuevo Proyecto", "color": "#ff5733"}
        response = await async_client.post("/projects/", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["name"] == "Nuevo Proyecto"
        assert result["color"] == "#ff5733"
        assert "id" in result

    @pytest.mark.asyncio
    async def test_create_project_invalid_color(self, async_client):
        """Test POST /projects con color inválido."""
        data = {"name": "Test", "color": "invalid"}
        response = await async_client.post("/projects/", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_project(self, async_client, seed_projects):
        """Test PUT /projects/{id}."""
        # Obtener ID del primer proyecto
        list_response = await async_client.get("/projects/")
        project_id = list_response.json()[0]["id"]

        response = await async_client.put(
            f"/projects/{project_id}",
            json={"name": "Trabajo Actualizado"}
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Trabajo Actualizado"

    @pytest.mark.asyncio
    async def test_update_project_not_found(self, async_client):
        """Test PUT /projects/{id} cuando no existe."""
        response = await async_client.put("/projects/999", json={"name": "Test"})
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_project(self, async_client):
        """Test DELETE /projects/{id}."""
        # Crear proyecto para eliminar
        create_response = await async_client.post(
            "/projects/",
            json={"name": "A eliminar", "color": "#000000"}
        )
        project_id = create_response.json()["id"]

        # Eliminar
        response = await async_client.delete(f"/projects/{project_id}")
        assert response.status_code == 204

        # Verificar que no existe
        get_response = await async_client.get(f"/projects/{project_id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_project_not_found(self, async_client):
        """Test DELETE /projects/{id} cuando no existe."""
        response = await async_client.delete("/projects/999")
        assert response.status_code == 404
