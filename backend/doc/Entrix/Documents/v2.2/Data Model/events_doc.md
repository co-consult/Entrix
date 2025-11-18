# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Gestion des Événements

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel constitue le cœur métier d'Entrix : la gestion complète des événements de leur création à leur archivage. Il gère tous les types d'événements (sports, culture, business) avec leurs spécificités et cycles de vie.

### Principes de conception
- **Flexibilité maximale** : Support de tous types d'événements
- **Cycle de vie complet** : De la planification au post-événement
- **Gestion multi-dates** : Événements récurrents et séries
- **Configuration dynamique** : Adaptation selon contexte

---

## 🎪 Table `events` - Événements principaux

**Description** : Table centrale de tous les événements organisés sur la plateforme, de la conférence au match de football.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur principal |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | Lieu événement |
| `parent_event_id` | UUID | NULL, FK | - | Événement parent si série |
| `event_series_id` | UUID | NULL, FK | - | Série d'événements |
| `event_group_id` | UUID | NULL, FK | - | Groupe d'événements |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | - | Slug URL unique |
| `name` | VARCHAR(300) | NOT NULL | - | Nom événement |
| `display_name` | VARCHAR(300) | NULL | - | Nom d'affichage |
| `subtitle` | VARCHAR(500) | NULL | - | Sous-titre |
| `description` | TEXT | NOT NULL | - | Description complète |
| `short_description` | VARCHAR(1000) | NULL | - | Description courte |
| `type` | ENUM | NOT NULL | - | Type événement |
| `category` | ENUM | NOT NULL | - | Catégorie principale |
| `subcategory` | VARCHAR(100) | NULL | - | Sous-catégorie |
| `format` | ENUM | NOT NULL | - | Format événement |
| `status` | ENUM | NOT NULL | 'DRAFT' | Statut événement |
| `visibility` | ENUM | NOT NULL | 'PUBLIC' | Visibilité |
| `language` | VARCHAR(5) | NOT NULL | 'fr-TN' | Langue principale |
| `additional_languages` | VARCHAR(5)[] | NULL | - | Langues additionnelles |
| `scheduled_start` | TIMESTAMPTZ | NOT NULL | - | Début programmé |
| `scheduled_end` | TIMESTAMPTZ | NOT NULL | - | Fin programmée |
| `actual_start` | TIMESTAMPTZ | NULL | - | Début réel |
| `actual_end` | TIMESTAMPTZ | NULL | - | Fin réelle |
| `doors_open` | TIMESTAMPTZ | NULL | - | Ouverture portes |
| `check_in_start` | TIMESTAMPTZ | NULL | - | Début check-in |
| `timezone` | VARCHAR(50) | NOT NULL | 'Africa/Tunis' | Fuseau horaire |
| `duration_minutes` | INTEGER | NULL | - | Durée estimée (min) |
| `is_recurring` | BOOLEAN | NOT NULL | FALSE | Événement récurrent |
| `recurrence_pattern` | JSONB | NULL | - | Modèle récurrence |
| `age_restriction` | JSONB | NULL | - | Restrictions âge |
| `dress_code` | VARCHAR(100) | NULL | - | Code vestimentaire |
| `weather_dependency` | ENUM | NULL | - | Dépendance météo |
| `capacity_total` | INTEGER | NULL | - | Capacité totale |
| `capacity_current` | INTEGER | DEFAULT 0 | 0 | Places vendues |
| `capacity_reserved` | INTEGER | DEFAULT 0 | 0 | Places réservées |
| `waitlist_enabled` | BOOLEAN | NOT NULL | FALSE | Liste d'attente |
| `waitlist_size` | INTEGER | DEFAULT 0 | 0 | Taille liste attente |
| `ticket_sales_start` | TIMESTAMPTZ | NULL | - | Début ventes |
| `ticket_sales_end` | TIMESTAMPTZ | NULL | - | Fin ventes |
| `early_bird_end` | TIMESTAMPTZ | NULL | - | Fin tarif réduit |
| `refund_policy` | ENUM | NOT NULL | 'STANDARD' | Politique remboursement |
| `transfer_policy` | ENUM | NOT NULL | 'ALLOWED' | Politique transfert |
| `cancellation_policy` | TEXT | NULL | - | Politique annulation |
| `terms_conditions` | TEXT | NULL | - | Conditions participation |
| `special_instructions` | TEXT | NULL | - | Instructions spéciales |
| `accessibility_info` | JSONB | NULL | - | Infos accessibilité |
| `parking_info` | JSONB | NULL | - | Infos parking |
| `public_transport_info` | JSONB | NULL | - | Infos transport public |
| `what_to_bring` | TEXT[] | NULL | - | À apporter |
| `prohibited_items` | TEXT[] | NULL | - | Objets interdits |
| `featured_image_url` | TEXT | NULL | - | Image principale |
| `cover_image_url` | TEXT | NULL | - | Image couverture |
| `gallery_urls` | TEXT[] | NULL | - | Galerie photos |
| `video_urls` | TEXT[] | NULL | - | Vidéos |
| `livestream_url` | TEXT | NULL | - | URL diffusion live |
| `website_url` | TEXT | NULL | - | Site web événement |
| `social_media` | JSONB | NULL | - | Réseaux sociaux |
| `hashtags` | TEXT[] | NULL | - | Hashtags |
| `tags` | TEXT[] | NULL | - | Tags événement |
| `seo_title` | VARCHAR(200) | NULL | - | Titre SEO |
| `seo_description` | VARCHAR(500) | NULL | - | Description SEO |
| `seo_keywords` | TEXT[] | NULL | - | Mots-clés SEO |
| `pricing_info` | JSONB | NULL | - | Infos tarification |
| `sponsors` | JSONB | NULL | - | Sponsors |
| `partners` | JSONB | NULL | - | Partenaires |
| `media_partners` | JSONB | NULL | - | Partenaires médias |
| `contact_info` | JSONB | NULL | - | Informations contact |
| `technical_requirements` | JSONB | NULL | - | Exigences techniques |
| `covid_measures` | JSONB | NULL | - | Mesures sanitaires |
| `insurance_required` | BOOLEAN | NOT NULL | FALSE | Assurance obligatoire |
| `recording_allowed` | BOOLEAN | NOT NULL | TRUE | Enregistrement autorisé |
| `photography_allowed` | BOOLEAN | NOT NULL | TRUE | Photo autorisée |
| `food_drinks_policy` | ENUM | NOT NULL | 'ALLOWED' | Politique nourriture |
| `smoking_policy` | ENUM | NOT NULL | 'PROHIBITED' | Politique tabac |
| `alcohol_policy` | ENUM | NOT NULL | 'RESTRICTED' | Politique alcool |
| `is_featured` | BOOLEAN | NOT NULL | FALSE | Événement vedette |
| `is_verified` | BOOLEAN | NOT NULL | FALSE | Événement vérifié |
| `is_premium` | BOOLEAN | NOT NULL | FALSE | Événement premium |
| `priority_level` | INTEGER | DEFAULT 0 | 0 | Niveau priorité |
| `quality_score` | DECIMAL(4,2) | NULL | - | Score qualité |
| `popularity_score` | DECIMAL(8,2) | DEFAULT 0 | 0 | Score popularité |
| `rating_overall` | DECIMAL(3,2) | NULL | - | Note globale |
| `rating_organization` | DECIMAL(3,2) | NULL | - | Note organisation |
| `rating_venue` | DECIMAL(3,2) | NULL | - | Note lieu |
| `rating_value` | DECIMAL(3,2) | NULL | - | Note rapport qualité/prix |
| `total_ratings` | INTEGER | DEFAULT 0 | 0 | Nombre évaluations |
| `total_revenue` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | Revenus totaux |
| `total_attendees` | INTEGER | DEFAULT 0 | 0 | Total participants |
| `no_show_count` | INTEGER | DEFAULT 0 | 0 | Nombre absents |
| `cancellation_count` | INTEGER | DEFAULT 0 | 0 | Annulations |
| `refund_amount` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | Montant remboursé |
| `created_by` | UUID | NOT NULL, FK | - | Créé par |
| `approved_by` | UUID | NULL, FK | - | Approuvé par |
| `approved_at` | TIMESTAMPTZ | NULL | - | Date approbation |
| `published_at` | TIMESTAMPTZ | NULL | - | Date publication |
| `cancelled_at` | TIMESTAMPTZ | NULL | - | Date annulation |
| `cancellation_reason` | TEXT | NULL | - | Raison annulation |
| `archived_at` | TIMESTAMPTZ | NULL | - | Date archivage |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `type`
- `SPORTS_MATCH` : Match sportif
- `SPORTS_TOURNAMENT` : Tournoi sportif
- `CONCERT` : Concert
- `THEATER` : Théâtre
- `DANCE` : Spectacle danse
- `COMEDY` : Spectacle humour
- `CONFERENCE` : Conférence
- `WORKSHOP` : Atelier
- `SEMINAR` : Séminaire
- `EXHIBITION` : Exposition
- `FESTIVAL` : Festival
- `FAIR` : Foire/salon
- `COMPETITION` : Compétition
- `CEREMONY` : Cérémonie
- `PARTY` : Fête/soirée
- `NETWORKING` : Événement réseau
- `CHARITY` : Événement caritatif
- `EDUCATIONAL` : Éducatif
- `RELIGIOUS` : Religieux
- `CULTURAL` : Culturel
- `BUSINESS` : Business
- `COMMUNITY` : Communautaire
- `FAMILY` : Familial
- `KIDS` : Enfants
- `VIRTUAL` : Virtuel
- `HYBRID` : Hybride
- `OTHER` : Autre

#### `category`
- `SPORTS` : Sports
- `MUSIC` : Musique
- `ARTS_CULTURE` : Arts et culture
- `BUSINESS` : Business
- `EDUCATION` : Éducation
- `TECHNOLOGY` : Technologie
- `HEALTH_WELLNESS` : Santé bien-être
- `FOOD_DRINK` : Gastronomie
- `TRAVEL` : Voyage
- `FASHION` : Mode
- `AUTOMOTIVE` : Automobile
- `REAL_ESTATE` : Immobilier
- `FINANCE` : Finance
- `POLITICS` : Politique
- `CHARITY` : Caritatif
- `RELIGION` : Religion
- `COMMUNITY` : Communauté
- `FAMILY` : Famille
- `DATING` : Rencontres
- `HOBBIES` : Loisirs
- `OTHER` : Autre

#### `format`
- `IN_PERSON` : Présentiel
- `VIRTUAL` : Virtuel
- `HYBRID` : Hybride
- `OUTDOOR` : Extérieur
- `INDOOR` : Intérieur
- `POPUP` : Éphémère
- `TOURING` : Tournée
- `BROADCAST` : Diffusion
- `INTERACTIVE` : Interactif
- `IMMERSIVE` : Immersif

#### `status`
- `DRAFT` : Brouillon
- `PENDING_REVIEW` : En cours révision
- `PENDING_APPROVAL` : En attente approbation
- `APPROVED` : Approuvé
- `PUBLISHED` : Publié
- `TICKET_SALES_OPEN` : Ventes ouvertes
- `TICKET_SALES_CLOSED` : Ventes fermées
- `SOLD_OUT` : Complet
- `CANCELLED` : Annulé
- `POSTPONED` : Reporté
- `RESCHEDULED` : Reprogrammé
- `IN_PROGRESS` : En cours
- `COMPLETED` : Terminé
- `ARCHIVED` : Archivé

#### `visibility`
- `PUBLIC` : Public
- `PRIVATE` : Privé
- `MEMBERS_ONLY` : Membres uniquement
- `INVITE_ONLY` : Sur invitation
- `UNLISTED` : Non listé
- `COMING_SOON` : Bientôt disponible

#### `weather_dependency`
- `NONE` : Aucune
- `LIGHT` : Légère
- `MODERATE` : Modérée
- `HIGH` : Élevée
- `CRITICAL` : Critique

#### `refund_policy`
- `NO_REFUNDS` : Aucun remboursement
- `STRICT` : Strict (frais)
- `MODERATE` : Modéré
- `FLEXIBLE` : Flexible
- `FULL_REFUND` : Remboursement intégral

#### `transfer_policy`
- `NOT_ALLOWED` : Interdit
- `RESTRICTED` : Restreint
- `ALLOWED` : Autorisé
- `FREE_TRANSFER` : Transfert gratuit

#### `food_drinks_policy`
- `PROHIBITED` : Interdit
- `RESTRICTED` : Restreint
- `ALLOWED` : Autorisé
- `PROVIDED` : Fourni

#### `smoking_policy`
- `PROHIBITED` : Interdit
- `DESIGNATED_AREAS` : Zones désignées
- `OUTDOOR_ONLY` : Extérieur uniquement

#### `alcohol_policy`
- `PROHIBITED` : Interdit
- `RESTRICTED` : Restreint (âge)
- `LICENSED_AREAS` : Zones autorisées
- `FULL_BAR` : Bar complet

### Structure JSONB détaillées

#### `recurrence_pattern`
```json
{
  "type": "WEEKLY",
  "interval": 1,
  "days_of_week": ["TUESDAY", "THURSDAY"],
  "end_date": "2025-06-30",
  "max_occurrences": 20,
  "exceptions": ["2025-04-15", "2025-05-01"],
  "time_adjustments": {
    "2025-04-22": {"start": "19:00", "end": "21:30"}
  }
}
```

#### `age_restriction`
```json
{
  "minimum_age": 18,
  "maximum_age": null,
  "require_id": true,
  "parental_consent_age": 16,
  "guardian_required_under": 12,
  "age_verification_method": "ID_CHECK",
  "special_conditions": "Mineurs accompagnés uniquement"
}
```

#### `accessibility_info`
```json
{
  "wheelchair_accessible": true,
  "hearing_assistance": {
    "available": true,
    "type": "INDUCTION_LOOP",
    "advance_booking": true
  },
  "visual_assistance": {
    "audio_description": true,
    "large_print": true,
    "braille": false
  },
  "mobility": {
    "accessible_parking": 15,
    "accessible_entrance": "Entrée principale",
    "accessible_restrooms": true,
    "elevator_access": true
  },
  "service_animals": "welcome",
  "assistance_available": true,
  "contact": "accessibility@venue.tn"
}
```

#### `pricing_info`
```json
{
  "currency": "TND",
  "price_range": {
    "min": 25.00,
    "max": 150.00
  },
  "early_bird": {
    "discount_percent": 20,
    "valid_until": "2024-11-15T23:59:59Z"
  },
  "group_discounts": {
    "10_plus": 10,
    "25_plus": 15,
    "50_plus": 20
  },
  "student_discount": 25,
  "senior_discount": 15,
  "payment_plans": true,
  "refund_fee": 5.00,
  "transfer_fee": 2.00
}
```

---

## 📅 Table `event_series` - Séries d'événements

**Description** : Regroupement d'événements liés (championnat, saison théâtrale, cycle conférences).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur principal |
| `name` | VARCHAR(300) | NOT NULL | - | Nom série |
| `description` | TEXT | NULL | - | Description série |
| `type` | ENUM | NOT NULL | - | Type série |
| `status` | ENUM | NOT NULL | 'PLANNING' | Statut série |
| `season` | VARCHAR(50) | NULL | - | Saison (2024-2025) |
| `year` | INTEGER | NULL | - | Année |
| `start_date` | DATE | NOT NULL | - | Date début |
| `end_date` | DATE | NOT NULL | - | Date fin |
| `total_events_planned` | INTEGER | NULL | - | Événements prévus |
| `total_events_completed` | INTEGER | DEFAULT 0 | 0 | Événements terminés |
| `featured_image_url` | TEXT | NULL | - | Image série |
| `logo_url` | TEXT | NULL | - | Logo série |
| `website_url` | TEXT | NULL | - | Site web |
| `sponsors` | JSONB | NULL | - | Sponsors série |
| `prizes` | JSONB | NULL | - | Prix/récompenses |
| `rules` | TEXT | NULL | - | Règlement |
| `ranking_system` | JSONB | NULL | - | Système classement |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Série active |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `type`
- `CHAMPIONSHIP` : Championnat
- `TOURNAMENT` : Tournoi
- `LEAGUE` : Ligue
- `SEASON` : Saison
- `FESTIVAL_SERIES` : Série festivals
- `CONFERENCE_SERIES` : Série conférences
- `WORKSHOP_SERIES` : Série ateliers
- `CONCERT_SERIES` : Série concerts
- `EXHIBITION_SERIES` : Série expositions
- `EDUCATIONAL_PROGRAM` : Programme éducatif

#### `status`
- `PLANNING` : Planification
- `ANNOUNCED` : Annoncée
- `REGISTRATION_OPEN` : Inscriptions ouvertes
- `IN_PROGRESS` : En cours
- `COMPLETED` : Terminée
- `CANCELLED` : Annulée
- `SUSPENDED` : Suspendue

---

## 👥 Table `event_groups` - Groupes d'événements

**Description** : Regroupements thématiques ou organisationnels d'événements (festival multi-sites, événements partenaires).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `name` | VARCHAR(300) | NOT NULL | - | Nom groupe |
| `description` | TEXT | NULL | - | Description groupe |
| `type` | ENUM | NOT NULL | - | Type groupement |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur principal |
| `partner_organizers` | UUID[] | NULL | - | Organisateurs partenaires |
| `start_date` | DATE | NOT NULL | - | Date début |
| `end_date` | DATE | NOT NULL | - | Date fin |
| `total_events` | INTEGER | DEFAULT 0 | 0 | Nombre événements |
| `featured_image_url` | TEXT | NULL | - | Image groupe |
| `website_url` | TEXT | NULL | - | Site web |
| `hashtag` | VARCHAR(100) | NULL | - | Hashtag principal |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Groupe actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM `type`

- `FESTIVAL` : Festival multi-événements
- `CONFERENCE` : Conférence multi-sessions
- `EXHIBITION` : Exposition multi-sites
- `TOURNAMENT` : Tournoi multi-étapes
- `PARTNERSHIP` : Événements partenaires
- `THEMED_SERIES` : Série thématique
- `MULTI_VENUE` : Multi-lieux
- `COLLABORATIVE` : Collaboratif

---

## ⚙️ Table `event_configurations` - Configurations événements

**Description** : Paramètres spécifiques et configurations techniques pour chaque événement.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `event_id` | UUID | PRIMARY KEY, FK | - | Référence événement |
| `timezone_handling` | ENUM | NOT NULL | 'LOCAL' | Gestion fuseau horaire |
| `check_in_settings` | JSONB | NULL | - | Paramètres check-in |
| `access_control` | JSONB | NULL | - | Contrôle d'accès |
| `capacity_management` | JSONB | NULL | - | Gestion capacité |
| `pricing_rules` | JSONB | NULL | - | Règles tarification |
| `notification_settings` | JSONB | NULL | - | Paramètres notifications |
| `integration_settings` | JSONB | NULL | - | Paramètres intégrations |
| `analytics_settings` | JSONB | NULL | - | Paramètres analytics |
| `security_settings` | JSONB | NULL | - | Paramètres sécurité |
| `broadcast_settings` | JSONB | NULL | - | Paramètres diffusion |
| `merchandising_settings` | JSONB | NULL | - | Paramètres merchandising |
| `social_media_settings` | JSONB | NULL | - | Paramètres réseaux sociaux |
| `feedback_settings` | JSONB | NULL | - | Paramètres feedback |
| `archive_settings` | JSONB | NULL | - | Paramètres archivage |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### `timezone_handling`
- `LOCAL` : Fuseau local lieu
- `ORGANIZER` : Fuseau organisateur
- `UTC` : UTC
- `ATTENDEE` : Fuseau participant

---

## 📊 Table `event_analytics` - Analytics événements

**Description** : Métriques et analytics détaillées pour chaque événement.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `event_id` | UUID | PRIMARY KEY, FK | - | Référence événement |
| `page_views` | INTEGER | DEFAULT 0 | 0 | Vues page événement |
| `unique_visitors` | INTEGER | DEFAULT 0 | 0 | Visiteurs uniques |
| `social_shares` | JSONB | NULL | - | Partages réseaux sociaux |
| `ticket_sales_progression` | JSONB | NULL | - | Progression ventes |
| `demographic_data` | JSONB | NULL | - | Données démographiques |
| `geographic_data` | JSONB | NULL | - | Données géographiques |
| `referral_sources` | JSONB | NULL | - | Sources de trafic |
| `conversion_metrics` | JSONB | NULL | - | Métriques conversion |
| `engagement_metrics` | JSONB | NULL | - | Métriques engagement |
| `revenue_breakdown` | JSONB | NULL | - | Répartition revenus |
| `attendance_patterns` | JSONB | NULL | - | Patterns participation |
| `feedback_summary` | JSONB | NULL | - | Résumé feedback |
| `last_calculated` | TIMESTAMPTZ | NULL | - | Dernier calcul |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Événements ↔ Organisateurs
ALTER TABLE events 
ADD CONSTRAINT fk_events_organizer 
FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

-- Événements ↔ Lieux
ALTER TABLE events 
ADD CONSTRAINT fk_events_venue 
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT;

-- Événements ↔ Événements parents
ALTER TABLE events 
ADD CONSTRAINT fk_events_parent 
FOREIGN KEY (parent_event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Événements ↔ Séries
ALTER TABLE events 
ADD CONSTRAINT fk_events_series 
FOREIGN KEY (event_series_id) REFERENCES event_series(id) ON DELETE SET NULL;

-- Événements ↔ Groupes
ALTER TABLE events 
ADD CONSTRAINT fk_events_group 
FOREIGN KEY (event_group_id) REFERENCES event_groups(id) ON DELETE SET NULL;

-- Séries ↔ Organisateurs
ALTER TABLE event_series 
ADD CONSTRAINT fk_series_organizer 
FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

-- Configurations ↔ Événements
ALTER TABLE event_configurations 
ADD CONSTRAINT fk_configurations_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Analytics ↔ Événements
ALTER TABLE event_analytics 
ADD CONSTRAINT fk_analytics_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
```

### Contraintes de validation

```sql
-- Dates cohérentes
ALTER TABLE events ADD CONSTRAINT chk_event_dates_logic 
CHECK (scheduled_end > scheduled_start);

-- Capacité logique
ALTER TABLE events ADD CONSTRAINT chk_event_capacity_logic 
CHECK (
    capacity_current <= capacity_total AND 
    capacity_reserved <= capacity_total AND
    capacity_current >= 0 AND capacity_reserved >= 0
);

-- Ventes billets dans période événement
ALTER TABLE events ADD CONSTRAINT chk_ticket_sales_period 
CHECK (
    ticket_sales_start IS NULL OR ticket_sales_end IS NULL OR
    ticket_sales_end > ticket_sales_start
);

-- Slug format valide
ALTER TABLE events ADD CONSTRAINT chk_event_slug_format 
CHECK (slug ~* '^[a-z0-9-]+$' AND LENGTH(slug) >= 3);

-- Dates série cohérentes
ALTER TABLE event_series ADD CONSTRAINT chk_series_dates 
CHECK (end_date > start_date);

-- Événements dans période série
ALTER TABLE events ADD CONSTRAINT chk_event_in_series_period 
CHECK (
    event_series_id IS NULL OR 
    (scheduled_start >= (SELECT start_date FROM event_series WHERE id = event_series_id) AND
     scheduled_start <= (SELECT end_date FROM event_series WHERE id = event_series_id))
);
```

### Index de performance

```sql
-- Recherche événements publics par date
CREATE INDEX idx_events_public_scheduled ON events(
    scheduled_start, status, visibility
) WHERE visibility = 'PUBLIC' AND status IN ('PUBLISHED', 'TICKET_SALES_OPEN');

-- Recherche par organisateur
CREATE INDEX idx_events_organizer_date ON events(
    organizer_id, scheduled_start DESC, status
);

-- Recherche par lieu
CREATE INDEX idx_events_venue_date ON events(
    venue_id, scheduled_start, status
);

-- Recherche par catégorie/type
CREATE INDEX idx_events_category_type ON events(
    category, type, scheduled_start
);

-- Recherche texte événements
CREATE INDEX idx_events_search ON events USING gin(
    to_tsvector('french', name || ' ' || COALESCE(description, ''))
);

-- Performance analytics
CREATE INDEX idx_analytics_calculation ON event_analytics(
    last_calculated, event_id
);
```

---

## 📊 Métriques et KPIs

### Indicateurs de performance
- **Taux occupation** : % capacité vendue/totale
- **Revenus par événement** : Performance commerciale
- **Délai vente complète** : Temps pour sold-out
- **Satisfaction participants** : Notes moyennes

### Indicateurs opérationnels
- **Lead time** : Délai planification → événement
- **Taux annulation** : % événements annulés
- **Punctualité** : Respect horaires programmés
- **Efficacité check-in** : Temps moyen entrée

### Indicateurs de qualité
- **Score qualité** : Évaluation globale
- **Réclamations** : Nombre problèmes signalés
- **Taux recommendation** : % participants qui recommandent
- **Fidélisation** : % participants récurrents

Cette documentation couvre la gestion complète des événements dans Entrix V3.0, permettant une planification, exécution et analyse optimales de tous types d'événements.