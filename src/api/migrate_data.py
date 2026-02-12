"""Script para migrar datos iniciales a SQLite."""
import asyncio
from sqlalchemy import select
from src.api.database import async_session_maker, init_db
from src.api.models.project import Project
from src.api.models.task import Task


async def migrate_projects():
    """Migra proyectos iniciales."""
    initial_projects = [
        {"id": 1, "name": "Trabajo", "color": "#3498db"},
        {"id": 2, "name": "Personal", "color": "#2ecc71"},
        {"id": 3, "name": "Estudios", "color": "#9b59b6"},
        {"id": 4, "name": "Hogar", "color": "#e74c3c"},
    ]

    async with async_session_maker() as session:
        for proj_data in initial_projects:
            # Verificar si ya existe
            query = select(Project).where(Project.id == proj_data["id"])
            result = await session.execute(query)
            existing = result.scalar_one_or_none()

            if existing is None:
                project = Project(**proj_data)
                session.add(project)
                print(f"[OK] Proyecto creado: {proj_data['name']}")
            else:
                print(f"[SKIP] Proyecto ya existe: {proj_data['name']}")

        await session.commit()


async def migrate_tasks():
    """Migra tareas iniciales (si las hay)."""
    # No hay tareas hardcodeadas en el sistema actual
    print("[INFO] No hay tareas para migrar (almacenamiento vacio)")
    pass


async def main():
    """Ejecuta todas las migraciones."""
    print("=" * 50)
    print("Iniciando migración de datos a SQLite")
    print("=" * 50)

    # Crear tablas primero
    await init_db()
    print("[OK] Tablas creadas\n")

    # Migrar datos
    print("Migrando proyectos...")
    await migrate_projects()

    print("\nMigrando tareas...")
    await migrate_tasks()

    print("\n" + "=" * 50)
    print("[OK] Migracion completada exitosamente")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
