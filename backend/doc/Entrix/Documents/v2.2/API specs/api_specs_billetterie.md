# API Specifications - Module Billetterie
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Plans d'abonnements](#api-plans-dabonnements)
4. [API Abonnements](#api-abonnements)
5. [API Types de billets](#api-types-de-billets)
6. [API Billets](#api-billets)
7. [API Commandes et ventes](#api-commandes-et-ventes)
8. [API Paiements](#api-paiements)
9. [API Droits d'accès (intégration)](#api-droits-daccès-intégration)
10. [API Tarification et promotions](#api-tarification-et-promotions)
11. [API Analytics billetterie](#api-analytics-billetterie)
12. [Codes d'erreur](#codes-derreur)
13. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Billetterie** constitue le cœur commercial d'Entrix V3.0. Il gère l'intégralité du processus de vente, depuis la création des produits (billets/abonnements) jusqu'à la génération des droits d'accès avec QR codes universels.

## 🏗️ Architecture innovante V3.0

### **Flux de vente unifié**
```
Plans/Types → Commandes → Paiements → Droits d'accès → QR codes
```

### **Entités principales**
- **Subscription Plans** : Plans d'abonnements créés par organisateurs
- **Subscriptions** : Abonnements souscrits (anonymes ou utilisateurs)
- **Ticket Types** : Types de billets par événement
- **Tickets** : Billets individuels vendus
- **Orders/Order Items** : Système de commandes unifié
- **Payments** : Gestion paiements multi-providers
- **Access Rights** : Droits d'accès avec QR codes universels

### **Innovation anonyme V3.0**
- **Vente sans compte** : Achat avec email/téléphone uniquement
- **Onboarding intelligent** : Clés secrètes pour conversion utilisateur
- **QR codes fonctionnels** : Accès immédiat même sans compte
- **Migration automatique** : Transfert données lors création compte

### **Intégration centrale access_rights**
Tous les achats validés génèrent automatiquement :
- **QR code unique** dans `access_rights`
- **Droits d'accès unifiés** (billets, abonnements, staff, VIP)
- **Contrôle physique** via le module contrôle d'accès

## 🔗 Relations avec autres modules
- **Events** : Billetterie liée aux événements
- **Venues** : Configuration zones et tarification
- **Users** : Comptes utilisateurs (optionnel)
- **Orders** : Processus de commande
- **Payments** : Traitement paiements
- **Access Rights** : Génération droits d'accès

---

# Authentification et autorisation

## 🔐 Niveaux d'accès requis

### Consultation billetterie
- **Public** : Plans et types disponibles, prix
- **Utilisateur** : Ses achats et abonnements
- **Organisateur** : Sa billetterie complète
- **Super Admin** : Toute la billetterie

### Gestion billetterie
- **Organisateur** : CRUD ses plans/types de billets
- **Super Admin** : Toutes opérations

### Achats
- **Anonyme** : Achat avec email/téléphone
- **Utilisateur** : Achat avec compte
- **Groupe** : Achats groupés

## 🛡️ Headers requis

```http
Authorization: Bearer <JWT_TOKEN> (optionnel pour achats anonymes)
Content-Type: application/json
X-Organizer-ID: <ORGANIZER_UUID> (si organisateur)
X-Anonymous-Customer: <EMAIL_OR_PHONE> (si achat anonyme)
```

---

# API Plans d'abonnements

## 🎫 Ressource : `/api/v1/subscription-plans`

### GET /api/v1/subscription-plans
**Description** : Liste des plans d'abonnements disponibles avec filtres

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page |
| `organizer_id` | uuid | - | Plans d'un organisateur |
| `type` | enum | - | Type d'abonnement |
| `venue_id` | string | - | Plans pour un lieu |
| `is_active` | boolean | - | Plans actifs |
| `is_featured` | boolean | - | Plans mis en avant |
| `price_min` | decimal | - | Prix minimum |
| `price_max` | decimal | - | Prix maximum |
| `duration_type` | enum | - | Type de durée |
| `available_for_purchase` | boolean | - | Disponibles à l'achat |
| `include` | string | - | Relations (events,zones,statistics) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "subscription_plans": [
      {
        "id": "plan-est-2024-season",
        "organizer": {
          "id": "est-tunis-official",
          "name": "Espérance Sportive de Tunis",
          "type": "SPORTS_CLUB"
        },
        "code": "EST_SEASON_2024",
        "name": "Abonnement Saison EST 2024-2025",
        "description": "Accès à tous les matchs à domicile de l'EST pour la saison 2024-2025",
        "short_description": "Abonnement saison complète EST",
        "type": "SEASON_PASS",
        "venue": {
          "id": "stade-rades-tunis",
          "name": "Stade Olympique de Radès"
        },
        "pricing": {
          "price": 850.00,
          "currency": "TND",
          "payment_schedule": "ANNUAL",
          "monthly_equivalent": 85.00,
          "savings_vs_individual": 35.2
        },
        "duration": {
          "type": "SEASON",
          "valid_from": "2024-08-01T00:00:00Z",
          "valid_until": "2025-06-30T23:59:59Z",
          "duration_months": 11
        },
        "access_details": {
          "total_events_included": 17,
          "events_confirmed": 15,
          "events_pending": 2,
          "home_matches_only": true,
          "cup_matches_included": false
        },
        "zones_included": [
          {
            "zone_id": "tribune-est",
            "zone_name": "Tribune Est",
            "is_preferred": true,
            "priority_level": 1
          },
          {
            "zone_id": "tribune-sud", 
            "zone_name": "Tribune Sud",
            "is_preferred": false,
            "priority_level": 2
          }
        ],
        "benefits": [
          "Accès prioritaire aux billets Cup",
          "Réduction 20% sur merchandising officiel", 
          "Invitation événements privés club",
          "Newsletter exclusive abonnés"
        ],
        "restrictions": [
          "Non remboursable sauf annulation totale saison",
          "Non transférable à un tiers",
          "Places attribuées selon disponibilité"
        ],
        "features": {
          "is_featured": true,
          "is_popular": true,
          "allows_companions": true,
          "max_companions": 3,
          "family_discount": 15.0,
          "early_bird_available": true
        },
        "statistics": {
          "total_subscriptions": 2450,
          "available_spots": 550,
          "conversion_rate": 23.5,
          "satisfaction_rating": 4.6
        },
        "booking": {
          "advance_booking_days": 7,
          "booking_deadline_hours": 24,
          "allows_same_day": false
        },
        "status": {
          "is_active": true,
          "is_available": true,
          "sales_status": "OPEN",
          "availability": "LIMITED"
        },
        "created_at": "2024-06-01T10:00:00Z",
        "updated_at": "2024-03-20T16:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 45,
      "total_pages": 3
    },
    "summary": {
      "total_plans": 45,
      "by_type": {
        "SEASON_PASS": 18,
        "MONTHLY": 12,
        "EVENT_SERIES": 10,
        "VIP_MEMBERSHIP": 5
      },
      "by_organizer": {
        "sports_clubs": 25,
        "theaters": 12,
        "festivals": 8
      },
      "price_ranges": {
        "budget": {"min": 50, "max": 200, "count": 15},
        "premium": {"min": 200, "max": 500, "count": 20},
        "luxury": {"min": 500, "max": 2000, "count": 10}
      }
    }
  },
  "timestamp": "2024-03-20T16:30:00Z"
}
```

### POST /api/v1/subscription-plans
**Description** : Création d'un nouveau plan d'abonnement

#### Request Body
```json
{
  "code": "CARTHAGE_FESTIVAL_2024",
  "name": "Abonnement Festival de Carthage 2024",
  "description": "Accès privilégié à tous les spectacles du Festival International de Carthage 2024. Comprend 25 spectacles sur 2 mois.",
  "short_description": "Abonnement complet Festival de Carthage",
  "type": "FESTIVAL_PASS",
  "venue_id": "theater-carthage",
  "pricing": {
    "price": 1200.00,
    "currency": "TND",
    "payment_schedule": "ANNUAL",
    "early_bird_price": 950.00,
    "early_bird_deadline": "2024-05-31T23:59:59Z"
  },
  "duration": {
    "type": "PERIOD",
    "valid_from": "2024-07-01T00:00:00Z",
    "valid_until": "2024-08-31T23:59:59Z"
  },
  "access_configuration": {
    "include_all_events": true,
    "priority_booking": true,
    "advance_booking_days": 14,
    "companion_tickets": 2
  },
  "zones_included": [
    {
      "zone_id": "amphitheater-main",
      "priority_level": 1,
      "price_override": null
    },
    {
      "zone_id": "vip-section",
      "priority_level": 2,
      "additional_cost": 200.00
    }
  ],
  "benefits": [
    "Accès prioritaire toutes représentations",
    "Meet & greet avec artistes sélectionnés",
    "Programme officiel offert",
    "Cocktail d'ouverture inclus"
  ],
  "terms_conditions": "Abonnement valable uniquement pour la saison 2024. Non remboursable sauf force majeure.",
  "max_subscriptions": 500,
  "is_featured": true,
  "auto_renew_default": false
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "subscription_plan": {
      "id": "plan-carthage-festival-2024",
      "code": "CARTHAGE_FESTIVAL_2024",
      "name": "Abonnement Festival de Carthage 2024",
      "type": "FESTIVAL_PASS",
      "pricing": {
        "price": 1200.00,
        "early_bird_price": 950.00,
        "currency": "TND"
      },
      "status": {
        "is_active": true,
        "is_available": true,
        "sales_status": "DRAFT"
      },
      "next_steps": [
        "Configure included events",
        "Set up payment processing",
        "Activate plan for sales"
      ],
      "created_at": "2024-03-20T17:00:00Z"
    }
  },
  "message": "Subscription plan created successfully",
  "timestamp": "2024-03-20T17:00:00Z"
}
```

### GET /api/v1/subscription-plans/{id}
**Description** : Détails complets d'un plan d'abonnement

### PUT /api/v1/subscription-plans/{id}
**Description** : Mise à jour plan d'abonnement

### DELETE /api/v1/subscription-plans/{id}
**Description** : Désactivation plan d'abonnement

### POST /api/v1/subscription-plans/{id}/activate
**Description** : Activation plan pour les ventes

### GET /api/v1/subscription-plans/{id}/events
**Description** : Événements inclus dans le plan

### POST /api/v1/subscription-plans/{id}/events
**Description** : Ajout d'événements au plan

### GET /api/v1/subscription-plans/{id}/zones
**Description** : Zones accessibles avec le plan

---

# API Abonnements

## 🎟️ Ressource : `/api/v1/subscriptions`

### GET /api/v1/subscriptions
**Description** : Liste des abonnements avec filtres

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `user_id` | uuid | - | Abonnements d'un utilisateur |
| `organizer_id` | uuid | - | Abonnements d'un organisateur |
| `plan_id` | uuid | - | Abonnements d'un plan |
| `status` | enum | - | Statut abonnement |
| `payment_status` | enum | - | Statut paiement |
| `is_anonymous` | boolean | - | Abonnements anonymes |
| `expires_after` | date | - | Expire après cette date |
| `expires_before` | date | - | Expire avant cette date |
| `include` | string | - | Relations (plan,events,access_rights) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "sub-est-ahmed-2024",
        "subscription_plan": {
          "id": "plan-est-2024-season",
          "name": "Abonnement Saison EST 2024-2025",
          "type": "SEASON_PASS"
        },
        "subscriber": {
          "user_id": "user-ahmed-ben-ali",
          "user_name": "Ahmed Ben Ali",
          "is_anonymous": false
        },
        "subscription_number": "EST240001234",
        "status": "ACTIVE",
        "payment_status": "PAID",
        "validity": {
          "start_date": "2024-08-01T00:00:00Z",
          "end_date": "2025-06-30T23:59:59Z",
          "is_valid": true,
          "days_remaining": 127
        },
        "usage_statistics": {
          "events_attended": 8,
          "events_available": 17,
          "attendance_rate": 47.1,
          "last_usage": "2024-03-15T20:00:00Z"
        },
        "access_details": {
          "preferred_zone": "tribune-est",
          "companion_slots_used": 2,
          "companion_slots_available": 1,
          "priority_booking": true
        },
        "financial": {
          "amount_paid": 850.00,
          "currency": "TND",
          "payment_method": "CARD",
          "payment_date": "2024-07-15T14:30:00Z",
          "next_renewal": "2025-07-01T00:00:00Z"
        },
        "benefits_status": {
          "merchandising_discount": "ACTIVE",
          "vip_events_access": "ACTIVE",
          "newsletter": "SUBSCRIBED"
        },
        "qr_codes": [
          {
            "qr_code": "SUB_EST_240001234_MAIN",
            "type": "PRIMARY",
            "status": "ACTIVE"
          },
          {
            "qr_code": "SUB_EST_240001234_COMP1",
            "type": "COMPANION",
            "status": "ACTIVE"
          }
        ],
        "created_at": "2024-07-15T14:30:00Z",
        "updated_at": "2024-03-20T16:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 156,
      "total_pages": 8
    },
    "summary": {
      "active_subscriptions": 145,
      "expired_subscriptions": 11,
      "total_value": 132500.00,
      "avg_attendance_rate": 68.5
    }
  },
  "timestamp": "2024-03-20T16:30:00Z"
}
```

### POST /api/v1/subscriptions
**Description** : Souscription à un plan (anonyme ou utilisateur)

#### Request Body (Souscription anonyme)
```json
{
  "plan_id": "plan-carthage-festival-2024",
  "subscriber_info": {
    "guest_name": "Salma Trabelsi",
    "guest_email": "salma.trabelsi@gmail.com",
    "guest_phone": "+216 98 123 456",
    "date_of_birth": "1985-06-15",
    "preferences": {
      "preferred_language": "fr-TN",
      "communication_email": true,
      "communication_sms": false
    }
  },
  "payment_info": {
    "use_early_bird": true,
    "payment_method": "FLOUCI",
    "billing_address": {
      "line1": "Rue de la Liberté",
      "city": "Tunis",
      "postal_code": "1001",
      "country": "TN"
    }
  },
  "companions": [
    {
      "name": "Karim Trabelsi",
      "relationship": "SPOUSE",
      "age_group": "ADULT"
    }
  ],
  "marketing": {
    "source": "FACEBOOK_AD",
    "campaign": "festival_2024_launch",
    "referral_code": null
  },
  "terms_accepted": true
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub-carthage-salma-2024",
      "subscription_number": "CAR240002156",
      "plan": {
        "id": "plan-carthage-festival-2024",
        "name": "Abonnement Festival de Carthage 2024"
      },
      "subscriber": {
        "is_anonymous": true,
        "guest_name": "Salma Trabelsi",
        "guest_email": "salma.trabelsi@gmail.com"
      },
      "status": "PENDING_PAYMENT",
      "payment": {
        "amount_due": 950.00,
        "currency": "TND",
        "early_bird_applied": true,
        "savings": 250.00
      },
      "qr_codes_generated": [
        "SUB_CAR_240002156_MAIN",
        "SUB_CAR_240002156_COMP1"
      ],
      "onboarding": {
        "key": "ONB_SUB_CAR_240002156",
        "incentive": {
          "type": "DISCOUNT",
          "value": 10.0,
          "description": "10% de réduction sur votre prochain achat"
        },
        "expires_at": "2024-06-20T23:59:59Z"
      },
      "next_steps": [
        "Complete payment within 30 minutes",
        "Check email for confirmation",
        "Access QR codes in confirmation"
      ],
      "payment_url": "https://pay.entrix.tn/sub-carthage-salma-2024",
      "created_at": "2024-03-20T17:15:00Z"
    }
  },
  "message": "Subscription created successfully. Please complete payment.",
  "timestamp": "2024-03-20T17:15:00Z"
}
```

### GET /api/v1/subscriptions/{id}
**Description** : Détails complets d'un abonnement

### PUT /api/v1/subscriptions/{id}
**Description** : Mise à jour abonnement

### POST /api/v1/subscriptions/{id}/suspend
**Description** : Suspension temporaire abonnement

### POST /api/v1/subscriptions/{id}/reactivate
**Description** : Réactivation abonnement

### POST /api/v1/subscriptions/{id}/cancel
**Description** : Annulation abonnement

### GET /api/v1/subscriptions/{id}/usage
**Description** : Historique d'utilisation abonnement

### POST /api/v1/subscriptions/{id}/transfer
**Description** : Transfert d'abonnement

#### Request Body
```json
{
  "transfer_to": {
    "user_id": "user-mohamed-ben-ahmed",
    "transfer_reason": "Gift to family member",
    "transfer_fee": 25.00
  },
  "terms_accepted": true
}
```

---

# API Types de billets

## 🎪 Ressource : `/api/v1/events/{event_id}/ticket-types`

### GET /api/v1/events/{event_id}/ticket-types
**Description** : Types de billets disponibles pour un événement

#### Response 200
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "derby-est-ca-2024",
      "name": "Derby EST vs Club Africain",
      "date": "2024-04-15T20:00:00Z"
    },
    "ticket_types": [
      {
        "id": "type-tribune-officielle",
        "event_id": "derby-est-ca-2024",
        "code": "TRIB_OFF_DERBY",
        "name": "Tribune Officielle",
        "description": "Places VIP avec service hospitalité inclus",
        "category": "VIP",
        "zone": {
          "zone_id": "tribune-officielle",
          "zone_name": "Tribune d'Honneur",
          "capacity": 2000
        },
        "pricing": {
          "base_price": 300.00,
          "current_price": 300.00,
          "currency": "TND",
          "price_tier": "PREMIUM",
          "dynamic_pricing": false
        },
        "availability": {
          "total_quantity": 2000,
          "available_quantity": 150,
          "sold_quantity": 1750,
          "reserved_quantity": 100,
          "availability_status": "LOW_STOCK"
        },
        "sales_window": {
          "sales_start": "2024-03-01T10:00:00Z",
          "sales_end": "2024-04-15T18:00:00Z",
          "early_access_start": "2024-02-25T10:00:00Z",
          "is_sales_active": true
        },
        "restrictions": [
          {
            "type": "AGE_LIMIT",
            "description": "Accès limité aux plus de 18 ans",
            "is_strict": true
          },
          {
            "type": "DRESS_CODE",
            "description": "Tenue correcte exigée",
            "is_strict": false
          }
        ],
        "benefits": [
          "Accès lounge VIP",
          "Restauration incluse",
          "Parking premium",
          "Programme officiel"
        ],
        "purchase_limits": {
          "min_quantity": 1,
          "max_quantity": 4,
          "max_per_customer": 6
        },
        "transfer_policy": {
          "is_transferable": true,
          "transfer_fee": 15.00,
          "transfer_deadline": "2024-04-10T23:59:59Z"
        },
        "refund_policy": {
          "is_refundable": false,
          "refund_deadline": null,
          "refund_fee": null
        },
        "features": {
          "requires_id": true,
          "allows_companion": true,
          "has_assigned_seat": true,
          "print_at_home": true,
          "mobile_ticket": true
        },
        "created_at": "2024-02-15T14:30:00Z",
        "updated_at": "2024-03-20T16:45:00Z"
      },
      {
        "id": "type-tribune-est",
        "event_id": "derby-est-ca-2024",
        "code": "TRIB_EST_DERBY",
        "name": "Tribune Est",
        "description": "Places côté supporters EST",
        "category": "STANDARD",
        "zone": {
          "zone_id": "tribune-est",
          "zone_name": "Tribune Est",
          "capacity": 15000
        },
        "pricing": {
          "base_price": 80.00,
          "current_price": 85.00,
          "currency": "TND",
          "price_tier": "STANDARD",
          "dynamic_pricing": true,
          "price_increase_reason": "High demand"
        },
        "availability": {
          "total_quantity": 15000,
          "available_quantity": 2500,
          "sold_quantity": 12000,
          "reserved_quantity": 500,
          "availability_status": "AVAILABLE"
        },
        "purchase_limits": {
          "min_quantity": 1,
          "max_quantity": 8,
          "max_per_customer": 8
        },
        "created_at": "2024-02-15T14:30:00Z"
      }
    ],
    "pricing_summary": {
      "price_range": {
        "min": 25.00,
        "max": 300.00,
        "currency": "TND"
      },
      "average_price": 68.50,
      "total_capacity": 60000,
      "total_available": 12500,
      "overall_sold_percentage": 79.2
    },
    "sales_info": {
      "sales_status": "ACTIVE",
      "total_revenue": 2187500.00,
      "sales_velocity": "HIGH",
      "estimated_sellout": "2024-04-10T15:00:00Z"
    }
  },
  "timestamp": "2024-03-20T16:45:00Z"
}
```

### POST /api/v1/events/{event_id}/ticket-types
**Description** : Création d'un type de billet

#### Request Body
```json
{
  "code": "BALCON_PREMIUM",
  "name": "Balcon Premium",
  "description": "Places balcon avec vue excellente et service premium",
  "category": "PREMIUM",
  "zone_id": "balcon-central",
  "pricing": {
    "base_price": 120.00,
    "currency": "TND",
    "enable_dynamic_pricing": false
  },
  "availability": {
    "total_quantity": 500,
    "early_access_percentage": 10
  },
  "sales_configuration": {
    "sales_start": "2024-04-01T10:00:00Z",
    "sales_end": "2024-07-15T20:00:00Z",
    "early_access_start": "2024-03-25T10:00:00Z"
  },
  "purchase_rules": {
    "min_quantity": 1,
    "max_quantity": 6,
    "max_per_customer": 8
  },
  "policies": {
    "is_transferable": true,
    "transfer_fee": 5.00,
    "is_refundable": true,
    "refund_deadline_days": 7,
    "refund_fee_percentage": 10.0
  },
  "benefits": [
    "Service bar premium",
    "Programme officiel inclus",
    "Vestiaire gratuit"
  ],
  "features": {
    "requires_id": false,
    "has_assigned_seat": true,
    "print_at_home": true,
    "mobile_ticket": true
  }
}
```

### GET /api/v1/events/{event_id}/ticket-types/{type_id}
**Description** : Détails d'un type de billet

### PUT /api/v1/events/{event_id}/ticket-types/{type_id}
**Description** : Mise à jour type de billet

### DELETE /api/v1/events/{event_id}/ticket-types/{type_id}
**Description** : Suppression type de billet

### POST /api/v1/events/{event_id}/ticket-types/{type_id}/pricing
**Description** : Mise à jour tarification

#### Request Body
```json
{
  "new_price": 95.00,
  "price_change_reason": "Demand adjustment",
  "effective_date": "2024-03-25T00:00:00Z",
  "notify_customers": false
}
```

---

# API Billets

## 🎟️ Ressource : `/api/v1/tickets`

### GET /api/v1/tickets
**Description** : Liste des billets avec filtres

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `user_id` | uuid | - | Billets d'un utilisateur |
| `event_id` | uuid | - | Billets d'un événement |
| `organizer_id` | uuid | - | Billets d'un organisateur |
| `status` | enum | - | Statut billet |
| `is_anonymous` | boolean | - | Billets anonymes |
| `purchase_channel` | enum | - | Canal d'achat |
| `date_from` | date | - | Achetés depuis |
| `date_to` | date | - | Achetés jusqu'à |
| `include` | string | - | Relations (event,access_rights,order) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket-derby-12345",
        "ticket_number": "DER240315001",
        "event": {
          "id": "derby-est-ca-2024",
          "name": "Derby EST vs Club Africain",
          "date": "2024-04-15T20:00:00Z",
          "venue": "Stade Olympique de Radès"
        },
        "ticket_type": {
          "id": "type-tribune-est",
          "name": "Tribune Est",
          "category": "STANDARD"
        },
        "holder": {
          "user_id": "user-ahmed-ben-ali",
          "user_name": "Ahmed Ben Ali",
          "is_anonymous": false
        },
        "seating": {
          "zone_id": "tribune-est",
          "zone_name": "Tribune Est",
          "section": "A",
          "row": "15",
          "seat": "23",
          "seat_display": "A15-23"
        },
        "pricing": {
          "price_paid": 85.00,
          "base_price": 80.00,
          "fees": 5.00,
          "currency": "TND",
          "purchase_date": "2024-03-15T14:30:00Z"
        },
        "status": "VALID",
        "purchase_info": {
          "order_id": "order-derby-ahmed-001",
          "payment_method": "FLOUCI",
          "purchase_channel": "MOBILE_APP",
          "confirmation_sent": true
        },
        "access_control": {
          "qr_code": "TKT_DER240315001",
          "access_right_id": "access-derby-ahmed-001",
          "is_transferable": true,
          "check_ins": 0,
          "max_check_ins": 1
        },
        "transfer_history": [],
        "special_services": [
          "Mobile ticket enabled",
          "Print at home available"
        ],
        "created_at": "2024-03-15T14:30:00Z",
        "updated_at": "2024-03-20T16:45:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 234,
      "total_pages": 12
    },
    "summary": {
      "valid_tickets": 225,
      "used_tickets": 8,
      "cancelled_tickets": 1,
      "total_value": 18750.00
    }
  },
  "timestamp": "2024-03-20T16:45:00Z"
}
```

### GET /api/v1/tickets/{id}
**Description** : Détails complets d'un billet

### POST /api/v1/tickets/{id}/transfer
**Description** : Transfert de billet

#### Request Body
```json
{
  "transfer_to": {
    "user_id": "user-salma-ben-salem",
    "reason": "Gift to friend",
    "message": "Cadeau pour ton anniversaire!"
  },
  "accept_fees": true,
  "notify_recipient": true
}
```

### POST /api/v1/tickets/{id}/cancel
**Description** : Annulation/remboursement billet

### GET /api/v1/tickets/{id}/qr-code
**Description** : Génération QR code pour billet

#### Response 200
```json
{
  "success": true,
  "data": {
    "ticket_id": "ticket-derby-12345",
    "qr_code": "TKT_DER240315001",
    "qr_image_url": "https://api.entrix.tn/qr/TKT_DER240315001.png",
    "qr_data": {
      "ticket_number": "DER240315001",
      "event_id": "derby-est-ca-2024",
      "access_right_id": "access-derby-ahmed-001",
      "valid_from": "2024-04-15T18:00:00Z",
      "valid_until": "2024-04-15T23:00:00Z"
    },
    "access_instructions": [
      "Présentez ce QR code à l'entrée",
      "Arrivez 1h avant le début du match",
      "Entrée par la porte A"
    ],
    "generated_at": "2024-03-20T17:00:00Z"
  },
  "timestamp": "2024-03-20T17:00:00Z"
}
```

---

# API Commandes et ventes

## 🛒 Ressource : `/api/v1/orders`

### GET /api/v1/orders
**Description** : Liste des commandes avec filtres

### POST /api/v1/orders
**Description** : Création d'une nouvelle commande (panier)

#### Request Body (Commande mixte billets + abonnement)
```json
{
  "customer_info": {
    "user_id": null,
    "guest_name": "Fatma Kacem",
    "guest_email": "fatma.kacem@gmail.com",
    "guest_phone": "+216 97 654 321",
    "billing_address": {
      "line1": "Avenue Habib Bourguiba",
      "city": "Tunis",
      "postal_code": "1001",
      "country": "TN"
    }
  },
  "items": [
    {
      "item_type": "TICKET",
      "event_id": "concert-latifa-juillet-2024",
      "ticket_type_id": "type-orchestra-premium",
      "quantity": 2,
      "special_requests": "Places côte à côte si possible"
    },
    {
      "item_type": "SUBSCRIPTION",
      "subscription_plan_id": "plan-carthage-festival-2024",
      "quantity": 1,
      "companions": [
        {
          "name": "Ahmed Kacem",
          "relationship": "SPOUSE"
        }
      ]
    }
  ],
  "payment_preferences": {
    "preferred_method": "FLOUCI",
    "split_payment": false,
    "save_method": false
  },
  "marketing": {
    "source": "GOOGLE_SEARCH",
    "campaign": "summer_concerts_2024",
    "coupon_code": "SUMMER10"
  },
  "delivery_preferences": {
    "method": "DIGITAL",
    "email_delivery": true,
    "sms_delivery": true
  },
  "terms_accepted": true,
  "newsletter_consent": true
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order-fatma-mixed-001",
      "order_number": "ENT240320001",
      "customer": {
        "is_anonymous": true,
        "guest_name": "Fatma Kacem",
        "guest_email": "fatma.kacem@gmail.com"
      },
      "status": "PENDING_PAYMENT",
      "items": [
        {
          "id": "item-001",
          "item_type": "TICKET",
          "product_name": "Concert Latifa - Orchestra Premium",
          "quantity": 2,
          "unit_price": 150.00,
          "line_total": 300.00
        },
        {
          "id": "item-002",
          "item_type": "SUBSCRIPTION",
          "product_name": "Abonnement Festival de Carthage 2024",
          "quantity": 1,
          "unit_price": 950.00,
          "discount_amount": 95.00,
          "line_total": 855.00
        }
      ],
      "pricing": {
        "subtotal": 1155.00,
        "discount_total": 95.00,
        "tax_amount": 0.00,
        "processing_fee": 23.10,
        "total_amount": 1178.10,
        "currency": "TND"
      },
      "onboarding": {
        "key": "ONB_ENT240320001",
        "incentive": {
          "type": "CASHBACK",
          "value": 50.00,
          "description": "50 TND de cashback sur votre prochain achat"
        },
        "expires_at": "2024-06-20T23:59:59Z"
      },
      "payment": {
        "payment_url": "https://pay.entrix.tn/order-fatma-mixed-001",
        "payment_methods": ["FLOUCI", "STRIPE_CARD", "BANK_TRANSFER"],
        "expires_at": "2024-03-20T17:30:00Z"
      },
      "delivery": {
        "method": "DIGITAL",
        "estimated_delivery": "Immédiate après paiement"
      },
      "created_at": "2024-03-20T17:00:00Z",
      "expires_at": "2024-03-20T17:30:00Z"
    }
  },
  "message": "Order created successfully. Please complete payment within 30 minutes.",
  "timestamp": "2024-03-20T17:00:00Z"
}
```

### GET /api/v1/orders/{id}
**Description** : Détails complets d'une commande

### PUT /api/v1/orders/{id}
**Description** : Mise à jour commande (avant paiement)

### POST /api/v1/orders/{id}/payment
**Description** : Traitement paiement commande

### GET /api/v1/orders/{id}/items
**Description** : Articles d'une commande

### POST /api/v1/orders/{id}/items
**Description** : Ajout d'articles à une commande

### DELETE /api/v1/orders/{id}/items/{item_id}
**Description** : Suppression d'article

### POST /api/v1/orders/{id}/confirm
**Description** : Confirmation commande après paiement

### POST /api/v1/orders/{id}/cancel
**Description** : Annulation commande

---

# API Paiements

## 💳 Ressource : `/api/v1/payments`

### GET /api/v1/payments
**Description** : Liste des paiements

### POST /api/v1/payments
**Description** : Initiation d'un paiement

#### Request Body
```json
{
  "order_id": "order-fatma-mixed-001",
  "payment_method": "FLOUCI",
  "amount": 1178.10,
  "currency": "TND",
  "customer_data": {
    "name": "Fatma Kacem",
    "email": "fatma.kacem@gmail.com",
    "phone": "+216 97 654 321"
  },
  "payment_data": {
    "phone": "+216 97 654 321",
    "return_url": "https://entrix.tn/payment/success",
    "cancel_url": "https://entrix.tn/payment/cancel"
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment-fatma-001",
      "order_id": "order-fatma-mixed-001",
      "status": "PROCESSING",
      "amount": 1178.10,
      "currency": "TND",
      "payment_method": "FLOUCI",
      "gateway_response": {
        "transaction_id": "FLOUCI_TXN_123456789",
        "payment_url": "https://flouci.com/pay/123456789",
        "expires_at": "2024-03-20T17:30:00Z"
      },
      "created_at": "2024-03-20T17:05:00Z"
    }
  },
  "message": "Payment initiated successfully. Please complete payment.",
  "timestamp": "2024-03-20T17:05:00Z"
}
```

### GET /api/v1/payments/{id}
**Description** : Détails d'un paiement

### POST /api/v1/payments/{id}/confirm
**Description** : Confirmation paiement (webhook)

### POST /api/v1/payments/{id}/refund
**Description** : Remboursement paiement

---

# API Droits d'accès (intégration)

## 🎯 Ressource : `/api/v1/access-rights` (intégration billetterie)

### GET /api/v1/tickets/{ticket_id}/access-rights
**Description** : Droits d'accès générés pour un billet

#### Response 200
```json
{
  "success": true,
  "data": {
    "ticket_id": "ticket-derby-12345",
    "access_rights": [
      {
        "id": "access-derby-ahmed-001",
        "qr_code": "TKT_DER240315001",
        "access_type": "TICKET",
        "status": "ACTIVE",
        "event": {
          "id": "derby-est-ca-2024",
          "name": "Derby EST vs Club Africain",
          "date": "2024-04-15T20:00:00Z"
        },
        "venue": {
          "id": "stade-rades-tunis",
          "name": "Stade Olympique de Radès"
        },
        "zone": {
          "id": "tribune-est",
          "name": "Tribune Est"
        },
        "validity": {
          "valid_from": "2024-04-15T18:00:00Z",
          "valid_until": "2024-04-15T23:00:00Z",
          "max_uses": 1,
          "uses_count": 0
        },
        "access_details": {
          "entry_points": ["Entrée A", "Entrée B"],
          "parking_included": false,
          "vip_access": false
        },
        "generated_at": "2024-03-15T14:30:00Z"
      }
    ]
  },
  "timestamp": "2024-03-20T17:10:00Z"
}
```

### GET /api/v1/subscriptions/{subscription_id}/access-rights
**Description** : Droits d'accès générés pour un abonnement

#### Response 200
```json
{
  "success": true,
  "data": {
    "subscription_id": "sub-est-ahmed-2024",
    "access_rights": [
      {
        "id": "access-sub-est-ahmed-001",
        "qr_code": "SUB_EST_240001234_MAIN",
        "access_type": "SUBSCRIPTION",
        "status": "ACTIVE",
        "subscription_plan": {
          "id": "plan-est-2024-season",
          "name": "Abonnement Saison EST 2024-2025"
        },
        "venue": {
          "id": "stade-rades-tunis",
          "name": "Stade Olympique de Radès"
        },
        "preferred_zone": {
          "id": "tribune-est",
          "name": "Tribune Est"
        },
        "validity": {
          "valid_from": "2024-08-01T00:00:00Z",
          "valid_until": "2025-06-30T23:59:59Z",
          "max_uses": null,
          "uses_count": 8
        },
        "benefits": [
          "Priority booking",
          "Companion access",
          "VIP lounge access"
        ],
        "companion_rights": [
          {
            "id": "access-sub-est-ahmed-comp1",
            "qr_code": "SUB_EST_240001234_COMP1",
            "relationship": "COMPANION",
            "status": "ACTIVE"
          }
        ],
        "event_access": [
          {
            "event_id": "derby-est-ca-2024",
            "event_name": "Derby EST vs CA",
            "access_status": "AVAILABLE",
            "booking_required": true
          }
        ],
        "generated_at": "2024-07-15T14:30:00Z"
      }
    ]
  },
  "timestamp": "2024-03-20T17:10:00Z"
}
```

---

# API Tarification et promotions

## 💰 Ressource : `/api/v1/pricing-rules`

### GET /api/v1/pricing-rules
**Description** : Liste des règles de tarification

### POST /api/v1/pricing-rules
**Description** : Création règle de tarification

#### Request Body
```json
{
  "name": "Early Bird Festival Carthage",
  "description": "Réduction 20% pour achats avant le 31 mai",
  "rule_type": "EARLY_BIRD",
  "discount_type": "PERCENTAGE",
  "discount_value": 20.0,
  "applicable_to": {
    "item_types": ["SUBSCRIPTION"],
    "plan_ids": ["plan-carthage-festival-2024"],
    "event_ids": null
  },
  "conditions": {
    "valid_from": "2024-03-01T00:00:00Z",
    "valid_until": "2024-05-31T23:59:59Z",
    "min_purchase_amount": 100.00,
    "max_discount_amount": 500.00,
    "usage_limit": 1000,
    "usage_limit_per_customer": 1
  },
  "requirements": {
    "new_customers_only": false,
    "requires_code": false,
    "auto_apply": true
  }
}
```

---

# API Analytics billetterie

## 📊 Ressource : `/api/v1/ticketing/analytics`

### GET /api/v1/ticketing/analytics/sales
**Description** : Analytics ventes billetterie

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `organizer_id` | uuid | - | Analytics d'un organisateur |
| `event_id` | uuid | - | Analytics d'un événement |
| `date_range` | string | `30d` | Période (7d, 30d, 90d, 1y) |
| `breakdown` | string | `daily` | Granularité (hourly, daily, weekly) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2024-02-20",
      "end_date": "2024-03-20",
      "total_days": 29
    },
    "sales_overview": {
      "total_revenue": 2847500.00,
      "total_tickets_sold": 38500,
      "total_subscriptions_sold": 125,
      "average_ticket_price": 73.96,
      "conversion_rate": 18.7
    },
    "revenue_breakdown": {
      "tickets": {
        "revenue": 2347500.00,
        "percentage": 82.4
      },
      "subscriptions": {
        "revenue": 500000.00,
        "percentage": 17.6
      }
    },
    "sales_trends": [
      {
        "date": "2024-03-15",
        "tickets_sold": 1450,
        "revenue": 98750.00,
        "conversion_rate": 22.1
      },
      {
        "date": "2024-03-16", 
        "tickets_sold": 890,
        "revenue": 65400.00,
        "conversion_rate": 18.9
      }
    ],
    "top_events": [
      {
        "event_id": "derby-est-ca-2024",
        "event_name": "Derby EST vs CA",
        "revenue": 1875000.00,
        "tickets_sold": 25000,
        "conversion_rate": 19.5
      }
    ],
    "customer_insights": {
      "new_customers": 1250,
      "returning_customers": 890,
      "anonymous_purchases": 2100,
      "conversion_to_registered": 24.8
    },
    "payment_methods": {
      "FLOUCI": {"percentage": 45.2, "revenue": 1287150.00},
      "STRIPE_CARD": {"percentage": 35.8, "revenue": 1019205.00},
      "BANK_TRANSFER": {"percentage": 19.0, "revenue": 540945.00}
    }
  },
  "timestamp": "2024-03-20T17:15:00Z"
}
```

### GET /api/v1/ticketing/analytics/inventory
**Description** : Analytics inventaire et disponibilité

### GET /api/v1/ticketing/analytics/customer
**Description** : Analytics comportement client

### GET /api/v1/ticketing/analytics/pricing
**Description** : Analytics performance tarification

---

# Codes d'erreur

## 🚨 Codes d'erreur spécifiques au module

| Code | Message | Description |
|------|---------|-------------|
| `SUBSCRIPTION_PLAN_NOT_FOUND` | Subscription plan not found | Plan d'abonnement inexistant |
| `SUBSCRIPTION_NOT_FOUND` | Subscription not found | Abonnement inexistant |
| `TICKET_TYPE_NOT_FOUND` | Ticket type not found | Type de billet inexistant |
| `TICKET_NOT_FOUND` | Ticket not found | Billet inexistant |
| `ORDER_NOT_FOUND` | Order not found | Commande inexistante |
| `PAYMENT_NOT_FOUND` | Payment not found | Paiement inexistant |
| `INSUFFICIENT_INVENTORY` | Insufficient ticket inventory | Stock insuffisant |
| `SALES_NOT_ACTIVE` | Ticket sales not active | Ventes inactives |
| `SALES_ENDED` | Ticket sales have ended | Ventes terminées |
| `PURCHASE_LIMIT_EXCEEDED` | Purchase limit exceeded | Limite d'achat dépassée |
| `INVALID_PAYMENT_METHOD` | Invalid payment method | Méthode paiement invalide |
| `PAYMENT_FAILED` | Payment processing failed | Échec paiement |
| `ORDER_EXPIRED` | Order has expired | Commande expirée |
| `TICKET_NOT_TRANSFERABLE` | Ticket is not transferable | Billet non transférable |
| `SUBSCRIPTION_NOT_ACTIVE` | Subscription is not active | Abonnement inactif |
| `REFUND_NOT_ALLOWED` | Refund not allowed | Remboursement refusé |
| `PRICING_RULE_CONFLICT` | Pricing rule conflict | Conflit règle tarification |
| `ANONYMOUS_PURCHASE_ERROR` | Anonymous purchase error | Erreur achat anonyme |
| `ONBOARDING_KEY_INVALID` | Invalid onboarding key | Clé onboarding invalide |
| `ACCESS_RIGHT_GENERATION_FAILED` | Failed to generate access rights | Échec génération droits d'accès |

---

# Exemples d'usage

## 🎯 Cas d'usage typiques

### 1. Création plan d'abonnement saison sportive

```bash
# 1. Créer le plan d'abonnement
PLAN_ID=$(curl -X POST "https://api.entrix.tn/v1/subscription-plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organizer-ID: $ORGANIZER_ID" \
  -d '{
    "code": "EST_SEASON_2025",
    "name": "Abonnement Saison EST 2024-2025",
    "type": "SEASON_PASS",
    "venue_id": "stade-rades-tunis",
    "price": 900.00,
    "valid_from": "2024-08-01T00:00:00Z",
    "valid_until": "2025-06-30T23:59:59Z",
    "max_subscriptions": 3000
  }' | jq -r '.data.subscription_plan.id')

# 2. Configurer les zones incluses
curl -X POST "https://api.entrix.tn/v1/subscription-plans/$PLAN_ID/zones" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "zone_id": "tribune-est",
    "priority_level": 1,
    "is_included": true
  }'

# 3. Ajouter événements de la saison
curl -X POST "https://api.entrix.tn/v1/subscription-plans/$PLAN_ID/events" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "event_id": "est-ca-2024",
    "is_included": true,
    "is_priority": true
  }'

# 4. Activer pour les ventes
curl -X POST "https://api.entrix.tn/v1/subscription-plans/$PLAN_ID/activate" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Achat anonyme avec onboarding

```bash
# 1. Créer commande anonyme
ORDER_ID=$(curl -X POST "https://api.entrix.tn/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_info": {
      "user_id": null,
      "guest_name": "Mohamed Salah",
      "guest_email": "mohamed.salah@gmail.com",
      "guest_phone": "+216 98 555 777"
    },
    "items": [
      {
        "item_type": "TICKET",
        "event_id": "concert-latifa-juillet-2024",
        "ticket_type_id": "type-balcon-premium",
        "quantity": 2
      }
    ],
    "payment_preferences": {
      "preferred_method": "FLOUCI"
    },
    "terms_accepted": true
  }' | jq -r '.data.order.id')

# 2. Traiter le paiement
PAYMENT_ID=$(curl -X POST "https://api.entrix.tn/v1/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "'$ORDER_ID'",
    "payment_method": "FLOUCI",
    "customer_data": {
      "phone": "+216 98 555 777"
    }
  }' | jq -r '.data.payment.id')

# 3. Confirmer après paiement réussi
curl -X POST "https://api.entrix.tn/v1/orders/$ORDER_ID/confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_confirmed": true,
    "generate_access_rights": true
  }'
```

### 3. Gestion d'abonnement actif

```bash
# Consulter abonnements d'un utilisateur
curl -G "https://api.entrix.tn/v1/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -d "user_id=$USER_ID" \
  -d "include=plan,events,access_rights"

# Voir l'usage d'un abonnement
curl -G "https://api.entrix.tn/v1/subscriptions/$SUBSCRIPTION_ID/usage" \
  -H "Authorization: Bearer $TOKEN"

# Transférer un abonnement
curl -X POST "https://api.entrix.tn/v1/subscriptions/$SUBSCRIPTION_ID/transfer" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "transfer_to": {
      "user_id": "user-friend-id",
      "reason": "Gift to friend"
    },
    "accept_fees": true
  }'
```

### 4. Configuration billetterie événement

```bash
# 1. Créer types de billets pour événement
VIP_TYPE=$(curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/ticket-types" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "VIP_PREMIUM",
    "name": "VIP Premium",
    "zone_id": "tribune-officielle",
    "base_price": 250.00,
    "total_quantity": 500,
    "max_per_customer": 4
  }' | jq -r '.data.ticket_type.id')

STANDARD_TYPE=$(curl -X POST "https://api.entrix.tn/v1/events/$EVENT_ID/ticket-types" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "STANDARD",
    "name": "Places Standard",
    "zone_id": "tribune-sud",
    "base_price": 60.00,
    "total_quantity": 8000,
    "max_per_customer": 8
  }' | jq -r '.data.ticket_type.id')

# 2. Configurer règle early bird
curl -X POST "https://api.entrix.tn/v1/pricing-rules" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Early Bird 15%",
    "rule_type": "EARLY_BIRD",
    "discount_type": "PERCENTAGE",
    "discount_value": 15.0,
    "applicable_to": {
      "ticket_type_ids": ["'$VIP_TYPE'", "'$STANDARD_TYPE'"]
    },
    "valid_until": "2024-06-30T23:59:59Z"
  }'
```

### 5. Analytics billetterie organisateur

```bash
# Dashboard ventes du mois
curl -G "https://api.entrix.tn/v1/ticketing/analytics/sales" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organizer-ID: $ORGANIZER_ID" \
  -d "date_range=30d" \
  -d "breakdown=daily"

# Performance par événement
curl -G "https://api.entrix.tn/v1/ticketing/analytics/sales" \
  -H "Authorization: Bearer $TOKEN" \
  -d "event_id=$EVENT_ID" \
  -d "breakdown=hourly"

# Analytics clients et conversions
curl -G "https://api.entrix.tn/v1/ticketing/analytics/customer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organizer-ID: $ORGANIZER_ID" \
  -d "date_range=90d"
```

### 6. Workflow complet vente groupe

```bash
# 1. Créer commande groupe
GROUP_ORDER=$(curl -X POST "https://api.entrix.tn/v1/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "order_type": "GROUP_BOOKING",
    "customer_info": {
      "user_id": "'$USER_ID'",
      "organization": "Entreprise TechCorp"
    },
    "items": [
      {
        "item_type": "TICKET",
        "event_id": "'$EVENT_ID'",
        "ticket_type_id": "'$STANDARD_TYPE'",
        "quantity": 25
      }
    ],
    "group_discount": {
      "type": "BULK_DISCOUNT",
      "quantity_threshold": 20,
      "discount_percentage": 10.0
    }
  }' | jq -r '.data.order.id')

# 2. Appliquer remise groupe automatique
curl -X PUT "https://api.entrix.tn/v1/orders/$GROUP_ORDER" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "apply_group_discounts": true,
    "corporate_billing": true
  }'

# 3. Traiter paiement entreprise
curl -X POST "https://api.entrix.tn/v1/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "order_id": "'$GROUP_ORDER'",
    "payment_method": "BANK_TRANSFER",
    "corporate_payment": true
  }'
```

---

## 📝 Notes importantes

### Innovation anonyme et onboarding
- Tous les achats peuvent se faire sans compte utilisateur
- Les clés d'onboarding sont intégrées automatiquement dans les métadonnées
- Les QR codes fonctionnent immédiatement, même pour achats anonymes
- Le système encourage la conversion via incentives personnalisés

### Intégration access_rights
- Chaque billet/abonnement validé génère automatiquement un droit d'accès
- Les QR codes sont universels et centralisés dans `access_rights`
- Le contrôle physique se fait via le module contrôle d'accès
- Support complet des transferts et modifications

### Performance et optimisation
- Les prix peuvent être dynamiques selon la demande
- Le système anticipe les sellouts avec des algorithmes prédictifs
- Les analytics sont temps réel pour optimiser les ventes
- La billetterie s'adapte automatiquement aux pics de trafic

### Compliance et sécurité
- Respect RGPD pour données anonymes et utilisateurs
- Chiffrement des données de paiement
- Audit trail complet de toutes les transactions
- Intégration anti-fraude sur les paiements

---

**Version API** : v1.0  
**Dernière mise à jour** : 20 Mars 2024  
**Auteur** : Équipe Entrix Development