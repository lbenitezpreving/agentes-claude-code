"""Router para el recurso tasks."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, UTC
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.tasks import TaskCreate, TaskUpdate, TaskResponse, TaskStatus
from ..database import get_db
from ..models.task import Task

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Migrado a SQLite - ver backups/tasks.py.bak para versión original
# _tasks_db: dict[int, dict] = {}
# _next_id = 1


@router.get("/", response_model=List[TaskResponse])
async def get_all_tasks(show_deleted: bool = False, db: AsyncSession = Depends(get_db)):
    """Obtiene todas las tareas con sus subtareas desde la base de datos."""
    # Eager loading de subtasks para evitar N+1 queries
    query = select(Task).options(selectinload(Task.subtasks))

    # Filtrar tareas eliminadas si show_deleted=False
    if not show_deleted:
        query = query.where(Task.deleted_at.is_(None))

    result = await db.execute(query)
    tasks = result.scalars().all()

    # Filtrar subtasks eliminadas en cada tarea (si show_deleted=False)
    if not show_deleted:
        for task in tasks:
            task.subtasks = [s for s in task.subtasks if s.deleted_at is None]

    return [TaskResponse.model_validate(task) for task in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, show_deleted: bool = False, db: AsyncSession = Depends(get_db)):
    """Obtiene una tarea por ID con sus subtareas."""
    # Eager loading de subtasks
    query = select(Task).options(selectinload(Task.subtasks)).where(Task.id == task_id)

    # Filtrar tareas eliminadas si show_deleted=False
    if not show_deleted:
        query = query.where(Task.deleted_at.is_(None))

    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Filtrar subtasks eliminadas (si show_deleted=False)
    if not show_deleted:
        task.subtasks = [s for s in task.subtasks if s.deleted_at is None]

    return TaskResponse.model_validate(task)


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db)):
    """Crea una nueva tarea."""
    task_data = data.model_dump()

    # Status default es "backlog" (manejado por schema)
    # Completed default es False
    task_data["status"] = data.status.value  # Convertir enum a string
    task_data["completed"] = False
    task_data["completed_at"] = None

    # Crear instancia ORM
    db_task = Task(**task_data)

    # Guardar en BD
    db.add(db_task)
    await db.flush()
    await db.refresh(db_task, ["subtasks"])

    return TaskResponse.model_validate(db_task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Actualiza una tarea existente."""
    # Obtener tarea (solo activas)
    query = select(Task).where(
        Task.id == task_id,
        Task.deleted_at.is_(None)  # Solo tareas activas
    )
    result = await db.execute(query)
    db_task = result.scalar_one_or_none()

    if db_task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    update_data = data.model_dump(exclude_unset=True)

    # CRÍTICO: Sincronización bidireccional completed ↔ status
    if "status" in update_data and "completed" not in update_data:
        # Si se actualiza status, sincronizar completed
        status_value = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]
        if status_value == "done":
            db_task.completed = True
            db_task.completed_at = datetime.now(UTC)
        else:
            db_task.completed = False
            db_task.completed_at = None

    if "completed" in update_data and "status" not in update_data:
        # Si se actualiza completed, sincronizar status
        if update_data["completed"]:
            db_task.status = "done"
        elif db_task.status == "done":
            # Si completed=False y status era "done", cambiar a backlog
            db_task.status = "backlog"

    # Si ambos están presentes, aplicar la lógica de completed primero
    if "completed" in update_data and "status" in update_data:
        status_value = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]
        if update_data["completed"]:
            db_task.status = "done"
        elif status_value == "done" and not update_data["completed"]:
            db_task.status = "backlog"

    # Aplicar cambios
    for field, value in update_data.items():
        if field == "status":
            # Convertir enum a string si es necesario
            setattr(db_task, field, value.value if hasattr(value, "value") else value)
        else:
            setattr(db_task, field, value)

    # Actualizar completed_at si cambia el estado de completed
    if "completed" in update_data:
        db_task.completed_at = datetime.now(UTC) if update_data["completed"] else None

    db_task.updated_at = datetime.now(UTC)

    await db.flush()
    await db.refresh(db_task, ["subtasks"])

    return TaskResponse.model_validate(db_task)


@router.patch("/{task_id}/toggle", response_model=TaskResponse)
async def toggle_task(task_id: int, db: AsyncSession = Depends(get_db)):
    """Alterna el estado de completado de una tarea."""
    # Obtener tarea (solo activas)
    query = select(Task).where(
        Task.id == task_id,
        Task.deleted_at.is_(None)  # Solo tareas activas
    )
    result = await db.execute(query)
    db_task = result.scalar_one_or_none()

    if db_task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Alternar completed
    db_task.completed = not db_task.completed
    db_task.updated_at = datetime.now(UTC)
    db_task.completed_at = datetime.now(UTC) if db_task.completed else None

    # Sincronizar status con completed
    db_task.status = "done" if db_task.completed else "backlog"

    await db.flush()
    await db.refresh(db_task, ["subtasks"])

    return TaskResponse.model_validate(db_task)


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: int,
    new_status: TaskStatus,
    db: AsyncSession = Depends(get_db)
):
    """Actualiza rápidamente solo el status de una tarea."""
    # Obtener tarea (solo activas)
    query = select(Task).where(
        Task.id == task_id,
        Task.deleted_at.is_(None)  # Solo tareas activas
    )
    result = await db.execute(query)
    db_task = result.scalar_one_or_none()

    if db_task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    status_value = new_status.value

    # Actualizar status
    db_task.status = status_value

    # Sincronizar completed y completed_at
    if status_value == "done":
        db_task.completed = True
        db_task.completed_at = datetime.now(UTC)
    else:
        db_task.completed = False
        db_task.completed_at = None

    db_task.updated_at = datetime.now(UTC)

    await db.flush()
    await db.refresh(db_task, ["subtasks"])

    return TaskResponse.model_validate(db_task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    """Elimina una tarea (borrado lógico)."""
    # Obtener tarea con subtasks (para cascada lógica)
    query = select(Task).where(
        Task.id == task_id,
        Task.deleted_at.is_(None)  # Solo tareas activas
    ).options(selectinload(Task.subtasks))
    result = await db.execute(query)
    db_task = result.scalar_one_or_none()

    if db_task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Borrado lógico: marcar deleted_at
    now = datetime.now(UTC)
    db_task.deleted_at = now

    # Cascada lógica: marcar subtasks también
    for subtask in db_task.subtasks:
        if subtask.deleted_at is None:  # Solo si no estaba eliminada
            subtask.deleted_at = now

    return None
