-- Sandbox seed for CSSForever partner API integration tests
-- Password for all test accounts: Test123!
-- Hash generated with bcrypt rounds=10

DELETE FROM partner_legacy_subscribers WHERE login LIKE 'cssforever_%';

INSERT INTO partner_legacy_subscribers (
  login, password_hash, first_name, last_name, phone, email,
  subscription_type, previous_season, stand_number, row_number, seat_number,
  metadata
) VALUES
-- Gradin anciens abonnés (éligibles)
('cssforever_gradin01', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Ali', 'Gradin', '+21620000001', 'gradin01@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin02', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Sami', 'Gradin', '+21620000002', 'gradin02@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin03', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Karim', 'Gradin', '+21620000003', 'gradin03@test.cssforever.local', 'GRADIN', '2025-2026', 'D', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin04', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Nabil', 'Gradin', '+21620000004', 'gradin04@test.cssforever.local', 'GRADIN', '2025-2026', 'D', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin05', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Hedi', 'Gradin', '+21620000005', 'gradin05@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true}'),
('cssforever_gradin06', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Rami', 'Gradin', '+21620000006', 'gradin06@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true}'),

-- Chaise anciens abonnés (place conservée)
('cssforever_chaise01', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Amine', 'Chaise', '+21620000101', 'chaise01@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '12', '34', '{"sandbox":true}'),
('cssforever_chaise02', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Youssef', 'Chaise', '+21620000102', 'chaise02@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '12', '35', '{"sandbox":true}'),
('cssforever_chaise03', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Mehdi', 'Chaise', '+21620000103', 'chaise03@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '13', '10', '{"sandbox":true}'),
('cssforever_chaise04', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Omar', 'Chaise', '+21620000104', 'chaise04@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '13', '11', '{"sandbox":true}'),
('cssforever_chaise05', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Fares', 'Chaise', '+21620000105', 'chaise05@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '14', '20', '{"sandbox":true}'),
('cssforever_chaise06', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Walid', 'Chaise', '+21620000106', 'chaise06@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '14', '21', '{"sandbox":true}'),

-- Déjà payé (renouvellement confirmé)
('cssforever_paid01', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Paid', 'Gradin', '+21620000201', 'paid01@test.cssforever.local', 'GRADIN', '2025-2026', 'B', NULL, NULL, '{"sandbox":true,"paid":true}'),
('cssforever_paid02', '$2b$10$NotBFCCJMHlJ5pYUBOHA4O4N57DfDUq7oz9msjHOp1mr83unT/O72', 'Paid', 'Chaise', '+21620000202', 'paid02@test.cssforever.local', 'CHAISE', '2025-2026', 'A', '12', '36', '{"sandbox":true,"paid":true}');

UPDATE partner_legacy_subscribers
SET confirmed_at = NOW(), updated_at = NOW()
WHERE login IN ('cssforever_paid01', 'cssforever_paid02');
