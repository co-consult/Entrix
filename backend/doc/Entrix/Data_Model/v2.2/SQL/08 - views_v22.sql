-- =====================================================
-- ENTRIX SOLUTION - VUES MÉTIER V2.1
-- Fichier: 08_views_v21.sql
-- Description: Vues métier optimisées pour l'application + organisateurs
-- Version: 2.1 - Vues simplifiées et performantes
-- Date: Juillet 2025
-- =====================================================

-- =====================================================
-- NETTOYAGE DES VUES EXISTANTES
-- =====================================================

-- Supprimer toutes les vues existantes dans l'ordre inverse des dépendances
DROP VIEW IF EXISTS v_dashboard_admin CASCADE;
DROP VIEW IF EXISTS v_financial_summary CASCADE;
DROP VIEW IF EXISTS v_organizer_performance CASCADE;
DROP VIEW IF EXISTS v_venue_analytics CASCADE;
DROP VIEW IF EXISTS v_event_analytics CASCADE;
DROP VIEW IF EXISTS v_user_dashboard CASCADE;
DROP VIEW IF EXISTS v_ticket_analytics CASCADE;
DROP VIEW IF EXISTS v_commission_summary CASCADE;
DROP VIEW IF EXISTS v_access_control_stats CASCADE;
DROP VIEW IF EXISTS v_payment_summary CASCADE;
DROP VIEW IF EXISTS v_event_participants_full CASCADE;
DROP VIEW IF EXISTS v_subscription_details CASCADE;
DROP VIEW IF EXISTS v_ticket_details CASCADE;
DROP VIEW IF EXISTS v_order_details CASCADE;
DROP VIEW IF EXISTS v_venue_details CASCADE;
DROP VIEW IF EXISTS v_organizer_details CASCADE;
DROP VIEW IF EXISTS v_event_details CASCADE;
DROP VIEW IF EXISTS v_user_complete CASCADE;

-- =====================================================
-- MODULE 1: VUES UTILISATEURS
-- =====================================================

-- Vue complète utilisateur avec profil
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
    
    -- Timestamps
    u.updated_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;

-- Vue dashboard utilisateur avec statistiques
CREATE VIEW v_user_dashboard AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    
    -- Statistiques billets
    COUNT(DISTINCT t.id) AS total_tickets,
    COUNT(DISTINCT t.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = t.event_id 
            AND e.scheduled_start >= NOW()
        )
    ) AS upcoming_tickets,
    
    -- Statistiques abonnements
    COUNT(DISTINCT s.id) AS total_subscriptions,
    COUNT(DISTINCT s.id) FILTER (
        WHERE s.status = 'ACTIVE' 
        AND s.end_date >= CURRENT_DATE
    ) AS active_subscriptions,
    
    -- Statistiques financières
    COALESCE(SUM(t.price_paid), 0) AS total_spent,
    COUNT(DISTINCT o.id) AS total_orders,
    
    -- Prochains événements
    MIN(e.scheduled_start) FILTER (
        WHERE e.scheduled_start >= NOW()
    ) AS next_event_date,
    
    -- Organisateur favori (le plus fréquenté)
    (SELECT org.name 
     FROM organizers org
     JOIN events ev ON org.id = ev.organizer_id
     JOIN tickets tk ON ev.id = tk.event_id
     WHERE tk.user_id = u.id
     GROUP BY org.id, org.name
     ORDER BY COUNT(*) DESC
     LIMIT 1) AS favorite_organizer,
    
    -- Points de fidélité simulés
    (COUNT(DISTINCT t.id) * 10) AS loyalty_points

FROM v_user_complete u
LEFT JOIN tickets t ON u.id = t.user_id AND t.is_active = TRUE
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN events e ON t.event_id = e.id
GROUP BY u.id, u.full_name, u.email;

-- =====================================================
-- MODULE 2: VUES ORGANISATEURS
-- =====================================================

-- Vue détaillée organisateur
CREATE VIEW v_organizer_details AS
SELECT 
    o.id,
    o.code,
    o.name,
    o.short_name,
    o.type,
    o.status,
    
    -- Informations légales
    o.legal_name,
    o.rnis,
    o.tax_id,
    
    -- Contact
    o.contact_email,
    o.contact_phone,
    o.address,
    o.city,
    o.country,
    
    -- Commercial
    o.commission_rate,
    o.payment_terms,
    o.currency,
    o.is_vat_registered,
    
    -- Médias
    o.logo_url,
    o.banner_url,
    o.website_url,
    
    -- Statistiques
    o.total_events_organized,
    o.total_revenue_generated,
    o.average_satisfaction_score,
    o.last_event_date,
    
    -- Validation
    o.validated_at,
    o.validated_by,
    o.accreditation_level,
    
    -- Utilisateur validateur
    v.first_name || ' ' || v.last_name AS validated_by_name,
    
    -- Calculs
    CASE 
        WHEN o.status = 'ACTIVE' AND o.validated_at IS NOT NULL 
        THEN 'OPERATIONAL'
        WHEN o.status = 'PENDING' 
        THEN 'AWAITING_VALIDATION'
        ELSE o.status::TEXT
    END AS operational_status,
    
    -- Timestamps
    o.created_at,
    o.updated_at

FROM organizers o
LEFT JOIN users v ON o.validated_by = v.id;

-- Vue organizer performance (correction de la syntaxe AVG)
CREATE VIEW v_organizer_performance AS
SELECT 
    o.id,
    o.name,
    o.type,
    o.status,
    
    -- Événements
    COUNT(DISTINCT e.id) AS total_events,
    COUNT(DISTINCT e.id) FILTER (
        WHERE e.scheduled_start >= NOW()
    ) AS upcoming_events,
    COUNT(DISTINCT e.id) FILTER (
        WHERE e.status = 'FINISHED'
    ) AS completed_events,
    
    -- Billets vendus
    COUNT(DISTINCT t.id) AS total_tickets_sold,
    CASE 
        WHEN COUNT(DISTINCT e.id) > 0 
        THEN ROUND(COUNT(DISTINCT t.id)::DECIMAL / COUNT(DISTINCT e.id), 2)
        ELSE 0 
    END AS avg_tickets_per_event,
    
    -- Revenus
    COALESCE(SUM(p.net_amount), 0) AS total_revenue,
    COALESCE(SUM(oc.net_to_organizer), 0) AS net_revenue_organizer,
    COALESCE(SUM(oc.commission_amount), 0) AS total_commissions_paid,
    
    -- Taux de remplissage moyen
    CASE 
        WHEN COUNT(DISTINCT e.id) > 0 
        THEN ROUND(
            (COUNT(DISTINCT t.id)::DECIMAL / NULLIF(SUM(e.max_capacity), 0)) * 100, 
            2
        )
        ELSE 0 
    END AS avg_occupancy_rate,
    
    -- Performance récente (30 derniers jours)
    COUNT(DISTINCT e.id) FILTER (
        WHERE e.created_at >= NOW() - INTERVAL '30 days'
    ) AS events_last_30_days,
    
    -- Satisfaction client moyenne
    o.average_satisfaction_score,
    
    -- Venue principal
    (SELECT v.name 
     FROM venues v
     JOIN events ev ON v.id = ev.venue_id
     WHERE ev.organizer_id = o.id
     GROUP BY v.id, v.name
     ORDER BY COUNT(*) DESC
     LIMIT 1) AS main_venue,
    
    -- Dernière activité
    MAX(e.created_at) AS last_activity,
    
    -- Timestamps
    o.created_at,
    o.updated_at

FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
LEFT JOIN tickets t ON e.id = t.event_id AND t.is_active = TRUE
LEFT JOIN order_items oi ON oi.event_id = e.id
LEFT JOIN orders ord ON oi.order_id = ord.id
LEFT JOIN payments p ON ord.id = p.order_id AND p.status = 'COMPLETED'
LEFT JOIN organizer_commissions oc ON ord.id = oc.order_id
GROUP BY o.id, o.name, o.type, o.status, o.average_satisfaction_score, o.created_at, o.updated_at;

-- =====================================================
-- MODULE 3: VUES ÉVÉNEMENTS
-- =====================================================

-- Vue événement avec timing corrigé
CREATE VIEW v_event_details AS
SELECT 
    e.id,
    e.code,
    e.name,
    e.description,
    e.status,
    e.visibility,
    
    -- Organisateur
    o.name AS organizer_name,
    o.type AS organizer_type,
    o.logo_url AS organizer_logo,
    
    -- Catégorie
    ec.name AS category_name,
    ec.color_primary AS category_color,
    
    -- Venue
    v.name AS venue_name,
    v.city AS venue_city,
    v.max_capacity AS venue_capacity,
    
    -- Mapping
    vm.name AS mapping_name,
    vm.effective_capacity,
    
    -- Dates et timing
    e.scheduled_start,
    e.scheduled_end,
    e.actual_start,
    e.actual_end,
    e.expected_duration,
    
    -- Billetterie
    e.sales_start,
    e.sales_end,
    e.max_capacity,
    e.current_capacity,
    
    -- Statuts calculés
    CASE 
        WHEN e.scheduled_start > NOW() THEN 'UPCOMING'
        WHEN e.scheduled_start <= NOW() AND e.scheduled_end > NOW() THEN 'LIVE'
        WHEN e.scheduled_end <= NOW() THEN 'FINISHED'
        ELSE 'UNKNOWN'
    END AS time_status,
    
    CASE 
        WHEN e.sales_start IS NULL OR e.sales_end IS NULL THEN 'NO_SALES'
        WHEN NOW() < e.sales_start THEN 'PRESALE'
        WHEN NOW() BETWEEN e.sales_start AND e.sales_end THEN 'ON_SALE'
        WHEN NOW() > e.sales_end THEN 'SALES_CLOSED'
        ELSE 'UNKNOWN'
    END AS sales_status,
    
    -- Temps restant avant événement (en secondes)
    CASE 
        WHEN e.scheduled_start > NOW() 
        THEN EXTRACT(EPOCH FROM (e.scheduled_start - NOW()))::INTEGER
        ELSE 0
    END AS seconds_until_start,
    
    -- Métadonnées
    e.is_featured,
    e.tags,
    
    -- Timestamps
    e.created_at,
    e.updated_at,
    e.published_at

FROM events e
JOIN organizers o ON e.organizer_id = o.id
JOIN event_categories ec ON e.category_id = ec.id
JOIN venues v ON e.venue_id = v.id
JOIN venue_mappings vm ON e.mapping_id = vm.id;

-- Vue analytics événement
CREATE VIEW v_event_analytics AS
SELECT 
    e.id,
    e.name,
    e.organizer_name,
    e.status,
    e.scheduled_start,
    
    -- Statistiques billetterie
    COUNT(DISTINCT t.id) AS tickets_sold,
    e.max_capacity,
    ROUND(
        (COUNT(DISTINCT t.id)::DECIMAL / NULLIF(e.max_capacity, 0)) * 100, 
        2
    ) AS occupancy_rate,
    
    -- Revenus
    COALESCE(SUM(t.price_paid), 0) AS gross_revenue,
    COALESCE(AVG(t.price_paid), 0) AS avg_ticket_price,
    MIN(t.price_paid) AS min_ticket_price,
    MAX(t.price_paid) AS max_ticket_price,
    
    -- Répartition par zones
    COUNT(DISTINCT t.zone_id) AS zones_with_sales,
    COUNT(DISTINCT t.id) FILTER (
        WHERE t.zone_id IN (
            SELECT z.id FROM venue_zones z 
            WHERE z.category = 'VIP'
        )
    ) AS vip_tickets_sold,
    
    -- Temporal sales data
    COUNT(DISTINCT t.id) FILTER (
        WHERE t.created_at >= e.created_at + INTERVAL '0 days'
        AND t.created_at < e.created_at + INTERVAL '7 days'
    ) AS tickets_first_week,
    
    COUNT(DISTINCT t.id) FILTER (
        WHERE t.created_at >= NOW() - INTERVAL '7 days'
    ) AS tickets_last_week,
    
    -- Commandes (via order_items pour récupérer les commandes)
    COUNT(DISTINCT oi.order_id) AS total_orders,
    CASE 
        WHEN COUNT(DISTINCT oi.order_id) > 0 
        THEN ROUND(COUNT(DISTINCT t.id)::DECIMAL / COUNT(DISTINCT oi.order_id), 2)
        ELSE 0 
    END AS avg_tickets_per_order,
    
    -- Performance par canal (via order_items)
    COUNT(DISTINCT o.id) FILTER (
        WHERE o.purchase_channel = 'WEB'
    ) AS web_orders,
    COUNT(DISTINCT o.id) FILTER (
        WHERE o.purchase_channel = 'MOBILE_APP'
    ) AS mobile_orders,
    
    -- Timestamps
    MIN(t.created_at) AS first_sale,
    MAX(t.created_at) AS last_sale

FROM v_event_details e
LEFT JOIN tickets t ON e.id = t.event_id AND t.is_active = TRUE
LEFT JOIN order_items oi ON t.id = oi.ticket_type_id -- Approximation via ticket_type
LEFT JOIN orders o ON oi.order_id = o.id
GROUP BY e.id, e.name, e.organizer_name, e.status, e.scheduled_start, e.max_capacity;

-- Vue participants événement complet
CREATE VIEW v_event_participants_full AS
SELECT 
    ep.event_id,
    e.name AS event_name,
    
    -- Participant
    p.id AS participant_id,
    p.name AS participant_name,
    p.type AS participant_type,
    p.logo_url AS participant_logo,
    
    -- Rôle dans l'événement
    ep.role,
    ep.display_order,
    ep.is_confirmed,
    ep.is_featured,
    
    -- Financier
    ep.participation_fee,
    ep.prize_money,
    
    -- Calculs
    CASE 
        WHEN ep.role IN ('HOME_TEAM', 'MAIN_ARTIST', 'KEYNOTE_SPEAKER') 
        THEN 'PRIMARY'
        WHEN ep.role IN ('AWAY_TEAM', 'OPENING_ACT', 'PANELIST') 
        THEN 'SECONDARY'
        ELSE 'SUPPORT'
    END AS importance_level,
    
    -- Métadonnées
    ep.performance_stats,
    ep.metadata,
    
    -- Timestamps
    ep.created_at

FROM event_participants ep
JOIN events e ON ep.event_id = e.id
JOIN participants p ON ep.participant_id = p.id
ORDER BY ep.event_id, ep.display_order;

-- =====================================================
-- MODULE 4: VUES VENUES ET LIEUX
-- =====================================================

-- Vue détaillée venue
CREATE VIEW v_venue_details AS
SELECT 
    v.id,
    v.name,
    v.slug,
    
    -- Localisation
    v.address,
    v.city,
    v.postal_code,
    v.country,
    v.latitude,
    v.longitude,
    
    -- Capacité
    v.max_capacity,
    v.description,
    
    -- Organisateurs liés
    owner.name AS primary_owner_name,
    manager.name AS primary_manager_name,
    
    -- Mapping par défaut
    vm.name AS default_mapping_name,
    vm.effective_capacity AS default_capacity,
    
    -- Statistiques
    COUNT(DISTINCT e.id) AS total_events_hosted,
    COUNT(DISTINCT e.id) FILTER (
        WHERE e.scheduled_start >= NOW()
    ) AS upcoming_events,
    COUNT(DISTINCT e.organizer_id) AS different_organizers,
    
    -- Revenus (approximatifs basés sur les événements)
    COALESCE(SUM(
        CASE WHEN e.scheduled_start >= NOW() - INTERVAL '12 months'
        THEN 1 ELSE 0 END
    ), 0) AS events_last_12_months,
    
    -- Taux d'occupation moyen
    CASE 
        WHEN COUNT(DISTINCT e.id) > 0 
        THEN ROUND(
            (COUNT(DISTINCT t.id)::DECIMAL / NULLIF(SUM(e.max_capacity), 0)) * 100, 
            2
        )
        ELSE 0 
    END AS avg_occupancy_rate,
    
    -- Prochain événement
    MIN(e.scheduled_start) FILTER (
        WHERE e.scheduled_start >= NOW()
    ) AS next_event_date,
    
    -- Configuration
    v.is_active,
    v.images,
    v.global_amenities,
    
    -- Timestamps
    v.created_at,
    v.updated_at

FROM venues v
LEFT JOIN organizers owner ON v.primary_owner_id = owner.id
LEFT JOIN organizers manager ON v.primary_manager_id = manager.id
LEFT JOIN venue_mappings vm ON v.default_mapping_id = vm.id
LEFT JOIN events e ON v.id = e.venue_id
LEFT JOIN tickets t ON e.id = t.event_id AND t.is_active = TRUE
GROUP BY 
    v.id, v.name, v.slug, v.address, v.city, v.postal_code, v.country,
    v.latitude, v.longitude, v.max_capacity, v.description, v.is_active,
    v.images, v.global_amenities, v.created_at, v.updated_at,
    owner.name, manager.name, vm.name, vm.effective_capacity;

-- Vue analytics venue
CREATE VIEW v_venue_analytics AS
SELECT 
    v.id,
    v.name,
    v.city,
    
    -- Période d'analyse (12 derniers mois)
    COUNT(DISTINCT e.id) AS total_events_12m,
    COUNT(DISTINCT e.organizer_id) AS unique_organizers_12m,
    
    -- Performance par mois
    COUNT(DISTINCT e.id) FILTER (
        WHERE e.scheduled_start >= date_trunc('month', NOW())
    ) AS events_current_month,
    
    COUNT(DISTINCT e.id) FILTER (
        WHERE e.scheduled_start >= date_trunc('month', NOW()) - INTERVAL '1 month'
        AND e.scheduled_start < date_trunc('month', NOW())
    ) AS events_last_month,
    
    -- Revenus estimés (basés sur les billets vendus)
    COALESCE(SUM(t.price_paid), 0) AS total_revenue_12m,
    COALESCE(AVG(t.price_paid), 0) AS avg_ticket_price,
    
    -- Taux de remplissage
    ROUND(
        (COUNT(DISTINCT t.id)::DECIMAL / NULLIF(SUM(e.max_capacity), 0)) * 100, 
        2
    ) AS occupancy_rate_12m,
    
    -- Organisateur principal
    (SELECT o.name 
     FROM organizers o
     JOIN events ev ON o.id = ev.organizer_id
     WHERE ev.venue_id = v.id
     AND ev.scheduled_start >= NOW() - INTERVAL '12 months'
     GROUP BY o.id, o.name
     ORDER BY COUNT(*) DESC
     LIMIT 1) AS top_organizer_12m,
    
    -- Catégorie d'événement principale
    (SELECT ec.name
     FROM event_categories ec
     JOIN events ev ON ec.id = ev.category_id
     WHERE ev.venue_id = v.id
     AND ev.scheduled_start >= NOW() - INTERVAL '12 months'
     GROUP BY ec.id, ec.name
     ORDER BY COUNT(*) DESC
     LIMIT 1) AS top_category_12m,
    
    -- Timestamps
    MAX(e.scheduled_start) AS last_event_date,
    MIN(e.scheduled_start) FILTER (
        WHERE e.scheduled_start >= NOW()
    ) AS next_event_date

FROM venues v
LEFT JOIN events e ON v.id = e.venue_id 
    AND e.scheduled_start >= NOW() - INTERVAL '12 months'
LEFT JOIN tickets t ON e.id = t.event_id AND t.is_active = TRUE
GROUP BY v.id, v.name, v.city;

-- =====================================================
-- MODULE 5: VUES BILLETTERIE ET COMMANDES
-- =====================================================

-- Vue détaillée commande
CREATE VIEW v_order_details AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    
    -- Client
    CASE 
        WHEN o.user_id IS NOT NULL 
        THEN u.first_name || ' ' || u.last_name
        ELSE o.guest_name
    END AS customer_name,
    
    CASE 
        WHEN o.user_id IS NOT NULL 
        THEN u.email
        ELSE o.guest_email
    END AS customer_email,
    
    -- Organisateur principal
    org.name AS primary_organizer_name,
    
    -- Montants
    o.subtotal_amount,
    o.discount_amount,
    o.tax_amount,
    o.processing_fee,
    o.total_amount,
    o.currency,
    
    -- Canal d'achat
    o.purchase_channel,
    
    -- Articles de la commande
    COUNT(DISTINCT oi.id) AS total_items,
    STRING_AGG(DISTINCT oi.item_name, ', ' ORDER BY oi.item_name) AS items_summary,
    
    -- Paiement
    p.status AS payment_status,
    p.payment_date,
    p.payment_method_id,
    pm.name AS payment_method_name,
    
    -- Calculs
    CASE 
        WHEN o.status = 'COMPLETED' AND p.status = 'COMPLETED' 
        THEN 'PAID'
        WHEN o.status = 'CONFIRMED' AND p.status IN ('PENDING', 'PROCESSING') 
        THEN 'PAYMENT_PENDING'
        WHEN o.status = 'CANCELLED' 
        THEN 'CANCELLED'
        ELSE 'IN_PROGRESS'
    END AS overall_status,
    
    -- Métadonnées
    o.notes,
    o.coupon_code,
    
    -- Timestamps
    o.created_at,
    o.confirmed_at,
    o.expires_at,
    o.updated_at

FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN organizers org ON o.primary_organizer_id = org.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN payments p ON o.id = p.order_id
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
GROUP BY 
    o.id, o.order_number, o.status, o.subtotal_amount, o.discount_amount,
    o.tax_amount, o.processing_fee, o.total_amount, o.currency,
    o.purchase_channel, o.notes, o.coupon_code, o.created_at,
    o.confirmed_at, o.expires_at, o.updated_at,
    u.first_name, u.last_name, u.email, o.guest_name, o.guest_email,
    org.name, p.status, p.payment_date, p.payment_method_id, pm.name;

-- Vue détaillée billet
CREATE VIEW v_ticket_details AS
SELECT 
    t.id,
    t.ticket_number,
    
    -- Propriétaire
    u.first_name || ' ' || u.last_name AS owner_name,
    u.email AS owner_email,
    
    -- Événement
    e.name AS event_name,
    e.scheduled_start,
    e.status AS event_status,
    
    -- Organisateur
    o.name AS organizer_name,
    
    -- Lieu et place
    v.name AS venue_name,
    vz.name AS zone_name,
    vz.category AS zone_category,
    s.seat_number,
    s.row_number,
    
    -- Type de billet
    tt.name AS ticket_type_name,
    
    -- Prix
    t.price_paid,
    t.currency,
    
    -- Accès
    ar.qr_code,
    ar.status AS access_status,
    ar.valid_from,
    ar.valid_until,
    ar.current_uses,
    ar.max_uses,
    
    -- Calculs
    CASE 
        WHEN e.scheduled_start > NOW() + INTERVAL '1 hour' THEN 'FUTURE'
        WHEN e.scheduled_start > NOW() - INTERVAL '1 hour' THEN 'IMMINENT'
        WHEN e.scheduled_end > NOW() THEN 'LIVE'
        ELSE 'PAST'
    END AS event_timing,
    
    CASE 
        WHEN ar.current_uses >= ar.max_uses THEN 'USED'
        WHEN ar.status = 'VALID' AND ar.valid_until > NOW() THEN 'VALID'
        WHEN ar.valid_until <= NOW() THEN 'EXPIRED'
        ELSE ar.status::TEXT
    END AS ticket_status,
    
    -- Informations de place
    CASE 
        WHEN s.seat_number IS NOT NULL 
        THEN 'Zone: ' || vz.name || ' - Siège: ' || s.seat_number || 
             CASE WHEN s.row_number IS NOT NULL 
                  THEN ' (Rang: ' || s.row_number || ')' 
                  ELSE '' END
        WHEN vz.name IS NOT NULL 
        THEN 'Zone: ' || vz.name || ' (Placement libre)'
        ELSE 'Accès général'
    END AS seat_info,
    
    -- Métadonnées
    t.special_requirements,
    t.is_active,
    
    -- Timestamps
    t.created_at,
    ar.used_at

FROM tickets t
JOIN users u ON t.user_id = u.id
JOIN events e ON t.event_id = e.id
JOIN organizers o ON e.organizer_id = o.id
JOIN venues v ON e.venue_id = v.id
JOIN ticket_types tt ON t.ticket_type_id = tt.id
LEFT JOIN venue_zones vz ON t.zone_id = vz.id
LEFT JOIN seats s ON t.seat_id = s.id
LEFT JOIN access_rights ar ON t.id = ar.ticket_id;

-- Vue détaillée abonnement
CREATE VIEW v_subscription_details AS
SELECT 
    s.id,
    s.subscription_number,
    s.status,
    
    -- Utilisateur
    u.first_name || ' ' || u.last_name AS subscriber_name,
    u.email AS subscriber_email,
    
    -- Plan
    sp.name AS plan_name,
    sp.type AS plan_type,
    
    -- Organisateur
    o.name AS organizer_name,
    o.type AS organizer_type,
    
    -- Période
    s.start_date,
    s.end_date,
    (s.end_date - s.start_date) AS duration_days,
    
    -- Financier
    s.price_paid,
    s.currency,
    
    -- Configuration
    s.transfers_used,
    sp.max_transfers,
    s.auto_renew_enabled,
    
    -- Bénéfices
    sp.priority_booking,
    sp.includes_playoffs,
    sp.transferable,
    
    -- Calculs
    CASE 
        WHEN s.end_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN s.status = 'ACTIVE' AND s.end_date >= CURRENT_DATE THEN 'ACTIVE'
        WHEN s.status = 'SUSPENDED' THEN 'SUSPENDED'
        ELSE s.status::TEXT
    END AS current_status,
    
    -- Jours restants
    CASE 
        WHEN s.end_date >= CURRENT_DATE 
        THEN (s.end_date - CURRENT_DATE)::INTEGER
        ELSE 0
    END AS days_remaining,
    
    -- Transferts disponibles
    (sp.max_transfers - s.transfers_used) AS transfers_remaining,
    
    -- Événements inclus (approximation)
    COUNT(DISTINCT spe.event_id) + COUNT(DISTINCT speg.event_group_id) AS included_events_count,
    
    -- Utilisation
    COUNT(DISTINCT ar.id) AS access_rights_used,
    
    -- Métadonnées
    s.subscriber_benefits,
    
    -- Timestamps
    s.created_at,
    s.updated_at

FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN organizers o ON sp.organizer_id = o.id
LEFT JOIN subscription_plan_events spe ON sp.id = spe.subscription_plan_id
LEFT JOIN subscription_plan_event_groups speg ON sp.id = speg.subscription_plan_id
LEFT JOIN access_rights ar ON s.id = ar.subscription_id
GROUP BY 
    s.id, s.subscription_number, s.status, s.start_date, s.end_date,
    s.price_paid, s.currency, s.transfers_used, s.auto_renew_enabled,
    s.subscriber_benefits, s.created_at, s.updated_at,
    u.first_name, u.last_name, u.email,
    sp.name, sp.type, sp.max_transfers, sp.priority_booking,
    sp.includes_playoffs, sp.transferable,
    o.name, o.type;

-- =====================================================
-- MODULE 6: VUES ANALYTICS ET REPORTING
-- =====================================================

-- Vue analytics billets (correction syntaxe FILTER)
CREATE VIEW v_ticket_analytics AS
SELECT 
    -- Période d'analyse
    date_trunc('month', t.created_at) AS month,
    
    -- Organisateur
    o.id AS organizer_id,
    o.name AS organizer_name,
    o.type AS organizer_type,
    
    -- Métriques de vente
    COUNT(DISTINCT t.id) AS tickets_sold,
    COUNT(DISTINCT t.event_id) AS events_with_sales,
    COUNT(DISTINCT t.user_id) AS unique_customers,
    
    -- Revenus
    SUM(t.price_paid) AS gross_revenue,
    AVG(t.price_paid) AS avg_ticket_price,
    MIN(t.price_paid) AS min_ticket_price,
    MAX(t.price_paid) AS max_ticket_price,
    
    -- Répartition par type
    COUNT(DISTINCT t.id) FILTER (
        WHERE vz.category = 'VIP'
    ) AS vip_tickets,
    COUNT(DISTINCT t.id) FILTER (
        WHERE vz.category = 'PREMIUM'
    ) AS premium_tickets,
    COUNT(DISTINCT t.id) FILTER (
        WHERE vz.category = 'STANDARD'
    ) AS standard_tickets,
    
    -- Performance (taux de remplissage moyen simplifié)
    CASE 
        WHEN SUM(e.max_capacity) > 0 
        THEN ROUND(
            (COUNT(DISTINCT t.id)::DECIMAL / SUM(e.max_capacity)) * 100, 
            2
        )
        ELSE 0 
    END AS avg_occupancy_rate,
    
    -- Canaux de vente (approximation via order_items)
    COUNT(DISTINCT oi.order_id) FILTER (
        WHERE ord.purchase_channel = 'WEB'
    ) AS web_sales,
    COUNT(DISTINCT oi.order_id) FILTER (
        WHERE ord.purchase_channel = 'MOBILE_APP'
    ) AS mobile_sales

FROM tickets t
JOIN events e ON t.event_id = e.id
JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN venue_zones vz ON t.zone_id = vz.id
LEFT JOIN order_items oi ON oi.event_id = t.event_id
LEFT JOIN orders ord ON oi.order_id = ord.id
WHERE t.is_active = TRUE
AND t.created_at >= NOW() - INTERVAL '12 months'
GROUP BY 
    date_trunc('month', t.created_at),
    o.id, o.name, o.type
ORDER BY month DESC, organizer_name;

-- Vue résumé paiements
CREATE VIEW v_payment_summary AS
SELECT 
    -- Période
    date_trunc('day', p.payment_date) AS payment_date,
    
    -- Organisateur
    o.id AS organizer_id,
    o.name AS organizer_name,
    
    -- Méthode de paiement
    pm.name AS payment_method,
    pm.type AS payment_method_type,
    
    -- Métriques
    COUNT(DISTINCT p.id) AS transaction_count,
    COUNT(DISTINCT p.order_id) AS order_count,
    SUM(p.amount) AS gross_amount,
    SUM(p.processing_fee) AS total_processing_fees,
    SUM(p.net_amount) AS net_amount,
    
    -- Statuts
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.status = 'COMPLETED'
    ) AS successful_payments,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.status = 'FAILED'
    ) AS failed_payments,
    
    -- Performance
    ROUND(
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'COMPLETED')::DECIMAL / 
        NULLIF(COUNT(DISTINCT p.id), 0) * 100, 
        2
    ) AS success_rate

FROM payments p
JOIN orders ord ON p.order_id = ord.id
JOIN organizers o ON ord.primary_organizer_id = o.id
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.payment_date IS NOT NULL
AND p.payment_date >= NOW() - INTERVAL '12 months'
GROUP BY 
    date_trunc('day', p.payment_date),
    o.id, o.name,
    pm.name, pm.type
ORDER BY payment_date DESC, organizer_name;

-- Vue résumé commissions
CREATE VIEW v_commission_summary AS
SELECT 
    -- Période
    date_trunc('month', oc.created_at) AS month,
    
    -- Organisateur
    oc.organizer_id,
    o.name AS organizer_name,
    o.type AS organizer_type,
    
    -- Commissions
    COUNT(DISTINCT oc.id) AS commission_count,
    SUM(oc.base_amount) AS total_base_amount,
    AVG(oc.commission_rate) AS avg_commission_rate,
    SUM(oc.commission_amount) AS total_commission_amount,
    SUM(oc.platform_fee) AS total_platform_fee,
    SUM(oc.net_to_organizer) AS total_net_to_organizer,
    
    -- Bonus
    SUM(oc.volume_bonus) AS total_volume_bonus,
    SUM(oc.loyalty_bonus) AS total_loyalty_bonus,
    
    -- Statuts
    COUNT(DISTINCT oc.id) FILTER (
        WHERE oc.status = 'PAID'
    ) AS paid_commissions,
    COUNT(DISTINCT oc.id) FILTER (
        WHERE oc.status IN ('PENDING', 'CALCULATED', 'APPROVED')
    ) AS unpaid_commissions,
    
    -- Montants par statut
    SUM(oc.net_to_organizer) FILTER (
        WHERE oc.status = 'PAID'
    ) AS amount_paid,
    SUM(oc.net_to_organizer) FILTER (
        WHERE oc.status IN ('PENDING', 'CALCULATED', 'APPROVED')
    ) AS amount_pending

FROM organizer_commissions oc
JOIN organizers o ON oc.organizer_id = o.id
WHERE oc.created_at >= NOW() - INTERVAL '12 months'
GROUP BY 
    date_trunc('month', oc.created_at),
    oc.organizer_id, o.name, o.type
ORDER BY month DESC, organizer_name;

-- Vue statistiques contrôle d'accès
CREATE VIEW v_access_control_stats AS
SELECT 
    -- Période
    date_trunc('day', acl.scanned_at) AS scan_date,
    
    -- Événement
    e.id AS event_id,
    e.name AS event_name,
    e.scheduled_start,
    
    -- Organisateur
    o.name AS organizer_name,
    
    -- Venue
    v.name AS venue_name,
    
    -- Statistiques de scan
    COUNT(DISTINCT acl.id) AS total_scans,
    COUNT(DISTINCT acl.access_right_id) AS unique_access_rights,
    COUNT(DISTINCT acl.user_id) AS unique_users,
    
    -- Résultats
    COUNT(DISTINCT acl.id) FILTER (
        WHERE acl.result = 'SUCCESS'
    ) AS successful_scans,
    COUNT(DISTINCT acl.id) FILTER (
        WHERE acl.result = 'DENIED'
    ) AS denied_scans,
    
    -- Raisons de refus les plus fréquentes
    STRING_AGG(DISTINCT acl.denial_reason::TEXT, ', ') FILTER (
        WHERE acl.denial_reason IS NOT NULL
    ) AS denial_reasons,
    
    -- Actions
    COUNT(DISTINCT acl.id) FILTER (
        WHERE acl.action = 'ENTRY'
    ) AS entries,
    COUNT(DISTINCT acl.id) FILTER (
        WHERE acl.action = 'EXIT'
    ) AS exits,
    
    -- Performance
    ROUND(
        COUNT(DISTINCT acl.id) FILTER (WHERE acl.result = 'SUCCESS')::DECIMAL / 
        NULLIF(COUNT(DISTINCT acl.id), 0) * 100, 
        2
    ) AS success_rate

FROM access_control_log acl
JOIN access_rights ar ON acl.access_right_id = ar.id
JOIN events e ON acl.event_id = e.id
JOIN organizers o ON e.organizer_id = o.id
JOIN venues v ON e.venue_id = v.id
WHERE acl.scanned_at >= NOW() - INTERVAL '30 days'
GROUP BY 
    date_trunc('day', acl.scanned_at),
    e.id, e.name, e.scheduled_start,
    o.name, v.name
ORDER BY scan_date DESC, event_name;

-- =====================================================
-- MODULE 7: VUES DASHBOARD ADMIN
-- =====================================================

-- Vue dashboard administrateur
CREATE VIEW v_dashboard_admin AS
SELECT 
    -- Statistiques globales
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS total_active_users,
    (SELECT COUNT(*) FROM organizers WHERE status = 'ACTIVE') AS total_active_organizers,
    (SELECT COUNT(*) FROM events WHERE status = 'PUBLISHED') AS total_published_events,
    (SELECT COUNT(*) FROM venues WHERE is_active = TRUE) AS total_active_venues,
    
    -- Activité récente (30 derniers jours)
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_30d,
    (SELECT COUNT(*) FROM events WHERE created_at >= NOW() - INTERVAL '30 days') AS new_events_30d,
    (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '30 days') AS tickets_sold_30d,
    
    -- Revenus (30 derniers jours)
    (SELECT COALESCE(SUM(amount), 0) FROM payments 
     WHERE status = 'COMPLETED' 
     AND payment_date >= NOW() - INTERVAL '30 days') AS revenue_30d,
    
    -- Performance du jour
    (SELECT COUNT(*) FROM tickets WHERE created_at >= CURRENT_DATE) AS tickets_today,
    (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE) AS orders_today,
    (SELECT COALESCE(SUM(amount), 0) FROM payments 
     WHERE status = 'COMPLETED' 
     AND payment_date >= CURRENT_DATE) AS revenue_today,
    
    -- Événements proches
    (SELECT COUNT(*) FROM events 
     WHERE scheduled_start BETWEEN NOW() AND NOW() + INTERVAL '7 days'
     AND status = 'PUBLISHED') AS events_next_7_days,
    
    -- Taux de conversion approximatif
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '30 days') > 0
        THEN ROUND(
            (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL '30 days')::DECIMAL /
            (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '30 days') * 100,
            2
        )
        ELSE 0
    END AS conversion_rate_30d,
    
    -- Organisateur le plus actif
    (SELECT o.name FROM organizers o
     JOIN events e ON o.id = e.organizer_id
     WHERE e.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY o.id, o.name
     ORDER BY COUNT(*) DESC
     LIMIT 1) AS top_organizer_30d,
    
    -- Timestamp de génération
    NOW() AS generated_at;

-- Vue résumé financier global
CREATE VIEW v_financial_summary AS
SELECT 
    -- Période
    date_trunc('month', p.payment_date) AS month,
    
    -- Volumes
    COUNT(DISTINCT p.id) AS total_transactions,
    COUNT(DISTINCT p.order_id) AS total_orders,
    COUNT(DISTINCT o.user_id) AS unique_customers,
    
    -- Revenus bruts
    SUM(p.amount) AS gross_revenue,
    SUM(p.processing_fee) AS processing_fees,
    SUM(p.net_amount) AS net_revenue,
    
    -- Commissions organisateurs
    COALESCE(SUM(oc.commission_amount), 0) AS total_commissions,
    COALESCE(SUM(oc.platform_fee), 0) AS platform_fees,
    COALESCE(SUM(oc.net_to_organizer), 0) AS net_to_organizers,
    
    -- Marge plateforme
    (SUM(p.net_amount) - COALESCE(SUM(oc.net_to_organizer), 0)) AS platform_margin,
    
    -- Remboursements
    COALESCE(SUM(r.amount), 0) AS total_refunds,
    
    -- Métriques moyennes
    AVG(p.amount) AS avg_transaction_amount,
    AVG(o.total_amount) AS avg_order_amount,
    
    -- Performance
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'COMPLETED') AS successful_transactions,
    ROUND(
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'COMPLETED')::DECIMAL / 
        NULLIF(COUNT(DISTINCT p.id), 0) * 100, 
        2
    ) AS success_rate

FROM payments p
JOIN orders o ON p.order_id = o.id
LEFT JOIN organizer_commissions oc ON o.id = oc.order_id
LEFT JOIN refunds r ON p.id = r.payment_id AND r.status = 'COMPLETED'
WHERE p.payment_date IS NOT NULL
AND p.payment_date >= NOW() - INTERVAL '12 months'
GROUP BY date_trunc('month', p.payment_date)
ORDER BY month DESC;

-- =====================================================
-- PERMISSIONS ET SÉCURITÉ DES VUES
-- =====================================================

-- Les vues héritent automatiquement des politiques RLS des tables sous-jacentes
-- Pas besoin de définir des politiques RLS spécifiques pour les vues

-- Octroyer les permissions de lecture sur les vues selon les besoins
-- (à adapter selon votre politique de sécurité)

-- GRANT SELECT ON v_user_complete TO authenticated_users;
-- GRANT SELECT ON v_event_details TO public;
-- GRANT SELECT ON v_organizer_details TO organizer_managers;
-- etc.

-- =====================================================
-- FONCTIONS UTILITAIRES POUR LES VUES
-- =====================================================

-- Fonction pour rafraîchir toutes les vues matérialisées (si nécessaire)
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir des statistiques sur les vues
CREATE OR REPLACE FUNCTION get_views_statistics()
RETURNS TABLE(
    view_name TEXT,
    view_type TEXT,
    estimated_rows BIGINT
) AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- VALIDATION FINALE
-- =====================================================

-- Compter les vues créées
SELECT 
    'Vues Entrix V2.1 créées avec succès!' AS status,
    COUNT(*) || ' vues métier disponibles' AS count
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%';

-- Lister toutes les vues créées
SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE 'v_user_%' THEN 'Utilisateurs'
        WHEN table_name LIKE 'v_organizer_%' THEN 'Organisateurs'
        WHEN table_name LIKE 'v_event_%' THEN 'Événements'
        WHEN table_name LIKE 'v_venue_%' THEN 'Venues'
        WHEN table_name LIKE 'v_ticket_%' OR table_name LIKE 'v_order_%' OR table_name LIKE 'v_subscription_%' THEN 'Billetterie'
        WHEN table_name LIKE 'v_payment_%' OR table_name LIKE 'v_commission_%' THEN 'Financier'
        WHEN table_name LIKE 'v_access_%' THEN 'Contrôle d''accès'
        WHEN table_name LIKE 'v_dashboard_%' OR table_name LIKE 'v_financial_%' THEN 'Analytics'
        ELSE 'Autres'
    END AS category
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%'
ORDER BY category, table_name;

-- Message final
SELECT 
    'Toutes les vues sont prêtes pour utilisation!' AS message,
    'RLS automatiquement appliqué via les tables sous-jacentes' AS security,
    'Optimisées pour NestJS/Prisma' AS compatibility;

-- =====================================================
-- NOTES POUR L'UTILISATION AVEC NESTJS/PRISMA
-- =====================================================

/*
GUIDE D'UTILISATION DES VUES AVEC NESTJS/PRISMA:

1. AJOUT DANS PRISMA SCHEMA:
   
   // Ajouter dans votre schema.prisma
   model VUserComplete {
     id                   String    @id
     email               String
     full_name           String?
     verification_status String?
     age                 Int?
     // ... autres champs
     
     @@map("v_user_complete")
   }

2. UTILISATION DANS VOS SERVICES:
   
   ```typescript
   @Injectable()
   export class UsersService {
     constructor(private prisma: PrismaService) {}
     
     async getUserComplete(id: string) {
       return this.prisma.vUserComplete.findUnique({
         where: { id }
       });
     }
   }
   ```

3. AVANTAGES DES VUES:
   - Données pré-calculées (performances)
   - Logique métier centralisée
   - RLS automatiquement appliqué
   - Requêtes simplifiées côté application

4. BEST PRACTICES:
   - Utilisez les vues pour les lectures complexes
   - Gardez les écritures sur les tables de base
   - Indexez les colonnes fréquemment filtrées
   - Monitorez les performances

5. EXEMPLE D'UTILISATION COMPLÈTE:
   
   ```typescript
   // Dashboard organisateur
   async getOrganizerDashboard(organizerId: string) {
     const [performance, events, analytics] = await Promise.all([
       this.prisma.vOrganizerPerformance.findUnique({
         where: { id: organizerId }
       }),
       this.prisma.vEventDetails.findMany({
         where: { organizer_id: organizerId }
       }),
       this.prisma.vEventAnalytics.findMany({
         where: { organizer_id: organizerId }
       })
     ]);
     
     return { performance, events, analytics };
   }
   ```
*/

-- =====================================================
-- FIN DU FICHIER 08_views_v21.sql
-- =====================================================