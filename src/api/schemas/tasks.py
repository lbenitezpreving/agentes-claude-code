"""Schemas Pydantic para el recurso tasks."""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime, UTC
from enum import Enum


class TaskStatus(str, Enum):
    """Estados posibles de una tarea en el tablero Kanban."""
    BACKLOG = "backlog"
    DOING = "doing"
    DONE = "done"


class TaskBase(BaseModel):
    """Schema base con campos comunes."""
    name: str = Field(..., min_length=1, max_length=100, description="Nombre de la tarea")
    description: Optional[str] = Field(None, max_length=500, description="Descripción opcional")
    project_id: Optional[int] = Field(None, description="ID del proyecto asociado")
    status: TaskStatus = Field(default=TaskStatus.BACKLOG, description="Estado de la tarea en el tablero Kanban")


class TaskCreate(TaskBase):
    """Schema para crear una tarea."""
    pass


class TaskUpdate(BaseModel):
    """Schema para actualizar una tarea."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    completed: Optional[bool] = Field(None, description="Estado de completado")
    project_id: Optional[int] = Field(None, description="ID del proyecto asociado")
    status: Optional[TaskStatus] = Field(None, description="Estado de la tarea en el tablero Kanban")


class TaskResponse(TaskBase):
    """Schema de respuesta con campos adicionales."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = Field(None, description="Fecha de completado")
    deleted_at: Optional[datetime] = Field(None, description="Fecha de eliminación (NULL = activo)")
    status: TaskStatus = Field(default=TaskStatus.BACKLOG, description="Estado de la tarea en el tablero Kanban")
    subtasks: List["SubtaskResponseNested"] = Field(default_factory=list, description="Lista de subtareas")


# Schema simplificado para subtasks anidadas (evitar importación circular)
class SubtaskResponseNested(BaseModel):
    """Schema simplificado de Subtask para incluir en TaskResponse."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    name: str
    completed: bool
    position: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = Field(None, description="Fecha de eliminación (NULL = activo)")
