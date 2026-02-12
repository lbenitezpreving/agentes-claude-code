# Proyecto de Aprendizaje Claude Code

Aplicación de gestión de tareas con tablero Kanban desarrollada con React + TypeScript y FastAPI, diseñada para explorar y demostrar las capacidades de los agentes de Claude Code.

## Descripción del Proyecto

Este proyecto es una aplicación full-stack de gestión de tareas que implementa un tablero Kanban con tres estados (backlog, doing, done). Incluye funcionalidad completa de CRUD para tareas y proyectos, con sincronización automática de estados y validación robusta tanto en frontend como backend.

## Stack Tecnológico

### Frontend
- **React 18**: Biblioteca UI con hooks y componentes funcionales
- **TypeScript 5.3**: Tipado estático para mayor seguridad
- **Vite 5**: Build tool y dev server ultrarrápido
- **CSS Modules**: Estilos con scope local
- **Vitest**: Framework de testing unitario
- **@testing-library/react**: Utilidades para testing de componentes

### Backend
- **Python 3.11**: Lenguaje de programación
- **FastAPI 0.109+**: Framework web moderno y rápido
- **Pydantic v2**: Validación de datos y serialización
- **Uvicorn**: Servidor ASGI de alto rendimiento
- **pytest**: Framework de testing
- **pytest-cov**: Cobertura de código

### Testing E2E
- **Playwright 1.58**: Framework de testing end-to-end
- **Page Object Model**: Patrón de diseño para tests mantenibles

### Base de Datos
- **SQLite**: Almacenamiento en memoria para desarrollo (actualmente diccionarios en memoria)

## Características Implementadas

### Gestión de Tareas
- ✅ **CRUD completo**: Crear, leer, actualizar y eliminar tareas
- ✅ **Validación de datos**: Esquemas Pydantic v2 en backend
- ✅ **Toggle de completado**: Endpoint específico para cambiar estado
- ✅ **Timestamps automáticos**: `created_at`, `updated_at`, `completed_at`
- ✅ **Asociación con proyectos**: Cada tarea puede pertenecer a un proyecto
- ✅ **Edición inline**: Panel lateral para editar tareas

### Gestión de Proyectos
- ✅ **CRUD completo**: Crear, leer, actualizar y eliminar proyectos
- ✅ **Proyectos predefinidos**: 4 proyectos de ejemplo (Trabajo, Personal, Estudios, Hogar)
- ✅ **Colores personalizados**: Cada proyecto tiene un color identificativo
- ✅ **Badges visuales**: Los proyectos se muestran como badges de color en las tareas

### Interfaz de Usuario
- ✅ **Lista de tareas**: Componente `TaskList` con visualización de tareas
- ✅ **Panel de edición**: Componente `TaskEditPanel` para editar tareas
- ✅ **Estados visuales**: Loading, empty, y completed states
- ✅ **Formateo de fechas**: Formato DD/MM/YYYY a las HH:MM
- ✅ **Responsive**: Diseño adaptable a diferentes tamaños de pantalla

### Testing y Calidad
- ✅ **Tests unitarios frontend**: Vitest + Testing Library
- ✅ **Tests unitarios backend**: pytest con fixtures
- ✅ **Tests E2E**: Playwright con 6 suites de tests
- ✅ **Cobertura de código**: Configurada para frontend y backend
- ✅ **Validación de accesibilidad**: Tests específicos de a11y

## Estructura del Proyecto

```
agentes-claude-code/
├── src/
│   ├── components/              # Componentes React
│   │   ├── TaskList/           # Lista de tareas
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskList.module.css
│   │   │   ├── TaskList.test.tsx
│   │   │   └── index.ts
│   │   └── TaskEditPanel/      # Panel de edición
│   │       ├── TaskEditPanel.tsx
│   │       ├── TaskEditPanel.module.css
│   │       ├── TaskEditPanel.test.tsx
│   │       └── index.ts
│   ├── api/
│   │   ├── routes/             # Routers FastAPI
│   │   │   ├── tasks.py        # Endpoints de tareas
│   │   │   └── projects.py     # Endpoints de proyectos
│   │   ├── schemas/            # Schemas Pydantic
│   │   │   ├── tasks.py        # TaskCreate, TaskUpdate, TaskResponse
│   │   │   └── projects.py     # ProjectCreate, ProjectUpdate, ProjectResponse
│   │   └── main.py             # Aplicación FastAPI principal
│   ├── App.tsx                 # Componente raíz
│   └── main.tsx                # Entry point
├── tests/
│   ├── api/                    # Tests backend
│   │   ├── test_tasks.py      # Tests de endpoints de tareas
│   │   └── test_projects.py   # Tests de endpoints de proyectos
│   └── setup.py                # Configuración de tests
├── e2e/                        # Tests end-to-end
│   ├── pages/                  # Page Objects
│   │   └── TaskPage.ts
│   ├── tasks.spec.ts           # Tests CRUD de tareas
│   ├── states.spec.ts          # Tests de estados
│   ├── user-flows.spec.ts      # Tests de flujos de usuario
│   ├── accessibility.spec.ts   # Tests de accesibilidad
│   ├── edge-cases.spec.ts      # Tests de casos límite
│   └── responsive.spec.ts      # Tests responsive
├── docs/                       # Documentación generada
├── CLAUDE.md                   # Instrucciones para agentes Claude
├── package.json                # Dependencias frontend
├── requirements.txt            # Dependencias backend
├── vite.config.ts             # Configuración Vite
├── tsconfig.json              # Configuración TypeScript
└── playwright.config.ts       # Configuración Playwright
```

## Instalación

### Requisitos Previos
- **Node.js 18+**: Para el desarrollo frontend
- **Python 3.11+**: Para el desarrollo backend
- **npm**: Incluido con Node.js

### Instalación Frontend

```bash
# Instalar dependencias
npm install
```

### Instalación Backend

```bash
# Crear entorno virtual (opcional pero recomendado)
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

## Ejecución

### Modo Desarrollo

**Frontend:**
```bash
npm run dev
```
El frontend estará disponible en http://localhost:5173

**Backend:**
```bash
uvicorn src.api.main:app --reload
```
La API estará disponible en http://localhost:8000

Documentación interactiva de la API: http://localhost:8000/docs

### Testing

**Tests Unitarios Frontend:**
```bash
# Ejecutar tests
npm run test

# Ejecutar tests con UI
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

**Tests Unitarios Backend:**
```bash
# Ejecutar tests
pytest

# Ejecutar tests con cobertura
pytest --cov=src --cov-report=html

# Ver reporte de cobertura
# El reporte se genera en htmlcov/index.html
```

**Tests E2E:**
```bash
# Ejecutar tests E2E
npx playwright test

# Ejecutar tests E2E con UI
npm run test:e2e:ui

# Ejecutar tests E2E en modo headed
npm run test:e2e:headed

# Ver reporte de tests E2E
npm run test:e2e:report
```

### Build

**Frontend:**
```bash
npm run build
```
Los archivos de producción se generan en la carpeta `dist/`

**Preview del Build:**
```bash
npm run preview
```

## API Reference

### Endpoints de Tareas

| Método | Ruta | Descripción | Request Body | Response |
|--------|------|-------------|--------------|----------|
| `GET` | `/tasks/` | Obtiene todas las tareas | - | `TaskResponse[]` |
| `GET` | `/tasks/{task_id}` | Obtiene una tarea por ID | - | `TaskResponse` |
| `POST` | `/tasks/` | Crea una nueva tarea | `TaskCreate` | `TaskResponse` |
| `PUT` | `/tasks/{task_id}` | Actualiza una tarea | `TaskUpdate` | `TaskResponse` |
| `PATCH` | `/tasks/{task_id}/toggle` | Alterna el estado completado | - | `TaskResponse` |
| `DELETE` | `/tasks/{task_id}` | Elimina una tarea | - | `204 No Content` |

**Schemas:**
- `TaskCreate`: `{ name: string, description?: string, project_id?: number }`
- `TaskUpdate`: `{ name?: string, description?: string, completed?: boolean, project_id?: number }`
- `TaskResponse`: `{ id: number, name: string, description?: string, completed: boolean, project_id?: number, created_at: datetime, updated_at?: datetime, completed_at?: datetime }`

### Endpoints de Proyectos

| Método | Ruta | Descripción | Request Body | Response |
|--------|------|-------------|--------------|----------|
| `GET` | `/projects/` | Obtiene todos los proyectos | - | `ProjectResponse[]` |
| `GET` | `/projects/{project_id}` | Obtiene un proyecto por ID | - | `ProjectResponse` |
| `POST` | `/projects/` | Crea un nuevo proyecto | `ProjectCreate` | `ProjectResponse` |
| `PUT` | `/projects/{project_id}` | Actualiza un proyecto | `ProjectUpdate` | `ProjectResponse` |
| `DELETE` | `/projects/{project_id}` | Elimina un proyecto | - | `204 No Content` |

**Schemas:**
- `ProjectCreate`: `{ name: string, color: string }`
- `ProjectUpdate`: `{ name?: string, color?: string }`
- `ProjectResponse`: `{ id: number, name: string, color: string }`

**Ubicación de archivos:**
- Routers: `src/api/routes/tasks.py`, `src/api/routes/projects.py`
- Schemas: `src/api/schemas/tasks.py`, `src/api/schemas/projects.py`
- Tests: `tests/api/test_tasks.py`, `tests/api/test_projects.py`

## Catálogo de Componentes

### TaskList
**Ubicación**: `src/components/TaskList/`

Componente para mostrar una lista de tareas con funcionalidad de toggle, edición y eliminación.

**Props:**

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `tasks` | `Task[]` | ✅ | Array de tareas a mostrar |
| `projects` | `Project[]` | ❌ | Array de proyectos para badges |
| `onTaskToggle` | `(taskId: number) => void` | ❌ | Callback al cambiar estado |
| `onTaskDelete` | `(taskId: number) => void` | ❌ | Callback al eliminar |
| `onTaskEdit` | `(task: Task) => void` | ❌ | Callback al editar |
| `className` | `string` | ❌ | Clase CSS adicional |
| `loading` | `boolean` | ❌ | Estado de carga |
| `emptyMessage` | `string` | ❌ | Mensaje cuando no hay tareas |

**Ejemplo de uso:**
```tsx
import TaskList from './components/TaskList';

<TaskList
  tasks={tasks}
  projects={projects}
  onTaskToggle={handleToggle}
  onTaskDelete={handleDelete}
  onTaskEdit={handleEdit}
  loading={false}
/>
```

**Tests**: `src/components/TaskList/TaskList.test.tsx`

### TaskEditPanel
**Ubicación**: `src/components/TaskEditPanel/`

Panel lateral para editar tareas existentes con formulario completo.

**Props:**

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `task` | `TaskData \| null` | ✅ | Tarea a editar |
| `projects` | `Project[]` | ✅ | Array de proyectos disponibles |
| `isOpen` | `boolean` | ✅ | Estado de visibilidad del panel |
| `onClose` | `() => void` | ✅ | Callback al cerrar |
| `onSave` | `(taskId, data) => void` | ✅ | Callback al guardar |
| `className` | `string` | ❌ | Clase CSS adicional |

**Ejemplo de uso:**
```tsx
import TaskEditPanel from './components/TaskEditPanel';

<TaskEditPanel
  task={selectedTask}
  projects={projects}
  isOpen={isPanelOpen}
  onClose={() => setIsPanelOpen(false)}
  onSave={handleSave}
/>
```

**Tests**: `src/components/TaskEditPanel/TaskEditPanel.test.tsx`

## Cobertura de Tests

### Tests E2E (Playwright)

El proyecto incluye 6 suites de tests E2E que cubren diferentes aspectos:

1. **tasks.spec.ts**: CRUD de tareas, validación de formularios
2. **states.spec.ts**: Estados de la aplicación (loading, empty, error)
3. **user-flows.spec.ts**: Flujos completos de usuario
4. **accessibility.spec.ts**: Validación de accesibilidad (ARIA, keyboard navigation)
5. **edge-cases.spec.ts**: Casos límite y manejo de errores
6. **responsive.spec.ts**: Diseño responsive en diferentes viewports

### Tests Unitarios

**Frontend (Vitest):**
- `TaskList.test.tsx`: Renderizado, interacciones, estados
- `TaskEditPanel.test.tsx`: Formulario, validación, eventos

**Backend (pytest):**
- `test_tasks.py`: Todos los endpoints de tareas, validación, errores
- `test_projects.py`: Todos los endpoints de proyectos, validación, errores

## Agentes Claude Code Disponibles

Este proyecto incluye 5 agentes especializados configurados en `.claudeagents`:

### react-generator
**Propósito**: Genera componentes React completos

Genera automáticamente:
- Archivo `.tsx` con el componente
- Archivo `.module.css` con estilos
- Archivo `.test.tsx` con tests
- Archivo `index.ts` para exportación

### endpoint-generator
**Propósito**: Genera endpoints FastAPI completos

Genera automáticamente:
- Router en `src/api/routes/`
- Schemas Pydantic en `src/api/schemas/`
- Tests en `tests/api/`
- Validación y documentación

### playwright-validator
**Propósito**: Valida funcionalidad E2E después de desarrollar features

Ejecuta y valida:
- Tests E2E de Playwright
- Generación de reportes
- Detección de regresiones

### coverage-reporter
**Propósito**: Mide y reporta cobertura de código

Analiza:
- Cobertura frontend (Vitest)
- Cobertura backend (pytest)
- Genera reportes HTML

### readme-documenter
**Propósito**: Documenta el proyecto en README.md

Mantiene actualizado:
- Documentación de features
- API reference
- Guías de instalación y uso
- Catálogo de componentes

## Skills Disponibles

Comandos rápidos para desarrollo:

- `/react-component [Name]`: Genera un componente React completo
- `/python-endpoint [name]`: Genera un endpoint FastAPI completo
- `/code-review`: Revisa código React y Python
- `/generate-tests [file]`: Genera tests para un archivo
- `/document-api`: Documenta la API FastAPI
- `/document-component [Name]`: Documenta un componente React

## Convenciones de Código

### React/TypeScript

- **Nomenclatura**: Componentes en PascalCase (`TaskList.tsx`)
- **Props**: Siempre tipadas con `interface` exportada
- **Hooks**: Usar hooks de React correctamente (reglas de hooks)
- **Estilos**: CSS Modules para scope local
- **Tipado**: Evitar `any`, usar tipos específicos
- **Tests**: Colocados junto al código (`ComponentName.test.tsx`)

Ejemplo:
```tsx
export interface TaskListProps {
  tasks: Task[];
  onTaskToggle?: (taskId: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskToggle }) => {
  // Implementation
};
```

### Python/FastAPI

- **Nomenclatura**: Funciones y variables en snake_case
- **Type Hints**: Obligatorios en todas las funciones
- **Validación**: Usar Pydantic v2 para schemas
- **Async**: Usar async/await para operaciones I/O
- **Docstrings**: Documentar todos los endpoints
- **Tests**: Colocados en `tests/` espejando la estructura

Ejemplo:
```python
@router.get("/tasks/", response_model=List[TaskResponse])
async def get_all_tasks() -> List[dict]:
    """Obtiene todas las tareas."""
    return list(_tasks_db.values())
```

### Tests

- **Unitarios**: Colocados junto al código que testean
- **Nomenclatura**: Archivos terminan en `.test.tsx` o `test_*.py`
- **Cobertura**: Apuntar a >80% de cobertura
- **Assertions**: Usar assertions descriptivos
- **Fixtures**: Usar fixtures de pytest para setup

## Changelog

### [2026-02-12] - README Completo Inicial
- **Added**: Documentación completa del proyecto en README.md
- **Added**: Descripción de stack tecnológico completo
- **Added**: Guías de instalación y ejecución
- **Added**: API reference con todos los endpoints
- **Added**: Catálogo de componentes React (TaskList, TaskEditPanel)
- **Added**: Documentación de agentes Claude Code disponibles
- **Added**: Documentación de skills y convenciones de código
- **Added**: Estructura del proyecto detallada
- **Added**: Guías de testing (unitario y E2E)

### Características Existentes Documentadas
- **Documented**: CRUD completo de tareas con endpoints FastAPI
- **Documented**: CRUD completo de proyectos con endpoints FastAPI
- **Documented**: Componentes React TaskList y TaskEditPanel
- **Documented**: 6 suites de tests E2E con Playwright
- **Documented**: Tests unitarios frontend y backend
- **Documented**: Configuración de cobertura de código

## Contribuir

### Workflow de Desarrollo

1. **Instalar dependencias** (frontend y backend)
2. **Ejecutar tests** para verificar que todo funciona
3. **Desarrollar feature** siguiendo las convenciones
4. **Escribir tests** para la nueva funcionalidad
5. **Ejecutar tests E2E** si aplica
6. **Verificar cobertura** de código

### Usar Agentes Claude Code

Los agentes están configurados para acelerar el desarrollo:

```bash
# Generar un nuevo componente React
/react-component [ComponentName]

# Generar un nuevo endpoint
/python-endpoint [endpoint_name]

# Validar con tests E2E
# (usar agente playwright-validator)

# Documentar cambios
# (usar agente readme-documenter)
```

## Licencia

Este es un proyecto de aprendizaje sin licencia específica.

## Estado del Proyecto

🚧 **En desarrollo activo** - Este proyecto está siendo desarrollado como demostración de las capacidades de Claude Code con agentes especializados.

### Próximas Features Planificadas
- Tablero Kanban con drag & drop
- Sincronización de estados completed/status
- Persistencia en SQLite
- Autenticación de usuarios
- Filtrado y búsqueda de tareas
- Exportación de datos

---

**Desarrollado con Claude Code** - Demostrando el poder de los agentes especializados de IA en el desarrollo de software.
