"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.database import init_db
from .api.routes.tasks import router as tasks_router
from .api.routes.projects import router as projects_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la aplicación."""
    # Startup: Crear tablas
    await init_db()
    yield
    # Shutdown: Cleanup si necesario


app = FastAPI(
    title="API de Aprendizaje Claude Code",
    description="API backend para el proyecto de aprendizaje",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks_router)
app.include_router(projects_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "API running"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
