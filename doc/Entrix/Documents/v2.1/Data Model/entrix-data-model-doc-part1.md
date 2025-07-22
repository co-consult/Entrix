# Documentation Exhaustive du Modèle de Données Entrix V2.1
## Partie 1 : Module Utilisateurs et Organisateurs

---

## 📋 Table des Matières - Partie 1

1. [Vue d'ensemble du modèle](#vue-densemble)
2. [Module Utilisateurs et Authentification](#module-utilisateurs)
3. [Module Organisateurs](#module-organisateurs)
4. [Relations et Hiérarchies](#relations-hierarchies)

---

## 🔍 Vue d'ensemble du modèle {#vue-densemble}

### Architecture globale

Le modèle de données Entrix est structuré en 6 modules principaux interconnectés :

1. **Module Utilisateurs & Groupes** : Gestion des comptes, profils, rôles et permissions
2. **Module Organisateurs** : Entités qui organisent et gèrent les événements
3. **Module Participants & Événements** : Acteurs qui participent aux événements
4. **Module Venues & Cartographie** : Lieux physiques et leur configuration
5. **Module Billetterie & Accès** : Billets, abonnements et contrôle d'accès
6. **Module Paiements & Facturation** : Transactions financières et commissions
7. **Module Sécurité & Audit** : Traçabilité et sécurité système

### Principes de conception

- **UUID comme clés primaires** : Identifiants uniques universels pour toutes les tables
- **Soft delete** : Suppression logique avec champs `is_active` ou statuts
- **Timestamps automatiques** : `created_at` et `updated_at` sur toutes les tables
- **Champs JSONB** : Flexibilité pour métadonnées et configurations dynamiques
- **Enums typés** : Valeurs contraintes pour les statuts et types

---

## 👥 Module Utilisateurs et Authentification {#module-utilisateurs}

### Table `users` - Utilisateurs de base

**Description** : Table centrale stockant les informations d'authentification et d'identification de tous les utilisateurs du système.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | `gen_random_uuid()` | Identifiant unique universel |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | - | Email principal pour connexion |
| `phone` | VARCHAR(20) | NULL | - | Téléphone mobile international |
| `first_name` | VARCHAR(100) | NOT NULL | - | Prénom de l'utilisateur |
| `last_name` | VARCHAR(100) | NOT NULL | - | Nom de famille |
| `avatar` | TEXT | NULL | - | URL vers photo de profil |
| `password` | VARCHAR(255) | NOT NULL | - | Hash BCrypt du mot de passe |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Compte actif/suspendu |
| `email_verified` | TIMESTAMPTZ | NULL | - | Date vérification email |
| `phone_verified` | TIMESTAMPTZ | NULL | - | Date vérification téléphone |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création compte |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière modification |
| `last_login` | TIMESTAMPTZ | NULL | - | Dernière connexion réussie |

#### Règles de gestion

- **Email** : Format valide (regex : `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`)
- **Téléphone** : Format international (`^[+]?[1-9][0-9]{7,14}$`)
- **Mot de passe** : Minimum 8 caractères, hashé avec BCrypt (cost factor 12)
- **Noms** : Ne peuvent pas être vides (après trim)
- **Compte suspendu** : Si `is_active = FALSE`, aucune connexion possible
- **Vérification** : Email requis pour certaines actions (achat billets)

#### Exemple de record complet

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "mohamed.benali@gmail.com",
  "phone": "+21698765432",
  "first_name": "Mohamed",
  "last_name": "Ben Ali",
  "avatar": "https://cdn.entrix.tn/avatars/f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg",
  "password": "$2b$12$YGVmN2Q3ZjdhMWY4ZGNiNO1234567890abcdefghijklmnopqrstuv",
  "is_active": true,
  "email_verified": "2024-03-15T10:30:00+01:00",
  "phone_verified": "2024-03-15T14:45:00+01:00",
  "created_at": "2024-03-15T09:00:00+01:00",
  "updated_at": "2024-11-20T16:30:00+01:00",
  "last_login": "2025-01-07T08:45:00+01:00"
}
```

### Table `user_profiles` - Profils étendus

**Description** : Informations démographiques et préférences détaillées des utilisateurs, séparées pour optimisation.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `user_id` | UUID | UNIQUE, NOT NULL, FK | - | Référence vers users |
| `date_of_birth` | DATE | NULL | - | Date de naissance |
| `gender` | ENUM | NULL | - | Genre de l'utilisateur |
| `address` | TEXT | NULL | - | Adresse postale complète |
| `city` | VARCHAR(100) | NULL | - | Ville de résidence |
| `country` | VARCHAR(2) | NOT NULL | 'TN' | Code pays ISO |
| `postal_code` | VARCHAR(20) | NULL | - | Code postal |
| `language` | VARCHAR(5) | NOT NULL | 'fr' | Langue interface |
| `timezone` | VARCHAR(50) | DEFAULT | 'Africa/Tunis' | Fuseau horaire |
| `notifications` | BOOLEAN | NOT NULL | TRUE | Notifications activées |
| `newsletter` | BOOLEAN | NOT NULL | FALSE | Inscription newsletter |
| `supporter_since` | DATE | NULL | - | Date début support équipe |
| `favorite_player` | VARCHAR(100) | NULL | - | Joueur préféré |
| `favorite_team_id` | UUID | NULL, FK | - | Équipe favorite |
| `preferences` | JSONB | NULL | - | Préférences interface |
| `emergency_contact` | JSONB | NULL | - | Contact d'urgence |
| `identity_document_type` | ENUM | NULL | - | Type pièce identité |
| `identity_document_number` | VARCHAR(50) | NULL | - | Numéro pièce identité |
| `identity_verified` | BOOLEAN | NOT NULL | FALSE | Document vérifié |
| `identity_verified_at` | TIMESTAMPTZ | NULL | - | Date vérification |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs possibles des ENUMs

**gender** :
- `MALE` : Homme
- `FEMALE` : Femme  
- `OTHER` : Autre
- `PREFER_NOT_TO_SAY` : Ne souhaite pas préciser

**identity_document_type** :
- `CIN` : Carte d'Identité Nationale (8 chiffres)
- `PASSPORT` : Passeport (6-20 caractères alphanumériques)
- `DRIVING_LICENSE` : Permis de conduire
- `RESIDENCE_PERMIT` : Carte de séjour
- `MILITARY_ID` : Carte militaire
- `STUDENT_ID` : Carte étudiant
- `PROFESSIONAL_ID` : Carte professionnelle
- `OTHER` : Autre document officiel

#### Structure JSONB `preferences`

```json
{
  "theme": "dark",              // light, dark, auto
  "notifications": {
    "email": true,
    "sms": false,
    "push": true,
    "reminder_hours": 24        // Heures avant événement
  },
  "display": {
    "language": "fr",
    "date_format": "DD/MM/YYYY",
    "currency": "TND"
  },
  "privacy": {
    "show_profile": true,
    "show_attendance": false
  }
}
```

#### Structure JSONB `emergency_contact`

```json
{
  "name": "Fatma Ben Ali",
  "phone": "+21650123456",
  "relationship": "spouse",     // spouse, parent, sibling, friend, other
  "alternative_phone": "+21670123456"
}
```

#### Règles de gestion

- **Âge minimum** : 13 ans à l'inscription (`date_of_birth <= CURRENT_DATE - INTERVAL '13 year'`)
- **Supporter depuis** : Ne peut pas être dans le futur
- **Identité** : Si numéro fourni, le type est obligatoire
- **Vérification identité** : Si vérifié, la date est obligatoire
- **Format CIN** : 8 chiffres exactement pour la Tunisie

#### Exemple de record complet

```json
{
  "id": "a87ff679-a2f3-71dc-b89e-882e78b3c482",
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "date_of_birth": "1990-05-15",
  "gender": "MALE",
  "address": "15 Avenue Habib Bourguiba",
  "city": "Tunis",
  "country": "TN",
  "postal_code": "1000",
  "language": "fr",
  "timezone": "Africa/Tunis",
  "notifications": true,
  "newsletter": true,
  "supporter_since": "2010-08-01",
  "favorite_player": "Youssef Msakni",
  "favorite_team_id": "123e4567-e89b-12d3-a456-426614174000",
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "sms": true,
      "push": true,
      "reminder_hours": 48
    },
    "display": {
      "language": "fr",
      "date_format": "DD/MM/YYYY",
      "currency": "TND"
    },
    "privacy": {
      "show_profile": true,
      "show_attendance": true
    }
  },
  "emergency_contact": {
    "name": "Fatma Ben Ali",
    "phone": "+21698765433",
    "relationship": "spouse"
  },
  "identity_document_type": "CIN",
  "identity_document_number": "12345678",
  "identity_verified": true,
  "identity_verified_at": "2024-03-20T11:00:00+01:00",
  "created_at": "2024-03-15T09:05:00+01:00",
  "updated_at": "2025-01-07T09:00:00+01:00"
}
```

### Table `roles` - Rôles système

**Description** : Définit les rôles globaux avec niveaux d'accès hiérarchiques pour la gestion des permissions.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | - | Code technique du rôle |
| `name` | VARCHAR(100) | NOT NULL | - | Nom affiché du rôle |
| `description` | TEXT | NULL | - | Description détaillée |
| `level` | INTEGER | NOT NULL | 0 | Niveau hiérarchique (0-100) |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Rôle actif |
| `permissions` | JSONB | NULL | - | Permissions détaillées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Rôles standards du système

| Code | Name | Level | Description |
|------|------|-------|-------------|
| `SUPER_ADMIN` | Super Administrateur | 100 | Accès complet au système |
| `ADMIN` | Administrateur | 90 | Gestion plateforme |
| `ORGANIZER_ADMIN` | Admin Organisateur | 80 | Gestion complète organisation |
| `ORGANIZER_MANAGER` | Manager Organisateur | 70 | Gestion événements |
| `VENUE_ADMIN` | Admin Lieu | 60 | Gestion complète venue |
| `VENUE_MANAGER` | Manager Lieu | 50 | Gestion opérationnelle |
| `SUPPORT_AGENT` | Agent Support | 40 | Support client |
| `VALIDATOR` | Validateur | 30 | Validation contenus |
| `USER` | Utilisateur | 10 | Utilisateur standard |

#### Structure JSONB `permissions`

```json
{
  "users": {
    "create": false,
    "read": ["self"],
    "update": ["self"],
    "delete": false
  },
  "events": {
    "create": true,
    "read": ["all"],
    "update": ["own"],
    "delete": ["own"]
  },
  "tickets": {
    "create": true,
    "read": ["own"],
    "update": false,
    "delete": false
  },
  "reports": {
    "access": true,
    "export": true
  }
}
```

#### Exemple de record complet

```json
{
  "id": "b5d4c3b2-a1f0-9e8d-7c6b-5a4b3c2d1e0f",
  "code": "ORGANIZER_ADMIN",
  "name": "Administrateur Organisateur",
  "description": "Rôle pour les administrateurs d'organisations avec accès complet à leurs événements",
  "level": 80,
  "is_active": true,
  "permissions": {
    "events": {
      "create": true,
      "read": ["own_org"],
      "update": ["own_org"],
      "delete": ["own_org", "soft_only"]
    },
    "tickets": {
      "create": true,
      "read": ["own_org"],
      "update": ["own_org", "before_event"],
      "delete": false
    },
    "finance": {
      "view_revenue": true,
      "view_commissions": true,
      "export_reports": true
    },
    "team": {
      "manage_members": true,
      "assign_roles": ["below_level"]
    }
  },
  "created_at": "2024-01-01T00:00:00+01:00",
  "updated_at": "2024-06-15T14:30:00+01:00"
}
```

### Table `groups` - Groupes personnalisés

**Description** : Groupes flexibles pour segmentation marketing, permissions granulaires et organisation interne.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | - | Code technique groupe |
| `name` | VARCHAR(100) | NOT NULL | - | Nom affiché |
| `description` | TEXT | NULL | - | Description usage |
| `type` | ENUM | NOT NULL | - | Type de groupe |
| `parent_group_id` | UUID | NULL, FK | - | Groupe parent (hiérarchie) |
| `max_members` | INTEGER | NULL | - | Limite membres |
| `current_members` | INTEGER | NOT NULL | 0 | Membres actuels |
| `valid_from` | TIMESTAMPTZ | NOT NULL | NOW() | Début validité |
| `valid_until` | TIMESTAMPTZ | NULL | - | Fin validité |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Groupe actif |
| `metadata` | JSONB | NULL | - | Métadonnées flexibles |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `type`

- `ORGANIZATION` : Groupe organisationnel (équipe interne)
- `MARKETING` : Segment marketing
- `VIP` : Groupe VIP/Premium
- `BETA` : Testeurs beta
- `PARTNER` : Partenaires commerciaux
- `PRESS` : Médias et presse
- `CUSTOM` : Groupe personnalisé

#### Structure JSONB `metadata`

```json
{
  "organization": {
    "department": "ticketing",
    "location": "Tunis HQ",
    "manager_id": "uuid-manager"
  },
  "marketing": {
    "segment": "high_value",
    "campaigns": ["summer_2025", "loyalty_program"],
    "preferences": {
      "sports": ["football", "basketball"],
      "spend_range": "100-500_TND"
    }
  },
  "benefits": {
    "discount_percentage": 10,
    "early_access_hours": 48,
    "free_shipping": true
  }
}
```

#### Exemple de record complet

```json
{
  "id": "c6d5e4f3-b2a1-0f9e-8d7c-6b5a4c3d2e1f",
  "code": "VIP_GOLD_2025",
  "name": "VIP Gold Members 2025",
  "description": "Membres VIP niveau Gold avec avantages premium",
  "type": "VIP",
  "parent_group_id": null,
  "max_members": 500,
  "current_members": 127,
  "valid_from": "2025-01-01T00:00:00+01:00",
  "valid_until": "2025-12-31T23:59:59+01:00",
  "is_active": true,
  "metadata": {
    "benefits": {
      "discount_percentage": 20,
      "early_access_hours": 72,
      "free_shipping": true,
      "vip_lounge_access": true,
      "dedicated_support": true
    },
    "requirements": {
      "annual_spend_minimum": 2000,
      "currency": "TND",
      "member_since_years": 2
    },
    "perks": {
      "birthday_gift": true,
      "exclusive_events": true,
      "meet_and_greet": 2
    }
  },
  "created_at": "2024-12-01T10:00:00+01:00",
  "updated_at": "2025-01-07T09:15:00+01:00"
}
```

---

## 🏢 Module Organisateurs {#module-organisateurs}

### Table `organizers` - Organisateurs d'événements

**Description** : Entités légales (clubs, producteurs, associations) qui créent et gèrent des événements sur la plateforme.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | - | Code organisateur unique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom commercial public |
| `legal_name` | VARCHAR(200) | NOT NULL | - | Raison sociale officielle |
| `type` | ENUM | NOT NULL | - | Type d'organisateur |
| `registration_number` | VARCHAR(100) | NULL | - | N° registre commerce |
| `tax_id` | VARCHAR(50) | NULL | - | Identifiant fiscal |
| `founded_date` | DATE | NULL | - | Date de fondation |
| `description` | TEXT | NULL | - | Description publique |
| `logo_url` | TEXT | NULL | - | Logo organisateur |
| `website` | VARCHAR(255) | NULL | - | Site web officiel |
| `email` | VARCHAR(255) | NOT NULL | - | Email contact principal |
| `phone` | VARCHAR(20) | NOT NULL | - | Téléphone principal |
| `address` | TEXT | NULL | - | Adresse siège social |
| `city` | VARCHAR(100) | NULL | - | Ville siège |
| `country` | VARCHAR(2) | DEFAULT 'TN' | 'TN' | Code pays ISO |
| `primary_contact_id` | UUID | NULL, FK | - | Contact principal |
| `status` | ENUM | NOT NULL | 'PENDING' | Statut validation |
| `commission_rate` | DECIMAL(5,4) | DEFAULT 0.10 | 0.1000 | Taux commission (10%) |
| `payment_delay_days` | INTEGER | DEFAULT 15 | 15 | Délai paiement J+15 |
| `legal_documents` | JSONB | NULL | - | Documents légaux |
| `banking_details` | JSONB | NULL | - | Infos bancaires chiffrées |
| `contract_details` | JSONB | NULL | - | Détails contrat |
| `statistics` | JSONB | NULL | - | Stats calculées |
| `settings` | JSONB | NULL | - | Paramètres organisateur |
| `verified_at` | TIMESTAMPTZ | NULL | - | Date validation |
| `verified_by` | UUID | NULL, FK | - | Validé par (admin) |
| `total_events` | INTEGER | DEFAULT 0 | 0 | Nombre total événements |
| `total_revenue` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | CA total généré |
| `rating` | DECIMAL(3,2) | NULL | - | Note moyenne (0-5) |
| `is_featured` | BOOLEAN | DEFAULT FALSE | FALSE | Mise en avant |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `type`

- `SPORTS_CLUB` : Club sportif professionnel
- `CULTURAL_PRODUCER` : Producteur culturel (concerts, théâtre)
- `FESTIVAL_ORGANIZER` : Organisateur de festivals
- `CORPORATE` : Entreprise (événements corporate)
- `ASSOCIATION` : Association à but non lucratif
- `GOVERNMENT` : Entité gouvernementale
- `EDUCATIONAL` : Institution éducative
- `OTHER` : Autre type d'organisateur

#### Valeurs ENUM `status`

- `PENDING` : En attente de validation
- `APPROVED` : Approuvé et actif
- `SUSPENDED` : Temporairement suspendu
- `REJECTED` : Demande rejetée
- `BANNED` : Banni définitivement

#### Structure JSONB `legal_documents`

```json
{
  "documents": [
    {
      "type": "commercial_register",
      "number": "B123456789",
      "issued_date": "2020-01-15",
      "expiry_date": "2030-01-15",
      "file_url": "https://secure.entrix.tn/docs/org123/rc_2020.pdf",
      "verified": true
    },
    {
      "type": "tax_certificate",
      "number": "TF987654321",
      "issued_date": "2024-12-01",
      "expiry_date": "2025-12-01",
      "file_url": "https://secure.entrix.tn/docs/org123/tf_2024.pdf",
      "verified": true
    },
    {
      "type": "insurance",
      "provider": "Assurances STAR",
      "policy_number": "EVT2025/1234",
      "coverage_amount": 1000000,
      "currency": "TND",
      "valid_until": "2025-12-31"
    }
  ],
  "compliance": {
    "aml_check": true,
    "aml_check_date": "2024-11-15",
    "risk_level": "low"
  }
}
```

#### Structure JSONB `banking_details` (chiffré)

```json
{
  "encrypted": true,
  "encryption_key_id": "key_2024_v2",
  "data": "eyJhbGciOiJBMjU2R0NNIiwiZW5jIjoiQTI1NkdDTSJ9...",
  "last_updated": "2024-12-01T10:00:00Z",
  "verified_by": "bank_api_v2"
}
```

Version déchiffrée (jamais stockée en clair) :
```json
{
  "bank_name": "BIAT",
  "bank_code": "08",
  "branch_code": "151",
  "account_number": "08151234567890123456",
  "rib": "08151234567890123456789",
  "iban": "TN5908151234567890123456789",
  "swift": "BIATTNTT",
  "account_holder": "CLUB AFRICAIN",
  "currency": "TND"
}
```

#### Structure JSONB `statistics`

```json
{
  "events": {
    "total": 156,
    "last_30_days": 12,
    "by_status": {
      "published": 8,
      "completed": 145,
      "cancelled": 3
    },
    "average_attendance": 15420,
    "fill_rate": 0.82
  },
  "revenue": {
    "total_gross": 4567890.50,
    "total_net": 4111101.45,
    "last_12_months": 2345678.90,
    "average_per_event": 29281.35,
    "currency": "TND"
  },
  "tickets": {
    "total_sold": 2405680,
    "refund_rate": 0.02,
    "transfer_rate": 0.15
  },
  "ratings": {
    "average": 4.3,
    "count": 8920,
    "distribution": {
      "5": 4123,
      "4": 3245,
      "3": 1102,
      "2": 350,
      "1": 100
    }
  }
}
```

#### Exemple de record complet

```json
{
  "id": "d7e6f5g4-c3b2-1a0f-9e8d-7c6b5a4c3d2e",
  "code": "ORG_2020_CA001",
  "name": "Club Africain",
  "legal_name": "CLUB AFRICAIN SOCIETE SPORTIVE",
  "type": "SPORTS_CLUB",
  "registration_number": "B123456789",
  "tax_id": "1234567ABC",
  "founded_date": "1920-10-04",
  "description": "Club Africain, fondé en 1920, est l'un des clubs les plus titrés de Tunisie avec 13 championnats et de nombreuses coupes.",
  "logo_url": "https://cdn.entrix.tn/orgs/club_africain_logo.png",
  "website": "https://www.clubafricain.tn",
  "email": "contact@clubafricain.tn",
  "phone": "+21671234567",
  "address": "Avenue Mohamed V, Parc A",
  "city": "Tunis",
  "country": "TN",
  "primary_contact_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "APPROVED",
  "commission_rate": 0.0800,
  "payment_delay_days": 7,
  "legal_documents": {
    "documents": [
      {
        "type": "commercial_register",
        "number": "B123456789",
        "issued_date": "2020-01-15",
        "expiry_date": "2030-01-15",
        "file_url": "https://secure.entrix.tn/docs/ca/rc_2020.pdf",
        "verified": true
      }
    ],
    "compliance": {
      "aml_check": true,
      "aml_check_date": "2024-11-15",
      "risk_level": "low"
    }
  },
  "banking_details": {
    "encrypted": true,
    "encryption_key_id": "key_2024_v2",
    "data": "eyJhbGciOiJBMjU2R0NNIiwiZW5jIjoiQTI1NkdDTSJ9..."
  },
  "contract_details": {
    "contract_number": "CNT2024/CA/001",
    "start_date": "2024-01-01",
    "end_date": "2026-12-31",
    "auto_renewal": true,
    "special_terms": {
      "priority_booking": true,
      "exclusive_venue_days": ["saturday", "sunday"],
      "minimum_events_per_year": 20
    }
  },
  "statistics": {
    "events": {
      "total": 156,
      "last_30_days": 12,
      "average_attendance": 15420
    },
    "revenue": {
      "total_gross": 4567890.50,
      "currency": "TND"
    }
  },
  "settings": {
    "notifications": {
      "email_on_sale": true,
      "sms_on_sale": false,
      "daily_report": true
    },
    "branding": {
      "primary_color": "#ED1C24",
      "secondary_color": "#FFFFFF",
      "font_family": "Montserrat"
    },
    "ticketing": {
      "allow_print_at_home": true,
      "allow_transfers": true,
      "transfer_fee": 0.00,
      "refund_policy": "72_hours"
    }
  },
  "verified_at": "2024-01-15T14:30:00+01:00",
  "verified_by": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "total_events": 156,
  "total_revenue": 4567890.50,
  "rating": 4.30,
  "is_featured": true,
  "created_at": "2024-01-01T09:00:00+01:00",
  "updated_at": "2025-01-07T10:00:00+01:00"
}
```

### Table `venue_organizer_relations` - Relations Venues-Organisateurs

**Description** : Définit les relations entre organisateurs et lieux (propriété, gestion, location).

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | Référence venue |
| `organizer_id` | UUID | NOT NULL, FK | - | Référence organisateur |
| `relation_type` | ENUM | NOT NULL | - | Type de relation |
| `is_primary` | BOOLEAN | DEFAULT FALSE | FALSE | Relation principale |
| `valid_from` | DATE | NOT NULL | CURRENT_DATE | Début relation |
| `valid_until` | DATE | NULL | - | Fin relation |
| `commission_override` | DECIMAL(5,4) | NULL | - | Commission spéciale |
| `priority_level` | INTEGER | DEFAULT 0 | 0 | Niveau priorité réservation |
| `auto_approval` | BOOLEAN | DEFAULT FALSE | FALSE | Validation auto événements |
| `contract_reference` | VARCHAR(100) | NULL | - | Référence contrat |
| `notes` | TEXT | NULL | - | Notes internes |
| `metadata` | JSONB | NULL | - | Métadonnées relation |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `relation_type`

- `OWNER` : Propriétaire du lieu
- `PRIMARY_MANAGER` : Gestionnaire principal
- `SECONDARY_MANAGER` : Gestionnaire secondaire
- `PREFERRED_PARTNER` : Partenaire privilégié
- `REGULAR_CLIENT` : Client régulier
- `EXCLUSIVE_RIGHTS` : Droits exclusifs certains jours
- `TENANT` : Locataire permanent

#### Structure JSONB `metadata`

```json
{
  "contract": {
    "type": "exclusive_weekends",
    "revenue_share": 0.15,
    "minimum_events": 10,
    "penalties": {
      "cancellation": 5000,
      "currency": "TND"
    }
  },
  "scheduling": {
    "blackout_dates": ["2025-07-14", "2025-12-25"],
    "preferred_days": ["saturday", "sunday"],
    "time_slots": {
      "morning": false,
      "afternoon": true,
      "evening": true
    }
  },
  "services": {
    "included": ["security", "cleaning", "basic_sound"],
    "additional": {
      "catering": {
        "provider": "internal",
        "commission": 0.20
      }
    }
  }
}
```

#### Exemple de record complet

```json
{
  "id": "e8f7g6h5-d4c3-2b1a-0f9e-8d7c6b5a4c3d",
  "venue_id": "venue_stade_olympique_rades",
  "organizer_id": "d7e6f5g4-c3b2-1a0f-9e8d-7c6b5a4c3d2e",
  "relation_type": "PREFERRED_PARTNER",
  "is_primary": true,
  "valid_from": "2024-01-01",
  "valid_until": "2026-12-31",
  "commission_override": 0.0600,
  "priority_level": 100,
  "auto_approval": true,
  "contract_reference": "CTR/2024/RADES/CA/001",
  "notes": "Accord prioritaire pour tous les matchs du championnat et coupe",
  "metadata": {
    "contract": {
      "type": "exclusive_weekends",
      "revenue_share": 0.15,
      "minimum_events": 20
    },
    "scheduling": {
      "preferred_days": ["saturday", "sunday"],
      "time_slots": {
        "afternoon": true,
        "evening": true
      }
    }
  },
  "created_at": "2024-01-01T10:00:00+01:00",
  "updated_at": "2024-12-15T15:30:00+01:00"
}
```

---

## 🔗 Relations et Hiérarchies {#relations-hierarchies}

### Relations entre tables

#### Module Utilisateurs

1. **users ← user_profiles** (1:1)
   - Un utilisateur a exactement un profil étendu
   - Suppression cascade du profil si utilisateur supprimé

2. **users ← user_roles → roles** (N:M)
   - Un utilisateur peut avoir plusieurs rôles
   - Un rôle peut être attribué à plusieurs utilisateurs
   - Historique avec dates de validité

3. **users ← user_groups → groups** (N:M)
   - Un utilisateur peut appartenir à plusieurs groupes
   - Un groupe peut contenir plusieurs utilisateurs
   - Métadonnées spécifiques par liaison

#### Module Organisateurs

1. **organizers → users** (N:1)
   - Contact principal référence un utilisateur
   - Validé par référence un admin

2. **organizers ← venue_organizer_relations → venues** (N:M)
   - Un organisateur peut gérer plusieurs venues
   - Un venue peut avoir plusieurs organisateurs
   - Types de relations variés

### Hiérarchie des permissions

```
SUPER_ADMIN (100)
    └── ADMIN (90)
        ├── ORGANIZER_ADMIN (80)
        │   └── ORGANIZER_MANAGER (70)
        ├── VENUE_ADMIN (60)
        │   └── VENUE_MANAGER (50)
        └── SUPPORT_AGENT (40)
            └── VALIDATOR (30)
                └── USER (10)
```

### Règles de cascade

1. **Suppression utilisateur** :
   - Soft delete (is_active = false)
   - Anonymisation données personnelles
   - Conservation historique pour audit

2. **Suppression organisateur** :
   - Interdite si événements actifs
   - Transfert possible à autre organisateur
   - Archive complète avant suppression

3. **Modifications critiques** :
   - Audit trail automatique
   - Validation multi-niveaux
   - Notifications parties prenantes