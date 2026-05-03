#!/usr/bin/env bash
# Architecture-rule check. Runs as a Claude Code Stop hook.
# Layer rules are documented in CLAUDE.md (Self-review section).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$ROOT/src"

[ -d "$SRC" ] || exit 0

violations=0
report() {
  printf '\n[architecture] %s\n' "$1" >&2
  shift
  printf '%s\n' "$@" >&2
  violations=1
}

scan() {
  local description="$1"
  local pattern="$2"
  shift 2
  local hits
  hits="$(grep -rEn --include='*.ts' "$pattern" "$@" 2>/dev/null || true)"
  [ -n "$hits" ] && report "$description" "$hits"
}

# 3rd-party libs forbidden in domain/ and application/
scan "domain/ or application/ imports a forbidden library (drizzle/zod/fastify/postgres/jose/bcrypt/openai)" \
  "from ['\"](drizzle-orm|drizzle-orm/.*|zod|fastify|@fastify/.*|postgres|jose|bcryptjs|openai)['\"]" \
  "$SRC/domain" "$SRC/application"

# Use case importing another use case
scan "use case imports another use case (forbidden — depend on the repo interface instead)" \
  "from ['\"][^'\"]*\\.use-case\\.js['\"]" \
  "$SRC/application"

# domain/ must not reach into outer layers
scan "domain/ imports an outer layer (application/infrastructure/presentation)" \
  "from ['\"]\\.\\./[^'\"]*(application|infrastructure|presentation)" \
  "$SRC/domain"

# application/ must not reach infrastructure or presentation
scan "application/ imports infrastructure or presentation" \
  "from ['\"]\\.\\./[^'\"]*(infrastructure|presentation)" \
  "$SRC/application"

# infrastructure/ must not import fastify or presentation
scan "infrastructure/ imports fastify or presentation" \
  "from ['\"](fastify|@fastify/.*)['\"]|from ['\"]\\.\\./[^'\"]*presentation" \
  "$SRC/infrastructure"

# Concrete repo classes must not be imported in application/
scan "application/ imports a concrete repo (Postgres<X>Repository) — depend on <X>Repo interface instead" \
  "import \\{[^}]*Postgres[A-Za-z]*Repository[^}]*\\} from" \
  "$SRC/application"

# Domain entities must be pure — no system clock reads
scan "domain/ uses Date.now() or new Date() (no args) — keep domain pure, pass time in from caller" \
  "(Date\\.now\\(\\)|new Date\\(\\s*\\))" \
  "$SRC/domain"

# console.* forbidden anywhere — use pino (req.log / app.log / logger from lib/logger.js).
# Exception: src/config/env.ts uses console.error during bootstrap before logger exists.
console_hits=$(grep -rEn --include='*.ts' "console\\.(log|info|warn|error|debug|trace)" "$SRC" 2>/dev/null \
  | grep -vE "/src/config/env\\.ts:" || true)
[ -n "$console_hits" ] && report "console.* used — Fastify provides pino (req.log inside handlers, app.log/logger elsewhere). Project does not target AWS Lambda; prod logs must be structured pino output" "$console_hits"

# process.env access outside src/config/ — use the validated `env` object instead
penv_hits=$(grep -rEn --include='*.ts' "process\\.env" "$SRC" 2>/dev/null \
  | grep -vE "/src/config/(env|timezone)\\.ts:" || true)
[ -n "$penv_hits" ] && report "process.env accessed outside src/config/ — import { env } from 'src/config/env.js' (Zod-validated, fail-fast on missing)" "$penv_hits"

# application/ must not import concrete adapters — depend on the port interface instead
scan "application/ imports a concrete adapter — depend on the port interface instead" \
  "from ['\"][^'\"]*infrastructure/adapters" \
  "$SRC/application"

if [ $violations -ne 0 ]; then
  printf '\nFix architecture violations before reporting the task as done. See CLAUDE.md for the layer rule.\n' >&2
  exit 2
fi

exit 0
