# API Specifications - Module Administration et Sécurité
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Audit et traçabilité](#api-audit-et-traçabilité)
4. [API Gestion des sessions](#api-gestion-des-sessions)
5. [API Sécurité et monitoring](#api-sécurité-et-monitoring)
6. [API Rate limiting et protection](#api-rate-limiting-et-protection)
7. [API Authentification multi-facteurs](#api-authentification-multi-facteurs)
8. [API Conformité réglementaire](#api-conformité-réglementaire)
9. [API Politiques de sécurité](#api-politiques-de-sécurité)
10. [API Incidents et réponse](#api-incidents-et-réponse)
11. [API Administration système](#api-administration-système)
12. [Codes d'erreur](#codes-derreur)
13. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Administration et Sécurité** constitue le **pilier sécuritaire et administratif** d'Entrix V3.0, assurant la **protection maximale**, la **gouvernance stricte** et la **conformité réglementaire** de toutes les opérations de la plateforme avec une **architecture de sécurité de classe entreprise**.

## 🏗️ Architecture Zero Trust V3.0

### **Paradigme de sécurité révolutionnaire**
```
Identité → Vérification → Autorisation → Chiffrement → Monitoring → Audit
```

### **Innovations révolutionnaires V3.0**
- **🛡️ Zero Trust Architecture** : Vérification continue de tous les accès
- **🤖 IA de détection menaces** : Machine learning pour cybersécurité proactive
- **🔐 Chiffrement quantique-resistant** : Cryptographie future-proof
- **📊 SIEM intégré** : Corrélation d'événements temps réel
- **🌍 Conformité globale** : GDPR, CCPA, SOX, PCI DSS Level 1
- **⚡ Réponse automatisée** : SOAR avec playbooks intelligents
- **🔍 Forensics avancé** : Investigation numérique automatisée

### **Types de protection supportés**
- **🔐 IAM (Identity Access Management)** : SSO, MFA, RBAC granulaire
- **📋 Audit Trail Complet** : Traçabilité exhaustive toutes actions
- **🚨 Détection Anomalies** : Behavioral analytics et threat hunting
- **🛡️ Protection Proactive** : Rate limiting, WAF, DDoS protection
- **📊 Monitoring Temps Réel** : SIEM avec corrélation intelligente
- **⚖️ Conformité Réglementaire** : GDPR, PCI DSS, CCPA automatique

### **Architecture technique**
- **HSM (Hardware Security Module)** : Chiffrement et clés sécurisées
- **SIEM (Security Information Event Management)** : Corrélation temps réel
- **SOAR (Security Orchestration Automated Response)** : Réponse automatisée
- **WAF (Web Application Firewall)** : Protection applicative avancée
- **Threat Intelligence** : Feeds menaces globaux intégrés
- **Blockchain Audit** : Immutabilité des logs critiques

## 🔗 Relations avec autres modules
- **Utilisateurs** : Authentification, autorisation, sessions
- **Commandes** : Audit paiements, conformité PCI DSS
- **Analytics** : Métriques sécurité, alertes intelligentes
- **Notifications** : Alertes sécurité, incidents, maintenance
- **Tous modules** : Audit trail, monitoring, protection

---

# Authentification et autorisation

## 🔐 Niveaux d'accès sécuritaires

### Lecture audit basique
- **Scope** : `security:audit:read:basic`
- **Qui** : Organisateurs pour leurs propres données
- **Limitations** : Vue filtrée par organizer_id et actions limitées

### Administration sécurité organisateur
- **Scope** : `security:admin:organizer`
- **Qui** : Admins organisateurs, responsables sécurité
- **Fonctionnalités** : Gestion policies, audit avancé, incidents

### Administration sécurité plateforme
- **Scope** : `security:admin:platform`
- **Qui** : Super admins Entrix, équipe sécurité
- **Fonctionnalités** : Configuration globale, forensics, compliance

### Administration système critique
- **Scope** : `security:admin:system`
- **Qui** : DevSecOps, CISO, équipe sécurité avancée
- **Fonctionnalités** : HSM, SIEM, threat intelligence, incident response

## 🔑 Headers d'authentification sécurisés

```http
Authorization: Bearer [JWT_TOKEN]
X-Client-IP: [CLIENT_IP]              # IP réelle client (proxy-aware)
X-Device-Fingerprint: [FINGERPRINT]   # Empreinte appareil unique
X-Request-ID: [UUID]                  # Traçabilité requête
X-User-Agent: [USER_AGENT]            # User agent complet
X-Geo-Location: [LAT,LON]             # Géolocalisation si disponible
X-Risk-Score: [0-100]                 # Score risque calculé
```

---

# API Audit et traçabilité

## 📋 Journal d'audit global

### GET /api/v1/security/audit/logs
**Description** : Consultation logs d'audit avec filtrage avancé

#### Query Parameters
- `start_date` (string, optional) : Date début (ISO 8601)
- `end_date` (string, optional) : Date fin (ISO 8601)
- `user_id` (UUID, optional) : Filtrer par utilisateur
- `table_name` (string, optional) : Table concernée
- `action` (string, optional) : Type d'action
  - `CREATE`, `READ`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `EXPORT`, `IMPORT`
- `severity` (string, optional) : Niveau gravité
  - `LOW`, `STANDARD`, `HIGH`, `CRITICAL`
- `ip_address` (string, optional) : Adresse IP
- `page` (integer, optional) : Page résultats, default: 1
- `limit` (integer, optional) : Limite par page, default: 50

#### Response 200
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "audit_abc123",
        "user_id": "usr_xyz789",
        "user_email": "admin@organizer.com",
        "table_name": "orders",
        "record_id": "ord_def456",
        "action": "UPDATE",
        "old_values": {
          "status": "PENDING",
          "total_amount": 150.00
        },
        "new_values": {
          "status": "COMPLETED",
          "total_amount": 150.00,
          "updated_by": "usr_xyz789"
        },
        "ip_address": "41.230.55.42",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "severity": "STANDARD",
        "description": "Confirmation manuelle commande après échec paiement automatique",
        "metadata": {
          "context": {
            "module": "orders",
            "feature": "manual_completion",
            "version": "3.0.0"
          },
          "security": {
            "risk_score": 25,
            "anomaly_detected": false,
            "require_2fa": false
          },
          "business": {
            "order_amount": 150.00,
            "payment_method": "bank_transfer",
            "event_id": "evt_festival_001"
          },
          "compliance": {
            "gdpr_relevant": true,
            "retention_days": 2555,
            "data_classification": "sensitive"
          }
        },
        "created_at": "2024-03-31T14:23:45Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 23,
      "total_records": 1134,
      "limit": 50
    },
    "summary": {
      "total_logs": 1134,
      "by_action": {
        "CREATE": 456,
        "UPDATE": 389,
        "DELETE": 45,
        "LOGIN": 178,
        "EXPORT": 66
      },
      "by_severity": {
        "LOW": 234,
        "STANDARD": 767,
        "HIGH": 89,
        "CRITICAL": 44
      },
      "unique_users": 67,
      "unique_ips": 89
    }
  }
}
```

### POST /api/v1/security/audit/search
**Description** : Recherche avancée dans les logs d'audit

#### Request Body
```json
{
  "search_criteria": {
    "time_range": {
      "start": "2024-03-01T00:00:00Z",
      "end": "2024-03-31T23:59:59Z"
    },
    "filters": {
      "user_emails": ["admin@organizer.com", "manager@venue.tn"],
      "ip_ranges": ["41.230.0.0/16", "196.203.0.0/16"],
      "actions": ["DELETE", "EXPORT"],
      "tables": ["users", "orders", "payments"],
      "severity_min": "HIGH"
    },
    "search_text": "password change",
    "anomaly_detection": true
  },
  "output_format": {
    "include_metadata": true,
    "group_by": "user_id",
    "sort_by": "created_at",
    "sort_direction": "DESC"
  }
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "search_id": "search_abc123",
    "results": [
      {
        "user_group": "usr_xyz789",
        "user_email": "admin@organizer.com",
        "logs_count": 23,
        "risk_score_avg": 34.5,
        "severity_distribution": {
          "HIGH": 8,
          "STANDARD": 15
        },
        "actions_performed": ["UPDATE", "DELETE", "EXPORT"],
        "anomalies_detected": 2,
        "logs": [
          {
            "id": "audit_def456",
            "action": "UPDATE",
            "table_name": "users",
            "description": "Changement mot de passe utilisateur",
            "risk_score": 45,
            "anomaly_reason": "Changement password en dehors heures bureau",
            "created_at": "2024-03-30T23:45:12Z"
          }
        ]
      }
    ],
    "analytics": {
      "total_matches": 156,
      "anomalies_found": 12,
      "high_risk_actions": 34,
      "compliance_violations": 3,
      "geographic_distribution": {
        "tunisia": 89.5,
        "france": 7.2,
        "other": 3.3
      }
    }
  }
}
```

### GET /api/v1/security/audit/compliance-report
**Description** : Rapport conformité réglementaire automatisé

#### Query Parameters
- `regulation` (string, required) : Réglementation ciblée
  - `GDPR`, `PCI_DSS`, `CCPA`, `SOX`, `ISO27001`
- `period` (string, optional) : Période rapport, default: `current_month`
- `format` (string, optional) : Format export
  - `json`, `pdf`, `csv`, `xml`

#### Response 200
```json
{
  "success": true,
  "data": {
    "compliance_report": {
      "regulation": "GDPR",
      "report_period": {
        "start": "2024-03-01T00:00:00Z",
        "end": "2024-03-31T23:59:59Z",
        "duration_days": 31
      },
      "compliance_score": 97.8,
      "assessment": {
        "status": "COMPLIANT",
        "violations_count": 2,
        "warnings_count": 5,
        "recommendations_count": 8
      },
      "data_processing_activities": {
        "lawful_basis_documented": true,
        "consent_management": {
          "explicit_consents": 1247,
          "withdrawals": 23,
          "consent_rate": 94.7
        },
        "data_subject_rights": {
          "access_requests": 12,
          "deletion_requests": 8,
          "portability_requests": 3,
          "avg_response_time_hours": 18.5
        }
      },
      "technical_measures": {
        "encryption_at_rest": true,
        "encryption_in_transit": true,
        "access_controls": true,
        "audit_logging": true,
        "pseudonymization": true
      },
      "breach_incidents": {
        "total_incidents": 1,
        "reported_to_authority": 1,
        "notification_within_72h": true,
        "data_subjects_notified": true
      },
      "violations": [
        {
          "id": "violation_001",
          "severity": "MEDIUM",
          "article": "Article 32 - Security",
          "description": "Tentative accès non autorisé détectée mais bloquée",
          "remediation_status": "RESOLVED",
          "resolution_time_hours": 2.5
        }
      ],
      "recommendations": [
        {
          "priority": "HIGH",
          "category": "TECHNICAL",
          "description": "Implémenter chiffrement supplémentaire pour logs archivés",
          "estimated_effort": "MEDIUM",
          "deadline": "2024-04-15T00:00:00Z"
        }
      ]
    }
  }
}
```

---

# API Gestion des sessions

## 👤 Sessions utilisateurs actives

### GET /api/v1/security/sessions
**Description** : Liste des sessions utilisateurs actives

#### Query Parameters
- `user_id` (UUID, optional) : Filtrer par utilisateur
- `active_only` (boolean, optional) : Sessions actives uniquement, default: true
- `include_expired` (boolean, optional) : Inclure sessions expirées
- `suspicious_only` (boolean, optional) : Sessions suspectes uniquement

#### Response 200
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_abc123",
        "session_token": "sess_xyz789...",
        "user_id": "usr_def456",
        "user_email": "user@example.com",
        "ip_address": "41.230.55.42",
        "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        "device_fingerprint": "fp_mobile_ios_001",
        "geolocation": {
          "country": "Tunisia",
          "city": "Tunis",
          "latitude": 36.8065,
          "longitude": 10.1815,
          "accuracy": "city"
        },
        "is_active": true,
        "last_activity": "2024-03-31T19:45:23Z",
        "expires_at": "2024-04-07T14:23:45Z",
        "device_info": {
          "type": "MOBILE",
          "os": "iOS 17.0",
          "browser": "Safari",
          "is_trusted": true
        },
        "security_flags": {
          "risk_score": 15,
          "requires_2fa": false,
          "anomaly_detected": false,
          "geo_anomaly": false
        },
        "activity_summary": {
          "page_views": 234,
          "api_calls": 89,
          "last_endpoint": "/api/v1/events/search",
          "session_duration_minutes": 145
        },
        "created_at": "2024-03-31T14:23:45Z",
        "updated_at": "2024-03-31T19:45:23Z"
      }
    ],
    "summary": {
      "total_active_sessions": 156,
      "unique_users": 134,
      "suspicious_sessions": 3,
      "geographic_distribution": {
        "tunisia": 89.1,
        "france": 7.2,
        "other": 3.7
      },
      "device_distribution": {
        "mobile": 67.8,
        "desktop": 28.2,
        "tablet": 4.0
      }
    }
  }
}
```

### DELETE /api/v1/security/sessions/{session_id}
**Description** : Révocation forcée d'une session

#### Response 200
```json
{
  "success": true,
  "data": {
    "session_id": "session_abc123",
    "status": "REVOKED",
    "revoked_at": "2024-03-31T20:00:00Z",
    "reason": "ADMIN_FORCED_LOGOUT",
    "affected_user": "usr_def456"
  }
}
```

### POST /api/v1/security/sessions/bulk-revoke
**Description** : Révocation massive de sessions

#### Request Body
```json
{
  "criteria": {
    "user_ids": ["usr_abc123", "usr_def456"],
    "ip_ranges": ["192.168.1.0/24"],
    "risk_score_min": 75,
    "inactive_since": "2024-03-30T00:00:00Z",
    "device_types": ["UNKNOWN"]
  },
  "reason": "SECURITY_INCIDENT",
  "notify_users": true
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "revocation_id": "bulk_rev_001",
    "sessions_revoked": 23,
    "users_affected": 18,
    "notifications_sent": 18,
    "execution_time_ms": 1245
  }
}
```

---

# API Sécurité et monitoring

## 🚨 Événements de sécurité

### GET /api/v1/security/events
**Description** : Monitoring événements de sécurité en temps réel

#### Query Parameters
- `severity` (string, optional) : Niveau sévérité
  - `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `event_type` (string, optional) : Type événement
- `status` (string, optional) : Statut événement
  - `OPEN`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`
- `time_range` (string, optional) : Période, default: `24h`

#### Response 200
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "sec_event_001",
        "event_type": "SUSPICIOUS_LOGIN_PATTERN",
        "severity": "HIGH",
        "target_user_id": "usr_suspect_001",
        "ip_address": "192.168.100.45",
        "description": "Tentatives de connexion multiples depuis IP suspecte",
        "event_data": {
          "failed_attempts": 15,
          "time_window_minutes": 10,
          "user_agents": [
            "curl/7.68.0",
            "python-requests/2.28.0",
            "PostmanRuntime/7.32.0"
          ],
          "targeted_accounts": [
            "admin@organizer.com",
            "support@entrix.tn",
            "security@entrix.tn"
          ],
          "attack_pattern": "CREDENTIAL_STUFFING",
          "source_country": "Unknown",
          "threat_intelligence": {
            "known_malicious_ip": true,
            "botnet_association": "POSSIBLE",
            "reputation_score": 15
          }
        },
        "status": "INVESTIGATING",
        "severity_justification": "Patterns automatisés sur comptes admin",
        "automated_actions": [
          "IP_BLOCKED",
          "RATE_LIMIT_INCREASED",
          "ADMIN_NOTIFIED"
        ],
        "assigned_to": "security_analyst_001",
        "created_at": "2024-03-31T19:15:33Z",
        "updated_at": "2024-03-31T19:45:12Z",
        "resolved_at": null
      },
      {
        "id": "sec_event_002",
        "event_type": "DATA_EXPORT_ANOMALY",
        "severity": "MEDIUM",
        "target_user_id": "usr_organizer_456",
        "description": "Export données volume anormalement élevé",
        "event_data": {
          "export_size_mb": 250,
          "normal_avg_mb": 15,
          "anomaly_factor": 16.7,
          "exported_data_types": [
            "customer_emails",
            "order_history",
            "payment_details"
          ],
          "export_method": "API_BULK_DOWNLOAD",
          "time_of_day": "UNUSUAL_HOUR"
        },
        "status": "RESOLVED",
        "resolution_notes": "Export légitime pour campagne marketing validée",
        "created_at": "2024-03-31T02:45:22Z",
        "resolved_at": "2024-03-31T08:30:15Z"
      }
    ],
    "dashboard_metrics": {
      "total_events_24h": 45,
      "critical_events": 2,
      "high_events": 8,
      "automated_resolutions": 23,
      "false_positives": 6,
      "avg_resolution_time_minutes": 35,
      "open_investigations": 5
    },
    "threat_level": {
      "current_level": "ELEVATED",
      "trend": "INCREASING",
      "contributing_factors": [
        "Spike in credential stuffing attacks",
        "New botnet activity detected",
        "Festival season increased exposure"
      ]
    }
  }
}
```

### POST /api/v1/security/events/{event_id}/respond
**Description** : Action de réponse sur événement de sécurité

#### Request Body
```json
{
  "action": "BLOCK_IP_AND_ESCALATE",
  "response_details": {
    "block_duration_hours": 24,
    "escalation_level": "SENIOR_ANALYST",
    "additional_monitoring": true,
    "notify_stakeholders": ["CISO", "IT_DIRECTOR"]
  },
  "analyst_notes": "Patterns cohérents avec attaque coordonnée. Escalade recommandée.",
  "evidence_preserved": true
}
```

### GET /api/v1/security/threats/intelligence
**Description** : Intelligence sur menaces actuelles

#### Response 200
```json
{
  "success": true,
  "data": {
    "threat_landscape": {
      "current_threat_level": "MODERATE",
      "trending_attacks": [
        {
          "attack_type": "CREDENTIAL_STUFFING",
          "frequency_increase": "+45%",
          "target_industries": ["Entertainment", "E-commerce"],
          "mitigation_priority": "HIGH"
        },
        {
          "attack_type": "API_ABUSE",
          "frequency_increase": "+23%",
          "common_endpoints": ["/api/v1/users/login", "/api/v1/events/search"],
          "mitigation_priority": "MEDIUM"
        }
      ],
      "geographic_threats": {
        "high_risk_countries": ["CN", "RU", "IR"],
        "blocked_ip_ranges": 1247,
        "new_malicious_ips_24h": 89
      }
    },
    "platform_protection": {
      "waf_rules_active": 234,
      "rate_limits_triggered": 156,
      "suspicious_ips_blocked": 45,
      "protection_effectiveness": 98.7
    },
    "recommendations": [
      {
        "priority": "URGENT",
        "category": "AUTHENTICATION",
        "action": "Renforcer MFA sur comptes administrateurs",
        "justification": "Hausse tentatives sur comptes privilégiés"
      }
    ]
  }
}
```

---

# API Rate limiting et protection

## ⚡ Gestion des limites de débit

### GET /api/v1/security/rate-limits
**Description** : Monitoring des rate limits actifs

#### Query Parameters
- `identifier_type` (string, optional) : Type identifiant
  - `IP`, `USER`, `API_KEY`, `DEVICE`
- `blocked_only` (boolean, optional) : Uniquement les bloqués
- `endpoint` (string, optional) : Endpoint spécifique

#### Response 200
```json
{
  "success": true,
  "data": {
    "rate_limits": [
      {
        "id": "rl_001",
        "endpoint": "/api/v1/users/login",
        "identifier_type": "IP",
        "identifier_value": "41.230.55.42",
        "requests_count": 25,
        "limit_per_window": 10,
        "window_duration_minutes": 15,
        "window_start": "2024-03-31T19:45:00Z",
        "is_blocked": true,
        "blocked_since": "2024-03-31T19:52:30Z",
        "unblock_at": "2024-03-31T20:00:00Z",
        "block_reason": "EXCEEDED_LOGIN_ATTEMPTS",
        "auto_unblock": true,
        "metadata": {
          "user_agents": ["curl/7.68.0", "python-requests/2.28.0"],
          "failure_rate": 96.0,
          "geographic_location": "Unknown",
          "threat_score": 85
        }
      },
      {
        "id": "rl_002",
        "endpoint": "/api/v1/events/search",
        "identifier_type": "USER",
        "identifier_value": "usr_abc123",
        "requests_count": 890,
        "limit_per_window": 1000,
        "window_duration_minutes": 60,
        "window_start": "2024-03-31T19:00:00Z",
        "is_blocked": false,
        "usage_percentage": 89.0,
        "warning_threshold": 80.0,
        "alert_sent": true
      }
    ],
    "global_stats": {
      "total_active_limits": 1247,
      "currently_blocked": 45,
      "requests_blocked_24h": 12467,
      "protection_effectiveness": 97.8,
      "top_blocked_endpoints": [
        {
          "endpoint": "/api/v1/users/login",
          "blocks": 234
        },
        {
          "endpoint": "/api/v1/auth/password-reset",
          "blocks": 156
        }
      ]
    }
  }
}
```

### POST /api/v1/security/rate-limits/configure
**Description** : Configuration des limites de débit

#### Request Body
```json
{
  "rule_name": "Enhanced Login Protection",
  "endpoint_pattern": "/api/v1/users/login",
  "limits": {
    "by_ip": {
      "requests_per_window": 5,
      "window_minutes": 15,
      "block_duration_minutes": 30
    },
    "by_user": {
      "requests_per_window": 10,
      "window_minutes": 60,
      "block_duration_minutes": 60
    },
    "global": {
      "requests_per_second": 100,
      "burst_tolerance": 150
    }
  },
  "conditions": {
    "apply_if_failed_auth": true,
    "ignore_trusted_ips": true,
    "escalate_on_repeated_blocks": true
  },
  "actions": {
    "block_ip": true,
    "require_captcha": true,
    "alert_security_team": true,
    "log_detailed_info": true
  }
}
```

### DELETE /api/v1/security/rate-limits/{limit_id}/unblock
**Description** : Déblocage manuel d'une limite

#### Request Body
```json
{
  "reason": "FALSE_POSITIVE_IDENTIFIED",
  "analyst_id": "analyst_001",
  "notes": "Trafic légitime d'API testing, whitelist temporaire appliquée"
}
```

---

# API Authentification multi-facteurs

## 🔐 Gestion MFA avancée

### GET /api/v1/security/mfa/tokens
**Description** : Gestion tokens MFA actifs

#### Query Parameters
- `user_id` (UUID, optional) : Filtrer par utilisateur
- `method` (string, optional) : Méthode MFA
  - `TOTP`, `SMS`, `EMAIL`, `PUSH`
- `expired` (boolean, optional) : Inclure tokens expirés

#### Response 200
```json
{
  "success": true,
  "data": {
    "mfa_tokens": [
      {
        "id": "mfa_abc123",
        "user_id": "usr_def456",
        "method": "TOTP",
        "token_hash": "sha256:abc123...",
        "expires_at": "2024-03-31T20:30:00Z",
        "is_used": false,
        "attempts_count": 0,
        "max_attempts": 3,
        "generated_for": "LOGIN_VERIFICATION",
        "device_binding": {
          "device_fingerprint": "fp_mobile_001",
          "trusted_device": true
        },
        "metadata": {
          "generation_context": "HIGH_RISK_LOGIN",
          "ip_address": "41.230.55.42",
          "user_agent": "Mobile App iOS"
        },
        "created_at": "2024-03-31T20:00:00Z"
      }
    ],
    "mfa_statistics": {
      "total_active_tokens": 67,
      "success_rate_24h": 94.7,
      "most_used_method": "TOTP",
      "avg_validation_time_seconds": 12.5,
      "failed_verifications": 23
    }
  }
}
```

### POST /api/v1/security/mfa/generate
**Description** : Génération token MFA

#### Request Body
```json
{
  "user_id": "usr_abc123",
  "method": "TOTP",
  "context": "HIGH_RISK_LOGIN",
  "device_info": {
    "device_fingerprint": "fp_desktop_001",
    "ip_address": "41.230.55.42",
    "user_agent": "Mozilla/5.0..."
  },
  "expiry_minutes": 5,
  "max_attempts": 3
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "mfa_token_id": "mfa_xyz789",
    "method": "TOTP",
    "delivery_confirmation": true,
    "expires_at": "2024-03-31T20:35:00Z",
    "qr_code_url": "https://api.entrix.tn/v1/mfa/qr/xyz789.png",
    "backup_codes": [
      "BACKUP-001-ABC",
      "BACKUP-002-DEF"
    ],
    "instructions": "Scannez le QR code avec votre app authenticator"
  }
}
```

### POST /api/v1/security/mfa/verify
**Description** : Vérification token MFA

#### Request Body
```json
{
  "mfa_token_id": "mfa_xyz789",
  "code": "123456",
  "device_info": {
    "device_fingerprint": "fp_desktop_001",
    "remember_device": true
  }
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "verification_status": "SUCCESS",
    "token_consumed": true,
    "device_trusted": true,
    "trust_duration_days": 30,
    "next_mfa_required": false,
    "session_elevated": true
  }
}
```

---

# API Conformité réglementaire

## ⚖️ Gestion conformité GDPR/PCI DSS

### GET /api/v1/security/compliance/gdpr/status
**Description** : Statut conformité GDPR en temps réel

#### Response 200
```json
{
  "success": true,
  "data": {
    "compliance_overview": {
      "overall_score": 97.8,
      "status": "COMPLIANT",
      "last_assessment": "2024-03-30T00:00:00Z",
      "next_assessment": "2024-04-30T00:00:00Z"
    },
    "data_protection_measures": {
      "lawful_basis": {
        "documented": true,
        "consent_management": {
          "active_consents": 15672,
          "opt_out_rate": 2.3,
          "consent_renewal_rate": 89.4
        }
      },
      "data_subject_rights": {
        "access_requests_pending": 3,
        "deletion_requests_pending": 1,
        "avg_response_time_hours": 18.5,
        "compliance_rate": 100.0
      },
      "technical_safeguards": {
        "encryption_at_rest": true,
        "encryption_in_transit": true,
        "pseudonymization": true,
        "access_controls": true,
        "audit_logging": true
      }
    },
    "breach_management": {
      "incidents_ytd": 1,
      "dpa_notifications": 1,
      "notification_timeliness": true,
      "avg_containment_time_hours": 2.5
    },
    "recent_activities": [
      {
        "type": "DATA_SUBJECT_REQUEST",
        "request_type": "ACCESS",
        "processed_at": "2024-03-30T14:23:00Z",
        "response_time_hours": 16.5,
        "status": "COMPLETED"
      }
    ],
    "recommendations": [
      {
        "priority": "MEDIUM",
        "category": "DOCUMENTATION",
        "description": "Mettre à jour registre traitements Q2 2024",
        "deadline": "2024-06-30T00:00:00Z"
      }
    ]
  }
}
```

### GET /api/v1/security/compliance/pci-dss/status
**Description** : Statut conformité PCI DSS

#### Response 200
```json
{
  "success": true,
  "data": {
    "pci_compliance": {
      "level": "LEVEL_1",
      "certification_valid_until": "2024-12-31T23:59:59Z",
      "last_audit": "2024-01-15T00:00:00Z",
      "next_audit": "2025-01-15T00:00:00Z"
    },
    "requirements_status": {
      "req_1_firewall": "COMPLIANT",
      "req_2_passwords": "COMPLIANT", 
      "req_3_cardholder_data": "COMPLIANT",
      "req_4_encryption": "COMPLIANT",
      "req_5_antivirus": "COMPLIANT",
      "req_6_secure_systems": "COMPLIANT",
      "req_7_access_control": "COMPLIANT",
      "req_8_unique_ids": "COMPLIANT",
      "req_9_physical_access": "COMPLIANT",
      "req_10_monitoring": "COMPLIANT",
      "req_11_testing": "COMPLIANT",
      "req_12_policy": "COMPLIANT"
    },
    "tokenization_metrics": {
      "cards_tokenized_24h": 89,
      "tokenization_success_rate": 99.8,
      "vault_availability": 100.0,
      "hsm_status": "OPERATIONAL"
    },
    "security_testing": {
      "last_penetration_test": "2024-03-01T00:00:00Z",
      "vulnerability_scan_schedule": "WEEKLY",
      "last_vulnerability_scan": "2024-03-30T02:00:00Z",
      "critical_vulnerabilities": 0,
      "high_vulnerabilities": 2
    }
  }
}
```

### POST /api/v1/security/compliance/data-subject-request
**Description** : Traitement demande sujet de données GDPR

#### Request Body
```json
{
  "request_type": "ACCESS",
  "subject_email": "user@example.com",
  "subject_phone": "+21612345678",
  "verification_method": "EMAIL_PHONE",
  "request_details": {
    "data_categories": ["PERSONAL", "TRANSACTIONAL", "BEHAVIORAL"],
    "time_range": {
      "start": "2023-01-01T00:00:00Z",
      "end": "2024-03-31T23:59:59Z"
    },
    "format_preference": "JSON",
    "delivery_method": "SECURE_DOWNLOAD"
  },
  "requester_info": {
    "relationship": "DATA_SUBJECT",
    "identification_provided": true,
    "legal_basis": "GDPR_ARTICLE_15"
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "request_id": "dsr_abc123",
    "status": "PROCESSING",
    "verification_required": true,
    "verification_token": "verify_xyz789",
    "estimated_completion": "2024-04-02T17:00:00Z",
    "legal_deadline": "2024-04-30T23:59:59Z",
    "processing_steps": [
      {
        "step": "IDENTITY_VERIFICATION",
        "status": "PENDING",
        "required_action": "Vérifier email et téléphone"
      },
      {
        "step": "DATA_COLLECTION",
        "status": "WAITING",
        "estimated_duration": "2-4 hours"
      },
      {
        "step": "DATA_REVIEW",
        "status": "WAITING",
        "estimated_duration": "1-2 hours"
      },
      {
        "step": "DELIVERY",
        "status": "WAITING",
        "estimated_duration": "30 minutes"
      }
    ]
  }
}
```

---

# API Politiques de sécurité

## 📋 Configuration politiques

### GET /api/v1/security/policies
**Description** : Liste des politiques de sécurité actives

#### Response 200
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "id": "policy_001",
        "code": "PASSWORD_POLICY_STRONG",
        "name": "Politique de mots de passe renforcée",
        "description": "Exigences strictes pour mots de passe utilisateurs",
        "policy_type": "AUTHENTICATION",
        "rules": {
          "password_policy": {
            "min_length": 12,
            "require_uppercase": true,
            "require_lowercase": true,
            "require_numbers": true,
            "require_symbols": true,
            "max_age_days": 90,
            "prevent_reuse_count": 5,
            "lockout_threshold": 3,
            "complexity_check": true
          }
        },
        "valid_from": "2024-01-01T00:00:00Z",
        "valid_until": null,
        "is_active": true,
        "is_enforced": true,
        "scope": "GLOBAL",
        "affected_users": 15672,
        "compliance_level": "HIGH"
      },
      {
        "id": "policy_002",
        "code": "SESSION_MANAGEMENT_SECURE",
        "name": "Gestion sécurisée des sessions",
        "policy_type": "SESSION",
        "rules": {
          "session_policy": {
            "max_concurrent_sessions": 3,
            "idle_timeout_minutes": 30,
            "absolute_timeout_hours": 8,
            "require_2fa_for_admin": true,
            "ip_binding": true,
            "device_fingerprinting": true
          }
        },
        "is_active": true,
        "is_enforced": true
      }
    ],
    "policy_summary": {
      "total_policies": 12,
      "active_policies": 11,
      "enforced_policies": 9,
      "compliance_score": 94.7
    }
  }
}
```

### POST /api/v1/security/policies
**Description** : Création nouvelle politique de sécurité

#### Request Body
```json
{
  "code": "API_RATE_LIMITING_ENHANCED",
  "name": "Rate limiting API renforcé",
  "description": "Protection avancée contre les abus API",
  "policy_type": "RATE_LIMITING",
  "rules": {
    "rate_limiting": {
      "default_limits": {
        "requests_per_minute": 60,
        "burst_allowance": 10
      },
      "endpoint_specific": {
        "/api/v1/users/login": {
          "requests_per_minute": 5,
          "window_minutes": 15,
          "block_duration_minutes": 30
        },
        "/api/v1/events/search": {
          "requests_per_minute": 120,
          "authenticated_bonus": 1.5
        }
      },
      "escalation_rules": {
        "repeated_violations": {
          "threshold": 3,
          "escalation_factor": 2.0,
          "max_block_duration_hours": 24
        }
      }
    }
  },
  "scope": "GLOBAL",
  "valid_from": "2024-04-01T00:00:00Z",
  "is_active": true,
  "is_enforced": true
}
```

### PUT /api/v1/security/policies/{policy_id}/enforce
**Description** : Activation forcée d'une politique

#### Request Body
```json
{
  "enforcement_mode": "STRICT",
  "grace_period_hours": 24,
  "notification_required": true,
  "rollback_conditions": {
    "error_rate_threshold": 5.0,
    "performance_impact_threshold": 10.0
  }
}
```

---

# API Incidents et réponse

## 🚨 Gestion incidents de sécurité

### GET /api/v1/security/incidents
**Description** : Liste des incidents de sécurité

#### Query Parameters
- `severity` (string, optional) : Niveau sévérité
- `status` (string, optional) : Statut incident
- `assigned_to` (string, optional) : Assigné à analyste

#### Response 200
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "id": "incident_001",
        "title": "Tentative d'intrusion coordonnée",
        "description": "Détection d'attaque par force brute sur multiples comptes admin",
        "severity": "HIGH",
        "category": "CREDENTIAL_ATTACK",
        "status": "INVESTIGATING",
        "created_at": "2024-03-31T18:30:00Z",
        "detected_by": "AUTOMATED_SYSTEM",
        "assigned_to": "security_analyst_002",
        "affected_systems": [
          "Authentication API",
          "Admin Portal",
          "User Management"
        ],
        "impact_assessment": {
          "confidentiality": "MEDIUM",
          "integrity": "LOW", 
          "availability": "LOW",
          "business_impact": "MEDIUM"
        },
        "timeline": [
          {
            "timestamp": "2024-03-31T18:30:00Z",
            "event": "DETECTION",
            "description": "SIEM alerte déclenchée - tentatives login multiples"
          },
          {
            "timestamp": "2024-03-31T18:32:15Z",
            "event": "CONTAINMENT",
            "description": "IP sources bloquées automatiquement"
          },
          {
            "timestamp": "2024-03-31T18:45:00Z",
            "event": "INVESTIGATION_START",
            "description": "Analyste assigné, investigation démarrée"
          }
        ],
        "indicators": {
          "compromised_accounts": 0,
          "suspicious_ips": 15,
          "failed_login_attempts": 1247,
          "attack_duration_minutes": 45
        },
        "response_actions": [
          {
            "action": "BLOCK_IP_RANGE",
            "status": "COMPLETED",
            "timestamp": "2024-03-31T18:32:15Z"
          },
          {
            "action": "FORCE_PASSWORD_RESET",
            "status": "IN_PROGRESS",
            "target": "Comptes ciblés"
          },
          {
            "action": "NOTIFY_STAKEHOLDERS",
            "status": "COMPLETED",
            "recipients": ["CISO", "IT_DIRECTOR"]
          }
        ]
      }
    ],
    "incident_metrics": {
      "total_incidents_ytd": 45,
      "critical_incidents": 2,
      "avg_resolution_time_hours": 4.2,
      "false_positive_rate": 8.9,
      "open_incidents": 3
    }
  }
}
```

### POST /api/v1/security/incidents
**Description** : Déclaration nouvel incident

#### Request Body
```json
{
  "title": "Data exfiltration suspected",
  "description": "Unusual data access patterns detected",
  "severity": "HIGH",
  "category": "DATA_BREACH",
  "reporter": "security_analyst_001",
  "affected_systems": ["Database", "API Gateway"],
  "initial_evidence": {
    "suspicious_queries": 15,
    "data_volume_gb": 2.5,
    "unusual_access_time": "03:00:00Z"
  },
  "immediate_actions": [
    "ISOLATE_AFFECTED_SYSTEMS",
    "PRESERVE_EVIDENCE",
    "NOTIFY_DPO"
  ]
}
```

### POST /api/v1/security/incidents/{incident_id}/playbook
**Description** : Exécution playbook de réponse automatisé

#### Request Body
```json
{
  "playbook_id": "data_breach_response_v2",
  "execution_mode": "AUTOMATED",
  "parameters": {
    "severity_level": "HIGH",
    "data_classification": "SENSITIVE",
    "notification_required": true,
    "containment_aggressive": true
  }
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "playbook_execution_id": "exec_abc123",
    "status": "RUNNING",
    "steps_total": 15,
    "steps_completed": 3,
    "estimated_completion": "2024-03-31T20:15:00Z",
    "current_step": {
      "step_id": 4,
      "description": "Isolation des systèmes affectés",
      "status": "IN_PROGRESS",
      "started_at": "2024-03-31T19:45:30Z"
    },
    "completed_actions": [
      "Evidence preservation initiated",
      "Stakeholders notified",
      "Legal team contacted"
    ]
  }
}
```

---

# API Administration système

## ⚙️ Configuration système avancée

### GET /api/v1/security/admin/system-health
**Description** : Santé système sécurité (Admin uniquement)

#### Headers
```http
Authorization: Bearer [ADMIN_TOKEN]
X-Admin-Level: system
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "security_health": {
      "overall_score": 94.7,
      "status": "HEALTHY",
      "last_assessment": "2024-03-31T19:50:00Z"
    },
    "protection_systems": {
      "waf": {
        "status": "OPERATIONAL",
        "rules_active": 1247,
        "requests_blocked_24h": 567,
        "false_positive_rate": 0.8
      },
      "ids_ips": {
        "status": "OPERATIONAL",
        "signatures_current": 45672,
        "last_update": "2024-03-31T12:00:00Z",
        "alerts_24h": 89
      },
      "siem": {
        "status": "OPERATIONAL",
        "events_processed_24h": 156789,
        "correlation_rules": 234,
        "false_positive_rate": 3.2
      }
    },
    "encryption_status": {
      "hsm_availability": 100.0,
      "key_rotation_status": "ON_SCHEDULE",
      "certificates_expiring_30d": 2,
      "tls_versions": {
        "tls_1_3": 89.5,
        "tls_1_2": 10.5,
        "deprecated": 0.0
      }
    },
    "compliance_monitoring": {
      "gdpr_compliance": 97.8,
      "pci_dss_compliance": 98.9,
      "iso27001_compliance": 96.4,
      "last_audit": "2024-02-15T00:00:00Z"
    },
    "performance_impact": {
      "security_overhead_ms": 12.5,
      "throughput_impact": 2.3,
      "availability": 99.97
    }
  }
}
```

### POST /api/v1/security/admin/emergency-lockdown
**Description** : Verrouillage d'urgence système

#### Request Body
```json
{
  "lockdown_type": "PARTIAL",
  "scope": {
    "block_new_logins": true,
    "terminate_suspicious_sessions": true,
    "enable_enhanced_monitoring": true,
    "restrict_admin_access": false
  },
  "duration_minutes": 60,
  "reason": "SUSPECTED_BREACH",
  "authorization": {
    "incident_id": "incident_001",
    "authorized_by": "CISO",
    "emergency_code": "LOCKDOWN-ALPHA-2024"
  }
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "lockdown_id": "lockdown_001",
    "status": "ACTIVE",
    "activated_at": "2024-03-31T20:00:00Z",
    "expires_at": "2024-03-31T21:00:00Z",
    "affected_systems": [
      "Authentication Service",
      "Session Management", 
      "API Gateway"
    ],
    "impact_summary": {
      "sessions_terminated": 23,
      "logins_blocked": 45,
      "alerts_escalated": 12
    }
  }
}
```

---

# Codes d'erreur

## 📋 Codes d'erreur spécifiques

| Code | Message | Description |
|------|---------|-------------|
| `S001` | Insufficient security permissions | Permissions sécurité insuffisantes |
| `S002` | Session expired or invalid | Session expirée ou invalide |
| `S003` | MFA verification required | Vérification MFA requise |
| `S004` | IP address blocked | Adresse IP bloquée |
| `S005` | Rate limit exceeded | Limite de débit dépassée |
| `S006` | Suspicious activity detected | Activité suspecte détectée |
| `S007` | Security policy violation | Violation politique sécurité |
| `S008` | Audit log access denied | Accès logs audit refusé |
| `S009` | Compliance check failed | Vérification conformité échouée |
| `S010` | Emergency lockdown active | Verrouillage d'urgence actif |
| `S011` | Encryption key unavailable | Clé chiffrement indisponible |
| `S012` | Invalid security token | Token sécurité invalide |
| `S013` | Geolocation verification failed | Vérification géolocalisation échouée |
| `S014` | Device not trusted | Appareil non approuvé |
| `S015` | Incident response active | Réponse incident en cours |

---

# Exemples d'usage

## 🔐 Cas d'usage typiques

### 1. Monitoring sécurité quotidien

```bash
# Dashboard sécurité global
curl -G "https://api.entrix.tn/v1/security/admin/system-health" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "X-Admin-Level: system"

# Événements sécurité récents
curl -G "https://api.entrix.tn/v1/security/events" \
  -H "Authorization: Bearer $TOKEN" \
  -d "severity=HIGH,CRITICAL" \
  -d "time_range=24h" \
  -d "status=OPEN"

# Sessions suspectes
curl -G "https://api.entrix.tn/v1/security/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -d "suspicious_only=true"
```

### 2. Investigation incident sécurité

```bash
# Recherche audit logs pour incident
curl -X POST "https://api.entrix.tn/v1/security/audit/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "search_criteria": {
      "time_range": {
        "start": "2024-03-31T18:00:00Z",
        "end": "2024-03-31T20:00:00Z"
      },
      "filters": {
        "ip_ranges": ["192.168.100.0/24"],
        "actions": ["LOGIN", "DELETE", "EXPORT"],
        "severity_min": "HIGH"
      },
      "anomaly_detection": true
    }
  }'

# Déclaration incident
curl -X POST "https://api.entrix.tn/v1/security/incidents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Suspicious admin access pattern",
    "severity": "HIGH",
    "category": "UNAUTHORIZED_ACCESS",
    "affected_systems": ["Admin Portal"],
    "immediate_actions": ["ISOLATE_AFFECTED_SYSTEMS"]
  }'
```

### 3. Gestion conformité GDPR

```bash
# Statut conformité GDPR
curl -G "https://api.entrix.tn/v1/security/compliance/gdpr/status" \
  -H "Authorization: Bearer $TOKEN"

# Traitement demande sujet données
curl -X POST "https://api.entrix.tn/v1/security/compliance/data-subject-request" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "request_type": "DELETION",
    "subject_email": "user@example.com",
    "verification_method": "EMAIL_PHONE",
    "request_details": {
      "data_categories": ["ALL"],
      "immediate_processing": true
    }
  }'
```

### 4. Configuration rate limiting

```bash
# Monitoring rate limits actuels
curl -G "https://api.entrix.tn/v1/security/rate-limits" \
  -H "Authorization: Bearer $TOKEN" \
  -d "blocked_only=true"

# Configuration nouvelle règle
curl -X POST "https://api.entrix.tn/v1/security/rate-limits/configure" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "API Protection Enhanced",
    "endpoint_pattern": "/api/v1/events/search",
    "limits": {
      "by_ip": {
        "requests_per_window": 100,
        "window_minutes": 60
      },
      "by_user": {
        "requests_per_window": 500,
        "window_minutes": 60
      }
    },
    "actions": {
      "require_captcha": true,
      "alert_security_team": true
    }
  }'
```

### 5. Gestion MFA et authentification

```bash
# Génération token MFA
curl -X POST "https://api.entrix.tn/v1/security/mfa/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "usr_abc123",
    "method": "TOTP",
    "context": "HIGH_RISK_LOGIN",
    "expiry_minutes": 5
  }'

# Vérification MFA
curl -X POST "https://api.entrix.tn/v1/security/mfa/verify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mfa_token_id": "mfa_xyz789",
    "code": "123456",
    "device_info": {
      "device_fingerprint": "fp_desktop_001",
      "remember_device": true
    }
  }'
```

### 6. Révocation sessions et réponse incident

```bash
# Révocation massive sessions suspectes
curl -X POST "https://api.entrix.tn/v1/security/sessions/bulk-revoke" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "criteria": {
      "risk_score_min": 75,
      "device_types": ["UNKNOWN"]
    },
    "reason": "SECURITY_INCIDENT",
    "notify_users": true
  }'

# Exécution playbook réponse incident
curl -X POST "https://api.entrix.tn/v1/security/incidents/incident_001/playbook" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playbook_id": "credential_stuffing_response",
    "execution_mode": "AUTOMATED",
    "parameters": {
      "severity_level": "HIGH",
      "containment_aggressive": true
    }
  }'
```

---

## 🎯 Notes d'implémentation

### Sécurité et chiffrement
- **HSM intégré** : Clés critiques stockées en Hardware Security Module
- **Chiffrement quantum-resistant** : Algorithmes résistants ordinateurs quantiques
- **Zero Trust** : Vérification continue, jamais de confiance implicite
- **Defense in depth** : Multiples couches de protection

### Performance et disponibilité
- **SIEM temps réel** : Corrélation événements sub-seconde
- **Cache sécurisé** : Redis avec chiffrement pour sessions/tokens
- **Réplication géographique** : Logs audit répliqués multi-sites
- **Failover automatique** : Bascule automatique systèmes critiques

### Conformité et audit
- **Immutabilité logs** : Blockchain pour logs critiques
- **Rétention adaptative** : Durées selon classification données
- **Anonymisation automatique** : GDPR compliance by design
- **Reporting automatisé** : Rapports conformité générés automatiquement