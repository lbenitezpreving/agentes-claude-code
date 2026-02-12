"""Tests para utilidades de paginación."""
import pytest
from pydantic import BaseModel, Field
from src.api.pagination import PaginatedResponse


class SampleItem(BaseModel):
    """Item de ejemplo para tests."""
    id: int
    name: str


def test_paginated_response_creation():
    """Test crear PaginatedResponse."""
    items = [
        SampleItem(id=1, name="Item 1"),
        SampleItem(id=2, name="Item 2"),
        SampleItem(id=3, name="Item 3")
    ]

    response = PaginatedResponse(
        items=items,
        total=10,
        skip=0,
        limit=3
    )

    assert len(response.items) == 3
    assert response.total == 10
    assert response.skip == 0
    assert response.limit == 3


def test_paginated_response_empty():
    """Test PaginatedResponse con lista vacía."""
    response = PaginatedResponse[SampleItem](
        items=[],
        total=0,
        skip=0,
        limit=10
    )

    assert len(response.items) == 0
    assert response.total == 0


def test_paginated_response_serialization():
    """Test serialización de PaginatedResponse."""
    items = [SampleItem(id=1, name="Item 1")]

    response = PaginatedResponse(
        items=items,
        total=1,
        skip=0,
        limit=10
    )

    # Convertir a dict
    data = response.model_dump()

    assert "items" in data
    assert "total" in data
    assert "skip" in data
    assert "limit" in data
    assert data["items"][0]["id"] == 1
    assert data["items"][0]["name"] == "Item 1"


def test_paginated_response_has_examples():
    """Test que PaginatedResponse tiene ejemplos en el schema."""
    schema = PaginatedResponse.model_config.get("json_schema_extra")

    assert schema is not None
    assert "examples" in schema
    assert len(schema["examples"]) > 0

    example = schema["examples"][0]
    assert "items" in example
    assert "total" in example
    assert "skip" in example
    assert "limit" in example


def test_paginated_response_with_different_types():
    """Test PaginatedResponse con diferentes tipos genéricos."""

    class Product(BaseModel):
        id: int
        price: float

    products = [
        Product(id=1, price=9.99),
        Product(id=2, price=19.99)
    ]

    response = PaginatedResponse[Product](
        items=products,
        total=100,
        skip=20,
        limit=2
    )

    assert len(response.items) == 2
    assert response.items[0].price == 9.99
    assert response.total == 100
    assert response.skip == 20
