#!/bin/bash
# Antony Swami Alfred Ben, A0253016R
# ─────────────────────────────────────────────────────────────
# OWASP A06 — Vulnerable & Outdated Components
# ─────────────────────────────────────────────────────────────
# Runs npm audit against the project root and summarises the
# result. Does not fail on findings — surfaces them for review.
# ─────────────────────────────────────────────────────────────
set -u
source "$(dirname "$0")/../lib/common.sh"

section "A06 — Vulnerable & Outdated Components"

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
subsection "Running npm audit in $PROJECT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  skip "VV-012" "npm not available in PATH"
  exit 0
fi

AUDIT=$(cd "$PROJECT_DIR" && npm audit 2>&1 || true)
echo "$AUDIT" | sed 's/^/  /'
echo

# Summary line (npm prints "found N vulnerabilities" or similar)
SUMMARY=$(echo "$AUDIT" | grep -Ei "vulnerabilit(y|ies)" | head -1)
if [ -n "$SUMMARY" ]; then
  finding "VV-012" "${SUMMARY// /}"
else
  pass    "VV-012" "npm audit reports no vulnerabilities"
fi
