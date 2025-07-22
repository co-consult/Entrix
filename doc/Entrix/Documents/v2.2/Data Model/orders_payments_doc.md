# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Commandes et Paiements

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel gère l'écosystème complet des transactions commerciales sur Entrix V3.0, incluant les commandes, paiements, remboursements et la gestion financière. Il intègre les nouveaux workflows de paiement anonyme et les mécanismes d'incitation à l'inscription.

### Innovations V3.0
- **💳 Paiements anonymes** : Transactions sans compte utilisateur
- **🔐 Onboarding intelligent** : Clés secrètes dans metadata pour conversion
- **📊 Analytics financières** : Suivi performance par canal et segment
- **🔄 Workflows flexibles** : Support multi-devises et multi-méthodes

### Principes de conception
- **Sécurité maximale** : Chiffrement et conformité PCI DSS
- **Traçabilité complète** : Audit de toutes les transactions
- **Flexibilité paiement** : Support de multiples méthodes
- **Réconciliation automatique** : Gestion des écarts et ajustements

---

## 🛒 Table `orders` - Commandes

**Description** : **TABLE MODIFIÉE** - Commandes client supportant les achats anonymes avec informations guest et gestion des incentives.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `order_number` | VARCHAR(50) | UNIQUE, NOT NULL | - | Numéro commande |
| `user_id` | UUID | **NULL**, FK | **NULL** | **MODIFIÉ** : Utilisateur (nullable) |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur principal |
| `event_id` | UUID | NULL, FK | - | Événement principal |
| `guest_name` | VARCHAR(200) | NULL | - | **NOUVEAU** : Nom acheteur anonyme |
| `guest_email` | VARCHAR(255) | NULL | - | **NOUVEAU** : Email anonyme |
| `guest_phone` | VARCHAR(20) | NULL | - | **NOUVEAU** : Téléphone anonyme |
| `guest_address` | JSONB | NULL | - | **NOUVEAU** : Adresse facturation |
| `order_type` | ENUM | NOT NULL | 'REGULAR' | Type commande |
| `status` | ENUM | NOT NULL | 'PENDING' | Statut commande |
| `channel` | ENUM | NOT NULL | 'WEB' | Canal commande |
| `source` | VARCHAR(100) | NULL | - | Source trafic |
| `affiliate_code` | VARCHAR(50) | NULL | - | Code affilié |
| `referrer_url` | TEXT | NULL | - | URL référent |
| `language` | VARCHAR(5) | NOT NULL | 'fr-TN' | Langue commande |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `subtotal_amount` | DECIMAL(12,2) | NOT NULL | 0.00 | Sous-total |
| `discount_amount` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | Montant remise |
| `coupon_code` | VARCHAR(50) | NULL | - | Code promo |
| `tax_amount` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | Montant taxes |
| `processing_fee` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | Frais traitement |
| `delivery_fee` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | Frais livraison |
| `total_amount` | DECIMAL(12,2) | NOT NULL | 0.00 | Montant total |
| `paid_amount` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | Montant payé |
| `refunded_amount` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | Montant remboursé |
| `outstanding_amount` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | Montant dû |
| `loyalty_points_earned` | INTEGER | DEFAULT 0 | 0 | Points fidélité gagnés |
| `loyalty_points_used` | INTEGER | DEFAULT 0 | 0 | Points fidélité utilisés |
| `purchase_channel` | ENUM | NOT NULL | 'ONLINE' | Canal achat |
| `device_info` | JSONB | NULL | - | Infos appareil |
| `ip_address` | INET | NULL | - | Adresse IP |
| `geolocation` | JSONB | NULL | - | Géolocalisation |
| `payment_deadline` | TIMESTAMPTZ | NULL | - | Échéance paiement |
| `delivery_method` | ENUM | NOT NULL | 'DIGITAL' | Méthode livraison |
| `delivery_address` | JSONB | NULL | - | Adresse livraison |
| `delivery_instructions` | TEXT | NULL | - | Instructions livraison |
| `special_requests` | TEXT | NULL | - | Demandes spéciales |
| `terms_accepted` | BOOLEAN | NOT NULL | FALSE | CGV acceptées |
| `privacy_accepted` | BOOLEAN | NOT NULL | FALSE | Politique vie privée |
| `marketing_consent` | BOOLEAN | NOT NULL | FALSE | Consent marketing |
| `notes` | TEXT | NULL | - | Notes internes |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |

### Structure JSONB `metadata` avec onboarding

```json
{
  "order_details": {
    "checkout_duration": 240,
    "abandoned_cart_recovered": false,
    "payment_attempts": 1,
    "device_type": "mobile"
  },
  "onboarding": {
    "secret_key": "ONB-2025-ORD-JKL345",
    "campaign_id": "multi_ticket_conversion",
    "incentive_type": "DISCOUNT_AMOUNT",
    "incentive_value": 15.0,
    "description": "15 TND de réduction sur votre prochaine commande",
    "expires_at": "2025-07-15T23:59:59Z",
    "used": false,
    "communication_sent": true,
    "contact_method": "email"
  },
  "analytics": {
    "referrer": "google_ads",
    "session_duration": 1800,
    "pages_visited": 5,
    "conversion_funnel": "product_page_direct"
  }
}
```
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |
| `confirmed_at` | TIMESTAMPTZ | NULL | - | Date confirmation |
| `completed_at` | TIMESTAMPTZ | NULL | - | Date finalisation |
| `cancelled_at` | TIMESTAMPTZ | NULL | - | Date annulation |
| `expires_at` | TIMESTAMPTZ | NULL | - | Date expiration |

### Valeurs ENUM

#### `order_type`
- `REGULAR` : Commande normale
- `GROUP_BOOKING` : Réservation groupe
- `CORPORATE` : Commande entreprise
- `SUBSCRIPTION` : Abonnement
- `UPGRADE` : Amélioration
- `ADDON` : Complément
- `REPLACEMENT` : Remplacement
- `REFUND` : Remboursement

#### `status`
- `PENDING` : En attente
- `PAYMENT_PENDING` : Paiement en attente
- `PAYMENT_PROCESSING` : Paiement en cours
- `CONFIRMED` : Confirmée
- `PROCESSING` : En traitement
- `FULFILLED` : Exécutée
- `PARTIALLY_FULFILLED` : Partiellement exécutée
- `CANCELLED` : Annulée
- `REFUNDED` : Remboursée
- `EXPIRED` : Expirée
- `FAILED` : Échec

#### `channel`
- `WEB` : Site web
- `MOBILE_APP` : Application mobile
- `MOBILE_WEB` : Web mobile
- `API` : API
- `PHONE` : Téléphone
- `EMAIL` : Email
- `SMS` : SMS
- `SOCIAL_MEDIA` : Réseaux sociaux
- `PARTNER` : Partenaire
- `AFFILIATE` : Affilié
- `PHYSICAL` : Point physique

#### `purchase_channel`
- `ONLINE` : En ligne
- `MOBILE` : Mobile
- `PHONE` : Téléphone
- `PHYSICAL` : Physique
- `KIOSK` : Borne
- `THIRD_PARTY` : Tiers

#### `delivery_method`
- `DIGITAL` : Numérique
- `EMAIL` : Email
- `SMS` : SMS
- `MOBILE_APP` : App mobile
- `PHYSICAL_MAIL` : Courrier
- `PICKUP` : Retrait
- `HOME_DELIVERY` : Livraison domicile



---

## 📄 Table `order_items` - Articles commande

**Description** : Détail des articles contenus dans chaque commande (billets, abonnements, services).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `order_id` | UUID | NOT NULL, FK | - | Référence commande |
| `item_type` | ENUM | NOT NULL | - | Type article |
| `item_id` | UUID | NOT NULL | - | ID article spécifique |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur |
| `event_id` | UUID | NULL, FK | - | Événement si applicable |
| `product_name` | VARCHAR(300) | NOT NULL | - | Nom produit |
| `product_description` | TEXT | NULL | - | Description produit |
| `sku` | VARCHAR(100) | NULL | - | Référence produit |
| `category` | VARCHAR(100) | NULL | - | Catégorie |
| `quantity` | INTEGER | NOT NULL | 1 | Quantité |
| `unit_price` | DECIMAL(10,2) | NOT NULL | - | Prix unitaire |
| `base_price` | DECIMAL(10,2) | NOT NULL | - | Prix de base |
| `discount_amount` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Remise unitaire |
| `discount_type` | ENUM | NULL | - | Type remise |
| `discount_reason` | VARCHAR(200) | NULL | - | Raison remise |
| `tax_rate` | DECIMAL(5,4) | DEFAULT 0 | 0.0000 | Taux taxe |
| `tax_amount` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Montant taxe |
| `fees` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Frais additionnels |
| `line_total` | DECIMAL(12,2) | NOT NULL | - | Total ligne |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `commission_rate` | DECIMAL(5,4) | NULL | - | Taux commission |
| `commission_amount` | DECIMAL(10,2) | NULL | - | Montant commission |
| `cost_basis` | DECIMAL(10,2) | NULL | - | Coût de base |
| `profit_margin` | DECIMAL(10,2) | NULL | - | Marge bénéficiaire |
| `delivery_required` | BOOLEAN | NOT NULL | FALSE | Livraison requise |
| `delivery_date` | DATE | NULL | - | Date livraison |
| `delivery_status` | ENUM | NULL | - | Statut livraison |
| `customizations` | JSONB | NULL | - | Personnalisations |
| `special_instructions` | TEXT | NULL | - | Instructions spéciales |
| `fulfillment_notes` | TEXT | NULL | - | Notes exécution |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `item_type`
- `TICKET` : Billet
- `SUBSCRIPTION` : Abonnement
- `MERCHANDISE` : Merchandising
- `FOOD_BEVERAGE` : Restauration
- `PARKING` : Parking
- `UPGRADE` : Amélioration
- `ADDON_SERVICE` : Service complémentaire
- `INSURANCE` : Assurance
- `DONATION` : Don
- `GIFT_CARD` : Carte cadeau
- `MEMBERSHIP` : Adhésion
- `COURSE` : Formation
- `DIGITAL_CONTENT` : Contenu numérique

#### `discount_type`
- `PERCENTAGE` : Pourcentage
- `FIXED_AMOUNT` : Montant fixe
- `BULK_DISCOUNT` : Remise quantité
- `EARLY_BIRD` : Tarif anticipé
- `LOYALTY_DISCOUNT` : Remise fidélité
- `COUPON` : Code promo
- `GROUP_RATE` : Tarif groupe
- `STUDENT_RATE` : Tarif étudiant
- `SENIOR_RATE` : Tarif senior

#### `delivery_status`
- `PENDING` : En attente
- `PROCESSING` : En traitement
- `SHIPPED` : Expédié
- `DELIVERED` : Livré
- `FAILED` : Échec
- `RETURNED` : Retourné

---

## 💳 Table `payments` - Paiements

**Description** : Enregistrement de tous les paiements et transactions financières.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `payment_number` | VARCHAR(50) | UNIQUE, NOT NULL | - | Numéro paiement |
| `order_id` | UUID | NOT NULL, FK | - | Commande associée |
| `user_id` | UUID | NULL, FK | - | Utilisateur payeur |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur bénéficiaire |
| `payment_method_id` | UUID | NOT NULL, FK | - | Méthode paiement |
| `gateway_provider` | ENUM | NOT NULL | - | Fournisseur passerelle |
| `gateway_transaction_id` | VARCHAR(255) | NULL | - | ID transaction passerelle |
| `gateway_reference` | VARCHAR(255) | NULL | - | Référence passerelle |
| `payment_type` | ENUM | NOT NULL | 'PAYMENT' | Type paiement |
| `status` | ENUM | NOT NULL | 'PENDING' | Statut paiement |
| `amount` | DECIMAL(12,2) | NOT NULL | - | Montant |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `exchange_rate` | DECIMAL(10,6) | NULL | - | Taux change |
| `amount_in_base_currency` | DECIMAL(12,2) | NULL | - | Montant devise base |
| `fee_amount` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Frais traitement |
| `gateway_fee` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Frais passerelle |
| `net_amount` | DECIMAL(12,2) | NOT NULL | - | Montant net |
| `processing_time` | INTEGER | NULL | - | Temps traitement (ms) |
| `authorization_code` | VARCHAR(100) | NULL | - | Code autorisation |
| `risk_score` | INTEGER | NULL | - | Score risque (0-100) |
| `fraud_checks` | JSONB | NULL | - | Vérifications fraude |
| `customer_ip` | INET | NULL | - | IP client |
| `customer_location` | JSONB | NULL | - | Localisation client |
| `payment_details` | JSONB | NULL | - | Détails paiement (chiffrés) |
| `billing_address` | JSONB | NULL | - | Adresse facturation |
| `recurring_payment_id` | UUID | NULL, FK | - | Paiement récurrent |
| `installment_plan_id` | UUID | NULL, FK | - | Plan échéancier |
| `installment_number` | INTEGER | NULL | - | Numéro échéance |
| `failure_reason` | TEXT | NULL | - | Raison échec |
| `failure_code` | VARCHAR(50) | NULL | - | Code erreur |
| `retry_count` | INTEGER | DEFAULT 0 | 0 | Nombre tentatives |
| `next_retry_at` | TIMESTAMPTZ | NULL | - | Prochaine tentative |
| `webhook_received` | BOOLEAN | NOT NULL | FALSE | Webhook reçu |
| `webhook_verified` | BOOLEAN | NOT NULL | FALSE | Webhook vérifié |
| `reconciled` | BOOLEAN | NOT NULL | FALSE | Rapprochement fait |
| `reconciliation_date` | DATE | NULL | - | Date rapprochement |
| `notes` | TEXT | NULL | - | Notes |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |
| `authorized_at` | TIMESTAMPTZ | NULL | - | Date autorisation |
| `captured_at` | TIMESTAMPTZ | NULL | - | Date capture |
| `settled_at` | TIMESTAMPTZ | NULL | - | Date règlement |
| `failed_at` | TIMESTAMPTZ | NULL | - | Date échec |
| `cancelled_at` | TIMESTAMPTZ | NULL | - | Date annulation |

### Valeurs ENUM

#### `gateway_provider`
- `FLOUCI` : Flouci (Tunisie)
- `STRIPE` : Stripe
- `PAYPAL` : PayPal
- `VISA_MASTERCARD` : Visa/Mastercard
- `BANK_TRANSFER` : Virement bancaire
- `MOBILE_MONEY` : Paiement mobile
- `CRYPTO` : Cryptomonnaies
- `CASH` : Espèces
- `CHECK` : Chèque
- `WIRE_TRANSFER` : Virement international

#### `payment_type`
- `PAYMENT` : Paiement
- `REFUND` : Remboursement
- `PARTIAL_REFUND` : Remboursement partiel
- `CHARGEBACK` : Rétrofacturation
- `REVERSAL` : Annulation
- `ADJUSTMENT` : Ajustement
- `FEE` : Frais
- `COMMISSION` : Commission

#### `status`
- `PENDING` : En attente
- `PROCESSING` : En traitement
- `AUTHORIZED` : Autorisé
- `CAPTURED` : Capturé
- `SETTLED` : Réglé
- `FAILED` : Échec
- `CANCELLED` : Annulé
- `EXPIRED` : Expiré
- `REFUNDED` : Remboursé
- `DISPUTED` : Contesté

---

## 💳 Table `payment_methods` - Méthodes de paiement

**Description** : Catalog des méthodes de paiement disponibles et leurs configurations.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `name` | VARCHAR(100) | NOT NULL | - | Nom méthode |
| `display_name` | VARCHAR(100) | NOT NULL | - | Nom affichage |
| `type` | ENUM | NOT NULL | - | Type méthode |
| `provider` | ENUM | NOT NULL | - | Fournisseur |
| `countries` | VARCHAR(2)[] | NOT NULL | - | Pays supportés |
| `currencies` | VARCHAR(3)[] | NOT NULL | - | Devises supportées |
| `processing_fee_percent` | DECIMAL(5,4) | DEFAULT 0 | 0.0000 | Frais % |
| `processing_fee_fixed` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Frais fixes |
| `min_amount` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Montant minimum |
| `max_amount` | DECIMAL(12,2) | NULL | - | Montant maximum |
| `processing_time` | INTEGER | NULL | - | Temps traitement (min) |
| `settlement_time` | INTEGER | NULL | - | Délai règlement (heures) |
| `supports_recurring` | BOOLEAN | NOT NULL | FALSE | Paiements récurrents |
| `supports_refunds` | BOOLEAN | NOT NULL | TRUE | Remboursements |
| `supports_partial_refunds` | BOOLEAN | NOT NULL | TRUE | Remboursements partiels |
| `requires_verification` | BOOLEAN | NOT NULL | FALSE | Vérification requise |
| `risk_level` | ENUM | NOT NULL | 'MEDIUM' | Niveau risque |
| `configuration` | JSONB | NOT NULL | - | Configuration |
| `credentials` | JSONB | NULL | - | Identifiants (chiffrés) |
| `webhook_config` | JSONB | NULL | - | Configuration webhooks |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Méthode active |
| `is_default` | BOOLEAN | NOT NULL | FALSE | Méthode par défaut |
| `display_order` | INTEGER | DEFAULT 0 | 0 | Ordre affichage |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `type`
- `CREDIT_CARD` : Carte de crédit
- `DEBIT_CARD` : Carte de débit
- `BANK_TRANSFER` : Virement bancaire
- `DIGITAL_WALLET` : Portefeuille numérique
- `MOBILE_PAYMENT` : Paiement mobile
- `CRYPTOCURRENCY` : Cryptomonnaie
- `CASH` : Espèces
- `CHECK` : Chèque
- `GIFT_CARD` : Carte cadeau
- `LOYALTY_POINTS` : Points fidélité

#### `risk_level`
- `LOW` : Faible
- `MEDIUM` : Moyen
- `HIGH` : Élevé
- `VERY_HIGH` : Très élevé

---

## 💰 Table `refunds` - Remboursements

**Description** : Gestion des demandes et traitements de remboursements.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `refund_number` | VARCHAR(50) | UNIQUE, NOT NULL | - | Numéro remboursement |
| `order_id` | UUID | NOT NULL, FK | - | Commande originale |
| `payment_id` | UUID | NOT NULL, FK | - | Paiement original |
| `user_id` | UUID | NULL, FK | - | Utilisateur demandeur |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur |
| `refund_type` | ENUM | NOT NULL | - | Type remboursement |
| `reason` | ENUM | NOT NULL | - | Raison remboursement |
| `reason_description` | TEXT | NULL | - | Description détaillée |
| `status` | ENUM | NOT NULL | 'PENDING' | Statut |
| `requested_amount` | DECIMAL(12,2) | NOT NULL | - | Montant demandé |
| `approved_amount` | DECIMAL(12,2) | NULL | - | Montant approuvé |
| `processed_amount` | DECIMAL(12,2) | NULL | - | Montant traité |
| `refund_fee` | DECIMAL(10,2) | DEFAULT 0 | 0.00 | Frais remboursement |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `gateway_refund_id` | VARCHAR(255) | NULL | - | ID remboursement passerelle |
| `processing_time` | INTEGER | NULL | - | Temps traitement |
| `requires_approval` | BOOLEAN | NOT NULL | TRUE | Approbation requise |
| `auto_approved` | BOOLEAN | NOT NULL | FALSE | Approbation automatique |
| `approval_rules` | JSONB | NULL | - | Règles approbation |
| `evidence_provided` | JSONB | NULL | - | Preuves fournies |
| `policy_compliance` | JSONB | NULL | - | Conformité politique |
| `customer_communication` | JSONB | NULL | - | Communication client |
| `internal_notes` | TEXT | NULL | - | Notes internes |
| `requested_by` | UUID | NULL, FK | - | Demandé par |
| `approved_by` | UUID | NULL, FK | - | Approuvé par |
| `processed_by` | UUID | NULL, FK | - | Traité par |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date demande |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |
| `approved_at` | TIMESTAMPTZ | NULL | - | Date approbation |
| `processed_at` | TIMESTAMPTZ | NULL | - | Date traitement |
| `completed_at` | TIMESTAMPTZ | NULL | - | Date finalisation |

### Valeurs ENUM

#### `refund_type`
- `FULL_REFUND` : Remboursement complet
- `PARTIAL_REFUND` : Remboursement partiel
- `CANCELLATION` : Annulation
- `NO_SHOW` : Absence
- `EVENT_CANCELLED` : Événement annulé
- `EVENT_POSTPONED` : Événement reporté
- `DUPLICATE_PAYMENT` : Paiement dupliqué
- `FRAUDULENT` : Frauduleux
- `TECHNICAL_ERROR` : Erreur technique

#### `reason`
- `CUSTOMER_REQUEST` : Demande client
- `EVENT_CANCELLED` : Événement annulé
- `EVENT_POSTPONED` : Événement reporté
- `EVENT_CHANGED` : Événement modifié
- `TECHNICAL_ISSUE` : Problème technique
- `DUPLICATE_ORDER` : Commande dupliquée
- `FRAUD_SUSPECTED` : Fraude suspectée
- `PAYMENT_ERROR` : Erreur paiement
- `POLICY_VIOLATION` : Violation politique
- `GOODWILL` : Geste commercial

#### `status`
- `PENDING` : En attente
- `UNDER_REVIEW` : En cours révision
- `APPROVED` : Approuvé
- `REJECTED` : Rejeté
- `PROCESSING` : En traitement
- `COMPLETED` : Terminé
- `FAILED` : Échec
- `CANCELLED` : Annulé

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Commandes ↔ Utilisateurs (nullable)
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Commandes ↔ Organisateurs
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_organizer 
FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

-- Articles ↔ Commandes
ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Paiements ↔ Commandes
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

-- Paiements ↔ Méthodes
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_method 
FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT;

-- Remboursements ↔ Commandes
ALTER TABLE refunds 
ADD CONSTRAINT fk_refunds_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

-- Remboursements ↔ Paiements
ALTER TABLE refunds 
ADD CONSTRAINT fk_refunds_payment 
FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT;
```

### Contraintes de validation

```sql
-- Contact obligatoire pour commandes anonymes
ALTER TABLE orders ADD CONSTRAINT chk_order_contact 
CHECK (
    user_id IS NOT NULL OR 
    (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
);

-- Montants positifs ou nuls
ALTER TABLE orders ADD CONSTRAINT chk_order_amounts_positive 
CHECK (
    subtotal_amount >= 0 AND 
    total_amount >= 0 AND 
    paid_amount >= 0 AND 
    refunded_amount >= 0
);

-- Cohérence montants paiement
ALTER TABLE payments ADD CONSTRAINT chk_payment_amounts 
CHECK (
    amount > 0 AND 
    net_amount >= 0 AND 
    fee_amount >= 0
);

-- Montants remboursement logiques
ALTER TABLE refunds ADD CONSTRAINT chk_refund_amounts 
CHECK (
    requested_amount > 0 AND 
    (approved_amount IS NULL OR approved_amount >= 0) AND
    (processed_amount IS NULL OR processed_amount >= 0)
);

-- Quantité articles positive
ALTER TABLE order_items ADD CONSTRAINT chk_item_quantity_positive 
CHECK (quantity > 0);
```

### Index de performance

```sql
-- Recherche commandes anonymes
CREATE INDEX idx_orders_anonymous ON orders(organizer_id, status, created_at DESC) 
WHERE user_id IS NULL;

-- Performance paiements par statut
CREATE INDEX idx_payments_status_date ON payments(
    status, created_at DESC, organizer_id
);

-- Recherche remboursements en attente
CREATE INDEX idx_refunds_pending ON refunds(status, created_at) 
WHERE status IN ('PENDING', 'UNDER_REVIEW');

-- Performance commandes par organisateur
CREATE INDEX idx_orders_organizer_date ON orders(
    organizer_id, status, created_at DESC
);

-- Recherche par numéro commande
CREATE INDEX idx_orders_number ON orders(order_number);
```

---

## 📊 Métriques et KPIs

### Indicateurs de conversion onboarding
- **Clés générées** : Nombre de clés secrètes créées/période
- **Taux utilisation** : % clés utilisées pour inscription
- **ROI incentives** : Retour sur investissement des bonus
- **Performance campagnes** : Efficacité par campaign_id

### Indicateurs financiers
- **Revenus totaux** : CA par période et organisateur
- **Panier moyen** : Valeur moyenne commandes
- **Taux conversion** : Visiteurs → acheteurs
- **Revenus anonymes** : % CA sans compte utilisateur

### Indicateurs de performance
- **Temps traitement** : Délai moyen paiement
- **Taux succès paiement** : % transactions réussies
- **Taux remboursement** : % montant remboursé/CA
- **Coût acquisition** : Coût par transaction

### Indicateurs opérationnels
- **Méthodes populaires** : Répartition par méthode paiement
- **Performance gateway** : Taux succès par fournisseur
- **Délai réconciliation** : Temps rapprochement comptable
- **Satisfaction paiement** : NPS processus checkout

Cette documentation couvre l'écosystème complet des commandes et paiements dans Entrix V3.0, intégrant les workflows anonymes avec mécanismes d'onboarding intelligents via metadata pour maximiser l'acquisition et la conversion tout en maintenant la sécurité et la traçabilité.