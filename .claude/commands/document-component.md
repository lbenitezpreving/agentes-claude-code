---
description: Genera documentación para un componente React
argument-hint: "[ComponentName]"
---

# Documentador de Componentes React

Documenta el componente: `$ARGUMENTS`

## Tareas:

1. Lee el componente en `src/components/$ARGUMENTS/`
2. Extrae props, tipos y funcionalidad
3. Actualiza `docs/COMPONENTS.md` con la documentación

## Información a extraer:

- Nombre del componente
- Descripción de su propósito
- Props disponibles con tipos
- Ejemplos de uso
- Dependencias

## Formato de salida:

```markdown
## $ARGUMENTS

### Descripción
[Descripción del componente]

### Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| prop1 | string | Sí | - | Descripción |

### Ejemplo de uso

```tsx
import $ARGUMENTS from '@/components/$ARGUMENTS';

<$ARGUMENTS prop1="value" />
```
```

## Instrucciones:

1. Lee el archivo $ARGUMENTS.tsx
2. Extrae la interface de props
3. Añade la documentación a docs/COMPONENTS.md
