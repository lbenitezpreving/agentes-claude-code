---
description: Genera un nuevo componente React con TypeScript, estilos y tests
argument-hint: "[ComponentName]"
---

# Generador de Componentes React

Genera un componente React completo para: `$ARGUMENTS`

## Estructura a crear:

```
src/components/$ARGUMENTS/
├── $ARGUMENTS.tsx          # Componente principal
├── $ARGUMENTS.module.css   # Estilos CSS Modules
├── $ARGUMENTS.test.tsx     # Tests con Vitest
└── index.ts                # Re-export
```

## Plantilla del componente ($ARGUMENTS.tsx):

```tsx
import React from 'react';
import styles from './$ARGUMENTS.module.css';

interface $ARGUMENTSProps {
  className?: string;
  children?: React.ReactNode;
}

const $ARGUMENTS: React.FC<$ARGUMENTSProps> = ({
  className = '',
  children
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      {children}
    </div>
  );
};

export default $ARGUMENTS;
```

## Plantilla de estilos ($ARGUMENTS.module.css):

```css
.container {
  /* Add styles here */
}
```

## Plantilla de tests ($ARGUMENTS.test.tsx):

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import $ARGUMENTS from './$ARGUMENTS';

describe('$ARGUMENTS', () => {
  it('renders children correctly', () => {
    render(<$ARGUMENTS>Test Content</$ARGUMENTS>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<$ARGUMENTS className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
```

## Plantilla de index (index.ts):

```ts
export { default } from './$ARGUMENTS';
```

## Instrucciones:

1. Crea el directorio `src/components/$ARGUMENTS/`
2. Genera cada archivo según las plantillas
3. Reemplaza `$ARGUMENTS` con el nombre del componente
4. Asegúrate de que el componente siga las convenciones del proyecto (PascalCase)
