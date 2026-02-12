---
description: Genera un endpoint FastAPI con validación Pydantic y tests
argument-hint: "[endpoint_name]"
---

# Generador de Endpoints FastAPI con Mejores Prácticas

Genera un endpoint completo para: `$ARGUMENTS`

## Archivos Base Requeridos

Antes de generar el endpoint, verifica que existan:

- `src/api/exceptions.py` - Excepciones personalizadas
- `src/api/pagination.py` - Utilidades de paginación

Si no existen, créalos usando los siguientes templates:

### src/api/exceptions.py

```python
"""Excepciones personalizadas para la API."""
from fastapi import HTTPException, status


class ResourceNotFoundException(HTTPException):
    """Excepción para recursos no encontrados."""

    def __init__(self, resource: str, resource_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with id {resource_id} not found"
        )


class ResourceAlreadyExistsException(HTTPException):
    """Excepción para recursos duplicados."""

    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{resource} with {field}='{value}' already exists"
        )


class InvalidOperationException(HTTPException):
    """Excepción para operaciones inválidas."""

    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
```

### src/api/pagination.py

```python
"""Utilidades para paginación."""
from typing import Generic, List, TypeVar
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Respuesta paginada genérica."""

    items: List[T] = Field(description="Items en la página actual")
    total: int = Field(description="Total de items en la colección")
    skip: int = Field(description="Offset aplicado")
    limit: int = Field(description="Límite por página")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "items": [{"id": 1, "name": "Item de ejemplo"}],
                "total": 50,
                "skip": 0,
                "limit": 10
            }]
        }
    )
```

## Estructura a crear:

```
src/api/routes/$ARGUMENTS.py      # Router con endpoints CRUD
src/api/schemas/$ARGUMENTS.py     # Schemas Pydantic v2
tests/api/test_$ARGUMENTS.py      # Tests pytest
```

## Router: src/api/routes/$ARGUMENTS.py

**Checklist:**
- [ ] Prefix: `/$ARGUMENTS`
- [ ] Imports: ResourceNotFoundException, PaginatedResponse, Query
- [ ] **GET all con paginación**: skip, limit (Query), PaginatedResponse
- [ ] **GET by id con ResourceNotFoundException** (no HTTPException genérico)
- [ ] POST, PUT, DELETE con excepciones personalizadas apropiadas
- [ ] **Decoradores completos**: summary, description, response_description, responses
- [ ] **Docstrings detallados**: descripción, Args, Returns, Raises
- [ ] Async en todos los endpoints
- [ ] DB simulada: diccionario global `_{resources}_db: Dict[int, dict] = {}`

### Template GET all con Paginación

```python
from fastapi import APIRouter, Query
from ..schemas.$ARGUMENTS import {RESOURCE}Response, {RESOURCE}Create, {RESOURCE}Update
from ..exceptions import ResourceNotFoundException
from ..pagination import PaginatedResponse

router = APIRouter(prefix="/{resources}", tags=["{resources}"])

_{resources}_db: Dict[int, dict] = {}
_next_id = 1

@router.get(
    "/",
    response_model=PaginatedResponse[{RESOURCE}Response],
    summary="Obtener todos los {resources}",
    description="Retorna lista paginada de {resources}. Usa skip/limit para navegar.",
    response_description="Lista paginada de {resources}",
    responses={
        200: {
            "description": "{RESOURCES} recuperados exitosamente",
            "content": {
                "application/json": {
                    "example": {
                        "items": [{"id": 1, "name": "Ejemplo"}],
                        "total": 50,
                        "skip": 0,
                        "limit": 10
                    }
                }
            }
        }
    }
)
async def get_all_{resources}(
    skip: int = Query(default=0, ge=0, description="Número de registros a saltar para paginación"),
    limit: int = Query(default=10, ge=1, le=100, description="Máximo de registros a retornar (max: 100)")
):
    """
    Obtiene {resources} paginados.

    Args:
        skip: Offset para paginación (default: 0)
        limit: Límite de resultados (default: 10, max: 100)

    Returns:
        PaginatedResponse: Respuesta paginada con items y metadata
    """
    all_items = list(_{resources}_db.values())
    total = len(all_items)
    items = all_items[skip:skip + limit]

    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)
```

### Template GET by ID con Excepción Personalizada

```python
@router.get(
    "/{{{resource}_id}}",
    response_model={RESOURCE}Response,
    summary="Obtener {resource} por ID",
    description="Obtiene un {resource} específico por su identificador único",
    response_description="{RESOURCE} solicitado",
    responses={
        200: {"description": "{RESOURCE} encontrado exitosamente"},
        404: {
            "description": "{RESOURCE} no encontrado",
            "content": {
                "application/json": {
                    "example": {"detail": "{RESOURCE} with id 999 not found"}
                }
            }
        }
    }
)
async def get_{resource}({resource}_id: int):
    """
    Obtiene un {resource} por ID.

    Args:
        {resource}_id: ID único del {resource}

    Returns:
        {RESOURCE}Response: {RESOURCE} solicitado

    Raises:
        ResourceNotFoundException: Si el {resource} no existe
    """
    if {resource}_id not in _{resources}_db:
        raise ResourceNotFoundException("{RESOURCE}", {resource}_id)
    return _{resources}_db[{resource}_id]
```

### Template POST con Documentación Completa

```python
@router.post(
    "/",
    response_model={RESOURCE}Response,
    status_code=201,
    summary="Crear nuevo {resource}",
    description="Crea un nuevo {resource} con los datos proporcionados",
    response_description="{RESOURCE} creado exitosamente",
    responses={
        201: {"description": "{RESOURCE} creado exitosamente"},
        422: {"description": "Error de validación en los datos proporcionados"}
    }
)
async def create_{resource}({resource}: {RESOURCE}Create):
    """
    Crea un nuevo {resource}.

    Args:
        {resource}: Datos del {resource} a crear

    Returns:
        {RESOURCE}Response: {RESOURCE} creado con ID asignado
    """
    global _next_id
    {resource}_dict = {resource}.model_dump()
    {resource}_dict["id"] = _next_id
    {resource}_dict["created_at"] = datetime.now(UTC)
    _{resources}_db[_next_id] = {resource}_dict
    _next_id += 1
    return {resource}_dict
```

## Schemas: src/api/schemas/$ARGUMENTS.py

**Checklist:**
- [ ] Herencia: Base → Create/Update/Response
- [ ] **json_schema_extra con examples** en Create y Response
- [ ] Field() con description en todos los campos
- [ ] ConfigDict apropiado (from_attributes=True en Response)
- [ ] Validaciones: min_length, max_length, pattern según corresponda
- [ ] Usar `datetime.now(UTC)` para timestamps

### Template Schema con Ejemplos

```python
"""Schemas para {resources}."""
from datetime import datetime, UTC
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class {RESOURCE}Base(BaseModel):
    """Schema base para {resource}."""

    name: str = Field(
        min_length=1,
        max_length=100,
        description="Nombre del {resource}"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Descripción opcional del {resource}"
    )


class {RESOURCE}Create({RESOURCE}Base):
    """Schema para crear un {resource}."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Ejemplo de {resource}",
                    "description": "Descripción detallada del {resource}"
                }
            ]
        }
    )


class {RESOURCE}Update(BaseModel):
    """Schema para actualizar un {resource}."""

    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Nombre del {resource}"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Descripción del {resource}"
    )


class {RESOURCE}Response({RESOURCE}Base):
    """Schema de respuesta con campos adicionales."""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Ejemplo de {resource}",
                    "description": "Descripción detallada",
                    "created_at": "2025-01-15T10:30:00Z"
                }
            ]
        }
    )

    id: int = Field(description="ID único del {resource}")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Fecha de creación"
    )
```

## Tests: tests/api/test_$ARGUMENTS.py

**Checklist:**
- [ ] Fixture client con TestClient
- [ ] Fixture reset_db (autouse=True) para limpiar DB antes de cada test
- [ ] **Test paginación**: skip, limit, edge cases (límite máximo 100)
- [ ] **Test excepciones personalizadas**: 404, 409 con formato correcto
- [ ] Test validaciones Pydantic: 422
- [ ] Test CRUD completo
- [ ] **Coverage objetivo: >85%**

### Template Tests con Paginación

```python
"""Tests para endpoints de {resources}."""
import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.api.routes.{resources} import _{resources}_db, _next_id


@pytest.fixture
def client():
    """Fixture para TestClient."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_db():
    """Resetea la base de datos antes de cada test."""
    _{resources}_db.clear()
    global _next_id
    _next_id = 1
    yield
    _{resources}_db.clear()


def test_pagination_basic(client, reset_db):
    """Test paginación básica."""
    # Crear 25 items
    for i in range(25):
        client.post("/{resources}/", json={"name": f"Item {i}"})

    # Primera página (0-9)
    response = client.get("/{resources}/?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 10
    assert data["total"] == 25
    assert data["skip"] == 0
    assert data["limit"] == 10

    # Segunda página (10-19)
    response = client.get("/{resources}/?skip=10&limit=10")
    data = response.json()
    assert len(data["items"]) == 10
    assert data["skip"] == 10


def test_pagination_limits(client, reset_db):
    """Test límites de paginación."""
    # Límite máximo permitido (100)
    response = client.get("/{resources}/?limit=100")
    assert response.status_code == 200

    # Límite excedido debería fallar (>100)
    response = client.get("/{resources}/?limit=101")
    assert response.status_code == 422  # Validation error


def test_custom_exception_format(client, reset_db):
    """Test formato de excepción personalizada."""
    response = client.get("/{resources}/999")
    assert response.status_code == 404
    assert "{RESOURCE} with id 999 not found" in response.json()["detail"]


def test_create_{resource}(client, reset_db):
    """Test crear {resource}."""
    response = client.post(
        "/{resources}/",
        json={"name": "Test {resource}", "description": "Test description"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test {resource}"
    assert "id" in data
    assert "created_at" in data


def test_validation_errors(client, reset_db):
    """Test errores de validación."""
    # Nombre vacío
    response = client.post("/{resources}/", json={"name": ""})
    assert response.status_code == 422

    # Nombre muy largo
    response = client.post("/{resources}/", json={"name": "x" * 101})
    assert response.status_code == 422
```

## Instrucciones de Ejecución:

1. **Verificar archivos base**: Comprobar que existan `exceptions.py` y `pagination.py`
2. **Crear directorios** necesarios si no existen
3. **Generar router** con todos los endpoints usando los templates
4. **Generar schemas** con ejemplos y validaciones
5. **Generar tests** completos incluyendo paginación y excepciones
6. **Registrar router** en `src/main.py` si es necesario
7. **Ejecutar tests**: `pytest tests/api/test_{resources}.py -v --cov`
8. **Verificar cobertura**: Debe ser >85%

## Notas Importantes:

- Usar snake_case para nombres de recursos (ej: `user_profiles`)
- Reemplazar `{RESOURCE}` con el nombre en PascalCase (ej: `UserProfile`)
- Reemplazar `{resources}` con el nombre en plural snake_case (ej: `user_profiles`)
- Reemplazar `{resource}` con el nombre en singular snake_case (ej: `user_profile`)
- Usar `datetime.now(UTC)` en lugar de `datetime.utcnow()`
- Importar `from datetime import datetime, UTC`
