# Guía de Migración a SQLite

## Resumen

Este proyecto actualmente utiliza **almacenamiento en memoria** (diccionarios) para las entidades `tasks` y `projects`. Se ha creado un **skill experto** (`/sqlite-setup`) y un **agente especializado** (`sqlite-manager`) para facilitar la migración a persistencia real con SQLite.

## Problema Actual

- ❌ Los datos se pierden al reiniciar el servidor
- ❌ Datos hardcodeados que se recrean en cada inicio
- ❌ Imposible usar en producción
- ❌ Sin persistencia real entre ejecuciones

## Solución Implementada

### 1️⃣ Skill: `/sqlite-setup [model_name]`

**Ubicación:** `.claude/commands/sqlite-setup.md`

**Propósito:** Proporciona templates y mejores prácticas reutilizables para configurar SQLite con SQLAlchemy 2.0 async.

**Contenido:**
- ✅ Template para `database.py` (configuración de BD)
- ✅ Templates para modelos ORM (Mapped types, FK, relationships)
- ✅ Guía para actualizar routers (queries SQL async)
- ✅ Templates para tests async (fixtures, AsyncClient)
- ✅ Script de migración de datos
- ✅ Comandos de verificación
- ✅ Mejores prácticas y checklist

**Uso:**
```bash
# Invocar el skill para obtener templates y guías
/sqlite-setup Task
```

### 2️⃣ Agente: `sqlite-manager`

**Ubicación:** `.claude/agents/sqlite-manager.md`

**Propósito:** Automatiza la migración completa desde almacenamiento en memoria a SQLite.

**Workflow del Agente:**

1. **Fase 1: Análisis Previo** (READ-ONLY)
   - Leer routers actuales (`projects.py`, `tasks.py`)
   - Identificar lógica crítica de negocio (sincronización status/completed en tasks)
   - Leer schemas y tests actuales
   - Crear backups automáticos

2. **Fase 2: Instalación de Dependencias**
   - Añadir `sqlalchemy>=2.0.25`, `aiosqlite>=0.19.0`, `pytest-asyncio>=0.23.0`
   - Instalar dependencias

3. **Fase 3: Crear Infraestructura de BD**
   - Crear `src/api/database.py`
   - Crear modelos ORM en `src/api/models/`
     - `project.py` (simple)
     - `task.py` (con FK a Project)
   - Actualizar `src/main.py` con lifespan

4. **Fase 4: Migración de Datos**
   - Crear script `src/api/migrate_data.py`
   - Migrar 4 proyectos hardcodeados
   - Validar datos en BD

5. **Fase 5: Actualizar Router de Projects**
   - Reemplazar diccionarios por queries SQL
   - Añadir dependency `get_db()`
   - Mantener compatibilidad con schemas

6. **Fase 6: Actualizar Router de Tasks** (CRÍTICO)
   - Preservar lógica de sincronización bidireccional `completed ↔ status`
   - Migrar endpoints especiales (toggle, update_status)
   - Mantener timestamps (`completed_at`)

7. **Fase 7: Adaptar Tests a Async**
   - Configurar `pytest-asyncio`
   - Migrar fixtures a async
   - Actualizar todos los tests
   - Mantener todas las assertions

8. **Fase 8: Validación e Integridad**
   - Ejecutar tests (objetivo: >85% coverage)
   - Validar BD manualmente
   - Probar API en vivo
   - Verificar persistencia

9. **Fase 9: Cleanup y Documentación**
   - Actualizar `.gitignore`
   - Generar reporte de migración
   - Actualizar `CLAUDE.md`

**Uso:**
```bash
# Invocar el agente para migración automática
# (Esto se hace desde Claude Code, el agente ejecutará todo el workflow)
```

## Archivos Creados

### Nuevos archivos del skill/agente:
- ✅ `.claude/commands/sqlite-setup.md` - Skill con templates
- ✅ `.claude/agents/sqlite-manager.md` - Agente automatizado

### Archivos que se crearán durante la migración:
- `src/api/database.py` - Configuración de BD
- `src/api/models/__init__.py` - Exportación de modelos
- `src/api/models/project.py` - Modelo ORM Project
- `src/api/models/task.py` - Modelo ORM Task
- `src/api/migrate_data.py` - Script de migración
- `app.db` - Base de datos SQLite
- `backups/` - Backups de archivos modificados

### Archivos que se modificarán:
- `src/main.py` - Añadir lifespan
- `src/api/routes/projects.py` - Queries SQL
- `src/api/routes/tasks.py` - Queries SQL + preservar lógica
- `tests/api/test_projects.py` - Tests async
- `tests/api/test_tasks.py` - Tests async
- `requirements.txt` - Dependencias
- `.gitignore` - Ignorar `*.db`
- `pyproject.toml` - Config pytest-asyncio

## Ventajas de la Migración

### Técnicas
- ✅ Persistencia real entre reinicios del servidor
- ✅ Queries SQL eficientes con SQLAlchemy 2.0
- ✅ Soporte para relaciones (Foreign Keys)
- ✅ Timestamps automáticos
- ✅ Async nativo (mejor performance)
- ✅ Preparación para PostgreSQL (cambio trivial)

### De Desarrollo
- ✅ Tests aislados (BD en memoria para cada test)
- ✅ Migración de datos versionada
- ✅ Mejor debugging (inspeccionar BD con sqlite3)
- ✅ Seed data automatizado

### De Producción
- ✅ Apto para producción
- ✅ Backup y restore fácil
- ✅ Escalable (migración a PostgreSQL simple)
- ✅ Integridad referencial (FK constraints)

## Características Críticas Preservadas

El agente `sqlite-manager` está diseñado para preservar:

1. **Lógica de sincronización en Tasks** (CRÍTICA):
   - Si `status="done"` → `completed=True`, `completed_at=now`
   - Si `completed=True` → `status="done"`
   - Si `completed=False` y status era "done" → `status="backlog"`

2. **Endpoints especiales**:
   - `PATCH /tasks/{id}/toggle` - Alterna completed
   - `PATCH /tasks/{id}/status` - Actualiza status

3. **Compatibilidad total**:
   - Schemas Pydantic NO cambian
   - Response format idéntico
   - Todos los tests pasan
   - Coverage >85%

## Comandos Útiles Post-Migración

```bash
# Ver estructura de la BD
sqlite3 app.db ".schema"

# Consultar proyectos
sqlite3 app.db "SELECT * FROM projects;"

# Consultar tareas
sqlite3 app.db "SELECT * FROM tasks;"

# Verificar integridad FK
sqlite3 app.db "SELECT t.id, t.name, t.project_id FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.project_id IS NOT NULL AND p.id IS NULL;"

# Ejecutar tests
pytest tests/api/ -v --cov=src/api --cov-report=term-missing

# Ejecutar API
uvicorn src.main:app --reload --port 8000
```

## Migración Futura a PostgreSQL

Después de migrar a SQLite, cambiar a PostgreSQL es trivial:

```python
# En src/api/database.py
# De:
DATABASE_URL = "sqlite+aiosqlite:///./app.db"

# A:
DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/dbname"
```

**Dependencia adicional:**
```bash
pip install asyncpg
```

**Modelos ORM:** No requieren cambios ✅

## Próximos Pasos

1. **Para usar el skill manualmente:**
   - Ejecutar `/sqlite-setup Task`
   - Seguir los templates proporcionados
   - Implementar paso a paso

2. **Para migración automática:**
   - Invocar el agente `sqlite-manager`
   - Revisar y aprobar backups
   - Validar tests al finalizar

3. **Mejoras futuras** (post-migración):
   - Alembic para migraciones versionadas
   - Índices adicionales
   - Soft deletes
   - Connection pooling

## Notas Importantes

⚠️ **IMPORTANTE:**
- El agente crea backups automáticos antes de modificar archivos
- Si >50% de tests fallan, hace rollback automático
- La lógica de negocio se preserva al 100%
- Tests mantienen mismas assertions

✅ **Validación:**
- Coverage debe mantenerse >85%
- Todos los tests deben pasar
- API debe funcionar idénticamente
- Persistencia debe funcionar (datos sobreviven reinicio)

## Documentación Actualizada

- ✅ `CLAUDE.md` actualizado con nueva sección de BD
- ✅ Agente y skill documentados
- ✅ Este archivo de guía creado

## Soporte

Para problemas durante la migración:
- El agente incluye manejo de errores detallado
- Sección de "Manejo de Errores" en `sqlite-manager.md`
- Rollback automático en caso de fallo crítico
- Backups siempre disponibles en `backups/`
