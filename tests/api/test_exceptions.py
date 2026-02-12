"""Tests para excepciones personalizadas."""
import pytest
from fastapi import status
from src.api.exceptions import (
    ResourceNotFoundException,
    ResourceAlreadyExistsException,
    InvalidOperationException
)


def test_resource_not_found_exception():
    """Test ResourceNotFoundException."""
    exception = ResourceNotFoundException("Task", 123)

    assert exception.status_code == status.HTTP_404_NOT_FOUND
    assert exception.detail == "Task with id 123 not found"


def test_resource_already_exists_exception():
    """Test ResourceAlreadyExistsException."""
    exception = ResourceAlreadyExistsException("User", "email", "test@example.com")

    assert exception.status_code == status.HTTP_409_CONFLICT
    assert exception.detail == "User with email='test@example.com' already exists"


def test_invalid_operation_exception():
    """Test InvalidOperationException."""
    message = "Cannot delete a task that is in progress"
    exception = InvalidOperationException(message)

    assert exception.status_code == status.HTTP_400_BAD_REQUEST
    assert exception.detail == message


def test_exceptions_are_http_exceptions():
    """Test que todas las excepciones heredan de HTTPException."""
    from fastapi import HTTPException

    assert issubclass(ResourceNotFoundException, HTTPException)
    assert issubclass(ResourceAlreadyExistsException, HTTPException)
    assert issubclass(InvalidOperationException, HTTPException)
