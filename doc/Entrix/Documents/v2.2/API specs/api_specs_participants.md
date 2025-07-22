# API Specifications - Module Participants
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Participants](#api-participants)
4. [API Personnel des participants](#api-personnel-des-participants)
5. [API Relations entre participants](#api-relations-entre-participants)
6. [API Événements-Participants](#api-événements-participants)
7. [Codes d'erreur](#codes-derreur)
8. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Participants** gère toutes les entités qui participent activement aux événements : équipes sportives, artistes, conférenciers, arbitres, etc. Il comprend leur personnel associé et leurs relations complexes.

## 🏗️ Architecture

### Entités principales
- **Participants** : Entités qui participent aux événements
- **Personnel** : Staff associé aux participants 
- **Relations** : Relations entre participants (rivalités, partenariats, etc.)
- **Participation événements** : Rôles des participants dans les événements

### Types de participants supportés
- **SPORTS_TEAM** : Équipes sportives
- **INDIVIDUAL_ATHLETE** : Athlètes individuels
- **MUSIC_ARTIST** : Artistes musicaux
- **MUSIC_BAND** : Groupes musicaux
- **SPEAKER** : Conférenciers
- **THEATER_COMPANY** : Compagnies théâtrales
- **DANCE_COMPANY** : Compagnies de danse
- **COMEDY_PERFORMER** : Artistes comiques
- **DJ** : DJs
- **REFEREE** : Arbitres
- **OFFICIAL** : Officiels
- **MODERATOR** : Modérateurs
- **SPONSOR** : Sponsors
- **OTHER** : Autres types

## 🔗 Relations avec autres modules
- **Organisateurs** : Affiliation possible
- **Événements** : Participation via `event_participants`
- **Utilisateurs** : Gestion staff et comptes liés
- **Contrôle d'accès** : Droits d'accès pour staff

---

# Authentification et autorisation

## 🔐 Niveaux d'accès requis

### Lecture des participants
- **Public** : Participants actifs et vérifiés
- **Organisateur** : Tous participants + détails étendus
- **Super Admin** : Accès complet

### Gestion des participants
- **Organisateur** : Ses participants affiliés uniquement
- **Super Admin** : Tous participants

### Gestion du personnel
- **Participant Admin** : Personnel de son participant
- **Organisateur** : Personnel participants affiliés
- **Super Admin** : Accès complet

## 🛡️ Headers requis

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Organizer-ID: <ORGANIZER_UUID> (si applicable)
```

---

# API Participants

## 📋 Ressource : `/api/v1/participants`

### GET /api/v1/participants
**Description** : Liste paginée des participants avec filtres avancés

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page (max 100) |
| `type` | enum | - | Type de participant |
| `category` | string | - | Catégorie participant |
| `participant_category` | enum | - | Catégorie métier |
| `nationality` | string | - | Code pays ISO-2 |
| `city` | string | - | Ville |
| `is_active` | boolean | - | Participants actifs |
| `is_verified` | boolean | - | Participants vérifiés |
| `affiliated_organizer_id` | uuid | - | Organisateur affilié |
| `search` | string | - | Recherche textuelle (nom, code) |
| `founded_after` | date | - | Fondé après cette date |
| `founded_before` | date | - | Fondé avant cette date |
| `sort` | string | `created_at` | Tri (name, founded_date, created_at) |
| `order` | string | `desc` | Ordre (asc, desc) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "code": "EST_TUNIS",
        "name": "Espérance Sportive de Tunis",
        "short_name": "EST",
        "type": "SPORTS_TEAM",
        "category": "FOOTBALL",
        "participant_category": "MAIN",
        "nationality": "TN",
        "city": "Tunis",
        "founded_date": "1919-01-15",
        "logo_url": "https://media.entrix.tn/participants/est/logo.png",
        "banner_url": "https://media.entrix.tn/participants/est/banner.jpg",
        "website_url": "https://est.tn",
        "contact_email": "contact@est.tn",
        "contact_phone": "+216 71 123 456",
        "social_media": {
          "facebook": "EStunis",
          "twitter": "@espoir_tunis",
          "instagram": "est_officiel"
        },
        "description": "Club de football tunisien fondé en 1919",
        "achievements": [
          "Champion d'Afrique 1994",
          "Champion de Tunisie 2019"
        ],
        "statistics": {
          "titles": 30,
          "founded_year": 1919,
          "stadium": "Stade Olympique de Radès"
        },
        "booking_agent_info": {
          "agency": "Sports Management TN",
          "contact": "agent@sportsmanagement.tn",
          "phone": "+216 71 555 000"
        },
        "affiliated_organizer_id": null,
        "is_active": true,
        "is_verified": true,
        "staff_count": 45,
        "upcoming_events": 3,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-03-20T15:30:00Z"
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
    "filters_applied": {
      "type": "SPORTS_TEAM",
      "nationality": "TN"
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/participants
**Description** : Création d'un nouveau participant

#### Request Body
```json
{
  "code": "LATIFA_OFFICIAL",
  "name": "Latifa",
  "short_name": "Latifa",
  "type": "MUSIC_ARTIST",
  "category": "POP",
  "participant_category": "MAIN",
  "nationality": "TN",
  "city": "Tunis",
  "founded_date": "1965-02-14",
  "contact_email": "booking@latifa.tn",
  "contact_phone": "+216 71 234 567",
  "website_url": "https://latifa.tn",
  "social_media": {
    "facebook": "LatifahOfficielle",
    "instagram": "latifa_officielle",
    "youtube": "LatifaOfficielleYT"
  },
  "description": "Artiste tunisienne de renommée internationale",
  "achievements": [
    "Prix de la meilleure chanteuse arabe 2010",
    "Album d'or 'Ya Msafer' 2015"
  ],
  "booking_agent_info": {
    "agency": "Arab Music Management",
    "contact": "latifa@arabmusicmgmt.com",
    "phone": "+216 71 888 999"
  },
  "technical_requirements": {
    "sound_system": "Professional PA system",
    "lighting": "Full stage lighting rig",
    "backstage": "Private dressing room with refreshments"
  },
  "hospitality_requirements": {
    "accommodation": "5-star hotel",
    "transportation": "Premium vehicle",
    "catering": "Vegetarian options required"
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "participant": {
      "id": "789e4567-e89b-12d3-a456-426614174001",
      "code": "LATIFA_OFFICIAL",
      "name": "Latifa",
      "short_name": "Latifa",
      "type": "MUSIC_ARTIST",
      "category": "POP",
      "participant_category": "MAIN",
      "nationality": "TN",
      "city": "Tunis",
      "founded_date": "1965-02-14",
      "logo_url": null,
      "banner_url": null,
      "website_url": "https://latifa.tn",
      "contact_email": "booking@latifa.tn",
      "contact_phone": "+216 71 234 567",
      "social_media": {
        "facebook": "LatifahOfficielle",
        "instagram": "latifa_officielle",
        "youtube": "LatifaOfficielleYT"
      },
      "description": "Artiste tunisienne de renommée internationale",
      "achievements": [
        "Prix de la meilleure chanteuse arabe 2010",
        "Album d'or 'Ya Msafer' 2015"
      ],
      "booking_agent_info": {
        "agency": "Arab Music Management",
        "contact": "latifa@arabmusicmgmt.com",
        "phone": "+216 71 888 999"
      },
      "technical_requirements": {
        "sound_system": "Professional PA system",
        "lighting": "Full stage lighting rig",
        "backstage": "Private dressing room with refreshments"
      },
      "hospitality_requirements": {
        "accommodation": "5-star hotel",
        "transportation": "Premium vehicle",
        "catering": "Vegetarian options required"
      },
      "affiliated_organizer_id": null,
      "is_active": true,
      "is_verified": false,
      "created_at": "2024-03-20T15:45:00Z",
      "updated_at": "2024-03-20T15:45:00Z"
    }
  },
  "message": "Participant created successfully. Verification process initiated.",
  "timestamp": "2024-03-20T15:45:00Z"
}
```

### GET /api/v1/participants/{id}
**Description** : Détails complets d'un participant

#### Response 200
```json
{
  "success": true,
  "data": {
    "participant": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "code": "EST_TUNIS",
      "name": "Espérance Sportive de Tunis",
      "short_name": "EST",
      "type": "SPORTS_TEAM",
      "category": "FOOTBALL",
      "participant_category": "MAIN",
      "nationality": "TN",
      "city": "Tunis",
      "founded_date": "1919-01-15",
      "disbanded_date": null,
      "logo_url": "https://media.entrix.tn/participants/est/logo.png",
      "banner_url": "https://media.entrix.tn/participants/est/banner.jpg",
      "website_url": "https://est.tn",
      "contact_email": "contact@est.tn",
      "contact_phone": "+216 71 123 456",
      "contact_address": "Avenue Mohamed V, Tunis 1001",
      "social_media": {
        "facebook": "EStunis",
        "twitter": "@espoir_tunis",
        "instagram": "est_officiel",
        "youtube": "ESpoirTunis"
      },
      "description": "L'Espérance Sportive de Tunis est un club de football tunisien fondé en 1919. C'est l'un des clubs les plus titrés d'Afrique.",
      "achievements": [
        "Champion d'Afrique CAF 1994",
        "Champion de Tunisie 2019",
        "Coupe de Tunisie 2018",
        "Champion d'Afrique CAF 2011"
      ],
      "statistics": {
        "founded_year": 1919,
        "titles_national": 30,
        "titles_international": 4,
        "stadium": "Stade Olympique de Radès",
        "capacity": 60000
      },
      "booking_agent_info": {
        "agency": "Sports Management Tunisia",
        "contact": "est@sportsmanagement.tn",
        "phone": "+216 71 555 000",
        "address": "Centre Urbain Nord, Tunis"
      },
      "technical_requirements": {
        "pitch_type": "Natural grass",
        "training_facilities": "Required 2 days before match",
        "medical_room": "Fully equipped medical bay"
      },
      "hospitality_requirements": {
        "team_hotel": "4-star minimum",
        "transportation": "Team bus",
        "meals": "Halal certified catering"
      },
      "affiliated_organizer_id": null,
      "is_active": true,
      "is_verified": true,
      "metadata": {
        "federation_license": "FTF001",
        "fifa_code": "EST",
        "colors": ["red", "yellow"]
      },
      "staff_summary": {
        "total": 45,
        "players": 30,
        "coaches": 8,
        "medical": 4,
        "admin": 3
      },
      "relationships_summary": {
        "rivalries": 3,
        "partnerships": 2
      },
      "events_summary": {
        "upcoming": 3,
        "past_year": 28,
        "wins": 18,
        "draws": 6,
        "losses": 4
      },
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-03-20T15:30:00Z"
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### PUT /api/v1/participants/{id}
**Description** : Mise à jour complète d'un participant

#### Request Body
```json
{
  "name": "Espérance Sportive de Tunis",
  "short_name": "EST",
  "category": "FOOTBALL",
  "contact_email": "nouveaucontact@est.tn",
  "contact_phone": "+216 71 123 999",
  "website_url": "https://est.tn",
  "social_media": {
    "facebook": "EStunis",
    "twitter": "@espoir_tunis",
    "instagram": "est_officiel",
    "tiktok": "@est_officiel"
  },
  "description": "L'Espérance Sportive de Tunis est un club de football tunisien fondé en 1919, l'un des plus grands clubs d'Afrique.",
  "technical_requirements": {
    "pitch_type": "Natural grass preferred",
    "training_facilities": "Required 2 days before match",
    "medical_room": "Fully equipped medical bay",
    "warm_up_area": "Dedicated warm-up pitch"
  }
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "participant": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "updated_fields": [
        "contact_email",
        "contact_phone", 
        "social_media",
        "description",
        "technical_requirements"
      ],
      "updated_at": "2024-03-20T16:00:00Z"
    }
  },
  "message": "Participant updated successfully",
  "timestamp": "2024-03-20T16:00:00Z"
}
```

### PATCH /api/v1/participants/{id}
**Description** : Mise à jour partielle d'un participant

#### Request Body
```json
{
  "contact_email": "nouveau@est.tn",
  "social_media": {
    "facebook": "EStunis",
    "twitter": "@espoir_tunis",
    "instagram": "est_officiel",
    "tiktok": "@est_officiel"
  }
}
```

### DELETE /api/v1/participants/{id}
**Description** : Suppression d'un participant (soft delete)

#### Response 200
```json
{
  "success": true,
  "data": {
    "participant_id": "123e4567-e89b-12d3-a456-426614174000",
    "deactivated_at": "2024-03-20T16:15:00Z"
  },
  "message": "Participant deactivated successfully",
  "timestamp": "2024-03-20T16:15:00Z"
}
```

### POST /api/v1/participants/{id}/verify
**Description** : Vérification d'un participant (admin uniquement)

#### Response 200
```json
{
  "success": true,
  "data": {
    "participant_id": "789e4567-e89b-12d3-a456-426614174001",
    "verified_at": "2024-03-20T16:20:00Z",
    "verified_by": "admin@entrix.tn"
  },
  "message": "Participant verified successfully",
  "timestamp": "2024-03-20T16:20:00Z"
}
```

### POST /api/v1/participants/{id}/upload-media
**Description** : Upload logo/banner pour un participant

#### Request (multipart/form-data)
```
media_type: "logo" | "banner"
file: [IMAGE_FILE]
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "participant_id": "123e4567-e89b-12d3-a456-426614174000",
    "media_type": "logo",
    "url": "https://media.entrix.tn/participants/est_tunis/logo_v2.png",
    "uploaded_at": "2024-03-20T16:25:00Z"
  },
  "message": "Media uploaded successfully",
  "timestamp": "2024-03-20T16:25:00Z"
}
```

---

# API Personnel des participants

## 👥 Ressource : `/api/v1/participants/{participant_id}/staff`

### GET /api/v1/participants/{participant_id}/staff
**Description** : Liste du personnel d'un participant

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page |
| `role` | string | - | Rôle (PLAYER, COACH, etc.) |
| `is_active` | boolean | - | Personnel actif |
| `nationality` | string | - | Nationalité |
| `position` | string | - | Position spécifique |
| `has_jersey` | boolean | - | Avec numéro de maillot |
| `search` | string | - | Recherche nom |

#### Response 200
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "staff-001",
        "participant_id": "123e4567-e89b-12d3-a456-426614174000",
        "first_name": "Mohamed",
        "last_name": "Ben Ahmed",
        "nickname": "Momo",
        "date_of_birth": "1995-03-15",
        "nationality": "TN",
        "role": "PLAYER",
        "position": "Midfielder",
        "jersey_number": 10,
        "contract_start": "2023-07-01",
        "contract_end": "2025-06-30",
        "salary": 5000.00,
        "currency": "TND",
        "statistics": {
          "goals": 12,
          "matches": 28,
          "yellow_cards": 3
        },
        "emergency_contact": {
          "name": "Fatma Ben Ahmed",
          "phone": "+216 98 123 456",
          "relationship": "Mother"
        },
        "is_active": true,
        "created_at": "2023-07-01T09:00:00Z",
        "updated_at": "2024-03-15T14:20:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 45,
      "total_pages": 3
    },
    "summary": {
      "total": 45,
      "by_role": {
        "PLAYER": 30,
        "COACH": 8,
        "MEDICAL": 4,
        "ADMIN": 3
      },
      "active": 43,
      "under_contract": 41
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/participants/{participant_id}/staff
**Description** : Ajout d'un membre du personnel

#### Request Body
```json
{
  "first_name": "Karim",
  "last_name": "Haouala",
  "nickname": "Coach Karim",
  "date_of_birth": "1975-08-20",
  "nationality": "TN",
  "role": "COACH",
  "position": "Assistant Coach",
  "contract_start": "2024-01-01",
  "contract_end": "2025-12-31",
  "salary": 3500.00,
  "currency": "TND",
  "emergency_contact": {
    "name": "Amina Haouala",
    "phone": "+216 97 555 123",
    "relationship": "Wife"
  },
  "qualifications": [
    "UEFA A License",
    "Sports Science Degree"
  ],
  "languages": ["ar", "fr", "en"]
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "staff_member": {
      "id": "staff-046",
      "participant_id": "123e4567-e89b-12d3-a456-426614174000",
      "first_name": "Karim",
      "last_name": "Haouala",
      "nickname": "Coach Karim",
      "role": "COACH",
      "position": "Assistant Coach",
      "is_active": true,
      "created_at": "2024-03-20T16:30:00Z"
    }
  },
  "message": "Staff member added successfully",
  "timestamp": "2024-03-20T16:30:00Z"
}
```

### GET /api/v1/participants/{participant_id}/staff/{staff_id}
**Description** : Détails d'un membre du personnel

### PUT /api/v1/participants/{participant_id}/staff/{staff_id}
**Description** : Mise à jour complète d'un membre du personnel

### PATCH /api/v1/participants/{participant_id}/staff/{staff_id}
**Description** : Mise à jour partielle d'un membre du personnel

### DELETE /api/v1/participants/{participant_id}/staff/{staff_id}
**Description** : Suppression d'un membre du personnel

---

# API Relations entre participants

## 🤝 Ressource : `/api/v1/participant-relationships`

### GET /api/v1/participant-relationships
**Description** : Liste des relations entre participants

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `participant_id` | uuid | - | Relations d'un participant |
| `relationship_type` | enum | - | Type de relation |
| `is_active` | boolean | - | Relations actives |
| `intensity_min` | integer | - | Intensité minimale (1-10) |
| `intensity_max` | integer | - | Intensité maximale (1-10) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "relationships": [
      {
        "id": "rel-001",
        "participant_a": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Espérance Sportive de Tunis",
          "code": "EST_TUNIS"
        },
        "participant_b": {
          "id": "456e7890-e89b-12d3-a456-426614174001", 
          "name": "Club Africain",
          "code": "CA_TUNIS"
        },
        "relationship_type": "RIVALRY",
        "intensity": 9,
        "description": "Derby historique de Tunis",
        "start_date": "1919-01-01",
        "end_date": null,
        "is_mutual": true,
        "is_active": true,
        "metadata": {
          "meetings": 245,
          "est_wins": 98,
          "ca_wins": 89,
          "draws": 58
        },
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-03-20T15:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 5,
      "total_pages": 1
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/participant-relationships
**Description** : Création d'une relation entre participants

#### Request Body
```json
{
  "participant_a_id": "123e4567-e89b-12d3-a456-426614174000",
  "participant_b_id": "789e4567-e89b-12d3-a456-426614174002",
  "relationship_type": "PARTNERSHIP",
  "intensity": 7,
  "description": "Partenariat artistique pour tournées communes",
  "start_date": "2024-04-01",
  "is_mutual": true,
  "metadata": {
    "partnership_type": "ARTISTIC",
    "revenue_split": "50/50",
    "duration": "2 years"
  }
}
```

### PUT /api/v1/participant-relationships/{id}
**Description** : Mise à jour d'une relation

### DELETE /api/v1/participant-relationships/{id}
**Description** : Suppression d'une relation

---

# API Événements-Participants

## 🎪 Ressource : `/api/v1/events/{event_id}/participants`

### GET /api/v1/events/{event_id}/participants
**Description** : Participants d'un événement avec leurs rôles

#### Response 200
```json
{
  "success": true,
  "data": {
    "event_participants": [
      {
        "id": "ep-001",
        "event_id": "event-123",
        "participant": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Espérance Sportive de Tunis",
          "code": "EST_TUNIS",
          "type": "SPORTS_TEAM",
          "logo_url": "https://media.entrix.tn/participants/est/logo.png"
        },
        "role": "HOME_TEAM",
        "is_confirmed": true,
        "is_featured": true,
        "display_order": 1,
        "fee": 15000.00,
        "currency": "TND",
        "payment_status": "PAID",
        "special_requirements": {
          "dressing_room": "Home dressing room",
          "warm_up_time": "45 minutes",
          "media_availability": true
        },
        "performance_details": {
          "expected_attendance": 45000,
          "ticket_allocation": 500
        },
        "contact_person": {
          "name": "Ahmed Manai",
          "role": "Team Manager",
          "phone": "+216 98 123 456",
          "email": "manager@est.tn"
        },
        "confirmed_at": "2024-03-15T14:30:00Z",
        "created_at": "2024-03-10T10:00:00Z",
        "updated_at": "2024-03-20T15:30:00Z"
      },
      {
        "id": "ep-002",
        "event_id": "event-123",
        "participant": {
          "id": "456e7890-e89b-12d3-a456-426614174001",
          "name": "Club Africain",
          "code": "CA_TUNIS",
          "type": "SPORTS_TEAM",
          "logo_url": "https://media.entrix.tn/participants/ca/logo.png"
        },
        "role": "AWAY_TEAM",
        "is_confirmed": true,
        "is_featured": true,
        "display_order": 2,
        "fee": 15000.00,
        "currency": "TND",
        "payment_status": "PENDING",
        "special_requirements": {
          "dressing_room": "Away dressing room",
          "warm_up_time": "45 minutes",
          "security_escort": true
        },
        "performance_details": {
          "ticket_allocation": 500
        },
        "contact_person": {
          "name": "Sami Trabelsi",
          "role": "General Manager",
          "phone": "+216 97 234 567",
          "email": "manager@ca.tn"
        },
        "confirmed_at": "2024-03-12T16:00:00Z",
        "created_at": "2024-03-10T10:00:00Z",
        "updated_at": "2024-03-18T12:15:00Z"
      }
    ],
    "summary": {
      "total": 2,
      "confirmed": 2,
      "featured": 2,
      "by_role": {
        "HOME_TEAM": 1,
        "AWAY_TEAM": 1
      },
      "payment_status": {
        "PAID": 1,
        "PENDING": 1
      }
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

### POST /api/v1/events/{event_id}/participants
**Description** : Ajout d'un participant à un événement

#### Request Body
```json
{
  "participant_id": "789e4567-e89b-12d3-a456-426614174002",
  "role": "MAIN_ARTIST",
  "is_featured": true,
  "display_order": 1,
  "fee": 25000.00,
  "currency": "TND",
  "special_requirements": {
    "sound_check": "2 hours before show",
    "dressing_room": "Private with refreshments",
    "security": "Personal bodyguard required"
  },
  "performance_details": {
    "set_duration": 90,
    "encore_allowed": true,
    "technical_rider": "Full lighting rig required"
  },
  "contact_person": {
    "name": "Slim Mejri",
    "role": "Tour Manager",
    "phone": "+216 98 888 999",
    "email": "tour@latifa.tn"
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "event_participant": {
      "id": "ep-003",
      "event_id": "event-456",
      "participant_id": "789e4567-e89b-12d3-a456-426614174002",
      "role": "MAIN_ARTIST",
      "is_confirmed": false,
      "is_featured": true,
      "display_order": 1,
      "created_at": "2024-03-20T16:45:00Z"
    }
  },
  "message": "Participant added to event. Awaiting confirmation.",
  "timestamp": "2024-03-20T16:45:00Z"
}
```

### PUT /api/v1/events/{event_id}/participants/{participant_id}
**Description** : Mise à jour participation événement

### DELETE /api/v1/events/{event_id}/participants/{participant_id}
**Description** : Suppression participation événement

### POST /api/v1/events/{event_id}/participants/{participant_id}/confirm
**Description** : Confirmation participation événement

#### Response 200
```json
{
  "success": true,
  "data": {
    "event_participant_id": "ep-003",
    "confirmed_at": "2024-03-20T17:00:00Z",
    "confirmed_by": "organizer@example.tn"
  },
  "message": "Participation confirmed successfully",
  "timestamp": "2024-03-20T17:00:00Z"
}
```

---

# Codes d'erreur

## 🚨 Codes d'erreur spécifiques au module

| Code | Message | Description |
|------|---------|-------------|
| `PARTICIPANT_NOT_FOUND` | Participant not found | Participant inexistant |
| `PARTICIPANT_CODE_EXISTS` | Participant code already exists | Code participant déjà utilisé |
| `PARTICIPANT_INACTIVE` | Participant is not active | Participant inactif |
| `PARTICIPANT_NOT_VERIFIED` | Participant not verified | Participant non vérifié |
| `STAFF_NOT_FOUND` | Staff member not found | Membre personnel inexistant |
| `STAFF_JERSEY_TAKEN` | Jersey number already assigned | Numéro maillot déjà attribué |
| `RELATIONSHIP_EXISTS` | Relationship already exists | Relation déjà existante |
| `RELATIONSHIP_SELF` | Cannot create relationship with self | Relation avec soi-même impossible |
| `EVENT_PARTICIPANT_EXISTS` | Participant already in event | Participant déjà dans l'événement |
| `EVENT_PARTICIPANT_ROLE_TAKEN` | Role already assigned in event | Rôle déjà attribué |
| `INVALID_PARTICIPANT_TYPE` | Invalid participant type for event | Type participant invalide pour événement |
| `UNAUTHORIZED_PARTICIPANT_ACCESS` | Unauthorized access to participant | Accès non autorisé au participant |

## 📋 Structure d'erreur standard

```json
{
  "success": false,
  "error": {
    "code": "PARTICIPANT_NOT_FOUND",
    "message": "The specified participant was not found",
    "details": {
      "participant_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  },
  "timestamp": "2024-03-20T15:30:00Z"
}
```

---

# Exemples d'usage

## 🎯 Cas d'usage typiques

### 1. Création d'une équipe sportive avec staff

```bash
# 1. Créer l'équipe
curl -X POST "https://api.entrix.tn/v1/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "US_MONASTIR",
    "name": "Union Sportive Monastirienne",
    "short_name": "USM",
    "type": "SPORTS_TEAM",
    "category": "FOOTBALL",
    "nationality": "TN",
    "city": "Monastir"
  }'

# 2. Ajouter des joueurs
curl -X POST "https://api.entrix.tn/v1/participants/$PARTICIPANT_ID/staff" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "first_name": "Ahmed",
    "last_name": "Khalil",
    "role": "PLAYER",
    "position": "Forward",
    "jersey_number": 9
  }'

# 3. Ajouter à un événement
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "participant_id": "'$PARTICIPANT_ID'",
    "role": "HOME_TEAM"
  }'
```

### 2. Recherche de participants par critères

```bash
# Recherche d'artistes tunisiens actifs
curl -G "https://api.entrix.tn/v1/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -d "type=MUSIC_ARTIST" \
  -d "nationality=TN" \
  -d "is_active=true" \
  -d "is_verified=true"

# Recherche textuelle
curl -G "https://api.entrix.tn/v1/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -d "search=Espérance" \
  -d "type=SPORTS_TEAM"
```

### 3. Gestion des relations entre participants

```bash
# Créer une rivalité
curl -X POST "https://api.entrix.tn/v1/participant-relationships" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "participant_a_id": "'$EST_ID'",
    "participant_b_id": "'$CA_ID'",
    "relationship_type": "RIVALRY",
    "intensity": 10,
    "description": "Derby éternel de Tunis"
  }'

# Consulter les relations d'un participant
curl -G "https://api.entrix.tn/v1/participant-relationships" \
  -H "Authorization: Bearer $TOKEN" \
  -d "participant_id=$EST_ID"
```

### 4. Workflow complet événement musical

```bash
# 1. Créer artiste principal
MAIN_ARTIST=$(curl -X POST "https://api.entrix.tn/v1/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "AMINA_OFFICIAL",
    "name": "Amina",
    "type": "MUSIC_ARTIST",
    "category": "TRADITIONAL"
  }' | jq -r '.data.participant.id')

# 2. Créer première partie
OPENING_ACT=$(curl -X POST "https://api.entrix.tn/v1/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "YOUNG_TALENTS",
    "name": "Jeunes Talents TN",
    "type": "MUSIC_BAND",
    "category": "FUSION"
  }' | jq -r '.data.participant.id')

# 3. Ajouter à l'événement
curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "participant_id": "'$MAIN_ARTIST'",
    "role": "MAIN_ARTIST",
    "is_featured": true,
    "display_order": 2
  }'

curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "participant_id": "'$OPENING_ACT'",
    "role": "OPENING_ACT",
    "display_order": 1
  }'
```

### 5. Analytics participants

```bash
# Statistiques générales d'un participant
curl -G "https://api.entrix.tn/v1/participants/$PARTICIPANT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.participant.events_summary'

# Personnel d'un participant par rôle
curl -G "https://api.entrix.tn/v1/participants/$PARTICIPANT_ID/staff" \
  -H "Authorization: Bearer $TOKEN" \
  -d "role=PLAYER" \
  | jq '.data.summary.by_role'
```

---

## 📝 Notes importantes

### Permissions et sécurité
- Les participants peuvent être publics (lecture) mais la modification nécessite des droits spéciaux
- Le personnel est visible seulement aux organisateurs autorisés
- Les données sensibles (salaires, contacts privés) sont filtrées selon le niveau d'accès

### Performance et cache
- Les listes de participants sont mises en cache 5 minutes
- Les détails participants sont mis en cache 15 minutes  
- La recherche textuelle utilise des index optimisés
- Les relations bidirectionnelles sont automatiquement gérées

### Intégrations
- Les participants vérifiés peuvent créer des comptes utilisateur liés
- Les événements calculent automatiquement les statistiques de participation
- Le système de billetterie peut allouer des places spécifiques aux participants

---

**Version API** : v1.0  
**Dernière mise à jour** : 20 Mars 2024  
**Auteur** : Équipe Entrix Development