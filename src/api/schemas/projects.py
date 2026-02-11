"""Schemas Pydantic para el recurso projects."""
from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    """Schema base con campos comunes."""
    name: str = Field(..., min_length=1, max_length=100, description="Nombre del proyecto")
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$', description="Color en formato hex")


class ProjectCreate(ProjectBase):
    """Schema para crear un proyecto."""
    pass


class ProjectUpdate(BaseModel):
    """Schema para actualizar un proyecto."""
    name: str | None = Field(None, min_length=1, max_length=100)
    color: str | None = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')


class ProjectResponse(ProjectBase):
    """Schema de respuesta con campos adicionales."""
    model_config = ConfigDict(from_attributes=True)

    id: int
