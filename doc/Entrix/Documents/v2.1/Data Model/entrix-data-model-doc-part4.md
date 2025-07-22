# Documentation Exhaustive du Modèle de Données Entrix V2.1
## Partie 4 : Module Sécurité et Audit

---

## 📋 Table des Matières - Partie 4

1. [Module Audit et Traçabilité](#module-audit)
2. [Module Sécurité et Sessions](#module-securite)
3. [Module Contrôle d'Accès](#module-controle)
4. [Module Liste Noire et Restrictions](#module-blacklist)
5. [Relations et Politiques de Sécurité](#relations-securite)

---

## 📝 Module Audit et Traçabilité {#module-audit}

### Table `audit_logs` - Journal d'audit

**Description** : Enregistrement exhaustif de toutes les actions critiques effectuées dans le système pour conformité et sécurité.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `user_id` | UUID | NULL, FK | - | Utilisateur acteur |
| `session_id` | UUID | NULL, FK | - | Session utilisateur |
| `table_name` | VARCHAR(100) | NOT NULL | - | Table impactée |
| `record_id` | UUID | NULL | - | ID enregistrement |
| `action` | ENUM | NOT NULL | - | Type d'action |
| `old_values` | JSONB | NULL | - | Valeurs avant |
| `new_values` | JSONB | NULL | - | Valeurs après |
| `changed_fields` | TEXT[] | NULL | - | Champs modifiés |
| `ip_address` | INET | NULL | - | Adresse IP |
| `user_agent` | TEXT | NULL | - | User agent |
| `request_id` | VARCHAR(100) | NULL | - | ID requête HTTP |
| `request_method` | VARCHAR(10) | NULL | - | GET, POST, etc. |
| `request_path` | TEXT | NULL | - | Chemin API |
| `response_code` | INTEGER | NULL | - | Code HTTP réponse |
| `duration_ms` | INTEGER | NULL | - | Durée traitement |
| `error_message` | TEXT | NULL | - | Message erreur |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date action |

#### Valeurs ENUM `action`

- `CREATE` : Création
- `READ` : Lecture
- `UPDATE` : Modification
- `DELETE` : Suppression
- `LOGIN` : Connexion
- `LOGOUT` : Déconnexion
- `EXPORT` : Export données
- `IMPORT` : Import données
- `AUTHORIZE` : Autorisation
- `DENY` : Refus accès

#### Structure JSONB `metadata`

```json
{
  "context": {
    "module": "ticketing",
    "feature": "transfer_ticket",
    "version": "2.1.0"
  },
  "security": {
    "risk_score": 15,
    "anomaly_detected": false,
    "require_2fa": false
  },
  "business": {
    "order_amount": 443.60,
    "ticket_count": 2,
    "event_id": "789e01cd-k23h-78i9-g012-082170730666"
  },
  "compliance": {
    "gdpr_relevant": true,
    "retention_days": 2555,
    "data_classification": "sensitive"
  }
}
```

#### Exemple de record complet - Modification sensible

```json
{
  "id": "123a45bc-d67e-89f0-1234-567890123456",
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "session_id": "456b78cd-e90f-1234-5678-901234567890",
  "table_name": "organizers",
  "record_id": "d7e6f5g4-c3b2-1a0f-9e8d-7c6b5a4c3d2e",
  "action": "UPDATE",
  "old_values": {
    "commission_rate": 0.1000,
    "payment_delay_days": 15
  },
  "new_values": {
    "commission_rate": 0.0800,
    "payment_delay_days": 7
  },
  "changed_fields": ["commission_rate", "payment_delay_days"],
  "ip_address": "41.230.145.67",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "request_id": "req_abc123def456",
  "request_method": "PUT",
  "request_path": "/api/v1/organizers/d7e6f5g4-c3b2-1a0f-9e8d-7c6b5a4c3d2e",
  "response_code": 200,
  "duration_ms": 145,
  "error_message": null,
  "metadata": {
    "context": {
      "module": "admin",
      "feature": "organizer_management",
      "admin_note": "Négociation contrat 2025 - taux préférentiel"
    },
    "security": {
      "required_approval": true,
      "approved_by": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
    },
    "business": {
      "annual_impact": -45678.90,
      "currency": "TND"
    }
  },
  "created_at": "2025-01-07T14:30:45+01:00"
}
```

#### Exemple de record complet - Tentative d'accès non autorisé

```json
{
  "id": "234b56cd-e78f-90ab-2345-678901234567",
  "user_id": "xxx-xxx-xxx",
  "session_id": null,
  "table_name": "payments",
  "record_id": null,
  "action": "DENY",
  "old_values": null,
  "new_values": null,
  "changed_fields": null,
  "ip_address": "197.28.xxx.xxx",
  "user_agent": "curl/7.68.0",
  "request_id": "req_xyz789ghi012",
  "request_method": "GET",
  "request_path": "/api/v1/payments/export?all=true",
  "response_code": 403,
  "duration_ms": 12,
  "error_message": "Insufficient permissions: EXPORT_ALL_PAYMENTS",
  "metadata": {
    "security": {
      "threat_level": "high",
      "pattern": "data_scraping_attempt",
      "blocked": true,
      "alert_sent": true
    },
    "rate_limit": {
      "requests_in_window": 150,
      "limit": 100,
      "window": "1h"
    }
  },
  "created_at": "2025-01-07T15:45:12+01:00"
}
```

---

## 🔐 Module Sécurité et Sessions {#module-securite}

### Table `user_sessions` - Sessions utilisateurs

**Description** : Gestion des sessions actives avec tracking complet pour sécurité et analytics.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `user_id` | UUID | NOT NULL, FK | - | Utilisateur |
| `session_token` | VARCHAR(255) | UNIQUE, NOT NULL | - | Token session |
| `refresh_token` | VARCHAR(255) | UNIQUE | - | Token rafraîchissement |
| `device_id` | VARCHAR(100) | NULL | - | ID appareil |
| `device_type` | VARCHAR(50) | NULL | - | Type appareil |
| `device_name` | VARCHAR(100) | NULL | - | Nom appareil |
| `ip_address` | INET | NOT NULL | - | IP connexion |
| `user_agent` | TEXT | NULL | - | User agent |
| `location` | JSONB | NULL | - | Géolocalisation |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Session active |
| `last_activity` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière activité |
| `expires_at` | TIMESTAMPTZ | NOT NULL | - | Expiration session |
| `terminated_at` | TIMESTAMPTZ | NULL | - | Fin session |
| `termination_reason` | VARCHAR(50) | NULL | - | Raison fin |
| `security_flags` | JSONB | NULL | - | Alertes sécurité |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Début session |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Structure JSONB `location`

```json
{
  "ip_location": {
    "country": "TN",
    "country_name": "Tunisia",
    "region": "Tunis",
    "city": "Tunis",
    "latitude": 36.8065,
    "longitude": 10.1815,
    "isp": "Tunisie Telecom"
  },
  "gps_location": {
    "latitude": 36.8064,
    "longitude": 10.1817,
    "accuracy": 10,
    "timestamp": "2025-01-07T16:00:00Z"
  }
}
```

#### Structure JSONB `security_flags`

```json
{
  "risk_indicators": {
    "new_device": true,
    "new_location": false,
    "vpn_detected": false,
    "tor_detected": false,
    "multiple_accounts": false
  },
  "authentication": {
    "method": "password",
    "2fa_used": true,
    "2fa_method": "sms",
    "password_age_days": 45
  },
  "anomalies": {
    "rapid_location_change": false,
    "unusual_time": false,
    "suspicious_pattern": false
  }
}
```

#### Exemple de record complet

```json
{
  "id": "567c89de-f01a-2345-6789-012345678901",
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "session_token": "sess_2025_f47ac10b_1a2b3c4d5e6f7g8h9i0j",
  "refresh_token": "rfsh_2025_f47ac10b_9i8h7g6f5e4d3c2b1a0",
  "device_id": "ios_6B9E5C41-7B5A-4F93-B4C6-8D9E7F123456",
  "device_type": "mobile",
  "device_name": "iPhone 15 Pro de Mohamed",
  "ip_address": "41.230.145.67",
  "user_agent": "Entrix/3.2.1 (iOS 17.2; iPhone15,2)",
  "location": {
    "ip_location": {
      "country": "TN",
      "city": "Tunis",
      "isp": "Tunisie Telecom"
    },
    "gps_location": {
      "latitude": 36.8064,
      "longitude": 10.1817,
      "accuracy": 10
    }
  },
  "is_active": true,
  "last_activity": "2025-01-07T16:30:00+01:00",
  "expires_at": "2025-01-14T16:00:00+01:00",
  "terminated_at": null,
  "termination_reason": null,
  "security_flags": {
    "risk_indicators": {
      "new_device": false,
      "vpn_detected": false
    },
    "authentication": {
      "method": "password",
      "2fa_used": true,
      "2fa_method": "sms"
    }
  },
  "metadata": {
    "app_version": "3.2.1",
    "os_version": "iOS 17.2",
    "push_token": "ExponentPushToken[xxxxxxxxxxxxxx]",
    "preferences": {
      "notifications": true,
      "biometric_enabled": true
    }
  },
  "created_at": "2025-01-07T16:00:00+01:00",
  "updated_at": "2025-01-07T16:30:00+01:00"
}
```

### Table `login_attempts` - Tentatives de connexion

**Description** : Journal de toutes les tentatives de connexion pour détection de fraude et brute force.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `email` | VARCHAR(255) | NOT NULL | - | Email tenté |
| `user_id` | UUID | NULL, FK | - | Utilisateur (si trouvé) |
| `success` | BOOLEAN | NOT NULL | - | Succès connexion |
| `failure_reason` | VARCHAR(100) | NULL | - | Raison échec |
| `ip_address` | INET | NOT NULL | - | IP tentative |
| `user_agent` | TEXT | NULL | - | User agent |
| `device_fingerprint` | VARCHAR(255) | NULL | - | Empreinte appareil |
| `location` | JSONB | NULL | - | Géolocalisation |
| `risk_score` | INTEGER | NULL | - | Score risque (0-100) |
| `is_blocked` | BOOLEAN | DEFAULT FALSE | FALSE | Tentative bloquée |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date tentative |

#### Exemple de record complet - Échec suspect

```json
{
  "id": "678d90ef-a12b-3456-7890-123456789012",
  "email": "mohamed.benali@gmail.com",
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "success": false,
  "failure_reason": "INVALID_PASSWORD",
  "ip_address": "197.28.145.67",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "device_fingerprint": "fp_windows_chrome_197281456",
  "location": {
    "country": "TN",
    "city": "Sfax",
    "unusual": true,
    "distance_from_usual": 270
  },
  "risk_score": 75,
  "is_blocked": false,
  "metadata": {
    "attempt_number": 3,
    "time_since_last": 45,
    "pattern": "rapid_attempts",
    "captcha_required": true,
    "alerts": {
      "email_sent": true,
      "sms_sent": false
    }
  },
  "created_at": "2025-01-07T17:15:30+01:00"
}
```

### Table `security_events` - Événements de sécurité

**Description** : Détection et enregistrement automatique d'événements de sécurité anormaux.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `event_type` | ENUM | NOT NULL | - | Type événement |
| `severity` | ENUM | NOT NULL | - | Sévérité |
| `user_id` | UUID | NULL, FK | - | Utilisateur concerné |
| `session_id` | UUID | NULL, FK | - | Session concernée |
| `ip_address` | INET | NULL | - | IP source |
| `description` | TEXT | NOT NULL | - | Description détaillée |
| `detection_method` | VARCHAR(100) | NULL | - | Méthode détection |
| `affected_resources` | JSONB | NULL | - | Ressources impactées |
| `response_actions` | JSONB | NULL | - | Actions prises |
| `is_resolved` | BOOLEAN | DEFAULT FALSE | FALSE | Résolu |
| `resolved_at` | TIMESTAMPTZ | NULL | - | Date résolution |
| `resolved_by` | UUID | NULL, FK | - | Résolu par |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date détection |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `event_type`

- `BRUTE_FORCE` : Attaque force brute
- `SQL_INJECTION` : Tentative injection SQL
- `XSS_ATTEMPT` : Tentative XSS
- `SUSPICIOUS_ACTIVITY` : Activité suspecte
- `DATA_BREACH` : Fuite de données
- `UNAUTHORIZED_ACCESS` : Accès non autorisé
- `ACCOUNT_TAKEOVER` : Piratage compte
- `FRAUD_ATTEMPT` : Tentative fraude

#### Valeurs ENUM `severity`

- `CRITICAL` : Critique
- `HIGH` : Élevée
- `MEDIUM` : Moyenne
- `LOW` : Faible
- `INFO` : Information

#### Exemple de record complet

```json
{
  "id": "789e01ab-b23c-4567-8901-234567890123",
  "event_type": "BRUTE_FORCE",
  "severity": "HIGH",
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "session_id": null,
  "ip_address": "197.28.145.67",
  "description": "Détection de 10 tentatives de connexion échouées en 2 minutes depuis une IP inhabituelle",
  "detection_method": "rate_limiting_algorithm",
  "affected_resources": {
    "endpoints": ["/api/v1/auth/login"],
    "accounts": ["mohamed.benali@gmail.com"],
    "time_window": "2025-01-07T17:13:00Z/2025-01-07T17:15:00Z"
  },
  "response_actions": {
    "automated": [
      {
        "action": "block_ip",
        "duration": "1h",
        "timestamp": "2025-01-07T17:15:01Z"
      },
      {
        "action": "require_captcha",
        "duration": "24h",
        "timestamp": "2025-01-07T17:15:01Z"
      },
      {
        "action": "notify_user",
        "method": "email",
        "timestamp": "2025-01-07T17:15:02Z"
      }
    ],
    "manual_required": false
  },
  "is_resolved": true,
  "resolved_at": "2025-01-07T18:15:00+01:00",
  "resolved_by": "system_auto",
  "metadata": {
    "analysis": {
      "pattern_match": "distributed_brute_force",
      "confidence": 0.92,
      "false_positive_probability": 0.08
    },
    "context": {
      "previous_incidents": 0,
      "user_risk_profile": "low",
      "geo_anomaly": true
    }
  },
  "created_at": "2025-01-07T17:15:00+01:00",
  "updated_at": "2025-01-07T18:15:00+01:00"
}
```

---

## 🚪 Module Contrôle d'Accès {#module-controle}

### Table `access_control_log` - Journal contrôle d'accès

**Description** : Enregistrement de tous les scans et contrôles d'accès physiques aux événements.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `access_right_id` | UUID | NOT NULL, FK | - | Droit d'accès scanné |
| `event_id` | UUID | NOT NULL, FK | - | Événement |
| `access_point_id` | UUID | NULL, FK | - | Point d'accès |
| `scan_type` | ENUM | NOT NULL | - | Type de scan |
| `scan_result` | ENUM | NOT NULL | - | Résultat scan |
| `scanner_device_id` | VARCHAR(100) | NULL | - | ID scanner |
| `scanner_user_id` | UUID | NULL, FK | - | Agent scanner |
| `zone_accessed` | VARCHAR(255) | NULL | - | Zone accédée |
| `temperature` | DECIMAL(3,1) | NULL | - | Température (°C) |
| `photo_url` | TEXT | NULL | - | Photo contrôle |
| `denial_reason` | VARCHAR(100) | NULL | - | Raison refus |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date scan |

#### Valeurs ENUM `scan_type`

- `ENTRY` : Entrée
- `EXIT` : Sortie
- `RE_ENTRY` : Ré-entrée
- `ZONE_CHANGE` : Changement zone
- `VERIFICATION` : Vérification

#### Valeurs ENUM `scan_result`

- `GRANTED` : Accès accordé
- `DENIED` : Accès refusé
- `WARNING` : Avertissement
- `MANUAL_CHECK` : Vérification manuelle

#### Exemple de record complet

```json
{
  "id": "890f12bc-c34d-5678-9012-345678901234",
  "access_right_id": "234j56hi-p89n-34o5-m678-648736396333",
  "event_id": "789e01cd-k23h-78i9-g012-082170730666",
  "access_point_id": "ap_rades_gate_a",
  "scan_type": "ENTRY",
  "scan_result": "GRANTED",
  "scanner_device_id": "SCAN_RADES_A_01",
  "scanner_user_id": "xxx-xxx-xxx",
  "zone_accessed": "zone_vip_central",
  "temperature": null,
  "photo_url": null,
  "denial_reason": null,
  "metadata": {
    "scan_time_ms": 245,
    "qr_quality": "high",
    "offline_mode": false,
    "sync_status": "realtime",
    "ticket_info": {
      "type": "VIP",
      "seat": "H-234",
      "holder": "Mohamed Ben Ali"
    },
    "device_info": {
      "battery": 85,
      "signal_strength": -45,
      "firmware": "2.3.1"
    }
  },
  "created_at": "2025-02-15T19:45:30+01:00"
}
```

### Table `access_transactions_log` - Transactions droits d'accès

**Description** : Historique des transferts et modifications de droits d'accès.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `access_right_id` | UUID | NOT NULL, FK | - | Droit concerné |
| `transaction_type` | ENUM | NOT NULL | - | Type transaction |
| `from_user_id` | UUID | NULL, FK | - | Utilisateur source |
| `to_user_id` | UUID | NULL, FK | - | Utilisateur destination |
| `reason` | VARCHAR(200) | NULL | - | Motif transaction |
| `authorized_by` | UUID | NULL, FK | - | Autorisé par |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date transaction |

#### Valeurs ENUM `transaction_type`

- `TRANSFER` : Transfert
- `REVOKE` : Révocation
- `RESTORE` : Restauration
- `UPGRADE` : Amélioration
- `DOWNGRADE` : Déclassement


### Exemple de record complet

```json
{
  "id": "901a23cd-d45e-6789-0123-456789012345",
  "access_right_id": "234j56hi-p89n-34o5-m678-648736396333",
  "transaction_type": "TRANSFER",
  "from_user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "to_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reason": "Transfert à un ami - empêchement de dernière minute",
  "authorized_by": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "metadata": {
    "transfer_details": {
      "method": "email",
      "recipient_email": "ami@example.com",
      "notification_sent": true,
      "accepted_at": "2025-02-14T20:30:00+01:00"
    },
    "validation": {
      "identity_verified": true,
      "relationship": "friend",
      "transfer_count": 1,
      "max_allowed": 2
    },
    "compliance": {
      "terms_accepted": true,
      "fee_paid": 0.00,
      "tax_implications": "none"
    }
  },
  "created_at": "2025-02-14T20:00:00+01:00"
}
```

---

## 🚫 Module Liste Noire {#module-blacklist}

### Table `blacklist` - Liste noire

**Description** : Gestion des interdictions d'accès pour individus ou entités à différents niveaux (global, organisateur, venue, événement).

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `blacklist_type` | ENUM | NOT NULL | - | Type d'interdiction |
| `scope` | ENUM | NOT NULL | - | Portée interdiction |
| `scope_id` | UUID | NULL | - | ID scope spécifique |
| `identifier_type` | ENUM | NOT NULL | - | Type identifiant |
| `identifier_value` | VARCHAR(255) | NOT NULL | - | Valeur identifiant |
| `user_id` | UUID | NULL, FK | - | Utilisateur (si connu) |
| `reason` | TEXT | NOT NULL | - | Motif interdiction |
| `severity` | ENUM | NOT NULL | 'MEDIUM' | Gravité |
| `evidence` | JSONB | NULL | - | Preuves/documentation |
| `valid_from` | TIMESTAMPTZ | NOT NULL | NOW() | Début interdiction |
| `valid_until` | TIMESTAMPTZ | NULL | - | Fin interdiction |
| `created_by` | UUID | NOT NULL, FK | - | Créé par |
| `appeal_status` | ENUM | NOT NULL | 'NONE' | Statut appel |
| `appeal_notes` | TEXT | NULL | - | Notes appel |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Interdiction active |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Valeurs ENUM `blacklist_type`

- `SECURITY` : Raison sécurité
- `BEHAVIOR` : Comportement
- `FINANCIAL` : Raison financière
- `LEGAL` : Raison légale
- `ADMINISTRATIVE` : Administrative

#### Valeurs ENUM `scope`

- `GLOBAL` : Toute la plateforme
- `ORGANIZER` : Un organisateur
- `VENUE` : Un lieu
- `EVENT` : Un événement
- `CATEGORY` : Une catégorie

#### Valeurs ENUM `identifier_type`

- `USER_ID` : ID utilisateur
- `EMAIL` : Adresse email
- `PHONE` : Téléphone
- `NATIONAL_ID` : CIN
- `IP_ADDRESS` : Adresse IP
- `DEVICE_ID` : ID appareil
- `CREDIT_CARD` : Hash carte

#### Valeurs ENUM `severity`

- `LOW` : Faible
- `MEDIUM` : Moyenne
- `HIGH` : Élevée
- `CRITICAL` : Critique

#### Valeurs ENUM `appeal_status`

- `NONE` : Pas d'appel
- `PENDING` : Appel en cours
- `REVIEWING` : En révision
- `APPROVED` : Appel accepté
- `REJECTED` : Appel rejeté

#### Structure JSONB `evidence`

```json
{
  "incidents": [
    {
      "date": "2024-12-20T21:30:00+01:00",
      "type": "violence",
      "description": "Bagarre dans les tribunes lors du match CA vs EST",
      "witnesses": 3,
      "police_report": "PV-2024-12345",
      "video_evidence": "https://secure.entrix.tn/evidence/vid_20241220_213000.mp4"
    },
    {
      "date": "2024-11-15T20:00:00+01:00",
      "type": "pyrotechnics",
      "description": "Utilisation de fumigènes interdits",
      "security_report": "SEC-2024-6789"
    }
  ],
  "patterns": {
    "total_incidents": 5,
    "first_incident": "2023-03-10",
    "venues_affected": ["Radès", "Menzah"],
    "damage_cost": 2500.00
  },
  "supporting_documents": [
    {
      "type": "police_report",
      "reference": "PV-2024-12345",
      "url": "https://secure.entrix.tn/docs/pv_2024_12345.pdf"
    }
  ]
}
```

#### Exemple de record complet - Interdiction individuelle

```json
{
  "id": "012b34de-e56f-7890-1234-567890123456",
  "blacklist_type": "BEHAVIOR",
  "scope": "ORGANIZER",
  "scope_id": "d7e6f5g4-c3b2-1a0f-9e8d-7c6b5a4c3d2e",
  "identifier_type": "USER_ID",
  "identifier_value": "xxx-xxx-xxx-xxx",
  "user_id": "xxx-xxx-xxx-xxx",
  "reason": "Violence répétée lors des matchs, mise en danger d'autres spectateurs",
  "severity": "HIGH",
  "evidence": {
    "incidents": [
      {
        "date": "2024-12-20T21:30:00+01:00",
        "type": "violence",
        "description": "Bagarre dans les tribunes",
        "police_report": "PV-2024-12345"
      }
    ],
    "patterns": {
      "total_incidents": 5,
      "venues_affected": ["Radès"]
    }
  },
  "valid_from": "2024-12-21T00:00:00+01:00",
  "valid_until": "2026-12-21T00:00:00+01:00",
  "created_by": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "appeal_status": "REJECTED",
  "appeal_notes": "Appel rejeté - preuves accablantes, récidive",
  "is_active": true,
  "metadata": {
    "notification": {
      "user_notified": true,
      "method": "email",
      "date": "2024-12-21T10:00:00+01:00"
    },
    "impact": {
      "tickets_cancelled": 3,
      "refund_amount": 135.00,
      "subscription_suspended": true
    },
    "review_schedule": "2025-12-21"
  },
  "created_at": "2024-12-21T09:00:00+01:00",
  "updated_at": "2025-01-10T14:00:00+01:00"
}
```

#### Exemple de record complet - Interdiction dispositif

```json
{
  "id": "123c45ef-f67g-8901-2345-678901234567",
  "blacklist_type": "FINANCIAL",
  "scope": "GLOBAL",
  "scope_id": null,
  "identifier_type": "CREDIT_CARD",
  "identifier_value": "hash_4111********1111_visa",
  "user_id": null,
  "reason": "Carte utilisée pour multiples transactions frauduleuses - chargebacks répétés",
  "severity": "CRITICAL",
  "evidence": {
    "fraud_details": {
      "total_chargebacks": 8,
      "total_amount": 3450.00,
      "date_range": "2024-10 to 2024-12",
      "affected_organizers": 4
    },
    "bank_communication": {
      "fraud_confirmed": true,
      "reference": "FRAUD-VISA-2024-98765"
    },
    "patterns": {
      "multiple_accounts": true,
      "ip_addresses": ["197.28.x.x", "41.230.x.x"],
      "purchase_pattern": "high_value_events_only"
    }
  },
  "valid_from": "2024-12-15T00:00:00+01:00",
  "valid_until": null,
  "created_by": "system_fraud_detection",
  "appeal_status": "NONE",
  "appeal_notes": null,
  "is_active": true,
  "metadata": {
    "detection": {
      "algorithm": "fraud_detector_v3",
      "confidence": 0.98,
      "auto_blocked": true
    },
    "impact": {
      "transactions_blocked": 12,
      "amount_protected": 5670.00
    },
    "shared_with": ["payment_processors", "partner_platforms"]
  },
  "created_at": "2024-12-15T03:45:00+01:00",
  "updated_at": "2024-12-15T03:45:00+01:00"
}
```

---

## 🔐 Tables de Sécurité Additionnelles {#tables-securite-add}

### Table `mfa_tokens` - Tokens d'authentification multi-facteurs

**Description** : Gestion des tokens temporaires pour l'authentification à deux facteurs.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `user_id` | UUID | NOT NULL, FK | - | Utilisateur |
| `method` | ENUM | NOT NULL | - | Méthode 2FA |
| `token_hash` | VARCHAR(255) | NOT NULL | - | Hash du token |
| `secret` | VARCHAR(255) | NULL | - | Secret (TOTP) |
| `expires_at` | TIMESTAMPTZ | NOT NULL | - | Expiration |
| `is_used` | BOOLEAN | NOT NULL | FALSE | Token utilisé |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `used_at` | TIMESTAMPTZ | NULL | - | Date utilisation |

#### Valeurs ENUM `method`

- `SMS` : Code par SMS
- `EMAIL` : Code par email
- `TOTP` : App authentificateur
- `BACKUP_CODE` : Code de secours

#### Exemple de record complet

```json
{
  "id": "234d56fg-g78h-9012-3456-789012345678",
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "method": "SMS",
  "token_hash": "$2b$12$YGVmN2Q3ZjdhMWY4ZGNiNO...",
  "secret": null,
  "expires_at": "2025-01-07T17:35:00+01:00",
  "is_used": false,
  "metadata": {
    "phone_masked": "+216****5432",
    "attempts": 0,
    "max_attempts": 3,
    "trigger": "suspicious_login",
    "ip_address": "197.28.145.67"
  },
  "created_at": "2025-01-07T17:30:00+01:00",
  "used_at": null
}
```

### Table `rate_limiting` - Limitation de taux

**Description** : Contrôle du taux de requêtes pour prévenir les abus et attaques DDoS.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `endpoint` | VARCHAR(200) | NOT NULL | - | Endpoint API |
| `identifier_type` | VARCHAR(50) | NOT NULL | - | Type identifiant |
| `identifier_value` | VARCHAR(255) | NOT NULL | - | Valeur identifiant |
| `requests_count` | INTEGER | NOT NULL | 1 | Nombre requêtes |
| `window_start` | TIMESTAMPTZ | NOT NULL | NOW() | Début fenêtre |
| `is_blocked` | BOOLEAN | NOT NULL | FALSE | Bloqué |
| `last_request` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière requête |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Exemple de record complet

```json
{
  "id": "345e67gh-h89i-0123-4567-890123456789",
  "endpoint": "/api/v1/auth/login",
  "identifier_type": "ip_address",
  "identifier_value": "197.28.145.67",
  "requests_count": 150,
  "window_start": "2025-01-07T17:00:00+01:00",
  "is_blocked": true,
  "last_request": "2025-01-07T17:15:00+01:00",
  "metadata": {
    "limits": {
      "per_minute": 10,
      "per_hour": 100,
      "per_day": 1000
    },
    "violations": {
      "minute": true,
      "hour": true,
      "pattern": "aggressive"
    },
    "user_agents": [
      "curl/7.68.0",
      "python-requests/2.25.1"
    ]
  },
  "created_at": "2025-01-07T17:00:00+01:00",
  "updated_at": "2025-01-07T17:15:00+01:00"
}
```

### Table `security_policies` - Politiques de sécurité

**Description** : Configuration des politiques de sécurité personnalisables par contexte.

#### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | - | Code politique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom politique |
| `description` | TEXT | NULL | - | Description |
| `policy_type` | VARCHAR(50) | NOT NULL | - | Type politique |
| `rules` | JSONB | NOT NULL | - | Règles détaillées |
| `valid_from` | TIMESTAMPTZ | NOT NULL | NOW() | Début validité |
| `valid_until` | TIMESTAMPTZ | NULL | - | Fin validité |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Politique active |
| `is_enforced` | BOOLEAN | NOT NULL | TRUE | Application forcée |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

#### Structure JSONB `rules`

```json
{
  "password_policy": {
    "min_length": 12,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_special": true,
    "max_age_days": 90,
    "history_count": 5,
    "complexity_score": 3
  },
  "session_policy": {
    "max_duration_hours": 168,
    "idle_timeout_minutes": 30,
    "concurrent_sessions": 3,
    "require_2fa_for": ["admin", "financial"],
    "geo_restriction": {
      "enabled": true,
      "allowed_countries": ["TN", "FR", "DZ", "MA"]
    }
  },
  "access_policy": {
    "max_failed_attempts": 5,
    "lockout_duration_minutes": 30,
    "progressive_delay": true,
    "captcha_after_attempts": 3
  }
}
```

#### Exemple de record complet

```json
{
  "id": "456f78hi-i90j-1234-5678-901234567890",
  "code": "SEC_POL_HIGH_VALUE",
  "name": "Politique Haute Sécurité - Transactions élevées",
  "description": "Politique appliquée pour les utilisateurs effectuant des transactions > 500 TND",
  "policy_type": "user_security",
  "rules": {
    "authentication": {
      "require_2fa": "always",
      "allowed_2fa_methods": ["TOTP", "SMS"],
      "session_duration_max": 2
    },
    "transactions": {
      "require_confirmation": true,
      "confirmation_method": "sms",
      "daily_limit": 5000,
      "per_transaction_limit": 1000,
      "cooling_period_minutes": 5
    },
    "monitoring": {
      "log_all_actions": true,
      "alert_threshold": 2000,
      "real_time_fraud_check": true
    }
  },
  "valid_from": "2025-01-01T00:00:00+01:00",
  "valid_until": null,
  "is_active": true,
  "is_enforced": true,
  "metadata": {
    "applies_to": {
      "user_segments": ["high_value", "vip"],
      "transaction_types": ["ticket_purchase", "subscription"],
      "minimum_amount": 500
    },
    "exceptions": {
      "whitelisted_users": [],
      "excluded_events": []
    },
    "compliance": {
      "pci_dss": true,
      "gdpr": true,
      "local_regulations": ["BCT_2024_01"]
    }
  },
  "created_at": "2024-12-15T10:00:00+01:00",
  "updated_at": "2025-01-05T14:30:00+01:00"
}
```

---

## 🔗 Synthèse Relations et Règles {#synthese-relations}

### Hiérarchie de sécurité

```
Politique Globale
    └── Politique Organisateur
        └── Politique Événement
            └── Politique Utilisateur
                └── Règles Session
```

### Workflow de sécurité intégré

1. **Connexion utilisateur** :
   - Vérification blacklist (email, IP, device)
   - Contrôle rate limiting
   - Validation MFA si requis
   - Création session sécurisée
   - Log audit

2. **Achat billet** :
   - Vérification blacklist utilisateur
   - Contrôle limite achats
   - Validation paiement (blacklist carte)
   - Génération access_right
   - Notification et log

3. **Contrôle accès événement** :
   - Scan QR code
   - Vérification validité
   - Contrôle blacklist temps réel
   - Log accès
   - Alertes si anomalie

### Règles de rétention

| Type de donnée | Durée rétention | Justification |
|----------------|-----------------|---------------|
| Audit logs | 7 ans | Conformité légale |
| Login attempts | 90 jours | Analyse sécurité |
| Access logs | 2 ans | Historique événements |
| Session data | 30 jours après expiration | Debug et support |
| Security events | 5 ans | Analyse tendances |
| Blacklist | Permanent (soft delete) | Historique sécurité |

### Triggers automatiques

1. **Détection fraude** :
   ```sql
   IF failed_login_attempts > 5 IN last_10_minutes THEN
       CREATE security_event (BRUTE_FORCE)
       BLOCK ip_address FOR 1_hour
       NOTIFY user BY email
   END IF
   ```

2. **Blacklist cascade** :
   ```sql
   ON INSERT INTO blacklist WHERE scope = 'GLOBAL'
       CANCEL all active tickets
       SUSPEND all subscriptions
       REVOKE all access_rights
       NOTIFY affected users
   ```

3. **Compliance automatique** :
   ```sql
   ON user.created_at < (NOW() - INTERVAL '3 years')
   AND user.last_login < (NOW() - INTERVAL '2 years')
       ANONYMIZE personal_data
       RETAIN aggregated_stats
       LOG gdpr_compliance
   ```

### Indicateurs de sécurité (KPIs)

1. **Taux de fraude** : Transactions frauduleuses / Total transactions
2. **Efficacité blacklist** : Tentatives bloquées / Total tentatives
3. **Adoption 2FA** : Users avec 2FA / Total users actifs
4. **Temps réponse incidents** : Moyenne (detection_time - resolution_time)
5. **Conformité audit** : Logs complets / Actions critiques

Cette architecture de sécurité multicouche assure une protection robuste tout en maintenant une expérience utilisateur fluide et conforme aux réglementations.