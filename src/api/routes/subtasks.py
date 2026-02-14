"""Router para el recurso subtasks."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, UTC
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.subtasks import SubtaskCreate, SubtaskUpdate, SubtaskResponse
from ..database import get_db
from ..models.subtask import Subtask
from ..models.task import Task

router = APIRouter(prefix="/tasks/{task_id}/subtasks", tags=["subtasks"])


async def _auto_complete_task_if_needed(task_id: int, db: AsyncSession) -> None:
    """
    Lógica de auto-completado de task basado en sus subtasks.

    Reglas:
    - Si TODAS las subtasks están completed → task.completed=True, status="done"
    - Si ALGUNA subtask está incompleta → task.completed=False, status="backlog"

    Args:
        task_id: ID de la tarea a verificar
        db: Sesión de base de datos
    """
    # Obtener la tarea
    task_query = select(Task).where(Task.id == task_id)
    task_result = await db.execute(task_query)
    task = task_result.scalar_one_or_none()

    if task is None:
        return

    # Obtener todas las subtasks de la tarea
    subtasks_query = select(Subtask).where(Subtask.task_id == task_id)
    subtasks_result = await db.execute(subtasks_query)
    subtasks = subtasks_result.scalars().all()

    # Si no hay subtasks, no hacer nada
    if not subtasks:
        return

    # Verificar si todas las subtasks están completas
    all_completed = all(subtask.completed for subtask in subtasks)

    if all_completed:
        # Todas completas → marcar task como completed y done
        task.completed = True
        task.status = "done"
        if task.completed_at is None:
            task.completed_at = datetime.now(UTC)
    else:
        # Alguna incompleta → revertir task a incompleted y backlog
        task.completed = False
        task.status = "backlog"
        task.completed_at = None

    task.updated_at = datetime.now(UTC)
    await db.flush()


async def _get_task_or_404(task_id: int, db: AsyncSession) -> Task:
    """
    Obtiene una tarea o lanza 404.

    Args:
        task_id: ID de la tarea
        db: Sesión de base de datos

    Returns:
        Task: La tarea encontrada

    Raises:
        HTTPException: 404 si no existe
    """
    query = select(Task).where(Task.id == task_id)
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found"
        )

    return task


@router.get("/", response_model=List[SubtaskResponse])
async def get_task_subtasks(task_id: int, db: AsyncSession = Depends(get_db)):
    """
    Obtiene todas las subtasks de una tarea, ordenadas por position.

    Args:
        task_id: ID de la tarea padre
        db: Sesión de base de datos

    Returns:
        List[SubtaskResponse]: Lista de subtasks ordenadas
    """
    # Verificar que la tarea existe
    await _get_task_or_404(task_id, db)

    # Obtener subtasks ordenadas por position
    query = (
        select(Subtask)
        .where(Subtask.task_id == task_id)
        .order_by(Subtask.position)
    )
    result = await db.execute(query)
    subtasks = result.scalars().all()

    return [SubtaskResponse.model_validate(subtask) for subtask in subtasks]


@router.post("/", response_model=SubtaskResponse, status_code=status.HTTP_201_CREATED)
async def create_subtask(
    task_id: int,
    data: SubtaskCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea una nueva subtask para una tarea.

    Si no se especifica position, se auto-asigna al final de la lista.

    Args:
        task_id: ID de la tarea padre
        data: Datos de la subtask
        db: Sesión de base de datos

    Returns:
        SubtaskResponse: La subtask creada
    """
    # Verificar que la tarea existe
    await _get_task_or_404(task_id, db)

    subtask_data = data.model_dump()
    subtask_data["task_id"] = task_id
    subtask_data["completed"] = False
    subtask_data["completed_at"] = None

    # Si no se especificó position, asignar al final
    if subtask_data.get("position") is None or subtask_data["position"] == 0:
        # Obtener el máximo position actual
        max_position_query = select(Subtask.position).where(Subtask.task_id == task_id).order_by(Subtask.position.desc()).limit(1)
        max_position_result = await db.execute(max_position_query)
        max_position = max_position_result.scalar_one_or_none()
        subtask_data["position"] = (max_position or 0) + 1

    # Crear instancia ORM
    db_subtask = Subtask(**subtask_data)

    # Guardar en BD
    db.add(db_subtask)
    await db.flush()
    await db.refresh(db_subtask)

    # Auto-completar task si es necesario
    await _auto_complete_task_if_needed(task_id, db)

    return SubtaskResponse.model_validate(db_subtask)


@router.get("/{subtask_id}", response_model=SubtaskResponse)
async def get_subtask(
    task_id: int,
    subtask_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene una subtask específica.

    Args:
        task_id: ID de la tarea padre
        subtask_id: ID de la subtask
        db: Sesión de base de datos

    Returns:
        SubtaskResponse: La subtask encontrada
    """
    # Verificar que la tarea existe
    await _get_task_or_404(task_id, db)

    # Obtener subtask
    query = select(Subtask).where(
        Subtask.id == subtask_id,
        Subtask.task_id == task_id
    )
    result = await db.execute(query)
    subtask = result.scalar_one_or_none()

    if subtask is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subtask with id {subtask_id} not found for task {task_id}"
        )

    return SubtaskResponse.model_validate(subtask)


@router.put("/{subtask_id}", response_model=SubtaskResponse)
async def update_subtask(
    task_id: int,
    subtask_id: int,
    data: SubtaskUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza una subtask existente.

    Args:
        task_id: ID de la tarea padre
        subtask_id: ID de la subtask
        data: Datos a actualizar
        db: Sesión de base de datos

    Returns:
        SubtaskResponse: La subtask actualizada
    """
    # Verificar que la tarea existe
    await _get_task_or_404(task_id, db)

    # Obtener subtask
    query = select(Subtask).where(
        Subtask.id == subtask_id,
        Subtask.task_id == task_id
    )
    result = await db.execute(query)
    db_subtask = result.scalar_one_or_none()

    if db_subtask is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subtask with id {subtask_id} not found for task {task_id}"
        )

    update_data = data.model_dump(exclude_unset=True)

    # Aplicar cambios
    for field, value in update_data.items():
        setattr(db_subtask, field, value)

    # Actualizar completed_at si cambia el estado de completed
    if "completed" in update_data:
        db_subtask.completed_at = datetime.now(UTC) if update_data["completed"] else None

    await db.flush()
    await db.refresh(db_subtask)

    # Auto-completar task si es necesario
    await _auto_complete_task_if_needed(task_id, db)

    return SubtaskResponse.model_validate(db_subtask)


@router.patch("/{subtask_id}/toggle", response_model=SubtaskResponse)
async def toggle_subtask(
    task_id: int,
    subtask_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Alterna el estado de completado de una subtask.

    Este endpoint ejecuta la lógica de auto-completado del task padre.

    Args:
        task_id: ID de la tarea padre
        subtask_id: ID de la subtask
        db: Sesión de base de datos

    Returns:
        SubtaskResponse: La subtask actualizada
    """
    # Verificar que la tarea existe
    await _get_task_or_404(task_id, db)

    # Obtener subtask
    query = select(Subtask).where(
        Subtask.id == subtask_id,
        Subtask.task_id == task_id
    )
    result = await db.execute(query)
    db_subtask = result.scalar_one_or_none()

    if db_subtask is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subtask with id {subtask_id} not found for task {task_id}"
        )

    # Alternar completed
    db_subtask.completed = not db_subtask.completed
    db_subtask.completed_at = datetime.now(UTC) if db_subtask.completed else None

    await db.flush()
    await db.refresh(db_subtask)

    # CRÍTICO: Auto-completar task si es necesario
    await _auto_complete_task_if_needed(task_id, db)

    return SubtaskResponse.model_validate(db_subtask)


@router.delete("/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtask(
    task_id: int,
    subtask_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Elimina una subtask.

    Este endpoint ejecuta la lógica de auto-completado del task padre.

    Args:
        task_id: ID de la tarea padre
        subtask_id: ID de la subtask
        db: Sesión de base de datos
    """
    # Verificar que la tarea existe
    await _get_task_or_404(task_id, db)

    # Obtener subtask
    query = select(Subtask).where(
        Subtask.id == subtask_id,
        Subtask.task_id == task_id
    )
    result = await db.execute(query)
    db_subtask = result.scalar_one_or_none()

    if db_subtask is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subtask with id {subtask_id} not found for task {task_id}"
        )

    await db.delete(db_subtask)

    # CRÍTICO: Auto-completar task si es necesario después de eliminar
    await _auto_complete_task_if_needed(task_id, db)

    return None
