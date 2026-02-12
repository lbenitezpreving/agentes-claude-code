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
