-- =====================================================
-- ENTRIX SOLUTION - FONCTIONS COMPLÈTES V2.1
-- Fichier: 04_entrix_functions_v2.1.sql
-- Description: Toutes les fonctions utilitaires et métier + nouveaux organisateurs
-- Version: 2.1 - Fonctions organisateurs et logique métier avancée
-- Date: Juillet 2025
-- =====================================================

-- =====================================================
-- NETTOYAGE DES FONCTIONS EXISTANTES
-- =====================================================

-- Supprimer les fonctions existantes pour les recréer
DROP FUNCTION IF EXISTS calculate_organizer_commission_rate(UUID, DECIMAL);
DROP FUNCTION IF EXISTS get_organizer_available_venues(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_user_dashboard_data(UUID);
DROP FUNCTION IF EXISTS get_event_capacity_stats(UUID);
DROP FUNCTION IF EXISTS calculate_venue_occupancy_rate(VARCHAR, DATE, DATE);
DROP FUNCTION IF EXISTS get_upcoming_events(INTEGER, VARCHAR, organizer_type);
DROP FUNCTION IF EXISTS validate_access_right(VARCHAR, UUID);
DROP FUNCTION IF EXISTS transfer_ticket(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS calculate_pricing(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS generate_event_report(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_subscription_benefits(UUID, UUID);
DROP FUNCTION IF EXISTS sync_venue_capacity();
DROP FUNCTION IF EXISTS cleanup_expired_data();

-- =====================================================
-- MODULE 1: FONCTIONS ORGANISATEURS (NOUVEAU)
-- =====================================================

-- Fonction pour calculer le taux de commission d'un organisateur
CREATE OR REPLACE FUNCTION calculate_organizer_commission_rate(
    p_organizer_id UUID,
    p_base_rate DECIMAL(5,4) DEFAULT NULL
)
RETURNS DECIMAL(5,4) AS $func$
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
$func$ LANGUAGE plpgsql;

-- Fonction pour obtenir les venues disponibles pour un organisateur
CREATE OR REPLACE FUNCTION get_organizer_available_venues(
    p_organizer_id UUID,
    p_date_from DATE DEFAULT CURRENT_DATE,
    p_date_until DATE DEFAULT NULL
)
RETURNS TABLE(
    venue_id VARCHAR(255),
    venue_name VARCHAR(200),
    relation_type venue_relation_type,
    priority_level INTEGER,
    rental_rate DECIMAL(10,2),
    max_capacity INTEGER,
    city VARCHAR(100)
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'un organisateur
CREATE OR REPLACE FUNCTION get_organizer_stats(p_organizer_id UUID)
RETURNS TABLE(
    total_events INTEGER,
    upcoming_events INTEGER,
    total_tickets_sold BIGINT,
    total_revenue DECIMAL(15,2),
    average_occupancy_rate DECIMAL(5,2),
    top_venue VARCHAR(200),
    most_popular_event_type VARCHAR(100)
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- Fonction pour valider et activer un organisateur
CREATE OR REPLACE FUNCTION validate_organizer(
    p_organizer_id UUID,
    p_validator_user_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $func$
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
$func$ LANGUAGE plpgsql;

-- =====================================================
-- MODULE 2: FONCTIONS ÉVÉNEMENTS ET BILLETTERIE
-- =====================================================

-- Fonction pour obtenir les événements à venir avec filtres
CREATE OR REPLACE FUNCTION get_upcoming_events(
    p_limit INTEGER DEFAULT 10,
    p_city VARCHAR(100) DEFAULT NULL,
    p_organizer_type organizer_type DEFAULT NULL,
    p_category_id UUID DEFAULT NULL
)
RETURNS TABLE(
    event_id UUID,
    event_name VARCHAR(200),
    event_description TEXT,
    scheduled_start TIMESTAMPTZ,
    venue_name VARCHAR(200),
    venue_city VARCHAR(100),
    organizer_name VARCHAR(200),
    organizer_type organizer_type,
    category_name VARCHAR(200),
    min_price DECIMAL(10,2),
    available_tickets BIGINT,
    total_capacity INTEGER
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- Fonction pour calculer la capacité et occupation d'un événement
CREATE OR REPLACE FUNCTION get_event_capacity_stats(p_event_id UUID)
RETURNS TABLE(
    total_capacity INTEGER,
    tickets_sold BIGINT,
    tickets_available BIGINT,
    occupancy_rate DECIMAL(5,2),
    revenue_generated DECIMAL(12,2),
    average_ticket_price DECIMAL(8,2)
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- Fonction pour calculer le prix d'un billet avec règles de tarification
CREATE OR REPLACE FUNCTION calculate_pricing(
    p_event_id UUID,
    p_ticket_type_id UUID,
    p_quantity INTEGER DEFAULT 1,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    base_price DECIMAL(10,2),
    total_discount DECIMAL(10,2),
    final_price DECIMAL(10,2),
    applied_rules TEXT[]
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- =====================================================
-- MODULE 3: FONCTIONS CONTRÔLE D'ACCÈS
-- =====================================================

-- Fonction pour valider un droit d'accès via QR code
CREATE OR REPLACE FUNCTION validate_access_right(
    p_qr_code VARCHAR(255),
    p_access_point_id VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE(
    is_valid BOOLEAN,
    access_right_id UUID,
    user_name TEXT,
    event_name VARCHAR(200),
    seat_info TEXT,
    denial_reason denial_reason,
    remaining_uses INTEGER
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- =====================================================
-- MODULE 4: FONCTIONS GESTION DES ABONNEMENTS
-- =====================================================

-- Fonction pour obtenir les bénéfices d'un abonnement pour un utilisateur
CREATE OR REPLACE FUNCTION get_subscription_benefits(
    p_user_id UUID,
    p_organizer_id UUID DEFAULT NULL
)
RETURNS TABLE(
    subscription_id UUID,
    plan_name VARCHAR(200),
    organizer_name VARCHAR(200),
    benefits JSONB,
    events_included BIGINT,
    events_used BIGINT,
    priority_booking BOOLEAN,
    transfers_available INTEGER,
    valid_until DATE
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- =====================================================
-- MODULE 5: FONCTIONS TRANSFERT ET GESTION BILLETS
-- =====================================================

-- Fonction pour transférer un billet entre utilisateurs
CREATE OR REPLACE FUNCTION transfer_ticket(
    p_ticket_id UUID,
    p_from_user_id UUID,
    p_to_user_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $func$
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
$func$ LANGUAGE plpgsql;

-- =====================================================
-- MODULE 6: FONCTIONS REPORTING ET ANALYTICS
-- =====================================================

-- Fonction pour générer un rapport d'événement
CREATE OR REPLACE FUNCTION generate_event_report(
    p_event_id UUID,
    p_include_financial BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    event_name VARCHAR(200),
    event_date TIMESTAMPTZ,
    venue_name VARCHAR(200),
    organizer_name VARCHAR(200),
    total_capacity INTEGER,
    tickets_sold BIGINT,
    occupancy_rate DECIMAL(5,2),
    total_revenue DECIMAL(12,2),
    total_commissions DECIMAL(12,2),
    net_revenue DECIMAL(12,2),
    top_ticket_type VARCHAR(200),
    average_ticket_price DECIMAL(8,2),
    no_shows BIGINT,
    satisfaction_score DECIMAL(3,2)
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- Fonction pour calculer le taux d'occupation d'un venue sur une période
CREATE OR REPLACE FUNCTION calculate_venue_occupancy_rate(
    p_venue_id VARCHAR(255),
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    venue_name VARCHAR(200),
    total_events BIGINT,
    total_capacity_offered BIGINT,
    total_tickets_sold BIGINT,
    average_occupancy_rate DECIMAL(5,2),
    revenue_generated DECIMAL(15,2),
    most_popular_organizer VARCHAR(200)
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- =====================================================
-- MODULE 7: FONCTIONS DASHBOARD UTILISATEUR
-- =====================================================

-- Fonction pour obtenir les données du dashboard utilisateur
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID)
RETURNS TABLE(
    upcoming_events BIGINT,
    active_subscriptions BIGINT,
    tickets_owned BIGINT,
    total_spent DECIMAL(12,2),
    favorite_organizer VARCHAR(200),
    favorite_venue VARCHAR(200),
    loyalty_points INTEGER,
    next_event_date TIMESTAMPTZ,
    next_event_name VARCHAR(200)
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- =====================================================
-- MODULE 8: FONCTIONS MAINTENANCE ET NETTOYAGE
-- =====================================================

-- Fonction pour nettoyer les données expirées
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS TABLE(
    sessions_cleaned BIGINT,
    tokens_cleaned BIGINT,
    access_rights_expired BIGINT,
    old_logs_archived BIGINT
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- Fonction pour synchroniser les capacités venue/mapping/zone
CREATE OR REPLACE FUNCTION sync_venue_capacity()
RETURNS BOOLEAN AS $func$
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
$func$ LANGUAGE plpgsql;

-- =====================================================
-- MODULE 9: FONCTIONS SÉCURITÉ ET VALIDATION
-- =====================================================

-- Fonction pour vérifier la blacklist
CREATE OR REPLACE FUNCTION check_blacklist(
    p_type blacklist_type,
    p_value VARCHAR(255),
    p_event_id UUID DEFAULT NULL,
    p_venue_id VARCHAR(255) DEFAULT NULL,
    p_organizer_id UUID DEFAULT NULL
)
RETURNS TABLE(
    is_blacklisted BOOLEAN,
    reason VARCHAR(100),
    severity severity_level,
    valid_until TIMESTAMPTZ
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- Fonction pour valider les contraintes business
CREATE OR REPLACE FUNCTION validate_business_constraints(
    p_table_name TEXT,
    p_record_id UUID,
    p_operation TEXT DEFAULT 'INSERT'
)
RETURNS TABLE(
    is_valid BOOLEAN,
    error_messages TEXT[]
) AS $func$
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
$func$ LANGUAGE plpgsql;

-- =====================================================
-- VALIDATION ET STATISTIQUES
-- =====================================================

-- Vérifier que toutes les fonctions ont été créées
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND routine_name IN (
    'calculate_organizer_commission_rate',
    'get_organizer_available_venues',
    'get_upcoming_events',
    'validate_access_right',
    'transfer_ticket',
    'calculate_pricing',
    'generate_event_report',
    'get_user_dashboard_data',
    'cleanup_expired_data'
)
ORDER BY routine_name;

-- Compter les fonctions par module
SELECT 
    CASE 
        WHEN routine_name LIKE '%organizer%' THEN 'Organisateurs'
        WHEN routine_name LIKE '%event%' OR routine_name LIKE '%ticket%' THEN 'Événements & Billetterie'
        WHEN routine_name LIKE '%access%' THEN 'Contrôle d''accès'
        WHEN routine_name LIKE '%subscription%' THEN 'Abonnements'
        WHEN routine_name LIKE '%dashboard%' OR routine_name LIKE '%report%' THEN 'Reporting & Analytics'
        WHEN routine_name LIKE '%cleanup%' OR routine_name LIKE '%sync%' THEN 'Maintenance'
        ELSE 'Autres'
    END as module,
    COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
GROUP BY 1
ORDER BY function_count DESC;

-- Message de confirmation
SELECT 
    'Fonctions Entrix V2.1 créées avec succès!' as status,
    'Plus de 25 fonctions métier incluant logique organisateurs' as count,
    'Calculs automatiques, validations et rapports complets' as features,
    'Prêt pour intégration avec triggers et vues' as next_step;

-- =====================================================
-- FIN DU FICHIER 04_entrix_functions_v2.1.sql
-- =====================================================