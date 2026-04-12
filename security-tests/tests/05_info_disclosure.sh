#!/bin/bash
# Antony Swami Alfred Ben, A0253016R
# ─────────────────────────────────────────────────────────────
# OWASP A05 — Information Disclosure + A03 Input Validation
# ─────────────────────────────────────────────────────────────
# Tests error object leakage (CastError details, stack traces),
# missing input validation on registration (email, password
# length, name length).
# ─────────────────────────────────────────────────────────────
set -u
source "$(dirname "$0")/../lib/common.sh"

section "A05/A03 — Information Disclosure & Input Validation"

# ── Error leakage: login with wrong type ─────────────────────
subsection "Error leakage — numeric email on login"
http_post "/auth/login" '{"email":12345}'
info "HTTP $HTTP_CODE  •  $HTTP_BODY"
if echo "$HTTP_BODY" | grep -qi "stack\|path\|node_modules\|mongoose"; then
  finding "VV-014" "Error response leaks stack trace or internal path"
else
  info "Response analysed — check manually for sensitive error structure"
fi

# ── Error leakage: invalid Mongo ObjectId ────────────────────
subsection "Error leakage — invalid product photo id (CastError)"
http_get "/product/product-photo/not-a-valid-id"
info "Response (first 300 chars): $(echo "$HTTP_BODY" | head -c 300)"
if echo "$HTTP_BODY" | grep -qi "CastError\|BSONError\|ObjectId"; then
  finding "VV-014" "CastError details exposed in response"
fi

# ── Error leakage: wrong type on product-filters ─────────────
subsection "Error leakage — wrong type on product-filters"
http_post "/product/product-filters" '{"checked":"not-an-array","radio":"not-an-array"}'
info "Response (first 300 chars): $(echo "$HTTP_BODY" | head -c 300)"
if echo "$HTTP_BODY" | grep -qi "stack\|node_modules\|at Object\|at Module"; then
  finding "VV-014" "Stack trace leaked on product-filters"
fi

# ── Missing validation: invalid email format ─────────────────
subsection "Missing validation — invalid email format"
http_post "/auth/register" '{"name":"Test","email":"not-an-email","password":"pass123","phone":"12345678","address":"test","DOB":"2000-01-01","answer":"test"}'
info "HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ]; then
  finding "VV-015" "Invalid email 'not-an-email' accepted at registration"
fi

# ── Missing validation: weak (1-char) password ───────────────
subsection "Missing validation — 1-character password"
EMAIL="weak_$(date +%s)@test.com"
http_post "/auth/register" "{\"name\":\"WeakPass\",\"email\":\"$EMAIL\",\"password\":\"1\",\"phone\":\"12345678\",\"address\":\"test\",\"DOB\":\"2000-01-01\",\"answer\":\"test\"}"
info "HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ]; then
  finding "VV-016" "Single-character password accepted (register has no minimum; profile update requires 6)"
fi

# ── Missing validation: excessive input length ───────────────
subsection "Missing validation — 10,000-character name"
LONG=$(python3 -c "print('A'*10000)")
EMAIL="long_$(date +%s)@test.com"
http_post "/auth/register" "{\"name\":\"$LONG\",\"email\":\"$EMAIL\",\"password\":\"pass123\",\"phone\":\"12345678\",\"address\":\"test\",\"DOB\":\"2000-01-01\",\"answer\":\"test\"}"
info "HTTP $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ]; then
  finding "VV-017" "10,000-char name accepted — no input length limit"
fi
