---
description: Configura persistencia SQLite con SQLAlchemy 2.0 async y mejores prácticas
argument-hint: "[model_name]"
---

# Setup de SQLite con SQLAlchemy 2.0 Async

Configura persistencia con SQLite para el modelo: `$ARGUMENTS`

## Dependencias Requeridas

Instalar en `requirements.txt`:

```txt
sqlalchemy>=2.0.25
aiosqlite>=0.19.0
```

**Instalación:**
```bash
pip install sqlalchemy>=2.0.25 aiosqlite>=0.19.0
```

## Archivos Base Requeridos

### 1. src/api/database.py

**Propósito:** Configuración centralizada de la base de datos con session management async.

**Checklist:**
- [ ] AsyncEngine con aiosqlite
- [ ] async_sessionmaker configurado
- [ ] Dependency get_db() para FastAPI
- [ ] init_db() para crear tablas
- [ ] Base declarativa para modelos

**Template:**

```python
"""Configuración de base de datos SQLite con SQLAlchemy 2.0 async."""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

# URL de conexión SQLite async
DATABASE_URL = "sqlite+aiosqlite:///./app.db"

# Engine async
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Cambiar a True para debug SQL
    future=True,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class para todos los modelos ORM."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para obtener sesión de base de datos.

    Yields:
        AsyncSession: Sesión async de SQLAlchemy

    Example:
        @router.get("/items/")
        async def get_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Inicializa la base de datos creando todas las tablas.

    Se debe llamar en el evento startup de FastAPI.

    Example:
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            await init_db()
            yield
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### 2. Actualizar src/main.py

Añadir lifespan context manager para inicializar BD en startup:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.api.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la aplicación."""
    # Startup: Crear tablas
    await init_db()
    yield
    # Shutdown: Cleanup si necesario


app = FastAPI(lifespan=lifespan)
```

## Estructura de Modelo ORM

### Template para Modelo (src/api/models/$ARGUMENTS.py)

**Checklist:**
- [ ] Heredar de Base (desde database.py)
- [ ] Usar Mapped types (SQLAlchemy 2.0 style)
- [ ] __tablename__ en snake_case
- [ ] Primary key con mapped_column(primary_key=True)
- [ ] Foreign keys con ForeignKey() y relationship()
- [ ] Timestamps: created_at, updated_at
- [ ] __repr__ para debugging

**Template Básico:**

```python
"""Modelo ORM para {resource}."""
from datetime import datetime, UTC
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class {RESOURCE}(Base):
    """Modelo ORM para {resource}."""

    __tablename__ = "{resources}"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Campos básicos
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=lambda: datetime.now(UTC),
        nullable=True
    )

    def __repr__(self) -> str:
        return f"<{RESOURCE}(id={self.id}, name='{self.name}')>"
```

**Template con Foreign Key:**

```python
class Task(Base):
    """Modelo ORM para Task."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Foreign Key (opcional, puede ser NULL)
    project_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True
    )

    # Relationship
    project: Mapped[Optional["Project"]] = relationship(
        "Project",
        back_populates="tasks"
    )
```

## Actualizar Router para usar SQLAlchemy

### Cambios necesarios en src/api/routes/$ARGUMENTS.py

**Checklist:**
- [ ] Añadir import: `from sqlalchemy import select, func`
- [ ] Añadir import: `from sqlalchemy.ext.asyncio import AsyncSession`
- [ ] Añadir import: `from fastapi import Depends`
- [ ] Añadir import del modelo: `from ..models.{resource} import {RESOURCE}`
- [ ] Añadir dependency: `db: AsyncSession = Depends(get_db)`
- [ ] Reemplazar operaciones de diccionario por queries SQL
- [ ] Mantener lógica de negocio existente
- [ ] Remover diccionarios globales (_db, _next_id)

**Ejemplo GET all con paginación:**

```python
@router.get("/", response_model=PaginatedResponse[{RESOURCE}Response])
async def get_all_{resources}(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Obtiene {resources} paginados desde la base de datos."""

    # Contar total
    count_query = select(func.count()).select_from({RESOURCE})
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Obtener items paginados
    query = select({RESOURCE}).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    # Convertir a Pydantic
    items_response = [{RESOURCE}Response.model_validate(item) for item in items]

    return PaginatedResponse(items=items_response, total=total, skip=skip, limit=limit)
```

**Ejemplo GET by ID:**

```python
@router.get("/{{{resource}_id}}", response_model={RESOURCE}Response)
async def get_{resource}(
    {resource}_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Obtiene {resource} por ID."""
    query = select({RESOURCE}).where({RESOURCE}.id == {resource}_id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if item is None:
        raise ResourceNotFoundException("{RESOURCE}", {resource}_id)

    return {RESOURCE}Response.model_validate(item)
```

**Ejemplo POST:**

```python
@router.post("/", response_model={RESOURCE}Response, status_code=201)
async def create_{resource}(
    data: {RESOURCE}Create,
    db: AsyncSession = Depends(get_db)
):
    """Crea nuevo {resource}."""
    # Crear instancia ORM
    db_{resource} = {RESOURCE}(**data.model_dump())

    # Guardar en BD
    db.add(db_{resource})
    await db.flush()  # Obtener ID sin commit
    await db.refresh(db_{resource})  # Cargar campos generados

    return {RESOURCE}Response.model_validate(db_{resource})
```

**Ejemplo PUT:**

```python
@router.put("/{{{resource}_id}}", response_model={RESOURCE}Response)
async def update_{resource}(
    {resource}_id: int,
    data: {RESOURCE}Update,
    db: AsyncSession = Depends(get_db)
):
    """Actualiza {resource} existente."""
    # Obtener item
    query = select({RESOURCE}).where({RESOURCE}.id == {resource}_id)
    result = await db.execute(query)
    db_{resource} = result.scalar_one_or_none()

    if db_{resource} is None:
        raise ResourceNotFoundException("{RESOURCE}", {resource}_id)

    # Aplicar cambios
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_{resource}, field, value)

    # Actualizar timestamp
    db_{resource}.updated_at = datetime.now(UTC)

    await db.flush()
    await db.refresh(db_{resource})

    return {RESOURCE}Response.model_validate(db_{resource})
```

**Ejemplo DELETE:**

```python
@router.delete("/{{{resource}_id}}", status_code=204)
async def delete_{resource}(
    {resource}_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Elimina {resource}."""
    query = select({RESOURCE}).where({RESOURCE}.id == {resource}_id)
    result = await db.execute(query)
    db_{resource} = result.scalar_one_or_none()

    if db_{resource} is None:
        raise ResourceNotFoundException("{RESOURCE}", {resource}_id)

    await db.delete(db_{resource})
    return None
```

## Migración de Datos Existentes

### Script de Migración (src/api/migrate_data.py)

**Propósito:** Migrar datos hardcodeados desde memoria a SQLite.

```python
"""Script para migrar datos iniciales a SQLite."""
import asyncio
from sqlalchemy import select
from src.api.database import async_session_maker, init_db
from src.api.models.project import Project
from src.api.models.task import Task


async def migrate_projects():
    """Migra proyectos iniciales."""
    initial_projects = [
        {"id": 1, "name": "Trabajo", "color": "#3498db"},
        {"id": 2, "name": "Personal", "color": "#2ecc71"},
        {"id": 3, "name": "Estudios", "color": "#9b59b6"},
        {"id": 4, "name": "Hogar", "color": "#e74c3c"},
    ]

    async with async_session_maker() as session:
        for proj_data in initial_projects:
            # Verificar si ya existe
            query = select(Project).where(Project.id == proj_data["id"])
            result = await session.execute(query)
            existing = result.scalar_one_or_none()

            if existing is None:
                project = Project(**proj_data)
                session.add(project)
                print(f"✓ Proyecto creado: {proj_data['name']}")
            else:
                print(f"- Proyecto ya existe: {proj_data['name']}")

        await session.commit()


async def migrate_tasks():
    """Migra tareas iniciales (si las hay)."""
    # Añadir aquí si hay tareas hardcodeadas
    pass


async def main():
    """Ejecuta todas las migraciones."""
    print("Iniciando migración de datos...")

    # Crear tablas primero
    await init_db()
    print("✓ Tablas creadas")

    # Migrar datos
    await migrate_projects()
    await migrate_tasks()

    print("✓ Migración completada")


if __name__ == "__main__":
    asyncio.run(main())
```

**Ejecutar:**
```bash
python -m src.api.migrate_data
```

## Adaptación de Tests

### Fixtures para Tests Async

**Checklist:**
- [ ] Fixture `test_engine` con SQLite en memoria (`:memory:`)
- [ ] Fixture `test_db` que crea/destruye tablas
- [ ] Fixture `async_client` con override de `get_db`
- [ ] Marcar tests con `@pytest.mark.asyncio`
- [ ] Cambiar `def test_*` a `async def test_*`
- [ ] Usar `await` en llamadas a client

**Template (tests/api/test_$ARGUMENTS.py):**

```python
"""Tests para {resources} con SQLite."""
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


@pytest.mark.asyncio
async def test_create_{resource}(async_client):
    """Test crear {resource}."""
    response = await async_client.post(
        "/{resources}/",
        json={"name": "Test", "description": "Test desc"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test"
    assert "id" in data


@pytest.mark.asyncio
async def test_pagination(async_client):
    """Test paginación."""
    # Crear 15 items
    for i in range(15):
        await async_client.post("/{resources}/", json={"name": f"Item {i}"})

    # Obtener primera página
    response = await async_client.get("/{resources}/?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 10
    assert data["total"] == 15
```

**Configurar pytest-asyncio en pyproject.toml:**

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

## Mejores Prácticas

### 1. Manejo de Conexiones
- ✅ Usar `async with` para sessions
- ✅ Configurar `expire_on_commit=False` para evitar lazy loading
- ✅ Usar `flush()` + `refresh()` para obtener IDs sin commit completo

### 2. Queries Eficientes
- ✅ Usar `select()` en lugar de `Query` (SQLAlchemy 2.0 style)
- ✅ Cargar relaciones con `selectinload()` o `joinedload()`
- ✅ Usar `scalar_one_or_none()` para obtener un solo resultado

### 3. Validación
- ✅ Schemas Pydantic NO cambian (compatibilidad)
- ✅ Usar `model_validate()` para convertir ORM a Pydantic
- ✅ Configurar `ConfigDict(from_attributes=True)` en schemas Response

### 4. Timestamps
- ✅ Usar `datetime.now(UTC)` en lugar de `datetime.utcnow()`
- ✅ Configurar `onupdate` en columnas para auto-actualización
- ✅ Importar desde `datetime import datetime, UTC`

### 5. Testing
- ✅ Usar `:memory:` para tests (más rápido)
- ✅ Crear/destruir tablas en cada test (aislamiento)
- ✅ Override de `get_db` con fixture de test
- ✅ Mantener mismo coverage (>85%)

## Checklist de Validación Final

- [ ] BD creada: `ls -lh app.db`
- [ ] Tablas correctas: `sqlite3 app.db ".schema"`
- [ ] Datos migrados: `sqlite3 app.db "SELECT COUNT(*) FROM {resources};"`
- [ ] Tests pasan: `pytest tests/api/test_{resources}.py -v`
- [ ] Coverage >85%: `pytest --cov=src/api --cov-report=term-missing`
- [ ] API funciona: `uvicorn src.main:app --reload`
- [ ] Endpoints responden correctamente

## Comandos Útiles

```bash
# Instalar dependencias
pip install sqlalchemy>=2.0.25 aiosqlite>=0.19.0

# Ejecutar migración
python -m src.api.migrate_data

# Ver estructura de BD
sqlite3 app.db ".schema"

# Consultar datos
sqlite3 app.db "SELECT * FROM {resources};"

# Tests
pytest tests/api/ -v --cov=src/api

# Ejecutar API
uvicorn src.main:app --reload --port 8000
```

## Migración a PostgreSQL (Futuro)

Para migrar a PostgreSQL posteriormente, solo cambiar:

```python
# De:
DATABASE_URL = "sqlite+aiosqlite:///./app.db"

# A:
DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/dbname"
```

Instalar: `pip install asyncpg`

Los modelos ORM no requieren cambios.
