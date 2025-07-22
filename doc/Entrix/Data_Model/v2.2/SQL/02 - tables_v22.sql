-- =====================================================
-- ENTRIX SOLUTION - TABLES SEULEMENT V2.1
-- Fichier: 02_tables_v2.1.sql
-- Description: Création de toutes les tables SANS contraintes ni index + nouveaux organisateurs
-- Version: 2.1 - Structure pure avec distinction organisateurs/participants
-- Date: Juillet 2025
-- =====================================================

-- =====================================================
-- SUPPRESSION DES TABLES EXISTANTES (ordre inverse)
-- =====================================================

-- Module 6: Sécurité & Audit
DROP TABLE IF EXISTS security_policies CASCADE;
DROP TABLE IF EXISTS rate_limiting CASCADE;
DROP TABLE IF EXISTS mfa_tokens CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Module 5: Paiements & Billing
DROP TABLE IF EXISTS payment_webhooks CASCADE;
DROP TABLE IF EXISTS organizer_commissions CASCADE;
DROP TABLE IF EXISTS club_commissions CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS payment_attempts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- Module 4: Billetterie & Contrôle d'accès
DROP TABLE IF EXISTS blacklist CASCADE;
DROP TABLE IF EXISTS ticket_templates CASCADE;
DROP TABLE IF EXISTS zone_mapping_overrides CASCADE;
DROP TABLE IF EXISTS event_ticket_config CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS access_control_log CASCADE;
DROP TABLE IF EXISTS access_transactions_log CASCADE;
DROP TABLE IF EXISTS access_rights CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plan_zones CASCADE;
DROP TABLE IF EXISTS subscription_plan_events CASCADE;
DROP TABLE IF EXISTS subscription_plan_event_groups CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Module 3: Venues & Cartographie
DROP TABLE IF EXISTS venue_media CASCADE;
DROP TABLE IF EXISTS venue_amenities CASCADE;
DROP TABLE IF EXISTS access_points CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS venue_zones CASCADE;
DROP TABLE IF EXISTS venue_mappings CASCADE;
DROP TABLE IF EXISTS venues CASCADE;

-- Module 2: Événements
DROP TABLE IF EXISTS event_stats CASCADE;
DROP TABLE IF EXISTS event_restrictions CASCADE;
DROP TABLE IF EXISTS event_media CASCADE;
DROP TABLE IF EXISTS event_schedules CASCADE;
DROP TABLE IF EXISTS participant_relationships CASCADE;
DROP TABLE IF EXISTS participant_staff CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_groups CASCADE;
DROP TABLE IF EXISTS event_categories CASCADE;
DROP TABLE IF EXISTS participants CASCADE;

-- Module 1.5: Organisateurs (NOUVEAU)
DROP TABLE IF EXISTS venue_organizer_relations CASCADE;
DROP TABLE IF EXISTS organizers CASCADE;

-- Module 1: Utilisateurs & Groupes
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- MODULE 1: UTILISATEURS & GROUPES
-- =====================================================

-- Table des utilisateurs (identité et authentification)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar TEXT,
    password VARCHAR(255) NOT NULL,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified TIMESTAMPTZ,
    phone_verified TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Table des profils utilisateurs (informations étendues)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Démographie
    date_of_birth DATE,
    gender gender,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(2) NOT NULL DEFAULT 'TN',
    postal_code VARCHAR(20),
    
    -- Préférences
    language VARCHAR(5) NOT NULL DEFAULT 'fr',
    timezone VARCHAR(50) DEFAULT 'Africa/Tunis',
    notifications BOOLEAN NOT NULL DEFAULT TRUE,
    newsletter BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Supporter spécifique
    supporter_since DATE,
    favorite_player VARCHAR(100),
    favorite_team_id UUID,
    
    -- Métadonnées étendues
    preferences JSONB,
    emergency_contact JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des rôles (catégories générales)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    permissions JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des groupes (droits spécifiques et segmentation)
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type group_type NOT NULL,
    
    -- Validité temporelle
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Configuration
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_members INTEGER,
    
    -- Métadonnées (JSON)
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison utilisateur-rôle
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    
    -- Validité
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    status membership_status NOT NULL DEFAULT 'ACTIVE',
    
    -- Métadonnées
    assigned_by UUID,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison utilisateur-groupe
CREATE TABLE user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    group_id UUID NOT NULL,
    
    -- Validité
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    status membership_status NOT NULL DEFAULT 'ACTIVE',
    
    -- Métadonnées
    added_by UUID,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MODULE 1.5: ORGANISATEURS (NOUVEAU)
-- =====================================================

-- Table des organisateurs (entités qui ORGANISENT les événements)
CREATE TABLE organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100),
    type organizer_type NOT NULL,
    status organizer_status NOT NULL DEFAULT 'PENDING',
    
    -- Informations légales
    legal_name VARCHAR(300),
    rnis VARCHAR(20), -- Numéro RNIS tunisien
    tax_id VARCHAR(50),
    registration_number VARCHAR(100),
    
    -- Contact principal
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL DEFAULT 'TN',
    
    -- Informations commerciales
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1200, -- 12% par défaut
    payment_terms INTEGER NOT NULL DEFAULT 15, -- Jours
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Configuration
    is_vat_registered BOOLEAN NOT NULL DEFAULT FALSE,
    accepts_online_payments BOOLEAN NOT NULL DEFAULT TRUE,
    auto_confirm_events BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Médias et branding
    logo_url TEXT,
    banner_url TEXT,
    website_url TEXT,
    
    -- Réseaux sociaux
    social_media JSONB,
    
    -- Informations étendues
    description TEXT,
    specialties TEXT[],
    target_audience TEXT[],
    
    -- Données légales et financières
    legal_documents JSONB, -- Contrats, assurances, licences
    banking_details JSONB, -- RIB, coordonnées bancaires
    insurance_info JSONB,  -- Assurances responsabilité civile
    
    -- Performance et historique
    total_events_organized INTEGER NOT NULL DEFAULT 0,
    total_revenue_generated DECIMAL(15,2) NOT NULL DEFAULT 0,
    average_satisfaction_score DECIMAL(3,2),
    last_event_date DATE,
    
    -- Validation et accréditation
    validated_at TIMESTAMPTZ,
    validated_by UUID, -- Référence vers users (admin qui a validé)
    accreditation_level VARCHAR(20) DEFAULT 'BASIC',
    certification_expires_at DATE,
    
    -- Métadonnées étendues
    preferences JSONB,
    business_hours JSONB,
    emergency_contact JSONB,
    metadata JSONB,
    
    -- Audit et traçabilité
    created_by UUID, -- Référence vers users
    updated_by UUID, -- Référence vers users
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison venue-organisateur
CREATE TABLE venue_organizer_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    venue_id VARCHAR(255) NOT NULL,
    organizer_id UUID NOT NULL,
    relation_type venue_relation_type NOT NULL,
    
    -- Validité
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Conditions commerciales
    rental_rate DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'TND',
    payment_terms INTEGER DEFAULT 30,
    
    -- Priorités et préférences
    priority_level INTEGER DEFAULT 0, -- Plus élevé = plus prioritaire
    preferred_days TEXT[], -- ['FRIDAY', 'SATURDAY']
    preferred_times JSONB, -- Créneaux horaires préférés
    
    -- Conditions spéciales
    exclusive_access BOOLEAN NOT NULL DEFAULT FALSE,
    special_conditions TEXT,
    contract_reference VARCHAR(100),
    
    -- Métadonnées
    notes TEXT,
    metadata JSONB,
    
    -- Audit
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MODULE 2: ÉVÉNEMENTS
-- =====================================================

-- Table des participants (référentiel centralisé - ceux qui PARTICIPENT)
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100),
    type participant_type NOT NULL,
    category VARCHAR(50),
    
    -- NOUVEAU: catégorie de participant enrichie
    participant_category VARCHAR(50), -- 'MAIN', 'SUPPORT', 'GUEST', 'STAFF'
    
    -- Informations géographiques
    nationality VARCHAR(2),
    city VARCHAR(100),
    
    -- Informations temporelles
    founded_date DATE,
    disbanded_date DATE,
    
    -- Médias
    logo_url TEXT,
    banner_url TEXT,
    website_url TEXT,
    
    -- Contact
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_address TEXT,
    
    -- Réseaux sociaux
    social_media JSONB,
    
    -- Données étendues
    description TEXT,
    achievements TEXT[],
    statistics JSONB,
    metadata JSONB,
    
    -- NOUVEAU: besoins spécialisés
    booking_agent_info JSONB,
    technical_requirements JSONB,
    hospitality_requirements JSONB,
    
    -- NOUVEAU: affiliation organisateur (cas rares)
    affiliated_organizer_id UUID,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table du personnel des participants
CREATE TABLE participant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL,
    
    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    date_of_birth DATE,
    nationality VARCHAR(2),
    
    -- Rôle et position
    role VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    jersey_number INTEGER,
    
    -- Contrat
    contract_start DATE,
    contract_end DATE,
    salary DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'TND',
    
    -- Statistiques et métadonnées
    statistics JSONB,
    metadata JSONB,
    
    -- Médias
    photo_url TEXT,
    biography TEXT,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des relations entre participants
CREATE TABLE participant_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_a_id UUID NOT NULL,
    participant_b_id UUID NOT NULL,
    
    -- Type et caractéristiques de la relation
    relationship_type participant_relationship_type NOT NULL,
    intensity INTEGER NOT NULL DEFAULT 5,
    is_mutual BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Validité temporelle
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Description et métadonnées
    description TEXT,
    metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des catégories d'événements
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_category_id UUID,
    
    -- Configuration par défaut
    default_duration INTEGER, -- en minutes
    default_capacity INTEGER,
    requires_referee BOOLEAN NOT NULL DEFAULT FALSE,
    allows_draw BOOLEAN NOT NULL DEFAULT FALSE,
    has_overtime BOOLEAN NOT NULL DEFAULT FALSE,
    has_penalties BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Médias
    icon_url TEXT,
    color_primary VARCHAR(7),
    color_secondary VARCHAR(7),
    
    -- Configuration billetterie
    default_ticket_price DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Métadonnées
    rules JSONB,
    metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des groupes d'événements (saisons, tournois)
CREATE TABLE event_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_group_id UUID,
    type event_group_type NOT NULL,
    season VARCHAR(20),
    
    -- Période
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Limites
    max_events INTEGER,
    current_events INTEGER NOT NULL DEFAULT 0,
    completed_events INTEGER NOT NULL DEFAULT 0,
    
    -- Configuration
    group_rules JSONB,
    metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des événements (MODIFIÉE avec référence organisateur)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    event_group_id UUID,
    category_id UUID NOT NULL,
    
    -- NOUVEAU: Référence vers l'organisateur (obligatoire)
    organizer_id UUID NOT NULL,
    
    -- Lieu et configuration
    venue_id VARCHAR(255) NOT NULL,
    mapping_id VARCHAR(255) NOT NULL,
    
    -- Temporalité
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    expected_duration INTEGER, -- en minutes
    
    -- Billetterie
    sales_start TIMESTAMPTZ,
    sales_end TIMESTAMPTZ,
    
    -- Statut et visibilité
    status event_status NOT NULL DEFAULT 'DRAFT',
    visibility event_visibility NOT NULL DEFAULT 'PUBLIC',
    
    -- Capacité
    max_capacity INTEGER,
    current_capacity INTEGER NOT NULL DEFAULT 0,
    capacity_override INTEGER,
    
    -- NOUVEAU: Contact organisateur pour cet événement
    organizer_contact_name VARCHAR(200),
    organizer_contact_email VARCHAR(255),
    organizer_contact_phone VARCHAR(20),
    
    -- Configuration
    pricing_config JSONB,
    restrictions JSONB,
    metadata JSONB,
    tags TEXT[],
    
    -- Mise en avant
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Gestion
    created_by UUID NOT NULL,
    published_by UUID,
    published_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison événement-participant
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    role event_participant_role NOT NULL,
    
    -- Ordre et confirmation
    display_order INTEGER DEFAULT 0,
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Financier
    participation_fee DECIMAL(10,2),
    prize_money DECIMAL(10,2),
    
    -- Statistiques et métadonnées
    performance_stats JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des programmes détaillés d'événements
CREATE TABLE event_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    
    -- Identification
    title VARCHAR(200) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(50) NOT NULL,
    
    -- Temporalité
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER, -- en minutes
    
    -- Organisation
    location_within_venue VARCHAR(200),
    presenter VARCHAR(200),
    
    -- Ordre
    display_order INTEGER DEFAULT 0,
    
    -- Statut
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    is_live BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des médias d'événements
CREATE TABLE event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    
    -- Identification
    title VARCHAR(200) NOT NULL,
    media_type event_media_type NOT NULL,
    
    -- Fichier
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Configuration d'affichage
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    description TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des restrictions d'événements
CREATE TABLE event_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    
    -- Type et configuration
    restriction_type restriction_type NOT NULL,
    value VARCHAR(200),
    description TEXT,
    
    -- Sévérité
    is_enforced BOOLEAN NOT NULL DEFAULT TRUE,
    severity severity_level NOT NULL DEFAULT 'MEDIUM',
    
    -- Validité
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des statistiques d'événements
CREATE TABLE event_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    
    -- Type de statistique
    stat_type VARCHAR(100) NOT NULL,
    stat_category VARCHAR(50),
    
    -- Valeurs
    value_numeric DECIMAL(15,4),
    value_text TEXT,
    value_json JSONB,
    
    -- Métadonnées
    participant_id UUID,
    period VARCHAR(50), -- 'FIRST_HALF', 'SECOND_HALF', 'FULL_TIME', etc.
    timestamp_recorded TIMESTAMPTZ DEFAULT NOW(),
    
    -- Statut
    is_official BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MODULE 3: VENUES & CARTOGRAPHIE (MODIFIÉ)
-- =====================================================

-- Table des venues (lieux physiques) - MODIFIÉE avec référence organisateurs
CREATE TABLE venues (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    
    -- Localisation
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL DEFAULT 'TN',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Capacité et description
    max_capacity INTEGER NOT NULL,
    description TEXT,
    
    -- Médias et services globaux
    images TEXT[],
    global_amenities TEXT[],
    
    -- NOUVEAU: Relations organisateurs
    primary_owner_id UUID,     -- Propriétaire principal
    primary_manager_id UUID,   -- Gestionnaire principal
    
    -- Configuration
    default_mapping_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des cartographies (configurations d'usage)
CREATE TABLE venue_mappings (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    venue_id VARCHAR(255) NOT NULL,
    
    -- Identification
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Configuration
    mapping_type mapping_type NOT NULL,
    event_categories TEXT[],
    effective_capacity INTEGER NOT NULL,
    
    -- Validité temporelle
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des zones (organisation hiérarchique)
CREATE TABLE venue_zones (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    mapping_id VARCHAR(255) NOT NULL,
    parent_zone_id VARCHAR(255),
    
    -- Identification
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    
    -- Configuration
    zone_type zone_type NOT NULL,
    category zone_category NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL,
    
    -- Tarification
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Positionnement
    coordinates JSONB,
    
    -- Description et services
    description TEXT,
    amenities TEXT[],
    
    -- Accessibilité
    is_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    requires_special_access BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des places individuelles
CREATE TABLE seats (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    zone_id VARCHAR(255) NOT NULL,
    
    -- Identification
    seat_number VARCHAR(20) NOT NULL,
    row_number VARCHAR(20),
    
    -- Configuration
    seat_type seat_type NOT NULL DEFAULT 'STANDARD',
    status seat_status NOT NULL DEFAULT 'AVAILABLE',
    
    -- Positionnement
    x_coordinate DECIMAL(10,4),
    y_coordinate DECIMAL(10,4),
    
    -- Tarification
    price_modifier DECIMAL(5,4) DEFAULT 1.0000,
    
    -- Caractéristiques
    features TEXT[],
    is_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    accessibility_notes TEXT,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des points d'accès
CREATE TABLE access_points (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    mapping_id VARCHAR(255) NOT NULL,
    
    -- Identification
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    
    -- Configuration
    access_type access_type NOT NULL,
    allowed_zones TEXT[],
    restricted_zones TEXT[],
    security_level security_level NOT NULL DEFAULT 'STANDARD',
    
    -- Localisation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Statut et configuration
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    requires_special_permission BOOLEAN NOT NULL DEFAULT FALSE,
    operating_hours JSONB,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des équipements et services
CREATE TABLE venue_amenities (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    mapping_id VARCHAR(255) NOT NULL,
    zone_id VARCHAR(255),
    
    -- Identification
    name VARCHAR(200) NOT NULL,
    category amenity_category NOT NULL,
    
    -- Configuration
    description TEXT,
    is_free BOOLEAN NOT NULL DEFAULT TRUE,
    price DECIMAL(8,2),
    currency VARCHAR(3) DEFAULT 'TND',
    
    -- Disponibilité
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    operating_hours JSONB,
    capacity INTEGER,
    
    -- Localisation
    coordinates JSONB,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des médias de venue
CREATE TABLE venue_media (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    venue_id VARCHAR(255),
    mapping_id VARCHAR(255),
    zone_id VARCHAR(255),
    seat_id VARCHAR(255),
    
    -- Identification
    title VARCHAR(200) NOT NULL,
    media_type media_type NOT NULL,
    category media_category NOT NULL,
    
    -- Fichier
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Configuration d'affichage
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    description TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MODULE 4: BILLETTERIE & CONTRÔLE D'ACCÈS (MODIFIÉ)
-- =====================================================

-- Table des plans d'abonnements (catalogue) - MODIFIÉE avec référence organisateur
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type subscription_plan_type NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    max_subscribers INTEGER,
    current_subscribers INTEGER NOT NULL DEFAULT 0,
    
    -- NOUVEAU: Référence organisateur (obligatoire)
    organizer_id UUID NOT NULL,
    
    -- Validité
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    sale_start_date DATE,
    sale_end_date DATE,
    
    -- Configuration
    transferable BOOLEAN NOT NULL DEFAULT FALSE,
    max_transfers INTEGER DEFAULT 0,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    includes_playoffs BOOLEAN NOT NULL DEFAULT FALSE,
    priority_booking BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métadonnées
    benefits JSONB,
    restrictions JSONB,
    metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison plans-groupes d'événements
CREATE TABLE subscription_plan_event_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_plan_id UUID NOT NULL,
    event_group_id UUID NOT NULL,
    
    -- Configuration
    is_included BOOLEAN NOT NULL DEFAULT TRUE,
    access_level VARCHAR(50) DEFAULT 'STANDARD',
    priority_level INTEGER DEFAULT 0,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison plans-événements spécifiques
CREATE TABLE subscription_plan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_plan_id UUID NOT NULL,
    event_id UUID NOT NULL,
    
    -- Configuration
    is_included BOOLEAN NOT NULL DEFAULT TRUE,
    is_priority BOOLEAN NOT NULL DEFAULT FALSE,
    access_level VARCHAR(50) DEFAULT 'STANDARD',
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison plans-zones
CREATE TABLE subscription_plan_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_plan_id UUID NOT NULL,
    zone_id VARCHAR(255) NOT NULL,
    
    -- Configuration
    is_included BOOLEAN NOT NULL DEFAULT TRUE,
    price_override DECIMAL(10,2),
    priority_level INTEGER DEFAULT 0,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des abonnements (instances utilisateur) - MODIFIÉE avec référence organisateur
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_number VARCHAR(50) NOT NULL,
    plan_id UUID NOT NULL,
    user_id UUID,
    
    -- NOUVEAU: Référence organisateur (pour performance)
    organizer_id UUID,
    
    -- Statut et dates
    status subscription_status NOT NULL DEFAULT 'PENDING',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Financier
    price_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Configuration
    transfers_used INTEGER NOT NULL DEFAULT 0,
    next_billing_date DATE,
    auto_renew_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Bénéfices
    subscriber_benefits JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des types de billets (catalogue) - MODIFIÉE avec référence organisateur
CREATE TABLE ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- NOUVEAU: Référence organisateur (optionnelle)
    organizer_id UUID,
    
    -- Configuration
    transferable BOOLEAN NOT NULL DEFAULT TRUE,
    refundable BOOLEAN NOT NULL DEFAULT FALSE,
    max_quantity_per_order INTEGER DEFAULT 8,
    
    -- Validité
    valid_from DATE,
    valid_until DATE,
    
    -- Restrictions et métadonnées
    restrictions JSONB,
    metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des billets (instances utilisateur) - MODIFIÉE avec référence organisateur
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) NOT NULL,
    ticket_type_id UUID NOT NULL,
    user_id UUID NOT NULL,
    event_id UUID NOT NULL,
    zone_id VARCHAR(255),
    seat_id VARCHAR(255),
    
    -- NOUVEAU: Référence organisateur (pour performance)
    organizer_id UUID,
    
    -- Prix payé
    price_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Configuration
    special_requirements TEXT,
    ticket_metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table centrale des droits d'accès - MODIFIÉE avec référence organisateur
CREATE TABLE access_rights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code VARCHAR(255) NOT NULL,
    user_id UUID,
    event_id UUID,
    
    -- NOUVEAU: Référence organisateur (pour performance)
    organizer_id UUID,
    
    -- Sources possibles (un seul sera non-null)
    subscription_id UUID,
    ticket_id UUID,
    
    -- Localisation
    zone_id VARCHAR(255),
    seat_id VARCHAR(255),
    
    -- Statut et type
    status access_right_status NOT NULL DEFAULT 'VALID',
    source_type access_source_type NOT NULL,
    
    -- Code d'accès sécurisé
    access_code VARCHAR(100) NOT NULL,
    
    -- Validité temporelle
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    
    -- Utilisation
    max_uses INTEGER NOT NULL DEFAULT 1,
    current_uses INTEGER NOT NULL DEFAULT 0,
    used_at TIMESTAMPTZ,
    used_at_access_point VARCHAR(255),
    
    -- Métadonnées
    access_metadata JSONB,
    special_permissions JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des logs de transactions d'accès
CREATE TABLE access_transactions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_right_id UUID NOT NULL,
    transaction_type access_transaction_type NOT NULL,
    from_user_id UUID,
    to_user_id UUID,
    from_status access_right_status,
    to_status access_right_status NOT NULL,
    reason TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des logs de contrôle d'accès
CREATE TABLE access_control_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_right_id UUID NOT NULL,
    access_point_id VARCHAR(255),
    user_id UUID NOT NULL,
    event_id UUID NOT NULL,
    
    -- Action et résultat
    action access_action NOT NULL,
    result access_status NOT NULL,
    denial_reason denial_reason,
    
    -- Contexte technique
    controller_device VARCHAR(100),
    ip_address INET,
    scan_metadata JSONB,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des règles de tarification - MODIFIÉE avec référence organisateur
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    rule_type pricing_rule_type NOT NULL,
    
    -- NOUVEAU: Référence organisateur (optionnelle)
    organizer_id UUID,
    
    -- Configuration de la règle
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    
    -- Validité
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ,
    
    -- Priorité et application
    priority INTEGER NOT NULL DEFAULT 0,
    is_stackable BOOLEAN NOT NULL DEFAULT FALSE,
    max_applications INTEGER,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de configuration billetterie par événement - MODIFIÉE avec référence organisateur
CREATE TABLE event_ticket_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    ticket_type_id UUID NOT NULL,
    zone_id VARCHAR(255),
    
    -- NOUVEAU: Référence organisateur (pour performance)
    organizer_id UUID,
    
    -- Configuration spécifique
    price_override DECIMAL(10,2),
    available_quantity INTEGER,
    sold_quantity INTEGER NOT NULL DEFAULT 0,
    
    -- Fenêtre de vente
    sale_start_date TIMESTAMPTZ,
    sale_end_date TIMESTAMPTZ,
    
    -- Restrictions
    min_purchase_quantity INTEGER DEFAULT 1,
    max_purchase_quantity INTEGER DEFAULT 8,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des surcharges de cartographie par zone
CREATE TABLE zone_mapping_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    zone_id VARCHAR(255) NOT NULL,
    
    -- Surcharges possibles
    name_override VARCHAR(200),
    capacity_override INTEGER,
    price_override DECIMAL(10,2),
    access_restrictions JSONB,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des templates de billets
CREATE TABLE ticket_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Configuration du template
    template_type template_type NOT NULL,
    format template_format NOT NULL DEFAULT 'PDF',
    orientation orientation_type NOT NULL DEFAULT 'PORTRAIT',
    
    -- Contenu du template
    template_content TEXT NOT NULL,
    style_css TEXT,
    
    -- Configuration
    paper_size VARCHAR(20) DEFAULT 'A4',
    margin_top INTEGER DEFAULT 20,
    margin_bottom INTEGER DEFAULT 20,
    margin_left INTEGER DEFAULT 20,
    margin_right INTEGER DEFAULT 20,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de blacklist sécuritaire - MODIFIÉE avec référence organisateur
CREATE TABLE blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type blacklist_type NOT NULL,
    value VARCHAR(255) NOT NULL,
    scope blacklist_scope NOT NULL,
    
    -- Cibles (optionnelles selon scope)
    target_event_id UUID,
    target_venue_id VARCHAR(255),
    -- NOUVEAU: Cible organisateur
    organizer_id UUID,
    
    -- Motif
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    severity severity_level NOT NULL DEFAULT 'MEDIUM',
    
    -- Validité
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Audit
    created_by UUID NOT NULL,
    appeal_status appeal_status NOT NULL DEFAULT 'NONE',
    appeal_notes TEXT,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MODULE 5: PAIEMENTS & BILLING (MODIFIÉ)
-- =====================================================

-- Table des méthodes de paiement
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    type payment_method_type NOT NULL,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Limites
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2),
    
    -- Frais
    processing_fee_fixed DECIMAL(8,2) DEFAULT 0,
    processing_fee_percent DECIMAL(5,4) DEFAULT 0,
    
    -- Configuration
    configuration JSONB,
    display_order INTEGER DEFAULT 0,
    
    -- Description
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des commandes - MODIFIÉE avec référence organisateur
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL,
    user_id UUID,
    
    -- NOUVEAU: Organisateur principal (calculé automatiquement)
    primary_organizer_id UUID,
    
    -- Statut
    status order_status NOT NULL DEFAULT 'DRAFT',
    
    -- Montants
    subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    processing_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Canal et métadonnées
    purchase_channel purchase_channel NOT NULL DEFAULT 'WEB',
    coupon_code VARCHAR(50),
    
    -- Achat invité (si user_id est null)
    guest_name VARCHAR(200),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    
    -- Notes et métadonnées
    notes TEXT,
    metadata JSONB,
    
    -- Timestamps
    confirmed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des lignes de commande
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    
    -- Références produits (un seul sera non-null)
    subscription_plan_id UUID,
    ticket_type_id UUID,
    event_id UUID,
    
    -- Description de l'item
    item_type order_item_type NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    
    -- Quantité et prix
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Configuration
    item_configuration JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des paiements - MODIFIÉE avec référence organisateur
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) NOT NULL,
    order_id UUID NOT NULL,
    payment_method_id UUID NOT NULL,
    
    -- NOUVEAU: Organisateur principal (pour performance)
    primary_organizer_id UUID,
    
    -- Montants
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Statut et transaction
    status payment_status NOT NULL DEFAULT 'PENDING',
    external_transaction_id VARCHAR(100),
    
    -- Frais
    processing_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Dates
    payment_date TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Données passerelle
    gateway_data JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des tentatives de paiement
CREATE TABLE payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    attempt_number INTEGER NOT NULL,
    
    -- Statut et résultat
    status payment_status NOT NULL,
    failure_reason TEXT,
    
    -- Données passerelle
    gateway_request JSONB,
    gateway_response JSONB,
    processing_time_ms INTEGER,
    
    -- Timestamps
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des remboursements
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_number VARCHAR(50) NOT NULL,
    payment_id UUID NOT NULL,
    order_id UUID NOT NULL,
    
    -- Configuration du remboursement
    refund_type refund_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method refund_method NOT NULL,
    status refund_status NOT NULL DEFAULT 'PENDING',
    
    -- Motif
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Approbation
    requested_by UUID,
    approved_by UUID,
    
    -- Transaction externe
    external_refund_id VARCHAR(100),
    processing_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
    net_refund_amount DECIMAL(10,2) NOT NULL,
    
    -- Dates
    expected_date DATE,
    completed_date TIMESTAMPTZ,
    
    -- Réponse passerelle
    gateway_response JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des commissions organisateurs (RENOMMÉE de club_commissions)
CREATE TABLE organizer_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    order_id UUID NOT NULL,
    organizer_id UUID NOT NULL, -- RENOMMÉ de club_id
    
    -- Type et calcul
    commission_type VARCHAR(30) NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4),
    commission_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_to_organizer DECIMAL(10,2) NOT NULL, -- RENOMMÉ de net_to_club
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- NOUVEAU: Gestion avancée des commissions
    contract_version VARCHAR(20) DEFAULT 'v2.1',
    commission_tier VARCHAR(20), -- 'STANDARD', 'PREMIUM', 'ENTERPRISE'
    volume_bonus DECIMAL(8,2) DEFAULT 0,
    loyalty_bonus DECIMAL(8,2) DEFAULT 0,
    
    -- Détails de calcul
    calculation_details JSONB NOT NULL,
    
    -- Statut et paiement
    status commission_status NOT NULL DEFAULT 'PENDING',
    payment_due_date DATE NOT NULL,
    paid_date TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    
    -- Notes et métadonnées
    notes TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des webhooks de paiement
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id VARCHAR(100) NOT NULL,
    payment_id UUID,
    
    -- Événement
    event_type VARCHAR(50) NOT NULL,
    external_transaction_id VARCHAR(100) NOT NULL,
    status webhook_status NOT NULL DEFAULT 'RECEIVED',
    
    -- Données
    raw_payload JSONB NOT NULL,
    parsed_data JSONB,
    
    -- Sécurité
    signature VARCHAR(255),
    signature_valid BOOLEAN,
    ip_source INET,
    user_agent TEXT,
    
    -- Traitement
    processing_attempts INTEGER NOT NULL DEFAULT 0,
    last_processing_error TEXT,
    processed_at TIMESTAMPTZ,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MODULE 6: SÉCURITÉ & AUDIT
-- =====================================================

-- Table des logs d'audit
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    
    -- Objet de l'audit
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action audit_action NOT NULL,
    
    -- Données
    old_values JSONB,
    new_values JSONB,
    
    -- Contexte
    ip_address INET,
    user_agent TEXT,
    severity security_level NOT NULL DEFAULT 'STANDARD',
    
    -- Description
    description TEXT,
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des sessions utilisateur
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    
    -- Contexte
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    geolocation JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des tentatives de connexion
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    user_id UUID,
    
    -- Contexte
    ip_address INET NOT NULL,
    user_agent TEXT,
    
    -- Résultat
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Géolocalisation
    geolocation JSONB,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des événements de sécurité
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity security_level NOT NULL,
    
    -- Cible
    target_user_id UUID,
    ip_address INET,
    
    -- Description
    description TEXT NOT NULL,
    event_data JSONB,
    
    -- Résolution
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    resolved_at TIMESTAMPTZ,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des tokens MFA
CREATE TABLE mfa_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    method mfa_method NOT NULL,
    
    -- Token
    token_hash VARCHAR(255) NOT NULL,
    secret VARCHAR(255),
    
    -- Validité
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Table de limitation de taux
CREATE TABLE rate_limiting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(200) NOT NULL,
    identifier_type VARCHAR(50) NOT NULL,
    identifier_value VARCHAR(255) NOT NULL,
    
    -- Compteurs
    requests_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Statut
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    last_request TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des politiques de sécurité
CREATE TABLE security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Configuration de la politique
    policy_type VARCHAR(50) NOT NULL,
    rules JSONB NOT NULL,
    
    -- Validité
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_enforced BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- COMMENTAIRES ET DOCUMENTATION
-- =====================================================

-- Module 1 - Commentaires
COMMENT ON TABLE users IS 'Table centrale des utilisateurs avec authentification et informations de base';
COMMENT ON TABLE user_profiles IS 'Profils étendus des utilisateurs avec démographie et préférences';
COMMENT ON TABLE roles IS 'Rôles généraux définissant les niveaux d''accès globaux';
COMMENT ON TABLE groups IS 'Groupes spécifiques pour droits granulaires et segmentation marketing';
COMMENT ON TABLE user_roles IS 'Liaison utilisateur-rôle avec gestion temporelle';
COMMENT ON TABLE user_groups IS 'Liaison utilisateur-groupe avec métadonnées spécifiques';

-- Module 1.5 - Commentaires ORGANISATEURS
COMMENT ON TABLE organizers IS 'Organisateurs d''événements - entités qui ORGANISENT et gèrent les événements (Club Africain, Ennejma Ezzahra, UTICA, etc.)';
COMMENT ON TABLE venue_organizer_relations IS 'Relations entre venues et organisateurs (propriété, gestion, location, partenariat)';

-- Module 2 - Commentaires PARTICIPANTS (clarifiés)
COMMENT ON TABLE participants IS 'Participants aux événements - entités qui PARTICIPENT (équipes sportives, artistes, speakers, arbitres, etc.)';
COMMENT ON TABLE participant_staff IS 'Personnel des participants (joueurs, musiciens, staff technique)';
COMMENT ON TABLE participant_relationships IS 'Relations entre participants (rivalités, partenariats, affiliations)';
COMMENT ON TABLE event_categories IS 'Types d''événements disponibles avec configuration par défaut';
COMMENT ON TABLE event_groups IS 'Groupes d''événements (saisons, tournois, festivals)';
COMMENT ON TABLE events IS 'Événements individuels avec référence obligatoire vers leur organisateur';
COMMENT ON TABLE event_participants IS 'Liaison entre événements et participants avec rôles spécifiques';
COMMENT ON TABLE event_schedules IS 'Programme détaillé pour événements complexes (concerts, conférences)';
COMMENT ON TABLE event_media IS 'Médias associés aux événements (photos, vidéos, documents)';
COMMENT ON TABLE event_restrictions IS 'Restrictions et conditions d''accès aux événements';
COMMENT ON TABLE event_stats IS 'Statistiques et résultats des événements en temps réel';

-- Module 3 - Commentaires
COMMENT ON TABLE venues IS 'Lieux physiques (stades, salles) avec propriétaire et gestionnaire principaux';
COMMENT ON TABLE venue_mappings IS 'Configurations multiples d''un même venue selon usage (football, concert, maintenance)';
COMMENT ON TABLE venue_zones IS 'Organisation hiérarchique des espaces dans une cartographie';
COMMENT ON TABLE seats IS 'Places individuelles numérotées pour les zones qui le nécessitent';
COMMENT ON TABLE access_points IS 'Points d''entrée/sortie avec configuration de sécurité';
COMMENT ON TABLE venue_amenities IS 'Services et commodités disponibles au niveau venue ou zone';
COMMENT ON TABLE venue_media IS 'Fichiers multimédias pour visualisation et aide à la vente';

-- Module 4 - Commentaires
COMMENT ON TABLE subscription_plans IS 'Plans d''abonnements créés PAR un organisateur pour SES événements';
COMMENT ON TABLE subscription_plan_event_groups IS 'Liaison entre plans d''abonnement et groupes d''événements';
COMMENT ON TABLE subscription_plan_events IS 'Liaison entre plans d''abonnement et événements spécifiques';
COMMENT ON TABLE subscription_plan_zones IS 'Liaison entre plans d''abonnement et zones de venue';
COMMENT ON TABLE subscriptions IS 'Abonnements souscrits par les utilisateurs avec référence organisateur';
COMMENT ON TABLE ticket_types IS 'Types de billets avec prix de base et organisateur créateur';
COMMENT ON TABLE tickets IS 'Billets individuels achetés par les utilisateurs avec référence organisateur';
COMMENT ON TABLE access_rights IS 'Table centrale unifiant tous les droits d''accès avec QR codes et référence organisateur';
COMMENT ON TABLE access_transactions_log IS 'Journal des transactions sur les droits d''accès (transferts, annulations)';
COMMENT ON TABLE access_control_log IS 'Journal de tous les contrôles d''accès physiques';
COMMENT ON TABLE pricing_rules IS 'Règles de tarification et promotions définies par organisateur';
COMMENT ON TABLE event_ticket_config IS 'Configuration spécifique de billetterie par événement et organisateur';
COMMENT ON TABLE zone_mapping_overrides IS 'Surcharges de configuration des zones pour des événements spéciaux';
COMMENT ON TABLE ticket_templates IS 'Templates pour génération des billets PDF/HTML';
COMMENT ON TABLE blacklist IS 'Liste noire avec portée organisateur, venue, événement ou globale';

-- Module 5 - Commentaires
COMMENT ON TABLE payment_methods IS 'Méthodes de paiement disponibles (Flouci, cartes, virements)';
COMMENT ON TABLE orders IS 'Commandes passées par les utilisateurs avec organisateur principal automatique';
COMMENT ON TABLE order_items IS 'Lignes de commande détaillant les achats';
COMMENT ON TABLE payments IS 'Paiements effectués pour les commandes avec référence organisateur';
COMMENT ON TABLE payment_attempts IS 'Tentatives de paiement avec détails d''échec';
COMMENT ON TABLE refunds IS 'Remboursements traités';
COMMENT ON TABLE organizer_commissions IS 'Commissions calculées pour les organisateurs (renommé de club_commissions)';
COMMENT ON TABLE payment_webhooks IS 'Webhooks reçus des passerelles de paiement (Flouci)';

-- Module 6 - Commentaires
COMMENT ON TABLE audit_logs IS 'Journal d''audit de toutes les actions critiques';
COMMENT ON TABLE user_sessions IS 'Sessions utilisateurs actives avec tracking de sécurité';
COMMENT ON TABLE login_attempts IS 'Tentatives de connexion pour détection d''anomalies';
COMMENT ON TABLE security_events IS 'Événements de sécurité détectés automatiquement';
COMMENT ON TABLE mfa_tokens IS 'Tokens d''authentification multi-facteurs temporaires';
COMMENT ON TABLE rate_limiting IS 'Limitation du taux de requêtes par endpoint et utilisateur';
COMMENT ON TABLE security_policies IS 'Politiques de sécurité configurables';

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

SELECT 
    'Tables Entrix V2.1 créées avec succès!' as status,
    'Total: 56 tables incluant nouvelle table organizers' as count,
    'Distinction claire: ORGANISATEURS (organisent) vs PARTICIPANTS (participent)' as evolution,
    'Structure complète sans contraintes pour flexibilité maximale' as note;

-- =====================================================
-- FIN DU FICHIER 02_tables_v2.1.sql
-- =====================================================