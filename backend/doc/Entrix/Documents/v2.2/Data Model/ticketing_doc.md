# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Billeterie

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel gère l'écosystème complet de billetterie d'Entrix V3.0, incluant les innovations majeures : **abonnements anonymes**, **tickets sans utilisateur** et **clés d'onboarding**. Il constitue le cœur commercial de la plateforme.

### Innovations V3.0
- **🎫 Billeterie anonyme** : Création tickets sans user_id obligatoire
- **🔐 Onboarding intelligent** : Clés secrètes dans metadata pour conversion
- **🎪 Abonnements flexibles** : Plans avec ou sans utilisateur associé
- **📱 QR codes universels** : Codes d'accès fonctionnels en mode anonyme

### Principes de conception
- **Flexibilité maximale** : Support utilisateurs enregistrés ET anonymes
- **Conversion intelligente** : Mécanismes d'incitation à l'inscription
- **Traçabilité complète** : Audit de toutes les transactions
- **Évolutivité** : Passage fluide anonyme → enregistré

---

## 🎟️ Table `subscription_plans` - Plans d'abonnements

**Description** : Catalogue des plans d'abonnements créés par les organisateurs (cartes supporters, pass saison, forfaits multi-événements).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur créateur |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | - | Code plan unique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom commercial |
| `display_name` | VARCHAR(200) | NULL | - | Nom d'affichage |
| `description` | TEXT | NOT NULL | - | Description détaillée |
| `short_description` | VARCHAR(500) | NULL | - | Description courte |
| `type` | ENUM | NOT NULL | - | Type d'abonnement |
| `category` | ENUM | NOT NULL | - | Catégorie principale |
| `duration_type` | ENUM | NOT NULL | - | Type durée |
| `duration_value` | INTEGER | NOT NULL | - | Valeur durée |
| `price` | DECIMAL(10,2) | NOT NULL | - | Prix de vente |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `max_subscribers` | INTEGER | NULL | - | Limite souscripteurs |
| `current_subscribers` | INTEGER | NOT NULL | 0 | Souscripteurs actuels |
| `min_age` | INTEGER | NULL | - | Âge minimum |
| `max_age` | INTEGER | NULL | - | Âge maximum |
| `valid_from` | DATE | NOT NULL | - | Début validité |
| `valid_until` | DATE | NOT NULL | - | Fin validité |
| `sale_start_date` | DATE | NULL | - | Début ventes |
| `sale_end_date` | DATE | NULL | - | Fin ventes |
| `early_bird_price` | DECIMAL(10,2) | NULL | - | Prix early bird |
| `early_bird_until` | DATE | NULL | - | Fin early bird |
| `renewal_price` | DECIMAL(10,2) | NULL | - | Prix renouvellement |
| `renewal_discount` | DECIMAL(5,2) | NULL | - | Remise renouvellement |
| `transferable` | BOOLEAN | NOT NULL | FALSE | Transférable |
| `max_transfers` | INTEGER | DEFAULT 0 | 0 | Nombre max transferts |
| `transfer_fee` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Frais transfert |
| `refundable` | BOOLEAN | NOT NULL | FALSE | Remboursable |
| `refund_policy` | TEXT | NULL | - | Politique remboursement |
| `auto_renew` | BOOLEAN | NOT NULL | FALSE | Renouvellement auto |
| `grace_period_days` | INTEGER | DEFAULT 0 | 0 | Période grâce |
| `includes_playoffs` | BOOLEAN | NOT NULL | FALSE | Inclut phases finales |
| `priority_booking` | BOOLEAN | NOT NULL | FALSE | Réservation prioritaire |
| `guest_privileges` | BOOLEAN | NOT NULL | FALSE | Privilèges invités |
| `max_guests` | INTEGER | DEFAULT 0 | 0 | Maximum invités |
| `parking_included` | BOOLEAN | NOT NULL | FALSE | Parking inclus |
| `merchandise_discount` | DECIMAL(5,2) | DEFAULT 0 | 0.00 | Remise merchandising |
| `benefits` | JSONB | NOT NULL | - | Avantages inclus |
| `restrictions` | JSONB | NULL | - | Restrictions d'usage |
| `terms_conditions` | TEXT | NULL | - | Conditions générales |
| `metadata` | JSONB | NULL | - | Métadonnées flexibles |
| `featured_image_url` | TEXT | NULL | - | Image plan |

### Structure JSONB `metadata` avec onboarding

```json
{
  "plan_details": {
    "tier": "premium",
    "benefits_priority": ["parking", "hospitality", "early_access"]
  },
  "onboarding": {
    "secret_key": "ONB-2025-PLAN-ABC123",
    "campaign_id": "sports_season_2025",
    "incentive_type": "LOYALTY_POINTS",
    "incentive_value": 500,
    "description": "500 points bonus à l'inscription",
    "expires_at": "2025-03-31T23:59:59Z",
    "used": false,
    "communication_sent": true,
    "contact_method": "email"
  },
  "marketing": {
    "source": "website",
    "campaign": "early_bird_2025",
    "utm_parameters": {
      "source": "email",
      "medium": "newsletter",
      "campaign": "season_launch"
    }
  }
}
```
| `brochure_url` | TEXT | NULL | - | Brochure PDF |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Plan actif |
| `is_featured` | BOOLEAN | NOT NULL | FALSE | Plan vedette |
| `is_hidden` | BOOLEAN | NOT NULL | FALSE | Plan masqué |
| `display_order` | INTEGER | DEFAULT 0 | 0 | Ordre affichage |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `type`
- `SEASON_PASS` : Pass saison complète
- `MULTI_EVENT` : Multi-événements
- `VIP_MEMBERSHIP` : Adhésion VIP
- `SUPPORTER_CARD` : Carte supporter
- `CORPORATE_PACKAGE` : Package entreprise
- `STUDENT_PLAN` : Plan étudiant
- `FAMILY_PLAN` : Plan familial
- `GROUP_PACKAGE` : Package groupe
- `PREMIUM_ACCESS` : Accès premium
- `EARLY_ACCESS` : Accès anticipé
- `EXCLUSIVE_CONTENT` : Contenu exclusif
- `HOSPITALITY` : Hospitalité

#### `category`
- `SPORTS` : Sports
- `MUSIC` : Musique
- `THEATER` : Théâtre
- `CULTURE` : Culture
- `BUSINESS` : Business
- `MIXED` : Mixte

#### `duration_type`
- `DAYS` : Jours
- `WEEKS` : Semaines
- `MONTHS` : Mois
- `YEARS` : Années
- `SEASON` : Saison
- `EVENTS` : Nombre événements
- `UNLIMITED` : Illimité



---

## 🎫 Table `subscriptions` - Abonnements souscrits

**Description** : **TABLE MODIFIÉE** - Instances d'abonnements souscrits, supportant désormais les abonnements anonymes avec clés d'onboarding.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `subscription_number` | VARCHAR(50) | UNIQUE, NOT NULL | - | Numéro abonnement |
| `plan_id` | UUID | NOT NULL, FK | - | Plan souscrit |
| `user_id` | UUID | **NULL**, FK | **NULL** | **MODIFIÉ** : Utilisateur (nullable) |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur (référence) |
| `guest_name` | VARCHAR(200) | NULL | - | **NOUVEAU** : Nom si anonyme |
| `guest_email` | VARCHAR(255) | NULL | - | **NOUVEAU** : Email si anonyme |
| `guest_phone` | VARCHAR(20) | NULL | - | **NOUVEAU** : Téléphone anonyme |
| `status` | ENUM | NOT NULL | 'PENDING' | Statut abonnement |
| `start_date` | DATE | NOT NULL | - | Début abonnement |
| `end_date` | DATE | NOT NULL | - | Fin abonnement |
| `auto_renew_enabled` | BOOLEAN | NOT NULL | FALSE | Renouvellement auto |
| `next_billing_date` | DATE | NULL | - | Prochaine facturation |
| `price_paid` | DECIMAL(10,2) | NOT NULL | - | Prix payé |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `payment_method` | ENUM | NULL | - | Méthode paiement |
| `discount_applied` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Remise appliquée |
| `coupon_code` | VARCHAR(50) | NULL | - | Code promo utilisé |
| `transfers_used` | INTEGER | NOT NULL | 0 | Transferts utilisés |
| `guests_used` | INTEGER | NOT NULL | 0 | Invités utilisés |
| `events_attended` | INTEGER | NOT NULL | 0 | Événements fréquentés |
| `total_savings` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Économies réalisées |
| `subscriber_benefits` | JSONB | NULL | - | Avantages personnalisés |
| `usage_statistics` | JSONB | NULL | - | Statistiques usage |
| `renewal_history` | JSONB | NULL | - | Historique renouvellements |
| `feedback_scores` | JSONB | NULL | - | Scores satisfaction |
| `special_conditions` | TEXT | NULL | - | Conditions spéciales |
| `notes` | TEXT | NULL | - | Notes internes |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `activated_at` | TIMESTAMPTZ | NULL | - | Date activation |

### Structure JSONB `metadata` avec onboarding

```json
{
  "subscription_details": {
    "auto_renewal_preference": true,
    "preferred_contact_time": "evening",
    "special_requirements": ["wheelchair_access"]
  },
  "onboarding": {
    "secret_key": "ONB-2025-SUB-DEF456", 
    "campaign_id": "vip_membership_2025",
    "incentive_type": "FREE_UPGRADE",
    "incentive_value": 0,
    "description": "Upgrade gratuit vers VIP Premium",
    "expires_at": "2025-06-30T23:59:59Z", 
    "used": false,
    "communication_sent": true,
    "contact_method": "email"
  },
  "analytics": {
    "acquisition_channel": "referral",
    "referrer_id": "user_123",
    "conversion_time": 1440
  }
}
```
| `suspended_at` | TIMESTAMPTZ | NULL | - | Date suspension |
| `cancelled_at` | TIMESTAMPTZ | NULL | - | Date annulation |
| `cancellation_reason` | TEXT | NULL | - | Raison annulation |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM `status`

- `PENDING` : En attente activation
- `ACTIVE` : Actif
- `SUSPENDED` : Suspendu temporairement
- `EXPIRED` : Expiré
- `CANCELLED` : Annulé
- `REFUNDED` : Remboursé
- `TRANSFERRED` : Transféré
- `RENEWED` : Renouvelé

---

## 🎪 Table `ticket_types` - Types de billets

**Description** : Catalogue des types de billets disponibles avec tarification et conditions.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `event_id` | UUID | NOT NULL, FK | - | Événement concerné |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur créateur |
| `zone_id` | VARCHAR(255) | NULL, FK | - | Zone venue |
| `name` | VARCHAR(200) | NOT NULL | - | Nom type billet |
| `display_name` | VARCHAR(200) | NULL | - | Nom d'affichage |
| `description` | TEXT | NULL | - | Description type |
| `category` | ENUM | NOT NULL | - | Catégorie billet |
| `access_level` | ENUM | NOT NULL | 'STANDARD' | Niveau d'accès |
| `base_price` | DECIMAL(10,2) | NOT NULL | - | Prix de base |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `early_bird_price` | DECIMAL(10,2) | NULL | - | Prix early bird |
| `early_bird_until` | TIMESTAMPTZ | NULL | - | Fin early bird |
| `group_price` | DECIMAL(10,2) | NULL | - | Prix groupe |
| `group_minimum` | INTEGER | NULL | - | Minimum groupe |
| `student_price` | DECIMAL(10,2) | NULL | - | Prix étudiant |
| `senior_price` | DECIMAL(10,2) | NULL | - | Prix senior |
| `child_price` | DECIMAL(10,2) | NULL | - | Prix enfant |
| `total_quantity` | INTEGER | NOT NULL | - | Quantité totale |
| `available_quantity` | INTEGER | NOT NULL | - | Quantité disponible |
| `reserved_quantity` | INTEGER | DEFAULT 0 | 0 | Quantité réservée |
| `sold_quantity` | INTEGER | DEFAULT 0 | 0 | Quantité vendue |
| `max_per_order` | INTEGER | DEFAULT 10 | 10 | Maximum par commande |
| `min_per_order` | INTEGER | DEFAULT 1 | 1 | Minimum par commande |
| `requires_approval` | BOOLEAN | NOT NULL | FALSE | Nécessite approbation |
| `transferable` | BOOLEAN | NOT NULL | TRUE | Transférable |
| `refundable` | BOOLEAN | NOT NULL | TRUE | Remboursable |
| `sale_start` | TIMESTAMPTZ | NULL | - | Début ventes |
| `sale_end` | TIMESTAMPTZ | NULL | - | Fin ventes |
| `age_restrictions` | JSONB | NULL | - | Restrictions âge |
| `special_requirements` | TEXT[] | NULL | - | Exigences spéciales |
| `benefits_included` | JSONB | NULL | - | Avantages inclus |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Type actif |
| `is_hidden` | BOOLEAN | NOT NULL | FALSE | Masqué public |
| `display_order` | INTEGER | DEFAULT 0 | 0 | Ordre affichage |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `category`
- `GENERAL_ADMISSION` : Admission générale
- `RESERVED_SEATING` : Place réservée
- `VIP` : VIP
- `PREMIUM` : Premium
- `STUDENT` : Étudiant
- `SENIOR` : Senior
- `CHILD` : Enfant
- `GROUP` : Groupe
- `COMPLIMENTARY` : Gratuit
- `PRESS` : Presse
- `STAFF` : Personnel
- `SPONSOR` : Sponsor

#### `access_level`
- `STANDARD` : Standard
- `PREMIUM` : Premium
- `VIP` : VIP
- `ALL_ACCESS` : Accès total
- `RESTRICTED` : Restreint
- `BACKSTAGE` : Coulisses
- `HOSPITALITY` : Hospitalité

---

## 🎟️ Table `tickets` - Billets individuels

**Description** : **TABLE MODIFIÉE** - Billets individuels supportant les achats anonymes avec clés d'onboarding.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `ticket_number` | VARCHAR(50) | UNIQUE, NOT NULL | - | Numéro billet |
| `event_id` | UUID | NOT NULL, FK | - | Événement |
| `ticket_type_id` | UUID | NOT NULL, FK | - | Type billet |
| `user_id` | UUID | **NULL**, FK | **NULL** | **MODIFIÉ** : Utilisateur (nullable) |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur (référence) |
| `order_id` | UUID | NOT NULL, FK | - | Commande |
| `zone_id` | VARCHAR(255) | NULL, FK | - | Zone venue |
| `seat_id` | UUID | NULL, FK | - | Siège assigné |
| `guest_name` | VARCHAR(200) | NULL | - | **NOUVEAU** : Nom si anonyme |
| `guest_email` | VARCHAR(255) | NULL | - | **NOUVEAU** : Email si anonyme |
| `guest_phone` | VARCHAR(20) | NULL | - | **NOUVEAU** : Téléphone anonyme |
| `status` | ENUM | NOT NULL | 'VALID' | Statut billet |
| `price_paid` | DECIMAL(10,2) | NOT NULL | - | Prix payé |
| `base_price` | DECIMAL(10,2) | NOT NULL | - | Prix de base |
| `fees` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Frais additionnels |
| `taxes` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Taxes |
| `discount_amount` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Montant remise |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `coupon_code` | VARCHAR(50) | NULL | - | Code promo |
| `source_channel` | ENUM | NOT NULL | 'DIRECT' | Canal vente |
| `affiliate_code` | VARCHAR(50) | NULL | - | Code affilié |
| `special_requirements` | TEXT[] | NULL | - | Exigences spéciales |
| `dietary_restrictions` | TEXT[] | NULL | - | Restrictions alimentaires |
| `accessibility_needs` | TEXT[] | NULL | - | Besoins accessibilité |
| `companion_info` | JSONB | NULL | - | Info accompagnateur |
| `upgrade_history` | JSONB | NULL | - | Historique upgrades |
| `transfer_history` | JSONB | NULL | - | Historique transferts |
| `usage_log` | JSONB | NULL | - | Log utilisation |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `notes` | TEXT | NULL | - | Notes |

### Structure JSONB `metadata` avec onboarding

```json
{
  "purchase_details": {
    "source": "mobile_app",
    "device": "iOS",
    "payment_attempts": 1,
    "checkout_duration": 180
  },
  "onboarding": {
    "secret_key": "ONB-2025-TKT-XYZ789",
    "campaign_id": "concert_series_spring",
    "incentive_type": "DISCOUNT_PERCENT", 
    "incentive_value": 25.0,
    "description": "25% de réduction sur votre prochain achat",
    "expires_at": "2025-04-30T23:59:59Z",
    "used": false,
    "communication_sent": true,
    "contact_method": "sms"
  },
  "preferences": {
    "notification_consent": true,
    "language": "fr",
    "timezone": "Africa/Tunis"
  }
}
```
| `issued_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date émission |
| `validated_at` | TIMESTAMPTZ | NULL | - | Date validation |
| `used_at` | TIMESTAMPTZ | NULL | - | Date utilisation |
| `transferred_at` | TIMESTAMPTZ | NULL | - | Date transfert |
| `cancelled_at` | TIMESTAMPTZ | NULL | - | Date annulation |
| `refunded_at` | TIMESTAMPTZ | NULL | - | Date remboursement |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Billet actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `status`
- `VALID` : Valide
- `USED` : Utilisé
- `TRANSFERRED` : Transféré
- `CANCELLED` : Annulé
- `REFUNDED` : Remboursé
- `SUSPENDED` : Suspendu
- `EXPIRED` : Expiré
- `PENDING_TRANSFER` : Transfert en cours

#### `source_channel`
- `DIRECT` : Direct plateforme
- `MOBILE_APP` : Application mobile
- `PARTNER` : Partenaire
- `AFFILIATE` : Affilié
- `RESELLER` : Revendeur
- `PHONE` : Téléphone
- `PHYSICAL` : Physique
- `SOCIAL_MEDIA` : Réseaux sociaux

---

## 🔗 Tables de liaison Plans d'abonnements

### Table `subscription_plan_events` - Liaison plans-événements

**Description** : Événements spécifiques inclus dans un plan d'abonnement.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `subscription_plan_id` | UUID | NOT NULL, FK | - | Plan d'abonnement |
| `event_id` | UUID | NOT NULL, FK | - | Événement inclus |
| `is_included` | BOOLEAN | NOT NULL | TRUE | Inclus dans plan |
| `is_priority` | BOOLEAN | NOT NULL | FALSE | Accès prioritaire |
| `access_level` | VARCHAR(50) | DEFAULT 'STANDARD' | - | Niveau d'accès |
| `additional_cost` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Coût additionnel |
| `booking_window_start` | TIMESTAMPTZ | NULL | - | Début réservation |
| `booking_window_end` | TIMESTAMPTZ | NULL | - | Fin réservation |
| `max_bookings` | INTEGER | NULL | - | Réservations max |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |

### Table `subscription_plan_zones` - Liaison plans-zones

**Description** : Zones spécifiques accessibles avec un plan d'abonnement.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `subscription_plan_id` | UUID | NOT NULL, FK | - | Plan d'abonnement |
| `zone_id` | VARCHAR(255) | NOT NULL, FK | - | Zone venue |
| `is_included` | BOOLEAN | NOT NULL | TRUE | Zone incluse |
| `price_override` | DECIMAL(10,2) | NULL | - | Prix zone spécifique |
| `priority_level` | INTEGER | DEFAULT 0 | 0 | Niveau priorité |
| `max_reservations` | INTEGER | NULL | - | Réservations max |
| `advance_booking_days` | INTEGER | NULL | - | Jours anticipation |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |

---

## 🎯 Workflows innovants V3.0

### Workflow création billet anonyme avec onboarding

1. **Sélection billet** → Événement + type sans connexion requise
2. **Informations contact** → Email/téléphone pour livraison
3. **Génération clé onboarding** → Secret unique dans metadata
4. **Paiement anonyme** → Traitement sans compte utilisateur
5. **Génération QR** → Code d'accès fonctionnel
6. **Communication incitative** → Email/SMS avec lien personnalisé et incentive

### Workflow création abonnement anonyme avec onboarding

1. **Choix plan** → Sélection sans connexion
2. **Informations basiques** → Nom, email, téléphone
3. **Génération clé onboarding** → Secret unique dans metadata avec incentive
4. **Paiement** → Transaction anonyme
5. **Génération QR codes** → Codes d'accès pour tous événements inclus
6. **Campagne onboarding** → Communication avantages et lien conversion

### Workflow conversion anonyme → enregistré via onboarding

1. **Réception lien** → Email/SMS avec secret key dans URL
2. **Page d'onboarding** → Inscription simplifiée pré-remplie
3. **Validation secret** → Vérification clé dans metadata
4. **Application incentive** → Bonus selon type défini
5. **Migration données** → Tickets/abonnements liés au compte
6. **Marquage utilisé** → onboarding.used = true dans metadata

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Plans ↔ Organisateurs
ALTER TABLE subscription_plans 
ADD CONSTRAINT fk_plans_organizer 
FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

-- Abonnements ↔ Plans
ALTER TABLE subscriptions 
ADD CONSTRAINT fk_subscriptions_plan 
FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT;

-- Abonnements ↔ Utilisateurs (nullable)
ALTER TABLE subscriptions 
ADD CONSTRAINT fk_subscriptions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Tickets ↔ Événements
ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT;

-- Tickets ↔ Types
ALTER TABLE ticket_types 
ADD CONSTRAINT fk_ticket_types_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Tickets ↔ Utilisateurs (nullable)
ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

### Contraintes de validation nouvelles

```sql
-- Contact obligatoire pour anonymes
ALTER TABLE subscriptions ADD CONSTRAINT chk_subscription_contact 
CHECK (
    user_id IS NOT NULL OR 
    (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
);

ALTER TABLE tickets ADD CONSTRAINT chk_ticket_contact 
CHECK (
    user_id IS NOT NULL OR 
    (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
);

-- Dates cohérentes plans
ALTER TABLE subscription_plans ADD CONSTRAINT chk_plan_dates 
CHECK (valid_until > valid_from);

-- Quantités logiques tickets
ALTER TABLE ticket_types ADD CONSTRAINT chk_ticket_quantities 
CHECK (
    available_quantity >= 0 AND 
    sold_quantity >= 0 AND 
    reserved_quantity >= 0 AND
    sold_quantity + reserved_quantity <= total_quantity
);

-- Prix positifs
ALTER TABLE subscription_plans ADD CONSTRAINT chk_plan_price_positive 
CHECK (price > 0);

ALTER TABLE ticket_types ADD CONSTRAINT chk_ticket_price_positive 
CHECK (base_price >= 0);
```

### Index de performance

```sql
-- Recherche abonnements anonymes
CREATE INDEX idx_subscriptions_anonymous ON subscriptions(organizer_id, status) 
WHERE user_id IS NULL;

-- Recherche tickets anonymes
CREATE INDEX idx_tickets_anonymous ON tickets(organizer_id, status) 
WHERE user_id IS NULL;

-- Performance ventes par événement
CREATE INDEX idx_tickets_event_sales ON tickets(
    event_id, status, created_at DESC
);

-- Performance plans actifs
CREATE INDEX idx_plans_active_featured ON subscription_plans(
    organizer_id, is_active, is_featured, display_order
) WHERE is_active = TRUE;
```

---

## 📊 Métriques et KPIs V3.0

### Indicateurs innovation anonyme
- **Taux création anonyme** : % billets/abonnements sans user_id
- **Taux conversion onboarding** : Clés secrètes utilisées/générées
- **Performance incentives** : Efficacité par type d'incitation
- **Délai conversion** : Temps moyen génération → utilisation clé

### Indicateurs commerciaux
- **Revenus abonnements** : Performance plans vs billets individuels
- **Lifetime Value** : Valeur client sur durée
- **Taux renouvellement** : % abonnements renouvelés
- **Panier moyen** : Valeur moyenne commandes

### Indicateurs opérationnels
- **Taux occupation** : % billets vendus/disponibles
- **Lead time ventes** : Délai moyen vente → événement
- **Taux annulation** : % billets/abonnements annulés
- **Satisfaction client** : NPS et évaluations

Cette documentation couvre l'écosystème billetterie complet d'Entrix V3.0, intégrant les capacités anonymes avec système d'onboarding intelligent via metadata pour maximiser l'acquisition et la conversion tout en maintenant la flexibilité opérationnelle.