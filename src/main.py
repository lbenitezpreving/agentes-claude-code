"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.tasks import router as tasks_router

app = FastAPI(
    title="API de Aprendizaje Claude Code",
    description="API backend para el proyecto de aprendizaje",
    version="1.0.0",
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


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "API running"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
