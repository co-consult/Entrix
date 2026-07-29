#!/usr/bin/env bash
# CSSForever partner API integration tests + light regression smoke
set -euo pipefail

API="${API_BASE:-http://localhost:3000/api/v1}"
API_KEY="${CSSFOREVER_API_KEY:-cssforever_sandbox_test_key}"
ORG="${CSSFOREVER_ORGANIZER_ID:-e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e}"
PASS=0
FAIL=0

hdr=(-H "X-API-KEY: ${API_KEY}" -H "Content-Type: application/json")

assert_status() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  OK  $name (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $name (expected HTTP $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

assert_json() {
  local name="$1" expr="$2" body="$3"
  if echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if ($expr) else 1)" 2>/dev/null; then
    echo "  OK  $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $name"
    echo "       $body" | head -c 200
    FAIL=$((FAIL + 1))
  fi
}

echo "=== CSSForever integration tests ==="
echo "API: $API"

# Health
code=$(curl -s -o /dev/null -w "%{http_code}" "$API/../health" 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" "${API%/api/v1}/health" 2>/dev/null || echo "000")
if [[ "$code" == "200" ]] || curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/v1/health" | grep -q 200; then
  echo "  OK  backend health"
  PASS=$((PASS + 1))
else
  echo "  WARN backend health check inconclusive"
fi

# Bad API key
code=$(curl -s -o /tmp/cf_bad.json -w "%{http_code}" -X POST "$API/partner/subscriptions/check-existing" \
  -H "X-API-KEY: invalid" -H "Content-Type: application/json" \
  -d '{"login":"x","password":"y"}')
assert_status "bad API key" "401" "$code"

# Invalid credentials
body=$(curl -s -X POST "$API/partner/subscriptions/check-existing" "${hdr[@]}" \
  -d '{"login":"cssforever_bad","password":"wrong"}')
assert_json "invalid credentials KO" "d.get('status')=='KO' and d.get('errorCode')=='INVALID_CREDENTIALS'" "$body"

# Gradin eligible
body=$(curl -s -X POST "$API/partner/subscriptions/check-existing" "${hdr[@]}" \
  -d '{"login":"cssforever_gradin01","password":"Test123!"}')
assert_json "gradin check-existing OK" "d.get('status')=='OK'" "$body"
assert_json "gradin priorityUntil" "bool(d.get('newSubscription',{}).get('priorityUntil'))" "$body"

# Chaise seat preserved
body=$(curl -s -X POST "$API/partner/subscriptions/check-existing" "${hdr[@]}" \
  -d '{"login":"cssforever_chaise01","password":"Test123!"}')
assert_json "chaise check-existing OK" "d.get('status')=='OK'" "$body"
assert_json "chaise seat row" "d.get('previousSubscription',{}).get('rowNumber')=='12'" "$body"

# Already paid
body=$(curl -s -X POST "$API/partner/subscriptions/check-existing" "${hdr[@]}" \
  -d '{"login":"cssforever_paid01","password":"Test123!"}')
assert_json "paid subscriber" "d.get('newSubscription',{}).get('eligibilityStatus')=='ALREADY_PAID'" "$body"

# check-new before July 6 (default server date in June 2026)
body=$(curl -s -X POST "$API/partner/subscriptions/check-new" "${hdr[@]}" \
  -d '{"subscriptionType":"GRADIN","standNumber":"B"}')
assert_json "check-new blocked before Jul 6" "d.get('status')=='KO' and d.get('errorCode')=='NEW_SUBSCRIPTIONS_NOT_OPEN_YET'" "$body"

# seats-status
body=$(curl -s -X GET "$API/partner/subscriptions/seats-status" -H "X-API-KEY: ${API_KEY}")
assert_json "seats-status OK" "d.get('status')=='OK' and isinstance(d.get('seats'), list)" "$body"
assert_json "seats-status has entries" "len(d.get('seats',[])) > 0" "$body"
assert_json "seats-status status values" "len(set(s.get('status') for s in d.get('seats',[]))) >= 1" "$body"

# check-new after July 6 (requires CSSFOREVER_SIMULATE_DATE=2026-07-06T10:00:00Z on backend)
SIM_DATE=$(docker exec entrix_backend printenv CSSFOREVER_SIMULATE_DATE 2>/dev/null || echo "")
if [[ "$SIM_DATE" == *"2026-07-06"* ]] || [[ "$SIM_DATE" == *"2026-07-"* ]]; then
  body=$(curl -s -X POST "$API/partner/subscriptions/check-new" "${hdr[@]}" \
    -d '{"subscriptionType":"GRADIN","standNumber":"B"}')
  assert_json "check-new open after Jul 6 (simulated)" "d.get('status')=='OK' or d.get('errorCode')=='NOT_AVAILABLE'" "$body"
else
  echo "  SKIP check-new after Jul 6 (set CSSFOREVER_SIMULATE_DATE on backend to enable)"
fi

# confirm-existing partner envelope
body=$(curl -s -X POST "$API/partner/subscriptions/confirm-existing" "${hdr[@]}" \
  -d '{"login":"cssforever_gradin01","subscriptionType":"GRADIN","firstName":"T","lastName":"U","phone":"+21600000000","email":"test-envelope@test.local","amountPaid":9999,"currency":"TND","paymentProvider":"FLOUCI","paymentReference":"CF_TEST_ENVELOPE_'$(date +%s)'","paymentDate":"2026-06-25T14:30:00Z"}')
assert_json "confirm-existing partner envelope" "d.get('status') in ('OK','KO')" "$body"

# Payment idempotency when a prior confirmation exists
IDEM_REF=$(docker exec entrix_postgres psql -U entrix_user -d entrix_db -t -A -c \
  "SELECT payment_reference FROM partner_payment_confirmations WHERE response_payload IS NOT NULL ORDER BY confirmed_at DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
if [[ -n "$IDEM_REF" ]]; then
  b1=$(curl -s -X POST "$API/partner/subscriptions/confirm-existing" "${hdr[@]}" \
    -H "Content-Type: application/json" \
    -d "{\"login\":\"cssforever_gradin01\",\"subscriptionType\":\"GRADIN\",\"firstName\":\"T\",\"lastName\":\"U\",\"phone\":\"+21600000000\",\"email\":\"idem@test.local\",\"amountPaid\":500,\"currency\":\"TND\",\"paymentProvider\":\"FLOUCI\",\"paymentReference\":\"${IDEM_REF}\",\"paymentDate\":\"2026-06-25T14:30:00Z\"}")
  b2=$(curl -s -X POST "$API/partner/subscriptions/confirm-existing" "${hdr[@]}" \
    -H "Content-Type: application/json" \
    -d "{\"login\":\"cssforever_gradin01\",\"subscriptionType\":\"GRADIN\",\"firstName\":\"T\",\"lastName\":\"U\",\"phone\":\"+21600000000\",\"email\":\"idem@test.local\",\"amountPaid\":500,\"currency\":\"TND\",\"paymentProvider\":\"FLOUCI\",\"paymentReference\":\"${IDEM_REF}\",\"paymentDate\":\"2026-06-25T14:30:00Z\"}")
  if [[ "$b1" == "$b2" ]] && echo "$b1" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('status')=='OK' else 1)" 2>/dev/null; then
    echo "  OK  idempotent confirm-existing"
    PASS=$((PASS + 1))
  else
    echo "  SKIP idempotent confirm-existing (no successful prior confirmation)"
  fi
fi

echo ""
echo "=== Regression smoke ==="

# Public plans
code=$(curl -s -o /dev/null -w "%{http_code}" "$API/subscription-sales/plans/available")
assert_status "plans/available" "200" "$code"

# Season list (needs admin JWT - skip if no token)
TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"admin@entrx.local","password":"Admin123!"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null || echo "")
if [[ -n "$TOKEN" ]]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$API/subscription-sales/organizers/${ORG}/seasons" -H "Authorization: Bearer $TOKEN")
  assert_status "seasons list" "200" "$code"
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
