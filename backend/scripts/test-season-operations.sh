#!/bin/bash
# Season operations integration test matrix
set -euo pipefail
API="${API:-http://localhost:3000/api/v1}"
ORG="${ORG:-e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e}"

login() {
  TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d '{"email":"admin@entrx.local","password":"Admin123!"}' \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")
  export TOKEN
}

api() {
  local method=$1 path=$2
  shift 2
  curl -s -m "${TIMEOUT:-60}" -X "$method" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    "$API$path" "$@"
}

check() {
  local name=$1 expected=$2 method=$3 path=$4
  shift 4
  local code
  code=$(curl -s -o /tmp/resp.json -w '%{http_code}' -m "${TIMEOUT:-60}" -X "$method" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    "$@" \
    "$API$path")
  local ok=0
  if [ "$code" = "$expected" ]; then ok=1; fi
  echo "[$([ $ok -eq 1 ] && echo OK || echo FAIL)] $name → HTTP $code (expected $expected)"
  python3 -c "import json; d=json.load(open('/tmp/resp.json')); print('  ', d.get('message', d.get('success', str(d)[:200])))" 2>/dev/null || head -1 /tmp/resp.json
  [ $ok -eq 1 ]
}

pf() {
  local season=$1 action=$2 src=${3:-}
  local url="/subscription-sales/organizers/$ORG/seasons/$season/preflight?action=$action"
  [ -n "$src" ] && url="$url&sourceSeason=$src"
  api GET "$url" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'  preflight {sys.argv[1]}/{sys.argv[2]}: allowed={d[\"allowed\"]} blockers={d.get(\"blockers\",[])}')" "$season" "$action"
}

summary() {
  local season=$1
  api GET "/subscription-sales/organizers/$ORG/seasons/$season/summary" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'  summary {d[\"seasonId\"]}: status={d[\"status\"]} plans={d[\"planCount\"]} qr={d[\"qrCount\"]} avail={d.get(\"qrAvailableCount\",0)} sold={d.get(\"soldQrCount\",0)} subs={d[\"subscriptionCount\"]} revenue={d.get(\"totalRevenue\",0)}')
"
}

echo "========== SEASON OPS TEST MATRIX =========="
login
echo "Auth OK"

check "health" 200 GET /health
check "seasons list" 200 GET "/subscription-sales/organizers/$ORG/seasons"

echo ""
echo "--- Summaries ---"
for S in 2025-2026 2026-2027 2027-2028; do summary "$S" || true; done

echo ""
echo "--- Preflights (2027-2028 draft) ---"
pf 2027-2028 clone
pf 2027-2028 generate_qr 2026-2027
pf 2027-2028 rollback 2026-2027
pf 2027-2028 cancel_draft
pf 2027-2028 activate 2026-2027

echo ""
echo "--- Preflights (2026-2027 active) ---"
pf 2026-2027 generate_qr 2025-2026
pf 2026-2027 rollback 2025-2026
pf 2026-2027 cancel_draft

echo ""
echo "--- Generate QR dry-run 2027-2028 ---"
check "generate dry-run" 200 POST "/subscription-sales/organizers/$ORG/seasons/2027-2028/generate-qrs" \
  -d '{"sourceSeason":"2026-2027","dryRun":true}'
python3 -c "import json; d=json.load(open('/tmp/resp.json')); p=d.get('data',{}).get('preview',{}); print(f'  preview total={p.get(\"total\")} renewals={p.get(\"renewals\")} new={p.get(\"newStock\")}')"

echo ""
echo "--- QR stats ---"
check "qr stats 2026-2027" 200 GET "/qr-codes/stats?season=2026-2027"

echo ""
echo "--- Revenue sanity (2025-2026 should be ~1941810) ---"
api GET "/subscription-sales/organizers/$ORG/seasons/2025-2026/summary" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
assert d['subscriptionCount']==9601, f'subs mismatch {d[\"subscriptionCount\"]}'
assert d['soldQrCount']==9601, f'sold mismatch {d[\"soldQrCount\"]}'
assert abs(d['totalRevenue']-1941810)<1, f'revenue mismatch {d[\"totalRevenue\"]}'
print('  revenue KPI OK:', d['totalRevenue'])
"

echo ""
echo "========== LIFECYCLE: generate → rollback → cancel draft on 2027-2028 =========="

echo "--- Generate QR (real, archives 2026-2027) ---"
TIMEOUT=600 check "generate QR" 200 POST "/subscription-sales/organizers/$ORG/seasons/2027-2028/generate-qrs" \
  -d '{"sourceSeason":"2026-2027","archiveSource":true,"dryRun":false}'
summary 2027-2028
summary 2026-2027

echo "--- Rollback 2027-2028 ---"
pf 2027-2028 rollback 2026-2027
TIMEOUT=600 check "rollback" 200 POST "/subscription-sales/organizers/$ORG/seasons/2027-2028/rollback-migration" \
  -d '{"sourceSeason":"2026-2027"}'
summary 2027-2028
summary 2026-2027

echo "--- Cancel draft 2027-2028 ---"
pf 2027-2028 cancel_draft
check "cancel draft" 200 DELETE "/subscription-sales/organizers/$ORG/seasons/2027-2028/draft"

echo "--- Seasons after cancel ---"
api GET "/subscription-sales/organizers/$ORG/seasons" | python3 -c "import sys,json; print('  seasons:', [x['id'] for x in json.load(sys.stdin)['data']])"

echo ""
echo "--- Clone 2027-2028 again for re-use ---"
check "clone" 201 POST "/subscription-sales/seasons/clone" \
  -d "{\"sourceSeason\":\"2026-2027\",\"targetSeason\":\"2027-2028\",\"organizerId\":\"$ORG\"}"

echo ""
echo "--- Negative: rollback 2026-2027 with subs on 2025-2026 (should block or succeed?) ---"
pf 2026-2027 rollback 2025-2026

echo ""
echo "--- Negative: generate when QR exist ---"
TIMEOUT=30 check "generate duplicate (expect 409)" 409 POST "/subscription-sales/organizers/$ORG/seasons/2027-2028/generate-qrs" \
  -d '{"sourceSeason":"2026-2027","dryRun":false}' || true

echo ""
echo "========== DONE =========="
