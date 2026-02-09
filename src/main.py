"""FastAPI application entry point."""
from fastapi import FastAPI

from .api.routes.tasks import router as tasks_router

app = FastAPI(
    title="API de Aprendizaje Claude Code",
    description="API backend para el proyecto de aprendizaje",
    version="1.0.0",
)

# Include routers
app.include_router(tasks_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "API running"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
