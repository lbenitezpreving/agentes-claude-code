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
