"""Configuración de base de datos SQLite con SQLAlchemy 2.0 async."""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

# URL de conexión SQLite async
DATABASE_URL = "sqlite+aiosqlite:///./app.db"

# Engine async
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Cambiar a True para debug SQL
    future=True,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class para todos los modelos ORM."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para obtener sesión de base de datos.

    Yields:
        AsyncSession: Sesión async de SQLAlchemy

    Example:
        @router.get("/items/")
        async def get_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Inicializa la base de datos creando todas las tablas.

    Se debe llamar en el evento startup de FastAPI.

    Example:
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            await init_db()
            yield
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
