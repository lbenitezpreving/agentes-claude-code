# Components Documentation

Documentación de componentes React del proyecto.

## Índice

- [Componentes disponibles](#componentes-disponibles)
- [Convenciones](#convenciones)
- [Uso de Storybook](#uso-de-storybook)

## Componentes Disponibles

*Los componentes se documentan automáticamente usando `/document-component [ComponentName]`*

---

## Convenciones

### Estructura de componentes

Cada componente sigue esta estructura:

```
src/components/ComponentName/
├── ComponentName.tsx          # Componente principal
├── ComponentName.module.css   # Estilos CSS Modules
├── ComponentName.test.tsx     # Tests con Vitest
├── ComponentName.stories.tsx  # Stories de Storybook
└── index.ts                   # Re-export
```

### Props

- Todas las props deben estar tipadas con interface
- Usar nombres descriptivos
- Documentar props complejas con JSDoc

### Estilos

- Usar CSS Modules para encapsulamiento
- Seguir metodología BEM para nombres de clases
- Evitar estilos inline excepto para valores dinámicos

---

## Uso de Storybook

```bash
npm run storybook
```

Accede a `http://localhost:6006` para ver los componentes.
