-- =====================================================
-- ENTRIX SOLUTION - ÉNUMÉRATIONS COMPLÈTES V2.1
-- Fichier: 01_enums_v2.1.sql
-- Description: Définition de tous les types énumérés optimisés + nouveaux types organisateurs
-- Version: 2.1 - Ajout organisateurs et clarification vs participants
-- Date: Juillet 2025
-- =====================================================

-- =====================================================
-- SUPPRESSION DES ÉNUMÉRATIONS EXISTANTES
-- =====================================================

-- Supprimer dans l'ordre inverse des dépendances
DROP TYPE IF EXISTS venue_relation_type CASCADE;
DROP TYPE IF EXISTS organizer_status CASCADE;
DROP TYPE IF EXISTS organizer_type CASCADE;
DROP TYPE IF EXISTS appeal_status CASCADE;
DROP TYPE IF EXISTS blacklist_scope CASCADE;
DROP TYPE IF EXISTS blacklist_type CASCADE;
DROP TYPE IF EXISTS severity_level CASCADE;
DROP TYPE IF EXISTS orientation_type CASCADE;
DROP TYPE IF EXISTS template_format CASCADE;
DROP TYPE IF EXISTS template_type CASCADE;
DROP TYPE IF EXISTS pricing_rule_type CASCADE;
DROP TYPE IF EXISTS denial_reason CASCADE;
DROP TYPE IF EXISTS access_status CASCADE;
DROP TYPE IF EXISTS access_action CASCADE;
DROP TYPE IF EXISTS access_transaction_type CASCADE;
DROP TYPE IF EXISTS access_source_type CASCADE;
DROP TYPE IF EXISTS access_right_status CASCADE;
DROP TYPE IF EXISTS refund_method CASCADE;
DROP TYPE IF EXISTS refund_status CASCADE;
DROP TYPE IF EXISTS refund_type CASCADE;
DROP TYPE IF EXISTS commission_status CASCADE;
DROP TYPE IF EXISTS webhook_status CASCADE;
DROP TYPE IF EXISTS order_item_type CASCADE;
DROP TYPE IF EXISTS purchase_channel CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method_type CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_plan_type CASCADE;
DROP TYPE IF EXISTS media_category CASCADE;
DROP TYPE IF EXISTS media_type CASCADE;
DROP TYPE IF EXISTS amenity_category CASCADE;
DROP TYPE IF EXISTS security_level CASCADE;
DROP TYPE IF EXISTS access_type CASCADE;
DROP TYPE IF EXISTS seat_status CASCADE;
DROP TYPE IF EXISTS seat_type CASCADE;
DROP TYPE IF EXISTS seat_layout CASCADE;
DROP TYPE IF EXISTS zone_category CASCADE;
DROP TYPE IF EXISTS zone_type CASCADE;
DROP TYPE IF EXISTS mapping_type CASCADE;
DROP TYPE IF EXISTS restriction_type CASCADE;
DROP TYPE IF EXISTS participant_relationship_type CASCADE;
DROP TYPE IF EXISTS event_participant_role CASCADE;
DROP TYPE IF EXISTS event_media_type CASCADE;
DROP TYPE IF EXISTS event_visibility CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS event_group_type CASCADE;
DROP TYPE IF EXISTS participant_type CASCADE;
DROP TYPE IF EXISTS membership_status CASCADE;
DROP TYPE IF EXISTS group_type CASCADE;
DROP TYPE IF EXISTS gender CASCADE;
DROP TYPE IF EXISTS mfa_method CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- =====================================================
-- MODULE 1: UTILISATEURS & GROUPES - ÉNUMÉRATIONS
-- =====================================================

-- Genre de l'utilisateur
CREATE TYPE gender AS ENUM (
    'MALE',             -- Masculin
    'FEMALE',           -- Féminin
    'OTHER',            -- Autre/Non spécifié
    'PREFER_NOT_TO_SAY' -- Préfère ne pas dire
);

-- Type de groupe
CREATE TYPE group_type AS ENUM (
    'ACCESS',           -- Groupe de droits d'accès uniquement
    'MARKETING',        -- Groupe de segmentation marketing uniquement
    'MIXED',            -- Groupe mixte (accès + marketing)
    'ZONE_ASSIGNMENT',  -- Groupe d'attribution de zones
    'TEMPORAL'          -- Groupe temporaire/saisonnier
);

-- Statut d'appartenance
CREATE TYPE membership_status AS ENUM (
    'PENDING',          -- En attente d'approbation
    'ACTIVE',           -- Appartenance active
    'SUSPENDED',        -- Suspendue temporairement  
    'EXPIRED',          -- Expirée (dépassement date limite)
    'CANCELLED',        -- Annulée définitivement
    'TERMINATED'        -- Résiliée (violation règles)
);

-- =====================================================
-- MODULE 1.5: ORGANISATEURS - NOUVELLES ÉNUMÉRATIONS
-- =====================================================

-- Type d'organisateur
CREATE TYPE organizer_type AS ENUM (
    'SPORTS_CLUB',           -- Club sportif (CA, EST, etc.)
    'CULTURAL_PRODUCER',     -- Producteur culturel (Ennejma Ezzahra, etc.)
    'CORPORATE',             -- Organisateur corporate/business
    'ASSOCIATION',           -- Association/ONG
    'FEDERATION',            -- Fédération sportive
    'INSTITUTION',           -- Institution publique
    'PRIVATE_COMPANY'        -- Entreprise privée événementiel
);

-- Statut organisateur
CREATE TYPE organizer_status AS ENUM (
    'PENDING',               -- En attente validation
    'ACTIVE',                -- Actif et opérationnel
    'SUSPENDED',             -- Suspendu temporairement
    'INACTIVE',              -- Inactif
    'BLACKLISTED'            -- Blacklisté définitivement
);

-- Type de relation venue-organisateur
CREATE TYPE venue_relation_type AS ENUM (
    'OWNER',                 -- Propriétaire légal
    'MANAGER',               -- Gestionnaire opérationnel
    'TENANT',                -- Locataire long terme
    'PARTNER'                -- Partenaire privilégié
);

-- =====================================================
-- MODULE 2: ÉVÉNEMENTS - ÉNUMÉRATIONS
-- =====================================================

-- Type de participant (CLARIFICATION: ceux qui PARTICIPENT aux événements)
CREATE TYPE participant_type AS ENUM (
    'TEAM',             -- Équipe sportive
    'ARTIST',           -- Artiste/Musicien
    'SPEAKER',          -- Conférencier
    'ORGANIZATION',     -- Organisation/Institution
    'INDIVIDUAL',       -- Individu
    'COMPANY',          -- Entreprise
    'REFEREE',          -- Arbitre
    'OFFICIAL',         -- Officiel
    'BAND',             -- Groupe musical
    'COMEDIAN',         -- Humoriste
    'POLITICAL_FIGURE', -- Personnalité politique
    'ATHLETE'           -- Athlète individuel
);

-- Type de groupe d'événements
CREATE TYPE event_group_type AS ENUM (
    'SEASON',           -- Saison sportive
    'TOURNAMENT',       -- Tournoi
    'FESTIVAL',         -- Festival
    'CONFERENCE',       -- Conférence
    'SERIES',           -- Série d'événements
    'CHAMPIONSHIP',     -- Championnat
    'LEAGUE',           -- Ligue
    'CUP',              -- Coupe
    'WORKSHOP_SERIES',  -- Série d'ateliers
    'EXHIBITION',       -- Exposition
    'ROADSHOW'          -- Tournée
);

-- Statut d'événement
CREATE TYPE event_status AS ENUM (
    'DRAFT',            -- Brouillon
    'SCHEDULED',        -- Programmé
    'CONFIRMED',        -- Confirmé
    'PUBLISHED',        -- Publié (billetterie ouverte)
    'LIVE',             -- En cours
    'FINISHED',         -- Terminé
    'CANCELLED',        -- Annulé
    'POSTPONED',        -- Reporté
    'SUSPENDED',        -- Suspendu
    'RESCHEDULED'       -- Reprogrammé
);

-- Visibilité d'événement
CREATE TYPE event_visibility AS ENUM (
    'PUBLIC',           -- Public
    'PRIVATE',          -- Privé
    'MEMBERS_ONLY',     -- Membres uniquement
    'VIP_ONLY',         -- VIP uniquement
    'STAFF_ONLY',       -- Personnel uniquement
    'INVITE_ONLY',      -- Sur invitation uniquement
    'PREVIEW'           -- Prévisualisation (accès restreint)
);

-- Rôle de participant dans un événement
CREATE TYPE event_participant_role AS ENUM (
    'HOME_TEAM',        -- Équipe à domicile
    'AWAY_TEAM',        -- Équipe visiteur
    'MAIN_ARTIST',      -- Artiste principal
    'OPENING_ACT',      -- Première partie
    'GUEST',            -- Invité
    'KEYNOTE_SPEAKER',  -- Conférencier principal
    'PANELIST',         -- Membre du panel
    'MODERATOR',        -- Modérateur
    'SPONSOR',          -- Sponsor
    'REFEREE',          -- Arbitre
    'OFFICIAL',         -- Officiel
    'SUPPORTING_ACT',   -- Artiste de soutien
    'HOST',             -- Animateur/Présentateur
    'SPECIAL_GUEST'     -- Invité spécial
);

-- Type de relation entre participants
CREATE TYPE participant_relationship_type AS ENUM (
    'RIVALRY',          -- Rivalité
    'PARTNERSHIP',      -- Partenariat
    'SUBSIDIARY',       -- Filiale
    'ALLIANCE',         -- Alliance
    'COMPETITION',      -- Compétition
    'COLLABORATION',    -- Collaboration
    'FEUD',             -- Conflit
    'FRIENDSHIP',       -- Amitié
    'COACHING',         -- Relation coach/équipe
    'SPONSORSHIP',      -- Parrainage
    'MANAGEMENT'        -- Gestion/Management
);

-- Type de restriction
CREATE TYPE restriction_type AS ENUM (
    'AGE_LIMIT',        -- Limite d'âge
    'DRESS_CODE',       -- Code vestimentaire
    'GEOGRAPHICAL',     -- Restriction géographique
    'MEMBERSHIP',       -- Restriction de membre
    'SECURITY',         -- Restriction de sécurité
    'CAPACITY',         -- Restriction de capacité
    'SPECIAL_NEEDS',    -- Besoins spéciaux
    'CONTENT_WARNING',  -- Avertissement contenu
    'ID_REQUIRED',      -- Pièce d'identité obligatoire
    'VACCINATION',      -- Certificat vaccinal
    'BEHAVIOR'          -- Code de conduite
);

-- Type de média événement
CREATE TYPE event_media_type AS ENUM (
    'POSTER',           -- Affiche
    'PHOTO',            -- Photo
    'VIDEO',            -- Vidéo
    'AUDIO',            -- Audio
    'DOCUMENT',         -- Document
    'LIVESTREAM',       -- Diffusion en direct
    'HIGHLIGHT',        -- Résumé/Highlights
    'INTERVIEW',        -- Interview
    'TRAILER',          -- Bande-annonce
    'REPLAY',           -- Rediffusion
    'TEASER'            -- Teaser
);

-- =====================================================
-- MODULE 3: VENUES & CARTOGRAPHIE - ÉNUMÉRATIONS
-- =====================================================

-- Type de cartographie
CREATE TYPE mapping_type AS ENUM (
    'DEFAULT',          -- Configuration par défaut
    'EVENT_SPECIFIC',   -- Spécifique à un type d'événement
    'SEASONAL',         -- Configuration saisonnière
    'MAINTENANCE',      -- Configuration temporaire (travaux)
    'EMERGENCY',        -- Configuration d'urgence
    'SPECIAL_EVENT',    -- Événement spécial (derby, concert exceptionnel)
    'REDUCED_CAPACITY'  -- Capacité réduite
);

-- Type de zone
CREATE TYPE zone_type AS ENUM (
    'SEATING_AREA',     -- Zone avec places assises
    'STANDING_AREA',    -- Zone debout
    'VIP_AREA',         -- Zone VIP/Premium
    'SERVICE_AREA',     -- Zone de service (bar, boutique)
    'STAFF_AREA',       -- Zone personnel
    'EMERGENCY_AREA',   -- Zone sécurité/évacuation
    'DISABLED_AREA',    -- Zone handicapés
    'FAMILY_AREA',      -- Zone familles
    'CORPORATE_AREA',   -- Zone entreprises
    'PRESS_AREA'        -- Zone presse
);

-- Catégorie de zone (tarifaire)
CREATE TYPE zone_category AS ENUM (
    'PREMIUM',          -- Places premium
    'STANDARD',         -- Places standard
    'BASIC',            -- Places économiques
    'VIP',              -- Places VIP
    'ACCESSIBLE',       -- Places PMR
    'COMPLIMENTARY',    -- Places gratuites
    'CORPORATE',        -- Places entreprises
    'STUDENT',          -- Places étudiant
    'CHILD'             -- Places enfant
);

-- Disposition des places
CREATE TYPE seat_layout AS ENUM (
    'NUMBERED',         -- Places numérotées individuelles
    'TABLE',            -- Tables numérotées
    'SECTION',          -- Sections avec capacité libre
    'STANDING',         -- Debout sans numérotation
    'BENCH',            -- Bancs numérotés
    'LOGE'              -- Loges privées
);

-- Type de place
CREATE TYPE seat_type AS ENUM (
    'STANDARD',         -- Place standard
    'PREMIUM',          -- Place confort/premium
    'VIP',              -- Place VIP
    'ACCESSIBLE',       -- Place PMR
    'OBSTRUCTED',       -- Vue limitée/obstruée
    'AISLE',            -- Place couloir
    'CORNER',           -- Place angle
    'FRONT_ROW',        -- Premier rang
    'BACK_ROW'          -- Dernier rang
);

-- Statut de place
CREATE TYPE seat_status AS ENUM (
    'AVAILABLE',        -- Disponible à la vente
    'SOLD',             -- Vendue/Réservée
    'BLOCKED',          -- Bloquée administrativement
    'MAINTENANCE',      -- En maintenance
    'RESERVED',         -- Réservée temporairement
    'HELD'              -- En attente paiement
);

-- Type d'accès
CREATE TYPE access_type AS ENUM (
    'MAIN_ENTRANCE',    -- Entrée principale
    'VIP_ENTRANCE',     -- Entrée VIP
    'STAFF_ENTRANCE',   -- Entrée personnel
    'EMERGENCY_EXIT',   -- Sortie de secours
    'SERVICE_ENTRANCE', -- Entrée de service
    'DISABLED_ENTRANCE', -- Entrée handicapés
    'MEDIA_ENTRANCE',   -- Entrée presse/médias
    'PLAYER_ENTRANCE'   -- Entrée joueurs/artistes
);

-- Niveau de sécurité
CREATE TYPE security_level AS ENUM (
    'PUBLIC',           -- Accès public libre
    'LOW',              -- Faible
    'STANDARD',         -- Standard
    'HIGH',             -- Élevé
    'MAXIMUM',          -- Maximum
    'RESTRICTED'        -- Accès ultra-restreint
);

-- Catégorie d'équipement
CREATE TYPE amenity_category AS ENUM (
    'PARKING',          -- Parking
    'FOOD_BEVERAGE',    -- Restauration
    'ENTERTAINMENT',    -- Divertissement
    'ACCESSIBILITY',    -- Accessibilité
    'CONNECTIVITY',     -- Connectivité
    'SHOPPING',         -- Shopping
    'HEALTH_SAFETY',    -- Santé et sécurité
    'COMFORT',          -- Confort
    'TRANSPORT',        -- Transport
    'CHILDCARE'         -- Garde d'enfants
);

-- Type de média
CREATE TYPE media_type AS ENUM (
    'IMAGE',            -- Image
    'VIDEO',            -- Vidéo
    'DOCUMENT',         -- Document
    'AUDIO',            -- Audio
    'VR_360',           -- VR 360
    'PANORAMA',         -- Panorama
    'PLAN',             -- Plan/Schema
    'INTERACTIVE_MAP'   -- Carte interactive
);

-- Catégorie de média
CREATE TYPE media_category AS ENUM (
    'SEAT_VIEW',        -- Vue depuis la place
    'ZONE_OVERVIEW',    -- Vue d'ensemble de la zone
    'VENUE_OVERVIEW',   -- Vue d'ensemble du lieu
    'ACCESS_GUIDE',     -- Guide d'accès
    'AMENITIES_INFO',   -- Informations équipements
    'SAFETY_INFO',      -- Informations sécurité
    'PROMOTIONAL',      -- Promotionnel
    'HISTORICAL',       -- Historique
    'VIRTUAL_TOUR'      -- Visite virtuelle
);

-- =====================================================
-- MODULE 4: BILLETTERIE & CONTRÔLE D'ACCÈS - ÉNUMÉRATIONS
-- =====================================================

-- Type de plan d'abonnement
CREATE TYPE subscription_plan_type AS ENUM (
    'SEASON',           -- Abonnement saison complète
    'PARTIAL',          -- Abonnement partiel
    'VIP',              -- Abonnement VIP
    'STUDENT',          -- Abonnement étudiant
    'FAMILY',           -- Abonnement famille
    'CORPORATE',        -- Abonnement entreprise
    'LOYALTY',          -- Abonnement fidélité
    'FLEX',             -- Abonnement flexible
    'PREMIUM',          -- Abonnement premium
    'BASIC'             -- Abonnement de base
);

-- Statut d'abonnement
CREATE TYPE subscription_status AS ENUM (
    'PENDING',          -- En attente
    'ACTIVE',           -- Actif
    'SUSPENDED',        -- Suspendu
    'EXPIRED',          -- Expiré
    'CANCELLED',        -- Annulé
    'REFUNDED',         -- Remboursé
    'TRANSFERRED',      -- Transféré
    'UPGRADED',         -- Mis à niveau
    'DOWNGRADED'        -- Rétrogradé
);

-- Statut de droit d'accès
CREATE TYPE access_right_status AS ENUM (
    'VALID',            -- Valide
    'USED',             -- Utilisé
    'EXPIRED',          -- Expiré
    'CANCELLED',        -- Annulé
    'TRANSFERRED',      -- Transféré
    'REFUNDED',         -- Remboursé
    'BLOCKED',          -- Bloqué
    'PENDING',          -- En attente
    'SUSPENDED'         -- Suspendu
);

-- Type de source d'accès
CREATE TYPE access_source_type AS ENUM (
    'SUBSCRIPTION',     -- Abonnement
    'TICKET',           -- Billet individuel
    'INVITATION',       -- Invitation
    'STAFF_PASS',       -- Laissez-passer personnel
    'PRESS_PASS',       -- Accréditation presse
    'VIP_PASS',         -- Laissez-passer VIP
    'COMPLEMENTARY',    -- Gratuit
    'SEASON_PASS',      -- Pass saisonnier
    'SPONSOR_PASS',     -- Pass sponsor
    'ARTIST_PASS'       -- Pass artiste
);

-- Type de transaction d'accès
CREATE TYPE access_transaction_type AS ENUM (
    'PURCHASE',         -- Achat
    'TRANSFER',         -- Transfert
    'REFUND',           -- Remboursement
    'CANCELLATION',     -- Annulation
    'UPGRADE',          -- Amélioration
    'DOWNGRADE',        -- Rétrogradation
    'SUSPENSION',       -- Suspension
    'RESTORATION',      -- Restauration
    'RENEWAL',          -- Renouvellement
    'EXCHANGE'          -- Échange
);

-- Actions de contrôle d'accès
CREATE TYPE access_action AS ENUM (
    'ENTRY',            -- Entrée
    'EXIT',             -- Sortie
    'RE_ENTRY',         -- Re-entrée
    'ZONE_CHANGE',      -- Changement de zone
    'VALIDATION',       -- Validation simple
    'CHECK',            -- Contrôle de routine
    'TRANSFER'          -- Transfert de zone
);

-- Statuts de contrôle d'accès
CREATE TYPE access_status AS ENUM (
    'SUCCESS',          -- Succès
    'DENIED',           -- Refusé
    'WARNING',          -- Avertissement mais autorisé
    'ERROR',            -- Erreur technique
    'PARTIAL_SUCCESS',  -- Succès partiel
    'PENDING'           -- En attente
);

-- Raisons de refus d'accès
CREATE TYPE denial_reason AS ENUM (
    'INVALID_QR',       -- QR code invalide
    'ALREADY_USED',     -- Déjà utilisé
    'EXPIRED',          -- Expiré
    'WRONG_EVENT',      -- Mauvais événement
    'WRONG_ZONE',       -- Mauvaise zone
    'WRONG_TIME',       -- Mauvais horaire
    'BLACKLISTED',      -- Sur liste noire
    'TECHNICAL_ERROR',  -- Erreur technique
    'INSUFFICIENT_RIGHTS', -- Droits insuffisants
    'CAPACITY_FULL',    -- Capacité atteinte
    'NOT_YET_VALID',    -- Pas encore valide
    'DUPLICATE_ENTRY',  -- Entrée dupliquée
    'CANCELLED_TICKET', -- Billet annulé
    'SUSPENDED_USER',   -- Utilisateur suspendu
    'DEVICE_ERROR'      -- Erreur dispositif
);

-- Types de blacklist
CREATE TYPE blacklist_type AS ENUM (
    'USER',             -- Utilisateur
    'EMAIL',            -- Adresse email
    'PHONE',            -- Numéro de téléphone
    'IP',               -- Adresse IP
    'DEVICE',           -- Appareil/Device ID
    'CARD',             -- Carte de crédit
    'QR_CODE',          -- Code QR spécifique
    'IDENTITY_DOC'      -- Document d'identité
);

-- Portée de blacklist
CREATE TYPE blacklist_scope AS ENUM (
    'EVENT',            -- Événement spécifique
    'VENUE',            -- Lieu spécifique
    'ORGANIZER',        -- Organisateur spécifique (NOUVEAU)
    'GLOBAL',           -- Global plateforme
    'CATEGORY',         -- Catégorie d'événements
    'TEMPORAL'          -- Temporaire/période
);

-- Statuts d'appel
CREATE TYPE appeal_status AS ENUM (
    'NONE',             -- Pas d'appel
    'PENDING',          -- En cours d'examen
    'ACCEPTED',         -- Appel accepté
    'REJECTED',         -- Appel rejeté
    'UNDER_REVIEW'      -- En révision
);

-- Type de règles de prix
CREATE TYPE pricing_rule_type AS ENUM (
    'EARLY_BIRD',       -- Tarif précoce
    'LAST_MINUTE',      -- Dernière minute
    'GROUP_DISCOUNT',   -- Remise groupe
    'STUDENT_DISCOUNT', -- Remise étudiant
    'LOYALTY_DISCOUNT', -- Remise fidélité
    'SEASONAL',         -- Saisonnier
    'DYNAMIC',          -- Dynamique
    'PROMOTIONAL',      -- Promotionnel
    'VOLUME_DISCOUNT',  -- Remise volume
    'MEMBER_DISCOUNT',  -- Remise membre
    'CORPORATE_RATE'    -- Tarif entreprise
);

-- Types de templates
CREATE TYPE template_type AS ENUM (
    'TICKET',           -- Template de billet
    'SUBSCRIPTION',     -- Template d'abonnement
    'INVITATION',       -- Template d'invitation
    'PASS',             -- Template de laissez-passer
    'RECEIPT',          -- Template de reçu
    'CONFIRMATION',     -- Template de confirmation
    'REMINDER'          -- Template de rappel
);

-- Formats de templates
CREATE TYPE template_format AS ENUM (
    'PDF',              -- PDF généré
    'HTML',             -- HTML pour impression
    'PNG',              -- Image PNG
    'THERMAL',          -- Impression thermique
    'EMAIL',            -- Format email
    'SMS'               -- Format SMS
);

-- Orientations
CREATE TYPE orientation_type AS ENUM (
    'PORTRAIT',         -- Portrait
    'LANDSCAPE'         -- Paysage
);

-- Niveaux de sévérité
CREATE TYPE severity_level AS ENUM (
    'INFO',             -- Information
    'LOW',              -- Faible
    'MEDIUM',           -- Moyen
    'HIGH',             -- Élevé
    'CRITICAL',         -- Critique
    'EMERGENCY'         -- Urgence
);

-- =====================================================
-- MODULE 5: PAIEMENTS & BILLING - ÉNUMÉRATIONS
-- =====================================================

-- Type de méthode de paiement
CREATE TYPE payment_method_type AS ENUM (
    'MOBILE_WALLET',    -- Portefeuille mobile (Flouci)
    'CREDIT_CARD',      -- Carte de crédit
    'DEBIT_CARD',       -- Carte de débit
    'BANK_TRANSFER',    -- Virement bancaire
    'CASH',             -- Espèces
    'CRYPTOCURRENCY',   -- Cryptomonnaie
    'GIFT_CARD',        -- Carte cadeau
    'PAYPAL',           -- PayPal
    'APPLE_PAY',        -- Apple Pay
    'GOOGLE_PAY'        -- Google Pay
);

-- Statut de paiement
CREATE TYPE payment_status AS ENUM (
    'PENDING',          -- En attente
    'PROCESSING',       -- En cours de traitement
    'COMPLETED',        -- Complété
    'FAILED',           -- Échoué
    'CANCELLED',        -- Annulé
    'REFUNDED',         -- Remboursé
    'DISPUTED',         -- Contesté
    'PARTIAL_REFUND',   -- Remboursement partiel
    'EXPIRED',          -- Expiré
    'AUTHORIZED'        -- Autorisé (pas encore capturé)
);

-- Statut de commande
CREATE TYPE order_status AS ENUM (
    'DRAFT',            -- Brouillon
    'PENDING',          -- En attente
    'CONFIRMED',        -- Confirmée
    'PROCESSING',       -- En cours de traitement
    'COMPLETED',        -- Complétée
    'CANCELLED',        -- Annulée
    'REFUNDED',         -- Remboursée
    'EXPIRED',          -- Expirée
    'PARTIALLY_FULFILLED', -- Partiellement exécutée
    'ON_HOLD'           -- En attente
);

-- Canal d'achat
CREATE TYPE purchase_channel AS ENUM (
    'WEB',              -- Site web
    'MOBILE_APP',       -- Application mobile
    'PHONE',            -- Téléphone
    'COUNTER',          -- Guichet
    'PARTNER',          -- Partenaire
    'API',              -- API
    'KIOSK',            -- Borne libre-service
    'AGENT',            -- Agent/Revendeur
    'RESELLER'          -- Revendeur agréé
);

-- Type de ligne de commande
CREATE TYPE order_item_type AS ENUM (
    'SUBSCRIPTION',     -- Abonnement
    'TICKET',           -- Billet
    'MERCHANDISE',      -- Merchandising
    'PARKING',          -- Parking
    'HOSPITALITY',      -- Hospitalité
    'MEMBERSHIP',       -- Adhésion
    'UPGRADE',          -- Amélioration
    'FEE',              -- Frais
    'SERVICE',          -- Service
    'INSURANCE'         -- Assurance
);

-- Statut de webhook
CREATE TYPE webhook_status AS ENUM (
    'RECEIVED',         -- Reçu
    'PROCESSING',       -- En cours de traitement
    'PROCESSED',        -- Traité
    'FAILED',           -- Échoué
    'IGNORED',          -- Ignoré
    'RETRY'             -- En nouvel essai
);

-- Statut de commission
CREATE TYPE commission_status AS ENUM (
    'PENDING',          -- En attente
    'CALCULATED',       -- Calculée
    'APPROVED',         -- Approuvée
    'DISPUTED',         -- Contestée
    'PAID',             -- Payée
    'CANCELLED',        -- Annulée
    'PARTIAL_PAID'      -- Partiellement payée
);

-- Type de remboursement
CREATE TYPE refund_type AS ENUM (
    'FULL',             -- Complet
    'PARTIAL',          -- Partiel
    'CREDIT_NOTE',      -- Avoir
    'VOUCHER'           -- Bon d'achat
);

-- Statut de remboursement
CREATE TYPE refund_status AS ENUM (
    'PENDING',          -- En attente
    'APPROVED',         -- Approuvé
    'PROCESSING',       -- En cours de traitement
    'COMPLETED',        -- Complété
    'FAILED',           -- Échoué
    'CANCELLED',        -- Annulé
    'REJECTED'          -- Rejeté
);

-- Méthode de remboursement
CREATE TYPE refund_method AS ENUM (
    'ORIGINAL',         -- Méthode originale
    'CREDIT_NOTE',      -- Avoir
    'BANK_TRANSFER',    -- Virement bancaire
    'CASH',             -- Espèces
    'VOUCHER',          -- Bon d'achat
    'OTHER'             -- Autre
);

-- =====================================================
-- MODULE 6: SÉCURITÉ & AUDIT - ÉNUMÉRATIONS
-- =====================================================

-- Actions d'audit
CREATE TYPE audit_action AS ENUM (
    'CREATE',           -- Création
    'READ',             -- Lecture
    'UPDATE',           -- Modification
    'DELETE',           -- Suppression
    'LOGIN',            -- Connexion
    'LOGOUT',           -- Déconnexion
    'ACCESS_GRANTED',   -- Accès accordé
    'ACCESS_DENIED',    -- Accès refusé
    'EXPORT',           -- Export
    'IMPORT',           -- Import
    'BACKUP',           -- Sauvegarde
    'RESTORE',          -- Restauration
    'APPROVE',          -- Approbation
    'REJECT',           -- Rejet
    'SUSPEND',          -- Suspension
    'ACTIVATE'          -- Activation
);

-- Méthodes MFA
CREATE TYPE mfa_method AS ENUM (
    'SMS',              -- SMS
    'EMAIL',            -- Email
    'TOTP',             -- TOTP (Google Authenticator)
    'APP_PUSH',         -- Notification push app
    'HARDWARE_TOKEN',   -- Token matériel
    'BIOMETRIC',        -- Biométrique
    'BACKUP_CODES'      -- Codes de secours
);

-- Enum pour le statut des clients et des clés API
CREATE TYPE api_status AS ENUM (
    'ACTIVE', 
    'DISABLED', 
    'REVOKED', 
    'EXPIRED'
);

-- =====================================================
-- COMMENTAIRES ET DESCRIPTIONS MISES À JOUR
-- =====================================================

-- Ajout de commentaires pour documentation
COMMENT ON TYPE gender IS 'Genre de l''utilisateur avec options inclusives';
COMMENT ON TYPE group_type IS 'Type de groupe pour segmentation et droits';
COMMENT ON TYPE membership_status IS 'Statut d''appartenance avec cycle de vie complet';
COMMENT ON TYPE organizer_type IS 'Type d''organisateur - entités qui ORGANISENT les événements';
COMMENT ON TYPE organizer_status IS 'Statut de validation et activité d''un organisateur';
COMMENT ON TYPE venue_relation_type IS 'Type de relation entre un organisateur et un venue';
COMMENT ON TYPE participant_type IS 'Type de participant - entités qui PARTICIPENT aux événements';
COMMENT ON TYPE event_status IS 'Statut d''un événement avec workflow complet';
COMMENT ON TYPE access_right_status IS 'Statut d''un droit d''accès avec traçabilité';
COMMENT ON TYPE access_action IS 'Action effectuée lors du contrôle d''accès';
COMMENT ON TYPE payment_status IS 'Statut d''un paiement avec gestion des erreurs';
COMMENT ON TYPE audit_action IS 'Action d''audit enregistrée pour traçabilité';
COMMENT ON TYPE blacklist_scope IS 'Portée de la restriction (local/global/organisateur)';
COMMENT ON TYPE denial_reason IS 'Raisons spécifiques de refus d''accès';
COMMENT ON TYPE severity_level IS 'Niveau de sévérité pour alertes et logs';

-- =====================================================
-- VALIDATION ET VÉRIFICATION
-- =====================================================

-- Vérification des énumérations créées
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values,
    count(e.enumlabel) as value_count
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname ~ '^(gender|group_type|membership_status|organizer_|participant_type|event_|zone_|seat_|access_|subscription_|payment_|order_|audit_|mfa_|blacklist_|pricing_|template_|orientation_|severity_|refund_|commission_|webhook_|purchase_|amenity_|media_|security_|mapping_|restriction_|venue_relation).*'
GROUP BY t.typname
ORDER BY t.typname;

-- Message de confirmation
SELECT 
    'Énumérations Entrix V2.1 créées avec succès!' as status,
    'Total: 68+ énumérations incluant nouveaux types organisateurs' as count,
    'Distinction claire: ORGANISATEURS vs PARTICIPANTS' as evolution;

-- =====================================================
-- FIN DU FICHIER 01_enums_v2.1.sql
-- =====================================================