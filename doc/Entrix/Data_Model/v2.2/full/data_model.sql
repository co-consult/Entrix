--
-- PostgreSQL database dump
--

-- Dumped from database version 17.3 (Debian 17.3-3.pgdg120+1)
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: access_action; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.access_action AS ENUM (
    'ENTRY',
    'EXIT',
    'RE_ENTRY',
    'ZONE_CHANGE',
    'VALIDATION',
    'CHECK',
    'TRANSFER'
);


ALTER TYPE public.access_action OWNER TO admin;

--
-- Name: TYPE access_action; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.access_action IS 'Action effectuée lors du contrôle d''accès';


--
-- Name: access_right_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.access_right_status AS ENUM (
    'VALID',
    'USED',
    'EXPIRED',
    'CANCELLED',
    'TRANSFERRED',
    'REFUNDED',
    'BLOCKED',
    'PENDING',
    'SUSPENDED'
);


ALTER TYPE public.access_right_status OWNER TO admin;

--
-- Name: TYPE access_right_status; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.access_right_status IS 'Statut d''un droit d''accès avec traçabilité';


--
-- Name: access_source_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.access_source_type AS ENUM (
    'SUBSCRIPTION',
    'TICKET',
    'INVITATION',
    'STAFF_PASS',
    'PRESS_PASS',
    'VIP_PASS',
    'COMPLEMENTARY',
    'SEASON_PASS',
    'SPONSOR_PASS',
    'ARTIST_PASS'
);


ALTER TYPE public.access_source_type OWNER TO admin;

--
-- Name: access_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.access_status AS ENUM (
    'SUCCESS',
    'DENIED',
    'WARNING',
    'ERROR',
    'PARTIAL_SUCCESS',
    'PENDING'
);


ALTER TYPE public.access_status OWNER TO admin;

--
-- Name: access_transaction_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.access_transaction_type AS ENUM (
    'PURCHASE',
    'TRANSFER',
    'REFUND',
    'CANCELLATION',
    'UPGRADE',
    'DOWNGRADE',
    'SUSPENSION',
    'RESTORATION',
    'RENEWAL',
    'EXCHANGE'
);


ALTER TYPE public.access_transaction_type OWNER TO admin;

--
-- Name: access_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.access_type AS ENUM (
    'MAIN_ENTRANCE',
    'VIP_ENTRANCE',
    'STAFF_ENTRANCE',
    'EMERGENCY_EXIT',
    'SERVICE_ENTRANCE',
    'DISABLED_ENTRANCE',
    'MEDIA_ENTRANCE',
    'PLAYER_ENTRANCE'
);


ALTER TYPE public.access_type OWNER TO admin;

--
-- Name: amenity_category; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.amenity_category AS ENUM (
    'PARKING',
    'FOOD_BEVERAGE',
    'ENTERTAINMENT',
    'ACCESSIBILITY',
    'CONNECTIVITY',
    'SHOPPING',
    'HEALTH_SAFETY',
    'COMFORT',
    'TRANSPORT',
    'CHILDCARE'
);


ALTER TYPE public.amenity_category OWNER TO admin;

--
-- Name: api_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.api_status AS ENUM (
    'ACTIVE',
    'DISABLED',
    'REVOKED',
    'EXPIRED'
);


ALTER TYPE public.api_status OWNER TO admin;

--
-- Name: appeal_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.appeal_status AS ENUM (
    'NONE',
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'UNDER_REVIEW'
);


ALTER TYPE public.appeal_status OWNER TO admin;

--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.audit_action AS ENUM (
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'ACCESS_GRANTED',
    'ACCESS_DENIED',
    'EXPORT',
    'IMPORT',
    'BACKUP',
    'RESTORE',
    'APPROVE',
    'REJECT',
    'SUSPEND',
    'ACTIVATE'
);


ALTER TYPE public.audit_action OWNER TO admin;

--
-- Name: TYPE audit_action; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.audit_action IS 'Action d''audit enregistrée pour traçabilité';


--
-- Name: blacklist_scope; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.blacklist_scope AS ENUM (
    'EVENT',
    'VENUE',
    'ORGANIZER',
    'GLOBAL',
    'CATEGORY',
    'TEMPORAL'
);


ALTER TYPE public.blacklist_scope OWNER TO admin;

--
-- Name: TYPE blacklist_scope; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.blacklist_scope IS 'Portée de la restriction (local/global/organisateur)';


--
-- Name: blacklist_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.blacklist_type AS ENUM (
    'USER',
    'EMAIL',
    'PHONE',
    'IP',
    'DEVICE',
    'CARD',
    'QR_CODE',
    'IDENTITY_DOC'
);


ALTER TYPE public.blacklist_type OWNER TO admin;

--
-- Name: commission_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.commission_status AS ENUM (
    'PENDING',
    'CALCULATED',
    'APPROVED',
    'DISPUTED',
    'PAID',
    'CANCELLED',
    'PARTIAL_PAID'
);


ALTER TYPE public.commission_status OWNER TO admin;

--
-- Name: denial_reason; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.denial_reason AS ENUM (
    'INVALID_QR',
    'ALREADY_USED',
    'EXPIRED',
    'WRONG_EVENT',
    'WRONG_ZONE',
    'WRONG_TIME',
    'BLACKLISTED',
    'TECHNICAL_ERROR',
    'INSUFFICIENT_RIGHTS',
    'CAPACITY_FULL',
    'NOT_YET_VALID',
    'DUPLICATE_ENTRY',
    'CANCELLED_TICKET',
    'SUSPENDED_USER',
    'DEVICE_ERROR'
);


ALTER TYPE public.denial_reason OWNER TO admin;

--
-- Name: TYPE denial_reason; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.denial_reason IS 'Raisons spécifiques de refus d''accès';


--
-- Name: event_group_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.event_group_type AS ENUM (
    'SEASON',
    'TOURNAMENT',
    'FESTIVAL',
    'CONFERENCE',
    'SERIES',
    'CHAMPIONSHIP',
    'LEAGUE',
    'CUP',
    'WORKSHOP_SERIES',
    'EXHIBITION',
    'ROADSHOW'
);


ALTER TYPE public.event_group_type OWNER TO admin;

--
-- Name: event_media_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.event_media_type AS ENUM (
    'POSTER',
    'PHOTO',
    'VIDEO',
    'AUDIO',
    'DOCUMENT',
    'LIVESTREAM',
    'HIGHLIGHT',
    'INTERVIEW',
    'TRAILER',
    'REPLAY',
    'TEASER'
);


ALTER TYPE public.event_media_type OWNER TO admin;

--
-- Name: event_participant_role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.event_participant_role AS ENUM (
    'HOME_TEAM',
    'AWAY_TEAM',
    'MAIN_ARTIST',
    'OPENING_ACT',
    'GUEST',
    'KEYNOTE_SPEAKER',
    'PANELIST',
    'MODERATOR',
    'SPONSOR',
    'REFEREE',
    'OFFICIAL',
    'SUPPORTING_ACT',
    'HOST',
    'SPECIAL_GUEST'
);


ALTER TYPE public.event_participant_role OWNER TO admin;

--
-- Name: event_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.event_status AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'CONFIRMED',
    'PUBLISHED',
    'LIVE',
    'FINISHED',
    'CANCELLED',
    'POSTPONED',
    'SUSPENDED',
    'RESCHEDULED'
);


ALTER TYPE public.event_status OWNER TO admin;

--
-- Name: TYPE event_status; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.event_status IS 'Statut d''un événement avec workflow complet';


--
-- Name: event_visibility; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.event_visibility AS ENUM (
    'PUBLIC',
    'PRIVATE',
    'MEMBERS_ONLY',
    'VIP_ONLY',
    'STAFF_ONLY',
    'INVITE_ONLY',
    'PREVIEW'
);


ALTER TYPE public.event_visibility OWNER TO admin;

--
-- Name: gender; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.gender AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER',
    'PREFER_NOT_TO_SAY'
);


ALTER TYPE public.gender OWNER TO admin;

--
-- Name: TYPE gender; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.gender IS 'Genre de l''utilisateur avec options inclusives';


--
-- Name: group_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.group_type AS ENUM (
    'ACCESS',
    'MARKETING',
    'MIXED',
    'ZONE_ASSIGNMENT',
    'TEMPORAL'
);


ALTER TYPE public.group_type OWNER TO admin;

--
-- Name: TYPE group_type; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.group_type IS 'Type de groupe pour segmentation et droits';


--
-- Name: identity_document_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.identity_document_type AS ENUM (
    'CIN',
    'PASSPORT',
    'DRIVING_LICENSE',
    'RESIDENCE_PERMIT',
    'MILITARY_ID',
    'STUDENT_ID',
    'PROFESSIONAL_ID',
    'OTHER'
);


ALTER TYPE public.identity_document_type OWNER TO admin;

--
-- Name: TYPE identity_document_type; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.identity_document_type IS 'Types de documents d''identité acceptés pour vérification utilisateur';


--
-- Name: mapping_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.mapping_type AS ENUM (
    'DEFAULT',
    'EVENT_SPECIFIC',
    'SEASONAL',
    'MAINTENANCE',
    'EMERGENCY',
    'SPECIAL_EVENT',
    'REDUCED_CAPACITY'
);


ALTER TYPE public.mapping_type OWNER TO admin;

--
-- Name: media_category; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.media_category AS ENUM (
    'SEAT_VIEW',
    'ZONE_OVERVIEW',
    'VENUE_OVERVIEW',
    'ACCESS_GUIDE',
    'AMENITIES_INFO',
    'SAFETY_INFO',
    'PROMOTIONAL',
    'HISTORICAL',
    'VIRTUAL_TOUR'
);


ALTER TYPE public.media_category OWNER TO admin;

--
-- Name: media_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.media_type AS ENUM (
    'IMAGE',
    'VIDEO',
    'DOCUMENT',
    'AUDIO',
    'VR_360',
    'PANORAMA',
    'PLAN',
    'INTERACTIVE_MAP'
);


ALTER TYPE public.media_type OWNER TO admin;

--
-- Name: membership_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.membership_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'EXPIRED',
    'CANCELLED',
    'TERMINATED'
);


ALTER TYPE public.membership_status OWNER TO admin;

--
-- Name: TYPE membership_status; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.membership_status IS 'Statut d''appartenance avec cycle de vie complet';


--
-- Name: mfa_method; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.mfa_method AS ENUM (
    'SMS',
    'EMAIL',
    'TOTP',
    'APP_PUSH',
    'HARDWARE_TOKEN',
    'BIOMETRIC',
    'BACKUP_CODES'
);


ALTER TYPE public.mfa_method OWNER TO admin;

--
-- Name: order_item_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.order_item_type AS ENUM (
    'SUBSCRIPTION',
    'TICKET',
    'MERCHANDISE',
    'PARKING',
    'HOSPITALITY',
    'MEMBERSHIP',
    'UPGRADE',
    'FEE',
    'SERVICE',
    'INSURANCE'
);


ALTER TYPE public.order_item_type OWNER TO admin;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.order_status AS ENUM (
    'DRAFT',
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED',
    'EXPIRED',
    'PARTIALLY_FULFILLED',
    'ON_HOLD'
);


ALTER TYPE public.order_status OWNER TO admin;

--
-- Name: organizer_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.organizer_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'INACTIVE',
    'BLACKLISTED'
);


ALTER TYPE public.organizer_status OWNER TO admin;

--
-- Name: TYPE organizer_status; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.organizer_status IS 'Statut de validation et activité d''un organisateur';


--
-- Name: organizer_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.organizer_type AS ENUM (
    'SPORTS_CLUB',
    'CULTURAL_PRODUCER',
    'CORPORATE',
    'ASSOCIATION',
    'FEDERATION',
    'INSTITUTION',
    'PRIVATE_COMPANY'
);


ALTER TYPE public.organizer_type OWNER TO admin;

--
-- Name: TYPE organizer_type; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.organizer_type IS 'Type d''organisateur - entités qui ORGANISENT les événements';


--
-- Name: orientation_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.orientation_type AS ENUM (
    'PORTRAIT',
    'LANDSCAPE'
);


ALTER TYPE public.orientation_type OWNER TO admin;

--
-- Name: participant_relationship_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.participant_relationship_type AS ENUM (
    'RIVALRY',
    'PARTNERSHIP',
    'SUBSIDIARY',
    'ALLIANCE',
    'COMPETITION',
    'COLLABORATION',
    'FEUD',
    'FRIENDSHIP',
    'COACHING',
    'SPONSORSHIP',
    'MANAGEMENT'
);


ALTER TYPE public.participant_relationship_type OWNER TO admin;

--
-- Name: participant_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.participant_type AS ENUM (
    'TEAM',
    'ARTIST',
    'SPEAKER',
    'ORGANIZATION',
    'INDIVIDUAL',
    'COMPANY',
    'REFEREE',
    'OFFICIAL',
    'BAND',
    'COMEDIAN',
    'POLITICAL_FIGURE',
    'ATHLETE'
);


ALTER TYPE public.participant_type OWNER TO admin;

--
-- Name: TYPE participant_type; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.participant_type IS 'Type de participant - entités qui PARTICIPENT aux événements';


--
-- Name: payment_method_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.payment_method_type AS ENUM (
    'MOBILE_WALLET',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'CASH',
    'CRYPTOCURRENCY',
    'GIFT_CARD',
    'PAYPAL',
    'APPLE_PAY',
    'GOOGLE_PAY'
);


ALTER TYPE public.payment_method_type OWNER TO admin;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
    'DISPUTED',
    'PARTIAL_REFUND',
    'EXPIRED',
    'AUTHORIZED'
);


ALTER TYPE public.payment_status OWNER TO admin;

--
-- Name: TYPE payment_status; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.payment_status IS 'Statut d''un paiement avec gestion des erreurs';


--
-- Name: persistent_token_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.persistent_token_type AS ENUM (
    'API_KEY',
    'REFRESH_LONG',
    'ACCESS_LONG',
    'MOBILE_SESSION',
    'INTEGRATION'
);


ALTER TYPE public.persistent_token_type OWNER TO admin;

--
-- Name: pricing_rule_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.pricing_rule_type AS ENUM (
    'EARLY_BIRD',
    'LAST_MINUTE',
    'GROUP_DISCOUNT',
    'STUDENT_DISCOUNT',
    'LOYALTY_DISCOUNT',
    'SEASONAL',
    'DYNAMIC',
    'PROMOTIONAL',
    'VOLUME_DISCOUNT',
    'MEMBER_DISCOUNT',
    'CORPORATE_RATE'
);


ALTER TYPE public.pricing_rule_type OWNER TO admin;

--
-- Name: purchase_channel; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.purchase_channel AS ENUM (
    'WEB',
    'MOBILE_APP',
    'PHONE',
    'COUNTER',
    'PARTNER',
    'API',
    'KIOSK',
    'AGENT',
    'RESELLER'
);


ALTER TYPE public.purchase_channel OWNER TO admin;

--
-- Name: refund_method; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.refund_method AS ENUM (
    'ORIGINAL',
    'CREDIT_NOTE',
    'BANK_TRANSFER',
    'CASH',
    'VOUCHER',
    'OTHER'
);


ALTER TYPE public.refund_method OWNER TO admin;

--
-- Name: refund_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.refund_status AS ENUM (
    'PENDING',
    'APPROVED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REJECTED'
);


ALTER TYPE public.refund_status OWNER TO admin;

--
-- Name: refund_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.refund_type AS ENUM (
    'FULL',
    'PARTIAL',
    'CREDIT_NOTE',
    'VOUCHER'
);


ALTER TYPE public.refund_type OWNER TO admin;

--
-- Name: restriction_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.restriction_type AS ENUM (
    'AGE_LIMIT',
    'DRESS_CODE',
    'GEOGRAPHICAL',
    'MEMBERSHIP',
    'SECURITY',
    'CAPACITY',
    'SPECIAL_NEEDS',
    'CONTENT_WARNING',
    'ID_REQUIRED',
    'VACCINATION',
    'BEHAVIOR'
);


ALTER TYPE public.restriction_type OWNER TO admin;

--
-- Name: seat_layout; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.seat_layout AS ENUM (
    'NUMBERED',
    'TABLE',
    'SECTION',
    'STANDING',
    'BENCH',
    'LOGE'
);


ALTER TYPE public.seat_layout OWNER TO admin;

--
-- Name: seat_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.seat_status AS ENUM (
    'AVAILABLE',
    'SOLD',
    'BLOCKED',
    'MAINTENANCE',
    'RESERVED',
    'HELD'
);


ALTER TYPE public.seat_status OWNER TO admin;

--
-- Name: seat_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.seat_type AS ENUM (
    'STANDARD',
    'PREMIUM',
    'VIP',
    'ACCESSIBLE',
    'OBSTRUCTED',
    'AISLE',
    'CORNER',
    'FRONT_ROW',
    'BACK_ROW'
);


ALTER TYPE public.seat_type OWNER TO admin;

--
-- Name: security_level; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.security_level AS ENUM (
    'PUBLIC',
    'LOW',
    'STANDARD',
    'HIGH',
    'MAXIMUM',
    'RESTRICTED'
);


ALTER TYPE public.security_level OWNER TO admin;

--
-- Name: severity_level; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.severity_level AS ENUM (
    'INFO',
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
    'EMERGENCY'
);


ALTER TYPE public.severity_level OWNER TO admin;

--
-- Name: TYPE severity_level; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.severity_level IS 'Niveau de sévérité pour alertes et logs';


--
-- Name: subscription_plan_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.subscription_plan_type AS ENUM (
    'SEASON',
    'PARTIAL',
    'VIP',
    'STUDENT',
    'FAMILY',
    'CORPORATE',
    'LOYALTY',
    'FLEX',
    'PREMIUM',
    'BASIC'
);


ALTER TYPE public.subscription_plan_type OWNER TO admin;

--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.subscription_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'EXPIRED',
    'CANCELLED',
    'REFUNDED',
    'TRANSFERRED',
    'UPGRADED',
    'DOWNGRADED'
);


ALTER TYPE public.subscription_status OWNER TO admin;

--
-- Name: template_format; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.template_format AS ENUM (
    'PDF',
    'HTML',
    'PNG',
    'THERMAL',
    'EMAIL',
    'SMS'
);


ALTER TYPE public.template_format OWNER TO admin;

--
-- Name: template_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.template_type AS ENUM (
    'TICKET',
    'SUBSCRIPTION',
    'INVITATION',
    'PASS',
    'RECEIPT',
    'CONFIRMATION',
    'REMINDER'
);


ALTER TYPE public.template_type OWNER TO admin;

--
-- Name: validation_token_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.validation_token_type AS ENUM (
    'EMAIL_VERIFICATION',
    'EMAIL_CHANGE',
    'PASSWORD_RESET',
    'ACCOUNT_ACTIVATION',
    'INVITATION_USER',
    'INVITATION_GROUP',
    'MAGIC_LINK_LOGIN',
    'MAGIC_LINK_ACTION',
    'PHONE_VERIFICATION',
    'ACCOUNT_DELETION'
);


ALTER TYPE public.validation_token_type OWNER TO admin;

--
-- Name: venue_relation_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.venue_relation_type AS ENUM (
    'OWNER',
    'MANAGER',
    'TENANT',
    'PARTNER'
);


ALTER TYPE public.venue_relation_type OWNER TO admin;

--
-- Name: TYPE venue_relation_type; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TYPE public.venue_relation_type IS 'Type de relation entre un organisateur et un venue';


--
-- Name: webhook_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.webhook_status AS ENUM (
    'RECEIVED',
    'PROCESSING',
    'PROCESSED',
    'FAILED',
    'IGNORED',
    'RETRY'
);


ALTER TYPE public.webhook_status OWNER TO admin;

--
-- Name: zone_category; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.zone_category AS ENUM (
    'PREMIUM',
    'STANDARD',
    'BASIC',
    'VIP',
    'ACCESSIBLE',
    'COMPLIMENTARY',
    'CORPORATE',
    'STUDENT',
    'CHILD'
);


ALTER TYPE public.zone_category OWNER TO admin;

--
-- Name: zone_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.zone_type AS ENUM (
    'SEATING_AREA',
    'STANDING_AREA',
    'VIP_AREA',
    'SERVICE_AREA',
    'STAFF_AREA',
    'EMERGENCY_AREA',
    'DISABLED_AREA',
    'FAMILY_AREA',
    'CORPORATE_AREA',
    'PRESS_AREA'
);


ALTER TYPE public.zone_type OWNER TO admin;

--
-- Name: anonymize_identity_on_delete(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.anonymize_identity_on_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.anonymize_identity_on_delete() OWNER TO admin;

--
-- Name: audit_table_changes(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.audit_table_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    audit_user_id UUID;
BEGIN
    -- Récupérer l'ID utilisateur depuis le contexte ou les colonnes
    audit_user_id := COALESCE(
        NEW.updated_by, 
        NEW.created_by, 
        OLD.updated_by, 
        OLD.created_by
    );
    
    -- Insérer dans le log d'audit
    INSERT INTO audit_logs (
        user_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        description
    ) VALUES (
        audit_user_id,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP::audit_action,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        'Automatic audit for ' || TG_TABLE_NAME || ' ' || TG_OP
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.audit_table_changes() OWNER TO admin;

--
-- Name: auto_manage_event_status(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.auto_manage_event_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Si l'événement commence dans moins d'une heure, le marquer comme LIVE
    IF NEW.scheduled_start <= NOW() + INTERVAL '1 hour' 
       AND NEW.scheduled_start > NOW() 
       AND NEW.status = 'PUBLISHED' THEN
        NEW.status := 'LIVE';
    END IF;
    
    -- Si l'événement est terminé depuis plus d'une heure, le marquer comme FINISHED
    IF NEW.scheduled_end IS NOT NULL 
       AND NEW.scheduled_end < NOW() - INTERVAL '1 hour'
       AND NEW.status = 'LIVE' THEN
        NEW.status := 'FINISHED';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_manage_event_status() OWNER TO admin;

--
-- Name: calculate_order_totals(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.calculate_order_totals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    order_rec RECORD;
    new_subtotal DECIMAL(10,2);
    new_total DECIMAL(10,2);
BEGIN
    -- Récupérer l'ID de la commande
    IF TG_OP = 'DELETE' THEN
        order_rec.order_id := OLD.order_id;
    ELSE
        order_rec.order_id := NEW.order_id;
    END IF;
    
    -- Calculer les nouveaux totaux
    SELECT 
        COALESCE(SUM(total_price), 0)
    INTO new_subtotal
    FROM order_items 
    WHERE order_id = order_rec.order_id;
    
    -- Récupérer les autres montants pour calculer le total
    SELECT 
        discount_amount,
        tax_amount,
        processing_fee
    INTO order_rec
    FROM orders 
    WHERE id = order_rec.order_id;
    
    new_total := new_subtotal - COALESCE(order_rec.discount_amount, 0) 
                 + COALESCE(order_rec.tax_amount, 0) 
                 + COALESCE(order_rec.processing_fee, 0);
    
    -- Mettre à jour la commande
    UPDATE orders 
    SET subtotal_amount = new_subtotal,
        total_amount = new_total,
        updated_at = NOW()
    WHERE id = order_rec.order_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.calculate_order_totals() OWNER TO admin;

--
-- Name: calculate_organizer_commission_rate(uuid, numeric); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.calculate_organizer_commission_rate(p_organizer_id uuid, p_base_rate numeric DEFAULT NULL::numeric) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    organizer_rec RECORD;
    volume_bonus DECIMAL(5,4) := 0;
    loyalty_bonus DECIMAL(5,4) := 0;
    final_rate DECIMAL(5,4);
BEGIN
    -- Récupérer les informations organisateur
    SELECT * INTO organizer_rec 
    FROM organizers 
    WHERE id = p_organizer_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organizer not found: %', p_organizer_id;
    END IF;
    
    -- Utiliser le taux de base fourni ou celui de l'organisateur
    final_rate := COALESCE(p_base_rate, organizer_rec.commission_rate);
    
    -- Bonus volume (basé sur revenus générés)
    CASE 
        WHEN organizer_rec.total_revenue_generated > 100000 THEN volume_bonus := -0.0030; -- -0.3%
        WHEN organizer_rec.total_revenue_generated > 50000 THEN volume_bonus := -0.0020;  -- -0.2%
        WHEN organizer_rec.total_revenue_generated > 10000 THEN volume_bonus := -0.0010;  -- -0.1%
        ELSE volume_bonus := 0;
    END CASE;
    
    -- Bonus fidélité (basé sur ancienneté et nombre d'événements)
    IF organizer_rec.total_events_organized > 50 
       AND organizer_rec.created_at < NOW() - INTERVAL '2 years' THEN
        loyalty_bonus := -0.0005; -- -0.05%
    END IF;
    
    -- Appliquer les bonus (ne peut pas descendre en dessous de 5%)
    final_rate := GREATEST(final_rate + volume_bonus + loyalty_bonus, 0.0500);
    
    RETURN final_rate;
END;
$$;


ALTER FUNCTION public.calculate_organizer_commission_rate(p_organizer_id uuid, p_base_rate numeric) OWNER TO admin;

--
-- Name: calculate_pricing(uuid, uuid, integer, uuid); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.calculate_pricing(p_event_id uuid, p_ticket_type_id uuid, p_quantity integer DEFAULT 1, p_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(base_price numeric, total_discount numeric, final_price numeric, applied_rules text[])
    LANGUAGE plpgsql
    AS $$
DECLARE
    event_rec RECORD;
    ticket_type_rec RECORD;
    base_unit_price DECIMAL(10,2);
    total_discount_amount DECIMAL(10,2) := 0;
    applied_rules_array TEXT[] := '{}';
    rule_rec RECORD;
BEGIN
    -- Récupérer les informations de l'événement
    SELECT * INTO event_rec FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;
    
    -- Récupérer le type de billet
    SELECT * INTO ticket_type_rec FROM ticket_types WHERE id = p_ticket_type_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket type not found';
    END IF;
    
    -- Prix de base
    SELECT COALESCE(price_override, ticket_type_rec.base_price) INTO base_unit_price
    FROM event_ticket_config
    WHERE event_id = p_event_id AND ticket_type_id = p_ticket_type_id
    LIMIT 1;
    
    base_unit_price := COALESCE(base_unit_price, ticket_type_rec.base_price);
    
    -- Appliquer les règles de tarification actives
    FOR rule_rec IN 
        SELECT pr.*, o.id as rule_organizer_id
        FROM pricing_rules pr
        LEFT JOIN organizers o ON pr.organizer_id = o.id
        WHERE pr.is_active = TRUE
        AND pr.valid_from <= NOW()
        AND (pr.valid_until IS NULL OR pr.valid_until >= NOW())
        AND (pr.organizer_id IS NULL OR pr.organizer_id = event_rec.organizer_id)
        ORDER BY pr.priority DESC
    LOOP
        -- Logique simplifiée pour différents types de règles
        CASE rule_rec.rule_type
            WHEN 'EARLY_BIRD' THEN
                IF event_rec.scheduled_start > NOW() + INTERVAL '7 days' THEN
                    total_discount_amount := total_discount_amount + (base_unit_price * 0.1);
                    applied_rules_array := array_append(applied_rules_array, 'Early Bird 10%');
                END IF;
            WHEN 'GROUP_DISCOUNT' THEN
                IF p_quantity >= 5 THEN
                    total_discount_amount := total_discount_amount + (base_unit_price * 0.15);
                    applied_rules_array := array_append(applied_rules_array, 'Group Discount 15%');
                END IF;
            WHEN 'STUDENT_DISCOUNT' THEN
                -- Vérifier si l'utilisateur est étudiant (via groupes)
                IF p_user_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM user_groups ug 
                    JOIN groups g ON ug.group_id = g.id 
                    WHERE ug.user_id = p_user_id 
                    AND g.code = 'STUDENTS' 
                    AND ug.status = 'ACTIVE'
                ) THEN
                    total_discount_amount := total_discount_amount + (base_unit_price * 0.2);
                    applied_rules_array := array_append(applied_rules_array, 'Student Discount 20%');
                END IF;
        END CASE;
    END LOOP;
    
    -- Retourner les résultats
    RETURN QUERY
    SELECT 
        base_unit_price * p_quantity,
        total_discount_amount * p_quantity,
        (base_unit_price - total_discount_amount) * p_quantity,
        applied_rules_array;
END;
$$;


ALTER FUNCTION public.calculate_pricing(p_event_id uuid, p_ticket_type_id uuid, p_quantity integer, p_user_id uuid) OWNER TO admin;

--
-- Name: calculate_venue_occupancy_rate(character varying, date, date); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.calculate_venue_occupancy_rate(p_venue_id character varying, p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), p_end_date date DEFAULT CURRENT_DATE) RETURNS TABLE(venue_name character varying, total_events bigint, total_capacity_offered bigint, total_tickets_sold bigint, average_occupancy_rate numeric, revenue_generated numeric, most_popular_organizer character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.name,
        COUNT(DISTINCT e.id) as total_events,
        SUM(e.max_capacity) as total_capacity_offered,
        COUNT(DISTINCT t.id) as total_tickets_sold,
        CASE 
            WHEN SUM(e.max_capacity) > 0 THEN 
                ROUND((COUNT(DISTINCT t.id)::DECIMAL / SUM(e.max_capacity) * 100), 2)
            ELSE 0 
        END as average_occupancy_rate,
        COALESCE(SUM(p.net_amount), 0) as revenue_generated,
        (SELECT o2.name FROM organizers o2 
         JOIN events e2 ON o2.id = e2.organizer_id 
         WHERE e2.venue_id = p_venue_id 
         AND e2.scheduled_start::DATE BETWEEN p_start_date AND p_end_date
         GROUP BY o2.id, o2.name 
         ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_organizer
    FROM venues v
    LEFT JOIN events e ON v.id = e.venue_id 
        AND e.scheduled_start::DATE BETWEEN p_start_date AND p_end_date
        AND e.status IN ('FINISHED', 'LIVE')
    LEFT JOIN tickets t ON e.id = t.event_id AND t.is_active = TRUE
    LEFT JOIN orders o ON t.order_id = o.id
    LEFT JOIN payments p ON o.id = p.order_id AND p.status = 'COMPLETED'
    WHERE v.id = p_venue_id
    GROUP BY v.id, v.name;
END;
$$;


ALTER FUNCTION public.calculate_venue_occupancy_rate(p_venue_id character varying, p_start_date date, p_end_date date) OWNER TO admin;

--
-- Name: check_blacklist(public.blacklist_type, character varying, uuid, character varying, uuid); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.check_blacklist(p_type public.blacklist_type, p_value character varying, p_event_id uuid DEFAULT NULL::uuid, p_venue_id character varying DEFAULT NULL::character varying, p_organizer_id uuid DEFAULT NULL::uuid) RETURNS TABLE(is_blacklisted boolean, reason character varying, severity public.severity_level, valid_until timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as is_blacklisted,
        bl.reason,
        bl.severity,
        bl.valid_until
    FROM blacklist bl
    WHERE bl.type = p_type
    AND bl.value = p_value
    AND bl.is_active = TRUE
    AND bl.valid_from <= NOW()
    AND (bl.valid_until IS NULL OR bl.valid_until >= NOW())
    AND (
        bl.scope = 'GLOBAL' OR
        (bl.scope = 'EVENT' AND bl.target_event_id = p_event_id) OR
        (bl.scope = 'VENUE' AND bl.target_venue_id = p_venue_id) OR
        (bl.scope = 'ORGANIZER' AND bl.organizer_id = p_organizer_id)
    )
    ORDER BY bl.severity DESC, bl.valid_from DESC
    LIMIT 1;
    
    -- Si aucune entrée trouvée, retourner FALSE
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, ''::VARCHAR(100), 'INFO'::severity_level, NULL::TIMESTAMPTZ;
    END IF;
END;
$$;


ALTER FUNCTION public.check_blacklist(p_type public.blacklist_type, p_value character varying, p_event_id uuid, p_venue_id character varying, p_organizer_id uuid) OWNER TO admin;

--
-- Name: check_capacity_consistency(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.check_capacity_consistency() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    venue_capacity INTEGER;
    mapping_capacity INTEGER;
BEGIN
    -- Récupérer les capacités
    SELECT v.max_capacity, vm.effective_capacity 
    INTO venue_capacity, mapping_capacity
    FROM venues v
    JOIN venue_mappings vm ON v.id = vm.venue_id
    WHERE vm.id = NEW.mapping_id;
    
    -- Vérifier que la capacité de l'événement ne dépasse pas celle du mapping
    IF NEW.max_capacity IS NOT NULL AND NEW.max_capacity > mapping_capacity THEN
        RAISE EXCEPTION 'Event capacity (%) exceeds venue mapping capacity (%)', 
            NEW.max_capacity, mapping_capacity;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_capacity_consistency() OWNER TO admin;

--
-- Name: cleanup_expired_data(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.cleanup_expired_data() RETURNS TABLE(sessions_cleaned bigint, tokens_cleaned bigint, access_rights_expired bigint, old_logs_archived bigint)
    LANGUAGE plpgsql
    AS $$
DECLARE
    sessions_count BIGINT;
    tokens_count BIGINT;
    access_count BIGINT;
    logs_count BIGINT;
BEGIN
    -- Nettoyer les sessions expirées
    UPDATE user_sessions 
    SET is_active = FALSE 
    WHERE expires_at < NOW() - INTERVAL '7 days' 
    AND is_active = TRUE;
    
    GET DIAGNOSTICS sessions_count = ROW_COUNT;
    
    -- Nettoyer les tokens MFA expirés
    UPDATE mfa_tokens 
    SET is_used = TRUE 
    WHERE expires_at < NOW() 
    AND is_used = FALSE;
    
    GET DIAGNOSTICS tokens_count = ROW_COUNT;
    
    -- Expirer les droits d'accès périmés
    UPDATE access_rights 
    SET status = 'EXPIRED' 
    WHERE valid_until < NOW() 
    AND status = 'VALID';
    
    GET DIAGNOSTICS access_count = ROW_COUNT;
    
    -- Archiver les anciens logs d'audit (simulation)
    SELECT COUNT(*) INTO logs_count
    FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    RETURN QUERY
    SELECT sessions_count, tokens_count, access_count, logs_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_data() OWNER TO admin;

--
-- Name: detect_suspicious_activity(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.detect_suspicious_activity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    recent_failures INTEGER;
BEGIN
    -- Compter les échecs récents de ce user/IP dans la dernière heure
    SELECT COUNT(*) INTO recent_failures
    FROM login_attempts
    WHERE (email = NEW.email OR ip_address = NEW.ip_address)
    AND success = FALSE
    AND created_at >= NOW() - INTERVAL '15 minutes';
    
    -- Marquer comme suspect si plus de 5 échecs
    IF recent_failures >= 5 THEN
        NEW.is_suspicious := TRUE;
        
        -- Créer un événement de sécurité
        INSERT INTO security_events (
            event_type,
            severity,
            target_user_id,
            ip_address,
            description
        ) VALUES (
            'SUSPICIOUS_LOGIN_PATTERN',
            'HIGH',
            NEW.user_id,
            NEW.ip_address,
            'Multiple failed login attempts detected for ' || NEW.email
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.detect_suspicious_activity() OWNER TO admin;

--
-- Name: generate_access_codes(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.generate_access_codes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Générer un QR code unique si non fourni
    IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
        NEW.qr_code := 'QR_' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 12));
    END IF;
    
    -- Générer un code d'accès sécurisé si non fourni
    IF NEW.access_code IS NULL OR NEW.access_code = '' THEN
        NEW.access_code := 'AC_' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 16));
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_access_codes() OWNER TO admin;

--
-- Name: generate_event_report(uuid, boolean); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.generate_event_report(p_event_id uuid, p_include_financial boolean DEFAULT true) RETURNS TABLE(event_name character varying, event_date timestamp with time zone, venue_name character varying, organizer_name character varying, total_capacity integer, tickets_sold bigint, occupancy_rate numeric, total_revenue numeric, total_commissions numeric, net_revenue numeric, top_ticket_type character varying, average_ticket_price numeric, no_shows bigint, satisfaction_score numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.name,
        e.scheduled_start,
        v.name,
        o.name,
        e.max_capacity,
        COUNT(DISTINCT t.id) as tickets_sold,
        CASE 
            WHEN e.max_capacity > 0 THEN 
                ROUND((COUNT(DISTINCT t.id)::DECIMAL / e.max_capacity * 100), 2)
            ELSE 0 
        END as occupancy_rate,
        CASE WHEN p_include_financial THEN COALESCE(SUM(t.price_paid), 0) ELSE 0 END as total_revenue,
        CASE WHEN p_include_financial THEN COALESCE(SUM(oc.commission_amount), 0) ELSE 0 END as total_commissions,
        CASE WHEN p_include_financial THEN COALESCE(SUM(oc.net_to_organizer), 0) ELSE 0 END as net_revenue,
        (SELECT tt.name FROM ticket_types tt 
         JOIN tickets t2 ON tt.id = t2.ticket_type_id 
         WHERE t2.event_id = e.id 
         GROUP BY tt.id, tt.name 
         ORDER BY COUNT(*) DESC LIMIT 1) as top_ticket_type,
        CASE 
            WHEN COUNT(DISTINCT t.id) > 0 THEN 
                ROUND(AVG(t.price_paid), 2)
            ELSE 0 
        END as average_ticket_price,
        COUNT(DISTINCT ar.id) FILTER (WHERE ar.current_uses = 0 AND e.scheduled_end < NOW()) as no_shows,
        o.average_satisfaction_score
    FROM events e
    JOIN venues v ON e.venue_id = v.id
    JOIN organizers o ON e.organizer_id = o.id
    LEFT JOIN tickets t ON e.id = t.event_id AND t.is_active = TRUE
    LEFT JOIN access_rights ar ON t.id = ar.ticket_id
    LEFT JOIN orders ord ON t.order_id = ord.id
    LEFT JOIN organizer_commissions oc ON ord.id = oc.order_id
    WHERE e.id = p_event_id
    GROUP BY e.id, e.name, e.scheduled_start, e.max_capacity, v.name, o.name, o.average_satisfaction_score;
END;
$$;


ALTER FUNCTION public.generate_event_report(p_event_id uuid, p_include_financial boolean) OWNER TO admin;

--
-- Name: get_current_ip(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.get_current_ip() RETURNS inet
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('app.current_ip', true), '')::INET,
        '127.0.0.1'::INET
    );
END;
$$;


ALTER FUNCTION public.get_current_ip() OWNER TO admin;

--
-- Name: get_current_user_id(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.get_current_user_id() RETURNS uuid
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Retourner l'ID utilisateur depuis les variables de session
    RETURN COALESCE(
        NULLIF(current_setting('app.current_user_id', true), '')::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
END;
$$;


ALTER FUNCTION public.get_current_user_id() OWNER TO admin;

--
-- Name: get_event_capacity_stats(uuid); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.get_event_capacity_stats(p_event_id uuid) RETURNS TABLE(total_capacity integer, tickets_sold bigint, tickets_available bigint, occupancy_rate numeric, revenue_generated numeric, average_ticket_price numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.max_capacity,
        COUNT(t.id) as tickets_sold,
        GREATEST(0, e.max_capacity - COUNT(t.id)) as tickets_available,
        CASE 
            WHEN e.max_capacity > 0 THEN 
                ROUND((COUNT(t.id)::DECIMAL / e.max_capacity * 100), 2)
            ELSE 0 
        END as occupancy_rate,
        COALESCE(SUM(t.price_paid), 0) as revenue_generated,
        CASE 
            WHEN COUNT(t.id) > 0 THEN 
                ROUND(AVG(t.price_paid), 2)
            ELSE 0 
        END as average_ticket_price
    FROM events e
    LEFT JOIN tickets t ON e.id = t.event_id AND t.is_active = TRUE
    WHERE e.id = p_event_id
    GROUP BY e.id, e.max_capacity;
END;
$$;


ALTER FUNCTION public.get_event_capacity_stats(p_event_id uuid) OWNER TO admin;

--
-- Name: get_organizer_available_venues(uuid, date, date); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.get_organizer_available_venues(p_organizer_id uuid, p_date_from date DEFAULT CURRENT_DATE, p_date_until date DEFAULT NULL::date) RETURNS TABLE(venue_id character varying, venue_name character varying, relation_type public.venue_relation_type, priority_level integer, rental_rate numeric, max_capacity integer, city character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        vor.relation_type,
        vor.priority_level,
        vor.rental_rate,
        v.max_capacity,
        v.city
    FROM venues v
    JOIN venue_organizer_relations vor ON v.id = vor.venue_id
    WHERE vor.organizer_id = p_organizer_id
    AND vor.is_active = TRUE
    AND vor.valid_from <= p_date_from
    AND (vor.valid_until IS NULL OR vor.valid_until >= COALESCE(p_date_until, p_date_from))
    AND v.is_active = TRUE
    ORDER BY vor.priority_level DESC, vor.relation_type, v.name;
END;
$$;


ALTER FUNCTION public.get_organizer_available_venues(p_organizer_id uuid, p_date_from date, p_date_until date) OWNER TO admin;

--
-- Name: get_organizer_stats(uuid); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.get_organizer_stats(p_organizer_id uuid) RETURNS TABLE(total_events integer, upcoming_events integer, total_tickets_sold bigint, total_revenue numeric, average_occupancy_rate numeric, top_venue character varying, most_popular_event_type character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.id)::INTEGER as total_events,
        COUNT(DISTINCT e.id) FILTER (WHERE e.scheduled_start >= NOW())::INTEGER as upcoming_events,
        COUNT(DISTINCT t.id) as total_tickets_sold,
        COALESCE(SUM(p.net_amount), 0) as total_revenue,
        CASE 
            WHEN COUNT(DISTINCT e.id) > 0 THEN
                (COUNT(DISTINCT t.id)::DECIMAL / NULLIF(SUM(e.max_capacity), 0) * 100)
            ELSE 0 
        END as average_occupancy_rate,
        (SELECT v.name FROM venues v 
         JOIN events e2 ON v.id = e2.venue_id 
         WHERE e2.organizer_id = p_organizer_id 
         GROUP BY v.id, v.name 
         ORDER BY COUNT(*) DESC LIMIT 1) as top_venue,
        (SELECT ec.name FROM event_categories ec 
         JOIN events e3 ON ec.id = e3.category_id 
         WHERE e3.organizer_id = p_organizer_id 
         GROUP BY ec.id, ec.name 
         ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_event_type
    FROM events e
    LEFT JOIN tickets t ON e.id = t.event_id AND t.is_active = TRUE
    LEFT JOIN orders o ON t.order_id = o.id
    LEFT JOIN payments p ON o.id = p.order_id AND p.status = 'COMPLETED'
    WHERE e.organizer_id = p_organizer_id;
END;
$$;


ALTER FUNCTION public.get_organizer_stats(p_organizer_id uuid) OWNER TO admin;

--
-- Name: get_subscription_benefits(uuid, uuid); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.get_subscription_benefits(p_user_id uuid, p_organizer_id uuid DEFAULT NULL::uuid) RETURNS TABLE(subscription_id uuid, plan_name character varying, organizer_name character varying, benefits jsonb, events_included bigint, events_used bigint, priority_booking boolean, transfers_available integer, valid_until date)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        sp.name,
        o.name,
        sp.benefits,
        COUNT(DISTINCT spe.event_id) + COUNT(DISTINCT speg.event_group_id) as events_included,
        COUNT(DISTINCT ar.event_id) as events_used,
        sp.priority_booking,
        sp.max_transfers - s.transfers_used as transfers_available,
        s.end_date
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    JOIN organizers o ON sp.organizer_id = o.id
    LEFT JOIN subscription_plan_events spe ON sp.id = spe.subscription_plan_id AND spe.is_included = TRUE
    LEFT JOIN subscription_plan_event_groups speg ON sp.id = speg.subscription_plan_id AND speg.is_included = TRUE
    LEFT JOIN access_rights ar ON s.id = ar.subscription_id
    WHERE s.user_id = p_user_id
    AND s.status = 'ACTIVE'
    AND s.end_date >= CURRENT_DATE
    AND (p_organizer_id IS NULL OR sp.organizer_id = p_organizer_id)
    GROUP BY s.id, sp.name, o.name, sp.benefits, sp.priority_booking, 
             sp.max_transfers, s.transfers_used, s.end_date;
END;
$$;


ALTER FUNCTION public.get_subscription_benefits(p_user_id uuid, p_organizer_id uuid) OWNER TO admin;

--
-- Name: get_upcoming_events(integer, character varying, public.organizer_type, uuid); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.get_upcoming_events(p_limit integer DEFAULT 10, p_city character varying DEFAULT NULL::character varying, p_organizer_type public.organizer_type DEFAULT NULL::public.organizer_type, p_category_id uuid DEFAULT NULL::uuid) RETURNS TABLE(event_id uuid, event_name character varying, event_description text, scheduled_start timestamp with time zone, venue_name character varying, venue_city character varying, organizer_name character varying, organizer_type public.organizer_type, category_name character varying, min_price numeric, available_tickets bigint, total_capacity integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.description,
        e.scheduled_start,
        v.name,
        v.city,
        o.name,
        o.type,
        ec.name,
        MIN(tt.base_price) as min_price,
        COUNT(DISTINCT etc.id) FILTER (WHERE etc.available_quantity > etc.sold_quantity) as available_tickets,
        e.max_capacity
    FROM events e
    JOIN venues v ON e.venue_id = v.id
    JOIN organizers o ON e.organizer_id = o.id
    JOIN event_categories ec ON e.category_id = ec.id
    LEFT JOIN event_ticket_config etc ON e.id = etc.event_id AND etc.is_active = TRUE
    LEFT JOIN ticket_types tt ON etc.ticket_type_id = tt.id
    WHERE e.status = 'PUBLISHED'
    AND e.visibility = 'PUBLIC'
    AND e.scheduled_start >= NOW()
    AND (p_city IS NULL OR v.city ILIKE '%' || p_city || '%')
    AND (p_organizer_type IS NULL OR o.type = p_organizer_type)
    AND (p_category_id IS NULL OR e.category_id = p_category_id)
    GROUP BY e.id, e.name, e.description, e.scheduled_start, v.name, v.city, 
             o.name, o.type, ec.name, e.max_capacity
    ORDER BY e.scheduled_start ASC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION public.get_upcoming_events(p_limit integer, p_city character varying, p_organizer_type public.organizer_type, p_category_id uuid) OWNER TO admin;

--
-- Name: get_user_dashboard_data(uuid); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.get_user_dashboard_data(p_user_id uuid) RETURNS TABLE(upcoming_events bigint, active_subscriptions bigint, tickets_owned bigint, total_spent numeric, favorite_organizer character varying, favorite_venue character varying, loyalty_points integer, next_event_date timestamp with time zone, next_event_name character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT ar.event_id) FILTER (WHERE e.scheduled_start >= NOW()) as upcoming_events,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'ACTIVE' AND s.end_date >= CURRENT_DATE) as active_subscriptions,
        COUNT(DISTINCT t.id) FILTER (WHERE t.is_active = TRUE) as tickets_owned,
        COALESCE(SUM(p.amount), 0) as total_spent,
        (SELECT o2.name FROM organizers o2 
         JOIN events e2 ON o2.id = e2.organizer_id 
         JOIN tickets t2 ON e2.id = t2.event_id 
         WHERE t2.user_id = p_user_id 
         GROUP BY o2.id, o2.name 
         ORDER BY COUNT(*) DESC LIMIT 1) as favorite_organizer,
        (SELECT v2.name FROM venues v2 
         JOIN events e3 ON v2.id = e3.venue_id 
         JOIN tickets t3 ON e3.id = t3.event_id 
         WHERE t3.user_id = p_user_id 
         GROUP BY v2.id, v2.name 
         ORDER BY COUNT(*) DESC LIMIT 1) as favorite_venue,
        COALESCE((SELECT COUNT(*)::INTEGER * 10 FROM tickets WHERE user_id = p_user_id), 0) as loyalty_points,
        (SELECT MIN(e4.scheduled_start) FROM events e4 
         JOIN access_rights ar2 ON e4.id = ar2.event_id 
         WHERE ar2.user_id = p_user_id 
         AND e4.scheduled_start >= NOW() 
         AND ar2.status = 'VALID') as next_event_date,
        (SELECT e5.name FROM events e5 
         JOIN access_rights ar3 ON e5.id = ar3.event_id 
         WHERE ar3.user_id = p_user_id 
         AND e5.scheduled_start >= NOW() 
         AND ar3.status = 'VALID'
         ORDER BY e5.scheduled_start ASC LIMIT 1) as next_event_name
    FROM users u
    LEFT JOIN access_rights ar ON u.id = ar.user_id
    LEFT JOIN events e ON ar.event_id = e.id
    LEFT JOIN subscriptions s ON u.id = s.user_id
    LEFT JOIN tickets t ON u.id = t.user_id
    LEFT JOIN orders o ON t.order_id = o.id
    LEFT JOIN payments p ON o.id = p.order_id AND p.status = 'COMPLETED'
    WHERE u.id = p_user_id
    GROUP BY u.id;
END;
$$;


ALTER FUNCTION public.get_user_dashboard_data(p_user_id uuid) OWNER TO admin;

--
-- Name: get_views_statistics(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.get_views_statistics() RETURNS TABLE(view_name text, view_type text, estimated_rows bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT,
        CASE 
            WHEN c.relkind = 'v' THEN 'VIEW'
            WHEN c.relkind = 'm' THEN 'MATERIALIZED VIEW'
            ELSE 'OTHER'
        END,
        c.reltuples::BIGINT
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND c.relkind IN ('v', 'm')
    AND c.relname LIKE 'v_%'
    ORDER BY c.relname;
END;
$$;


ALTER FUNCTION public.get_views_statistics() OWNER TO admin;

--
-- Name: mask_identity_number(character varying, boolean, boolean); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.mask_identity_number(document_number character varying, is_owner boolean, is_admin boolean) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION public.mask_identity_number(document_number character varying, is_owner boolean, is_admin boolean) OWNER TO admin;

--
-- Name: prevent_seat_double_booking(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.prevent_seat_double_booking() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    existing_ticket_count INTEGER;
BEGIN
    -- Vérifier s'il y a déjà un billet actif pour cette place à cet événement
    IF NEW.seat_id IS NOT NULL THEN
        SELECT COUNT(*) INTO existing_ticket_count
        FROM tickets t
        WHERE t.seat_id = NEW.seat_id 
        AND t.event_id = NEW.event_id 
        AND t.is_active = TRUE
        AND (TG_OP = 'INSERT' OR t.id != NEW.id);
        
        IF existing_ticket_count > 0 THEN
            RAISE EXCEPTION 'Seat % is already booked for this event', NEW.seat_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_seat_double_booking() OWNER TO admin;

--
-- Name: refresh_all_materialized_views(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.refresh_all_materialized_views() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    view_record RECORD;
BEGIN
    -- Cette fonction sera utile si vous convertissez certaines vues en vues matérialisées
    -- pour de meilleures performances sur de gros volumes
    
    FOR view_record IN 
        SELECT schemaname, matviewname
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('REFRESH MATERIALIZED VIEW %I.%I', 
                      view_record.schemaname, 
                      view_record.matviewname);
    END LOOP;
END;
$$;


ALTER FUNCTION public.refresh_all_materialized_views() OWNER TO admin;

--
-- Name: set_order_primary_organizer(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.set_order_primary_organizer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    main_organizer_id UUID;
BEGIN
    -- Récupérer l'organisateur principal basé sur les articles de la commande (événements)
    SELECT e.organizer_id INTO main_organizer_id
    FROM order_items oi
    JOIN events e ON oi.event_id = e.id
    WHERE oi.order_id = NEW.id
    AND oi.event_id IS NOT NULL
    GROUP BY e.organizer_id
    ORDER BY SUM(oi.total_price) DESC
    LIMIT 1;
    
    -- Si pas d'événement, chercher via subscription_plans
    IF main_organizer_id IS NULL THEN
        SELECT sp.organizer_id INTO main_organizer_id
        FROM order_items oi
        JOIN subscription_plans sp ON oi.subscription_plan_id = sp.id
        WHERE oi.order_id = NEW.id
        AND oi.subscription_plan_id IS NOT NULL
        GROUP BY sp.organizer_id
        ORDER BY SUM(oi.total_price) DESC
        LIMIT 1;
    END IF;
    
    -- Mettre à jour la commande
    UPDATE orders 
    SET primary_organizer_id = main_organizer_id
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_order_primary_organizer() OWNER TO admin;

--
-- Name: sync_access_rights_organizer(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.sync_access_rights_organizer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Récupérer l'organizer_id de l'événement
    NEW.organizer_id := (
        SELECT organizer_id 
        FROM events 
        WHERE id = NEW.event_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_access_rights_organizer() OWNER TO admin;

--
-- Name: sync_event_config_organizer(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.sync_event_config_organizer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Récupérer l'organizer_id de l'événement
    NEW.organizer_id := (
        SELECT organizer_id 
        FROM events 
        WHERE id = NEW.event_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_event_config_organizer() OWNER TO admin;

--
-- Name: sync_payment_organizer(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.sync_payment_organizer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Récupérer l'organizer_id de la commande
    NEW.primary_organizer_id := (
        SELECT primary_organizer_id 
        FROM orders 
        WHERE id = NEW.order_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_payment_organizer() OWNER TO admin;

--
-- Name: sync_subscription_organizer(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.sync_subscription_organizer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Récupérer l'organizer_id du plan
    NEW.organizer_id := (
        SELECT organizer_id 
        FROM subscription_plans 
        WHERE id = NEW.plan_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_subscription_organizer() OWNER TO admin;

--
-- Name: sync_ticket_organizer(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.sync_ticket_organizer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Récupérer l'organizer_id de l'événement
    NEW.organizer_id := (
        SELECT organizer_id 
        FROM events 
        WHERE id = NEW.event_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_ticket_organizer() OWNER TO admin;

--
-- Name: sync_venue_capacity(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.sync_venue_capacity() RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    mapping_rec RECORD;
    calculated_capacity INTEGER;
BEGIN
    -- Pour chaque mapping, vérifier la cohérence des capacités
    FOR mapping_rec IN 
        SELECT vm.id, vm.venue_id, vm.effective_capacity, v.max_capacity
        FROM venue_mappings vm
        JOIN venues v ON vm.venue_id = v.id
        WHERE vm.is_active = TRUE
    LOOP
        -- Calculer la capacité totale des zones
        SELECT SUM(capacity) INTO calculated_capacity
        FROM venue_zones 
        WHERE mapping_id = mapping_rec.id;
        
        -- Mettre à jour si différent
        IF calculated_capacity != mapping_rec.effective_capacity THEN
            UPDATE venue_mappings 
            SET effective_capacity = calculated_capacity,
                updated_at = NOW()
            WHERE id = mapping_rec.id;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.sync_venue_capacity() OWNER TO admin;

--
-- Name: transfer_ticket(uuid, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.transfer_ticket(p_ticket_id uuid, p_from_user_id uuid, p_to_user_id uuid, p_notes text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    ticket_rec RECORD;
    access_right_id UUID;
BEGIN
    -- Vérifier que le billet existe et appartient au bon utilisateur
    SELECT * INTO ticket_rec
    FROM tickets 
    WHERE id = p_ticket_id 
    AND user_id = p_from_user_id 
    AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket not found or does not belong to user';
    END IF;
    
    -- Vérifier que le type de billet autorise les transferts
    IF NOT EXISTS (
        SELECT 1 FROM ticket_types 
        WHERE id = ticket_rec.ticket_type_id 
        AND transferable = TRUE
    ) THEN
        RAISE EXCEPTION 'This ticket type is not transferable';
    END IF;
    
    -- Vérifier que l'utilisateur destinataire existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_to_user_id AND is_active = TRUE) THEN
        RAISE EXCEPTION 'Destination user not found or inactive';
    END IF;
    
    -- Transférer le billet
    UPDATE tickets 
    SET user_id = p_to_user_id,
        updated_at = NOW()
    WHERE id = p_ticket_id;
    
    -- Transférer le droit d'accès associé
    UPDATE access_rights 
    SET user_id = p_to_user_id
    WHERE ticket_id = p_ticket_id
    RETURNING id INTO access_right_id;
    
    -- Logger la transaction
    INSERT INTO access_transactions_log (
        access_right_id, 
        transaction_type, 
        from_user_id, 
        to_user_id,
        from_status,
        to_status,
        reason
    ) VALUES (
        access_right_id,
        'TRANSFER',
        p_from_user_id,
        p_to_user_id,
        'VALID',
        'VALID',
        'Ticket transfer' || COALESCE(' - ' || p_notes, '')
    );
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.transfer_ticket(p_ticket_id uuid, p_from_user_id uuid, p_to_user_id uuid, p_notes text) OWNER TO admin;

--
-- Name: update_organizer_revenue(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.update_organizer_revenue() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    organizer_id_to_update UUID;
    total_revenue DECIMAL(15,2);
BEGIN
    -- Déterminer l'organisateur à mettre à jour
    IF TG_OP = 'DELETE' THEN
        organizer_id_to_update := OLD.organizer_id;
    ELSE
        organizer_id_to_update := NEW.organizer_id;
    END IF;
    
    -- Calculer le total des revenus pour cet organisateur
    SELECT COALESCE(SUM(net_to_organizer), 0) INTO total_revenue
    FROM organizer_commissions
    WHERE organizer_id = organizer_id_to_update
    AND status = 'PAID';
    
    -- Mettre à jour les statistiques de l'organisateur
    UPDATE organizers 
    SET total_revenue_generated = total_revenue,
        updated_at = NOW()
    WHERE id = organizer_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_organizer_revenue() OWNER TO admin;

--
-- Name: update_organizer_stats(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.update_organizer_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Mettre à jour les stats de l'organisateur de l'événement
        UPDATE organizers 
        SET total_events_organized = (
                SELECT COUNT(*) 
                FROM events 
                WHERE organizer_id = NEW.organizer_id
            ),
            last_event_date = (
                SELECT MAX(scheduled_start::DATE)
                FROM events 
                WHERE organizer_id = NEW.organizer_id
            ),
            updated_at = NOW()
        WHERE id = NEW.organizer_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Mettre à jour les stats de l'ancien organisateur
        UPDATE organizers 
        SET total_events_organized = (
                SELECT COUNT(*) 
                FROM events 
                WHERE organizer_id = OLD.organizer_id
            ),
            updated_at = NOW()
        WHERE id = OLD.organizer_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_organizer_stats() OWNER TO admin;

--
-- Name: update_timestamp_column(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.update_timestamp_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp_column() OWNER TO admin;

--
-- Name: validate_access_right(character varying, character varying); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.validate_access_right(p_qr_code character varying, p_access_point_id character varying DEFAULT NULL::character varying) RETURNS TABLE(is_valid boolean, access_right_id uuid, user_name text, event_name character varying, seat_info text, denial_reason public.denial_reason, remaining_uses integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    access_rec RECORD;
    event_rec RECORD;
    user_rec RECORD;
    seat_info_text TEXT;
    is_access_valid BOOLEAN := FALSE;
    denial_reason_code denial_reason := NULL;
    remaining_uses_count INTEGER := 0;
BEGIN
    -- Rechercher le droit d'accès
    SELECT ar.*, e.name as event_name, e.scheduled_start, e.scheduled_end,
           u.first_name, u.last_name
    INTO access_rec
    FROM access_rights ar
    JOIN events e ON ar.event_id = e.id
    JOIN users u ON ar.user_id = u.id
    WHERE ar.qr_code = p_qr_code;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, '', '', '', 'INVALID_QR'::denial_reason, 0;
        RETURN;
    END IF;
    
    -- Vérifications de validité
    CASE 
        WHEN access_rec.status != 'VALID' THEN
            denial_reason_code := 'EXPIRED';
        WHEN access_rec.valid_from > NOW() THEN
            denial_reason_code := 'NOT_YET_VALID';
        WHEN access_rec.valid_until < NOW() THEN
            denial_reason_code := 'EXPIRED';
        WHEN access_rec.current_uses >= access_rec.max_uses THEN
            denial_reason_code := 'ALREADY_USED';
        WHEN access_rec.scheduled_start > NOW() + INTERVAL '2 hours' THEN
            denial_reason_code := 'WRONG_TIME';
        WHEN access_rec.scheduled_end < NOW() - INTERVAL '2 hours' THEN
            denial_reason_code := 'WRONG_TIME';
        ELSE
            is_access_valid := TRUE;
            remaining_uses_count := access_rec.max_uses - access_rec.current_uses;
    END CASE;
    
    -- Construire les informations de place
    IF access_rec.seat_id IS NOT NULL THEN
        SELECT CONCAT('Zone: ', vz.name, ' - Siège: ', s.seat_number, 
                     CASE WHEN s.row_number IS NOT NULL THEN ' Rang: ' || s.row_number ELSE '' END)
        INTO seat_info_text
        FROM seats s
        JOIN venue_zones vz ON s.zone_id = vz.id
        WHERE s.id = access_rec.seat_id;
    ELSIF access_rec.zone_id IS NOT NULL THEN
        SELECT CONCAT('Zone: ', vz.name, ' (Placement libre)')
        INTO seat_info_text
        FROM venue_zones vz
        WHERE vz.id = access_rec.zone_id;
    ELSE
        seat_info_text := 'Accès général';
    END IF;
    
    -- Si l'accès est valide, mettre à jour les compteurs
    IF is_access_valid THEN
        UPDATE access_rights 
        SET current_uses = current_uses + 1,
            used_at = CASE WHEN current_uses = 0 THEN NOW() ELSE used_at END,
            used_at_access_point = p_access_point_id
        WHERE id = access_rec.id;
        
        remaining_uses_count := remaining_uses_count - 1;
    END IF;
    
    -- Retourner les résultats
    RETURN QUERY
    SELECT 
        is_access_valid,
        access_rec.id,
        access_rec.first_name || ' ' || access_rec.last_name,
        access_rec.event_name,
        seat_info_text,
        denial_reason_code,
        remaining_uses_count;
END;
$$;


ALTER FUNCTION public.validate_access_right(p_qr_code character varying, p_access_point_id character varying) OWNER TO admin;

--
-- Name: validate_business_constraints(text, uuid, text); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.validate_business_constraints(p_table_name text, p_record_id uuid, p_operation text DEFAULT 'INSERT'::text) RETURNS TABLE(is_valid boolean, error_messages text[])
    LANGUAGE plpgsql
    AS $$
DECLARE
    errors TEXT[] := '{}';
    event_rec RECORD;
    organizer_rec RECORD;
BEGIN
    CASE p_table_name
        WHEN 'events' THEN
            SELECT * INTO event_rec FROM events WHERE id = p_record_id;
            
            -- Vérifier que l'organisateur est actif
            SELECT * INTO organizer_rec FROM organizers WHERE id = event_rec.organizer_id;
            IF organizer_rec.status != 'ACTIVE' THEN
                errors := array_append(errors, 'Organizer must be active to create events');
            END IF;
            
            -- Vérifier les dates
            IF event_rec.scheduled_start <= NOW() AND p_operation = 'INSERT' THEN
                errors := array_append(errors, 'Cannot create events in the past');
            END IF;
            
        WHEN 'organizers' THEN
            SELECT * INTO organizer_rec FROM organizers WHERE id = p_record_id;
            
            -- Vérifier les informations requises selon le type
            IF organizer_rec.type = 'SPORTS_CLUB' AND organizer_rec.contact_phone IS NULL THEN
                errors := array_append(errors, 'Sports clubs must have a contact phone');
            END IF;
    END CASE;
    
    RETURN QUERY
    SELECT 
        array_length(errors, 1) IS NULL OR array_length(errors, 1) = 0,
        errors;
END;
$$;


ALTER FUNCTION public.validate_business_constraints(p_table_name text, p_record_id uuid, p_operation text) OWNER TO admin;

--
-- Name: validate_event_business_rules(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.validate_event_business_rules() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    organizer_status organizer_status;
BEGIN
    -- Vérifier que l'organisateur est actif pour créer/publier un événement
    SELECT status INTO organizer_status
    FROM organizers 
    WHERE id = NEW.organizer_id;
    
    IF organizer_status != 'ACTIVE' AND NEW.status IN ('PUBLISHED', 'CONFIRMED') THEN
        RAISE EXCEPTION 'Cannot publish events for non-active organizer';
    END IF;
    
    -- Les événements payants doivent avoir une billetterie configurée
    IF NEW.status = 'PUBLISHED' AND EXISTS (
        SELECT 1 FROM event_ticket_config 
        WHERE event_id = NEW.id AND price_override > 0
    ) THEN
        IF NEW.sales_start IS NULL OR NEW.sales_end IS NULL THEN
            RAISE EXCEPTION 'Paid events must have sales dates configured';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_event_business_rules() OWNER TO admin;

--
-- Name: validate_organizer(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.validate_organizer(p_organizer_id uuid, p_validator_user_id uuid, p_notes text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    organizer_rec RECORD;
BEGIN
    -- Vérifier que l'organisateur existe et est en attente
    SELECT * INTO organizer_rec
    FROM organizers 
    WHERE id = p_organizer_id AND status = 'PENDING';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organizer not found or not in PENDING status';
    END IF;
    
    -- Vérifier que le validateur existe et a les droits
    IF NOT EXISTS (
        SELECT 1 FROM users u 
        JOIN user_roles ur ON u.id = ur.user_id 
        JOIN roles r ON ur.role_id = r.id 
        WHERE u.id = p_validator_user_id 
        AND r.code IN ('ADMIN', 'ORGANIZER_VALIDATOR')
        AND ur.status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'Validator does not have sufficient permissions';
    END IF;
    
    -- Valider l'organisateur
    UPDATE organizers 
    SET status = 'ACTIVE',
        validated_at = NOW(),
        validated_by = p_validator_user_id,
        updated_at = NOW()
    WHERE id = p_organizer_id;
    
    -- Logger dans l'audit
    INSERT INTO audit_logs (
        user_id, table_name, record_id, action, description
    ) VALUES (
        p_validator_user_id, 'organizers', p_organizer_id, 'UPDATE',
        'Organizer validated and activated' || COALESCE(' - ' || p_notes, '')
    );
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.validate_organizer(p_organizer_id uuid, p_validator_user_id uuid, p_notes text) OWNER TO admin;

--
-- Name: validate_organizer_business_rules(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.validate_organizer_business_rules() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Un organisateur SPORTS_CLUB doit avoir un contact_phone
    IF NEW.type = 'SPORTS_CLUB' AND (NEW.contact_phone IS NULL OR NEW.contact_phone = '') THEN
        RAISE EXCEPTION 'Sports clubs must have a contact phone number';
    END IF;
    
    -- Un organisateur CORPORATE doit avoir des banking_details quand actif
    IF NEW.type = 'CORPORATE' AND NEW.status = 'ACTIVE' 
       AND (NEW.banking_details IS NULL OR NEW.banking_details = '{}') THEN
        RAISE EXCEPTION 'Corporate organizers must have banking details when active';
    END IF;
    
    -- Un organisateur ne peut être validé que par un admin
    IF NEW.validated_at IS NOT NULL 
       AND (OLD.validated_at IS NULL OR OLD.validated_at != NEW.validated_at) THEN
        IF NEW.validated_by IS NULL THEN
            RAISE EXCEPTION 'Organizer validation must include validator user ID';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_organizer_business_rules() OWNER TO admin;

--
-- Name: verify_user_identity(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.verify_user_identity(p_user_id uuid, p_verified_by uuid, p_notes text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.verify_user_identity(p_user_id uuid, p_verified_by uuid, p_notes text) OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_control_log; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.access_control_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    access_right_id uuid NOT NULL,
    access_point_id character varying(255),
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    action public.access_action NOT NULL,
    result public.access_status NOT NULL,
    denial_reason public.denial_reason,
    controller_device character varying(100),
    ip_address inet,
    scan_metadata jsonb,
    notes text,
    scanned_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.access_control_log OWNER TO admin;

--
-- Name: TABLE access_control_log; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.access_control_log IS 'Journal de tous les contrôles d''accès physiques';


--
-- Name: access_points; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.access_points (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    mapping_id character varying(255) NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(100) NOT NULL,
    access_type public.access_type NOT NULL,
    allowed_zones text[],
    restricted_zones text[],
    security_level public.security_level DEFAULT 'STANDARD'::public.security_level NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_active boolean DEFAULT true NOT NULL,
    requires_special_permission boolean DEFAULT false NOT NULL,
    operating_hours jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_access_points_coordinates CHECK ((((latitude IS NULL) AND (longitude IS NULL)) OR ((latitude IS NOT NULL) AND (longitude IS NOT NULL)))),
    CONSTRAINT chk_access_points_latitude CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)))),
    CONSTRAINT chk_access_points_longitude CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric))))
);


ALTER TABLE public.access_points OWNER TO admin;

--
-- Name: TABLE access_points; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.access_points IS 'Points d''entrée/sortie avec configuration de sécurité';


--
-- Name: access_rights; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.access_rights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    qr_code character varying(255) NOT NULL,
    user_id uuid,
    event_id uuid,
    organizer_id uuid,
    subscription_id uuid,
    ticket_id uuid,
    zone_id character varying(255),
    seat_id character varying(255),
    status public.access_right_status DEFAULT 'VALID'::public.access_right_status NOT NULL,
    source_type public.access_source_type NOT NULL,
    access_code character varying(100) NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    max_uses integer DEFAULT 1 NOT NULL,
    current_uses integer DEFAULT 0 NOT NULL,
    used_at timestamp with time zone,
    used_at_access_point character varying(255),
    access_metadata jsonb,
    special_permissions jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_access_rights_current_uses CHECK (((current_uses >= 0) AND (current_uses <= max_uses))),
    CONSTRAINT chk_access_rights_max_uses CHECK ((max_uses > 0)),
    CONSTRAINT chk_access_rights_source_exclusive CHECK ((((subscription_id IS NOT NULL) AND (ticket_id IS NULL)) OR ((subscription_id IS NULL) AND (ticket_id IS NOT NULL)))),
    CONSTRAINT chk_access_rights_valid_dates CHECK ((valid_until >= valid_from))
);


ALTER TABLE public.access_rights OWNER TO admin;

--
-- Name: TABLE access_rights; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.access_rights IS 'Table centrale unifiant tous les droits d''accès avec QR codes et référence organisateur';


--
-- Name: access_transactions_log; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.access_transactions_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    access_right_id uuid NOT NULL,
    transaction_type public.access_transaction_type NOT NULL,
    from_user_id uuid,
    to_user_id uuid,
    from_status public.access_right_status,
    to_status public.access_right_status NOT NULL,
    reason text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.access_transactions_log OWNER TO admin;

--
-- Name: TABLE access_transactions_log; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.access_transactions_log IS 'Journal des transactions sur les droits d''accès (transferts, annulations)';


--
-- Name: api_access_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.api_access_logs (
    id bigint NOT NULL,
    key_id uuid NOT NULL,
    client_id uuid NOT NULL,
    endpoint character varying(255) NOT NULL,
    ip inet,
    status_code integer,
    used_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_access_logs OWNER TO admin;

--
-- Name: api_access_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.api_access_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_access_logs_id_seq OWNER TO admin;

--
-- Name: api_access_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.api_access_logs_id_seq OWNED BY public.api_access_logs.id;


--
-- Name: api_clients; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.api_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    owner_id uuid,
    description text,
    status public.api_status DEFAULT 'ACTIVE'::public.api_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_clients OWNER TO admin;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    key character varying(64) NOT NULL,
    secret_hash character varying(128) NOT NULL,
    status public.api_status DEFAULT 'ACTIVE'::public.api_status NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE public.api_keys OWNER TO admin;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    table_name character varying(100) NOT NULL,
    record_id uuid,
    action public.audit_action NOT NULL,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    severity public.security_level DEFAULT 'STANDARD'::public.security_level NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_audit_logs_table_name CHECK ((length(TRIM(BOTH FROM table_name)) > 0))
);


ALTER TABLE public.audit_logs OWNER TO admin;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.audit_logs IS 'Journal d''audit de toutes les actions critiques';


--
-- Name: blacklist; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.blacklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type public.blacklist_type NOT NULL,
    value character varying(255) NOT NULL,
    scope public.blacklist_scope NOT NULL,
    target_event_id uuid,
    target_venue_id character varying(255),
    organizer_id uuid,
    reason character varying(100) NOT NULL,
    description text,
    severity public.severity_level DEFAULT 'MEDIUM'::public.severity_level NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone,
    created_by uuid NOT NULL,
    appeal_status public.appeal_status DEFAULT 'NONE'::public.appeal_status NOT NULL,
    appeal_notes text,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_blacklist_global_no_targets CHECK (((scope <> 'GLOBAL'::public.blacklist_scope) OR ((target_event_id IS NULL) AND (target_venue_id IS NULL) AND (organizer_id IS NULL)))),
    CONSTRAINT chk_blacklist_scope_target_consistency CHECK ((((scope = 'EVENT'::public.blacklist_scope) AND (target_event_id IS NOT NULL)) OR ((scope = 'VENUE'::public.blacklist_scope) AND (target_venue_id IS NOT NULL)) OR ((scope = 'ORGANIZER'::public.blacklist_scope) AND (organizer_id IS NOT NULL)) OR (scope = ANY (ARRAY['GLOBAL'::public.blacklist_scope, 'CATEGORY'::public.blacklist_scope, 'TEMPORAL'::public.blacklist_scope])))),
    CONSTRAINT chk_blacklist_valid_dates CHECK (((valid_until IS NULL) OR (valid_until >= valid_from)))
);


ALTER TABLE public.blacklist OWNER TO admin;

--
-- Name: TABLE blacklist; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.blacklist IS 'Liste noire avec portée organisateur, venue, événement ou globale';


--
-- Name: event_categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.event_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    parent_category_id uuid,
    default_duration integer,
    default_capacity integer,
    requires_referee boolean DEFAULT false NOT NULL,
    allows_draw boolean DEFAULT false NOT NULL,
    has_overtime boolean DEFAULT false NOT NULL,
    has_penalties boolean DEFAULT false NOT NULL,
    icon_url text,
    color_primary character varying(7),
    color_secondary character varying(7),
    default_ticket_price numeric(10,2),
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    rules jsonb,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_event_categories_capacity CHECK (((default_capacity IS NULL) OR (default_capacity > 0))),
    CONSTRAINT chk_event_categories_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_event_categories_duration CHECK (((default_duration IS NULL) OR (default_duration > 0))),
    CONSTRAINT chk_event_categories_price CHECK (((default_ticket_price IS NULL) OR (default_ticket_price >= (0)::numeric)))
);


ALTER TABLE public.event_categories OWNER TO admin;

--
-- Name: TABLE event_categories; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.event_categories IS 'Types d''événements disponibles avec configuration par défaut';


--
-- Name: event_groups; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.event_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    parent_group_id uuid,
    type public.event_group_type NOT NULL,
    season character varying(20),
    start_date date NOT NULL,
    end_date date NOT NULL,
    max_events integer,
    current_events integer DEFAULT 0 NOT NULL,
    completed_events integer DEFAULT 0 NOT NULL,
    group_rules jsonb,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_event_groups_completed_events CHECK (((completed_events >= 0) AND (completed_events <= current_events))),
    CONSTRAINT chk_event_groups_current_events CHECK ((current_events >= 0)),
    CONSTRAINT chk_event_groups_dates CHECK ((end_date >= start_date)),
    CONSTRAINT chk_event_groups_max_events CHECK (((max_events IS NULL) OR (max_events > 0)))
);


ALTER TABLE public.event_groups OWNER TO admin;

--
-- Name: TABLE event_groups; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.event_groups IS 'Groupes d''événements (saisons, tournois, festivals)';


--
-- Name: event_media; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.event_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    media_type public.event_media_type NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    mime_type character varying(100),
    display_order integer DEFAULT 0,
    is_featured boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_event_media_display_order CHECK ((display_order >= 0)),
    CONSTRAINT chk_event_media_file_size CHECK (((file_size IS NULL) OR (file_size > 0)))
);


ALTER TABLE public.event_media OWNER TO admin;

--
-- Name: TABLE event_media; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.event_media IS 'Médias associés aux événements (photos, vidéos, documents)';


--
-- Name: event_participants; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.event_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    role public.event_participant_role NOT NULL,
    display_order integer DEFAULT 0,
    is_confirmed boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    participation_fee numeric(10,2),
    prize_money numeric(10,2),
    performance_stats jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_event_participants_fee CHECK (((participation_fee IS NULL) OR (participation_fee >= (0)::numeric))),
    CONSTRAINT chk_event_participants_order CHECK ((display_order >= 0)),
    CONSTRAINT chk_event_participants_prize CHECK (((prize_money IS NULL) OR (prize_money >= (0)::numeric)))
);


ALTER TABLE public.event_participants OWNER TO admin;

--
-- Name: TABLE event_participants; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.event_participants IS 'Liaison entre événements et participants avec rôles spécifiques';


--
-- Name: event_restrictions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.event_restrictions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    restriction_type public.restriction_type NOT NULL,
    value character varying(200),
    description text,
    is_enforced boolean DEFAULT true NOT NULL,
    severity public.severity_level DEFAULT 'MEDIUM'::public.severity_level NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_restrictions OWNER TO admin;

--
-- Name: TABLE event_restrictions; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.event_restrictions IS 'Restrictions et conditions d''accès aux événements';


--
-- Name: event_schedules; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.event_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    schedule_type character varying(50) NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration integer,
    location_within_venue character varying(200),
    presenter character varying(200),
    display_order integer DEFAULT 0,
    is_mandatory boolean DEFAULT false NOT NULL,
    is_live boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_event_schedules_duration CHECK (((duration IS NULL) OR (duration > 0))),
    CONSTRAINT chk_event_schedules_order CHECK ((display_order >= 0)),
    CONSTRAINT chk_event_schedules_times CHECK (((end_time IS NULL) OR (end_time >= start_time)))
);


ALTER TABLE public.event_schedules OWNER TO admin;

--
-- Name: TABLE event_schedules; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.event_schedules IS 'Programme détaillé pour événements complexes (concerts, conférences)';


--
-- Name: event_stats; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.event_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    stat_type character varying(100) NOT NULL,
    stat_category character varying(50),
    value_numeric numeric(15,4),
    value_text text,
    value_json jsonb,
    participant_id uuid,
    period character varying(50),
    timestamp_recorded timestamp with time zone DEFAULT now(),
    is_official boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_event_stats_value_not_all_null CHECK (((value_numeric IS NOT NULL) OR (value_text IS NOT NULL) OR (value_json IS NOT NULL)))
);


ALTER TABLE public.event_stats OWNER TO admin;

--
-- Name: TABLE event_stats; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.event_stats IS 'Statistiques et résultats des événements en temps réel';


--
-- Name: event_ticket_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.event_ticket_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    ticket_type_id uuid NOT NULL,
    zone_id character varying(255),
    organizer_id uuid,
    price_override numeric(10,2),
    available_quantity integer,
    sold_quantity integer DEFAULT 0 NOT NULL,
    sale_start_date timestamp with time zone,
    sale_end_date timestamp with time zone,
    min_purchase_quantity integer DEFAULT 1,
    max_purchase_quantity integer DEFAULT 8,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_event_ticket_config_price_override CHECK (((price_override IS NULL) OR (price_override >= (0)::numeric))),
    CONSTRAINT chk_event_ticket_config_purchase_quantities CHECK (((min_purchase_quantity >= 1) AND ((max_purchase_quantity IS NULL) OR (max_purchase_quantity >= min_purchase_quantity)))),
    CONSTRAINT chk_event_ticket_config_quantities CHECK (((available_quantity IS NULL) OR (available_quantity >= 0))),
    CONSTRAINT chk_event_ticket_config_quantity_consistency CHECK (((available_quantity IS NULL) OR (sold_quantity <= available_quantity))),
    CONSTRAINT chk_event_ticket_config_sale_dates CHECK (((sale_end_date IS NULL) OR (sale_start_date IS NULL) OR (sale_end_date >= sale_start_date))),
    CONSTRAINT chk_event_ticket_config_sold_quantity CHECK ((sold_quantity >= 0))
);


ALTER TABLE public.event_ticket_config OWNER TO admin;

--
-- Name: TABLE event_ticket_config; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.event_ticket_config IS 'Configuration spécifique de billetterie par événement et organisateur';


--
-- Name: events; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    event_group_id uuid,
    category_id uuid NOT NULL,
    organizer_id uuid NOT NULL,
    venue_id character varying(255) NOT NULL,
    mapping_id character varying(255) NOT NULL,
    scheduled_start timestamp with time zone NOT NULL,
    scheduled_end timestamp with time zone NOT NULL,
    actual_start timestamp with time zone,
    actual_end timestamp with time zone,
    expected_duration integer,
    sales_start timestamp with time zone,
    sales_end timestamp with time zone,
    status public.event_status DEFAULT 'DRAFT'::public.event_status NOT NULL,
    visibility public.event_visibility DEFAULT 'PUBLIC'::public.event_visibility NOT NULL,
    max_capacity integer,
    current_capacity integer DEFAULT 0 NOT NULL,
    capacity_override integer,
    organizer_contact_name character varying(200),
    organizer_contact_email character varying(255),
    organizer_contact_phone character varying(20),
    pricing_config jsonb,
    restrictions jsonb,
    metadata jsonb,
    tags text[],
    is_featured boolean DEFAULT false NOT NULL,
    created_by uuid NOT NULL,
    published_by uuid,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_events_actual_dates CHECK (((actual_end IS NULL) OR (actual_start IS NULL) OR (actual_end >= actual_start))),
    CONSTRAINT chk_events_capacity CHECK (((max_capacity IS NULL) OR (max_capacity > 0))),
    CONSTRAINT chk_events_capacity_consistency CHECK (((max_capacity IS NULL) OR (current_capacity <= max_capacity))),
    CONSTRAINT chk_events_current_capacity CHECK ((current_capacity >= 0)),
    CONSTRAINT chk_events_duration CHECK (((expected_duration IS NULL) OR (expected_duration > 0))),
    CONSTRAINT chk_events_organizer_contact_email CHECK (((organizer_contact_email IS NULL) OR ((organizer_contact_email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))),
    CONSTRAINT chk_events_sales_dates CHECK (((sales_end IS NULL) OR (sales_start IS NULL) OR (sales_end >= sales_start))),
    CONSTRAINT chk_events_scheduled_dates CHECK ((scheduled_end >= scheduled_start))
);


ALTER TABLE public.events OWNER TO admin;

--
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.events IS 'Événements individuels avec référence obligatoire vers leur organisateur';


--
-- Name: groups; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    type public.group_type NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    max_members integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_groups_max_members CHECK (((max_members IS NULL) OR (max_members > 0))),
    CONSTRAINT chk_groups_valid_dates CHECK (((valid_until IS NULL) OR (valid_until >= valid_from)))
);


ALTER TABLE public.groups OWNER TO admin;

--
-- Name: TABLE groups; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.groups IS 'Groupes spécifiques pour droits granulaires et segmentation marketing';


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.login_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    user_id uuid,
    ip_address inet NOT NULL,
    user_agent text,
    success boolean NOT NULL,
    failure_reason character varying(100),
    is_suspicious boolean DEFAULT false NOT NULL,
    geolocation jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_login_attempts_email_format CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))
);


ALTER TABLE public.login_attempts OWNER TO admin;

--
-- Name: TABLE login_attempts; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.login_attempts IS 'Tentatives de connexion pour détection d''anomalies';


--
-- Name: mfa_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.mfa_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    method public.mfa_method NOT NULL,
    token_hash character varying(255) NOT NULL,
    secret character varying(255),
    expires_at timestamp with time zone NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    used_at timestamp with time zone,
    CONSTRAINT chk_mfa_tokens_expired_must_be_used CHECK (((expires_at > now()) OR (is_used = true))),
    CONSTRAINT chk_mfa_tokens_expires CHECK ((expires_at > created_at))
);


ALTER TABLE public.mfa_tokens OWNER TO admin;

--
-- Name: TABLE mfa_tokens; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.mfa_tokens IS 'Tokens d''authentification multi-facteurs temporaires';


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    subscription_plan_id uuid,
    ticket_type_id uuid,
    event_id uuid,
    item_type public.order_item_type NOT NULL,
    item_name character varying(200) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_price numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    item_configuration jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_order_items_amounts CHECK (((unit_price >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (total_price >= (0)::numeric))),
    CONSTRAINT chk_order_items_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_order_items_quantity CHECK ((quantity > 0)),
    CONSTRAINT chk_order_items_source_exclusive CHECK ((((((subscription_plan_id IS NOT NULL))::integer + ((ticket_type_id IS NOT NULL))::integer) + ((event_id IS NOT NULL))::integer) = 1))
);


ALTER TABLE public.order_items OWNER TO admin;

--
-- Name: TABLE order_items; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.order_items IS 'Lignes de commande détaillant les achats';


--
-- Name: orders; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number character varying(50) NOT NULL,
    user_id uuid,
    primary_organizer_id uuid,
    status public.order_status DEFAULT 'DRAFT'::public.order_status NOT NULL,
    subtotal_amount numeric(10,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
    processing_fee numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    purchase_channel public.purchase_channel DEFAULT 'WEB'::public.purchase_channel NOT NULL,
    coupon_code character varying(50),
    guest_name character varying(200),
    guest_email character varying(255),
    guest_phone character varying(20),
    notes text,
    metadata jsonb,
    confirmed_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_orders_amounts CHECK (((subtotal_amount >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (tax_amount >= (0)::numeric) AND (processing_fee >= (0)::numeric) AND (total_amount >= (0)::numeric))),
    CONSTRAINT chk_orders_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_orders_guest_email_format CHECK (((guest_email IS NULL) OR ((guest_email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))),
    CONSTRAINT chk_orders_guest_required CHECK (((user_id IS NOT NULL) OR ((user_id IS NULL) AND (guest_name IS NOT NULL) AND (guest_email IS NOT NULL))))
);


ALTER TABLE public.orders OWNER TO admin;

--
-- Name: TABLE orders; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.orders IS 'Commandes passées par les utilisateurs avec organisateur principal automatique';


--
-- Name: organizer_commissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.organizer_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_id uuid NOT NULL,
    order_id uuid NOT NULL,
    organizer_id uuid NOT NULL,
    commission_type character varying(30) NOT NULL,
    base_amount numeric(10,2) NOT NULL,
    commission_rate numeric(5,4),
    commission_amount numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    net_to_organizer numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    contract_version character varying(20) DEFAULT 'v2.1'::character varying,
    commission_tier character varying(20),
    volume_bonus numeric(8,2) DEFAULT 0,
    loyalty_bonus numeric(8,2) DEFAULT 0,
    calculation_details jsonb NOT NULL,
    status public.commission_status DEFAULT 'PENDING'::public.commission_status NOT NULL,
    payment_due_date date NOT NULL,
    paid_date timestamp with time zone,
    payment_reference character varying(100),
    notes text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_organizer_commissions_amounts CHECK (((base_amount >= (0)::numeric) AND (commission_amount >= (0)::numeric) AND (platform_fee >= (0)::numeric) AND (net_to_organizer >= (0)::numeric))),
    CONSTRAINT chk_organizer_commissions_bonuses CHECK (((volume_bonus >= (0)::numeric) AND (loyalty_bonus >= (0)::numeric))),
    CONSTRAINT chk_organizer_commissions_calculation_consistency CHECK ((net_to_organizer = ((((base_amount - commission_amount) - platform_fee) + volume_bonus) + loyalty_bonus))),
    CONSTRAINT chk_organizer_commissions_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_organizer_commissions_rate CHECK (((commission_rate IS NULL) OR ((commission_rate >= (0)::numeric) AND (commission_rate <= (1)::numeric))))
);


ALTER TABLE public.organizer_commissions OWNER TO admin;

--
-- Name: TABLE organizer_commissions; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.organizer_commissions IS 'Commissions calculées pour les organisateurs (renommé de club_commissions)';


--
-- Name: organizers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.organizers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    short_name character varying(100),
    type public.organizer_type NOT NULL,
    status public.organizer_status DEFAULT 'PENDING'::public.organizer_status NOT NULL,
    legal_name character varying(300),
    rnis character varying(20),
    tax_id character varying(50),
    registration_number character varying(100),
    contact_email character varying(255) NOT NULL,
    contact_phone character varying(20),
    address text,
    city character varying(100),
    postal_code character varying(20),
    country character varying(2) DEFAULT 'TN'::character varying NOT NULL,
    commission_rate numeric(5,4) DEFAULT 0.1200 NOT NULL,
    payment_terms integer DEFAULT 15 NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    is_vat_registered boolean DEFAULT false NOT NULL,
    accepts_online_payments boolean DEFAULT true NOT NULL,
    auto_confirm_events boolean DEFAULT false NOT NULL,
    logo_url text,
    banner_url text,
    website_url text,
    social_media jsonb,
    description text,
    specialties text[],
    target_audience text[],
    legal_documents jsonb,
    banking_details jsonb,
    insurance_info jsonb,
    total_events_organized integer DEFAULT 0 NOT NULL,
    total_revenue_generated numeric(15,2) DEFAULT 0 NOT NULL,
    average_satisfaction_score numeric(3,2),
    last_event_date date,
    validated_at timestamp with time zone,
    validated_by uuid,
    accreditation_level character varying(20) DEFAULT 'BASIC'::character varying,
    certification_expires_at date,
    preferences jsonb,
    business_hours jsonb,
    emergency_contact jsonb,
    metadata jsonb,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_organizers_commission_rate CHECK (((commission_rate >= (0)::numeric) AND (commission_rate <= 0.5000))),
    CONSTRAINT chk_organizers_contact_email_format CHECK (((contact_email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT chk_organizers_contact_phone_format CHECK (((contact_phone IS NULL) OR ((contact_phone)::text ~* '^[+]?[1-9][0-9]{7,14}$'::text))),
    CONSTRAINT chk_organizers_country CHECK ((length((country)::text) = 2)),
    CONSTRAINT chk_organizers_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_organizers_payment_terms CHECK (((payment_terms >= 0) AND (payment_terms <= 90))),
    CONSTRAINT chk_organizers_satisfaction_score CHECK (((average_satisfaction_score IS NULL) OR ((average_satisfaction_score >= (0)::numeric) AND (average_satisfaction_score <= (10)::numeric)))),
    CONSTRAINT chk_organizers_total_events CHECK ((total_events_organized >= 0)),
    CONSTRAINT chk_organizers_total_revenue CHECK ((total_revenue_generated >= (0)::numeric))
);


ALTER TABLE public.organizers OWNER TO admin;

--
-- Name: TABLE organizers; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.organizers IS 'Organisateurs d''événements - entités qui ORGANISENT et gèrent les événements (Club Africain, Ennejma Ezzahra, UTICA, etc.)';


--
-- Name: participant_relationships; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.participant_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    participant_a_id uuid NOT NULL,
    participant_b_id uuid NOT NULL,
    relationship_type public.participant_relationship_type NOT NULL,
    intensity integer DEFAULT 5 NOT NULL,
    is_mutual boolean DEFAULT true NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    description text,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_participant_relationships_dates CHECK (((end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT chk_participant_relationships_different_participants CHECK ((participant_a_id <> participant_b_id)),
    CONSTRAINT chk_participant_relationships_intensity CHECK (((intensity >= 1) AND (intensity <= 10)))
);


ALTER TABLE public.participant_relationships OWNER TO admin;

--
-- Name: TABLE participant_relationships; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.participant_relationships IS 'Relations entre participants (rivalités, partenariats, affiliations)';


--
-- Name: participant_staff; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.participant_staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    participant_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    nickname character varying(50),
    date_of_birth date,
    nationality character varying(2),
    role character varying(100) NOT NULL,
    "position" character varying(100),
    jersey_number integer,
    contract_start date,
    contract_end date,
    salary numeric(12,2),
    currency character varying(3) DEFAULT 'TND'::character varying,
    statistics jsonb,
    metadata jsonb,
    photo_url text,
    biography text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_participant_staff_contract_dates CHECK (((contract_end IS NULL) OR (contract_end >= contract_start))),
    CONSTRAINT chk_participant_staff_jersey_number CHECK (((jersey_number IS NULL) OR ((jersey_number >= 1) AND (jersey_number <= 99)))),
    CONSTRAINT chk_participant_staff_salary CHECK (((salary IS NULL) OR (salary >= (0)::numeric)))
);


ALTER TABLE public.participant_staff OWNER TO admin;

--
-- Name: TABLE participant_staff; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.participant_staff IS 'Personnel des participants (joueurs, musiciens, staff technique)';


--
-- Name: participants; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    short_name character varying(100),
    type public.participant_type NOT NULL,
    category character varying(50),
    participant_category character varying(50),
    nationality character varying(2),
    city character varying(100),
    founded_date date,
    disbanded_date date,
    logo_url text,
    banner_url text,
    website_url text,
    contact_email character varying(255),
    contact_phone character varying(20),
    contact_address text,
    social_media jsonb,
    description text,
    achievements text[],
    statistics jsonb,
    metadata jsonb,
    booking_agent_info jsonb,
    technical_requirements jsonb,
    hospitality_requirements jsonb,
    affiliated_organizer_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_participants_code_format CHECK (((code)::text ~* '^[A-Z0-9_]+$'::text)),
    CONSTRAINT chk_participants_founded_disbanded CHECK (((disbanded_date IS NULL) OR (disbanded_date >= founded_date))),
    CONSTRAINT chk_participants_nationality CHECK (((nationality IS NULL) OR (length((nationality)::text) = 2)))
);


ALTER TABLE public.participants OWNER TO admin;

--
-- Name: TABLE participants; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.participants IS 'Participants aux événements - entités qui PARTICIPENT (équipes sportives, artistes, speakers, arbitres, etc.)';


--
-- Name: payment_attempts; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payment_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_id uuid NOT NULL,
    attempt_number integer NOT NULL,
    status public.payment_status NOT NULL,
    failure_reason text,
    gateway_request jsonb,
    gateway_response jsonb,
    processing_time_ms integer,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_payment_attempts_number CHECK ((attempt_number > 0)),
    CONSTRAINT chk_payment_attempts_processing_time CHECK (((processing_time_ms IS NULL) OR (processing_time_ms >= 0)))
);


ALTER TABLE public.payment_attempts OWNER TO admin;

--
-- Name: TABLE payment_attempts; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.payment_attempts IS 'Tentatives de paiement avec détails d''échec';


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    provider character varying(50) NOT NULL,
    type public.payment_method_type NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    min_amount numeric(10,2) DEFAULT 0,
    max_amount numeric(10,2),
    processing_fee_fixed numeric(8,2) DEFAULT 0,
    processing_fee_percent numeric(5,4) DEFAULT 0,
    configuration jsonb,
    display_order integer DEFAULT 0,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_payment_methods_amounts CHECK (((min_amount >= (0)::numeric) AND ((max_amount IS NULL) OR (max_amount >= min_amount)))),
    CONSTRAINT chk_payment_methods_fees CHECK (((processing_fee_fixed >= (0)::numeric) AND (processing_fee_percent >= (0)::numeric))),
    CONSTRAINT chk_payment_methods_order CHECK ((display_order >= 0))
);


ALTER TABLE public.payment_methods OWNER TO admin;

--
-- Name: TABLE payment_methods; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.payment_methods IS 'Méthodes de paiement disponibles (Flouci, cartes, virements)';


--
-- Name: payment_webhooks; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payment_webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    webhook_id character varying(100) NOT NULL,
    payment_id uuid,
    event_type character varying(50) NOT NULL,
    external_transaction_id character varying(100) NOT NULL,
    status public.webhook_status DEFAULT 'RECEIVED'::public.webhook_status NOT NULL,
    raw_payload jsonb NOT NULL,
    parsed_data jsonb,
    signature character varying(255),
    signature_valid boolean,
    ip_source inet,
    user_agent text,
    processing_attempts integer DEFAULT 0 NOT NULL,
    last_processing_error text,
    processed_at timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_payment_webhooks_processing_attempts CHECK ((processing_attempts >= 0))
);


ALTER TABLE public.payment_webhooks OWNER TO admin;

--
-- Name: TABLE payment_webhooks; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.payment_webhooks IS 'Webhooks reçus des passerelles de paiement (Flouci)';


--
-- Name: payments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_number character varying(50) NOT NULL,
    order_id uuid NOT NULL,
    payment_method_id uuid NOT NULL,
    primary_organizer_id uuid,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    external_transaction_id character varying(100),
    processing_fee numeric(8,2) DEFAULT 0 NOT NULL,
    net_amount numeric(10,2) NOT NULL,
    payment_date timestamp with time zone,
    expires_at timestamp with time zone,
    gateway_data jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_payments_amounts CHECK (((amount >= (0)::numeric) AND (processing_fee >= (0)::numeric) AND (net_amount >= (0)::numeric))),
    CONSTRAINT chk_payments_currency CHECK ((length((currency)::text) = 3))
);


ALTER TABLE public.payments OWNER TO admin;

--
-- Name: TABLE payments; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.payments IS 'Paiements effectués pour les commandes avec référence organisateur';


--
-- Name: persistent_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.persistent_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_type public.persistent_token_type NOT NULL,
    token_hash character varying(255) NOT NULL,
    token_prefix character varying(8) NOT NULL,
    name character varying(100),
    description character varying(255),
    scopes text[] DEFAULT '{}'::text[],
    expires_at timestamp with time zone,
    last_used_at timestamp with time zone,
    last_used_ip inet,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_revoked boolean DEFAULT false,
    revoked_at timestamp with time zone,
    revoked_by uuid,
    revoked_reason character varying(255),
    device_info jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.persistent_tokens OWNER TO admin;

--
-- Name: pricing_rules; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.pricing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    rule_type public.pricing_rule_type NOT NULL,
    organizer_id uuid,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_until timestamp with time zone,
    priority integer DEFAULT 0 NOT NULL,
    is_stackable boolean DEFAULT false NOT NULL,
    max_applications integer,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_pricing_rules_dates CHECK (((valid_until IS NULL) OR (valid_until >= valid_from))),
    CONSTRAINT chk_pricing_rules_max_applications CHECK (((max_applications IS NULL) OR (max_applications > 0))),
    CONSTRAINT chk_pricing_rules_priority CHECK ((priority >= 0))
);


ALTER TABLE public.pricing_rules OWNER TO admin;

--
-- Name: TABLE pricing_rules; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.pricing_rules IS 'Règles de tarification et promotions définies par organisateur';


--
-- Name: rate_limiting; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rate_limiting (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    endpoint character varying(200) NOT NULL,
    identifier_type character varying(50) NOT NULL,
    identifier_value character varying(255) NOT NULL,
    requests_count integer DEFAULT 1 NOT NULL,
    window_start timestamp with time zone DEFAULT now() NOT NULL,
    is_blocked boolean DEFAULT false NOT NULL,
    last_request timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_rate_limiting_requests_count CHECK ((requests_count > 0))
);


ALTER TABLE public.rate_limiting OWNER TO admin;

--
-- Name: TABLE rate_limiting; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.rate_limiting IS 'Limitation du taux de requêtes par endpoint et utilisateur';


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.refunds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    refund_number character varying(50) NOT NULL,
    payment_id uuid NOT NULL,
    order_id uuid NOT NULL,
    refund_type public.refund_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    method public.refund_method NOT NULL,
    status public.refund_status DEFAULT 'PENDING'::public.refund_status NOT NULL,
    reason character varying(100) NOT NULL,
    description text,
    requested_by uuid,
    approved_by uuid,
    external_refund_id character varying(100),
    processing_fee numeric(8,2) DEFAULT 0 NOT NULL,
    net_refund_amount numeric(10,2) NOT NULL,
    expected_date date,
    completed_date timestamp with time zone,
    gateway_response jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_refunds_amounts CHECK (((amount >= (0)::numeric) AND (processing_fee >= (0)::numeric) AND (net_refund_amount >= (0)::numeric)))
);


ALTER TABLE public.refunds OWNER TO admin;

--
-- Name: TABLE refunds; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.refunds IS 'Remboursements traités';


--
-- Name: roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    level integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    permissions jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_roles_code_format CHECK (((code)::text ~* '^[A-Z_]+$'::text)),
    CONSTRAINT chk_roles_level_range CHECK (((level >= 0) AND (level <= 100)))
);


ALTER TABLE public.roles OWNER TO admin;

--
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.roles IS 'Rôles généraux définissant les niveaux d''accès globaux';


--
-- Name: seats; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.seats (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    zone_id character varying(255) NOT NULL,
    seat_number character varying(20) NOT NULL,
    row_number character varying(20),
    seat_type public.seat_type DEFAULT 'STANDARD'::public.seat_type NOT NULL,
    status public.seat_status DEFAULT 'AVAILABLE'::public.seat_status NOT NULL,
    x_coordinate numeric(10,4),
    y_coordinate numeric(10,4),
    price_modifier numeric(5,4) DEFAULT 1.0000,
    features text[],
    is_accessible boolean DEFAULT false NOT NULL,
    accessibility_notes text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_seats_price_modifier CHECK ((price_modifier >= (0)::numeric)),
    CONSTRAINT chk_seats_seat_number CHECK ((length(TRIM(BOTH FROM seat_number)) > 0))
);


ALTER TABLE public.seats OWNER TO admin;

--
-- Name: TABLE seats; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.seats IS 'Places individuelles numérotées pour les zones qui le nécessitent';


--
-- Name: security_events; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.security_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(100) NOT NULL,
    severity public.security_level NOT NULL,
    target_user_id uuid,
    ip_address inet,
    description text NOT NULL,
    event_data jsonb,
    status character varying(50) DEFAULT 'OPEN'::character varying NOT NULL,
    resolved_at timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_security_events_description CHECK ((length(TRIM(BOTH FROM description)) > 0))
);


ALTER TABLE public.security_events OWNER TO admin;

--
-- Name: TABLE security_events; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.security_events IS 'Événements de sécurité détectés automatiquement';


--
-- Name: security_policies; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.security_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    policy_type character varying(50) NOT NULL,
    rules jsonb NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    is_enforced boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_security_policies_dates CHECK (((valid_until IS NULL) OR (valid_until >= valid_from)))
);


ALTER TABLE public.security_policies OWNER TO admin;

--
-- Name: TABLE security_policies; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.security_policies IS 'Politiques de sécurité configurables';


--
-- Name: subscription_plan_event_groups; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.subscription_plan_event_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_plan_id uuid NOT NULL,
    event_group_id uuid NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    access_level character varying(50) DEFAULT 'STANDARD'::character varying,
    priority_level integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscription_plan_event_groups OWNER TO admin;

--
-- Name: TABLE subscription_plan_event_groups; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.subscription_plan_event_groups IS 'Liaison entre plans d''abonnement et groupes d''événements';


--
-- Name: subscription_plan_events; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.subscription_plan_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_plan_id uuid NOT NULL,
    event_id uuid NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    is_priority boolean DEFAULT false NOT NULL,
    access_level character varying(50) DEFAULT 'STANDARD'::character varying,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscription_plan_events OWNER TO admin;

--
-- Name: TABLE subscription_plan_events; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.subscription_plan_events IS 'Liaison entre plans d''abonnement et événements spécifiques';


--
-- Name: subscription_plan_zones; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.subscription_plan_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_plan_id uuid NOT NULL,
    zone_id character varying(255) NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    price_override numeric(10,2),
    priority_level integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_subscription_plan_zones_price_override CHECK (((price_override IS NULL) OR (price_override >= (0)::numeric))),
    CONSTRAINT chk_subscription_plan_zones_priority CHECK ((priority_level >= 0))
);


ALTER TABLE public.subscription_plan_zones OWNER TO admin;

--
-- Name: TABLE subscription_plan_zones; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.subscription_plan_zones IS 'Liaison entre plans d''abonnement et zones de venue';


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    type public.subscription_plan_type NOT NULL,
    price numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    max_subscribers integer,
    current_subscribers integer DEFAULT 0 NOT NULL,
    organizer_id uuid NOT NULL,
    valid_from date NOT NULL,
    valid_until date NOT NULL,
    sale_start_date date,
    sale_end_date date,
    transferable boolean DEFAULT false NOT NULL,
    max_transfers integer DEFAULT 0,
    auto_renew boolean DEFAULT false NOT NULL,
    includes_playoffs boolean DEFAULT false NOT NULL,
    priority_booking boolean DEFAULT false NOT NULL,
    benefits jsonb,
    restrictions jsonb,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_subscription_plans_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_subscription_plans_current_subscribers CHECK ((current_subscribers >= 0)),
    CONSTRAINT chk_subscription_plans_dates CHECK ((valid_until >= valid_from)),
    CONSTRAINT chk_subscription_plans_max_subscribers CHECK (((max_subscribers IS NULL) OR (max_subscribers > 0))),
    CONSTRAINT chk_subscription_plans_max_transfers CHECK ((max_transfers >= 0)),
    CONSTRAINT chk_subscription_plans_price CHECK ((price >= (0)::numeric)),
    CONSTRAINT chk_subscription_plans_sale_dates CHECK (((sale_end_date IS NULL) OR (sale_start_date IS NULL) OR (sale_end_date >= sale_start_date))),
    CONSTRAINT chk_subscription_plans_subscribers_consistency CHECK (((max_subscribers IS NULL) OR (current_subscribers <= max_subscribers)))
);


ALTER TABLE public.subscription_plans OWNER TO admin;

--
-- Name: TABLE subscription_plans; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.subscription_plans IS 'Plans d''abonnements créés PAR un organisateur pour SES événements';


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_number character varying(50) NOT NULL,
    plan_id uuid NOT NULL,
    user_id uuid,
    organizer_id uuid,
    status public.subscription_status DEFAULT 'PENDING'::public.subscription_status NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    price_paid numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    transfers_used integer DEFAULT 0 NOT NULL,
    next_billing_date date,
    auto_renew_enabled boolean DEFAULT false NOT NULL,
    subscriber_benefits jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_subscriptions_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_subscriptions_dates CHECK ((end_date >= start_date)),
    CONSTRAINT chk_subscriptions_price CHECK ((price_paid >= (0)::numeric)),
    CONSTRAINT chk_subscriptions_transfers_used CHECK ((transfers_used >= 0))
);


ALTER TABLE public.subscriptions OWNER TO admin;

--
-- Name: TABLE subscriptions; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.subscriptions IS 'Abonnements souscrits par les utilisateurs avec référence organisateur';


--
-- Name: ticket_templates; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.ticket_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    template_type public.template_type NOT NULL,
    format public.template_format DEFAULT 'PDF'::public.template_format NOT NULL,
    orientation public.orientation_type DEFAULT 'PORTRAIT'::public.orientation_type NOT NULL,
    template_content text NOT NULL,
    style_css text,
    paper_size character varying(20) DEFAULT 'A4'::character varying,
    margin_top integer DEFAULT 20,
    margin_bottom integer DEFAULT 20,
    margin_left integer DEFAULT 20,
    margin_right integer DEFAULT 20,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_ticket_templates_margins CHECK (((margin_top >= 0) AND (margin_bottom >= 0) AND (margin_left >= 0) AND (margin_right >= 0)))
);


ALTER TABLE public.ticket_templates OWNER TO admin;

--
-- Name: TABLE ticket_templates; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.ticket_templates IS 'Templates pour génération des billets PDF/HTML';


--
-- Name: ticket_types; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.ticket_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    base_price numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    organizer_id uuid,
    transferable boolean DEFAULT true NOT NULL,
    refundable boolean DEFAULT false NOT NULL,
    max_quantity_per_order integer DEFAULT 8,
    valid_from date,
    valid_until date,
    restrictions jsonb,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_ticket_types_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_ticket_types_dates CHECK (((valid_until IS NULL) OR (valid_from IS NULL) OR (valid_until >= valid_from))),
    CONSTRAINT chk_ticket_types_max_quantity CHECK (((max_quantity_per_order IS NULL) OR (max_quantity_per_order > 0))),
    CONSTRAINT chk_ticket_types_price CHECK ((base_price >= (0)::numeric))
);


ALTER TABLE public.ticket_types OWNER TO admin;

--
-- Name: TABLE ticket_types; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.ticket_types IS 'Types de billets avec prix de base et organisateur créateur';


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_number character varying(50) NOT NULL,
    ticket_type_id uuid NOT NULL,
    user_id uuid,
    event_id uuid NOT NULL,
    zone_id character varying(255),
    seat_id character varying(255),
    organizer_id uuid,
    price_paid numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    special_requirements text,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_tickets_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_tickets_price CHECK ((price_paid >= (0)::numeric))
);


ALTER TABLE public.tickets OWNER TO admin;

--
-- Name: TABLE tickets; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.tickets IS 'Billets individuels achetés par les utilisateurs avec référence organisateur';


--
-- Name: user_groups; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone,
    status public.membership_status DEFAULT 'ACTIVE'::public.membership_status NOT NULL,
    added_by uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_user_groups_valid_dates CHECK (((valid_until IS NULL) OR (valid_until >= joined_at)))
);


ALTER TABLE public.user_groups OWNER TO admin;

--
-- Name: TABLE user_groups; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.user_groups IS 'Liaison utilisateur-groupe avec métadonnées spécifiques';


--
-- Name: user_mfa_settings; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_mfa_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    method public.mfa_method NOT NULL,
    is_enabled boolean DEFAULT false,
    is_primary boolean DEFAULT false,
    backup_phone character varying(20),
    totp_secret character varying(255),
    backup_codes_count integer DEFAULT 0,
    last_used_at timestamp(6) with time zone,
    enabled_at timestamp(6) with time zone,
    disabled_at timestamp(6) with time zone,
    metadata jsonb,
    created_at timestamp(6) with time zone DEFAULT now(),
    updated_at timestamp(6) with time zone DEFAULT now()
);


ALTER TABLE public.user_mfa_settings OWNER TO admin;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date_of_birth date,
    gender public.gender,
    address text,
    city character varying(100),
    country character varying(2) DEFAULT 'TN'::character varying NOT NULL,
    postal_code character varying(20),
    language character varying(5) DEFAULT 'fr'::character varying NOT NULL,
    timezone character varying(50) DEFAULT 'Africa/Tunis'::character varying,
    notifications boolean DEFAULT true NOT NULL,
    newsletter boolean DEFAULT false NOT NULL,
    supporter_since date,
    favorite_player character varying(100),
    favorite_team_id uuid,
    preferences jsonb,
    emergency_contact jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    identity_document_type public.identity_document_type,
    identity_document_number character varying(50),
    identity_verified_at timestamp with time zone,
    identity_verified boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_user_profiles_birth_date CHECK (((date_of_birth IS NULL) OR (date_of_birth <= (CURRENT_DATE - '13 years'::interval)))),
    CONSTRAINT chk_user_profiles_country_code CHECK ((length((country)::text) = 2)),
    CONSTRAINT chk_user_profiles_identity_consistency CHECK ((((identity_document_number IS NULL) AND (identity_document_type IS NULL)) OR ((identity_document_number IS NOT NULL) AND (identity_document_type IS NOT NULL)))),
    CONSTRAINT chk_user_profiles_identity_number_format CHECK (((identity_document_number IS NULL) OR
CASE
    WHEN (identity_document_type = 'CIN'::public.identity_document_type) THEN ((identity_document_number)::text ~ '^[0-9]{8}$'::text)
    WHEN (identity_document_type = 'PASSPORT'::public.identity_document_type) THEN ((identity_document_number)::text ~ '^[A-Z0-9]{6,20}$'::text)
    WHEN (identity_document_type = 'DRIVING_LICENSE'::public.identity_document_type) THEN ((length((identity_document_number)::text) >= 5) AND (length((identity_document_number)::text) <= 20))
    ELSE (length((identity_document_number)::text) >= 3)
END)),
    CONSTRAINT chk_user_profiles_identity_verification CHECK (((identity_verified = false) OR ((identity_verified = true) AND (identity_verified_at IS NOT NULL)))),
    CONSTRAINT chk_user_profiles_identity_verified_date CHECK (((identity_verified_at IS NULL) OR (identity_verified_at <= now()))),
    CONSTRAINT chk_user_profiles_language_code CHECK (((language)::text ~* '^[a-z]{2}(-[A-Z]{2})?$'::text)),
    CONSTRAINT chk_user_profiles_supporter_since CHECK (((supporter_since IS NULL) OR (supporter_since <= CURRENT_DATE)))
);


ALTER TABLE public.user_profiles OWNER TO admin;

--
-- Name: TABLE user_profiles; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.user_profiles IS 'Profils étendus des utilisateurs avec démographie et préférences';


--
-- Name: COLUMN user_profiles.identity_document_type; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.user_profiles.identity_document_type IS 'Type de document d''identité fourni par l''utilisateur';


--
-- Name: COLUMN user_profiles.identity_document_number; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.user_profiles.identity_document_number IS 'Numéro du document d''identité (format dépend du type)';


--
-- Name: COLUMN user_profiles.identity_verified_at; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.user_profiles.identity_verified_at IS 'Date et heure de vérification du document d''identité';


--
-- Name: COLUMN user_profiles.identity_verified; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.user_profiles.identity_verified IS 'Indique si le document d''identité a été vérifié';


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone,
    status public.membership_status DEFAULT 'ACTIVE'::public.membership_status NOT NULL,
    assigned_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_user_roles_valid_dates CHECK (((valid_until IS NULL) OR (valid_until >= assigned_at)))
);


ALTER TABLE public.user_roles OWNER TO admin;

--
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.user_roles IS 'Liaison utilisateur-rôle avec gestion temporelle';


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_token character varying(256) NOT NULL,
    user_id uuid NOT NULL,
    ip_address inet NOT NULL,
    user_agent text,
    device_fingerprint character varying(255),
    geolocation jsonb,
    is_active boolean DEFAULT true NOT NULL,
    last_activity timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_user_sessions_expires CHECK ((expires_at > created_at))
);


ALTER TABLE public.user_sessions OWNER TO admin;

--
-- Name: TABLE user_sessions; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.user_sessions IS 'Sessions utilisateurs actives avec tracking de sécurité';


--
-- Name: user_trusted_devices; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_trusted_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_fingerprint character varying(255) NOT NULL,
    device_name character varying(200),
    trusted_at timestamp(6) with time zone DEFAULT now(),
    expires_at timestamp(6) with time zone NOT NULL,
    last_seen_at timestamp(6) with time zone DEFAULT now(),
    ip_address inet,
    user_agent text,
    metadata jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT now()
);


ALTER TABLE public.user_trusted_devices OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    avatar text,
    password character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified boolean,
    phone_verified boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT chk_users_email_format CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT chk_users_names_not_empty CHECK (((length(TRIM(BOTH FROM first_name)) > 0) AND (length(TRIM(BOTH FROM last_name)) > 0))),
    CONSTRAINT chk_users_phone_format CHECK (((phone IS NULL) OR ((phone)::text ~* '^[+]?[1-9][0-9]{7,14}$'::text)))
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.users IS 'Table centrale des utilisateurs avec authentification et informations de base';


--
-- Name: venues; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.venues (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(200) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    postal_code character varying(20),
    country character varying(2) DEFAULT 'TN'::character varying NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    max_capacity integer NOT NULL,
    description text,
    images text[],
    global_amenities text[],
    primary_owner_id uuid,
    primary_manager_id uuid,
    default_mapping_id character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_venues_capacity CHECK ((max_capacity > 0)),
    CONSTRAINT chk_venues_coordinates CHECK ((((latitude IS NULL) AND (longitude IS NULL)) OR ((latitude IS NOT NULL) AND (longitude IS NOT NULL)))),
    CONSTRAINT chk_venues_country CHECK ((length((country)::text) = 2)),
    CONSTRAINT chk_venues_latitude CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)))),
    CONSTRAINT chk_venues_longitude CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))),
    CONSTRAINT chk_venues_owner_manager_different CHECK (((primary_owner_id IS NULL) OR (primary_manager_id IS NULL) OR (primary_owner_id <> primary_manager_id)))
);


ALTER TABLE public.venues OWNER TO admin;

--
-- Name: TABLE venues; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.venues IS 'Lieux physiques (stades, salles) avec propriétaire et gestionnaire principaux';


--
-- Name: v_access_control_stats; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_access_control_stats AS
 SELECT date_trunc('day'::text, acl.scanned_at) AS scan_date,
    e.id AS event_id,
    e.name AS event_name,
    e.scheduled_start,
    o.name AS organizer_name,
    v.name AS venue_name,
    count(DISTINCT acl.id) AS total_scans,
    count(DISTINCT acl.access_right_id) AS unique_access_rights,
    count(DISTINCT acl.user_id) AS unique_users,
    count(DISTINCT acl.id) FILTER (WHERE (acl.result = 'SUCCESS'::public.access_status)) AS successful_scans,
    count(DISTINCT acl.id) FILTER (WHERE (acl.result = 'DENIED'::public.access_status)) AS denied_scans,
    string_agg(DISTINCT (acl.denial_reason)::text, ', '::text) FILTER (WHERE (acl.denial_reason IS NOT NULL)) AS denial_reasons,
    count(DISTINCT acl.id) FILTER (WHERE (acl.action = 'ENTRY'::public.access_action)) AS entries,
    count(DISTINCT acl.id) FILTER (WHERE (acl.action = 'EXIT'::public.access_action)) AS exits,
    round((((count(DISTINCT acl.id) FILTER (WHERE (acl.result = 'SUCCESS'::public.access_status)))::numeric / (NULLIF(count(DISTINCT acl.id), 0))::numeric) * (100)::numeric), 2) AS success_rate
   FROM ((((public.access_control_log acl
     JOIN public.access_rights ar ON ((acl.access_right_id = ar.id)))
     JOIN public.events e ON ((acl.event_id = e.id)))
     JOIN public.organizers o ON ((e.organizer_id = o.id)))
     JOIN public.venues v ON (((e.venue_id)::text = (v.id)::text)))
  WHERE (acl.scanned_at >= (now() - '30 days'::interval))
  GROUP BY (date_trunc('day'::text, acl.scanned_at)), e.id, e.name, e.scheduled_start, o.name, v.name
  ORDER BY (date_trunc('day'::text, acl.scanned_at)) DESC, e.name;


ALTER VIEW public.v_access_control_stats OWNER TO admin;

--
-- Name: v_commission_summary; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_commission_summary AS
 SELECT date_trunc('month'::text, oc.created_at) AS month,
    oc.organizer_id,
    o.name AS organizer_name,
    o.type AS organizer_type,
    count(DISTINCT oc.id) AS commission_count,
    sum(oc.base_amount) AS total_base_amount,
    avg(oc.commission_rate) AS avg_commission_rate,
    sum(oc.commission_amount) AS total_commission_amount,
    sum(oc.platform_fee) AS total_platform_fee,
    sum(oc.net_to_organizer) AS total_net_to_organizer,
    sum(oc.volume_bonus) AS total_volume_bonus,
    sum(oc.loyalty_bonus) AS total_loyalty_bonus,
    count(DISTINCT oc.id) FILTER (WHERE (oc.status = 'PAID'::public.commission_status)) AS paid_commissions,
    count(DISTINCT oc.id) FILTER (WHERE (oc.status = ANY (ARRAY['PENDING'::public.commission_status, 'CALCULATED'::public.commission_status, 'APPROVED'::public.commission_status]))) AS unpaid_commissions,
    sum(oc.net_to_organizer) FILTER (WHERE (oc.status = 'PAID'::public.commission_status)) AS amount_paid,
    sum(oc.net_to_organizer) FILTER (WHERE (oc.status = ANY (ARRAY['PENDING'::public.commission_status, 'CALCULATED'::public.commission_status, 'APPROVED'::public.commission_status]))) AS amount_pending
   FROM (public.organizer_commissions oc
     JOIN public.organizers o ON ((oc.organizer_id = o.id)))
  WHERE (oc.created_at >= (now() - '1 year'::interval))
  GROUP BY (date_trunc('month'::text, oc.created_at)), oc.organizer_id, o.name, o.type
  ORDER BY (date_trunc('month'::text, oc.created_at)) DESC, o.name;


ALTER VIEW public.v_commission_summary OWNER TO admin;

--
-- Name: v_dashboard_admin; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_dashboard_admin AS
 SELECT ( SELECT count(*) AS count
           FROM public.users
          WHERE (users.is_active = true)) AS total_active_users,
    ( SELECT count(*) AS count
           FROM public.organizers
          WHERE (organizers.status = 'ACTIVE'::public.organizer_status)) AS total_active_organizers,
    ( SELECT count(*) AS count
           FROM public.events
          WHERE (events.status = 'PUBLISHED'::public.event_status)) AS total_published_events,
    ( SELECT count(*) AS count
           FROM public.venues
          WHERE (venues.is_active = true)) AS total_active_venues,
    ( SELECT count(*) AS count
           FROM public.users
          WHERE (users.created_at >= (now() - '30 days'::interval))) AS new_users_30d,
    ( SELECT count(*) AS count
           FROM public.events
          WHERE (events.created_at >= (now() - '30 days'::interval))) AS new_events_30d,
    ( SELECT count(*) AS count
           FROM public.tickets
          WHERE (tickets.created_at >= (now() - '30 days'::interval))) AS tickets_sold_30d,
    ( SELECT COALESCE(sum(payments.amount), (0)::numeric) AS "coalesce"
           FROM public.payments
          WHERE ((payments.status = 'COMPLETED'::public.payment_status) AND (payments.payment_date >= (now() - '30 days'::interval)))) AS revenue_30d,
    ( SELECT count(*) AS count
           FROM public.tickets
          WHERE (tickets.created_at >= CURRENT_DATE)) AS tickets_today,
    ( SELECT count(*) AS count
           FROM public.orders
          WHERE (orders.created_at >= CURRENT_DATE)) AS orders_today,
    ( SELECT COALESCE(sum(payments.amount), (0)::numeric) AS "coalesce"
           FROM public.payments
          WHERE ((payments.status = 'COMPLETED'::public.payment_status) AND (payments.payment_date >= CURRENT_DATE))) AS revenue_today,
    ( SELECT count(*) AS count
           FROM public.events
          WHERE (((events.scheduled_start >= now()) AND (events.scheduled_start <= (now() + '7 days'::interval))) AND (events.status = 'PUBLISHED'::public.event_status))) AS events_next_7_days,
        CASE
            WHEN (( SELECT count(*) AS count
               FROM public.users
              WHERE (users.last_login >= (now() - '30 days'::interval))) > 0) THEN round((((( SELECT count(*) AS count
               FROM public.tickets
              WHERE (tickets.created_at >= (now() - '30 days'::interval))))::numeric / (( SELECT count(*) AS count
               FROM public.users
              WHERE (users.last_login >= (now() - '30 days'::interval))))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS conversion_rate_30d,
    ( SELECT o.name
           FROM (public.organizers o
             JOIN public.events e ON ((o.id = e.organizer_id)))
          WHERE (e.created_at >= (now() - '30 days'::interval))
          GROUP BY o.id, o.name
          ORDER BY (count(*)) DESC
         LIMIT 1) AS top_organizer_30d,
    now() AS generated_at;


ALTER VIEW public.v_dashboard_admin OWNER TO admin;

--
-- Name: venue_mappings; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.venue_mappings (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    venue_id character varying(255) NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(100) NOT NULL,
    description text,
    mapping_type public.mapping_type NOT NULL,
    event_categories text[],
    effective_capacity integer NOT NULL,
    valid_from timestamp with time zone,
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_venue_mappings_capacity CHECK ((effective_capacity > 0)),
    CONSTRAINT chk_venue_mappings_dates CHECK (((valid_until IS NULL) OR (valid_until >= valid_from)))
);


ALTER TABLE public.venue_mappings OWNER TO admin;

--
-- Name: TABLE venue_mappings; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.venue_mappings IS 'Configurations multiples d''un même venue selon usage (football, concert, maintenance)';


--
-- Name: v_event_details; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_event_details AS
 SELECT e.id,
    e.code,
    e.name,
    e.description,
    e.status,
    e.visibility,
    o.name AS organizer_name,
    o.type AS organizer_type,
    o.logo_url AS organizer_logo,
    ec.name AS category_name,
    ec.color_primary AS category_color,
    v.name AS venue_name,
    v.city AS venue_city,
    v.max_capacity AS venue_capacity,
    vm.name AS mapping_name,
    vm.effective_capacity,
    e.scheduled_start,
    e.scheduled_end,
    e.actual_start,
    e.actual_end,
    e.expected_duration,
    e.sales_start,
    e.sales_end,
    e.max_capacity,
    e.current_capacity,
        CASE
            WHEN (e.scheduled_start > now()) THEN 'UPCOMING'::text
            WHEN ((e.scheduled_start <= now()) AND (e.scheduled_end > now())) THEN 'LIVE'::text
            WHEN (e.scheduled_end <= now()) THEN 'FINISHED'::text
            ELSE 'UNKNOWN'::text
        END AS time_status,
        CASE
            WHEN ((e.sales_start IS NULL) OR (e.sales_end IS NULL)) THEN 'NO_SALES'::text
            WHEN (now() < e.sales_start) THEN 'PRESALE'::text
            WHEN ((now() >= e.sales_start) AND (now() <= e.sales_end)) THEN 'ON_SALE'::text
            WHEN (now() > e.sales_end) THEN 'SALES_CLOSED'::text
            ELSE 'UNKNOWN'::text
        END AS sales_status,
        CASE
            WHEN (e.scheduled_start > now()) THEN (EXTRACT(epoch FROM (e.scheduled_start - now())))::integer
            ELSE 0
        END AS seconds_until_start,
    e.is_featured,
    e.tags,
    e.created_at,
    e.updated_at,
    e.published_at
   FROM ((((public.events e
     JOIN public.organizers o ON ((e.organizer_id = o.id)))
     JOIN public.event_categories ec ON ((e.category_id = ec.id)))
     JOIN public.venues v ON (((e.venue_id)::text = (v.id)::text)))
     JOIN public.venue_mappings vm ON (((e.mapping_id)::text = (vm.id)::text)));


ALTER VIEW public.v_event_details OWNER TO admin;

--
-- Name: venue_zones; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.venue_zones (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    mapping_id character varying(255) NOT NULL,
    parent_zone_id character varying(255),
    name character varying(200) NOT NULL,
    code character varying(100) NOT NULL,
    zone_type public.zone_type NOT NULL,
    category public.zone_category NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    capacity integer NOT NULL,
    base_price numeric(10,2) DEFAULT 0 NOT NULL,
    currency character varying(3) DEFAULT 'TND'::character varying NOT NULL,
    coordinates jsonb,
    description text,
    amenities text[],
    is_accessible boolean DEFAULT false NOT NULL,
    requires_special_access boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_venue_zones_capacity CHECK ((capacity >= 0)),
    CONSTRAINT chk_venue_zones_currency CHECK ((length((currency)::text) = 3)),
    CONSTRAINT chk_venue_zones_level CHECK ((level >= 0)),
    CONSTRAINT chk_venue_zones_price CHECK ((base_price >= (0)::numeric))
);


ALTER TABLE public.venue_zones OWNER TO admin;

--
-- Name: TABLE venue_zones; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.venue_zones IS 'Organisation hiérarchique des espaces dans une cartographie';


--
-- Name: v_event_analytics; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_event_analytics AS
 SELECT e.id,
    e.name,
    e.organizer_name,
    e.status,
    e.scheduled_start,
    count(DISTINCT t.id) AS tickets_sold,
    e.max_capacity,
    round((((count(DISTINCT t.id))::numeric / (NULLIF(e.max_capacity, 0))::numeric) * (100)::numeric), 2) AS occupancy_rate,
    COALESCE(sum(t.price_paid), (0)::numeric) AS gross_revenue,
    COALESCE(avg(t.price_paid), (0)::numeric) AS avg_ticket_price,
    min(t.price_paid) AS min_ticket_price,
    max(t.price_paid) AS max_ticket_price,
    count(DISTINCT t.zone_id) AS zones_with_sales,
    count(DISTINCT t.id) FILTER (WHERE ((t.zone_id)::text IN ( SELECT z.id
           FROM public.venue_zones z
          WHERE (z.category = 'VIP'::public.zone_category)))) AS vip_tickets_sold,
    count(DISTINCT t.id) FILTER (WHERE ((t.created_at >= (e.created_at + '00:00:00'::interval)) AND (t.created_at < (e.created_at + '7 days'::interval)))) AS tickets_first_week,
    count(DISTINCT t.id) FILTER (WHERE (t.created_at >= (now() - '7 days'::interval))) AS tickets_last_week,
    count(DISTINCT oi.order_id) AS total_orders,
        CASE
            WHEN (count(DISTINCT oi.order_id) > 0) THEN round(((count(DISTINCT t.id))::numeric / (count(DISTINCT oi.order_id))::numeric), 2)
            ELSE (0)::numeric
        END AS avg_tickets_per_order,
    count(DISTINCT o.id) FILTER (WHERE (o.purchase_channel = 'WEB'::public.purchase_channel)) AS web_orders,
    count(DISTINCT o.id) FILTER (WHERE (o.purchase_channel = 'MOBILE_APP'::public.purchase_channel)) AS mobile_orders,
    min(t.created_at) AS first_sale,
    max(t.created_at) AS last_sale
   FROM (((public.v_event_details e
     LEFT JOIN public.tickets t ON (((e.id = t.event_id) AND (t.is_active = true))))
     LEFT JOIN public.order_items oi ON ((t.id = oi.ticket_type_id)))
     LEFT JOIN public.orders o ON ((oi.order_id = o.id)))
  GROUP BY e.id, e.name, e.organizer_name, e.status, e.scheduled_start, e.max_capacity;


ALTER VIEW public.v_event_analytics OWNER TO admin;

--
-- Name: v_event_participants_full; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_event_participants_full AS
 SELECT ep.event_id,
    e.name AS event_name,
    p.id AS participant_id,
    p.name AS participant_name,
    p.type AS participant_type,
    p.logo_url AS participant_logo,
    ep.role,
    ep.display_order,
    ep.is_confirmed,
    ep.is_featured,
    ep.participation_fee,
    ep.prize_money,
        CASE
            WHEN (ep.role = ANY (ARRAY['HOME_TEAM'::public.event_participant_role, 'MAIN_ARTIST'::public.event_participant_role, 'KEYNOTE_SPEAKER'::public.event_participant_role])) THEN 'PRIMARY'::text
            WHEN (ep.role = ANY (ARRAY['AWAY_TEAM'::public.event_participant_role, 'OPENING_ACT'::public.event_participant_role, 'PANELIST'::public.event_participant_role])) THEN 'SECONDARY'::text
            ELSE 'SUPPORT'::text
        END AS importance_level,
    ep.performance_stats,
    ep.metadata,
    ep.created_at
   FROM ((public.event_participants ep
     JOIN public.events e ON ((ep.event_id = e.id)))
     JOIN public.participants p ON ((ep.participant_id = p.id)))
  ORDER BY ep.event_id, ep.display_order;


ALTER VIEW public.v_event_participants_full OWNER TO admin;

--
-- Name: v_financial_summary; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_financial_summary AS
 SELECT date_trunc('month'::text, p.payment_date) AS month,
    count(DISTINCT p.id) AS total_transactions,
    count(DISTINCT p.order_id) AS total_orders,
    count(DISTINCT o.user_id) AS unique_customers,
    sum(p.amount) AS gross_revenue,
    sum(p.processing_fee) AS processing_fees,
    sum(p.net_amount) AS net_revenue,
    COALESCE(sum(oc.commission_amount), (0)::numeric) AS total_commissions,
    COALESCE(sum(oc.platform_fee), (0)::numeric) AS platform_fees,
    COALESCE(sum(oc.net_to_organizer), (0)::numeric) AS net_to_organizers,
    (sum(p.net_amount) - COALESCE(sum(oc.net_to_organizer), (0)::numeric)) AS platform_margin,
    COALESCE(sum(r.amount), (0)::numeric) AS total_refunds,
    avg(p.amount) AS avg_transaction_amount,
    avg(o.total_amount) AS avg_order_amount,
    count(DISTINCT p.id) FILTER (WHERE (p.status = 'COMPLETED'::public.payment_status)) AS successful_transactions,
    round((((count(DISTINCT p.id) FILTER (WHERE (p.status = 'COMPLETED'::public.payment_status)))::numeric / (NULLIF(count(DISTINCT p.id), 0))::numeric) * (100)::numeric), 2) AS success_rate
   FROM (((public.payments p
     JOIN public.orders o ON ((p.order_id = o.id)))
     LEFT JOIN public.organizer_commissions oc ON ((o.id = oc.order_id)))
     LEFT JOIN public.refunds r ON (((p.id = r.payment_id) AND (r.status = 'COMPLETED'::public.refund_status))))
  WHERE ((p.payment_date IS NOT NULL) AND (p.payment_date >= (now() - '1 year'::interval)))
  GROUP BY (date_trunc('month'::text, p.payment_date))
  ORDER BY (date_trunc('month'::text, p.payment_date)) DESC;


ALTER VIEW public.v_financial_summary OWNER TO admin;

--
-- Name: v_order_details; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_order_details AS
SELECT
    NULL::uuid AS id,
    NULL::character varying(50) AS order_number,
    NULL::public.order_status AS status,
    NULL::character varying AS customer_name,
    NULL::character varying(255) AS customer_email,
    NULL::character varying(200) AS primary_organizer_name,
    NULL::numeric(10,2) AS subtotal_amount,
    NULL::numeric(10,2) AS discount_amount,
    NULL::numeric(10,2) AS tax_amount,
    NULL::numeric(10,2) AS processing_fee,
    NULL::numeric(10,2) AS total_amount,
    NULL::character varying(3) AS currency,
    NULL::public.purchase_channel AS purchase_channel,
    NULL::bigint AS total_items,
    NULL::text AS items_summary,
    NULL::public.payment_status AS payment_status,
    NULL::timestamp with time zone AS payment_date,
    NULL::uuid AS payment_method_id,
    NULL::character varying(100) AS payment_method_name,
    NULL::text AS overall_status,
    NULL::text AS notes,
    NULL::character varying(50) AS coupon_code,
    NULL::timestamp with time zone AS created_at,
    NULL::timestamp with time zone AS confirmed_at,
    NULL::timestamp with time zone AS expires_at,
    NULL::timestamp with time zone AS updated_at;


ALTER VIEW public.v_order_details OWNER TO admin;

--
-- Name: v_organizer_details; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_organizer_details AS
 SELECT o.id,
    o.code,
    o.name,
    o.short_name,
    o.type,
    o.status,
    o.legal_name,
    o.rnis,
    o.tax_id,
    o.contact_email,
    o.contact_phone,
    o.address,
    o.city,
    o.country,
    o.commission_rate,
    o.payment_terms,
    o.currency,
    o.is_vat_registered,
    o.logo_url,
    o.banner_url,
    o.website_url,
    o.total_events_organized,
    o.total_revenue_generated,
    o.average_satisfaction_score,
    o.last_event_date,
    o.validated_at,
    o.validated_by,
    o.accreditation_level,
    (((v.first_name)::text || ' '::text) || (v.last_name)::text) AS validated_by_name,
        CASE
            WHEN ((o.status = 'ACTIVE'::public.organizer_status) AND (o.validated_at IS NOT NULL)) THEN 'OPERATIONAL'::text
            WHEN (o.status = 'PENDING'::public.organizer_status) THEN 'AWAITING_VALIDATION'::text
            ELSE (o.status)::text
        END AS operational_status,
    o.created_at,
    o.updated_at
   FROM (public.organizers o
     LEFT JOIN public.users v ON ((o.validated_by = v.id)));


ALTER VIEW public.v_organizer_details OWNER TO admin;

--
-- Name: v_organizer_performance; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_organizer_performance AS
 SELECT o.id,
    o.name,
    o.type,
    o.status,
    count(DISTINCT e.id) AS total_events,
    count(DISTINCT e.id) FILTER (WHERE (e.scheduled_start >= now())) AS upcoming_events,
    count(DISTINCT e.id) FILTER (WHERE (e.status = 'FINISHED'::public.event_status)) AS completed_events,
    count(DISTINCT t.id) AS total_tickets_sold,
        CASE
            WHEN (count(DISTINCT e.id) > 0) THEN round(((count(DISTINCT t.id))::numeric / (count(DISTINCT e.id))::numeric), 2)
            ELSE (0)::numeric
        END AS avg_tickets_per_event,
    COALESCE(sum(p.net_amount), (0)::numeric) AS total_revenue,
    COALESCE(sum(oc.net_to_organizer), (0)::numeric) AS net_revenue_organizer,
    COALESCE(sum(oc.commission_amount), (0)::numeric) AS total_commissions_paid,
        CASE
            WHEN (count(DISTINCT e.id) > 0) THEN round((((count(DISTINCT t.id))::numeric / (NULLIF(sum(e.max_capacity), 0))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS avg_occupancy_rate,
    count(DISTINCT e.id) FILTER (WHERE (e.created_at >= (now() - '30 days'::interval))) AS events_last_30_days,
    o.average_satisfaction_score,
    ( SELECT v.name
           FROM (public.venues v
             JOIN public.events ev ON (((v.id)::text = (ev.venue_id)::text)))
          WHERE (ev.organizer_id = o.id)
          GROUP BY v.id, v.name
          ORDER BY (count(*)) DESC
         LIMIT 1) AS main_venue,
    max(e.created_at) AS last_activity,
    o.created_at,
    o.updated_at
   FROM ((((((public.organizers o
     LEFT JOIN public.events e ON ((o.id = e.organizer_id)))
     LEFT JOIN public.tickets t ON (((e.id = t.event_id) AND (t.is_active = true))))
     LEFT JOIN public.order_items oi ON ((oi.event_id = e.id)))
     LEFT JOIN public.orders ord ON ((oi.order_id = ord.id)))
     LEFT JOIN public.payments p ON (((ord.id = p.order_id) AND (p.status = 'COMPLETED'::public.payment_status))))
     LEFT JOIN public.organizer_commissions oc ON ((ord.id = oc.order_id)))
  GROUP BY o.id, o.name, o.type, o.status, o.average_satisfaction_score, o.created_at, o.updated_at;


ALTER VIEW public.v_organizer_performance OWNER TO admin;

--
-- Name: v_payment_summary; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_payment_summary AS
 SELECT date_trunc('day'::text, p.payment_date) AS payment_date,
    o.id AS organizer_id,
    o.name AS organizer_name,
    pm.name AS payment_method,
    pm.type AS payment_method_type,
    count(DISTINCT p.id) AS transaction_count,
    count(DISTINCT p.order_id) AS order_count,
    sum(p.amount) AS gross_amount,
    sum(p.processing_fee) AS total_processing_fees,
    sum(p.net_amount) AS net_amount,
    count(DISTINCT p.id) FILTER (WHERE (p.status = 'COMPLETED'::public.payment_status)) AS successful_payments,
    count(DISTINCT p.id) FILTER (WHERE (p.status = 'FAILED'::public.payment_status)) AS failed_payments,
    round((((count(DISTINCT p.id) FILTER (WHERE (p.status = 'COMPLETED'::public.payment_status)))::numeric / (NULLIF(count(DISTINCT p.id), 0))::numeric) * (100)::numeric), 2) AS success_rate
   FROM (((public.payments p
     JOIN public.orders ord ON ((p.order_id = ord.id)))
     JOIN public.organizers o ON ((ord.primary_organizer_id = o.id)))
     JOIN public.payment_methods pm ON ((p.payment_method_id = pm.id)))
  WHERE ((p.payment_date IS NOT NULL) AND (p.payment_date >= (now() - '1 year'::interval)))
  GROUP BY (date_trunc('day'::text, p.payment_date)), o.id, o.name, pm.name, pm.type
  ORDER BY (date_trunc('day'::text, p.payment_date)) DESC, o.name;


ALTER VIEW public.v_payment_summary OWNER TO admin;

--
-- Name: v_subscription_details; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_subscription_details AS
 SELECT s.id,
    s.subscription_number,
    s.status,
    (((u.first_name)::text || ' '::text) || (u.last_name)::text) AS subscriber_name,
    u.email AS subscriber_email,
    sp.name AS plan_name,
    sp.type AS plan_type,
    o.name AS organizer_name,
    o.type AS organizer_type,
    s.start_date,
    s.end_date,
    (s.end_date - s.start_date) AS duration_days,
    s.price_paid,
    s.currency,
    s.transfers_used,
    sp.max_transfers,
    s.auto_renew_enabled,
    sp.priority_booking,
    sp.includes_playoffs,
    sp.transferable,
        CASE
            WHEN (s.end_date < CURRENT_DATE) THEN 'EXPIRED'::text
            WHEN ((s.status = 'ACTIVE'::public.subscription_status) AND (s.end_date >= CURRENT_DATE)) THEN 'ACTIVE'::text
            WHEN (s.status = 'SUSPENDED'::public.subscription_status) THEN 'SUSPENDED'::text
            ELSE (s.status)::text
        END AS current_status,
        CASE
            WHEN (s.end_date >= CURRENT_DATE) THEN (s.end_date - CURRENT_DATE)
            ELSE 0
        END AS days_remaining,
    (sp.max_transfers - s.transfers_used) AS transfers_remaining,
    (count(DISTINCT spe.event_id) + count(DISTINCT speg.event_group_id)) AS included_events_count,
    count(DISTINCT ar.id) AS access_rights_used,
    s.subscriber_benefits,
    s.created_at,
    s.updated_at
   FROM ((((((public.subscriptions s
     JOIN public.users u ON ((s.user_id = u.id)))
     JOIN public.subscription_plans sp ON ((s.plan_id = sp.id)))
     JOIN public.organizers o ON ((sp.organizer_id = o.id)))
     LEFT JOIN public.subscription_plan_events spe ON ((sp.id = spe.subscription_plan_id)))
     LEFT JOIN public.subscription_plan_event_groups speg ON ((sp.id = speg.subscription_plan_id)))
     LEFT JOIN public.access_rights ar ON ((s.id = ar.subscription_id)))
  GROUP BY s.id, s.subscription_number, s.status, s.start_date, s.end_date, s.price_paid, s.currency, s.transfers_used, s.auto_renew_enabled, s.subscriber_benefits, s.created_at, s.updated_at, u.first_name, u.last_name, u.email, sp.name, sp.type, sp.max_transfers, sp.priority_booking, sp.includes_playoffs, sp.transferable, o.name, o.type;


ALTER VIEW public.v_subscription_details OWNER TO admin;

--
-- Name: v_ticket_analytics; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_ticket_analytics AS
 SELECT date_trunc('month'::text, t.created_at) AS month,
    o.id AS organizer_id,
    o.name AS organizer_name,
    o.type AS organizer_type,
    count(DISTINCT t.id) AS tickets_sold,
    count(DISTINCT t.event_id) AS events_with_sales,
    count(DISTINCT t.user_id) AS unique_customers,
    sum(t.price_paid) AS gross_revenue,
    avg(t.price_paid) AS avg_ticket_price,
    min(t.price_paid) AS min_ticket_price,
    max(t.price_paid) AS max_ticket_price,
    count(DISTINCT t.id) FILTER (WHERE (vz.category = 'VIP'::public.zone_category)) AS vip_tickets,
    count(DISTINCT t.id) FILTER (WHERE (vz.category = 'PREMIUM'::public.zone_category)) AS premium_tickets,
    count(DISTINCT t.id) FILTER (WHERE (vz.category = 'STANDARD'::public.zone_category)) AS standard_tickets,
        CASE
            WHEN (sum(e.max_capacity) > 0) THEN round((((count(DISTINCT t.id))::numeric / (sum(e.max_capacity))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS avg_occupancy_rate,
    count(DISTINCT oi.order_id) FILTER (WHERE (ord.purchase_channel = 'WEB'::public.purchase_channel)) AS web_sales,
    count(DISTINCT oi.order_id) FILTER (WHERE (ord.purchase_channel = 'MOBILE_APP'::public.purchase_channel)) AS mobile_sales
   FROM (((((public.tickets t
     JOIN public.events e ON ((t.event_id = e.id)))
     JOIN public.organizers o ON ((e.organizer_id = o.id)))
     LEFT JOIN public.venue_zones vz ON (((t.zone_id)::text = (vz.id)::text)))
     LEFT JOIN public.order_items oi ON ((oi.event_id = t.event_id)))
     LEFT JOIN public.orders ord ON ((oi.order_id = ord.id)))
  WHERE ((t.is_active = true) AND (t.created_at >= (now() - '1 year'::interval)))
  GROUP BY (date_trunc('month'::text, t.created_at)), o.id, o.name, o.type
  ORDER BY (date_trunc('month'::text, t.created_at)) DESC, o.name;


ALTER VIEW public.v_ticket_analytics OWNER TO admin;

--
-- Name: v_ticket_details; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_ticket_details AS
 SELECT t.id,
    t.ticket_number,
    (((u.first_name)::text || ' '::text) || (u.last_name)::text) AS owner_name,
    u.email AS owner_email,
    e.name AS event_name,
    e.scheduled_start,
    e.status AS event_status,
    o.name AS organizer_name,
    v.name AS venue_name,
    vz.name AS zone_name,
    vz.category AS zone_category,
    s.seat_number,
    s.row_number,
    tt.name AS ticket_type_name,
    t.price_paid,
    t.currency,
    ar.qr_code,
    ar.status AS access_status,
    ar.valid_from,
    ar.valid_until,
    ar.current_uses,
    ar.max_uses,
        CASE
            WHEN (e.scheduled_start > (now() + '01:00:00'::interval)) THEN 'FUTURE'::text
            WHEN (e.scheduled_start > (now() - '01:00:00'::interval)) THEN 'IMMINENT'::text
            WHEN (e.scheduled_end > now()) THEN 'LIVE'::text
            ELSE 'PAST'::text
        END AS event_timing,
        CASE
            WHEN (ar.current_uses >= ar.max_uses) THEN 'USED'::text
            WHEN ((ar.status = 'VALID'::public.access_right_status) AND (ar.valid_until > now())) THEN 'VALID'::text
            WHEN (ar.valid_until <= now()) THEN 'EXPIRED'::text
            ELSE (ar.status)::text
        END AS ticket_status,
        CASE
            WHEN (s.seat_number IS NOT NULL) THEN (((('Zone: '::text || (vz.name)::text) || ' - Siège: '::text) || (s.seat_number)::text) ||
            CASE
                WHEN (s.row_number IS NOT NULL) THEN ((' (Rang: '::text || (s.row_number)::text) || ')'::text)
                ELSE ''::text
            END)
            WHEN (vz.name IS NOT NULL) THEN (('Zone: '::text || (vz.name)::text) || ' (Placement libre)'::text)
            ELSE 'Accès général'::text
        END AS seat_info,
    t.special_requirements,
    t.is_active,
    t.created_at,
    ar.used_at
   FROM ((((((((public.tickets t
     JOIN public.users u ON ((t.user_id = u.id)))
     JOIN public.events e ON ((t.event_id = e.id)))
     JOIN public.organizers o ON ((e.organizer_id = o.id)))
     JOIN public.venues v ON (((e.venue_id)::text = (v.id)::text)))
     JOIN public.ticket_types tt ON ((t.ticket_type_id = tt.id)))
     LEFT JOIN public.venue_zones vz ON (((t.zone_id)::text = (vz.id)::text)))
     LEFT JOIN public.seats s ON (((t.seat_id)::text = (s.id)::text)))
     LEFT JOIN public.access_rights ar ON ((t.id = ar.ticket_id)));


ALTER VIEW public.v_ticket_details OWNER TO admin;

--
-- Name: v_user_complete; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_user_complete AS
 SELECT u.id,
    u.email,
    u.first_name,
    u.last_name,
    (((u.first_name)::text || ' '::text) || (u.last_name)::text) AS full_name,
    u.is_active,
    u.created_at,
    u.last_login,
    up.date_of_birth,
    up.gender,
    up.city,
    up.country,
    up.language,
    up.timezone,
    up.notifications,
    up.newsletter,
    up.supporter_since,
    up.identity_document_type,
    up.identity_document_number,
    up.identity_verified,
    up.identity_verified_at,
        CASE
            WHEN (up.date_of_birth IS NOT NULL) THEN (date_part('year'::text, age((up.date_of_birth)::timestamp with time zone)))::integer
            ELSE NULL::integer
        END AS age,
        CASE
            WHEN ((u.email_verified IS NOT NULL) AND u.is_active) THEN 'VERIFIED'::text
            WHEN u.is_active THEN 'PENDING'::text
            ELSE 'INACTIVE'::text
        END AS verification_status,
        CASE
            WHEN ((u.email_verified IS NOT NULL) AND (u.phone_verified IS NOT NULL) AND (up.identity_verified = true)) THEN 'FULLY_VERIFIED'::text
            WHEN ((u.email_verified IS NOT NULL) OR (u.phone_verified IS NOT NULL)) THEN 'PARTIALLY_VERIFIED'::text
            ELSE 'UNVERIFIED'::text
        END AS kyc_status,
    u.updated_at
   FROM (public.users u
     LEFT JOIN public.user_profiles up ON ((u.id = up.user_id)));


ALTER VIEW public.v_user_complete OWNER TO admin;

--
-- Name: v_venue_analytics; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_venue_analytics AS
 SELECT v.id,
    v.name,
    v.city,
    count(DISTINCT e.id) AS total_events_12m,
    count(DISTINCT e.organizer_id) AS unique_organizers_12m,
    count(DISTINCT e.id) FILTER (WHERE (e.scheduled_start >= date_trunc('month'::text, now()))) AS events_current_month,
    count(DISTINCT e.id) FILTER (WHERE ((e.scheduled_start >= (date_trunc('month'::text, now()) - '1 mon'::interval)) AND (e.scheduled_start < date_trunc('month'::text, now())))) AS events_last_month,
    COALESCE(sum(t.price_paid), (0)::numeric) AS total_revenue_12m,
    COALESCE(avg(t.price_paid), (0)::numeric) AS avg_ticket_price,
    round((((count(DISTINCT t.id))::numeric / (NULLIF(sum(e.max_capacity), 0))::numeric) * (100)::numeric), 2) AS occupancy_rate_12m,
    ( SELECT o.name
           FROM (public.organizers o
             JOIN public.events ev ON ((o.id = ev.organizer_id)))
          WHERE (((ev.venue_id)::text = (v.id)::text) AND (ev.scheduled_start >= (now() - '1 year'::interval)))
          GROUP BY o.id, o.name
          ORDER BY (count(*)) DESC
         LIMIT 1) AS top_organizer_12m,
    ( SELECT ec.name
           FROM (public.event_categories ec
             JOIN public.events ev ON ((ec.id = ev.category_id)))
          WHERE (((ev.venue_id)::text = (v.id)::text) AND (ev.scheduled_start >= (now() - '1 year'::interval)))
          GROUP BY ec.id, ec.name
          ORDER BY (count(*)) DESC
         LIMIT 1) AS top_category_12m,
    max(e.scheduled_start) AS last_event_date,
    min(e.scheduled_start) FILTER (WHERE (e.scheduled_start >= now())) AS next_event_date
   FROM ((public.venues v
     LEFT JOIN public.events e ON ((((v.id)::text = (e.venue_id)::text) AND (e.scheduled_start >= (now() - '1 year'::interval)))))
     LEFT JOIN public.tickets t ON (((e.id = t.event_id) AND (t.is_active = true))))
  GROUP BY v.id, v.name, v.city;


ALTER VIEW public.v_venue_analytics OWNER TO admin;

--
-- Name: v_venue_details; Type: VIEW; Schema: public; Owner: admin
--

CREATE VIEW public.v_venue_details AS
 SELECT v.id,
    v.name,
    v.slug,
    v.address,
    v.city,
    v.postal_code,
    v.country,
    v.latitude,
    v.longitude,
    v.max_capacity,
    v.description,
    owner.name AS primary_owner_name,
    manager.name AS primary_manager_name,
    vm.name AS default_mapping_name,
    vm.effective_capacity AS default_capacity,
    count(DISTINCT e.id) AS total_events_hosted,
    count(DISTINCT e.id) FILTER (WHERE (e.scheduled_start >= now())) AS upcoming_events,
    count(DISTINCT e.organizer_id) AS different_organizers,
    COALESCE(sum(
        CASE
            WHEN (e.scheduled_start >= (now() - '1 year'::interval)) THEN 1
            ELSE 0
        END), (0)::bigint) AS events_last_12_months,
        CASE
            WHEN (count(DISTINCT e.id) > 0) THEN round((((count(DISTINCT t.id))::numeric / (NULLIF(sum(e.max_capacity), 0))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS avg_occupancy_rate,
    min(e.scheduled_start) FILTER (WHERE (e.scheduled_start >= now())) AS next_event_date,
    v.is_active,
    v.images,
    v.global_amenities,
    v.created_at,
    v.updated_at
   FROM (((((public.venues v
     LEFT JOIN public.organizers owner ON ((v.primary_owner_id = owner.id)))
     LEFT JOIN public.organizers manager ON ((v.primary_manager_id = manager.id)))
     LEFT JOIN public.venue_mappings vm ON (((v.default_mapping_id)::text = (vm.id)::text)))
     LEFT JOIN public.events e ON (((v.id)::text = (e.venue_id)::text)))
     LEFT JOIN public.tickets t ON (((e.id = t.event_id) AND (t.is_active = true))))
  GROUP BY v.id, v.name, v.slug, v.address, v.city, v.postal_code, v.country, v.latitude, v.longitude, v.max_capacity, v.description, v.is_active, v.images, v.global_amenities, v.created_at, v.updated_at, owner.name, manager.name, vm.name, vm.effective_capacity;


ALTER VIEW public.v_venue_details OWNER TO admin;

--
-- Name: validation_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.validation_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email character varying(255) NOT NULL,
    token_type public.validation_token_type NOT NULL,
    token_hash character varying(255) NOT NULL,
    token_plain character varying(64),
    expires_at timestamp with time zone NOT NULL,
    is_used boolean DEFAULT false,
    used_at timestamp with time zone,
    used_ip inet,
    attempt_count integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    is_blocked boolean DEFAULT false,
    blocked_at timestamp with time zone,
    reset_password_data jsonb,
    invitation_data jsonb,
    verification_data jsonb,
    magic_link_data jsonb,
    client_info jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.validation_tokens OWNER TO admin;

--
-- Name: venue_amenities; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.venue_amenities (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    mapping_id character varying(255) NOT NULL,
    zone_id character varying(255),
    name character varying(200) NOT NULL,
    category public.amenity_category NOT NULL,
    description text,
    is_free boolean DEFAULT true NOT NULL,
    price numeric(8,2),
    currency character varying(3) DEFAULT 'TND'::character varying,
    is_available boolean DEFAULT true NOT NULL,
    operating_hours jsonb,
    capacity integer,
    coordinates jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_venue_amenities_capacity CHECK (((capacity IS NULL) OR (capacity > 0))),
    CONSTRAINT chk_venue_amenities_currency CHECK (((currency IS NULL) OR (length((currency)::text) = 3))),
    CONSTRAINT chk_venue_amenities_price CHECK (((price IS NULL) OR (price >= (0)::numeric)))
);


ALTER TABLE public.venue_amenities OWNER TO admin;

--
-- Name: TABLE venue_amenities; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.venue_amenities IS 'Services et commodités disponibles au niveau venue ou zone';


--
-- Name: venue_media; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.venue_media (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    venue_id character varying(255),
    mapping_id character varying(255),
    zone_id character varying(255),
    seat_id character varying(255),
    title character varying(200) NOT NULL,
    media_type public.media_type NOT NULL,
    category public.media_category NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    mime_type character varying(100),
    display_order integer DEFAULT 0,
    is_featured boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_venue_media_display_order CHECK ((display_order >= 0)),
    CONSTRAINT chk_venue_media_file_size CHECK (((file_size IS NULL) OR (file_size > 0)))
);


ALTER TABLE public.venue_media OWNER TO admin;

--
-- Name: TABLE venue_media; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.venue_media IS 'Fichiers multimédias pour visualisation et aide à la vente';


--
-- Name: venue_organizer_relations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.venue_organizer_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venue_id character varying(255) NOT NULL,
    organizer_id uuid NOT NULL,
    relation_type public.venue_relation_type NOT NULL,
    valid_from date DEFAULT CURRENT_DATE NOT NULL,
    valid_until date,
    is_active boolean DEFAULT true NOT NULL,
    rental_rate numeric(10,2),
    currency character varying(3) DEFAULT 'TND'::character varying,
    payment_terms integer DEFAULT 30,
    priority_level integer DEFAULT 0,
    preferred_days text[],
    preferred_times jsonb,
    exclusive_access boolean DEFAULT false NOT NULL,
    special_conditions text,
    contract_reference character varying(100),
    notes text,
    metadata jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_venue_organizer_dates CHECK (((valid_until IS NULL) OR (valid_until >= valid_from))),
    CONSTRAINT chk_venue_organizer_payment_terms CHECK (((payment_terms IS NULL) OR (payment_terms >= 0))),
    CONSTRAINT chk_venue_organizer_priority CHECK (((priority_level >= 0) AND (priority_level <= 100))),
    CONSTRAINT chk_venue_organizer_rental_rate CHECK (((rental_rate IS NULL) OR (rental_rate >= (0)::numeric)))
);


ALTER TABLE public.venue_organizer_relations OWNER TO admin;

--
-- Name: TABLE venue_organizer_relations; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.venue_organizer_relations IS 'Relations entre venues et organisateurs (propriété, gestion, location, partenariat)';


--
-- Name: zone_mapping_overrides; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.zone_mapping_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    zone_id character varying(255) NOT NULL,
    name_override character varying(200),
    capacity_override integer,
    price_override numeric(10,2),
    access_restrictions jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_zone_mapping_overrides_capacity CHECK (((capacity_override IS NULL) OR (capacity_override >= 0))),
    CONSTRAINT chk_zone_mapping_overrides_price CHECK (((price_override IS NULL) OR (price_override >= (0)::numeric)))
);


ALTER TABLE public.zone_mapping_overrides OWNER TO admin;

--
-- Name: TABLE zone_mapping_overrides; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public.zone_mapping_overrides IS 'Surcharges de configuration des zones pour des événements spéciaux';


--
-- Name: api_access_logs id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_access_logs ALTER COLUMN id SET DEFAULT nextval('public.api_access_logs_id_seq'::regclass);


--
-- Name: access_control_log access_control_log_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_control_log
    ADD CONSTRAINT access_control_log_pkey PRIMARY KEY (id);


--
-- Name: access_points access_points_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_points
    ADD CONSTRAINT access_points_pkey PRIMARY KEY (id);


--
-- Name: access_rights access_rights_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT access_rights_pkey PRIMARY KEY (id);


--
-- Name: access_transactions_log access_transactions_log_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_transactions_log
    ADD CONSTRAINT access_transactions_log_pkey PRIMARY KEY (id);


--
-- Name: api_access_logs api_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_access_logs
    ADD CONSTRAINT api_access_logs_pkey PRIMARY KEY (id);


--
-- Name: api_clients api_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_clients
    ADD CONSTRAINT api_clients_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_key UNIQUE (key);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: blacklist blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_pkey PRIMARY KEY (id);


--
-- Name: event_categories event_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_pkey PRIMARY KEY (id);


--
-- Name: event_groups event_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_groups
    ADD CONSTRAINT event_groups_pkey PRIMARY KEY (id);


--
-- Name: event_media event_media_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_pkey PRIMARY KEY (id);


--
-- Name: event_participants event_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_pkey PRIMARY KEY (id);


--
-- Name: event_restrictions event_restrictions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_restrictions
    ADD CONSTRAINT event_restrictions_pkey PRIMARY KEY (id);


--
-- Name: event_schedules event_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_schedules
    ADD CONSTRAINT event_schedules_pkey PRIMARY KEY (id);


--
-- Name: event_stats event_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_stats
    ADD CONSTRAINT event_stats_pkey PRIMARY KEY (id);


--
-- Name: event_ticket_config event_ticket_config_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_ticket_config
    ADD CONSTRAINT event_ticket_config_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: mfa_tokens mfa_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.mfa_tokens
    ADD CONSTRAINT mfa_tokens_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: organizer_commissions organizer_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizer_commissions
    ADD CONSTRAINT organizer_commissions_pkey PRIMARY KEY (id);


--
-- Name: organizers organizers_code_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT organizers_code_key UNIQUE (code);


--
-- Name: organizers organizers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT organizers_pkey PRIMARY KEY (id);


--
-- Name: participant_relationships participant_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participant_relationships
    ADD CONSTRAINT participant_relationships_pkey PRIMARY KEY (id);


--
-- Name: participant_staff participant_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participant_staff
    ADD CONSTRAINT participant_staff_pkey PRIMARY KEY (id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: payment_attempts payment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_attempts
    ADD CONSTRAINT payment_attempts_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payment_webhooks payment_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_webhooks
    ADD CONSTRAINT payment_webhooks_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: persistent_tokens persistent_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.persistent_tokens
    ADD CONSTRAINT persistent_tokens_pkey PRIMARY KEY (id);


--
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: rate_limiting rate_limiting_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rate_limiting
    ADD CONSTRAINT rate_limiting_pkey PRIMARY KEY (id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: seats seats_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: security_policies security_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.security_policies
    ADD CONSTRAINT security_policies_pkey PRIMARY KEY (id);


--
-- Name: subscription_plan_event_groups subscription_plan_event_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_event_groups
    ADD CONSTRAINT subscription_plan_event_groups_pkey PRIMARY KEY (id);


--
-- Name: subscription_plan_events subscription_plan_events_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_events
    ADD CONSTRAINT subscription_plan_events_pkey PRIMARY KEY (id);


--
-- Name: subscription_plan_zones subscription_plan_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_zones
    ADD CONSTRAINT subscription_plan_zones_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: ticket_templates ticket_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.ticket_templates
    ADD CONSTRAINT ticket_templates_pkey PRIMARY KEY (id);


--
-- Name: ticket_types ticket_types_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.ticket_types
    ADD CONSTRAINT ticket_types_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: access_points uk_access_points_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_points
    ADD CONSTRAINT uk_access_points_code UNIQUE (mapping_id, code);


--
-- Name: access_rights uk_access_rights_access_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT uk_access_rights_access_code UNIQUE (access_code);


--
-- Name: access_rights uk_access_rights_qr_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT uk_access_rights_qr_code UNIQUE (qr_code);


--
-- Name: event_categories uk_event_categories_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT uk_event_categories_code UNIQUE (code);


--
-- Name: event_groups uk_event_groups_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_groups
    ADD CONSTRAINT uk_event_groups_code UNIQUE (code);


--
-- Name: event_participants uk_event_participants; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT uk_event_participants UNIQUE (event_id, participant_id, role);


--
-- Name: event_ticket_config uk_event_ticket_config; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_ticket_config
    ADD CONSTRAINT uk_event_ticket_config UNIQUE (event_id, ticket_type_id, zone_id);


--
-- Name: events uk_events_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT uk_events_code UNIQUE (code);


--
-- Name: groups uk_groups_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT uk_groups_code UNIQUE (code);


--
-- Name: orders uk_orders_number; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT uk_orders_number UNIQUE (order_number);


--
-- Name: organizers uk_organizers_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT uk_organizers_code UNIQUE (code);


--
-- Name: organizers uk_organizers_contact_email; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT uk_organizers_contact_email UNIQUE (contact_email);


--
-- Name: participant_relationships uk_participant_relationships; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participant_relationships
    ADD CONSTRAINT uk_participant_relationships UNIQUE (participant_a_id, participant_b_id, relationship_type);


--
-- Name: participants uk_participants_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT uk_participants_code UNIQUE (code);


--
-- Name: payment_methods uk_payment_methods_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT uk_payment_methods_code UNIQUE (code);


--
-- Name: payment_webhooks uk_payment_webhooks_id; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_webhooks
    ADD CONSTRAINT uk_payment_webhooks_id UNIQUE (webhook_id);


--
-- Name: payments uk_payments_external_transaction; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT uk_payments_external_transaction UNIQUE (external_transaction_id);


--
-- Name: payments uk_payments_number; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT uk_payments_number UNIQUE (payment_number);


--
-- Name: persistent_tokens uk_persistent_tokens_hash; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.persistent_tokens
    ADD CONSTRAINT uk_persistent_tokens_hash UNIQUE (token_hash);


--
-- Name: pricing_rules uk_pricing_rules_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT uk_pricing_rules_code UNIQUE (code);


--
-- Name: refunds uk_refunds_number; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT uk_refunds_number UNIQUE (refund_number);


--
-- Name: roles uk_roles_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uk_roles_code UNIQUE (code);


--
-- Name: seats uk_seats_position; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT uk_seats_position UNIQUE (zone_id, seat_number, row_number);


--
-- Name: security_policies uk_security_policies_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.security_policies
    ADD CONSTRAINT uk_security_policies_code UNIQUE (code);


--
-- Name: subscription_plan_zones uk_subscription_plan_zones; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_zones
    ADD CONSTRAINT uk_subscription_plan_zones UNIQUE (subscription_plan_id, zone_id);


--
-- Name: subscription_plans uk_subscription_plans_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT uk_subscription_plans_code UNIQUE (code);


--
-- Name: subscriptions uk_subscriptions_number; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT uk_subscriptions_number UNIQUE (subscription_number);


--
-- Name: ticket_templates uk_ticket_templates_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.ticket_templates
    ADD CONSTRAINT uk_ticket_templates_code UNIQUE (code);


--
-- Name: ticket_types uk_ticket_types_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.ticket_types
    ADD CONSTRAINT uk_ticket_types_code UNIQUE (code);


--
-- Name: tickets uk_tickets_number; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT uk_tickets_number UNIQUE (ticket_number);


--
-- Name: user_groups uk_user_groups_user_group; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT uk_user_groups_user_group UNIQUE (user_id, group_id);


--
-- Name: user_mfa_settings uk_user_mfa_settings_user_method; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT uk_user_mfa_settings_user_method UNIQUE (user_id, method);


--
-- Name: user_profiles uk_user_profiles_user_id; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT uk_user_profiles_user_id UNIQUE (user_id);


--
-- Name: user_roles uk_user_roles_user_role; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT uk_user_roles_user_role UNIQUE (user_id, role_id);


--
-- Name: user_sessions uk_user_sessions_token; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT uk_user_sessions_token UNIQUE (session_token);


--
-- Name: user_trusted_devices uk_user_trusted_devices_user_fingerprint; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_trusted_devices
    ADD CONSTRAINT uk_user_trusted_devices_user_fingerprint UNIQUE (user_id, device_fingerprint);


--
-- Name: users uk_users_email; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_users_email UNIQUE (email);


--
-- Name: validation_tokens uk_validation_tokens_hash; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.validation_tokens
    ADD CONSTRAINT uk_validation_tokens_hash UNIQUE (token_hash);


--
-- Name: venue_mappings uk_venue_mappings_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_mappings
    ADD CONSTRAINT uk_venue_mappings_code UNIQUE (venue_id, code);


--
-- Name: venue_organizer_relations uk_venue_organizer_unique; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_organizer_relations
    ADD CONSTRAINT uk_venue_organizer_unique UNIQUE (venue_id, organizer_id, relation_type);


--
-- Name: venue_zones uk_venue_zones_code; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_zones
    ADD CONSTRAINT uk_venue_zones_code UNIQUE (mapping_id, code);


--
-- Name: venues uk_venues_slug; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT uk_venues_slug UNIQUE (slug);


--
-- Name: zone_mapping_overrides uk_zone_mapping_overrides; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.zone_mapping_overrides
    ADD CONSTRAINT uk_zone_mapping_overrides UNIQUE (event_id, zone_id);


--
-- Name: user_groups user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (id);


--
-- Name: user_mfa_settings user_mfa_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_trusted_devices user_trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_trusted_devices
    ADD CONSTRAINT user_trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: validation_tokens validation_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.validation_tokens
    ADD CONSTRAINT validation_tokens_pkey PRIMARY KEY (id);


--
-- Name: venue_amenities venue_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_amenities
    ADD CONSTRAINT venue_amenities_pkey PRIMARY KEY (id);


--
-- Name: venue_mappings venue_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_mappings
    ADD CONSTRAINT venue_mappings_pkey PRIMARY KEY (id);


--
-- Name: venue_media venue_media_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_media
    ADD CONSTRAINT venue_media_pkey PRIMARY KEY (id);


--
-- Name: venue_organizer_relations venue_organizer_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_organizer_relations
    ADD CONSTRAINT venue_organizer_relations_pkey PRIMARY KEY (id);


--
-- Name: venue_zones venue_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_zones
    ADD CONSTRAINT venue_zones_pkey PRIMARY KEY (id);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: zone_mapping_overrides zone_mapping_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.zone_mapping_overrides
    ADD CONSTRAINT zone_mapping_overrides_pkey PRIMARY KEY (id);


--
-- Name: idx_access_control_log_access_point; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_access_point ON public.access_control_log USING btree (access_point_id);


--
-- Name: idx_access_control_log_access_right; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_access_right ON public.access_control_log USING btree (access_right_id);


--
-- Name: idx_access_control_log_action; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_action ON public.access_control_log USING btree (action);


--
-- Name: idx_access_control_log_denial_reason; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_denial_reason ON public.access_control_log USING btree (denial_reason);


--
-- Name: idx_access_control_log_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_event ON public.access_control_log USING btree (event_id);


--
-- Name: idx_access_control_log_event_denied; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_event_denied ON public.access_control_log USING btree (event_id, scanned_at, denial_reason, result);


--
-- Name: idx_access_control_log_event_success; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_event_success ON public.access_control_log USING btree (event_id, scanned_at, result);


--
-- Name: idx_access_control_log_result; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_result ON public.access_control_log USING btree (result);


--
-- Name: idx_access_control_log_scanned_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_scanned_at ON public.access_control_log USING btree (scanned_at);


--
-- Name: idx_access_control_log_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_user ON public.access_control_log USING btree (user_id);


--
-- Name: idx_access_control_log_user_recent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_log_user_recent ON public.access_control_log USING btree (user_id, scanned_at);


--
-- Name: idx_access_control_venue_monthly; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_control_venue_monthly ON public.access_control_log USING btree (scanned_at, result);


--
-- Name: idx_access_points_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_points_active ON public.access_points USING btree (is_active);


--
-- Name: idx_access_points_allowed_zones; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_points_allowed_zones ON public.access_points USING gin (allowed_zones);


--
-- Name: idx_access_points_coordinates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_points_coordinates ON public.access_points USING btree (latitude, longitude);


--
-- Name: idx_access_points_mapping; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_points_mapping ON public.access_points USING btree (mapping_id);


--
-- Name: idx_access_points_restricted_zones; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_points_restricted_zones ON public.access_points USING gin (restricted_zones);


--
-- Name: idx_access_points_security_level; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_points_security_level ON public.access_points USING btree (security_level);


--
-- Name: idx_access_points_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_points_type ON public.access_points USING btree (access_type);


--
-- Name: idx_access_rights_access_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_access_code ON public.access_rights USING btree (access_code);


--
-- Name: idx_access_rights_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_event ON public.access_rights USING btree (event_id);


--
-- Name: idx_access_rights_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_organizer ON public.access_rights USING btree (organizer_id);


--
-- Name: idx_access_rights_organizer_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_organizer_event ON public.access_rights USING btree (organizer_id, event_id);


--
-- Name: idx_access_rights_organizer_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_organizer_status ON public.access_rights USING btree (organizer_id, status);


--
-- Name: idx_access_rights_qr_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_qr_code ON public.access_rights USING btree (qr_code);


--
-- Name: idx_access_rights_seat; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_seat ON public.access_rights USING btree (seat_id);


--
-- Name: idx_access_rights_source_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_source_type ON public.access_rights USING btree (source_type);


--
-- Name: idx_access_rights_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_status ON public.access_rights USING btree (status);


--
-- Name: idx_access_rights_subscription; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_subscription ON public.access_rights USING btree (subscription_id);


--
-- Name: idx_access_rights_ticket; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_ticket ON public.access_rights USING btree (ticket_id);


--
-- Name: idx_access_rights_used; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_used ON public.access_rights USING btree (used_at);


--
-- Name: idx_access_rights_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_user ON public.access_rights USING btree (user_id);


--
-- Name: idx_access_rights_user_valid; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_user_valid ON public.access_rights USING btree (user_id, status);


--
-- Name: idx_access_rights_valid_for_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_valid_for_event ON public.access_rights USING btree (event_id, status);


--
-- Name: idx_access_rights_valid_partial; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_valid_partial ON public.access_rights USING btree (event_id, user_id, valid_until) WHERE (status = 'VALID'::public.access_right_status);


--
-- Name: idx_access_rights_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_validity ON public.access_rights USING btree (valid_from, valid_until);


--
-- Name: idx_access_rights_zone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_rights_zone ON public.access_rights USING btree (zone_id);


--
-- Name: idx_access_transactions_log_access_right; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_transactions_log_access_right ON public.access_transactions_log USING btree (access_right_id);


--
-- Name: idx_access_transactions_log_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_transactions_log_created_at ON public.access_transactions_log USING btree (created_at);


--
-- Name: idx_access_transactions_log_from_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_transactions_log_from_user ON public.access_transactions_log USING btree (from_user_id);


--
-- Name: idx_access_transactions_log_to_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_transactions_log_to_user ON public.access_transactions_log USING btree (to_user_id);


--
-- Name: idx_access_transactions_log_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_access_transactions_log_type ON public.access_transactions_log USING btree (transaction_type);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_ip_address; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_ip_address ON public.audit_logs USING btree (ip_address);


--
-- Name: idx_audit_logs_new_values; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_new_values ON public.audit_logs USING gin (new_values);


--
-- Name: idx_audit_logs_old_values; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_old_values ON public.audit_logs USING gin (old_values);


--
-- Name: idx_audit_logs_record_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_record_id ON public.audit_logs USING btree (record_id);


--
-- Name: idx_audit_logs_severity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_severity ON public.audit_logs USING btree (severity);


--
-- Name: idx_audit_logs_table_name; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);


--
-- Name: idx_audit_logs_table_record; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_table_record ON public.audit_logs USING btree (table_name, record_id);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_audit_logs_user_recent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_user_recent ON public.audit_logs USING btree (user_id, created_at);


--
-- Name: idx_blacklist_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_active ON public.blacklist USING btree (is_active);


--
-- Name: idx_blacklist_active_current; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_active_current ON public.blacklist USING btree (type, value, scope, is_active);


--
-- Name: idx_blacklist_created_by; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_created_by ON public.blacklist USING btree (created_by);


--
-- Name: idx_blacklist_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_organizer ON public.blacklist USING btree (organizer_id);


--
-- Name: idx_blacklist_organizer_scope; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_organizer_scope ON public.blacklist USING btree (organizer_id, scope);


--
-- Name: idx_blacklist_scope; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_scope ON public.blacklist USING btree (scope);


--
-- Name: idx_blacklist_severity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_severity ON public.blacklist USING btree (severity);


--
-- Name: idx_blacklist_target_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_target_event ON public.blacklist USING btree (target_event_id);


--
-- Name: idx_blacklist_target_venue; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_target_venue ON public.blacklist USING btree (target_venue_id);


--
-- Name: idx_blacklist_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_type ON public.blacklist USING btree (type);


--
-- Name: idx_blacklist_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_validity ON public.blacklist USING btree (valid_from, valid_until);


--
-- Name: idx_blacklist_value; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_blacklist_value ON public.blacklist USING btree (value);


--
-- Name: idx_event_categories_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_categories_active ON public.event_categories USING btree (is_active);


--
-- Name: idx_event_categories_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_categories_code ON public.event_categories USING btree (code);


--
-- Name: idx_event_categories_parent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_categories_parent ON public.event_categories USING btree (parent_category_id);


--
-- Name: idx_event_categories_price; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_categories_price ON public.event_categories USING btree (default_ticket_price);


--
-- Name: idx_event_groups_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_groups_active ON public.event_groups USING btree (is_active);


--
-- Name: idx_event_groups_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_groups_code ON public.event_groups USING btree (code);


--
-- Name: idx_event_groups_current_events; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_groups_current_events ON public.event_groups USING btree (current_events);


--
-- Name: idx_event_groups_dates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_groups_dates ON public.event_groups USING btree (start_date, end_date);


--
-- Name: idx_event_groups_parent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_groups_parent ON public.event_groups USING btree (parent_group_id);


--
-- Name: idx_event_groups_season; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_groups_season ON public.event_groups USING btree (season);


--
-- Name: idx_event_groups_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_groups_type ON public.event_groups USING btree (type);


--
-- Name: idx_event_media_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_media_event ON public.event_media USING btree (event_id);


--
-- Name: idx_event_media_featured; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_media_featured ON public.event_media USING btree (is_featured);


--
-- Name: idx_event_media_order; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_media_order ON public.event_media USING btree (display_order);


--
-- Name: idx_event_media_public; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_media_public ON public.event_media USING btree (is_public);


--
-- Name: idx_event_media_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_media_type ON public.event_media USING btree (media_type);


--
-- Name: idx_event_participants_confirmed; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_participants_confirmed ON public.event_participants USING btree (is_confirmed);


--
-- Name: idx_event_participants_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_participants_event ON public.event_participants USING btree (event_id);


--
-- Name: idx_event_participants_event_role; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_participants_event_role ON public.event_participants USING btree (event_id, role);


--
-- Name: idx_event_participants_featured; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_participants_featured ON public.event_participants USING btree (is_featured);


--
-- Name: idx_event_participants_order; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_participants_order ON public.event_participants USING btree (display_order);


--
-- Name: idx_event_participants_participant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_participants_participant ON public.event_participants USING btree (participant_id);


--
-- Name: idx_event_participants_participant_role; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_participants_participant_role ON public.event_participants USING btree (participant_id, role);


--
-- Name: idx_event_participants_role; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_participants_role ON public.event_participants USING btree (role);


--
-- Name: idx_event_restrictions_enforced; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_restrictions_enforced ON public.event_restrictions USING btree (is_enforced);


--
-- Name: idx_event_restrictions_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_restrictions_event ON public.event_restrictions USING btree (event_id);


--
-- Name: idx_event_restrictions_severity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_restrictions_severity ON public.event_restrictions USING btree (severity);


--
-- Name: idx_event_restrictions_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_restrictions_type ON public.event_restrictions USING btree (restriction_type);


--
-- Name: idx_event_schedules_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_schedules_event ON public.event_schedules USING btree (event_id);


--
-- Name: idx_event_schedules_live; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_schedules_live ON public.event_schedules USING btree (is_live);


--
-- Name: idx_event_schedules_mandatory; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_schedules_mandatory ON public.event_schedules USING btree (is_mandatory);


--
-- Name: idx_event_schedules_order; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_schedules_order ON public.event_schedules USING btree (display_order);


--
-- Name: idx_event_schedules_start_time; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_schedules_start_time ON public.event_schedules USING btree (start_time);


--
-- Name: idx_event_schedules_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_schedules_type ON public.event_schedules USING btree (schedule_type);


--
-- Name: idx_event_stats_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_stats_category ON public.event_stats USING btree (stat_category);


--
-- Name: idx_event_stats_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_stats_event ON public.event_stats USING btree (event_id);


--
-- Name: idx_event_stats_official; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_stats_official ON public.event_stats USING btree (is_official);


--
-- Name: idx_event_stats_participant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_stats_participant ON public.event_stats USING btree (participant_id);


--
-- Name: idx_event_stats_period; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_stats_period ON public.event_stats USING btree (period);


--
-- Name: idx_event_stats_timestamp; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_stats_timestamp ON public.event_stats USING btree (timestamp_recorded);


--
-- Name: idx_event_stats_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_stats_type ON public.event_stats USING btree (stat_type);


--
-- Name: idx_event_ticket_config_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_ticket_config_active ON public.event_ticket_config USING btree (is_active);


--
-- Name: idx_event_ticket_config_available; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_ticket_config_available ON public.event_ticket_config USING btree (available_quantity);


--
-- Name: idx_event_ticket_config_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_ticket_config_event ON public.event_ticket_config USING btree (event_id);


--
-- Name: idx_event_ticket_config_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_ticket_config_organizer ON public.event_ticket_config USING btree (organizer_id);


--
-- Name: idx_event_ticket_config_sale_dates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_ticket_config_sale_dates ON public.event_ticket_config USING btree (sale_start_date, sale_end_date);


--
-- Name: idx_event_ticket_config_ticket_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_ticket_config_ticket_type ON public.event_ticket_config USING btree (ticket_type_id);


--
-- Name: idx_event_ticket_config_zone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_ticket_config_zone ON public.event_ticket_config USING btree (zone_id);


--
-- Name: idx_events_api_public; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_api_public ON public.events USING btree (scheduled_start DESC, visibility, status);


--
-- Name: idx_events_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_category ON public.events USING btree (category_id);


--
-- Name: idx_events_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_code ON public.events USING btree (code);


--
-- Name: idx_events_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_created_at ON public.events USING btree (created_at);


--
-- Name: idx_events_featured; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_featured ON public.events USING btree (is_featured);


--
-- Name: idx_events_featured_published; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_featured_published ON public.events USING btree (is_featured, status, scheduled_start);


--
-- Name: idx_events_group; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_group ON public.events USING btree (event_group_id);


--
-- Name: idx_events_mapping; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_mapping ON public.events USING btree (mapping_id);


--
-- Name: idx_events_metadata; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_metadata ON public.events USING gin (metadata);


--
-- Name: idx_events_name_search; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_name_search ON public.events USING gin (to_tsvector('simple'::regconfig, (((name)::text || ' '::text) || COALESCE(description, ''::text))));


--
-- Name: idx_events_organizer_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_organizer_id ON public.events USING btree (organizer_id);


--
-- Name: idx_events_organizer_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_organizer_status ON public.events USING btree (organizer_id, status);


--
-- Name: idx_events_organizer_upcoming; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_organizer_upcoming ON public.events USING btree (organizer_id, status, scheduled_start);


--
-- Name: idx_events_pricing_config; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_pricing_config ON public.events USING gin (pricing_config);


--
-- Name: idx_events_published_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_published_at ON public.events USING btree (published_at);


--
-- Name: idx_events_published_partial; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_published_partial ON public.events USING btree (scheduled_start, organizer_id) WHERE (status = 'PUBLISHED'::public.event_status);


--
-- Name: idx_events_published_upcoming; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_published_upcoming ON public.events USING btree (status, scheduled_start);


--
-- Name: idx_events_restrictions; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_restrictions ON public.events USING gin (restrictions);


--
-- Name: idx_events_sales_window; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_sales_window ON public.events USING btree (sales_start, sales_end);


--
-- Name: idx_events_scheduled_end; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_scheduled_end ON public.events USING btree (scheduled_end);


--
-- Name: idx_events_scheduled_range; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_scheduled_range ON public.events USING btree (scheduled_start, scheduled_end);


--
-- Name: idx_events_scheduled_start; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_scheduled_start ON public.events USING btree (scheduled_start);


--
-- Name: idx_events_search_api; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_search_api ON public.events USING btree (scheduled_start, category_id, venue_id, status, visibility);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- Name: idx_events_tags; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_tags ON public.events USING gin (tags);


--
-- Name: idx_events_venue; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_venue ON public.events USING btree (venue_id);


--
-- Name: idx_events_venue_upcoming; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_venue_upcoming ON public.events USING btree (venue_id, status, scheduled_start);


--
-- Name: idx_events_visibility; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_visibility ON public.events USING btree (visibility);


--
-- Name: idx_groups_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_groups_active ON public.groups USING btree (is_active);


--
-- Name: idx_groups_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_groups_code ON public.groups USING btree (code);


--
-- Name: idx_groups_metadata; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_groups_metadata ON public.groups USING gin (metadata);


--
-- Name: idx_groups_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_groups_type ON public.groups USING btree (type);


--
-- Name: idx_groups_type_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_groups_type_active ON public.groups USING btree (type, is_active);


--
-- Name: idx_groups_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_groups_validity ON public.groups USING btree (valid_from, valid_until);


--
-- Name: idx_login_attempts_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_created_at ON public.login_attempts USING btree (created_at);


--
-- Name: idx_login_attempts_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_email ON public.login_attempts USING btree (email);


--
-- Name: idx_login_attempts_failed_recent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_failed_recent ON public.login_attempts USING btree (email, created_at, success);


--
-- Name: idx_login_attempts_fraud_analysis; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_fraud_analysis ON public.login_attempts USING btree (ip_address, created_at, success);


--
-- Name: idx_login_attempts_ip_address; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_ip_address ON public.login_attempts USING btree (ip_address);


--
-- Name: idx_login_attempts_ip_recent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_ip_recent ON public.login_attempts USING btree (ip_address, created_at);


--
-- Name: idx_login_attempts_success; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_success ON public.login_attempts USING btree (success);


--
-- Name: idx_login_attempts_suspicious; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_suspicious ON public.login_attempts USING btree (is_suspicious);


--
-- Name: idx_login_attempts_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_user ON public.login_attempts USING btree (user_id);


--
-- Name: idx_mfa_tokens_expires_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_mfa_tokens_expires_at ON public.mfa_tokens USING btree (expires_at);


--
-- Name: idx_mfa_tokens_method; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_mfa_tokens_method ON public.mfa_tokens USING btree (method);


--
-- Name: idx_mfa_tokens_used; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_mfa_tokens_used ON public.mfa_tokens USING btree (is_used);


--
-- Name: idx_mfa_tokens_used_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_mfa_tokens_used_at ON public.mfa_tokens USING btree (used_at);


--
-- Name: idx_mfa_tokens_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_mfa_tokens_user ON public.mfa_tokens USING btree (user_id);


--
-- Name: idx_mfa_tokens_user_valid; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_mfa_tokens_user_valid ON public.mfa_tokens USING btree (user_id, method, expires_at, is_used);


--
-- Name: idx_order_items_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_order_items_event ON public.order_items USING btree (event_id);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_order_items_subscription_plan; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_order_items_subscription_plan ON public.order_items USING btree (subscription_plan_id);


--
-- Name: idx_order_items_ticket_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_order_items_ticket_type ON public.order_items USING btree (ticket_type_id);


--
-- Name: idx_order_items_total_price; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_order_items_total_price ON public.order_items USING btree (total_price);


--
-- Name: idx_order_items_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_order_items_type ON public.order_items USING btree (item_type);


--
-- Name: idx_orders_channel; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_channel ON public.orders USING btree (purchase_channel);


--
-- Name: idx_orders_confirmed_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_confirmed_at ON public.orders USING btree (confirmed_at);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: idx_orders_expires_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_expires_at ON public.orders USING btree (expires_at);


--
-- Name: idx_orders_guest_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_guest_email ON public.orders USING btree (guest_email);


--
-- Name: idx_orders_organizer_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_organizer_status ON public.orders USING btree (primary_organizer_id, status);


--
-- Name: idx_orders_primary_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_primary_organizer ON public.orders USING btree (primary_organizer_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_total_amount; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_total_amount ON public.orders USING btree (total_amount);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);


--
-- Name: idx_organizer_commissions_contract_version; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_contract_version ON public.organizer_commissions USING btree (contract_version);


--
-- Name: idx_organizer_commissions_due_date; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_due_date ON public.organizer_commissions USING btree (payment_due_date);


--
-- Name: idx_organizer_commissions_order; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_order ON public.organizer_commissions USING btree (order_id);


--
-- Name: idx_organizer_commissions_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_organizer ON public.organizer_commissions USING btree (organizer_id);


--
-- Name: idx_organizer_commissions_organizer_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_organizer_status ON public.organizer_commissions USING btree (organizer_id, status);


--
-- Name: idx_organizer_commissions_paid_date; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_paid_date ON public.organizer_commissions USING btree (paid_date);


--
-- Name: idx_organizer_commissions_payment; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_payment ON public.organizer_commissions USING btree (payment_id);


--
-- Name: idx_organizer_commissions_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_status ON public.organizer_commissions USING btree (status);


--
-- Name: idx_organizer_commissions_tier; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_tier ON public.organizer_commissions USING btree (commission_tier);


--
-- Name: idx_organizer_commissions_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_type ON public.organizer_commissions USING btree (commission_type);


--
-- Name: idx_organizer_commissions_unpaid_partial; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizer_commissions_unpaid_partial ON public.organizer_commissions USING btree (organizer_id, payment_due_date) WHERE (status = ANY (ARRAY['PENDING'::public.commission_status, 'CALCULATED'::public.commission_status, 'APPROVED'::public.commission_status]));


--
-- Name: idx_organizers_active_validated; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_active_validated ON public.organizers USING btree (status, validated_at);


--
-- Name: idx_organizers_api_public; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_api_public ON public.organizers USING btree (name, type, city, status);


--
-- Name: idx_organizers_banking_details; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_banking_details ON public.organizers USING gin (banking_details);


--
-- Name: idx_organizers_city_country; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_city_country ON public.organizers USING btree (city, country);


--
-- Name: idx_organizers_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_code ON public.organizers USING btree (code);


--
-- Name: idx_organizers_commission_rate; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_commission_rate ON public.organizers USING btree (commission_rate);


--
-- Name: idx_organizers_contact_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_contact_email ON public.organizers USING btree (contact_email);


--
-- Name: idx_organizers_contact_phone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_contact_phone ON public.organizers USING btree (contact_phone);


--
-- Name: idx_organizers_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_created_at ON public.organizers USING btree (created_at);


--
-- Name: idx_organizers_legal_documents; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_legal_documents ON public.organizers USING gin (legal_documents);


--
-- Name: idx_organizers_metadata; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_metadata ON public.organizers USING gin (metadata);


--
-- Name: idx_organizers_name_search; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_name_search ON public.organizers USING gin (to_tsvector('simple'::regconfig, (((((name)::text || ' '::text) || (COALESCE(short_name, ''::character varying))::text) || ' '::text) || (COALESCE(legal_name, ''::character varying))::text)));


--
-- Name: idx_organizers_performance; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_performance ON public.organizers USING btree (total_events_organized, total_revenue_generated);


--
-- Name: idx_organizers_satisfaction; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_satisfaction ON public.organizers USING btree (average_satisfaction_score);


--
-- Name: idx_organizers_social_media; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_social_media ON public.organizers USING gin (social_media);


--
-- Name: idx_organizers_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_status ON public.organizers USING btree (status);


--
-- Name: idx_organizers_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_type ON public.organizers USING btree (type);


--
-- Name: idx_organizers_type_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_type_status ON public.organizers USING btree (type, status);


--
-- Name: idx_organizers_updated_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_updated_at ON public.organizers USING btree (updated_at);


--
-- Name: idx_organizers_validation; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_organizers_validation ON public.organizers USING btree (validated_at, status);


--
-- Name: idx_participant_relationships_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_relationships_active ON public.participant_relationships USING btree (is_active);


--
-- Name: idx_participant_relationships_bidirectional; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_relationships_bidirectional ON public.participant_relationships USING btree (participant_b_id, participant_a_id, relationship_type);


--
-- Name: idx_participant_relationships_dates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_relationships_dates ON public.participant_relationships USING btree (start_date, end_date);


--
-- Name: idx_participant_relationships_intensity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_relationships_intensity ON public.participant_relationships USING btree (intensity);


--
-- Name: idx_participant_relationships_participant_a; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_relationships_participant_a ON public.participant_relationships USING btree (participant_a_id);


--
-- Name: idx_participant_relationships_participant_b; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_relationships_participant_b ON public.participant_relationships USING btree (participant_b_id);


--
-- Name: idx_participant_relationships_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_relationships_type ON public.participant_relationships USING btree (relationship_type);


--
-- Name: idx_participant_staff_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_staff_active ON public.participant_staff USING btree (is_active);


--
-- Name: idx_participant_staff_contract_dates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_staff_contract_dates ON public.participant_staff USING btree (contract_start, contract_end);


--
-- Name: idx_participant_staff_jersey_number; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_staff_jersey_number ON public.participant_staff USING btree (jersey_number);


--
-- Name: idx_participant_staff_nationality; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_staff_nationality ON public.participant_staff USING btree (nationality);


--
-- Name: idx_participant_staff_participant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_staff_participant ON public.participant_staff USING btree (participant_id);


--
-- Name: idx_participant_staff_role; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participant_staff_role ON public.participant_staff USING btree (role);


--
-- Name: idx_participants_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_active ON public.participants USING btree (is_active);


--
-- Name: idx_participants_affiliated_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_affiliated_organizer ON public.participants USING btree (affiliated_organizer_id);


--
-- Name: idx_participants_booking_agent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_booking_agent ON public.participants USING gin (booking_agent_info);


--
-- Name: idx_participants_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_category ON public.participants USING btree (category);


--
-- Name: idx_participants_city; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_city ON public.participants USING btree (city);


--
-- Name: idx_participants_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_code ON public.participants USING btree (code);


--
-- Name: idx_participants_founded_date; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_founded_date ON public.participants USING btree (founded_date);


--
-- Name: idx_participants_name_search; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_name_search ON public.participants USING gin (to_tsvector('simple'::regconfig, (((name)::text || ' '::text) || (COALESCE(short_name, ''::character varying))::text)));


--
-- Name: idx_participants_nationality; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_nationality ON public.participants USING btree (nationality);


--
-- Name: idx_participants_participant_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_participant_category ON public.participants USING btree (participant_category);


--
-- Name: idx_participants_social_media; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_social_media ON public.participants USING gin (social_media);


--
-- Name: idx_participants_statistics; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_statistics ON public.participants USING gin (statistics);


--
-- Name: idx_participants_technical_requirements; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_technical_requirements ON public.participants USING gin (technical_requirements);


--
-- Name: idx_participants_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_type ON public.participants USING btree (type);


--
-- Name: idx_participants_verified; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_participants_verified ON public.participants USING btree (is_verified);


--
-- Name: idx_payment_attempts_attempted_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_attempts_attempted_at ON public.payment_attempts USING btree (attempted_at);


--
-- Name: idx_payment_attempts_failures; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_attempts_failures ON public.payment_attempts USING btree (attempted_at, failure_reason, status);


--
-- Name: idx_payment_attempts_payment; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_attempts_payment ON public.payment_attempts USING btree (payment_id);


--
-- Name: idx_payment_attempts_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_attempts_status ON public.payment_attempts USING btree (status);


--
-- Name: idx_payment_methods_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_methods_active ON public.payment_methods USING btree (is_active);


--
-- Name: idx_payment_methods_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_methods_code ON public.payment_methods USING btree (code);


--
-- Name: idx_payment_methods_default; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_methods_default ON public.payment_methods USING btree (is_default);


--
-- Name: idx_payment_methods_display_order; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_methods_display_order ON public.payment_methods USING btree (display_order);


--
-- Name: idx_payment_methods_provider; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_methods_provider ON public.payment_methods USING btree (provider);


--
-- Name: idx_payment_methods_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_methods_type ON public.payment_methods USING btree (type);


--
-- Name: idx_payment_webhooks_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_webhooks_created_at ON public.payment_webhooks USING btree (created_at);


--
-- Name: idx_payment_webhooks_event_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_webhooks_event_type ON public.payment_webhooks USING btree (event_type);


--
-- Name: idx_payment_webhooks_external_transaction; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_webhooks_external_transaction ON public.payment_webhooks USING btree (external_transaction_id);


--
-- Name: idx_payment_webhooks_payment; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_webhooks_payment ON public.payment_webhooks USING btree (payment_id);


--
-- Name: idx_payment_webhooks_processed_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_webhooks_processed_at ON public.payment_webhooks USING btree (processed_at);


--
-- Name: idx_payment_webhooks_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_webhooks_status ON public.payment_webhooks USING btree (status);


--
-- Name: idx_payment_webhooks_webhook_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payment_webhooks_webhook_id ON public.payment_webhooks USING btree (webhook_id);


--
-- Name: idx_payments_amount; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_amount ON public.payments USING btree (amount);


--
-- Name: idx_payments_expires_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_expires_at ON public.payments USING btree (expires_at);


--
-- Name: idx_payments_external_transaction; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_external_transaction ON public.payments USING btree (external_transaction_id);


--
-- Name: idx_payments_method; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_method ON public.payments USING btree (payment_method_id);


--
-- Name: idx_payments_order; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);


--
-- Name: idx_payments_organizer_monthly; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_organizer_monthly ON public.payments USING btree (primary_organizer_id, payment_date, status);


--
-- Name: idx_payments_organizer_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_organizer_status ON public.payments USING btree (primary_organizer_id, status);


--
-- Name: idx_payments_payment_date; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_payment_date ON public.payments USING btree (payment_date);


--
-- Name: idx_payments_primary_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_primary_organizer ON public.payments USING btree (primary_organizer_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_persistent_tokens_created; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_persistent_tokens_created ON public.persistent_tokens USING btree (created_at);


--
-- Name: idx_persistent_tokens_expires; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_persistent_tokens_expires ON public.persistent_tokens USING btree (expires_at);


--
-- Name: idx_persistent_tokens_last_used; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_persistent_tokens_last_used ON public.persistent_tokens USING btree (last_used_at);


--
-- Name: idx_persistent_tokens_prefix; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_persistent_tokens_prefix ON public.persistent_tokens USING btree (token_prefix);


--
-- Name: idx_persistent_tokens_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_persistent_tokens_status ON public.persistent_tokens USING btree (is_active, is_revoked);


--
-- Name: idx_persistent_tokens_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_persistent_tokens_type ON public.persistent_tokens USING btree (token_type);


--
-- Name: idx_persistent_tokens_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_persistent_tokens_user ON public.persistent_tokens USING btree (user_id);


--
-- Name: idx_persistent_tokens_user_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_persistent_tokens_user_active ON public.persistent_tokens USING btree (user_id, token_type, is_active);


--
-- Name: idx_pricing_rules_actions; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pricing_rules_actions ON public.pricing_rules USING gin (actions);


--
-- Name: idx_pricing_rules_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pricing_rules_active ON public.pricing_rules USING btree (is_active);


--
-- Name: idx_pricing_rules_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pricing_rules_code ON public.pricing_rules USING btree (code);


--
-- Name: idx_pricing_rules_conditions; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pricing_rules_conditions ON public.pricing_rules USING gin (conditions);


--
-- Name: idx_pricing_rules_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pricing_rules_organizer ON public.pricing_rules USING btree (organizer_id);


--
-- Name: idx_pricing_rules_organizer_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pricing_rules_organizer_active ON public.pricing_rules USING btree (organizer_id, is_active);


--
-- Name: idx_pricing_rules_priority; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pricing_rules_priority ON public.pricing_rules USING btree (priority DESC);


--
-- Name: idx_pricing_rules_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pricing_rules_type ON public.pricing_rules USING btree (rule_type);


--
-- Name: idx_pricing_rules_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pricing_rules_validity ON public.pricing_rules USING btree (valid_from, valid_until);


--
-- Name: idx_rate_limiting_blocked; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rate_limiting_blocked ON public.rate_limiting USING btree (is_blocked);


--
-- Name: idx_rate_limiting_endpoint; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rate_limiting_endpoint ON public.rate_limiting USING btree (endpoint);


--
-- Name: idx_rate_limiting_identifier; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rate_limiting_identifier ON public.rate_limiting USING btree (identifier_type, identifier_value);


--
-- Name: idx_rate_limiting_last_request; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rate_limiting_last_request ON public.rate_limiting USING btree (last_request);


--
-- Name: idx_rate_limiting_window_start; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rate_limiting_window_start ON public.rate_limiting USING btree (window_start);


--
-- Name: idx_refunds_approved_by; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refunds_approved_by ON public.refunds USING btree (approved_by);


--
-- Name: idx_refunds_completed_date; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refunds_completed_date ON public.refunds USING btree (completed_date);


--
-- Name: idx_refunds_method; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refunds_method ON public.refunds USING btree (method);


--
-- Name: idx_refunds_order; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refunds_order ON public.refunds USING btree (order_id);


--
-- Name: idx_refunds_payment; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refunds_payment ON public.refunds USING btree (payment_id);


--
-- Name: idx_refunds_requested_by; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refunds_requested_by ON public.refunds USING btree (requested_by);


--
-- Name: idx_refunds_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refunds_status ON public.refunds USING btree (status);


--
-- Name: idx_refunds_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_refunds_type ON public.refunds USING btree (refund_type);


--
-- Name: idx_roles_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_roles_active ON public.roles USING btree (is_active);


--
-- Name: idx_roles_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_roles_code ON public.roles USING btree (code);


--
-- Name: idx_roles_level; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_roles_level ON public.roles USING btree (level);


--
-- Name: idx_roles_permissions; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_roles_permissions ON public.roles USING gin (permissions);


--
-- Name: idx_seats_accessible; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_seats_accessible ON public.seats USING btree (is_accessible);


--
-- Name: idx_seats_available_partial; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_seats_available_partial ON public.seats USING btree (zone_id, seat_number) WHERE (status = 'AVAILABLE'::public.seat_status);


--
-- Name: idx_seats_coordinates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_seats_coordinates ON public.seats USING btree (x_coordinate, y_coordinate);


--
-- Name: idx_seats_price_modifier; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_seats_price_modifier ON public.seats USING btree (price_modifier);


--
-- Name: idx_seats_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_seats_status ON public.seats USING btree (status);


--
-- Name: idx_seats_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_seats_type ON public.seats USING btree (seat_type);


--
-- Name: idx_seats_zone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_seats_zone ON public.seats USING btree (zone_id);


--
-- Name: idx_seats_zone_available; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_seats_zone_available ON public.seats USING btree (zone_id, status);


--
-- Name: idx_seats_zone_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_seats_zone_status ON public.seats USING btree (zone_id, status);


--
-- Name: idx_security_events_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_events_created_at ON public.security_events USING btree (created_at);


--
-- Name: idx_security_events_event_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_events_event_type ON public.security_events USING btree (event_type);


--
-- Name: idx_security_events_ip_address; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_events_ip_address ON public.security_events USING btree (ip_address);


--
-- Name: idx_security_events_resolved_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_events_resolved_at ON public.security_events USING btree (resolved_at);


--
-- Name: idx_security_events_severity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_events_severity ON public.security_events USING btree (severity);


--
-- Name: idx_security_events_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_events_status ON public.security_events USING btree (status);


--
-- Name: idx_security_events_target_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_events_target_user ON public.security_events USING btree (target_user_id);


--
-- Name: idx_security_policies_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_policies_active ON public.security_policies USING btree (is_active);


--
-- Name: idx_security_policies_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_policies_code ON public.security_policies USING btree (code);


--
-- Name: idx_security_policies_enforced; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_policies_enforced ON public.security_policies USING btree (is_enforced);


--
-- Name: idx_security_policies_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_policies_type ON public.security_policies USING btree (policy_type);


--
-- Name: idx_security_policies_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_security_policies_validity ON public.security_policies USING btree (valid_from, valid_until);


--
-- Name: idx_subscription_plan_event_groups_group; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_event_groups_group ON public.subscription_plan_event_groups USING btree (event_group_id);


--
-- Name: idx_subscription_plan_event_groups_included; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_event_groups_included ON public.subscription_plan_event_groups USING btree (is_included);


--
-- Name: idx_subscription_plan_event_groups_plan; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_event_groups_plan ON public.subscription_plan_event_groups USING btree (subscription_plan_id);


--
-- Name: idx_subscription_plan_events_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_events_event ON public.subscription_plan_events USING btree (event_id);


--
-- Name: idx_subscription_plan_events_included; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_events_included ON public.subscription_plan_events USING btree (is_included);


--
-- Name: idx_subscription_plan_events_plan; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_events_plan ON public.subscription_plan_events USING btree (subscription_plan_id);


--
-- Name: idx_subscription_plan_events_priority; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_events_priority ON public.subscription_plan_events USING btree (is_priority);


--
-- Name: idx_subscription_plan_zones_included; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_zones_included ON public.subscription_plan_zones USING btree (is_included);


--
-- Name: idx_subscription_plan_zones_plan; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_zones_plan ON public.subscription_plan_zones USING btree (subscription_plan_id);


--
-- Name: idx_subscription_plan_zones_zone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plan_zones_zone ON public.subscription_plan_zones USING btree (zone_id);


--
-- Name: idx_subscription_plans_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plans_active ON public.subscription_plans USING btree (is_active);


--
-- Name: idx_subscription_plans_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plans_code ON public.subscription_plans USING btree (code);


--
-- Name: idx_subscription_plans_current_available; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plans_current_available ON public.subscription_plans USING btree (current_subscribers, max_subscribers);


--
-- Name: idx_subscription_plans_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plans_organizer ON public.subscription_plans USING btree (organizer_id);


--
-- Name: idx_subscription_plans_organizer_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plans_organizer_type ON public.subscription_plans USING btree (organizer_id, type);


--
-- Name: idx_subscription_plans_price; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plans_price ON public.subscription_plans USING btree (price);


--
-- Name: idx_subscription_plans_sale_dates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plans_sale_dates ON public.subscription_plans USING btree (sale_start_date, sale_end_date);


--
-- Name: idx_subscription_plans_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plans_type ON public.subscription_plans USING btree (type);


--
-- Name: idx_subscription_plans_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscription_plans_validity ON public.subscription_plans USING btree (valid_from, valid_until);


--
-- Name: idx_subscriptions_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscriptions_active ON public.subscriptions USING btree (user_id, status);


--
-- Name: idx_subscriptions_active_partial; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscriptions_active_partial ON public.subscriptions USING btree (user_id, organizer_id, end_date) WHERE (status = 'ACTIVE'::public.subscription_status);


--
-- Name: idx_subscriptions_dates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscriptions_dates ON public.subscriptions USING btree (start_date, end_date);


--
-- Name: idx_subscriptions_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscriptions_organizer ON public.subscriptions USING btree (organizer_id);


--
-- Name: idx_subscriptions_organizer_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscriptions_organizer_status ON public.subscriptions USING btree (organizer_id, status);


--
-- Name: idx_subscriptions_plan; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscriptions_plan ON public.subscriptions USING btree (plan_id);


--
-- Name: idx_subscriptions_price; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscriptions_price ON public.subscriptions USING btree (price_paid);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_subscriptions_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);


--
-- Name: idx_ticket_templates_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_templates_active ON public.ticket_templates USING btree (is_active);


--
-- Name: idx_ticket_templates_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_templates_code ON public.ticket_templates USING btree (code);


--
-- Name: idx_ticket_templates_default; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_templates_default ON public.ticket_templates USING btree (is_default);


--
-- Name: idx_ticket_templates_format; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_templates_format ON public.ticket_templates USING btree (format);


--
-- Name: idx_ticket_templates_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_templates_type ON public.ticket_templates USING btree (template_type);


--
-- Name: idx_ticket_types_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_types_active ON public.ticket_types USING btree (is_active);


--
-- Name: idx_ticket_types_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_types_code ON public.ticket_types USING btree (code);


--
-- Name: idx_ticket_types_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_types_organizer ON public.ticket_types USING btree (organizer_id);


--
-- Name: idx_ticket_types_organizer_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_types_organizer_active ON public.ticket_types USING btree (organizer_id, is_active);


--
-- Name: idx_ticket_types_price; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_types_price ON public.ticket_types USING btree (base_price);


--
-- Name: idx_ticket_types_refundable; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_types_refundable ON public.ticket_types USING btree (refundable);


--
-- Name: idx_ticket_types_transferable; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_types_transferable ON public.ticket_types USING btree (transferable);


--
-- Name: idx_ticket_types_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ticket_types_validity ON public.ticket_types USING btree (valid_from, valid_until);


--
-- Name: idx_tickets_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tickets_active ON public.tickets USING btree (is_active);


--
-- Name: idx_tickets_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tickets_event ON public.tickets USING btree (event_id);


--
-- Name: idx_tickets_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tickets_organizer ON public.tickets USING btree (organizer_id);


--
-- Name: idx_tickets_organizer_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tickets_organizer_event ON public.tickets USING btree (organizer_id, event_id);


--
-- Name: idx_tickets_price; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tickets_price ON public.tickets USING btree (price_paid);


--
-- Name: idx_tickets_seat; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tickets_seat ON public.tickets USING btree (seat_id);


--
-- Name: idx_tickets_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tickets_type ON public.tickets USING btree (ticket_type_id);


--
-- Name: idx_tickets_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tickets_user ON public.tickets USING btree (user_id);


--
-- Name: idx_tickets_zone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_tickets_zone ON public.tickets USING btree (zone_id);


--
-- Name: idx_user_groups_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_groups_active ON public.user_groups USING btree (user_id, group_id, status);


--
-- Name: idx_user_groups_added_by; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_groups_added_by ON public.user_groups USING btree (added_by);


--
-- Name: idx_user_groups_group_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_groups_group_id ON public.user_groups USING btree (group_id);


--
-- Name: idx_user_groups_group_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_groups_group_status ON public.user_groups USING btree (group_id, status);


--
-- Name: idx_user_groups_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_groups_status ON public.user_groups USING btree (status);


--
-- Name: idx_user_groups_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_groups_user_id ON public.user_groups USING btree (user_id);


--
-- Name: idx_user_groups_user_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_groups_user_status ON public.user_groups USING btree (user_id, status);


--
-- Name: idx_user_groups_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_groups_validity ON public.user_groups USING btree (joined_at, valid_until);


--
-- Name: idx_user_mfa_settings_enabled; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_mfa_settings_enabled ON public.user_mfa_settings USING btree (is_enabled);


--
-- Name: idx_user_mfa_settings_last_used; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_mfa_settings_last_used ON public.user_mfa_settings USING btree (last_used_at);


--
-- Name: idx_user_mfa_settings_method; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_mfa_settings_method ON public.user_mfa_settings USING btree (method);


--
-- Name: idx_user_mfa_settings_primary; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_mfa_settings_primary ON public.user_mfa_settings USING btree (is_primary);


--
-- Name: idx_user_mfa_settings_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_mfa_settings_user ON public.user_mfa_settings USING btree (user_id);


--
-- Name: idx_user_mfa_settings_user_enabled; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_mfa_settings_user_enabled ON public.user_mfa_settings USING btree (user_id, is_enabled);


--
-- Name: idx_user_profiles_birth_year; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_birth_year ON public.user_profiles USING btree (date_of_birth);


--
-- Name: idx_user_profiles_city_country; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_city_country ON public.user_profiles USING btree (city, country);


--
-- Name: idx_user_profiles_favorite_team; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_favorite_team ON public.user_profiles USING btree (favorite_team_id);


--
-- Name: idx_user_profiles_gender; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_gender ON public.user_profiles USING btree (gender);


--
-- Name: idx_user_profiles_identity_lookup; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_identity_lookup ON public.user_profiles USING btree (identity_document_type, identity_document_number);


--
-- Name: idx_user_profiles_identity_number; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_identity_number ON public.user_profiles USING btree (identity_document_number);


--
-- Name: idx_user_profiles_identity_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_identity_type ON public.user_profiles USING btree (identity_document_type);


--
-- Name: idx_user_profiles_identity_verified; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_identity_verified ON public.user_profiles USING btree (identity_verified);


--
-- Name: idx_user_profiles_language; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_language ON public.user_profiles USING btree (language);


--
-- Name: idx_user_profiles_preferences; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_preferences ON public.user_profiles USING gin (preferences);


--
-- Name: idx_user_profiles_supporter_since; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_supporter_since ON public.user_profiles USING btree (supporter_since);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_user_profiles_verified_identities; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_profiles_verified_identities ON public.user_profiles USING btree (identity_document_type, identity_document_number) WHERE (identity_verified = true);


--
-- Name: idx_user_roles_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_roles_active ON public.user_roles USING btree (user_id, role_id, status);


--
-- Name: idx_user_roles_assigned_by; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_roles_assigned_by ON public.user_roles USING btree (assigned_by);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_roles_status ON public.user_roles USING btree (status);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_user_roles_user_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_roles_user_status ON public.user_roles USING btree (user_id, status);


--
-- Name: idx_user_roles_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_roles_validity ON public.user_roles USING btree (assigned_at, valid_until);


--
-- Name: idx_user_sessions_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (is_active);


--
-- Name: idx_user_sessions_device_fingerprint; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_sessions_device_fingerprint ON public.user_sessions USING btree (device_fingerprint);


--
-- Name: idx_user_sessions_expired; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_sessions_expired ON public.user_sessions USING btree (expires_at, is_active);


--
-- Name: idx_user_sessions_expires_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_ip_address; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_sessions_ip_address ON public.user_sessions USING btree (ip_address);


--
-- Name: idx_user_sessions_last_activity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions USING btree (last_activity);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);


--
-- Name: idx_user_sessions_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_sessions_user ON public.user_sessions USING btree (user_id);


--
-- Name: idx_user_sessions_user_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_sessions_user_active ON public.user_sessions USING btree (user_id, last_activity, is_active);


--
-- Name: idx_user_trusted_devices_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_trusted_devices_active ON public.user_trusted_devices USING btree (is_active);


--
-- Name: idx_user_trusted_devices_expires; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_trusted_devices_expires ON public.user_trusted_devices USING btree (expires_at);


--
-- Name: idx_user_trusted_devices_fingerprint; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_trusted_devices_fingerprint ON public.user_trusted_devices USING btree (device_fingerprint);


--
-- Name: idx_user_trusted_devices_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_trusted_devices_user ON public.user_trusted_devices USING btree (user_id);


--
-- Name: idx_user_trusted_devices_user_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_trusted_devices_user_active ON public.user_trusted_devices USING btree (user_id, is_active);


--
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_active ON public.users USING btree (is_active);


--
-- Name: idx_users_active_verified_partial; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_active_verified_partial ON public.users USING btree (id, email_verified) WHERE (is_active = true);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_full_name; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_full_name ON public.users USING btree (first_name, last_name);


--
-- Name: idx_users_last_login; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_last_login ON public.users USING btree (last_login);


--
-- Name: idx_users_name_search; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_name_search ON public.users USING gin (to_tsvector('simple'::regconfig, (((first_name)::text || ' '::text) || (last_name)::text)));


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_verified; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_verified ON public.users USING btree (email_verified, phone_verified);


--
-- Name: idx_validation_tokens_attempts; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_validation_tokens_attempts ON public.validation_tokens USING btree (attempt_count, max_attempts);


--
-- Name: idx_validation_tokens_blocked; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_validation_tokens_blocked ON public.validation_tokens USING btree (is_blocked);


--
-- Name: idx_validation_tokens_created; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_validation_tokens_created ON public.validation_tokens USING btree (created_at);


--
-- Name: idx_validation_tokens_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_validation_tokens_email ON public.validation_tokens USING btree (email);


--
-- Name: idx_validation_tokens_email_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_validation_tokens_email_active ON public.validation_tokens USING btree (email, token_type, is_used);


--
-- Name: idx_validation_tokens_expires; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_validation_tokens_expires ON public.validation_tokens USING btree (expires_at);


--
-- Name: idx_validation_tokens_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_validation_tokens_type ON public.validation_tokens USING btree (token_type);


--
-- Name: idx_validation_tokens_used; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_validation_tokens_used ON public.validation_tokens USING btree (is_used);


--
-- Name: idx_validation_tokens_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_validation_tokens_user ON public.validation_tokens USING btree (user_id);


--
-- Name: idx_venue_amenities_available; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_amenities_available ON public.venue_amenities USING btree (is_available);


--
-- Name: idx_venue_amenities_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_amenities_category ON public.venue_amenities USING btree (category);


--
-- Name: idx_venue_amenities_free; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_amenities_free ON public.venue_amenities USING btree (is_free);


--
-- Name: idx_venue_amenities_mapping; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_amenities_mapping ON public.venue_amenities USING btree (mapping_id);


--
-- Name: idx_venue_amenities_price; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_amenities_price ON public.venue_amenities USING btree (price);


--
-- Name: idx_venue_amenities_zone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_amenities_zone ON public.venue_amenities USING btree (zone_id);


--
-- Name: idx_venue_mappings_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_mappings_active ON public.venue_mappings USING btree (is_active);


--
-- Name: idx_venue_mappings_capacity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_mappings_capacity ON public.venue_mappings USING btree (effective_capacity);


--
-- Name: idx_venue_mappings_categories; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_mappings_categories ON public.venue_mappings USING gin (event_categories);


--
-- Name: idx_venue_mappings_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_mappings_type ON public.venue_mappings USING btree (mapping_type);


--
-- Name: idx_venue_mappings_validity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_mappings_validity ON public.venue_mappings USING btree (valid_from, valid_until);


--
-- Name: idx_venue_mappings_venue; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_mappings_venue ON public.venue_mappings USING btree (venue_id);


--
-- Name: idx_venue_media_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_media_category ON public.venue_media USING btree (category);


--
-- Name: idx_venue_media_featured; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_media_featured ON public.venue_media USING btree (is_featured);


--
-- Name: idx_venue_media_mapping; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_media_mapping ON public.venue_media USING btree (mapping_id);


--
-- Name: idx_venue_media_public; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_media_public ON public.venue_media USING btree (is_public);


--
-- Name: idx_venue_media_seat; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_media_seat ON public.venue_media USING btree (seat_id);


--
-- Name: idx_venue_media_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_media_type ON public.venue_media USING btree (media_type);


--
-- Name: idx_venue_media_venue; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_media_venue ON public.venue_media USING btree (venue_id);


--
-- Name: idx_venue_media_zone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_media_zone ON public.venue_media USING btree (zone_id);


--
-- Name: idx_venue_organizer_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_organizer_active ON public.venue_organizer_relations USING btree (is_active);


--
-- Name: idx_venue_organizer_active_priority; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_organizer_active_priority ON public.venue_organizer_relations USING btree (venue_id, priority_level DESC, relation_type, is_active);


--
-- Name: idx_venue_organizer_created_by; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_organizer_created_by ON public.venue_organizer_relations USING btree (created_by);


--
-- Name: idx_venue_organizer_dates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_organizer_dates ON public.venue_organizer_relations USING btree (valid_from, valid_until);


--
-- Name: idx_venue_organizer_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_organizer_organizer ON public.venue_organizer_relations USING btree (organizer_id);


--
-- Name: idx_venue_organizer_priority; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_organizer_priority ON public.venue_organizer_relations USING btree (priority_level DESC);


--
-- Name: idx_venue_organizer_rental_rate; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_organizer_rental_rate ON public.venue_organizer_relations USING btree (rental_rate);


--
-- Name: idx_venue_organizer_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_organizer_type ON public.venue_organizer_relations USING btree (relation_type);


--
-- Name: idx_venue_organizer_venue; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_organizer_venue ON public.venue_organizer_relations USING btree (venue_id);


--
-- Name: idx_venue_zones_accessible; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_accessible ON public.venue_zones USING btree (is_accessible);


--
-- Name: idx_venue_zones_amenities; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_amenities ON public.venue_zones USING gin (amenities);


--
-- Name: idx_venue_zones_capacity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_capacity ON public.venue_zones USING btree (capacity);


--
-- Name: idx_venue_zones_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_category ON public.venue_zones USING btree (category);


--
-- Name: idx_venue_zones_coordinates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_coordinates ON public.venue_zones USING gin (coordinates);


--
-- Name: idx_venue_zones_level; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_level ON public.venue_zones USING btree (level);


--
-- Name: idx_venue_zones_mapping; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_mapping ON public.venue_zones USING btree (mapping_id);


--
-- Name: idx_venue_zones_name_search; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_name_search ON public.venue_zones USING gin (to_tsvector('simple'::regconfig, (((name)::text || ' '::text) || COALESCE(description, ''::text))));


--
-- Name: idx_venue_zones_parent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_parent ON public.venue_zones USING btree (parent_zone_id);


--
-- Name: idx_venue_zones_price; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_price ON public.venue_zones USING btree (base_price);


--
-- Name: idx_venue_zones_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venue_zones_type ON public.venue_zones USING btree (zone_type);


--
-- Name: idx_venues_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_active ON public.venues USING btree (is_active);


--
-- Name: idx_venues_api_location; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_api_location ON public.venues USING btree (city, max_capacity DESC, is_active);


--
-- Name: idx_venues_capacity; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_capacity ON public.venues USING btree (max_capacity);


--
-- Name: idx_venues_city_country; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_city_country ON public.venues USING btree (city, country);


--
-- Name: idx_venues_coordinates; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_coordinates ON public.venues USING btree (latitude, longitude);


--
-- Name: idx_venues_default_mapping; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_default_mapping ON public.venues USING btree (default_mapping_id);


--
-- Name: idx_venues_name_search; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_name_search ON public.venues USING gin (to_tsvector('simple'::regconfig, (((((name)::text || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || (city)::text)));


--
-- Name: idx_venues_primary_manager; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_primary_manager ON public.venues USING btree (primary_manager_id);


--
-- Name: idx_venues_primary_owner; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_primary_owner ON public.venues USING btree (primary_owner_id);


--
-- Name: idx_venues_slug; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_venues_slug ON public.venues USING btree (slug);


--
-- Name: idx_zone_mapping_overrides_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_zone_mapping_overrides_event ON public.zone_mapping_overrides USING btree (event_id);


--
-- Name: idx_zone_mapping_overrides_zone; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_zone_mapping_overrides_zone ON public.zone_mapping_overrides USING btree (zone_id);


--
-- Name: uk_access_rights_seat_event_valid; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_access_rights_seat_event_valid ON public.access_rights USING btree (seat_id, event_id) WHERE ((status = 'VALID'::public.access_right_status) AND (seat_id IS NOT NULL));


--
-- Name: uk_blacklist_category_temporal; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_blacklist_category_temporal ON public.blacklist USING btree (type, value, scope) WHERE (scope = ANY (ARRAY['CATEGORY'::public.blacklist_scope, 'TEMPORAL'::public.blacklist_scope]));


--
-- Name: uk_blacklist_event; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_blacklist_event ON public.blacklist USING btree (type, value, scope, target_event_id) WHERE ((scope = 'EVENT'::public.blacklist_scope) AND (target_event_id IS NOT NULL));


--
-- Name: uk_blacklist_global; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_blacklist_global ON public.blacklist USING btree (type, value, scope) WHERE (scope = 'GLOBAL'::public.blacklist_scope);


--
-- Name: uk_blacklist_organizer; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_blacklist_organizer ON public.blacklist USING btree (type, value, scope, organizer_id) WHERE ((scope = 'ORGANIZER'::public.blacklist_scope) AND (organizer_id IS NOT NULL));


--
-- Name: uk_blacklist_venue; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_blacklist_venue ON public.blacklist USING btree (type, value, scope, target_venue_id) WHERE ((scope = 'VENUE'::public.blacklist_scope) AND (target_venue_id IS NOT NULL));


--
-- Name: uk_event_ticket_config_zone_type_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_event_ticket_config_zone_type_active ON public.event_ticket_config USING btree (event_id, zone_id, ticket_type_id) WHERE (is_active = true);


--
-- Name: uk_subscriptions_user_organizer_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_subscriptions_user_organizer_active ON public.subscriptions USING btree (user_id, organizer_id) WHERE (status = 'ACTIVE'::public.subscription_status);


--
-- Name: uk_venue_organizer_relations_manager_per_venue; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_venue_organizer_relations_manager_per_venue ON public.venue_organizer_relations USING btree (venue_id) WHERE ((relation_type = 'MANAGER'::public.venue_relation_type) AND (is_active = true));


--
-- Name: uk_venue_organizer_relations_owner_per_venue; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX uk_venue_organizer_relations_owner_per_venue ON public.venue_organizer_relations USING btree (venue_id) WHERE ((relation_type = 'OWNER'::public.venue_relation_type) AND (is_active = true));


--
-- Name: v_order_details _RETURN; Type: RULE; Schema: public; Owner: admin
--

CREATE OR REPLACE VIEW public.v_order_details AS
 SELECT o.id,
    o.order_number,
    o.status,
        CASE
            WHEN (o.user_id IS NOT NULL) THEN ((((u.first_name)::text || ' '::text) || (u.last_name)::text))::character varying
            ELSE o.guest_name
        END AS customer_name,
        CASE
            WHEN (o.user_id IS NOT NULL) THEN u.email
            ELSE o.guest_email
        END AS customer_email,
    org.name AS primary_organizer_name,
    o.subtotal_amount,
    o.discount_amount,
    o.tax_amount,
    o.processing_fee,
    o.total_amount,
    o.currency,
    o.purchase_channel,
    count(DISTINCT oi.id) AS total_items,
    string_agg(DISTINCT (oi.item_name)::text, ', '::text ORDER BY (oi.item_name)::text) AS items_summary,
    p.status AS payment_status,
    p.payment_date,
    p.payment_method_id,
    pm.name AS payment_method_name,
        CASE
            WHEN ((o.status = 'COMPLETED'::public.order_status) AND (p.status = 'COMPLETED'::public.payment_status)) THEN 'PAID'::text
            WHEN ((o.status = 'CONFIRMED'::public.order_status) AND (p.status = ANY (ARRAY['PENDING'::public.payment_status, 'PROCESSING'::public.payment_status]))) THEN 'PAYMENT_PENDING'::text
            WHEN (o.status = 'CANCELLED'::public.order_status) THEN 'CANCELLED'::text
            ELSE 'IN_PROGRESS'::text
        END AS overall_status,
    o.notes,
    o.coupon_code,
    o.created_at,
    o.confirmed_at,
    o.expires_at,
    o.updated_at
   FROM (((((public.orders o
     LEFT JOIN public.users u ON ((o.user_id = u.id)))
     LEFT JOIN public.organizers org ON ((o.primary_organizer_id = org.id)))
     LEFT JOIN public.order_items oi ON ((o.id = oi.order_id)))
     LEFT JOIN public.payments p ON ((o.id = p.order_id)))
     LEFT JOIN public.payment_methods pm ON ((p.payment_method_id = pm.id)))
  GROUP BY o.id, o.order_number, o.status, o.subtotal_amount, o.discount_amount, o.tax_amount, o.processing_fee, o.total_amount, o.currency, o.purchase_channel, o.notes, o.coupon_code, o.created_at, o.confirmed_at, o.expires_at, o.updated_at, u.first_name, u.last_name, u.email, o.guest_name, o.guest_email, org.name, p.status, p.payment_date, p.payment_method_id, pm.name;


--
-- Name: user_profiles trigger_anonymize_identity_on_delete; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_anonymize_identity_on_delete BEFORE DELETE ON public.user_profiles FOR EACH ROW WHEN ((old.identity_document_number IS NOT NULL)) EXECUTE FUNCTION public.anonymize_identity_on_delete();


--
-- Name: access_rights trigger_audit_access_rights; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_audit_access_rights AFTER INSERT OR DELETE OR UPDATE ON public.access_rights FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();


--
-- Name: events trigger_audit_events; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_audit_events AFTER INSERT OR DELETE OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();


--
-- Name: organizers trigger_audit_organizers; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_audit_organizers AFTER INSERT OR DELETE OR UPDATE ON public.organizers FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();


--
-- Name: payments trigger_audit_payments; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_audit_payments AFTER INSERT OR DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();


--
-- Name: order_items trigger_calculate_order_totals; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_calculate_order_totals AFTER INSERT OR DELETE OR UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.calculate_order_totals();


--
-- Name: events trigger_check_event_capacity; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_check_event_capacity BEFORE INSERT OR UPDATE OF max_capacity, mapping_id ON public.events FOR EACH ROW EXECUTE FUNCTION public.check_capacity_consistency();


--
-- Name: login_attempts trigger_detect_suspicious_activity; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_detect_suspicious_activity BEFORE INSERT ON public.login_attempts FOR EACH ROW EXECUTE FUNCTION public.detect_suspicious_activity();


--
-- Name: events trigger_events_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: access_rights trigger_generate_access_codes; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_generate_access_codes BEFORE INSERT ON public.access_rights FOR EACH ROW EXECUTE FUNCTION public.generate_access_codes();


--
-- Name: orders trigger_orders_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: organizers trigger_organizers_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_organizers_updated_at BEFORE UPDATE ON public.organizers FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: participants trigger_participants_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_participants_updated_at BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: payments trigger_payments_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: tickets trigger_prevent_seat_double_booking; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_prevent_seat_double_booking BEFORE INSERT OR UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.prevent_seat_double_booking();


--
-- Name: orders trigger_set_order_primary_organizer; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_set_order_primary_organizer AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_primary_organizer();


--
-- Name: subscription_plans trigger_subscription_plans_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: subscriptions trigger_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: access_rights trigger_sync_access_rights_organizer; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_sync_access_rights_organizer BEFORE INSERT OR UPDATE OF event_id ON public.access_rights FOR EACH ROW EXECUTE FUNCTION public.sync_access_rights_organizer();


--
-- Name: event_ticket_config trigger_sync_event_config_organizer; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_sync_event_config_organizer BEFORE INSERT OR UPDATE OF event_id ON public.event_ticket_config FOR EACH ROW EXECUTE FUNCTION public.sync_event_config_organizer();


--
-- Name: payments trigger_sync_payment_organizer; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_sync_payment_organizer BEFORE INSERT OR UPDATE OF order_id ON public.payments FOR EACH ROW EXECUTE FUNCTION public.sync_payment_organizer();


--
-- Name: subscriptions trigger_sync_subscription_organizer; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_sync_subscription_organizer BEFORE INSERT OR UPDATE OF plan_id ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.sync_subscription_organizer();


--
-- Name: tickets trigger_sync_ticket_organizer; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_sync_ticket_organizer BEFORE INSERT OR UPDATE OF event_id ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.sync_ticket_organizer();


--
-- Name: tickets trigger_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: organizer_commissions trigger_update_organizer_revenue; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_update_organizer_revenue AFTER INSERT OR DELETE OR UPDATE ON public.organizer_commissions FOR EACH ROW EXECUTE FUNCTION public.update_organizer_revenue();


--
-- Name: events trigger_update_organizer_stats; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_update_organizer_stats AFTER INSERT OR DELETE OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_organizer_stats();


--
-- Name: user_profiles trigger_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: users trigger_users_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: events trigger_validate_event_business_rules; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_validate_event_business_rules BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.validate_event_business_rules();


--
-- Name: organizers trigger_validate_organizer_business_rules; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_validate_organizer_business_rules BEFORE INSERT OR UPDATE ON public.organizers FOR EACH ROW EXECUTE FUNCTION public.validate_organizer_business_rules();


--
-- Name: venue_mappings trigger_venue_mappings_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_venue_mappings_updated_at BEFORE UPDATE ON public.venue_mappings FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: venue_organizer_relations trigger_venue_organizer_relations_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_venue_organizer_relations_updated_at BEFORE UPDATE ON public.venue_organizer_relations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: venues trigger_venues_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: api_access_logs api_access_logs_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_access_logs
    ADD CONSTRAINT api_access_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.api_clients(id) ON DELETE CASCADE;


--
-- Name: api_access_logs api_access_logs_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_access_logs
    ADD CONSTRAINT api_access_logs_key_id_fkey FOREIGN KEY (key_id) REFERENCES public.api_keys(id) ON DELETE CASCADE;


--
-- Name: api_clients api_clients_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_clients
    ADD CONSTRAINT api_clients_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: api_keys api_keys_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.api_clients(id) ON DELETE CASCADE;


--
-- Name: access_control_log fk_access_control_log_access_point; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_control_log
    ADD CONSTRAINT fk_access_control_log_access_point FOREIGN KEY (access_point_id) REFERENCES public.access_points(id) ON DELETE SET NULL;


--
-- Name: access_control_log fk_access_control_log_access_right; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_control_log
    ADD CONSTRAINT fk_access_control_log_access_right FOREIGN KEY (access_right_id) REFERENCES public.access_rights(id) ON DELETE CASCADE;


--
-- Name: access_control_log fk_access_control_log_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_control_log
    ADD CONSTRAINT fk_access_control_log_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;


--
-- Name: access_control_log fk_access_control_log_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_control_log
    ADD CONSTRAINT fk_access_control_log_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: access_points fk_access_points_mapping; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_points
    ADD CONSTRAINT fk_access_points_mapping FOREIGN KEY (mapping_id) REFERENCES public.venue_mappings(id) ON DELETE CASCADE;


--
-- Name: access_rights fk_access_rights_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT fk_access_rights_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;


--
-- Name: access_rights fk_access_rights_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT fk_access_rights_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: access_rights fk_access_rights_seat; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT fk_access_rights_seat FOREIGN KEY (seat_id) REFERENCES public.seats(id) ON DELETE SET NULL;


--
-- Name: access_rights fk_access_rights_subscription; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT fk_access_rights_subscription FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- Name: access_rights fk_access_rights_ticket; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT fk_access_rights_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;


--
-- Name: access_rights fk_access_rights_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT fk_access_rights_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: access_rights fk_access_rights_zone; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_rights
    ADD CONSTRAINT fk_access_rights_zone FOREIGN KEY (zone_id) REFERENCES public.venue_zones(id) ON DELETE SET NULL;


--
-- Name: access_transactions_log fk_access_transactions_log_access_right; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_transactions_log
    ADD CONSTRAINT fk_access_transactions_log_access_right FOREIGN KEY (access_right_id) REFERENCES public.access_rights(id) ON DELETE CASCADE;


--
-- Name: access_transactions_log fk_access_transactions_log_from_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_transactions_log
    ADD CONSTRAINT fk_access_transactions_log_from_user FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: access_transactions_log fk_access_transactions_log_to_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.access_transactions_log
    ADD CONSTRAINT fk_access_transactions_log_to_user FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs fk_audit_logs_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: blacklist fk_blacklist_created_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT fk_blacklist_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: blacklist fk_blacklist_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT fk_blacklist_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE CASCADE;


--
-- Name: blacklist fk_blacklist_target_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT fk_blacklist_target_event FOREIGN KEY (target_event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: blacklist fk_blacklist_target_venue; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT fk_blacklist_target_venue FOREIGN KEY (target_venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: event_categories fk_event_categories_parent; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT fk_event_categories_parent FOREIGN KEY (parent_category_id) REFERENCES public.event_categories(id) ON DELETE SET NULL;


--
-- Name: event_groups fk_event_groups_parent; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_groups
    ADD CONSTRAINT fk_event_groups_parent FOREIGN KEY (parent_group_id) REFERENCES public.event_groups(id) ON DELETE SET NULL;


--
-- Name: event_media fk_event_media_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT fk_event_media_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_participants fk_event_participants_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT fk_event_participants_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_participants fk_event_participants_participant; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT fk_event_participants_participant FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: event_restrictions fk_event_restrictions_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_restrictions
    ADD CONSTRAINT fk_event_restrictions_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_schedules fk_event_schedules_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_schedules
    ADD CONSTRAINT fk_event_schedules_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_stats fk_event_stats_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_stats
    ADD CONSTRAINT fk_event_stats_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_stats fk_event_stats_participant; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_stats
    ADD CONSTRAINT fk_event_stats_participant FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: event_ticket_config fk_event_ticket_config_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_ticket_config
    ADD CONSTRAINT fk_event_ticket_config_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_ticket_config fk_event_ticket_config_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_ticket_config
    ADD CONSTRAINT fk_event_ticket_config_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: event_ticket_config fk_event_ticket_config_ticket_type; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_ticket_config
    ADD CONSTRAINT fk_event_ticket_config_ticket_type FOREIGN KEY (ticket_type_id) REFERENCES public.ticket_types(id) ON DELETE CASCADE;


--
-- Name: event_ticket_config fk_event_ticket_config_zone; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_ticket_config
    ADD CONSTRAINT fk_event_ticket_config_zone FOREIGN KEY (zone_id) REFERENCES public.venue_zones(id) ON DELETE CASCADE;


--
-- Name: events fk_events_category; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_category FOREIGN KEY (category_id) REFERENCES public.event_categories(id) ON DELETE RESTRICT;


--
-- Name: events fk_events_created_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: events fk_events_event_group; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_event_group FOREIGN KEY (event_group_id) REFERENCES public.event_groups(id) ON DELETE SET NULL;


--
-- Name: events fk_events_mapping; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_mapping FOREIGN KEY (mapping_id) REFERENCES public.venue_mappings(id) ON DELETE RESTRICT;


--
-- Name: events fk_events_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE RESTRICT;


--
-- Name: events fk_events_published_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_published_by FOREIGN KEY (published_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: events fk_events_venue; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_venue FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE RESTRICT;


--
-- Name: login_attempts fk_login_attempts_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT fk_login_attempts_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: mfa_tokens fk_mfa_tokens_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.mfa_tokens
    ADD CONSTRAINT fk_mfa_tokens_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items fk_order_items_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;


--
-- Name: order_items fk_order_items_order; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items fk_order_items_subscription_plan; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_subscription_plan FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id) ON DELETE SET NULL;


--
-- Name: order_items fk_order_items_ticket_type; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order_items_ticket_type FOREIGN KEY (ticket_type_id) REFERENCES public.ticket_types(id) ON DELETE SET NULL;


--
-- Name: orders fk_orders_primary_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_primary_organizer FOREIGN KEY (primary_organizer_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: orders fk_orders_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: organizer_commissions fk_organizer_commissions_order; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizer_commissions
    ADD CONSTRAINT fk_organizer_commissions_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;


--
-- Name: organizer_commissions fk_organizer_commissions_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizer_commissions
    ADD CONSTRAINT fk_organizer_commissions_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE RESTRICT;


--
-- Name: organizer_commissions fk_organizer_commissions_payment; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizer_commissions
    ADD CONSTRAINT fk_organizer_commissions_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT;


--
-- Name: organizers fk_organizers_created_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT fk_organizers_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: organizers fk_organizers_updated_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT fk_organizers_updated_by FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: organizers fk_organizers_validated_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT fk_organizers_validated_by FOREIGN KEY (validated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: participant_relationships fk_participant_relationships_participant_a; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participant_relationships
    ADD CONSTRAINT fk_participant_relationships_participant_a FOREIGN KEY (participant_a_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: participant_relationships fk_participant_relationships_participant_b; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participant_relationships
    ADD CONSTRAINT fk_participant_relationships_participant_b FOREIGN KEY (participant_b_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: participant_staff fk_participant_staff_participant_id; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participant_staff
    ADD CONSTRAINT fk_participant_staff_participant_id FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: participants fk_participants_affiliated_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT fk_participants_affiliated_organizer FOREIGN KEY (affiliated_organizer_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: payment_attempts fk_payment_attempts_payment; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_attempts
    ADD CONSTRAINT fk_payment_attempts_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: payment_webhooks fk_payment_webhooks_payment; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_webhooks
    ADD CONSTRAINT fk_payment_webhooks_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;


--
-- Name: payments fk_payments_method; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_method FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE RESTRICT;


--
-- Name: payments fk_payments_order; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;


--
-- Name: payments fk_payments_primary_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_primary_organizer FOREIGN KEY (primary_organizer_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: persistent_tokens fk_persistent_tokens_revoked_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.persistent_tokens
    ADD CONSTRAINT fk_persistent_tokens_revoked_by FOREIGN KEY (revoked_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: persistent_tokens fk_persistent_tokens_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.persistent_tokens
    ADD CONSTRAINT fk_persistent_tokens_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pricing_rules fk_pricing_rules_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT fk_pricing_rules_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE CASCADE;


--
-- Name: refunds fk_refunds_approved_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_refunds_approved_by FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: refunds fk_refunds_order; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_refunds_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;


--
-- Name: refunds fk_refunds_payment; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT;


--
-- Name: refunds fk_refunds_requested_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_refunds_requested_by FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: seats fk_seats_zone; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT fk_seats_zone FOREIGN KEY (zone_id) REFERENCES public.venue_zones(id) ON DELETE CASCADE;


--
-- Name: security_events fk_security_events_target_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT fk_security_events_target_user FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: subscription_plan_event_groups fk_subscription_plan_event_groups_group; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_event_groups
    ADD CONSTRAINT fk_subscription_plan_event_groups_group FOREIGN KEY (event_group_id) REFERENCES public.event_groups(id) ON DELETE CASCADE;


--
-- Name: subscription_plan_event_groups fk_subscription_plan_event_groups_plan; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_event_groups
    ADD CONSTRAINT fk_subscription_plan_event_groups_plan FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;


--
-- Name: subscription_plan_events fk_subscription_plan_events_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_events
    ADD CONSTRAINT fk_subscription_plan_events_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: subscription_plan_events fk_subscription_plan_events_plan; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_events
    ADD CONSTRAINT fk_subscription_plan_events_plan FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;


--
-- Name: subscription_plan_zones fk_subscription_plan_zones_plan; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_zones
    ADD CONSTRAINT fk_subscription_plan_zones_plan FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;


--
-- Name: subscription_plan_zones fk_subscription_plan_zones_zone; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plan_zones
    ADD CONSTRAINT fk_subscription_plan_zones_zone FOREIGN KEY (zone_id) REFERENCES public.venue_zones(id) ON DELETE CASCADE;


--
-- Name: subscription_plans fk_subscription_plans_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT fk_subscription_plans_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE RESTRICT;


--
-- Name: subscriptions fk_subscriptions_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_subscriptions_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: subscriptions fk_subscriptions_plan; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE RESTRICT;


--
-- Name: subscriptions fk_subscriptions_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: ticket_types fk_ticket_types_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.ticket_types
    ADD CONSTRAINT fk_ticket_types_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: tickets fk_tickets_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;


--
-- Name: tickets fk_tickets_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: tickets fk_tickets_seat; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_seat FOREIGN KEY (seat_id) REFERENCES public.seats(id) ON DELETE SET NULL;


--
-- Name: tickets fk_tickets_type; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_type FOREIGN KEY (ticket_type_id) REFERENCES public.ticket_types(id) ON DELETE RESTRICT;


--
-- Name: tickets fk_tickets_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: tickets fk_tickets_zone; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_zone FOREIGN KEY (zone_id) REFERENCES public.venue_zones(id) ON DELETE SET NULL;


--
-- Name: user_groups fk_user_groups_added_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT fk_user_groups_added_by FOREIGN KEY (added_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_groups fk_user_groups_group_id; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT fk_user_groups_group_id FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: user_groups fk_user_groups_user_id; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT fk_user_groups_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_mfa_settings fk_user_mfa_settings_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT fk_user_mfa_settings_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles fk_user_profiles_favorite_team; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT fk_user_profiles_favorite_team FOREIGN KEY (favorite_team_id) REFERENCES public.participants(id) ON DELETE SET NULL;


--
-- Name: user_profiles fk_user_profiles_user_id; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_user_roles_assigned_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_roles fk_user_roles_role_id; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_user_roles_user_id; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions fk_user_sessions_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_trusted_devices fk_user_trusted_devices_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_trusted_devices
    ADD CONSTRAINT fk_user_trusted_devices_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: validation_tokens fk_validation_tokens_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.validation_tokens
    ADD CONSTRAINT fk_validation_tokens_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: venue_amenities fk_venue_amenities_mapping; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_amenities
    ADD CONSTRAINT fk_venue_amenities_mapping FOREIGN KEY (mapping_id) REFERENCES public.venue_mappings(id) ON DELETE CASCADE;


--
-- Name: venue_amenities fk_venue_amenities_zone; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_amenities
    ADD CONSTRAINT fk_venue_amenities_zone FOREIGN KEY (zone_id) REFERENCES public.venue_zones(id) ON DELETE CASCADE;


--
-- Name: venue_mappings fk_venue_mappings_venue; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_mappings
    ADD CONSTRAINT fk_venue_mappings_venue FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: venue_media fk_venue_media_mapping; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_media
    ADD CONSTRAINT fk_venue_media_mapping FOREIGN KEY (mapping_id) REFERENCES public.venue_mappings(id) ON DELETE CASCADE;


--
-- Name: venue_media fk_venue_media_seat; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_media
    ADD CONSTRAINT fk_venue_media_seat FOREIGN KEY (seat_id) REFERENCES public.seats(id) ON DELETE CASCADE;


--
-- Name: venue_media fk_venue_media_venue; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_media
    ADD CONSTRAINT fk_venue_media_venue FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: venue_media fk_venue_media_zone; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_media
    ADD CONSTRAINT fk_venue_media_zone FOREIGN KEY (zone_id) REFERENCES public.venue_zones(id) ON DELETE CASCADE;


--
-- Name: venue_organizer_relations fk_venue_organizer_created_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_organizer_relations
    ADD CONSTRAINT fk_venue_organizer_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: venue_organizer_relations fk_venue_organizer_organizer; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_organizer_relations
    ADD CONSTRAINT fk_venue_organizer_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE CASCADE;


--
-- Name: venue_organizer_relations fk_venue_organizer_venue; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_organizer_relations
    ADD CONSTRAINT fk_venue_organizer_venue FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: venue_zones fk_venue_zones_mapping; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_zones
    ADD CONSTRAINT fk_venue_zones_mapping FOREIGN KEY (mapping_id) REFERENCES public.venue_mappings(id) ON DELETE CASCADE;


--
-- Name: venue_zones fk_venue_zones_parent; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venue_zones
    ADD CONSTRAINT fk_venue_zones_parent FOREIGN KEY (parent_zone_id) REFERENCES public.venue_zones(id) ON DELETE CASCADE;


--
-- Name: venues fk_venues_default_mapping; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT fk_venues_default_mapping FOREIGN KEY (default_mapping_id) REFERENCES public.venue_mappings(id) ON DELETE SET NULL;


--
-- Name: venues fk_venues_primary_manager; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT fk_venues_primary_manager FOREIGN KEY (primary_manager_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: venues fk_venues_primary_owner; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT fk_venues_primary_owner FOREIGN KEY (primary_owner_id) REFERENCES public.organizers(id) ON DELETE SET NULL;


--
-- Name: zone_mapping_overrides fk_zone_mapping_overrides_event; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.zone_mapping_overrides
    ADD CONSTRAINT fk_zone_mapping_overrides_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: zone_mapping_overrides fk_zone_mapping_overrides_zone; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.zone_mapping_overrides
    ADD CONSTRAINT fk_zone_mapping_overrides_zone FOREIGN KEY (zone_id) REFERENCES public.venue_zones(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

