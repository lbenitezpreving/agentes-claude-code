"""Router para el recurso projects."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.projects import ProjectCreate, ProjectUpdate, ProjectResponse
from ..database import get_db
from ..models.project import Project

router = APIRouter(prefix="/projects", tags=["projects"])

# Migrado a SQLite - ver backups/projects.py.bak para versión original
# _projects_db: dict[int, dict] = {...}
# _next_id = 5


@router.get("/", response_model=List[ProjectResponse])
async def get_all_projects(db: AsyncSession = Depends(get_db)):
    """Obtiene todos los proyectos desde la base de datos."""
    query = select(Project)
    result = await db.execute(query)
    projects = result.scalars().all()

    return [ProjectResponse.model_validate(project) for project in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Obtiene un proyecto por ID."""
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return ProjectResponse.model_validate(project)


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    """Crea un nuevo proyecto."""
    # Crear instancia ORM
    db_project = Project(**data.model_dump())

    # Guardar en BD
    db.add(db_project)
    await db.flush()  # Obtener ID sin commit
    await db.refresh(db_project)  # Cargar campos generados

    return ProjectResponse.model_validate(db_project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Actualiza un proyecto existente."""
    # Obtener proyecto
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    db_project = result.scalar_one_or_none()

    if db_project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Aplicar cambios
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)

    await db.flush()
    await db.refresh(db_project)

    return ProjectResponse.model_validate(db_project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Elimina un proyecto."""
    # Obtener proyecto
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    db_project = result.scalar_one_or_none()

    if db_project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    await db.delete(db_project)
    return None
