# Documentation Modèle de Données Entrix V3.0
## Module Central : Contrôle d'Accès

---

## 📋 Vue d'ensemble

Le contrôle d'accès constitue le **cœur absolu** de la plateforme Entrix V3.0. Ce module central unifie et orchestestre tous les droits d'accès, de la billetterie classique aux abonnements, en passant par les accès staff et VIP. Il gère l'ensemble du cycle de vie des droits d'accès et assure la traçabilité complète de tous les contrôles physiques.

### Architecture centrale
Le système repose sur une **table pivot universelle** `access_rights` qui centralise TOUS les types d'accès de la plateforme :
- **Billets individuels** via `ticket_id`
- **Abonnements** via `subscription_id` ou `subscription_plan_id`  
- **Accès autonomes** (staff, media, VIP) sans référence billet
- **Accès anonymes** avec `user_id` nullable
- **QR codes universels** pour tous types d'accès

### Principes fondamentaux
- **Unification totale** : Un seul système pour tous les accès
- **Flexibilité maximale** : Support de tous les cas d'usage
- **Traçabilité complète** : Audit de chaque contrôle physique
- **Performance optimale** : Validation temps réel en millisecondes

---

## 🎫 Table `access_rights` - Table centrale universelle

**Description** : **CŒUR DE LA PLATEFORME** - Table pivot qui unifie TOUS les droits d'accès : billets, abonnements, staff, VIP, media, etc. C'est la source unique de vérité pour tous les contrôles d'accès.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique universel |
| `qr_code` | VARCHAR(255) | UNIQUE, NOT NULL | - | **Code QR unique** (clé d'accès) |
| `user_id` | UUID | **NULL**, FK | **NULL** | Utilisateur (nullable pour anonymes) |
| `ticket_id` | UUID | NULL, FK | - | Billet associé si applicable |
| `subscription_id` | UUID | NULL, FK | - | Abonnement spécifique |
| `subscription_plan_id` | UUID | NULL, FK | - | Plan d'abonnement général |
| `event_id` | UUID | **NULL**, FK | **NULL** | Événement spécifique (nullable) |
| `venue_id` | VARCHAR(255) | NULL, FK | - | Lieu d'accès |
| `zone_id` | VARCHAR(255) | NULL, FK | - | Zone spécifique dans le lieu |
| `seat_id` | UUID | NULL, FK | - | Siège assigné si applicable |
| `organizer_id` | UUID | NOT NULL, FK | - | **Organisateur référent** |
| `access_type` | ENUM | NOT NULL | - | **Type d'accès** |
| `status` | ENUM | NOT NULL | 'PENDING' | **Statut actuel** |
| `valid_from` | TIMESTAMPTZ | NOT NULL | - | **Début validité** |
| `valid_until` | TIMESTAMPTZ | NOT NULL | - | **Fin validité** |
| `max_uses` | INTEGER | NOT NULL | 1 | **Utilisations maximales** |
| `current_uses` | INTEGER | NOT NULL | 0 | **Utilisations actuelles** |
| `price_paid` | DECIMAL(10,2) | NULL | - | Prix payé pour cet accès |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `transfer_count` | INTEGER | NOT NULL | 0 | Nombre de transferts effectués |
| `max_transfers` | INTEGER | NOT NULL | 0 | Transferts maximaux autorisés |
| `special_requirements` | TEXT[] | NULL | - | Exigences spéciales |
| `benefits` | JSONB | NULL | - | Avantages inclus |
| `restrictions` | JSONB | NULL | - | Restrictions d'usage |
| `metadata` | JSONB | NULL | - | Métadonnées flexibles |
| `issued_at` | TIMESTAMPTZ | NOT NULL | NOW() | **Date émission** |
| `first_used_at` | TIMESTAMPTZ | NULL | - | **Premier usage** |
| `last_used_at` | TIMESTAMPTZ | NULL | - | **Dernier usage** |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière modification |

### Valeurs ENUM `access_type`

#### Types d'accès principaux
- `TICKET` : **Accès billet standard**
- `SUBSCRIPTION` : **Accès via abonnement**
- `VENUE_PASS` : **Pass lieu générique**
- `ZONE_ACCESS` : **Accès zone spécifique**

#### Types d'accès privilégiés  
- `VIP_ACCESS` : **Accès VIP**
- `HOSPITALITY` : **Accès hospitalité**
- `PREMIUM_ACCESS` : **Accès premium**

#### Types d'accès professionnels
- `STAFF_ACCESS` : **Personnel événement**
- `MEDIA_ACCESS` : **Accès médias/presse**
- `VENDOR_ACCESS` : **Prestataires/exposants**
- `TECHNICAL_ACCESS` : **Personnel technique**
- `SECURITY_ACCESS` : **Agents sécurité**

#### Types d'accès spéciaux
- `EMERGENCY_ACCESS` : **Accès urgence**
- `TEMPORARY_ACCESS` : **Accès temporaire**
- `COMP_ACCESS` : **Accès gratuit/invitation**

### Valeurs ENUM `status`

- `PENDING` : **En attente activation**
- `ACTIVE` : **Actif et utilisable** 
- `USED` : **Complètement utilisé**
- `EXPIRED` : **Expiré**
- `SUSPENDED` : **Temporairement suspendu**
- `REVOKED` : **Révoqué définitivement**
- `TRANSFERRED` : **Transféré à autre utilisateur**
- `REFUNDED` : **Remboursé**

### Logique d'accès universelle

#### Règles de validation
```sql
-- Au moins une référence doit être présente
CHECK (
    ticket_id IS NOT NULL OR 
    subscription_id IS NOT NULL OR 
    subscription_plan_id IS NOT NULL OR
    access_type IN ('VENUE_PASS', 'STAFF_ACCESS', 'EMERGENCY_ACCESS')
);

-- Validité temporelle cohérente
CHECK (valid_until > valid_from);

-- Utilisations cohérentes
CHECK (current_uses <= max_uses AND current_uses >= 0);
```

### Structure JSONB `benefits`

```json
{
  "access_privileges": {
    "early_entry": "30_minutes",
    "priority_queue": true,
    "backstage_access": false,
    "meet_and_greet": true
  },
  "services_included": {
    "parking": {
      "included": true,
      "level": "vip",
      "spots": ["A15", "A16"]
    },
    "concessions": {
      "discount_percent": 20,
      "free_items": ["soft_drink"],
      "priority_service": true
    },
    "hospitality": {
      "lounge_access": true,
      "complimentary_drinks": 2,
      "dedicated_host": true
    }
  },
  "digital_benefits": {
    "livestream_access": true,
    "exclusive_content": true,
    "mobile_app_premium": true,
    "photo_package": true
  }
}
```

### Structure JSONB `restrictions`

```json
{
  "entry_conditions": {
    "latest_arrival": "2024-12-31T20:00:00Z",
    "no_reentry": false,
    "security_check_required": true,
    "id_verification": true
  },
  "age_restrictions": {
    "minimum_age": 18,
    "maximum_age": null,
    "parental_consent_under": 16
  },
  "behavioral_rules": {
    "dress_code": "smart_casual",
    "noise_restrictions": true,
    "photography_policy": "personal_use_only",
    "recording_prohibited": false
  },
  "items_policy": {
    "prohibited_items": ["alcohol", "weapons", "professional_cameras"],
    "bag_size_limit": "30x30x30cm",
    "food_allowed": false,
    "drinks_allowed": "sealed_water_only"
  }
}
```

---

## 🔄 Table `access_transactions_log` - Journal des transactions

**Description** : Traçabilité complète de toutes les opérations sur les droits d'accès (création, modification, transfert, annulation).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `access_right_id` | UUID | NOT NULL, FK | - | **Droit d'accès concerné** |
| `transaction_type` | ENUM | NOT NULL | - | **Type de transaction** |
| `from_user_id` | UUID | NULL, FK | - | Utilisateur source |
| `to_user_id` | UUID | NULL, FK | - | Utilisateur destination |
| `initiated_by_user_id` | UUID | NULL, FK | - | **Initiateur transaction** |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur concerné |
| `amount` | DECIMAL(10,2) | NULL | - | Montant si applicable |
| `currency` | VARCHAR(3) | NULL | - | Devise |
| `fee_amount` | DECIMAL(10,2) | NULL | - | Frais de transaction |
| `status` | ENUM | NOT NULL | 'PENDING' | **Statut transaction** |
| `reason` | TEXT | NULL | - | **Motif de la transaction** |
| `previous_values` | JSONB | NULL | - | **Valeurs avant changement** |
| `new_values` | JSONB | NULL | - | **Valeurs après changement** |
| `approval_required` | BOOLEAN | NOT NULL | FALSE | Approbation nécessaire |
| `approved_by` | UUID | NULL, FK | - | Approuvé par |
| `approved_at` | TIMESTAMPTZ | NULL | - | Date approbation |
| `processed_at` | TIMESTAMPTZ | NULL | - | **Date traitement** |
| `cancelled_at` | TIMESTAMPTZ | NULL | - | Date annulation |
| `metadata` | JSONB | NULL | - | Métadonnées transaction |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | **Date transaction** |

### Valeurs ENUM `transaction_type`

#### Transactions de cycle de vie
- `CREATE` : **Création du droit**
- `ACTIVATE` : **Activation**
- `DEACTIVATE` : **Désactivation**
- `EXPIRE` : **Expiration**

#### Transactions de transfert
- `TRANSFER` : **Transfert utilisateur**
- `ASSIGN` : **Attribution**
- `REASSIGN` : **Réattribution**

#### Transactions de modification
- `MODIFY` : **Modification paramètres**
- `UPGRADE` : **Amélioration**
- `DOWNGRADE` : **Déclassement**

#### Transactions de contrôle
- `SUSPEND` : **Suspension temporaire**
- `REACTIVATE` : **Réactivation**
- `REVOKE` : **Révocation définitive**

#### Transactions financières
- `REFUND` : **Remboursement**
- `PARTIAL_REFUND` : **Remboursement partiel**

#### Transactions techniques
- `SPLIT` : **Division en plusieurs droits**
- `MERGE` : **Fusion de droits**
- `DUPLICATE` : **Duplication**

### Valeurs ENUM `status`

- `PENDING` : **En attente**
- `PROCESSING` : **En cours de traitement**
- `COMPLETED` : **Terminée avec succès**
- `FAILED` : **Échec**
- `CANCELLED` : **Annulée**
- `REQUIRES_APPROVAL` : **Nécessite approbation**

---

## 🚪 Table `access_control_log` - Journal des contrôles physiques

**Description** : **CŒUR OPÉRATIONNEL** - Enregistrement en temps réel de tous les contrôles d'accès physiques aux points d'entrée.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `access_right_id` | UUID | NOT NULL, FK | - | **Droit d'accès contrôlé** |
| `qr_code` | VARCHAR(255) | NOT NULL | - | **Code QR scanné** |
| `user_id` | UUID | NULL, FK | - | Utilisateur si identifié |
| `event_id` | UUID | NULL, FK | - | Événement concerné |
| `venue_id` | VARCHAR(255) | NOT NULL, FK | - | **Lieu du contrôle** |
| `zone_id` | VARCHAR(255) | NULL, FK | - | Zone d'accès tentée |
| `entry_point` | VARCHAR(100) | NOT NULL | - | **Point d'entrée physique** |
| `control_type` | ENUM | NOT NULL | - | **Type de contrôle** |
| `result` | ENUM | NOT NULL | - | **Résultat du contrôle** |
| `operator_id` | UUID | NULL, FK | - | **Opérateur de contrôle** |
| `device_id` | VARCHAR(100) | NULL | - | Identifiant scanner |
| `device_type` | VARCHAR(50) | NULL | - | Type de scanner |
| `failure_reason` | ENUM | NULL | - | **Raison de l'échec** |
| `security_level` | ENUM | NOT NULL | 'STANDARD' | **Niveau sécurité appliqué** |
| `additional_checks` | JSONB | NULL | - | Vérifications additionnelles |
| `override_applied` | BOOLEAN | NOT NULL | FALSE | Override manuel appliqué |
| `override_reason` | TEXT | NULL | - | Raison override |
| `override_by` | UUID | NULL, FK | - | Override autorisé par |
| `notes` | TEXT | NULL | - | **Notes opérateur** |
| `response_time_ms` | INTEGER | NULL | - | Temps réponse système |
| `geolocation` | JSONB | NULL | - | Position GPS précise |
| `photo_taken` | BOOLEAN | NOT NULL | FALSE | Photo prise |
| `photo_url` | TEXT | NULL | - | URL de la photo |
| `biometric_check` | BOOLEAN | NOT NULL | FALSE | Vérification biométrique |
| `id_verified` | BOOLEAN | NOT NULL | FALSE | Pièce identité vérifiée |
| `temperature_check` | DECIMAL(4,1) | NULL | - | Contrôle température |
| `health_pass_verified` | BOOLEAN | NOT NULL | FALSE | Pass sanitaire vérifié |
| `companion_count` | INTEGER | DEFAULT 0 | 0 | Nombre accompagnateurs |
| `group_entry` | BOOLEAN | NOT NULL | FALSE | Entrée de groupe |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | **Date/heure contrôle** |

### Valeurs ENUM `control_type`

#### Contrôles d'entrée
- `ENTRY` : **Contrôle d'entrée principale**
- `RE_ENTRY` : **Nouvelle entrée après sortie**
- `LATE_ENTRY` : **Entrée tardive**

#### Contrôles de mouvement
- `ZONE_CHANGE` : **Changement de zone**
- `UPGRADE_CHECK` : **Contrôle d'amélioration**
- `VIP_ACCESS` : **Accès zone VIP**

#### Contrôles de sortie
- `EXIT` : **Contrôle de sortie**
- `TEMPORARY_EXIT` : **Sortie temporaire**

#### Contrôles spéciaux
- `VERIFICATION` : **Vérification d'identité**
- `EMERGENCY` : **Contrôle d'urgence**
- `MANUAL_CHECK` : **Contrôle manuel**

### Valeurs ENUM `result`

#### Résultats positifs
- `GRANTED` : **Accès accordé**
- `CONDITIONAL` : **Accès conditionnel**

#### Résultats avec intervention
- `MANUAL_OVERRIDE` : **Override manuel**
- `ESCORTED` : **Accès avec escorte**
- `SUPERVISED` : **Accès supervisé**

#### Résultats négatifs
- `DENIED` : **Accès refusé**
- `BLOCKED` : **Accès bloqué**

### Valeurs ENUM `failure_reason`

#### Problèmes de code
- `INVALID_QR` : **QR code invalide**
- `EXPIRED` : **Accès expiré**
- `ALREADY_USED` : **Déjà utilisé**
- `BLACKLISTED` : **Code blacklisté**

#### Problèmes contextuels
- `WRONG_EVENT` : **Mauvais événement**
- `WRONG_VENUE` : **Mauvais lieu**
- `WRONG_ZONE` : **Mauvaise zone**
- `WRONG_TIME` : **Hors créneaux autorisés**

#### Problèmes de statut
- `SUSPENDED_ACCESS` : **Accès suspendu**
- `REVOKED_ACCESS` : **Accès révoqué**
- `PENDING_ACTIVATION` : **En attente d'activation**

#### Problèmes techniques
- `TECHNICAL_ERROR` : **Erreur technique**
- `NETWORK_ERROR` : **Erreur réseau**
- `DATABASE_ERROR` : **Erreur base de données**

#### Problèmes sécuritaires
- `SECURITY_FLAG` : **Alerte sécurité**
- `FRAUD_SUSPECTED` : **Fraude suspectée**
- `DUPLICATE_ENTRY` : **Tentative d'entrée multiple**

### Valeurs ENUM `security_level`

- `LOW` : **Contrôle basique** (scan QR uniquement)
- `STANDARD` : **Contrôle standard** (QR + vérification visuelle)
- `HIGH` : **Contrôle renforcé** (QR + ID + fouille)
- `MAXIMUM` : **Contrôle maximum** (QR + ID + fouille + biométrie)
- `CUSTOM` : **Contrôle personnalisé** (selon configuration événement)

---

## ⚡ Workflows de contrôle d'accès

### Workflow scan QR temps réel

1. **Scan QR code** → Lecture code à l'entrée
2. **Lookup access_right** → Recherche instantanée par qr_code
3. **Validation status** → Vérification statut ACTIVE
4. **Validation temporelle** → Contrôle valid_from/valid_until
5. **Validation géographique** → Vérification venue_id/zone_id
6. **Validation usage** → Contrôle current_uses vs max_uses
7. **Checks additionnels** → Selon security_level
8. **Décision finale** → GRANTED/DENIED
9. **Log contrôle** → Enregistrement dans access_control_log
10. **Mise à jour usage** → Incrément current_uses si accordé

### Workflow transfert de droit

1. **Initiation transfert** → Utilisateur initie le transfert
2. **Validation éligibilité** → Vérification transferable = true
3. **Contrôle limites** → Vérification transfer_count vs max_transfers
4. **Validation destinataire** → Vérification utilisateur destination
5. **Calcul frais** → Application frais de transfert si applicable
6. **Log transaction** → Enregistrement dans access_transactions_log
7. **Mise à jour ownership** → Changement user_id
8. **Incrément compteur** → transfer_count++
9. **Notifications** → Confirmation expéditeur et destinataire

### Workflow suspension/réactivation

1. **Demande suspension** → Organisateur ou admin
2. **Log transaction** → Type SUSPEND dans access_transactions_log
3. **Mise à jour statut** → status = 'SUSPENDED'
4. **Blocage immédiat** → Échec des contrôles suivants
5. **Notification** → Alerte utilisateur concerné
6. **Réactivation** → Processus inverse si autorisé

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Access rights → Utilisateurs (nullable pour anonymes)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Access rights → Organisateurs (obligatoire)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_organizer 
FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

-- Access rights → Billets (optionnel)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_ticket 
FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

-- Access rights → Abonnements (optionnel)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_subscription 
FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;

-- Access rights → Plans abonnements (optionnel)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_plan 
FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE;

-- Access rights → Événements (nullable)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Access rights → Lieux (optionnel)
ALTER TABLE access_rights 
ADD CONSTRAINT fk_access_rights_venue 
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT;

-- Transactions log → Access rights
ALTER TABLE access_transactions_log 
ADD CONSTRAINT fk_transactions_access_right 
FOREIGN KEY (access_right_id) REFERENCES access_rights(id) ON DELETE RESTRICT;

-- Control log → Access rights
ALTER TABLE access_control_log 
ADD CONSTRAINT fk_control_access_right 
FOREIGN KEY (access_right_id) REFERENCES access_rights(id) ON DELETE RESTRICT;

-- Control log → Venues
ALTER TABLE access_control_log 
ADD CONSTRAINT fk_control_venue 
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT;
```

### Contraintes de validation

```sql
-- Au moins une référence obligatoire
ALTER TABLE access_rights ADD CONSTRAINT chk_access_reference 
CHECK (
    ticket_id IS NOT NULL OR 
    subscription_id IS NOT NULL OR 
    subscription_plan_id IS NOT NULL OR
    access_type IN ('VENUE_PASS', 'STAFF_ACCESS', 'EMERGENCY_ACCESS', 'TEMP_ACCESS')
);

-- Utilisations cohérentes
ALTER TABLE access_rights ADD CONSTRAINT chk_uses_logical 
CHECK (current_uses <= max_uses AND current_uses >= 0);

-- Transferts cohérents
ALTER TABLE access_rights ADD CONSTRAINT chk_transfers_logical 
CHECK (transfer_count <= max_transfers AND transfer_count >= 0);

-- Période de validité cohérente
ALTER TABLE access_rights ADD CONSTRAINT chk_validity_period 
CHECK (valid_until > valid_from);

-- QR code format valide (alphanumérique, tirets, underscores)
ALTER TABLE access_rights ADD CONSTRAINT chk_qr_code_format 
CHECK (LENGTH(qr_code) >= 10 AND qr_code ~ '^[A-Z0-9_-]+$');

-- Prix positif ou nul
ALTER TABLE access_rights ADD CONSTRAINT chk_price_non_negative 
CHECK (price_paid IS NULL OR price_paid >= 0);
```

### Index de performance critiques

```sql
-- INDEX CRITIQUE : Recherche par QR code (utilisé à chaque scan)
CREATE UNIQUE INDEX idx_access_rights_qr_code ON access_rights(qr_code);

-- INDEX CRITIQUE : Recherche accès utilisateur
CREATE INDEX idx_access_rights_user_status ON access_rights(user_id, status) 
WHERE user_id IS NOT NULL;

-- INDEX CRITIQUE : Recherche accès anonymes par organisateur
CREATE INDEX idx_access_rights_anonymous ON access_rights(organizer_id, status) 
WHERE user_id IS NULL;

-- INDEX CRITIQUE : Contrôles temps réel par venue
CREATE INDEX idx_access_control_real_time ON access_control_log(
    venue_id, entry_point, created_at DESC
);

-- INDEX CRITIQUE : Transactions récentes
CREATE INDEX idx_access_transactions_recent ON access_transactions_log(
    access_right_id, transaction_type, created_at DESC
);

-- INDEX PERFORMANCE : Accès par événement
CREATE INDEX idx_access_rights_event ON access_rights(
    event_id, status, access_type
) WHERE event_id IS NOT NULL;

-- INDEX PERFORMANCE : Accès expirant bientôt  
CREATE INDEX idx_access_rights_expiring ON access_rights(
    valid_until, status
) WHERE status = 'ACTIVE' AND valid_until > NOW();

-- INDEX ANALYTICS : Contrôles par résultat
CREATE INDEX idx_access_control_analytics ON access_control_log(
    venue_id, result, control_type, created_at
);
```

---

## 📊 Métriques et KPIs centraux

### Indicateurs temps réel
- **Flux d'entrée** : Contrôles/minute par point d'accès
- **Taux de succès** : % accès accordés vs refusés  
- **Temps de réponse** : Latence moyenne validation QR
- **Pics de trafic** : Heures de pointe par venue

### Indicateurs de sécurité
- **Tentatives frauduleuses** : QR codes invalides/expirés
- **Accès multiples** : Détection tentatives répétées
- **Anomalies géographiques** : Accès depuis lieux inattendus
- **Overrides manuels** : Fréquence interventions humaines

### Indicateurs business
- **Utilisation par type** : Répartition billets vs abonnements vs staff
- **Taux de no-show** : % droits non utilisés
- **Transferts** : Volume et tendances transferts
- **Conversion anonyme** : % accès anonymes → comptes créés

### Indicateurs opérationnels
- **Performance venues** : Efficacité contrôles par lieu
- **Saturation points d'accès** : Files d'attente et goulots
- **Fiabilité technique** : % uptime système contrôle
- **Formation staff** : Taux erreurs par opérateur

---

## 🎯 Optimisations performance

### Cache stratégique
- **Cache Redis** : QR codes valides en mémoire (TTL = validité)
- **Cache L1** : Droits actifs par venue
- **Cache L2** : Métadonnées événements/venues
- **Invalidation** : Temps réel sur changements statut

### Partitioning base de données
- **access_control_log** : Partition par mois
- **access_transactions_log** : Partition par trimestre  
- **access_rights** : Partition par organizer_id
- **Archivage** : Déplacement données anciennes

### Monitoring temps réel
- **Dashboard ops** : Métriques live par venue
- **Alertes automatiques** : Seuils dépassés
- **Health checks** : Vérification continue systèmes
- **Escalade** : Procédures d'urgence

Ce module de contrôle d'accès constitue véritablement le **cœur battant** de la plateforme Entrix V3.0, orchestrant tous les flux d'accès avec performance, sécurité et traçabilité maximales, tout en supportant les mécanismes d'onboarding pour la conversion des utilisateurs anonymes.