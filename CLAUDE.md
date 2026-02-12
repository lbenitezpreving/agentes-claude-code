# Proyecto de Aprendizaje Claude Code

## Stack Tecnológico
- Frontend: React 18 + TypeScript + Vite
- Backend: Python 3.11 + FastAPI
- Base de Datos: SQLite + SQLAlchemy 2.0 async (actualmente en memoria, migración disponible)
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
│   ├── routes/         # Routers FastAPI
│   └── schemas/        # Schemas Pydantic
tests/
├── components/         # Tests de React
└── api/               # Tests de API
e2e/
├── pages/             # Page Objects para Playwright
└── *.spec.ts          # Tests E2E
docs/                   # Documentacion generada
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

## Migración a SQLite

**Estado actual:** El proyecto usa almacenamiento en memoria (diccionarios). Los datos se pierden al reiniciar.

**Para migrar a persistencia SQLite:**
1. Usar el agente `sqlite-manager` para migración automática completa
2. O usar el skill `/sqlite-setup` para templates y guías de mejores prácticas

**Beneficios de la migración:**
- Persistencia real entre reinicios
- Preparación para producción
- Queries SQL eficientes
- Relaciones entre modelos (FK)
- Migraciones versionadas (futuro con Alembic)
