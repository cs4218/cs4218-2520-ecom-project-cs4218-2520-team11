#!/bin/bash
# Antony Swami Alfred Ben, A0253016R
# ─────────────────────────────────────────────────────────────
# OWASP A01 — Broken Access Control
# ─────────────────────────────────────────────────────────────
# Tests unauthenticated mutations (product delete, Braintree
# token), and privilege escalation via role injection at
# registration.
# ─────────────────────────────────────────────────────────────
set -u
source "$(dirname "$0")/../lib/common.sh"

section "A01 — Broken Access Control"

# ── Unauthenticated product deletion (CRITICAL) ──────────────
subsection "DELETE /product/delete-product/:pid without auth"
http_get "/product/get-product"
PRODUCT_ID=$(echo "$HTTP_BODY" | json_get ".products.0._id")

if [ -n "$PRODUCT_ID" ]; then
  info "Target product id: $PRODUCT_ID"
  http_delete "/product/delete-product/$PRODUCT_ID"
  info "HTTP $HTTP_CODE  •  $HTTP_BODY"
  if echo "$HTTP_BODY" | grep -q '"Product Deleted successfully"'; then
    finding "VV-002" "Product deleted WITHOUT authentication — no requireSignIn on DELETE"
  else
    pass    "VV-002" "Delete rejected — route is protected"
  fi
else
  skip "VV-002" "No products available to test deletion"
fi

# Control case: CREATE should require auth (proves delete is the outlier)
subsection "Control: POST /product/create-product without auth (should 401)"
http_post "/product/create-product" "{}"
info "HTTP $HTTP_CODE  (expected 401)"

# ── Unauthenticated Braintree client token (CRITICAL) ────────
subsection "GET /product/braintree/token without auth"
http_get "/product/braintree/token"
info "HTTP $HTTP_CODE  •  $(echo "$HTTP_BODY" | head -c 160)"
if [ "$HTTP_CODE" = "200" ] && echo "$HTTP_BODY" | grep -q "clientToken"; then
  finding "VV-005" "Braintree client token issued without authentication"
elif [ "$HTTP_CODE" = "500" ]; then
  finding "VV-005" "Braintree endpoint reachable without auth (returned 500 on sandbox creds)"
else
  pass    "VV-005" "Braintree token endpoint protected"
fi

# ── Privilege escalation via role injection ──────────────────
subsection "Privilege escalation — register with role:1 injected"
EMAIL="hacker_$(date +%s)@test.com"
http_post "/auth/register" "$(cat <<JSON
{"name":"HackerAdmin","email":"$EMAIL","password":"hacked123",
 "phone":"12345678","address":"Hackland","DOB":"2000-01-01",
 "answer":"test","role":1}
JSON
)"
info "Registration HTTP $HTTP_CODE"

http_post "/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"hacked123\"}"
ROLE=$(echo "$HTTP_BODY" | json_get ".user.role")
info "Post-login role: ${ROLE:-unknown}"
if [ "$ROLE" = "1" ]; then
  finding "VV-PE" "Privilege escalation — role:1 persisted, user is admin"
else
  pass    "VV-PE" "role field ignored — user created with role=$ROLE"
fi
