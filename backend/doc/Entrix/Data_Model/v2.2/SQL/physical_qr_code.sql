-- ============================================================================
-- Table physical_qr_codes - Cartes Physiques d'Abonnement Entrix V3.0
-- ============================================================================

-- Création de l'enum pour le statut des QR codes physiques
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'physical_qr_status') THEN
        CREATE TYPE physical_qr_status AS ENUM (
            'AVAILABLE',    -- Disponible pour assignation
            'ASSIGNED',     -- Assigné à un abonnement
            'DISABLED'      -- Désactivé (défectueux, perdu, etc.)
        );
    END IF;
END $$;

-- Création de la table des QR codes physiques
CREATE TABLE IF NOT EXISTS physical_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    onboarding_key VARCHAR(50) UNIQUE NOT NULL,
    serial_number VARCHAR(4) NOT NULL,
    subscription_plan_id UUID,
    card_batch VARCHAR(50),
    card_type VARCHAR(50) DEFAULT 'STANDARD',
    status physical_qr_status DEFAULT 'AVAILABLE' NOT NULL,
    assigned_by UUID,
    printed_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ,
    first_used_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_physical_qr_codes_subscription_plan 
        FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL,
    CONSTRAINT fk_physical_qr_codes_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_physical_qr_codes_qr_code ON physical_qr_codes(qr_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_physical_qr_codes_onboarding_key ON physical_qr_codes(onboarding_key);
CREATE INDEX IF NOT EXISTS idx_physical_qr_codes_status ON physical_qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_physical_qr_codes_batch ON physical_qr_codes(card_batch);
CREATE INDEX IF NOT EXISTS idx_physical_qr_codes_serial_number ON physical_qr_codes(serial_number);
CREATE INDEX IF NOT EXISTS idx_physical_qr_codes_subscription_plan ON physical_qr_codes(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_physical_qr_codes_assigned_by ON physical_qr_codes(assigned_by);
CREATE INDEX IF NOT EXISTS idx_physical_qr_codes_available_by_plan 
    ON physical_qr_codes(subscription_plan_id, status, card_type, created_at) 
    WHERE status = 'AVAILABLE';
CREATE INDEX IF NOT EXISTS idx_physical_qr_codes_dates ON physical_qr_codes(printed_at, assigned_at);

-- Contraintes de validation
ALTER TABLE physical_qr_codes ADD CONSTRAINT chk_physical_qr_code_format 
CHECK (LENGTH(qr_code) >= 10 AND qr_code ~ '^[A-Z0-9_-]+$');

ALTER TABLE physical_qr_codes ADD CONSTRAINT chk_onboarding_key_format 
CHECK (LENGTH(onboarding_key) >= 10 AND onboarding_key ~ '^ONB_\d{4}_[A-Z]{3}_[A-Z0-9]{6,}$');

ALTER TABLE physical_qr_codes ADD CONSTRAINT chk_serial_number_format 
CHECK (LENGTH(serial_number) = 4 AND serial_number ~ '^[A-Z0-9]{4}$');

ALTER TABLE physical_qr_codes ADD CONSTRAINT chk_dates_logical 
CHECK (
    (assigned_at IS NULL OR assigned_at >= printed_at) AND
    (first_used_at IS NULL OR first_used_at >= assigned_at) AND
    (disabled_at IS NULL OR disabled_at >= created_at)
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_physical_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_physical_qr_codes_updated_at ON physical_qr_codes;

CREATE TRIGGER trg_physical_qr_codes_updated_at
    BEFORE UPDATE ON physical_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_physical_qr_codes_updated_at();

-- Commentaires de documentation
COMMENT ON TABLE physical_qr_codes IS 'Cartes physiques d''abonnement avec QR codes pré-imprimés et clés d''onboarding';
COMMENT ON COLUMN physical_qr_codes.qr_code IS 'QR code unique imprimé sur la face de la carte physique';
COMMENT ON COLUMN physical_qr_codes.onboarding_key IS 'Clé d''onboarding unique imprimée au dos de la carte pour conversion anonyme';
COMMENT ON COLUMN physical_qr_codes.serial_number IS 'Numéro de série unique de la carte physique (4 caractères)';
COMMENT ON COLUMN physical_qr_codes.subscription_plan_id IS 'Plan d''abonnement associé à cette carte physique';
COMMENT ON COLUMN physical_qr_codes.assigned_by IS 'Utilisateur (vendeur) qui a assigné cette carte à un abonnement';
COMMENT ON COLUMN physical_qr_codes.card_batch IS 'Lot de production de la carte pour traçabilité';
COMMENT ON COLUMN physical_qr_codes.card_type IS 'Type de carte physique (STANDARD, PREMIUM, VIP)';
COMMENT ON COLUMN physical_qr_codes.status IS 'Statut actuel de la carte dans son cycle de vie';
COMMENT ON COLUMN physical_qr_codes.printed_at IS 'Date d''impression de la carte physique';
COMMENT ON COLUMN physical_qr_codes.assigned_at IS 'Date d''assignation de la carte à un abonnement';
COMMENT ON COLUMN physical_qr_codes.first_used_at IS 'Date du premier scan/utilisation de la carte';
COMMENT ON COLUMN physical_qr_codes.disabled_at IS 'Date de désactivation de la carte (si applicable)';
COMMENT ON COLUMN physical_qr_codes.metadata IS 'Métadonnées JSON flexibles (incentives, configuration, historique)';

-- Mise à jour des statistiques
ANALYZE physical_qr_codes;
