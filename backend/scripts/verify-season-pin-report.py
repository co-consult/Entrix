#!/usr/bin/env python3
"""Full season PIN verification report for 2025-2026 → 2026-2027 migration."""
import csv
import json
import subprocess
from pathlib import Path

EXPORT = Path("/opt/entrix/exports/saison-2026-2027/csv/_TOUS_PLANS_2026-2027.csv")


def psql(query: str) -> str:
    return subprocess.check_output(
        [
            "docker", "exec", "entrix_postgres", "psql",
            "-U", "entrix_user", "-d", "entrix_db",
            "-t", "-A", "-F", "\t", "-c", query,
        ],
        text=True,
    )


def load_db(season: str):
    q = f"""
    SELECT sp.code, t.serial_number, t.onboarding_key, t.qr_code,
      COALESCE(s.metadata->>'original_onboarding_key', s.onboarding_key) AS orig_pin,
      t.metadata->>'renewal_pin_preserved' = 'true' AS renewal,
      t.created_at = t.updated_at AS never_updated
    FROM physical_qr_codes t
    LEFT JOIN physical_qr_codes s ON s.id = (t.metadata->>'previous_qr_id')::uuid
    JOIN subscription_plans sp ON sp.id = t.subscription_plan_id
    WHERE sp.metadata->>'season' = '{season}'
    """
    rows = {}
    for line in psql(q).strip().split("\n"):
        if not line.strip():
            continue
        code, serial, pin, qr, orig, renewal, never = line.split("\t")
        rows[(code, serial)] = {
            "pin": pin,
            "qr": qr,
            "orig_pin": orig or "",
            "renewal": renewal == "t",
            "never_updated": never == "t",
        }
    return rows


def main():
    csv_rows = list(csv.DictReader(open(EXPORT, encoding="utf-8-sig")))
    db2627 = load_db("2026-2027")

    report = {
        "export_file": str(EXPORT),
        "export_rows": len(csv_rows),
        "db_2627_rows": len(db2627),
        "A_export_renewals_vs_2025_original": {"total": 0, "match": 0, "mismatch": 0},
        "B_db_2627_renewals_vs_2025_original": {"total": 0, "match": 0, "mismatch": 0},
        "C_export_vs_db_2627_pins": {"in_both": 0, "pin_match": 0, "pin_mismatch": 0},
        "D_export_vs_db_2627_qr": {"in_both": 0, "qr_match": 0, "qr_mismatch": 0},
        "samples_mismatch_B": [],
        "samples_mismatch_C": [],
    }

    for r in csv_rows:
        key = (r["Plan Code"], r["Serial Number"])
        csv_pin = r["PIN (Onboarding Key)"]
        if key not in db2627:
            continue
        d = db2627[key]
        report["C_export_vs_db_2627_pins"]["in_both"] += 1
        report["D_export_vs_db_2627_qr"]["in_both"] += 1
        if csv_pin == d["pin"]:
            report["C_export_vs_db_2627_pins"]["pin_match"] += 1
        else:
            report["C_export_vs_db_2627_pins"]["pin_mismatch"] += 1
            if len(report["samples_mismatch_C"]) < 5:
                report["samples_mismatch_C"].append({
                    "plan": key[0], "serial": key[1],
                    "export_pin": csv_pin, "db_pin": d["pin"], "orig_pin": d["orig_pin"],
                })
        if r["QR Code"] == d["qr"]:
            report["D_export_vs_db_2627_qr"]["qr_match"] += 1
        else:
            report["D_export_vs_db_2627_qr"]["qr_mismatch"] += 1

        if d["renewal"]:
            report["A_export_renewals_vs_2025_original"]["total"] += 1
            if csv_pin == d["orig_pin"]:
                report["A_export_renewals_vs_2025_original"]["match"] += 1
            else:
                report["A_export_renewals_vs_2025_original"]["mismatch"] += 1

    for key, d in db2627.items():
        if not d["renewal"]:
            continue
        report["B_db_2627_renewals_vs_2025_original"]["total"] += 1
        if d["pin"] == d["orig_pin"]:
            report["B_db_2627_renewals_vs_2025_original"]["match"] += 1
        else:
            report["B_db_2627_renewals_vs_2025_original"]["mismatch"] += 1
            if len(report["samples_mismatch_B"]) < 5:
                report["samples_mismatch_B"].append({
                    "plan": key[0], "serial": key[1],
                    "db_pin": d["pin"], "orig_pin": d["orig_pin"],
                })

    report["verdict"] = {
        "export_files_correct_vs_2025_original": report["A_export_renewals_vs_2025_original"]["mismatch"] == 0,
        "live_db_correct_vs_2025_original": report["B_db_2627_renewals_vs_2025_original"]["mismatch"] == 0,
        "export_matches_live_db": report["C_export_vs_db_2627_pins"]["pin_mismatch"] == 0,
    }

    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
