# API Specifications - Module Contrôle d'Accès
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Droits d'accès centraux](#api-droits-daccès-centraux)
4. [API Validation temps réel](#api-validation-temps-réel)
5. [API Logs et traçabilité](#api-logs-et-traçabilité)
6. [API Transferts et transactions](#api-transferts-et-transactions)
7. [API Sécurité et anti-fraude](#api-sécurité-et-anti-fraude)
8. [API Analytics temps réel](#api-analytics-temps-réel)
9. [API Administration contrôle](#api-administration-contrôle)
10. [API Monitoring et alertes](#api-monitoring-et-alertes)
11. [Codes d'erreur](#codes-derreur)
12. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Contrôle d'Accès** constitue le **cœur opérationnel absolu** d'Entrix V3.0. Il centralise et unifie TOUS les droits d'accès de la plateforme dans une architecture pivot révolutionnaire, assurant validation temps réel, traçabilité complète et sécurité maximale.

## 🏗️ Architecture centrale révolutionnaire

### **Table pivot universelle `access_rights`**
```
🎫 Billets → 🎟️ Abonnements → 👑 VIP → 💼 Staff → 🚨 Urgence
                    ↓
            📱 QR CODE UNIVERSEL
                    ↓
        🚪 CONTRÔLE PHYSIQUE UNIFIÉ
```

### **Innovation V3.0**
- **Unification totale** : Un seul système pour TOUS les accès
- **Support anonyme natif** : Validation sans `user_id` requis
- **QR codes universels** : Code unique pour tous types d'accès
- **Performance sub-seconde** : Validation < 200ms même avec 50k+ accès simultanés
- **Traçabilité absolue** : Audit complet de chaque scan physique
- **Sécurité multicouches** : Anti-fraude, blacklist, détection anomalies

### **Types d'accès unifiés**
- **🎫 TICKET** : Billets individuels
- **🎟️ SUBSCRIPTION** : Abonnements actifs
- **👑 VIP_ACCESS** : Accès privilégiés
- **💼 STAFF_ACCESS** : Personnel événements
- **📺 MEDIA_ACCESS** : Presse et médias
- **🔧 TECHNICAL_ACCESS** : Personnel technique
- **🚨 EMERGENCY_ACCESS** : Accès urgence
- **⏰ TEMPORARY_ACCESS** : Accès temporaires

### **Workflows centraux**
1. **Génération** : Billetterie/Admin → `access_rights` + QR unique
2. **Validation** : Scan QR → Vérifications → GRANTED/DENIED
3. **Logging** : Chaque scan → `access_control_log` avec traçabilité
4. **Analytics** : Flux temps réel → Dashboards opérationnels

## 🔗 Intégration avec autres modules
- **Billetterie** : Génération automatique QR après paiement validé
- **Événements** : Configuration accès par événement/zone
- **Lieux** : Points d'accès et contrôles physiques
- **Utilisateurs** : Gestion propriétaires (anonymes supportés)
- **Sécurité** : Anti-fraude, blacklist, monitoring temps réel

---

# Authentification et autorisation

## 🔐 Niveaux d'accès requis

### Consultation droits d'accès
- **Public** : Aucun (QR codes auto-suffisants)
- **Utilisateur** : Ses propres droits d'accès
- **Organisateur** : Droits de ses événements/abonnements
- **Agent contrôle** : Validation en temps réel
- **Super Admin** : Tous droits d'accès

### Gestion droits d'accès
- **Organisateur** : Suspension/réactivation de ses droits
- **Gestionnaire lieu** : Contrôle accès de son lieu
- **Agent sécurité** : Override manuel avec justification
- **Super Admin** : Toutes opérations

### Validation temps réel
- **Agent contrôle** : Scan et validation QR codes
- **Terminal automatique** : Validation automatisée
- **API intégration** : Validation par systèmes tiers

## 🛡️ Headers requis

```http
Authorization: Bearer <JWT_TOKEN> (optionnel pour validation QR)
Content-Type: application/json
X-Agent-ID: <AGENT_UUID> (pour contrôles physiques)
X-Terminal-ID: <TERMINAL_ID> (pour bornes automatiques)
X-Venue-ID: <VENUE_UUID> (pour contrôles venue)
X-Security-Level: <LOW|STANDARD|HIGH|MAXIMUM> (niveau contrôle)
```

---

# API Droits d'accès centraux

## 🎯 Ressource : `/api/v1/access-rights`

### GET /api/v1/access-rights
**Description** : Liste des droits d'accès avec filtres avancés

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page (max 100) |
| `user_id` | uuid | - | Droits d'un utilisateur |
| `organizer_id` | uuid | - | Droits d'un organisateur |
| `event_id` | uuid | - | Droits pour un événement |
| `venue_id` | string | - | Droits pour un lieu |
| `access_type` | enum | - | Type d'accès |
| `status` | enum | - | Statut droit |
| `is_anonymous` | boolean | - | Droits anonymes (user_id = null) |
| `valid_for_date` | date | - | Valides à cette date |
| `ticket_id` | uuid | - | Droits liés à un billet |
| `subscription_id` | uuid | - | Droits liés à un abonnement |
| `qr_code` | string | - | Recherche par QR code |
| `include` | string | - | Relations (user,event,venue,logs) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "access_rights": [
      {
        "id": "access-derby-ahmed-001",
        "qr_code": "TKT_DER240315001",
        "access_type": "TICKET",
        "status": "ACTIVE",
        "holder": {
          "user_id": "user-ahmed-ben-ali",
          "user_name": "Ahmed Ben Ali",
          "is_anonymous": false
        },
        "source": {
          "type": "TICKET",
          "ticket_id": "ticket-derby-12345",
          "ticket_number": "DER240315001",
          "subscription_id": null,
          "subscription_plan_id": null
        },
        "event": {
          "id": "derby-est-ca-2024",
          "name": "Derby EST vs Club Africain",
          "date": "2024-04-15T20:00:00Z",
          "venue": "Stade Olympique de Radès"
        },
        "venue": {
          "id": "stade-rades-tunis",
          "name": "Stade Olympique de Radès"
        },
        "zone": {
          "id": "tribune-est",
          "name": "Tribune Est",
          "section": "A",
          "row": "15",
          "seat": "23"
        },
        "organizer": {
          "id": "ligue-pro-tunisie",
          "name": "Ligue Professionnelle Tunisienne"
        },
        "validity": {
          "valid_from": "2024-04-15T18:00:00Z",
          "valid_until": "2024-04-15T23:00:00Z",
          "timezone": "Africa/Tunis",
          "is_currently_valid": true
        },
        "usage": {
          "max_uses": 1,
          "current_uses": 0,
          "remaining_uses": 1,
          "last_used_at": null,
          "can_be_used": true
        },
        "transfer_info": {
          "is_transferable": true,
          "transfer_count": 0,
          "max_transfers": 3,
          "transfer_fee": 5.00,
          "can_transfer": true
        },
        "special_access": {
          "vip_access": false,
          "backstage_access": false,
          "parking_included": false,
          "hospitality_access": false
        },
        "restrictions": [
          {
            "type": "AGE_LIMIT",
            "description": "Accès limité aux plus de 16 ans",
            "is_enforced": true
          }
        ],
        "security": {
          "security_level": "STANDARD",
          "requires_id": false,
          "photo_verification": false,
          "biometric_check": false
        },
        "analytics": {
          "generated_at": "2024-03-15T14:30:00Z",
          "first_scan_at": null,
          "last_scan_at": null,
          "scan_count": 0,
          "validation_attempts": 0
        },
        "created_at": "2024-03-15T14:30:00Z",
        "updated_at": "2024-03-20T16:45:00Z"
      },
      {
        "id": "access-sub-est-ahmed-main",
        "qr_code": "SUB_EST_240001234_MAIN",
        "access_type": "SUBSCRIPTION",
        "status": "ACTIVE",
        "holder": {
          "user_id": "user-ahmed-ben-ali",
          "user_name": "Ahmed Ben Ali",
          "is_anonymous": false
        },
        "source": {
          "type": "SUBSCRIPTION",
          "ticket_id": null,
          "subscription_id": "sub-est-ahmed-2024",
          "subscription_plan_id": "plan-est-2024-season"
        },
        "event": null,
        "venue": {
          "id": "stade-rades-tunis",
          "name": "Stade Olympique de Radès"
        },
        "preferred_zone": {
          "id": "tribune-est",
          "name": "Tribune Est"
        },
        "organizer": {
          "id": "est-tunis-official",
          "name": "Espérance Sportive de Tunis"
        },
        "validity": {
          "valid_from": "2024-08-01T00:00:00Z",
          "valid_until": "2025-06-30T23:59:59Z",
          "timezone": "Africa/Tunis",
          "is_currently_valid": true
        },
        "usage": {
          "max_uses": null,
          "current_uses": 8,
          "remaining_uses": "unlimited",
          "last_used_at": "2024-03-15T20:00:00Z",
          "can_be_used": true
        },
        "subscription_benefits": {
          "priority_booking": true,
          "advance_booking_days": 7,
          "companion_access": true,
          "merchandising_discount": 20.0,
          "vip_events_invitation": true
        },
        "companion_rights": [
          {
            "id": "access-sub-est-ahmed-comp1",
            "qr_code": "SUB_EST_240001234_COMP1",
            "relationship": "COMPANION",
            "status": "ACTIVE"
          }
        ],
        "created_at": "2024-07-15T14:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 1247,
      "total_pages": 63,
      "has_next": true,
      "has_prev": false
    },
    "summary": {
      "total_rights": 1247,
      "by_type": {
        "TICKET": 1089,
        "SUBSCRIPTION": 145,
        "STAFF_ACCESS": 8,
        "VIP_ACCESS": 5
      },
      "by_status": {
        "ACTIVE": 1156,
        "USED": 78,
        "SUSPENDED": 8,
        "EXPIRED": 5
      },
      "anonymous_rights": 342
    }
  },
  "timestamp": "2024-03-20T16:45:00Z"
}
```

### POST /api/v1/access-rights
**Description** : Création manuelle d'un droit d'accès (admin/organisateur)

#### Request Body
```json
{
  "access_type": "STAFF_ACCESS",
  "user_id": "staff-member-001",
  "organizer_id": "est-tunis-official",
  "event_id": "derby-est-ca-2024",
  "venue_id": "stade-rades-tunis",
  "zone_id": "technical-areas",
  "validity": {
    "valid_from": "2024-04-15T15:00:00Z",
    "valid_until": "2024-04-16T02:00:00Z"
  },
  "usage": {
    "max_uses": null,
    "is_unlimited": true
  },
  "special_access": {
    "backstage_access": true,
    "technical_areas": true,
    "field_access": true
  },
  "security": {
    "security_level": "HIGH",
    "requires_id": true,
    "photo_verification": true
  },
  "permissions": [
    "FIELD_ACCESS",
    "TECHNICAL_ROOMS",
    "PLAYER_TUNNELS",
    "BROADCAST_AREAS"
  ],
  "notes": "Technicien son principal pour le derby",
  "emergency_contact": {
    "name": "Chef technique",
    "phone": "+216 71 123 999"
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "access_right": {
      "id": "access-staff-tech-001",
      "qr_code": "STAFF_DER240415_TECH001",
      "access_type": "STAFF_ACCESS",
      "status": "ACTIVE",
      "holder": {
        "user_id": "staff-member-001",
        "user_name": "Karim Ben Ahmed"
      },
      "validity": {
        "valid_from": "2024-04-15T15:00:00Z",
        "valid_until": "2024-04-16T02:00:00Z"
      },
      "permissions": [
        "FIELD_ACCESS",
        "TECHNICAL_ROOMS",
        "PLAYER_TUNNELS",
        "BROADCAST_AREAS"
      ],
      "qr_image_url": "https://api.entrix.tn/qr/STAFF_DER240415_TECH001.png",
      "created_at": "2024-03-20T17:00:00Z"
    }
  },
  "message": "Staff access right created successfully",
  "timestamp": "2024-03-20T17:00:00Z"
}
```

### GET /api/v1/access-rights/{id}
**Description** : Détails complets d'un droit d'accès

### PUT /api/v1/access-rights/{id}
**Description** : Mise à jour droit d'accès

### DELETE /api/v1/access-rights/{id}
**Description** : Révocation droit d'accès

### POST /api/v1/access-rights/{id}/suspend
**Description** : Suspension temporaire

#### Request Body
```json
{
  "reason": "Incident sécurité signalé",
  "suspended_until": "2024-04-20T23:59:59Z",
  "notify_holder": true,
  "security_flag": true
}
```

### POST /api/v1/access-rights/{id}/reactivate
**Description** : Réactivation après suspension

### GET /api/v1/access-rights/qr/{qr_code}
**Description** : Recherche droit d'accès par QR code

---

# API Validation temps réel

## ⚡ Ressource : `/api/v1/access-control/validate`

### POST /api/v1/access-control/validate
**Description** : **ENDPOINT CRITIQUE** - Validation temps réel d'un QR code à l'entrée

#### Request Body
```json
{
  "qr_code": "TKT_DER240315001",
  "venue_id": "stade-rades-tunis",
  "entry_point": "Entrée A",
  "zone_id": "tribune-est",
  "agent_id": "agent-security-001",
  "terminal_id": "TERMINAL_A_001",
  "scan_timestamp": "2024-04-15T19:45:00Z",
  "security_context": {
    "security_level": "STANDARD",
    "additional_checks": ["ID_VERIFICATION"],
    "crowd_status": "NORMAL",
    "weather_conditions": "CLEAR"
  },
  "geolocation": {
    "latitude": 36.7517,
    "longitude": 10.2817,
    "accuracy": 5
  },
  "device_info": {
    "device_type": "HANDHELD_SCANNER",
    "device_id": "HONEYWELL_001",
    "software_version": "2.1.5"
  }
}
```

#### Response 200 (Accès accordé)
```json
{
  "success": true,
  "data": {
    "result": "GRANTED",
    "access_granted": true,
    "validation_id": "validation-20240415-194500-001",
    "access_right": {
      "id": "access-derby-ahmed-001",
      "qr_code": "TKT_DER240315001",
      "access_type": "TICKET",
      "holder_name": "Ahmed Ben Ali"
    },
    "event": {
      "id": "derby-est-ca-2024",
      "name": "Derby EST vs Club Africain",
      "scheduled_start": "2024-04-15T20:00:00Z"
    },
    "seating": {
      "zone_name": "Tribune Est",
      "section": "A",
      "row": "15",
      "seat": "23",
      "display": "A15-23"
    },
    "usage_info": {
      "uses_before": 0,
      "uses_after": 1,
      "remaining_uses": 0,
      "max_uses": 1
    },
    "access_instructions": [
      "Dirigez-vous vers la Tribune Est",
      "Section A, Rangée 15, Siège 23",
      "Suivez les panneaux jaunes"
    ],
    "special_services": [
      "Toilettes accessibles niveau 1",
      "Buvette Tribune Est ouverte",
      "Sortie urgence : Porte A-Emergency"
    ],
    "warnings": [],
    "security_notes": [
      "Contrôle visuel effectué",
      "Correspondance identité confirmée"
    ],
    "validation_time_ms": 147,
    "next_scan_earliest": "2024-04-15T22:00:00Z"
  },
  "timestamp": "2024-04-15T19:45:00Z"
}
```

#### Response 200 (Accès refusé)
```json
{
  "success": true,
  "data": {
    "result": "DENIED",
    "access_granted": false,
    "validation_id": "validation-20240415-194501-002",
    "denial_reason": "ALREADY_USED",
    "denial_details": {
      "primary_reason": "Ce billet a déjà été utilisé",
      "technical_reason": "current_uses (1) >= max_uses (1)",
      "last_usage": {
        "timestamp": "2024-04-15T19:30:00Z",
        "entry_point": "Entrée B",
        "agent": "Agent Sécurité 002"
      }
    },
    "access_right": {
      "id": "access-derby-ahmed-001",
      "qr_code": "TKT_DER240315001",
      "access_type": "TICKET",
      "status": "USED"
    },
    "suggested_actions": [
      "Vérifier si la personne est déjà entrée",
      "Contacter superviseur si contestation",
      "Proposer rachat billet si disponible"
    ],
    "contact_info": {
      "supervisor_phone": "+216 71 123 999",
      "customer_service": "support@entrix.tn"
    },
    "validation_time_ms": 89
  },
  "timestamp": "2024-04-15T19:45:01Z"
}
```

#### Response 200 (Accès conditionnel)
```json
{
  "success": true,
  "data": {
    "result": "CONDITIONAL",
    "access_granted": true,
    "conditions": [
      {
        "type": "ID_VERIFICATION",
        "description": "Vérification pièce d'identité requise",
        "is_mandatory": true
      },
      {
        "type": "SECURITY_CHECK", 
        "description": "Fouille de sécurité obligatoire",
        "is_mandatory": true
      }
    ],
    "access_right": {
      "id": "access-vip-special-001",
      "access_type": "VIP_ACCESS",
      "holder_name": "Personnalité VIP"
    },
    "special_instructions": [
      "Escorte sécurité requise",
      "Accès par entrée VIP uniquement",
      "Notification superviseur automatique"
    ],
    "validation_time_ms": 234
  },
  "timestamp": "2024-04-15T19:45:01Z"
}
```

### POST /api/v1/access-control/validate/bulk
**Description** : Validation en lot pour terminaux automatiques

#### Request Body
```json
{
  "venue_id": "stade-rades-tunis",
  "entry_point": "Entrée Automatique C",
  "terminal_id": "AUTO_TERMINAL_C_001",
  "validations": [
    {
      "qr_code": "TKT_DER240315001",
      "scan_timestamp": "2024-04-15T19:45:00Z"
    },
    {
      "qr_code": "TKT_DER240315002", 
      "scan_timestamp": "2024-04-15T19:45:01Z"
    },
    {
      "qr_code": "SUB_EST_240001234_MAIN",
      "scan_timestamp": "2024-04-15T19:45:02Z"
    }
  ]
}
```

### GET /api/v1/access-control/validate/status
**Description** : Statut des terminaux de validation

---

# API Logs et traçabilité

## 📋 Ressource : `/api/v1/access-control/logs`

### GET /api/v1/access-control/logs
**Description** : Historique des contrôles d'accès avec filtres

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `access_right_id` | uuid | - | Logs d'un droit spécifique |
| `event_id` | uuid | - | Logs d'un événement |
| `venue_id` | string | - | Logs d'un lieu |
| `entry_point` | string | - | Logs d'un point d'entrée |
| `agent_id` | uuid | - | Logs d'un agent |
| `result` | enum | - | Résultat contrôle |
| `date_from` | datetime | - | Depuis cette date/heure |
| `date_to` | datetime | - | Jusqu'à cette date/heure |
| `security_level` | enum | - | Niveau de sécurité |
| `include_denied` | boolean | true | Inclure accès refusés |
| `include_granted` | boolean | true | Inclure accès accordés |
| `limit` | integer | 100 | Limite résultats |

#### Response 200
```json
{
  "success": true,
  "data": {
    "access_logs": [
      {
        "id": "log-20240415-194500-001",
        "access_right": {
          "id": "access-derby-ahmed-001",
          "qr_code": "TKT_DER240315001",
          "access_type": "TICKET",
          "holder_name": "Ahmed Ben Ali"
        },
        "control_details": {
          "venue_id": "stade-rades-tunis",
          "venue_name": "Stade Olympique de Radès",
          "entry_point": "Entrée A",
          "zone_id": "tribune-est",
          "zone_name": "Tribune Est"
        },
        "validation": {
          "result": "GRANTED",
          "control_type": "ENTRY",
          "security_level": "STANDARD",
          "validation_time_ms": 147,
          "additional_checks": ["VISUAL_ID"]
        },
        "agent": {
          "id": "agent-security-001",
          "name": "Sami Contrôleur",
          "badge_number": "SEC001"
        },
        "device": {
          "terminal_id": "TERMINAL_A_001",
          "device_type": "HANDHELD_SCANNER",
          "device_id": "HONEYWELL_001"
        },
        "geolocation": {
          "latitude": 36.7517,
          "longitude": 10.2817,
          "accuracy": 5
        },
        "context": {
          "crowd_status": "NORMAL",
          "weather": "CLEAR",
          "special_conditions": null
        },
        "timing": {
          "scan_timestamp": "2024-04-15T19:45:00Z",
          "validation_duration": "147ms",
          "queue_time": "2.5s"
        },
        "security_notes": [
          "Contrôle visuel effectué",
          "Correspondance identité confirmée",
          "Pas d'anomalie détectée"
        ],
        "created_at": "2024-04-15T19:45:00Z"
      },
      {
        "id": "log-20240415-194501-002",
        "access_right": {
          "id": "access-derby-fraudulent-001",
          "qr_code": "FAKE_CODE_123",
          "access_type": "UNKNOWN",
          "holder_name": "Inconnu"
        },
        "control_details": {
          "venue_id": "stade-rades-tunis",
          "entry_point": "Entrée A"
        },
        "validation": {
          "result": "DENIED",
          "control_type": "ENTRY",
          "security_level": "STANDARD",
          "failure_reason": "INVALID_QR",
          "validation_time_ms": 89
        },
        "denial_details": {
          "primary_reason": "QR code non reconnu dans le système",
          "technical_reason": "QR code not found in access_rights table",
          "fraud_suspected": true,
          "security_alert_triggered": true
        },
        "agent": {
          "id": "agent-security-001",
          "name": "Sami Contrôleur"
        },
        "security_actions": [
          "Alerte sécurité automatique",
          "Photo prise automatiquement",
          "Superviseur notifié"
        ],
        "photo_evidence": {
          "photo_taken": true,
          "photo_url": "https://security.entrix.tn/evidence/20240415-194501-002.jpg"
        },
        "created_at": "2024-04-15T19:45:01Z"
      }
    ],
    "summary": {
      "total_logs": 1247,
      "granted": 1198,
      "denied": 49,
      "grant_rate": 96.1,
      "avg_validation_time": 156,
      "security_incidents": 3
    }
  },
  "timestamp": "2024-04-15T19:50:00Z"
}
```

### GET /api/v1/access-control/logs/{id}
**Description** : Détails complets d'un log spécifique

### GET /api/v1/access-control/logs/export
**Description** : Export logs pour audit/compliance

#### Response (CSV Export)
```csv
timestamp,qr_code,holder_name,access_type,result,entry_point,agent,validation_time_ms,notes
2024-04-15T19:45:00Z,TKT_DER240315001,Ahmed Ben Ali,TICKET,GRANTED,Entrée A,Sami Contrôleur,147,Contrôle standard
2024-04-15T19:45:01Z,FAKE_CODE_123,Inconnu,UNKNOWN,DENIED,Entrée A,Sami Contrôleur,89,QR code frauduleux
```

---

# API Transferts et transactions

## 🔄 Ressource : `/api/v1/access-rights/{id}/transfers`

### POST /api/v1/access-rights/{id}/transfer
**Description** : Transfert d'un droit d'accès vers un autre utilisateur

#### Request Body
```json
{
  "transfer_to": {
    "user_id": "user-salma-ben-salem",
    "email": "salma.bensalem@gmail.com"
  },
  "transfer_reason": "Cadeau pour anniversaire",
  "transfer_message": "Joyeux anniversaire ! J'espère que tu vas adorer ce match.",
  "accept_transfer_fee": true,
  "notify_recipient": true,
  "require_acceptance": true,
  "transfer_conditions": {
    "expires_if_not_accepted": "2024-04-10T23:59:59Z",
    "partial_transfer": false,
    "maintain_original_restrictions": true
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "transfer": {
      "id": "transfer-20240320-001",
      "access_right_id": "access-derby-ahmed-001",
      "from_user": {
        "id": "user-ahmed-ben-ali",
        "name": "Ahmed Ben Ali"
      },
      "to_user": {
        "id": "user-salma-ben-salem",
        "name": "Salma Ben Salem"
      },
      "status": "PENDING_ACCEPTANCE",
      "transfer_fee": 5.00,
      "currency": "TND",
      "expires_at": "2024-04-10T23:59:59Z",
      "acceptance_url": "https://entrix.tn/transfer/accept/transfer-20240320-001",
      "notifications_sent": {
        "email": true,
        "sms": false,
        "push": true
      },
      "estimated_completion": "2024-03-21T17:00:00Z"
    }
  },
  "message": "Transfer initiated successfully. Recipient will be notified.",
  "timestamp": "2024-03-20T17:00:00Z"
}
```

### GET /api/v1/access-rights/{id}/transfers
**Description** : Historique des transferts d'un droit d'accès

### POST /api/v1/transfers/{transfer_id}/accept
**Description** : Acceptation d'un transfert par le destinataire

### POST /api/v1/transfers/{transfer_id}/decline
**Description** : Refus d'un transfert

### GET /api/v1/access-transactions-log
**Description** : Journal complet des transactions sur droits d'accès

#### Response 200
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn-20240320-001",
        "access_right_id": "access-derby-ahmed-001",
        "transaction_type": "TRANSFER",
        "from_user": {
          "id": "user-ahmed-ben-ali",
          "name": "Ahmed Ben Ali"
        },
        "to_user": {
          "id": "user-salma-ben-salem",
          "name": "Salma Ben Salem"
        },
        "initiated_by": {
          "id": "user-ahmed-ben-ali",
          "name": "Ahmed Ben Ali"
        },
        "organizer": {
          "id": "ligue-pro-tunisie",
          "name": "Ligue Professionnelle Tunisienne"
        },
        "financial": {
          "amount": 85.00,
          "currency": "TND",
          "fee_amount": 5.00
        },
        "status": "COMPLETED",
        "reason": "Cadeau pour anniversaire",
        "previous_values": {
          "user_id": "user-ahmed-ben-ali",
          "transfer_count": 0
        },
        "new_values": {
          "user_id": "user-salma-ben-salem",
          "transfer_count": 1
        },
        "approval_required": false,
        "processed_at": "2024-03-20T17:15:00Z",
        "metadata": {
          "transfer_message": "Joyeux anniversaire !",
          "acceptance_method": "EMAIL_LINK",
          "acceptance_ip": "196.203.45.123"
        },
        "created_at": "2024-03-20T17:00:00Z"
      }
    ]
  }
}
```

---

# API Sécurité et anti-fraude

## 🛡️ Ressource : `/api/v1/security/access-control`

### GET /api/v1/security/access-control/blacklist
**Description** : Liste noire pour contrôle d'accès

#### Response 200
```json
{
  "success": true,
  "data": {
    "blacklist_entries": [
      {
        "id": "blacklist-001",
        "type": "USER",
        "value": "user-problematic-001",
        "scope": "GLOBAL",
        "organizer_id": null,
        "reason": "Comportement violent répété",
        "severity": "HIGH",
        "active_from": "2024-03-01T00:00:00Z",
        "active_until": "2024-12-31T23:59:59Z",
        "created_by": "security-admin-001",
        "evidence": [
          "Rapport sécurité incident #1234",
          "Témoignages multiples",
          "Vidéosurveillance disponible"
        ],
        "appeal_process": {
          "can_appeal": true,
          "appeal_deadline": "2024-06-01T23:59:59Z",
          "appeal_contact": "appeals@entrix.tn"
        },
        "is_active": true,
        "created_at": "2024-03-01T10:00:00Z"
      },
      {
        "id": "blacklist-002",
        "type": "QR_CODE_PATTERN",
        "value": "FAKE_*",
        "scope": "GLOBAL",
        "reason": "Pattern QR codes frauduleux détecté",
        "severity": "CRITICAL",
        "automatic_detection": true,
        "detection_algorithm": "ML_FRAUD_DETECTION_V2",
        "confidence_score": 98.7,
        "created_at": "2024-03-15T14:23:00Z"
      }
    ]
  }
}
```

### POST /api/v1/security/access-control/blacklist
**Description** : Ajout à la liste noire

### POST /api/v1/security/access-control/fraud-report
**Description** : Signalement de fraude suspectée

#### Request Body
```json
{
  "qr_code": "SUSPICIOUS_CODE_789",
  "access_right_id": "access-suspicious-001",
  "reporter": {
    "agent_id": "agent-security-002",
    "venue_id": "stade-rades-tunis",
    "entry_point": "Entrée B"
  },
  "fraud_indicators": [
    "QR code format inhabituel",
    "Comportement suspect du porteur",
    "Multiple tentatives d'accès"
  ],
  "evidence": {
    "photos": ["evidence-001.jpg", "evidence-002.jpg"],
    "witness_statements": ["Agent sécurité a observé comportement suspect"],
    "technical_data": {
      "scan_anomalies": true,
      "validation_errors": 3,
      "ip_address": "192.168.1.50"
    }
  },
  "severity": "HIGH",
  "immediate_action_taken": "Accès refusé et personne escortée vers sortie",
  "followup_required": true
}
```

### GET /api/v1/security/access-control/anomalies
**Description** : Détection d'anomalies temps réel

#### Response 200
```json
{
  "success": true,
  "data": {
    "real_time_anomalies": [
      {
        "id": "anomaly-20240415-001",
        "type": "MULTIPLE_RAPID_SCANS",
        "severity": "MEDIUM",
        "description": "Même QR code scanné 5 fois en 2 minutes",
        "qr_code": "TKT_DER240315003",
        "access_right_id": "access-derby-suspect-001",
        "detection_time": "2024-04-15T19:47:00Z",
        "locations": [
          {"entry_point": "Entrée A", "timestamp": "2024-04-15T19:45:00Z"},
          {"entry_point": "Entrée B", "timestamp": "2024-04-15T19:45:30Z"},
          {"entry_point": "Entrée C", "timestamp": "2024-04-15T19:46:00Z"}
        ],
        "risk_score": 75,
        "recommended_actions": [
          "Bloquer temporairement le QR code",
          "Alerter superviseurs de sécurité",
          "Vérifier identité si nouvelle tentative"
        ],
        "auto_actions_taken": [
          "QR code marqué suspect",
          "Alertes sécurité envoyées"
        ]
      }
    ],
    "ai_insights": {
      "fraud_probability": 23.4,
      "crowd_behavior": "NORMAL",
      "peak_load_predicted": "20:15:00Z",
      "security_risk_level": "LOW"
    }
  }
}
```

---

# API Analytics temps réel

## 📊 Ressource : `/api/v1/analytics/access-control`

### GET /api/v1/analytics/access-control/real-time
**Description** : Dashboard temps réel du contrôle d'accès

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `venue_id` | string | - | Analytiques d'un lieu |
| `event_id` | uuid | - | Analytiques d'un événement |
| `organizer_id` | uuid | - | Analytiques d'un organisateur |
| `time_window` | string | `15m` | Fenêtre temporelle (5m, 15m, 1h, 4h) |

#### Response 200
```json
{
  "success": true,
  "data": {
    "real_time_metrics": {
      "timestamp": "2024-04-15T19:50:00Z",
      "venue": {
        "id": "stade-rades-tunis",
        "name": "Stade Olympique de Radès",
        "capacity": 60000,
        "current_occupancy": 47500,
        "occupancy_rate": 79.2
      },
      "access_flow": {
        "entries_last_15min": 1247,
        "entries_per_minute_avg": 83,
        "exits_last_15min": 23,
        "peak_entry_rate": 156,
        "peak_time": "19:45:00Z"
      },
      "validation_performance": {
        "total_validations": 48750,
        "successful_validations": 47523,
        "denied_validations": 1227,
        "success_rate": 97.5,
        "avg_validation_time": 156,
        "p95_validation_time": 340,
        "p99_validation_time": 890
      },
      "entry_points": [
        {
          "entry_point": "Entrée A",
          "status": "OPERATIONAL",
          "queue_length": 45,
          "avg_wait_time": 3.2,
          "throughput_per_minute": 28,
          "last_updated": "2024-04-15T19:49:30Z"
        },
        {
          "entry_point": "Entrée B",
          "status": "OPERATIONAL",
          "queue_length": 67,
          "avg_wait_time": 4.8,
          "throughput_per_minute": 22,
          "last_updated": "2024-04-15T19:49:45Z"
        },
        {
          "entry_point": "Entrée VIP",
          "status": "OPERATIONAL",
          "queue_length": 8,
          "avg_wait_time": 1.1,
          "throughput_per_minute": 12,
          "last_updated": "2024-04-15T19:49:50Z"
        }
      ],
      "access_types_breakdown": {
        "TICKET": {
          "count": 45623,
          "percentage": 93.6,
          "avg_validation_time": 145
        },
        "SUBSCRIPTION": {
          "count": 2341,
          "percentage": 4.8,
          "avg_validation_time": 189
        },
        "STAFF_ACCESS": {
          "count": 456,
          "percentage": 0.9,
          "avg_validation_time": 234
        },
        "VIP_ACCESS": {
          "count": 330,
          "percentage": 0.7,
          "avg_validation_time": 287
        }
      },
      "security_status": {
        "security_level": "STANDARD",
        "incidents_active": 0,
        "fraud_attempts": 12,
        "blacklist_hits": 3,
        "anomalies_detected": 1
      },
      "predictive_insights": {
        "estimated_peak_time": "20:15:00Z",
        "estimated_peak_load": 245,
        "bottleneck_prediction": "Entrée B",
        "recommended_actions": [
          "Ouvrir Entrée D supplémentaire",
          "Augmenter personnel Entrée B",
          "Activer voies rapides abonnés"
        ]
      }
    },
    "historical_comparison": {
      "vs_same_time_last_week": {
        "entries": "+15%",
        "validation_time": "-8%",
        "incidents": "-50%"
      },
      "vs_similar_events": {
        "entries": "+12%",
        "success_rate": "+2.1%",
        "peak_load": "+23%"
      }
    }
  },
  "timestamp": "2024-04-15T19:50:00Z"
}
```

### GET /api/v1/analytics/access-control/heatmap
**Description** : Heatmap des flux d'accès

### GET /api/v1/analytics/access-control/performance
**Description** : Analytics performance système

#### Response 200
```json
{
  "success": true,
  "data": {
    "performance_metrics": {
      "system_performance": {
        "api_response_time": {
          "avg": 156,
          "p50": 145,
          "p95": 340,
          "p99": 890,
          "unit": "milliseconds"
        },
        "database_performance": {
          "query_time_avg": 23,
          "connection_pool_usage": 67,
          "active_connections": 45,
          "max_connections": 100
        },
        "cache_performance": {
          "hit_rate": 94.7,
          "miss_rate": 5.3,
          "cache_size": "2.4GB",
          "eviction_rate": 0.8
        }
      },
      "validation_efficiency": {
        "validations_per_second": 890,
        "peak_validations_per_second": 1245,
        "concurrent_validations": 67,
        "queue_depth": 12,
        "processing_rate": 98.9
      },
      "error_rates": {
        "total_errors": 23,
        "error_rate": 0.047,
        "by_type": {
          "TIMEOUT": 12,
          "DATABASE_ERROR": 6,
          "VALIDATION_ERROR": 3,
          "NETWORK_ERROR": 2
        }
      },
      "scalability_metrics": {
        "current_load": 67,
        "capacity_utilization": 78,
        "auto_scaling_triggered": false,
        "additional_capacity_available": true
      }
    }
  }
}
```

---

# API Monitoring et alertes

## 🚨 Ressource : `/api/v1/monitoring/access-control`

### GET /api/v1/monitoring/access-control/alerts
**Description** : Alertes actives du système de contrôle d'accès

#### Response 200
```json
{
  "success": true,
  "data": {
    "active_alerts": [
      {
        "id": "alert-20240415-001",
        "type": "HIGH_QUEUE_TIME",
        "severity": "MEDIUM",
        "title": "Temps d'attente élevé - Entrée B",
        "description": "Temps d'attente moyen dépasse 5 minutes depuis 10 minutes",
        "venue_id": "stade-rades-tunis",
        "entry_point": "Entrée B",
        "metrics": {
          "current_wait_time": 6.2,
          "threshold": 5.0,
          "queue_length": 89,
          "trend": "INCREASING"
        },
        "recommendations": [
          "Ouvrir voie supplémentaire",
          "Déployer agent additionnel",
          "Activer mode validation rapide"
        ],
        "auto_actions_taken": [
          "Notification superviseur",
          "Affichage temps attente mis à jour"
        ],
        "triggered_at": "2024-04-15T19:40:00Z",
        "escalation_level": 1
      },
      {
        "id": "alert-20240415-002",
        "type": "FRAUD_DETECTION",
        "severity": "HIGH",
        "title": "Tentatives de fraude détectées",
        "description": "5 QR codes invalides tentés en 3 minutes",
        "venue_id": "stade-rades-tunis",
        "entry_point": "Entrée A",
        "security_context": {
          "fraud_attempts": 5,
          "pattern_detected": "SYSTEMATIC_INVALID_QR",
          "risk_score": 87,
          "confidence": 94.2
        },
        "evidence": {
          "suspicious_qr_codes": [
            "FAKE_001", "FAKE_002", "FAKE_003"
          ],
          "common_characteristics": "Même format, séquence numérique",
          "ip_addresses": ["192.168.1.45", "192.168.1.46"]
        },
        "immediate_actions": [
          "Alerte sécurité envoyée",
          "Superviseur notifié",
          "Patterns blacklistés automatiquement"
        ],
        "triggered_at": "2024-04-15T19:43:00Z",
        "escalation_level": 2
      }
    ],
    "alert_summary": {
      "total_active": 2,
      "by_severity": {
        "CRITICAL": 0,
        "HIGH": 1,
        "MEDIUM": 1,
        "LOW": 0
      },
      "by_type": {
        "PERFORMANCE": 1,
        "SECURITY": 1,
        "SYSTEM": 0
      },
      "avg_resolution_time": "4.2 minutes"
    }
  }
}
```

### POST /api/v1/monitoring/access-control/alerts/{id}/acknowledge
**Description** : Accusé réception d'une alerte

### POST /api/v1/monitoring/access-control/alerts/{id}/resolve
**Description** : Résolution d'une alerte

### GET /api/v1/monitoring/access-control/health
**Description** : Santé générale du système

#### Response 200
```json
{
  "success": true,
  "data": {
    "system_health": {
      "overall_status": "HEALTHY",
      "score": 97.3,
      "components": {
        "validation_service": {
          "status": "HEALTHY",
          "uptime": "99.98%",
          "response_time": 156,
          "error_rate": 0.02
        },
        "database": {
          "status": "HEALTHY",
          "connection_pool": "OPTIMAL",
          "query_performance": "GOOD",
          "replication_lag": 23
        },
        "cache_layer": {
          "status": "HEALTHY",
          "hit_rate": 94.7,
          "memory_usage": 78,
          "eviction_rate": 0.8
        },
        "security_engine": {
          "status": "HEALTHY",
          "fraud_detection": "ACTIVE",
          "blacklist_updated": "2024-04-15T19:30:00Z",
          "anomaly_detection": "ACTIVE"
        }
      },
      "capacity": {
        "current_load": 67,
        "max_sustainable": 95,
        "peak_capacity": 120,
        "auto_scaling": "AVAILABLE"
      },
      "sla_metrics": {
        "availability": 99.98,
        "performance": 97.5,
        "reliability": 98.9,
        "security": 99.1
      }
    }
  }
}
```

---

# Codes d'erreur

## 🚨 Codes d'erreur spécifiques au module

| Code | Message | Description |
|------|---------|-------------|
| `ACCESS_RIGHT_NOT_FOUND` | Access right not found | Droit d'accès inexistant |
| `QR_CODE_INVALID` | QR code is invalid | Format QR code invalide |
| `QR_CODE_NOT_FOUND` | QR code not found | QR code non reconnu |
| `ACCESS_EXPIRED` | Access has expired | Droit d'accès expiré |
| `ACCESS_NOT_YET_VALID` | Access not yet valid | Accès pas encore valide |
| `ACCESS_ALREADY_USED` | Access already used | Déjà utilisé complètement |
| `ACCESS_SUSPENDED` | Access is suspended | Accès suspendu |
| `ACCESS_REVOKED` | Access has been revoked | Accès révoqué |
| `WRONG_VENUE` | Wrong venue for this access | Mauvais lieu pour cet accès |
| `WRONG_EVENT` | Wrong event for this access | Mauvais événement |
| `WRONG_ZONE` | Wrong zone for this access | Mauvaise zone d'accès |
| `BLACKLISTED` | User or code is blacklisted | Utilisateur/code blacklisté |
| `FRAUD_SUSPECTED` | Fraud suspected | Fraude suspectée |
| `SECURITY_FLAG` | Security flag raised | Alerte sécurité déclenchée |
| `TRANSFER_NOT_ALLOWED` | Transfer not allowed | Transfert non autorisé |
| `TRANSFER_LIMIT_EXCEEDED` | Transfer limit exceeded | Limite transferts dépassée |
| `VALIDATION_TIMEOUT` | Validation timeout | Délai validation dépassé |
| `TERMINAL_OFFLINE` | Terminal is offline | Terminal hors ligne |
| `AGENT_NOT_AUTHORIZED` | Agent not authorized | Agent non autorisé |
| `INSUFFICIENT_SECURITY_LEVEL` | Insufficient security level | Niveau sécurité insuffisant |

## 📋 Structure d'erreur standard avec contexte

```json
{
  "success": false,
  "error": {
    "code": "ACCESS_ALREADY_USED",
    "message": "This access right has already been used",
    "details": {
      "access_right_id": "access-derby-ahmed-001",
      "qr_code": "TKT_DER240315001",
      "current_uses": 1,
      "max_uses": 1,
      "last_used_at": "2024-04-15T19:30:00Z",
      "last_used_location": "Entrée B"
    },
    "suggested_actions": [
      "Verify if person already entered",
      "Contact supervisor if disputed",
      "Offer ticket purchase if available"
    ],
    "support_info": {
      "incident_id": "INC-20240415-001",
      "contact": "support@entrix.tn",
      "escalation": "+216 71 123 999"
    }
  },
  "timestamp": "2024-04-15T19:45:01Z"
}
```

---

# Exemples d'usage

## 🎯 Cas d'usage typiques

### 1. Validation temps réel à l'entrée (cas normal)

```bash
# Validation QR code standard
curl -X POST "https://api.entrix.tn/v1/access-control/validate" \
  -H "Content-Type: application/json" \
  -H "X-Agent-ID: agent-security-001" \
  -H "X-Venue-ID: stade-rades-tunis" \
  -d '{
    "qr_code": "TKT_DER240315001",
    "venue_id": "stade-rades-tunis",
    "entry_point": "Entrée A",
    "zone_id": "tribune-est",
    "agent_id": "agent-security-001",
    "security_context": {
      "security_level": "STANDARD",
      "crowd_status": "NORMAL"
    }
  }'

# Réponse : GRANTED avec instructions d'accès
```

### 2. Gestion d'incident sécurité

```bash
# Validation QR suspect
curl -X POST "https://api.entrix.tn/v1/access-control/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "qr_code": "SUSPICIOUS_CODE_123",
    "venue_id": "stade-rades-tunis",
    "entry_point": "Entrée A",
    "agent_id": "agent-security-001"
  }'

# Réponse : DENIED avec alerte sécurité

# Signalement fraude
curl -X POST "https://api.entrix.tn/v1/security/access-control/fraud-report" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "qr_code": "SUSPICIOUS_CODE_123",
    "reporter": {
      "agent_id": "agent-security-001",
      "venue_id": "stade-rades-tunis"
    },
    "fraud_indicators": [
      "QR code format inhabituel",
      "Comportement suspect"
    ],
    "severity": "HIGH"
  }'
```

### 3. Transfert de billet avec workflow complet

```bash
# 1. Initier transfert
TRANSFER_ID=$(curl -X POST "https://api.entrix.tn/v1/access-rights/access-derby-ahmed-001/transfer" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "transfer_to": {
      "user_id": "user-salma-ben-salem"
    },
    "transfer_reason": "Cadeau anniversaire",
    "notify_recipient": true,
    "require_acceptance": true
  }' | jq -r '.data.transfer.id')

# 2. Acceptation par destinataire
curl -X POST "https://api.entrix.tn/v1/transfers/$TRANSFER_ID/accept" \
  -H "Authorization: Bearer $RECIPIENT_TOKEN" \
  -d '{
    "acceptance_terms": true,
    "notification_preferences": {
      "email": true,
      "sms": true
    }
  }'

# 3. Vérification transfert réussi
curl -G "https://api.entrix.tn/v1/access-rights/access-derby-ahmed-001" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Monitoring temps réel événement

```bash
# Dashboard temps réel
curl -G "https://api.entrix.tn/v1/analytics/access-control/real-time" \
  -H "Authorization: Bearer $TOKEN" \
  -d "venue_id=stade-rades-tunis" \
  -d "event_id=derby-est-ca-2024" \
  -d "time_window=15m"

# Alertes actives
curl -G "https://api.entrix.tn/v1/monitoring/access-control/alerts" \
  -H "Authorization: Bearer $TOKEN" \
  -d "venue_id=stade-rades-tunis"

# Santé système
curl -G "https://api.entrix.tn/v1/monitoring/access-control/health" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Gestion droits d'accès staff

```bash
# Création accès staff technique
curl -X POST "https://api.entrix.tn/v1/access-rights" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organizer-ID: $ORGANIZER_ID" \
  -d '{
    "access_type": "TECHNICAL_ACCESS",
    "user_id": "tech-staff-001",
    "event_id": "derby-est-ca-2024",
    "venue_id": "stade-rades-tunis",
    "validity": {
      "valid_from": "2024-04-15T15:00:00Z",
      "valid_until": "2024-04-16T02:00:00Z"
    },
    "special_access": {
      "backstage_access": true,
      "technical_areas": true,
      "field_access": true
    },
    "security": {
      "security_level": "HIGH",
      "requires_id": true
    }
  }'

# Suspension temporaire en cas de problème
curl -X POST "https://api.entrix.tn/v1/access-rights/access-staff-tech-001/suspend" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reason": "Incident sécurité signalé",
    "suspended_until": "2024-04-20T23:59:59Z",
    "security_flag": true
  }'
```

### 6. Analytics et audit trails

```bash
# Export logs pour audit
curl -G "https://api.entrix.tn/v1/access-control/logs/export" \
  -H "Authorization: Bearer $TOKEN" \
  -d "event_id=derby-est-ca-2024" \
  -d "date_from=2024-04-15T18:00:00Z" \
  -d "date_to=2024-04-16T02:00:00Z" \
  -d "format=csv" \
  > audit_derby_access_logs.csv

# Analytics performance par point d'entrée
curl -G "https://api.entrix.tn/v1/analytics/access-control/performance" \
  -H "Authorization: Bearer $TOKEN" \
  -d "venue_id=stade-rades-tunis" \
  -d "breakdown=entry_point"

# Détection anomalies
curl -G "https://api.entrix.tn/v1/security/access-control/anomalies" \
  -H "Authorization: Bearer $TOKEN" \
  -d "venue_id=stade-rades-tunis" \
  -d "time_window=1h"
```

### 7. Validation en lot pour terminaux automatiques

```bash
# Validation multiple pour borne automatique
curl -X POST "https://api.entrix.tn/v1/access-control/validate/bulk" \
  -H "Content-Type: application/json" \
  -H "X-Terminal-ID: AUTO_TERMINAL_C_001" \
  -d '{
    "venue_id": "stade-rades-tunis",
    "entry_point": "Entrée Automatique C",
    "terminal_id": "AUTO_TERMINAL_C_001",
    "validations": [
      {
        "qr_code": "TKT_DER240315001",
        "scan_timestamp": "2024-04-15T19:45:00Z"
      },
      {
        "qr_code": "SUB_EST_240001234_MAIN",
        "scan_timestamp": "2024-04-15T19:45:01Z"
      }
    ]
  }'

# Statut des terminaux
curl -G "https://api.entrix.tn/v1/access-control/validate/status" \
  -H "Authorization: Bearer $TOKEN" \
  -d "venue_id=stade-rades-tunis"
```

---

## 📝 Notes importantes

### Performance et scalabilité
- **Sub-seconde** : Validation < 200ms même avec 50k+ accès simultanés
- **Cache intelligent** : QR codes fréquents mis en cache pour performance optimale
- **Auto-scaling** : Montée en charge automatique lors des pics
- **Réplication** : Base de données répliquée pour haute disponibilité

### Sécurité multicouches
- **Anti-fraude ML** : Détection automatique patterns suspects
- **Blacklist temps réel** : Blocage immédiat utilisateurs/codes problématiques
- **Audit complet** : Traçabilité absolue de chaque scan physique
- **Chiffrement** : Données sensibles chiffrées en transit et au repos

### Support anonyme natif
- **Validation sans user_id** : Accès fonctionnels même pour achats anonymes
- **QR codes auto-suffisants** : Toutes infos nécessaires dans le code
- **Migration transparente** : Transfert automatique lors création compte

### Intégration ecosystem
- **Generation automatique** : QR créés automatiquement après validation paiement
- **Synchronisation** : Mise à jour temps réel avec billetterie et événements
- **APIs ouvertes** : Intégration facile avec systèmes tiers

---

**Version API** : v1.0  
**Dernière mise à jour** : 20 Mars 2024  
**Auteur** : Équipe Entrix Development