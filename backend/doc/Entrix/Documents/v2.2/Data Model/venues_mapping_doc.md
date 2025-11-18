# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Gestion des Lieux et Cartographie

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel gère l'infrastructure physique des événements : lieux, leurs configurations, zones, sièges et services associés. Il constitue la base géographique et logistique de la plateforme Entrix.

### Principes de conception
- **Flexibilité architecturale** : Support de tous types de lieux
- **Granularité fine** : Gestion jusqu'au niveau siège individuel
- **Configuration dynamique** : Adaptation selon événements
- **Services intégrés** : Parking, restauration, accessibilité

---

## 🏟️ Table `venues` - Lieux et installations

**Description** : Catalogue de tous les lieux physiques pouvant accueillir des événements, de l'amphithéâtre universitaire au stade national.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | VARCHAR(255) | PRIMARY KEY | - | ID unique slug |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | - | Code venue unique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom officiel |
| `display_name` | VARCHAR(200) | NULL | - | Nom d'affichage |
| `type` | ENUM | NOT NULL | - | Type de lieu |
| `category` | ENUM | NOT NULL | - | Catégorie principale |
| `description` | TEXT | NULL | - | Description détaillée |
| `short_description` | VARCHAR(500) | NULL | - | Description courte |
| `address_line1` | VARCHAR(255) | NOT NULL | - | Adresse ligne 1 |
| `address_line2` | VARCHAR(255) | NULL | - | Adresse ligne 2 |
| `city` | VARCHAR(100) | NOT NULL | - | Ville |
| `district` | VARCHAR(100) | NULL | - | Quartier/arrondissement |
| `postal_code` | VARCHAR(20) | NULL | - | Code postal |
| `country` | VARCHAR(2) | DEFAULT 'TN' | 'TN' | Code pays ISO |
| `coordinates` | JSONB | NULL | - | Coordonnées GPS précises |
| `timezone` | VARCHAR(50) | DEFAULT 'Africa/Tunis' | - | Fuseau horaire |
| `capacity_total` | INTEGER | NOT NULL | - | Capacité totale maximale |
| `capacity_seated` | INTEGER | NULL | - | Capacité assise |
| `capacity_standing` | INTEGER | NULL | - | Capacité debout |
| `capacity_mixed_max` | INTEGER | NULL | - | Capacité configuration mixte |
| `surface_area` | DECIMAL(10,2) | NULL | - | Superficie en m² |
| `ceiling_height` | DECIMAL(5,2) | NULL | - | Hauteur sous plafond |
| `year_built` | INTEGER | NULL | - | Année construction |
| `last_renovation` | INTEGER | NULL | - | Dernière rénovation |
| `architect` | VARCHAR(200) | NULL | - | Architecte |
| `owner_name` | VARCHAR(200) | NULL | - | Propriétaire |
| `owner_type` | ENUM | NULL | - | Type propriétaire |
| `management_company` | VARCHAR(200) | NULL | - | Société gestion |
| `primary_manager_id` | UUID | NULL, FK | - | Gestionnaire principal |
| `contact_email` | VARCHAR(255) | NULL | - | Email contact |
| `contact_phone` | VARCHAR(20) | NULL | - | Téléphone contact |
| `emergency_phone` | VARCHAR(20) | NULL | - | Téléphone urgence |
| `website` | VARCHAR(255) | NULL | - | Site web officiel |
| `social_media` | JSONB | NULL | - | Réseaux sociaux |
| `booking_email` | VARCHAR(255) | NULL | - | Email réservations |
| `booking_phone` | VARCHAR(20) | NULL | - | Téléphone réservations |
| `rental_rates` | JSONB | NULL | - | Tarifs location |
| `facilities` | JSONB | NULL | - | Installations disponibles |
| `technical_specs` | JSONB | NULL | - | Spécifications techniques |
| `accessibility` | JSONB | NULL | - | Infos accessibilité |
| `parking_info` | JSONB | NULL | - | Infos stationnement |
| `public_transport` | JSONB | NULL | - | Transports publics |
| `dining_options` | JSONB | NULL | - | Options restauration |
| `security_features` | JSONB | NULL | - | Équipements sécurité |
| `environmental_certifications` | TEXT[] | NULL | - | Certifications environnement |
| `restrictions` | JSONB | NULL | - | Restrictions d'usage |
| `insurance_info` | JSONB | NULL | - | Informations assurance |
| `fire_safety_capacity` | INTEGER | NULL | - | Capacité sécurité incendie |
| `evacuation_time` | INTEGER | NULL | - | Temps évacuation (minutes) |
| `media_urls` | TEXT[] | NULL | - | Photos/vidéos/plans |
| `virtual_tour_url` | TEXT | NULL | - | Visite virtuelle |
| `floor_plans` | JSONB | NULL | - | Plans étages |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Lieu actif |
| `is_verified` | BOOLEAN | NOT NULL | FALSE | Lieu vérifié |
| `is_featured` | BOOLEAN | NOT NULL | FALSE | Lieu mis en avant |
| `verification_date` | DATE | NULL | - | Date vérification |
| `last_inspection` | DATE | NULL | - | Dernière inspection |
| `next_inspection_due` | DATE | NULL | - | Prochaine inspection |
| `rating_overall` | DECIMAL(3,2) | NULL | - | Note globale (0-5) |
| `rating_facilities` | DECIMAL(3,2) | NULL | - | Note installations |
| `rating_location` | DECIMAL(3,2) | NULL | - | Note emplacement |
| `rating_service` | DECIMAL(3,2) | NULL | - | Note service |
| `total_events_hosted` | INTEGER | DEFAULT 0 | 0 | Total événements accueillis |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `type`
- `STADIUM` : Stade
- `ARENA` : Arène/salle sport
- `THEATER` : Théâtre
- `CONCERT_HALL` : Salle concert
- `CONFERENCE_CENTER` : Centre conférences
- `CONVENTION_CENTER` : Centre conventions
- `AUDITORIUM` : Auditorium
- `AMPHITHEATER` : Amphithéâtre
- `GYMNASIUM` : Gymnase
- `FIELD` : Terrain sport
- `COURT` : Court tennis/basket
- `CLUB` : Club/discothèque
- `RESTAURANT` : Restaurant
- `HOTEL` : Hôtel
- `OUTDOOR_SPACE` : Espace extérieur
- `BEACH` : Plage
- `PARK` : Parc
- `MUSEUM` : Musée
- `GALLERY` : Galerie
- `LIBRARY` : Bibliothèque
- `UNIVERSITY` : Université
- `SCHOOL` : École
- `RELIGIOUS` : Lieu culte
- `GOVERNMENT` : Bâtiment gouvernemental
- `EXHIBITION_HALL` : Salle exposition
- `WAREHOUSE` : Entrepôt
- `ROOFTOP` : Toit-terrasse
- `BOAT` : Bateau
- `TRAIN` : Train
- `OTHER` : Autre

#### `category`
- `SPORTS` : Sports
- `ENTERTAINMENT` : Divertissement
- `CULTURE` : Culture
- `BUSINESS` : Affaires
- `EDUCATION` : Éducation
- `RELIGIOUS` : Religieux
- `COMMUNITY` : Communautaire
- `HOSPITALITY` : Hôtellerie
- `RETAIL` : Commerce
- `TRANSPORT` : Transport

#### `owner_type`
- `PUBLIC` : Public
- `PRIVATE` : Privé
- `MIXED` : Mixte public-privé
- `NGO` : ONG
- `RELIGIOUS` : Religieux
- `EDUCATIONAL` : Éducatif

### Structure JSONB détaillées

#### `coordinates`
```json
{
  "latitude": 36.8065,
  "longitude": 10.1815,
  "altitude": 4,
  "accuracy": "high",
  "verified": true,
  "entrance_points": [
    {"name": "Entrée principale", "lat": 36.8066, "lng": 10.1816},
    {"name": "Entrée VIP", "lat": 36.8064, "lng": 10.1814}
  ],
  "boundaries": {
    "type": "Polygon",
    "coordinates": [[[10.1810, 36.8060], [10.1820, 36.8060], [10.1820, 36.8070], [10.1810, 36.8070], [10.1810, 36.8060]]]
  }
}
```

#### `facilities`
```json
{
  "basic": {
    "restrooms": {"count": 20, "accessible": 4, "baby_change": 2},
    "water_fountains": 8,
    "wifi": {"available": true, "free": true, "speed": "high"},
    "air_conditioning": true,
    "heating": true
  },
  "technical": {
    "sound_system": {"type": "professional", "channels": 32, "wireless_mics": 12},
    "lighting": {"stage_lighting": true, "led_screens": 2, "spotlights": 16},
    "projection": {"projectors": 4, "screens": "retractable", "4k_capable": true},
    "power": {"outlets": 50, "voltage": "220V/380V", "backup_generator": true},
    "internet": {"fiber": true, "bandwidth": "1Gbps", "redundant": true}
  },
  "hospitality": {
    "vip_lounges": 3,
    "green_rooms": 2,
    "catering_kitchen": true,
    "bar_areas": 4,
    "merchandise_spaces": 6
  },
  "accessibility": {
    "wheelchair_access": true,
    "elevators": 3,
    "accessible_parking": 20,
    "hearing_loops": true,
    "braille_signage": true,
    "companion_seating": true
  },
  "security": {
    "metal_detectors": 6,
    "security_cameras": 45,
    "control_room": true,
    "emergency_exits": 8,
    "fire_suppression": "sprinkler_system"
  }
}
```

#### `parking_info`
```json
{
  "total_spaces": 500,
  "types": {
    "standard": 400,
    "accessible": 25,
    "vip": 50,
    "motorcycle": 25
  },
  "pricing": {
    "standard": {"amount": 5.00, "currency": "TND", "duration": "event"},
    "vip": {"amount": 15.00, "currency": "TND", "duration": "event"}
  },
  "features": {
    "covered": 200,
    "security": true,
    "valet_service": true,
    "electric_charging": 10
  },
  "access": {
    "automated_gates": true,
    "payment_methods": ["cash", "card", "mobile"],
    "advance_booking": true
  }
}
```

---

## 🎯 Table `venue_zones` - Zones dans les lieux

**Description** : Subdivision des lieux en zones distinctes avec caractéristiques et capacités spécifiques.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | VARCHAR(255) | PRIMARY KEY | - | ID unique zone |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | Référence lieu |
| `code` | VARCHAR(50) | NOT NULL | - | Code zone |
| `name` | VARCHAR(200) | NOT NULL | - | Nom zone |
| `display_name` | VARCHAR(200) | NULL | - | Nom d'affichage |
| `type` | ENUM | NOT NULL | - | Type de zone |
| `category` | ENUM | NOT NULL | - | Catégorie zone |
| `level` | INTEGER | NULL | - | Niveau/étage |
| `section` | VARCHAR(50) | NULL | - | Section |
| `description` | TEXT | NULL | - | Description zone |
| `capacity_total` | INTEGER | NOT NULL | - | Capacité totale |
| `capacity_seated` | INTEGER | NULL | - | Capacité assise |
| `capacity_standing` | INTEGER | NULL | - | Capacité debout |
| `row_count` | INTEGER | NULL | - | Nombre rangées |
| `seats_per_row_avg` | DECIMAL(5,2) | NULL | - | Sièges moyen/rangée |
| `base_price` | DECIMAL(10,2) | NULL | - | Prix de base |
| `price_currency` | VARCHAR(3) | DEFAULT 'TND' | - | Devise prix |
| `view_quality` | ENUM | NULL | - | Qualité vue |
| `distance_to_stage` | DECIMAL(6,2) | NULL | - | Distance scène (mètres) |
| `angle_to_stage` | INTEGER | NULL | - | Angle vue scène (degrés) |
| `elevation` | DECIMAL(5,2) | NULL | - | Élévation (mètres) |
| `surface_area` | DECIMAL(8,2) | NULL | - | Surface (m²) |
| `ceiling_height` | DECIMAL(5,2) | NULL | - | Hauteur plafond |
| `accessibility_features` | JSONB | NULL | - | Fonctionnalités accessibilité |
| `amenities` | JSONB | NULL | - | Services zone |
| `restrictions` | JSONB | NULL | - | Restrictions spécifiques |
| `entry_points` | TEXT[] | NULL | - | Points d'entrée |
| `emergency_exits` | TEXT[] | NULL | - | Sorties secours |
| `coordinates` | JSONB | NULL | - | Coordonnées relatives |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Zone active |
| `is_premium` | BOOLEAN | NOT NULL | FALSE | Zone premium |
| `requires_special_access` | BOOLEAN | NOT NULL | FALSE | Accès spécial requis |
| `age_restrictions` | JSONB | NULL | - | Restrictions âge |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `type`
- `SEATED` : Assise numérotée
- `STANDING` : Debout
- `MIXED` : Mixte assis/debout
- `VIP_BOX` : Loge VIP
- `SUITE` : Suite privée
- `BALCONY` : Balcon
- `ORCHESTRA` : Orchestre
- `MEZZANINE` : Mezzanine
- `GALLERY` : Galerie
- `TERRACE` : Terrasse
- `FIELD` : Terrain/pelouse
- `STAGE` : Scène
- `BACKSTAGE` : Coulisses
- `GREEN_ROOM` : Loge artiste
- `TECHNICAL` : Zone technique
- `CONCOURSE` : Coursive
- `CONCESSION` : Zone commerciale
- `PARKING` : Parking

#### `category`
- `PREMIUM` : Premium
- `STANDARD` : Standard
- `ECONOMY` : Économique
- `VIP` : VIP
- `HOSPITALITY` : Hospitalité
- `GENERAL_ADMISSION` : Admission générale
- `RESTRICTED` : Accès restreint
- `OPERATIONAL` : Opérationnel

#### `view_quality`
- `EXCELLENT` : Excellente
- `VERY_GOOD` : Très bonne
- `GOOD` : Bonne
- `FAIR` : Correcte
- `OBSTRUCTED` : Obstruée
- `LIMITED` : Limitée

---

## 💺 Table `seats` - Sièges individuels

**Description** : Inventaire détaillé de chaque siège individuel dans les zones avec places numérotées.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | Référence lieu |
| `zone_id` | VARCHAR(255) | NOT NULL, FK | - | Référence zone |
| `row_number` | VARCHAR(10) | NOT NULL | - | Numéro rangée |
| `seat_number` | VARCHAR(10) | NOT NULL | - | Numéro siège |
| `display_label` | VARCHAR(20) | NULL | - | Libellé affichage |
| `seat_type` | ENUM | NOT NULL | 'STANDARD' | Type de siège |
| `quality_level` | ENUM | NOT NULL | 'STANDARD' | Niveau qualité |
| `view_category` | ENUM | NULL | - | Catégorie vue |
| `is_aisle` | BOOLEAN | NOT NULL | FALSE | Siège bout rangée |
| `is_accessible` | BOOLEAN | NOT NULL | FALSE | Accessible handicap |
| `requires_companion` | BOOLEAN | NOT NULL | FALSE | Nécessite accompagnateur |
| `has_armrests` | BOOLEAN | NOT NULL | TRUE | Avec accoudoirs |
| `has_cup_holder` | BOOLEAN | NOT NULL | FALSE | Avec porte-gobelet |
| `is_foldable` | BOOLEAN | NOT NULL | TRUE | Rabattable |
| `width_cm` | DECIMAL(5,2) | NULL | - | Largeur (cm) |
| `depth_cm` | DECIMAL(5,2) | NULL | - | Profondeur (cm) |
| `coordinates_x` | DECIMAL(8,3) | NULL | - | Coordonnée X relative |
| `coordinates_y` | DECIMAL(8,3) | NULL | - | Coordonnée Y relative |
| `distance_to_stage` | DECIMAL(6,2) | NULL | - | Distance scène |
| `viewing_angle` | INTEGER | NULL | - | Angle vue (degrés) |
| `notes` | TEXT | NULL | - | Notes spéciales |
| `price_modifier` | DECIMAL(4,2) | DEFAULT 1.00 | 1.00 | Modificateur prix |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Siège actif |
| `is_blocked` | BOOLEAN | NOT NULL | FALSE | Siège bloqué |
| `blocked_reason` | TEXT | NULL | - | Raison blocage |
| `last_maintenance` | DATE | NULL | - | Dernière maintenance |
| `condition_status` | ENUM | NOT NULL | 'GOOD' | État siège |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `seat_type`
- `STANDARD` : Standard
- `PREMIUM` : Premium
- `VIP` : VIP
- `ACCESSIBLE` : Accessible handicap
- `COMPANION` : Accompagnateur
- `AISLE` : Bout de rangée
- `OBSTRUCTED` : Vue obstruée
- `BAR_STOOL` : Tabouret bar
- `COUCH` : Canapé
- `TABLE` : Table

#### `quality_level`
- `BASIC` : Basique
- `STANDARD` : Standard
- `COMFORT` : Confort
- `PREMIUM` : Premium
- `LUXURY` : Luxe

#### `view_category`
- `FRONT_ROW` : Premier rang
- `CENTER` : Centre
- `SIDE` : Côté
- `BACK` : Arrière
- `ELEVATED` : Surélevé
- `GROUND_LEVEL` : Niveau sol

#### `condition_status`
- `EXCELLENT` : Excellent
- `GOOD` : Bon
- `FAIR` : Correct
- `POOR` : Mauvais
- `OUT_OF_ORDER` : Hors service

---

## 🏢 Table `venue_services` - Services des lieux

**Description** : Services et prestations disponibles dans chaque lieu (restauration, boutiques, services techniques).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | Référence lieu |
| `service_type` | ENUM | NOT NULL | - | Type de service |
| `category` | VARCHAR(100) | NOT NULL | - | Catégorie service |
| `name` | VARCHAR(200) | NOT NULL | - | Nom service |
| `description` | TEXT | NULL | - | Description |
| `provider_name` | VARCHAR(200) | NULL | - | Nom prestataire |
| `provider_contact` | JSONB | NULL | - | Contact prestataire |
| `location_in_venue` | VARCHAR(200) | NULL | - | Localisation dans lieu |
| `zone_ids` | TEXT[] | NULL | - | Zones desservies |
| `operating_hours` | JSONB | NULL | - | Horaires fonctionnement |
| `capacity` | INTEGER | NULL | - | Capacité service |
| `pricing` | JSONB | NULL | - | Grille tarifaire |
| `booking_required` | BOOLEAN | NOT NULL | FALSE | Réservation obligatoire |
| `advance_booking_days` | INTEGER | NULL | - | Délai réservation |
| `cancellation_policy` | TEXT | NULL | - | Politique annulation |
| `equipment_included` | TEXT[] | NULL | - | Équipements inclus |
| `additional_costs` | JSONB | NULL | - | Coûts additionnels |
| `terms_conditions` | TEXT | NULL | - | Conditions service |
| `quality_rating` | DECIMAL(3,2) | NULL | - | Note qualité |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Service actif |
| `is_premium` | BOOLEAN | NOT NULL | FALSE | Service premium |
| `requires_approval` | BOOLEAN | NOT NULL | FALSE | Nécessite approbation |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM `service_type`

- `CATERING` : Restauration
- `BAR_SERVICE` : Service bar
- `TECHNICAL_SUPPORT` : Support technique
- `SECURITY` : Sécurité
- `CLEANING` : Nettoyage
- `DECORATION` : Décoration
- `AUDIO_VISUAL` : Audio-visuel
- `PHOTOGRAPHY` : Photographie
- `TRANSPORTATION` : Transport
- `ACCOMMODATION` : Hébergement
- `RETAIL` : Commerce
- `ENTERTAINMENT` : Animation
- `WELLNESS` : Bien-être
- `BUSINESS_CENTER` : Centre affaires
- `INTERPRETATION` : Interprétation
- `MEDICAL` : Médical
- `CHILDCARE` : Garde enfants
- `EQUIPMENT_RENTAL` : Location équipement
- `SETUP_BREAKDOWN` : Montage/démontage
- `VALET_PARKING` : Voiturier

---

## 📱 Table `venue_media` - Médias des lieux

**Description** : Fichiers multimédias associés aux lieux (photos, vidéos, plans, visites virtuelles).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | Référence lieu |
| `zone_id` | VARCHAR(255) | NULL, FK | - | Zone spécifique |
| `media_type` | ENUM | NOT NULL | - | Type média |
| `category` | ENUM | NOT NULL | - | Catégorie média |
| `title` | VARCHAR(200) | NOT NULL | - | Titre média |
| `description` | TEXT | NULL | - | Description |
| `file_url` | TEXT | NOT NULL | - | URL fichier |
| `thumbnail_url` | TEXT | NULL | - | URL miniature |
| `file_size` | BIGINT | NULL | - | Taille fichier (bytes) |
| `mime_type` | VARCHAR(100) | NULL | - | Type MIME |
| `dimensions` | JSONB | NULL | - | Dimensions si image/vidéo |
| `duration` | INTEGER | NULL | - | Durée si vidéo/audio |
| `resolution` | VARCHAR(20) | NULL | - | Résolution |
| `photographer_credit` | VARCHAR(200) | NULL | - | Crédit photographe |
| `taken_date` | DATE | NULL | - | Date prise |
| `view_count` | INTEGER | DEFAULT 0 | 0 | Nombre vues |
| `is_featured` | BOOLEAN | NOT NULL | FALSE | Média principal |
| `is_public` | BOOLEAN | NOT NULL | TRUE | Visible publiquement |
| `display_order` | INTEGER | DEFAULT 0 | 0 | Ordre affichage |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |

### Valeurs ENUM

#### `media_type`
- `PHOTO` : Photo
- `VIDEO` : Vidéo
- `PANORAMA` : Panorama 360°
- `VIRTUAL_TOUR` : Visite virtuelle
- `FLOOR_PLAN` : Plan étage
- `SITE_MAP` : Plan site
- `TECHNICAL_DRAWING` : Plan technique
- `ELEVATION` : Élévation
- `SECTION` : Coupe
- `3D_MODEL` : Modèle 3D
- `DRONE_FOOTAGE` : Vue drone
- `TIMELAPSE` : Timelapse

#### `category`
- `EXTERIOR` : Extérieur
- `INTERIOR` : Intérieur
- `STAGE_VIEW` : Vue scène
- `AUDIENCE_VIEW` : Vue public
- `BACKSTAGE` : Coulisses
- `FACILITIES` : Installations
- `PARKING` : Parking
- `ACCESSIBILITY` : Accessibilité
- `EVENTS` : Événements
- `ARCHIVE` : Archives

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Zones ↔ Lieux
ALTER TABLE venue_zones 
ADD CONSTRAINT fk_zones_venue 
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- Sièges ↔ Lieux
ALTER TABLE seats 
ADD CONSTRAINT fk_seats_venue 
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- Sièges ↔ Zones
ALTER TABLE seats 
ADD CONSTRAINT fk_seats_zone 
FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE;

-- Services ↔ Lieux
ALTER TABLE venue_services 
ADD CONSTRAINT fk_services_venue 
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- Médias ↔ Lieux
ALTER TABLE venue_media 
ADD CONSTRAINT fk_media_venue 
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- Médias ↔ Zones
ALTER TABLE venue_media 
ADD CONSTRAINT fk_media_zone 
FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE SET NULL;
```

### Contraintes de validation

```sql
-- Capacités cohérentes lieux
ALTER TABLE venues ADD CONSTRAINT chk_venue_capacity_logic 
CHECK (
    capacity_seated IS NULL OR capacity_standing IS NULL OR 
    capacity_total >= GREATEST(capacity_seated, capacity_standing)
);

-- Capacités cohérentes zones
ALTER TABLE venue_zones ADD CONSTRAINT chk_zone_capacity_logic 
CHECK (
    capacity_seated IS NULL OR capacity_standing IS NULL OR 
    capacity_total >= GREATEST(capacity_seated, capacity_standing)
);

-- Combinaison rangée/siège unique par zone
ALTER TABLE seats ADD CONSTRAINT uk_seats_position 
UNIQUE (zone_id, row_number, seat_number);

-- Prix modifier raisonnable
ALTER TABLE seats ADD CONSTRAINT chk_price_modifier_bounds 
CHECK (price_modifier >= 0.1 AND price_modifier <= 10.0);

-- Coordonnées GPS valides
ALTER TABLE venues ADD CONSTRAINT chk_venue_coordinates 
CHECK (
    coordinates IS NULL OR (
        (coordinates->>'latitude')::decimal BETWEEN -90 AND 90 AND
        (coordinates->>'longitude')::decimal BETWEEN -180 AND 180
    )
);
```

### Index de performance

```sql
-- Recherche lieux par localisation
CREATE INDEX idx_venues_location ON venues(city, country, is_active) 
WHERE is_active = TRUE;

-- Recherche lieux par type/capacité
CREATE INDEX idx_venues_type_capacity ON venues(type, capacity_total, is_active);

-- Recherche zones par lieu
CREATE INDEX idx_zones_venue ON venue_zones(venue_id, is_active);

-- Recherche sièges par zone
CREATE INDEX idx_seats_zone ON seats(zone_id, row_number, seat_number);

-- Recherche médias par lieu
CREATE INDEX idx_media_venue_featured ON venue_media(
    venue_id, is_featured, display_order
);

-- Index géospatial pour recherche proximité
CREATE INDEX idx_venues_coordinates_gist ON venues 
USING GIST (((coordinates->>'latitude')::decimal, (coordinates->>'longitude')::decimal));
```

---

## 📊 Métriques et KPIs

### Indicateurs d'utilisation
- **Taux occupation** : % capacité utilisée par événement
- **Fréquence utilisation** : Nombre événements/lieu/période
- **Zones populaires** : Zones les plus réservées
- **Revenus par lieu** : Performance financière

### Indicateurs de qualité
- **Notes satisfaction** : Évaluations moyennes lieux
- **Taux incidents** : Problèmes signalés/événement
- **Délai maintenance** : Temps résolution problèmes
- **Conformité sécurité** : Respect normes

### Indicateurs opérationnels
- **Temps préparation** : Délai setup/breakdown
- **Efficacité services** : Performance prestations
- **Optimisation layout** : Utilisation optimale espaces
- **Accessibilité** : Utilisation équipements handicap

Cette documentation couvre la gestion complète des lieux et de la cartographie dans Entrix V3.0, permettant une gestion fine et flexible de tous les aspects physiques des événements.