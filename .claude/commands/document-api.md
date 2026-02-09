---
description: Genera documentación para la API FastAPI
---

# Documentador de API

Genera documentación completa para todos los endpoints FastAPI.

## Tareas:

1. Lee todos los routers en `src/api/routes/`
2. Extrae endpoints y schemas de cada archivo
3. Genera `docs/API.md` con:
   - Lista de todos los endpoints
   - Parámetros y tipos de cada endpoint
   - Ejemplos de request/response
   - Códigos de error posibles

## Formato de salida (docs/API.md):

```markdown
# API Documentation

## Endpoints

### Resource Name

#### `GET /resource`
Description

**Response (200):**
```json
[{ "id": 1, "name": "example" }]
```

#### `POST /resource`
Description

**Request:**
```json
{ "name": "example" }
```

**Response (201):**
```json
{ "id": 1, "name": "example" }
```
```

## Instrucciones:

1. Busca todos los archivos .py en src/api/routes/
2. Extrae la información de cada endpoint
3. Crea o actualiza docs/API.md
