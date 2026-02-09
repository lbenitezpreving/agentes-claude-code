---
description: Genera un endpoint FastAPI con validación Pydantic y tests
argument-hint: "[endpoint_name]"
---

# Generador de Endpoints FastAPI

Genera un endpoint completo para: `$ARGUMENTS`

## Estructura a crear:

```
src/api/routes/$ARGUMENTS.py      # Router con endpoints CRUD
src/api/schemas/$ARGUMENTS.py     # Schemas Pydantic v2
tests/api/test_$ARGUMENTS.py      # Tests pytest
```

## Requisitos:

- Router con prefijo /$ARGUMENTS
- Endpoints: GET all, GET by id, POST, PUT, DELETE
- Schemas: Create, Update, Response (usando Pydantic v2 con ConfigDict)
- Validación con Pydantic v2
- Tests con pytest + TestClient
- Usar `datetime.now(UTC)` en lugar de `datetime.utcnow()`

## Instrucciones:

1. Crea los directorios necesarios si no existen
2. Genera el router con endpoints CRUD completos
3. Genera schemas Pydantic v2 (usar ConfigDict, no class Config)
4. Genera tests para cada endpoint
5. Registra el router en src/main.py
6. Usa snake_case para el nombre del endpoint
