# API Specifications - Module Gestion des Lieux et Cartographie
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Lieux](#api-lieux)
4. [API Configurations de lieux](#api-configurations-de-lieux)
5. [API Zones et espaces](#api-zones-et-espaces)
6. [API Sièges](#api-sièges)
7. [API Points d'accès](#api-points-daccès)
8. [API Services et équipements](#api-services-et-équipements)
9. [API Médias des lieux](#api-médias-des-lieux)
10. [API Analytics et optimisation](#api-analytics-et-optimisation)
11. [Codes d'erreur](#codes-derreur)
12. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Gestion des Lieux et Cartographie** constitue l'infrastructure physique complète d'Entrix V3.0. Il gère tous les aspects des lieux d'événements avec une granularité allant du venue global jusqu'au siège individuel.

## 🏗️ Architecture

### Entités principales
- **Venues** : Lieux physiques (stades, théâtres, salles, etc.)
- **Venue Mappings** : Configurations multiples d'un même lieu
- **Zones** : Espaces organisés hiérarchiquement
- **Sièges** : Places individuelles numérotées
- **Points d'accès** : Entrées/sorties avec sécurité
- **Services** : Prestations et équipements disponibles
- **Médias** : Photos, plans, visites virtuelles

### Types de lieux supportés
- **STADIUM** : Stades sportifs
- **ARENA** : Arènes et salles de sport
- **THEATER** : Théâtres et opéras
- **CONCERT_HALL** : Salles de concert
- **CONFERENCE_CENTER** : Centres de conférences
- **CONVENTION_CENTER** : Centres de conventions
- **AUDITORIUM** : Auditoriums
- **OUTDOOR_SPACE** : Espaces extérieurs
- **CLUB** : Clubs et discothèques
- **MUSEUM** : Musées et galeries
- Et 15+ autres types

### Catégories zones
- **SEATED** : Places assises numérotées
- **STANDING** : Zones debout général
- **VIP_BOX** : Loges VIP privées
- **SUITE** : Suites premium
- **BACKSTAGE** : Coulisses et espaces artistes
- **TECHNICAL** : Zones techniques
- **HOSPITALITY** : Espaces hospitalité

## 🔗 Relations avec autres modules
- **Organisateurs** : Relations propriétaire/gestionnaire
- **Événements** : Configuration selon type d'événement
- **Billetterie** : Allocation places et tarification
- **Contrôle d'accès** : Points d'entrée et sécurité

---

# Authentification et autorisation

## 🔐 Niveaux d'accès requis

### Lecture des lieux
- **Public** : Informations de base, capacité, médias publics
- **Organisateur** : Détails complets de ses lieux gérés
- **Gestionnaire lieu** : Accès complet à son lieu
- **Super Admin** : Accès global tous lieux

### Gestion des lieux
- **Propriétaire lieu** : Modification de son lieu
- **Gestionnaire lieu** : Configuration selon droits délégués
- **Super Admin** : Toutes opérations

### Configuration événements
- **Organisateur événement** : Configuration pour ses événements
- **Gestionnaire lieu** : Validation des configurations
- **Super Admin** : Toutes configurations

## 🛡️ Headers requis

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Organizer-ID: <ORGANIZER_UUID> (si applicable)
X-Venue-Manager-ID: <USER_UUID> (si gestionnaire lieu)
```

---

# API Lieux

## 🏟️ Ressource : `/api/v1/venues`

### GET /api/v1/venues
**Description** : Liste paginée des lieux avec filtres géographiques et capacité

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page (max 100) |
| `type` | enum | - | Type de lieu |
| `category` | enum | - | Catégorie principale |
| `city` | string | - | Ville |
| `country` | string | TN | Code pays ISO-2 |
| `capacity_min` | integer | - | Capacité minimale |
| `capacity_max` | integer | - | Capacité maximale |
| `is_active` | boolean | - | Lieux actifs uniquement |
| `has_accessibility` | boolean | - | Avec équipements accessibilité |
| `owner_type` | enum | - | Type de propriétaire |
| `lat` | decimal | - | Latitude centre recherche |
| `lng` | decimal | - | Longitude centre recherche |
| `radius` | integer | - | Rayon recherche (km) |
| `search` | string | - | Recherche textuelle (nom, description) |
| `available_date` | date | - | Disponible à cette date |
| `amenities` | string | - | Services requis (séparés par virgule) |
| `sort` | string | `name` | Tri (name, capacity, distance, rating) |
| `order` | string | `asc` | Ordre (asc, desc) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "id": "stade-rades-tunis",
        "code": "STADE_RADES",
        "name": "Stade Olympique de Radès",
        "display_name": "Stade de Radès",
        "type": "STADIUM",
        "category": "SPORTS",
        "description": "Stade national de Tunisie, inauguré en 2001",
        "address": {
          "line1": "Avenue du 7 Novembre",
          "city": "Radès",
          "district": "Ben Arous",
          "postal_code": "2040",
          "country": "TN"
        },
        "coordinates": {
          "latitude": 36.7517,
          "longitude": 10.2817,
          "verified": true
        },
        "capacity": {
          "total": 60000,
          "seated": 60000,
          "standing": 0,
          "vip": 2000
        },
        "characteristics": {
          "surface_area": 105000.0,
          "year_built": 2001,
          "last_renovation": 2018,
          "architect": "Kenzō Tange"
        },
        "ownership": {
          "owner_name": "République Tunisienne",
          "owner_type": "PUBLIC",
          "management_company": "CNSS"
        },
        "contact": {
          "email": "contact@stadeolympique.tn",
          "phone": "+216 71 123 456",
          "website": "https://stadeolympique.tn"
        },
        "features": {
          "has_roof": true,
          "climate_controlled": false,
          "accessibility_compliant": true,
          "parking_spaces": 3000,
          "public_transport": true
        },
        "ratings": {
          "overall": 4.2,
          "facilities": 4.1,
          "location": 4.5,
          "service": 4.0
        },
        "status": {
          "is_active": true,
          "is_verified": true,
          "operational_status": "OPERATIONAL"
        },
        "configurations_count": 3,
        "upcoming_events": 8,
        "distance_km": 12.5,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-03-20T15:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 45,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    },
    "search_metadata": {
      "filters_applied": {
        "city": "Tunis",
        "type": "STADIUM",
        "capacity_min": 10000
      },
      "search_center": {
        "lat": 36.8065,
        "lng": 10.1815,
        "radius": 25
      },
      "total_in_radius": 12
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/venues
**Description** : Création d'un nouveau lieu

#### Request Body
```json
{
  "code": "OPERA_TUNIS",
  "name": "Opéra de Tunis",
  "display_name": "Théâtre Municipal de Tunis",
  "type": "THEATER",
  "category": "CULTURE",
  "description": "Théâtre historique au cœur de Tunis, rénové en 2016",
  "short_description": "Théâtre municipal historique de Tunis",
  "address": {
    "line1": "Place de l'Indépendance",
    "city": "Tunis",
    "district": "Tunis Centre",
    "postal_code": "1001",
    "country": "TN"
  },
  "coordinates": {
    "latitude": 36.8019,
    "longitude": 10.1863,
    "accuracy": "high"
  },
  "capacity": {
    "total": 1200,
    "seated": 1200,
    "standing": 0,
    "wheelchair": 20
  },
  "characteristics": {
    "surface_area": 3500.0,
    "ceiling_height": 12.0,
    "year_built": 1902,
    "last_renovation": 2016,
    "architect": "Jean-Émile Resplandy"
  },
  "ownership": {
    "owner_name": "Municipalité de Tunis",
    "owner_type": "PUBLIC",
    "management_company": "Théâtres de Tunis"
  },
  "contact": {
    "email": "contact@opera-tunis.tn",
    "phone": "+216 71 345 789",
    "website": "https://opera-tunis.tn"
  },
  "features": {
    "has_roof": true,
    "climate_controlled": true,
    "accessibility_compliant": true,
    "parking_spaces": 50,
    "public_transport": true,
    "dress_code_required": true
  },
  "technical_specs": {
    "stage_width": 16.0,
    "stage_depth": 14.0,
    "fly_gallery": true,
    "orchestra_pit": true,
    "sound_system": "Yamaha CL5",
    "lighting_system": "ETC Ion Xe"
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "venue": {
      "id": "opera-tunis",
      "code": "OPERA_TUNIS",
      "name": "Opéra de Tunis",
      "type": "THEATER",
      "category": "CULTURE",
      "status": {
        "is_active": true,
        "is_verified": false,
        "operational_status": "PENDING_VERIFICATION"
      },
      "verification_required": true,
      "created_at": "2024-03-20T16:00:00Z"
    }
  },
  "message": "Venue created successfully. Verification process initiated.",
  "timestamp": "2024-03-20T16:00:00Z"
}
```

### GET /api/v1/venues/{id}
**Description** : Détails complets d'un lieu avec configurations disponibles

#### Response 200
```json
{
  "success": true,
  "data": {
    "venue": {
      "id": "stade-rades-tunis",
      "code": "STADE_RADES",
      "name": "Stade Olympique de Radès",
      "display_name": "Stade de Radès",
      "type": "STADIUM",
      "category": "SPORTS",
      "description": "Le Stade Olympique de Radès est le stade national de la Tunisie...",
      "short_description": "Stade national de Tunisie, 60 000 places",
      "address": {
        "line1": "Avenue du 7 Novembre",
        "line2": null,
        "city": "Radès",
        "district": "Ben Arous",
        "postal_code": "2040",
        "country": "TN",
        "full_address": "Avenue du 7 Novembre, Radès 2040, Tunisie"
      },
      "coordinates": {
        "latitude": 36.7517,
        "longitude": 10.2817,
        "altitude": 4,
        "accuracy": "high",
        "verified": true,
        "entrance_points": [
          {"name": "Entrée A", "lat": 36.7520, "lng": 10.2815},
          {"name": "Entrée VIP", "lat": 36.7515, "lng": 10.2820}
        ]
      },
      "timezone": "Africa/Tunis",
      "capacity": {
        "total": 60000,
        "seated": 60000,
        "standing": 0,
        "vip": 2000,
        "hospitality": 500,
        "press": 200,
        "wheelchair": 300
      },
      "characteristics": {
        "surface_area": 105000.0,
        "pitch_size": "105m x 68m",
        "ceiling_height": null,
        "year_built": 2001,
        "last_renovation": 2018,
        "architect": "Kenzō Tange",
        "construction_cost": "120M TND"
      },
      "ownership": {
        "owner_name": "République Tunisienne",
        "owner_type": "PUBLIC",
        "management_company": "CNSS",
        "primary_manager": {
          "name": "Ahmed Mansouri",
          "title": "Directeur Général",
          "email": "directeur@stadeolympique.tn",
          "phone": "+216 71 123 456"
        }
      },
      "contact": {
        "email": "contact@stadeolympique.tn",
        "phone": "+216 71 123 456",
        "fax": "+216 71 123 457",
        "website": "https://stadeolympique.tn",
        "emergency_contact": "+216 71 123 999"
      },
      "features": {
        "has_roof": true,
        "retractable_roof": false,
        "climate_controlled": false,
        "natural_lighting": true,
        "artificial_lighting": true,
        "accessibility_compliant": true,
        "parking_spaces": 3000,
        "public_transport": true,
        "metro_station": "Radès",
        "wifi_available": true,
        "food_courts": 12,
        "gift_shops": 5
      },
      "technical_specs": {
        "pitch_type": "Natural grass",
        "irrigation_system": "Automatic",
        "drainage": "SubAir system",
        "sound_system": "Bose Professional",
        "video_screens": 4,
        "camera_positions": 24,
        "broadcast_facilities": true
      },
      "certifications": {
        "fifa_approved": true,
        "uefa_category": 4,
        "accessibility_certified": true,
        "safety_certificate": "Valid until 2025-12-31",
        "environmental_rating": "B+"
      },
      "ratings": {
        "overall": 4.2,
        "facilities": 4.1,
        "location": 4.5,
        "service": 4.0,
        "accessibility": 4.3,
        "total_reviews": 1247
      },
      "configurations": [
        {
          "id": "football-standard",
          "name": "Configuration Football Standard",
          "type": "SPORTS_MATCH",
          "effective_capacity": 60000,
          "zones_count": 8,
          "is_default": true
        },
        {
          "id": "concert-arena",
          "name": "Configuration Concert",
          "type": "CONCERT",
          "effective_capacity": 45000,
          "zones_count": 6,
          "is_default": false
        }
      ],
      "amenities_summary": {
        "total": 45,
        "by_category": {
          "FOOD_BEVERAGE": 15,
          "RETAIL": 8,
          "TECHNICAL": 12,
          "COMFORT": 10
        }
      },
      "access_points_summary": {
        "total": 16,
        "public_entrances": 8,
        "vip_entrances": 4,
        "service_entrances": 4
      },
      "upcoming_events": {
        "count": 8,
        "next_event": {
          "id": "match-est-ca",
          "name": "EST vs CA",
          "date": "2024-04-15T20:00:00Z",
          "type": "SPORTS_MATCH"
        }
      },
      "availability": {
        "next_available": "2024-04-20",
        "booking_horizon": 365,
        "blackout_dates": ["2024-07-15", "2024-08-30"]
      },
      "status": {
        "is_active": true,
        "is_verified": true,
        "operational_status": "OPERATIONAL",
        "maintenance_schedule": "Monthly first Sunday"
      },
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-03-20T15:30:00Z"
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### PUT /api/v1/venues/{id}
**Description** : Mise à jour complète d'un lieu

### PATCH /api/v1/venues/{id}
**Description** : Mise à jour partielle d'un lieu

### DELETE /api/v1/venues/{id}
**Description** : Désactivation d'un lieu (soft delete)

### POST /api/v1/venues/{id}/verify
**Description** : Vérification d'un lieu (admin/gestionnaire uniquement)

### GET /api/v1/venues/{id}/availability
**Description** : Vérification disponibilité d'un lieu

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `start_date` | date | - | Date début (requis) |
| `end_date` | date | - | Date fin (requis) |
| `event_type` | string | - | Type d'événement |
| `capacity_needed` | integer | - | Capacité requise |

#### Response 200
```json
{
  "success": true,
  "data": {
    "venue_id": "stade-rades-tunis",
    "period": {
      "start_date": "2024-04-01",
      "end_date": "2024-04-30"
    },
    "availability": {
      "is_available": false,
      "available_dates": [
        "2024-04-02", "2024-04-03", "2024-04-05",
        "2024-04-08", "2024-04-09", "2024-04-12"
      ],
      "blocked_dates": [
        {
          "date": "2024-04-15",
          "reason": "BOOKED",
          "event": "EST vs CA Derby",
          "type": "SPORTS_MATCH"
        },
        {
          "date": "2024-04-07",
          "reason": "MAINTENANCE",
          "description": "Terrain maintenance"
        }
      ],
      "partial_availability": [
        {
          "date": "2024-04-20",
          "available_configurations": ["concert-arena"],
          "blocked_configurations": ["football-standard"],
          "reason": "Partial booking"
        }
      ]
    },
    "recommendations": [
      {
        "date": "2024-04-22",
        "configuration": "football-standard",
        "capacity": 60000,
        "estimated_cost": 25000.00,
        "priority": "HIGH"
      }
    ]
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/venues/search-nearby
**Description** : Recherche de lieux à proximité avec critères avancés

#### Request Body
```json
{
  "center": {
    "latitude": 36.8065,
    "longitude": 10.1815
  },
  "radius_km": 20,
  "criteria": {
    "capacity_min": 1000,
    "types": ["THEATER", "CONCERT_HALL", "AUDITORIUM"],
    "amenities_required": ["PARKING", "ACCESSIBILITY", "SOUND_SYSTEM"],
    "availability_date": "2024-05-15"
  },
  "sort_by": "distance",
  "limit": 10
}
```

---

# API Configurations de lieux

## 🔧 Ressource : `/api/v1/venues/{venue_id}/mappings`

### GET /api/v1/venues/{venue_id}/mappings
**Description** : Liste des configurations disponibles pour un lieu

#### Response 200
```json
{
  "success": true,
  "data": {
    "mappings": [
      {
        "id": "football-standard",
        "venue_id": "stade-rades-tunis",
        "code": "FOOTBALL_STD",
        "name": "Configuration Football Standard",
        "description": "Configuration standard pour matchs de football",
        "layout_type": "SPORTS_STADIUM",
        "event_types": ["SPORTS_MATCH", "FOOTBALL"],
        "effective_capacity": 60000,
        "configuration": {
          "field_setup": "football_pitch",
          "seating_arrangement": "stadium_seating",
          "restricted_areas": ["pitch", "player_tunnels"]
        },
        "zones_count": 8,
        "total_seats": 60000,
        "accessibility_features": {
          "wheelchair_spaces": 300,
          "elevator_access": true,
          "accessible_restrooms": 24
        },
        "safety_specifications": {
          "max_occupancy": 60000,
          "emergency_exits": 16,
          "evacuation_time": 8
        },
        "valid_from": "2024-01-01",
        "valid_until": null,
        "is_default": true,
        "is_active": true,
        "usage_stats": {
          "events_hosted": 28,
          "avg_occupancy": 85.5,
          "last_used": "2024-03-15"
        },
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-03-20T15:30:00Z"
      },
      {
        "id": "concert-arena",
        "venue_id": "stade-rades-tunis", 
        "code": "CONCERT_ARENA",
        "name": "Configuration Concert",
        "description": "Configuration optimisée pour concerts et spectacles",
        "layout_type": "CONCERT_VENUE",
        "event_types": ["CONCERT", "FESTIVAL", "SHOW"],
        "effective_capacity": 45000,
        "configuration": {
          "stage_setup": "center_stage",
          "seating_arrangement": "amphitheater",
          "sound_zones": ["main", "delay", "vip"]
        },
        "zones_count": 6,
        "total_seats": 30000,
        "standing_areas": 15000,
        "technical_specs": {
          "stage_size": "40m x 25m",
          "pa_system": "L-Acoustics K2",
          "lighting_rig": "Full arena lighting"
        },
        "is_default": false,
        "is_active": true,
        "setup_time_hours": 24,
        "breakdown_time_hours": 12,
        "created_at": "2024-02-01T14:00:00Z"
      }
    ],
    "summary": {
      "total_mappings": 2,
      "active_mappings": 2,
      "default_mapping": "football-standard",
      "most_used": "football-standard"
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/venues/{venue_id}/mappings
**Description** : Création d'une nouvelle configuration

#### Request Body
```json
{
  "code": "THEATER_CONFIG",
  "name": "Configuration Théâtrale",
  "description": "Setup pour pièces de théâtre et one-man shows",
  "layout_type": "THEATER_VENUE",
  "event_types": ["THEATER", "COMEDY", "MONOLOGUE"],
  "effective_capacity": 35000,
  "configuration": {
    "stage_setup": "proscenium_stage",
    "seating_arrangement": "theater_style",
    "acoustic_setup": "natural_acoustics"
  },
  "technical_specifications": {
    "stage_size": "20m x 15m",
    "lighting_system": "Theater lighting grid",
    "sound_system": "Natural + reinforcement"
  },
  "safety_specifications": {
    "max_occupancy": 35000,
    "emergency_procedures": "Theater evacuation protocol"
  },
  "setup_requirements": {
    "setup_time_hours": 16,
    "breakdown_time_hours": 8,
    "crew_required": 25
  }
}
```

### GET /api/v1/venues/{venue_id}/mappings/{mapping_id}
**Description** : Détails complets d'une configuration

### PUT /api/v1/venues/{venue_id}/mappings/{mapping_id}
**Description** : Mise à jour configuration

### DELETE /api/v1/venues/{venue_id}/mappings/{mapping_id}
**Description** : Suppression configuration

---

# API Zones et espaces

## 🎯 Ressource : `/api/v1/venues/{venue_id}/mappings/{mapping_id}/zones`

### GET /api/v1/venues/{venue_id}/mappings/{mapping_id}/zones
**Description** : Liste hiérarchique des zones d'une configuration

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `level` | integer | - | Niveau spécifique |
| `type` | enum | - | Type de zone |
| `category` | enum | - | Catégorie zone |
| `include_seats` | boolean | false | Inclure détails sièges |
| `include_amenities` | boolean | false | Inclure services |
| `hierarchy` | boolean | true | Structure hiérarchique |

#### Response 200
```json
{
  "success": true,
  "data": {
    "zones": [
      {
        "id": "tribune-officielle",
        "venue_id": "stade-rades-tunis",
        "mapping_id": "football-standard",
        "code": "TRIB_OFF",
        "name": "Tribune Officielle",
        "display_name": "Tribune d'Honneur",
        "type": "SEATED",
        "category": "VIP",
        "level": 1,
        "section": "A",
        "description": "Tribune principale avec places VIP et protocole",
        "capacity": {
          "total": 2000,
          "seated": 2000,
          "standing": 0,
          "wheelchair": 40
        },
        "layout": {
          "row_count": 25,
          "seats_per_row_avg": 80.0,
          "row_numbering": "1-25",
          "seat_numbering": "1-80"
        },
        "pricing": {
          "base_price": 150.00,
          "currency": "TND",
          "price_category": "PREMIUM"
        },
        "view_quality": {
          "quality": "EXCELLENT",
          "distance_to_stage": 45.50,
          "angle_to_stage": 15,
          "elevation": 8.50
        },
        "physical_specs": {
          "surface_area": 3200.0,
          "ceiling_height": 4.5,
          "covered": true,
          "climate_controlled": true
        },
        "accessibility": {
          "wheelchair_accessible": true,
          "elevator_access": true,
          "accessible_restrooms": true,
          "audio_assistance": true,
          "braille_signage": true
        },
        "amenities": [
          {
            "type": "HOSPITALITY",
            "name": "VIP Lounge",
            "description": "Salon privé avec restauration"
          },
          {
            "type": "FACILITIES",
            "name": "Premium Restrooms",
            "description": "Sanitaires premium"
          }
        ],
        "access_control": {
          "entry_points": ["Entrée VIP A", "Entrée VIP B"],
          "emergency_exits": ["Sortie Secours 1", "Sortie Secours 2"],
          "security_level": "HIGH",
          "special_access_required": true
        },
        "restrictions": {
          "age_restrictions": null,
          "dress_code": "Smart casual requis",
          "special_conditions": ["Accès avec invitation", "Contrôle sécurité renforcé"]
        },
        "coordinates": {
          "center_x": 150.5,
          "center_y": 75.0,
          "boundaries": {
            "min_x": 100.0,
            "max_x": 200.0,
            "min_y": 50.0,
            "max_y": 100.0
          }
        },
        "is_active": true,
        "is_premium": true,
        "requires_special_access": true,
        "parent_zone_id": null,
        "child_zones": [
          {
            "id": "loge-presidentielle",
            "name": "Loge Présidentielle",
            "type": "VIP_BOX",
            "capacity": 20
          }
        ],
        "seat_count": 2000,
        "available_seats": 1950,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-03-20T15:30:00Z"
      }
    ],
    "hierarchy": {
      "total_levels": 3,
      "zones_by_level": {
        "1": 8,
        "2": 24,
        "3": 12
      }
    },
    "summary": {
      "total_zones": 44,
      "total_capacity": 60000,
      "seated_capacity": 60000,
      "standing_capacity": 0,
      "vip_capacity": 3500,
      "wheelchair_capacity": 300
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/venues/{venue_id}/mappings/{mapping_id}/zones
**Description** : Création d'une nouvelle zone

#### Request Body
```json
{
  "code": "KOLT_ULTRAS",
  "name": "Kolt Ultras",
  "display_name": "Tribune des Supporters",
  "type": "STANDING",
  "category": "GENERAL",
  "level": 0,
  "section": "D",
  "description": "Zone debout réservée aux supporters actifs",
  "capacity": {
    "total": 5000,
    "standing": 5000,
    "wheelchair": 25
  },
  "pricing": {
    "base_price": 25.00,
    "currency": "TND"
  },
  "view_quality": "GOOD",
  "physical_specs": {
    "surface_area": 2500.0,
    "covered": false
  },
  "accessibility": {
    "wheelchair_accessible": true,
    "dedicated_wheelchair_area": true
  },
  "special_features": {
    "allows_standing": true,
    "allows_flags": true,
    "allows_drums": true,
    "noise_level": "HIGH"
  },
  "restrictions": {
    "age_minimum": 16,
    "behavior_code": "Supporter guidelines required"
  },
  "coordinates": {
    "center_x": 300.0,
    "center_y": 150.0
  }
}
```

### GET /api/v1/venues/{venue_id}/mappings/{mapping_id}/zones/{zone_id}
**Description** : Détails complets d'une zone

### PUT /api/v1/venues/{venue_id}/mappings/{mapping_id}/zones/{zone_id}
**Description** : Mise à jour zone

### DELETE /api/v1/venues/{venue_id}/mappings/{mapping_id}/zones/{zone_id}
**Description** : Suppression zone

---

# API Sièges

## 💺 Ressource : `/api/v1/zones/{zone_id}/seats`

### GET /api/v1/zones/{zone_id}/seats
**Description** : Inventaire des sièges d'une zone avec statuts

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 100 | Sièges par page |
| `row_number` | string | - | Rangée spécifique |
| `seat_type` | enum | - | Type de siège |
| `is_available` | boolean | - | Sièges disponibles |
| `is_accessible` | boolean | - | Sièges accessibles |
| `quality_level` | enum | - | Niveau qualité |
| `view_category` | enum | - | Catégorie vue |
| `price_range` | string | - | Fourchette prix (min-max) |
| `format` | string | `detailed` | Format (detailed, summary, map) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "seats": [
      {
        "id": "seat-trib-a-01-001",
        "zone_id": "tribune-officielle",
        "row_number": "1",
        "seat_number": "1",
        "display_label": "A1-1",
        "position": {
          "row": "1",
          "seat": "1",
          "section": "A"
        },
        "type": "VIP",
        "quality_level": "LUXURY",
        "view_category": "FRONT_ROW",
        "characteristics": {
          "is_aisle": false,
          "is_accessible": false,
          "requires_companion": false,
          "has_armrests": true,
          "has_cup_holder": true,
          "is_foldable": true,
          "extra_legroom": true
        },
        "dimensions": {
          "width_cm": 55.0,
          "depth_cm": 80.0,
          "padding": "Premium leather"
        },
        "coordinates": {
          "x": 125.5,
          "y": 50.0,
          "distance_to_stage": 45.2,
          "viewing_angle": 12
        },
        "pricing": {
          "price_modifier": 2.50,
          "category": "ULTRA_PREMIUM"
        },
        "status": {
          "is_active": true,
          "is_blocked": false,
          "condition_status": "EXCELLENT",
          "last_maintenance": "2024-03-01"
        },
        "amenities": {
          "services_included": ["Concierge", "Premium catering"],
          "facilities_nearby": ["VIP Lounge", "Premium Bar"]
        },
        "booking_info": {
          "is_bookable": true,
          "requires_membership": true,
          "advance_booking_required": 7
        },
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-03-15T14:20:00Z"
      }
    ],
    "zone_summary": {
      "zone_id": "tribune-officielle",
      "zone_name": "Tribune Officielle",
      "total_seats": 2000,
      "seats_returned": 50,
      "pagination": {
        "current_page": 1,
        "per_page": 50,
        "total_pages": 40
      }
    },
    "availability_summary": {
      "available": 1950,
      "blocked": 25,
      "maintenance": 15,
      "vip_reserved": 10
    },
    "quality_distribution": {
      "LUXURY": 500,
      "PREMIUM": 800,
      "COMFORT": 600,
      "STANDARD": 100
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/zones/{zone_id}/seats/bulk
**Description** : Création en lot de sièges pour une zone

#### Request Body
```json
{
  "generation_pattern": {
    "row_start": 1,
    "row_end": 25,
    "row_prefix": "",
    "seat_start": 1,
    "seat_end": 80,
    "seat_prefix": "",
    "skip_patterns": [
      {"row": "13", "reason": "Superstition"},
      {"seats": ["13"], "reason": "Unlucky number"}
    ]
  },
  "seat_defaults": {
    "seat_type": "PREMIUM",
    "quality_level": "COMFORT",
    "has_armrests": true,
    "has_cup_holder": false,
    "width_cm": 50.0,
    "depth_cm": 75.0
  },
  "special_configurations": [
    {
      "rows": ["1", "2"],
      "seat_type": "VIP",
      "quality_level": "LUXURY",
      "price_modifier": 2.0
    },
    {
      "row": "25",
      "positions": ["1", "2", "79", "80"],
      "is_accessible": true,
      "requires_companion": true
    }
  ],
  "aisle_configuration": {
    "aisles_at_seats": [20, 40, 60],
    "mark_aisle_seats": true
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "generation_summary": {
      "zone_id": "tribune-officielle",
      "total_seats_created": 1985,
      "skipped_seats": 15,
      "rows_created": 25,
      "special_configurations_applied": 2,
      "generation_time_seconds": 2.5
    },
    "seat_breakdown": {
      "VIP": 160,
      "PREMIUM": 1700,
      "ACCESSIBLE": 125
    }
  },
  "message": "Seats generated successfully",
  "timestamp": "2024-03-20T16:15:00Z"
}
```

### PUT /api/v1/zones/{zone_id}/seats/{seat_id}
**Description** : Mise à jour d'un siège

### DELETE /api/v1/zones/{zone_id}/seats/{seat_id}
**Description** : Suppression siège

### POST /api/v1/zones/{zone_id}/seats/{seat_id}/block
**Description** : Blocage temporaire d'un siège

#### Request Body
```json
{
  "reason": "MAINTENANCE",
  "blocked_until": "2024-04-15",
  "notes": "Remplacement accoudoir cassé"
}
```

### POST /api/v1/zones/{zone_id}/seats/optimize-layout
**Description** : Optimisation automatique disposition sièges

#### Request Body
```json
{
  "optimization_goals": ["maximize_revenue", "improve_view_quality"],
  "constraints": {
    "accessibility_ratio": 0.05,
    "aisle_spacing": 20,
    "emergency_exit_clearance": 1.5
  },
  "event_type": "CONCERT"
}
```

---

# API Points d'accès

## 🚪 Ressource : `/api/v1/venues/{venue_id}/mappings/{mapping_id}/access-points`

### GET /api/v1/venues/{venue_id}/mappings/{mapping_id}/access-points
**Description** : Points d'entrée/sortie avec niveaux de sécurité

#### Response 200
```json
{
  "success": true,
  "data": {
    "access_points": [
      {
        "id": "entrance-main-a",
        "mapping_id": "football-standard",
        "code": "MAIN_A",
        "name": "Entrée Principale A",
        "description": "Entrée principale côté avenue",
        "access_type": "ENTRANCE",
        "security_level": "STANDARD",
        "coordinates": {
          "latitude": 36.7520,
          "longitude": 10.2815,
          "relative_x": 100.0,
          "relative_y": 200.0
        },
        "capacity": {
          "max_throughput_per_hour": 5000,
          "recommended_throughput": 3500,
          "simultaneous_capacity": 150
        },
        "zones_served": {
          "allowed_zones": ["tribune-est", "tribune-sud", "general-admission"],
          "restricted_zones": ["tribune-officielle", "vip-areas"],
          "emergency_zones": ["all"]
        },
        "operating_schedule": {
          "opens_before_event": 120,
          "closes_before_event": 15,
          "emergency_operation": "24/7"
        },
        "security_features": {
          "metal_detectors": true,
          "bag_scanners": true,
          "biometric_scanners": false,
          "cctv_coverage": true,
          "security_personnel": 6
        },
        "accessibility": {
          "wheelchair_accessible": true,
          "width_meters": 4.0,
          "automatic_doors": true,
          "tactile_guidance": true
        },
        "technology": {
          "qr_scanners": 8,
          "rfid_readers": 4,
          "turnstiles": 12,
          "backup_power": true
        },
        "crowd_management": {
          "queue_capacity": 500,
          "estimated_wait_time": 8,
          "crowd_control_barriers": true,
          "staff_required": 10
        },
        "is_active": true,
        "operational_status": "OPERATIONAL",
        "last_maintenance": "2024-03-10",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "total_access_points": 16,
      "by_type": {
        "ENTRANCE": 8,
        "EXIT": 4,
        "EMERGENCY_EXIT": 4
      },
      "total_capacity": 40000,
      "security_levels": {
        "STANDARD": 12,
        "HIGH": 4
      }
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/venues/{venue_id}/mappings/{mapping_id}/access-points
**Description** : Création nouveau point d'accès

### GET /api/v1/venues/{venue_id}/mappings/{mapping_id}/access-points/{access_point_id}
**Description** : Détails point d'accès

### PUT /api/v1/venues/{venue_id}/mappings/{mapping_id}/access-points/{access_point_id}
**Description** : Mise à jour point d'accès

---

# API Services et équipements

## ⚙️ Ressource : `/api/v1/venues/{venue_id}/amenities`

### GET /api/v1/venues/{venue_id}/amenities
**Description** : Services et équipements disponibles

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `category` | enum | - | Catégorie service |
| `is_available` | boolean | - | Services disponibles |
| `is_free` | boolean | - | Services gratuits |
| `zone_id` | string | - | Services d'une zone |
| `requires_booking` | boolean | - | Nécessite réservation |

#### Response 200
```json
{
  "success": true,
  "data": {
    "amenities": [
      {
        "id": "restaurant-vip-lounge",
        "venue_id": "stade-rades-tunis",
        "mapping_id": "football-standard",
        "zone_id": "tribune-officielle",
        "category": "FOOD_BEVERAGE",
        "type": "RESTAURANT",
        "name": "Restaurant VIP",
        "description": "Restaurant gastronomique avec vue panoramique",
        "provider": {
          "name": "Gourmet Tunis Catering",
          "contact_email": "contact@gourmettunis.tn",
          "contact_phone": "+216 71 456 789"
        },
        "location": {
          "level": 2,
          "section": "VIP",
          "description": "Étage VIP, section centrale"
        },
        "capacity": {
          "total_seats": 120,
          "private_rooms": 3,
          "bar_seats": 20
        },
        "operating_hours": {
          "regular": {
            "monday": "11:00-23:00",
            "tuesday": "11:00-23:00",
            "wednesday": "11:00-23:00",
            "thursday": "11:00-23:00",
            "friday": "11:00-24:00",
            "saturday": "11:00-24:00",
            "sunday": "11:00-23:00"
          },
          "event_days": "2 hours before event - 1 hour after event"
        },
        "pricing": {
          "price_range": "150-300 TND per person",
          "currency": "TND",
          "menu_types": ["À la carte", "Set menus", "Event packages"],
          "group_discounts": true
        },
        "services": {
          "cuisine_types": ["Mediterranean", "Tunisian", "International"],
          "dietary_options": ["Vegetarian", "Vegan", "Halal", "Gluten-free"],
          "private_dining": true,
          "catering_service": true,
          "wine_selection": true
        },
        "booking": {
          "reservation_required": true,
          "advance_booking_days": 7,
          "online_booking": true,
          "cancellation_policy": "48h advance notice"
        },
        "amenities_included": [
          "Premium service",
          "Complimentary Wi-Fi",
          "Coat check",
          "Private restrooms"
        ],
        "accessibility": {
          "wheelchair_accessible": true,
          "braille_menus": true,
          "hearing_loop": true
        },
        "ratings": {
          "food_quality": 4.5,
          "service": 4.3,
          "ambiance": 4.7,
          "value": 3.9
        },
        "is_available": true,
        "is_premium": true,
        "requires_membership": false,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-03-20T15:30:00Z"
      }
    ],
    "categories_summary": {
      "FOOD_BEVERAGE": {
        "count": 15,
        "types": ["Restaurant", "Bar", "Café", "Fast Food", "Catering"]
      },
      "RETAIL": {
        "count": 8,
        "types": ["Gift Shop", "Sports Store", "Boutique"]
      },
      "TECHNICAL": {
        "count": 12,
        "types": ["Audio/Visual", "Lighting", "Internet", "Power"]
      },
      "FACILITIES": {
        "count": 20,
        "types": ["Parking", "Restrooms", "Storage", "Medical"]
      }
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/venues/{venue_id}/amenities
**Description** : Ajout nouveau service

### GET /api/v1/venues/{venue_id}/amenities/{amenity_id}
**Description** : Détails service

### PUT /api/v1/venues/{venue_id}/amenities/{amenity_id}
**Description** : Mise à jour service

---

# API Médias des lieux

## 📸 Ressource : `/api/v1/venues/{venue_id}/media`

### GET /api/v1/venues/{venue_id}/media
**Description** : Galerie multimédia d'un lieu

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `media_type` | enum | - | Type média |
| `category` | enum | - | Catégorie |
| `zone_id` | string | - | Médias d'une zone |
| `is_featured` | boolean | - | Médias mis en avant |
| `is_public` | boolean | - | Médias publics |

#### Response 200
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "photo-stade-general-001",
        "venue_id": "stade-rades-tunis",
        "mapping_id": "football-standard",
        "zone_id": null,
        "media_type": "PHOTO",
        "category": "GENERAL",
        "title": "Vue Générale du Stade",
        "description": "Vue panoramique du stade lors d'un match",
        "file_info": {
          "url": "https://media.entrix.tn/venues/stade-rades/general-view-001.jpg",
          "thumbnail_url": "https://media.entrix.tn/venues/stade-rades/thumbs/general-view-001.jpg",
          "filename": "stade-rades-general-001.jpg",
          "file_size": 2547890,
          "dimensions": {
            "width": 4000,
            "height": 3000,
            "aspect_ratio": "4:3"
          },
          "format": "JPEG",
          "quality": "HIGH"
        },
        "metadata": {
          "photographer": "Ahmed Photographe",
          "shoot_date": "2024-03-15",
          "camera": "Canon EOS R5",
          "settings": "f/8, 1/250s, ISO 200"
        },
        "usage_rights": {
          "is_public": true,
          "commercial_use": true,
          "attribution_required": false,
          "copyright": "© 2024 Entrix Platform"
        },
        "display_settings": {
          "is_featured": true,
          "display_order": 1,
          "show_in_gallery": true,
          "show_in_listings": true
        },
        "analytics": {
          "view_count": 15420,
          "download_count": 89,
          "last_viewed": "2024-03-20T14:30:00Z"
        },
        "created_at": "2024-03-15T16:45:00Z",
        "updated_at": "2024-03-20T15:30:00Z"
      },
      {
        "id": "plan-interactive-001",
        "venue_id": "stade-rades-tunis",
        "media_type": "PLAN",
        "category": "SEATING_CHART",
        "title": "Plan Interactif des Places",
        "description": "Plan interactif avec sélection de places",
        "file_info": {
          "url": "https://media.entrix.tn/venues/stade-rades/interactive-plan.svg",
          "format": "SVG",
          "interactive": true
        },
        "is_featured": true,
        "display_order": 2,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "total_media": 48,
      "by_type": {
        "PHOTO": 35,
        "VIDEO": 8,
        "PLAN": 3,
        "VIRTUAL_TOUR": 2
      },
      "by_category": {
        "GENERAL": 15,
        "ZONES": 20,
        "AMENITIES": 8,
        "EVENTS": 5
      },
      "storage_usage": "2.4 GB"
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/venues/{venue_id}/media
**Description** : Upload nouveau média

#### Request (multipart/form-data)
```
file: [MEDIA_FILE]
media_type: "PHOTO" | "VIDEO" | "PLAN" | "VIRTUAL_TOUR"
category: "GENERAL" | "ZONES" | "AMENITIES" | "EVENTS"
title: "Titre du média"
description: "Description détaillée"
zone_id: [ZONE_ID] (optionnel)
is_featured: true|false
is_public: true|false
```

### DELETE /api/v1/venues/{venue_id}/media/{media_id}
**Description** : Suppression média

---

# API Analytics et optimisation

## 📊 Ressource : `/api/v1/venues/{venue_id}/analytics`

### GET /api/v1/venues/{venue_id}/analytics/occupancy
**Description** : Analytics d'occupation et utilisation

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `start_date` | date | - | Date début période |
| `end_date` | date | - | Date fin période |
| `granularity` | enum | `daily` | Granularité (daily, weekly, monthly) |
| `event_type` | string | - | Type d'événement |
| `zone_breakdown` | boolean | false | Détail par zone |

#### Response 200
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-03-31",
      "total_days": 90
    },
    "overall_metrics": {
      "total_events": 28,
      "total_attendees": 1247500,
      "average_occupancy": 72.5,
      "capacity_utilization": 0.725,
      "revenue_per_event": 45000.00,
      "revenue_per_attendee": 18.50
    },
    "occupancy_trends": [
      {
        "date": "2024-01-15",
        "event": "EST vs CA",
        "attendance": 58500,
        "capacity": 60000,
        "occupancy_rate": 97.5,
        "revenue": 890000.00
      }
    ],
    "zone_performance": [
      {
        "zone_id": "tribune-officielle",
        "zone_name": "Tribune Officielle",
        "average_occupancy": 95.2,
        "revenue_per_seat": 285.00,
        "most_popular_events": ["Football matches", "VIP concerts"]
      }
    ],
    "event_type_breakdown": {
      "SPORTS_MATCH": {
        "events": 18,
        "avg_occupancy": 89.5,
        "total_revenue": 1200000.00
      },
      "CONCERT": {
        "events": 8,
        "avg_occupancy": 76.3,
        "total_revenue": 850000.00
      }
    },
    "seasonal_patterns": {
      "peak_months": ["March", "April", "September"],
      "low_months": ["July", "August"],
      "weekend_vs_weekday": {
        "weekend_occupancy": 85.2,
        "weekday_occupancy": 65.8
      }
    },
    "recommendations": [
      {
        "type": "PRICING_OPTIMIZATION",
        "description": "Augmenter prix zone VIP pour événements football",
        "potential_revenue_increase": "15%"
      },
      {
        "type": "CAPACITY_OPTIMIZATION", 
        "description": "Reconfigurer zones pour concerts",
        "potential_capacity_increase": "8%"
      }
    ]
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/venues/{venue_id}/analytics/optimize-layout
**Description** : Optimisation automatique du layout pour un événement

#### Request Body
```json
{
  "event_type": "CONCERT",
  "expected_attendance": 35000,
  "target_revenue": 750000.00,
  "constraints": {
    "preserve_accessibility": true,
    "minimum_vip_ratio": 0.15,
    "maximum_standing_ratio": 0.40
  },
  "optimization_goals": [
    "maximize_revenue",
    "improve_view_quality", 
    "optimize_flow"
  ]
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "optimization_result": {
      "optimized_layout": {
        "total_capacity": 35000,
        "revenue_projection": 780000.00,
        "improvement": "4% revenue increase"
      },
      "zone_modifications": [
        {
          "zone_id": "central-standing",
          "modification": "Convert 2000 seats to standing",
          "impact": "+12% capacity"
        }
      ],
      "pricing_adjustments": [
        {
          "zone_id": "tribune-vip",
          "current_price": 200.00,
          "suggested_price": 235.00,
          "justification": "High demand, excellent view quality"
        }
      ]
    },
    "simulation_metrics": {
      "estimated_occupancy": 94.3,
      "crowd_flow_efficiency": 8.7,
      "accessibility_compliance": 100,
      "evacuation_time": 7.2
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

---

# Codes d'erreur

## 🚨 Codes d'erreur spécifiques au module

| Code | Message | Description |
|------|---------|-------------|
| `VENUE_NOT_FOUND` | Venue not found | Lieu inexistant |
| `VENUE_SLUG_EXISTS` | Venue slug already exists | Slug lieu déjà utilisé |
| `VENUE_INACTIVE` | Venue is not active | Lieu inactif |
| `MAPPING_NOT_FOUND` | Venue mapping not found | Configuration inexistante |
| `MAPPING_INVALID_FOR_EVENT` | Mapping not suitable for event type | Configuration inadaptée |
| `ZONE_NOT_FOUND` | Zone not found | Zone inexistante |
| `ZONE_CAPACITY_EXCEEDED` | Zone capacity exceeded | Capacité zone dépassée |
| `SEAT_NOT_FOUND` | Seat not found | Siège inexistant |
| `SEAT_POSITION_TAKEN` | Seat position already exists | Position siège occupée |
| `SEAT_BLOCKED` | Seat is blocked | Siège bloqué |
| `ACCESS_POINT_NOT_FOUND` | Access point not found | Point d'accès inexistant |
| `ACCESS_POINT_INACTIVE` | Access point is inactive | Point d'accès inactif |
| `AMENITY_NOT_AVAILABLE` | Amenity not available | Service indisponible |
| `MEDIA_UPLOAD_FAILED` | Media upload failed | Échec upload média |
| `VENUE_NOT_AVAILABLE` | Venue not available for date | Lieu indisponible |
| `UNAUTHORIZED_VENUE_ACCESS` | Unauthorized access to venue | Accès non autorisé au lieu |

---

# Exemples d'usage

## 🎯 Cas d'usage typiques

### 1. Recherche de lieux par proximité et critères

```bash
# Recherche stades près de Tunis avec capacité > 20000
curl -G "https://api.entrix.tn/v1/venues" \
  -H "Authorization: Bearer $TOKEN" \
  -d "lat=36.8065" \
  -d "lng=10.1815" \
  -d "radius=30" \
  -d "type=STADIUM" \
  -d "capacity_min=20000" \
  -d "sort=distance"

# Recherche lieux avec accessibilité et parking
curl -G "https://api.entrix.tn/v1/venues" \
  -H "Authorization: Bearer $TOKEN" \
  -d "has_accessibility=true" \
  -d "amenities=PARKING,WHEELCHAIR_ACCESS"
```

### 2. Configuration complète d'un nouveau lieu

```bash
# 1. Créer le lieu principal
VENUE_ID=$(curl -X POST "https://api.entrix.tn/v1/venues" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "SALLE_CARTHAGE",
    "name": "Salle des Congrès de Carthage",
    "type": "CONFERENCE_CENTER",
    "capacity": {"total": 2000, "seated": 2000}
  }' | jq -r '.data.venue.id')

# 2. Créer configuration principale
MAPPING_ID=$(curl -X POST "https://api.entrix.tn/v1/venues/$VENUE_ID/mappings" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "CONFERENCE_STD",
    "name": "Configuration Conférence",
    "event_types": ["CONFERENCE", "SEMINAR"]
  }' | jq -r '.data.mapping.id')

# 3. Créer zones
curl -X POST "https://api.entrix.tn/v1/venues/$VENUE_ID/mappings/$MAPPING_ID/zones" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "AMPHITHEATER",
    "name": "Amphithéâtre Principal",
    "type": "SEATED",
    "capacity": {"total": 1500, "seated": 1500}
  }'

# 4. Générer sièges automatiquement
curl -X POST "https://api.entrix.tn/v1/zones/$ZONE_ID/seats/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "generation_pattern": {
      "row_start": 1, "row_end": 30,
      "seat_start": 1, "seat_end": 50
    }
  }'
```

### 3. Gestion événement avec configuration spéciale

```bash
# 1. Vérifier disponibilité lieu
curl -G "https://api.entrix.tn/v1/venues/$VENUE_ID/availability" \
  -H "Authorization: Bearer $TOKEN" \
  -d "start_date=2024-06-15" \
  -d "end_date=2024-06-15" \
  -d "event_type=CONCERT"

# 2. Optimiser layout pour concert
curl -X POST "https://api.entrix.tn/v1/venues/$VENUE_ID/analytics/optimize-layout" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "event_type": "CONCERT",
    "expected_attendance": 25000,
    "optimization_goals": ["maximize_revenue"]
  }'

# 3. Créer configuration optimisée
curl -X POST "https://api.entrix.tn/v1/venues/$VENUE_ID/mappings" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "CONCERT_OPTIMIZED",
    "name": "Configuration Concert Optimisée",
    "event_types": ["CONCERT"],
    "effective_capacity": 25000
  }'
```

### 4. Gestion des médias et galerie

```bash
# 1. Upload photo principale
curl -X POST "https://api.entrix.tn/v1/venues/$VENUE_ID/media" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@venue-main-photo.jpg" \
  -F "media_type=PHOTO" \
  -F "category=GENERAL" \
  -F "title=Vue Principale" \
  -F "is_featured=true"

# 2. Upload plan interactif
curl -X POST "https://api.entrix.tn/v1/venues/$VENUE_ID/media" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@seating-plan.svg" \
  -F "media_type=PLAN" \
  -F "category=SEATING_CHART" \
  -F "title=Plan des Places Interactif"

# 3. Consulter galerie complète
curl -G "https://api.entrix.tn/v1/venues/$VENUE_ID/media" \
  -H "Authorization: Bearer $TOKEN" \
  -d "is_public=true"
```

### 5. Analytics et optimisation

```bash
# Analytics d'occupation des 3 derniers mois
curl -G "https://api.entrix.tn/v1/venues/$VENUE_ID/analytics/occupancy" \
  -H "Authorization: Bearer $TOKEN" \
  -d "start_date=2024-01-01" \
  -d "end_date=2024-03-31" \
  -d "zone_breakdown=true"

# Performance par zone
curl -G "https://api.entrix.tn/v1/venues/$VENUE_ID/analytics/zones" \
  -H "Authorization: Bearer $TOKEN" \
  -d "metric=revenue_per_seat"

# Recommandations d'optimisation
curl -G "https://api.entrix.tn/v1/venues/$VENUE_ID/analytics/recommendations" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Workflow gestionnaire de lieu

```bash
# 1. Consulter mes lieux gérés
curl -G "https://api.entrix.tn/v1/venues" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Venue-Manager-ID: $USER_ID"

# 2. Mettre à jour équipements
curl -X PUT "https://api.entrix.tn/v1/venues/$VENUE_ID/amenities/$AMENITY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "is_available": false,
    "unavailable_reason": "Maintenance programmée",
    "estimated_return": "2024-04-01"
  }'

# 3. Bloquer sièges pour maintenance
curl -X POST "https://api.entrix.tn/v1/zones/$ZONE_ID/seats/$SEAT_ID/block" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reason": "MAINTENANCE",
    "blocked_until": "2024-04-15",
    "notes": "Réparation accoudoir"
  }'
```

---

## 📝 Notes importantes

### Permissions et sécurité
- Les détails complets ne sont visibles qu'aux gestionnaires de lieux autorisés
- Les médias peuvent avoir des droits d'usage spécifiques
- Les configurations sont verrouillées pendant les événements actifs

### Performance et optimisation
- Les listes de lieux sont géolocalisées et optimisées pour la recherche proximité
- Les plans de sièges sont mis en cache pour les accès fréquents
- Les analytics sont précalculés et mis à jour quotidiennement

### Intégrations
- Les lieux s'intègrent automatiquement au système de billetterie
- Les points d'accès sont synchronisés avec le contrôle d'accès
- Les services peuvent être réservés via le système de billetterie

---

**Version API** : v1.0  
**Dernière mise à jour** : 20 Mars 2024  
**Auteur** : Équipe Entrix Development