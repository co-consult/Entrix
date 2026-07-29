#!/usr/bin/env bash
# Seed CSSForever sandbox legacy subscribers (bcrypt passwords via Node in container)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HASH=$(docker exec entrix_backend node -e "const bcrypt=require('bcrypt'); console.log(bcrypt.hashSync('Test123!', 10));" 2>/dev/null || python3 -c "import bcrypt; print(bcrypt.hashpw(b'Test123!', bcrypt.gensalt(10)).decode())")

SQL=$(cat <<EOF
DELETE FROM partner_legacy_subscribers WHERE login LIKE 'cssforever_%';

INSERT INTO partner_legacy_subscribers (
  login, password_hash, first_name, last_name, phone, email,
  subscription_type, previous_season, stand_number, row_number, seat_number, metadata
) VALUES
('cssforever_gradin01', '${HASH}', 'Ali', 'Gradin', '+21620000001', 'gradin01@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin02', '${HASH}', 'Sami', 'Gradin', '+21620000002', 'gradin02@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin03', '${HASH}', 'Karim', 'Gradin', '+21620000003', 'gradin03@test.cssforever.local', 'GRADIN', '2025-2026', 'D', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin04', '${HASH}', 'Nabil', 'Gradin', '+21620000004', 'gradin04@test.cssforever.local', 'GRADIN', '2025-2026', 'D', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin05', '${HASH}', 'Hedi', 'Gradin', '+21620000005', 'gradin05@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin06', '${HASH}', 'Rami', 'Gradin', '+21620000006', 'gradin06@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true}'),
('cssforever_chaise01', '${HASH}', 'Amine', 'Chaise', '+21620000101', 'chaise01@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '12', '34', '{"sandbox":true}'),
('cssforever_chaise02', '${HASH}', 'Youssef', 'Chaise', '+21620000102', 'chaise02@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '12', '35', '{"sandbox":true}'),
('cssforever_chaise03', '${HASH}', 'Mehdi', 'Chaise', '+21620000103', 'chaise03@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '13', '10', '{"sandbox":true}'),
('cssforever_chaise04', '${HASH}', 'Omar', 'Chaise', '+21620000104', 'chaise04@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '13', '11', '{"sandbox":true}'),
('cssforever_chaise05', '${HASH}', 'Fares', 'Chaise', '+21620000105', 'chaise05@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '14', '20', '{"sandbox":true}'),
('cssforever_chaise06', '${HASH}', 'Walid', 'Chaise', '+21620000106', 'chaise06@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '14', '21', '{"sandbox":true}'),
('cssforever_paid01', '${HASH}', 'Paid', 'Gradin', '+21620000201', 'paid01@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true,"paid":true}'),
('cssforever_paid02', '${HASH}', 'Paid', 'Chaise', '+21620000202', 'paid02@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '12', '36', '{"sandbox":true,"paid":true}');

UPDATE partner_legacy_subscribers SET confirmed_at = NOW(), updated_at = NOW()
WHERE login IN ('cssforever_paid01', 'cssforever_paid02');
EOF
)

echo "$SQL" | docker exec -i entrix_postgres psql -U entrix_user -d entrix_db -v ON_ERROR_STOP=1
echo "CSSForever sandbox seed complete (password: Test123!)"
