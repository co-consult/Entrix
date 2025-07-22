# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Gestion des Droits

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel constitue le cœur du système de contrôle d'accès d'Entrix V3.0. Il intègre les nouvelles capacités d'accès anonyme tout en maintenant un contrôle granulaire des permissions et une traçabilité complète des actions.

### Innovations V3.0
- **Accès anonyme** : Droits d'accès sans user_id pour flexibilité maximale
- **QR codes universels** : Codes d'accès génériques associables ultérieurement
- **Gestion flexible** : Droits liés aux tickets, abonnements ou autonomes
- **Traçabilité complète** : Audit de tous les contrôles et transferts

### Principes de conception
- **Sécurité par défaut** : Accès refusé sauf autorisation explicite
- **Granularité** : Permissions au niveau action/ressource/contexte
- **Flexibilité** : Support utilisateurs enregistrés ET anonymes
- **Auditabilité** : Traçabilité complète des accès et modifications

---

## 🎫 Table `access_rights` - Droits d'accès universels

**Description** : **TABLE CENTRALE MODIFIÉE** - Système unifié de gestion des droits d'accès supportant les utilisateurs enregistrés et anonymes avec QR codes.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `qr_code` | VARCHAR(255) | UNIQUE, NOT NULL | - | Code QR unique |
| `user_id` | UUID | **NULL**, FK | **NULL** | **MODIFIÉ** : Utilisateur (nullable) |
| `ticket_id` | UUID | NULL, FK | - | Billet associé |
| `subscription_id` | UUID | NULL, FK | - | Abonnement associé |
| `subscription_plan_id` | UUID | NULL, FK | - | Plan d'abonnement |
| `event_id` | UUID | **NULL**, FK | **NULL** | **MODIFIÉ** : Événement (nullable) |
| `venue_id` | VARCHAR(255) | NULL, FK | - | Lieu d'accès |
| `zone_id` | VARCHAR(255) | NULL, FK | - | Zone spécifique |
| `seat_id` | UUID | NULL, FK | - | Siège assigné |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur référent |
| `access_type` | ENUM | NOT NULL | - | Type d'accès |
| `status` | ENUM | NOT NULL | 'PENDING' | Statut actuel |
| `valid_from` | TIMESTAMPTZ | NOT NULL | - | Début validité |
| `valid_until` | TIMESTAMPTZ | NOT NULL | - | Fin validité |
| `max_uses` | INTEGER | NOT NULL | 1 | Utilisations max |
| `current_uses` | INTEGER | NOT NULL | 0 | Utilisations actuelles |
| `price_paid` | DECIMAL(10,2) | NULL | - | Prix payé |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `transfer_count` | INTEGER | NOT NULL | 0 | Nombre transferts |
| `max_transfers` | INTEGER | NOT NULL | 0 | Transferts max autorisés |
| `special_requirements` | TEXT[] | NULL | - | Exigences spéciales |
| `benefits` | JSONB | NULL | - | Avantages inclus |
| `restrictions` | JSONB | NULL | - | Restrictions d'usage |
| `metadata` | JSONB | NULL | - | Métadonnées flexibles |
| `issued_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date émission |
| `first_used_at` | TIMESTAMPTZ | NULL | - | Premier usage |
| `last_used_at` | TIMESTAMPTZ | NULL | - | Dernier usage |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `access_type`
- `TICKET` : Accès billet événement
- `SUBSCRIPTION` : Accès abonnement
- `VENUE_PASS` : Pass lieu
- `ZONE_ACCESS` : Accès zone
- `VIP_ACCESS` : Accès VIP
- `STAFF_ACCESS` : Accès personnel
- `MEDIA_ACCESS` : Accès médias
- `VENDOR_ACCESS` : Accès prestataires
- `EMERGENCY_ACCESS` : Accès urgence
- `TEMPORARY_ACCESS` : Accès temporaire

#### `status`
- `PENDING` : En attente activation
- `ACTIVE` : Actif et utilisable
- `USED` : Complètement utilisé
- `EXPIRED` : Expiré
- `SUSPENDED` : Temporairement suspendu
- `REVOKED` : Révoqué définitivement
- `TRANSFERRED` : Transféré à autre utilisateur
- `REFUNDED` : Remboursé

### Nouveaux cas d'usage V3.0

#### **Accès anonyme sans utilisateur**
```sql
-- QR code d'accès généré sans utilisateur associé
INSERT INTO access_rights (
    qr_code, user_id, event_id, organizer_id, 
    access_type, status, valid_from, valid_until
) VALUES (
    'QR_ANON_240717_001', NULL, NULL, 'org_123',
    'VENUE_PASS', 'ACTIVE', NOW(), NOW() + INTERVAL '30 days'
);
```

#### **Accès via plan d'abonnement sans événement spécifique**
```sql
-- Droit d'accès basé sur plan d'abonnement
INSERT INTO access_rights (
    qr_code, user_id, subscription_plan_id, organizer_id,
    access_type, status, valid_from, valid_until, max_uses
) VALUES (
    'QR_SUB_PLAN_001', 'user_456', 'plan_789', 'org_123',
    'SUBSCRIPTION', 'ACTIVE', NOW(), NOW() + INTERVAL '365 days', 50
);
```

### Structure JSONB `benefits`

```json
{
  "parking": {
    "included": true,
    "level": "premium",
    "spots": ["A15", "A16"]
  },
  "concessions": {
    "discount_percent": 15,
    "free_items": ["soft_drink"],
    "priority_queue": true
  },
  "services": {
    "meet_and_greet": true,
    "early_entry": "30_minutes",
    "exclusive_merchandise": true
  },
  "digital": {
    "livestream_access": true,
    "exclusive_content": true,
    "mobile_app_premium": true
  }
}
```

### Structure JSONB `restrictions`

```json
{
  "entry": {
    "latest_arrival": "2024-12-31T20:00:00Z",
    "no_reentry": false,
    "security_check_required": true
  },
  "age": {
    "minimum_age": 18,
    "maximum_age": null,
    "parental_consent_required": false
  },
  "items": {
    "prohibited_items": ["alcohol", "weapons", "cameras"],
    "bag_size_limit": "30cm",
    "food_allowed": false
  },
  "behavior": {
    "dress_code": "smart_casual",
    "noise_restrictions": ["quiet_zones"],
    "photography_policy": "personal_use_only"
  }
}
```

---

## 🔄 Table `access_transactions_log` - Journal des transactions

**Description** : Traçabilité complète de toutes les transactions sur les droits d'accès (transferts, modifications, annulations).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `access_right_id` | UUID | NOT NULL, FK | - | Droit d'accès concerné |
| `transaction_type` | ENUM | NOT NULL | - | Type transaction |
| `from_user_id` | UUID | NULL, FK | - | Utilisateur source |
| `to_user_id` | UUID | NULL, FK | - | Utilisateur destination |
| `initiated_by_user_id` | UUID | NULL, FK | - | Initiateur transaction |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur concerné |
| `amount` | DECIMAL(10,2) | NULL | - | Montant si applicable |
| `currency` | VARCHAR(3) | NULL | - | Devise |
| `fee_amount` | DECIMAL(10,2) | NULL | - | Frais transaction |
| `status` | ENUM | NOT NULL | 'PENDING' | Statut transaction |
| `reason` | TEXT | NULL | - | Motif transaction |
| `previous_values` | JSONB | NULL | - | Valeurs avant |
| `new_values` | JSONB | NULL | - | Valeurs après |
| `approval_required` | BOOLEAN | NOT NULL | FALSE | Approbation nécessaire |
| `approved_by` | UUID | NULL, FK | - | Approuvé par |
| `approved_at` | TIMESTAMPTZ | NULL | - | Date approbation |
| `processed_at` | TIMESTAMPTZ | NULL | - | Date traitement |
| `cancelled_at` | TIMESTAMPTZ | NULL | - | Date annulation |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date transaction |

### Valeurs ENUM

#### `transaction_type`
- `TRANSFER` : Transfert utilisateur
- `MODIFY` : Modification paramètres
- `SUSPEND` : Suspension temporaire
- `REACTIVATE` : Réactivation
- `REVOKE` : Révocation définitive
- `REFUND` : Remboursement
- `UPGRADE` : Amélioration
- `DOWNGRADE` : Déclassement
- `SPLIT` : Division en plusieurs droits
- `MERGE` : Fusion de droits

#### `status`
- `PENDING` : En attente
- `PROCESSING` : En cours traitement
- `COMPLETED` : Terminée avec succès
- `FAILED` : Échec
- `CANCELLED` : Annulée
- `REQUIRES_APPROVAL` : Nécessite approbation

---

## 🚪 Table `access_control_log` - Journal contrôles physiques

**Description** : Enregistrement de tous les contrôles d'accès physiques aux événements et lieux.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `access_right_id` | UUID | NOT NULL, FK | - | Droit d'accès contrôlé |
| `qr_code` | VARCHAR(255) | NOT NULL | - | Code QR scanné |
| `user_id` | UUID | NULL, FK | - | Utilisateur si connu |
| `event_id` | UUID | NULL, FK | - | Événement concerné |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | Lieu contrôle |
| `zone_id` | VARCHAR(255) | NULL, FK | - | Zone d'accès |
| `entry_point` | VARCHAR(100) | NOT NULL | - | Point d'entrée |
| `control_type` | ENUM | NOT NULL | - | Type contrôle |
| `result` | ENUM | NOT NULL | - | Résultat contrôle |
| `operator_id` | UUID | NULL, FK | - | Opérateur contrôle |
| `device_id` | VARCHAR(100) | NULL | - | Appareil scan |
| `failure_reason` | ENUM | NULL | - | Raison échec |
| `security_level` | ENUM | NOT NULL | 'STANDARD' | Niveau sécurité |
| `additional_checks` | JSONB | NULL | - | Vérifications additionnelles |
| `notes` | TEXT | NULL | - | Notes opérateur |
| `geolocation` | JSONB | NULL | - | Position GPS |
| `photo_taken` | BOOLEAN | NOT NULL | FALSE | Photo prise |
| `photo_url` | TEXT | NULL | - | URL photo |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date/heure contrôle |

### Valeurs ENUM

#### `control_type`
- `ENTRY` : Contrôle entrée
- `EXIT` : Contrôle sortie
- `ZONE_CHANGE` : Changement zone
- `RE_ENTRY` : Nouvelle entrée
- `VERIFICATION` : Vérification identité
- `UPGRADE_CHECK` : Contrôle upgrade
- `EMERGENCY` : Contrôle urgence

#### `result`
- `GRANTED` : Accès accordé
- `DENIED` : Accès refusé
- `CONDITIONAL` : Accès conditionnel
- `MANUAL_OVERRIDE` : Override manuel
- `ESCORTED` : Accès escorté

#### `failure_reason`
- `INVALID_QR` : QR code invalide
- `EXPIRED` : Accès expiré
- `ALREADY_USED` : Déjà utilisé
- `WRONG_EVENT` : Mauvais événement
- `WRONG_ZONE` : Mauvaise zone
- `TIME_RESTRICTION` : Hors créneau
- `SUSPENDED_ACCESS` : Accès suspendu
- `SECURITY_FLAG` : Alerte sécurité
- `TECHNICAL_ERROR` : Erreur technique

#### `security_level`
- `LOW` : Contrôle basique
- `STANDARD` : Contrôle standard
- `HIGH` : Contrôle renforcé
- `MAXIMUM` : Contrôle maximum
- `CUSTOM` : Contrôle personnalisé

---

## 🛡️ Table `role_permissions` - Permissions système

**Description** : Matrice des permissions pour les différents rôles utilisateur dans le système.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `role` | ENUM | NOT NULL | - | Rôle utilisateur |
| `resource` | VARCHAR(100) | NOT NULL | - | Ressource concernée |
| `action` | VARCHAR(50) | NOT NULL | - | Action autorisée |
| `scope` | ENUM | NOT NULL | - | Portée permission |
| `conditions` | JSONB | NULL | - | Conditions spécifiques |
| `organizer_id` | UUID | NULL, FK | - | Organisateur si scope limité |
| `venue_id` | VARCHAR(255) | NULL, FK | - | Lieu si scope limité |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Permission active |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `role`
- `SUPER_ADMIN` : Super administrateur
- `PLATFORM_ADMIN` : Administrateur plateforme
- `ORGANIZER_ADMIN` : Admin organisateur
- `ORGANIZER_MANAGER` : Manager organisateur
- `VENUE_MANAGER` : Gestionnaire lieu
- `EVENT_STAFF` : Personnel événement
- `SECURITY_AGENT` : Agent sécurité
- `CUSTOMER_SERVICE` : Service client
- `USER` : Utilisateur standard

#### `scope`
- `GLOBAL` : Portée globale
- `ORGANIZER` : Limité organisateur
- `VENUE` : Limité lieu
- `EVENT` : Limité événement
- `PERSONAL` : Données personnelles uniquement

#### `resource`
- `users`, `events`, `tickets`, `venues`, `payments`, `reports`, etc.

#### `action`
- `create`, `read`, `update`, `delete`, `transfer`, `refund`, etc.

---

## 🎯 Workflows de gestion des droits

### Workflow création accès anonyme

1. **Génération QR** → Code unique avec organizer_id
2. **Configuration accès** → Type, validité, restrictions
3. **Activation différée** → Statut PENDING → ACTIVE
4. **Attribution ultérieure** → Association user_id si besoin
5. **Contrôle physique** → Scan et validation

### Workflow transfert d'accès

1. **Initiation transfert** → Vérification droits transférables
2. **Validation conditions** → Limites, frais, approbations
3. **Transaction log** → Enregistrement transaction
4. **Modification ownership** → Mise à jour user_id
5. **Notifications** → Confirmation parties prenantes

### Workflow contrôle d'accès

1. **Scan QR code** → Lecture code à l'entrée
2. **Validation temps réel** → Vérification validité/statut
3. **Contrôles additionnels** → Sécurité selon niveau
4. **Décision d'accès** → GRANTED/DENIED/CONDITIONAL
5. **Logging complet** → Traçabilité dans access_control_log

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Access rights → Utilisateurs (nullable)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Access rights → Organisateurs
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_organizer 
FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

-- Access rights → Événements (nullable)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Transactions log → Access rights
ALTER TABLE access_transactions_log 
ADD CONSTRAINT fk_transactions_access_right 
FOREIGN KEY (access_right_id) REFERENCES access_rights(id) ON DELETE RESTRICT;

-- Control log → Access rights
ALTER TABLE access_control_log 
ADD CONSTRAINT fk_control_log_access_right 
FOREIGN KEY (access_right_id) REFERENCES access_rights(id) ON DELETE RESTRICT;
```

### Contraintes de validation nouvelles

```sql
-- Au moins une référence obligatoire (ticket, subscription ou plan)
ALTER TABLE access_rights ADD CONSTRAINT chk_access_reference 
CHECK (
    ticket_id IS NOT NULL OR 
    subscription_id IS NOT NULL OR 
    subscription_plan_id IS NOT NULL OR
    access_type IN ('VENUE_PASS', 'TEMPORARY_ACCESS', 'EMERGENCY_ACCESS')
);

-- Uses cohérents
ALTER TABLE access_rights ADD CONSTRAINT chk_uses_logical 
CHECK (current_uses <= max_uses AND current_uses >= 0);

-- Validité temporelle
ALTER TABLE access_rights ADD CONSTRAINT chk_validity_period 
CHECK (valid_until > valid_from);

-- QR code format valide
ALTER TABLE access_rights ADD CONSTRAINT chk_qr_code_format 
CHECK (LENGTH(qr_code) >= 10 AND qr_code ~ '^[A-Z0-9_-]+$');
```

### Index de performance

```sql
-- Recherche par QR code (critique)
CREATE UNIQUE INDEX idx_access_rights_qr ON access_rights(qr_code);

-- Recherche accès utilisateur
CREATE INDEX idx_access_rights_user ON access_rights(user_id, status) 
WHERE user_id IS NOT NULL;

-- Recherche accès anonymes
CREATE INDEX idx_access_rights_anonymous ON access_rights(organizer_id, status) 
WHERE user_id IS NULL;

-- Contrôles temps réel
CREATE INDEX idx_access_control_real_time ON access_control_log(
    venue_id, entry_point, created_at DESC
);
```

---

## 📊 Métriques et indicateurs

### Indicateurs d'utilisation
- **Taux utilisation anonyme** : % accès sans user_id
- **Conversion anonyme** : Accès anonymes → comptes créés
- **Fréquence transferts** : Transferts par droit d'accès
- **Durée de vie moyenne** : Temps entre émission et utilisation

### Indicateurs de sécurité
- **Tentatives accès invalides** : Échecs par raison
- **Détection fraudes** : Patterns suspects
- **Performance contrôles** : Temps moyen validation
- **Incidents sécurité** : Alertes et résolutions

### Indicateurs opérationnels
- **Pics de contrôle** : Flux d'entrée par créneaux
- **Efficacité points d'accès** : Débit par entrée
- **Satisfaction utilisateur** : Temps d'attente moyen
- **Utilisation zones** : Répartition accès par zone

Cette documentation couvre la gestion complète des droits d'accès dans Entrix V3.0, intégrant les nouvelles capacités d'accès anonyme tout en maintenant la sécurité et la traçabilité.