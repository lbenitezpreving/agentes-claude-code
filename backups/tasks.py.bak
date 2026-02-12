"""Router para el recurso tasks."""
from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime, UTC

from ..schemas.tasks import TaskCreate, TaskUpdate, TaskResponse, TaskStatus

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
        "project_id": data.project_id,
        "status": data.status.value,  # Usar el valor del enum (default: "backlog")
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

    # Sincronización bidireccional completed ↔ status
    if "status" in update_data and "completed" not in update_data:
        # Si se actualiza status, sincronizar completed
        status_value = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]
        if status_value == "done":
            task["completed"] = True
            task["completed_at"] = datetime.now(UTC)
        else:
            task["completed"] = False
            task["completed_at"] = None

    if "completed" in update_data and "status" not in update_data:
        # Si se actualiza completed, sincronizar status
        if update_data["completed"]:
            task["status"] = "done"
        elif task.get("status") == "done":
            # Si completed=False y status era "done", cambiar a backlog
            task["status"] = "backlog"

    # Si ambos están presentes, aplicar la lógica de completed primero
    if "completed" in update_data and "status" in update_data:
        status_value = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]
        if update_data["completed"]:
            task["status"] = "done"
        elif status_value == "done" and not update_data["completed"]:
            task["status"] = "backlog"

    # Aplicar cambios
    for field, value in update_data.items():
        if field == "status":
            # Convertir enum a string si es necesario
            task[field] = value.value if hasattr(value, "value") else value
        else:
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

    # Sincronizar status con completed
    task["status"] = "done" if task["completed"] else "backlog"

    return task


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(task_id: int, new_status: TaskStatus):
    """Actualiza rápidamente solo el status de una tarea."""
    if task_id not in _tasks_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task = _tasks_db[task_id]
    status_value = new_status.value

    # Actualizar status
    task["status"] = status_value

    # Sincronizar completed y completed_at
    if status_value == "done":
        task["completed"] = True
        task["completed_at"] = datetime.now(UTC)
    else:
        task["completed"] = False
        task["completed_at"] = None

    task["updated_at"] = datetime.now(UTC)
    _tasks_db[task_id] = task

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
