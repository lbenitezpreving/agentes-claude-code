# Proyecto de Aprendizaje Claude Code

## Stack Tecnológico
- Frontend: React 18 + TypeScript + Vite
- Backend: Python 3.11 + FastAPI
- Base de Datos: SQLite + SQLAlchemy 2.0 async
- Testing: Vitest (front), pytest (back), Playwright (E2E)

## Convenciones
- Componentes React en PascalCase
- Funciones Python en snake_case
- Tests colocados junto al código

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
├── api/
│   ├── database.py     # Configuración de BD SQLAlchemy
│   ├── models/         # Modelos ORM (Project, Task)
│   ├── routes/         # Routers FastAPI
│   ├── schemas/        # Schemas Pydantic
│   └── migrate_data.py # Script de migración de datos
tests/
├── components/         # Tests de React
└── api/               # Tests de API (async)
e2e/
├── pages/             # Page Objects para Playwright
└── *.spec.ts          # Tests E2E
docs/                   # Documentacion generada
backups/               # Backups de archivos pre-migración
```

## Agentes Disponibles

- **react-generator**: Genera componentes React completos (tsx, css, tests, index)
- **endpoint-generator**: Genera endpoints FastAPI completos (router, schemas, tests)
- **sqlite-manager**: Configura persistencia SQLite con SQLAlchemy 2.0 async, migra datos desde memoria
- **playwright-validator**: Valida funcionalidad E2E despues de desarrollar nuevas features
- **coverage-reporter**: Mide y reporta cobertura de codigo (frontend y backend)
- **readme-documenter**: Documenta el proyecto en README.md

## Skills Disponibles

- `/react-component [Name]`: Genera componente React completo
- `/python-endpoint [name]`: Genera endpoint FastAPI completo
- `/sqlite-setup [model_name]`: Configura persistencia SQLite con SQLAlchemy 2.0 async
- `/code-review`: Revisa codigo React y Python
- `/generate-tests [file]`: Genera tests para un archivo
- `/document-api`: Documenta la API FastAPI
- `/document-component [Name]`: Documenta un componente React

## Reglas de Código

### React/TypeScript
- Usar hooks de React correctamente
- Props siempre tipadas con interface
- Evitar any, usar tipos específicos
- CSS Modules para estilos

### Python/FastAPI
- Type hints en todas las funciones
- Validación con Pydantic v2
- Async para operaciones I/O
- Documentar endpoints con docstrings

## Base de Datos

**Configuración actual:** SQLite con SQLAlchemy 2.0 async

- **Ubicación:** `./app.db`
- **Configuración:** `src/api/database.py`
- **Modelos ORM:** `src/api/models/`
  - `Project`: Proyectos con nombre y color
  - `Task`: Tareas con status Kanban, completed, project_id (FK opcional)
- **Datos iniciales:** 4 proyectos hardcodeados (Trabajo, Personal, Estudios, Hogar)

**Características:**
- Persistencia real entre reinicios
- Queries SQL async eficientes
- Relaciones FK (Task → Project con ondelete="SET NULL")
- Sincronización bidireccional `completed ↔ status` en tasks
- Tests async con BD en memoria (`:memory:`)

**Re-migrar datos:**
```bash
python -m src.api.migrate_data
```
