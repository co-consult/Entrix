-- =====================================================
-- ENTRIX SOLUTION - CONSTRAINTS COMPLETE V2.1
-- File: 03_entrix_constraints_v2.1.sql
-- Description: All FK, CHECK and UNIQUE constraints + nouveaux organisateurs
-- Version: 2.1 - Ajout contraintes organisateurs et mise à jour références
-- Date: Juillet 2025
-- =====================================================

-- =====================================================
-- MODULE 1: USERS & GROUPS - CONSTRAINTS
-- =====================================================

-- Foreign key constraints for user_profiles
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_favorite_team 
    FOREIGN KEY (favorite_team_id) REFERENCES participants(id) ON DELETE SET NULL;

-- Foreign key constraints for user_roles
ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_role_id 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_assigned_by 
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key constraints for user_groups
ALTER TABLE user_groups 
ADD CONSTRAINT fk_user_groups_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_groups 
ADD CONSTRAINT fk_user_groups_group_id 
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE user_groups 
ADD CONSTRAINT fk_user_groups_added_by 
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL;

-- Check constraints for users
ALTER TABLE users 
ADD CONSTRAINT chk_users_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users 
ADD CONSTRAINT chk_users_phone_format 
    CHECK (phone IS NULL OR phone ~* '^[+]?[1-9][0-9]{7,14}$');

ALTER TABLE users 
ADD CONSTRAINT chk_users_names_not_empty 
    CHECK (LENGTH(TRIM(first_name)) > 0 AND LENGTH(TRIM(last_name)) > 0);

-- Unique constraints for users
ALTER TABLE users 
ADD CONSTRAINT uk_users_email UNIQUE (email);

-- Check constraints for user_profiles
ALTER TABLE user_profiles 
ADD CONSTRAINT chk_user_profiles_birth_date 
    CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '13 year');

ALTER TABLE user_profiles 
ADD CONSTRAINT chk_user_profiles_country_code 
    CHECK (LENGTH(country) = 2);

ALTER TABLE user_profiles 
ADD CONSTRAINT chk_user_profiles_language_code 
    CHECK (language ~* '^[a-z]{2}(-[A-Z]{2})?$');

ALTER TABLE user_profiles 
ADD CONSTRAINT chk_user_profiles_supporter_since 
    CHECK (supporter_since IS NULL OR supporter_since <= CURRENT_DATE);

-- Unique constraints for user_profiles
ALTER TABLE user_profiles 
ADD CONSTRAINT uk_user_profiles_user_id UNIQUE (user_id);

-- Check constraints for roles
ALTER TABLE roles 
ADD CONSTRAINT chk_roles_level_range 
    CHECK (level >= 0 AND level <= 100);

ALTER TABLE roles 
ADD CONSTRAINT chk_roles_code_format 
    CHECK (code ~* '^[A-Z_]+$');

-- Unique constraints for roles
ALTER TABLE roles 
ADD CONSTRAINT uk_roles_code UNIQUE (code);

-- Check constraints for groups
ALTER TABLE groups 
ADD CONSTRAINT chk_groups_valid_dates 
    CHECK (valid_until IS NULL OR valid_until >= valid_from);

ALTER TABLE groups 
ADD CONSTRAINT chk_groups_max_members 
    CHECK (max_members IS NULL OR max_members > 0);

-- Unique constraints for groups
ALTER TABLE groups 
ADD CONSTRAINT uk_groups_code UNIQUE (code);

-- Check constraints for user_roles
ALTER TABLE user_roles 
ADD CONSTRAINT chk_user_roles_valid_dates 
    CHECK (valid_until IS NULL OR valid_until >= assigned_at);

-- Unique constraints for user_roles
ALTER TABLE user_roles 
ADD CONSTRAINT uk_user_roles_user_role UNIQUE (user_id, role_id);

-- Check constraints for user_groups
ALTER TABLE user_groups 
ADD CONSTRAINT chk_user_groups_valid_dates 
    CHECK (valid_until IS NULL OR valid_until >= joined_at);

-- Unique constraints for user_groups
ALTER TABLE user_groups 
ADD CONSTRAINT uk_user_groups_user_group UNIQUE (user_id, group_id);

-- =====================================================
-- MODULE 1.5: ORGANISATEURS - CONTRAINTES (NOUVEAU)
-- =====================================================

-- Foreign key constraints for organizers
ALTER TABLE organizers 
ADD CONSTRAINT fk_organizers_validated_by 
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE organizers 
ADD CONSTRAINT fk_organizers_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE organizers 
ADD CONSTRAINT fk_organizers_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Check constraints for organizers
ALTER TABLE organizers 
ADD CONSTRAINT chk_organizers_commission_rate 
    CHECK (commission_rate >= 0 AND commission_rate <= 0.5000);

ALTER TABLE organizers 
ADD CONSTRAINT chk_organizers_payment_terms 
    CHECK (payment_terms >= 0 AND payment_terms <= 90);

ALTER TABLE organizers 
ADD CONSTRAINT chk_organizers_satisfaction_score 
    CHECK (average_satisfaction_score IS NULL OR 
           (average_satisfaction_score >= 0 AND average_satisfaction_score <= 10));

ALTER TABLE organizers 
ADD CONSTRAINT chk_organizers_country 
    CHECK (LENGTH(country) = 2);

ALTER TABLE organizers 
ADD CONSTRAINT chk_organizers_currency 
    CHECK (LENGTH(currency) = 3);

ALTER TABLE organizers 
ADD CONSTRAINT chk_organizers_contact_email_format 
    CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE organizers 
ADD CONSTRAINT chk_organizers_contact_phone_format 
    CHECK (contact_phone IS NULL OR contact_phone ~* '^[+]?[1-9][0-9]{7,14}$');

ALTER TABLE organizers 
ADD CONSTRAINT chk_organizers_total_events 
    CHECK (total_events_organized >= 0);

ALTER TABLE organizers 
ADD CONSTRAINT chk_organizers_total_revenue 
    CHECK (total_revenue_generated >= 0);

-- Unique constraints for organizers
ALTER TABLE organizers 
ADD CONSTRAINT uk_organizers_code UNIQUE (code);

ALTER TABLE organizers 
ADD CONSTRAINT uk_organizers_contact_email UNIQUE (contact_email);

-- Foreign key constraints for venue_organizer_relations
ALTER TABLE venue_organizer_relations 
ADD CONSTRAINT fk_venue_organizer_venue 
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

ALTER TABLE venue_organizer_relations 
ADD CONSTRAINT fk_venue_organizer_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE;

ALTER TABLE venue_organizer_relations 
ADD CONSTRAINT fk_venue_organizer_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Check constraints for venue_organizer_relations
ALTER TABLE venue_organizer_relations 
ADD CONSTRAINT chk_venue_organizer_dates 
    CHECK (valid_until IS NULL OR valid_until >= valid_from);

ALTER TABLE venue_organizer_relations 
ADD CONSTRAINT chk_venue_organizer_rental_rate 
    CHECK (rental_rate IS NULL OR rental_rate >= 0);

ALTER TABLE venue_organizer_relations 
ADD CONSTRAINT chk_venue_organizer_priority 
    CHECK (priority_level >= 0 AND priority_level <= 100);

ALTER TABLE venue_organizer_relations 
ADD CONSTRAINT chk_venue_organizer_payment_terms 
    CHECK (payment_terms IS NULL OR payment_terms >= 0);

-- Unique constraints for venue_organizer_relations
ALTER TABLE venue_organizer_relations 
ADD CONSTRAINT uk_venue_organizer_unique 
    UNIQUE (venue_id, organizer_id, relation_type);

-- =====================================================
-- MODULE 2: EVENTS - CONSTRAINTS (MODIFIÉES)
-- =====================================================

-- Foreign key constraints for participants
ALTER TABLE participants 
ADD CONSTRAINT fk_participants_affiliated_organizer 
    FOREIGN KEY (affiliated_organizer_id) REFERENCES organizers(id) ON DELETE SET NULL;

-- Foreign key constraints for participant_staff
ALTER TABLE participant_staff 
ADD CONSTRAINT fk_participant_staff_participant_id 
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;

-- Foreign key constraints for participant_relationships
ALTER TABLE participant_relationships 
ADD CONSTRAINT fk_participant_relationships_participant_a 
    FOREIGN KEY (participant_a_id) REFERENCES participants(id) ON DELETE CASCADE;

ALTER TABLE participant_relationships 
ADD CONSTRAINT fk_participant_relationships_participant_b 
    FOREIGN KEY (participant_b_id) REFERENCES participants(id) ON DELETE CASCADE;

-- Foreign key constraints for event_categories
ALTER TABLE event_categories 
ADD CONSTRAINT fk_event_categories_parent 
    FOREIGN KEY (parent_category_id) REFERENCES event_categories(id) ON DELETE SET NULL;

-- Foreign key constraints for event_groups
ALTER TABLE event_groups 
ADD CONSTRAINT fk_event_groups_parent 
    FOREIGN KEY (parent_group_id) REFERENCES event_groups(id) ON DELETE SET NULL;

-- Foreign key constraints for events (MODIFIÉES avec organisateur)
ALTER TABLE events 
ADD CONSTRAINT fk_events_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

ALTER TABLE events 
ADD CONSTRAINT fk_events_event_group 
    FOREIGN KEY (event_group_id) REFERENCES event_groups(id) ON DELETE SET NULL;

ALTER TABLE events 
ADD CONSTRAINT fk_events_category 
    FOREIGN KEY (category_id) REFERENCES event_categories(id) ON DELETE RESTRICT;

ALTER TABLE events 
ADD CONSTRAINT fk_events_venue 
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT;

ALTER TABLE events 
ADD CONSTRAINT fk_events_mapping 
    FOREIGN KEY (mapping_id) REFERENCES venue_mappings(id) ON DELETE RESTRICT;

ALTER TABLE events 
ADD CONSTRAINT fk_events_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE events 
ADD CONSTRAINT fk_events_published_by 
    FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key constraints for event_participants
ALTER TABLE event_participants 
ADD CONSTRAINT fk_event_participants_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_participants 
ADD CONSTRAINT fk_event_participants_participant 
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;

-- Foreign key constraints for event_schedules
ALTER TABLE event_schedules 
ADD CONSTRAINT fk_event_schedules_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Foreign key constraints for event_media
ALTER TABLE event_media 
ADD CONSTRAINT fk_event_media_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Foreign key constraints for event_restrictions
ALTER TABLE event_restrictions 
ADD CONSTRAINT fk_event_restrictions_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Foreign key constraints for event_stats
ALTER TABLE event_stats 
ADD CONSTRAINT fk_event_stats_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_stats 
ADD CONSTRAINT fk_event_stats_participant 
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;

-- Check constraints for participants
ALTER TABLE participants 
ADD CONSTRAINT chk_participants_founded_disbanded 
    CHECK (disbanded_date IS NULL OR disbanded_date >= founded_date);

ALTER TABLE participants 
ADD CONSTRAINT chk_participants_nationality 
    CHECK (nationality IS NULL OR LENGTH(nationality) = 2);

ALTER TABLE participants 
ADD CONSTRAINT chk_participants_code_format 
    CHECK (code ~* '^[A-Z0-9_]+$');

-- Unique constraints for participants
ALTER TABLE participants 
ADD CONSTRAINT uk_participants_code UNIQUE (code);

-- Check constraints for participant_staff
ALTER TABLE participant_staff 
ADD CONSTRAINT chk_participant_staff_contract_dates 
    CHECK (contract_end IS NULL OR contract_end >= contract_start);

ALTER TABLE participant_staff 
ADD CONSTRAINT chk_participant_staff_salary 
    CHECK (salary IS NULL OR salary >= 0);

ALTER TABLE participant_staff 
ADD CONSTRAINT chk_participant_staff_jersey_number 
    CHECK (jersey_number IS NULL OR (jersey_number >= 1 AND jersey_number <= 99));

-- Check constraints for participant_relationships
ALTER TABLE participant_relationships 
ADD CONSTRAINT chk_participant_relationships_different_participants 
    CHECK (participant_a_id != participant_b_id);

ALTER TABLE participant_relationships 
ADD CONSTRAINT chk_participant_relationships_intensity 
    CHECK (intensity >= 1 AND intensity <= 10);

ALTER TABLE participant_relationships 
ADD CONSTRAINT chk_participant_relationships_dates 
    CHECK (end_date IS NULL OR end_date >= start_date);

-- Unique constraints for participant_relationships
ALTER TABLE participant_relationships 
ADD CONSTRAINT uk_participant_relationships 
    UNIQUE (participant_a_id, participant_b_id, relationship_type);

-- Check constraints for event_categories
ALTER TABLE event_categories 
ADD CONSTRAINT chk_event_categories_duration 
    CHECK (default_duration IS NULL OR default_duration > 0);

ALTER TABLE event_categories 
ADD CONSTRAINT chk_event_categories_capacity 
    CHECK (default_capacity IS NULL OR default_capacity > 0);

ALTER TABLE event_categories 
ADD CONSTRAINT chk_event_categories_price 
    CHECK (default_ticket_price IS NULL OR default_ticket_price >= 0);

ALTER TABLE event_categories 
ADD CONSTRAINT chk_event_categories_currency 
    CHECK (LENGTH(currency) = 3);

-- Unique constraints for event_categories
ALTER TABLE event_categories 
ADD CONSTRAINT uk_event_categories_code UNIQUE (code);

-- Check constraints for event_groups
ALTER TABLE event_groups 
ADD CONSTRAINT chk_event_groups_dates 
    CHECK (end_date >= start_date);

ALTER TABLE event_groups 
ADD CONSTRAINT chk_event_groups_max_events 
    CHECK (max_events IS NULL OR max_events > 0);

ALTER TABLE event_groups 
ADD CONSTRAINT chk_event_groups_current_events 
    CHECK (current_events >= 0);

ALTER TABLE event_groups 
ADD CONSTRAINT chk_event_groups_completed_events 
    CHECK (completed_events >= 0 AND completed_events <= current_events);

-- Unique constraints for event_groups
ALTER TABLE event_groups 
ADD CONSTRAINT uk_event_groups_code UNIQUE (code);

-- Check constraints for events
ALTER TABLE events 
ADD CONSTRAINT chk_events_scheduled_dates 
    CHECK (scheduled_end >= scheduled_start);

ALTER TABLE events 
ADD CONSTRAINT chk_events_actual_dates 
    CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end >= actual_start);

ALTER TABLE events 
ADD CONSTRAINT chk_events_duration 
    CHECK (expected_duration IS NULL OR expected_duration > 0);

ALTER TABLE events 
ADD CONSTRAINT chk_events_capacity 
    CHECK (max_capacity IS NULL OR max_capacity > 0);

ALTER TABLE events 
ADD CONSTRAINT chk_events_current_capacity 
    CHECK (current_capacity >= 0);

ALTER TABLE events 
ADD CONSTRAINT chk_events_capacity_consistency 
    CHECK (max_capacity IS NULL OR current_capacity <= max_capacity);

ALTER TABLE events 
ADD CONSTRAINT chk_events_sales_dates 
    CHECK (sales_end IS NULL OR sales_start IS NULL OR sales_end >= sales_start);

ALTER TABLE events 
ADD CONSTRAINT chk_events_organizer_contact_email 
    CHECK (organizer_contact_email IS NULL OR organizer_contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Unique constraints for events
ALTER TABLE events 
ADD CONSTRAINT uk_events_code UNIQUE (code);

-- Check constraints for event_participants
ALTER TABLE event_participants 
ADD CONSTRAINT chk_event_participants_fee 
    CHECK (participation_fee IS NULL OR participation_fee >= 0);

ALTER TABLE event_participants 
ADD CONSTRAINT chk_event_participants_prize 
    CHECK (prize_money IS NULL OR prize_money >= 0);

ALTER TABLE event_participants 
ADD CONSTRAINT chk_event_participants_order 
    CHECK (display_order >= 0);

-- Unique constraints for event_participants
ALTER TABLE event_participants 
ADD CONSTRAINT uk_event_participants 
    UNIQUE (event_id, participant_id, role);

-- Check constraints for event_schedules
ALTER TABLE event_schedules 
ADD CONSTRAINT chk_event_schedules_times 
    CHECK (end_time IS NULL OR end_time >= start_time);

ALTER TABLE event_schedules 
ADD CONSTRAINT chk_event_schedules_duration 
    CHECK (duration IS NULL OR duration > 0);

ALTER TABLE event_schedules 
ADD CONSTRAINT chk_event_schedules_order 
    CHECK (display_order >= 0);

-- Check constraints for event_media
ALTER TABLE event_media 
ADD CONSTRAINT chk_event_media_file_size 
    CHECK (file_size IS NULL OR file_size > 0);

ALTER TABLE event_media 
ADD CONSTRAINT chk_event_media_display_order 
    CHECK (display_order >= 0);

-- Check constraints for event_stats
ALTER TABLE event_stats 
ADD CONSTRAINT chk_event_stats_value_not_all_null 
    CHECK (value_numeric IS NOT NULL OR value_text IS NOT NULL OR value_json IS NOT NULL);

-- =====================================================
-- MODULE 3: VENUES & MAPPING - CONSTRAINTS (MODIFIÉES)
-- =====================================================

-- Foreign key constraints for venues (MODIFIÉES avec organisateurs)
ALTER TABLE venues 
ADD CONSTRAINT fk_venues_primary_owner 
    FOREIGN KEY (primary_owner_id) REFERENCES organizers(id) ON DELETE SET NULL;

ALTER TABLE venues 
ADD CONSTRAINT fk_venues_primary_manager 
    FOREIGN KEY (primary_manager_id) REFERENCES organizers(id) ON DELETE SET NULL;

-- Self-referencing foreign key constraints for venues
ALTER TABLE venues 
ADD CONSTRAINT fk_venues_default_mapping 
    FOREIGN KEY (default_mapping_id) REFERENCES venue_mappings(id) ON DELETE SET NULL;

-- Foreign key constraints for venue_mappings
ALTER TABLE venue_mappings 
ADD CONSTRAINT fk_venue_mappings_venue 
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- Foreign key constraints for venue_zones
ALTER TABLE venue_zones 
ADD CONSTRAINT fk_venue_zones_mapping 
    FOREIGN KEY (mapping_id) REFERENCES venue_mappings(id) ON DELETE CASCADE;

ALTER TABLE venue_zones 
ADD CONSTRAINT fk_venue_zones_parent 
    FOREIGN KEY (parent_zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE;

-- Foreign key constraints for seats
ALTER TABLE seats 
ADD CONSTRAINT fk_seats_zone 
    FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE;

-- Foreign key constraints for access_points
ALTER TABLE access_points 
ADD CONSTRAINT fk_access_points_mapping 
    FOREIGN KEY (mapping_id) REFERENCES venue_mappings(id) ON DELETE CASCADE;

-- Foreign key constraints for venue_amenities
ALTER TABLE venue_amenities 
ADD CONSTRAINT fk_venue_amenities_mapping 
    FOREIGN KEY (mapping_id) REFERENCES venue_mappings(id) ON DELETE CASCADE;

ALTER TABLE venue_amenities 
ADD CONSTRAINT fk_venue_amenities_zone 
    FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE;

-- Foreign key constraints for venue_media
ALTER TABLE venue_media 
ADD CONSTRAINT fk_venue_media_venue 
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

ALTER TABLE venue_media 
ADD CONSTRAINT fk_venue_media_mapping 
    FOREIGN KEY (mapping_id) REFERENCES venue_mappings(id) ON DELETE CASCADE;

ALTER TABLE venue_media 
ADD CONSTRAINT fk_venue_media_zone 
    FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE;

ALTER TABLE venue_media 
ADD CONSTRAINT fk_venue_media_seat 
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE;

-- Check constraints for venues
ALTER TABLE venues 
ADD CONSTRAINT chk_venues_capacity 
    CHECK (max_capacity > 0);

ALTER TABLE venues 
ADD CONSTRAINT chk_venues_coordinates 
    CHECK ((latitude IS NULL AND longitude IS NULL) OR 
           (latitude IS NOT NULL AND longitude IS NOT NULL));

ALTER TABLE venues 
ADD CONSTRAINT chk_venues_latitude 
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE venues 
ADD CONSTRAINT chk_venues_longitude 
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

ALTER TABLE venues 
ADD CONSTRAINT chk_venues_country 
    CHECK (LENGTH(country) = 2);

-- Unique constraints for venues
ALTER TABLE venues 
ADD CONSTRAINT uk_venues_slug UNIQUE (slug);

-- Check constraints for venue_mappings
ALTER TABLE venue_mappings 
ADD CONSTRAINT chk_venue_mappings_capacity 
    CHECK (effective_capacity > 0);

ALTER TABLE venue_mappings 
ADD CONSTRAINT chk_venue_mappings_dates 
    CHECK (valid_until IS NULL OR valid_until >= valid_from);

-- Unique constraints for venue_mappings
ALTER TABLE venue_mappings 
ADD CONSTRAINT uk_venue_mappings_code 
    UNIQUE (venue_id, code);

-- Check constraints for venue_zones
ALTER TABLE venue_zones 
ADD CONSTRAINT chk_venue_zones_capacity 
    CHECK (capacity >= 0);

ALTER TABLE venue_zones 
ADD CONSTRAINT chk_venue_zones_level 
    CHECK (level >= 0);

ALTER TABLE venue_zones 
ADD CONSTRAINT chk_venue_zones_price 
    CHECK (base_price >= 0);

ALTER TABLE venue_zones 
ADD CONSTRAINT chk_venue_zones_currency 
    CHECK (LENGTH(currency) = 3);

-- Unique constraints for venue_zones
ALTER TABLE venue_zones 
ADD CONSTRAINT uk_venue_zones_code 
    UNIQUE (mapping_id, code);

-- Check constraints for seats
ALTER TABLE seats 
ADD CONSTRAINT chk_seats_price_modifier 
    CHECK (price_modifier >= 0);

ALTER TABLE seats 
ADD CONSTRAINT chk_seats_seat_number 
    CHECK (LENGTH(TRIM(seat_number)) > 0);

-- Unique constraints for seats
ALTER TABLE seats 
ADD CONSTRAINT uk_seats_position 
    UNIQUE (zone_id, seat_number, row_number);

-- Check constraints for access_points
ALTER TABLE access_points 
ADD CONSTRAINT chk_access_points_coordinates 
    CHECK ((latitude IS NULL AND longitude IS NULL) OR 
           (latitude IS NOT NULL AND longitude IS NOT NULL));

ALTER TABLE access_points 
ADD CONSTRAINT chk_access_points_latitude 
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE access_points 
ADD CONSTRAINT chk_access_points_longitude 
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Unique constraints for access_points
ALTER TABLE access_points 
ADD CONSTRAINT uk_access_points_code 
    UNIQUE (mapping_id, code);

-- Check constraints for venue_amenities
ALTER TABLE venue_amenities 
ADD CONSTRAINT chk_venue_amenities_price 
    CHECK (price IS NULL OR price >= 0);

ALTER TABLE venue_amenities 
ADD CONSTRAINT chk_venue_amenities_capacity 
    CHECK (capacity IS NULL OR capacity > 0);

ALTER TABLE venue_amenities 
ADD CONSTRAINT chk_venue_amenities_currency 
    CHECK (currency IS NULL OR LENGTH(currency) = 3);

-- Check constraints for venue_media
ALTER TABLE venue_media 
ADD CONSTRAINT chk_venue_media_file_size 
    CHECK (file_size IS NULL OR file_size > 0);

ALTER TABLE venue_media 
ADD CONSTRAINT chk_venue_media_display_order 
    CHECK (display_order >= 0);

-- =====================================================
-- MODULE 4: TICKETING & ACCESS CONTROL - CONSTRAINTS (MODIFIÉES)
-- =====================================================

-- Foreign key constraints for subscription_plans (MODIFIÉES avec organisateur)
ALTER TABLE subscription_plans 
ADD CONSTRAINT fk_subscription_plans_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

-- Foreign key constraints for subscription_plan_event_groups
ALTER TABLE subscription_plan_event_groups 
ADD CONSTRAINT fk_subscription_plan_event_groups_plan 
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE;

ALTER TABLE subscription_plan_event_groups 
ADD CONSTRAINT fk_subscription_plan_event_groups_group 
    FOREIGN KEY (event_group_id) REFERENCES event_groups(id) ON DELETE CASCADE;

-- Foreign key constraints for subscription_plan_events
ALTER TABLE subscription_plan_events 
ADD CONSTRAINT fk_subscription_plan_events_plan 
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE;

ALTER TABLE subscription_plan_events 
ADD CONSTRAINT fk_subscription_plan_events_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Foreign key constraints for subscription_plan_zones
ALTER TABLE subscription_plan_zones 
ADD CONSTRAINT fk_subscription_plan_zones_plan 
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE;

ALTER TABLE subscription_plan_zones 
ADD CONSTRAINT fk_subscription_plan_zones_zone 
    FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE;

-- Foreign key constraints for subscriptions (MODIFIÉES avec organisateur)
ALTER TABLE subscriptions 
ADD CONSTRAINT fk_subscriptions_plan 
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT;

ALTER TABLE subscriptions 
ADD CONSTRAINT fk_subscriptions_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE subscriptions 
ADD CONSTRAINT fk_subscriptions_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE SET NULL;

-- Foreign key constraints for ticket_types (MODIFIÉES avec organisateur)
ALTER TABLE ticket_types 
ADD CONSTRAINT fk_ticket_types_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE SET NULL;

-- Foreign key constraints for tickets (MODIFIÉES avec organisateur)
ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_type 
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE RESTRICT;

ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT;

ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_zone 
    FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE SET NULL;

ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_seat 
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE SET NULL;

ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE SET NULL;

-- Foreign key constraints for access_rights (MODIFIÉES avec organisateur)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT;

ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_subscription 
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_ticket 
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL;

ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_zone 
    FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE SET NULL;

ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_seat 
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE SET NULL;

ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE SET NULL;

-- Foreign key constraints for access_transactions_log
ALTER TABLE access_transactions_log 
ADD CONSTRAINT fk_access_transactions_log_access_right 
    FOREIGN KEY (access_right_id) REFERENCES access_rights(id) ON DELETE CASCADE;

ALTER TABLE access_transactions_log 
ADD CONSTRAINT fk_access_transactions_log_from_user 
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE access_transactions_log 
ADD CONSTRAINT fk_access_transactions_log_to_user 
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key constraints for access_control_log
ALTER TABLE access_control_log 
ADD CONSTRAINT fk_access_control_log_access_right 
    FOREIGN KEY (access_right_id) REFERENCES access_rights(id) ON DELETE CASCADE;

ALTER TABLE access_control_log 
ADD CONSTRAINT fk_access_control_log_access_point 
    FOREIGN KEY (access_point_id) REFERENCES access_points(id) ON DELETE SET NULL;

ALTER TABLE access_control_log 
ADD CONSTRAINT fk_access_control_log_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE access_control_log 
ADD CONSTRAINT fk_access_control_log_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT;

-- Foreign key constraints for pricing_rules (MODIFIÉES avec organisateur)
ALTER TABLE pricing_rules 
ADD CONSTRAINT fk_pricing_rules_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE;

-- Foreign key constraints for event_ticket_config (MODIFIÉES avec organisateur)
ALTER TABLE event_ticket_config 
ADD CONSTRAINT fk_event_ticket_config_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_ticket_config 
ADD CONSTRAINT fk_event_ticket_config_ticket_type 
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE CASCADE;

ALTER TABLE event_ticket_config 
ADD CONSTRAINT fk_event_ticket_config_zone 
    FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE;

ALTER TABLE event_ticket_config 
ADD CONSTRAINT fk_event_ticket_config_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE SET NULL;

-- Foreign key constraints for zone_mapping_overrides
ALTER TABLE zone_mapping_overrides 
ADD CONSTRAINT fk_zone_mapping_overrides_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE zone_mapping_overrides 
ADD CONSTRAINT fk_zone_mapping_overrides_zone 
    FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE;

-- Foreign key constraints for blacklist (MODIFIÉES avec organisateur)
ALTER TABLE blacklist 
ADD CONSTRAINT fk_blacklist_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE blacklist 
ADD CONSTRAINT fk_blacklist_target_event 
    FOREIGN KEY (target_event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE blacklist 
ADD CONSTRAINT fk_blacklist_target_venue 
    FOREIGN KEY (target_venue_id) REFERENCES venues(id) ON DELETE CASCADE;

ALTER TABLE blacklist 
ADD CONSTRAINT fk_blacklist_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE;

-- Check constraints for subscription_plans
ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_subscription_plans_price 
    CHECK (price >= 0);

ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_subscription_plans_currency 
    CHECK (LENGTH(currency) = 3);

ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_subscription_plans_dates 
    CHECK (valid_until >= valid_from);

ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_subscription_plans_sale_dates 
    CHECK (sale_end_date IS NULL OR sale_start_date IS NULL OR sale_end_date >= sale_start_date);

ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_subscription_plans_max_subscribers 
    CHECK (max_subscribers IS NULL OR max_subscribers > 0);

ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_subscription_plans_current_subscribers 
    CHECK (current_subscribers >= 0);

ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_subscription_plans_subscribers_consistency 
    CHECK (max_subscribers IS NULL OR current_subscribers <= max_subscribers);

ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_subscription_plans_max_transfers 
    CHECK (max_transfers >= 0);

-- Unique constraints for subscription_plans
ALTER TABLE subscription_plans 
ADD CONSTRAINT uk_subscription_plans_code UNIQUE (code);

-- Check constraints for subscription_plan_zones
ALTER TABLE subscription_plan_zones 
ADD CONSTRAINT chk_subscription_plan_zones_price_override 
    CHECK (price_override IS NULL OR price_override >= 0);

ALTER TABLE subscription_plan_zones 
ADD CONSTRAINT chk_subscription_plan_zones_priority 
    CHECK (priority_level >= 0);

-- Unique constraints for subscription_plan_zones
ALTER TABLE subscription_plan_zones 
ADD CONSTRAINT uk_subscription_plan_zones 
    UNIQUE (subscription_plan_id, zone_id);

-- Check constraints for subscriptions
ALTER TABLE subscriptions 
ADD CONSTRAINT chk_subscriptions_dates 
    CHECK (end_date >= start_date);

ALTER TABLE subscriptions 
ADD CONSTRAINT chk_subscriptions_price 
    CHECK (price_paid >= 0);

ALTER TABLE subscriptions 
ADD CONSTRAINT chk_subscriptions_currency 
    CHECK (LENGTH(currency) = 3);

ALTER TABLE subscriptions 
ADD CONSTRAINT chk_subscriptions_transfers_used 
    CHECK (transfers_used >= 0);

-- Unique constraints for subscriptions
ALTER TABLE subscriptions 
ADD CONSTRAINT uk_subscriptions_number UNIQUE (subscription_number);

-- Check constraints for ticket_types
ALTER TABLE ticket_types 
ADD CONSTRAINT chk_ticket_types_price 
    CHECK (base_price >= 0);

ALTER TABLE ticket_types 
ADD CONSTRAINT chk_ticket_types_currency 
    CHECK (LENGTH(currency) = 3);

ALTER TABLE ticket_types 
ADD CONSTRAINT chk_ticket_types_max_quantity 
    CHECK (max_quantity_per_order IS NULL OR max_quantity_per_order > 0);

ALTER TABLE ticket_types 
ADD CONSTRAINT chk_ticket_types_dates 
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from);

-- Unique constraints for ticket_types
ALTER TABLE ticket_types 
ADD CONSTRAINT uk_ticket_types_code UNIQUE (code);

-- Check constraints for tickets
ALTER TABLE tickets 
ADD CONSTRAINT chk_tickets_price 
    CHECK (price_paid >= 0);

ALTER TABLE tickets 
ADD CONSTRAINT chk_tickets_currency 
    CHECK (LENGTH(currency) = 3);

-- Unique constraints for tickets
ALTER TABLE tickets 
ADD CONSTRAINT uk_tickets_number UNIQUE (ticket_number);

-- Check constraints for access_rights
ALTER TABLE access_rights 
ADD CONSTRAINT chk_access_rights_valid_dates 
    CHECK (valid_until >= valid_from);

ALTER TABLE access_rights 
ADD CONSTRAINT chk_access_rights_max_uses 
    CHECK (max_uses > 0);

ALTER TABLE access_rights 
ADD CONSTRAINT chk_access_rights_current_uses 
    CHECK (current_uses >= 0 AND current_uses <= max_uses);

ALTER TABLE access_rights 
ADD CONSTRAINT chk_access_rights_source_exclusive 
    CHECK ((subscription_id IS NOT NULL AND ticket_id IS NULL) OR 
           (subscription_id IS NULL AND ticket_id IS NOT NULL));

-- Unique constraints for access_rights
ALTER TABLE access_rights 
ADD CONSTRAINT uk_access_rights_qr_code UNIQUE (qr_code);

ALTER TABLE access_rights 
ADD CONSTRAINT uk_access_rights_access_code UNIQUE (access_code);

-- Check constraints for pricing_rules
ALTER TABLE pricing_rules 
ADD CONSTRAINT chk_pricing_rules_dates 
    CHECK (valid_until IS NULL OR valid_until >= valid_from);

ALTER TABLE pricing_rules 
ADD CONSTRAINT chk_pricing_rules_priority 
    CHECK (priority >= 0);

ALTER TABLE pricing_rules 
ADD CONSTRAINT chk_pricing_rules_max_applications 
    CHECK (max_applications IS NULL OR max_applications > 0);

-- Unique constraints for pricing_rules
ALTER TABLE pricing_rules 
ADD CONSTRAINT uk_pricing_rules_code UNIQUE (code);

-- Check constraints for event_ticket_config
ALTER TABLE event_ticket_config 
ADD CONSTRAINT chk_event_ticket_config_price_override 
    CHECK (price_override IS NULL OR price_override >= 0);

ALTER TABLE event_ticket_config 
ADD CONSTRAINT chk_event_ticket_config_quantities 
    CHECK (available_quantity IS NULL OR available_quantity >= 0);

ALTER TABLE event_ticket_config 
ADD CONSTRAINT chk_event_ticket_config_sold_quantity 
    CHECK (sold_quantity >= 0);

ALTER TABLE event_ticket_config 
ADD CONSTRAINT chk_event_ticket_config_quantity_consistency 
    CHECK (available_quantity IS NULL OR sold_quantity <= available_quantity);

ALTER TABLE event_ticket_config 
ADD CONSTRAINT chk_event_ticket_config_purchase_quantities 
    CHECK (min_purchase_quantity >= 1 AND 
           (max_purchase_quantity IS NULL OR max_purchase_quantity >= min_purchase_quantity));

ALTER TABLE event_ticket_config 
ADD CONSTRAINT chk_event_ticket_config_sale_dates 
    CHECK (sale_end_date IS NULL OR sale_start_date IS NULL OR sale_end_date >= sale_start_date);

-- Unique constraints for event_ticket_config
ALTER TABLE event_ticket_config 
ADD CONSTRAINT uk_event_ticket_config 
    UNIQUE (event_id, ticket_type_id, zone_id);

-- Check constraints for zone_mapping_overrides
ALTER TABLE zone_mapping_overrides 
ADD CONSTRAINT chk_zone_mapping_overrides_capacity 
    CHECK (capacity_override IS NULL OR capacity_override >= 0);

ALTER TABLE zone_mapping_overrides 
ADD CONSTRAINT chk_zone_mapping_overrides_price 
    CHECK (price_override IS NULL OR price_override >= 0);

-- Unique constraints for zone_mapping_overrides
ALTER TABLE zone_mapping_overrides 
ADD CONSTRAINT uk_zone_mapping_overrides 
    UNIQUE (event_id, zone_id);

-- Check constraints for ticket_templates
ALTER TABLE ticket_templates 
ADD CONSTRAINT chk_ticket_templates_margins 
    CHECK (margin_top >= 0 AND margin_bottom >= 0 AND margin_left >= 0 AND margin_right >= 0);

-- Unique constraints for ticket_templates
ALTER TABLE ticket_templates 
ADD CONSTRAINT uk_ticket_templates_code UNIQUE (code);

-- Check constraints for blacklist
ALTER TABLE blacklist 
ADD CONSTRAINT chk_blacklist_valid_dates 
    CHECK (valid_until IS NULL OR valid_until >= valid_from);

ALTER TABLE blacklist 
ADD CONSTRAINT chk_blacklist_scope_target_consistency 
    CHECK (
        (scope = 'EVENT' AND target_event_id IS NOT NULL) OR
        (scope = 'VENUE' AND target_venue_id IS NOT NULL) OR
        (scope = 'ORGANIZER' AND organizer_id IS NOT NULL) OR
        (scope IN ('GLOBAL', 'CATEGORY', 'TEMPORAL'))
    );

-- Index uniques pour blacklist (remplace la contrainte UNIQUE avec COALESCE)
CREATE UNIQUE INDEX uk_blacklist_global 
    ON blacklist (type, value, scope) 
    WHERE scope = 'GLOBAL';

CREATE UNIQUE INDEX uk_blacklist_event 
    ON blacklist (type, value, scope, target_event_id) 
    WHERE scope = 'EVENT' AND target_event_id IS NOT NULL;

CREATE UNIQUE INDEX uk_blacklist_venue 
    ON blacklist (type, value, scope, target_venue_id) 
    WHERE scope = 'VENUE' AND target_venue_id IS NOT NULL;

CREATE UNIQUE INDEX uk_blacklist_organizer 
    ON blacklist (type, value, scope, organizer_id) 
    WHERE scope = 'ORGANIZER' AND organizer_id IS NOT NULL;

CREATE UNIQUE INDEX uk_blacklist_category_temporal 
    ON blacklist (type, value, scope) 
    WHERE scope IN ('CATEGORY', 'TEMPORAL');

-- =====================================================
-- MODULE 5: PAYMENTS & BILLING - CONSTRAINTS (MODIFIÉES)
-- =====================================================

-- Foreign key constraints for orders (MODIFIÉES avec organisateur)
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_primary_organizer 
    FOREIGN KEY (primary_organizer_id) REFERENCES organizers(id) ON DELETE SET NULL;

-- Foreign key constraints for order_items
ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_order 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_subscription_plan 
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;

ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_ticket_type 
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE SET NULL;

ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_event 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Foreign key constraints for payments (MODIFIÉES avec organisateur)
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_order 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_method 
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_primary_organizer 
    FOREIGN KEY (primary_organizer_id) REFERENCES organizers(id) ON DELETE SET NULL;

-- Foreign key constraints for payment_attempts
ALTER TABLE payment_attempts 
ADD CONSTRAINT fk_payment_attempts_payment 
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE;

-- Foreign key constraints for refunds
ALTER TABLE refunds 
ADD CONSTRAINT fk_refunds_payment 
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT;

ALTER TABLE refunds 
ADD CONSTRAINT fk_refunds_order 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE refunds 
ADD CONSTRAINT fk_refunds_requested_by 
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE refunds 
ADD CONSTRAINT fk_refunds_approved_by 
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key constraints for organizer_commissions (MODIFIÉES)
ALTER TABLE organizer_commissions 
ADD CONSTRAINT fk_organizer_commissions_payment 
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT;

ALTER TABLE organizer_commissions 
ADD CONSTRAINT fk_organizer_commissions_order 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE organizer_commissions 
ADD CONSTRAINT fk_organizer_commissions_organizer 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

-- Foreign key constraints for payment_webhooks
ALTER TABLE payment_webhooks 
ADD CONSTRAINT fk_payment_webhooks_payment 
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- Check constraints for payment_methods
ALTER TABLE payment_methods 
ADD CONSTRAINT chk_payment_methods_amounts 
    CHECK (min_amount >= 0 AND (max_amount IS NULL OR max_amount >= min_amount));

ALTER TABLE payment_methods 
ADD CONSTRAINT chk_payment_methods_fees 
    CHECK (processing_fee_fixed >= 0 AND processing_fee_percent >= 0);

ALTER TABLE payment_methods 
ADD CONSTRAINT chk_payment_methods_order 
    CHECK (display_order >= 0);

-- Unique constraints for payment_methods
ALTER TABLE payment_methods 
ADD CONSTRAINT uk_payment_methods_code UNIQUE (code);

-- Check constraints for orders
ALTER TABLE orders 
ADD CONSTRAINT chk_orders_amounts 
    CHECK (subtotal_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND 
           processing_fee >= 0 AND total_amount >= 0);

ALTER TABLE orders 
ADD CONSTRAINT chk_orders_currency 
    CHECK (LENGTH(currency) = 3);

ALTER TABLE orders 
ADD CONSTRAINT chk_orders_guest_required 
    CHECK ((user_id IS NOT NULL) OR 
           (user_id IS NULL AND guest_name IS NOT NULL AND guest_email IS NOT NULL));

ALTER TABLE orders 
ADD CONSTRAINT chk_orders_guest_email_format 
    CHECK (guest_email IS NULL OR guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Unique constraints for orders
ALTER TABLE orders 
ADD CONSTRAINT uk_orders_number UNIQUE (order_number);

-- Check constraints for order_items
ALTER TABLE order_items 
ADD CONSTRAINT chk_order_items_quantity 
    CHECK (quantity > 0);

ALTER TABLE order_items 
ADD CONSTRAINT chk_order_items_amounts 
    CHECK (unit_price >= 0 AND discount_amount >= 0 AND total_price >= 0);

ALTER TABLE order_items 
ADD CONSTRAINT chk_order_items_currency 
    CHECK (LENGTH(currency) = 3);

ALTER TABLE order_items 
ADD CONSTRAINT chk_order_items_source_exclusive 
    CHECK ((subscription_plan_id IS NOT NULL)::INTEGER + 
           (ticket_type_id IS NOT NULL)::INTEGER + 
           (event_id IS NOT NULL)::INTEGER = 1);

-- Check constraints for payments
ALTER TABLE payments 
ADD CONSTRAINT chk_payments_amounts 
    CHECK (amount >= 0 AND processing_fee >= 0 AND net_amount >= 0);

ALTER TABLE payments 
ADD CONSTRAINT chk_payments_currency 
    CHECK (LENGTH(currency) = 3);

-- Unique constraints for payments
ALTER TABLE payments 
ADD CONSTRAINT uk_payments_number UNIQUE (payment_number);

ALTER TABLE payments 
ADD CONSTRAINT uk_payments_external_transaction 
    UNIQUE (external_transaction_id);

-- Check constraints for payment_attempts
ALTER TABLE payment_attempts 
ADD CONSTRAINT chk_payment_attempts_number 
    CHECK (attempt_number > 0);

ALTER TABLE payment_attempts 
ADD CONSTRAINT chk_payment_attempts_processing_time 
    CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0);

-- Check constraints for refunds
ALTER TABLE refunds 
ADD CONSTRAINT chk_refunds_amounts 
    CHECK (amount >= 0 AND processing_fee >= 0 AND net_refund_amount >= 0);

-- Unique constraints for refunds
ALTER TABLE refunds 
ADD CONSTRAINT uk_refunds_number UNIQUE (refund_number);

-- Check constraints for organizer_commissions
ALTER TABLE organizer_commissions 
ADD CONSTRAINT chk_organizer_commissions_amounts 
    CHECK (base_amount >= 0 AND commission_amount >= 0 AND 
           platform_fee >= 0 AND net_to_organizer >= 0);

ALTER TABLE organizer_commissions 
ADD CONSTRAINT chk_organizer_commissions_rate 
    CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 1));

ALTER TABLE organizer_commissions 
ADD CONSTRAINT chk_organizer_commissions_currency 
    CHECK (LENGTH(currency) = 3);

ALTER TABLE organizer_commissions 
ADD CONSTRAINT chk_organizer_commissions_bonuses 
    CHECK (volume_bonus >= 0 AND loyalty_bonus >= 0);

-- Contrainte de cohérence pour les commissions
ALTER TABLE organizer_commissions 
ADD CONSTRAINT chk_organizer_commissions_calculation_consistency 
    CHECK (net_to_organizer = base_amount - commission_amount - platform_fee + volume_bonus + loyalty_bonus);

-- Check constraints for payment_webhooks
ALTER TABLE payment_webhooks 
ADD CONSTRAINT chk_payment_webhooks_processing_attempts 
    CHECK (processing_attempts >= 0);

-- Unique constraints for payment_webhooks
ALTER TABLE payment_webhooks 
ADD CONSTRAINT uk_payment_webhooks_id UNIQUE (webhook_id);

-- =====================================================
-- MODULE 6: SECURITY & AUDIT - CONSTRAINTS
-- =====================================================

-- Foreign key constraints for audit_logs
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key constraints for user_sessions
ALTER TABLE user_sessions 
ADD CONSTRAINT fk_user_sessions_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Foreign key constraints for login_attempts
ALTER TABLE login_attempts 
ADD CONSTRAINT fk_login_attempts_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key constraints for security_events
ALTER TABLE security_events 
ADD CONSTRAINT fk_security_events_target_user 
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key constraints for mfa_tokens
ALTER TABLE mfa_tokens 
ADD CONSTRAINT fk_mfa_tokens_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Check constraints for audit_logs
ALTER TABLE audit_logs 
ADD CONSTRAINT chk_audit_logs_table_name 
    CHECK (LENGTH(TRIM(table_name)) > 0);

-- Unique constraints for user_sessions
ALTER TABLE user_sessions 
ADD CONSTRAINT uk_user_sessions_token UNIQUE (session_token);

-- Check constraints for user_sessions
ALTER TABLE user_sessions 
ADD CONSTRAINT chk_user_sessions_expires 
    CHECK (expires_at > created_at);

-- Check constraints for login_attempts
ALTER TABLE login_attempts 
ADD CONSTRAINT chk_login_attempts_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Check constraints for security_events
ALTER TABLE security_events 
ADD CONSTRAINT chk_security_events_description 
    CHECK (LENGTH(TRIM(description)) > 0);

-- Check constraints for mfa_tokens
ALTER TABLE mfa_tokens 
ADD CONSTRAINT chk_mfa_tokens_expires 
    CHECK (expires_at > created_at);

-- Check constraints for rate_limiting
ALTER TABLE rate_limiting 
ADD CONSTRAINT chk_rate_limiting_requests_count 
    CHECK (requests_count > 0);

-- Check constraints for security_policies
ALTER TABLE security_policies 
ADD CONSTRAINT chk_security_policies_dates 
    CHECK (valid_until IS NULL OR valid_until >= valid_from);

-- Unique constraints for security_policies
ALTER TABLE security_policies 
ADD CONSTRAINT uk_security_policies_code UNIQUE (code);

-- =====================================================
-- CONTRAINTES COMPLEXES ET BUSINESS RULES AVANCÉES
-- =====================================================

-- Contrainte: Un utilisateur ne peut avoir qu'un seul abonnement actif par organisateur
CREATE UNIQUE INDEX uk_subscriptions_user_organizer_active 
    ON subscriptions (user_id, organizer_id) 
    WHERE status = 'ACTIVE';

-- Contrainte: Un organisateur ne peut pas être propriétaire ET gestionnaire du même venue
ALTER TABLE venues 
ADD CONSTRAINT chk_venues_owner_manager_different 
    CHECK (primary_owner_id IS NULL OR primary_manager_id IS NULL OR primary_owner_id != primary_manager_id);

-- Contrainte: Les tokens MFA expirés ne peuvent pas être marqués comme non utilisés
ALTER TABLE mfa_tokens 
ADD CONSTRAINT chk_mfa_tokens_expired_must_be_used 
    CHECK (expires_at > NOW() OR is_used = TRUE);

-- Contrainte: Les blacklists globales ne peuvent pas avoir de cible spécifique
ALTER TABLE blacklist 
ADD CONSTRAINT chk_blacklist_global_no_targets 
    CHECK (scope != 'GLOBAL' OR 
           (target_event_id IS NULL AND target_venue_id IS NULL AND organizer_id IS NULL));

-- =====================================================
-- INDEX UNIQUE COMPOSITES COMPLEXES
-- =====================================================

-- Index unique: Un organisateur ne peut avoir qu'une seule relation de type OWNER par venue
CREATE UNIQUE INDEX uk_venue_organizer_relations_owner_per_venue 
ON venue_organizer_relations (venue_id) 
WHERE relation_type = 'OWNER' AND is_active = TRUE;

-- Index unique: Un organisateur ne peut avoir qu'une seule relation de type MANAGER par venue
CREATE UNIQUE INDEX uk_venue_organizer_relations_manager_per_venue 
ON venue_organizer_relations (venue_id) 
WHERE relation_type = 'MANAGER' AND is_active = TRUE;

-- Index unique: Un utilisateur ne peut avoir qu'une session active par device
CREATE UNIQUE INDEX uk_user_sessions_active_per_device 
ON user_sessions (user_id, device_fingerprint) 
WHERE is_active = TRUE AND device_fingerprint IS NOT NULL;

-- Index unique: Une place ne peut être associée qu'à un seul droit d'accès valide par événement
CREATE UNIQUE INDEX uk_access_rights_seat_event_valid 
ON access_rights (seat_id, event_id) 
WHERE status = 'VALID' AND seat_id IS NOT NULL;

-- Index unique: Une zone ne peut avoir qu'une seule configuration active par type de billet et événement
CREATE UNIQUE INDEX uk_event_ticket_config_zone_type_active 
ON event_ticket_config (event_id, zone_id, ticket_type_id) 
WHERE is_active = TRUE;

-- =====================================================
-- VALIDATION ET VÉRIFICATION
-- =====================================================

-- Vérifier que toutes les contraintes ont été créées
SELECT 
    schemaname,
    tablename,
    constraintname,
    constrainttype
FROM (
    SELECT 
        n.nspname as schemaname,
        t.relname as tablename,
        c.conname as constraintname,
        CASE c.contype
            WHEN 'f' THEN 'FOREIGN KEY'
            WHEN 'p' THEN 'PRIMARY KEY'
            WHEN 'u' THEN 'UNIQUE'
            WHEN 'c' THEN 'CHECK'
            WHEN 'x' THEN 'EXCLUDE'
        END as constrainttype
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND t.relname IN (
        'users', 'user_profiles', 'roles', 'groups', 'user_roles', 'user_groups',
        'organizers', 'venue_organizer_relations',
        'participants', 'participant_staff', 'participant_relationships',
        'event_categories', 'event_groups', 'events', 'event_participants',
        'venues', 'venue_mappings', 'venue_zones', 'seats', 'access_points',
        'subscription_plans', 'subscriptions', 'ticket_types', 'tickets', 'access_rights',
        'orders', 'order_items', 'payments', 'organizer_commissions',
        'blacklist', 'audit_logs', 'user_sessions'
    )
) constraints_list
ORDER BY tablename, constrainttype, constraintname;

-- Compter les contraintes par type
SELECT 
    constrainttype,
    COUNT(*) as count
FROM (
    SELECT 
        CASE c.contype
            WHEN 'f' THEN 'FOREIGN KEY'
            WHEN 'p' THEN 'PRIMARY KEY'
            WHEN 'u' THEN 'UNIQUE'
            WHEN 'c' THEN 'CHECK'
            WHEN 'x' THEN 'EXCLUDE'
        END as constrainttype
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
) constraint_types
GROUP BY constrainttype
ORDER BY constrainttype;

-- Message de confirmation
SELECT 
    'Contraintes Entrix V2.1 appliquées avec succès!' as status,
    'Toutes les FK, CHECK et UNIQUE constraints incluant organisateurs' as details,
    'Référentiel sécurisé et cohérent' as result;

-- =====================================================
-- FIN DU FICHIER 03_entrix_constraints_v2.1.sql
-- =====================================================