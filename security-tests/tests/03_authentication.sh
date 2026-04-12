#!/bin/bash
# Antony Swami Alfred Ben, A0253016R
# ─────────────────────────────────────────────────────────────
# OWASP A07 — Identification & Authentication Failures
# ─────────────────────────────────────────────────────────────
# Tests JWT weaknesses (forging via known secret, excessive
# expiry), tampered token rejection, and brute-force resilience
# (rate limiting on /auth/login).
# ─────────────────────────────────────────────────────────────
set -u
source "$(dirname "$0")/../lib/common.sh"

JWT_SECRET="${JWT_SECRET:-HGFHGEAD12124322432}"

section "A07 — Authentication & Session Failures"

# ── JWT token structural analysis ────────────────────────────
subsection "JWT token analysis (expiry, algorithm)"
if ! get_admin_token; then
  skip "VV-003/018" "No valid credentials to obtain a token — skipping JWT tests"
else
  info "Token acquired: ${ADMIN_TOKEN:0:40}..."
  PAYLOAD=$(echo "$ADMIN_TOKEN" | cut -d. -f2 | \
    python3 -c "import sys,base64,json; s=sys.stdin.read().strip(); s+='='*(4-len(s)%4); print(json.dumps(json.loads(base64.urlsafe_b64decode(s))))" 2>/dev/null)
  info "Payload: $PAYLOAD"

  EXP=$(echo "$PAYLOAD" | json_get ".exp")
  IAT=$(echo "$PAYLOAD" | json_get ".iat")
  if [ -n "$EXP" ] && [ -n "$IAT" ]; then
    DAYS=$(( (EXP - IAT) / 86400 ))
    if [ "$DAYS" -ge 7 ]; then
      finding "VV-018" "Token valid for $DAYS days with no refresh mechanism"
    fi
  fi

  # ── JWT forging via known secret (CRITICAL) ───────────────
  subsection "JWT forging using hardcoded secret"
  FORGED=$(node -e "
    const jwt=require('jsonwebtoken');
    console.log(jwt.sign({_id:'$ADMIN_ID'},'$JWT_SECRET',{expiresIn:'7d'}));
  " 2>/dev/null)
  if [ -n "$FORGED" ]; then
    info "Forged token: ${FORGED:0:40}..."
    http_get "/auth/user-auth" "$FORGED"
    info "HTTP $HTTP_CODE  •  $HTTP_BODY"
    if [ "$HTTP_CODE" = "200" ]; then
      finding "VV-003" "Forged token accepted — attacker can impersonate any user"
    else
      pass    "VV-003" "Forged token rejected (server may use a different secret)"
    fi
  else
    skip "VV-003" "Could not forge token (jsonwebtoken not available)"
  fi
fi

# ── Tampered token rejection (negative control) ──────────────
subsection "Tampered / empty token handling"
http_get "/auth/user-auth" "this.is.a.tampered.token"
info "Tampered token → HTTP $HTTP_CODE (expected 401)"

http_get "/auth/user-auth" ""
info "No Authorization header → HTTP $HTTP_CODE (expected 401)"

# ── Brute force — rate limiting check ────────────────────────
subsection "Brute force — 50 login attempts on /auth/login"
BLOCKED=0
START=$(date +%s)
for i in $(seq 1 50); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"bf@test.com\",\"password\":\"attempt$i\"}")
  if [ "$STATUS" = "429" ]; then BLOCKED=1; break; fi
done
DURATION=$(( $(date +%s) - START ))
info "50 attempts completed in ${DURATION}s"

if [ "$BLOCKED" -eq 0 ]; then
  finding "VV-004" "No rate limiting — 50 attempts processed without a single 429"
else
  pass    "VV-004" "Rate limiting kicked in"
fi
