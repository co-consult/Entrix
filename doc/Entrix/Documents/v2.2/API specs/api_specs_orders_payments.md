# API Specifications - Module Commandes et Paiements
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Commandes](#api-commandes)
4. [API Articles de commandes](#api-articles-de-commandes)
5. [API Paiements](#api-paiements)
6. [API Méthodes de paiement](#api-méthodes-de-paiement)
7. [API Remboursements](#api-remboursements)
8. [API Commissions organisateurs](#api-commissions-organisateurs)
9. [API Checkout anonyme et onboarding](#api-checkout-anonyme-et-onboarding)
10. [API Analytics financières](#api-analytics-financières)
11. [API Webhooks et intégrations](#api-webhooks-et-intégrations)
12. [Codes d'erreur](#codes-derreur)
13. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Commandes et Paiements** constitue le cœur transactionnel d'Entrix V3.0. Il gère l'intégralité de l'écosystème commercial : commandes, paiements, remboursements et gestion financière, avec les innovations majeures de **paiements anonymes** et d'**onboarding intelligent**.

## 🏗️ Architecture innovante V3.0

### **Flux commercial unifié**
```
Panier → Commande → Paiement → Confirmation → QR codes → Onboarding (si anonyme)
```

### **Entités principales**
- **Orders** : Commandes (anonymes et utilisateurs enregistrés)
- **Order Items** : Articles détaillés (billets, abonnements, services)
- **Payments** : Transactions avec providers multiples
- **Payment Methods** : Méthodes configurables par organisateur
- **Refunds** : Remboursements avec workflows d'approbation
- **Organizer Commissions** : Calcul et distribution automatiques

### **Innovations révolutionnaires V3.0**
- **💳 Paiements sans friction** : Achat immédiat sans compte obligatoire
- **🔐 Onboarding intelligent** : Clés secrètes avec incentives personnalisés
- **🎫 Génération automatique** : QR codes universels post-paiement
- **📊 Analytics temps réel** : Suivi performance par canal et segment
- **🔄 Multi-providers** : Support Flouci, PayPal, Stripe, D17, cartes locales

### **Support anonyme natif**
- **Contact minimal** : Email/téléphone suffisants
- **Clés d'onboarding** : Intégrées dans metadata des commandes
- **Incentives configurables** : Bonus points, réductions, accès VIP
- **Migration automatique** : Transfert données vers compte créé

## 🔗 Relations avec autres modules
- **Billetterie** : Génération commandes depuis billets/abonnements
- **Événements** : Association commandes aux événements
- **Utilisateurs** : Comptes enregistrés (optionnel)
- **Organisateurs** : Commissions et reversements
- **Contrôle d'accès** : Génération automatique droits d'accès
- **Notifications** : Communications transactionnelles

---

# Authentification et autorisation

## 🔐 Niveaux d'accès requis

### Consultation commandes
- **Public** : Aucun (checkout anonyme)
- **Utilisateur** : Ses commandes uniquement
- **Organisateur** : Commandes de ses événements/produits
- **Agent support** : Commandes dans son scope
- **Super Admin** : Toutes commandes

### Gestion commandes
- **Utilisateur** : Annulation de ses commandes (sous conditions)
- **Organisateur** : Gestion commandes de ses produits
- **Agent support** : Modifications autorisées
- **Super Admin** : Toutes opérations

### Paiements et remboursements
- **Utilisateur** : Consultation de ses paiements
- **Organisateur** : Paiements de ses ventes + demandes remboursement
- **Finance** : Gestion remboursements et réconciliation
- **Super Admin** : Accès complet

## 🛡️ Headers requis

```http
Authorization: Bearer <JWT_TOKEN> (optionnel pour checkout anonyme)
Content-Type: application/json
X-Organizer-ID: <ORGANIZER_UUID> (pour organisateurs)
X-Guest-Session: <SESSION_UUID> (pour achats anonymes)
X-Payment-Provider: <PROVIDER_NAME> (webhooks)
X-Idempotency-Key: <UNIQUE_KEY> (paiements critiques)
```

---

# API Commandes

## 🛒 Ressource : `/api/v1/orders`

### GET /api/v1/orders
**Description** : Liste paginée des commandes avec filtres avancés

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page (max 100) |
| `user_id` | uuid | - | Commandes d'un utilisateur |
| `organizer_id` | uuid | - | Commandes d'un organisateur |
| `event_id` | uuid | - | Commandes pour un événement |
| `status` | enum | - | Statut commande |
| `channel` | enum | - | Canal de commande |
| `is_guest` | boolean | - | Commandes anonymes |
| `order_type` | enum | - | Type de commande |
| `amount_min` | decimal | - | Montant minimum |
| `amount_max` | decimal | - | Montant maximum |
| `currency` | string | TND | Devise |
| `date_from` | date | - | Date début |
| `date_to` | date | - | Date fin |
| `coupon_code` | string | - | Code promo utilisé |
| `include` | string | - | Relations incluses |
| `sort` | string | created_at | Tri (created_at, total_amount, status) |
| `order` | string | desc | Ordre (asc, desc) |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ord_01H8X9Y2Z3A4B5C6D7E8F9G0",
        "order_number": "ENT-2025-000001",
        "order_type": "REGULAR",
        "status": "CONFIRMED",
        "channel": "WEB",
        "currency": "TND",
        
        // Acheteur (anonyme ou enregistré)
        "user_id": null,
        "guest_name": "Ahmed Supporter",
        "guest_email": "ahmed.supporter@gmail.com",
        "guest_phone": "+21697123456",
        "is_guest_order": true,
        
        // Organisateur principal
        "primary_organizer_id": "org_club_africain",
        "primary_organizer_name": "Club Africain",
        
        // Montants
        "subtotal_amount": 85.00,
        "discount_amount": 15.00,
        "tax_amount": 0.00,
        "processing_fee": 2.50,
        "delivery_fee": 0.00,
        "total_amount": 72.50,
        "paid_amount": 72.50,
        "refunded_amount": 0.00,
        "outstanding_amount": 0.00,
        
        // Promotion
        "coupon_code": "SUPPORTER15",
        "discount_details": {
          "type": "PERCENTAGE",
          "value": 15,
          "description": "Réduction supporters fidèles"
        },
        
        // Source et attribution
        "source": "facebook_ads",
        "affiliate_code": "PARTNER_SFAX",
        "referrer_url": "https://facebook.com/clubafricain",
        "utm_params": {
          "utm_source": "facebook",
          "utm_medium": "social",
          "utm_campaign": "derby_promo"
        },
        
        // Livraison
        "delivery_method": "DIGITAL",
        "delivery_address": null,
        "delivery_status": "DELIVERED",
        
        // Onboarding (pour commandes anonymes)
        "onboarding_eligible": true,
        "onboarding_incentive": {
          "type": "BONUS_POINTS",
          "value": 50,
          "description": "50 points fidélité + accès boutique"
        },
        
        // Métadonnées
        "notes": "Client régulier supporter",
        "special_requests": null,
        "metadata": {
          "onboarding": {
            "secret_key": "ONB_2025_01_A1B2C3D4E5F6",
            "incentive_type": "BONUS_POINTS",
            "incentive_value": 50,
            "campaign_id": "sports_onboarding_2025",
            "expires_at": "2025-02-15T23:59:59Z",
            "used": false
          },
          "analytics": {
            "session_id": "sess_abc123",
            "user_agent": "Mozilla/5.0...",
            "conversion_path": ["homepage", "events", "ticket_selection", "checkout"]
          }
        },
        
        // Timestamps
        "created_at": "2025-01-15T14:30:00Z",
        "updated_at": "2025-01-15T14:32:15Z",
        "confirmed_at": "2025-01-15T14:31:45Z",
        "completed_at": "2025-01-15T14:32:15Z",
        "expires_at": null,
        
        // Relations incluses (selon paramètre include)
        "items": [
          {
            "id": "itm_01H8X9Y2Z3A4B5C6D7E8F9G1",
            "item_type": "TICKET",
            "item_id": "tkt_01H8X9Y2Z3A4B5C6D7E8F9G2",
            "product_name": "Tribune Est - CA vs EST",
            "quantity": 2,
            "unit_price": 42.50,
            "line_total": 85.00,
            "event_name": "Derby CA vs EST",
            "event_date": "2025-02-01T20:00:00Z"
          }
        ],
        "payments": [
          {
            "id": "pay_01H8X9Y2Z3A4B5C6D7E8F9G3",
            "amount": 72.50,
            "status": "COMPLETED",
            "method": "flouci",
            "processed_at": "2025-01-15T14:31:45Z"
          }
        ]
      }
    ],
    
    // Statistiques
    "summary": {
      "total_orders": 1247,
      "total_amount": 156780.50,
      "guest_orders": 423,
      "guest_percentage": 33.9,
      "avg_order_value": 125.86,
      "conversion_rate": 12.4
    },
    
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 1247,
      "last_page": 63,
      "has_more": true
    }
  }
}
```

### POST /api/v1/orders
**Description** : Création d'une nouvelle commande (checkout)

#### Request Body
```json
{
  // Acheteur (utilisateur OU informations anonymes)
  "user_id": null,
  "guest_info": {
    "guest_name": "Fatma Spectateur",
    "guest_email": "fatma.spectateur@gmail.com",
    "guest_phone": "+21698765432",
    "marketing_consent": false
  },
  
  // Articles de la commande
  "items": [
    {
      "item_type": "TICKET",
      "ticket_type_id": "ttype_tribune_nord_ca_est",
      "event_id": "evt_ca_vs_est_derby_2025",
      "quantity": 2,
      "zone_preference": "TRIBUNE_NORD",
      "special_requests": "Places côte à côte si possible"
    },
    {
      "item_type": "ADDON_SERVICE",
      "service_id": "srv_parking_vip",
      "quantity": 1
    }
  ],
  
  // Promotion
  "coupon_code": "FIDELE20",
  
  // Configuration onboarding (pour anonymes)
  "onboarding_config": {
    "generate_incentive": true,
    "preferred_incentive_type": "BONUS_POINTS",
    "campaign_context": "derby_acquisition"
  },
  
  // Canal et attribution
  "channel": "WEB",
  "source": "organic_search",
  "utm_params": {
    "utm_source": "google",
    "utm_medium": "organic",
    "utm_campaign": "derby_search"
  },
  
  // Livraison
  "delivery_method": "DIGITAL",
  "delivery_address": null,
  
  // Session et analytics
  "session_data": {
    "session_id": "sess_xyz789",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0...",
    "ip_address": "196.179.123.45",
    "referrer": "https://google.com/search?q=derby+ca+est"
  }
}
```

#### Validation Rules
- `guest_info` requis si `user_id` est null
- `guest_email` ou `guest_phone` obligatoire pour anonymes
- `items` : minimum 1 article, maximum 10
- `quantity` : entre 1 et 20 par article
- `delivery_method` cohérent avec types d'articles

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_01H8X9Y2Z3A4B5C6D7E8F9G0",
      "order_number": "ENT-2025-000002",
      "status": "PENDING",
      "total_amount": 89.50,
      "currency": "TND",
      
      // Clé d'onboarding générée (si anonyme)
      "onboarding_key": "ONB_2025_01_F6E5D4C3B2A1",
      "onboarding_incentive": {
        "type": "BONUS_POINTS",
        "value": 75,
        "description": "75 points fidélité + accès exclusif supporters"
      },
      
      // Détails complets...
      "expires_at": "2025-01-15T15:30:00Z",
      "payment_required": true,
      "next_steps": [
        "PAYMENT_SELECTION",
        "PAYMENT_PROCESSING"
      ]
    },
    
    // Options de paiement disponibles
    "payment_options": [
      {
        "method_id": "pm_flouci",
        "name": "Flouci",
        "type": "MOBILE_PAYMENT",
        "fees": 1.50,
        "min_amount": 1.00,
        "max_amount": 1000.00,
        "processing_time": "INSTANT"
      },
      {
        "method_id": "pm_d17",
        "name": "D17",
        "type": "MOBILE_PAYMENT", 
        "fees": 2.00,
        "min_amount": 5.00,
        "max_amount": 500.00,
        "processing_time": "INSTANT"
      }
    ]
  },
  "message": "Commande créée avec succès"
}
```

### GET /api/v1/orders/{orderId}
**Description** : Détails complets d'une commande

#### Path Parameters
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `orderId` | uuid | ✓ | ID de la commande |

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `include` | string | - | Relations (items,payments,refunds,access_rights) |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "order": {
      // Données complètes commande avec tous les détails
      // Items, paiements, remboursements, droits d'accès générés
    }
  }
}
```

### PUT /api/v1/orders/{orderId}
**Description** : Modification d'une commande (statuts limités)

#### Request Body
```json
{
  "status": "CANCELLED",
  "cancellation_reason": "CLIENT_REQUEST",
  "notes": "Client souhaite annuler pour changement de programme",
  "notify_customer": true
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "order": {
      // Commande mise à jour
    }
  },
  "message": "Commande mise à jour avec succès"
}
```

---

# API Articles de commandes

## 📦 Ressource : `/api/v1/orders/{orderId}/items`

### GET /api/v1/orders/{orderId}/items
**Description** : Articles d'une commande spécifique

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "itm_01H8X9Y2Z3A4B5C6D7E8F9G1",
        "item_type": "TICKET",
        "item_id": "tkt_derby_tribune_est_001",
        "organizer_id": "org_club_africain",
        "event_id": "evt_ca_vs_est_2025",
        
        // Produit
        "product_name": "Tribune Est - Derby CA vs EST",
        "product_description": "Place numérotée Tribune Est, vue panoramique",
        "sku": "TKT-DERBY-EST-2025",
        "category": "SPORTS_TICKET",
        
        // Prix et quantité
        "quantity": 2,
        "unit_price": 45.00,
        "base_price": 50.00,
        "discount_amount": 5.00,
        "discount_type": "EARLY_BIRD",
        "discount_reason": "Réservation anticipée",
        "tax_rate": 0.0000,
        "tax_amount": 0.00,
        "fees": 1.00,
        "line_total": 91.00,
        "currency": "TND",
        
        // Commission et coûts
        "commission_rate": 0.0500,
        "commission_amount": 4.25,
        "cost_basis": 30.00,
        "profit_margin": 15.00,
        
        // Livraison
        "delivery_required": false,
        "delivery_date": null,
        "delivery_status": "NOT_REQUIRED",
        
        // Personnalisations
        "customizations": {
          "seat_preference": "côte à côte",
          "accessibility_needs": null,
          "dietary_restrictions": null
        },
        "special_instructions": "Places ensemble si possible",
        "fulfillment_notes": "Traité automatiquement",
        
        // Métadonnées
        "metadata": {
          "zone_id": "tribune_est_bloc_c",
          "seat_numbers": ["C-15-23", "C-15-24"],
          "qr_codes": ["QR_C15_23_2025", "QR_C15_24_2025"],
          "access_rights": ["acc_01H8X9Y2Z3A4B5C6D7E8F9G4", "acc_01H8X9Y2Z3A4B5C6D7E8F9G5"]
        },
        
        "created_at": "2025-01-15T14:30:15Z",
        "updated_at": "2025-01-15T14:32:15Z"
      }
    ],
    
    "summary": {
      "total_items": 3,
      "total_quantity": 3,
      "subtotal": 91.00,
      "total_fees": 3.00,
      "grand_total": 94.00
    }
  }
}
```

---

# API Paiements

## 💳 Ressource : `/api/v1/payments`

### GET /api/v1/payments
**Description** : Liste des paiements avec filtres

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page |
| `order_id` | uuid | - | Paiements d'une commande |
| `organizer_id` | uuid | - | Paiements d'un organisateur |
| `status` | enum | - | Statut paiement |
| `method_code` | string | - | Méthode de paiement |
| `provider` | string | - | Fournisseur |
| `amount_min` | decimal | - | Montant minimum |
| `amount_max` | decimal | - | Montant maximum |
| `currency` | string | TND | Devise |
| `date_from` | date | - | Date début |
| `date_to` | date | - | Date fin |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_01H8X9Y2Z3A4B5C6D7E8F9G3",
        "order_id": "ord_01H8X9Y2Z3A4B5C6D7E8F9G0",
        "organizer_id": "org_club_africain",
        "payment_method_id": "pm_flouci",
        
        // Montants
        "amount": 89.50,
        "net_amount": 88.00,
        "fee_amount": 1.50,
        "currency": "TND",
        
        // Statut et processing
        "status": "COMPLETED",
        "provider": "FLOUCI",
        "provider_transaction_id": "FLO_TXN_ABC123DEF456",
        "provider_reference": "REF_FLOUCI_789",
        
        // Informations méthode
        "method_details": {
          "method_name": "Flouci",
          "method_type": "MOBILE_PAYMENT",
          "last_four": null,
          "brand": "FLOUCI",
          "country": "TN"
        },
        
        // Tentatives
        "attempt_count": 1,
        "max_attempts": 3,
        "next_retry_at": null,
        
        // Sécurité
        "risk_score": 12,
        "risk_level": "LOW",
        "fraud_check_passed": true,
        "authentication_method": "3DS2",
        
        // Réconciliation
        "reconciliation_status": "MATCHED",
        "settlement_date": "2025-01-16T00:00:00Z",
        "settlement_amount": 88.00,
        "exchange_rate": 1.0000,
        
        // Métadonnées provider
        "provider_metadata": {
          "flouci_merchant_id": "ENTRIX_PROD",
          "flouci_order_id": "ORDER_123456",
          "authorization_code": "AUTH_789ABC",
          "capture_id": "CAP_DEF456"
        },
        
        // Timestamps
        "initiated_at": "2025-01-15T14:31:00Z",
        "processed_at": "2025-01-15T14:31:45Z",
        "settled_at": "2025-01-16T02:30:00Z",
        "created_at": "2025-01-15T14:31:00Z",
        "updated_at": "2025-01-16T02:30:15Z"
      }
    ],
    
    "summary": {
      "total_payments": 1247,
      "total_amount": 156780.50,
      "successful_amount": 154230.75,
      "success_rate": 98.4,
      "avg_processing_time": 23.5
    },
    
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 1247,
      "last_page": 63
    }
  }
}
```

### POST /api/v1/payments
**Description** : Initiation d'un nouveau paiement

#### Request Body
```json
{
  "order_id": "ord_01H8X9Y2Z3A4B5C6D7E8F9G0",
  "payment_method_id": "pm_flouci",
  "amount": 89.50,
  "currency": "TND",
  
  // Informations spécifiques méthode
  "method_data": {
    "phone_number": "+21697123456",
    "return_url": "https://entrix.tn/payment/return",
    "cancel_url": "https://entrix.tn/payment/cancel"
  },
  
  // Configuration
  "auto_capture": true,
  "save_method": false,
  "customer_ip": "196.179.123.45",
  "user_agent": "Mozilla/5.0...",
  
  // Métadonnées
  "description": "Paiement billet Derby CA vs EST",
  "metadata": {
    "session_id": "sess_xyz789",
    "source": "mobile_app"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_01H8X9Y2Z3A4B5C6D7E8F9G4",
      "status": "PENDING",
      "amount": 89.50,
      "provider_transaction_id": "FLO_PENDING_XYZ789",
      
      // Action requise
      "next_action": {
        "type": "REDIRECT",
        "redirect_url": "https://flouci.com/pay/secure/XYZ789ABC",
        "method": "GET"
      },
      
      "initiated_at": "2025-01-15T14:35:00Z",
      "expires_at": "2025-01-15T14:45:00Z"
    }
  },
  "message": "Paiement initié avec succès"
}
```

### GET /api/v1/payments/{paymentId}
**Description** : Détails d'un paiement

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "payment": {
      // Détails complets paiement
      "id": "pay_01H8X9Y2Z3A4B5C6D7E8F9G3",
      // ... tous les champs détaillés
      
      // Tentatives de paiement
      "attempts": [
        {
          "id": "att_01H8X9Y2Z3A4B5C6D7E8F9G5",
          "attempt_number": 1,
          "status": "SUCCESS",
          "error_code": null,
          "error_message": null,
          "attempted_at": "2025-01-15T14:31:15Z",
          "completed_at": "2025-01-15T14:31:45Z",
          "processing_time": 30.5
        }
      ],
      
      // Logs
      "events": [
        {
          "type": "PAYMENT_INITIATED",
          "timestamp": "2025-01-15T14:31:00Z",
          "data": {"amount": 89.50, "method": "flouci"}
        },
        {
          "type": "PAYMENT_AUTHORIZED",
          "timestamp": "2025-01-15T14:31:30Z",
          "data": {"authorization_code": "AUTH_789ABC"}
        },
        {
          "type": "PAYMENT_CAPTURED",
          "timestamp": "2025-01-15T14:31:45Z",
          "data": {"capture_amount": 89.50}
        }
      ]
    }
  }
}
```

---

# API Méthodes de paiement

## 🏦 Ressource : `/api/v1/payment-methods`

### GET /api/v1/payment-methods
**Description** : Méthodes de paiement disponibles

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `active_only` | boolean | true | Méthodes actives uniquement |
| `amount` | decimal | - | Filtrer par montant supporté |
| `currency` | string | TND | Devise |
| `organizer_id` | uuid | - | Méthodes d'un organisateur |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "payment_methods": [
      {
        "id": "pm_flouci",
        "code": "flouci",
        "name": "Flouci",
        "provider": "FLOUCI",
        "type": "MOBILE_PAYMENT",
        
        // Statut
        "is_active": true,
        "is_default": true,
        
        // Limites
        "min_amount": 1.00,
        "max_amount": 1000.00,
        "supported_currencies": ["TND"],
        
        // Frais
        "processing_fee_fixed": 0.00,
        "processing_fee_percent": 0.0150,
        "fee_calculation": "percentage",
        
        // Configuration
        "requires_authentication": true,
        "supports_refunds": true,
        "supports_partial_refunds": true,
        "average_processing_time": 30,
        "success_rate": 98.7,
        
        // Affichage
        "display_order": 1,
        "icon_url": "https://cdn.entrix.tn/payment-icons/flouci.svg",
        "description": "Paiement mobile rapide et sécurisé",
        
        // Métadonnées publiques
        "metadata": {
          "supported_countries": ["TN"],
          "payment_flow": "redirect",
          "mobile_optimized": true
        }
      },
      {
        "id": "pm_d17",
        "code": "d17",
        "name": "D17",
        "provider": "D17",
        "type": "MOBILE_PAYMENT",
        "is_active": true,
        "is_default": false,
        "min_amount": 5.00,
        "max_amount": 500.00,
        "processing_fee_fixed": 2.00,
        "processing_fee_percent": 0.0000,
        "fee_calculation": "fixed",
        "display_order": 2
      }
    ]
  }
}
```

---

# API Remboursements

## 🔄 Ressource : `/api/v1/refunds`

### GET /api/v1/refunds
**Description** : Liste des demandes de remboursement

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page |
| `order_id` | uuid | - | Remboursements d'une commande |
| `organizer_id` | uuid | - | Remboursements d'un organisateur |
| `status` | enum | - | Statut remboursement |
| `type` | enum | - | Type de remboursement |
| `amount_min` | decimal | - | Montant minimum |
| `amount_max` | decimal | - | Montant maximum |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "refunds": [
      {
        "id": "ref_01H8X9Y2Z3A4B5C6D7E8F9G6",
        "order_id": "ord_01H8X9Y2Z3A4B5C6D7E8F9G0",
        "payment_id": "pay_01H8X9Y2Z3A4B5C6D7E8F9G3",
        "organizer_id": "org_club_africain",
        
        // Type et raison
        "refund_type": "FULL",
        "reason": "EVENT_CANCELLED",
        "reason_details": "Événement annulé par organisateur pour raisons météorologiques",
        
        // Montants
        "requested_amount": 89.50,
        "approved_amount": 89.50,
        "processed_amount": 87.50,
        "fee_amount": 2.00,
        "currency": "TND",
        
        // Statut et workflow
        "status": "PROCESSED",
        "auto_approved": true,
        "requires_manual_review": false,
        
        // Acteurs
        "requested_by": "usr_01H8X9Y2Z3A4B5C6D7E8F9G7",
        "requested_by_name": "Ahmed Supporter",
        "approved_by": "usr_admin_finance",
        "approved_by_name": "Finance Manager",
        
        // Processing
        "provider_refund_id": "FLOUCI_REF_XYZ789",
        "refund_method": "ORIGINAL_PAYMENT_METHOD",
        "estimated_arrival": "2025-01-18T00:00:00Z",
        
        // Justification
        "supporting_documents": [
          {
            "type": "EMAIL",
            "description": "Email annulation événement",
            "url": "https://storage.entrix.tn/refunds/ref_01H8X9Y2Z3A4B5C6D7E8F9G6/email.pdf"
          }
        ],
        
        // Timestamps
        "requested_at": "2025-01-16T10:30:00Z",
        "approved_at": "2025-01-16T11:00:00Z",
        "processed_at": "2025-01-16T15:45:00Z",
        "created_at": "2025-01-16T10:30:00Z",
        "updated_at": "2025-01-16T15:45:15Z"
      }
    ],
    
    "summary": {
      "total_refunds": 89,
      "total_amount": 12450.75,
      "pending_amount": 1250.00,
      "avg_processing_time": 4.2
    }
  }
}
```

### POST /api/v1/refunds
**Description** : Demande de remboursement

#### Request Body
```json
{
  "order_id": "ord_01H8X9Y2Z3A4B5C6D7E8F9G0",
  "payment_id": "pay_01H8X9Y2Z3A4B5C6D7E8F9G3",
  "refund_type": "PARTIAL",
  "requested_amount": 45.00,
  "reason": "CUSTOMER_REQUEST",
  "reason_details": "Client ne peut plus assister à l'événement",
  "items_to_refund": [
    {
      "item_id": "itm_01H8X9Y2Z3A4B5C6D7E8F9G1",
      "quantity": 1,
      "reason": "Plus besoin de cette place"
    }
  ],
  "supporting_documents": [
    {
      "type": "MEDICAL_CERTIFICATE",
      "description": "Certificat médical",
      "base64_data": "data:application/pdf;base64,JVBERi0xLjQK..."
    }
  ],
  "customer_contact": {
    "email": "ahmed.supporter@gmail.com",
    "phone": "+21697123456",
    "preferred_method": "email"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "refund": {
      "id": "ref_01H8X9Y2Z3A4B5C6D7E8F9G8",
      "status": "PENDING",
      "requested_amount": 45.00,
      "estimated_processing_time": "2-5 jours ouvrables",
      "reference_number": "REF-ENT-2025-000123",
      "next_steps": [
        "Validation par équipe finance",
        "Traitement par fournisseur paiement",
        "Notification confirmation"
      ]
    }
  },
  "message": "Demande de remboursement créée avec succès"
}
```

---

# API Checkout anonyme et onboarding

## 🛒 Ressource : `/api/v1/checkout`

### POST /api/v1/checkout/anonymous
**Description** : Checkout optimisé pour utilisateurs anonymes

#### Request Body
```json
{
  // Informations minimales obligatoires
  "guest_info": {
    "guest_name": "Salma Nouvelle",
    "guest_email": "salma.nouvelle@gmail.com",
    "guest_phone": "+21699887766",
    "marketing_consent": true
  },
  
  // Panier
  "cart": {
    "items": [
      {
        "type": "TICKET",
        "ticket_type_id": "ttype_vip_finale_2025",
        "quantity": 1,
        "selected_zone": "VIP_LOUNGE"
      }
    ],
    "coupon_code": "NOUVEAUCLIENT"
  },
  
  // Configuration onboarding
  "onboarding_preferences": {
    "generate_incentive": true,
    "preferred_incentive": "BONUS_POINTS",
    "communication_channel": "EMAIL",
    "language": "fr-TN"
  },
  
  // Paiement
  "payment": {
    "method_id": "pm_flouci",
    "save_for_later": false
  },
  
  // Analytics
  "tracking": {
    "source": "facebook_ads",
    "campaign": "finale_championship_2025",
    "medium": "social",
    "term": "finale+football+tunis"
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    // Commande créée
    "order": {
      "id": "ord_01H8X9Y2Z3A4B5C6D7E8F9G9",
      "order_number": "ENT-2025-000003",
      "total_amount": 150.00,
      "status": "PENDING_PAYMENT"
    },
    
    // Paiement à finaliser
    "payment": {
      "id": "pay_01H8X9Y2Z3A4B5C6D7E8F9GA",
      "redirect_url": "https://flouci.com/pay/secure/ABC123XYZ",
      "expires_at": "2025-01-15T15:00:00Z"
    },
    
    // Onboarding configuré
    "onboarding": {
      "secret_key": "ONB_2025_01_NEWCLIENT789",
      "incentive": {
        "type": "BONUS_POINTS",
        "value": 100,
        "description": "100 points de bienvenue + 10% sur votre prochain achat",
        "expires_at": "2025-02-15T23:59:59Z"
      },
      "conversion_url": "https://entrix.tn/register?key=ONB_2025_01_NEWCLIENT789",
      "email_sent": true
    },
    
    // Prochaines étapes
    "next_steps": {
      "immediate": "COMPLETE_PAYMENT",
      "post_payment": "RECEIVE_TICKETS",
      "optional": "CREATE_ACCOUNT_FOR_BENEFITS"
    }
  },
  "message": "Commande créée avec succès. Finalisez votre paiement."
}
```

### POST /api/v1/onboarding/convert
**Description** : Conversion utilisateur anonyme vers compte enregistré

#### Request Body
```json
{
  "secret_key": "ONB_2025_01_NEWCLIENT789",
  "user_info": {
    "email": "salma.nouvelle@gmail.com",
    "password": "MonMotDePasse123!",
    "first_name": "Salma",
    "last_name": "Nouvelle",
    "phone": "+21699887766",
    "birth_date": "1995-03-15",
    "city": "Tunis",
    "preferences": {
      "favorite_sports": ["FOOTBALL"],
      "notification_email": true,
      "notification_sms": false
    }
  },
  "accept_terms": true,
  "marketing_consent": true
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    // Compte créé
    "user": {
      "id": "usr_01H8X9Y2Z3A4B5C6D7E8F9GB",
      "email": "salma.nouvelle@gmail.com",
      "full_name": "Salma Nouvelle",
      "status": "ACTIVE"
    },
    
    // Incentive appliqué
    "incentive_applied": {
      "type": "BONUS_POINTS",
      "value": 100,
      "points_credited": 100,
      "bonus_applied": true
    },
    
    // Migration données
    "migration_summary": {
      "orders_migrated": 1,
      "tickets_migrated": 1,
      "access_rights_migrated": 1,
      "total_value_migrated": 150.00
    },
    
    // Avantages débloqués
    "unlocked_benefits": [
      "Historique d'achats",
      "Notifications personnalisées",
      "Accès ventes privées",
      "Programme de fidélité",
      "Sauvegarde préférences"
    ],
    
    // Token d'authentification
    "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "rt_01H8X9Y2Z3A4B5C6D7E8F9GC"
  },
  "message": "Compte créé avec succès ! Bienvenue sur Entrix."
}
```

---

# API Analytics financières

## 📊 Ressource : `/api/v1/analytics/financial`

### GET /api/v1/analytics/financial/overview
**Description** : Vue d'ensemble financière

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `organizer_id` | uuid | - | Organisateur spécifique |
| `period` | enum | month | Période (day, week, month, quarter, year) |
| `date_from` | date | - | Date début |
| `date_to` | date | - | Date fin |
| `currency` | string | TND | Devise |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z",
      "period_type": "month"
    },
    
    "revenue": {
      "total_revenue": 1567890.50,
      "net_revenue": 1489234.75,
      "growth_percentage": 23.4,
      "previous_period": 1271045.20,
      
      // Répartition par source
      "by_source": {
        "tickets": 987654.30,
        "subscriptions": 456789.20,
        "services": 87654.00,
        "merchandise": 35793.00
      },
      
      // Répartition par canal
      "by_channel": {
        "web": 892345.60,
        "mobile_app": 567890.40,
        "phone": 78654.50,
        "physical": 29000.00
      }
    },
    
    "orders": {
      "total_orders": 5247,
      "guest_orders": 1789,
      "guest_percentage": 34.1,
      "average_order_value": 298.75,
      "conversion_rate": 12.8,
      
      // Statuts
      "completed": 4893,
      "pending": 187,
      "cancelled": 167,
      "refunded": 23
    },
    
    "payments": {
      "total_payments": 5430,
      "successful_payments": 5247,
      "success_rate": 96.6,
      "failed_payments": 183,
      "average_processing_time": 32.5,
      
      // Méthodes populaires
      "by_method": {
        "flouci": {
          "count": 2847,
          "amount": 856743.20,
          "success_rate": 98.2
        },
        "d17": {
          "count": 1654,
          "amount": 476892.40,
          "success_rate": 94.8
        },
        "card": {
          "count": 746,
          "amount": 234254.90,
          "success_rate": 97.1
        }
      }
    },
    
    "refunds": {
      "total_refunds": 89,
      "total_amount": 26750.00,
      "refund_rate": 1.7,
      "average_processing_time": 3.2,
      
      // Raisons principales
      "by_reason": {
        "EVENT_CANCELLED": 34,
        "CUSTOMER_REQUEST": 28,
        "DUPLICATE_PAYMENT": 15,
        "FRAUD": 7,
        "OTHER": 5
      }
    },
    
    "onboarding": {
      "keys_generated": 1789,
      "keys_used": 423,
      "conversion_rate": 23.6,
      "total_incentive_value": 12450.00,
      "roi_incentives": 340.2
    }
  }
}
```

### GET /api/v1/analytics/financial/trends
**Description** : Tendances financières dans le temps

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "daily_trends": [
      {
        "date": "2025-01-15",
        "revenue": 45890.50,
        "orders": 154,
        "avg_order_value": 297.98,
        "guest_orders": 52,
        "conversion_rate": 13.2
      }
      // ... plus de données par jour
    ],
    
    "growth_metrics": {
      "revenue_growth": {
        "daily": 2.3,
        "weekly": 15.7,
        "monthly": 23.4,
        "yearly": 87.9
      },
      "user_acquisition": {
        "new_guests": 1789,
        "converted_users": 423,
        "retention_rate": 76.4
      }
    },
    
    "forecasts": {
      "next_month_revenue": 1789000.00,
      "confidence_interval": 0.85,
      "growth_prediction": 28.5
    }
  }
}
```

---

# Codes d'erreur

## 🚨 Codes d'erreur spécifiques

| Code | Message | Description |
|------|---------|-------------|
| `ORDER_001` | Order not found | Commande introuvable |
| `ORDER_002` | Order cannot be modified | Commande non modifiable |
| `ORDER_003` | Order already cancelled | Commande déjà annulée |
| `ORDER_004` | Order expired | Commande expirée |
| `ORDER_005` | Invalid order status transition | Transition statut invalide |
| `ORDER_006` | Guest information required | Info anonyme obligatoire |
| `PAYMENT_001` | Payment method not available | Méthode indisponible |
| `PAYMENT_002` | Payment amount exceeds limit | Montant dépasse limite |
| `PAYMENT_003` | Payment failed` | Paiement échoué |
| `PAYMENT_004` | Insufficient funds | Fonds insuffisants |
| `PAYMENT_005` | Payment method declined | Méthode refusée |
| `PAYMENT_006` | Duplicate payment attempt | Tentative en double |
| `REFUND_001` | Refund not allowed | Remboursement interdit |
| `REFUND_002` | Refund amount exceeds paid | Montant > payé |
| `REFUND_003` | Refund window expired | Délai dépassé |
| `REFUND_004` | Already fully refunded | Déjà remboursé |
| `ONBOARDING_001` | Invalid onboarding key | Clé onboarding invalide |
| `ONBOARDING_002` | Onboarding key expired | Clé expirée |
| `ONBOARDING_003` | Onboarding key already used | Clé déjà utilisée |
| `COMMISSION_001` | Commission calculation failed | Calcul commission échoué |

---

# Exemples d'usage

## 🎯 Scénarios d'usage complets

### Achat anonyme avec onboarding
```bash
# 1. Création commande anonyme
curl -X POST https://api.entrix.tn/v1/checkout/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "guest_info": {
      "guest_name": "Yasmine Sport",
      "guest_email": "yasmine.sport@gmail.com",
      "guest_phone": "+21695123456"
    },
    "cart": {
      "items": [{
        "type": "TICKET",
        "ticket_type_id": "ttype_derby_2025",
        "quantity": 2
      }]
    },
    "onboarding_preferences": {
      "generate_incentive": true,
      "preferred_incentive": "BONUS_POINTS"
    },
    "payment": {
      "method_id": "pm_flouci"
    }
  }'

# 2. Finalisation paiement (redirection Flouci)

# 3. Conversion onboarding (plus tard)
curl -X POST https://api.entrix.tn/v1/onboarding/convert \
  -H "Content-Type: application/json" \
  -d '{
    "secret_key": "ONB_2025_01_ABC123",
    "user_info": {
      "email": "yasmine.sport@gmail.com",
      "password": "MonPassword123!",
      "first_name": "Yasmine",
      "last_name": "Sport"
    }
  }'
```

### Gestion remboursement organisateur
```bash
# 1. Liste remboursements en attente
curl -X GET "https://api.entrix.tn/v1/refunds?organizer_id=org_club_africain&status=PENDING" \
  -H "Authorization: Bearer $ORG_TOKEN"

# 2. Approbation remboursement
curl -X PUT https://api.entrix.tn/v1/refunds/ref_123/approve \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d '{
    "approved_amount": 89.50,
    "approval_notes": "Remboursement validé suite annulation événement"
  }'
```

### Analytics organisateur
```bash
# Vue d'ensemble financière mensuelle
curl -X GET "https://api.entrix.tn/v1/analytics/financial/overview?organizer_id=org_club_africain&period=month" \
  -H "Authorization: Bearer $ORG_TOKEN"

# Tendances détaillées
curl -X GET "https://api.entrix.tn/v1/analytics/financial/trends?organizer_id=org_club_africain&date_from=2025-01-01&date_to=2025-01-31" \
  -H "Authorization: Bearer $ORG_TOKEN"
```

Ce module **Commandes et Paiements** constitue le cœur transactionnel d'Entrix V3.0, permettant une expérience d'achat fluide pour tous les utilisateurs (anonymes et enregistrés) tout en maximisant les opportunités de conversion grâce à l'onboarding intelligent. Il assure la traçabilité complète, la sécurité PCI DSS et la réconciliation automatique pour une gestion financière optimale.