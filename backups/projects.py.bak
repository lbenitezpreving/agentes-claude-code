"""Router para el recurso projects."""
from fastapi import APIRouter, HTTPException, status
from typing import List

from ..schemas.projects import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["projects"])

# 4 proyectos de ejemplo hardcoded
_projects_db: dict[int, dict] = {
    1: {"id": 1, "name": "Trabajo", "color": "#3498db"},
    2: {"id": 2, "name": "Personal", "color": "#2ecc71"},
    3: {"id": 3, "name": "Estudios", "color": "#9b59b6"},
    4: {"id": 4, "name": "Hogar", "color": "#e74c3c"},
}
_next_id = 5


@router.get("/", response_model=List[ProjectResponse])
async def get_all_projects():
    """Obtiene todos los proyectos."""
    return list(_projects_db.values())


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int):
    """Obtiene un proyecto por ID."""
    if project_id not in _projects_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return _projects_db[project_id]


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(data: ProjectCreate):
    """Crea un nuevo proyecto."""
    global _next_id

    project = {
        "id": _next_id,
        "name": data.name,
        "color": data.color,
    }

    _projects_db[_next_id] = project
    _next_id += 1

    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: int, data: ProjectUpdate):
    """Actualiza un proyecto existente."""
    if project_id not in _projects_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    project = _projects_db[project_id]
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        project[field] = value

    _projects_db[project_id] = project

    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int):
    """Elimina un proyecto."""
    if project_id not in _projects_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    del _projects_db[project_id]
    return None
