# DOCUMENTATION MODULE PAIEMENTS & FACTURATION
## Plateforme Entrix - Système de Paiements et Gestion Commerciale

---

**Version :** 1.0  
**Date :** Juin 2025  
**Système :** Gestion complète des paiements, commandes et facturation  

---

## 📋 VUE D'ENSEMBLE DU MODULE

### Principe général
Le module Paiements & Facturation d'Entrix gère l'intégralité du cycle commercial et financier :

1. **COMMANDES** : Création et gestion des commandes de billets/abonnements
2. **PAIEMENTS** : Intégration Flouci et traitement des transactions
3. **COMMISSIONS** : Calcul et répartition des commissions club
4. **REMBOURSEMENTS** : Gestion des annulations et avoirs
5. **WEBHOOKS** : Réception et traitement des notifications Flouci
6. **RAPPORTS** : Suivi financier et comptable

### Architecture du module
- Commandes centralisées avec lignes détaillées
- Intégration native Flouci (portefeuille mobile tunisien)
- Gestion automatique des commissions club/plateforme
- Système de remboursements et avoirs flexible
- Traçabilité complète des tentatives de paiement
- Webhooks sécurisés pour synchronisation temps réel

---

## 🗄️ TABLES DU SYSTÈME

### **1. Table `payment_methods`**

#### **Rôle de la table**
Catalogue des méthodes de paiement disponibles. Configure les paramètres d'intégration pour chaque passerelle de paiement (principalement Flouci).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `110e8400-e29b-41d4-a716-446655440001` |
| `code` | VARCHAR(50) | Unique, NOT NULL | Code méthode | `FLOUCI`, `FLOUCI_WALLET`, `BANK_CARD` |
| `name` | VARCHAR(100) | NOT NULL | Nom affiché | `Flouci`, `Portefeuille Flouci`, `Carte bancaire` |
| `provider` | VARCHAR(50) | NOT NULL | Fournisseur service | `flouci`, `stripe`, `paypal` |
| `type` | VARCHAR(30) | NOT NULL | Type paiement | `MOBILE_WALLET`, `CREDIT_CARD`, `BANK_TRANSFER` |
| `is_active` | BOOLEAN | Default: true | Méthode active | `true`, `false` |
| `is_default` | BOOLEAN | Default: false | Méthode par défaut | `true`, `false` |
| `min_amount` | DECIMAL(10,2) | Default: 0 | Montant minimum TND | `1.00`, `5.00`, `10.00` |
| `max_amount` | DECIMAL(10,2) | Optional | Montant maximum TND | `1000.00`, `5000.00` |
| `processing_fee_fixed` | DECIMAL(8,2) | Default: 0 | Frais fixes TND | `0.50`, `1.00` |
| `processing_fee_percent` | DECIMAL(5,4) | Default: 0 | Frais pourcentage | `0.025` (2.5%), `0.035` (3.5%) |
| `currency` | VARCHAR(3) | Default: TND | Devise supportée | `TND`, `EUR`, `USD` |
| `configuration` | JSONB | NOT NULL | Config technique | Voir exemples |
| `display_order` | INTEGER | Default: 0 | Ordre affichage | `10`, `20`, `30` |
| `logo_url` | VARCHAR(255) | Optional | URL logo | `https://cdn.flouci.com/logo.png` |
| `description` | TEXT | Optional | Description utilisateur | `Paiement rapide via portefeuille mobile` |
| `metadata` | JSONB | Optional | Données additionnelles | `{"country": "TN", "languages": ["ar", "fr"]}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-06-30T10:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-30T15:30:00Z` |

#### **Exemples de données**

**Flouci - Méthode principale :**
```json
{
  "id": "110e8400-e29b-41d4-a716-446655440001",
  "code": "FLOUCI",
  "name": "Flouci",
  "provider": "flouci",
  "type": "MOBILE_WALLET",
  "is_active": true,
  "is_default": true,
  "min_amount": 1.00,
  "max_amount": 2000.00,
  "processing_fee_fixed": 0.50,
  "processing_fee_percent": 0.025,
  "currency": "TND",
  "configuration": {
    "api_endpoint": "https://developers.flouci.com/api/",
    "app_token": "flouci_app_token_xyz123",
    "app_secret": "flouci_secret_abc456",
    "success_url": "https://entrix.tn/payment/success",
    "fail_url": "https://entrix.tn/payment/failed",
    "webhook_url": "https://api.entrix.tn/webhooks/flouci",
    "timeout_seconds": 300,
    "auto_redirect": true
  },
  "display_order": 10,
  "logo_url": "https://cdn.flouci.com/logo.png",
  "description": "Paiement rapide et sécurisé via votre portefeuille mobile Flouci",
  "metadata": {
    "country": "TN",
    "languages": ["ar", "fr"],
    "supported_banks": ["STB", "BNA", "BIAT", "Attijari", "Amen"],
    "integration_version": "v2.1",
    "sandbox_mode": false
  },
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-06-30T15:30:00Z"
}
```

**Flouci Sandbox (développement) :**
```json
{
  "id": "110e8400-e29b-41d4-a716-446655440002",
  "code": "FLOUCI_SANDBOX",
  "name": "Flouci (Test)",
  "provider": "flouci",
  "type": "MOBILE_WALLET",
  "is_active": true,
  "is_default": false,
  "min_amount": 0.10,
  "max_amount": 100.00,
  "processing_fee_fixed": 0.00,
  "processing_fee_percent": 0.00,
  "currency": "TND",
  "configuration": {
    "api_endpoint": "https://developers.flouci.com/api/",
    "app_token": "sandbox_token_test123",
    "app_secret": "sandbox_secret_test456",
    "success_url": "https://dev.entrix.tn/payment/success",
    "fail_url": "https://dev.entrix.tn/payment/failed",
    "webhook_url": "https://api-dev.entrix.tn/webhooks/flouci",
    "timeout_seconds": 60,
    "auto_redirect": false
  },
  "display_order": 90,
  "description": "Mode test pour développement",
  "metadata": {
    "sandbox_mode": true,
    "test_only": true
  },
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-06-30T15:30:00Z"
}
```

---

### **2. Table `orders`**

#### **Rôle de la table**
Commandes principales groupant un ou plusieurs achats. Point central du processus commercial avant transformation en droits d'accès.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `220e8400-e29b-41d4-a716-446655440001` |
| `order_number` | VARCHAR(50) | Unique, NOT NULL | Numéro commande | `ORD-2025-001234`, `CMD-CA-EST-2025-0567` |
| `user_id` | UUID | Foreign Key, Optional | Utilisateur acheteur | UUID de users ou `null` (invité) |
| `guest_email` | VARCHAR(255) | Optional | Email invité | `supporter@email.com` |
| `guest_phone` | VARCHAR(20) | Optional | Téléphone invité | `+216 98 123 456` |
| `guest_name` | VARCHAR(200) | Optional | Nom complet invité | `Ahmed Ben Ali` |
| `status` | order_status | Default: DRAFT | Statut commande | `DRAFT`, `PENDING`, `PAID`, `CANCELLED` |
| `total_amount` | DECIMAL(10,2) | NOT NULL | Montant total TND | `45.00`, `150.00`, `1200.00` |
| `subtotal_amount` | DECIMAL(10,2) | NOT NULL | Sous-total avant remises | `50.00`, `160.00`, `1300.00` |
| `discount_amount` | DECIMAL(10,2) | Default: 0 | Remise totale appliquée | `5.00`, `10.00`, `100.00` |
| `tax_amount` | DECIMAL(10,2) | Default: 0 | Montant taxes | `0.00` (Tunisie pas de TVA sports) |
| `processing_fee` | DECIMAL(8,2) | Default: 0 | Frais traitement | `1.50`, `3.75` |
| `currency` | VARCHAR(3) | Default: TND | Devise | `TND`, `EUR` |
| `payment_method_id` | UUID | Foreign Key, Optional | Méthode paiement choisie | UUID payment_methods |
| `expires_at` | TIMESTAMPTZ | Optional | Expiration réservation | `2025-06-30T15:00:00Z` |
| `purchase_channel` | VARCHAR(50) | NOT NULL | Canal d'achat | `WEB`, `MOBILE_APP`, `ADMIN`, `API` |
| `ip_address` | INET | Optional | IP acheteur | `41.226.11.226` |
| `user_agent` | TEXT | Optional | Navigateur/app | `Mozilla/5.0...`, `EntrixApp/2.1.0` |
| `notes` | TEXT | Optional | Notes commande | `Demande place côte tribune` |
| `coupon_code` | VARCHAR(50) | Optional | Code promo utilisé | `EARLY2025`, `FAMILLE10` |
| `referrer` | VARCHAR(255) | Optional | Source traffic | `facebook.com`, `google`, `direct` |
| `language` | VARCHAR(2) | Default: fr | Langue interface | `fr`, `ar`, `en` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `confirmed_at` | TIMESTAMPTZ | Optional | Date confirmation | `2025-06-30T14:45:00Z` |
| `cancelled_at` | TIMESTAMPTZ | Optional | Date annulation | `null` |
| `cancellation_reason` | TEXT | Optional | Motif annulation | `Paiement échoué`, `Demande client` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-06-30T14:35:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-30T14:45:00Z` |

#### **Exemples de données**

**Commande utilisateur connecté :**
```json
{
  "id": "220e8400-e29b-41d4-a716-446655440001",
  "order_number": "ORD-2025-001234",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "guest_email": null,
  "guest_phone": null,
  "guest_name": null,
  "status": "PAID",
  "total_amount": 90.00,
  "subtotal_amount": 100.00,
  "discount_amount": 10.00,
  "tax_amount": 0.00,
  "processing_fee": 2.50,
  "currency": "TND",
  "payment_method_id": "110e8400-e29b-41d4-a716-446655440001",
  "expires_at": null,
  "purchase_channel": "WEB",
  "ip_address": "41.226.11.226",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "notes": null,
  "coupon_code": "EARLY2025",
  "referrer": "facebook.com",
  "language": "fr",
  "metadata": {
    "cart_session_id": "cart_session_xyz123",
    "utm_source": "facebook",
    "utm_campaign": "derby_promotion",
    "device_type": "desktop",
    "browser": "Chrome",
    "selected_seats": ["A-15-12", "A-15-13"],
    "notification_preferences": {
      "email": true,
      "sms": false
    }
  },
  "confirmed_at": "2025-06-30T14:45:00Z",
  "cancelled_at": null,
  "cancellation_reason": null,
  "created_at": "2025-06-30T14:35:00Z",
  "updated_at": "2025-06-30T14:45:00Z"
}
```

**Commande invité :**
```json
{
  "id": "220e8400-e29b-41d4-a716-446655440002",
  "order_number": "ORD-2025-001235",
  "user_id": null,
  "guest_email": "fatma.supporter@email.com",
  "guest_phone": "+216 22 345 678",
  "guest_name": "Fatma Ben Salem",
  "status": "PENDING",
  "total_amount": 35.00,
  "subtotal_amount": 35.00,
  "discount_amount": 0.00,
  "tax_amount": 0.00,
  "processing_fee": 1.25,
  "currency": "TND",
  "payment_method_id": "110e8400-e29b-41d4-a716-446655440001",
  "expires_at": "2025-06-30T15:00:00Z",
  "purchase_channel": "MOBILE_APP",
  "ip_address": "197.15.23.145",
  "user_agent": "EntrixApp/2.1.0 (iOS 17.2; iPhone14,2)",
  "notes": "Première fois au stade",
  "coupon_code": null,
  "referrer": null,
  "language": "fr",
  "metadata": {
    "app_version": "2.1.0",
    "guest_checkout": true,
    "newsletter_signup": true,
    "device_id": "iphone_abc123def456"
  },
  "confirmed_at": null,
  "cancelled_at": null,
  "cancellation_reason": null,
  "created_at": "2025-06-30T14:40:00Z",
  "updated_at": "2025-06-30T14:42:00Z"
}
```

---

### **3. Table `order_items`**

#### **Rôle de la table**
Lignes détaillées de chaque commande. Chaque item représente un type de billet ou abonnement avec quantité et prix.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `330e8400-e29b-41d4-a716-446655440001` |
| `order_id` | UUID | Foreign Key, NOT NULL | Commande parent | UUID de orders |
| `item_type` | VARCHAR(20) | NOT NULL | Type d'article | `TICKET`, `SUBSCRIPTION` |
| `item_id` | UUID | NOT NULL | ID article (ticket/abonnement) | UUID tickets ou subscriptions |
| `event_id` | UUID | Foreign Key, Optional | Événement concerné | UUID events (si ticket) |
| `ticket_type_id` | UUID | Foreign Key, Optional | Type billet | UUID ticket_types |
| `subscription_plan_id` | UUID | Foreign Key, Optional | Plan abonnement | UUID subscription_plans |
| `quantity` | INTEGER | NOT NULL | Quantité | `1`, `2`, `4` |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Prix unitaire TND | `25.00`, `50.00`, `450.00` |
| `total_price` | DECIMAL(10,2) | NOT NULL | Prix total ligne | `25.00`, `100.00`, `450.00` |
| `original_price` | DECIMAL(10,2) | NOT NULL | Prix catalogue | `30.00`, `50.00`, `450.00` |
| `discount_amount` | DECIMAL(10,2) | Default: 0 | Remise ligne | `5.00`, `0.00` |
| `discount_reason` | VARCHAR(100) | Optional | Motif remise | `EARLY_BIRD`, `GROUP_DISCOUNT`, `PROMO_CODE` |
| `zone_category` | VARCHAR(50) | Optional | Catégorie zone | `VIP`, `PREMIUM`, `STANDARD`, `BASIC` |
| `seat_selection` | JSONB | Optional | Places choisies | `["A-15-12", "A-15-13"]` |
| `special_requests` | TEXT | Optional | Demandes spéciales | `Places côte à côte`, `Accès PMR` |
| `metadata` | JSONB | Optional | Données additionnelles | Voir exemples |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-06-30T14:35:00Z` |

#### **Exemples de données**

**Ligne billet match :**
```json
{
  "id": "330e8400-e29b-41d4-a716-446655440001",
  "order_id": "220e8400-e29b-41d4-a716-446655440001",
  "item_type": "TICKET",
  "item_id": "aa0e8400-e29b-41d4-a716-446655440001",
  "event_id": "880e8400-e29b-41d4-a716-446655440001",
  "ticket_type_id": "tt0e8400-e29b-41d4-a716-446655440001",
  "subscription_plan_id": null,
  "quantity": 2,
  "unit_price": 45.00,
  "total_price": 90.00,
  "original_price": 50.00,
  "discount_amount": 10.00,
  "discount_reason": "EARLY_BIRD",
  "zone_category": "PREMIUM",
  "seat_selection": ["A-15-12", "A-15-13"],
  "special_requests": "Places côte à côte avec vue dégagée",
  "metadata": {
    "event_title": "CA vs EST - Derby Capital",
    "event_date": "2025-07-15T20:00:00Z",
    "ticket_type": "Tribune Principale",
    "zone_name": "Tribune Nord",
    "sector": "A",
    "row": "15",
    "pricing_rule_applied": "EARLY_BIRD_20",
    "generated_tickets": [
      "ticket_qr_abc123",
      "ticket_qr_def456"
    ]
  },
  "created_at": "2025-06-30T14:35:00Z"
}
```

**Ligne abonnement saison :**
```json
{
  "id": "330e8400-e29b-41d4-a716-446655440002",
  "order_id": "220e8400-e29b-41d4-a716-446655440002",
  "item_type": "SUBSCRIPTION",
  "item_id": "sub0e8400-e29b-41d4-a716-446655440001",
  "event_id": null,
  "ticket_type_id": null,
  "subscription_plan_id": "sp0e8400-e29b-41d4-a716-446655440001",
  "quantity": 1,
  "unit_price": 420.00,
  "total_price": 420.00,
  "original_price": 450.00,
  "discount_amount": 30.00,
  "discount_reason": "MEMBER_DISCOUNT",
  "zone_category": "STANDARD",
  "seat_selection": null,
  "special_requests": "Place attitrée si possible",
  "metadata": {
    "subscription_plan": "Abonnement Saison 2025-2026",
    "duration_months": 9,
    "included_matches": 15,
    "benefits": [
      "Entrée prioritaire",
      "Remise boutique 10%",
      "Newsletter exclusive"
    ],
    "seat_assigned": "B-12-08",
    "card_delivery": "pickup_stadium"
  },
  "created_at": "2025-06-30T14:40:00Z"
}
```

---

### **4. Table `payments`**

#### **Rôle de la table**
Transactions de paiement effectives. Chaque paiement est lié à une commande et traite avec une méthode de paiement spécifique.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `440e8400-e29b-41d4-a716-446655440001` |
| `payment_number` | VARCHAR(50) | Unique, NOT NULL | Numéro paiement | `PAY-2025-001234`, `FLOUCI-2025-567890` |
| `order_id` | UUID | Foreign Key, NOT NULL | Commande liée | UUID de orders |
| `payment_method_id` | UUID | Foreign Key, NOT NULL | Méthode utilisée | UUID de payment_methods |
| `amount` | DECIMAL(10,2) | NOT NULL | Montant transaction TND | `92.50`, `421.25` |
| `currency` | VARCHAR(3) | Default: TND | Devise | `TND` |
| `status` | payment_status | Default: PENDING | Statut paiement | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` |
| `external_transaction_id` | VARCHAR(100) | Optional | ID externe (Flouci) | `flouci_txn_abc123def456` |
| `external_reference` | VARCHAR(100) | Optional | Référence externe | `FLC_REF_789012` |
| `gateway_response` | JSONB | Optional | Réponse passerelle | Réponse complète Flouci |
| `processing_fee` | DECIMAL(8,2) | Default: 0 | Frais traitement | `2.50`, `10.53` |
| `net_amount` | DECIMAL(10,2) | NOT NULL | Montant net reçu | `90.00`, `410.72` |
| `exchange_rate` | DECIMAL(10,6) | Default: 1 | Taux change | `1.000000`, `3.250000` (si EUR) |
| `payment_date` | TIMESTAMPTZ | Optional | Date paiement effectif | `2025-06-30T14:47:23Z` |
| `expires_at` | TIMESTAMPTZ | Optional | Expiration session | `2025-06-30T15:00:00Z` |
| `callback_url` | VARCHAR(255) | Optional | URL retour | `https://entrix.tn/payment/callback/abc123` |
| `redirect_url` | VARCHAR(255) | Optional | URL redirection | `https://payment.flouci.com/session/xyz789` |
| `ip_address` | INET | Optional | IP transaction | `41.226.11.226` |
| `user_agent` | TEXT | Optional | Navigateur | `Mozilla/5.0...` |
| `failure_reason` | TEXT | Optional | Raison échec | `Insufficient funds`, `Transaction cancelled` |
| `refund_reason` | TEXT | Optional | Motif remboursement | `Event cancelled`, `Customer request` |
| `metadata` | JSONB | Optional | Données additionnelles | Configuration et détails |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-06-30T14:45:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-30T14:47:23Z` |

#### **Exemples de données**

**Paiement Flouci réussi :**
```json
{
  "id": "440e8400-e29b-41d4-a716-446655440001",
  "payment_number": "PAY-2025-001234",
  "order_id": "220e8400-e29b-41d4-a716-446655440001",
  "payment_method_id": "110e8400-e29b-41d4-a716-446655440001",
  "amount": 92.50,
  "currency": "TND",
  "status": "COMPLETED",
  "external_transaction_id": "flouci_txn_abc123def456",
  "external_reference": "FLC_REF_789012",
  "gateway_response": {
    "result": "SUCCESS",
    "transaction_id": "flouci_txn_abc123def456",
    "payment_reference": "FLC_REF_789012",
    "amount": 92.50,
    "currency": "TND",
    "payment_method": "flouci_wallet",
    "customer_phone": "+216********56",
    "timestamp": "2025-06-30T14:47:23Z",
    "fee_amount": 2.31,
    "net_amount": 90.19,
    "status_code": "00",
    "status_message": "Transaction successful"
  },
  "processing_fee": 2.31,
  "net_amount": 90.19,
  "exchange_rate": 1.000000,
  "payment_date": "2025-06-30T14:47:23Z",
  "expires_at": null,
  "callback_url": "https://entrix.tn/payment/callback/ord-2025-001234",
  "redirect_url": "https://payment.flouci.com/session/xyz789",
  "ip_address": "41.226.11.226",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "failure_reason": null,
  "refund_reason": null,
  "metadata": {
    "flouci_session_id": "session_xyz789",
    "payment_link": "https://payment.flouci.com/xyz789",
    "redirect_duration": 45,
    "customer_verified": true,
    "risk_score": "low",
    "payment_duration_seconds": 127
  },
  "created_at": "2025-06-30T14:45:00Z",
  "updated_at": "2025-06-30T14:47:23Z"
}
```

**Paiement échoué :**
```json
{
  "id": "440e8400-e29b-41d4-a716-446655440002",
  "payment_number": "PAY-2025-001235",
  "order_id": "220e8400-e29b-41d4-a716-446655440002",
  "payment_method_id": "110e8400-e29b-41d4-a716-446655440001",
  "amount": 36.25,
  "currency": "TND",
  "status": "FAILED",
  "external_transaction_id": "flouci_txn_failed_789",
  "external_reference": "FLC_REF_FAIL_456",
  "gateway_response": {
    "result": "FAILED",
    "transaction_id": "flouci_txn_failed_789",
    "payment_reference": "FLC_REF_FAIL_456",
    "amount": 36.25,
    "currency": "TND",
    "payment_method": "flouci_wallet",
    "customer_phone": "+216********78",
    "timestamp": "2025-06-30T14:52:10Z",
    "status_code": "51",
    "status_message": "Insufficient funds",
    "error_details": {
      "code": "INSUFFICIENT_FUNDS",
      "description": "Le solde du portefeuille est insuffisant"
    }
  },
  "processing_fee": 0.00,
  "net_amount": 0.00,
  "exchange_rate": 1.000000,
  "payment_date": null,
  "expires_at": "2025-06-30T15:10:00Z",
  "callback_url": "https://entrix.tn/payment/callback/ord-2025-001235",
  "redirect_url": "https://payment.flouci.com/session/abc456",
  "ip_address": "197.15.23.145",
  "user_agent": "EntrixApp/2.1.0 (iOS 17.2; iPhone14,2)",
  "failure_reason": "Insufficient funds - Le solde du portefeuille Flouci est insuffisant",
  "refund_reason": null,
  "metadata": {
    "flouci_session_id": "session_abc456",
    "payment_attempts": 1,
    "retry_allowed": true,
    "suggested_action": "add_funds_or_try_other_method"
  },
  "created_at": "2025-06-30T14:50:00Z",
  "updated_at": "2025-06-30T14:52:10Z"
}
```

---

### **5. Table `payment_attempts`**

#### **Rôle de la table**
Journal de toutes les tentatives de paiement, incluant les échecs. Permet l'analyse des problèmes de conversion et le suivi des abandons.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `550e8400-e29b-41d4-a716-446655440001` |
| `payment_id` | UUID | Foreign Key, NOT NULL | Paiement parent | UUID de payments |
| `attempt_number` | INTEGER | NOT NULL | Numéro tentative | `1`, `2`, `3` |
| `status` | payment_status | NOT NULL | Résultat tentative | `PROCESSING`, `COMPLETED`, `FAILED` |
| `amount` | DECIMAL(10,2) | NOT NULL | Montant tenté | `92.50` |
| `gateway_request` | JSONB | Optional | Requête envoyée | Données envoyées à Flouci |
| `gateway_response` | JSONB | Optional | Réponse reçue | Réponse complète |
| `error_code` | VARCHAR(50) | Optional | Code erreur | `51`, `TIMEOUT`, `NETWORK_ERROR` |
| `error_message` | TEXT | Optional | Message erreur | `Insufficient funds`, `Connection timeout` |
| `processing_time_ms` | INTEGER | Optional | Temps traitement ms | `1234`, `5678`, `30000` |
| `ip_address` | INET | Optional | IP tentative | `41.226.11.226` |
| `user_agent` | TEXT | Optional | Navigateur | `Mozilla/5.0...` |
| `metadata` | JSONB | Optional | Données contextuelles | Détails technique |
| `created_at` | TIMESTAMPTZ | Default: now() | Date tentative | `2025-06-30T14:45:30Z` |

#### **Exemples de données**

**Tentative réussie :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "payment_id": "440e8400-e29b-41d4-a716-446655440001",
  "attempt_number": 1,
  "status": "COMPLETED",
  "amount": 92.50,
  "gateway_request": {
    "app_token": "flouci_app_token_xyz123",
    "amount": 9250,
    "currency": "TND",
    "success_link": "https://entrix.tn/payment/success/ord-2025-001234",
    "fail_link": "https://entrix.tn/payment/failed/ord-2025-001234",
    "session_timeout_secs": 300,
    "developer_tracking_id": "entrix_ord_2025_001234"
  },
  "gateway_response": {
    "result": "SUCCESS",
    "transaction_id": "flouci_txn_abc123def456",
    "payment_reference": "FLC_REF_789012",
    "amount": 92.50,
    "currency": "TND",
    "timestamp": "2025-06-30T14:47:23Z",
    "status_code": "00"
  },
  "error_code": null,
  "error_message": null,
  "processing_time_ms": 2340,
  "ip_address": "41.226.11.226",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "metadata": {
    "session_id": "session_xyz789",
    "redirect_successful": true,
    "customer_completed_flow": true
  },
  "created_at": "2025-06-30T14:45:30Z"
}
```

**Tentative échouée - timeout :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "payment_id": "440e8400-e29b-41d4-a716-446655440002",
  "attempt_number": 1,
  "status": "FAILED",
  "amount": 36.25,
  "gateway_request": {
    "app_token": "flouci_app_token_xyz123",
    "amount": 3625,
    "currency": "TND",
    "success_link": "https://entrix.tn/payment/success/ord-2025-001235",
    "fail_link": "https://entrix.tn/payment/failed/ord-2025-001235",
    "session_timeout_secs": 300,
    "developer_tracking_id": "entrix_ord_2025_001235"
  },
  "gateway_response": {
    "result": "TIMEOUT",
    "session_id": "session_abc456",
    "timeout_at": "2025-06-30T15:10:00Z",
    "status_code": "TIMEOUT",
    "message": "Session expired without payment"
  },
  "error_code": "TIMEOUT",
  "error_message": "Payment session expired - customer did not complete payment within 5 minutes",
  "processing_time_ms": 300000,
  "ip_address": "197.15.23.145",
  "user_agent": "EntrixApp/2.1.0 (iOS 17.2; iPhone14,2)",
  "metadata": {
    "session_id": "session_abc456",
    "timeout_reason": "customer_abandoned",
    "last_activity": "2025-06-30T14:52:00Z",
    "retry_suggested": true
  },
  "created_at": "2025-06-30T14:50:00Z"
}
```

---

### **6. Table `refunds`**

#### **Rôle de la table**
Gestion des remboursements et avoirs. Traite les annulations de commandes, événements annulés et demandes clients.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `660e8400-e29b-41d4-a716-446655440001` |
| `refund_number` | VARCHAR(50) | Unique, NOT NULL | Numéro remboursement | `REF-2025-001234`, `AVOIR-2025-567` |
| `payment_id` | UUID | Foreign Key, NOT NULL | Paiement remboursé | UUID de payments |
| `order_id` | UUID | Foreign Key, NOT NULL | Commande concernée | UUID de orders |
| `refund_type` | VARCHAR(20) | NOT NULL | Type remboursement | `FULL`, `PARTIAL`, `CREDIT_NOTE` |
| `amount` | DECIMAL(10,2) | NOT NULL | Montant remboursé | `90.00`, `45.00`, `420.00` |
| `currency` | VARCHAR(3) | Default: TND | Devise | `TND` |
| `status` | refund_status | Default: PENDING | Statut | `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `method` | VARCHAR(20) | NOT NULL | Méthode remboursement | `ORIGINAL`, `CREDIT_NOTE`, `BANK_TRANSFER` |
| `reason` | VARCHAR(100) | NOT NULL | Motif | `EVENT_CANCELLED`, `CUSTOMER_REQUEST`, `DUPLICATE_PAYMENT` |
| `description` | TEXT | Optional | Description détaillée | `Match reporté sine die - grève arbitres` |
| `requested_by` | UUID | Foreign Key, Optional | Demandeur | UUID de users |
| `approved_by` | UUID | Foreign Key, Optional | Approbateur | UUID de users (admin) |
| `external_refund_id` | VARCHAR(100) | Optional | ID externe (Flouci) | `flouci_refund_abc123` |
| `processing_fee` | DECIMAL(8,2) | Default: 0 | Frais traitement | `2.25`, `0.00` |
| `net_refund_amount` | DECIMAL(10,2) | NOT NULL | Montant net remboursé | `87.75`, `420.00` |
| `expected_date` | DATE | Optional | Date prévue | `2025-07-05` |
| `completed_date` | TIMESTAMPTZ | Optional | Date effective | `2025-07-03T10:30:00Z` |
| `gateway_response` | JSONB | Optional | Réponse passerelle | Réponse Flouci |
| `metadata` | JSONB | Optional | Données additionnelles | Documents justificatifs |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-07-01T09:00:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-07-03T10:30:00Z` |

#### **Exemples de données**

**Remboursement complet - événement annulé :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "refund_number": "REF-2025-001234",
  "payment_id": "440e8400-e29b-41d4-a716-446655440001",
  "order_id": "220e8400-e29b-41d4-a716-446655440001",
  "refund_type": "FULL",
  "amount": 92.50,
  "currency": "TND",
  "status": "COMPLETED",
  "method": "ORIGINAL",
  "reason": "EVENT_CANCELLED",
  "description": "Match CA vs EST du 15/07/2025 annulé définitivement - Problèmes de sécurité",
  "requested_by": null,
  "approved_by": "admin_user_001",
  "external_refund_id": "flouci_refund_abc123",
  "processing_fee": 0.00,
  "net_refund_amount": 92.50,
  "expected_date": "2025-07-05",
  "completed_date": "2025-07-03T10:30:00Z",
  "gateway_response": {
    "result": "SUCCESS",
    "refund_id": "flouci_refund_abc123",
    "original_transaction_id": "flouci_txn_abc123def456",
    "refund_amount": 92.50,
    "currency": "TND",
    "refund_method": "flouci_wallet",
    "processing_time": "24-48_hours",
    "status_code": "00",
    "status_message": "Refund processed successfully"
  },
  "metadata": {
    "original_payment_date": "2025-06-30T14:47:23Z",
    "event_cancellation_notice": "official_federation_decision",
    "batch_refund": true,
    "batch_id": "batch_refund_2025_07_001",
    "customer_notification_sent": true,
    "automatic_refund": true
  },
  "created_at": "2025-07-01T09:00:00Z",
  "updated_at": "2025-07-03T10:30:00Z"
}
```

**Avoir partiel - demande client :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440002",
  "refund_number": "AVOIR-2025-567",
  "payment_id": "440e8400-e29b-41d4-a716-446655440002",
  "order_id": "220e8400-e29b-41d4-a716-446655440002",
  "refund_type": "CREDIT_NOTE",
  "amount": 420.00,
  "currency": "TND",
  "status": "COMPLETED",
  "method": "CREDIT_NOTE",
  "reason": "CUSTOMER_REQUEST",
  "description": "Déménagement à l'étranger - demande transformation en avoir",
  "requested_by": "110e8400-e29b-41d4-a716-446655440001",
  "approved_by": "staff_user_002",
  "external_refund_id": null,
  "processing_fee": 21.00,
  "net_refund_amount": 399.00,
  "expected_date": null,
  "completed_date": "2025-07-02T14:15:00Z",
  "gateway_response": null,
  "metadata": {
    "credit_note_number": "AV-2025-567",
    "credit_note_value": 399.00,
    "expiry_date": "2026-06-30",
    "transferable": false,
    "usage_conditions": "Valable uniquement pour événements CA",
    "customer_acceptance": true,
    "acceptance_date": "2025-07-02T10:00:00Z",
    "processing_fee_reason": "administrative_costs"
  },
  "created_at": "2025-07-01T16:30:00Z",
  "updated_at": "2025-07-02T14:15:00Z"
}
```

---

### **7. Table `club_commissions`**

#### **Rôle de la table**
Calcul et suivi des commissions dues au club sur les ventes. Gère la répartition financière entre la plateforme et les clubs partenaires.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `770e8400-e29b-41d4-a716-446655440001` |
| `payment_id` | UUID | Foreign Key, NOT NULL | Paiement source | UUID de payments |
| `order_id` | UUID | Foreign Key, NOT NULL | Commande liée | UUID de orders |
| `club_id` | UUID | Foreign Key, NOT NULL | Club bénéficiaire | UUID de clubs |
| `commission_type` | VARCHAR(30) | NOT NULL | Type commission | `PERCENTAGE`, `FIXED`, `TIERED` |
| `base_amount` | DECIMAL(10,2) | NOT NULL | Montant base calcul | `90.00` (prix hors frais) |
| `commission_rate` | DECIMAL(5,4) | Optional | Taux pourcentage | `0.1500` (15%), `0.0800` (8%) |
| `commission_amount` | DECIMAL(10,2) | NOT NULL | Montant commission | `13.50`, `7.20` |
| `platform_fee` | DECIMAL(10,2) | NOT NULL | Frais plateforme | `4.50`, `2.70` |
| `net_to_club` | DECIMAL(10,2) | NOT NULL | Net au club | `85.50`, `87.30` |
| `currency` | VARCHAR(3) | Default: TND | Devise | `TND` |
| `calculation_details` | JSONB | NOT NULL | Détails calcul | Configuration et étapes |
| `status` | commission_status | Default: PENDING | Statut | `PENDING`, `CALCULATED`, `PAID`, `DISPUTED` |
| `payment_due_date` | DATE | NOT NULL | Date échéance | `2025-07-15`, `2025-08-01` |
| `paid_date` | TIMESTAMPTZ | Optional | Date paiement | `2025-07-14T16:00:00Z` |
| `payment_reference` | VARCHAR(100) | Optional | Référence virement | `VIR-CLUB-2025-001234` |
| `notes` | TEXT | Optional | Notes comptables | `Virement mensuel juillet 2025` |
| `metadata` | JSONB | Optional | Données additionnelles | Détails contractuels |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-06-30T14:50:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-07-14T16:00:00Z` |

#### **Exemples de données**

**Commission standard 15% :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440001",
  "payment_id": "440e8400-e29b-41d4-a716-446655440001",
  "order_id": "220e8400-e29b-41d4-a716-446655440001",
  "club_id": "club_ca_001",
  "commission_type": "PERCENTAGE",
  "base_amount": 90.00,
  "commission_rate": 0.1500,
  "commission_amount": 13.50,
  "platform_fee": 4.50,
  "net_to_club": 85.50,
  "currency": "TND",
  "calculation_details": {
    "payment_amount": 92.50,
    "payment_fees": 2.50,
    "base_amount": 90.00,
    "commission_rate": 15.0,
    "commission_calculation": "90.00 * 0.15 = 13.50",
    "platform_fee_rate": 5.0,
    "platform_fee_calculation": "90.00 * 0.05 = 4.50",
    "net_calculation": "90.00 - 13.50 - 4.50 = 85.50",
    "contract_version": "v2.1",
    "tax_included": false
  },
  "status": "PAID",
  "payment_due_date": "2025-07-15",
  "paid_date": "2025-07-14T16:00:00Z",
  "payment_reference": "VIR-CLUB-CA-2025-001234",
  "notes": "Virement groupé mensuel - Juillet 2025",
  "metadata": {
    "contract_id": "ENTRIX-CA-2025",
    "payment_method": "bank_transfer",
    "bank_account": "TN59*****XXXX",
    "batch_payment": true,
    "batch_id": "BATCH-CLUB-CA-202507",
    "invoice_reference": "FACT-CA-202507-001"
  },
  "created_at": "2025-06-30T14:50:00Z",
  "updated_at": "2025-07-14T16:00:00Z"
}
```

**Commission étagée VIP :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "payment_id": "440e8400-e29b-41d4-a716-446655440003",
  "order_id": "220e8400-e29b-41d4-a716-446655440003",
  "club_id": "club_ca_001",
  "commission_type": "TIERED",
  "base_amount": 500.00,
  "commission_rate": null,
  "commission_amount": 50.00,
  "platform_fee": 25.00,
  "net_to_club": 475.00,
  "currency": "TND",
  "calculation_details": {
    "payment_amount": 500.00,
    "payment_fees": 0.00,
    "base_amount": 500.00,
    "tier_structure": [
      {"min": 0, "max": 100, "rate": 0.20},
      {"min": 100, "max": 300, "rate": 0.15},
      {"min": 300, "max": 1000, "rate": 0.10}
    ],
    "tier_calculation": {
      "tier_1": "100 * 0.20 = 20.00",
      "tier_2": "200 * 0.15 = 30.00", 
      "tier_3": "200 * 0.10 = 20.00",
      "total": "70.00"
    },
    "commission_amount": 70.00,
    "platform_fee_rate": 5.0,
    "platform_fee_calculation": "500.00 * 0.05 = 25.00",
    "net_calculation": "500.00 - 70.00 - 25.00 = 405.00",
    "actual_commission": 50.00,
    "vip_discount_applied": 20.00
  },
  "status": "CALCULATED",
  "payment_due_date": "2025-07-31",
  "paid_date": null,
  "payment_reference": null,
  "notes": "Commission VIP avec remise négociée",
  "metadata": {
    "special_rate": true,
    "vip_contract": true,
    "discount_reason": "high_volume_customer",
    "original_commission": 70.00,
    "negotiated_commission": 50.00
  },
  "created_at": "2025-06-30T15:00:00Z",
  "updated_at": "2025-06-30T15:00:00Z"
}
```

---

### **8. Table `payment_webhooks`**

#### **Rôle de la table**
Réception et traitement des webhooks Flouci. Assure la synchronisation en temps réel des statuts de paiement.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `880e8400-e29b-41d4-a716-446655440001` |
| `webhook_id` | VARCHAR(100) | Unique, NOT NULL | ID webhook Flouci | `flouci_webhook_abc123def456` |
| `payment_id` | UUID | Foreign Key, Optional | Paiement lié | UUID de payments ou `null` |
| `event_type` | VARCHAR(50) | NOT NULL | Type événement | `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `REFUND_COMPLETED` |
| `external_transaction_id` | VARCHAR(100) | NOT NULL | ID transaction externe | `flouci_txn_abc123def456` |
| `status` | webhook_status | Default: RECEIVED | Statut traitement | `RECEIVED`, `PROCESSED`, `FAILED`, `IGNORED` |
| `raw_payload` | JSONB | NOT NULL | Payload brut reçu | Données complètes Flouci |
| `parsed_data` | JSONB | Optional | Données parsées | Structure normalisée |
| `signature` | VARCHAR(255) | Optional | Signature sécurité | `sha256_signature_abc123...` |
| `signature_valid` | BOOLEAN | Optional | Signature valide | `true`, `false` |
| `ip_source` | INET | Optional | IP source | `185.30.20.15` (IP Flouci) |
| `user_agent` | TEXT | Optional | User agent | `Flouci-Webhook/1.0` |
| `processing_attempts` | INTEGER | Default: 0 | Tentatives traitement | `0`, `1`, `3` |
| `last_processing_error` | TEXT | Optional | Dernière erreur | `Payment not found in database` |
| `processed_at` | TIMESTAMPTZ | Optional | Date traitement | `2025-06-30T14:47:25Z` |
| `metadata` | JSONB | Optional | Données contextuelles | Logs et détails |
| `created_at` | TIMESTAMPTZ | Default: now() | Date réception | `2025-06-30T14:47:24Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-30T14:47:25Z` |

#### **Exemples de données**

**Webhook succès paiement :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440001",
  "webhook_id": "flouci_webhook_abc123def456",
  "payment_id": "440e8400-e29b-41d4-a716-446655440001",
  "event_type": "PAYMENT_SUCCESS",
  "external_transaction_id": "flouci_txn_abc123def456",
  "status": "PROCESSED",
  "raw_payload": {
    "event": "payment.success",
    "webhook_id": "flouci_webhook_abc123def456",
    "timestamp": "2025-06-30T14:47:24Z",
    "data": {
      "transaction_id": "flouci_txn_abc123def456",
      "payment_reference": "FLC_REF_789012",
      "amount": 92.50,
      "currency": "TND",
      "status": "success",
      "payment_method": "flouci_wallet",
      "customer": {
        "phone": "+216********56",
        "name": "Ahmed B****"
      },
      "merchant": {
        "app_token": "flouci_app_token_xyz123",
        "developer_tracking_id": "entrix_ord_2025_001234"
      },
      "fees": {
        "amount": 2.31,
        "type": "percentage",
        "rate": 2.5
      },
      "net_amount": 90.19
    },
    "signature": "sha256_signature_verification_key"
  },
  "parsed_data": {
    "payment_successful": true,
    "transaction_id": "flouci_txn_abc123def456",
    "amount": 92.50,
    "currency": "TND",
    "fees": 2.31,
    "net_amount": 90.19,
    "customer_phone": "+216********56",
    "payment_method": "flouci_wallet",
    "developer_tracking_id": "entrix_ord_2025_001234"
  },
  "signature": "sha256_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
  "signature_valid": true,
  "ip_source": "185.30.20.15",
  "user_agent": "Flouci-Webhook/1.0",
  "processing_attempts": 1,
  "last_processing_error": null,
  "processed_at": "2025-06-30T14:47:25Z",
  "metadata": {
    "processing_duration_ms": 450,
    "payment_updated": true,
    "order_updated": true,
    "access_rights_generated": true,
    "customer_notified": true,
    "commission_calculated": true
  },
  "created_at": "2025-06-30T14:47:24Z",
  "updated_at": "2025-06-30T14:47:25Z"
}
```

**Webhook échec paiement :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440002",
  "webhook_id": "flouci_webhook_failed_789",
  "payment_id": "440e8400-e29b-41d4-a716-446655440002",
  "event_type": "PAYMENT_FAILED", 
  "external_transaction_id": "flouci_txn_failed_789",
  "status": "PROCESSED",
  "raw_payload": {
    "event": "payment.failed",
    "webhook_id": "flouci_webhook_failed_789",
    "timestamp": "2025-06-30T14:52:11Z",
    "data": {
      "transaction_id": "flouci_txn_failed_789",
      "payment_reference": "FLC_REF_FAIL_456",
      "amount": 36.25,
      "currency": "TND",
      "status": "failed",
      "error": {
        "code": "51",
        "message": "Insufficient funds",
        "description": "Le solde du portefeuille est insuffisant"
      },
      "customer": {
        "phone": "+216********78"
      },
      "merchant": {
        "app_token": "flouci_app_token_xyz123",
        "developer_tracking_id": "entrix_ord_2025_001235"
      }
    },
    "signature": "sha256_signature_failed_verification"
  },
  "parsed_data": {
    "payment_successful": false,
    "transaction_id": "flouci_txn_failed_789",
    "amount": 36.25,
    "currency": "TND",
    "error_code": "51",
    "error_message": "Insufficient funds",
    "customer_phone": "+216********78",
    "developer_tracking_id": "entrix_ord_2025_001235"
  },
  "signature": "sha256_failed_def456ghi789jkl012mno345pqr678stu901vwx234yz567",
  "signature_valid": true,
  "ip_source": "185.30.20.15",
  "user_agent": "Flouci-Webhook/1.0",
  "processing_attempts": 1,
  "last_processing_error": null,
  "processed_at": "2025-06-30T14:52:12Z",
  "metadata": {
    "processing_duration_ms": 230,
    "payment_updated": true,
    "order_status": "PENDING",
    "retry_suggested": true,
    "customer_notified": true
  },
  "created_at": "2025-06-30T14:52:11Z",
  "updated_at": "2025-06-30T14:52:12Z"
}
```
