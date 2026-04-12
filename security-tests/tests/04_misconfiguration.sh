#!/bin/bash
# Antony Swami Alfred Ben, A0253016R
# ─────────────────────────────────────────────────────────────
# OWASP A05 — Security Misconfiguration
# ─────────────────────────────────────────────────────────────
# Audits HTTP security headers (Helmet-family) and CORS origin
# policy. Each missing header is a distinct finding.
# ─────────────────────────────────────────────────────────────
set -u
source "$(dirname "$0")/../lib/common.sh"

section "A05 — Security Misconfiguration"

subsection "HTTP security headers audit (GET $ROOT_URL/)"
HEADERS=$(http_head "$ROOT_URL/")
info "Raw headers:"
echo "$HEADERS" | sed 's/^/  /'
echo

# header_check <finding_id> <header_name> <risk_description>
header_check() {
  local vid="$1" header="$2" risk="$3"
  if echo "$HEADERS" | grep -qi "^$header:"; then
    pass    "$vid" "$header present"
  else
    finding "$vid" "Missing $header — $risk"
  fi
}

header_check "VV-007" "X-Content-Type-Options"    "MIME-sniffing → XSS"
header_check "VV-008" "X-Frame-Options"           "Clickjacking via iframe"
header_check "VV-009" "Content-Security-Policy"   "No restriction on content sources"
header_check "VV-013" "Strict-Transport-Security" "No HTTPS enforcement (HSTS)"
header_check "VV-020" "Referrer-Policy"           "Referrer leakage to third parties"

# X-Powered-By should be ABSENT (it's a leak if present)
subsection "Technology fingerprinting (X-Powered-By)"
if echo "$HEADERS" | grep -qi "^x-powered-by:"; then
  LEAK=$(echo "$HEADERS" | grep -i "^x-powered-by:")
  finding "VV-011" "${LEAK// /} — reveals server tech"
else
  pass    "VV-011" "X-Powered-By not exposed"
fi

# ── CORS — permissive origin policy ──────────────────────────
subsection "CORS — preflight from evil origin"
CORS=$(curl -s -I -X OPTIONS "$BASE_URL/auth/login" \
  -H "Origin: https://evil-hacker-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")
echo "$CORS" | sed 's/^/  /'
echo

if echo "$CORS" | grep -qi "access-control-allow-origin: \*"; then
  finding "VV-006" "CORS allows ALL origins (Access-Control-Allow-Origin: *)"
elif echo "$CORS" | grep -qi "access-control-allow-origin: https://evil"; then
  finding "VV-006" "CORS reflects arbitrary origin"
else
  pass    "VV-006" "CORS rejects arbitrary origin"
fi

subsection "CORS — cross-origin GET from multiple malicious origins"
for ORIGIN in "https://phishing-site.com" "http://localhost:9999" "https://attacker.io"; do
  ALLOW=$(curl -s -D - -o /dev/null "$BASE_URL/product/get-product" \
    -H "Origin: $ORIGIN" | grep -i "access-control-allow-origin" | tr -d '\r')
  info "Origin: $ORIGIN → ${ALLOW:-<no ACAO header>}"
done
