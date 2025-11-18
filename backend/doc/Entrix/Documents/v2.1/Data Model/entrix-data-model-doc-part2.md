# Documentation Exhaustive du Modèle de Données Entrix V2.1
## Partie 2 : Module Participants, Événements et Venues

---

## 📋 Table des Matières - Partie 2

1. [Module Participants](#module-participants)
2. [Module Événements](#module-evenements)
3. [Module Venues et Cartographie](#module-venues)
4. [Relations complexes inter-modules](#relations-complexes)

---

## 🎭 Module Participants {#module-participants}

### Table `participants` - Participants aux événements

**Description** : Entités qui PARTICIPENT aux événements (équipes sportives, artistes, conférenciers, arbitres). À ne pas confondre avec les organisateurs qui ORGANISENT.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | - | Code participant unique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom officiel |
| `display_name` | VARCHAR(200) | NULL | - | Nom d'affichage public |
| `type` | ENUM | NOT NULL | - | Type de participant |
| `category` | VARCHAR(100) | NULL | - | Catégorie sportive/artistique |
| `founded_date` | DATE | NULL | - | Date de création |
| `home_venue_id` | VARCHAR(255) | NULL, FK | - | Venue domicile |
| `logo_url` | TEXT | NULL | - | Logo/photo officiel |
| `primary_color` | VARCHAR(7) | NULL | - | Couleur principale (#HEX) |
| `secondary_color` | VARCHAR(7) | NULL | - | Couleur secondaire (#HEX) |
| `country` | VARCHAR(2) | DEFAULT 'TN' | 'TN' | Pays d'origine ISO |
| `city` | VARCHAR(100) | NULL | - | Ville d'origine |
| `website` | VARCHAR(255) | NULL | - | Site web officiel |
| `social_media` | JSONB | NULL | - | Réseaux sociaux |
| `contact_info` | JSONB | NULL | - | Informations contact |
| `statistics` | JSONB | NULL | - | Statistiques participant |
| `metadata` | JSONB | NULL | - | Métadonnées flexibles |
| `photo_url` | TEXT | NULL | - | Photo principale |
| `biography` | TEXT | NULL | - | Biographie/description |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Participant actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `type`

- `SPORTS_TEAM` : Équipe sportive
- `ARTIST` : Artiste solo
- `BAND` : Groupe musical
- `SPEAKER` : Conférencier
- `REFEREE` : Arbitre/officiel
- `PERFORMER` : Performeur/danseur
- `COMPETITOR` : Compétiteur individuel
- `ORGANIZATION` : Organisation participante

#### Structure JSONB `social_media`

```json
{
  "facebook": "https://facebook.com/clubafricain",
  "twitter": "@ClubAfricain",
  "instagram": "clubafricainoff",
  "youtube": "UCxxxxxxxxxxxxx",
  "tiktok": "@clubafricain",
  "linkedin": "club-africain-tunisie",
  "followers": {
    "facebook": 1250000,
    "twitter": 450000,
    "instagram": 380000,
    "total": 2080000,
    "last_updated": "2025-01-01"
  }
}
```

#### Structure JSONB `statistics`

```json
{
  "sports": {
    "championships": 13,
    "cups": 8,
    "current_ranking": 2,
    "league": "Ligue 1 Pro",
    "founded_titles": {
      "league": [1947, 1948, 1964, 1967, 1973, 1974, 1979, 1980, 1988, 1990, 1992, 1996, 2008],
      "cup": [1965, 1967, 1968, 1969, 1970, 1972, 1976, 1998]
    },
    "stadium_capacity": 60000,
    "average_attendance": 25000,
    "season_stats": {
      "2024-2025": {
        "played": 15,
        "won": 9,
        "drawn": 4,
        "lost": 2,
        "goals_for": 28,
        "goals_against": 12
      }
    }
  },
  "performances": {
    "total_events": 342,
    "win_rate": 0.58,
    "home_win_rate": 0.72,
    "away_win_rate": 0.44
  }
}
```

#### Exemple de record complet - Équipe sportive

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "code": "PART_CA_001",
  "name": "Club Africain",
  "display_name": "النادي الإفريقي",
  "type": "SPORTS_TEAM",
  "category": "Football",
  "founded_date": "1920-10-04",
  "home_venue_id": "venue_stade_olympique_rades",
  "logo_url": "https://cdn.entrix.tn/teams/club_africain_logo.png",
  "primary_color": "#ED1C24",
  "secondary_color": "#FFFFFF",
  "country": "TN",
  "city": "Tunis",
  "website": "https://www.clubafricain.tn",
  "social_media": {
    "facebook": "https://facebook.com/clubafricain",
    "twitter": "@ClubAfricain",
    "instagram": "clubafricainoff",
    "followers": {
      "total": 2080000
    }
  },
  "contact_info": {
    "manager": {
      "name": "Mohamed Ben Salah",
      "phone": "+21698765432",
      "email": "manager@clubafricain.tn"
    },
    "press": {
      "email": "press@clubafricain.tn",
      "phone": "+21671234567"
    }
  },
  "statistics": {
    "sports": {
      "championships": 13,
      "cups": 8,
      "current_ranking": 2
    }
  },
  "metadata": {
    "nicknames": ["Bab Jedid", "Club Africain"],
    "rivals": ["Esperance Tunis", "CS Sfaxien"],
    "ultras": ["Winners", "Armada"],
    "anthem": "Ya Club Africain"
  },
  "photo_url": "https://cdn.entrix.tn/teams/ca_team_2025.jpg",
  "biography": "Le Club Africain est un club omnisports tunisien fondé le 4 octobre 1920...",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+01:00",
  "updated_at": "2025-01-07T11:00:00+01:00"
}
```

#### Exemple de record complet - Artiste

```json
{
  "id": "234e5678-f89c-23d4-b567-537725285111",
  "code": "PART_ARTIST_LTF_001",
  "name": "Lotfi Bouchnak",
  "display_name": "لطفي بوشناق",
  "type": "ARTIST",
  "category": "Musique Arabe",
  "founded_date": "1952-01-18",
  "home_venue_id": null,
  "logo_url": "https://cdn.entrix.tn/artists/lotfi_bouchnak.jpg",
  "primary_color": null,
  "secondary_color": null,
  "country": "TN",
  "city": "Tunis",
  "website": "https://www.lotfibouchnak.com",
  "social_media": {
    "facebook": "https://facebook.com/lotfibouchnakofficial",
    "instagram": "lotfibouchnak",
    "youtube": "UCxxxxxxxxxx",
    "followers": {
      "total": 850000
    }
  },
  "contact_info": {
    "management": {
      "agency": "Star Productions",
      "email": "booking@starproductions.tn",
      "phone": "+21670123456"
    }
  },
  "statistics": {
    "performances": {
      "total_concerts": 1250,
      "countries_performed": 45,
      "albums_released": 23,
      "awards": 15
    }
  },
  "metadata": {
    "genres": ["Tarab", "Malouf", "Musique Arabe Classique"],
    "instruments": ["Oud", "Vocals"],
    "notable_songs": ["Mahla Layali", "Ya Msafer", "Hobbak Nar"],
    "collaborations": ["Marcel Khalife", "Cheb Khaled", "Majida El Roumi"]
  },
  "photo_url": "https://cdn.entrix.tn/artists/lotfi_bouchnak_portrait.jpg",
  "biography": "Lotfi Bouchnak, né le 18 janvier 1952 à Tunis, est un chanteur et oudiste tunisien...",
  "is_active": true,
  "created_at": "2024-01-15T14:00:00+01:00",
  "updated_at": "2024-12-20T16:30:00+01:00"
}
```

### Table `participant_staff` - Personnel des participants

**Description** : Membres individuels des participants (joueurs, musiciens, staff technique).

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `participant_id` | UUID | NOT NULL, FK | - | Participant parent |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | - | Code unique membre |
| `first_name` | VARCHAR(100) | NOT NULL | - | Prénom |
| `last_name` | VARCHAR(100) | NOT NULL | - | Nom |
| `display_name` | VARCHAR(200) | NULL | - | Nom d'affichage |
| `role` | VARCHAR(100) | NOT NULL | - | Rôle dans l'équipe |
| `jersey_number` | INTEGER | NULL | - | Numéro maillot |
| `position` | VARCHAR(50) | NULL | - | Position/poste |
| `date_of_birth` | DATE | NULL | - | Date naissance |
| `nationality` | VARCHAR(2) | NULL | - | Nationalité ISO |
| `joined_date` | DATE | NULL | - | Date d'arrivée |
| `contract_until` | DATE | NULL | - | Fin de contrat |
| `photo_url` | TEXT | NULL | - | Photo officielle |
| `biography` | TEXT | NULL | - | Biographie courte |
| `social_media` | JSONB | NULL | - | Réseaux sociaux |
| `statistics` | JSONB | NULL | - | Stats individuelles |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Membre actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Exemple de record complet

```json
{
  "id": "345e6789-g89d-34e5-c678-648836396222",
  "participant_id": "123e4567-e89b-12d3-a456-426614174000",
  "code": "STAFF_CA_MSK_10",
  "first_name": "Youssef",
  "last_name": "Msakni",
  "display_name": "Youssef Msakni",
  "role": "PLAYER",
  "jersey_number": 10,
  "position": "Attaquant",
  "date_of_birth": "1990-10-28",
  "nationality": "TN",
  "joined_date": "2022-07-01",
  "contract_until": "2025-06-30",
  "photo_url": "https://cdn.entrix.tn/players/ca/msakni_10.jpg",
  "biography": "Capitaine emblématique du Club Africain et de l'équipe nationale...",
  "social_media": {
    "instagram": "youssefmsakni",
    "facebook": "YMsakniOfficial",
    "followers": 450000
  },
  "statistics": {
    "career": {
      "total_matches": 312,
      "total_goals": 98,
      "total_assists": 67,
      "trophies": 8
    },
    "current_season": {
      "matches": 15,
      "goals": 7,
      "assists": 5,
      "yellow_cards": 2,
      "red_cards": 0
    }
  },
  "metadata": {
    "market_value": 1500000,
    "currency": "EUR",
    "preferred_foot": "right",
    "height_cm": 179,
    "weight_kg": 75,
    "previous_clubs": ["Esperance Tunis", "Al-Duhail", "Al-Arabi"]
  },
  "is_active": true,
  "created_at": "2022-07-01T12:00:00+01:00",
  "updated_at": "2025-01-07T11:30:00+01:00"
}
```

### Table `participant_relationships` - Relations entre participants

**Description** : Définit les relations entre participants (rivalités, partenariats, affiliations).

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `participant_a_id` | UUID | NOT NULL, FK | - | Premier participant |
| `participant_b_id` | UUID | NOT NULL, FK | - | Second participant |
| `relationship_type` | ENUM | NOT NULL | - | Type de relation |
| `intensity` | INTEGER | NOT NULL | 5 | Intensité (1-10) |
| `is_mutual` | BOOLEAN | NOT NULL | TRUE | Relation mutuelle |
| `start_date` | DATE | NOT NULL | CURRENT_DATE | Début relation |
| `end_date` | DATE | NULL | - | Fin relation |
| `description` | TEXT | NULL | - | Description relation |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Relation active |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `relationship_type`

- `RIVALRY` : Rivalité sportive/artistique
- `PARTNERSHIP` : Partenariat commercial
- `AFFILIATION` : Affiliation (club formation)
- `SUBSIDIARY` : Filiale/équipe réserve
- `COLLABORATION` : Collaboration artistique
- `HISTORICAL` : Lien historique

#### Exemple de record complet

```json
{
  "id": "456e789a-h90e-45f6-d789-759947407333",
  "participant_a_id": "123e4567-e89b-12d3-a456-426614174000",
  "participant_b_id": "456f789a-bc12-34d5-e678-901234567890",
  "relationship_type": "RIVALRY",
  "intensity": 10,
  "is_mutual": true,
  "start_date": "1920-10-04",
  "end_date": null,
  "description": "Derby de Tunis - Rivalité historique entre Club Africain et Espérance Sportive de Tunis",
  "metadata": {
    "derby_name": "Derby de la Capitale",
    "total_matches": 234,
    "statistics": {
      "ca_wins": 78,
      "est_wins": 92,
      "draws": 64
    },
    "memorable_matches": [
      {
        "date": "2006-05-14",
        "score": "CA 4-2 EST",
        "competition": "Championnat",
        "attendance": 55000
      }
    ],
    "incidents": 12,
    "security_level": "maximum"
  },
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+01:00",
  "updated_at": "2025-01-07T12:00:00+01:00"
}
```

---

## 📅 Module Événements {#module-evenements}

### Table `event_categories` - Catégories d'événements

**Description** : Types d'événements disponibles avec configuration par défaut et règles métier.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | - | Code catégorie |
| `name` | VARCHAR(200) | NOT NULL | - | Nom catégorie |
| `description` | TEXT | NULL | - | Description détaillée |
| `parent_category_id` | UUID | NULL, FK | - | Catégorie parente |
| `default_duration` | INTEGER | NULL | - | Durée par défaut (min) |
| `default_capacity` | INTEGER | NULL | - | Capacité par défaut |
| `requires_referee` | BOOLEAN | NOT NULL | FALSE | Arbitre requis |
| `allows_draw` | BOOLEAN | NOT NULL | FALSE | Match nul possible |
| `has_overtime` | BOOLEAN | NOT NULL | FALSE | Prolongations possibles |
| `has_penalties` | BOOLEAN | NOT NULL | FALSE | Tirs au but possibles |
| `icon_url` | TEXT | NULL | - | Icône catégorie |
| `color_primary` | VARCHAR(7) | NULL | - | Couleur principale |
| `color_secondary` | VARCHAR(7) | NULL | - | Couleur secondaire |
| `default_ticket_price` | DECIMAL(10,2) | NULL | - | Prix billet défaut |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise par défaut |
| `rules` | JSONB | NULL | - | Règles spécifiques |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Catégorie active |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Structure JSONB `rules`

```json
{
  "timing": {
    "periods": 2,
    "period_duration": 45,
    "half_time_duration": 15,
    "extra_time_periods": 2,
    "extra_time_duration": 15
  },
  "participants": {
    "min_players": 11,
    "max_players": 11,
    "substitutions": 3,
    "substitution_windows": 3
  },
  "scoring": {
    "points_for_win": 3,
    "points_for_draw": 1,
    "points_for_loss": 0
  },
  "cards": {
    "yellow_before_red": 2,
    "suspension_after_yellows": 5
  }
}
```

#### Exemple de record complet

```json
{
  "id": "567e89ab-i01f-56g7-e890-860958518444",
  "code": "SPORT_FOOTBALL_PRO",
  "name": "Football Professionnel",
  "description": "Matchs de football professionnel - Ligue 1, Coupe, etc.",
  "parent_category_id": null,
  "default_duration": 105,
  "default_capacity": 40000,
  "requires_referee": true,
  "allows_draw": true,
  "has_overtime": true,
  "has_penalties": true,
  "icon_url": "https://cdn.entrix.tn/icons/football.svg",
  "color_primary": "#2E7D32",
  "color_secondary": "#FFFFFF",
  "default_ticket_price": 15.00,
  "currency": "TND",
  "rules": {
    "timing": {
      "periods": 2,
      "period_duration": 45,
      "half_time_duration": 15
    },
    "participants": {
      "min_players": 11,
      "max_players": 11,
      "substitutions": 5
    }
  },
  "metadata": {
    "popularity_score": 95,
    "season_type": "annual",
    "governing_body": "FTF",
    "var_enabled": true
  },
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+01:00",
  "updated_at": "2024-06-15T14:30:00+01:00"
}
```

### Table `event_groups` - Groupes d'événements

**Description** : Regroupe des événements liés (saisons, tournois, festivals) pour gestion collective.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | - | Code groupe unique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom du groupe |
| `description` | TEXT | NULL | - | Description détaillée |
| `parent_group_id` | UUID | NULL, FK | - | Groupe parent |
| `type` | ENUM | NOT NULL | - | Type de groupe |
| `season` | VARCHAR(20) | NULL | - | Saison (2024-2025) |
| `start_date` | DATE | NOT NULL | - | Date début |
| `end_date` | DATE | NOT NULL | - | Date fin |
| `max_events` | INTEGER | NULL | - | Nombre max événements |
| `current_events` | INTEGER | NOT NULL | 0 | Événements actuels |
| `completed_events` | INTEGER | NOT NULL | 0 | Événements terminés |
| `logo_url` | TEXT | NULL | - | Logo du groupe |
| `sponsor_info` | JSONB | NULL | - | Infos sponsors |
| `prize_info` | JSONB | NULL | - | Infos prix/récompenses |
| `rules` | JSONB | NULL | - | Règlement spécifique |
| `statistics` | JSONB | NULL | - | Statistiques groupe |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Groupe actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `type`

- `CHAMPIONSHIP` : Championnat
- `CUP` : Coupe/tournoi éliminatoire
- `TOURNAMENT` : Tournoi
- `FESTIVAL` : Festival multi-événements
- `SEASON` : Saison complète
- `SERIES` : Série de concerts/spectacles
- `CONFERENCE` : Cycle de conférences

#### Structure JSONB `prize_info`

```json
{
  "total_prize_pool": 1000000,
  "currency": "TND",
  "distribution": {
    "winner": 500000,
    "runner_up": 250000,
    "third_place": 150000,
    "participation": 10000
  },
  "trophies": {
    "championship_trophy": true,
    "top_scorer": true,
    "best_player": true,
    "fair_play": true
  }
}
```

#### Exemple de record complet

```json
{
  "id": "678e90bc-j12g-67h8-f901-971069629555",
  "code": "LIGUE1_2024_2025",
  "name": "Ligue 1 Professionnelle 2024-2025",
  "description": "Championnat de première division de football tunisien",
  "parent_group_id": null,
  "type": "CHAMPIONSHIP",
  "season": "2024-2025",
  "start_date": "2024-08-15",
  "end_date": "2025-05-31",
  "max_events": 240,
  "current_events": 120,
  "completed_events": 108,
  "logo_url": "https://cdn.entrix.tn/competitions/ligue1_logo.png",
  "sponsor_info": {
    "title_sponsor": {
      "name": "Ooredoo",
      "logo": "https://cdn.entrix.tn/sponsors/ooredoo.png",
      "amount": 2000000,
      "currency": "TND"
    },
    "official_partners": [
      {
        "name": "Coca-Cola",
        "category": "Boissons officielles"
      }
    ]
  },
  "prize_info": {
    "total_prize_pool": 1000000,
    "currency": "TND",
    "distribution": {
      "winner": 500000,
      "runner_up": 250000
    }
  },
  "rules": {
    "format": "round_robin",
    "home_away": true,
    "points_system": {
      "win": 3,
      "draw": 1,
      "loss": 0
    },
    "relegation_spots": 2,
    "promotion_spots": 2,
    "continental_qualification": {
      "champions_league": 1,
      "confederation_cup": 2
    }
  },
  "statistics": {
    "total_goals": 245,
    "average_goals_per_match": 2.27,
    "total_attendance": 890000,
    "average_attendance": 8240,
    "top_scorer": {
      "player_id": "xxx-xxx-xxx",
      "name": "Ahmed Ben Youssef",
      "goals": 14
    }
  },
  "metadata": {
    "broadcasting_rights": "Watania TV",
    "official_ball": "Nike Flight",
    "var_introduced": true
  },
  "is_active": true,
  "created_at": "2024-07-01T10:00:00+01:00",
  "updated_at": "2025-01-07T12:30:00+01:00"
}
```

### Table `events` - Événements

**Description** : Table centrale des événements individuels avec toutes leurs caractéristiques.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | - | Code événement unique |
| `name` | VARCHAR(300) | NOT NULL | - | Nom de l'événement |
| `description` | TEXT | NULL | - | Description détaillée |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur principal |
| `event_group_id` | UUID | NULL, FK | - | Groupe d'appartenance |
| `category_id` | UUID | NOT NULL, FK | - | Catégorie événement |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | Lieu de l'événement |
| `venue_mapping_id` | VARCHAR(255) | NULL, FK | - | Configuration venue |
| `scheduled_start` | TIMESTAMPTZ | NOT NULL | - | Début prévu |
| `scheduled_end` | TIMESTAMPTZ | NULL | - | Fin prévue |
| `actual_start` | TIMESTAMPTZ | NULL | - | Début réel |
| `actual_end` | TIMESTAMPTZ | NULL | - | Fin réelle |
| `doors_open` | TIMESTAMPTZ | NULL | - | Ouverture portes |
| `status` | ENUM | NOT NULL | 'DRAFT' | Statut événement |
| `visibility` | ENUM | NOT NULL | 'PRIVATE' | Visibilité publique |
| `capacity` | INTEGER | NULL | - | Capacité totale |
| `expected_attendance` | INTEGER | NULL | - | Affluence prévue |
| `actual_attendance` | INTEGER | NULL | - | Affluence réelle |
| `min_age` | INTEGER | NULL | - | Âge minimum |
| `max_tickets_per_user` | INTEGER | DEFAULT 10 | 10 | Max billets/personne |
| `allow_transfers` | BOOLEAN | DEFAULT TRUE | TRUE | Transferts autorisés |
| `allow_refunds` | BOOLEAN | DEFAULT TRUE | TRUE | Remboursements autorisés |
| `refund_deadline` | TIMESTAMPTZ | NULL | - | Date limite remboursement |
| `media_urls` | TEXT[] | NULL | - | URLs médias |
| `tags` | TEXT[] | NULL | - | Tags recherche |
| `importance_level` | INTEGER | DEFAULT 5 | 5 | Niveau importance (1-10) |
| `pricing_config` | JSONB | NULL | - | Configuration tarifaire |
| `restrictions` | JSONB | NULL | - | Restrictions événement |
| `metadata` | JSONB | NULL | - | Métadonnées flexibles |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `status`

- `DRAFT` : Brouillon
- `PUBLISHED` : Publié (vente ouverte)
- `SOLD_OUT` : Complet
- `ONGOING` : En cours
- `COMPLETED` : Terminé
- `CANCELLED` : Annulé
- `POSTPONED` : Reporté

#### Valeurs ENUM `visibility`

- `PRIVATE` : Privé (sur invitation)
- `PUBLIC` : Public
- `MEMBERS_ONLY` : Membres seulement
- `RESTRICTED` : Accès restreint

#### Structure JSONB `pricing_config`

```json
{
  "base_prices": {
    "VIP": 150.00,
    "TRIBUNE_A": 50.00,
    "TRIBUNE_B": 30.00,
    "TRIBUNE_C": 15.00
  },
  "currency": "TND",
  "dynamic_pricing": {
    "enabled": true,
    "min_multiplier": 0.8,
    "max_multiplier": 2.0,
    "factors": ["demand", "time_to_event", "opponent_ranking"]
  },
  "early_bird": {
    "enabled": true,
    "discount_percentage": 20,
    "valid_until": "2025-01-15T00:00:00Z"
  },
  "group_discounts": {
    "10_plus": 10,
    "20_plus": 15,
    "50_plus": 20
  }
}
```

#### Structure JSONB `restrictions`

```json
{
  "age": {
    "minimum": 16,
    "adult_required_under": 18
  },
  "dress_code": "smart_casual",
  "prohibited_items": [
    "weapons",
    "pyrotechnics", 
    "laser_pointers",
    "professional_cameras"
  ],
  "special_requirements": {
    "id_required": true,
    "vaccination_proof": false,
    "membership_required": false
  },
  "accessibility": {
    "wheelchair_accessible": true,
    "audio_description": false,
    "sign_language": false
  }
}
```

#### Exemple de record complet

```json
{
  "id": "789e01cd-k23h-78i9-g012-082170730666",
  "code": "EVT_2025_CA_EST_DERBY",
  "name": "Derby Club Africain vs Espérance - Ligue 1",
  "description": "Match phare de la 15ème journée du championnat opposant les deux rivaux de la capitale",
  "organizer_id": "d7e6f5g4-c3b2-1a0f-9e8d-7c6b5a4c3d2e",
  "event_group_id": "678e90bc-j12g-67h8-f901-971069629555",
  "category_id": "567e89ab-i01f-56g7-e890-860958518444",
  "venue_id": "venue_stade_olympique_rades",
  "venue_mapping_id": "mapping_rades_football_60k",
  "scheduled_start": "2025-02-15T20:00:00+01:00",
  "scheduled_end": "2025-02-15T22:00:00+01:00",
  "actual_start": null,
  "actual_end": null,
  "doors_open": "2025-02-15T17:00:00+01:00",
  "status": "PUBLISHED",
  "visibility": "PUBLIC",
  "capacity": 60000,
  "expected_attendance": 55000,
  "actual_attendance": null,
  "min_age": 16,
  "max_tickets_per_user": 4,
  "allow_transfers": true,
  "allow_refunds": true,
  "refund_deadline": "2025-02-14T20:00:00+01:00",
  "media_urls": [
    "https://cdn.entrix.tn/events/2025/derby_ca_est_poster.jpg",
    "https://cdn.entrix.tn/events/2025/derby_ca_est_teaser.mp4"
  ],
  "tags": ["derby", "football", "ligue1", "big_match", "rivalry"],
  "importance_level": 10,
  "pricing_config": {
    "base_prices": {
      "VIP": 200.00,
      "TRIBUNE_HONNEUR": 100.00,
      "TRIBUNE_A": 50.00,
      "TRIBUNE_B": 30.00,
      "VIRAGE": 15.00
    },
    "currency": "TND",
    "dynamic_pricing": {
      "enabled": true,
      "current_multiplier": 1.5
    }
  },
  "restrictions": {
    "age": {
      "minimum": 16
    },
    "prohibited_items": [
      "pyrotechnics",
      "laser_pointers"
    ],
    "special_requirements": {
      "id_required": true
    }
  },
  "metadata": {
    "rivalry_stats": {
      "total_derbies": 234,
      "ca_wins": 78,
      "est_wins": 92
    },
    "security_level": "maximum",
    "police_presence": 1500,
    "broadcasting": {
      "tv": ["Watania 1", "BeIN Sports"],
      "radio": ["Radio Nationale", "Mosaique FM"]
    }
  },
  "created_at": "2024-12-01T10:00:00+01:00",
  "updated_at": "2025-01-07T13:00:00+01:00"
}
```

---

## 🏟️ Module Venues et Cartographie {#module-venues}

### Table `venues` - Lieux physiques

**Description** : Lieux physiques où se déroulent les événements (stades, salles, théâtres).

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | VARCHAR(255) | PRIMARY KEY | - | ID unique slug |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | - | Code venue |
| `name` | VARCHAR(200) | NOT NULL | - | Nom officiel |
| `display_name` | VARCHAR(200) | NULL | - | Nom d'affichage |
| `type` | ENUM | NOT NULL | - | Type de lieu |
| `description` | TEXT | NULL | - | Description détaillée |
| `address` | TEXT | NOT NULL | - | Adresse complète |
| `city` | VARCHAR(100) | NOT NULL | - | Ville |
| `postal_code` | VARCHAR(20) | NULL | - | Code postal |
| `country` | VARCHAR(2) | DEFAULT 'TN' | 'TN' | Code pays ISO |
| `coordinates` | JSONB | NULL | - | Coordonnées GPS |
| `capacity_min` | INTEGER | NOT NULL | - | Capacité minimale |
| `capacity_max` | INTEGER | NOT NULL | - | Capacité maximale |
| `owner_name` | VARCHAR(200) | NULL | - | Propriétaire |
| `owner_contact` | JSONB | NULL | - | Contact propriétaire |
| `primary_manager_id` | UUID | NULL, FK | - | Gestionnaire principal |
| `facilities` | JSONB | NULL | - | Installations disponibles |
| `accessibility` | JSONB | NULL | - | Infos accessibilité |
| `parking_info` | JSONB | NULL | - | Infos stationnement |
| `public_transport` | JSONB | NULL | - | Transports en commun |
| `media_urls` | TEXT[] | NULL | - | Photos/vidéos |
| `website` | VARCHAR(255) | NULL | - | Site web |
| `phone` | VARCHAR(20) | NULL | - | Téléphone |
| `email` | VARCHAR(255) | NULL | - | Email contact |
| `operating_hours` | JSONB | NULL | - | Horaires ouverture |
| `rules` | JSONB | NULL | - | Règlement intérieur |
| `certifications` | JSONB | NULL | - | Certifications sécurité |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Lieu actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `type`

- `STADIUM` : Stade
- `ARENA` : Salle omnisports
- `THEATER` : Théâtre
- `CONCERT_HALL` : Salle de concert
- `CONFERENCE_CENTER` : Centre de conférence
- `EXHIBITION_HALL` : Hall d'exposition
- `OUTDOOR` : Espace extérieur
- `MULTIPURPOSE` : Espace polyvalent

#### Structure JSONB `coordinates`

```json
{
  "latitude": 36.748573,
  "longitude": 10.275960,
  "altitude": 15,
  "precision": "exact",
  "what3words": "///exemple.adresse.unique"
}
```

#### Structure JSONB `facilities`

```json
{
  "seating": {
    "vip_boxes": 50,
    "press_seats": 200,
    "wheelchair_spaces": 150,
    "family_sections": true
  },
  "catering": {
    "restaurants": 2,
    "bars": 15,
    "kiosks": 30,
    "vip_catering": true
  },
  "technology": {
    "screens": 4,
    "screen_size": "200m²",
    "sound_system": "Meyer Sound",
    "wifi": true,
    "5g_coverage": true
  },
  "amenities": {
    "restrooms": 80,
    "prayer_rooms": 4,
    "first_aid_stations": 6,
    "baby_changing": 10
  }
}
```

#### Exemple de record complet

```json
{
  "id": "venue_stade_olympique_rades",
  "code": "VENUE_RADES_001",
  "name": "Stade Olympique de Radès",
  "display_name": "Stade Olympique Hammadi Agrebi",
  "type": "STADIUM",
  "description": "Plus grand stade de Tunisie, inauguré en 2001, accueille les matchs de l'équipe nationale et les grands événements",
  "address": "Route de La Marsa, Radès",
  "city": "Radès",
  "postal_code": "2040",
  "country": "TN",
  "coordinates": {
    "latitude": 36.748573,
    "longitude": 10.275960
  },
  "capacity_min": 20000,
  "capacity_max": 60000,
  "owner_name": "Ministère de la Jeunesse et des Sports",
  "owner_contact": {
    "phone": "+21671123456",
    "email": "contact@mjs.tn"
  },
  "primary_manager_id": "xxx-xxx-xxx",
  "facilities": {
    "seating": {
      "vip_boxes": 50,
      "press_seats": 200,
      "wheelchair_spaces": 150
    },
    "catering": {
      "restaurants": 2,
      "bars": 15,
      "kiosks": 30
    },
    "technology": {
      "screens": 4,
      "wifi": true
    }
  },
  "accessibility": {
    "wheelchair_access": true,
    "elevator_count": 8,
    "accessible_entrances": 4,
    "accessible_restrooms": 20,
    "audio_assistance": true,
    "braille_signage": true
  },
  "parking_info": {
    "total_spaces": 5000,
    "vip_spaces": 200,
    "disabled_spaces": 100,
    "bus_parking": 50,
    "pricing": {
      "car": 5.00,
      "bus": 20.00,
      "currency": "TND"
    }
  },
  "public_transport": {
    "metro": {
      "line": "Ligne 6",
      "station": "Radès",
      "distance_meters": 800
    },
    "bus_lines": ["32", "35", "532"],
    "taxi_stand": true
  },
  "media_urls": [
    "https://cdn.entrix.tn/venues/rades/exterior.jpg",
    "https://cdn.entrix.tn/venues/rades/interior.jpg",
    "https://cdn.entrix.tn/venues/rades/aerial.jpg"
  ],
  "website": "https://www.stadeolympique.tn",
  "phone": "+21671456789",
  "email": "info@stadeolympique.tn",
  "operating_hours": {
    "events": "variable",
    "visits": {
      "monday_friday": "09:00-17:00",
      "saturday": "10:00-14:00",
      "sunday": "closed"
    }
  },
  "rules": {
    "prohibited_items": [
      "weapons",
      "pyrotechnics",
      "glass_bottles",
      "laser_pointers"
    ],
    "bag_policy": "max_30x30x15cm",
    "smoking": "designated_areas_only"
  },
  "certifications": {
    "fifa_approved": true,
    "safety_certificate": {
      "number": "SEC2024/001",
      "valid_until": "2026-12-31"
    }
  },
  "metadata": {
    "inauguration_date": "2001-07-07",
    "architect": "Olivier-Clément Cacoub",
    "construction_cost": 170000000,
    "renovations": [
      {
        "year": 2019,
        "description": "Installation nouveau gazon hybride"
      }
    ],
    "records": {
      "highest_attendance": 60000,
      "event": "CAN 2004 Final"
    }
  },
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+01:00",
  "updated_at": "2025-01-07T14:00:00+01:00"
}
```

### Table `venue_mappings` - Configurations de venues

**Description** : Différentes configurations possibles d'un même venue selon le type d'événement.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | VARCHAR(255) | PRIMARY KEY | - | ID unique mapping |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | Venue parent |
| `code` | VARCHAR(100) | NOT NULL | - | Code configuration |
| `name` | VARCHAR(200) | NOT NULL | - | Nom configuration |
| `description` | TEXT | NULL | - | Description usage |
| `capacity` | INTEGER | NOT NULL | - | Capacité cette config |
| `event_types` | TEXT[] | NULL | - | Types événements compatibles |
| `layout_image_url` | TEXT | NULL | - | Plan configuration |
| `configuration` | JSONB | NULL | - | Détails configuration |
| `is_default` | BOOLEAN | DEFAULT FALSE | FALSE | Config par défaut |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Config active |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Exemple de record complet

```json
{
  "id": "mapping_rades_football_60k",
  "venue_id": "venue_stade_olympique_rades",
  "code": "FOOTBALL_FULL",
  "name": "Configuration Football - Capacité maximale",
  "description": "Configuration complète pour matchs de football avec toutes les tribunes ouvertes",
  "capacity": 60000,
  "event_types": ["SPORT_FOOTBALL_PRO", "SPORT_FOOTBALL_INTL"],
  "layout_image_url": "https://cdn.entrix.tn/venues/rades/layout_football_60k.svg",
  "configuration": {
    "sections_enabled": ["VIP", "TRIBUNE_HONNEUR", "TRIBUNE_A", "TRIBUNE_B", "VIRAGE_NORD", "VIRAGE_SUD"],
    "field_setup": {
      "type": "football",
      "dimensions": {
        "length": 105,
        "width": 68
      }
    },
    "security_zones": {
      "buffer_zones": true,
      "visitor_section": "TRIBUNE_B_VISITOR",
      "capacity_visitor": 5000
    }
  },
  "is_default": true,
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+01:00",
  "updated_at": "2024-11-20T16:00:00+01:00"
}
```