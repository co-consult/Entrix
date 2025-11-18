# DOCUMENTATION MODULE SÉCURITÉ & AUDIT
## Plateforme Entrix - Système de Sécurité et Audit

---

**Version :** 1.0  
**Date :** Juin 2025  
**Système :** Gestion complète de la sécurité et audit des opérations  

---

## 📋 VUE D'ENSEMBLE DU MODULE

### Principe général
Le module Sécurité & Audit d'Entrix assure la protection, la surveillance et la traçabilité complète de toutes les opérations du système :

1. **AUDIT** : Traçabilité complète de toutes les actions utilisateurs
2. **SESSIONS** : Gestion sécurisée des sessions utilisateurs actives
3. **AUTHENTIFICATION** : Contrôle des tentatives de connexion et MFA
4. **MONITORING** : Surveillance système et détection d'anomalies
5. **LIMITATION** : Protection contre les abus et attaques
6. **POLITIQUES** : Configuration flexible des règles de sécurité

### Architecture du module
- Audit centralisé de toutes les opérations critiques
- Gestion des sessions avec expiration automatique
- Authentification multi-facteurs configurable
- Détection proactive des menaces de sécurité
- Rate limiting adaptatif par utilisateur/IP
- Politiques de sécurité personnalisables par rôle

---

## 🗄️ TABLES DU SYSTÈME

### **1. Table `audit_logs`**

#### **Rôle de la table**
Journal d'audit central qui enregistre toutes les actions critiques du système. Assure la traçabilité complète des opérations pour la conformité, la sécurité et le débogage.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `550e8400-e29b-41d4-a716-446655440001` |
| `action` | audit_action | NOT NULL | Type d'action auditée | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `ACCESS` |
| `entity_type` | VARCHAR(100) | NOT NULL | Type d'entité concernée | `USER`, `TICKET`, `SUBSCRIPTION`, `PAYMENT` |
| `entity_id` | UUID | Optional | ID de l'entité | `660e8400-e29b-41d4-a716-446655440001` |
| `user_id` | UUID | Foreign Key, Optional | Utilisateur auteur | UUID de users |
| `session_id` | UUID | Foreign Key, Optional | Session concernée | UUID de user_sessions |
| `ip_address` | INET | Optional | Adresse IP source | `41.226.11.226`, `192.168.1.100` |
| `user_agent` | TEXT | Optional | Navigateur/application | `Mozilla/5.0...`, `EntrixApp/2.1.0` |
| `old_values` | JSONB | Optional | Valeurs avant modification | `{"status": "PENDING", "price": 50.00}` |
| `new_values` | JSONB | Optional | Nouvelles valeurs | `{"status": "PAID", "price": 45.00}` |
| `metadata` | JSONB | Optional | Données contextuelles | `{"reason": "manual_override", "admin_id": "..."}` |
| `severity` | security_level | Default: MEDIUM | Niveau d'importance | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `success` | BOOLEAN | Default: true | Action réussie | `true`, `false` |
| `error_message` | TEXT | Optional | Message d'erreur | `Permission denied`, `Database error` |
| `duration_ms` | INTEGER | Optional | Durée exécution | `150`, `2340` |
| `created_at` | TIMESTAMPTZ | Default: now() | Timestamp exact | `2025-06-30T14:35:22.123Z` |

#### **Exemples de données**

**Connexion utilisateur réussie :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "action": "LOGIN",
  "entity_type": "USER",
  "entity_id": "110e8400-e29b-41d4-a716-446655440001",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "session_id": "session_2025_06_30_001",
  "ip_address": "41.226.11.226",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "old_values": null,
  "new_values": {
    "last_login": "2025-06-30T14:35:22Z",
    "login_count": 156
  },
  "metadata": {
    "location": "Tunis, Tunisia",
    "device_new": false,
    "mfa_used": true
  },
  "severity": "MEDIUM",
  "success": true,
  "duration_ms": 245,
  "created_at": "2025-06-30T14:35:22.123Z"
}
```

**Modification prix billet :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "action": "UPDATE",
  "entity_type": "EVENT_TICKET_CONFIG",
  "entity_id": "880e8400-e29b-41d4-a716-446655440001",
  "user_id": "staff_admin_001",
  "session_id": "session_2025_06_30_002",
  "ip_address": "192.168.1.100",
  "user_agent": "EntrixAdmin/1.0.0",
  "old_values": {
    "price": 50.00,
    "quantity_available": 1000
  },
  "new_values": {
    "price": 45.00,
    "quantity_available": 1000
  },
  "metadata": {
    "reason": "promotion_launch",
    "approved_by": "manager_001",
    "effective_date": "2025-07-01"
  },
  "severity": "HIGH",
  "success": true,
  "duration_ms": 89,
  "created_at": "2025-06-30T14:40:15.456Z"
}
```

**Tentative d'accès non autorisé :**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "action": "ACCESS",
  "entity_type": "ADMIN_PANEL",
  "entity_id": null,
  "user_id": "user_normal_001",
  "session_id": "session_2025_06_30_003",
  "ip_address": "197.15.23.89",
  "user_agent": "Mozilla/5.0...",
  "old_values": null,
  "new_values": null,
  "metadata": {
    "attempted_url": "/admin/users",
    "required_role": "ADMIN",
    "user_role": "USER"
  },
  "severity": "CRITICAL",
  "success": false,
  "error_message": "Insufficient privileges for admin panel access",
  "duration_ms": 12,
  "created_at": "2025-06-30T14:45:30.789Z"
}
```

---

### **2. Table `user_sessions`**

#### **Rôle de la table**
Gestion centralisée des sessions utilisateurs actives. Permet le contrôle des connexions simultanées, l'expiration automatique et la révocation de sessions.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique session | `session_2025_06_30_001` |
| `user_id` | UUID | Foreign Key, NOT NULL | Utilisateur propriétaire | UUID de users |
| `session_token` | VARCHAR(255) | Unique, NOT NULL | Token de session sécurisé | `sess_abc123def456...` |
| `refresh_token` | VARCHAR(255) | Optional | Token de renouvellement | `refresh_xyz789uvw012...` |
| `ip_address` | INET | NOT NULL | IP de connexion | `41.226.11.226` |
| `user_agent` | TEXT | Optional | Client utilisé | `Mozilla/5.0...`, `EntrixApp/2.1.0` |
| `device_fingerprint` | VARCHAR(255) | Optional | Empreinte appareil | `fp_desktop_chrome_win10_001` |
| `location` | JSONB | Optional | Géolocalisation estimée | `{"country": "TN", "city": "Tunis"}` |
| `is_mobile` | BOOLEAN | Default: false | Session mobile | `true`, `false` |
| `is_active` | BOOLEAN | Default: true | Session active | `true`, `false` |
| `last_activity` | TIMESTAMPTZ | NOT NULL | Dernière activité | `2025-06-30T14:35:22Z` |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Expiration prévue | `2025-07-07T14:35:22Z` |
| `logout_reason` | VARCHAR(100) | Optional | Raison déconnexion | `USER_LOGOUT`, `TIMEOUT`, `ADMIN_REVOKE` |
| `metadata` | JSONB | Optional | Données session | `{"permissions": [...], "preferences": {...}}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Début session | `2025-06-30T14:35:22Z` |
| `ended_at` | TIMESTAMPTZ | Optional | Fin session | `null`, `2025-06-30T18:22:15Z` |

#### **Exemples de données**

**Session web active :**
```json
{
  "id": "session_2025_06_30_001",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "session_token": "sess_abc123def456ghi789jkl012mno345pqr678stu901",
  "refresh_token": "refresh_xyz789uvw012abc345def678ghi901jkl234",
  "ip_address": "41.226.11.226",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "device_fingerprint": "fp_desktop_chrome_win10_001",
  "location": {
    "country": "TN",
    "country_name": "Tunisia",
    "city": "Tunis",
    "lat": 36.8065,
    "lng": 10.1815
  },
  "is_mobile": false,
  "is_active": true,
  "last_activity": "2025-06-30T14:35:22Z",
  "expires_at": "2025-07-07T14:35:22Z",
  "logout_reason": null,
  "metadata": {
    "permissions": ["READ_EVENTS", "PURCHASE_TICKETS"],
    "preferences": {
      "language": "fr",
      "notifications": true
    },
    "login_method": "email_password",
    "mfa_verified": true
  },
  "created_at": "2025-06-30T14:35:22Z",
  "ended_at": null
}
```

**Session mobile terminée :**
```json
{
  "id": "session_2025_06_30_002",
  "user_id": "110e8400-e29b-41d4-a716-446655440002",
  "session_token": "sess_mobile_def456ghi789...",
  "ip_address": "197.15.23.145",
  "user_agent": "EntrixApp/2.1.0 (iOS 17.2; iPhone14,2)",
  "device_fingerprint": "fp_iphone_safari_ios17_001",
  "location": {
    "country": "TN",
    "city": "Sfax"
  },
  "is_mobile": true,
  "is_active": false,
  "last_activity": "2025-06-30T16:22:15Z",
  "expires_at": "2025-07-07T12:00:00Z",
  "logout_reason": "USER_LOGOUT",
  "metadata": {
    "app_version": "2.1.0",
    "push_token": "apn_token_xyz123...",
    "biometric_enabled": true
  },
  "created_at": "2025-06-30T12:00:00Z",
  "ended_at": "2025-06-30T16:22:15Z"
}
```

---

### **3. Table `login_attempts`**

#### **Rôle de la table**
Surveillance des tentatives de connexion pour détecter les attaques par force brute et analyser les patterns de sécurité. Permet la mise en place de mesures préventives.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `660e8400-e29b-41d4-a716-446655440001` |
| `email` | VARCHAR(255) | NOT NULL | Email de connexion tenté | `user@example.com` |
| `user_id` | UUID | Foreign Key, Optional | Utilisateur si trouvé | UUID de users ou `null` |
| `ip_address` | INET | NOT NULL | IP source | `41.226.11.226` |
| `user_agent` | TEXT | Optional | Client utilisé | `Mozilla/5.0...` |
| `success` | BOOLEAN | NOT NULL | Connexion réussie | `true`, `false` |
| `failure_reason` | VARCHAR(100) | Optional | Raison échec | `INVALID_PASSWORD`, `USER_NOT_FOUND`, `ACCOUNT_LOCKED` |
| `mfa_required` | BOOLEAN | Default: false | MFA demandé | `true`, `false` |
| `mfa_success` | BOOLEAN | Optional | MFA réussi | `true`, `false`, `null` |
| `geolocation` | JSONB | Optional | Localisation estimée | `{"country": "TN", "city": "Tunis"}` |
| `is_suspicious` | BOOLEAN | Default: false | Tentative suspecte | `true`, `false` |
| `session_id` | UUID | Foreign Key, Optional | Session créée si succès | UUID de user_sessions |
| `metadata` | JSONB | Optional | Données contextuelles | `{"device_new": true, "vpn_detected": false}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Moment tentative | `2025-06-30T14:35:22Z` |

#### **Exemples de données**

**Connexion réussie normale :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "email": "ahmed.supporter@email.com",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "ip_address": "41.226.11.226",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "success": true,
  "failure_reason": null,
  "mfa_required": true,
  "mfa_success": true,
  "geolocation": {
    "country": "TN",
    "country_name": "Tunisia",
    "city": "Tunis",
    "accuracy": "city"
  },
  "is_suspicious": false,
  "session_id": "session_2025_06_30_001",
  "metadata": {
    "device_new": false,
    "device_trusted": true,
    "login_duration_ms": 1245,
    "password_strength": "strong",
    "vpn_detected": false
  },
  "created_at": "2025-06-30T14:35:22Z"
}
```

**Tentative échouée - mot de passe incorrect :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440002",
  "email": "ahmed.supporter@email.com",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "ip_address": "197.15.23.89",
  "user_agent": "Mozilla/5.0 (Linux; Android 12) Chrome/119.0.0.0",
  "success": false,
  "failure_reason": "INVALID_PASSWORD",
  "mfa_required": false,
  "mfa_success": null,
  "geolocation": {
    "country": "TN",
    "city": "Sousse"
  },
  "is_suspicious": true,
  "session_id": null,
  "metadata": {
    "device_new": true,
    "device_trusted": false,
    "attempts_from_ip": 3,
    "location_unusual": true,
    "time_unusual": false
  },
  "created_at": "2025-06-30T03:45:12Z"
}
```

**Attaque par force brute détectée :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440003",
  "email": "admin@clubsportif.tn",
  "user_id": null,
  "ip_address": "185.220.101.25",
  "user_agent": "Python-requests/2.28.1",
  "success": false,
  "failure_reason": "USER_NOT_FOUND",
  "mfa_required": false,
  "mfa_success": null,
  "geolocation": {
    "country": "DE",
    "city": "Frankfurt",
    "vpn": true
  },
  "is_suspicious": true,
  "session_id": null,
  "metadata": {
    "bot_detected": true,
    "rate_limit_triggered": true,
    "attempts_from_ip": 157,
    "attack_pattern": "brute_force",
    "blocked_by_firewall": true
  },
  "created_at": "2025-06-30T02:15:33Z"
}
```

---

### **4. Table `security_events`**

#### **Rôle de la table**
Détection et enregistrement des événements de sécurité suspects ou critiques. Permet l'analyse des menaces et la réponse automatisée aux incidents.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `770e8400-e29b-41d4-a716-446655440001` |
| `event_type` | VARCHAR(100) | NOT NULL | Type d'événement sécurité | `BRUTE_FORCE`, `ANOMALY`, `INTRUSION` |
| `severity` | security_level | NOT NULL | Niveau gravité | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `title` | VARCHAR(200) | NOT NULL | Titre descriptif | `Tentative brute force détectée` |
| `description` | TEXT | NOT NULL | Description détaillée | `157 tentatives login depuis IP suspecte` |
| `source_ip` | INET | Optional | IP source | `185.220.101.25` |
| `target_user_id` | UUID | Foreign Key, Optional | Utilisateur ciblé | UUID de users |
| `related_session_id` | UUID | Foreign Key, Optional | Session liée | UUID de user_sessions |
| `detection_method` | VARCHAR(100) | NOT NULL | Méthode détection | `RATE_LIMITING`, `ML_ANOMALY`, `RULE_BASED` |
| `auto_response` | VARCHAR(100) | Optional | Réponse automatique | `IP_BLOCKED`, `USER_LOCKED`, `ALERT_SENT` |
| `is_resolved` | BOOLEAN | Default: false | Incident résolu | `true`, `false` |
| `resolved_by` | UUID | Foreign Key, Optional | Résolu par | UUID de users (admin) |
| `resolved_at` | TIMESTAMPTZ | Optional | Date résolution | `2025-06-30T15:00:00Z` |
| `false_positive` | BOOLEAN | Default: false | Faux positif | `true`, `false` |
| `evidence` | JSONB | Optional | Preuves/données | `{"logs": [...], "patterns": [...]}` |
| `impact_assessment` | JSONB | Optional | Évaluation impact | `{"users_affected": 0, "data_compromised": false}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date détection | `2025-06-30T14:35:22Z` |

#### **Exemples de données**

**Attaque brute force :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440001",
  "event_type": "BRUTE_FORCE",
  "severity": "CRITICAL",
  "title": "Attaque par force brute détectée",
  "description": "157 tentatives de connexion échouées depuis l'IP 185.220.101.25 en 10 minutes",
  "source_ip": "185.220.101.25",
  "target_user_id": null,
  "related_session_id": null,
  "detection_method": "RATE_LIMITING",
  "auto_response": "IP_BLOCKED",
  "is_resolved": true,
  "resolved_by": "security_admin_001",
  "resolved_at": "2025-06-30T15:00:00Z",
  "false_positive": false,
  "evidence": {
    "attempt_count": 157,
    "time_window": "10 minutes",
    "targeted_emails": ["admin@club.tn", "manager@club.tn"],
    "geolocation": {
      "country": "DE",
      "tor_exit": true,
      "vpn_service": "suspected"
    },
    "patterns": {
      "user_agent": "Python-requests/2.28.1",
      "timing_interval": "consistent_3s",
      "dictionary_attack": true
    }
  },
  "impact_assessment": {
    "accounts_targeted": 15,
    "successful_logins": 0,
    "data_compromised": false,
    "service_disruption": "minimal"
  },
  "created_at": "2025-06-30T02:15:33Z"
}
```

**Anomalie comportement utilisateur :**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "event_type": "USER_ANOMALY",
  "severity": "MEDIUM",
  "title": "Comportement utilisateur anormal détecté",
  "description": "Utilisateur connecté depuis nouveau pays avec pattern d'activité inhabituel",
  "source_ip": "92.45.67.123",
  "target_user_id": "110e8400-e29b-41d4-a716-446655440001",
  "related_session_id": "session_2025_06_30_005",
  "detection_method": "ML_ANOMALY",
  "auto_response": "MFA_REQUIRED",
  "is_resolved": false,
  "resolved_by": null,
  "resolved_at": null,
  "false_positive": false,
  "evidence": {
    "anomalies_detected": [
      "new_country_login",
      "unusual_time_activity",
      "rapid_page_navigation"
    ],
    "user_history": {
      "usual_countries": ["TN"],
      "usual_login_times": ["18:00-22:00"],
      "avg_session_duration": "45min"
    },
    "current_session": {
      "country": "FR",
      "login_time": "03:30",
      "pages_per_minute": 12
    }
  },
  "impact_assessment": {
    "confidence_score": 0.78,
    "risk_level": "medium",
    "recommended_action": "verify_identity"
  },
  "created_at": "2025-06-30T03:30:45Z"
}
```

---

### **5. Table `mfa_tokens`**

#### **Rôle de la table**
Gestion des tokens d'authentification multi-facteurs (MFA). Stocke les codes temporaires et gère leur cycle de vie pour sécuriser les connexions.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `880e8400-e29b-41d4-a716-446655440001` |
| `user_id` | UUID | Foreign Key, NOT NULL | Utilisateur propriétaire | UUID de users |
| `token` | VARCHAR(10) | NOT NULL | Code MFA | `123456`, `789012` |
| `method` | mfa_method | NOT NULL | Méthode envoi | `SMS`, `EMAIL`, `TOTP`, `BACKUP_CODE` |
| `purpose` | VARCHAR(50) | NOT NULL | Finalité du token | `LOGIN`, `PASSWORD_RESET`, `ACCOUNT_VERIFY` |
| `phone_number` | VARCHAR(20) | Optional | Numéro si SMS | `+216 98 123 456` |
| `email` | VARCHAR(255) | Optional | Email si envoi email | `user@example.com` |
| `is_used` | BOOLEAN | Default: false | Token utilisé | `true`, `false` |
| `used_at` | TIMESTAMPTZ | Optional | Date utilisation | `2025-06-30T14:40:00Z` |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Expiration | `2025-06-30T14:45:00Z` |
| `attempts_count` | INTEGER | Default: 0 | Tentatives vérification | `0`, `1`, `2` |
| `max_attempts` | INTEGER | Default: 3 | Limite tentatives | `3`, `5` |
| `ip_address` | INET | Optional | IP demande | `41.226.11.226` |
| `session_id` | UUID | Foreign Key, Optional | Session liée | UUID de user_sessions |
| `metadata` | JSONB | Optional | Données contextuelles | `{"provider": "twilio", "cost": 0.05}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date génération | `2025-06-30T14:35:00Z` |

#### **Exemples de données**

**Token SMS pour connexion :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440001",
  "user_id": "110e8400-e29b-41d4-a716-446655440001",
  "token": "756432",
  "method": "SMS",
  "purpose": "LOGIN",
  "phone_number": "+216 98 123 456",
  "email": null,
  "is_used": true,
  "used_at": "2025-06-30T14:38:30Z",
  "expires_at": "2025-06-30T14:45:00Z",
  "attempts_count": 1,
  "max_attempts": 3,
  "ip_address": "41.226.11.226",
  "session_id": "session_2025_06_30_001",
  "metadata": {
    "provider": "twilio",
    "cost_tnd": 0.050,
    "delivery_status": "delivered",
    "country_code": "TN"
  },
  "created_at": "2025-06-30T14:35:00Z"
}
```

**Token email pour réinitialisation mot de passe :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440002",
  "user_id": "110e8400-e29b-41d4-a716-446655440002",
  "token": "892567",
  "method": "EMAIL",
  "purpose": "PASSWORD_RESET",
  "phone_number": null,
  "email": "fatma.supporter@email.com",
  "is_used": false,
  "used_at": null,
  "expires_at": "2025-06-30T15:15:00Z",
  "attempts_count": 0,
  "max_attempts": 5,
  "ip_address": "197.15.23.145",
  "session_id": null,
  "metadata": {
    "provider": "sendgrid",
    "template": "password_reset_mfa",
    "language": "fr"
  },
  "created_at": "2025-06-30T14:15:00Z"
}
```

**Token TOTP utilisé :**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "user_id": "admin_user_001",
  "token": "348901",
  "method": "TOTP",
  "purpose": "LOGIN",
  "phone_number": null,
  "email": null,
  "is_used": true,
  "used_at": "2025-06-30T14:35:45Z",
  "expires_at": "2025-06-30T14:36:00Z",
  "attempts_count": 1,
  "max_attempts": 3,
  "ip_address": "192.168.1.100",
  "session_id": "session_admin_001",
  "metadata": {
    "app_name": "Google Authenticator",
    "time_window": 30,
    "algorithm": "SHA1"
  },
  "created_at": "2025-06-30T14:35:30Z"
}
```

---

### **6. Table `rate_limiting`**

#### **Rôle de la table**
Limitation du débit des requêtes par IP ou utilisateur pour prévenir les abus et protéger le système contre les attaques de déni de service.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `990e8400-e29b-41d4-a716-446655440001` |
| `identifier` | VARCHAR(255) | NOT NULL | IP ou ID utilisateur | `41.226.11.226`, `user_110e8400...` |
| `identifier_type` | VARCHAR(20) | NOT NULL | Type identifiant | `IP`, `USER`, `SESSION` |
| `endpoint` | VARCHAR(200) | NOT NULL | Point API concerné | `/auth/login`, `/api/tickets`, `GLOBAL` |
| `requests_count` | INTEGER | NOT NULL | Nb requêtes période | `15`, `150`, `1200` |
| `time_window` | INTEGER | NOT NULL | Fenêtre temps (secondes) | `60`, `3600`, `86400` |
| `limit_threshold` | INTEGER | NOT NULL | Seuil limite | `10`, `100`, `1000` |
| `is_blocked` | BOOLEAN | Default: false | Actuellement bloqué | `true`, `false` |
| `blocked_until` | TIMESTAMPTZ | Optional | Fin du blocage | `2025-06-30T15:00:00Z` |
| `block_reason` | VARCHAR(100) | Optional | Raison blocage | `RATE_LIMIT_EXCEEDED`, `SUSPICIOUS_ACTIVITY` |
| `first_request` | TIMESTAMPTZ | NOT NULL | Première requête période | `2025-06-30T14:35:00Z` |
| `last_request` | TIMESTAMPTZ | NOT NULL | Dernière requête | `2025-06-30T14:36:45Z` |
| `metadata` | JSONB | Optional | Données contextuelles | `{"user_agent": "...", "endpoints": [...]}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-06-30T14:35:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière maj | `2025-06-30T14:36:45Z` |

#### **Exemples de données**

**Limitation normale utilisateur :**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440001",
  "identifier": "110e8400-e29b-41d4-a716-446655440001",
  "identifier_type": "USER",
  "endpoint": "/api/tickets/search",
  "requests_count": 45,
  "time_window": 3600,
  "limit_threshold": 100,
  "is_blocked": false,
  "blocked_until": null,
  "block_reason": null,
  "first_request": "2025-06-30T14:00:00Z",
  "last_request": "2025-06-30T14:45:30Z",
  "metadata": {
    "user_agent": "Mozilla/5.0...",
    "session_id": "session_2025_06_30_001",
    "search_terms": ["derby", "CA", "tribune"]
  },
  "created_at": "2025-06-30T14:00:00Z",
  "updated_at": "2025-06-30T14:45:30Z"
}
```

**IP bloquée pour abus :**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440002",
  "identifier": "185.220.101.25",
  "identifier_type": "IP",
  "endpoint": "/auth/login",
  "requests_count": 157,
  "time_window": 600,
  "limit_threshold": 10,
  "is_blocked": true,
  "blocked_until": "2025-06-30T16:00:00Z",
  "block_reason": "RATE_LIMIT_EXCEEDED",
  "first_request": "2025-06-30T02:10:00Z",
  "last_request": "2025-06-30T02:20:33Z",
  "metadata": {
    "user_agents": ["Python-requests/2.28.1"],
    "targeted_emails": ["admin@club.tn", "manager@club.tn"],
    "attack_pattern": "brute_force",
    "geolocation": {
      "country": "DE",
      "tor_exit": true
    }
  },
  "created_at": "2025-06-30T02:10:00Z",
  "updated_at": "2025-06-30T02:20:33Z"
}
```

---

### **7. Table `security_policies`**

#### **Rôle de la table**
Configuration centralisée des politiques de sécurité. Permet de personnaliser les règles de sécurité selon les rôles et contextes d'utilisation.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `aa0e8400-e29b-41d4-a716-446655440001` |
| `policy_name` | VARCHAR(100) | Unique, NOT NULL | Nom politique | `PASSWORD_POLICY`, `SESSION_POLICY`, `MFA_POLICY` |
| `policy_type` | VARCHAR(50) | NOT NULL | Type politique | `AUTHENTICATION`, `AUTHORIZATION`, `AUDIT` |
| `target_role` | VARCHAR(50) | Optional | Rôle cible | `USER`, `ADMIN`, `STAFF`, `ALL` |
| `is_active` | BOOLEAN | Default: true | Politique active | `true`, `false` |
| `priority` | INTEGER | Default: 0 | Priorité application | `10`, `20`, `30` |
| `configuration` | JSONB | NOT NULL | Configuration détaillée | Voir exemples |
| `created_by` | UUID | Foreign Key | Créé par | UUID de users (admin) |
| `description` | TEXT | Optional | Description | `Politique mots de passe pour utilisateurs` |
| `effective_date` | TIMESTAMPTZ | Default: now() | Date prise effet | `2025-06-30T00:00:00Z` |
| `review_date` | TIMESTAMPTZ | Optional | Date révision prévue | `2025-12-30T00:00:00Z` |
| `metadata` | JSONB | Optional | Métadonnées | `{"version": "1.2", "compliance": "ISO27001"}` |
| `created_at` | TIMESTAMPTZ | Default: now() | Date création | `2025-06-30T14:35:00Z` |
| `updated_at` | TIMESTAMPTZ | Auto-update | Dernière modification | `2025-06-30T14:35:00Z` |

#### **Exemples de données**

**Politique mots de passe utilisateurs :**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440001",
  "policy_name": "USER_PASSWORD_POLICY",
  "policy_type": "AUTHENTICATION",
  "target_role": "USER",
  "is_active": true,
  "priority": 10,
  "configuration": {
    "min_length": 8,
    "max_length": 128,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_special_chars": true,
    "forbidden_patterns": ["123456", "password", "azerty"],
    "history_check": 5,
    "expiry_days": 365,
    "complexity_score_min": 60
  },
  "created_by": "security_admin_001",
  "description": "Politique de mots de passe pour utilisateurs standards",
  "effective_date": "2025-06-30T00:00:00Z",
  "review_date": "2025-12-30T00:00:00Z",
  "metadata": {
    "version": "1.2",
    "compliance": ["ISO27001", "GDPR"],
    "last_audit": "2025-06-01"
  },
  "created_at": "2025-06-30T14:35:00Z",
  "updated_at": "2025-06-30T14:35:00Z"
}
```

**Politique sessions administrateurs :**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440002",
  "policy_name": "ADMIN_SESSION_POLICY",
  "policy_type": "AUTHENTICATION",
  "target_role": "ADMIN",
  "is_active": true,
  "priority": 20,
  "configuration": {
    "max_duration_hours": 8,
    "inactivity_timeout_minutes": 30,
    "concurrent_sessions_max": 2,
    "ip_restriction": true,
    "allowed_ip_ranges": ["192.168.1.0/24", "10.0.0.0/8"],
    "mfa_required": true,
    "mfa_reauth_hours": 4,
    "device_registration_required": true,
    "suspicious_activity_lockout": true
  },
  "created_by": "security_admin_001",
  "description": "Politique stricte pour sessions administrateurs",
  "effective_date": "2025-06-30T00:00:00Z",
  "review_date": "2025-09-30T00:00:00Z",
  "metadata": {
    "version": "2.0",
    "security_level": "CRITICAL",
    "compliance": ["SOX", "ISO27001"]
  },
  "created_at": "2025-06-30T14:35:00Z",
  "updated_at": "2025-06-30T14:35:00Z"
}
```

**Politique audit et logs :**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440003",
  "policy_name": "AUDIT_LOGGING_POLICY",
  "policy_type": "AUDIT",
  "target_role": "ALL",
  "is_active": true,
  "priority": 30,
  "configuration": {
    "log_levels": ["CREATE", "UPDATE", "DELETE", "LOGIN", "ACCESS"],
    "retention_days": 2555,
    "sensitive_data_masking": true,
    "real_time_alerts": {
      "critical_events": true,
      "failed_logins_threshold": 5,
      "admin_actions": true,
      "data_exports": true
    },
    "storage": {
      "primary": "database",
      "backup": "encrypted_archive",
      "offsite": true
    },
    "compliance_reports": {
      "frequency": "monthly",
      "recipients": ["compliance@club.tn", "security@club.tn"]
    }
  },
  "created_by": "compliance_officer_001",
  "description": "Politique d'audit et conservation logs",
  "effective_date": "2025-01-01T00:00:00Z",
  "review_date": "2025-12-31T00:00:00Z",
  "metadata": {
    "version": "1.0",
    "legal_requirement": true,
    "compliance": ["GDPR", "Local_Law"]
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-06-30T14:35:00Z"
}
```

---

## 📊 ÉNUMÉRATIONS DÉTAILLÉES

### Actions d'audit
```sql
CREATE TYPE audit_action AS ENUM (
    'CREATE',       -- Création d'entité
    'UPDATE',       -- Modification
    'DELETE',       -- Suppression
    'LOGIN',        -- Connexion
    'LOGOUT',       -- Déconnexion
    'ACCESS',       -- Accès ressource
    'EXPORT',       -- Export données
    'IMPORT',       -- Import données
    'APPROVE',      -- Approbation
    'REJECT'        -- Rejet
);
```

### Niveaux de sécurité
```sql
CREATE TYPE security_level AS ENUM (
    'LOW',          -- Faible
    'MEDIUM',       -- Moyen
    'HIGH',         -- Élevé
    'CRITICAL'      -- Critique
);
```

### Méthodes MFA
```sql
CREATE TYPE mfa_method AS ENUM (
    'SMS',          -- SMS
    'EMAIL',        -- Email
    'TOTP',         -- Authenticator app
    'BACKUP_CODE'   -- Code de secours
);
```

---

## 🔄 RELATIONS ET LOGIQUE MÉTIER

### Flux d'authentification sécurisée

1. **Tentative connexion** → Enregistrement `login_attempts`
2. **Validation credentials** → Vérification politique mot de passe
3. **MFA requis** → Génération `mfa_tokens` 
4. **Succès** → Création `user_sessions` + Audit `audit_logs`
5. **Surveillance** → Monitoring `rate_limiting` + `security_events`

### Détection automatique des menaces

- **Rate limiting** déclenche alerte si seuils dépassés
- **Patterns suspects** génèrent `security_events`
- **Géolocalisation** inhabituelle déclenche MFA
- **Réponses automatiques** selon `security_policies`

### Gestion des sessions

- **Expiration automatique** selon politique
- **Révocation centralisée** possible
- **Limitation sessions simultanées** par utilisateur
- **Tracking activité** pour détection anomalies

**Ce module assure une sécurité complète avec traçabilité totale et détection proactive des menaces.**