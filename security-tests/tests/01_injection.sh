#!/bin/bash
# ─────────────────────────────────────────────────────────────
# OWASP A03 — Injection
# ─────────────────────────────────────────────────────────────
# Tests NoSQL injection on auth endpoints, Stored XSS on
# registration, and ReDoS via unsanitized RegExp in category
# creation.
# ─────────────────────────────────────────────────────────────
set -u
source "$(dirname "$0")/../lib/common.sh"

section "A03 — Injection"

# ── NoSQL Injection: login $gt operator ──────────────────────
subsection "NoSQL \$gt on login"
http_post "/auth/login" '{"email":{"$gt":""},"password":{"$gt":""}}'
info "HTTP $HTTP_CODE  •  $HTTP_BODY"
if echo "$HTTP_BODY" | grep -q '"token"'; then
  finding "VV-L1" "Login bypass via \$gt — JWT returned"
else
  pass    "VV-L1" "Login rejected NoSQL \$gt injection"
fi

# ── NoSQL Injection: login $ne operator ──────────────────────
subsection "NoSQL \$ne on login"
http_post "/auth/login" '{"email":{"$ne":""},"password":{"$ne":""}}'
info "HTTP $HTTP_CODE  •  $HTTP_BODY"
if echo "$HTTP_BODY" | grep -q '"token"'; then
  finding "VV-L2" "Login bypass via \$ne — JWT returned"
else
  pass    "VV-L2" "Login rejected NoSQL \$ne injection"
fi

# ── NoSQL Injection: login $regex operator ───────────────────
subsection "NoSQL \$regex on login"
http_post "/auth/login" '{"email":{"$regex":".*"},"password":{"$gt":""}}'
info "HTTP $HTTP_CODE  •  $HTTP_BODY"
if echo "$HTTP_BODY" | grep -q '"token"'; then
  finding "VV-L3" "Login bypass via \$regex — JWT returned"
else
  pass    "VV-L3" "Login rejected NoSQL \$regex injection"
fi

# ── NoSQL Injection: forgot-password bypass (CRITICAL) ───────
subsection "NoSQL \$gt on forgot-password (CRITICAL)"
http_post "/auth/forgot-password" \
  '{"email":{"$gt":""},"answer":{"$gt":""},"newPassword":"hacked123"}'
info "HTTP $HTTP_CODE  •  $HTTP_BODY"
if echo "$HTTP_BODY" | grep -q '"Password Reset Successfully"'; then
  finding "VV-001" "Password reset via NoSQL injection — ANY user can be compromised"
else
  pass    "VV-001" "forgot-password rejected NoSQL injection"
fi

# ── Stored XSS: script tag in registration name ──────────────
subsection "Stored XSS in registration name"
XSS_EMAIL="xss_$(date +%s)@test.com"
http_post "/auth/register" "$(cat <<JSON
{"name":"<script>alert('XSS')</script>","email":"$XSS_EMAIL",
 "password":"pass123","phone":"12345678","address":"test",
 "DOB":"2000-01-01","answer":"test"}
JSON
)"
info "HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ]; then
  finding "VV-010" "<script> accepted in name — stored XSS on render"
else
  pass    "VV-010" "Registration rejected XSS payload in name"
fi

# ── ReDoS: regex metacharacters in category create ───────────
subsection "ReDoS in category create (regex metachars)"
if get_admin_token; then
  http_post "/category/create-category" '{"name":"(a+)+$"}' "$ADMIN_TOKEN"
  info "HTTP $HTTP_CODE  •  $HTTP_BODY"
  finding "VV-019" "Regex metacharacters accepted — potential ReDoS vector"
else
  skip "VV-019" "Could not acquire admin token — skipping ReDoS test"
fi
