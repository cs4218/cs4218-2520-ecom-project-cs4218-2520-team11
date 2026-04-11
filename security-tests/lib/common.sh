#!/bin/bash
# ─────────────────────────────────────────────────────────────
# common.sh — shared helpers for the security audit scripts
# ─────────────────────────────────────────────────────────────
# Provides:
#   - BASE_URL / ROOT_URL
#   - colored output: section / subsection / info
#   - HTTP helpers: http_get / http_post / http_delete / http_head
#                   (set $HTTP_CODE and $HTTP_BODY after each call)
#   - Finding helpers: finding <id> <msg>   → prints ⚠ warning
#                      pass    <id> <msg>   → prints ✔ pass
# ─────────────────────────────────────────────────────────────

BASE_URL="${BASE_URL:-http://localhost:6060/api/v1}"
ROOT_URL="${ROOT_URL:-http://localhost:6060}"

# Colours (disabled if stdout is not a tty)
if [ -t 1 ]; then
  RED=$'\033[31m';    GREEN=$'\033[32m'; YELLOW=$'\033[33m'
  BLUE=$'\033[34m';   CYAN=$'\033[36m';  BOLD=$'\033[1m'
  DIM=$'\033[2m';     RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; BOLD=""; DIM=""; RESET=""
fi

section() {
  echo
  echo "${BOLD}${BLUE}══════════════════════════════════════════════════════════${RESET}"
  echo "${BOLD}${BLUE}  $1${RESET}"
  echo "${BOLD}${BLUE}══════════════════════════════════════════════════════════${RESET}"
}

subsection() {
  echo
  echo "${BOLD}${CYAN}── $1 ──${RESET}"
}

info()    { echo "${DIM}$1${RESET}"; }
finding() { echo "${RED}${BOLD}⚠ ${1}${RESET} — ${2}"; }
pass()    { echo "${GREEN}${BOLD}✔ ${1}${RESET} — ${2}"; }
skip()    { echo "${YELLOW}${BOLD}⊘ ${1}${RESET} — ${2}"; }

# ── HTTP helpers ─────────────────────────────────────────────
# Usage: http_post <path> <json> [auth_token]
#        then read $HTTP_CODE and $HTTP_BODY
_http() {
  local method="$1" url="$2" body="$3" auth="$4"
  local args=(-s -w "\n---HTTP_STATUS:%{http_code}---" -X "$method" "$url")
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" -d "$body")
  [ -n "$auth" ] && args+=(-H "Authorization: $auth")
  local raw
  raw=$(curl "${args[@]}")
  HTTP_BODY=$(echo "$raw" | sed 's/---HTTP_STATUS:.*---//')
  HTTP_CODE=$(echo "$raw" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
}

http_get()    { _http GET    "$BASE_URL$1" ""    "$2"; }
http_post()   { _http POST   "$BASE_URL$1" "$2"  "$3"; }
http_delete() { _http DELETE "$BASE_URL$1" ""    "$2"; }

http_head() {
  # Raw header dump for a URL (used by header/CORS audits)
  curl -s -I "$1" "${@:2}"
}

# ── JSON helper (uses python3 for safety) ────────────────────
json_get() {
  # Usage: json_get '.path.to.key' <<< "$json"
  python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for k in '$1'.strip('.').split('.'):
        d = d[k] if isinstance(d, dict) else d[int(k)]
    print(d)
except Exception:
    pass
"
}

# ── Admin token helper ───────────────────────────────────────
# Tries a list of known seeded admin credentials. Sets $ADMIN_TOKEN and $ADMIN_ID.
get_admin_token() {
  ADMIN_TOKEN=""
  ADMIN_ID=""
  local creds=(
    '{"email":"cs4218@test.com","password":"cs4218@test.com"}'
    '{"email":"admin@admin.com","password":"admin123"}'
  )
  for c in "${creds[@]}"; do
    http_post "/auth/login" "$c"
    ADMIN_TOKEN=$(echo "$HTTP_BODY" | json_get ".token")
    ADMIN_ID=$(echo "$HTTP_BODY" | json_get ".user._id")
    [ -n "$ADMIN_TOKEN" ] && return 0
  done
  return 1
}
