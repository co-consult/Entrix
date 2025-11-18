# DOCUMENTATION MODULE ÉVÉNEMENTS
## Plateforme Entrix - Système de Gestion des Événements

---

**Version :** 1.0  
**Date :** Juin 2025  
**Système :** Gestion flexible des événements sportifs et culturels  

---

## 📋 VUE D'ENSEMBLE DU MODULE

### Principe général
Le module événements d'Entrix permet de gérer tous types d'événements avec une structure flexible :

1. **PARTICIPANTS** : Référentiel des équipes, artistes, speakers
2. **ÉVÉNEMENTS** : Événements individuels avec métadonnées riches  
3. **GROUPES D'ÉVÉNEMENTS** : Organisation hiérarchique (saisons, tournois, festivals)
4. **RELATIONS** : Gestion des liens entre participants et événements

### Architecture du module
- Référentiel centralisé des participants réutilisables
- Groupes d'événements pour organisation logique
- Métadonnées JSON pour flexibilité maximale
- Gestion temporelle complète avec historique
- Support multi-types : sport, culture, conférences

---

## 🗄️ TABLES DU SYSTÈME

### **1. Table `participants`**

#### **Rôle de la table**
Référentiel centralisé de tous les participants possibles aux événements. Stocke les informations permanentes des équipes sportives, artistes, conférenciers, organisations qui peuvent participer aux événements. Cette table évite la duplication et permet un historique complet.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique du participant | `550e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(100) | Unique, NOT NULL | Code technique unique | `CA_TUNIS`, `EST_TUNIS`, `ARTIST_LATIFA` |
| `name` | VARCHAR(200) | NOT NULL | Nom complet officiel | `Club Africain`, `Espérance Sportive de Tunis`, `Latifa Arfaoui` |
| `short_name` | VARCHAR(100) | Optional | Nom court/acronyme | `CA`, `EST`, `Latifa` |
| `type` | participant_type | NOT NULL | Type de participant | `TEAM`, `ARTIST`, `SPEAKER`, `ORGANIZATION` |
| `category` | VARCHAR(50) | Optional | Catégorie spécifique | `FOOTBALL`, `BASKETBALL`, `MUSIC_RAI`, `TECH_CONFERENCE` |
| `nationality` | VARCHAR(2) | Optional | Code pays ISO | `TN`, `FR`, `EG` |
| `city` | VARCHAR(100) | Optional | Ville d'origine | `Tunis`, `Sfax`, `Paris` |
| `founded_date` | DATE | Optional | Date création/naissance | `1920-10-04` (Club Africain), `1985-03-15` |
| `logo_url` | TEXT | Optional | URL logo/photo principale | `/media/participants/ca-logo.png` |
| `banner_url` | TEXT | Optional | URL bannière/couverture | `/media/participants/ca-banner.jpg` |
| `primary_color` | VARCHAR(7) | Optional | Couleur principale hex | `#DC143C` (rouge CA), `#FFD700` (or EST) |
| `secondary_color` | VARCHAR(7) | Optional | Couleur secondaire hex | `#FFFFFF` (blanc), `#000000` (noir) |
| `website` | TEXT | Optional | Site web officiel | `https://www.clubafricain.tn` |
| `social_media` | JSONB | Optional | Liens réseaux sociaux | `{"facebook": "clubafricain", "instagram": "@ca_officiel"}` |
| `description` | TEXT | Optional | Description/biographie | `Fondé en 1920, le Club Africain est l'un des clubs les plus titrés...` |
| `achievements` | TEXT[] | Optional | Palmarès principal | `["13 championnats", "11 coupes", "1 Coupe d'Afrique"]` |
| `home_venue_id` | UUID | Foreign Key | Venue principal | `venue_stade_olympique_001` |
| `manager_name` | VARCHAR(100) | Optional | Entraîneur/manager actuel | `Faouzi Benzarti`, `Sarah Johnson` |
| `contact_email` | VARCHAR(255) | Optional | Email professionnel | `contact@clubafricain.tn` |
| `contact_phone` | VARCHAR(20) | Optional | Téléphone professionnel | `+216 71 123 456` |
| `is_active` | BOOLEAN | Default: true | Participant actif | `true`, `false` (équipe dissoute) |
| `is_verified` | BOOLEAN | Default: false | Compte vérifié/officiel | `true` (vérifié), `false` |
| `rating` | DECIMAL(3,2) | Optional | Note moyenne (0-5) | `4.50`, `3.75`, `null` |
| `metadata` | JSONB | Optional | Données spécifiques au type | Voir exemples ci-dessous |
| `created_at` | TIMESTAMPTZ | Default: now() | Date de création | `2025-01-15T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-20T15:30:00Z` |

#### **Exemples de données**

**Équipe de football :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "code": "CA_TUNIS",
  "name": "Club Africain",
  "short_name": "CA",
  "type": "TEAM",
  "category": "FOOTBALL",
  "nationality": "TN",
  "city": "Tunis",
  "founded_date": "1920-10-04",
  "logo_url": "/media/teams/ca-logo.png",
  "banner_url": "/media/teams/ca-stadium-banner.jpg",
  "primary_color": "#DC143C",
  "secondary_color": "#FFFFFF",
  "website": "https://www.clubafricain.tn",
  "social_media": {
    "facebook": "clubafricain.officiel",
    "instagram": "@ca_officiel",
    "twitter": "@CA_Officiel",
    "youtube": "ClubAfricainTV"
  },
  "description": "Le Club Africain, fondé le 4 octobre 1920, est l'un des clubs les plus prestigieux et titrés de Tunisie.",
  "achievements": [
    "13 Championnats de Tunisie",
    "11 Coupes de Tunisie", 
    "1 Coupe d'Afrique des Clubs Champions (1991)",
    "1 Coupe de la CAF",
    "1 Supercoupe de la CAF"
  ],
  "home_venue_id": "550e8400-e29b-41d4-a716-446655440010",
  "manager_name": "Faouzi Benzarti",
  "contact_email": "administration@clubafricain.tn",
  "contact_phone": "+216 71 123 456",
  "is_active": true,
  "is_verified": true,
  "rating": 4.50,
  "metadata": {
    "league": "Ligue 1 Professionnelle Tunisie",
    "stadium_capacity": 45000,
    "ultras_groups": ["Winners 2005", "Marqua", "Brigade Rouge et Blanc"],
    "main_rivals": ["EST", "CSS", "ESS"],
    "current_position": 3,
    "current_season_stats": {
      "played": 15,
      "won": 9,
      "drawn": 3,
      "lost": 3,
      "goals_for": 28,
      "goals_against": 15
    },
    "titles": {
      "championship": 13,
      "cup": 11,
      "continental": 2,
      "super_cup": 3
    },
    "foundation_story": "Créé dans le café de la Régence à Tunis...",
    "club_anthem": "Ya Lakhdar Ya Hmam..."
  }
}
```

**Artiste musical :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "code": "ARTIST_LATIFA",
  "name": "Latifa Arfaoui",
  "short_name": "Latifa",
  "type": "ARTIST",
  "category": "MUSIC_ARAB_POP",
  "nationality": "TN",
  "city": "Manouba",
  "founded_date": "1985-03-14",
  "logo_url": "/media/artists/latifa-profile.jpg",
  "banner_url": "/media/artists/latifa-concert.jpg",
  "website": "https://www.latifahofficiel.com",
  "social_media": {
    "facebook": "LatifaOfficiel",
    "instagram": "@latifa_officiel",
    "spotify": "spotify:artist:123456",
    "youtube": "LatifaVEVO"
  },
  "description": "Chanteuse tunisienne emblématique, Latifa est l'une des voix les plus reconnaissables du monde arabe.",
  "achievements": [
    "10 Albums Studio",
    "Prix Murex d'Or 2018",
    "World Music Award",
    "Plus de 50 millions de vues YouTube"
  ],
  "manager_name": "Ahmed Productions",
  "contact_email": "booking@latifahofficiel.com",
  "is_active": true,
  "is_verified": true,
  "rating": 4.75,
  "metadata": {
    "genre": ["Pop Arabe", "Musique Tunisienne", "Variété"],
    "label": "Rotana Records",
    "debut_year": 1983,
    "languages": ["Arabe", "Français", "Anglais"],
    "famous_songs": [
      "Enti Wahdek",
      "Ma Andi Dmoue",
      "Khaleeni",
      "Wadaato Beirut"
    ],
    "technical_requirements": {
      "stage_size_min": "12x10m",
      "sound_system": "Line Array 20KW",
      "lighting": "Full DMX setup",
      "crew_size": 12,
      "rehearsal_time": "4 hours",
      "dressing_rooms": 3
    },
    "typical_setlist_duration": 90,
    "price_range": "PREMIUM"
  }
}
```

**Conférencier :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "code": "SPEAKER_AMIN_TECH",
  "name": "Dr. Amin Bouazizi",
  "short_name": "Dr. Bouazizi",
  "type": "SPEAKER",
  "category": "TECH_AI",
  "nationality": "TN",
  "city": "Sousse",
  "logo_url": "/media/speakers/amin-bouazizi.jpg",
  "website": "https://www.aminbouazizi.com",
  "social_media": {
    "linkedin": "amin-bouazizi",
    "twitter": "@AminTechAI"
  },
  "description": "Expert en Intelligence Artificielle et transformation digitale, professeur à l'Université de Sousse.",
  "achievements": [
    "PhD MIT en IA",
    "100+ publications scientifiques",
    "TEDx Speaker",
    "Consultant Fortune 500"
  ],
  "contact_email": "speaking@aminbouazizi.com",
  "is_active": true,
  "is_verified": true,
  "rating": 4.90,
  "metadata": {
    "expertise": ["Intelligence Artificielle", "Machine Learning", "Transformation Digitale"],
    "languages": ["Arabe", "Français", "Anglais"],
    "talk_topics": [
      "IA et futur du travail",
      "Éthique de l'IA",
      "Transformation digitale en Afrique"
    ],
    "speaking_fee_range": "5000-10000 TND",
    "availability": "weekends",
    "preferred_format": ["keynote", "workshop", "panel"],
    "equipment_needs": ["projector", "microphone", "clicker"]
  }
}
```

---

### **2. Table `event_categories`**

#### **Rôle de la table**
Définit les types d'événements disponibles dans le système avec leurs caractéristiques par défaut. Permet de catégoriser et configurer rapidement les événements selon leur nature.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `660e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(50) | Unique, NOT NULL | Code technique | `FOOTBALL_MATCH`, `CONCERT`, `CONFERENCE` |
| `name` | VARCHAR(100) | NOT NULL | Nom de la catégorie | `Match de Football`, `Concert`, `Conférence Tech` |
| `description` | TEXT | Optional | Description détaillée | `Matchs officiels de football toutes compétitions` |
| `icon` | VARCHAR(100) | Optional | Icône/emoji associé | `⚽`, `🎵`, `💼`, `/icons/football.svg` |
| `color` | VARCHAR(7) | Optional | Code couleur hex | `#28A745` (vert), `#FF6B6B` (rouge) |
| `default_duration` | INTEGER | Optional | Durée par défaut (min) | `90` (football), `120` (concert), `60` (conférence) |
| `requires_teams` | BOOLEAN | Default: false | Nécessite des équipes | `true` (sports), `false` (concerts) |
| `requires_performers` | BOOLEAN | Default: false | Nécessite des artistes | `false` (sports), `true` (concerts) |
| `is_ticketed` | BOOLEAN | Default: true | Événement payant | `true`, `false` (gratuit) |
| `is_recurring` | BOOLEAN | Default: false | Peut être récurrent | `true` (championnat), `false` (concert unique) |
| `max_participants` | INTEGER | Optional | Nb max de participants | `2` (match), `10` (festival), `null` |
| `is_active` | BOOLEAN | Default: true | Catégorie active | `true`, `false` |
| `display_order` | INTEGER | Default: 0 | Ordre d'affichage | `10`, `20`, `30` |
| `metadata` | JSONB | Optional | Configuration spécifique | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date de création | `2025-01-01T00:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-20T10:00:00Z` |

#### **Exemples de données**

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "code": "FOOTBALL_MATCH",
    "name": "Match de Football",
    "description": "Matchs officiels de football, toutes compétitions confondues",
    "icon": "⚽",
    "color": "#28A745",
    "default_duration": 90,
    "requires_teams": true,
    "requires_performers": false,
    "is_ticketed": true,
    "is_recurring": true,
    "max_participants": 2,
    "is_active": true,
    "display_order": 10,
    "metadata": {
      "periods": 2,
      "period_duration": 45,
      "half_time_duration": 15,
      "extra_time_possible": true,
      "default_ticket_types": ["tribune", "virage", "vip"],
      "required_staff": ["referee", "linesmen", "fourth_official"],
      "broadcast_rights": true,
      "statistics_tracked": ["goals", "cards", "possession", "shots"]
    }
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "code": "CONCERT",
    "name": "Concert",
    "description": "Concerts et spectacles musicaux",
    "icon": "🎵",
    "color": "#9B59B6",
    "default_duration": 120,
    "requires_teams": false,
    "requires_performers": true,
    "is_ticketed": true,
    "is_recurring": false,
    "max_participants": null,
    "is_active": true,
    "display_order": 20,
    "metadata": {
      "setup_time": 240,
      "soundcheck_duration": 60,
      "typical_structure": ["opening_act", "main_act", "encore"],
      "default_zones": ["pit", "seated", "vip"],
      "age_restriction_common": true,
      "recording_policy": "prohibited"
    }
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440003",
    "code": "TECH_CONFERENCE",
    "name": "Conférence Tech",
    "description": "Conférences et séminaires technologiques",
    "icon": "💻",
    "color": "#3498DB",
    "default_duration": 60,
    "requires_teams": false,
    "requires_performers": true,
    "is_ticketed": true,
    "is_recurring": false,
    "max_participants": 5,
    "is_active": true,
    "display_order": 30,
    "metadata": {
      "format_options": ["keynote", "panel", "workshop", "demo"],
      "typical_capacity": 200,
      "networking_time": 30,
      "q_and_a_duration": 15,
      "streaming_enabled": true,
      "recording_default": true,
      "materials_provided": ["slides", "recording", "certificate"]
    }
  }
]
```

---

### **3. Table `event_groups`**

#### **Rôle de la table**
Organise les événements en groupes logiques (saisons, tournois, festivals). Permet une hiérarchie flexible et la gestion d'événements liés avec des règles communes.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `770e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(100) | Unique, NOT NULL | Code technique | `LIGUE1_2024_2025`, `FESTIVAL_ETE_2025` |
| `name` | VARCHAR(200) | NOT NULL | Nom du groupe | `Championnat Ligue 1 2024-2025`, `Festival d'Été de Carthage` |
| `description` | TEXT | Optional | Description détaillée | `30 journées de championnat national...` |
| `type` | event_group_type | NOT NULL | Type de groupe | `SEASON`, `TOURNAMENT`, `FESTIVAL` |
| `parent_group_id` | UUID | Foreign Key | Groupe parent | `null`, UUID d'un autre groupe |
| `season` | VARCHAR(50) | Optional | Identifiant saison | `2024-2025`, `SUMMER-2025` |
| `start_date` | DATE | NOT NULL | Date de début | `2024-09-01`, `2025-07-01` |
| `end_date` | DATE | NOT NULL | Date de fin | `2025-05-31`, `2025-08-31` |
| `venue_id` | UUID | Foreign Key, Optional | Venue principal | UUID venue ou `null` |
| `total_events` | INTEGER | Optional | Nb événements prévus | `30`, `15`, `null` |
| `completed_events` | INTEGER | Default: 0 | Événements terminés | `15`, `0` |
| `is_public` | BOOLEAN | Default: true | Visible publiquement | `true`, `false` |
| `is_active` | BOOLEAN | Default: true | Groupe actif | `true`, `false` |
| `registration_open` | BOOLEAN | Default: false | Inscriptions ouvertes | `true`, `false` |
| `ranking_enabled` | BOOLEAN | Default: false | Classement activé | `true` (championnat), `false` |
| `capacity_limit` | INTEGER | Optional | Limite participants | `20` (équipes), `null` |
| `current_participants` | INTEGER | Default: 0 | Participants actuels | `18`, `0` |
| `metadata` | JSONB | Optional | Configuration spécifique | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2024-06-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-20T15:00:00Z` |

#### **Exemples de données**

**Saison de championnat :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440001",
  "code": "LIGUE1_2024_2025",
  "name": "Championnat Ligue 1 Professionnelle 2024-2025",
  "description": "Saison régulière du championnat tunisien de première division",
  "type": "SEASON",
  "parent_group_id": null,
  "season": "2024-2025",
  "start_date": "2024-09-01",
  "end_date": "2025-05-31",
  "venue_id": null,
  "total_events": 240,
  "completed_events": 120,
  "is_public": true,
  "is_active": true,
  "registration_open": false,
  "ranking_enabled": true,
  "capacity_limit": 16,
  "current_participants": 16,
  "metadata": {
    "format": "round_robin",
    "rounds": 2,
    "matches_per_round": 15,
    "points_system": {
      "win": 3,
      "draw": 1,
      "loss": 0
    },
    "tie_breakers": ["head_to_head", "goal_difference", "goals_scored"],
    "relegation_spots": 2,
    "continental_qualification": {
      "champions_league": 1,
      "confederation_cup": 2,
      "arab_cup": 1
    },
    "prize_money": {
      "champion": 500000,
      "runner_up": 250000,
      "third": 100000
    },
    "broadcast_partner": "Watania TV",
    "official_ball": "Nike Flight 2025"
  }
}
```

**Tournoi coupe :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "code": "COUPE_TUNISIE_2025",
  "name": "Coupe de Tunisie 2024-2025",
  "description": "Coupe nationale à élimination directe",
  "type": "TOURNAMENT",
  "parent_group_id": null,
  "season": "2024-2025",
  "start_date": "2024-10-01",
  "end_date": "2025-06-15",
  "venue_id": null,
  "total_events": 63,
  "completed_events": 31,
  "is_public": true,
  "is_active": true,
  "registration_open": false,
  "ranking_enabled": false,
  "capacity_limit": 64,
  "current_participants": 32,
  "metadata": {
    "format": "knockout",
    "current_round": "round_of_32",
    "rounds": [
      {
        "name": "64ème de finale",
        "matches": 32,
        "completed": true
      },
      {
        "name": "32ème de finale", 
        "matches": 16,
        "completed": false
      },
      {
        "name": "16ème de finale",
        "matches": 8
      },
      {
        "name": "Quarts de finale",
        "matches": 4
      },
      {
        "name": "Demi-finales",
        "matches": 2
      },
      {
        "name": "Finale",
        "matches": 1,
        "venue_fixed": "Stade Olympique de Radès"
      }
    ],
    "extra_time_enabled": true,
    "penalty_shootout_enabled": true,
    "away_goals_rule": false,
    "prize_money": {
      "winner": 200000,
      "finalist": 100000
    }
  }
}
```

**Festival multi-jours :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440003",
  "code": "FESTIVAL_CARTHAGE_2025",
  "name": "Festival International de Carthage 2025",
  "description": "58ème édition du prestigieux festival d'été",
  "type": "FESTIVAL",
  "parent_group_id": null,
  "season": "SUMMER-2025",
  "start_date": "2025-07-15",
  "end_date": "2025-08-20",
  "venue_id": "880e8400-e29b-41d4-a716-446655440001",
  "total_events": 35,
  "completed_events": 0,
  "is_public": true,
  "is_active": true,
  "registration_open": true,
  "ranking_enabled": false,
  "capacity_limit": null,
  "current_participants": 28,
  "metadata": {
    "edition": 58,
    "theme": "Méditerranée en Musique",
    "artistic_director": "Nejib Belkadhi",
    "venue": "Amphithéâtre de Carthage",
    "categories": [
      "Musique Arabe",
      "Jazz", 
      "Musique du Monde",
      "Théâtre",
      "Danse"
    ],
    "headline_artists": [
      "Majda El Roumi",
      "Ibrahim Maalouf",
      "Souad Massi"
    ],
    "ticket_types": {
      "pass_festival": 500,
      "pass_semaine": 200,
      "billet_spectacle": 50
    },
    "partners": [
      "Ministère de la Culture",
      "Ville de Carthage",
      "UNESCO"
    ],
    "media_partners": ["Watania 1", "Mosaique FM", "Radio Culturelle"]
  }
}
```

---

### **4. Table `events`**

#### **Rôle de la table**
Table centrale stockant tous les événements individuels avec leurs détails complets. Gère les événements de tout type avec flexibilité maximale grâce aux métadonnées JSON.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `880e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(100) | Unique, NOT NULL | Code technique unique | `CA_VS_EST_J15_2025`, `CONCERT_LATIFA_CARTHAGE` |
| `title` | VARCHAR(300) | NOT NULL | Titre complet | `Club Africain vs Espérance Sportive de Tunis` |
| `short_title` | VARCHAR(100) | Optional | Titre court | `CA vs EST`, `Latifa à Carthage` |
| `description` | TEXT | Optional | Description détaillée | `Derby de la capitale, 15ème journée...` |
| `category_id` | UUID | Foreign Key | Type d'événement | UUID de event_categories |
| `group_id` | UUID | Foreign Key, Optional | Groupe d'appartenance | UUID de event_groups ou `null` |
| `parent_event_id` | UUID | Foreign Key, Optional | Événement parent | `null`, UUID pour sous-événement |
| `venue_id` | UUID | Foreign Key | Lieu de l'événement | UUID de venues |
| `venue_mapping_id` | UUID | Foreign Key, Optional | Config spécifique venue | UUID de venue_mappings |
| `scheduled_start` | TIMESTAMPTZ | NOT NULL | Début prévu | `2025-02-15T19:00:00+01:00` |
| `scheduled_end` | TIMESTAMPTZ | NOT NULL | Fin prévue | `2025-02-15T21:00:00+01:00` |
| `actual_start` | TIMESTAMPTZ | Optional | Début réel | `2025-02-15T19:15:00+01:00`, `null` |
| `actual_end` | TIMESTAMPTZ | Optional | Fin réelle | `2025-02-15T21:05:00+01:00`, `null` |
| `doors_open` | TIMESTAMPTZ | Optional | Ouverture portes | `2025-02-15T17:00:00+01:00` |
| `status` | event_status | NOT NULL | Statut actuel | `SCHEDULED`, `LIVE`, `COMPLETED` |
| `visibility` | event_visibility | Default: PUBLIC | Niveau de visibilité | `PUBLIC`, `PRIVATE`, `MEMBERS_ONLY` |
| `capacity_override` | INTEGER | Optional | Capacité spécifique | `40000`, `null` (utilise venue) |
| `is_sold_out` | BOOLEAN | Default: false | Complet | `true`, `false` |
| `attendance` | INTEGER | Optional | Fréquentation réelle | `38500`, `null` |
| `sales_start` | TIMESTAMPTZ | Optional | Début ventes | `2025-01-15T10:00:00+01:00` |
| `sales_end` | TIMESTAMPTZ | Optional | Fin ventes | `2025-02-15T18:00:00+01:00` |
| `cancellation_reason` | TEXT | Optional | Raison annulation | `Conditions météo défavorables`, `null` |
| `cancellation_date` | TIMESTAMPTZ | Optional | Date annulation | `2025-02-14T16:00:00+01:00`, `null` |
| `rescheduled_to` | UUID | Foreign Key, Optional | Reprogrammé vers | UUID nouvel événement, `null` |
| `broadcast_info` | JSONB | Optional | Info diffusion | `{"tv": ["Watania 1"], "streaming": ["YouTube"]}` |
| `weather_conditions` | VARCHAR(100) | Optional | Météo | `Ensoleillé 22°C`, `Pluie légère 18°C` |
| `special_instructions` | TEXT | Optional | Instructions spéciales | `Contrôles renforcés - Derby` |
| `tags` | TEXT[] | Optional | Tags recherche | `["derby", "big_match", "sold_out"]` |
| `metadata` | JSONB | Optional | Données spécifiques | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-20T15:30:00Z` |
| `created_by` | UUID | Foreign Key | Créateur | UUID utilisateur |
| `published_at` | TIMESTAMPTZ | Optional | Date publication | `2025-01-15T12:00:00Z` |

#### **Exemples de données**

**Match de football - Derby :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440001",
  "code": "CA_VS_EST_J15_2025",
  "title": "Club Africain vs Espérance Sportive de Tunis - 15ème Journée",
  "short_title": "CA vs EST",
  "description": "Le derby de la capitale oppose les deux géants tunisiens pour cette 15ème journée du championnat. Un match crucial pour la course au titre.",
  "category_id": "660e8400-e29b-41d4-a716-446655440001",
  "group_id": "770e8400-e29b-41d4-a716-446655440001",
  "parent_event_id": null,
  "venue_id": "550e8400-e29b-41d4-a716-446655440010",
  "venue_mapping_id": "550e8400-e29b-41d4-a716-446655440011",
  "scheduled_start": "2025-02-15T19:00:00+01:00",
  "scheduled_end": "2025-02-15T21:00:00+01:00",
  "actual_start": null,
  "actual_end": null,
  "doors_open": "2025-02-15T17:00:00+01:00",
  "status": "SCHEDULED",
  "visibility": "PUBLIC",
  "capacity_override": 45000,
  "is_sold_out": true,
  "attendance": null,
  "sales_start": "2025-01-15T10:00:00+01:00",
  "sales_end": "2025-02-15T18:00:00+01:00",
  "broadcast_info": {
    "tv": ["Watania 1", "Al Watania 2"],
    "radio": ["Radio Nationale", "Mosaique FM"],
    "streaming": ["YouTube Official", "Facebook Live"],
    "international": ["BeIN Sports MENA"]
  },
  "weather_conditions": null,
  "special_instructions": "Contrôles de sécurité renforcés. Arrivée recommandée 2h avant.",
  "tags": ["derby", "big_match", "sold_out", "top_clash", "title_race"],
  "metadata": {
    "competition": "Ligue 1 Professionnelle",
    "matchday": 15,
    "referee": {
      "main": "Sadok Selmi",
      "assistants": ["Ali Toumi", "Mohamed Bakir"],
      "fourth": "Youssef Srarfi"
    },
    "importance": "HIGH",
    "rivalry_index": 10,
    "head_to_head": {
      "total_matches": 156,
      "ca_wins": 58,
      "draws": 44,
      "est_wins": 54,
      "last_5": ["EST", "DRAW", "CA", "CA", "EST"]
    },
    "ticket_info": {
      "total_sold": 44800,
      "home_allocation": 35000,
      "away_allocation": 5000,
      "vip_sold": 800,
      "press": 200
    },
    "security_level": "MAXIMUM",
    "police_units": 500,
    "medical_staff": 20,
    "expected_atmosphere": "ELECTRIC"
  },
  "created_by": "990e8400-e29b-41d4-a716-446655440001",
  "published_at": "2025-01-15T12:00:00+01:00"
}
```

**Concert :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440002",
  "code": "CONCERT_LATIFA_CARTHAGE_2025",
  "title": "Latifa en Concert - Festival de Carthage 2025",
  "short_title": "Latifa à Carthage",
  "description": "La diva tunisienne Latifa enchante l'amphithéâtre romain avec ses plus grands succès dans une soirée magique.",
  "category_id": "660e8400-e29b-41d4-a716-446655440002",
  "group_id": "770e8400-e29b-41d4-a716-446655440003",
  "venue_id": "880e8400-e29b-41d4-a716-446655440001",
  "scheduled_start": "2025-07-25T21:00:00+01:00",
  "scheduled_end": "2025-07-25T23:30:00+01:00",
  "doors_open": "2025-07-25T19:30:00+01:00",
  "status": "ON_SALE",
  "visibility": "PUBLIC",
  "capacity_override": 7500,
  "is_sold_out": false,
  "sales_start": "2025-06-01T10:00:00+01:00",
  "sales_end": "2025-07-25T20:00:00+01:00",
  "broadcast_info": {
    "tv": ["Tunisie 7"],
    "streaming": ["Festival Live Stream"],
    "recording": true
  },
  "special_instructions": "Enregistrement interdit. Dress code: Tenue correcte exigée.",
  "tags": ["musique_arabe", "festival", "latifa", "carthage", "été"],
  "metadata": {
    "setlist_planned": [
      "Enti Wahdek",
      "Ma Andi Dmoue", 
      "Khaleeni",
      "Medley Classiques",
      "Nouvelles chansons",
      "Wadaato Beirut (Finale)"
    ],
    "opening_act": {
      "artist": "Orchestre Symphonique de Tunis",
      "duration": 30,
      "start_time": "20:00"
    },
    "production": {
      "sound": "L-Acoustics K2",
      "lighting": "Clay Paky",
      "stage_design": "Scénographie Carthage",
      "screens": "LED 4K 20m²"
    },
    "vip_packages": {
      "meet_greet": 50,
      "dinner_show": 100,
      "backstage_tour": 20
    },
    "merchandise": true,
    "age_restriction": "Tous publics"
  }
}
```

**Conférence Tech :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "code": "CONF_AI_TUNIS_2025",
  "title": "Intelligence Artificielle et Transformation Digitale en Afrique",
  "short_title": "AI Summit Tunis",
  "description": "Conférence internationale sur l'IA avec les meilleurs experts mondiaux et africains.",
  "category_id": "660e8400-e29b-41d4-a716-446655440003",
  "group_id": null,
  "venue_id": "990e8400-e29b-41d4-a716-446655440001",
  "scheduled_start": "2025-09-15T09:00:00+01:00",
  "scheduled_end": "2025-09-15T18:00:00+01:00",
  "doors_open": "2025-09-15T08:00:00+01:00",
  "status": "SCHEDULED",
  "visibility": "PUBLIC",
  "capacity_override": 500,
  "is_sold_out": false,
  "sales_start": "2025-07-01T00:00:00+01:00",
  "sales_end": "2025-09-14T23:59:59+01:00",
  "broadcast_info": {
    "streaming": ["YouTube Tech Tunisia", "LinkedIn Live"],
    "recording": true,
    "live_translation": ["Arabic", "French", "English"]
  },
  "tags": ["tech", "ai", "innovation", "digital", "africa"],
  "metadata": {
    "format": "hybrid",
    "agenda": [
      {
        "time": "09:00",
        "title": "Ouverture et Keynote",
        "speaker": "Dr. Amin Bouazizi"
      },
      {
        "time": "10:00",
        "title": "Panel: IA en Afrique",
        "speakers": ["Dr. Bouazizi", "Prof. Leila Ben Salem", "Ing. Karim Tech"]
      },
      {
        "time": "11:30",
        "title": "Workshops parallèles",
        "tracks": ["ML Basics", "Computer Vision", "NLP Arabic"]
      },
      {
        "time": "14:00",
        "title": "Startups Pitch",
        "participants": 10
      }
    ],
    "sponsors": {
      "platinum": ["Microsoft", "Google"],
      "gold": ["Orange Tunisie", "Ooredoo"],
      "silver": ["Smart Tunisia", "Telnet"]
    },
    "networking_app": "AI_Summit_Connect",
    "certificates": true,
    "workshop_capacity": 50,
    "languages": ["Arabic", "French", "English"]
  }
}
```

---

### **5. Table `event_participants`**

#### **Rôle de la table**
Table de liaison entre événements et participants. Définit qui participe à quel événement avec quel rôle, incluant les détails spécifiques de cette participation.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `990e8400-e29b-41d4-a716-446655440001` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement concerné | UUID de events |
| `participant_id` | UUID | Foreign Key, NOT NULL | Participant | UUID de participants |
| `role` | event_participant_role | NOT NULL | Rôle dans l'événement | `HOST`, `GUEST`, `MAIN_ACT` |
| `is_confirmed` | BOOLEAN | Default: false | Participation confirmée | `true`, `false` |
| `confirmation_date` | TIMESTAMPTZ | Optional | Date de confirmation | `2025-01-20T14:00:00Z`, `null` |
| `appearance_fee` | DECIMAL(12,2) | Optional | Cachet/frais | `50000.00`, `0.00`, `null` |
| `performance_order` | INTEGER | Optional | Ordre de passage | `1`, `2`, `null` |
| `performance_time` | TIMESTAMPTZ | Optional | Heure de performance | `2025-07-25T21:30:00+01:00` |
| `performance_duration` | INTEGER | Optional | Durée en minutes | `90`, `45`, `null` |
| `contract_number` | VARCHAR(100) | Optional | Numéro de contrat | `CTR-2025-001`, `null` |
| `special_requirements` | TEXT | Optional | Besoins spécifiques | `Loge séparée, 10 invités` |
| `technical_requirements` | JSONB | Optional | Besoins techniques | `{"sound": "specific", "lights": "full"}` |
| `cancellation_policy` | TEXT | Optional | Conditions annulation | `50% si annulation < 30 jours` |
| `transport_provided` | BOOLEAN | Default: false | Transport fourni | `true`, `false` |
| `accommodation_provided` | BOOLEAN | Default: false | Hébergement fourni | `true`, `false` |
| `metadata` | JSONB | Optional | Données spécifiques | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-15T10:00:00Z` |
| `confirmed_at` | TIMESTAMPTZ | Optional | Date confirmation | `2025-01-20T14:00:00Z` |
| `created_by` | UUID | Foreign Key | Créateur | UUID utilisateur |

#### **Exemples de données**

**Équipes de football dans un match :**
```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "event_id": "880e8400-e29b-41d4-a716-446655440001",
    "participant_id": "550e8400-e29b-41d4-a716-446655440001",
    "role": "HOST",
    "is_confirmed": true,
    "confirmation_date": "2024-08-01T10:00:00Z",
    "appearance_fee": null,
    "metadata": {
      "team_role": "home",
      "dressing_room": "A",
      "bench_side": "west",
      "warm_up_time": "18:00-18:30",
      "probable_lineup": [
        {"number": 1, "name": "Ben Mustapha", "position": "GK"},
        {"number": 2, "name": "Derbali", "position": "RB"},
        {"number": 5, "name": "Ben Abda", "position": "CB"},
        {"number": 6, "name": "Dhaouadi", "position": "CB"},
        {"number": 3, "name": "Khelil", "position": "LB"},
        {"number": 8, "name": "Sassi", "position": "CDM"},
        {"number": 10, "name": "Jaziri", "position": "CAM"},
        {"number": 7, "name": "Chamakhi", "position": "RW"},
        {"number": 11, "name": "Laifi", "position": "LW"},
        {"number": 9, "name": "Eduwo", "position": "CF"},
        {"number": 14, "name": "Khefifi", "position": "CF"}
      ],
      "coach": "Faouzi Benzarti",
      "assistant_coaches": ["Mohamed Ali", "Hatem Missaoui"],
      "team_doctor": "Dr. Slim Charfi",
      "kit_color": "red_white"
    }
  },
  {
    "id": "990e8400-e29b-41d4-a716-446655440002",
    "event_id": "880e8400-e29b-41d4-a716-446655440001",
    "participant_id": "550e8400-e29b-41d4-a716-446655440010",
    "role": "GUEST",
    "is_confirmed": true,
    "confirmation_date": "2024-08-01T10:00:00Z",
    "metadata": {
      "team_role": "away",
      "dressing_room": "B",
      "bench_side": "east",
      "warm_up_time": "18:00-18:30",
      "kit_color": "yellow_red",
      "away_fans_section": "Virage Sud",
      "security_escort": true
    }
  }
]
```

**Artiste principal concert :**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440003",
  "event_id": "880e8400-e29b-41d4-a716-446655440002",
  "participant_id": "550e8400-e29b-41d4-a716-446655440002",
  "role": "MAIN_ACT",
  "is_confirmed": true,
  "confirmation_date": "2025-05-01T15:00:00Z",
  "appearance_fee": 75000.00,
  "performance_order": 2,
  "performance_time": "2025-07-25T21:00:00+01:00",
  "performance_duration": 120,
  "contract_number": "FEST-2025-LATIFA-001",
  "special_requirements": "Loge privée avec salon, Catering halal pour 15 personnes",
  "technical_requirements": {
    "sound": {
      "console": "Yamaha CL5",
      "monitors": "12 wedges L-Acoustics",
      "in_ear": "Sennheiser 2050",
      "microphones": ["Shure Beta 58A", "DPA 4099"]
    },
    "lighting": {
      "followspots": 2,
      "moving_heads": 24,
      "led_panels": 16,
      "hazer": true
    },
    "stage": {
      "piano": "Steinway Model D",
      "risers": "3 levels",
      "backdrop": "LED Screen 12x8m"
    },
    "crew": {
      "sound_engineer": 1,
      "monitor_engineer": 1,
      "lighting_director": 1,
      "stage_manager": 1
    }
  },
  "transport_provided": true,
  "accommodation_provided": true,
  "metadata": {
    "hotel": "Four Seasons Tunis",
    "rooms": 8,
    "arrival": "2025-07-24",
    "departure": "2025-07-26",
    "ground_transport": "Mercedes V-Class with driver",
    "hospitality_rider": {
      "dressing_room": [
        "Fresh flowers",
        "Fruit basket",
        "Mineral water (room temp)",
        "Arabic coffee set",
        "Full-length mirror"
      ],
      "catering": [
        "Hot meal for 15",
        "Vegetarian options",
        "Fresh juice bar",
        "Traditional sweets"
      ]
    },
    "media_obligations": [
      "Press conference 24/07 16:00",
      "TV interview post-show",
      "Meet & greet VIP (30 min)"
    ],
    "merchandising_rights": "50/50 split",
    "recording_rights": "Festival owns video, artist owns audio"
  }
}
```

**Conférencier principal :**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "event_id": "880e8400-e29b-41d4-a716-446655440003",
  "participant_id": "550e8400-e29b-41d4-a716-446655440003",
  "role": "KEYNOTE_SPEAKER",
  "is_confirmed": true,
  "confirmation_date": "2025-07-01T09:00:00Z",
  "appearance_fee": 5000.00,
  "performance_order": 1,
  "performance_time": "2025-09-15T09:15:00+01:00",
  "performance_duration": 45,
  "special_requirements": "Clicker, water, tech check 30 min avant",
  "technical_requirements": {
    "presentation": {
      "format": "PowerPoint",
      "aspect_ratio": "16:9",
      "clicker": "Logitech R800",
      "backup": "USB drive"
    },
    "audio": {
      "microphone": "Wireless lavalier",
      "backup_mic": "Handheld"
    },
    "video": {
      "projector": "4K resolution",
      "confidence_monitor": true,
      "recording": "Multi-camera"
    }
  },
  "transport_provided": false,
  "accommodation_provided": false,
  "metadata": {
    "talk_title": "L'IA au service du développement africain",
    "abstract": "Comment l'intelligence artificielle peut accélérer...",
    "bio": "Dr. Amin Bouazizi est un expert reconnu...",
    "slides_deadline": "2025-09-10",
    "language": "French",
    "live_translation": ["Arabic", "English"],
    "q_and_a_duration": 15,
    "book_signing": true,
    "workshop_after": {
      "title": "Hands-on ML",
      "duration": 120,
      "capacity": 50,
      "additional_fee": 2000
    }
  }
}
```

---

### **6. Table `participant_staff`**

#### **Rôle de la table**
Gère le personnel associé aux participants (joueurs d'équipes, membres de groupes musicaux, staff technique). Permet le suivi historique des effectifs.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `aa0e8400-e29b-41d4-a716-446655440001` |
| `participant_id` | UUID | Foreign Key, NOT NULL | Participant parent | UUID de participants |
| `name` | VARCHAR(200) | NOT NULL | Nom complet | `Youssef Msakni`, `Ahmed Guitare` |
| `role` | VARCHAR(100) | NOT NULL | Rôle/fonction | `Attaquant`, `Guitariste`, `Manager` |
| `jersey_number` | VARCHAR(10) | Optional | Numéro maillot | `10`, `99`, `null` |
| `position` | VARCHAR(50) | Optional | Poste/position | `CF`, `CAM`, `Lead Guitar` |
| `nationality` | VARCHAR(2) | Optional | Code pays ISO | `TN`, `FR`, `BR` |
| `birth_date` | DATE | Optional | Date de naissance | `1990-10-28`, `1985-05-15` |
| `photo_url` | TEXT | Optional | URL photo | `/media/staff/msakni.jpg` |
| `bio` | TEXT | Optional | Biographie courte | `International tunisien, formé au club...` |
| `is_active` | BOOLEAN | Default: true | Actuellement actif | `true`, `false` |
| `is_captain` | BOOLEAN | Default: false | Capitaine (sport) | `true`, `false` |
| `joined_date` | DATE | Optional | Date d'arrivée | `2020-07-01`, `2018-01-15` |
| `left_date` | DATE | Optional | Date de départ | `null`, `2023-06-30` |
| `contract_end` | DATE | Optional | Fin de contrat | `2026-06-30`, `null` |
| `market_value` | DECIMAL(10,2) | Optional | Valeur marchande | `2500000.00`, `null` |
| `social_media` | JSONB | Optional | Réseaux sociaux | `{"instagram": "@msakni", "twitter": "@ymsakni"}` |
| `achievements` | TEXT[] | Optional | Palmarès personnel | `["Champion 2021", "Meilleur buteur 2022"]` |
| `metadata` | JSONB | Optional | Données spécifiques | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2020-07-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-20T15:00:00Z` |

#### **Exemples de données**

**Joueur de football :**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440001",
  "participant_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Youssef Msakni",
  "role": "Attaquant",
  "jersey_number": "10",
  "position": "RW",
  "nationality": "TN",
  "birth_date": "1990-10-28",
  "photo_url": "/media/players/msakni-ca.jpg",
  "bio": "International tunisien et capitaine du Club Africain. Formé au club, il est revenu après des passages à l'étranger.",
  "is_active": true,
  "is_captain": true,
  "joined_date": "2020-07-01",
  "left_date": null,
  "contract_end": "2026-06-30",
  "market_value": 2500000.00,
  "social_media": {
    "instagram": "@youssefmsakni",
    "facebook": "Youssef.Msakni.Official",
    "twitter": "@ymsakni"
  },
  "achievements": [
    "100+ sélections en équipe nationale",
    "Champion de Tunisie 2021",
    "Meilleur joueur du championnat 2022",
    "Coupe d'Afrique 2004 (jeune)"
  ],
  "metadata": {
    "stats_current_season": {
      "matches": 15,
      "goals": 8,
      "assists": 5,
      "yellow_cards": 2,
      "red_cards": 0,
      "minutes_played": 1250
    },
    "career_stats": {
      "total_matches": 450,
      "total_goals": 145,
      "total_assists": 89,
      "clubs": ["CA", "Esperance", "Al-Duhail", "Eupen", "CA"]
    },
    "physical": {
      "height": "179cm",
      "weight": "75kg",
      "preferred_foot": "right"
    },
    "agent": "Sport Plus Agency",
    "injury_status": "fit",
    "shirt_sales_rank": 1
  }
}
```

**Membre groupe musical :**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440002",
  "participant_id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Mehdi Ben Salem",
  "role": "Directeur Musical",
  "position": "Piano & Arrangements",
  "nationality": "TN",
  "birth_date": "1975-06-20",
  "photo_url": "/media/artists/mehdi-piano.jpg",
  "bio": "Pianiste virtuose et arrangeur, collabore avec Latifa depuis 15 ans.",
  "is_active": true,
  "joined_date": "2010-01-01",
  "social_media": {
    "instagram": "@mehdi_music_tn",
    "youtube": "MehdiBenSalemMusic"
  },
  "metadata": {
    "instruments": ["Piano", "Keyboards", "Oud"],
    "education": "Conservatoire de Tunis, Berklee College",
    "other_collaborations": ["Saber Rebai", "Lotfi Bouchnak", "Emel Mathlouthi"],
    "albums_produced": 25,
    "awards": ["Best Arranger 2020", "Golden Note 2018"],
    "touring_role": "Musical Director & Keys"
  }
}
```

**Staff technique équipe :**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440003",
  "participant_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Faouzi Benzarti",
  "role": "Entraîneur Principal",
  "nationality": "TN",
  "birth_date": "1950-01-01",
  "photo_url": "/media/staff/benzarti.jpg",
  "bio": "Entraîneur légendaire du football tunisien avec plus de 30 ans d'expérience.",
  "is_active": true,
  "joined_date": "2024-12-01",
  "contract_end": "2026-06-30",
  "metadata": {
    "coaching_license": "UEFA Pro",
    "previous_clubs": ["EST", "CS Sfax", "Wydad AC", "Al Sailiya"],
    "titles_won": {
      "league": 12,
      "cup": 8,
      "continental": 3
    },
    "preferred_formation": "4-3-3",
    "coaching_philosophy": "Possession et pressing haut",
    "staff_members": [
      {"name": "Mohamed Ali", "role": "Assistant"},
      {"name": "Hatem Missaoui", "role": "Préparateur Physique"},
      {"name": "Karim Kassar", "role": "Entraîneur Gardiens"}
    ]
  }
}
```

---

### **7. Table `participant_relationships`**

#### **Rôle de la table**
Définit les relations entre participants (rivalités sportives, partenariats, affiliations). Permet de gérer les derbies, collaborations artistiques, etc.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `bb0e8400-e29b-41d4-a716-446655440001` |
| `participant_a_id` | UUID | Foreign Key, NOT NULL | Premier participant | UUID de participants |
| `participant_b_id` | UUID | Foreign Key, NOT NULL | Second participant | UUID de participants |
| `relationship_type` | participant_relationship_type | NOT NULL | Type de relation | `RIVALRY`, `PARTNERSHIP` |
| `intensity` | INTEGER | Check 1-10 | Intensité/importance | `10` (derby), `5` (rivalité moyenne) |
| `description` | TEXT | Optional | Description | `Derby de la capitale depuis 1920` |
| `start_date` | DATE | Optional | Début de la relation | `1920-01-01`, `2020-07-01` |
| `end_date` | DATE | Optional | Fin de la relation | `null`, `2023-06-30` |
| `is_active` | BOOLEAN | Default: true | Relation active | `true`, `false` |
| `is_mutual` | BOOLEAN | Default: true | Relation mutuelle | `true`, `false` |
| `metadata` | JSONB | Optional | Données spécifiques | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2020-01-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-20T15:00:00Z` |

#### **Exemples de données**

**Rivalité sportive (Derby) :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440001",
  "participant_a_id": "550e8400-e29b-41d4-a716-446655440001",
  "participant_b_id": "550e8400-e29b-41d4-a716-446655440010",
  "relationship_type": "RIVALRY",
  "intensity": 10,
  "description": "Le Derby de Tunis - La plus grande rivalité du football tunisien entre le Club Africain et l'Espérance Sportive de Tunis",
  "start_date": "1920-01-01",
  "end_date": null,
  "is_active": true,
  "is_mutual": true,
  "metadata": {
    "rivalry_name": "Derby de la Capitale",
    "first_match": "1921-03-15",
    "total_matches": 345,
    "competitive_matches": 280,
    "friendly_matches": 65,
    "head_to_head": {
      "ca_wins": 115,
      "draws": 98,
      "est_wins": 132,
      "ca_goals": 412,
      "est_goals": 445
    },
    "biggest_wins": {
      "ca": {"score": "5-0", "date": "1962-05-20"},
      "est": {"score": "6-1", "date": "1991-12-08"}
    },
    "memorable_matches": [
      {
        "date": "1991-11-08",
        "competition": "Coupe d'Afrique",
        "score": "CA 1-0 EST",
        "significance": "Finale continentale"
      },
      {
        "date": "2018-05-12",
        "competition": "Championnat",
        "score": "EST 2-1 CA",
        "significance": "Match du titre"
      }
    ],
    "fan_incidents": 15,
    "security_level": "MAXIMUM",
    "average_attendance": 42000,
    "economic_impact": "5M TND par match"
  }
}
```

**Partenariat commercial :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440002",
  "participant_a_id": "550e8400-e29b-41d4-a716-446655440001",
  "participant_b_id": "cc0e8400-e29b-41d4-a716-446655440001",
  "relationship_type": "PARTNERSHIP",
  "intensity": 8,
  "description": "Partenariat officiel entre le Club Africain et Ooredoo Tunisie",
  "start_date": "2023-07-01",
  "end_date": "2026-06-30",
  "is_active": true,
  "is_mutual": true,
  "metadata": {
    "partnership_type": "Main Sponsor",
    "contract_value": 3000000,
    "contract_duration": "3 years",
    "visibility": {
      "jersey": "front",
      "stadium": ["panels", "scoreboard"],
      "digital": ["website", "social_media"]
    },
    "activations": [
      "Fan zones at matches",
      "Meet & greet with players",
      "Youth academy support",
      "Digital content series"
    ],
    "kpis": {
      "brand_visibility": "50M impressions/year",
      "fan_engagement": "100K interactions/month",
      "new_customers": "5000/year attributed"
    },
    "renewal_option": true,
    "exclusivity_category": "Telecom"
  }
}
```

**Collaboration artistique :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440003",
  "participant_a_id": "550e8400-e29b-41d4-a716-446655440002",
  "participant_b_id": "dd0e8400-e29b-41d4-a716-446655440001",
  "relationship_type": "COLLABORATION",
  "intensity": 7,
  "description": "Collaboration musicale régulière entre Latifa et Saber Rebai",
  "start_date": "2015-01-01",
  "end_date": null,
  "is_active": true,
  "is_mutual": true,
  "metadata": {
    "collaboration_type": "Musical",
    "joint_works": [
      {
        "title": "Ya Msafer",
        "year": 2016,
        "type": "Duet",
        "views": "25M YouTube"
      },
      {
        "title": "Enti Omri",
        "year": 2019,
        "type": "Duet",
        "views": "18M YouTube"
      }
    ],
    "joint_concerts": 12,
    "upcoming_projects": [
      {
        "type": "Album",
        "title": "Duets Collection",
        "release_date": "2025-12"
      }
    ],
    "revenue_split": "50/50",
    "management_coordination": true
  }
}
```

---

### **8. Table `event_schedules`**

#### **Rôle de la table**
Gère le programme détaillé des événements complexes (festivals multi-jours, conférences avec sessions parallèles, tournois avec plusieurs matchs).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `cc0e8400-e29b-41d4-a716-446655440001` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement parent | UUID de events |
| `session_name` | VARCHAR(200) | NOT NULL | Nom de la session | `Match d'ouverture`, `Concert principal` |
| `session_code` | VARCHAR(100) | Optional | Code de session | `OPENING_MATCH`, `MAIN_STAGE_DAY1` |
| `session_type` | VARCHAR(50) | NOT NULL | Type de session | `MAIN_EVENT`, `WARM_UP`, `WORKSHOP` |
| `description` | TEXT | Optional | Description détaillée | `Premier match du tournoi...` |
| `start_time` | TIMESTAMPTZ | NOT NULL | Heure de début | `2025-07-15T14:00:00+01:00` |
| `end_time` | TIMESTAMPTZ | NOT NULL | Heure de fin | `2025-07-15T16:00:00+01:00` |
| `venue_zone_id` | UUID | Foreign Key, Optional | Zone spécifique | UUID de venue_zones |
| `capacity_override` | INTEGER | Optional | Capacité spécifique | `500`, `null` |
| `is_public` | BOOLEAN | Default: true | Session publique | `true`, `false` |
| `requires_separate_ticket` | BOOLEAN | Default: false | Billet séparé requis | `true`, `false` |
| `display_order` | INTEGER | Default: 0 | Ordre d'affichage | `1`, `2`, `3` |
| `metadata` | JSONB | Optional | Données spécifiques | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-01T10:00:00Z` |

#### **Exemples de données**

**Programme festival multi-jours :**
```json
[
  {
    "id": "cc0e8400-e29b-41d4-a716-446655440001",
    "event_id": "880e8400-e29b-41d4-a716-446655440002",
    "session_name": "Soirée d'ouverture - Orchestre Symphonique",
    "session_code": "OPENING_SYMPHONY",
    "session_type": "OPENING_ACT",
    "description": "L'Orchestre Symphonique de Tunis ouvre le festival avec un programme de musique arabe classique",
    "start_time": "2025-07-15T20:00:00+01:00",
    "end_time": "2025-07-15T21:00:00+01:00",
    "is_public": true,
    "display_order": 1,
    "metadata": {
      "conductor": "Hafedh Makni",
      "program": [
        "Malouf Tunisien",
        "Extraits d'Oum Kalthoum",
        "Médley Farid El Atrache"
      ],
      "musicians_count": 60
    }
  },
  {
    "id": "cc0e8400-e29b-41d4-a716-446655440002",
    "event_id": "880e8400-e29b-41d4-a716-446655440002",
    "session_name": "Concert Principal - Latifa",
    "session_code": "MAIN_LATIFA",
    "session_type": "MAIN_EVENT",
    "start_time": "2025-07-15T21:30:00+01:00",
    "end_time": "2025-07-15T23:30:00+01:00",
    "is_public": true,
    "display_order": 2,
    "metadata": {
      "setlist_sections": [
        {
          "name": "Classics",
          "duration": 45,
          "songs": ["Enti Wahdek", "Ma Andi Dmoue", "Khalleeni"]
        },
        {
          "name": "New Album",
          "duration": 30,
          "songs": ["Nouvelle chanson 1", "Nouvelle chanson 2"]
        },
        {
          "name": "Finale",
          "duration": 45,
          "songs": ["Medley", "Wadaato Beirut", "Rappel"]
        }
      ]
    }
  }
]
```

---

### **9. Table `event_media`**

#### **Rôle de la table**
Stocke tous les médias associés aux événements (affiches, photos, vidéos promotionnelles, documents).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `dd0e8400-e29b-41d4-a716-446655440001` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement associé | UUID de events |
| `media_type` | event_media_type | NOT NULL | Type de média | `POSTER`, `PHOTO`, `VIDEO` |
| `title` | VARCHAR(200) | NOT NULL | Titre du média | `Affiche officielle`, `Teaser video` |
| `description` | TEXT | Optional | Description | `Affiche officielle du derby 2025` |
| `url` | TEXT | NOT NULL | URL du fichier | `/media/events/derby-2025-poster.jpg` |
| `thumbnail_url` | TEXT | Optional | URL miniature | `/media/events/thumb-derby-2025.jpg` |
| `file_size` | INTEGER | Optional | Taille en bytes | `2048576` |
| `duration` | INTEGER | Optional | Durée (vidéo/audio) | `60`, `null` |
| `mime_type` | VARCHAR(100) | Optional | Type MIME | `image/jpeg`, `video/mp4` |
| `is_primary` | BOOLEAN | Default: false | Média principal | `true`, `false` |
| `is_public` | BOOLEAN | Default: true | Visible publiquement | `true`, `false` |
| `display_order` | INTEGER | Default: 0 | Ordre d'affichage | `1`, `2`, `3` |
| `tags` | TEXT[] | Optional | Tags | `["official", "poster", "derby"]` |
| `metadata` | JSONB | Optional | Métadonnées | `{"width": 1920, "height": 1080}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-15T10:00:00Z` |
| `uploaded_by` | UUID | Foreign Key | Utilisateur | UUID utilisateur |

#### **Exemples de données**

```json
[
  {
    "id": "dd0e8400-e29b-41d4-a716-446655440001",
    "event_id": "880e8400-e29b-41d4-a716-446655440001",
    "media_type": "POSTER",
    "title": "Affiche Officielle Derby 2025",
    "description": "Affiche officielle du derby CA vs EST - 15ème journée",
    "url": "/media/events/2025/derby-ca-est-official.jpg",
    "thumbnail_url": "/media/events/2025/thumb-derby-ca-est.jpg",
    "file_size": 3145728,
    "mime_type": "image/jpeg",
    "is_primary": true,
    "is_public": true,
    "display_order": 1,
    "tags": ["official", "poster", "derby", "2025"],
    "metadata": {
      "dimensions": {
        "width": 2480,
        "height": 3508
      },
      "format": "A3",
      "designer": "Studio Sport Design",
      "languages": ["ar", "fr"],
      "print_ready": true
    }
  },
  {
    "id": "dd0e8400-e29b-41d4-a716-446655440002",
    "event_id": "880e8400-e29b-41d4-a716-446655440001",
    "media_type": "VIDEO",
    "title": "Teaser Derby CA vs EST",
    "description": "Video teaser officiel pour le derby",
    "url": "/media/events/2025/derby-teaser.mp4",
    "thumbnail_url": "/media/events/2025/derby-teaser-thumb.jpg",
    "file_size": 52428800,
    "duration": 60,
    "mime_type": "video/mp4",
    "is_primary": false,
    "is_public": true,
    "display_order": 2,
    "tags": ["teaser", "video", "derby", "promo"],
    "metadata": {
      "resolution": "1920x1080",
      "framerate": "30fps",
      "codec": "H.264",
      "audio": "AAC 192kbps",
      "subtitles": ["ar", "fr"],
      "production": "Club Media Team"
    }
  }
]
```

---

### **10. Table `event_restrictions`**

#### **Rôle de la table**
Définit les restrictions et conditions d'accès aux événements (âge, groupes requis, zones géographiques, etc.).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `ee0e8400-e29b-41d4-a716-446655440001` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement concerné | UUID de events |
| `restriction_type` | restriction_type | NOT NULL | Type de restriction | `AGE`, `GROUP`, `GEOGRAPHIC` |
| `name` | VARCHAR(200) | NOT NULL | Nom de la restriction | `Interdit moins de 16 ans`, `Membres uniquement` |
| `description` | TEXT | Optional | Description détaillée | `Pour raisons de sécurité...` |
| `min_age` | INTEGER | Optional, Check >= 0 | Âge minimum | `16`, `18`, `null` |
| `max_age` | INTEGER | Optional | Âge maximum | `null`, `65` |
| `required_groups` | UUID[] | Optional | Groupes requis | Array d'UUID de groups |
| `required_roles` | VARCHAR(50)[] | Optional | Rôles requis | `["SUBSCRIBER", "VIP"]` |
| `blocked_groups` | UUID[] | Optional | Groupes interdits | Array d'UUID |
| `allowed_countries` | VARCHAR(2)[] | Optional | Pays autorisés | `["TN", "DZ", "LY"]` |
| `blocked_countries` | VARCHAR(2)[] | Optional | Pays interdits | `["XX", "YY"]` |
| `allowed_cities` | VARCHAR(100)[] | Optional | Villes autorisées | `["Tunis", "Sfax", "Sousse"]` |
| `dress_code` | VARCHAR(200) | Optional | Code vestimentaire | `Tenue correcte exigée` |
| `special_conditions` | TEXT | Optional | Conditions spéciales | `Carte d'identité obligatoire` |
| `is_enforced` | BOOLEAN | Default: true | Restriction active | `true`, `false` |
| `enforcement_level` | VARCHAR(20) | Default: STRICT | Niveau application | `STRICT`, `FLEXIBLE`, `INFO_ONLY` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-01T10:00:00Z` |

#### **Exemples de données**

```json
[
  {
    "id": "ee0e8400-e29b-41d4-a716-446655440001",
    "event_id": "880e8400-e29b-41d4-a716-446655440001",
    "restriction_type": "AGE",
    "name": "Restriction d'âge - Derby",
    "description": "Pour des raisons de sécurité, le derby est interdit aux moins de 16 ans non accompagnés",
    "min_age": 16,
    "max_age": null,
    "is_enforced": true,
    "enforcement_level": "STRICT",
    "metadata": {
      "exception": "Enfants accompagnés d'un adulte en tribune famille",
      "verification_required": "ID_CARD",
      "family_zone_exempt": true
    }
  },
  {
    "id": "ee0e8400-e29b-41d4-a716-446655440002",
    "event_id": "880e8400-e29b-41d4-a716-446655440001",
    "restriction_type": "GROUP",
    "name": "Supporters adverses - Zone limitée",
    "description": "Les supporters de l'EST sont limités au parcage visiteurs",
    "required_groups": ["770e8400-e29b-41d4-a716-446655440100"],
    "is_enforced": true,
    "enforcement_level": "STRICT",
    "metadata": {
      "allocated_zone": "Virage Sud Visiteurs",
      "max_capacity": 5000,
      "special_entry": "Entrée F uniquement",
      "police_escort": true
    }
  },
  {
    "id": "ee0e8400-e29b-41d4-a716-446655440003",
    "event_id": "880e8400-e29b-41d4-a716-446655440003",
    "restriction_type": "MEMBERSHIP",
    "name": "Accès VIP - Membres Premium",
    "description": "Section VIP réservée aux membres Premium et partenaires",
    "required_roles": ["VIP", "PARTNER"],
    "dress_code": "Business casual minimum",
    "is_enforced": true,
    "enforcement_level": "STRICT",
    "metadata": {
      "vip_services": ["cocktail", "parking", "lounge"],
      "guest_allowed": 1,
      "access_time": "2h avant l'événement"
    }
  }
]
```

---

### **11. Table `event_stats`**

#### **Rôle de la table**
Enregistre toutes les statistiques et résultats des événements (scores, fréquentation, performances).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `ff0e8400-e29b-41d4-a716-446655440001` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement concerné | UUID de events |
| `stat_type` | VARCHAR(50) | NOT NULL | Type de statistique | `SCORE`, `ATTENDANCE`, `RATING` |
| `stat_category` | VARCHAR(50) | Optional | Catégorie | `FINAL`, `HALF_TIME`, `PERFORMANCE` |
| `stat_key` | VARCHAR(100) | NOT NULL | Clé de la stat | `home_goals`, `away_goals`, `total_attendance` |
| `stat_value` | VARCHAR(200) | NOT NULL | Valeur | `2`, `1`, `42500` |
| `participant_id` | UUID | Foreign Key, Optional | Participant concerné | UUID de participants |
| `recorded_at` | TIMESTAMPTZ | NOT NULL | Moment d'enregistrement | `2025-02-15T20:45:00+01:00` |
| `recorded_by` | UUID | Foreign Key, Optional | Enregistré par | UUID utilisateur |
| `is_official` | BOOLEAN | Default: true | Statistique officielle | `true`, `false` |
| `metadata` | JSONB | Optional | Détails supplémentaires | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-02-15T21:00:00Z` |

#### **Exemples de données**

**Statistiques match de football :**
```json
[
  {
    "id": "ff0e8400-e29b-41d4-a716-446655440001",
    "event_id": "880e8400-e29b-41d4-a716-446655440001",
    "stat_type": "SCORE",
    "stat_category": "FINAL",
    "stat_key": "final_score",
    "stat_value": "2-1",
    "recorded_at": "2025-02-15T20:50:00+01:00",
    "is_official": true,
    "metadata": {
      "home_score": 2,
      "away_score": 1,
      "scorers": {
        "home": [
          {"player": "Msakni", "minute": 23, "type": "open_play"},
          {"player": "Chamakhi", "minute": 78, "type": "penalty"}
        ],
        "away": [
          {"player": "Badri", "minute": 56, "type": "header"}
        ]
      }
    }
  },
  {
    "id": "ff0e8400-e29b-41d4-a716-446655440002",
    "event_id": "880e8400-e29b-41d4-a716-446655440001",
    "stat_type": "ATTENDANCE",
    "stat_category": "FINAL",
    "stat_key": "total_attendance",
    "stat_value": "42500",
    "recorded_at": "2025-02-15T19:30:00+01:00",
    "is_official": true,
    "metadata": {
      "capacity": 45000,
      "occupancy_rate": "94.4%",
      "by_category": {
        "home_fans": 35000,
        "away_fans": 4800,
        "vip": 800,
        "press": 200,
        "neutral": 1700
      },
      "gates_attendance": {
        "gate_a": 12000,
        "gate_b": 11000,
        "gate_c": 8500,
        "gate_d": 7000,
        "vip_entrance": 1000,
        "press_entrance": 200
      }
    }
  },
  {
    "id": "ff0e8400-e29b-41d4-a716-446655440003",
    "event_id": "880e8400-e29b-41d4-a716-446655440001",
    "stat_type": "CARDS",
    "stat_category": "DISCIPLINARY",
    "stat_key": "yellow_cards",
    "stat_value": "5",
    "recorded_at": "2025-02-15T20:50:00+01:00",
    "is_official": true,
    "metadata": {
      "details": [
        {"team": "home", "player": "Derbali", "minute": 28, "reason": "tactical_foul"},
        {"team": "home", "player": "Sassi", "minute": 44, "reason": "dissent"},
        {"team": "away", "player": "Jouini", "minute": 52, "reason": "time_wasting"},
        {"team": "away", "player": "Badri", "minute": 67, "reason": "simulation"},
        {"team": "away", "player": "Kom", "minute": 88, "reason": "tactical_foul"}
      ]
    }
  }
]
```

**Statistiques concert :**
```json
[
  {
    "id": "ff0e8400-e29b-41d4-a716-446655440004",
    "event_id": "880e8400-e29b-41d4-a716-446655440002",
    "stat_type": "PERFORMANCE",
    "stat_category": "DURATION",
    "stat_key": "actual_duration",
    "stat_value": "135",
    "participant_id": "550e8400-e29b-41d4-a716-446655440002",
    "recorded_at": "2025-07-25T23:30:00+01:00",
    "metadata": {
      "planned_duration": 120,
      "encore_duration": 15,
      "setlist_performed": 18,
      "setlist_planned": 16
    }
  },
  {
    "id": "ff0e8400-e29b-41d4-a716-446655440005",
    "event_id": "880e8400-e29b-41d4-a716-446655440002",
    "stat_type": "RATING",
    "stat_category": "AUDIENCE",
    "stat_key": "average_rating",
    "stat_value": "4.8",
    "recorded_at": "2025-07-26T12:00:00+01:00",
    "metadata": {
      "total_ratings": 3250,
      "distribution": {
        "5_stars": 2600,
        "4_stars": 500,
        "3_stars": 100,
        "2_stars": 30,
        "1_star": 20
      },
      "top_comments": [
        "Performance exceptionnelle!",
        "La voix de Latifa était magique",
        "Meilleur concert du festival"
      ]
    }
  }
]
```

---

## 📊 ÉNUMÉRATIONS DÉTAILLÉES

### Types de participants
```sql
CREATE TYPE participant_type AS ENUM (
    'TEAM',              -- Équipe sportive
    'ARTIST',            -- Artiste/groupe musical  
    'SPEAKER',           -- Conférencier
    'ORGANIZATION',      -- Organisation/entreprise
    'COMEDIAN',          -- Humoriste
    'ATHLETE',           -- Athlète individuel
    'CLUB'               -- Club/association
);
```

### Types de groupes d'événements
```sql
CREATE TYPE event_group_type AS ENUM (
    'SEASON',            -- Saison sportive complète
    'TOURNAMENT',        -- Tournoi avec phases
    'SERIES',            -- Série de matchs/spectacles
    'FESTIVAL',          -- Festival multi-jours
    'CHAMPIONSHIP',      -- Championnat
    'CUP',              -- Coupe avec élimination
    'TOUR',             -- Tournée artistique
    'CONFERENCE',        -- Série de conférences
    'EXHIBITION'         -- Exposition/salon
);
```

### Statuts d'événements
```sql
CREATE TYPE event_status AS ENUM (
    'DRAFT',            -- Brouillon non publié
    'SCHEDULED',        -- Planifié et confirmé
    'CONFIRMED',        -- Confirmé avec tous les participants
    'ON_SALE',          -- Billetterie ouverte
    'LIVE',             -- En cours actuellement
    'COMPLETED',        -- Terminé normalement
    'CANCELLED',        -- Annulé définitivement
    'POSTPONED',        -- Reporté à une date ultérieure
    'SUSPENDED'         -- Suspendu temporairement
);
```

### Visibilité d'événement
```sql
CREATE TYPE event_visibility AS ENUM (
    'PUBLIC',           -- Visible par tous
    'PRIVATE',          -- Sur invitation uniquement
    'RESTRICTED',       -- Accès restreint par critères
    'MEMBERS_ONLY',     -- Membres/abonnés uniquement
    'INTERNAL'          -- Interne organisation
);
```

### Rôles des participants dans les événements
```sql
CREATE TYPE event_participant_role AS ENUM (
    'HOST',             -- Hôte/équipe domicile
    'GUEST',            -- Invité/équipe extérieur
    'MAIN_ACT',         -- Tête d'affiche/artiste principal
    'OPENING_ACT',      -- Première partie
    'CO_HEADLINER',     -- Co-vedette
    'SPECIAL_GUEST',    -- Invité spécial
    'MODERATOR',        -- Modérateur/animateur
    'PANELIST',         -- Participant panel/table ronde
    'REFEREE',          -- Arbitre principal
    'LINESMAN',         -- Arbitre de touche
    'COMMENTATOR',      -- Commentateur
    'PERFORMER',        -- Artiste/performeur
    'SPEAKER',          -- Conférencier
    'EXHIBITOR',        -- Exposant
    'SPONSOR'           -- Sponsor présent
);
```

### Types de relations entre participants
```sql
CREATE TYPE participant_relationship_type AS ENUM (
    'RIVALRY',          -- Rivalité sportive/artistique
    'PARTNERSHIP',      -- Partenariat commercial
    'AFFILIATION',      -- Affiliation (ligue, fédération)
    'SUBSIDIARY',       -- Filiale/équipe réserve
    'COLLABORATION',    -- Collaboration artistique
    'MERGER',           -- Fusion d'entités
    'HISTORIC',         -- Relation historique passée
    'SPONSORSHIP'       -- Relation sponsor/sponsorisé
);
```

### Types de restrictions
```sql
CREATE TYPE restriction_type AS ENUM (
    'AGE',              -- Restriction d'âge
    'GROUP',            -- Appartenance à un groupe
    'ROLE',             -- Rôle utilisateur requis
    'GEOGRAPHIC',       -- Zone géographique
    'CAPACITY',         -- Capacité limitée
    'GENDER',           -- Genre spécifique
    'MEMBERSHIP',       -- Adhésion requise
    'INVITATION',       -- Sur invitation uniquement
    'DRESS_CODE',       -- Code vestimentaire
    'HEALTH'            -- Conditions de santé
);
```

### Types de médias événements
```sql
CREATE TYPE event_media_type AS ENUM (
    'POSTER',           -- Affiche officielle
    'TEASER',           -- Video teaser  
    'PHOTO',            -- Photo événement
    'VIDEO',            -- Video complète
    'DOCUMENT',         -- Document (programme, règlement)
    'AUDIO',            -- Fichier audio
    'BANNER',           -- Bannière web
    'SOCIAL_MEDIA',     -- Contenu réseaux sociaux
    'PRESS_KIT',        -- Kit presse
    'LIVE_STREAM'       -- Lien streaming direct
);
```

---

## 🔄 RELATIONS ET LOGIQUE MÉTIER

### Flux de création d'un événement sportif

1. **Sélection ou création des participants**
   - Vérifier si les équipes existent dans `participants`
   - Créer si nécessaire avec toutes les infos

2. **Création de l'événement**
   - Choisir la catégorie (FOOTBALL_MATCH)
   - Assigner au groupe (LIGUE1_2024_2025)
   - Définir venue et mapping
   - Configurer dates et horaires

3. **Liaison des participants**
   - Créer les entrées dans `event_participants`
   - Définir les rôles (HOST/GUEST)
   - Ajouter les métadonnées spécifiques

4. **Configuration des restrictions**
   - Âge minimum pour certains matchs
   - Zones réservées supporters adverses
   - Conditions spéciales (derby)

5. **Ajout des médias**
   - Affiche officielle
   - Vidéos promotionnelles
   - Documents d'information

### Gestion des relations

- Les rivalités sont définies une fois et réutilisées
- Permet d'identifier automatiquement les "derbies"
- Influence sur la sécurité et la billetterie
- Historique complet des confrontations

### Évolution des statuts

```
DRAFT → SCHEDULED → CONFIRMED → ON_SALE → LIVE → COMPLETED
                ↓              ↓
            CANCELLED      POSTPONED
```

### Calculs et agrégations

- Nombre total d'événements dans un groupe
- Statistiques cumulées par participant
- Taux de remplissage par type d'événement
- Revenus par saison/groupe

---

**Ce module événements offre une flexibilité maximale pour gérer tous types d'événements sportifs et culturels avec un système de participants réutilisables et des métadonnées riches pour chaque cas d'usage spécifique.**