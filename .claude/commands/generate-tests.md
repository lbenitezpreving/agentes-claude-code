---
description: Genera tests para un archivo de código
argument-hint: "[file_path]"
---

# Generador de Tests

Genera tests para el archivo: `$ARGUMENTS`

## Proceso:

1. Lee el archivo especificado
2. Identifica funciones/componentes a testear
3. Genera tests exhaustivos
4. Ejecuta los tests para verificar

## Para archivos React (.tsx):

Genera tests con Vitest:
- Tests de renderizado
- Tests de props
- Tests de eventos (click, change, etc.)
- Tests de hooks personalizados
- Mocks de dependencias externas

Ubicación: junto al archivo (`ComponentName.test.tsx`)

## Para archivos Python (.py):

Genera tests con pytest:
- Tests unitarios de funciones
- Tests de endpoints (TestClient)
- Fixtures reutilizables
- Parametrización de casos edge
- Mocks con pytest-mock si es necesario

Ubicación: en `tests/` con estructura espejo

## Instrucciones:

1. Lee el archivo $ARGUMENTS
2. Identifica qué testear
3. Genera archivo de tests
4. Ejecuta los tests con `npm test` o `python -m pytest`
5. Reporta resultados
