-- =====================================================
-- ENTRIX SOLUTION - AJOUT CHAMPS IDENTITÉ V2.1.1
-- Fichier: add_identity_fields_v2.1.1.sql
-- Description: Ajout des champs d'identité dans user_profiles
-- Version: 2.1.1 - Evolution modèle avec pièces d'identité
-- Date: Janvier 2025
-- =====================================================

-- =====================================================
-- ÉTAPE 1: CRÉATION DE L'ÉNUMÉRATION
-- =====================================================

-- Type de document d'identité
CREATE TYPE identity_document_type AS ENUM (
    'CIN',              -- Carte d'Identité Nationale (Tunisie)
    'PASSPORT',         -- Passeport
    'DRIVING_LICENSE',  -- Permis de conduire
    'RESIDENCE_PERMIT', -- Carte de séjour
    'MILITARY_ID',      -- Carte militaire
    'STUDENT_ID',       -- Carte étudiant
    'PROFESSIONAL_ID',  -- Carte professionnelle
    'OTHER'             -- Autre document officiel
);

-- Ajout de commentaire pour documentation
COMMENT ON TYPE identity_document_type IS 'Types de documents d''identité acceptés pour vérification utilisateur';

-- =====================================================
-- ÉTAPE 2: AJOUT DES COLONNES À LA TABLE
-- =====================================================

-- Ajout du type de document d'identité
ALTER TABLE user_profiles 
ADD COLUMN identity_document_type identity_document_type;

-- Ajout du numéro de document d'identité
ALTER TABLE user_profiles 
ADD COLUMN identity_document_number VARCHAR(50);

-- Ajout d'une date de vérification optionnelle
ALTER TABLE user_profiles 
ADD COLUMN identity_verified_at TIMESTAMPTZ;

-- Ajout d'un flag pour marquer la vérification
ALTER TABLE user_profiles 
ADD COLUMN identity_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- =====================================================
-- ÉTAPE 3: AJOUT DES CONTRAINTES
-- =====================================================

-- Contrainte: Si un numéro est fourni, le type doit l'être aussi
ALTER TABLE user_profiles 
ADD CONSTRAINT chk_user_profiles_identity_consistency 
    CHECK (
        (identity_document_number IS NULL AND identity_document_type IS NULL) OR
        (identity_document_number IS NOT NULL AND identity_document_type IS NOT NULL)
    );

-- Contrainte: Format du numéro selon le type (exemples pour la Tunisie)
ALTER TABLE user_profiles 
ADD CONSTRAINT chk_user_profiles_identity_number_format 
    CHECK (
        identity_document_number IS NULL OR
        CASE 
            -- CIN tunisienne: 8 chiffres
            WHEN identity_document_type = 'CIN' 
                THEN identity_document_number ~ '^[0-9]{8}$'
            -- Passeport: lettres et chiffres, 6-20 caractères
            WHEN identity_document_type = 'PASSPORT' 
                THEN identity_document_number ~ '^[A-Z0-9]{6,20}$'
            -- Permis de conduire: format variable
            WHEN identity_document_type = 'DRIVING_LICENSE' 
                THEN LENGTH(identity_document_number) BETWEEN 5 AND 20
            -- Autres: longueur minimale
            ELSE LENGTH(identity_document_number) >= 3
        END
    );

-- Contrainte: Si vérifié, la date de vérification doit être présente
ALTER TABLE user_profiles 
ADD CONSTRAINT chk_user_profiles_identity_verification 
    CHECK (
        (identity_verified = FALSE) OR 
        (identity_verified = TRUE AND identity_verified_at IS NOT NULL)
    );

-- Contrainte: La date de vérification ne peut pas être dans le futur
ALTER TABLE user_profiles 
ADD CONSTRAINT chk_user_profiles_identity_verified_date 
    CHECK (
        identity_verified_at IS NULL OR 
        identity_verified_at <= NOW()
    );

-- =====================================================
-- ÉTAPE 4: AJOUT DES INDEX POUR PERFORMANCE
-- =====================================================

-- Index sur le type de document
CREATE INDEX idx_user_profiles_identity_type 
    ON user_profiles(identity_document_type);

-- Index sur le numéro de document (pour recherche)
CREATE INDEX idx_user_profiles_identity_number 
    ON user_profiles(identity_document_number);

-- Index sur le statut de vérification
CREATE INDEX idx_user_profiles_identity_verified 
    ON user_profiles(identity_verified);

-- Index composite pour recherche par type et numéro
CREATE INDEX idx_user_profiles_identity_lookup 
    ON user_profiles(identity_document_type, identity_document_number);

-- Index partiel pour les profils vérifiés seulement
CREATE INDEX idx_user_profiles_verified_identities 
    ON user_profiles(identity_document_type, identity_document_number) 
    WHERE identity_verified = TRUE;

-- =====================================================
-- ÉTAPE 5: AJOUT DES COMMENTAIRES
-- =====================================================

COMMENT ON COLUMN user_profiles.identity_document_type IS 'Type de document d''identité fourni par l''utilisateur';
COMMENT ON COLUMN user_profiles.identity_document_number IS 'Numéro du document d''identité (format dépend du type)';
COMMENT ON COLUMN user_profiles.identity_verified_at IS 'Date et heure de vérification du document d''identité';
COMMENT ON COLUMN user_profiles.identity_verified IS 'Indique si le document d''identité a été vérifié';

-- =====================================================
-- ÉTAPE 6: MISE À JOUR DES TRIGGERS (SI NÉCESSAIRE)
-- =====================================================

-- Fonction pour anonymiser automatiquement les données sensibles lors de la suppression
CREATE OR REPLACE FUNCTION anonymize_identity_on_delete()
RETURNS TRIGGER AS $func$
BEGIN
    -- Au lieu de supprimer, on anonymise
    UPDATE user_profiles 
    SET identity_document_number = 'DELETED_' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8),
        identity_document_type = NULL,
        identity_verified = FALSE,
        identity_verified_at = NULL
    WHERE user_id = OLD.user_id;
    
    RETURN NULL; -- Empêche la suppression réelle
END;
$func$ LANGUAGE plpgsql;

-- Trigger pour anonymiser au lieu de supprimer
CREATE TRIGGER trigger_anonymize_identity_on_delete
    BEFORE DELETE ON user_profiles
    FOR EACH ROW
    WHEN (OLD.identity_document_number IS NOT NULL)
    EXECUTE FUNCTION anonymize_identity_on_delete();

-- =====================================================
-- ÉTAPE 7: FONCTION UTILITAIRE POUR VÉRIFICATION
-- =====================================================

-- Fonction pour marquer un document comme vérifié
CREATE OR REPLACE FUNCTION verify_user_identity(
    p_user_id UUID,
    p_verified_by UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $func$
DECLARE
    profile_exists BOOLEAN;
BEGIN
    -- Vérifier que le profil existe et a des documents
    SELECT EXISTS(
        SELECT 1 FROM user_profiles 
        WHERE user_id = p_user_id 
        AND identity_document_number IS NOT NULL
    ) INTO profile_exists;
    
    IF NOT profile_exists THEN
        RAISE EXCEPTION 'User profile not found or no identity document provided';
    END IF;
    
    -- Mettre à jour le statut de vérification
    UPDATE user_profiles 
    SET identity_verified = TRUE,
        identity_verified_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Logger dans l'audit
    INSERT INTO audit_logs (
        user_id, 
        table_name, 
        record_id, 
        action, 
        description
    ) VALUES (
        p_verified_by, 
        'user_profiles', 
        p_user_id, 
        'UPDATE',
        'Identity document verified' || COALESCE(' - ' || p_notes, '')
    );
    
    RETURN TRUE;
END;
$func$ LANGUAGE plpgsql;

-- =====================================================
-- ÉTAPE 8: MISE À JOUR DES VUES EXISTANTES
-- =====================================================

-- Recréer la vue v_user_complete avec les nouveaux champs
DROP VIEW IF EXISTS v_user_complete CASCADE;

CREATE VIEW v_user_complete AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.first_name || ' ' || u.last_name AS full_name,
    u.is_active,
    u.email_verified,
    u.phone_verified,
    u.created_at,
    u.last_login,
    
    -- Données profil
    up.date_of_birth,
    up.gender,
    up.city,
    up.country,
    up.language,
    up.timezone,
    up.notifications,
    up.newsletter,
    up.supporter_since,
    
    -- NOUVEAUX CHAMPS IDENTITÉ
    up.identity_document_type,
    up.identity_document_number,
    up.identity_verified,
    up.identity_verified_at,
    
    -- Calculs utiles
    CASE 
        WHEN up.date_of_birth IS NOT NULL 
        THEN DATE_PART('year', AGE(up.date_of_birth))::INTEGER
        ELSE NULL 
    END AS age,
    
    CASE 
        WHEN u.email_verified IS NOT NULL AND u.is_active 
        THEN 'VERIFIED'
        WHEN u.is_active 
        THEN 'PENDING'
        ELSE 'INACTIVE'
    END AS verification_status,
    
    -- Statut de vérification complet
    CASE 
        WHEN u.email_verified IS NOT NULL 
             AND u.phone_verified IS NOT NULL 
             AND up.identity_verified = TRUE
        THEN 'FULLY_VERIFIED'
        WHEN u.email_verified IS NOT NULL OR u.phone_verified IS NOT NULL
        THEN 'PARTIALLY_VERIFIED'
        ELSE 'UNVERIFIED'
    END AS kyc_status,
    
    -- Timestamps
    u.updated_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;

-- =====================================================
-- ÉTAPE 9: POLITIQUES RLS POUR LES NOUVEAUX CHAMPS
-- =====================================================

-- Les politiques existantes s'appliquent déjà aux nouveaux champs
-- car elles couvrent toute la table user_profiles

-- Politique additionnelle: seuls les admins peuvent voir les numéros complets
CREATE OR REPLACE FUNCTION mask_identity_number(
    document_number VARCHAR(50),
    is_owner BOOLEAN,
    is_admin BOOLEAN
)
RETURNS VARCHAR(50) AS $func$
BEGIN
    IF is_admin OR is_owner THEN
        RETURN document_number;
    ELSIF document_number IS NOT NULL THEN
        -- Masquer partiellement le numéro
        RETURN LEFT(document_number, 2) || REPEAT('*', LENGTH(document_number) - 4) || RIGHT(document_number, 2);
    ELSE
        RETURN NULL;
    END IF;
END;
$func$ LANGUAGE plpgsql IMMUTABLE;




-- Table api_clients
CREATE TABLE api_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    status api_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table api_keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
    key VARCHAR(64) NOT NULL UNIQUE,
    secret_hash VARCHAR(128) NOT NULL,
    status api_status NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Table api_access_logs (status_code en INT ou ENUM selon ton choix)
CREATE TABLE api_access_logs (
    id BIGSERIAL PRIMARY KEY,
    key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    ip INET,
    status_code INT, -- ou status_code api_status_code si tu veux l'enum
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FIN DU FICHIER add_identity_fields_v2.1.1.sql
-- =====================================================