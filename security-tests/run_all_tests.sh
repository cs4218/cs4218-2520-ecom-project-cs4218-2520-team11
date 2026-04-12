#!/bin/bash
# Antony Swami Alfred Ben, A0253016R
# ─────────────────────────────────────────────────────────────
# Security audit — master runner
# ─────────────────────────────────────────────────────────────
# Runs every test script under tests/ in OWASP order.
# Prints to stdout only; redirect if you want a log file:
#   ./run_all_tests.sh | tee audit.log
#
# Assumes the app is running at http://localhost:6060.
# Override via BASE_URL / ROOT_URL env vars if needed.
# ─────────────────────────────────────────────────────────────
set -u

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Virtual Vault — Security Audit                          ║"
echo "║  CS4218 Milestone 3 — Non-Functional Testing             ║"
echo "║  $(date)                                   ║"
echo "╚══════════════════════════════════════════════════════════╝"

for t in "$DIR"/tests/*.sh; do
  bash "$t"
done

echo
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Audit complete. Findings above are labelled VV-*.       ║"
echo "╚══════════════════════════════════════════════════════════╝"
