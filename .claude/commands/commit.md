---
description: Analiza cambios, sugiere mensaje de commit, hace commit y push
---

# Commit Inteligente

Automatiza el proceso de commit con sugerencia de mensaje basada en los cambios.

## Argumentos:
- `--force` o `-f`: Salta la confirmacion antes de push

## Proceso:

### 1. Verificar estado del repositorio
- Ejecuta `git status` para ver archivos modificados
- Si no hay cambios, informa al usuario y termina
- Muestra resumen de archivos: nuevos, modificados, eliminados

### 2. Analizar cambios
- Ejecuta `git diff` para ver el contenido de los cambios
- Ejecuta `git diff --cached` si hay archivos en staging

### 3. Sugerir mensaje de commit
Basandote en los cambios, genera un mensaje que:
- Use el formato: `tipo: descripcion breve`
- Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`
- Descripcion en imperativo, max 50 caracteres
- Si hay mas contexto, anade cuerpo descriptivo

### 4. Mostrar resumen y confirmar
Muestra al usuario:
```
📋 Resumen de cambios:
   - X archivos modificados
   - Y archivos nuevos
   - Z archivos eliminados

💬 Mensaje sugerido:
   tipo: descripcion

🔄 Archivos a incluir:
   - archivo1.ts
   - archivo2.py
```

Pregunta: "¿Proceder con este mensaje? (puedes sugerir cambios)"

### 5. Ejecutar commit
- `git add` de los archivos relevantes (NO usar `git add -A`, añadir archivos especificos)
- `git commit -m "mensaje"`
- Incluir siempre: `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`

### 6. Confirmar push (si no es --force)
- Si no se paso `--force`, preguntar: "¿Hacer push a origin?"
- Si es `--force`, hacer push directamente

### 7. Ejecutar push y mostrar resultado
- `git push`
- Mostrar URL del commit en GitHub: `https://github.com/{owner}/{repo}/commit/{hash}`

## Ejemplo de uso:
```
/commit           # Flujo completo con confirmaciones
/commit --force   # Sin confirmaciones, push directo
/commit -f        # Igual que --force
```

## Notas importantes:
- NO commitear archivos sensibles (.env, credentials, etc.)
- Si detectas archivos sensibles, advierte al usuario
- Si hay conflictos o errores, informar claramente y NO continuar
