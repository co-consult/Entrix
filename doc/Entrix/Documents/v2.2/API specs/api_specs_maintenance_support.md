# API Specifications - Module Maintenance et Support
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Système de tickets](#api-système-de-tickets)
4. [API Chatbot IA hybride](#api-chatbot-ia-hybride)
5. [API Agents et escalade](#api-agents-et-escalade)
6. [API Health monitoring](#api-health-monitoring)
7. [API Maintenance prédictive](#api-maintenance-prédictive)
8. [API Knowledge base](#api-knowledge-base)
9. [API SLA et métriques](#api-sla-et-métriques)
10. [API Analytics support](#api-analytics-support)
11. [API Administration support](#api-administration-support)
12. [Codes d'erreur](#codes-derreur)
13. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Maintenance et Support** assure l'**excellence opérationnelle** d'Entrix V3.0 avec une **maintenance proactive**, un **support client multicanal de qualité** et une **disponibilité maximale** de la plateforme. Il garantit une **expérience utilisateur continue** et une **résolution rapide** de tous les incidents.

## 🏗️ Architecture Support Hybride V3.0

### **Écosystème support intelligent**
```
Contact → Chatbot IA → Escalade → Agent Expert → Résolution → Feedback → Amélioration
```

### **Innovations révolutionnaires V3.0**
- **🤖 Support IA hybride** : Chatbot intelligent + agents humains experts
- **⚡ Maintenance prédictive** : Machine learning pour anticipation pannes
- **📱 Support omnicanal** : Web, mobile, phone, WhatsApp, email unifié
- **🔧 Auto-réparation** : Systèmes auto-diagnostiques et correctifs automatiques
- **📊 SLA intelligents** : Contrats de service adaptatifs selon criticité
- **🎯 Attribution intelligente** : Routing automatique selon expertise
- **📈 Amélioration continue** : ML sur satisfaction et optimisation processus

### **Types de support offerts**
- **🤖 Support Automatisé** : FAQ intelligente, résolution self-service
- **💬 Support Chat** : Chatbot + agents temps réel via web/mobile
- **📞 Support Téléphone** : Centre d'appels avec expertise technique
- **📧 Support Email** : Tickets asynchrones avec SLA garantis
- **📲 Support WhatsApp** : Messaging intégré pour utilisateurs mobiles
- **🛠️ Support Technique** : Expertise développement et intégrations
- **🚨 Support Urgence** : Escalade 24/7 pour incidents critiques

### **Architecture technique**
- **Chatbot NLP** : Traitement langage naturel avec intent recognition
- **Ticket System** : Workflow complet avec attribution automatique
- **Knowledge Base** : Base connaissances collaborative auto-apprenante
- **Monitoring Stack** : Health checks, alertes, maintenance prédictive
- **Analytics Engine** : Métriques satisfaction, optimisation processus
- **Integration Hub** : Connexions CRM, notification, analytics

## 🔗 Relations avec autres modules
- **Utilisateurs** : Support personnalisé, historique interactions
- **Événements** : Assistance événements, résolution problèmes live
- **Commandes** : Support facturation, remboursements, modifications
- **Analytics** : Métriques satisfaction, performance agents
- **Notifications** : Alertes incidents, communications support
- **Sécurité** : Escalade incidents sécurité, audit actions support

---

# Authentification et autorisation

## 🔐 Niveaux d'accès support

### Support client basique
- **Scope** : `support:read:basic`
- **Qui** : Clients pour leurs propres tickets
- **Limitations** : Vue filtrée par user_id, actions limitées

### Agent support niveau 1
- **Scope** : `support:agent:level1`
- **Qui** : Agents généralistes first-line support
- **Fonctionnalités** : Création tickets, réponses, escalade simple

### Agent support niveau 2
- **Scope** : `support:agent:level2`
- **Qui** : Experts techniques spécialisés
- **Fonctionnalités** : Tickets complexes, configuration, formation

### Superviseur support
- **Scope** : `support:supervisor`
- **Qui** : Managers équipe support, quality assurance
- **Fonctionnalités** : Analytics équipe, coaching, optimisation SLA

### Administration support
- **Scope** : `support:admin`
- **Qui** : Admins système support, configuration globale
- **Fonctionnalités** : Configuration chatbot, knowledge base, monitoring

## 🔑 Headers d'authentification

```http
Authorization: Bearer [JWT_TOKEN]
X-Agent-ID: [AGENT_UUID]               # ID agent si applicable
X-Customer-Context: [CONTEXT]          # Contexte client (organizer_id, event_id)
X-Support-Channel: [CHANNEL]           # Canal communication (chat, email, phone)
X-Urgency-Level: [LEVEL]               # Niveau urgence (low, medium, high, critical)
```

---

# API Système de tickets

## 🎫 Gestion tickets support

### GET /api/v1/support/tickets
**Description** : Liste des tickets support avec filtrage avancé

#### Query Parameters
- `status` (string, optional) : Statut ticket
  - `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_CUSTOMER`, `RESOLVED`, `CLOSED`
- `priority` (string, optional) : Priorité
  - `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `category` (string, optional) : Catégorie problème
- `assigned_agent_id` (UUID, optional) : Filtrer par agent assigné
- `customer_id` (UUID, optional) : Filtrer par client
- `channel` (string, optional) : Canal communication
- `created_since` (string, optional) : Date création minimum
- `sla_breach` (boolean, optional) : Tickets en dépassement SLA
- `page` (integer, optional) : Page résultats, default: 1
- `limit` (integer, optional) : Limite par page, default: 25

#### Response 200
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket_abc123",
        "ticket_number": "SUP-2024-001234",
        "subject": "Problème de connexion lors de l'achat de billets",
        "description": "Impossible de finaliser l'achat, erreur de paiement récurrente",
        "status": "ASSIGNED",
        "priority": "HIGH",
        "category": "TECHNICAL_ISSUE",
        "subcategory": "PAYMENT_PROCESSING",
        "channel": "CHAT",
        "customer": {
          "id": "usr_customer_001",
          "name": "Ahmed Ben Ali",
          "email": "ahmed@example.com",
          "phone": "+21612345678",
          "subscription_tier": "PREMIUM",
          "total_orders": 23,
          "satisfaction_rating": 4.2
        },
        "assigned_agent": {
          "id": "agent_tech_002",
          "name": "Sarah Technician",
          "level": "LEVEL_2",
          "specialization": "TECHNICAL",
          "current_workload": 7,
          "avg_rating": 4.7
        },
        "sla_info": {
          "first_response_due": "2024-03-31T20:30:00Z",
          "resolution_due": "2024-04-01T08:00:00Z",
          "time_remaining_hours": 10.5,
          "is_breached": false,
          "escalation_triggered": false
        },
        "timeline": [
          {
            "timestamp": "2024-03-31T20:00:00Z",
            "action": "CREATED",
            "actor": "CUSTOMER",
            "details": "Ticket créé via chat en ligne"
          },
          {
            "timestamp": "2024-03-31T20:03:00Z",
            "action": "AUTO_ASSIGNED",
            "actor": "SYSTEM",
            "details": "Assigné automatiquement à agent technique disponible"
          },
          {
            "timestamp": "2024-03-31T20:05:00Z",
            "action": "FIRST_RESPONSE",
            "actor": "AGENT",
            "details": "Agent a pris contact avec le client"
          }
        ],
        "metadata": {
          "related_order_id": "ord_xyz789",
          "error_codes": ["PAYMENT_GATEWAY_TIMEOUT", "CARD_DECLINED"],
          "browser_info": "Chrome 121.0 / Windows 10",
          "session_recording": "session_rec_001.mp4",
          "escalation_count": 0,
          "customer_sentiment": "FRUSTRATED"
        },
        "tags": ["payment", "technical", "urgent"],
        "created_at": "2024-03-31T20:00:00Z",
        "updated_at": "2024-03-31T20:05:00Z",
        "first_response_at": "2024-03-31T20:05:00Z",
        "resolved_at": null
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 12,
      "total_tickets": 289,
      "limit": 25
    },
    "summary": {
      "total_open": 45,
      "total_assigned": 123,
      "total_overdue": 8,
      "avg_response_time_minutes": 12.5,
      "sla_compliance_rate": 94.7
    }
  }
}
```

### POST /api/v1/support/tickets
**Description** : Création nouveau ticket support

#### Request Body
```json
{
  "subject": "Problème accès événement avec QR code",
  "description": "Mon QR code ne fonctionne pas à l'entrée de l'événement. Le scanner affiche 'Invalid ticket'.",
  "category": "ACCESS_ISSUE",
  "priority": "HIGH",
  "channel": "PHONE",
  "customer_info": {
    "user_id": "usr_customer_002",
    "phone": "+21612345678",
    "current_location": "Entrée A - Stade Radès"
  },
  "context": {
    "event_id": "evt_concert_tonight",
    "ticket_id": "tkt_abc123",
    "order_id": "ord_def456",
    "error_message": "QR code validation failed",
    "urgency_reason": "Événement commence dans 15 minutes"
  },
  "attachments": [
    {
      "type": "image",
      "filename": "qr_code_screenshot.jpg",
      "url": "https://uploads.entrix.tn/support/abc123.jpg"
    }
  ]
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "ticket_new_001",
      "ticket_number": "SUP-2024-001235",
      "status": "OPEN",
      "priority": "HIGH",
      "estimated_resolution": "2024-03-31T21:00:00Z",
      "sla_deadline": "2024-03-31T20:15:00Z",
      "next_steps": [
        "Validation immédiate du QR code",
        "Génération nouveau code si nécessaire",
        "Assistance entrée événement"
      ]
    },
    "auto_assignment": {
      "assigned_agent_id": "agent_event_support_001",
      "assignment_reason": "Expertise événements en cours",
      "estimated_first_contact": "2024-03-31T20:05:00Z"
    },
    "immediate_actions": [
      {
        "action": "QR_CODE_VALIDATION",
        "status": "IN_PROGRESS",
        "details": "Vérification ticket en cours..."
      },
      {
        "action": "VENUE_NOTIFICATION",
        "status": "COMPLETED",
        "details": "Équipe entrée informée du problème"
      }
    ]
  }
}
```

### PUT /api/v1/support/tickets/{ticket_id}
**Description** : Mise à jour ticket (agents uniquement)

#### Request Body
```json
{
  "status": "IN_PROGRESS",
  "internal_notes": "QR code vérifié, problème lié à synchronisation base données. Génération nouveau code en cours.",
  "customer_update": "Nous avons identifié le problème et générons un nouveau QR code. Vous devriez recevoir le nouveau code par SMS d'ici 2 minutes.",
  "estimated_resolution": "2024-03-31T20:15:00Z",
  "tags": ["database_sync", "qr_regeneration"],
  "escalation_required": false
}
```

### POST /api/v1/support/tickets/{ticket_id}/messages
**Description** : Ajout message/réponse au ticket

#### Request Body
```json
{
  "message": "Nouveau QR code généré et envoyé par SMS. Pouvez-vous confirmer réception et tester à l'entrée ?",
  "message_type": "AGENT_RESPONSE",
  "visibility": "CUSTOMER",
  "attachments": [
    {
      "type": "qr_code",
      "filename": "new_qr_code.png",
      "content": "data:image/png;base64,iVBORw0KGgoAAAANSUhE..."
    }
  ],
  "actions_taken": [
    "Generated new QR code",
    "Updated ticket status in system",
    "Notified venue security team"
  ]
}
```

---

# API Chatbot IA hybride

## 🤖 Intelligence artificielle conversationnelle

### POST /api/v1/support/chatbot/message
**Description** : Interaction avec chatbot IA support

#### Request Body
```json
{
  "message": "Je n'arrive pas à acheter des billets, le paiement ne passe pas",
  "user_id": "usr_customer_003",
  "session_id": "chat_session_abc123",
  "channel": "WEB_CHAT",
  "context": {
    "current_page": "/events/festival-jazz-2024",
    "cart_items": [
      {
        "event_id": "evt_jazz_001",
        "ticket_type": "VIP",
        "quantity": 2,
        "total": 340.00
      }
    ],
    "payment_method": "credit_card",
    "error_encountered": "payment_gateway_timeout"
  },
  "user_profile": {
    "subscription_tier": "BASIC",
    "previous_orders": 5,
    "last_successful_payment": "2024-02-15T10:30:00Z"
  }
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "bot_response": {
      "message": "Je comprends votre frustration avec ce problème de paiement. D'après votre contexte, il semble y avoir un délai d'attente avec notre passerelle de paiement. Voici ce que je peux faire pour vous aider immédiatement :",
      "suggested_actions": [
        {
          "action": "RETRY_PAYMENT",
          "label": "Réessayer le paiement",
          "description": "Tenter à nouveau avec la même carte",
          "probability_success": 0.75
        },
        {
          "action": "ALTERNATIVE_PAYMENT",
          "label": "Essayer un autre moyen de paiement",
          "description": "Utiliser Flouci ou virement bancaire",
          "probability_success": 0.90
        },
        {
          "action": "HUMAN_AGENT",
          "label": "Parler à un agent",
          "description": "Transfert vers agent spécialisé paiements",
          "estimated_wait": "2 minutes"
        }
      ],
      "quick_fixes": [
        {
          "title": "Vérification carte",
          "steps": [
            "Vérifiez que votre carte n'est pas expirée",
            "Confirmez que le plafond n'est pas atteint",
            "Essayez en navigation privée"
          ]
        }
      ]
    },
    "intent_analysis": {
      "primary_intent": "PAYMENT_ISSUE",
      "confidence": 0.94,
      "secondary_intents": ["PURCHASE_ASSISTANCE", "TECHNICAL_SUPPORT"],
      "sentiment": "FRUSTRATED",
      "urgency_level": "MEDIUM"
    },
    "escalation_recommendation": {
      "should_escalate": false,
      "escalation_score": 35,
      "escalation_triggers": ["multiple_failed_attempts", "high_value_order"],
      "auto_escalate_if": "User requests human agent OR 2+ failed resolution attempts"
    },
    "conversation_context": {
      "session_id": "chat_session_abc123",
      "messages_count": 3,
      "duration_minutes": 4.5,
      "resolved_automatically": false,
      "customer_satisfaction_predicted": 0.72
    },
    "related_help": [
      {
        "title": "Guide paiement par carte",
        "url": "/help/payment-methods",
        "relevance": 0.89
      },
      {
        "title": "Problèmes paiement fréquents",
        "url": "/help/payment-troubleshooting",
        "relevance": 0.85
      }
    ]
  }
}
```

### GET /api/v1/support/chatbot/suggestions
**Description** : Suggestions intelligentes pour réponses agents

#### Query Parameters
- `ticket_id` (UUID, required) : ID ticket pour contexte
- `partial_message` (string, optional) : Message partiel agent pour autocomplétion

#### Response 200
```json
{
  "success": true,
  "data": {
    "suggested_responses": [
      {
        "response": "Je comprends votre frustration. Laissez-moi vérifier immédiatement le statut de votre commande et résoudre ce problème.",
        "category": "EMPATHY_ACKNOWLEDGMENT",
        "confidence": 0.92,
        "estimated_satisfaction": 0.85
      },
      {
        "response": "D'après notre système, je vois que vous avez eu une excellente expérience avec nous par le passé. Je vais m'assurer que nous résolvons cela rapidement.",
        "category": "PERSONALIZED_REFERENCE",
        "confidence": 0.87,
        "estimated_satisfaction": 0.88
      }
    ],
    "knowledge_base_matches": [
      {
        "article_id": "kb_payment_001",
        "title": "Résolution erreurs paiement courantes",
        "relevance": 0.94,
        "key_points": [
          "Vérification statut transaction",
          "Génération nouveau lien paiement",
          "Alternatives Flouci/virement"
        ]
      }
    ],
    "similar_tickets": [
      {
        "ticket_id": "ticket_sim_001",
        "similarity_score": 0.89,
        "resolution": "Régénération lien paiement après timeout",
        "resolution_time_minutes": 8,
        "customer_satisfaction": 4.8
      }
    ]
  }
}
```

---

# API Agents et escalade

## 👥 Gestion agents support

### GET /api/v1/support/agents
**Description** : Liste agents support avec statuts temps réel

#### Query Parameters
- `status` (string, optional) : Statut agent
  - `AVAILABLE`, `BUSY`, `AWAY`, `OFFLINE`
- `specialization` (string, optional) : Spécialisation
- `level` (string, optional) : Niveau agent

#### Response 200
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent_001",
        "name": "Sarah El Amri",
        "email": "sarah@entrix.tn",
        "level": "LEVEL_2",
        "specialization": "TECHNICAL",
        "status": "AVAILABLE",
        "current_workload": 5,
        "max_concurrent_tickets": 8,
        "languages": ["fr", "ar", "en"],
        "online_since": "2024-03-31T08:00:00Z",
        "performance_metrics": {
          "avg_response_time_minutes": 3.2,
          "avg_resolution_time_hours": 2.1,
          "customer_satisfaction": 4.8,
          "tickets_resolved_today": 12,
          "first_contact_resolution_rate": 89.5
        },
        "expertise_areas": [
          "Payment processing",
          "Mobile app issues",
          "Event access problems",
          "Account management"
        ],
        "availability": {
          "shift_start": "08:00",
          "shift_end": "17:00",
          "breaks": [
            {"start": "12:00", "end": "13:00", "type": "LUNCH"}
          ],
          "timezone": "Africa/Tunis"
        },
        "current_tickets": [
          {
            "ticket_id": "ticket_abc123",
            "priority": "HIGH",
            "category": "TECHNICAL_ISSUE",
            "assigned_since": "2024-03-31T14:30:00Z"
          }
        ]
      }
    ],
    "team_metrics": {
      "total_agents": 24,
      "agents_online": 18,
      "agents_available": 12,
      "avg_workload": 4.2,
      "total_active_tickets": 156,
      "avg_wait_time_minutes": 2.8
    }
  }
}
```

### POST /api/v1/support/tickets/{ticket_id}/escalate
**Description** : Escalade ticket vers niveau supérieur

#### Request Body
```json
{
  "escalation_reason": "COMPLEXITY_EXCEEDS_LEVEL",
  "target_level": "LEVEL_3",
  "target_specialization": "PAYMENT_SPECIALIST",
  "priority_override": "HIGH",
  "context_notes": "Client VIP avec commande 2000 TND, problème récurrent paiement international. Nécessite expertise spécialisée.",
  "customer_notification": true,
  "urgency_justification": "Event starts in 2 hours, customer stuck at venue entrance"
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "escalation": {
      "escalation_id": "esc_001",
      "from_agent": "agent_level1_005",
      "to_agent": "agent_payment_expert_002",
      "escalation_level": "LEVEL_1_TO_LEVEL_3",
      "assigned_at": "2024-03-31T20:15:00Z",
      "sla_adjustment": {
        "new_deadline": "2024-03-31T21:00:00Z",
        "priority_boost": true,
        "expedited_handling": true
      }
    },
    "agent_notified": true,
    "customer_notified": true,
    "estimated_contact_time": "2024-03-31T20:18:00Z"
  }
}
```

### GET /api/v1/support/agents/{agent_id}/workload
**Description** : Analyse charge travail agent

#### Response 200
```json
{
  "success": true,
  "data": {
    "agent_workload": {
      "agent_id": "agent_001",
      "current_load": {
        "active_tickets": 6,
        "pending_tickets": 2,
        "overdue_tickets": 1,
        "total_workload_score": 75
      },
      "capacity_analysis": {
        "max_capacity": 8,
        "current_utilization": 87.5,
        "recommended_action": "NEAR_CAPACITY",
        "time_to_capacity": "45 minutes"
      },
      "performance_today": {
        "tickets_resolved": 8,
        "avg_resolution_time": "1.8 hours",
        "customer_satisfaction": 4.7,
        "response_time_compliance": 96.2
      },
      "workload_distribution": {
        "low_priority": 2,
        "medium_priority": 3,
        "high_priority": 1,
        "critical_priority": 0
      },
      "burnout_indicators": {
        "consecutive_hours": 6.5,
        "break_compliance": true,
        "stress_level": "MODERATE",
        "recommendations": [
          "Schedule break in next hour",
          "Consider workload redistribution"
        ]
      }
    }
  }
}
```

---

# API Health monitoring

## 📊 Surveillance système temps réel

### GET /api/v1/support/health/overview
**Description** : Vue d'ensemble santé système

#### Response 200
```json
{
  "success": true,
  "data": {
    "system_health": {
      "overall_status": "HEALTHY",
      "health_score": 94.7,
      "last_updated": "2024-03-31T20:00:00Z"
    },
    "component_status": {
      "api_gateway": {
        "status": "HEALTHY",
        "response_time_ms": 45,
        "error_rate": 0.02,
        "uptime_percent": 99.98
      },
      "database": {
        "status": "HEALTHY",
        "connection_pool": 85,
        "query_performance": 23,
        "disk_usage": 67
      },
      "payment_gateways": {
        "flouci": {
          "status": "HEALTHY",
          "success_rate": 98.5,
          "avg_processing_time": 1.2
        },
        "visa_mastercard": {
          "status": "DEGRADED",
          "success_rate": 94.2,
          "avg_processing_time": 3.8,
          "issues": ["Intermittent timeouts"]
        }
      },
      "notification_services": {
        "email": {"status": "HEALTHY", "delivery_rate": 99.1},
        "sms": {"status": "HEALTHY", "delivery_rate": 97.8},
        "push": {"status": "HEALTHY", "delivery_rate": 95.4}
      }
    },
    "performance_metrics": {
      "api_requests_per_minute": 1247,
      "concurrent_users": 3456,
      "database_connections": 45,
      "memory_usage_percent": 72,
      "cpu_usage_percent": 58,
      "disk_usage_percent": 67
    },
    "active_alerts": [
      {
        "id": "alert_001",
        "component": "payment_gateway_visa",
        "severity": "WARNING",
        "message": "Elevated response times detected",
        "since": "2024-03-31T19:45:00Z",
        "impact": "MEDIUM"
      }
    ],
    "recent_incidents": [
      {
        "id": "incident_resolved_001",
        "title": "Database connection pool exhaustion",
        "status": "RESOLVED",
        "duration_minutes": 12,
        "impact": "Users experienced slow page loads",
        "resolved_at": "2024-03-31T18:30:00Z"
      }
    ]
  }
}
```

### GET /api/v1/support/health/detailed/{component}
**Description** : Santé détaillée composant spécifique

#### Path Parameters
- `component` (string, required) : Nom composant
  - `api_gateway`, `database`, `payments`, `notifications`, `storage`

#### Response 200
```json
{
  "success": true,
  "data": {
    "component_health": {
      "component": "database",
      "status": "HEALTHY",
      "detailed_metrics": {
        "connections": {
          "active": 45,
          "max": 100,
          "utilization": 45.0
        },
        "performance": {
          "avg_query_time_ms": 23,
          "slow_queries_count": 2,
          "deadlocks_24h": 0,
          "cache_hit_ratio": 94.7
        },
        "storage": {
          "total_size_gb": 2340,
          "used_size_gb": 1567,
          "free_space_gb": 773,
          "growth_rate_gb_per_day": 12.5
        },
        "replication": {
          "slave_lag_seconds": 0.8,
          "replication_status": "HEALTHY",
          "sync_status": "UP_TO_DATE"
        }
      },
      "health_checks": [
        {
          "check": "CONNECTION_TEST",
          "status": "PASS",
          "response_time_ms": 5,
          "last_run": "2024-03-31T20:00:00Z"
        },
        {
          "check": "QUERY_PERFORMANCE",
          "status": "PASS",
          "avg_time_ms": 23,
          "threshold_ms": 50
        },
        {
          "check": "DISK_SPACE",
          "status": "WARNING",
          "free_space_percent": 33,
          "threshold_percent": 20,
          "estimated_full": "2024-05-15T00:00:00Z"
        }
      ],
      "trending_metrics": {
        "query_performance_24h": [
          {"time": "2024-03-31T19:00:00Z", "avg_ms": 25},
          {"time": "2024-03-31T20:00:00Z", "avg_ms": 23}
        ],
        "connection_usage_24h": [
          {"time": "2024-03-31T19:00:00Z", "connections": 42},
          {"time": "2024-03-31T20:00:00Z", "connections": 45}
        ]
      }
    }
  }
}
```

### POST /api/v1/support/health/maintenance-window
**Description** : Planification fenêtre maintenance

#### Request Body
```json
{
  "title": "Mise à jour base de données Q2 2024",
  "description": "Migration vers PostgreSQL 15 avec optimisations performance",
  "scheduled_start": "2024-04-15T02:00:00Z",
  "estimated_duration_minutes": 120,
  "affected_components": ["database", "api_gateway", "payment_processing"],
  "impact_level": "MEDIUM",
  "notification_schedule": {
    "advance_notice_days": 7,
    "reminder_24h": true,
    "reminder_1h": true
  },
  "rollback_plan": {
    "automated_rollback": true,
    "rollback_threshold_minutes": 30,
    "rollback_triggers": ["error_rate > 5%", "response_time > 1000ms"]
  },
  "communication": {
    "status_page": true,
    "email_notifications": true,
    "in_app_banners": true,
    "custom_message": "Nous améliorons nos performances pour vous offrir une meilleure expérience."
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "maintenance_window": {
      "id": "maint_001",
      "status": "SCHEDULED",
      "scheduled_start": "2024-04-15T02:00:00Z",
      "scheduled_end": "2024-04-15T04:00:00Z",
      "notifications_sent": 0,
      "next_notification": "2024-04-08T02:00:00Z",
      "approval_required": true,
      "approval_status": "PENDING"
    }
  }
}
```

---

# API Maintenance prédictive

## 🔮 Intelligence prédictive système

### GET /api/v1/support/maintenance/predictions
**Description** : Prédictions pannes et maintenance

#### Response 200
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "component": "database_primary",
        "prediction_type": "PERFORMANCE_DEGRADATION",
        "probability": 0.78,
        "predicted_date": "2024-04-12T00:00:00Z",
        "confidence": 0.84,
        "indicators": [
          "Query response time trending upward",
          "Connection pool utilization increasing",
          "Disk I/O showing stress patterns"
        ],
        "recommended_actions": [
          {
            "action": "QUERY_OPTIMIZATION",
            "priority": "HIGH",
            "estimated_effort": "2-4 hours",
            "impact": "50% performance improvement"
          },
          {
            "action": "INDEX_MAINTENANCE",
            "priority": "MEDIUM",
            "estimated_effort": "1 hour",
            "impact": "20% query speed improvement"
          },
          {
            "action": "CONNECTION_POOL_TUNING",
            "priority": "LOW",
            "estimated_effort": "30 minutes",
            "impact": "15% resource efficiency"
          }
        ],
        "risk_assessment": {
          "risk_level": "MEDIUM",
          "business_impact": "User experience degradation during peak hours",
          "financial_impact": "Potential revenue loss if unchecked",
          "mitigation_urgency": "Within 2 weeks"
        }
      },
      {
        "component": "payment_gateway_integration",
        "prediction_type": "CAPACITY_OVERFLOW",
        "probability": 0.65,
        "predicted_date": "2024-04-20T18:00:00Z",
        "confidence": 0.71,
        "triggers": [
          "Upcoming festival season",
          "Historical traffic patterns",
          "Current growth rate"
        ],
        "recommended_actions": [
          {
            "action": "SCALE_PAYMENT_INFRASTRUCTURE",
            "priority": "HIGH",
            "estimated_effort": "1 day",
            "impact": "100% capacity increase"
          }
        ]
      }
    ],
    "system_trends": {
      "overall_health_trend": "STABLE",
      "performance_trend": "IMPROVING",
      "resource_utilization_trend": "INCREASING",
      "failure_risk_trend": "DECREASING"
    },
    "maintenance_recommendations": {
      "immediate": [
        "Monitor database performance closely",
        "Prepare payment scaling infrastructure"
      ],
      "this_week": [
        "Execute query optimization",
        "Update monitoring thresholds"
      ],
      "this_month": [
        "Plan infrastructure scaling",
        "Review capacity planning"
      ]
    }
  }
}
```

### POST /api/v1/support/maintenance/preventive-action
**Description** : Exécution action préventive

#### Request Body
```json
{
  "component": "database_primary",
  "action_type": "QUERY_OPTIMIZATION",
  "scheduled_execution": "2024-04-05T03:00:00Z",
  "estimated_duration_minutes": 180,
  "risk_mitigation": {
    "backup_before": true,
    "rollback_plan": true,
    "monitoring_enhanced": true
  },
  "approval_required": true,
  "notification_stakeholders": [
    "technical_team@entrix.tn",
    "operations@entrix.tn"
  ]
}
```

---

# API Knowledge base

## 📚 Base de connaissances collaborative

### GET /api/v1/support/knowledge/articles
**Description** : Articles base de connaissances

#### Query Parameters
- `category` (string, optional) : Catégorie article
- `search` (string, optional) : Recherche textuelle
- `tags` (array, optional) : Tags spécifiques
- `popularity` (string, optional) : Tri par popularité
- `latest` (boolean, optional) : Articles récents

#### Response 200
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "kb_001",
        "title": "Comment résoudre les problèmes de paiement Flouci",
        "content": "Guide étape par étape pour diagnostiquer et résoudre les problèmes de paiement Flouci...",
        "category": "PAYMENT_ISSUES",
        "subcategory": "FLOUCI",
        "tags": ["paiement", "flouci", "mobile", "troubleshooting"],
        "difficulty_level": "BEGINNER",
        "estimated_read_time": 5,
        "view_count": 1247,
        "helpfulness_score": 4.6,
        "last_updated": "2024-03-25T10:00:00Z",
        "author": {
          "name": "Sarah Tech Support",
          "role": "Technical Specialist"
        },
        "related_articles": [
          {"id": "kb_002", "title": "Alternative payment methods"},
          {"id": "kb_003", "title": "Mobile payment troubleshooting"}
        ],
        "feedback": {
          "helpful_votes": 156,
          "not_helpful_votes": 12,
          "comments_count": 23
        },
        "content_sections": [
          {
            "title": "Diagnostic initial",
            "steps": [
              "Vérifier connexion internet",
              "Contrôler solde Flouci",
              "Valider numéro téléphone"
            ]
          },
          {
            "title": "Solutions avancées",
            "steps": [
              "Réinitialiser application Flouci",
              "Contacter support Flouci",
              "Utiliser méthode alternative"
            ]
          }
        ]
      }
    ],
    "categories": [
      {
        "name": "PAYMENT_ISSUES",
        "count": 45,
        "popular_tags": ["flouci", "card", "refund"]
      },
      {
        "name": "ACCOUNT_MANAGEMENT",
        "count": 32,
        "popular_tags": ["password", "profile", "subscription"]
      }
    ],
    "search_suggestions": [
      "problème paiement",
      "mot de passe oublié",
      "remboursement billet"
    ]
  }
}
```

### POST /api/v1/support/knowledge/articles
**Description** : Création nouvel article

#### Request Body
```json
{
  "title": "Guide résolution problèmes QR code événements",
  "content": "# Guide complet résolution QR codes\n\n## Problèmes fréquents...",
  "category": "ACCESS_ISSUES",
  "subcategory": "QR_CODES",
  "tags": ["qr", "accès", "événement", "mobile"],
  "difficulty_level": "INTERMEDIATE",
  "target_audience": ["AGENTS", "CUSTOMERS"],
  "media_attachments": [
    {
      "type": "video",
      "url": "https://media.entrix.tn/tutorials/qr-troubleshooting.mp4",
      "duration_seconds": 180
    },
    {
      "type": "image",
      "url": "https://media.entrix.tn/guides/qr-scanner-example.jpg",
      "description": "Exemple scan QR code correct"
    }
  ],
  "related_tickets": ["ticket_001", "ticket_045"],
  "review_required": true
}
```

### GET /api/v1/support/knowledge/search
**Description** : Recherche intelligente dans knowledge base

#### Query Parameters
- `query` (string, required) : Terme recherche
- `context` (string, optional) : Contexte (ticket_id, conversation_id)
- `user_type` (string, optional) : Type utilisateur (agent, customer)

#### Response 200
```json
{
  "success": true,
  "data": {
    "search_results": [
      {
        "article_id": "kb_045",
        "title": "QR Code ne fonctionne pas à l'entrée",
        "relevance_score": 0.94,
        "match_type": "TITLE_AND_CONTENT",
        "excerpt": "Si votre QR code affiche 'Invalid ticket' au scanner, voici les étapes à suivre...",
        "category": "ACCESS_ISSUES",
        "estimated_resolution_time": "2 minutes",
        "success_rate": 0.89
      },
      {
        "article_id": "kb_067",
        "title": "Problèmes scanner QR code mobile",
        "relevance_score": 0.87,
        "match_type": "CONTENT",
        "excerpt": "Les applications de scanner QR peuvent parfois avoir des difficultés...",
        "category": "TECHNICAL_ISSUES"
      }
    ],
    "suggested_actions": [
      "Vérifier validité billet en base",
      "Régénérer QR code si nécessaire",
      "Guider client vers entrée alternative"
    ],
    "related_topics": [
      "Validation billets",
      "Problèmes mobile",
      "Accès événements"
    ],
    "search_analytics": {
      "total_results": 8,
      "search_time_ms": 23,
      "filters_applied": ["recent", "high_rating"]
    }
  }
}
```

---

# API SLA et métriques

## 📊 Gestion SLA intelligents

### GET /api/v1/support/sla/performance
**Description** : Performance SLA temps réel

#### Query Parameters
- `period` (string, optional) : Période analyse, default: `today`
- `breakdown_by` (string, optional) : Dimension breakdown
- `agent_id` (UUID, optional) : Performance agent spécifique

#### Response 200
```json
{
  "success": true,
  "data": {
    "sla_performance": {
      "overall_compliance": 94.7,
      "first_response_sla": {
        "target_minutes": 15,
        "avg_actual_minutes": 8.5,
        "compliance_rate": 96.2,
        "breaches_today": 3
      },
      "resolution_sla": {
        "target_hours": 24,
        "avg_actual_hours": 18.2,
        "compliance_rate": 92.8,
        "breaches_today": 7
      },
      "escalation_sla": {
        "target_minutes": 30,
        "avg_actual_minutes": 22.1,
        "compliance_rate": 98.5
      }
    },
    "performance_by_priority": {
      "critical": {
        "target_response_minutes": 5,
        "actual_avg_minutes": 3.2,
        "compliance_rate": 100.0
      },
      "high": {
        "target_response_minutes": 15,
        "actual_avg_minutes": 12.8,
        "compliance_rate": 94.1
      },
      "medium": {
        "target_response_minutes": 60,
        "actual_avg_minutes": 45.2,
        "compliance_rate": 96.7
      },
      "low": {
        "target_response_minutes": 240,
        "actual_avg_minutes": 180.5,
        "compliance_rate": 89.3
      }
    },
    "performance_by_channel": {
      "chat": {
        "first_response_avg": 2.1,
        "resolution_avg_hours": 1.8,
        "satisfaction": 4.6
      },
      "email": {
        "first_response_avg": 45.2,
        "resolution_avg_hours": 12.5,
        "satisfaction": 4.2
      },
      "phone": {
        "first_response_avg": 0.8,
        "resolution_avg_hours": 0.5,
        "satisfaction": 4.8
      }
    },
    "trending_metrics": {
      "compliance_trend_7d": "IMPROVING",
      "response_time_trend": "STABLE",
      "resolution_time_trend": "IMPROVING",
      "customer_satisfaction_trend": "IMPROVING"
    },
    "alerts": [
      {
        "type": "SLA_RISK",
        "message": "5 tickets approaching resolution deadline",
        "severity": "WARNING",
        "action_required": "Prioritize ticket resolution"
      }
    ]
  }
}
```

### POST /api/v1/support/sla/calculate-dynamic
**Description** : Calcul SLA dynamique selon profil client

#### Request Body
```json
{
  "customer_id": "usr_premium_001",
  "ticket_category": "BILLING_DISPUTE",
  "severity": "HIGH",
  "context": {
    "order_value": 2500.00,
    "event_start_proximity_hours": 4,
    "customer_history": {
      "total_orders": 45,
      "avg_satisfaction": 4.2,
      "last_escalation": "2024-02-15T00:00:00Z"
    }
  }
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "dynamic_sla": {
      "customer_tier": "PREMIUM",
      "calculated_priority": "HIGH",
      "sla_adjustments": {
        "base_first_response_minutes": 60,
        "tier_multiplier": 0.5,
        "urgency_multiplier": 0.7,
        "final_first_response_minutes": 21
      },
      "resolution_targets": {
        "target_resolution_hours": 8,
        "escalation_threshold_hours": 4,
        "executive_escalation_hours": 6
      },
      "service_level": "PREMIUM_EXPEDITED",
      "agent_requirements": {
        "min_level": "LEVEL_2",
        "preferred_specialization": "BILLING",
        "language_requirement": "French"
      },
      "additional_services": {
        "proactive_updates": true,
        "executive_notification": true,
        "priority_queue": true,
        "phone_callback": true
      }
    },
    "justification": {
      "factors_considered": [
        "Premium subscription tier",
        "High order value",
        "Event proximity urgency",
        "Strong customer history"
      ],
      "adjustments_applied": [
        "50% faster response due to tier",
        "30% faster due to urgency",
        "Executive notification enabled"
      ]
    }
  }
}
```

---

# API Analytics support

## 📈 Analytics performance support

### GET /api/v1/support/analytics/dashboard
**Description** : Dashboard analytics support complet

#### Query Parameters
- `period` (string, optional) : Période analyse, default: `7d`
- `breakdown` (string, optional) : Dimension breakdown
- `compare_previous` (boolean, optional) : Comparaison période précédente

#### Response 200
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_tickets": 489,
      "tickets_resolved": 456,
      "avg_resolution_time_hours": 18.5,
      "customer_satisfaction": 4.3,
      "first_contact_resolution_rate": 78.2,
      "sla_compliance": 94.7
    },
    "volume_analysis": {
      "daily_averages": {
        "tickets_created": 69.8,
        "tickets_resolved": 65.1,
        "backlog_growth": 4.7
      },
      "peak_hours": [
        {"hour": 10, "avg_tickets": 12.5},
        {"hour": 14, "avg_tickets": 15.2},
        {"hour": 20, "avg_tickets": 8.7}
      ],
      "channel_distribution": {
        "chat": 45.2,
        "email": 32.1,
        "phone": 18.7,
        "whatsapp": 4.0
      }
    },
    "quality_metrics": {
      "customer_satisfaction": {
        "avg_rating": 4.3,
        "response_rate": 67.8,
        "promoter_score": 72,
        "by_channel": {
          "chat": 4.5,
          "email": 4.1,
          "phone": 4.7,
          "whatsapp": 4.4
        }
      },
      "agent_performance": {
        "avg_tickets_per_agent_per_day": 8.2,
        "avg_customer_rating": 4.4,
        "coaching_sessions_completed": 23,
        "knowledge_base_usage": 89.5
      }
    },
    "efficiency_metrics": {
      "automation_impact": {
        "chatbot_resolution_rate": 34.5,
        "auto_routing_accuracy": 92.3,
        "knowledge_base_deflection": 28.7
      },
      "cost_analysis": {
        "cost_per_ticket": 12.45,
        "cost_per_resolution": 13.78,
        "automation_savings": 4567.80
      }
    },
    "trending_insights": [
      {
        "metric": "First Contact Resolution",
        "trend": "IMPROVING",
        "change_percent": 8.5,
        "insight": "Knowledge base improvements driving better self-service"
      },
      {
        "metric": "Chat Response Time",
        "trend": "STABLE",
        "change_percent": -2.1,
        "insight": "Consistent performance maintained despite volume increase"
      }
    ],
    "recommendations": [
      {
        "category": "PROCESS_IMPROVEMENT",
        "priority": "HIGH",
        "recommendation": "Increase chatbot training for payment-related queries",
        "expected_impact": "15% reduction in escalations",
        "implementation_effort": "MEDIUM"
      }
    ]
  }
}
```

### GET /api/v1/support/analytics/customer-insights
**Description** : Insights comportement clients support

#### Response 200
```json
{
  "success": true,
  "data": {
    "customer_behavior": {
      "contact_patterns": {
        "multi_channel_users": 23.4,
        "preferred_channel_consistency": 78.6,
        "average_interactions_per_issue": 2.3
      },
      "satisfaction_drivers": [
        {"factor": "Response Speed", "impact_score": 0.87},
        {"factor": "Agent Knowledge", "impact_score": 0.82},
        {"factor": "Issue Resolution", "impact_score": 0.94},
        {"factor": "Follow-up Quality", "impact_score": 0.76}
      ],
      "escalation_patterns": {
        "escalation_rate": 12.5,
        "common_escalation_reasons": [
          "Technical complexity",
          "Policy exceptions",
          "Billing disputes"
        ],
        "escalation_satisfaction_impact": -1.2
      }
    },
    "segment_analysis": {
      "by_subscription_tier": {
        "premium": {
          "satisfaction": 4.7,
          "resolution_time": 12.5,
          "escalation_rate": 8.2
        },
        "standard": {
          "satisfaction": 4.2,
          "resolution_time": 19.8,
          "escalation_rate": 14.1
        },
        "basic": {
          "satisfaction": 3.9,
          "resolution_time": 24.3,
          "escalation_rate": 16.7
        }
      },
      "by_customer_tenure": {
        "new_0_3_months": {
          "contact_frequency": 2.1,
          "satisfaction": 4.1,
          "common_issues": ["Account setup", "First purchase"]
        },
        "established_3_12_months": {
          "contact_frequency": 1.3,
          "satisfaction": 4.4,
          "common_issues": ["Feature questions", "Event access"]
        },
        "loyal_12_plus_months": {
          "contact_frequency": 0.8,
          "satisfaction": 4.6,
          "common_issues": ["Advanced features", "Billing"]
        }
      }
    },
    "predictive_insights": {
      "churn_risk_indicators": [
        "Multiple unresolved tickets",
        "Satisfaction below 3.0",
        "Escalation without resolution"
      ],
      "satisfaction_predictions": {
        "likely_promoters": 234,
        "at_risk_detractors": 45,
        "intervention_opportunities": 67
      }
    }
  }
}
```

---

# API Administration support

## ⚙️ Administration système support

### GET /api/v1/support/admin/configuration
**Description** : Configuration système support (Admin uniquement)

#### Headers
```http
Authorization: Bearer [ADMIN_TOKEN]
X-Admin-Level: support
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "chatbot_configuration": {
      "nlp_model_version": "v3.2.1",
      "confidence_threshold": 0.75,
      "escalation_threshold": 0.45,
      "supported_languages": ["fr", "ar", "en"],
      "training_status": {
        "last_trained": "2024-03-28T00:00:00Z",
        "training_data_points": 45672,
        "model_accuracy": 0.87
      },
      "intent_categories": [
        {
          "category": "PAYMENT_ISSUES",
          "confidence_avg": 0.92,
          "training_examples": 1247
        },
        {
          "category": "ACCOUNT_MANAGEMENT",
          "confidence_avg": 0.89,
          "training_examples": 987
        }
      ]
    },
    "routing_rules": [
      {
        "rule_id": "rule_001",
        "name": "Premium Customer Priority",
        "condition": "customer.tier == 'PREMIUM' AND priority >= 'HIGH'",
        "action": "ASSIGN_TO_LEVEL_2",
        "target_specialization": "VIP_SUPPORT",
        "max_wait_time_minutes": 5
      },
      {
        "rule_id": "rule_002",
        "name": "Technical Issue Routing",
        "condition": "category == 'TECHNICAL_ISSUE'",
        "action": "ASSIGN_TO_SPECIALIZATION",
        "target_specialization": "TECHNICAL",
        "escalation_path": ["LEVEL_1", "LEVEL_2", "ENGINEERING"]
      }
    ],
    "sla_templates": [
      {
        "template_id": "sla_premium",
        "name": "Premium Customer SLA",
        "first_response_minutes": 15,
        "resolution_hours": 8,
        "escalation_triggers": {
          "response_breach": true,
          "customer_follow_up": true,
          "satisfaction_below": 3.0
        }
      }
    ],
    "integration_status": {
      "crm_integration": {
        "status": "CONNECTED",
        "last_sync": "2024-03-31T19:55:00Z",
        "sync_frequency": "5_MINUTES"
      },
      "notification_services": {
        "email": "OPERATIONAL",
        "sms": "OPERATIONAL",
        "push": "OPERATIONAL",
        "whatsapp": "OPERATIONAL"
      }
    }
  }
}
```

### POST /api/v1/support/admin/chatbot/retrain
**Description** : Reentraînement modèle chatbot

#### Request Body
```json
{
  "training_mode": "INCREMENTAL",
  "data_sources": [
    "resolved_tickets_30d",
    "knowledge_base_updates",
    "customer_feedback"
  ],
  "focus_areas": [
    "PAYMENT_ISSUES",
    "EVENT_ACCESS",
    "ACCOUNT_MANAGEMENT"
  ],
  "quality_threshold": 0.85,
  "validation_split": 0.2
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "training_job": {
      "job_id": "train_001",
      "status": "STARTED",
      "estimated_completion": "2024-04-01T02:00:00Z",
      "progress": 0,
      "current_phase": "DATA_PREPARATION"
    },
    "training_data": {
      "total_examples": 52341,
      "new_examples": 6789,
      "validation_examples": 10468
    }
  }
}
```

---

# Codes d'erreur

## 📋 Codes d'erreur spécifiques

| Code | Message | Description |
|------|---------|-------------|
| `M001` | Insufficient support permissions | Permissions support insuffisantes |
| `M002` | Ticket not found or access denied | Ticket introuvable ou accès refusé |
| `M003` | Agent not available for assignment | Agent indisponible pour attribution |
| `M004` | SLA configuration invalid | Configuration SLA invalide |
| `M005` | Chatbot service unavailable | Service chatbot indisponible |
| `M006` | Knowledge base article not found | Article base connaissances introuvable |
| `M007` | Escalation rules violation | Violation règles escalade |
| `M008` | Health monitoring data unavailable | Données monitoring indisponibles |
| `M009` | Maintenance window conflict | Conflit fenêtre maintenance |
| `M010` | Customer satisfaction threshold not met | Seuil satisfaction non atteint |
| `M011` | Analytics data insufficient | Données analytics insuffisantes |
| `M012` | Agent workload exceeded | Charge agent dépassée |
| `M013` | Notification delivery failed | Échec livraison notification |
| `M014` | Integration service error | Erreur service intégration |
| `M015` | Predictive model unavailable | Modèle prédictif indisponible |

---

# Exemples d'usage

## 🎧 Cas d'usage typiques

### 1. Workflow support client standard

```bash
# Création ticket par client
curl -X POST "https://api.entrix.tn/v1/support/tickets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "QR code ne fonctionne pas",
    "description": "Impossible de scanner QR code à l'\''entrée",
    "category": "ACCESS_ISSUE",
    "priority": "HIGH",
    "context": {
      "event_id": "evt_concert_001",
      "ticket_id": "tkt_abc123"
    }
  }'

# Suivi tickets
curl -G "https://api.entrix.tn/v1/support/tickets" \
  -H "Authorization: Bearer $TOKEN" \
  -d "status=OPEN,ASSIGNED" \
  -d "priority=HIGH,CRITICAL"
```

### 2. Interaction chatbot IA

```bash
# Message au chatbot
curl -X POST "https://api.entrix.tn/v1/support/chatbot/message" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Je n'\''arrive pas à payer avec ma carte",
    "user_id": "usr_customer_001",
    "context": {
      "current_page": "/checkout",
      "payment_method": "credit_card",
      "error_encountered": "payment_declined"
    }
  }'

# Suggestions pour agents
curl -G "https://api.entrix.tn/v1/support/chatbot/suggestions" \
  -H "Authorization: Bearer $TOKEN" \
  -d "ticket_id=ticket_abc123"
```

### 3. Gestion agents et escalade

```bash
# Statut agents
curl -G "https://api.entrix.tn/v1/support/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -d "status=AVAILABLE" \
  -d "specialization=TECHNICAL"

# Escalade ticket
curl -X POST "https://api.entrix.tn/v1/support/tickets/ticket_001/escalate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "escalation_reason": "COMPLEXITY_EXCEEDS_LEVEL",
    "target_level": "LEVEL_3",
    "urgency_justification": "VIP customer with high-value order"
  }'
```

### 4. Health monitoring et maintenance

```bash
# Santé système global
curl -G "https://api.entrix.tn/v1/support/health/overview" \
  -H "Authorization: Bearer $TOKEN"

# Détails composant spécifique  
curl -G "https://api.entrix.tn/v1/support/health/detailed/database" \
  -H "Authorization: Bearer $TOKEN"

# Planification maintenance
curl -X POST "https://api.entrix.tn/v1/support/health/maintenance-window" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database optimization",
    "scheduled_start": "2024-04-15T02:00:00Z",
    "estimated_duration_minutes": 120,
    "affected_components": ["database", "api_gateway"]
  }'
```

### 5. Analytics et optimisation

```bash
# Dashboard analytics support
curl -G "https://api.entrix.tn/v1/support/analytics/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -d "period=7d" \
  -d "compare_previous=true"

# Performance SLA
curl -G "https://api.entrix.tn/v1/support/sla/performance" \
  -H "Authorization: Bearer $TOKEN" \
  -d "breakdown_by=channel"

# Insights clients
curl -G "https://api.entrix.tn/v1/support/analytics/customer-insights" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Knowledge base et self-service

```bash
# Recherche knowledge base
curl -G "https://api.entrix.tn/v1/support/knowledge/search" \
  -H "Authorization: Bearer $TOKEN" \
  -d "query=problème paiement flouci" \
  -d "context=ticket_abc123"

# Articles populaires
curl -G "https://api.entrix.tn/v1/support/knowledge/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -d "category=PAYMENT_ISSUES" \
  -d "popularity=high"

# Création article
curl -X POST "https://api.entrix.tn/v1/support/knowledge/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Guide résolution QR codes défaillants",
    "content": "# Étapes de diagnostic...",
    "category": "ACCESS_ISSUES",
    "tags": ["qr", "accès", "mobile"]
  }'
```

### 7. Administration et configuration

```bash
# Configuration système (Admin)
curl -G "https://api.entrix.tn/v1/support/admin/configuration" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "X-Admin-Level: support"

# Reentraînement chatbot
curl -X POST "https://api.entrix.tn/v1/support/admin/chatbot/retrain" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "training_mode": "INCREMENTAL",
    "focus_areas": ["PAYMENT_ISSUES", "EVENT_ACCESS"]
  }'

# Prédictions maintenance
curl -G "https://api.entrix.tn/v1/support/maintenance/predictions" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🎯 Notes d'implémentation

### Intelligence artificielle
- **NLP avancé** : Traitement langage naturel avec intent recognition
- **ML prédictif** : Modèles maintenance prédictive et satisfaction client
- **Auto-apprentissage** : Amélioration continue modèles via feedback
- **Hybrid AI** : Combinaison IA + agents humains pour efficacité maximale

### Performance et disponibilité
- **Temps réel** : WebSocket pour chat, SSE pour notifications
- **Haute disponibilité** : Architecture redondante, failover automatique
- **Scalabilité** : Auto-scaling selon charge, distribution géographique
- **Cache intelligent** : Redis pour knowledge base, sessions support

### Qualité et amélioration continue
- **Métriques 360°** : Satisfaction client, performance agents, efficacité système
- **A/B Testing** : Optimisation continue workflows et réponses
- **Feedback loops** : Amélioration processus basée sur données réelles
- **Quality assurance** : Monitoring qualité, coaching agents automatisé

### Intégrations
- **CRM intégré** : Synchronisation données client temps réel
- **Notifications omnicanal** : Email, SMS, Push, WhatsApp unifiés
- **Analytics cross-module** : Corrélation données support avec business metrics
- **API-first** : Architecture permettant intégrations tiers facilement