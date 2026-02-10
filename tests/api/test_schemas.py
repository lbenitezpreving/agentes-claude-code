"""Tests para los schemas Pydantic de tasks."""
import pytest
from pydantic import ValidationError
from datetime import datetime, UTC

from src.api.schemas.tasks import TaskBase, TaskCreate, TaskUpdate, TaskResponse


class TestTaskBase:
    """Tests para TaskBase schema."""

    def test_valid_task_base(self):
        """Test creación válida con todos los campos."""
        task = TaskBase(name="Mi tarea", description="Una descripción")
        assert task.name == "Mi tarea"
        assert task.description == "Una descripción"

    def test_valid_task_base_without_description(self):
        """Test creación válida sin descripción."""
        task = TaskBase(name="Solo nombre")
        assert task.name == "Solo nombre"
        assert task.description is None

    def test_name_required(self):
        """Test que name es requerido."""
        with pytest.raises(ValidationError) as exc_info:
            TaskBase()
        assert "name" in str(exc_info.value)

    def test_name_min_length(self):
        """Test validación de longitud mínima de name."""
        with pytest.raises(ValidationError) as exc_info:
            TaskBase(name="")
        errors = exc_info.value.errors()
        assert any("min_length" in str(e) or "at least 1" in str(e) for e in errors)

    def test_name_max_length(self):
        """Test validación de longitud máxima de name (100 chars)."""
        with pytest.raises(ValidationError) as exc_info:
            TaskBase(name="a" * 101)
        errors = exc_info.value.errors()
        assert any("max_length" in str(e) or "at most 100" in str(e) for e in errors)

    def test_name_exact_max_length(self):
        """Test que 100 caracteres es válido."""
        task = TaskBase(name="a" * 100)
        assert len(task.name) == 100

    def test_description_max_length(self):
        """Test validación de longitud máxima de description (500 chars)."""
        with pytest.raises(ValidationError) as exc_info:
            TaskBase(name="Tarea", description="a" * 501)
        errors = exc_info.value.errors()
        assert any("max_length" in str(e) or "at most 500" in str(e) for e in errors)

    def test_description_exact_max_length(self):
        """Test que 500 caracteres es válido para description."""
        task = TaskBase(name="Tarea", description="a" * 500)
        assert len(task.description) == 500


class TestTaskCreate:
    """Tests para TaskCreate schema."""

    def test_inherits_from_task_base(self):
        """Test que hereda correctamente de TaskBase."""
        task = TaskCreate(name="Nueva tarea", description="Desc")
        assert task.name == "Nueva tarea"
        assert task.description == "Desc"

    def test_validation_inherited(self):
        """Test que las validaciones se heredan."""
        with pytest.raises(ValidationError):
            TaskCreate(name="")


class TestTaskUpdate:
    """Tests para TaskUpdate schema."""

    def test_all_fields_optional(self):
        """Test que todos los campos son opcionales."""
        task = TaskUpdate()
        assert task.name is None
        assert task.description is None
        assert task.completed is None

    def test_partial_update_name(self):
        """Test actualización parcial solo con name."""
        task = TaskUpdate(name="Nuevo nombre")
        assert task.name == "Nuevo nombre"
        assert task.description is None
        assert task.completed is None

    def test_partial_update_completed(self):
        """Test actualización parcial solo con completed."""
        task = TaskUpdate(completed=True)
        assert task.completed is True
        assert task.name is None

    def test_full_update(self):
        """Test actualización con todos los campos."""
        task = TaskUpdate(name="Nombre", description="Desc", completed=True)
        assert task.name == "Nombre"
        assert task.description == "Desc"
        assert task.completed is True

    def test_name_validation_when_provided(self):
        """Test que name valida cuando se proporciona."""
        with pytest.raises(ValidationError):
            TaskUpdate(name="")

    def test_name_max_length_validation(self):
        """Test validación de longitud máxima de name."""
        with pytest.raises(ValidationError):
            TaskUpdate(name="a" * 101)

    def test_description_max_length_validation(self):
        """Test validación de longitud máxima de description."""
        with pytest.raises(ValidationError):
            TaskUpdate(description="a" * 501)

    def test_model_dump_exclude_unset(self):
        """Test que model_dump con exclude_unset funciona correctamente."""
        task = TaskUpdate(name="Solo nombre")
        data = task.model_dump(exclude_unset=True)
        assert data == {"name": "Solo nombre"}
        assert "description" not in data
        assert "completed" not in data


class TestTaskResponse:
    """Tests para TaskResponse schema."""

    def test_valid_response(self):
        """Test creación válida de respuesta."""
        now = datetime.now(UTC)
        task = TaskResponse(
            id=1,
            name="Tarea",
            description="Desc",
            completed=False,
            created_at=now,
        )
        assert task.id == 1
        assert task.name == "Tarea"
        assert task.completed is False
        assert task.created_at == now

    def test_default_completed(self):
        """Test que completed tiene valor por defecto False."""
        task = TaskResponse(id=1, name="Tarea", created_at=datetime.now(UTC))
        assert task.completed is False

    def test_updated_at_optional(self):
        """Test que updated_at es opcional y None por defecto."""
        task = TaskResponse(id=1, name="Tarea", created_at=datetime.now(UTC))
        assert task.updated_at is None

    def test_updated_at_with_value(self):
        """Test updated_at con valor."""
        now = datetime.now(UTC)
        task = TaskResponse(
            id=1,
            name="Tarea",
            created_at=now,
            updated_at=now,
        )
        assert task.updated_at == now

    def test_from_attributes_config(self):
        """Test que from_attributes está configurado."""
        assert TaskResponse.model_config.get("from_attributes") is True

    def test_id_required(self):
        """Test que id es requerido."""
        with pytest.raises(ValidationError) as exc_info:
            TaskResponse(name="Tarea", created_at=datetime.now(UTC))
        assert "id" in str(exc_info.value)

    @pytest.mark.parametrize("invalid_id", ["abc", None, 1.5])
    def test_id_must_be_int(self, invalid_id):
        """Test que id debe ser entero."""
        with pytest.raises(ValidationError):
            TaskResponse(id=invalid_id, name="Tarea", created_at=datetime.now(UTC))

    def test_inherits_name_validation(self):
        """Test que hereda validación de name de TaskBase."""
        with pytest.raises(ValidationError):
            TaskResponse(id=1, name="", created_at=datetime.now(UTC))
