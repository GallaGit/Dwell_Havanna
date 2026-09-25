#!/usr/bin/env bash
# Aplica el SQL canónico de Dwell Havana en una base nueva, o en una base
# que ya tiene verified_contributors.auth_user_id. El procedimiento y la
# excepción del esquema anterior a 03 están en docs/Tech/06-config-operacion.md.
#
# Por defecto solo lista los archivos. No conecta a ninguna base.
# No ejecutes esto contra producción desde un agente: el proyecto
# sfujmwumtzuzwwhfmyxa está bloqueado salvo --allow-production.
# Con --apply, cada archivo va en una transacción (psql --single-transaction
# y ON_ERROR_STOP). Si una sentencia falla, ese archivo se revierte y el script para.
#
# Uso:
#   scripts/apply-canonical-sql.sh
#   scripts/apply-canonical-sql.sh --with-seed
#   DATABASE_URL=postgresql://... scripts/apply-canonical-sql.sh --apply
#   DATABASE_URL=postgresql://... scripts/apply-canonical-sql.sh --apply --with-seed --allow-production
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPLY=0
WITH_SEED=0
ALLOW_PRODUCTION=0
PRODUCTION_REF="sfujmwumtzuzwwhfmyxa"

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --with-seed) WITH_SEED=1 ;;
    --allow-production) ALLOW_PRODUCTION=1 ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *)
      echo "Opción desconocida: $arg" >&2
      exit 2
      ;;
  esac
done

FILES=(
  "supabase/01-schema.sql"
  "supabase/03-contributor-auth.sql"
  "supabase/04-editorial-permissions.sql"
  "supabase/migrations/20260921000300_editorial_member_management.sql"
)

if [[ "$WITH_SEED" -eq 1 ]]; then
  FILES+=("supabase/02-seed.sql")
fi

echo "Orden SQL canónico:"
step=1
for file in "${FILES[@]}"; do
  if [[ ! -f "$ROOT/$file" ]]; then
    echo "Falta $file" >&2
    exit 1
  fi
  printf '  %s. %s\n' "$step" "$file"
  step=$((step + 1))
done

cat <<'EOF'

Después del SQL, y fuera de este script, da de alta el primer owner
con su auth_user_id real:

  insert into editorial_members (auth_user_id, role, display_name)
  values ('<auth-user-uuid>', 'owner', '<nombre editorial>');

El seed (02-seed.sql) es contenido de ejemplo. Omítelo si no lo quieres.

Este orden vale cuando la base es nueva o cuando auth_user_id ya existe.
Si verified_contributors existe y todavía no tiene auth_user_id, para y
ejecuta 03-contributor-auth.sql antes de 01-schema.sql. Si no, el índice
verified_contributors_auth_user_idx falla. Producción se migró así el
2026-09-25; hoy la columna ya está y este orden es idempotente allí.
EOF

if [[ "$APPLY" -eq 0 ]]; then
  echo
  echo "Sin --apply no se ejecuta nada. Para aplicarlo hace falta DATABASE_URL y psql."
  exit 0
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL no está definida. No se aplica nada." >&2
  exit 1
fi

if [[ "$DATABASE_URL" == *"$PRODUCTION_REF"* && "$ALLOW_PRODUCTION" -eq 0 ]]; then
  echo "DATABASE_URL apunta al proyecto de producción ($PRODUCTION_REF)." >&2
  echo "No se aplica. Repite con --allow-production solo si esa base es la correcta." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql no está instalado." >&2
  exit 1
fi

for file in "${FILES[@]}"; do
  echo "Aplicando $file"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$ROOT/$file"
done

echo "SQL aplicado. Falta el alta manual del owner, si aún no existe."
