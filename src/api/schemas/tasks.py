"""Schemas Pydantic para el recurso tasks."""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime, UTC


class TaskBase(BaseModel):
    """Schema base con campos comunes."""
    name: str = Field(..., min_length=1, max_length=100, description="Nombre de la tarea")
    description: Optional[str] = Field(None, max_length=500, description="Descripción opcional")


class TaskCreate(TaskBase):
    """Schema para crear una tarea."""
    pass


class TaskUpdate(BaseModel):
    """Schema para actualizar una tarea."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    completed: Optional[bool] = Field(None, description="Estado de completado")


class TaskResponse(TaskBase):
    """Schema de respuesta con campos adicionales."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = Field(None, description="Fecha de completado")
