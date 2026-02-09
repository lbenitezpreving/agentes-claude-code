#!/bin/bash
# Hook para proteger archivos sensibles de edición

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Lista de patrones protegidos
PROTECTED=(".env" "secrets/" "credentials" ".secret" "private_key" "api_key")

for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Bloqueado: No se permite editar archivos sensibles ($pattern)" >&2
    exit 2
  fi
done

exit 0
