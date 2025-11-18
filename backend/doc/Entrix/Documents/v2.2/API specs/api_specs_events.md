# API Specifications - Module Events
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Événements](#api-événements)
4. [API Catégories d'événements](#api-catégories-dévénements)
5. [API Groupes d'événements](#api-groupes-dévénements)
6. [API Programmes et horaires](#api-programmes-et-horaires)
7. [API Médias d'événements](#api-médias-dévénements)
8. [API Restrictions d'événements](#api-restrictions-dévénements)
9. [API Statistiques temps réel](#api-statistiques-temps-réel)
10. [API Workflows et statuts](#api-workflows-et-statuts)
11. [API Analytics et reporting](#api-analytics-et-reporting)
12. [Codes d'erreur](#codes-derreur)
13. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Events** constitue le **cœur métier central** d'Entrix V3.0. Il orchestre la gestion complète des événements depuis leur conception jusqu'à leur archivage, en coordonnant tous les autres modules (participants, lieux, billetterie, contrôle d'accès).

## 🏗️ Architecture

### Entités principales
- **Events** : Événements individuels (cœur du système)
- **Event Categories** : Types et catégories d'événements
- **Event Groups** : Groupements thématiques (festivals, tournois)
- **Event Schedules** : Programmes détaillés et timing
- **Event Media** : Contenus multimédias
- **Event Restrictions** : Conditions et restrictions d'accès
- **Event Stats** : Statistiques et résultats temps réel

### Cycle de vie événement
1. **DRAFT** → **PENDING_REVIEW** → **APPROVED** → **PUBLISHED**
2. **TICKET_SALES_OPEN** → **TICKET_SALES_CLOSED** → **SOLD_OUT**
3. **IN_PROGRESS** → **COMPLETED** → **ARCHIVED**

### Types d'événements supportés
- **Sports** : SPORTS_MATCH, TOURNAMENT, CHAMPIONSHIP
- **Culture** : CONCERT, THEATER, EXHIBITION, FESTIVAL
- **Business** : CONFERENCE, SEMINAR, NETWORKING, TRADE_SHOW
- **Communautaire** : COMMUNITY, CHARITY, FAMILY, EDUCATIONAL
- **Technologie** : VIRTUAL, HYBRID, INTERACTIVE

## 🔗 Relations avec autres modules
- **Organisateurs** : Propriété et gestion
- **Lieux** : Configuration venue et mapping
- **Participants** : Artistes, équipes, intervenants
- **Billetterie** : Ventes et tarification
- **Contrôle d'accès** : Validation QR codes

---

# Authentification et autorisation

## 🔐 Niveaux d'accès requis

### Lecture événements
- **Public** : Événements publiés et visibles
- **Organisateur** : Ses événements (tous statuts)
- **Partenaire** : Événements partagés
- **Super Admin** : Tous événements

### Gestion événements
- **Organisateur** : CRUD sur ses événements
- **Gestionnaire lieu** : Validation usage lieu
- **Super Admin** : Toutes opérations

### Analytics avancées
- **Organisateur** : Ses événements uniquement
- **Super Admin** : Analytics globales plateforme

## 🛡️ Headers requis

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Organizer-ID: <ORGANIZER_UUID> (si applicable)
X-Event-Context: <EVENT_UUID> (pour APIs contextuelles)
```

---

# API Événements

## 🎪 Ressource : `/api/v1/events`

### GET /api/v1/events
**Description** : Liste paginée d'événements avec filtres avancés et recherche

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page (max 100) |
| `organizer_id` | uuid | - | Événements d'un organisateur |
| `venue_id` | string | - | Événements d'un lieu |
| `type` | enum | - | Type événement |
| `category` | enum | - | Catégorie principale |
| `status` | enum | - | Statut événement |
| `visibility` | enum | - | Visibilité |
| `start_date` | date | - | Événements à partir de cette date |
| `end_date` | date | - | Événements jusqu'à cette date |
| `is_featured` | boolean | - | Événements mis en avant |
| `has_tickets_available` | boolean | - | Places disponibles |
| `price_min` | decimal | - | Prix minimum |
| `price_max` | decimal | - | Prix maximum |
| `city` | string | - | Ville |
| `tags` | string | - | Tags (séparés par virgule) |
| `participant_id` | uuid | - | Événements avec participant |
| `search` | string | - | Recherche textuelle |
| `sort` | string | `scheduled_start` | Tri (date, name, popularity, price) |
| `order` | string | `asc` | Ordre (asc, desc) |
| `include` | string | - | Relations (participants,venue,media,stats) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "derby-est-ca-2024",
        "slug": "derby-est-ca-tunis-2024",
        "organizer": {
          "id": "ligue-pro-tunisie",
          "name": "Ligue Professionnelle Tunisienne",
          "type": "SPORTS_FEDERATION"
        },
        "name": "Derby EST vs Club Africain",
        "display_name": "Derby Éternel de Tunis",
        "subtitle": "Match de championnat - 28ème journée",
        "description": "Le derby le plus attendu de la saison oppose les deux géants de la capitale...",
        "short_description": "Derby historique entre l'EST et le CA au Stade de Radès",
        "type": "SPORTS_MATCH",
        "category": "SPORTS",
        "subcategory": "FOOTBALL",
        "format": "IN_PERSON",
        "status": "PUBLISHED",
        "visibility": "PUBLIC",
        "language": "fr-TN",
        "additional_languages": ["ar-TN", "en"],
        "schedule": {
          "scheduled_start": "2024-04-15T20:00:00Z",
          "scheduled_end": "2024-04-15T22:00:00Z",
          "doors_open": "2024-04-15T18:00:00Z",
          "check_in_start": "2024-04-15T17:30:00Z",
          "timezone": "Africa/Tunis",
          "duration_minutes": 120
        },
        "venue": {
          "id": "stade-rades-tunis",
          "name": "Stade Olympique de Radès",
          "city": "Radès",
          "capacity": 60000,
          "configuration": "football-standard"
        },
        "participants": [
          {
            "id": "est-tunis",
            "name": "Espérance Sportive de Tunis",
            "role": "HOME_TEAM",
            "is_featured": true
          },
          {
            "id": "ca-tunis", 
            "name": "Club Africain",
            "role": "AWAY_TEAM",
            "is_featured": true
          }
        ],
        "ticketing": {
          "total_capacity": 60000,
          "tickets_sold": 47500,
          "tickets_available": 12500,
          "sales_status": "OPEN",
          "price_range": {
            "min": 25.00,
            "max": 300.00,
            "currency": "TND"
          },
          "sales_start": "2024-03-01T10:00:00Z",
          "sales_end": "2024-04-15T18:00:00Z"
        },
        "media": {
          "featured_image": "https://media.entrix.tn/events/derby-est-ca/poster.jpg",
          "gallery_count": 8,
          "has_video": true,
          "has_livestream": true
        },
        "metrics": {
          "popularity_score": 9.2,
          "interest_level": "VERY_HIGH",
          "social_mentions": 15420,
          "page_views": 125000,
          "conversion_rate": 18.5
        },
        "features": {
          "is_featured": true,
          "is_trending": true,
          "is_sold_out": false,
          "has_live_coverage": true,
          "allows_resale": true
        },
        "restrictions": [
          {
            "type": "AGE_LIMIT",
            "description": "Interdit aux moins de 16 ans",
            "is_strict": true
          }
        ],
        "tags": ["derby", "football", "championnat", "rivalry"],
        "created_at": "2024-02-15T14:30:00Z",
        "updated_at": "2024-03-20T16:45:00Z",
        "published_at": "2024-03-01T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 156,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    },
    "filters_summary": {
      "applied_filters": {
        "category": "SPORTS",
        "city": "Tunis",
        "status": "PUBLISHED"
      },
      "available_filters": {
        "categories": ["SPORTS", "MUSIC", "CULTURE"],
        "cities": ["Tunis", "Sfax", "Sousse"],
        "venues": ["Stade de Radès", "Théâtre Municipal"]
      }
    },
    "aggregations": {
      "by_category": {
        "SPORTS": 45,
        "MUSIC": 32,
        "CULTURE": 28
      },
      "by_month": {
        "2024-04": 25,
        "2024-05": 18,
        "2024-06": 12
      }
    }
  },
  "timestamp": "2024-03-20T16:45:00Z"
}
```

### POST /api/v1/events
**Description** : Création d'un nouvel événement

#### Request Body
```json
{
  "name": "Concert Latifa - Printemps Musical",
  "subtitle": "Concert exceptionnel dans le cadre du Festival de Carthage",
  "description": "Latifa, la diva de la chanson arabe, se produit pour un concert unique au Théâtre de l'Opéra de Tunis. Une soirée inoubliable avec ses plus grands succès et ses nouvelles créations.",
  "short_description": "Concert exceptionnel de Latifa au Théâtre de l'Opéra",
  "type": "CONCERT",
  "category": "MUSIC",
  "subcategory": "ARABIC_MUSIC",
  "format": "IN_PERSON",
  "visibility": "PUBLIC",
  "language": "ar-TN",
  "additional_languages": ["fr-TN"],
  "venue_id": "opera-tunis",
  "venue_configuration": "concert-hall-standard",
  "schedule": {
    "scheduled_start": "2024-07-15T21:00:00Z",
    "scheduled_end": "2024-07-15T23:30:00Z",
    "doors_open": "2024-07-15T20:00:00Z",
    "check_in_start": "2024-07-15T19:30:00Z",
    "timezone": "Africa/Tunis"
  },
  "ticketing": {
    "sales_start": "2024-04-01T10:00:00Z",
    "sales_end": "2024-07-15T20:00:00Z",
    "refund_policy": "MODERATE",
    "allows_resale": false,
    "max_tickets_per_person": 4
  },
  "pricing_zones": [
    {
      "zone_id": "orchestra",
      "base_price": 150.00,
      "currency": "TND",
      "category": "PREMIUM"
    },
    {
      "zone_id": "balcony",
      "base_price": 100.00,
      "currency": "TND", 
      "category": "STANDARD"
    }
  ],
  "restrictions": [
    {
      "type": "DRESS_CODE",
      "description": "Tenue correcte exigée",
      "is_enforced": true
    }
  ],
  "features": {
    "allows_photography": false,
    "has_intermission": true,
    "provides_translation": false,
    "has_parking": true
  },
  "marketing": {
    "is_featured": true,
    "target_audience": ["music_lovers", "arabic_culture", "adults"],
    "keywords": ["Latifa", "concert", "arabic music", "diva"]
  },
  "technical_requirements": {
    "sound_system": "Premium concert sound",
    "lighting": "Full stage lighting",
    "special_effects": "Minimal",
    "recording_allowed": false
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "concert-latifa-juillet-2024",
      "slug": "concert-latifa-printemps-musical-2024",
      "name": "Concert Latifa - Printemps Musical",
      "type": "CONCERT",
      "category": "MUSIC",
      "status": "DRAFT",
      "visibility": "PUBLIC",
      "venue": {
        "id": "opera-tunis",
        "name": "Opéra de Tunis"
      },
      "schedule": {
        "scheduled_start": "2024-07-15T21:00:00Z",
        "scheduled_end": "2024-07-15T23:30:00Z"
      },
      "next_steps": [
        "Add participants (artists)",
        "Configure detailed schedule",
        "Upload media content",
        "Submit for review"
      ],
      "estimated_setup_completion": 85,
      "created_at": "2024-03-20T17:00:00Z"
    }
  },
  "message": "Event created successfully. Complete setup to publish.",
  "timestamp": "2024-03-20T17:00:00Z"
}
```

### GET /api/v1/events/{id}
**Description** : Détails complets d'un événement

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `include` | string | - | Relations (participants,schedule,media,stats,restrictions) |
| `metrics` | boolean | false | Inclure métriques détaillées |
| `real_time` | boolean | false | Données temps réel |

#### Response 200
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "derby-est-ca-2024",
      "slug": "derby-est-ca-tunis-2024",
      "organizer": {
        "id": "ligue-pro-tunisie",
        "name": "Ligue Professionnelle Tunisienne",
        "type": "SPORTS_FEDERATION",
        "contact": {
          "email": "events@ligue-pro.tn",
          "phone": "+216 71 123 456"
        }
      },
      "name": "Derby EST vs Club Africain",
      "display_name": "Derby Éternel de Tunis",
      "subtitle": "Match de championnat - 28ème journée",
      "description": "Le derby le plus attendu de la saison oppose les deux géants de la capitale dans un match qui s'annonce explosif. L'EST reçoit le Club Africain dans un Stade de Radès qui promet d'être bouillant...",
      "short_description": "Derby historique entre l'EST et le CA au Stade de Radès",
      "type": "SPORTS_MATCH",
      "category": "SPORTS",
      "subcategory": "FOOTBALL",
      "format": "IN_PERSON",
      "status": "PUBLISHED",
      "visibility": "PUBLIC",
      "language": "fr-TN",
      "additional_languages": ["ar-TN", "en"],
      "schedule": {
        "scheduled_start": "2024-04-15T20:00:00Z",
        "scheduled_end": "2024-04-15T22:00:00Z",
        "actual_start": null,
        "actual_end": null,
        "doors_open": "2024-04-15T18:00:00Z",
        "check_in_start": "2024-04-15T17:30:00Z",
        "timezone": "Africa/Tunis",
        "duration_minutes": 120,
        "warmup_time": "2024-04-15T19:15:00Z"
      },
      "venue": {
        "id": "stade-rades-tunis",
        "name": "Stade Olympique de Radès",
        "display_name": "Stade de Radès",
        "address": {
          "city": "Radès",
          "district": "Ben Arous",
          "coordinates": {
            "lat": 36.7517,
            "lng": 10.2817
          }
        },
        "capacity": 60000,
        "configuration": {
          "id": "football-standard",
          "name": "Configuration Football Standard",
          "effective_capacity": 60000
        },
        "features": {
          "has_parking": true,
          "accessible": true,
          "food_courts": 12
        }
      },
      "participants": [
        {
          "id": "est-tunis",
          "name": "Espérance Sportive de Tunis",
          "short_name": "EST",
          "role": "HOME_TEAM",
          "is_confirmed": true,
          "is_featured": true,
          "display_order": 1,
          "statistics": {
            "position_league": 1,
            "points": 65,
            "matches_played": 27
          },
          "form": ["W", "W", "D", "W", "W"]
        },
        {
          "id": "ca-tunis",
          "name": "Club Africain",
          "short_name": "CA",
          "role": "AWAY_TEAM",
          "is_confirmed": true,
          "is_featured": true,
          "display_order": 2,
          "statistics": {
            "position_league": 3,
            "points": 58,
            "matches_played": 27
          },
          "form": ["W", "L", "W", "W", "D"]
        },
        {
          "id": "referee-match",
          "name": "Slim Jedidi",
          "role": "REFEREE",
          "is_confirmed": true,
          "display_order": 3
        }
      ],
      "ticketing": {
        "total_capacity": 60000,
        "tickets_sold": 47500,
        "tickets_available": 12500,
        "sales_status": "OPEN",
        "sales_progress": 79.2,
        "price_range": {
          "min": 25.00,
          "max": 300.00,
          "currency": "TND"
        },
        "pricing_zones": [
          {
            "zone_id": "tribune-officielle",
            "zone_name": "Tribune Officielle",
            "price": 300.00,
            "available": 150,
            "total": 2000
          },
          {
            "zone_id": "tribune-est",
            "zone_name": "Tribune Est",
            "price": 80.00,
            "available": 2500,
            "total": 15000
          }
        ],
        "sales_timeline": {
          "sales_start": "2024-03-01T10:00:00Z",
          "sales_end": "2024-04-15T18:00:00Z",
          "vip_sales_start": "2024-02-25T10:00:00Z"
        },
        "policies": {
          "refund_policy": "STRICT",
          "allows_resale": true,
          "max_tickets_per_person": 6,
          "id_verification_required": true
        }
      },
      "media": {
        "featured_image": "https://media.entrix.tn/events/derby-est-ca/main-poster.jpg",
        "poster_url": "https://media.entrix.tn/events/derby-est-ca/official-poster.jpg",
        "banner_url": "https://media.entrix.tn/events/derby-est-ca/banner.jpg",
        "gallery": [
          {
            "id": "photo-001",
            "type": "PHOTO",
            "url": "https://media.entrix.tn/events/derby-est-ca/stadium-night.jpg",
            "caption": "Stade de Radès en nocturne"
          }
        ],
        "videos": [
          {
            "id": "promo-video",
            "type": "PROMOTIONAL",
            "url": "https://media.entrix.tn/events/derby-est-ca/promo.mp4",
            "duration": 120
          }
        ],
        "livestream": {
          "is_available": true,
          "provider": "Watania TV",
          "url": "https://stream.wataniatv.tn/live/derby"
        }
      },
      "competition_context": {
        "championship": "Ligue Professionnelle 1",
        "season": "2023-2024",
        "matchday": 28,
        "stakes": "Title race",
        "historical_record": {
          "total_meetings": 245,
          "est_wins": 98,
          "ca_wins": 89,
          "draws": 58,
          "last_meeting": "2023-10-22"
        }
      },
      "restrictions": [
        {
          "id": "age-restriction",
          "type": "AGE_LIMIT",
          "description": "Interdit aux moins de 16 ans",
          "details": "Pièce d'identité obligatoire",
          "is_enforced": true,
          "exceptions": "Accompagné d'un adulte responsable"
        },
        {
          "id": "security-restriction",
          "type": "SECURITY",
          "description": "Contrôle sécuritaire renforcé",
          "is_enforced": true
        }
      ],
      "weather": {
        "dependency": "LIGHT",
        "forecast": {
          "date": "2024-04-15",
          "temperature": 22,
          "conditions": "Partly cloudy",
          "precipitation": 10
        }
      },
      "security": {
        "level": "HIGH",
        "measures": [
          "Metal detectors",
          "Bag searches", 
          "Additional police presence",
          "Restricted items list"
        ],
        "crowd_capacity": 60000,
        "emergency_protocols": "Stadium evacuation plan active"
      },
      "marketing": {
        "hashtags": ["#DerbyTunis", "#ESTCA", "#Football"],
        "social_media": {
          "facebook_event": "https://facebook.com/events/derby-est-ca-2024",
          "twitter_hashtag": "#DerbyTunis"
        },
        "press": {
          "press_release_url": "https://ligue-pro.tn/press/derby-april-2024",
          "media_accreditation": "Required 48h advance"
        }
      },
      "statistics": {
        "page_views": 125000,
        "unique_visitors": 89000,
        "social_shares": 8500,
        "ticket_conversion_rate": 18.5,
        "average_time_on_page": 245,
        "bounce_rate": 15.2
      },
      "real_time_data": {
        "current_ticket_sales": 47500,
        "last_sale": "2024-03-20T16:42:00Z",
        "trending_score": 9.2,
        "live_viewers": 1250
      },
      "operational": {
        "setup_status": "COMPLETED",
        "technical_check": "PASSED",
        "safety_approval": "APPROVED",
        "broadcast_ready": true,
        "staff_assignments": "COMPLETED"
      },
      "business_metrics": {
        "projected_revenue": 2750000.00,
        "current_revenue": 2187500.00,
        "revenue_progress": 79.5,
        "average_ticket_price": 46.05,
        "commission_rate": 8.5
      },
      "created_at": "2024-02-15T14:30:00Z",
      "updated_at": "2024-03-20T16:45:00Z",
      "published_at": "2024-03-01T10:00:00Z",
      "last_modified_by": {
        "user_id": "admin-ligue",
        "user_name": "Ahmed Manai",
        "timestamp": "2024-03-20T16:45:00Z"
      }
    }
  },
  "timestamp": "2024-03-20T16:45:00Z"
}
```

### PUT /api/v1/events/{id}
**Description** : Mise à jour complète d'un événement

### PATCH /api/v1/events/{id}
**Description** : Mise à jour partielle d'un événement

#### Request Body (PATCH example)
```json
{
  "status": "TICKET_SALES_OPEN",
  "ticketing": {
    "sales_start": "2024-03-22T10:00:00Z"
  },
  "updated_fields": ["status", "ticketing.sales_start"]
}
```

### DELETE /api/v1/events/{id}
**Description** : Annulation/suppression événement

### POST /api/v1/events/{id}/duplicate
**Description** : Duplication événement avec modifications

#### Request Body
```json
{
  "name": "Derby EST vs Club Africain - Match Retour",
  "schedule": {
    "scheduled_start": "2024-05-20T20:00:00Z",
    "scheduled_end": "2024-05-20T22:00:00Z"
  },
  "participants": [
    {
      "participant_id": "ca-tunis",
      "role": "HOME_TEAM"
    },
    {
      "participant_id": "est-tunis", 
      "role": "AWAY_TEAM"
    }
  ],
  "venue_id": "stade-ben-jannet",
  "preserve": ["ticketing", "restrictions", "media"]
}
```

---

# API Workflows et statuts

## 🔄 Ressource : `/api/v1/events/{id}/workflow`

### POST /api/v1/events/{id}/workflow/submit-review
**Description** : Soumission événement pour validation

#### Response 200
```json
{
  "success": true,
  "data": {
    "event_id": "concert-latifa-juillet-2024",
    "previous_status": "DRAFT",
    "new_status": "PENDING_REVIEW",
    "review_process": {
      "reviewers": ["content-team", "legal-team"],
      "estimated_duration": "2-3 business days",
      "requirements": [
        "Complete participant information",
        "Venue availability confirmed",
        "Marketing materials approved"
      ]
    },
    "submission_id": "review-20240320-001",
    "submitted_at": "2024-03-20T17:15:00Z"
  },
  "message": "Event submitted for review successfully",
  "timestamp": "2024-03-20T17:15:00Z"
}
```

### POST /api/v1/events/{id}/workflow/approve
**Description** : Approbation événement (admin/reviewer)

### POST /api/v1/events/{id}/workflow/publish
**Description** : Publication événement

### POST /api/v1/events/{id}/workflow/open-sales
**Description** : Ouverture billetterie

### POST /api/v1/events/{id}/workflow/close-sales  
**Description** : Fermeture billetterie

### POST /api/v1/events/{id}/workflow/start-event
**Description** : Démarrage événement (passage IN_PROGRESS)

### POST /api/v1/events/{id}/workflow/complete-event
**Description** : Finalisation événement

#### Request Body
```json
{
  "actual_start": "2024-04-15T20:05:00Z",
  "actual_end": "2024-04-15T21:58:00Z",
  "final_attendance": 58500,
  "highlights": [
    "Record attendance for derby",
    "No incidents reported",
    "Successful live broadcast"
  ],
  "post_event_actions": [
    "Generate final report",
    "Process payments",
    "Send feedback surveys"
  ]
}
```

### POST /api/v1/events/{id}/workflow/cancel
**Description** : Annulation événement

### POST /api/v1/events/{id}/workflow/postpone
**Description** : Report événement

#### Request Body
```json
{
  "reason": "Weather conditions",
  "new_scheduled_start": "2024-04-22T20:00:00Z",
  "new_scheduled_end": "2024-04-22T22:00:00Z",
  "notification_message": "En raison des conditions météorologiques, le match est reporté au 22 avril",
  "refund_policy": "AUTOMATIC_TRANSFER",
  "communication_plan": {
    "email": true,
    "sms": true,
    "social_media": true,
    "press_release": true
  }
}
```

### GET /api/v1/events/{id}/workflow/history
**Description** : Historique des changements de statut

#### Response 200
```json
{
  "success": true,
  "data": {
    "event_id": "derby-est-ca-2024",
    "workflow_history": [
      {
        "id": "change-001",
        "from_status": "DRAFT",
        "to_status": "PENDING_REVIEW",
        "action": "SUBMIT_REVIEW",
        "actor": {
          "user_id": "organizer-ligue",
          "user_name": "Ahmed Manai",
          "role": "EVENT_COORDINATOR"
        },
        "timestamp": "2024-02-20T14:30:00Z",
        "notes": "Initial submission for review"
      },
      {
        "id": "change-002",
        "from_status": "PENDING_REVIEW",
        "to_status": "APPROVED",
        "action": "APPROVE",
        "actor": {
          "user_id": "admin-platform",
          "user_name": "Sarah Admin",
          "role": "CONTENT_REVIEWER"
        },
        "timestamp": "2024-02-22T10:15:00Z",
        "notes": "Approved after content review"
      },
      {
        "id": "change-003",
        "from_status": "APPROVED",
        "to_status": "PUBLISHED",
        "action": "PUBLISH",
        "timestamp": "2024-03-01T10:00:00Z",
        "automated": true
      }
    ],
    "current_status": "PUBLISHED",
    "next_possible_actions": [
      "OPEN_SALES",
      "POSTPONE",
      "CANCEL"
    ]
  },
  "timestamp": "2024-03-20T17:30:00Z"
}
```

---

# API Catégories d'événements

## 📋 Ressource : `/api/v1/event-categories`

### GET /api/v1/event-categories
**Description** : Liste des catégories et types d'événements

#### Response 200
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "sports-category",
        "code": "SPORTS",
        "name": "Sports",
        "description": "Événements sportifs de toutes disciplines",
        "icon": "sports_soccer",
        "color": "#2E7D32",
        "subcategories": [
          {
            "code": "FOOTBALL",
            "name": "Football",
            "description": "Matchs et compétitions de football"
          },
          {
            "code": "BASKETBALL",
            "name": "Basketball",
            "description": "Matchs et tournois de basketball"
          }
        ],
        "event_types": [
          {
            "code": "SPORTS_MATCH",
            "name": "Match Sportif",
            "default_duration": 120,
            "typical_venues": ["STADIUM", "ARENA"]
          },
          {
            "code": "TOURNAMENT",
            "name": "Tournoi",
            "default_duration": 480,
            "typical_venues": ["STADIUM", "ARENA", "COMPLEX"]
          }
        ],
        "default_settings": {
          "ticket_price": 50.00,
          "currency": "TND",
          "refund_policy": "STRICT",
          "allows_resale": true,
          "age_restriction": null
        },
        "statistics": {
          "total_events": 245,
          "avg_attendance": 15000,
          "avg_revenue": 750000.00
        },
        "is_active": true,
        "sort_order": 1
      }
    ],
    "event_types_summary": {
      "total": 24,
      "by_category": {
        "SPORTS": 6,
        "MUSIC": 5,
        "CULTURE": 4,
        "BUSINESS": 5,
        "COMMUNITY": 4
      }
    }
  },
  "timestamp": "2024-03-20T17:45:00Z"
}
```

### POST /api/v1/event-categories
**Description** : Création nouvelle catégorie (admin)

### GET /api/v1/event-categories/{id}/templates
**Description** : Templates par catégorie

---

# API Groupes d'événements

## 🎪 Ressource : `/api/v1/event-groups`

### GET /api/v1/event-groups
**Description** : Liste des groupes d'événements (festivals, tournois, séries)

#### Response 200
```json
{
  "success": true,
  "data": {
    "event_groups": [
      {
        "id": "festival-carthage-2024",
        "name": "Festival International de Carthage 2024",
        "description": "57ème édition du prestigieux festival culturel",
        "type": "FESTIVAL",
        "organizer": {
          "id": "festival-carthage-org",
          "name": "Festival International de Carthage"
        },
        "period": {
          "start_date": "2024-07-01",
          "end_date": "2024-08-31"
        },
        "statistics": {
          "total_events": 45,
          "completed_events": 0,
          "total_capacity": 125000,
          "tickets_sold": 78000
        },
        "venues": [
          {
            "venue_id": "theater-carthage",
            "venue_name": "Théâtre de Carthage",
            "events_count": 25
          },
          {
            "venue_id": "villa-romana",
            "venue_name": "Villa Romana",
            "events_count": 20
          }
        ],
        "featured_events": [
          {
            "id": "opening-ceremony-2024",
            "name": "Cérémonie d'Ouverture",
            "date": "2024-07-01T21:00:00Z"
          }
        ],
        "media": {
          "featured_image": "https://media.entrix.tn/groups/festival-carthage-2024/poster.jpg",
          "logo_url": "https://media.entrix.tn/groups/festival-carthage-2024/logo.png"
        },
        "marketing": {
          "website_url": "https://festival-carthage.tn",
          "hashtag": "#FIC2024",
          "social_media": {
            "facebook": "FestivalCarthage",
            "instagram": "@festivalcarthage"
          }
        },
        "is_active": true,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "total_groups": 12,
      "by_type": {
        "FESTIVAL": 5,
        "TOURNAMENT": 4,
        "CONFERENCE": 2,
        "EXHIBITION": 1
      },
      "active_groups": 8
    }
  },
  "timestamp": "2024-03-20T18:00:00Z"
}
```

### POST /api/v1/event-groups
**Description** : Création groupe d'événements

### GET /api/v1/event-groups/{id}/events
**Description** : Événements d'un groupe

---

# API Programmes et horaires

## ⏰ Ressource : `/api/v1/events/{id}/schedule`

### GET /api/v1/events/{id}/schedule
**Description** : Programme détaillé d'un événement

#### Response 200
```json
{
  "success": true,
  "data": {
    "event_id": "concert-latifa-juillet-2024",
    "schedule_items": [
      {
        "id": "doors-open",
        "type": "DOORS_OPEN",
        "title": "Ouverture des portes",
        "description": "Accueil du public et contrôle d'accès",
        "start_time": "2024-07-15T20:00:00Z",
        "end_time": "2024-07-15T21:00:00Z",
        "duration_minutes": 60,
        "location": "Entrées principales",
        "is_mandatory": true,
        "is_public": true,
        "staff_required": 25,
        "display_order": 1
      },
      {
        "id": "opening-act",
        "type": "PERFORMANCE",
        "title": "Première partie - Groupe Fusion",
        "description": "Performance du groupe Fusion - Musique traditionnelle moderne",
        "start_time": "2024-07-15T21:00:00Z",
        "end_time": "2024-07-15T21:30:00Z",
        "duration_minutes": 30,
        "location": "Scène principale",
        "participants": [
          {
            "participant_id": "groupe-fusion",
            "role": "OPENING_ACT"
          }
        ],
        "is_mandatory": false,
        "is_public": true,
        "display_order": 2,
        "technical_requirements": {
          "sound_check": "20:30",
          "lighting_cues": ["entrance", "finale"]
        }
      },
      {
        "id": "intermission",
        "type": "BREAK",
        "title": "Entracte",
        "description": "Pause et préparation scène principale",
        "start_time": "2024-07-15T21:30:00Z",
        "end_time": "2024-07-15T21:45:00Z",
        "duration_minutes": 15,
        "is_public": true,
        "display_order": 3
      },
      {
        "id": "main-performance",
        "type": "MAIN_EVENT",
        "title": "Concert Latifa",
        "description": "Performance principale de Latifa avec orchestra",
        "start_time": "2024-07-15T21:45:00Z",
        "end_time": "2024-07-15T23:15:00Z",
        "duration_minutes": 90,
        "location": "Scène principale",
        "participants": [
          {
            "participant_id": "latifa-official",
            "role": "MAIN_ARTIST"
          },
          {
            "participant_id": "orchestre-tunisien",
            "role": "SUPPORTING_ACT"
          }
        ],
        "is_mandatory": true,
        "is_public": true,
        "is_featured": true,
        "display_order": 4,
        "setlist": [
          "Omri Maak",
          "Ya Msafer", 
          "Habibi Ya Nour El Ain",
          "Songs from new album"
        ]
      },
      {
        "id": "encore",
        "type": "ENCORE",
        "title": "Rappel",
        "description": "Rappel en fonction de la réaction du public",
        "start_time": "2024-07-15T23:15:00Z",
        "end_time": "2024-07-15T23:30:00Z",
        "duration_minutes": 15,
        "is_mandatory": false,
        "is_conditional": true,
        "condition": "Public demand",
        "display_order": 5
      }
    ],
    "schedule_summary": {
      "total_duration": 210,
      "public_duration": 195,
      "number_of_acts": 2,
      "has_intermission": true,
      "doors_open": "2024-07-15T20:00:00Z",
      "event_start": "2024-07-15T21:00:00Z",
      "estimated_end": "2024-07-15T23:30:00Z"
    },
    "technical_schedule": [
      {
        "time": "19:00",
        "activity": "Final sound check",
        "department": "TECHNICAL"
      },
      {
        "time": "19:30", 
        "activity": "Lighting setup complete",
        "department": "TECHNICAL"
      }
    ]
  },
  "timestamp": "2024-03-20T18:15:00Z"
}
```

### POST /api/v1/events/{id}/schedule
**Description** : Ajout d'élément au programme

### PUT /api/v1/events/{id}/schedule/{schedule_id}
**Description** : Modification élément programme

---

# API Médias d'événements

## 📸 Ressource : `/api/v1/events/{id}/media`

### GET /api/v1/events/{id}/media
**Description** : Galerie média d'un événement

#### Response 200
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "poster-official-derby",
        "event_id": "derby-est-ca-2024",
        "media_type": "POSTER",
        "category": "PROMOTIONAL",
        "title": "Affiche Officielle Derby",
        "description": "Affiche officielle du derby EST vs CA",
        "file_info": {
          "url": "https://media.entrix.tn/events/derby-est-ca/poster-official.jpg",
          "thumbnail_url": "https://media.entrix.tn/events/derby-est-ca/thumbs/poster-official.jpg",
          "format": "JPEG",
          "size": 2450000,
          "dimensions": {
            "width": 2000,
            "height": 3000
          }
        },
        "usage_rights": {
          "is_public": true,
          "commercial_use": true,
          "downloadable": true
        },
        "display_settings": {
          "is_featured": true,
          "display_order": 1,
          "show_in_gallery": true,
          "show_in_social": true
        },
        "metadata": {
          "designer": "Studio Design Tunis",
          "creation_date": "2024-02-25",
          "brand_guidelines": "Official league branding"
        },
        "analytics": {
          "views": 45000,
          "downloads": 1200,
          "shares": 850
        },
        "created_at": "2024-02-25T16:00:00Z"
      }
    ],
    "media_summary": {
      "total_items": 28,
      "by_type": {
        "POSTER": 3,
        "PHOTO": 15,
        "VIDEO": 8,
        "AUDIO": 2
      },
      "by_category": {
        "PROMOTIONAL": 8,
        "EVENT_COVERAGE": 12,
        "PARTICIPANT_CONTENT": 5,
        "TECHNICAL": 3
      },
      "storage_usage": "1.2 GB",
      "featured_items": 5
    }
  },
  "timestamp": "2024-03-20T18:30:00Z"
}
```

### POST /api/v1/events/{id}/media
**Description** : Upload média pour événement

---

# API Statistiques temps réel

## 📊 Ressource : `/api/v1/events/{id}/stats`

### GET /api/v1/events/{id}/stats/live
**Description** : Statistiques temps réel d'un événement

#### Response 200
```json
{
  "success": true,
  "data": {
    "event_id": "derby-est-ca-2024",
    "timestamp": "2024-03-20T18:45:00Z",
    "live_stats": {
      "ticketing": {
        "total_sold": 47500,
        "sold_last_hour": 285,
        "conversion_rate": 18.5,
        "revenue_total": 2187500.00,
        "revenue_last_hour": 14250.00,
        "average_ticket_price": 46.05
      },
      "engagement": {
        "page_views_today": 15420,
        "unique_visitors_today": 11280,
        "social_mentions_24h": 3450,
        "trending_score": 9.2,
        "search_volume_index": 85
      },
      "venue_status": {
        "preparation_progress": 95,
        "technical_checks": "PASSED",
        "security_status": "READY",
        "weather_impact": "NONE"
      },
      "predictions": {
        "final_attendance_estimate": 58500,
        "revenue_projection": 2750000.00,
        "sellout_probability": 0.88,
        "estimated_sellout_time": "2024-04-10T14:00:00Z"
      }
    },
    "historical_comparison": {
      "vs_last_similar_event": {
        "ticket_sales": "+15%",
        "engagement": "+22%",
        "revenue": "+18%"
      },
      "vs_venue_average": {
        "attendance": "+35%",
        "revenue_per_seat": "+28%"
      }
    }
  },
  "timestamp": "2024-03-20T18:45:00Z"
}
```

### GET /api/v1/events/{id}/stats/performance
**Description** : Métriques de performance événement

### GET /api/v1/events/{id}/stats/audience
**Description** : Analytics audience et démographie

---

# API Analytics et reporting

## 📈 Ressource : `/api/v1/events/analytics`

### GET /api/v1/events/analytics/dashboard
**Description** : Dashboard analytics organisateur

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `organizer_id` | uuid | - | Organisateur (si admin) |
| `date_range` | string | `30d` | Période (7d, 30d, 90d, 1y) |
| `metrics` | string | - | Métriques spécifiques |

#### Response 200
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2024-02-20",
      "end_date": "2024-03-20",
      "total_days": 29
    },
    "overview": {
      "total_events": 15,
      "total_revenue": 4250000.00,
      "total_tickets_sold": 95000,
      "average_occupancy": 78.5,
      "customer_satisfaction": 4.3
    },
    "events_performance": [
      {
        "event_id": "derby-est-ca-2024",
        "event_name": "Derby EST vs CA",
        "revenue": 2187500.00,
        "tickets_sold": 47500,
        "occupancy": 79.2,
        "satisfaction": 4.6,
        "performance_score": 92
      }
    ],
    "trends": {
      "revenue_trend": [
        {"date": "2024-03-01", "value": 125000.00},
        {"date": "2024-03-02", "value": 89000.00}
      ],
      "sales_trend": [
        {"date": "2024-03-01", "value": 2850},
        {"date": "2024-03-02", "value": 1920}
      ]
    },
    "demographics": {
      "age_groups": {
        "18-25": 25,
        "26-35": 35,
        "36-50": 30,
        "50+": 10
      },
      "geographic": {
        "Tunis": 45,
        "Ben Arous": 25,
        "Ariana": 20,
        "Other": 10
      }
    },
    "recommendations": [
      {
        "type": "PRICING_OPTIMIZATION",
        "description": "Augmenter prix VIP de 15% pour événements football",
        "impact": "+12% revenue potential"
      }
    ]
  },
  "timestamp": "2024-03-20T19:00:00Z"
}
```

### GET /api/v1/events/analytics/reports/{report_type}
**Description** : Rapports détaillés

#### Report Types
- `revenue` : Rapport revenus détaillé
- `attendance` : Rapport fréquentation
- `customer` : Rapport satisfaction client
- `operational` : Rapport opérationnel
- `marketing` : Rapport marketing/acquisition

---

# Codes d'erreur

## 🚨 Codes d'erreur spécifiques au module

| Code | Message | Description |
|------|---------|-------------|
| `EVENT_NOT_FOUND` | Event not found | Événement inexistant |
| `EVENT_SLUG_EXISTS` | Event slug already exists | Slug événement déjà utilisé |
| `EVENT_INACTIVE` | Event is not active | Événement inactif |
| `EVENT_CANCELLED` | Event is cancelled | Événement annulé |
| `EVENT_SOLD_OUT` | Event is sold out | Événement complet |
| `VENUE_NOT_AVAILABLE` | Venue not available | Lieu indisponible |
| `VENUE_CONFLICT` | Venue booking conflict | Conflit réservation lieu |
| `PARTICIPANT_NOT_AVAILABLE` | Participant not available | Participant indisponible |
| `SCHEDULE_CONFLICT` | Schedule conflict detected | Conflit horaire détecté |
| `INVALID_EVENT_STATUS` | Invalid status transition | Transition statut invalide |
| `SALES_NOT_OPEN` | Ticket sales not open | Ventes pas ouvertes |
| `SALES_CLOSED` | Ticket sales closed | Ventes fermées |
| `EVENT_PAST_DATE` | Event date is in the past | Date événement passée |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions | Permissions insuffisantes |
| `WORKFLOW_VIOLATION` | Workflow rules violation | Violation règles workflow |
| `CONTENT_VALIDATION_FAILED` | Content validation failed | Validation contenu échouée |
| `MEDIA_UPLOAD_FAILED` | Media upload failed | Échec upload média |
| `CATEGORY_NOT_FOUND` | Event category not found | Catégorie inexistante |
| `GROUP_NOT_FOUND` | Event group not found | Groupe inexistant |

---

# Exemples d'usage

## 🎯 Cas d'usage typiques

### 1. Création événement sportif complet

```bash
# 1. Créer l'événement
EVENT_ID=$(curl -X POST "https://api.entrix.tn/v1/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organizer-ID: $ORGANIZER_ID" \
  -d '{
    "name": "Match ESS vs EST",
    "type": "SPORTS_MATCH",
    "category": "SPORTS",
    "venue_id": "stade-sousse",
    "scheduled_start": "2024-05-15T20:00:00Z",
    "scheduled_end": "2024-05-15T22:00:00Z"
  }' | jq -r '.data.event.id')

# 2. Ajouter participants
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "participant_id": "ess-sousse",
    "role": "HOME_TEAM"
  }'

curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "participant_id": "est-tunis",
    "role": "AWAY_TEAM"
  }'

# 3. Configurer programme
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/schedule" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "DOORS_OPEN",
    "title": "Ouverture portes",
    "start_time": "2024-05-15T18:00:00Z",
    "duration_minutes": 120
  }'

# 4. Upload affiche
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/media" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@poster-match.jpg" \
  -F "media_type=POSTER" \
  -F "category=PROMOTIONAL" \
  -F "is_featured=true"

# 5. Soumettre pour validation
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/workflow/submit-review" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Gestion workflow événement

```bash
# Approbation événement (admin)
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/workflow/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "approved_by": "content-admin",
    "notes": "Événement approuvé, peut être publié"
  }'

# Publication
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/workflow/publish" \
  -H "Authorization: Bearer $TOKEN"

# Ouverture billetterie
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/workflow/open-sales" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sales_start": "2024-04-01T10:00:00Z",
    "early_access_start": "2024-03-29T10:00:00Z"
  }'
```

### 3. Recherche et filtrage avancés

```bash
# Événements à venir à Tunis
curl -G "https://api.entrix.tn/v1/events" \
  -H "Authorization: Bearer $TOKEN" \
  -d "city=Tunis" \
  -d "start_date=2024-04-01" \
  -d "status=PUBLISHED" \
  -d "has_tickets_available=true" \
  -d "sort=scheduled_start"

# Événements d'un organisateur avec stats
curl -G "https://api.entrix.tn/v1/events" \
  -H "Authorization: Bearer $TOKEN" \
  -d "organizer_id=$ORGANIZER_ID" \
  -d "include=participants,venue,stats" \
  -d "sort=scheduled_start" \
  -d "order=desc"

# Recherche textuelle
curl -G "https://api.entrix.tn/v1/events" \
  -H "Authorization: Bearer $TOKEN" \
  -d "search=derby football" \
  -d "category=SPORTS" \
  -d "limit=10"
```

### 4. Gestion festival multi-événements

```bash
# 1. Créer groupe festival
GROUP_ID=$(curl -X POST "https://api.entrix.tn/v1/event-groups" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Festival Jazz de Tabarka 2024",
    "type": "FESTIVAL",
    "start_date": "2024-07-15",
    "end_date": "2024-07-25"
  }' | jq -r '.data.group.id')

# 2. Créer événements du festival
for day in {15..25}; do
  curl -X POST "https://api.entrix.tn/v1/events" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"name\": \"Festival Jazz - Soirée ${day}/07\",
      \"type\": \"CONCERT\",
      \"event_group_id\": \"$GROUP_ID\",
      \"scheduled_start\": \"2024-07-${day}T21:00:00Z\",
      \"venue_id\": \"theater-tabarka\"
    }"
done

# 3. Consulter événements du groupe
curl -G "https://api.entrix.tn/v1/event-groups/$GROUP_ID/events" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Analytics et reporting

```bash
# Dashboard organisateur
curl -G "https://api.entrix.tn/v1/events/analytics/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organizer-ID: $ORGANIZER_ID" \
  -d "date_range=30d" \
  -d "metrics=revenue,attendance,satisfaction"

# Stats temps réel événement
curl -G "https://api.entrix.tn/v1/events/$EVENT_ID/stats/live" \
  -H "Authorization: Bearer $TOKEN"

# Rapport revenus détaillé
curl -G "https://api.entrix.tn/v1/events/analytics/reports/revenue" \
  -H "Authorization: Bearer $TOKEN" \
  -d "start_date=2024-01-01" \
  -d "end_date=2024-03-31" \
  -d "format=json"
```

### 6. Workflow report d'événement

```bash
# Reporter événement
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/workflow/postpone" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reason": "Conditions météorologiques défavorables",
    "new_scheduled_start": "2024-05-22T20:00:00Z",
    "new_scheduled_end": "2024-05-22T22:00:00Z",
    "refund_policy": "AUTOMATIC_TRANSFER",
    "notification_message": "Match reporté au 22 mai en raison de la météo",
    "communication_plan": {
      "email": true,
      "sms": true,
      "social_media": true
    }
  }'

# Consulter historique modifications
curl -G "https://api.entrix.tn/v1/events/$EVENT_ID/workflow/history" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Notes importantes

### Workflows et validations
- Les changements de statut suivent des règles métier strictes
- Certaines actions nécessitent des approbations multiples
- Les événements passés ne peuvent être modifiés (mode lecture seule)

### Performance et cache
- Les listes d'événements sont optimisées pour les recherches fréquentes
- Les statistiques temps réel sont mises à jour toutes les 5 minutes
- Les analytics sont précalculées quotidiennement

### Notifications automatiques
- Changements de statut notifiés aux participants
- Alertes automatiques pour conflits de planning
- Communications clients lors de reports/annulations

### Intégrations
- Synchronisation automatique avec la billetterie lors des transitions
- Mise à jour des droits d'accès selon statut événement
- Intégration avec les systèmes de paiement pour reports/remboursements

---

**Version API** : v1.0  
**Dernière mise à jour** : 20 Mars 2024  
**Auteur** : Équipe Entrix Development