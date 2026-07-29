-- Extend physical QR serial numbers for season prefix (26xxxx = 6 chars)
-- Run once per environment before generating 2026/2027 QR codes.

ALTER TABLE physical_qr_codes
  DROP CONSTRAINT IF EXISTS chk_serial_number_format;

ALTER TABLE physical_qr_codes
  ALTER COLUMN serial_number TYPE VARCHAR(6);

ALTER TABLE physical_qr_codes
  ADD CONSTRAINT chk_serial_number_format
  CHECK (
    LENGTH(serial_number) BETWEEN 4 AND 6
    AND serial_number ~ '^[A-Z0-9]{4,6}$'
  );

COMMENT ON COLUMN physical_qr_codes.serial_number IS
  'Numéro de série carte physique. Saison 2025/2026: 4 chiffres (ex: 0859). Saison 2026/2027+: préfixe 26 (ex: 260859).';
