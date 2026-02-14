"""Schemas Pydantic para el recurso subtasks."""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime, UTC


class SubtaskBase(BaseModel):
    """Schema base con campos comunes."""
    name: str = Field(..., min_length=1, max_length=200, description="Nombre de la subtarea")


class SubtaskCreate(SubtaskBase):
    """Schema para crear una subtarea."""
    position: Optional[int] = Field(default=0, ge=0, description="Posición de la subtarea en la lista")


class SubtaskUpdate(BaseModel):
    """Schema para actualizar una subtarea."""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Nombre de la subtarea")
    completed: Optional[bool] = Field(None, description="Estado de completado")
    position: Optional[int] = Field(None, ge=0, description="Posición de la subtarea en la lista")


class SubtaskResponse(SubtaskBase):
    """Schema de respuesta con campos adicionales."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    completed: bool = Field(default=False)
    position: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: Optional[datetime] = Field(None, description="Fecha de completado")
