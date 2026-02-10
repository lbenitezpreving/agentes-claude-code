# Proyecto de Aprendizaje Claude Code

## Stack Tecnológico
- Frontend: React 18 + TypeScript + Vite
- Backend: Python 3.11 + FastAPI
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

- **code-reviewer**: Revisa codigo React y Python despues de cambios
- **test-generator**: Genera tests para codigo existente
- **playwright-validator**: Valida funcionalidad E2E despues de desarrollar nuevas features

## Skills Disponibles

- `/react-component [Name]`: Genera componente React completo
- `/python-endpoint [name]`: Genera endpoint FastAPI completo
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
