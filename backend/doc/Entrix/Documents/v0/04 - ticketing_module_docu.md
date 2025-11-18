# DOCUMENTATION MODULE BILLETTERIE & CONTRÔLE D'ACCÈS
## Plateforme Entrix - Système de Gestion des Droits d'Accès

---

**Version :** 1.0  
**Date :** Juin 2025  
**Système :** Gestion unifiée billetterie, abonnements et contrôle d'accès  

---

## 📋 VUE D'ENSEMBLE DU MODULE

### Principe général
Le module billetterie d'Entrix gère l'ensemble du cycle de vie des droits d'accès aux événements :

1. **DÉFINITION** : Plans d'abonnements et types de billets disponibles
2. **INSTANCE** : Abonnements souscrits et billets achetés par les utilisateurs  
3. **DROITS** : Table unifiée des droits d'accès (QR codes)
4. **CONTRÔLE** : Validation physique et traçabilité complète

### Architecture du module
- Séparation claire entre définitions (catalogues) et instances (achats)
- Table centrale `access_rights` unifiant tous les types d'accès
- Double système de logs pour traçabilité complète
- Flexibilité maximale avec overrides et métadonnées JSON
- Support multi-zones et multi-groupes d'événements

---

## 🗄️ TABLES DU SYSTÈME

### **1. Table `subscription_plans`**

#### **Rôle de la table**
Catalogue des différents types d'abonnements disponibles à la vente. Définit les caractéristiques, prix et avantages de chaque plan d'abonnement sans être lié à un utilisateur spécifique.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique du plan | `550e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(100) | Unique, NOT NULL | Code technique unique | `SEASON_TRIBUNE_2025`, `HALF_VIP_2025` |
| `name` | VARCHAR(200) | NOT NULL | Nom commercial | `Abonnement Tribune Saison 2025-2026` |
| `description` | TEXT | Optional | Description détaillée | `Accès à tous les matchs à domicile en tribune principale` |
| `type` | subscription_plan_type | NOT NULL | Type de plan | `FULL_SEASON`, `HALF_SEASON`, `PACKAGE`, `FLEX` |
| `price` | DECIMAL(10,2) | NOT NULL | Prix de base | `450.00`, `225.00`, `800.00` |
| `duration_months` | INTEGER | Optional | Durée en mois | `9` (une saison), `12`, `6` |
| `max_subscribers` | INTEGER | Optional | Limite de souscripteurs | `5000`, `500`, `null` (illimité) |
| `current_subscribers` | INTEGER | Default: 0 | Souscripteurs actuels | `3250`, `0` |
| `default_zone_category` | zone_category | Optional | Catégorie zone par défaut | `PREMIUM`, `STANDARD`, `VIP` |
| `benefits` | JSONB | Optional | Avantages inclus | `{"parking": true, "vip_lounge": false, "priority_renewal": true}` |
| `restrictions` | JSONB | Optional | Restrictions | `{"min_age": 16, "max_transfers": 5, "blackout_dates": []}` |
| `sales_start` | TIMESTAMPTZ | Optional | Début des ventes | `2025-07-01T10:00:00Z` |
| `sales_end` | TIMESTAMPTZ | Optional | Fin des ventes | `2025-09-30T23:59:59Z` |
| `renewal_priority_days` | INTEGER | Default: 30 | Jours priorité renouvellement | `30`, `45`, `60` |
| `is_renewable` | BOOLEAN | Default: true | Renouvelable | `true`, `false` |
| `is_transferable` | BOOLEAN | Default: true | Transférable | `true`, `false` |
| `is_active` | BOOLEAN | Default: true | Plan actif | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-15T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-20T15:30:00Z` |

#### **Exemples de données**

**Abonnement saison complète Tribune :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "code": "SEASON_TRIBUNE_2025",
  "name": "Abonnement Tribune Saison 2025-2026",
  "description": "Accès à tous les matchs de championnat à domicile du Club Africain en tribune principale. Place attitrée garantie.",
  "type": "FULL_SEASON",
  "price": 450.00,
  "duration_months": 9,
  "max_subscribers": 5000,
  "current_subscribers": 3842,
  "default_zone_category": "PREMIUM",
  "benefits": {
    "parking": false,
    "vip_lounge": false,
    "priority_renewal": true,
    "shop_discount": 10,
    "food_discount": 5,
    "guest_tickets": 2,
    "exclusive_events": ["season_opening", "awards_ceremony"]
  },
  "restrictions": {
    "min_age": null,
    "max_transfers_per_season": 5,
    "transfer_window_hours": 48,
    "blackout_matches": ["derby_est"],
    "requires_id_verification": true
  },
  "sales_start": "2025-07-01T10:00:00Z",
  "sales_end": "2025-09-30T23:59:59Z",
  "renewal_priority_days": 30,
  "is_renewable": true,
  "is_transferable": true,
  "is_active": true,
  "metadata": {
    "payment_options": ["full", "3x", "monthly"],
    "seat_selection": "assigned",
    "printed_card": true,
    "mobile_pass": true,
    "family_package_available": true,
    "group_discount": {
      "5+": 5,
      "10+": 10
    }
  }
}
```

**Abonnement VIP annuel multi-sports :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "code": "VIP_MULTISPORT_2025",
  "name": "Pass VIP Multi-Sports Club Africain",
  "description": "Accès VIP à tous les événements du club : football, basketball, handball. Lounge VIP, parking, hospitalité premium.",
  "type": "PACKAGE",
  "price": 2500.00,
  "duration_months": 12,
  "max_subscribers": 200,
  "current_subscribers": 156,
  "default_zone_category": "VIP",
  "benefits": {
    "parking": true,
    "vip_lounge": true,
    "priority_renewal": true,
    "shop_discount": 20,
    "food_discount": 100,
    "guest_tickets": 4,
    "meet_and_greet": true,
    "exclusive_events": ["all"],
    "dedicated_entrance": true,
    "concierge_service": true
  },
  "restrictions": {
    "min_age": 18,
    "max_transfers_per_season": "unlimited",
    "transfer_fee": 50.00,
    "requires_approval": true,
    "dress_code": "business_casual"
  },
  "sales_start": "2025-06-01T10:00:00Z",
  "sales_end": "2025-08-31T23:59:59Z",
  "renewal_priority_days": 60,
  "is_renewable": true,
  "is_transferable": true,
  "is_active": true,
  "metadata": {
    "includes_sports": ["football", "basketball", "handball"],
    "vip_services": {
      "welcome_gift": "premium_jersey",
      "birthday_surprise": true,
      "personal_account_manager": true
    },
    "payment_options": ["full", "2x", "4x"],
    "early_bird_discount": {
      "before": "2025-06-30",
      "discount": 15
    }
  }
}
```

**Abonnement flexible jeunes :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "code": "FLEX_YOUTH_2025",
  "name": "Pass Jeunes Flexible 10 Matchs",
  "description": "Choisissez 10 matchs dans la saison. Idéal pour les étudiants et jeunes actifs.",
  "type": "FLEX",
  "price": 150.00,
  "duration_months": 9,
  "max_subscribers": 2000,
  "current_subscribers": 1456,
  "default_zone_category": "BASIC",
  "benefits": {
    "number_of_matches": 10,
    "zone_upgrade_possible": true,
    "guest_discount": 20,
    "shop_discount": 15
  },
  "restrictions": {
    "min_age": 16,
    "max_age": 25,
    "student_card_required": true,
    "max_uses_per_match": 1,
    "advance_booking_days": 7,
    "peak_matches_limit": 3
  },
  "sales_start": "2025-07-15T10:00:00Z",
  "sales_end": "2025-10-31T23:59:59Z",
  "renewal_priority_days": 15,
  "is_renewable": true,
  "is_transferable": false,
  "is_active": true,
  "metadata": {
    "validation": "student_id",
    "booking_system": "first_come_first_served",
    "unused_matches": "no_refund",
    "upgrade_fee": {
      "to_standard": 5,
      "to_premium": 15
    }
  }
}
```

---

### **2. Table `subscription_plan_event_groups`**

#### **Rôle de la table**
Table de liaison définissant quels groupes d'événements sont couverts par chaque plan d'abonnement. Permet à un abonnement de donner accès à plusieurs groupes (ex: football + basketball).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `subscription_plan_id` | UUID | Foreign Key, NOT NULL | Plan d'abonnement | UUID de subscription_plans |
| `event_group_id` | UUID | Foreign Key, NOT NULL | Groupe d'événements | UUID de event_groups |
| `access_level` | VARCHAR(50) | Default: FULL | Niveau d'accès | `FULL`, `HOME_ONLY`, `PARTIAL` |
| `included_match_types` | TEXT[] | Optional | Types de matchs inclus | `["championship", "cup", "friendly"]` |
| `excluded_events` | UUID[] | Optional | Événements exclus | Array d'UUID events (derby) |
| `metadata` | JSONB | Optional | Paramètres spécifiques | `{"priority_booking": true}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date d'ajout | `2025-01-15T10:00:00Z` |

#### **Exemples de données**

```json
[
  {
    "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440001",
    "event_group_id": "770e8400-e29b-41d4-a716-446655440001",
    "access_level": "HOME_ONLY",
    "included_match_types": ["championship", "cup"],
    "excluded_events": ["880e8400-e29b-41d4-a716-446655440001"],
    "metadata": {
      "notes": "Championnat 2025-2026, derby nécessite supplément"
    }
  },
  {
    "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440002",
    "event_group_id": "770e8400-e29b-41d4-a716-446655440001",
    "access_level": "FULL",
    "included_match_types": ["all"],
    "excluded_events": [],
    "metadata": {
      "vip_privileges": true,
      "includes_away_matches": false
    }
  },
  {
    "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440002",
    "event_group_id": "770e8400-e29b-41d4-a716-446655440005",
    "access_level": "FULL",
    "included_match_types": ["all"],
    "metadata": {
      "sport": "basketball",
      "includes_playoffs": true
    }
  }
]
```

---

### **3. Table `subscription_plan_events`**

#### **Rôle de la table**
Table de liaison pour inclure des événements spécifiques dans un plan d'abonnement, en dehors des groupes (ex: gala annuel, match amical spécial).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `subscription_plan_id` | UUID | Foreign Key, NOT NULL | Plan d'abonnement | UUID de subscription_plans |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement spécifique | UUID de events |
| `access_level` | VARCHAR(50) | Default: FULL | Niveau d'accès | `FULL`, `STANDARD`, `RESTRICTED` |
| `requires_booking` | BOOLEAN | Default: false | Réservation requise | `true`, `false` |
| `booking_window_days` | INTEGER | Optional | Fenêtre de réservation | `7`, `14`, `30` |
| `metadata` | JSONB | Optional | Paramètres spécifiques | `{"zone_upgrade": true}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date d'ajout | `2025-01-15T10:00:00Z` |

#### **Exemples de données**

```json
[
  {
    "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440002",
    "event_id": "880e8400-e29b-41d4-a716-446655440100",
    "access_level": "FULL",
    "requires_booking": false,
    "metadata": {
      "event_type": "gala_anniversaire",
      "included_services": ["cocktail", "diner"],
      "dress_code": "formal"
    }
  },
  {
    "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440001",
    "event_id": "880e8400-e29b-41d4-a716-446655440101",
    "access_level": "STANDARD",
    "requires_booking": true,
    "booking_window_days": 14,
    "metadata": {
      "event_type": "friendly_legends",
      "special_conditions": "First come first served"
    }
  }
]
```

---

### **4. Table `subscription_plan_zones`**

#### **Rôle de la table**
Définit les catégories de zones accessibles pour chaque plan d'abonnement. Utilise les catégories de zones plutôt que des zones spécifiques pour gérer les différentes cartographies.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `subscription_plan_id` | UUID | Foreign Key, NOT NULL | Plan d'abonnement | UUID de subscription_plans |
| `zone_category` | zone_category | NOT NULL | Catégorie de zone | `PREMIUM`, `STANDARD`, `VIP` |
| `is_primary` | BOOLEAN | Default: true | Zone principale | `true`, `false` |
| `upgrade_allowed` | BOOLEAN | Default: false | Upgrade possible | `true`, `false` |
| `upgrade_fee` | DECIMAL(10,2) | Optional | Coût upgrade | `20.00`, `50.00`, `null` |
| `metadata` | JSONB | Optional | Paramètres | `{"specific_sections": ["A", "B"]}` |

#### **Exemples de données**

```json
[
  {
    "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440001",
    "zone_category": "PREMIUM",
    "is_primary": true,
    "upgrade_allowed": true,
    "upgrade_fee": 30.00,
    "metadata": {
      "preferred_sections": ["Tribune Nord", "Tribune Sud"],
      "seat_selection": "assigned"
    }
  },
  {
    "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440002",
    "zone_category": "VIP",
    "is_primary": true,
    "upgrade_allowed": false,
    "metadata": {
      "includes_lounge_access": true,
      "dedicated_entrance": "VIP Gate A"
    }
  },
  {
    "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440002",
    "zone_category": "PREMIUM",
    "is_primary": false,
    "upgrade_allowed": false,
    "metadata": {
      "access_reason": "VIP overflow or preference"
    }
  }
]
```

---

### **5. Table `subscriptions`**

#### **Rôle de la table**
Instance d'un abonnement souscrit par un utilisateur. Représente l'achat effectif d'un plan d'abonnement avec toutes les spécificités de cette souscription.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `660e8400-e29b-41d4-a716-446655440001` |
| `subscription_number` | VARCHAR(50) | Unique, NOT NULL | Numéro d'abonné | `SUB-2025-001234`, `VIP-2025-0156` |
| `user_id` | UUID | Foreign Key, NOT NULL | Propriétaire | UUID de users |
| `subscription_plan_id` | UUID | Foreign Key, NOT NULL | Plan souscrit | UUID de subscription_plans |
| `seat_id` | UUID | Foreign Key, Optional | Place attitrée | UUID de seats ou `null` |
| `price_paid` | DECIMAL(10,2) | NOT NULL | Prix effectivement payé | `450.00`, `382.50` (avec remise) |
| `payment_id` | UUID | Foreign Key, Optional | Référence paiement | UUID de payments |
| `valid_from` | DATE | NOT NULL | Début de validité | `2025-09-01` |
| `valid_until` | DATE | NOT NULL | Fin de validité | `2026-05-31` |
| `status` | subscription_status | NOT NULL | Statut actuel | `ACTIVE`, `SUSPENDED`, `EXPIRED` |
| `suspension_reason` | TEXT | Optional | Motif suspension | `Impayé`, `Comportement`, `null` |
| `suspension_date` | TIMESTAMPTZ | Optional | Date suspension | `2025-10-15T10:00:00Z`, `null` |
| `auto_renew` | BOOLEAN | Default: false | Renouvellement auto | `true`, `false` |
| `renewal_date` | DATE | Optional | Date renouvellement | `2026-05-01` |
| `transfers_used` | INTEGER | Default: 0 | Transferts utilisés | `2`, `0`, `5` |
| `last_transfer_date` | TIMESTAMPTZ | Optional | Date dernier transfert | `2025-02-10T15:30:00Z`, `null` |
| `valid_from` | TIMESTAMPTZ | NOT NULL | Début validité | `2025-02-15T17:00:00Z` |
| `valid_until` | TIMESTAMPTZ | NOT NULL | Fin validité | `2025-02-15T23:59:59Z` |
| `used_at` | TIMESTAMPTZ | Optional | Date utilisation | `2025-02-15T18:45:30Z`, `null` |
| `used_at_access_point` | UUID | Foreign Key, Optional | Point d'accès utilisé | UUID de access_points |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-15T14:35:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-02-10T15:30:00Z` |
| `created_by` | UUID | Foreign Key | Créateur | UUID utilisateur/système |

#### **Exemples de données**

**Droit d'accès issu d'un billet :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440001",
  "qr_code": "QR-2025-CA-EST-001234",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "zone_id": "zone_tribune_nord",
  "seat_id": null,
  "status": "ENABLED",
  "source_type": "TICKET",
  "source_id": "aa0e8400-e29b-41d4-a716-446655440001",
  "original_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "transfer_count": 0,
  "valid_from": "2025-02-15T17:00:00Z",
  "valid_until": "2025-02-15T23:59:59Z",
  "metadata": {
    "ticket_type": "TRIBUNE",
    "price_paid": 80.00,
    "purchase_date": "2025-01-15T14:35:00Z",
    "gate_access": ["A", "B"],
    "special_conditions": "ID required"
  }
}
```

**Droit d'accès issu d'un abonnement :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440002",
  "qr_code": "QR-SUB-2025-001234-M15",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440015",
  "zone_id": "zone_tribune_principale",
  "seat_id": "seat_tribune_A_15_12",
  "status": "ENABLED",
  "source_type": "SUBSCRIPTION",
  "source_id": "660e8400-e29b-41d4-a716-446655440001",
  "original_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "transfer_count": 0,
  "valid_from": "2025-03-20T17:00:00Z",
  "valid_until": "2025-03-20T23:59:59Z",
  "metadata": {
    "subscription_number": "SUB-2025-001234",
    "subscription_type": "SEASON_TRIBUNE",
    "match_number": 15,
    "season": "2025-2026",
    "seat_info": {
      "section": "A",
      "row": "15",
      "seat": "12"
    }
  }
}
```

**Droit d'accès transféré :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440003",
  "qr_code": "QR-2025-CA-CSS-005678",
  "user_id": "110e8400-e29b-41d4-a716-446655440005",
  "event_id": "880e8400-e29b-41d4-a716-446655440020",
  "zone_id": "zone_tribune_sud",
  "seat_id": null,
  "status": "ENABLED",
  "source_type": "TRANSFER",
  "source_id": "bb0e8400-e29b-41d4-a716-446655440004",
  "original_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "transfer_count": 1,
  "last_transfer_date": "2025-03-15T10:30:00Z",
  "valid_from": "2025-03-25T17:00:00Z",
  "valid_until": "2025-03-25T23:59:59Z",
  "metadata": {
    "transfer_details": {
      "from_user": "110e8400-e29b-41d4-a716-446655440001",
      "to_user": "110e8400-e29b-41d4-a716-446655440005",
      "transfer_type": "DONATION",
      "transfer_date": "2025-03-15T10:30:00Z",
      "reason": "Cannot attend",
      "original_source": "SUBSCRIPTION"
    },
    "original_subscription": "SUB-2025-001234",
    "restrictions": {
      "no_retransfer": true,
      "id_check_required": true
    }
  }
}
```

**Droit d'accès utilisé :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440004",
  "qr_code": "QR-2025-CA-EST-001235",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "zone_id": "zone_tribune_nord",
  "seat_id": null,
  "status": "USED",
  "source_type": "TICKET",
  "source_id": "aa0e8400-e29b-41d4-a716-446655440001",
  "original_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "transfer_count": 0,
  "valid_from": "2025-02-15T17:00:00Z",
  "valid_until": "2025-02-15T23:59:59Z",
  "used_at": "2025-02-15T18:45:30Z",
  "used_at_access_point": "access_point_gate_a",
  "metadata": {
    "entry_details": {
      "gate": "A",
      "scanner": "SCANNER-A01",
      "controller": "staff_123",
      "entry_time": "18:45:30",
      "queue_time_seconds": 120,
      "temperature_check": "36.5°C"
    }
  }
}
```

---

### **12. Table `access_transactions_log`**

#### **Rôle de la table**
Journal complet de toutes les opérations effectuées sur les droits d'accès. Assure la traçabilité de chaque action (création, transfert, annulation, etc.).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `cc0e8400-e29b-41d4-a716-446655440001` |
| `access_right_id` | UUID | Foreign Key, NOT NULL | Droit concerné | UUID de access_rights |
| `transaction_type` | access_transaction_type | NOT NULL | Type d'opération | `CREATE`, `TRANSFER_SALE`, `CANCEL` |
| `from_user_id` | UUID | Foreign Key, Optional | Utilisateur source | UUID de users ou `null` |
| `to_user_id` | UUID | Foreign Key, Optional | Utilisateur destination | UUID de users ou `null` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement concerné | UUID de events |
| `price` | DECIMAL(10,2) | Optional | Prix si vente | `50.00`, `0.00`, `null` |
| `currency` | VARCHAR(3) | Default: TND | Devise | `TND`, `EUR`, `USD` |
| `reason` | TEXT | Optional | Motif de l'opération | `Empêchement personnel`, `Upgrade VIP` |
| `ip_address` | INET | Optional | IP de l'opération | `41.226.11.226` |
| `user_agent` | TEXT | Optional | Navigateur/app | `Mozilla/5.0...` |
| `device_id` | VARCHAR(100) | Optional | ID appareil | `iPhone-ABC123`, `Android-XYZ789` |
| `location` | JSONB | Optional | Géolocalisation | `{"lat": 36.8065, "lng": 10.1815}` |
| `status` | transaction_status | NOT NULL | Statut transaction | `SUCCESS`, `FAILED`, `PENDING` |
| `error_message` | TEXT | Optional | Message d'erreur | `null`, `Payment failed` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date opération | `2025-02-10T14:30:00Z` |
| `created_by` | UUID | Foreign Key | Initiateur | UUID utilisateur/système |

#### **Exemples de données**

**Création suite à achat billet :**
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440001",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440001",
  "transaction_type": "CREATE",
  "from_user_id": null,
  "to_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "price": 80.00,
  "currency": "TND",
  "reason": "Ticket purchase",
  "ip_address": "41.226.11.226",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "status": "SUCCESS",
  "metadata": {
    "source": "TICKET",
    "ticket_id": "aa0e8400-e29b-41d4-a716-446655440001",
    "ticket_type": "TRIBUNE",
    "payment_method": "credit_card",
    "platform": "web",
    "session_id": "sess_2025_01_15_xyz"
  },
  "created_at": "2025-01-15T14:35:00Z",
  "created_by": "110e8400-e29b-41d4-a716-446655440001"
}
```

**Transfert par vente :**
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440002",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440003",
  "transaction_type": "TRANSFER_SALE",
  "from_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "to_user_id": "110e8400-e29b-41d4-a716-446655440005",
  "event_id": "880e8400-e29b-41d4-a716-446655440020",
  "price": 65.00,
  "currency": "TND",
  "reason": "Revente - empêchement professionnel",
  "ip_address": "197.15.23.145",
  "user_agent": "Entrix Mobile App/2.1.0 (iOS 17.2)",
  "device_id": "iPhone-ABC123",
  "location": {
    "lat": 36.8065,
    "lng": 10.1815,
    "accuracy": 10,
    "city": "Tunis"
  },
  "status": "SUCCESS",
  "metadata": {
    "original_price": 50.00,
    "profit": 15.00,
    "transfer_method": "in_app",
    "verification": {
      "buyer_verified": true,
      "seller_verified": true,
      "max_price_check": "passed"
    },
    "commission": {
      "platform_fee": 3.25,
      "payment_fee": 1.95,
      "net_to_seller": 59.80
    },
    "escrow_id": "escrow_2025_03_15_001"
  },
  "created_at": "2025-03-15T10:30:00Z",
  "created_by": "110e8400-e29b-41d4-a716-446655440001"
}
```

**Transfert par don :**
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440003",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440010",
  "transaction_type": "TRANSFER_DONATION",
  "from_user_id": "110e8400-e29b-41d4-a716-446655440002",
  "to_user_id": "110e8400-e29b-41d4-a716-446655440008",
  "event_id": "880e8400-e29b-41d4-a716-446655440025",
  "price": 0.00,
  "currency": "TND",
  "reason": "Cadeau anniversaire pour mon frère",
  "ip_address": "41.230.15.88",
  "status": "SUCCESS",
  "metadata": {
    "transfer_type": "gift",
    "relationship": "family",
    "message_to_recipient": "Joyeux anniversaire! Profite du match!",
    "notification_sent": {
      "sms": true,
      "email": true,
      "in_app": true
    },
    "source": "SUBSCRIPTION",
    "original_subscription": "SUB-2025-001234"
  },
  "created_at": "2025-04-10T09:15:00Z",
  "created_by": "110e8400-e29b-41d4-a716-446655440002"
}
```

**Annulation :**
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440004",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440015",
  "transaction_type": "CANCEL",
  "from_user_id": "110e8400-e29b-41d4-a716-446655440003",
  "to_user_id": null,
  "event_id": "880e8400-e29b-41d4-a716-446655440030",
  "price": -35.00,
  "currency": "TND",
  "reason": "Match reporté - client demande remboursement",
  "ip_address": "197.28.45.67",
  "status": "SUCCESS",
  "metadata": {
    "cancellation_type": "user_requested",
    "refund_status": "processed",
    "refund_amount": 35.00,
    "refund_method": "original_payment",
    "refund_reference": "REF-2025-04-20-001",
    "processing_fee": 0.00,
    "original_purchase_date": "2025-03-01",
    "days_before_event": 15
  },
  "created_at": "2025-04-20T11:45:00Z",
  "created_by": "110e8400-e29b-41d4-a716-446655440003"
}
```

---

### **13. Table `access_control_log`**

#### **Rôle de la table**
Journal de toutes les tentatives d'accès physique aux événements. Enregistre chaque scan de QR code avec le résultat et les détails.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `dd0e8400-e29b-41d4-a716-446655440001` |
| `access_right_id` | UUID | Foreign Key, Optional | Droit scanné valide | UUID de access_rights ou `null` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement tenté | UUID de events |
| `user_id` | UUID | Foreign Key, Optional | Utilisateur identifié | UUID de users ou `null` |
| `access_point_id` | UUID | Foreign Key, NOT NULL | Point d'accès | UUID de access_points |
| `zone_id` | UUID | Foreign Key, Optional | Zone tentée | UUID de venue_zones |
| `qr_code_scanned` | VARCHAR(100) | NOT NULL | QR scanné | `QR-2025-CA-EST-001234` |
| `action` | access_action | NOT NULL | Action tentée | `ENTRY`, `EXIT`, `RE_ENTRY` |
| `status` | access_status | NOT NULL | Résultat | `SUCCESS`, `DENIED`, `ERROR` |
| `denial_reason` | denial_reason | Optional | Raison refus | `ALREADY_USED`, `INVALID_QR`, `WRONG_EVENT` |
| `controller_id` | UUID | Foreign Key, NOT NULL | Agent contrôle | UUID de users (staff) |
| `device_id` | VARCHAR(100) | NOT NULL | Appareil scan | `SCANNER-A01`, `MOBILE-STAFF-05` |
| `scan_method` | VARCHAR(50) | NOT NULL | Méthode scan | `QR_SCANNER`, `MANUAL_ENTRY`, `NFC` |
| `response_time_ms` | INTEGER | Optional | Temps réponse ms | `145`, `89`, `1250` |
| `location` | JSONB | Optional | Géolocalisation | `{"lat": 36.8065, "lng": 10.1815}` |
| `weather_conditions` | VARCHAR(100) | Optional | Météo au scan | `Sunny 22°C`, `Rain 18°C` |
| `queue_size` | INTEGER | Optional | Taille file attente | `15`, `0`, `150` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `timestamp` | TIMESTAMPTZ | NOT NULL | Moment exact | `2025-02-15T18:45:30.123Z` |

#### **Exemples de données**

**Entrée réussie :**
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440001",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "access_point_id": "access_point_gate_a",
  "zone_id": "zone_tribune_nord",
  "qr_code_scanned": "QR-2025-CA-EST-001234",
  "action": "ENTRY",
  "status": "SUCCESS",
  "denial_reason": null,
  "controller_id": "staff_controller_001",
  "device_id": "SCANNER-A01",
  "scan_method": "QR_SCANNER",
  "response_time_ms": 145,
  "location": {
    "lat": 36.8065,
    "lng": 10.1815,
    "accuracy": 5
  },
  "weather_conditions": "Clear 20°C",
  "queue_size": 12,
  "metadata": {
    "user_details": {
      "name": "Ahmed Ben Ali",
      "age_verified": true,
      "photo_match": true
    },
    "ticket_details": {
      "type": "TRIBUNE",
      "purchase_date": "2025-01-15"
    },
    "entry_context": {
      "first_entry": true,
      "expected_zone": true,
      "vip_fast_track": false
    },
    "health_check": {
      "temperature": "36.5°C",
      "mask_worn": true
    }
  },
  "timestamp": "2025-02-15T18:45:30.145Z"
}
```

**Tentative refusée - Déjà utilisé :**
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440002",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "access_point_id": "access_point_gate_b",
  "zone_id": "zone_tribune_nord",
  "qr_code_scanned": "QR-2025-CA-EST-001234",
  "action": "RE_ENTRY",
  "status": "DENIED",
  "denial_reason": "ALREADY_USED",
  "controller_id": "staff_controller_002",
  "device_id": "SCANNER-B03",
  "scan_method": "QR_SCANNER",
  "response_time_ms": 89,
  "queue_size": 25,
  "metadata": {
    "previous_entry": {
      "time": "2025-02-15T18:45:30.145Z",
      "gate": "A",
      "controller": "staff_controller_001"
    },
    "denial_details": {
      "message_shown": "Billet déjà scanné à 18:45",
      "suggested_action": "Diriger vers guichet info"
    },
    "alert_raised": true,
    "supervisor_notified": "supervisor_001"
  },
  "timestamp": "2025-02-15T19:15:45.089Z"
}
```

**Tentative refusée - Mauvais événement :**
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440003",
  "access_right_id": null,
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "user_id": null,
  "access_point_id": "access_point_gate_a",
  "qr_code_scanned": "QR-2025-CA-CSS-005678",
  "action": "ENTRY",
  "status": "DENIED",
  "denial_reason": "WRONG_EVENT",
  "controller_id": "staff_controller_001",
  "device_id": "SCANNER-A01",
  "scan_method": "QR_SCANNER",
  "response_time_ms": 234,
  "queue_size": 8,
  "metadata": {
    "qr_details": {
      "valid_for_event": "880e8400-e29b-41d4-a716-446655440020",
      "event_date": "2025-03-25",
      "current_event": "Derby CA vs EST"
    },
    "user_reaction": "confused",
    "assistance_provided": true,
    "resolution": "Directed to ticket office"
  },
  "timestamp": "2025-02-15T17:30:22.234Z"
}
```

**Sortie enregistrée :**
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440004",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440005",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "user_id": "110e8400-e29b-41d4-a716-446655440002",
  "access_point_id": "access_point_exit_c",
  "zone_id": "zone_vip",
  "qr_code_scanned": "QR-VIP-2025-000156",
  "action": "EXIT",
  "status": "SUCCESS",
  "controller_id": "staff_controller_005",
  "device_id": "MOBILE-STAFF-05",
  "scan_method": "MANUAL_ENTRY",
  "response_time_ms": 567,
  "metadata": {
    "exit_reason": "halftime",
    "duration_inside": 2865,
    "re_entry_allowed": true,
    "vip_services_used": ["lounge", "bar"],
    "satisfaction_quick_poll": 5
  },
  "timestamp": "2025-02-15T19:45:15.567Z"
}
```

---

### **14. Table `zone_mapping_overrides`**

#### **Rôle de la table**
Gère les changements exceptionnels d'affectation de zones pour des événements spécifiques, des groupes d'utilisateurs ou des billets individuels.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `ee0e8400-e29b-41d4-a716-446655440001` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement concerné | UUID de events |
| `user_group_id` | UUID | Foreign Key, Optional | Groupe utilisateurs | UUID de groups ou `null` |
| `subscription_id` | UUID | Foreign Key, Optional | Abonnement spécifique | UUID de subscriptions ou `null` |
| `ticket_id` | UUID | Foreign Key, Optional | Billet spécifique | UUID de tickets ou `null` |
| `access_right_id` | UUID | Foreign Key, Optional | Droit spécifique | UUID de access_rights ou `null` |
| `original_zone_id` | UUID | Foreign Key, NOT NULL | Zone originale | UUID de venue_zones |
| `override_zone_id` | UUID | Foreign Key, NOT NULL | Nouvelle zone | UUID de venue_zones |
| `reason` | TEXT | NOT NULL | Motif du changement | `Travaux tribune nord` |
| `valid_from` | TIMESTAMPTZ | Optional | Début override | `2025-02-15T00:00:00Z` |
| `valid_until` | TIMESTAMPTZ | Optional | Fin override | `2025-02-15T23:59:59Z` |
| `capacity_impact` | INTEGER | Optional | Impact capacité | `-500`, `200` |
| `requires_notification` | BOOLEAN | Default: true | Notifier users | `true`, `false` |
| `notification_sent` | BOOLEAN | Default: false | Notif envoyée | `true`, `false` |
| `approved_by` | UUID | Foreign Key | Approuvé par | UUID utilisateur admin |
| `is_active` | BOOLEAN | Default: true | Override actif | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-02-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-02-10T15:00:00Z` |

#### **Exemples de données**

**Override pour travaux - Groupe complet :**
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440050",
  "user_group_id": "group_season_tribune_nord",
  "original_zone_id": "zone_tribune_nord",
  "override_zone_id": "zone_tribune_sud",
  "reason": "Travaux de rénovation tribune nord - Sécurité",
  "valid_from": "2025-04-01T00:00:00Z",
  "valid_until": "2025-04-30T23:59:59Z",
  "capacity_impact": -500,
  "requires_notification": true,
  "notification_sent": true,
  "approved_by": "admin_operations_001",
  "is_active": true,
  "metadata": {
    "work_type": "structural_renovation",
    "affected_sections": ["N1", "N2", "N3"],
    "total_seats_affected": 2500,
    "relocation_plan": {
      "priority_1": "equivalent_seats_south",
      "priority_2": "upgrade_to_premium",
      "compensation": "10% discount next season"
    },
    "communication": {
      "email_sent": "2025-03-15",
      "sms_sent": "2025-03-20",
      "app_notification": "2025-03-15"
    }
  }
}
```

**Override VIP exceptionnel - Ticket unique :**
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440002",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "ticket_id": "aa0e8400-e29b-41d4-a716-446655440100",
  "original_zone_id": "zone_gradins",
  "override_zone_id": "zone_tribune",
  "reason": "Upgrade VIP - Client fidèle 10 ans",
  "valid_from": "2025-02-15T17:00:00Z",
  "valid_until": "2025-02-15T23:59:59Z",
  "requires_notification": true,
  "notification_sent": true,
  "approved_by": "manager_vip_relations",
  "is_active": true,
  "metadata": {
    "upgrade_type": "loyalty_reward",
    "customer_details": {
      "member_since": "2015-01-01",
      "total_events": 287,
      "vip_score": 950
    },
    "special_services": {
      "welcome_desk": true,
      "complimentary_drink": true,
      "vip_escort": true
    },
    "cost_center": "marketing_loyalty"
  }
}
```

**Override sécurité derby - Déplacement supporters :**
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440003",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "user_group_id": "group_est_supporters",
  "original_zone_id": "zone_tribune_est_mixte",
  "override_zone_id": "zone_parcage_visiteurs",
  "reason": "Mesure sécurité derby - Séparation supporters",
  "valid_from": "2025-02-15T00:00:00Z",
  "valid_until": "2025-02-15T23:59:59Z",
  "capacity_impact": -1000,
  "requires_notification": true,
  "notification_sent": true,
  "approved_by": "security_manager_001",
  "is_active": true,
  "metadata": {
    "security_level": "maximum",
    "police_decision": true,
    "original_capacity": 2000,
    "reduced_capacity": 1000,
    "access_restrictions": {
      "dedicated_entrance": "Gate F",
      "arrival_window": "17:00-18:30",
      "police_escort": true,
      "search_level": "enhanced"
    },
    "communication_channels": ["sms", "email", "club_official"]
  }
}
```

---

### **15. Table `ticket_templates`**

#### **Rôle de la table**
Modèles de mise en page pour la génération des billets physiques ou électroniques, cartes d'abonnement et pass VIP.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `ff0e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(50) | Unique, NOT NULL | Code template | `TICKET_STANDARD_2025`, `SUB_CARD_VIP` |
| `name` | VARCHAR(100) | NOT NULL | Nom du template | `Billet Standard 2025`, `Carte Abonné VIP` |
| `description` | TEXT | Optional | Description | `Template billet avec QR code pour impression A4` |
| `type` | template_type | NOT NULL | Type template | `TICKET`, `SUBSCRIPTION_CARD`, `VIP_PASS` |
| `category` | VARCHAR(50) | Optional | Catégorie | `MATCH`, `CONCERT`, `GENERAL` |
| `format` | template_format | NOT NULL | Format sortie | `PDF`, `THERMAL`, `MOBILE`, `PLASTIC_CARD` |
| `paper_size` | VARCHAR(20) | Optional | Format papier | `A4`, `A5`, `THERMAL_80MM`, `CARD_86X54` |
| `orientation` | orientation_type | Default: PORTRAIT | Orientation | `PORTRAIT`, `LANDSCAPE` |
| `design_url` | TEXT | Optional | URL fichier design | `/templates/designs/ticket-standard-2025.html` |
| `css_url` | TEXT | Optional | URL styles CSS | `/templates/styles/ticket-standard.css` |
| `elements` | JSONB | NOT NULL | Éléments à afficher | Voir exemples |
| `layout` | JSONB | NOT NULL | Configuration layout | Voir exemples |
| `languages` | TEXT[] | Default: ['fr'] | Langues supportées | `["fr", "ar", "en"]` |
| `is_default` | BOOLEAN | Default: false | Template par défaut | `true`, `false` |
| `requires_printer` | VARCHAR(100) | Optional | Imprimante requise | `THERMAL_ZEBRA`, `LASER_COLOR` |
| `version` | VARCHAR(20) | NOT NULL | Version template | `1.0.0`, `2.1.3` |
| `is_active` | BOOLEAN | Default: true | Template actif | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-15T14:00:00Z` |

#### **Exemples de données**

**Template billet standard :**
```json
{
  "id": "ff0e8400-e29b-41d4-a716-446655440001",
  "code": "TICKET_STANDARD_2025",
  "name": "Billet Standard 2025",
  "description": "Template billet match football avec QR code, utilisable pour impression A4 ou envoi email",
  "type": "TICKET",
  "category": "MATCH",
  "format": "PDF",
  "paper_size": "A4",
  "orientation": "PORTRAIT",
  "design_url": "/templates/designs/ticket-standard-2025.html",
  "css_url": "/templates/styles/ticket-standard.css",
  "elements": {
    "header": {
      "logo": true,
      "club_name": true,
      "event_type": true
    },
    "main_info": {
      "event_title": true,
      "event_date": true,
      "event_time": true,
      "venue": true,
      "teams": true
    },
    "ticket_info": {
      "zone": true,
      "gate": true,
      "seat": true,
      "price": true,
      "ticket_type": true,
      "ticket_number": true
    },
    "qr_code": {
      "size": "large",
      "position": "center",
      "include_text": true
    },
    "footer": {
      "terms": true,
      "support_contact": true,
      "sponsors": true
    }
  },
  "layout": {
    "margins": {
      "top": 20,
      "right": 15,
      "bottom": 20,
      "left": 15
    },
    "sections": [
      {
        "id": "header",
        "height": "15%",
        "background": "#DC143C"
      },
      {
        "id": "main",
        "height": "60%",
        "columns": 2
      },
      {
        "id": "qr",
        "height": "20%",
        "align": "center"
      },
      {
        "id": "footer",
        "height": "5%",
        "font_size": "8pt"
      }
    ],
    "fonts": {
      "primary": "Arial",
      "secondary": "Helvetica"
    },
    "colors": {
      "primary": "#DC143C",
      "secondary": "#FFFFFF",
      "text": "#000000"
    }
  },
  "languages": ["fr", "ar"],
  "is_default": true,
  "version": "2.0.0",
  "is_active": true,
  "metadata": {
    "print_guidelines": {
      "dpi": 300,
      "color_mode": "CMYK",
      "bleed": 3
    },
    "security_features": [
      "unique_qr",
      "hologram_area",
      "microtext"
    ],
    "accessibility": {
      "high_contrast": true,
      "large_print_option": true
    }
  }
}
```

**Template carte abonné :**
```json
{
  "id": "ff0e8400-e29b-41d4-a716-446655440002",
  "code": "SUB_CARD_PLASTIC_2025",
  "name": "Carte Abonné Plastique 2025",
  "description": "Carte plastique format bancaire pour abonnés saison avec puce NFC",
  "type": "SUBSCRIPTION_CARD",
  "format": "PLASTIC_CARD",
  "paper_size": "CARD_86X54",
  "orientation": "LANDSCAPE",
  "elements": {
    "front": {
      "background_image": true,
      "club_logo": true,
      "season": true,
      "subscriber_photo": true,
      "subscriber_name": true,
      "subscriber_number": true,
      "card_type": true,
      "nfc_indicator": true
    },
    "back": {
      "qr_code": true,
      "barcode": true,
      "terms_summary": true,
      "emergency_contact": true,
      "validity_dates": true,
      "signature_area": true
    }
  },
  "layout": {
    "card_spec": {
      "width_mm": 85.6,
      "height_mm": 53.98,
      "thickness_mm": 0.76,
      "corner_radius_mm": 3.18
    },
    "safe_area": {
      "margin_mm": 3
    },
    "nfc_chip": {
      "position": "left_center",
      "visible": true
    },
    "design_zones": {
      "photo": {
        "x": 10,
        "y": 15,
        "width": 25,
        "height": 30
      },
      "main_text": {
        "x": 40,
        "y": 10,
        "width": 40,
        "height": 40
      }
    }
  },
  "requires_printer": "CARD_PRINTER_ZEBRA",
  "version": "1.2.0",
  "is_active": true,
  "metadata": {
    "material": "PVC",
    "encoding": {
      "nfc": true,
      "magnetic_stripe": false,
      "chip": true
    },
    "personalization": {
      "photo_required": true,
      "photo_spec": {
        "width": 300,
        "height": 400,
        "format": "JPEG",
        "max_size_kb": 500
      }
    },
    "production_time_days": 5,
    "min_order_quantity": 100
  }
}
```

**Template mobile pass :**
```json
{
  "id": "ff0e8400-e29b-41d4-a716-446655440003",
  "code": "MOBILE_PASS_2025",
  "name": "Pass Mobile Wallet",
  "description": "Billet dématérialisé pour Apple Wallet et Google Pay",
  "type": "TICKET",
  "format": "MOBILE",
  "elements": {
    "header": {
      "event_name": true,
      "event_date": true,
      "logo": true
    },
    "primary_fields": {
      "zone": true,
      "seat": true
    },
    "secondary_fields": {
      "doors_open": true,
      "gate": true
    },
    "auxiliary_fields": {
      "ticket_type": true,
      "price": true
    },
    "back_fields": {
      "terms": true,
      "venue_map": true,
      "transport_info": true
    },
    "barcode": {
      "format": "QR",
      "message": "dynamic",
      "encoding": "UTF-8"
    }
  },
  "layout": {
    "pass_type": "eventTicket",
    "format_version": 1,
    "team_identifier": "TN.tn.entrix",
    "background_color": "#DC143C",
    "foreground_color": "#FFFFFF",
    "label_color": "#FFFFFF",
    "locations": [
      {
        "latitude": 36.8065,
        "longitude": 10.1815,
        "relevant_text": "Stade proche!"
      }
    ]
  },
  "languages": ["fr", "ar", "en"],
  "version": "3.0.0",
  "is_active": true,
  "metadata": {
    "apple_wallet": {
      "pass_type_identifier": "pass.tn.entrix.ticket",
      "certificate": "apple_cert_2025"
    },
    "google_pay": {
      "issuer_id": "3388000000012345678",
      "class_suffix": "entrix_ticket"
    },
    "updates": {
      "push_enabled": true,
      "auto_update": true
    },
    "features": [
      "location_based_notification",
      "live_updates",
      "companion_app_link"
    ]
  }
}
```

---

### **16. Table `blacklist`**

#### **Rôle de la table**
Liste des QR codes, utilisateurs ou dispositifs interdits d'accès pour raisons de sécurité, fraude ou comportement.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `gg0e8400-e29b-41d4-a716-446655440001` |
| `blacklist_type` | blacklist_type | NOT NULL | Type d'interdiction | `USER`, `QR_CODE`, `DEVICE`, `IP` |
| `identifier` | VARCHAR(255) | NOT NULL | Identifiant bloqué | UUID user, QR code, Device ID |
| `reason` | TEXT | NOT NULL | Motif de blocage | `Fraude billets`, `Violence stade` |
| `severity` | severity_level | NOT NULL | Niveau gravité | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `scope` | blacklist_scope | NOT NULL | Portée du blocage | `EVENT`, `VENUE`, `GLOBAL` |
| `scope_id` | UUID | Optional | ID scope si limité | UUID event/venue ou `null` |
| `start_date` | TIMESTAMPTZ | NOT NULL | Début interdiction | `2025-02-20T10:00:00Z` |
| `end_date` | TIMESTAMPTZ | Optional | Fin interdiction | `2026-02-20T10:00:00Z`, `null` |
| `is_permanent` | BOOLEAN | Default: false | Interdiction permanente | `true`, `false` |
| `reported_by` | UUID | Foreign Key | Rapporté par | UUID utilisateur/staff |
| `approved_by` | UUID | Foreign Key | Approuvé par | UUID admin/manager |
| `evidence` | JSONB | Optional | Preuves/documents | `{"photos": [], "reports": []}` |
| `appeal_status` | appeal_status | Optional | Statut appel | `NONE`, `PENDING`, `REJECTED`, `ACCEPTED` |
| `is_active` | BOOLEAN | Default: true | Blocage actif | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-02-20T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-03-01T14:00:00Z` |

#### **Exemples de données**

**Utilisateur banni pour violence :**
```json
{
  "id": "gg0e8400-e29b-41d4-a716-446655440001",
  "blacklist_type": "USER",
  "identifier": "110e8400-e29b-41d4-a716-446655440099",
  "reason": "Violence physique envers supporters adverses lors du derby du 15/02/2025",
  "severity": "HIGH",
  "scope": "GLOBAL",
  "scope_id": null,
  "start_date": "2025-02-20T10:00:00Z",
  "end_date": "2027-02-20T10:00:00Z",
  "is_permanent": false,
  "reported_by": "security_staff_005",
  "approved_by": "security_manager_001",
  "evidence": {
    "incident_report": "IR-2025-02-15-001",
    "video_files": [
      "cam_a_18h45m30s.mp4",
      "cam_b_18h45m35s.mp4"
    ],
    "witness_statements": 3,
    "police_report": "PV-2025-1234"
  },
  "appeal_status": "PENDING",
  "is_active": true,
  "metadata": {
    "user_history": {
      "previous_incidents": 2,
      "member_since": "2018-01-01",
      "events_attended": 145
    },
    "incident_details": {
      "location": "Tribune Nord Sortie",
      "time": "18:45",
      "injured_parties": 1,
      "damage_assessment": "minor"
    },
    "legal_action": {
      "charges_pressed": true,
      "court_date": "2025-03-15"
    },
    "rehabilitation": {
      "eligible_date": "2026-02-20",
      "conditions": ["anger_management_course", "community_service"]
    }
  }
}
```

**QR Code frauduleux :**
```json
{
  "id": "gg0e8400-e29b-41d4-a716-446655440002",
  "blacklist_type": "QR_CODE",
  "identifier": "QR-FAKE-2025-XXX001",
  "reason": "QR code contrefait détecté - Tentative de fraude organisée",
  "severity": "CRITICAL",
  "scope": "GLOBAL",
  "start_date": "2025-03-01T14:30:00Z",
  "is_permanent": true,
  "reported_by": "scanner_ai_system",
  "approved_by": "fraud_team_lead",
  "evidence": {
    "detection_method": "ai_pattern_recognition",
    "similar_codes_found": 15,
    "attempted_entries": [
      {
        "date": "2025-03-01T19:15:00Z",
        "gate": "A",
        "device": "SCANNER-A01"
      },
      {
        "date": "2025-03-01T19:18:00Z",
        "gate": "B",
        "device": "SCANNER-B02"
      }
    ]
  },
  "is_active": true,
  "metadata": {
    "fraud_pattern": {
      "type": "counterfeit_series",
      "series_pattern": "QR-FAKE-2025-XXX*",
      "estimated_count": 100,
      "distribution_method": "social_media"
    },
    "investigation": {
      "status": "ongoing",
      "lead_investigator": "fraud_inv_001",
      "police_notified": true
    },
    "impact": {
      "revenue_loss_estimated": 5000,
      "events_affected": ["derby_2025", "match_important_2025"]
    }
  }
}
```

**Dispositif compromis :**
```json
{
  "id": "gg0e8400-e29b-41d4-a716-446655440003",
  "blacklist_type": "DEVICE",
  "identifier": "Android-HACK123456",
  "reason": "Dispositif utilisé pour multiples tentatives de piratage billetterie",
  "severity": "HIGH",
  "scope": "GLOBAL",
  "start_date": "2025-04-01T08:00:00Z",
  "is_permanent": false,
  "end_date": "2025-10-01T08:00:00Z",
  "reported_by": "security_monitoring_system",
  "approved_by": "it_security_manager",
  "evidence": {
    "attack_logs": [
      {
        "timestamp": "2025-04-01T03:45:12Z",
        "type": "brute_force",
        "target": "ticket_api",
        "attempts": 1523
      },
      {
        "timestamp": "2025-04-01T04:12:33Z",
        "type": "sql_injection",
        "target": "search_endpoint"
      }
    ],
    "ip_addresses": ["41.230.45.67", "197.15.23.89"],
    "user_agents": ["Modified-App/1.0", "Hacker-Tool/2.1"]
  },
  "is_active": true,
  "metadata": {
    "device_info": {
      "type": "Android",
      "model": "Unknown",
      "os_version": "Modified",
      "app_version": "Cracked"
    },
    "behavior_analysis": {
      "abnormal_patterns": ["rapid_requests", "token_manipulation"],
      "risk_score": 95
    },
    "mitigation": {
      "blocked_endpoints": ["all"],
      "rate_limit": 0,
      "honeypot_activated": true
    }
  }
}
```

---

## 📊 ÉNUMÉRATIONS DÉTAILLÉES

### Types de plans d'abonnement
```sql
CREATE TYPE subscription_plan_type AS ENUM (
    'FULL_SEASON',      -- Saison complète
    'HALF_SEASON',      -- Mi-saison
    'PACKAGE',          -- Package multi-sports/événements
    'FLEX',             -- Flexible (X matchs au choix)
    'MINI',             -- Mini abonnement (5-10 matchs)
    'VIP_ANNUAL'        -- VIP annuel tous événements
);
```

### Statuts d'abonnement
```sql
CREATE TYPE subscription_status AS ENUM (
    'PENDING',          -- En attente de paiement
    'ACTIVE',           -- Actif et valide
    'SUSPENDED',        -- Suspendu temporairement
    'EXPIRED',          -- Expiré
    'CANCELLED',        -- Annulé/Résilié
    'TRANSFERRED'       -- Transféré à un autre user
);
```

### Types de règles de prix
```sql
CREATE TYPE pricing_rule_type AS ENUM (
    'EARLY_BIRD',       -- Tarif anticipé
    'GROUP',            -- Tarif groupe
    'MEMBER',           -- Tarif membre/adhérent
    'STUDENT',          -- Tarif étudiant
    'SENIOR',           -- Tarif senior
    'CHILD',            -- Tarif enfant
    'DYNAMIC',          -- Tarification dynamique
    'PROMO',            -- Code promotionnel
    'PARTNER'           -- Tarif partenaire
);
```

### Types de remise
```sql
CREATE TYPE discount_type AS ENUM (
    'PERCENTAGE',       -- Pourcentage
    'FIXED_AMOUNT',     -- Montant fixe
    'BUY_X_GET_Y',      -- Offre quantité
    'BUNDLE'            -- Package/bundle
);
```

### Statuts de paiement
```sql
CREATE TYPE payment_status AS ENUM (
    'PENDING',          -- En attente
    'PROCESSING',       -- En cours
    'PAID',             -- Payé
    'FAILED',           -- Échec
    'REFUNDED',         -- Remboursé
    'PARTIALLY_REFUNDED', -- Remboursé partiellement
    'CANCELLED'         -- Annulé
);
```

### Statuts de réservation
```sql
CREATE TYPE booking_status AS ENUM (
    'PENDING',          -- En attente
    'CONFIRMED',        -- Confirmée
    'CANCELLED',        -- Annulée
    'EXPIRED',          -- Expirée
    'COMPLETED'         -- Complétée (événement passé)
);
```

### Statuts des droits d'accès
```sql
CREATE TYPE access_right_status AS ENUM (
    'ENABLED',          -- Actif et utilisable
    'USED',             -- Déjà utilisé
    'TRANSFERRED',      -- Transféré
    'CANCELLED',        -- Annulé
    'EXPIRED',          -- Expiré
    'BLOCKED'           -- Bloqué (sécurité)
);
```

### Types de source d'accès
```sql
CREATE TYPE access_source_type AS ENUM (
    'TICKET',           -- Billet unitaire
    'SUBSCRIPTION',     -- Abonnement
    'TRANSFER',         -- Transfert
    'COMP',             -- Invitation/gratuit
    'STAFF',            -- Personnel
    'MEDIA',            -- Presse/média
    'PARTNER'           -- Partenaire
);
```

### Types de transaction
```sql
CREATE TYPE access_transaction_type AS ENUM (
    'CREATE',           -- Création initiale
    'TRANSFER_SALE',    -- Transfert par vente
    'TRANSFER_DONATION', -- Transfert par don
    'TRANSFER_LOAN',    -- Prêt temporaire
    'TRANSFER_EXCHANGE', -- Échange
    'CANCEL',           -- Annulation
    'RESTORE',          -- Restauration
    'MODIFY',           -- Modification
    'BLOCK',            -- Blocage sécurité
    'UNBLOCK'           -- Déblocage
);
```

### Actions de contrôle d'accès
```sql
CREATE TYPE access_action AS ENUM (
    'ENTRY',            -- Entrée
    'EXIT',             -- Sortie
    'RE_ENTRY',         -- Ré-entrée
    'CHECK'             -- Vérification simple
);
```

### Statuts de contrôle d'accès
```sql
CREATE TYPE access_status AS ENUM (
    'SUCCESS',          -- Accès autorisé
    'DENIED',           -- Accès refusé
    'ERROR',            -- Erreur système
    'WARNING'           -- Autorisé avec avertissement
);
```

### Raisons de refus
```sql
CREATE TYPE denial_reason AS ENUM (
    'INVALID_QR',       -- QR invalide/inconnu
    'ALREADY_USED',     -- Déjà utilisé
    'WRONG_EVENT',      -- Mauvais événement
    'WRONG_DATE',       -- Mauvaise date
    'WRONG_ZONE',       -- Mauvaise zone
    'EXPIRED',          -- Expiré
    'NOT_YET_VALID',    -- Pas encore valide
    'BLACKLISTED',      -- Sur liste noire
    'CANCELLED',        -- Billet annulé
    'CAPACITY_FULL',    -- Capacité atteinte
    'AGE_RESTRICTION',  -- Restriction d'âge
    'TECHNICAL_ERROR'   -- Erreur technique
);
```

### Types de blacklist
```sql
CREATE TYPE blacklist_type AS ENUM (
    'USER',             -- Utilisateur
    'QR_CODE',          -- Code QR
    'DEVICE',           -- Appareil
    'IP',               -- Adresse IP
    'EMAIL',            -- Email
    'PHONE',            -- Téléphone
    'CREDIT_CARD'       -- Carte bancaire
);
```

### Portée de blacklist
```sql
CREATE TYPE blacklist_scope AS ENUM (
    'EVENT',            -- Un événement spécifique
    'VENUE',            -- Un lieu spécifique
    'CLUB',             -- Tous les événements du club
    'GLOBAL'            -- Toute la plateforme
);
```

---

## 🔄 RELATIONS ET LOGIQUE MÉTIER

### Flux d'achat de billet

1. **Sélection** : User choisit event + ticket_type
2. **Configuration** : Récupération `event_ticket_config` (prix, disponibilité)
3. **Règles de prix** : Application `pricing_rules` si éligible
4. **Création ticket** : Enregistrement dans `tickets`
5. **Paiement** : Traitement (module paiements)
6. **Génération accès** : Création `access_rights` avec QR unique
7. **Transaction log** : Enregistrement dans `access_transactions_log`
8. **Confirmation** : Envoi billet (email/app)

### Flux d'abonnement

1. **Choix plan** : Sélection `subscription_plans`
2. **Personnalisation** : Choix place attitrée si applicable
3. **Souscription** : Création dans `subscriptions`
4. **Génération masse** : Création N `access_rights` (1 par event du groupe)
5. **Activation** : Statut ACTIVE après paiement confirmé

### Flux de transfert

1. **Initiation** : User sélectionne access_right à transférer
2. **Conditions** : Vérification (transferts restants, restrictions)
3. **Transaction** :
   - Update status = 'TRANSFERRED' sur ancien
   - Create nouveau access_right pour destinataire
   - Log dans `access_transactions_log`
4. **Notification** : Avis aux deux parties
5. **Validation** : Nouveau QR actif, ancien invalide

### Flux de contrôle d'accès

1. **Scan QR** : Lecture du code au point d'accès
2. **Vérification** :
   ```sql
   SELECT * FROM access_rights 
   WHERE qr_code = ? 
   AND event_id = ?
   AND status = 'ENABLED'
   AND NOW() BETWEEN valid_from AND valid_until
   ```
3. **Contrôles additionnels** :
   - Blacklist check
   - Zone mapping overrides
   - Capacity check
4. **Décision** : SUCCESS ou DENIED avec raison
5. **Log** : Enregistrement dans `access_control_log`
6. **Action** : Ouverture tourniquet ou alerte

### Gestion des overrides

- Au contrôle, vérifier d'abord `zone_mapping_overrides`
- Appliquer la zone de substitution si trouvée
- Ordre de priorité : access_right > ticket > subscription > user_group

---

## 🎯 CAS D'USAGE COMPLEXES

### Derby avec restrictions

1. Configuration spéciale dans `event_ticket_config`
2. Limitation zones pour supporters adverses
3. `zone_mapping_overrides` pour séparer les fans
4. Blacklist renforcée (historique incidents)
5. Logs détaillés pour autorités

### Abonnement VIP multi-sports

1. Un `subscription_plan` couvre plusieurs `event_groups`
2. Génération access_rights pour TOUS les events (foot + basket) | TIMESTAMPTZ | Optional | Dernier transfert | `2025-11-20T15:30:00Z` |
| `activation_date` | TIMESTAMPTZ | Optional | Date d'activation | `2025-09-01T00:00:00Z` |
| `cancellation_date` | TIMESTAMPTZ | Optional | Date résiliation | `null`, `2026-01-15T10:00:00Z` |
| `cancellation_reason` | TEXT | Optional | Motif résiliation | `null`, `Déménagement` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-08-15T14:30:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-11-20T15:30:00Z` |
| `created_by` | UUID | Foreign Key | Créateur | UUID utilisateur/admin |

#### **Exemples de données**

**Abonnement tribune standard :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "subscription_number": "SUB-2025-001234",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440001",
  "seat_id": "seat_tribune_A_15_12",
  "price_paid": 405.00,
  "payment_id": "pay_2025_08_15_001234",
  "valid_from": "2025-09-01",
  "valid_until": "2026-05-31",
  "status": "ACTIVE",
  "auto_renew": true,
  "renewal_date": "2026-05-01",
  "transfers_used": 2,
  "last_transfer_date": "2025-11-20T15:30:00Z",
  "activation_date": "2025-09-01T00:00:00Z",
  "metadata": {
    "discount_applied": {
      "type": "early_bird",
      "amount": 45.00,
      "code": "EARLY10"
    },
    "seat_preferences": {
      "section": "A",
      "row_range": "10-20",
      "near_aisle": true
    },
    "companion_subscriptions": ["SUB-2025-001235", "SUB-2025-001236"],
    "payment_plan": "3x",
    "communication_preferences": {
      "sms": true,
      "email": true,
      "match_reminders": true
    },
    "printed_card": {
      "requested": true,
      "delivered": "2025-08-25",
      "delivery_method": "pickup"
    }
  }
}
```

**Abonnement VIP multi-sports :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440002",
  "subscription_number": "VIP-2025-0156",
  "user_id": "110e8400-e29b-41d4-a716-446655440002",
  "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440002",
  "seat_id": null,
  "price_paid": 2125.00,
  "payment_id": "pay_2025_06_10_005678",
  "valid_from": "2025-07-01",
  "valid_until": "2026-06-30",
  "status": "ACTIVE",
  "auto_renew": true,
  "transfers_used": 0,
  "activation_date": "2025-07-01T00:00:00Z",
  "metadata": {
    "vip_benefits_activated": {
      "parking_spot": "VIP-A-12",
      "lounge_access_code": "VIP156",
      "account_manager": "Sarah Martin",
      "welcome_gift_delivered": "2025-07-05"
    },
    "sports_preferences": {
      "primary": "football",
      "notifications": ["football", "basketball"]
    },
    "guest_list": [
      {
        "name": "Ahmed Ben Salem",
        "relation": "spouse",
        "id_number": "12345678"
      }
    ],
    "special_requests": "Végétarien pour les réceptions",
    "corporate_account": {
      "company": "Tech Solutions SA",
      "tax_id": "TN123456789"
    }
  }
}
```

**Abonnement flexible jeune :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440003",
  "subscription_number": "FLEX-2025-1456",
  "user_id": "110e8400-e29b-41d4-a716-446655440003",
  "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440003",
  "seat_id": null,
  "price_paid": 150.00,
  "payment_id": "pay_2025_09_20_007890",
  "valid_from": "2025-09-01",
  "valid_until": "2026-05-31",
  "status": "ACTIVE",
  "auto_renew": false,
  "transfers_used": 0,
  "metadata": {
    "student_verification": {
      "university": "Université de Tunis",
      "student_id": "TU2023456",
      "verified_date": "2025-09-20",
      "expires": "2026-07-31"
    },
    "matches_selection": {
      "total_allowed": 10,
      "used": 4,
      "booked": 2,
      "remaining": 4,
      "history": [
        {
          "event_id": "match_001",
          "date": "2025-09-15",
          "zone": "BASIC"
        },
        {
          "event_id": "match_005",
          "date": "2025-10-20",
          "zone": "STANDARD",
          "upgraded": true,
          "upgrade_fee": 5.00
        }
      ]
    },
    "restrictions_acknowledged": true
  }
}
```

---

### **6. Table `ticket_types`**

#### **Rôle de la table**
Catalogue des différents types de billets disponibles. Définit les caractéristiques réutilisables des billets sans être lié à un événement spécifique.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `770e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(50) | Unique, NOT NULL | Code technique | `TRIBUNE`, `CHAISES`, `VIP_MATCH` |
| `name` | VARCHAR(100) | NOT NULL | Nom commercial | `Tribune Principale`, `Chaises Confort` |
| `description` | TEXT | Optional | Description détaillée | `Accès tribune principale avec vue optimale` |
| `base_price` | DECIMAL(10,2) | NOT NULL | Prix de référence | `50.00`, `35.00`, `150.00` |
| `min_price` | DECIMAL(10,2) | Optional | Prix minimum | `40.00`, `null` |
| `max_price` | DECIMAL(10,2) | Optional | Prix maximum | `80.00`, `null` |
| `default_zone_category` | zone_category | NOT NULL | Catégorie zone | `PREMIUM`, `STANDARD`, `VIP` |
| `capacity_percentage` | DECIMAL(5,2) | Optional | % capacité zone | `80.00`, `100.00` |
| `max_per_transaction` | INTEGER | Default: 4 | Max par achat | `4`, `2`, `10` |
| `min_per_transaction` | INTEGER | Default: 1 | Min par achat | `1`, `2` |
| `advance_booking_days` | INTEGER | Optional | Jours résa avance | `30`, `7`, `null` |
| `cancellation_allowed` | BOOLEAN | Default: false | Annulation possible | `true`, `false` |
| `transfer_allowed` | BOOLEAN | Default: true | Transfert possible | `true`, `false` |
| `restrictions` | JSONB | Optional | Restrictions | `{"min_age": 16, "requires_id": true}` |
| `benefits` | JSONB | Optional | Avantages inclus | `{"program": true, "parking": false}` |
| `display_order` | INTEGER | Default: 0 | Ordre affichage | `10`, `20`, `30` |
| `is_active` | BOOLEAN | Default: true | Type actif | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-20T15:00:00Z` |

#### **Exemples de données**

**Billet Tribune :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440001",
  "code": "TRIBUNE",
  "name": "Tribune Principale",
  "description": "Place assise en tribune principale avec excellente vue sur le terrain. Accès par entrées A et B.",
  "base_price": 50.00,
  "min_price": 40.00,
  "max_price": 80.00,
  "default_zone_category": "PREMIUM",
  "capacity_percentage": 100.00,
  "max_per_transaction": 4,
  "min_per_transaction": 1,
  "advance_booking_days": 30,
  "cancellation_allowed": true,
  "transfer_allowed": true,
  "restrictions": {
    "min_age": null,
    "requires_id": true,
    "no_away_colors": true
  },
  "benefits": {
    "match_program": true,
    "parking_discount": 50,
    "merchandise_discount": 10
  },
  "display_order": 20,
  "is_active": true,
  "metadata": {
    "seating_type": "individual",
    "covered": true,
    "amenities": ["toilets", "food_stands", "merchandise"],
    "gates": ["A", "B"],
    "recommended_arrival": "1 hour before",
    "view_quality": "excellent"
  }
}
```

**Billet VIP Match :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "code": "VIP_MATCH",
  "name": "Pass VIP Match",
  "description": "Expérience VIP complète avec accès lounge, hospitalité premium et meilleures places.",
  "base_price": 200.00,
  "min_price": 180.00,
  "max_price": 350.00,
  "default_zone_category": "VIP",
  "capacity_percentage": 90.00,
  "max_per_transaction": 10,
  "min_per_transaction": 1,
  "advance_booking_days": 45,
  "cancellation_allowed": true,
  "transfer_allowed": true,
  "restrictions": {
    "min_age": 18,
    "dress_code": "smart_casual",
    "requires_id": true
  },
  "benefits": {
    "vip_lounge": true,
    "complimentary_parking": true,
    "food_beverage_included": true,
    "match_program": true,
    "gift_bag": true,
    "dedicated_host": true
  },
  "display_order": 10,
  "is_active": true,
  "metadata": {
    "vip_services": {
      "welcome_drink": true,
      "gourmet_buffet": true,
      "premium_bar": true,
      "halftime_service": true
    },
    "access_times": {
      "lounge_opens": "2 hours before",
      "lounge_closes": "1 hour after"
    },
    "exclusive_entrance": "VIP Gate",
    "seat_type": "leather_premium",
    "networking_area": true
  }
}
```

**Billet Gradins Populaire :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440003",
  "code": "GRADINS",
  "name": "Gradins Populaires",
  "description": "Places en gradins pour une ambiance authentique et passionnée. Idéal pour les groupes de supporters.",
  "base_price": 20.00,
  "min_price": 15.00,
  "max_price": 35.00,
  "default_zone_category": "BASIC",
  "capacity_percentage": 100.00,
  "max_per_transaction": 10,
  "min_per_transaction": 1,
  "advance_booking_days": 7,
  "cancellation_allowed": false,
  "transfer_allowed": true,
  "restrictions": {
    "min_age": 16,
    "unaccompanied_minors": false
  },
  "benefits": {
    "atmosphere": "authentic",
    "standing_allowed": true
  },
  "display_order": 30,
  "is_active": true,
  "metadata": {
    "seating_type": "benches",
    "covered": false,
    "supporter_section": true,
    "drums_allowed": true,
    "flags_allowed": true,
    "security_check": "enhanced",
    "recommended_for": ["ultras", "youth", "groups"]
  }
}
```

---

### **7. Table `ticket_type_zones`**

#### **Rôle de la table**
Table de liaison définissant quelles zones sont accessibles avec chaque type de billet. Permet à un billet de donner accès à plusieurs zones.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `ticket_type_id` | UUID | Foreign Key, NOT NULL | Type de billet | UUID de ticket_types |
| `zone_category` | zone_category | NOT NULL | Catégorie de zone | `PREMIUM`, `STANDARD`, `VIP` |
| `is_primary` | BOOLEAN | Default: true | Zone principale | `true`, `false` |
| `access_type` | VARCHAR(50) | Default: FULL | Type d'accès | `FULL`, `LIMITED`, `CONDITIONAL` |
| `conditions` | JSONB | Optional | Conditions d'accès | `{"time_limit": "halftime"}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-01T10:00:00Z` |

#### **Exemples de données**

```json
[
  {
    "ticket_type_id": "770e8400-e29b-41d4-a716-446655440001",
    "zone_category": "PREMIUM",
    "is_primary": true,
    "access_type": "FULL",
    "conditions": null
  },
  {
    "ticket_type_id": "770e8400-e29b-41d4-a716-446655440002",
    "zone_category": "VIP",
    "is_primary": true,
    "access_type": "FULL",
    "conditions": null
  },
  {
    "ticket_type_id": "770e8400-e29b-41d4-a716-446655440002",
    "zone_category": "PREMIUM",
    "is_primary": false,
    "access_type": "LIMITED",
    "conditions": {
      "reason": "VIP overflow seating",
      "requires_vip_band": true
    }
  },
  {
    "ticket_type_id": "770e8400-e29b-41d4-a716-446655440002",
    "zone_category": "COMPLIMENTARY",
    "is_primary": false,
    "access_type": "FULL",
    "conditions": {
      "areas": ["vip_lounge", "vip_parking", "vip_restaurant"]
    }
  }
]
```

---

### **8. Table `event_ticket_config`**

#### **Rôle de la table**
Configuration spécifique de la billetterie pour chaque événement. Définit quels types de billets sont disponibles, à quel prix et en quelle quantité.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `880e8400-e29b-41d4-a716-446655440001` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement concerné | UUID de events |
| `ticket_type_id` | UUID | Foreign Key, NOT NULL | Type de billet | UUID de ticket_types |
| `price` | DECIMAL(10,2) | NOT NULL | Prix pour cet événement | `80.00`, `250.00` |
| `quantity_total` | INTEGER | NOT NULL | Quantité totale | `5000`, `200` |
| `quantity_sold` | INTEGER | Default: 0 | Quantité vendue | `3542`, `0` |
| `quantity_reserved` | INTEGER | Default: 0 | Quantité réservée | `200`, `50` |
| `quantity_blocked` | INTEGER | Default: 0 | Quantité bloquée | `100`, `0` |
| `sales_start` | TIMESTAMPTZ | Optional | Début ventes | `2025-01-15T10:00:00Z` |
| `sales_end` | TIMESTAMPTZ | Optional | Fin ventes | `2025-02-15T18:00:00Z` |
| `early_bird_end` | TIMESTAMPTZ | Optional | Fin tarif préférentiel | `2025-01-31T23:59:59Z` |
| `min_purchase` | INTEGER | Default: 1 | Achat minimum | `1`, `2` |
| `max_purchase` | INTEGER | Optional | Achat maximum | `4`, `10`, `null` |
| `requires_membership` | BOOLEAN | Default: false | Adhésion requise | `true`, `false` |
| `member_only_until` | TIMESTAMPTZ | Optional | Exclusivité membres | `2025-01-20T10:00:00Z` |
| `zone_mapping` | JSONB | Optional | Mapping zones spécifique | `{"PREMIUM": ["Tribune_A", "Tribune_B"]}` |
| `dynamic_pricing` | BOOLEAN | Default: false | Tarification dynamique | `true`, `false` |
| `price_tiers` | JSONB | Optional | Paliers de prix | Voir exemples |
| `is_active` | BOOLEAN | Default: true | Config active | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-01-15T14:00:00Z` |

#### **Exemples de données**

**Configuration derby - Tribune :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "ticket_type_id": "770e8400-e29b-41d4-a716-446655440001",
  "price": 80.00,
  "quantity_total": 5000,
  "quantity_sold": 4850,
  "quantity_reserved": 100,
  "quantity_blocked": 50,
  "sales_start": "2025-01-15T10:00:00Z",
  "sales_end": "2025-02-15T18:00:00Z",
  "early_bird_end": "2025-01-31T23:59:59Z",
  "min_purchase": 1,
  "max_purchase": 4,
  "requires_membership": false,
  "member_only_until": "2025-01-20T10:00:00Z",
  "zone_mapping": {
    "PREMIUM": ["tribune_nord", "tribune_sud"],
    "excluded_sections": ["tribune_nord_visiteurs"]
  },
  "dynamic_pricing": true,
  "price_tiers": [
    {
      "from": 0,
      "to": 1000,
      "price": 60.00,
      "label": "Early bird"
    },
    {
      "from": 1001,
      "to": 3000,
      "price": 70.00,
      "label": "Regular"
    },
    {
      "from": 3001,
      "to": 5000,
      "price": 80.00,
      "label": "Last minute"
    }
  ],
  "is_active": true,
  "metadata": {
    "event_importance": "derby",
    "expected_demand": "very_high",
    "security_level": "maximum",
    "allocation_rules": {
      "home_fans": 4500,
      "away_fans": 400,
      "neutral": 100
    },
    "special_conditions": "ID obligatoire, pas de couleurs adverses"
  }
}
```

**Configuration match amical - Gradins :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440002",
  "event_id": "880e8400-e29b-41d4-a716-446655440002",
  "ticket_type_id": "770e8400-e29b-41d4-a716-446655440003",
  "price": 15.00,
  "quantity_total": 8000,
  "quantity_sold": 2340,
  "quantity_reserved": 0,
  "quantity_blocked": 0,
  "sales_start": "2025-03-01T10:00:00Z",
  "sales_end": "2025-03-20T20:00:00Z",
  "min_purchase": 1,
  "max_purchase": 20,
  "requires_membership": false,
  "dynamic_pricing": false,
  "is_active": true,
  "metadata": {
    "event_type": "friendly",
    "promotion": {
      "group_discount": {
        "10+": 20,
        "20+": 30
      },
      "youth_price": 10.00
    },
    "expected_attendance": "medium"
  }
}
```

---

### **9. Table `pricing_rules`**

#### **Rôle de la table**
Règles de tarification dynamique et promotions applicables aux billets et abonnements. Permet de gérer les remises conditionnelles.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `990e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(50) | Unique, NOT NULL | Code règle | `EARLY_BIRD_20`, `GROUP_10PLUS` |
| `name` | VARCHAR(100) | NOT NULL | Nom de la règle | `Early Bird -20%`, `Groupe 10+` |
| `description` | TEXT | Optional | Description détaillée | `20% de réduction pour achat anticipé` |
| `rule_type` | pricing_rule_type | NOT NULL | Type de règle | `EARLY_BIRD`, `GROUP`, `MEMBER`, `PROMO` |
| `applies_to` | VARCHAR(50) | NOT NULL | Application | `TICKETS`, `SUBSCRIPTIONS`, `BOTH` |
| `discount_type` | discount_type | NOT NULL | Type remise | `PERCENTAGE`, `FIXED_AMOUNT` |
| `discount_value` | DECIMAL(10,2) | NOT NULL | Valeur remise | `20.00`, `5.00` |
| `conditions` | JSONB | NOT NULL | Conditions d'application | Voir exemples |
| `valid_from` | TIMESTAMPTZ | Optional | Début validité | `2025-01-01T00:00:00Z` |
| `valid_until` | TIMESTAMPTZ | Optional | Fin validité | `2025-12-31T23:59:59Z` |
| `usage_limit_total` | INTEGER | Optional | Limite totale | `1000`, `null` |
| `usage_limit_per_user` | INTEGER | Optional | Limite par user | `1`, `5`, `null` |
| `usage_count` | INTEGER | Default: 0 | Utilisations | `523`, `0` |
| `combinable` | BOOLEAN | Default: false | Cumulable | `true`, `false` |
| `priority` | INTEGER | Default: 0 | Priorité application | `10`, `20`, `30` |
| `promo_code` | VARCHAR(50) | Optional | Code promo | `SUMMER20`, `VIP2025` |
| `auto_apply` | BOOLEAN | Default: false | Application auto | `true`, `false` |
| `is_active` | BOOLEAN | Default: true | Règle active | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-20T15:00:00Z` |

#### **Exemples de données**

**Règle Early Bird :**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440001",
  "code": "EARLY_BIRD_20",
  "name": "Early Bird -20%",
  "description": "20% de réduction pour les achats effectués au moins 30 jours avant l'événement",
  "rule_type": "EARLY_BIRD",
  "applies_to": "TICKETS",
  "discount_type": "PERCENTAGE",
  "discount_value": 20.00,
  "conditions": {
    "days_before_event": 30,
    "ticket_types": ["TRIBUNE", "CHAISES"],
    "excluded_events": ["derby"],
    "min_quantity": 1,
    "max_quantity": 10
  },
  "valid_from": "2025-01-01T00:00:00Z",
  "valid_until": "2025-12-31T23:59:59Z",
  "usage_limit_total": null,
  "usage_limit_per_user": 5,
  "usage_count": 1234,
  "combinable": false,
  "priority": 20,
  "auto_apply": true,
  "is_active": true,
  "metadata": {
    "marketing_campaign": "increase_early_sales",
    "target_audience": "price_sensitive",
    "expected_revenue_impact": "+15%"
  }
}
```

**Règle Groupe :**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440002",
  "code": "GROUP_10PLUS",
  "name": "Tarif Groupe 10+",
  "description": "15% de réduction pour les groupes de 10 personnes ou plus",
  "rule_type": "GROUP",
  "applies_to": "BOTH",
  "discount_type": "PERCENTAGE",
  "discount_value": 15.00,
  "conditions": {
    "min_quantity": 10,
    "max_quantity": 50,
    "same_ticket_type": true,
    "same_event": true,
    "payment_deadline": 72
  },
  "valid_from": "2025-01-01T00:00:00Z",
  "valid_until": "2025-12-31T23:59:59Z",
  "usage_limit_total": null,
  "usage_limit_per_user": 2,
  "usage_count": 89,
  "combinable": false,
  "priority": 15,
  "auto_apply": true,
  "is_active": true,
  "metadata": {
    "target_groups": ["schools", "companies", "associations"],
    "requires_validation": true,
    "contact_required": true
  }
}
```

**Règle Code Promo :**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440003",
  "code": "MEMBER_VIP_2025",
  "name": "Réduction Membres VIP",
  "description": "30% de réduction exclusive pour les membres VIP sur les abonnements",
  "rule_type": "MEMBER",
  "applies_to": "SUBSCRIPTIONS",
  "discount_type": "PERCENTAGE",
  "discount_value": 30.00,
  "conditions": {
    "required_groups": ["VIP_2024", "VIP_2025"],
    "subscription_plans": ["SEASON_TRIBUNE_2025", "SEASON_CHAISES_2025"],
    "min_membership_days": 365
  },
  "valid_from": "2025-06-01T00:00:00Z",
  "valid_until": "2025-07-31T23:59:59Z",
  "usage_limit_total": 500,
  "usage_limit_per_user": 1,
  "usage_count": 234,
  "combinable": true,
  "priority": 10,
  "promo_code": "VIP2025",
  "auto_apply": false,
  "is_active": true,
  "metadata": {
    "loyalty_program": true,
    "notification_sent": "2025-05-25",
    "expected_conversion": "70%"
  }
}
```

---

### **10. Table `tickets`**

#### **Rôle de la table**
Instance d'un billet acheté ou réservé par un utilisateur. Représente l'acte d'achat et génère les droits d'accès correspondants.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `aa0e8400-e29b-41d4-a716-446655440001` |
| `ticket_number` | VARCHAR(50) | Unique, NOT NULL | Numéro de billet | `TKT-2025-001234` |
| `user_id` | UUID | Foreign Key, NOT NULL | Acheteur | UUID de users |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement | UUID de events |
| `ticket_type_id` | UUID | Foreign Key, NOT NULL | Type de billet | UUID de ticket_types |
| `event_ticket_config_id` | UUID | Foreign Key | Config tarif | UUID de event_ticket_config |
| `quantity` | INTEGER | NOT NULL, Check > 0 | Nombre de billets | `1`, `4`, `10` |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Prix unitaire | `50.00`, `40.00` |
| `total_price` | DECIMAL(10,2) | NOT NULL | Prix total | `50.00`, `160.00` |
| `discount_amount` | DECIMAL(10,2) | Default: 0 | Montant remise | `10.00`, `0.00` |
| `pricing_rule_id` | UUID | Foreign Key, Optional | Règle appliquée | UUID de pricing_rules |
| `payment_id` | UUID | Foreign Key, Optional | Référence paiement | UUID de payments |
| `payment_status` | payment_status | NOT NULL | Statut paiement | `PAID`, `PENDING`, `FAILED` |
| `booking_status` | booking_status | NOT NULL | Statut réservation | `CONFIRMED`, `CANCELLED`, `EXPIRED` |
| `booking_expires_at` | TIMESTAMPTZ | Optional | Expiration résa | `2025-01-15T10:30:00Z` |
| `purchase_channel` | VARCHAR(50) | NOT NULL | Canal d'achat | `WEB`, `MOBILE`, `ONSITE`, `PARTNER` |
| `purchase_ip` | INET | Optional | IP d'achat | `41.226.11.226` |
| `is_guest_purchase` | BOOLEAN | Default: false | Achat invité | `true`, `false` |
| `guest_email` | VARCHAR(255) | Optional | Email invité | `guest@example.com` |
| `guest_phone` | VARCHAR(20) | Optional | Téléphone invité | `+216 98 765 432` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-15T14:30:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-01-15T14:35:00Z` |
| `confirmed_at` | TIMESTAMPTZ | Optional | Date confirmation | `2025-01-15T14:35:00Z` |
| `cancelled_at` | TIMESTAMPTZ | Optional | Date annulation | `null`, `2025-01-16T10:00:00Z` |
| `cancellation_reason` | TEXT | Optional | Motif annulation | `null`, `Client request` |

#### **Exemples de données**

**Achat simple 1 billet :**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440001",
  "ticket_number": "TKT-2025-001234",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "ticket_type_id": "770e8400-e29b-41d4-a716-446655440001",
  "event_ticket_config_id": "880e8400-e29b-41d4-a716-446655440001",
  "quantity": 1,
  "unit_price": 80.00,
  "total_price": 80.00,
  "discount_amount": 0.00,
  "payment_id": "pay_2025_01_15_001234",
  "payment_status": "PAID",
  "booking_status": "CONFIRMED",
  "purchase_channel": "WEB",
  "purchase_ip": "41.226.11.226",
  "is_guest_purchase": false,
  "confirmed_at": "2025-01-15T14:35:00Z",
  "metadata": {
    "browser": "Chrome 120",
    "device": "Desktop",
    "referrer": "google.com",
    "session_duration": 234,
    "payment_method": "credit_card",
    "seat_preferences": {
      "zone": "tribune_nord",
      "section": "A",
      "row_preference": "middle"
    }
  }
}
```

**Achat groupe avec remise :**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440002",
  "ticket_number": "TKT-2025-002345",
  "user_id": "110e8400-e29b-41d4-a716-446655440002",
  "event_id": "880e8400-e29b-41d4-a716-446655440002",
  "ticket_type_id": "770e8400-e29b-41d4-a716-446655440003",
  "event_ticket_config_id": "880e8400-e29b-41d4-a716-446655440002",
  "quantity": 15,
  "unit_price": 15.00,
  "total_price": 191.25,
  "discount_amount": 33.75,
  "pricing_rule_id": "990e8400-e29b-41d4-a716-446655440002",
  "payment_id": "pay_2025_03_10_002345",
  "payment_status": "PAID",
  "booking_status": "CONFIRMED",
  "purchase_channel": "MOBILE",
  "is_guest_purchase": false,
  "confirmed_at": "2025-03-10T16:20:00Z",
  "metadata": {
    "group_details": {
      "group_name": "Association Jeunesse Tunis",
      "contact_person": "Mohamed Salah",
      "contact_phone": "+216 98 123 456"
    },
    "discount_details": {
      "rule": "GROUP_10PLUS",
      "original_total": 225.00,
      "discount_percentage": 15,
      "final_total": 191.25
    },
    "distribution_method": "email",
    "special_requirements": "Seated together"
  }
}
```

**Réservation en attente paiement :**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440003",
  "ticket_number": "TKT-2025-003456",
  "user_id": null,
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "ticket_type_id": "770e8400-e29b-41d4-a716-446655440002",
  "quantity": 2,
  "unit_price": 200.00,
  "total_price": 400.00,
  "discount_amount": 0.00,
  "payment_status": "PENDING",
  "booking_status": "PENDING",
  "booking_expires_at": "2025-02-10T15:30:00Z",
  "purchase_channel": "PARTNER",
  "is_guest_purchase": true,
  "guest_email": "vip.client@company.tn",
  "guest_phone": "+216 71 234 567",
  "metadata": {
    "partner": "corporate_sales",
    "partner_reference": "CS-2025-789",
    "invoice_required": true,
    "company_details": {
      "name": "Tech Corp SA",
      "tax_id": "TN1234567",
      "address": "Lac 2, Tunis"
    },
    "hold_reason": "awaiting_approval",
    "vip_requirements": {
      "dietary": ["halal", "vegetarian"],
      "parking": 2,
      "special_access": true
    }
  }
}
```

---

### **11. Table `access_rights`**

#### **Rôle de la table**
Table centrale unifiée contenant TOUS les droits d'accès physiques aux événements. Chaque ligne représente un QR code unique donnant droit à un accès. Cette table unifie les accès issus de billets, abonnements, transferts, invitations, etc.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `bb0e8400-e29b-41d4-a716-446655440001` |
| `qr_code` | VARCHAR(100) | Unique, NOT NULL | Code QR unique | `QR-2025-CA-EST-001234` |
| `user_id` | UUID | Foreign Key, NOT NULL | Bénéficiaire actuel | UUID de users |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement concerné | UUID de events |
| `zone_id` | UUID | Foreign Key | Zone autorisée | UUID de venue_zones |
| `seat_id` | UUID | Foreign Key, Optional | Place spécifique | UUID de seats ou `null` |
| `status` | access_right_status | NOT NULL | Statut actuel | `ENABLED`, `USED`, `TRANSFERRED` |
| `source_type` | access_source_type | NOT NULL | Origine du droit | `TICKET`, `SUBSCRIPTION`, `TRANSFER` |
| `source_id` | UUID | NOT NULL | ID source | UUID ticket/subscription |
| `original_user_id` | UUID | Foreign Key | Propriétaire original | UUID de users |
| `transfer_count` | INTEGER | Default: 0 | Nombre de transferts | `0`, `1`, `2` |
| `last_transfer_date` | TIMESTAMPTZ | Optional | Dernier transfert | `2025-03-15T10:30:00Z`, `null` |
| `valid_from` | TIMESTAMPTZ | NOT NULL | Début validité | `2025-02-15T17:00:00Z` |
| `valid_until` | TIMESTAMPTZ | NOT NULL | Fin validité | `2025-02-15T23:59:59Z` |
| `used_at` | TIMESTAMPTZ | Optional | Date utilisation | `2025-02-15T18:45:30Z`, `null` |
| `used_at_access_point` | UUID | Foreign Key, Optional | Point d'accès utilisé | UUID de access_points |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-15T14:35:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-02-10T15:30:00Z` |
| `created_by` | UUID | Foreign Key | Créateur | UUID utilisateur/système |

#### **Exemples de données**

**Droit d'accès issu d'un billet :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440001",
  "qr_code": "QR-2025-CA-EST-001234",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "zone_id": "zone_tribune_nord",
  "seat_id": null,
  "status": "ENABLED",
  "source_type": "TICKET",
  "source_id": "aa0e8400-e29b-41d4-a716-446655440001",
  "original_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "transfer_count": 0,
  "valid_from": "2025-02-15T17:00:00Z",
  "valid_until": "2025-02-15T23:59:59Z",
  "metadata": {
    "ticket_type": "TRIBUNE",
    "price_paid": 80.00,
    "purchase_date": "2025-01-15T14:35:00Z",
    "gate_access": ["A", "B"],
    "special_conditions": "ID required"
  }
}
```

**Droit d'accès issu d'un abonnement :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440002",
  "qr_code": "QR-SUB-2025-001234-M15",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440015",
  "zone_id": "zone_tribune_principale",
  "seat_id": "seat_tribune_A_15_12",
  "status": "ENABLED",
  "source_type": "SUBSCRIPTION",
  "source_id": "660e8400-e29b-41d4-a716-446655440001",
  "original_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "transfer_count": 0,
  "valid_from": "2025-03-20T17:00:00Z",
  "valid_until": "2025-03-20T23:59:59Z",
  "metadata": {
    "subscription_number": "SUB-2025-001234",
    "subscription_type": "SEASON_TRIBUNE",
    "match_number": 15,
    "season": "2025-2026",
    "seat_info": {
      "section": "A",
      "row": "15",
      "seat": "12"
    }
  }
}
```

**Droit d'accès transféré :**
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440003",
  "qr_code": "QR-2025-CA-CSS-005678",
  "user_id": "110e8400-e29b-41d4-a716-446655440005",
  "event_id": "880e8400-e29b-41d4-a716-446655440020",
  "zone_id": "zone_tribune_sud",
  "seat_id": null,
  "status": "ENABLED",
  "source_type": "TRANSFER",
  "source_id": "bb0e8400-e29b-41d4-a716-446655440004",
  "original_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "transfer_count": 1,
  "last_transfer_date": "2025-03-15T10:30:00Z",
  "valid_from": "2025-03-25T17:00:00Z",
  "valid_until": "2025-03-25T23:59:59Z",
  "metadata": {
    "transfer_details": {
      "from_user": "110e8400-e29b-41d4-a716-446655440001",
      "to_user": "110e8400-e29b-41d4-a716-446655440005",
      "transfer_type": "DONATION",
      "transfer_date": "2025-03-15T10:30:00Z",
      "reason": "Cannot attend",
      "original_source": "SUBSCRIPTION"
    },
    "original_subscription": "SUB-2025-001234",
    "restrictions": {
      "no_retransfer": true,
      "id_check_required": true
    }
  }
}
```

---

### **12. Table `access_transactions_log`**

#### **Rôle de la table**
Journal complet de toutes les opérations effectuées sur les droits d'accès. Assure la traçabilité de chaque action (création, transfert, annulation, etc.).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `cc0e8400-e29b-41d4-a716-446655440001` |
| `access_right_id` | UUID | Foreign Key, NOT NULL | Droit concerné | UUID de access_rights |
| `transaction_type` | access_transaction_type | NOT NULL | Type d'opération | `CREATE`, `TRANSFER_SALE`, `CANCEL` |
| `from_user_id` | UUID | Foreign Key, Optional | Utilisateur source | UUID de users ou `null` |
| `to_user_id` | UUID | Foreign Key, Optional | Utilisateur destination | UUID de users ou `null` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement concerné | UUID de events |
| `price` | DECIMAL(10,2) | Optional | Prix si vente | `50.00`, `0.00`, `null` |
| `currency` | VARCHAR(3) | Default: TND | Devise | `TND`, `EUR`, `USD` |
| `reason` | TEXT | Optional | Motif de l'opération | `Empêchement personnel`, `Upgrade VIP` |
| `ip_address` | INET | Optional | IP de l'opération | `41.226.11.226` |
| `user_agent` | TEXT | Optional | Navigateur/app | `Mozilla/5.0...` |
| `device_id` | VARCHAR(100) | Optional | ID appareil | `iPhone-ABC123`, `Android-XYZ789` |
| `location` | JSONB | Optional | Géolocalisation | `{"lat": 36.8065, "lng": 10.1815}` |
| `status` | transaction_status | NOT NULL | Statut transaction | `SUCCESS`, `FAILED`, `PENDING` |
| `error_message` | TEXT | Optional | Message d'erreur | `null`, `Payment failed` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date opération | `2025-02-10T14:30:00Z` |
| `created_by` | UUID | Foreign Key | Initiateur | UUID utilisateur/système |

#### **Exemples de données**

**Création suite à achat billet :**
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440001",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440001",
  "transaction_type": "CREATE",
  "from_user_id": null,
  "to_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "price": 80.00,
  "currency": "TND",
  "reason": "Ticket purchase",
  "ip_address": "41.226.11.226",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "status": "SUCCESS",
  "metadata": {
    "source": "TICKET",
    "ticket_id": "aa0e8400-e29b-41d4-a716-446655440001",
    "ticket_type": "TRIBUNE",
    "payment_method": "credit_card",
    "platform": "web",
    "session_id": "sess_2025_01_15_xyz"
  }
}
```

**Transfert par vente :**
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440002",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440003",
  "transaction_type": "TRANSFER_SALE",
  "from_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "to_user_id": "110e8400-e29b-41d4-a716-446655440005",
  "event_id": "880e8400-e29b-41d4-a716-446655440020",
  "price": 65.00,
  "currency": "TND",
  "reason": "Revente - empêchement professionnel",
  "status": "SUCCESS",
  "metadata": {
    "original_price": 50.00,
    "profit": 15.00,
    "platform_fee": 3.25,
    "net_to_seller": 59.80
  }
}
```

---

### **13. Table `access_control_log`**

#### **Rôle de la table**
Journal de toutes les tentatives d'accès physique aux événements. Enregistre chaque scan de QR code avec le résultat et les détails.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `dd0e8400-e29b-41d4-a716-446655440001` |
| `access_right_id` | UUID | Foreign Key, Optional | Droit scanné valide | UUID de access_rights ou `null` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement tenté | UUID de events |
| `user_id` | UUID | Foreign Key, Optional | Utilisateur identifié | UUID de users ou `null` |
| `access_point_id` | UUID | Foreign Key, NOT NULL | Point d'accès | UUID de access_points |
| `zone_id` | UUID | Foreign Key, Optional | Zone tentée | UUID de venue_zones |
| `qr_code_scanned` | VARCHAR(100) | NOT NULL | QR scanné | `QR-2025-CA-EST-001234` |
| `action` | access_action | NOT NULL | Action tentée | `ENTRY`, `EXIT`, `RE_ENTRY` |
| `status` | access_status | NOT NULL | Résultat | `SUCCESS`, `DENIED`, `ERROR` |
| `denial_reason` | denial_reason | Optional | Raison refus | `ALREADY_USED`, `INVALID_QR`, `WRONG_EVENT` |
| `controller_id` | UUID | Foreign Key, NOT NULL | Agent contrôle | UUID de users (staff) |
| `device_id` | VARCHAR(100) | NOT NULL | Appareil scan | `SCANNER-A01`, `MOBILE-STAFF-05` |
| `scan_method` | VARCHAR(50) | NOT NULL | Méthode scan | `QR_SCANNER`, `MANUAL_ENTRY`, `NFC` |
| `response_time_ms` | INTEGER | Optional | Temps réponse ms | `145`, `89`, `1250` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `timestamp` | TIMESTAMPTZ | NOT NULL | Moment exact | `2025-02-15T18:45:30.123Z` |

#### **Exemples de données**

**Entrée réussie :**
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440001",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "access_point_id": "access_point_gate_a",
  "zone_id": "zone_tribune_nord",
  "qr_code_scanned": "QR-2025-CA-EST-001234",
  "action": "ENTRY",
  "status": "SUCCESS",
  "controller_id": "staff_controller_001",
  "device_id": "SCANNER-A01",
  "scan_method": "QR_SCANNER",
  "response_time_ms": 145,
  "metadata": {
    "user_details": {
      "name": "Ahmed Ben Ali",
      "age_verified": true
    },
    "entry_context": {
      "first_entry": true,
      "expected_zone": true
    }
  },
  "timestamp": "2025-02-15T18:45:30.145Z"
}
```

**Tentative refusée - Déjà utilisé :**
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440002",
  "access_right_id": "bb0e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "qr_code_scanned": "QR-2025-CA-EST-001234",
  "action": "RE_ENTRY",
  "status": "DENIED",
  "denial_reason": "ALREADY_USED",
  "controller_id": "staff_controller_002",
  "device_id": "SCANNER-B03",
  "metadata": {
    "previous_entry": {
      "time": "2025-02-15T18:45:30.145Z",
      "gate": "A"
    }
  },
  "timestamp": "2025-02-15T19:15:45.089Z"
}
```

---

### **14. Table `zone_mapping_overrides`**

#### **Rôle de la table**
Gère les changements exceptionnels d'affectation de zones pour des événements spécifiques, des groupes d'utilisateurs ou des billets individuels.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `ee0e8400-e29b-41d4-a716-446655440001` |
| `event_id` | UUID | Foreign Key, NOT NULL | Événement concerné | UUID de events |
| `user_group_id` | UUID | Foreign Key, Optional | Groupe utilisateurs | UUID de groups ou `null` |
| `subscription_id` | UUID | Foreign Key, Optional | Abonnement spécifique | UUID de subscriptions ou `null` |
| `ticket_id` | UUID | Foreign Key, Optional | Billet spécifique | UUID de tickets ou `null` |
| `access_right_id` | UUID | Foreign Key, Optional | Droit spécifique | UUID de access_rights ou `null` |
| `original_zone_id` | UUID | Foreign Key, NOT NULL | Zone originale | UUID de venue_zones |
| `override_zone_id` | UUID | Foreign Key, NOT NULL | Nouvelle zone | UUID de venue_zones |
| `reason` | TEXT | NOT NULL | Motif du changement | `Travaux tribune nord` |
| `valid_from` | TIMESTAMPTZ | Optional | Début override | `2025-02-15T00:00:00Z` |
| `valid_until` | TIMESTAMPTZ | Optional | Fin override | `2025-02-15T23:59:59Z` |
| `capacity_impact` | INTEGER | Optional | Impact capacité | `-500`, `200` |
| `requires_notification` | BOOLEAN | Default: true | Notifier users | `true`, `false` |
| `notification_sent` | BOOLEAN | Default: false | Notif envoyée | `true`, `false` |
| `approved_by` | UUID | Foreign Key | Approuvé par | UUID utilisateur admin |
| `is_active` | BOOLEAN | Default: true | Override actif | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-02-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-02-10T15:00:00Z` |

---

### **15. Table `ticket_templates`**

#### **Rôle de la table**
Modèles de mise en page pour la génération des billets physiques ou électroniques, cartes d'abonnement et pass VIP.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `ff0e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(50) | Unique, NOT NULL | Code template | `TICKET_STANDARD_2025`, `SUB_CARD_VIP` |
| `name` | VARCHAR(100) | NOT NULL | Nom du template | `Billet Standard 2025`, `Carte Abonné VIP` |
| `type` | template_type | NOT NULL | Type template | `TICKET`, `SUBSCRIPTION_CARD`, `VIP_PASS` |
| `format` | template_format | NOT NULL | Format sortie | `PDF`, `THERMAL`, `MOBILE`, `PLASTIC_CARD` |
| `elements` | JSONB | NOT NULL | Éléments à afficher | Configuration des champs |
| `layout` | JSONB | NOT NULL | Configuration layout | Mise en page |
| `is_active` | BOOLEAN | Default: true | Template actif | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Configuration technique |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-01-01T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-15T14:00:00Z` |

---

### **16. Table `blacklist`**

#### **Rôle de la table**
Liste des QR codes, utilisateurs ou dispositifs interdits d'accès pour raisons de sécurité, fraude ou comportement.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `gg0e8400-e29b-41d4-a716-446655440001` |
| `blacklist_type` | blacklist_type | NOT NULL | Type d'interdiction | `USER`, `QR_CODE`, `DEVICE`, `IP` |
| `identifier` | VARCHAR(255) | NOT NULL | Identifiant bloqué | UUID user, QR code, Device ID |
| `reason` | TEXT | NOT NULL | Motif de blocage | `Fraude billets`, `Violence stade` |
| `severity` | severity_level | NOT NULL | Niveau gravité | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `scope` | blacklist_scope | NOT NULL | Portée du blocage | `EVENT`, `VENUE`, `GLOBAL` |
| `start_date` | TIMESTAMPTZ | NOT NULL | Début interdiction | `2025-02-20T10:00:00Z` |
| `end_date` | TIMESTAMPTZ | Optional | Fin interdiction | `2026-02-20T10:00:00Z`, `null` |
| `is_permanent` | BOOLEAN | Default: false | Interdiction permanente | `true`, `false` |
| `is_active` | BOOLEAN | Default: true | Blocage actif | `true`, `false` |
| `metadata` | JSONB | Optional | Données additionnelles | Preuves, détails |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-02-20T10:00:00Z` |

---

## 📊 ÉNUMÉRATIONS DÉTAILLÉES

### Types de plans d'abonnement
```sql
CREATE TYPE subscription_plan_type AS ENUM (
    'FULL_SEASON',      -- Saison complète
    'HALF_SEASON',      -- Mi-saison
    'PACKAGE',          -- Package multi-sports/événements
    'FLEX',             -- Flexible (X matchs au choix)
    'MINI',             -- Mini abonnement (5-10 matchs)
    'VIP_ANNUAL'        -- VIP annuel tous événements
);
```

### Statuts d'abonnement
```sql
CREATE TYPE subscription_status AS ENUM (
    'PENDING',          -- En attente de paiement
    'ACTIVE',           -- Actif et valide
    'SUSPENDED',        -- Suspendu temporairement
    'EXPIRED',          -- Expiré
    'CANCELLED',        -- Annulé/Résilié
    'TRANSFERRED'       -- Transféré à un autre user
);
```

### Statuts des droits d'accès
```sql
CREATE TYPE access_right_status AS ENUM (
    'ENABLED',          -- Actif et utilisable
    'USED',             -- Déjà utilisé
    'TRANSFERRED',      -- Transféré
    'CANCELLED',        -- Annulé
    'EXPIRED',          -- Expiré
    'BLOCKED'           -- Bloqué (sécurité)
);
```

### Types de source d'accès
```sql
CREATE TYPE access_source_type AS ENUM (
    'TICKET',           -- Billet unitaire
    'SUBSCRIPTION',     -- Abonnement
    'TRANSFER',         -- Transfert
    'COMP',             -- Invitation/gratuit
    'STAFF',            -- Personnel
    'MEDIA',            -- Presse/média
    'PARTNER'           -- Partenaire
);
```

### Types de transaction
```sql
CREATE TYPE access_transaction_type AS ENUM (
    'CREATE',           -- Création initiale
    'TRANSFER_SALE',    -- Transfert par vente
    'TRANSFER_DONATION', -- Transfert par don
    'CANCEL',           -- Annulation
    'RESTORE',          -- Restauration
    'MODIFY',           -- Modification
    'BLOCK',            -- Blocage sécurité
    'UNBLOCK'           -- Déblocage
);
```

### Actions de contrôle d'accès
```sql
CREATE TYPE access_action AS ENUM (
    'ENTRY',            -- Entrée
    'EXIT',             -- Sortie
    'RE_ENTRY',         -- Ré-entrée
    'CHECK'             -- Vérification simple
);
```

### Statuts de contrôle d'accès
```sql
CREATE TYPE access_status AS ENUM (
    'SUCCESS',          -- Accès autorisé
    'DENIED',           -- Accès refusé
    'ERROR',            -- Erreur système
    'WARNING'           -- Autorisé avec avertissement
);
```

### Raisons de refus
```sql
CREATE TYPE denial_reason AS ENUM (
    'INVALID_QR',       -- QR invalide/inconnu
    'ALREADY_USED',     -- Déjà utilisé
    'WRONG_EVENT',      -- Mauvais événement
    'WRONG_DATE',       -- Mauvaise date
    'WRONG_ZONE',       -- Mauvaise zone
    'EXPIRED',          -- Expiré
    'NOT_YET_VALID',    -- Pas encore valide
    'BLACKLISTED',      -- Sur liste noire
    'CANCELLED',        -- Billet annulé
    'CAPACITY_FULL',    -- Capacité atteinte
    'AGE_RESTRICTION',  -- Restriction d'âge
    'TECHNICAL_ERROR'   -- Erreur technique
);
```

---

## 🔄 RELATIONS ET LOGIQUE MÉTIER

### Flux d'achat de billet

1. **Sélection** : User choisit event + ticket_type
2. **Configuration** : Récupération `event_ticket_config` (prix, disponibilité)
3. **Règles de prix** : Application `pricing_rules` si éligible
4. **Création ticket** : Enregistrement dans `tickets`
5. **Paiement** : Traitement (module paiements)
6. **Génération accès** : Création `access_rights` avec QR unique
7. **Transaction log** : Enregistrement dans `access_transactions_log`
8. **Confirmation** : Envoi billet (email/app)

### Flux d'abonnement

1. **Choix plan** : Sélection `subscription_plans`
2. **Personnalisation** : Choix place attitrée si applicable
3. **Souscription** : Création dans `subscriptions`
4. **Génération masse** : Création N `access_rights` (1 par event du groupe)
5. **Activation** : Statut ACTIVE après paiement confirmé

### Flux de transfert

1. **Initiation** : User sélectionne access_right à transférer
2. **Conditions** : Vérification (transferts restants, restrictions)
3. **Transaction** :
   - Update status = 'TRANSFERRED' sur ancien
   - Create nouveau access_right pour destinataire
   - Log dans `access_transactions_log`
4. **Notification** : Avis aux deux parties
5. **Validation** : Nouveau QR actif, ancien invalide

### Flux de contrôle d'accès

1. **Scan QR** : Lecture du code au point d'accès
2. **Vérification** :
   ```sql
   SELECT * FROM access_rights 
   WHERE qr_code = ? 
   AND event_id = ?
   AND status = 'ENABLED'
   AND NOW() BETWEEN valid_from AND valid_until
   ```
3. **Contrôles additionnels** :
   - Blacklist check
   - Zone mapping overrides
   - Capacity check
4. **Décision** : SUCCESS ou DENIED avec raison
5. **Log** : Enregistrement dans `access_control_log`
6. **Action** : Ouverture tourniquet ou alerte

---

## 🎯 CAS D'USAGE COMPLEXES

### Derby avec restrictions

1. Configuration spéciale dans `event_ticket_config`
2. Limitation zones pour supporters adverses
3. `zone_mapping_overrides` pour séparer les fans
4. Blacklist renforcée (historique incidents)
5. Logs détaillés pour autorités

### Abonnement VIP multi-sports

1. Un `subscription_plan` couvre plusieurs `event_groups`
2. Génération access_rights pour TOUS les events (foot + basket)
3. Zones VIP universelles avec `ticket_type_zones`
4. Services premium dans metadata

### Revente marketplace

1. Transfer avec `TRANSFER_SALE`
2. Prix libre mais plafonné (metadata event)
3. Commission plateforme
4. Escrow automatique
5. Nouveau QR pour acheteur

---

**Ce module billetterie offre une gestion complète du cycle de vie des droits d'accès avec traçabilité maximale et flexibilité pour tous les cas d'usage business d'une plateforme d'événements moderne.**