#!/usr/bin/env python3
"""Compare season migration: DB vs export CSV vs source original PINs."""
import csv
import json
import subprocess
from pathlib import Path

SEASON = "2026-2027"
EXPORT_DIR = Path("/opt/entrix/exports/saison-2026-2027/csv")
COMBINED = EXPORT_DIR / f"_TOUS_PLANS_{SEASON}.csv"


def psql(query: str) -> str:
    return subprocess.check_output(
        [
            "docker", "exec", "entrix_postgres", "psql",
            "-U", "entrix_user", "-d", "entrix_db",
            "-t", "-A", "-F", "\t", "-c", query,
        ],
        text=True,
    )


def load_csv():
    rows = {}
    with open(COMBINED, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            rows[r["Serial Number"]] = r
    return rows


def load_db_pairs():
    q = """
    SELECT
      t.serial_number,
      t.onboarding_key AS target_pin,
      t.qr_code AS target_qr,
      t.metadata->>'renewal_pin_preserved' AS renewal,
      COALESCE(s.metadata->>'original_onboarding_key', s.onboarding_key) AS source_original_pin,
      s.onboarding_key AS source_current_pin,
      s.metadata->>'original_status' AS source_status
    FROM physical_qr_codes t
    JOIN physical_qr_codes s ON s.id = (t.metadata->>'previous_qr_id')::uuid
    WHERE t.metadata->>'previous_qr_id' IS NOT NULL
    ORDER BY t.serial_number
    """
    pairs = []
    for line in psql(q).strip().split("\n"):
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 7:
            continue
        pairs.append(
            {
                "serial": parts[0],
                "target_pin": parts[1],
                "target_qr": parts[2],
                "renewal": parts[3] == "true",
                "source_original_pin": parts[4],
                "source_current_pin": parts[5],
                "source_status": parts[6],
            }
        )
    return pairs


def main():
    csv_rows = load_csv()
    pairs = load_db_pairs()

    report = {
        "db_total_pairs": len(pairs),
        "csv_total_rows": len(csv_rows),
        "renewals": {"total": 0, "pin_matches_source": 0, "pin_mismatch": 0},
        "new_stock": {"total": 0, "pin_matches_source": 0, "pin_mismatch": 0},
        "csv_vs_db": {"serial_in_both": 0, "pin_match": 0, "pin_mismatch": 0, "serial_only_db": 0, "serial_only_csv": 0},
        "mismatch_samples": [],
    }

    db_serials = set()
    for p in pairs:
        db_serials.add(p["serial"])
        bucket = report["renewals"] if p["renewal"] else report["new_stock"]
        bucket["total"] += 1
        if p["target_pin"] == p["source_original_pin"]:
            bucket["pin_matches_source"] += 1
        else:
            bucket["pin_mismatch"] += 1
            if len(report["mismatch_samples"]) < 10 and p["renewal"]:
                report["mismatch_samples"].append(
                    {
                        "serial": p["serial"],
                        "target_pin": p["target_pin"],
                        "source_original_pin": p["source_original_pin"],
                        "source_current_pin": p["source_current_pin"],
                    }
                )

    for serial, crow in csv_rows.items():
        if serial in db_serials:
            report["csv_vs_db"]["serial_in_both"] += 1
            db_pin = next(p["target_pin"] for p in pairs if p["serial"] == serial)
            if db_pin == crow["PIN (Onboarding Key)"]:
                report["csv_vs_db"]["pin_match"] += 1
            else:
                report["csv_vs_db"]["pin_mismatch"] += 1
        else:
            report["csv_vs_db"]["serial_only_csv"] += 1

    report["csv_vs_db"]["serial_only_db"] = len(db_serials - set(csv_rows.keys()))

    print(json.dumps(report, indent=2))
    return 1 if report["renewals"]["pin_mismatch"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
