"""Modelo ORM para Task."""
from datetime import datetime, UTC
from typing import Optional, TYPE_CHECKING, List
from sqlalchemy import String, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base

if TYPE_CHECKING:
    from .project import Project
    from .subtask import Subtask


class Task(Base):
    """Modelo ORM para Task."""

    __tablename__ = "tasks"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Campos básicos
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Status y completed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="backlog")
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Foreign Key (opcional, puede ser NULL)
    project_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    project: Mapped[Optional["Project"]] = relationship(
        "Project",
        back_populates="tasks"
    )
    subtasks: Mapped[List["Subtask"]] = relationship(
        "Subtask",
        back_populates="task",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, name='{self.name}', status='{self.status}')>"
