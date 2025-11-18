# API Specifications - Module Notifications
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Notifications transactionnelles](#api-notifications-transactionnelles)
4. [API Notifications marketing](#api-notifications-marketing)
5. [API Templates et personnalisation](#api-templates-et-personnalisation)
6. [API Préférences utilisateur](#api-préférences-utilisateur)
7. [API Canaux de communication](#api-canaux-de-communication)
8. [API Campagnes et envois massifs](#api-campagnes-et-envois-massifs)
9. [API Analytics et reporting](#api-analytics-et-reporting)
10. [API Administration et gestion](#api-administration-et-gestion)
11. [API Webhooks et intégrations](#api-webhooks-et-intégrations)
12. [Codes d'erreur](#codes-derreur)
13. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Notifications** constitue le système de communication central d'Entrix V3.0. Il gère l'ensemble de l'écosystème de messaging : notifications transactionnelles, communications marketing, alertes système et engagement utilisateur via multiple canaux de communication.

## 🏗️ Architecture innovante V3.0

### **Système de communication omnicanal**
```
Triggers → Templates → Queues → Canaux → Livraison → Analytics
```

### **Canaux supportés**
- **📧 Email** : Transactionnel et marketing avec templates Handlebars
- **📱 SMS** : Notifications critiques et confirmations
- **🔔 Push** : Mobile et web push notifications
- **📲 WhatsApp** : Communication directe et support
- **🔔 In-App** : Notifications dans l'interface utilisateur
- **📢 System** : Alertes système et maintenance

### **Types de notifications**
- **Transactionnelles** : Confirmations, rappels, mises à jour
- **Marketing** : Promotions, newsletters, recommandations
- **Système** : Alertes, maintenance, sécurité
- **Onboarding** : Conversions anonymes, welcome series
- **Événementielles** : Reminders, updates, post-événement

### **Innovations révolutionnaires V3.0**
- **🤖 IA de personnalisation** : Contenu et timing optimisés par ML
- **⚡ Envoi temps réel** : Processing sub-seconde via BullMQ
- **🎯 Segmentation avancée** : Ciblage comportemental granulaire
- **📊 A/B Testing intégré** : Optimisation continue des campagnes
- **🔄 Multi-channel orchestration** : Coordination intelligente des canaux

### **Architecture technique**
- **BullMQ** : Files d'attente prioritaires et retry automatique
- **Redis** : Cache templates et sessions utilisateur
- **Handlebars** : Engine de templates avec helpers personnalisés
- **Event-driven** : Triggers automatiques basés sur actions utilisateur
- **Rate limiting** : Protection anti-spam et respect réglementation

## 🔗 Relations avec autres modules
- **Utilisateurs** : Préférences et profils de communication
- **Commandes** : Notifications transactionnelles post-achat
- **Événements** : Reminders et mises à jour événementielles
- **Onboarding** : Campagnes de conversion anonyme → enregistré
- **Analytics** : Tracking engagement et performance

---

# Authentification et autorisation

## 🔐 Niveaux d'accès requis

### Envoi de notifications
- **Système** : Notifications automatiques (auth service)
- **Organisateur** : Notifications à ses clients
- **Marketing** : Campagnes et newsletters
- **Super Admin** : Toutes notifications

### Gestion templates
- **Organisateur** : Templates de ses notifications
- **Marketing** : Templates campagnes globales
- **Super Admin** : Tous templates système

### Analytics et reporting
- **Utilisateur** : Ses préférences et historique
- **Organisateur** : Analytics de ses envois
- **Marketing** : Métriques campagnes globales
- **Super Admin** : Analytics complètes

## 🛡️ Headers requis

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Organizer-ID: <ORGANIZER_UUID> (pour organisateurs)
X-Campaign-ID: <CAMPAIGN_UUID> (pour campaigns)
X-Source: <SOURCE_SYSTEM> (pour triggers automatiques)
X-Priority: <HIGH|MEDIUM|LOW> (pour priorité d'envoi)
```

---

# API Notifications transactionnelles

## 📧 Ressource : `/api/v1/notifications/transactional`

### POST /api/v1/notifications/transactional/send
**Description** : Envoi immédiat d'une notification transactionnelle

#### Request Body
```json
{
  "notification_type": "order_confirmation",
  "channel": "EMAIL",
  "priority": "HIGH",
  
  // Destinataire
  "recipient": {
    "user_id": "usr_01H8X9Y2Z3A4B5C6D7E8F9G0",
    "email": "ahmed.supporter@gmail.com",
    "phone": "+21697123456",
    "name": "Ahmed Supporter",
    "language": "fr-TN"
  },
  
  // Données pour template
  "template_data": {
    "order": {
      "id": "ord_01H8X9Y2Z3A4B5C6D7E8F9G1",
      "number": "ENT-2025-000001",
      "total_amount": 89.50,
      "currency": "TND",
      "items": [
        {
          "name": "Tribune Est - Derby CA vs EST",
          "quantity": 2,
          "unit_price": 42.50,
          "total": 85.00
        }
      ]
    },
    "event": {
      "name": "Derby CA vs EST",
      "date": "2025-02-01T20:00:00Z",
      "venue": "Stade Radès"
    },
    "payment": {
      "method": "Flouci",
      "status": "COMPLETED",
      "amount": 89.50
    },
    "access": {
      "qr_codes": ["QR_ABC123", "QR_DEF456"],
      "access_instructions": "Présentez votre QR code à l'entrée"
    }
  },
  
  // Configuration
  "template_override": "order_confirmation_derby",
  "send_immediately": true,
  "track_engagement": true,
  "allow_retry": true,
  "max_retries": 3,
  
  // Métadonnées
  "metadata": {
    "organizer_id": "org_club_africain",
    "event_id": "evt_derby_2025",
    "source": "order_service",
    "correlation_id": "corr_order_123"
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "notification_id": "notif_01H8X9Y2Z3A4B5C6D7E8F9G2",
    "status": "QUEUED",
    "estimated_delivery": "2025-01-15T14:31:30Z",
    "channel": "EMAIL",
    "recipient": "ahmed.supporter@gmail.com",
    
    // Job information
    "job_id": "job_email_01H8X9Y2Z3A4B5C6D7E8F9G3",
    "queue_position": 1,
    "priority": "HIGH",
    
    // Template utilisé
    "template": {
      "id": "tpl_order_confirmation",
      "name": "Confirmation de commande",
      "version": "1.2"
    },
    
    // Tracking
    "tracking": {
      "enabled": true,
      "tracking_pixel_id": "px_01H8X9Y2Z3A4B5C6D7E8F9G4",
      "unsubscribe_token": "unsub_01H8X9Y2Z3A4B5C6D7E8F9G5"
    }
  },
  "message": "Notification queued for delivery"
}
```

### POST /api/v1/notifications/transactional/bulk
**Description** : Envoi en lot de notifications transactionnelles

#### Request Body
```json
{
  "notification_type": "event_reminder",
  "channel": "SMS",
  "priority": "MEDIUM",
  
  // Liste destinataires
  "recipients": [
    {
      "user_id": "usr_01H8X9Y2Z3A4B5C6D7E8F9G0",
      "phone": "+21697123456",
      "name": "Ahmed",
      "template_data": {
        "event_name": "Derby CA vs EST",
        "event_date": "2025-02-01T20:00:00Z",
        "reminder_time": "24h"
      }
    },
    {
      "user_id": "usr_01H8X9Y2Z3A4B5C6D7E8F9G1", 
      "phone": "+21699887766",
      "name": "Fatma",
      "template_data": {
        "event_name": "Derby CA vs EST",
        "event_date": "2025-02-01T20:00:00Z",
        "reminder_time": "24h"
      }
    }
  ],
  
  // Configuration globale
  "batch_config": {
    "batch_size": 100,
    "delay_between_batches": 5000,
    "max_concurrent": 10,
    "stop_on_error": false
  },
  
  "metadata": {
    "campaign_name": "Derby Reminder 24h",
    "organizer_id": "org_club_africain",
    "event_id": "evt_derby_2025"
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "bulk_job_id": "bulk_01H8X9Y2Z3A4B5C6D7E8F9G6",
    "total_recipients": 2,
    "estimated_completion": "2025-01-15T14:35:00Z",
    "batches_created": 1,
    
    "status": {
      "queued": 2,
      "processing": 0,
      "sent": 0,
      "failed": 0
    },
    
    "tracking_url": "https://api.entrix.tn/v1/notifications/bulk/bulk_01H8X9Y2Z3A4B5C6D7E8F9G6/status"
  },
  "message": "Bulk notification job created successfully"
}
```

### GET /api/v1/notifications/transactional/{notificationId}
**Description** : Statut et détails d'une notification

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "notif_01H8X9Y2Z3A4B5C6D7E8F9G2",
      "type": "order_confirmation",
      "channel": "EMAIL",
      "status": "DELIVERED",
      "priority": "HIGH",
      
      // Destinataire
      "recipient": {
        "user_id": "usr_01H8X9Y2Z3A4B5C6D7E8F9G0",
        "email": "ahmed.supporter@gmail.com",
        "name": "Ahmed Supporter"
      },
      
      // Contenu envoyé
      "content": {
        "subject": "Confirmation de votre commande ENT-2025-000001",
        "template_id": "tpl_order_confirmation",
        "language": "fr-TN",
        "size_bytes": 15432
      },
      
      // Timeline
      "timeline": {
        "created_at": "2025-01-15T14:30:00Z",
        "queued_at": "2025-01-15T14:30:01Z",
        "sent_at": "2025-01-15T14:30:15Z",
        "delivered_at": "2025-01-15T14:30:18Z",
        "opened_at": "2025-01-15T14:32:45Z",
        "clicked_at": "2025-01-15T14:33:12Z"
      },
      
      // Engagement
      "engagement": {
        "opened": true,
        "open_count": 2,
        "clicked": true,
        "click_count": 1,
        "clicked_links": [
          "https://entrix.tn/my-tickets"
        ],
        "bounced": false,
        "unsubscribed": false
      },
      
      // Métadonnées
      "metadata": {
        "organizer_id": "org_club_africain",
        "order_id": "ord_01H8X9Y2Z3A4B5C6D7E8F9G1",
        "tracking_campaign": "order_confirmations"
      },
      
      // Retry information
      "delivery_attempts": [
        {
          "attempt": 1,
          "status": "SUCCESS",
          "attempted_at": "2025-01-15T14:30:15Z",
          "response_time": 234,
          "provider_response": "250 OK: message accepted"
        }
      ]
    }
  }
}
```

---

# API Notifications marketing

## 📢 Ressource : `/api/v1/notifications/marketing`

### POST /api/v1/notifications/marketing/campaigns
**Description** : Création d'une campagne marketing

#### Request Body
```json
{
  "campaign_name": "Promotion Derby 2025",
  "campaign_type": "PROMOTIONAL",
  "channel": "EMAIL",
  
  // Ciblage
  "audience": {
    "target_type": "SEGMENT",
    "segment_criteria": {
      "favorite_teams": ["Club Africain", "EST"],
      "purchase_history": {
        "has_purchased": true,
        "last_purchase_within_days": 365
      },
      "location": {
        "cities": ["Tunis", "Ariana", "Ben Arous"],
        "radius_km": 50
      },
      "preferences": {
        "marketing_consent": true,
        "email_frequency": ["immediate", "daily", "weekly"]
      }
    },
    "exclude_segments": ["unsubscribed", "bounced"],
    "estimated_size": 5247
  },
  
  // Contenu
  "content": {
    "template_id": "tpl_derby_promotion",
    "subject": "🔥 Derby CA vs EST - Offre Limitée 48h !",
    "preview_text": "Vos places pour le match du siècle à prix exceptionnel",
    "personalization": {
      "use_first_name": true,
      "dynamic_content": {
        "team_preference": "favorite_team",
        "price_tier": "based_on_purchase_history",
        "urgency_level": "based_on_engagement"
      }
    }
  },
  
  // Programmation
  "schedule": {
    "send_type": "SCHEDULED",
    "send_at": "2025-01-20T09:00:00Z",
    "timezone": "Africa/Tunis",
    "batch_delivery": {
      "enabled": true,
      "batch_size": 500,
      "interval_minutes": 10
    }
  },
  
  // A/B Testing
  "ab_testing": {
    "enabled": true,
    "test_percentage": 20,
    "variants": [
      {
        "name": "Variant A - Urgency",
        "subject": "⏰ Plus que 48h - Derby CA vs EST",
        "template_data": {
          "urgency_level": "high",
          "cta_text": "Réserver maintenant"
        }
      },
      {
        "name": "Variant B - Exclusivité", 
        "subject": "🎟️ Accès VIP Derby CA vs EST",
        "template_data": {
          "exclusivity_level": "vip",
          "cta_text": "Accès exclusif"
        }
      }
    ],
    "success_metric": "click_rate",
    "test_duration_hours": 4
  },
  
  // Configuration
  "settings": {
    "track_engagement": true,
    "allow_unsubscribe": true,
    "frequency_capping": {
      "max_emails_per_day": 2,
      "max_emails_per_week": 5
    },
    "send_time_optimization": true,
    "respect_user_timezone": true
  },
  
  // Métadonnées
  "metadata": {
    "organizer_id": "org_club_africain",
    "event_id": "evt_derby_2025",
    "campaign_category": "event_promotion",
    "budget_allocated": 500.00,
    "expected_conversion_rate": 0.12
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "camp_01H8X9Y2Z3A4B5C6D7E8F9G7",
      "name": "Promotion Derby 2025",
      "status": "SCHEDULED",
      "channel": "EMAIL",
      
      // Audience calculée
      "audience": {
        "total_recipients": 5247,
        "segments": {
          "club_africain_fans": 2456,
          "est_fans": 2134,
          "neutral_football_fans": 657
        },
        "exclusions_applied": 156
      },
      
      // A/B Testing setup
      "ab_test": {
        "test_group_size": 1049,
        "control_group_size": 4198,
        "variants_configured": 2
      },
      
      // Programmation
      "schedule": {
        "send_at": "2025-01-20T09:00:00Z",
        "estimated_completion": "2025-01-20T11:30:00Z",
        "total_batches": 11
      },
      
      // URLs de suivi
      "tracking": {
        "campaign_url": "https://api.entrix.tn/v1/notifications/marketing/campaigns/camp_01H8X9Y2Z3A4B5C6D7E8F9G7",
        "preview_url": "https://entrix.tn/preview/campaign/camp_01H8X9Y2Z3A4B5C6D7E8F9G7",
        "analytics_url": "https://analytics.entrix.tn/campaigns/camp_01H8X9Y2Z3A4B5C6D7E8F9G7"
      }
    }
  },
  "message": "Campaign created and scheduled successfully"
}
```

### GET /api/v1/notifications/marketing/campaigns
**Description** : Liste des campagnes marketing

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page |
| `organizer_id` | uuid | - | Campagnes d'un organisateur |
| `status` | enum | - | Statut campagne |
| `channel` | enum | - | Canal de communication |
| `campaign_type` | enum | - | Type de campagne |
| `date_from` | date | - | Date début |
| `date_to` | date | - | Date fin |
| `include_stats` | boolean | false | Inclure statistiques |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "camp_01H8X9Y2Z3A4B5C6D7E8F9G7",
        "name": "Promotion Derby 2025",
        "status": "COMPLETED",
        "channel": "EMAIL",
        "campaign_type": "PROMOTIONAL",
        
        "audience_size": 5247,
        "sent_count": 5091,
        "delivered_count": 4987,
        "opened_count": 1896,
        "clicked_count": 245,
        
        "metrics": {
          "delivery_rate": 97.9,
          "open_rate": 38.0,
          "click_rate": 4.9,
          "unsubscribe_rate": 0.2,
          "bounce_rate": 2.1
        },
        
        "schedule": {
          "created_at": "2025-01-15T10:00:00Z",
          "sent_at": "2025-01-20T09:00:00Z",
          "completed_at": "2025-01-20T11:28:00Z"
        },
        
        "ab_test_results": {
          "winner": "Variant A - Urgency",
          "improvement": 23.5,
          "confidence": 95.2
        },
        
        "organizer": {
          "id": "org_club_africain",
          "name": "Club Africain"
        }
      }
    ],
    
    "summary": {
      "total_campaigns": 127,
      "active_campaigns": 5,
      "total_sent": 156789,
      "avg_open_rate": 34.6,
      "avg_click_rate": 4.2
    },
    
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 127,
      "last_page": 7
    }
  }
}
```

### PUT /api/v1/notifications/marketing/campaigns/{campaignId}
**Description** : Modification d'une campagne (selon statut)

#### Request Body
```json
{
  "campaign_name": "Promotion Derby 2025 - UPDATED",
  "schedule": {
    "send_at": "2025-01-21T09:00:00Z"
  },
  "audience": {
    "additional_segments": ["recent_subscribers"],
    "exclude_segments": ["unsubscribed", "bounced", "competitors"]
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "campaign": {
      // Campagne mise à jour
    },
    "changes_applied": [
      "schedule_updated",
      "audience_expanded",
      "exclusions_added"
    ]
  },
  "message": "Campaign updated successfully"
}
```

---

# API Templates et personnalisation

## 📝 Ressource : `/api/v1/notifications/templates`

### GET /api/v1/notifications/templates
**Description** : Liste des templates disponibles

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `category` | enum | - | Catégorie (transactional, marketing, system) |
| `channel` | enum | - | Canal (email, sms, push) |
| `organizer_id` | uuid | - | Templates d'un organisateur |
| `language` | string | - | Langue template |
| `active_only` | boolean | true | Templates actifs uniquement |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "tpl_order_confirmation",
        "name": "Confirmation de commande",
        "category": "TRANSACTIONAL",
        "channel": "EMAIL",
        "language": "fr-TN",
        
        "content": {
          "subject": "Confirmation de votre commande {{order.number}}",
          "body_text": "Merci {{recipient.name}} pour votre commande...",
          "body_html": "<html>...</html>",
          "variables": [
            "recipient.name",
            "order.number",
            "order.total_amount",
            "event.name",
            "event.date"
          ]
        },
        
        "metadata": {
          "organizer_id": "org_club_africain",
          "version": "1.2",
          "created_by": "designer_001",
          "last_modified": "2025-01-10T15:30:00Z",
          "usage_count": 2456
        },
        
        "settings": {
          "is_active": true,
          "is_default": true,
          "auto_translate": false,
          "requires_approval": false
        }
      }
    ],
    
    "categories": {
      "TRANSACTIONAL": 45,
      "MARKETING": 78,
      "SYSTEM": 12,
      "ONBOARDING": 23
    },
    
    "channels": {
      "EMAIL": 89,
      "SMS": 34,
      "PUSH": 28,
      "WHATSAPP": 7
    }
  }
}
```

### POST /api/v1/notifications/templates
**Description** : Création d'un nouveau template

#### Request Body
```json
{
  "name": "Welcome Series - Email 1",
  "category": "ONBOARDING", 
  "channel": "EMAIL",
  "language": "fr-TN",
  
  "content": {
    "subject": "Bienvenue sur Entrix, {{recipient.first_name}} ! 🎉",
    "body_html": `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenue sur Entrix</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Bienvenue {{recipient.first_name}} !</h1>
          <p style="color: #f0f0f0; font-size: 18px;">Votre aventure Entrix commence maintenant</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2>Que pouvez-vous faire maintenant ?</h2>
          
          {{#if onboarding.incentive}}
          <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">🎁 Votre cadeau de bienvenue</h3>
            <p><strong>{{onboarding.incentive.description}}</strong></p>
            <p style="font-size: 14px; color: #666;">Valide jusqu'au {{format_date onboarding.incentive.expires_at 'DD/MM/YYYY'}}</p>
          </div>
          {{/if}}
          
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 15px 0;">
              ✅ <strong>Découvrez les événements</strong> près de chez vous
            </li>
            <li style="margin: 15px 0;">
              ✅ <strong>Suivez vos équipes</strong> et artistes favoris
            </li>
            <li style="margin: 15px 0;">
              ✅ <strong>Rejoignez des groupes</strong> pour des achats collectifs
            </li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{app_url}}/explore?utm_source=welcome_email&utm_medium=email&utm_campaign=onboarding" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Découvrir les événements
            </a>
          </div>
          
          {{#if user.migrated_data}}
          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0056b3; margin-top: 0;">📦 Vos données ont été transférées</h3>
            <p>Nous avons automatiquement ajouté à votre compte :</p>
            <ul>
              {{#if user.migrated_data.tickets}}<li>{{user.migrated_data.tickets}} billet(s)</li>{{/if}}
              {{#if user.migrated_data.orders}}<li>{{user.migrated_data.orders}} commande(s)</li>{{/if}}
              {{#if user.migrated_data.subscriptions}}<li>{{user.migrated_data.subscriptions}} abonnement(s)</li>{{/if}}
            </ul>
          </div>
          {{/if}}
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Besoin d'aide ? <a href="{{support_url}}" style="color: #667eea;">Contactez notre support</a>
          </p>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
            <a href="{{unsubscribe_url}}" style="color: #999;">Se désabonner</a> | 
            <a href="{{preferences_url}}" style="color: #999;">Gérer mes préférences</a>
          </p>
        </div>
      </body>
      </html>
    `,
    "body_text": `
      Bienvenue {{recipient.first_name}} !
      
      Votre aventure Entrix commence maintenant.
      
      {{#if onboarding.incentive}}
      🎁 Votre cadeau de bienvenue : {{onboarding.incentive.description}}
      Valide jusqu'au {{format_date onboarding.incentive.expires_at 'DD/MM/YYYY'}}
      {{/if}}
      
      Que pouvez-vous faire maintenant ?
      ✅ Découvrez les événements près de chez vous
      ✅ Suivez vos équipes et artistes favoris  
      ✅ Rejoignez des groupes pour des achats collectifs
      
      Découvrir les événements : {{app_url}}/explore
      
      Besoin d'aide ? {{support_url}}
      Se désabonner : {{unsubscribe_url}}
    `,
    "variables": [
      "recipient.first_name",
      "onboarding.incentive",
      "user.migrated_data",
      "app_url",
      "support_url",
      "unsubscribe_url"
    ]
  },
  
  "settings": {
    "auto_translate": true,
    "requires_approval": false,
    "track_engagement": true,
    "allow_personalization": true
  },
  
  "metadata": {
    "organizer_id": "global",
    "description": "Premier email de la série de bienvenue pour nouveaux utilisateurs",
    "tags": ["onboarding", "welcome", "conversion"],
    "target_audience": "new_users"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "tpl_01H8X9Y2Z3A4B5C6D7E8F9G8",
      "name": "Welcome Series - Email 1",
      "category": "ONBOARDING",
      "channel": "EMAIL",
      "version": "1.0",
      "status": "ACTIVE",
      
      "validation": {
        "html_valid": true,
        "variables_valid": true,
        "spam_score": 2.1,
        "deliverability_score": 94
      },
      
      "preview_urls": {
        "html": "https://api.entrix.tn/v1/notifications/templates/tpl_01H8X9Y2Z3A4B5C6D7E8F9G8/preview?format=html",
        "text": "https://api.entrix.tn/v1/notifications/templates/tpl_01H8X9Y2Z3A4B5C6D7E8F9G8/preview?format=text"
      }
    }
  },
  "message": "Template created successfully"
}
```

### GET /api/v1/notifications/templates/{templateId}/preview
**Description** : Prévisualisation d'un template avec données test

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `format` | enum | html | Format (html, text, json) |
| `test_data` | json | - | Données test pour variables |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "preview": {
      "subject": "Bienvenue sur Entrix, Ahmed ! 🎉",
      "body_html": "<html>...contenu rendu...</html>",
      "body_text": "Bienvenue Ahmed ! ...",
      
      "variables_used": [
        "recipient.first_name",
        "onboarding.incentive.description",
        "app_url"
      ],
      
      "missing_variables": [],
      
      "stats": {
        "html_size": 15.7,
        "text_size": 2.3,
        "estimated_load_time": 0.8,
        "image_count": 3,
        "link_count": 7
      }
    }
  }
}
```

---

# API Préférences utilisateur

## ⚙️ Ressource : `/api/v1/notifications/preferences`

### GET /api/v1/notifications/preferences/{userId}
**Description** : Préférences de notification d'un utilisateur

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "user_id": "usr_01H8X9Y2Z3A4B5C6D7E8F9G0",
    "preferences": {
      // Canaux activés
      "channels": {
        "email": {
          "enabled": true,
          "address": "ahmed.supporter@gmail.com",
          "verified": true,
          "frequency": "immediate"
        },
        "sms": {
          "enabled": true,
          "number": "+21697123456",
          "verified": true,
          "frequency": "important_only"
        },
        "push": {
          "enabled": true,
          "devices": 2,
          "frequency": "immediate"
        },
        "whatsapp": {
          "enabled": false,
          "number": null,
          "verified": false
        }
      },
      
      // Types de notifications
      "notification_types": {
        "transactional": {
          "order_confirmations": true,
          "payment_receipts": true,
          "ticket_deliveries": true,
          "event_reminders": true,
          "access_instructions": true,
          "refund_updates": true
        },
        "marketing": {
          "promotional_campaigns": true,
          "event_announcements": true,
          "early_access_offers": false,
          "newsletters": true,
          "surveys": false
        },
        "social": {
          "group_invitations": true,
          "group_activity": false,
          "friend_requests": true,
          "reviews_requests": false
        },
        "system": {
          "security_alerts": true,
          "account_updates": true,
          "policy_changes": true,
          "maintenance_notices": false
        }
      },
      
      // Timing et fréquence
      "timing": {
        "quiet_hours": {
          "enabled": true,
          "start": "22:00",
          "end": "08:00",
          "timezone": "Africa/Tunis"
        },
        "frequency_limits": {
          "max_emails_per_day": 3,
          "max_sms_per_week": 5,
          "max_push_per_hour": 2
        },
        "send_time_optimization": true,
        "respect_timezone": true
      },
      
      // Personnalisation
      "personalization": {
        "use_first_name": true,
        "language": "fr-TN",
        "content_preferences": {
          "favorite_teams": ["Club Africain"],
          "event_categories": ["SPORTS", "MUSIC"],
          "price_ranges": ["0-50", "50-100"],
          "venue_preferences": ["Stade Radès", "Théâtre Municipal"]
        }
      },
      
      // Unsubscribe et contrôles
      "unsubscribe": {
        "global_unsubscribe": false,
        "unsubscribed_lists": [],
        "unsubscribe_reason": null,
        "can_resubscribe": true
      }
    },
    
    "last_updated": "2025-01-10T14:30:00Z",
    "updated_by": "user_self"
  }
}
```

### PUT /api/v1/notifications/preferences/{userId}
**Description** : Mise à jour des préférences utilisateur

#### Request Body
```json
{
  "channels": {
    "email": {
      "frequency": "daily_digest"
    },
    "sms": {
      "enabled": false
    }
  },
  "notification_types": {
    "marketing": {
      "promotional_campaigns": false,
      "early_access_offers": true
    }
  },
  "timing": {
    "quiet_hours": {
      "start": "21:00", 
      "end": "09:00"
    }
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "preferences": {
      // Préférences mises à jour
    },
    "changes_applied": [
      "email_frequency_updated",
      "sms_disabled", 
      "promotional_campaigns_disabled",
      "early_access_enabled",
      "quiet_hours_adjusted"
    ]
  },
  "message": "Preferences updated successfully"
}
```

### POST /api/v1/notifications/preferences/unsubscribe
**Description** : Désabonnement global ou par liste

#### Request Body
```json
{
  "email": "ahmed.supporter@gmail.com",
  "unsubscribe_token": "unsub_01H8X9Y2Z3A4B5C6D7E8F9G5",
  "unsubscribe_type": "LIST", // ou "GLOBAL"
  "list_ids": ["list_promotional", "list_newsletters"],
  "reason": "Too many emails",
  "feedback": "Je reçois trop d'emails, mais je veux garder les confirmations de commande"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "unsubscribe_status": "PARTIAL",
    "lists_unsubscribed": ["list_promotional", "list_newsletters"],
    "active_subscriptions": ["list_transactional", "list_event_reminders"],
    "can_resubscribe": true,
    "resubscribe_url": "https://entrix.tn/resubscribe?token=resub_01H8X9Y2Z3A4B5C6D7E8F9G6"
  },
  "message": "Successfully unsubscribed from selected lists"
}
```

---

# API Canaux de communication

## 📱 Ressource : `/api/v1/notifications/channels`

### GET /api/v1/notifications/channels/status
**Description** : Statut et configuration des canaux

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "channels": {
      "email": {
        "status": "ACTIVE",
        "provider": "nodemailer_smtp",
        "configuration": {
          "host": "smtp.gmail.com",
          "port": 587,
          "secure": false,
          "daily_limit": 10000,
          "rate_limit": "100/minute"
        },
        "metrics": {
          "sent_today": 1247,
          "delivery_rate": 98.7,
          "bounce_rate": 1.2,
          "complaint_rate": 0.1
        },
        "last_test": "2025-01-15T14:30:00Z",
        "last_test_result": "SUCCESS"
      },
      
      "sms": {
        "status": "ACTIVE",
        "provider": "twilio",
        "configuration": {
          "endpoint": "https://api.twilio.com/2010-04-01",
          "daily_limit": 2000,
          "rate_limit": "10/second"
        },
        "metrics": {
          "sent_today": 234,
          "delivery_rate": 99.1,
          "failure_rate": 0.9
        },
        "last_test": "2025-01-15T14:30:00Z",
        "last_test_result": "SUCCESS"
      },
      
      "push": {
        "status": "ACTIVE", 
        "provider": "firebase_fcm",
        "configuration": {
          "project_id": "entrix-mobile-app",
          "daily_limit": 50000,
          "rate_limit": "1000/minute"
        },
        "metrics": {
          "sent_today": 3456,
          "delivery_rate": 95.4,
          "open_rate": 23.7
        },
        "platforms": {
          "android": {
            "active_devices": 12456,
            "success_rate": 96.2
          },
          "ios": {
            "active_devices": 8934,
            "success_rate": 94.8
          },
          "web": {
            "active_devices": 5643,
            "success_rate": 97.1
          }
        }
      },
      
      "whatsapp": {
        "status": "BETA",
        "provider": "whatsapp_business",
        "configuration": {
          "phone_number": "+21671234567",
          "verification_status": "VERIFIED",
          "daily_limit": 1000
        },
        "metrics": {
          "sent_today": 45,
          "delivery_rate": 98.9,
          "read_rate": 87.2
        }
      }
    },
    
    "global_stats": {
      "total_sent_today": 4982,
      "total_sent_this_month": 156789,
      "avg_delivery_rate": 97.8,
      "cost_today": 45.67,
      "cost_this_month": 1456.23
    }
  }
}
```

### POST /api/v1/notifications/channels/{channel}/test
**Description** : Test d'un canal de communication

#### Request Body
```json
{
  "recipient": "ahmed.supporter@gmail.com",
  "test_type": "connectivity", // ou "delivery"
  "message": "Test notification from Entrix API"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "test_result": "SUCCESS",
    "channel": "EMAIL",
    "response_time": 234,
    "provider_response": "250 2.0.0 OK",
    "message_id": "test_msg_01H8X9Y2Z3A4B5C6D7E8F9G9",
    "delivered_at": "2025-01-15T14:35:12Z"
  },
  "message": "Channel test completed successfully"
}
```

---

# API Analytics et reporting

## 📊 Ressource : `/api/v1/notifications/analytics`

### GET /api/v1/notifications/analytics/overview
**Description** : Vue d'ensemble des analytics de notifications

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `period` | enum | week | Période (day, week, month, quarter) |
| `organizer_id` | uuid | - | Organisateur spécifique |
| `channel` | enum | - | Canal spécifique |
| `date_from` | date | - | Date début |
| `date_to` | date | - | Date fin |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-01-08T00:00:00Z",
      "to": "2025-01-15T23:59:59Z",
      "period_type": "week"
    },
    
    "overview": {
      "total_sent": 28945,
      "total_delivered": 28123,
      "total_opened": 10567,
      "total_clicked": 1345,
      "total_unsubscribed": 45,
      "total_bounced": 567,
      "total_complaints": 12
    },
    
    "rates": {
      "delivery_rate": 97.2,
      "open_rate": 37.6,
      "click_rate": 4.8,
      "unsubscribe_rate": 0.16,
      "bounce_rate": 2.0,
      "complaint_rate": 0.04
    },
    
    "by_channel": {
      "EMAIL": {
        "sent": 23456,
        "delivered": 22834,
        "opened": 9876,
        "clicked": 1234,
        "delivery_rate": 97.3,
        "open_rate": 43.2,
        "click_rate": 5.4
      },
      "SMS": {
        "sent": 3456,
        "delivered": 3423,
        "opened": 0,
        "clicked": 78,
        "delivery_rate": 99.0,
        "open_rate": 0,
        "click_rate": 2.3
      },
      "PUSH": {
        "sent": 2033,
        "delivered": 1866,
        "opened": 691,
        "clicked": 33,
        "delivery_rate": 91.8,
        "open_rate": 37.0,
        "click_rate": 1.8
      }
    },
    
    "by_type": {
      "TRANSACTIONAL": {
        "sent": 18567,
        "delivery_rate": 98.9,
        "open_rate": 45.6,
        "click_rate": 8.9
      },
      "MARKETING": {
        "sent": 8934,
        "delivery_rate": 94.2,
        "open_rate": 32.1,
        "click_rate": 3.2
      },
      "SYSTEM": {
        "sent": 1444,
        "delivery_rate": 99.2,
        "open_rate": 67.8,
        "click_rate": 12.4
      }
    },
    
    "trends": [
      {
        "date": "2025-01-08",
        "sent": 3567,
        "delivered": 3489,
        "opened": 1234,
        "clicked": 156
      },
      {
        "date": "2025-01-09", 
        "sent": 4123,
        "delivered": 4034,
        "opened": 1456,
        "clicked": 189
      }
      // ... plus de données quotidiennes
    ],
    
    "top_performing": {
      "campaigns": [
        {
          "id": "camp_01H8X9Y2Z3A4B5C6D7E8F9G7",
          "name": "Promotion Derby 2025",
          "open_rate": 52.3,
          "click_rate": 8.7,
          "sent": 5247
        }
      ],
      "templates": [
        {
          "id": "tpl_order_confirmation",
          "name": "Confirmation de commande",
          "open_rate": 89.4,
          "click_rate": 45.6,
          "usage_count": 2456
        }
      ]
    }
  }
}
```

### GET /api/v1/notifications/analytics/engagement
**Description** : Analytics d'engagement détaillées

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "engagement_metrics": {
      "time_to_open": {
        "avg_minutes": 127,
        "median_minutes": 45,
        "percentiles": {
          "25": 12,
          "50": 45,
          "75": 156,
          "95": 720
        }
      },
      
      "device_breakdown": {
        "desktop": {
          "opens": 4567,
          "percentage": 43.2,
          "avg_time_spent": 67
        },
        "mobile": {
          "opens": 5234,
          "percentage": 49.5,
          "avg_time_spent": 34
        },
        "tablet": {
          "opens": 766,
          "percentage": 7.3,
          "avg_time_spent": 89
        }
      },
      
      "geographic_data": {
        "by_city": [
          {
            "city": "Tunis",
            "opens": 3456,
            "clicks": 456,
            "percentage": 32.7
          },
          {
            "city": "Sfax", 
            "opens": 1234,
            "clicks": 167,
            "percentage": 11.7
          }
        ]
      },
      
      "best_send_times": {
        "by_hour": [
          {
            "hour": 9,
            "open_rate": 45.6,
            "click_rate": 6.7
          },
          {
            "hour": 19,
            "open_rate": 41.2,
            "click_rate": 5.9
          }
        ],
        "by_day": [
          {
            "day": "tuesday",
            "open_rate": 39.8,
            "click_rate": 5.2
          },
          {
            "day": "wednesday",
            "open_rate": 37.9,
            "click_rate": 4.8
          }
        ]
      }
    }
  }
}
```

---

# Codes d'erreur

## 🚨 Codes d'erreur spécifiques

| Code | Message | Description |
|------|---------|-------------|
| `NOTIF_001` | Invalid notification type | Type de notification invalide |
| `NOTIF_002` | Channel not available | Canal indisponible |
| `NOTIF_003` | Template not found | Template introuvable |
| `NOTIF_004` | Recipient invalid | Destinataire invalide |
| `NOTIF_005` | Content validation failed | Validation contenu échouée |
| `NOTIF_006` | Rate limit exceeded | Limite débit dépassée |
| `NOTIF_007` | Queue full` | File d'attente pleine |
| `NOTIF_008` | Delivery failed | Livraison échouée |
| `NOTIF_009` | Template compilation error | Erreur compilation template |
| `NOTIF_010` | Unsubscribed recipient | Destinataire désabonné |
| `CAMPAIGN_001` | Campaign not found | Campagne introuvable |
| `CAMPAIGN_002` | Campaign already sent | Campagne déjà envoyée |
| `CAMPAIGN_003` | Audience too small | Audience trop petite |
| `CAMPAIGN_004` | Schedule invalid | Programmation invalide |
| `TEMPLATE_001` | Variable missing | Variable manquante |
| `TEMPLATE_002` | Syntax error | Erreur syntaxe |
| `TEMPLATE_003` | Size limit exceeded | Taille limite dépassée |
| `PREF_001` | Invalid preference | Préférence invalide |
| `PREF_002` | Unsubscribe token invalid | Token désabonnement invalide |

---

# Exemples d'usage

## 🎯 Scénarios d'usage complets

### Notification de confirmation de commande
```bash
# Envoi confirmation immédiate
curl -X POST https://api.entrix.tn/v1/notifications/transactional/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "order_confirmation",
    "channel": "EMAIL",
    "priority": "HIGH",
    "recipient": {
      "user_id": "usr_123",
      "email": "ahmed@example.com",
      "name": "Ahmed"
    },
    "template_data": {
      "order": {
        "number": "ENT-2025-000001",
        "total_amount": 89.50,
        "items": [{"name": "Derby CA vs EST", "quantity": 2}]
      }
    }
  }'
```

### Campagne marketing avec A/B testing
```bash
# Création campagne
curl -X POST https://api.entrix.tn/v1/notifications/marketing/campaigns \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d '{
    "campaign_name": "Promotion Derby 2025",
    "channel": "EMAIL",
    "audience": {
      "segment_criteria": {
        "favorite_teams": ["Club Africain"],
        "purchase_history": {"has_purchased": true}
      }
    },
    "ab_testing": {
      "enabled": true,
      "variants": [
        {"name": "Urgency", "subject": "⏰ Plus que 48h"},
        {"name": "Exclusivité", "subject": "🎟️ Accès VIP"}
      ]
    },
    "schedule": {
      "send_at": "2025-01-20T09:00:00Z"
    }
  }'
```

### Gestion préférences utilisateur
```bash
# Mise à jour préférences
curl -X PUT https://api.entrix.tn/v1/notifications/preferences/usr_123 \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "channels": {
      "email": {"frequency": "daily_digest"},
      "sms": {"enabled": false}
    },
    "notification_types": {
      "marketing": {"promotional_campaigns": false}
    }
  }'

# Désabonnement partiel
curl -X POST https://api.entrix.tn/v1/notifications/preferences/unsubscribe \
  -d '{
    "email": "ahmed@example.com",
    "unsubscribe_token": "unsub_token_123",
    "unsubscribe_type": "LIST",
    "list_ids": ["list_promotional"],
    "reason": "Too many emails"
  }'
```

### Analytics et performance
```bash
# Vue d'ensemble analytics
curl -X GET "https://api.entrix.tn/v1/notifications/analytics/overview?period=week&organizer_id=org_club_africain" \
  -H "Authorization: Bearer $ORG_TOKEN"

# Engagement détaillé
curl -X GET https://api.entrix.tn/v1/notifications/analytics/engagement \
  -H "Authorization: Bearer $ORG_TOKEN"
```

Ce module **Notifications** constitue le système de communication central d'Entrix V3.0, permettant un engagement utilisateur optimal à travers tous les canaux avec personnalisation avancée, analytics détaillées et respect des préférences utilisateur. Il assure une communication fluide et pertinente pour maximiser l'engagement et la satisfaction client.