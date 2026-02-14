"""Script para crear la tabla subtasks en la base de datos."""
import asyncio
from .database import init_db


async def main():
    """Ejecuta la migración para crear tabla subtasks."""
    print("Iniciando migracion de subtasks...")
    await init_db()
    print("OK - Tabla subtasks creada exitosamente")


if __name__ == "__main__":
    asyncio.run(main())
