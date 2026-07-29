#!/usr/bin/env bash
# Export QR codes for a subscription season — CSV + formatted Excel per plan.
# Usage: ./export-season-qr-codes.sh [SEASON] [OUTPUT_DIR]
# Example: ./export-season-qr-codes.sh 2026-2027 /opt/entrix/exports/saison-2026-2027

set -euo pipefail

SEASON="${1:-2026-2027}"
OUT_BASE="${2:-/opt/entrix/exports/saison-${SEASON}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

python3 "${SCRIPT_DIR}/export-season-qr-codes.py" "${SEASON}" "${OUT_BASE}"
