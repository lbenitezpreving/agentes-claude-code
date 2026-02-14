"""Migración: Agregar columna deleted_at a tasks y subtasks."""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import async_session_maker


async def check_column_exists(db: AsyncSession, table_name: str, column_name: str) -> bool:
    """Verifica si una columna existe en una tabla."""
    query = text(f"PRAGMA table_info({table_name})")
    result = await db.execute(query)
    columns = result.fetchall()
    return any(col[1] == column_name for col in columns)


async def add_deleted_at_column():
    """Agrega la columna deleted_at a las tablas tasks y subtasks."""
    async with async_session_maker() as db:
        print("Verificando estructura de base de datos...")

        # Verificar y agregar columna en tasks
        tasks_has_deleted_at = await check_column_exists(db, "tasks", "deleted_at")
        if not tasks_has_deleted_at:
            print("Agregando columna 'deleted_at' a tabla 'tasks'...")
            await db.execute(text("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME NULL"))
            await db.commit()
            print("OK - Columna 'deleted_at' agregada a 'tasks'")
        else:
            print("INFO - Columna 'deleted_at' ya existe en 'tasks'")

        # Verificar y agregar columna en subtasks
        subtasks_has_deleted_at = await check_column_exists(db, "subtasks", "deleted_at")
        if not subtasks_has_deleted_at:
            print("Agregando columna 'deleted_at' a tabla 'subtasks'...")
            await db.execute(text("ALTER TABLE subtasks ADD COLUMN deleted_at DATETIME NULL"))
            await db.commit()
            print("OK - Columna 'deleted_at' agregada a 'subtasks'")
        else:
            print("INFO - Columna 'deleted_at' ya existe en 'subtasks'")

        print("Migracion completada exitosamente")


if __name__ == "__main__":
    print("Iniciando migracion: add_deleted_at")
    asyncio.run(add_deleted_at_column())
