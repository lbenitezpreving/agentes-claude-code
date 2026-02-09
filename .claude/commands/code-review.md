---
description: Revisa el código reciente y proporciona feedback
---

# Revisor de Código

Revisa los cambios recientes en el código y proporciona feedback estructurado.

## Proceso:

1. Ejecuta `git diff` para ver cambios recientes (o `git diff HEAD~1` si ya hay commits)
2. Analiza el código modificado
3. Proporciona feedback estructurado

## Checklist por tecnología:

### React/TypeScript:
- [ ] Props tipadas correctamente
- [ ] Hooks usados correctamente (dependencias, orden)
- [ ] Manejo de estados adecuado
- [ ] Sin efectos secundarios en render
- [ ] Componentes reutilizables
- [ ] Sin `any` innecesarios

### Python/FastAPI:
- [ ] Type hints en funciones
- [ ] Validación con Pydantic v2
- [ ] Manejo de errores HTTP
- [ ] Async/await correcto
- [ ] Sin código bloqueante
- [ ] Docstrings en endpoints

## Formato de feedback:

### Crítico (debe corregirse):
- ...

### Advertencia (debería corregirse):
- ...

### Sugerencia (considera mejorar):
- ...

### Bien hecho:
- ...
