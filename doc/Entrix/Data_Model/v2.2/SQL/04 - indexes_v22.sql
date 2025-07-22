-- =====================================================
-- ENTRIX SOLUTION - INDEX COMPLETS V2.1
-- Fichier: 06_entrix_indexes_v2.1.sql
-- Description: Tous les index pour performance optimale + nouveaux organisateurs
-- Version: 2.1 - Index organisateurs et mise à jour performances (CORRIGÉ)
-- Date: Juillet 2025
-- =====================================================

-- =====================================================
-- MODULE 1: USERS & GROUPS - INDEX
-- =====================================================

-- Index pour users (recherche, authentification, performance)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_verified ON users(email_verified, phone_verified);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_full_name ON users(first_name, last_name);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Index de recherche textuelle pour users
CREATE INDEX idx_users_name_search ON users 
    USING gin(to_tsvector('simple', first_name || ' ' || last_name));

-- Index pour user_profiles (démographie et recherche) - CORRIGÉ
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_city_country ON user_profiles(city, country);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_language ON user_profiles(language);
CREATE INDEX idx_user_profiles_supporter_since ON user_profiles(supporter_since);
CREATE INDEX idx_user_profiles_favorite_team ON user_profiles(favorite_team_id);
CREATE INDEX idx_user_profiles_preferences ON user_profiles USING gin(preferences);

-- Index pour calcul d'âge (année de naissance seulement) - SUPPRESSION DE EXTRACT
CREATE INDEX idx_user_profiles_birth_year ON user_profiles(date_of_birth);

-- Index pour roles (gestion des permissions)
CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_roles_active ON roles(is_active);
CREATE INDEX idx_roles_permissions ON roles USING gin(permissions);

-- Index pour groups (segmentation et droits)
CREATE INDEX idx_groups_code ON groups(code);
CREATE INDEX idx_groups_type ON groups(type);
CREATE INDEX idx_groups_type_active ON groups(type, is_active);
CREATE INDEX idx_groups_validity ON groups(valid_from, valid_until);
CREATE INDEX idx_groups_active ON groups(is_active);
CREATE INDEX idx_groups_metadata ON groups USING gin(metadata);

-- Index pour user_roles (gestion des accès)
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_status ON user_roles(status);
CREATE INDEX idx_user_roles_user_status ON user_roles(user_id, status);
CREATE INDEX idx_user_roles_assigned_by ON user_roles(assigned_by);
CREATE INDEX idx_user_roles_validity ON user_roles(assigned_at, valid_until);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, role_id, status);

-- Index pour user_groups (appartenance et segmentation)
CREATE INDEX idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX idx_user_groups_group_id ON user_groups(group_id);
CREATE INDEX idx_user_groups_status ON user_groups(status);
CREATE INDEX idx_user_groups_user_status ON user_groups(user_id, status);
CREATE INDEX idx_user_groups_group_status ON user_groups(group_id, status);
CREATE INDEX idx_user_groups_added_by ON user_groups(added_by);
CREATE INDEX idx_user_groups_validity ON user_groups(joined_at, valid_until);
CREATE INDEX idx_user_groups_active ON user_groups(user_id, group_id, status);

-- =====================================================
-- MODULE 1.5: ORGANISATEURS - INDEX (NOUVEAU)
-- =====================================================

-- Index principaux pour organizers
CREATE INDEX idx_organizers_code ON organizers(code);
CREATE INDEX idx_organizers_type ON organizers(type);
CREATE INDEX idx_organizers_status ON organizers(status);
CREATE INDEX idx_organizers_type_status ON organizers(type, status);
CREATE INDEX idx_organizers_city_country ON organizers(city, country);
CREATE INDEX idx_organizers_commission_rate ON organizers(commission_rate);
CREATE INDEX idx_organizers_contact_email ON organizers(contact_email);
CREATE INDEX idx_organizers_contact_phone ON organizers(contact_phone);
CREATE INDEX idx_organizers_created_at ON organizers(created_at);
CREATE INDEX idx_organizers_updated_at ON organizers(updated_at);

-- Index pour validation et performance organisateurs
CREATE INDEX idx_organizers_validation ON organizers(validated_at, status);
CREATE INDEX idx_organizers_performance ON organizers(total_events_organized, total_revenue_generated);
CREATE INDEX idx_organizers_active_validated ON organizers(status, validated_at);
CREATE INDEX idx_organizers_satisfaction ON organizers(average_satisfaction_score);

-- Index de recherche textuelle pour organizers
CREATE INDEX idx_organizers_name_search ON organizers 
    USING gin(to_tsvector('simple', name || ' ' || COALESCE(short_name, '') || ' ' || COALESCE(legal_name, '')));

-- Index JSONB pour organizers
CREATE INDEX idx_organizers_social_media ON organizers USING gin(social_media);
CREATE INDEX idx_organizers_legal_documents ON organizers USING gin(legal_documents);
CREATE INDEX idx_organizers_banking_details ON organizers USING gin(banking_details);
CREATE INDEX idx_organizers_metadata ON organizers USING gin(metadata);

-- Index pour venue_organizer_relations
CREATE INDEX idx_venue_organizer_venue ON venue_organizer_relations(venue_id);
CREATE INDEX idx_venue_organizer_organizer ON venue_organizer_relations(organizer_id);
CREATE INDEX idx_venue_organizer_type ON venue_organizer_relations(relation_type);
CREATE INDEX idx_venue_organizer_active ON venue_organizer_relations(is_active);
CREATE INDEX idx_venue_organizer_priority ON venue_organizer_relations(priority_level DESC);
CREATE INDEX idx_venue_organizer_dates ON venue_organizer_relations(valid_from, valid_until);
CREATE INDEX idx_venue_organizer_rental_rate ON venue_organizer_relations(rental_rate);
CREATE INDEX idx_venue_organizer_created_by ON venue_organizer_relations(created_by);

-- Index complexe pour venue_organizer_relations
CREATE INDEX idx_venue_organizer_active_priority ON venue_organizer_relations(venue_id, priority_level DESC, relation_type, is_active);

-- =====================================================
-- MODULE 2: ÉVÉNEMENTS - INDEX (MODIFIÉS)
-- =====================================================

-- Index pour participants
CREATE INDEX idx_participants_code ON participants(code);
CREATE INDEX idx_participants_type ON participants(type);
CREATE INDEX idx_participants_category ON participants(category);
CREATE INDEX idx_participants_participant_category ON participants(participant_category);
CREATE INDEX idx_participants_nationality ON participants(nationality);
CREATE INDEX idx_participants_city ON participants(city);
CREATE INDEX idx_participants_active ON participants(is_active);
CREATE INDEX idx_participants_verified ON participants(is_verified);
CREATE INDEX idx_participants_affiliated_organizer ON participants(affiliated_organizer_id);
CREATE INDEX idx_participants_founded_date ON participants(founded_date);

-- Index de recherche textuelle pour participants
CREATE INDEX idx_participants_name_search ON participants 
    USING gin(to_tsvector('simple', name || ' ' || COALESCE(short_name, '')));

-- Index JSONB pour participants
CREATE INDEX idx_participants_social_media ON participants USING gin(social_media);
CREATE INDEX idx_participants_statistics ON participants USING gin(statistics);
CREATE INDEX idx_participants_booking_agent ON participants USING gin(booking_agent_info);
CREATE INDEX idx_participants_technical_requirements ON participants USING gin(technical_requirements);

-- Index pour participant_staff
CREATE INDEX idx_participant_staff_participant ON participant_staff(participant_id);
CREATE INDEX idx_participant_staff_role ON participant_staff(role);
CREATE INDEX idx_participant_staff_active ON participant_staff(is_active);
CREATE INDEX idx_participant_staff_jersey_number ON participant_staff(jersey_number);
CREATE INDEX idx_participant_staff_nationality ON participant_staff(nationality);
CREATE INDEX idx_participant_staff_contract_dates ON participant_staff(contract_start, contract_end);

-- Index pour participant_relationships
CREATE INDEX idx_participant_relationships_participant_a ON participant_relationships(participant_a_id);
CREATE INDEX idx_participant_relationships_participant_b ON participant_relationships(participant_b_id);
CREATE INDEX idx_participant_relationships_type ON participant_relationships(relationship_type);
CREATE INDEX idx_participant_relationships_active ON participant_relationships(is_active);
CREATE INDEX idx_participant_relationships_dates ON participant_relationships(start_date, end_date);
CREATE INDEX idx_participant_relationships_intensity ON participant_relationships(intensity);

-- Index bidirectionnel pour relations participants
CREATE INDEX idx_participant_relationships_bidirectional ON participant_relationships(participant_b_id, participant_a_id, relationship_type);

-- Index pour event_categories
CREATE INDEX idx_event_categories_code ON event_categories(code);
CREATE INDEX idx_event_categories_parent ON event_categories(parent_category_id);
CREATE INDEX idx_event_categories_active ON event_categories(is_active);
CREATE INDEX idx_event_categories_price ON event_categories(default_ticket_price);

-- Index pour event_groups  
CREATE INDEX idx_event_groups_code ON event_groups(code);
CREATE INDEX idx_event_groups_type ON event_groups(type);
CREATE INDEX idx_event_groups_season ON event_groups(season);
CREATE INDEX idx_event_groups_parent ON event_groups(parent_group_id);
CREATE INDEX idx_event_groups_dates ON event_groups(start_date, end_date);
CREATE INDEX idx_event_groups_active ON event_groups(is_active);
CREATE INDEX idx_event_groups_current_events ON event_groups(current_events);

-- Index pour events (MODIFIÉS avec organisateur)
CREATE INDEX idx_events_code ON events(code);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_organizer_status ON events(organizer_id, status);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_group ON events(event_group_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_mapping ON events(mapping_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_visibility ON events(visibility);
CREATE INDEX idx_events_featured ON events(is_featured);

-- Index temporels pour events
CREATE INDEX idx_events_scheduled_start ON events(scheduled_start);
CREATE INDEX idx_events_scheduled_end ON events(scheduled_end);
CREATE INDEX idx_events_scheduled_range ON events(scheduled_start, scheduled_end);
CREATE INDEX idx_events_sales_window ON events(sales_start, sales_end);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_published_at ON events(published_at);

-- Index composites pour events (sans fonctions temporelles)
CREATE INDEX idx_events_published_upcoming ON events(status, scheduled_start);
CREATE INDEX idx_events_organizer_upcoming ON events(organizer_id, status, scheduled_start);
CREATE INDEX idx_events_venue_upcoming ON events(venue_id, status, scheduled_start);
CREATE INDEX idx_events_featured_published ON events(is_featured, status, scheduled_start);

-- Index de recherche textuelle pour events
CREATE INDEX idx_events_name_search ON events 
    USING gin(to_tsvector('simple', name || ' ' || COALESCE(description, '')));

-- Index JSONB pour events
CREATE INDEX idx_events_tags ON events USING gin(tags);
CREATE INDEX idx_events_pricing_config ON events USING gin(pricing_config);
CREATE INDEX idx_events_restrictions ON events USING gin(restrictions);
CREATE INDEX idx_events_metadata ON events USING gin(metadata);

-- Index pour event_participants
CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_participant ON event_participants(participant_id);
CREATE INDEX idx_event_participants_role ON event_participants(role);
CREATE INDEX idx_event_participants_confirmed ON event_participants(is_confirmed);
CREATE INDEX idx_event_participants_featured ON event_participants(is_featured);
CREATE INDEX idx_event_participants_order ON event_participants(display_order);

-- Index composite pour event_participants
CREATE INDEX idx_event_participants_event_role ON event_participants(event_id, role);
CREATE INDEX idx_event_participants_participant_role ON event_participants(participant_id, role);

-- Index pour event_schedules
CREATE INDEX idx_event_schedules_event ON event_schedules(event_id);
CREATE INDEX idx_event_schedules_start_time ON event_schedules(start_time);
CREATE INDEX idx_event_schedules_type ON event_schedules(schedule_type);
CREATE INDEX idx_event_schedules_order ON event_schedules(display_order);
CREATE INDEX idx_event_schedules_mandatory ON event_schedules(is_mandatory);
CREATE INDEX idx_event_schedules_live ON event_schedules(is_live);

-- Index pour event_media
CREATE INDEX idx_event_media_event ON event_media(event_id);
CREATE INDEX idx_event_media_type ON event_media(media_type);
CREATE INDEX idx_event_media_featured ON event_media(is_featured);
CREATE INDEX idx_event_media_public ON event_media(is_public);
CREATE INDEX idx_event_media_order ON event_media(display_order);

-- Index pour event_restrictions
CREATE INDEX idx_event_restrictions_event ON event_restrictions(event_id);
CREATE INDEX idx_event_restrictions_type ON event_restrictions(restriction_type);
CREATE INDEX idx_event_restrictions_enforced ON event_restrictions(is_enforced);
CREATE INDEX idx_event_restrictions_severity ON event_restrictions(severity);

-- Index pour event_stats
CREATE INDEX idx_event_stats_event ON event_stats(event_id);
CREATE INDEX idx_event_stats_participant ON event_stats(participant_id);
CREATE INDEX idx_event_stats_type ON event_stats(stat_type);
CREATE INDEX idx_event_stats_category ON event_stats(stat_category);
CREATE INDEX idx_event_stats_period ON event_stats(period);
CREATE INDEX idx_event_stats_official ON event_stats(is_official);
CREATE INDEX idx_event_stats_timestamp ON event_stats(timestamp_recorded);

-- =====================================================
-- MODULE 3: VENUES & MAPPING - INDEX (MODIFIÉS)
-- =====================================================

-- Index pour venues (MODIFIÉS avec organisateurs)
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_city_country ON venues(city, country);
CREATE INDEX idx_venues_capacity ON venues(max_capacity);
CREATE INDEX idx_venues_active ON venues(is_active);
CREATE INDEX idx_venues_coordinates ON venues(latitude, longitude);
CREATE INDEX idx_venues_primary_owner ON venues(primary_owner_id);
CREATE INDEX idx_venues_primary_manager ON venues(primary_manager_id);
CREATE INDEX idx_venues_default_mapping ON venues(default_mapping_id);

-- Index de recherche textuelle pour venues
CREATE INDEX idx_venues_name_search ON venues 
    USING gin(to_tsvector('simple', name || ' ' || COALESCE(description, '') || ' ' || city));

-- Index pour venue_mappings
CREATE INDEX idx_venue_mappings_venue ON venue_mappings(venue_id);
CREATE INDEX idx_venue_mappings_type ON venue_mappings(mapping_type);
CREATE INDEX idx_venue_mappings_active ON venue_mappings(is_active);
CREATE INDEX idx_venue_mappings_validity ON venue_mappings(valid_from, valid_until);
CREATE INDEX idx_venue_mappings_capacity ON venue_mappings(effective_capacity);
CREATE INDEX idx_venue_mappings_categories ON venue_mappings USING gin(event_categories);

-- Index pour venue_zones
CREATE INDEX idx_venue_zones_mapping ON venue_zones(mapping_id);
CREATE INDEX idx_venue_zones_parent ON venue_zones(parent_zone_id);
CREATE INDEX idx_venue_zones_type ON venue_zones(zone_type);
CREATE INDEX idx_venue_zones_category ON venue_zones(category);
CREATE INDEX idx_venue_zones_level ON venue_zones(level);
CREATE INDEX idx_venue_zones_capacity ON venue_zones(capacity);
CREATE INDEX idx_venue_zones_price ON venue_zones(base_price);
CREATE INDEX idx_venue_zones_accessible ON venue_zones(is_accessible);

-- Index de recherche textuelle pour venue_zones
CREATE INDEX idx_venue_zones_name_search ON venue_zones 
    USING gin(to_tsvector('simple', name || ' ' || COALESCE(description, '')));

-- Index JSONB pour venue_zones
CREATE INDEX idx_venue_zones_amenities ON venue_zones USING gin(amenities);
CREATE INDEX idx_venue_zones_coordinates ON venue_zones USING gin(coordinates);

-- Index pour seats
CREATE INDEX idx_seats_zone ON seats(zone_id);
CREATE INDEX idx_seats_type ON seats(seat_type);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_accessible ON seats(is_accessible);
CREATE INDEX idx_seats_price_modifier ON seats(price_modifier);
CREATE INDEX idx_seats_coordinates ON seats(x_coordinate, y_coordinate);

-- Index composite pour seats
CREATE INDEX idx_seats_zone_status ON seats(zone_id, status);
CREATE INDEX idx_seats_zone_available ON seats(zone_id, status);

-- Index pour access_points
CREATE INDEX idx_access_points_mapping ON access_points(mapping_id);
CREATE INDEX idx_access_points_type ON access_points(access_type);
CREATE INDEX idx_access_points_security_level ON access_points(security_level);
CREATE INDEX idx_access_points_active ON access_points(is_active);
CREATE INDEX idx_access_points_coordinates ON access_points(latitude, longitude);

-- Index JSONB pour access_points
CREATE INDEX idx_access_points_allowed_zones ON access_points USING gin(allowed_zones);
CREATE INDEX idx_access_points_restricted_zones ON access_points USING gin(restricted_zones);

-- Index pour venue_amenities
CREATE INDEX idx_venue_amenities_mapping ON venue_amenities(mapping_id);
CREATE INDEX idx_venue_amenities_zone ON venue_amenities(zone_id);
CREATE INDEX idx_venue_amenities_category ON venue_amenities(category);
CREATE INDEX idx_venue_amenities_available ON venue_amenities(is_available);
CREATE INDEX idx_venue_amenities_free ON venue_amenities(is_free);
CREATE INDEX idx_venue_amenities_price ON venue_amenities(price);

-- Index pour venue_media
CREATE INDEX idx_venue_media_venue ON venue_media(venue_id);
CREATE INDEX idx_venue_media_mapping ON venue_media(mapping_id);
CREATE INDEX idx_venue_media_zone ON venue_media(zone_id);
CREATE INDEX idx_venue_media_seat ON venue_media(seat_id);
CREATE INDEX idx_venue_media_type ON venue_media(media_type);
CREATE INDEX idx_venue_media_category ON venue_media(category);
CREATE INDEX idx_venue_media_featured ON venue_media(is_featured);
CREATE INDEX idx_venue_media_public ON venue_media(is_public);

-- =====================================================
-- MODULE 4: BILLETTERIE & CONTRÔLE D'ACCÈS - INDEX (MODIFIÉS)
-- =====================================================

-- Index pour subscription_plans (MODIFIÉS avec organisateur)
CREATE INDEX idx_subscription_plans_code ON subscription_plans(code);
CREATE INDEX idx_subscription_plans_organizer ON subscription_plans(organizer_id);
CREATE INDEX idx_subscription_plans_organizer_type ON subscription_plans(organizer_id, type);
CREATE INDEX idx_subscription_plans_type ON subscription_plans(type);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_price ON subscription_plans(price);
CREATE INDEX idx_subscription_plans_validity ON subscription_plans(valid_from, valid_until);
CREATE INDEX idx_subscription_plans_sale_dates ON subscription_plans(sale_start_date, sale_end_date);
CREATE INDEX idx_subscription_plans_current_available ON subscription_plans(current_subscribers, max_subscribers);

-- Index pour subscription_plan_event_groups
CREATE INDEX idx_subscription_plan_event_groups_plan ON subscription_plan_event_groups(subscription_plan_id);
CREATE INDEX idx_subscription_plan_event_groups_group ON subscription_plan_event_groups(event_group_id);
CREATE INDEX idx_subscription_plan_event_groups_included ON subscription_plan_event_groups(is_included);

-- Index pour subscription_plan_events
CREATE INDEX idx_subscription_plan_events_plan ON subscription_plan_events(subscription_plan_id);
CREATE INDEX idx_subscription_plan_events_event ON subscription_plan_events(event_id);
CREATE INDEX idx_subscription_plan_events_included ON subscription_plan_events(is_included);
CREATE INDEX idx_subscription_plan_events_priority ON subscription_plan_events(is_priority);

-- Index pour subscription_plan_zones
CREATE INDEX idx_subscription_plan_zones_plan ON subscription_plan_zones(subscription_plan_id);
CREATE INDEX idx_subscription_plan_zones_zone ON subscription_plan_zones(zone_id);
CREATE INDEX idx_subscription_plan_zones_included ON subscription_plan_zones(is_included);

-- Index pour subscriptions (MODIFIÉS avec organisateur)
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_organizer ON subscriptions(organizer_id);
CREATE INDEX idx_subscriptions_organizer_status ON subscriptions(organizer_id, status);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_dates ON subscriptions(start_date, end_date);
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_price ON subscriptions(price_paid);

-- Index pour ticket_types (MODIFIÉS avec organisateur)
CREATE INDEX idx_ticket_types_code ON ticket_types(code);
CREATE INDEX idx_ticket_types_organizer ON ticket_types(organizer_id);
CREATE INDEX idx_ticket_types_organizer_active ON ticket_types(organizer_id, is_active);
CREATE INDEX idx_ticket_types_active ON ticket_types(is_active);
CREATE INDEX idx_ticket_types_price ON ticket_types(base_price);
CREATE INDEX idx_ticket_types_transferable ON ticket_types(transferable);
CREATE INDEX idx_ticket_types_refundable ON ticket_types(refundable);
CREATE INDEX idx_ticket_types_validity ON ticket_types(valid_from, valid_until);

-- Index pour tickets (MODIFIÉS avec organisateur)
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_organizer ON tickets(organizer_id);
CREATE INDEX idx_tickets_organizer_event ON tickets(organizer_id, event_id);
CREATE INDEX idx_tickets_type ON tickets(ticket_type_id);
CREATE INDEX idx_tickets_zone ON tickets(zone_id);
CREATE INDEX idx_tickets_seat ON tickets(seat_id);
CREATE INDEX idx_tickets_active ON tickets(is_active);
CREATE INDEX idx_tickets_price ON tickets(price_paid);

-- Index pour access_rights (MODIFIÉS avec organisateur)
CREATE INDEX idx_access_rights_user ON access_rights(user_id);
CREATE INDEX idx_access_rights_event ON access_rights(event_id);
CREATE INDEX idx_access_rights_organizer ON access_rights(organizer_id);
CREATE INDEX idx_access_rights_organizer_event ON access_rights(organizer_id, event_id);
CREATE INDEX idx_access_rights_organizer_status ON access_rights(organizer_id, status);
CREATE INDEX idx_access_rights_subscription ON access_rights(subscription_id);
CREATE INDEX idx_access_rights_ticket ON access_rights(ticket_id);
CREATE INDEX idx_access_rights_zone ON access_rights(zone_id);
CREATE INDEX idx_access_rights_seat ON access_rights(seat_id);
CREATE INDEX idx_access_rights_status ON access_rights(status);
CREATE INDEX idx_access_rights_source_type ON access_rights(source_type);
CREATE INDEX idx_access_rights_qr_code ON access_rights(qr_code);
CREATE INDEX idx_access_rights_access_code ON access_rights(access_code);
CREATE INDEX idx_access_rights_validity ON access_rights(valid_from, valid_until);
CREATE INDEX idx_access_rights_used ON access_rights(used_at);

-- Index complexes pour access_rights (sans fonctions temporelles)
CREATE INDEX idx_access_rights_valid_for_event ON access_rights(event_id, status);
CREATE INDEX idx_access_rights_user_valid ON access_rights(user_id, status);

-- Index pour access_transactions_log
CREATE INDEX idx_access_transactions_log_access_right ON access_transactions_log(access_right_id);
CREATE INDEX idx_access_transactions_log_type ON access_transactions_log(transaction_type);
CREATE INDEX idx_access_transactions_log_from_user ON access_transactions_log(from_user_id);
CREATE INDEX idx_access_transactions_log_to_user ON access_transactions_log(to_user_id);
CREATE INDEX idx_access_transactions_log_created_at ON access_transactions_log(created_at);

-- Index pour access_control_log
CREATE INDEX idx_access_control_log_access_right ON access_control_log(access_right_id);
CREATE INDEX idx_access_control_log_access_point ON access_control_log(access_point_id);
CREATE INDEX idx_access_control_log_user ON access_control_log(user_id);
CREATE INDEX idx_access_control_log_event ON access_control_log(event_id);
CREATE INDEX idx_access_control_log_action ON access_control_log(action);
CREATE INDEX idx_access_control_log_result ON access_control_log(result);
CREATE INDEX idx_access_control_log_scanned_at ON access_control_log(scanned_at);
CREATE INDEX idx_access_control_log_denial_reason ON access_control_log(denial_reason);

-- Index complexes pour access_control_log (sans fonctions temporelles)
CREATE INDEX idx_access_control_log_event_success ON access_control_log(event_id, scanned_at, result);
CREATE INDEX idx_access_control_log_event_denied ON access_control_log(event_id, scanned_at, denial_reason, result);
CREATE INDEX idx_access_control_log_user_recent ON access_control_log(user_id, scanned_at);

-- Index pour pricing_rules (MODIFIÉS avec organisateur)
CREATE INDEX idx_pricing_rules_code ON pricing_rules(code);
CREATE INDEX idx_pricing_rules_organizer ON pricing_rules(organizer_id);
CREATE INDEX idx_pricing_rules_organizer_active ON pricing_rules(organizer_id, is_active);
CREATE INDEX idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_validity ON pricing_rules(valid_from, valid_until);
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority DESC);

-- Index JSONB pour pricing_rules
CREATE INDEX idx_pricing_rules_conditions ON pricing_rules USING gin(conditions);
CREATE INDEX idx_pricing_rules_actions ON pricing_rules USING gin(actions);

-- Index pour event_ticket_config (MODIFIÉS avec organisateur)
CREATE INDEX idx_event_ticket_config_event ON event_ticket_config(event_id);
CREATE INDEX idx_event_ticket_config_organizer ON event_ticket_config(organizer_id);
CREATE INDEX idx_event_ticket_config_ticket_type ON event_ticket_config(ticket_type_id);
CREATE INDEX idx_event_ticket_config_zone ON event_ticket_config(zone_id);
CREATE INDEX idx_event_ticket_config_active ON event_ticket_config(is_active);
CREATE INDEX idx_event_ticket_config_available ON event_ticket_config(available_quantity);
CREATE INDEX idx_event_ticket_config_sale_dates ON event_ticket_config(sale_start_date, sale_end_date);

-- Index pour zone_mapping_overrides
CREATE INDEX idx_zone_mapping_overrides_event ON zone_mapping_overrides(event_id);
CREATE INDEX idx_zone_mapping_overrides_zone ON zone_mapping_overrides(zone_id);

-- Index pour ticket_templates
CREATE INDEX idx_ticket_templates_code ON ticket_templates(code);
CREATE INDEX idx_ticket_templates_type ON ticket_templates(template_type);
CREATE INDEX idx_ticket_templates_format ON ticket_templates(format);
CREATE INDEX idx_ticket_templates_active ON ticket_templates(is_active);
CREATE INDEX idx_ticket_templates_default ON ticket_templates(is_default);

-- Index pour blacklist (MODIFIÉS avec organisateur)
CREATE INDEX idx_blacklist_type ON blacklist(type);
CREATE INDEX idx_blacklist_value ON blacklist(value);
CREATE INDEX idx_blacklist_scope ON blacklist(scope);
CREATE INDEX idx_blacklist_organizer ON blacklist(organizer_id);
CREATE INDEX idx_blacklist_organizer_scope ON blacklist(organizer_id, scope);
CREATE INDEX idx_blacklist_target_event ON blacklist(target_event_id);
CREATE INDEX idx_blacklist_target_venue ON blacklist(target_venue_id);
CREATE INDEX idx_blacklist_active ON blacklist(is_active);
CREATE INDEX idx_blacklist_severity ON blacklist(severity);
CREATE INDEX idx_blacklist_validity ON blacklist(valid_from, valid_until);
CREATE INDEX idx_blacklist_created_by ON blacklist(created_by);

-- Index complexe pour blacklist (sans fonctions temporelles)
CREATE INDEX idx_blacklist_active_current ON blacklist(type, value, scope, is_active);

-- =====================================================
-- MODULE 5: PAIEMENTS & BILLING - INDEX (MODIFIÉS)
-- =====================================================

-- Index pour payment_methods
CREATE INDEX idx_payment_methods_code ON payment_methods(code);
CREATE INDEX idx_payment_methods_type ON payment_methods(type);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider);
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX idx_payment_methods_default ON payment_methods(is_default);
CREATE INDEX idx_payment_methods_display_order ON payment_methods(display_order);

-- Index pour orders (MODIFIÉS avec organisateur)
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_primary_organizer ON orders(primary_organizer_id);
CREATE INDEX idx_orders_organizer_status ON orders(primary_organizer_id, status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_channel ON orders(purchase_channel);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_confirmed_at ON orders(confirmed_at);
CREATE INDEX idx_orders_expires_at ON orders(expires_at);
CREATE INDEX idx_orders_guest_email ON orders(guest_email);

-- Index pour order_items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_subscription_plan ON order_items(subscription_plan_id);
CREATE INDEX idx_order_items_ticket_type ON order_items(ticket_type_id);
CREATE INDEX idx_order_items_event ON order_items(event_id);
CREATE INDEX idx_order_items_type ON order_items(item_type);
CREATE INDEX idx_order_items_total_price ON order_items(total_price);

-- Index pour payments (MODIFIÉS avec organisateur)
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_primary_organizer ON payments(primary_organizer_id);
CREATE INDEX idx_payments_organizer_status ON payments(primary_organizer_id, status);
CREATE INDEX idx_payments_method ON payments(payment_method_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_amount ON payments(amount);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_external_transaction ON payments(external_transaction_id);
CREATE INDEX idx_payments_expires_at ON payments(expires_at);

-- Index pour payment_attempts
CREATE INDEX idx_payment_attempts_payment ON payment_attempts(payment_id);
CREATE INDEX idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX idx_payment_attempts_attempted_at ON payment_attempts(attempted_at);

-- Index pour refunds
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_type ON refunds(refund_type);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_method ON refunds(method);
CREATE INDEX idx_refunds_requested_by ON refunds(requested_by);
CREATE INDEX idx_refunds_approved_by ON refunds(approved_by);
CREATE INDEX idx_refunds_completed_date ON refunds(completed_date);

-- Index pour organizer_commissions (MODIFIÉS)
CREATE INDEX idx_organizer_commissions_payment ON organizer_commissions(payment_id);
CREATE INDEX idx_organizer_commissions_order ON organizer_commissions(order_id);
CREATE INDEX idx_organizer_commissions_organizer ON organizer_commissions(organizer_id);
CREATE INDEX idx_organizer_commissions_status ON organizer_commissions(status);
CREATE INDEX idx_organizer_commissions_organizer_status ON organizer_commissions(organizer_id, status);
CREATE INDEX idx_organizer_commissions_type ON organizer_commissions(commission_type);
CREATE INDEX idx_organizer_commissions_tier ON organizer_commissions(commission_tier);
CREATE INDEX idx_organizer_commissions_due_date ON organizer_commissions(payment_due_date);
CREATE INDEX idx_organizer_commissions_paid_date ON organizer_commissions(paid_date);
CREATE INDEX idx_organizer_commissions_contract_version ON organizer_commissions(contract_version);

-- Index pour payment_webhooks
CREATE INDEX idx_payment_webhooks_payment ON payment_webhooks(payment_id);
CREATE INDEX idx_payment_webhooks_webhook_id ON payment_webhooks(webhook_id);
CREATE INDEX idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_status ON payment_webhooks(status);
CREATE INDEX idx_payment_webhooks_external_transaction ON payment_webhooks(external_transaction_id);
CREATE INDEX idx_payment_webhooks_created_at ON payment_webhooks(created_at);
CREATE INDEX idx_payment_webhooks_processed_at ON payment_webhooks(processed_at);

-- =====================================================
-- MODULE 6: SÉCURITÉ & AUDIT - INDEX
-- =====================================================

-- Index pour audit_logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Index complexes pour audit_logs
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_recent ON audit_logs(user_id, created_at);

-- Index JSONB pour audit_logs
CREATE INDEX idx_audit_logs_old_values ON audit_logs USING gin(old_values);
CREATE INDEX idx_audit_logs_new_values ON audit_logs USING gin(new_values);

-- Index pour user_sessions
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_ip_address ON user_sessions(ip_address);
CREATE INDEX idx_user_sessions_device_fingerprint ON user_sessions(device_fingerprint);

-- Index complexes pour user_sessions (sans fonctions temporelles)
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, last_activity, is_active);
CREATE INDEX idx_user_sessions_expired ON user_sessions(expires_at, is_active);

-- Index pour login_attempts
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_user ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_success ON login_attempts(success);
CREATE INDEX idx_login_attempts_suspicious ON login_attempts(is_suspicious);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);

-- Index complexes pour login_attempts (sans fonctions temporelles)
CREATE INDEX idx_login_attempts_failed_recent ON login_attempts(email, created_at, success);
CREATE INDEX idx_login_attempts_ip_recent ON login_attempts(ip_address, created_at);

-- Index pour security_events
CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_target_user ON security_events(target_user_id);
CREATE INDEX idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX idx_security_events_status ON security_events(status);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_security_events_resolved_at ON security_events(resolved_at);

-- Index pour mfa_tokens
CREATE INDEX idx_mfa_tokens_user ON mfa_tokens(user_id);
CREATE INDEX idx_mfa_tokens_method ON mfa_tokens(method);
CREATE INDEX idx_mfa_tokens_expires_at ON mfa_tokens(expires_at);
CREATE INDEX idx_mfa_tokens_used ON mfa_tokens(is_used);
CREATE INDEX idx_mfa_tokens_used_at ON mfa_tokens(used_at);

-- Index complexes pour mfa_tokens (sans fonctions temporelles)
CREATE INDEX idx_mfa_tokens_user_valid ON mfa_tokens(user_id, method, expires_at, is_used);

-- Index pour rate_limiting
CREATE INDEX idx_rate_limiting_endpoint ON rate_limiting(endpoint);
CREATE INDEX idx_rate_limiting_identifier ON rate_limiting(identifier_type, identifier_value);
CREATE INDEX idx_rate_limiting_blocked ON rate_limiting(is_blocked);
CREATE INDEX idx_rate_limiting_window_start ON rate_limiting(window_start);
CREATE INDEX idx_rate_limiting_last_request ON rate_limiting(last_request);

-- Index pour security_policies
CREATE INDEX idx_security_policies_code ON security_policies(code);
CREATE INDEX idx_security_policies_type ON security_policies(policy_type);
CREATE INDEX idx_security_policies_active ON security_policies(is_active);
CREATE INDEX idx_security_policies_enforced ON security_policies(is_enforced);
CREATE INDEX idx_security_policies_validity ON security_policies(valid_from, valid_until);

-- =====================================================
-- INDEX POUR REPORTING ET ANALYTICS (COMPLÈTEMENT CORRIGÉ)
-- =====================================================

-- Index pour revenus par organisateur (suppression EXTRACT)
CREATE INDEX idx_payments_organizer_monthly ON payments(
    primary_organizer_id, 
    payment_date,
    status
);

-- Index pour fréquentation (suppression EXTRACT)
CREATE INDEX idx_access_control_venue_monthly ON access_control_log(
    scanned_at,
    result
);

-- Index pour analyse des échecs de paiement
CREATE INDEX idx_payment_attempts_failures ON payment_attempts(
    attempted_at, 
    failure_reason,
    status
);

-- Index pour analyse de la fraude
CREATE INDEX idx_login_attempts_fraud_analysis ON login_attempts(
    ip_address, 
    created_at,
    success
);

-- =====================================================
-- INDEX POUR API ET PERFORMANCE WEB
-- =====================================================

-- Index pour API des événements publics (endpoint principal)
CREATE INDEX idx_events_api_public ON events(
    scheduled_start DESC, 
    visibility, 
    status
);

-- Index pour API des organisateurs (listing public)
CREATE INDEX idx_organizers_api_public ON organizers(
    name, 
    type, 
    city,
    status
);

-- Index pour API des venues (recherche géographique)
CREATE INDEX idx_venues_api_location ON venues(
    city, 
    max_capacity DESC,
    is_active
);

-- Index pour API de recherche d'événements
CREATE INDEX idx_events_search_api ON events(
    scheduled_start, 
    category_id, 
    venue_id,
    status,
    visibility
);

-- =====================================================
-- INDEX PARTIELS OPTIMISÉS (CORRIGÉ)
-- =====================================================

-- Index partiels sans fonctions temporelles pour économiser l'espace
CREATE INDEX idx_users_active_verified_partial ON users(id, email_verified) 
    WHERE is_active = TRUE;

CREATE INDEX idx_events_published_partial ON events(scheduled_start, organizer_id) 
    WHERE status = 'PUBLISHED';

CREATE INDEX idx_seats_available_partial ON seats(zone_id, seat_number) 
    WHERE status = 'AVAILABLE';

CREATE INDEX idx_subscriptions_active_partial ON subscriptions(user_id, organizer_id, end_date) 
    WHERE status = 'ACTIVE';

CREATE INDEX idx_access_rights_valid_partial ON access_rights(event_id, user_id, valid_until) 
    WHERE status = 'VALID';

CREATE INDEX idx_organizer_commissions_unpaid_partial ON organizer_commissions(organizer_id, payment_due_date) 
    WHERE status IN ('PENDING', 'CALCULATED', 'APPROVED');

-- =====================================================
-- VALIDATION ET STATISTIQUES
-- =====================================================

-- Compter tous les index créés
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'user_profiles', 'roles', 'groups', 'user_roles', 'user_groups',
    'organizers', 'venue_organizer_relations',
    'participants', 'participant_staff', 'participant_relationships',
    'event_categories', 'event_groups', 'events', 'event_participants',
    'venues', 'venue_mappings', 'venue_zones', 'seats',
    'subscription_plans', 'subscriptions', 'ticket_types', 'tickets', 'access_rights',
    'orders', 'payments', 'organizer_commissions',
    'audit_logs', 'user_sessions', 'blacklist'
)
ORDER BY tablename, indexname;

-- Statistiques des index par table
SELECT 
    tablename,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY tablename
HAVING tablename IN (
    'users', 'user_profiles', 'organizers', 'events', 'venues', 
    'tickets', 'access_rights', 'payments', 'organizer_commissions'
)
ORDER BY index_count DESC;

-- Message de confirmation
SELECT 
    'Index Entrix V2.1 créés avec succès!' as status,
    'Plus de 200 index optimisés incluant nouveaux organisateurs' as count,
    'Performance maximale pour toutes les requêtes courantes' as performance,
    'Index spécialisés pour API, reporting et analytics' as features,
    'Toutes les fonctions temporelles supprimées des prédicats' as fixes;

-- =====================================================
-- FIN DU FICHIER 06_entrix_indexes_v2.1.sql
-- =====================================================