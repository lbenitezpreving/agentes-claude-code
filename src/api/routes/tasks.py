"""Router para el recurso tasks."""
from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime, UTC

from ..schemas.tasks import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Almacenamiento en memoria para demo
_tasks_db: dict[int, dict] = {}
_next_id = 1


@router.get("/", response_model=List[TaskResponse])
async def get_all_tasks():
    """Obtiene todas las tareas."""
    return list(_tasks_db.values())


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int):
    """Obtiene una tarea por ID."""
    if task_id not in _tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return _tasks_db[task_id]


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(data: TaskCreate):
    """Crea una nueva tarea."""
    global _next_id

    task = {
        "id": _next_id,
        "name": data.name,
        "description": data.description,
        "completed": False,
        "created_at": datetime.now(UTC),
        "updated_at": None,
        "completed_at": None,
    }

    _tasks_db[_next_id] = task
    _next_id += 1

    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, data: TaskUpdate):
    """Actualiza una tarea existente."""
    if task_id not in _tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task = _tasks_db[task_id]
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        task[field] = value

    # Actualizar completed_at si cambia el estado de completed
    if "completed" in update_data:
        task["completed_at"] = datetime.now(UTC) if update_data["completed"] else None

    task["updated_at"] = datetime.now(UTC)
    _tasks_db[task_id] = task

    return task


@router.patch("/{task_id}/toggle", response_model=TaskResponse)
async def toggle_task(task_id: int):
    """Alterna el estado de completado de una tarea."""
    if task_id not in _tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task = _tasks_db[task_id]
    task["completed"] = not task["completed"]
    task["updated_at"] = datetime.now(UTC)
    task["completed_at"] = datetime.now(UTC) if task["completed"] else None

    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int):
    """Elimina una tarea."""
    if task_id not in _tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    del _tasks_db[task_id]
    return None
