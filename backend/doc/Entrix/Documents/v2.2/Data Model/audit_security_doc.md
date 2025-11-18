# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Audit, Sécurité et Rate Limiting

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel constitue l'épine dorsale sécuritaire d'Entrix V3.0, assurant la protection, la surveillance et la conformité de toutes les opérations de la plateforme. Il gère la traçabilité complète, la détection d'anomalies et la protection contre les abus.

### Principes de conception
- **Sécurité par défaut** : Protection maximale dès la conception
- **Zéro trust** : Vérification systématique de tous les accès
- **Résilience** : Continuité de service malgré les attaques
- **Conformité** : Respect des réglementations internationales

---

## 📝 Table `audit_logs` - Journal d'audit global

**Description** : Enregistrement exhaustif de toutes les actions critiques effectuées dans le système pour conformité et sécurité.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `user_id` | UUID | NULL, FK | - | Utilisateur acteur |
| `table_name` | VARCHAR(100) | NOT NULL | - | Table impactée |
| `record_id` | UUID | NULL | - | ID enregistrement |
| `action` | ENUM | NOT NULL | - | Type d'action |
| `old_values` | JSONB | NULL | - | Valeurs avant |
| `new_values` | JSONB | NULL | - | Valeurs après |
| `ip_address` | INET | NULL | - | Adresse IP |
| `user_agent` | TEXT | NULL | - | User agent |
| `severity` | ENUM | NOT NULL | 'STANDARD' | Niveau gravité |
| `description` | TEXT | NULL | - | Description action |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date action |

### Valeurs ENUM

#### `action`
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

#### `severity`
- `LOW` : Faible
- `STANDARD` : Standard
- `HIGH` : Élevée
- `CRITICAL` : Critique

### Structure JSONB `metadata`

```json
{
  "context": {
    "module": "ticketing",
    "feature": "transfer_ticket",
    "version": "3.0.0"
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

---

## 🔐 Table `user_sessions` - Sessions utilisateur

**Description** : Gestion des sessions actives et historique des connexions utilisateur pour sécurité et traçabilité.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique session |
| `session_token` | VARCHAR(255) | UNIQUE, NOT NULL | - | Token session |
| `user_id` | UUID | NOT NULL, FK | - | Référence utilisateur |
| `ip_address` | INET | NOT NULL | - | Adresse IP connexion |
| `user_agent` | TEXT | NULL | - | User agent |
| `device_fingerprint` | VARCHAR(255) | NULL | - | Empreinte appareil |
| `geolocation` | JSONB | NULL | - | Localisation géographique |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Session active |
| `last_activity` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière activité |
| `expires_at` | TIMESTAMPTZ | NOT NULL | - | Expiration session |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Structure JSONB `geolocation`

```json
{
  "country": "TN",
  "country_name": "Tunisia",
  "region": "Tunis",
  "city": "Tunis",
  "latitude": 36.8065,
  "longitude": 10.1815,
  "timezone": "Africa/Tunis",
  "isp": "Tunisie Telecom",
  "vpn_detected": false,
  "risk_score": 2
}
```

---

## 🚪 Table `login_attempts` - Tentatives de connexion

**Description** : Surveillance des tentatives de connexion pour sécurité et détection d'intrusions.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `email` | VARCHAR(255) | NOT NULL | - | Email tentative |
| `user_id` | UUID | NULL, FK | - | Utilisateur si existant |
| `ip_address` | INET | NOT NULL | - | Adresse IP |
| `user_agent` | TEXT | NULL | - | User agent |
| `success` | BOOLEAN | NOT NULL | - | Tentative réussie |
| `failure_reason` | VARCHAR(100) | NULL | - | Raison échec |
| `is_suspicious` | BOOLEAN | NOT NULL | FALSE | Activité suspecte |
| `geolocation` | JSONB | NULL | - | Localisation |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date tentative |

---

## 🚨 Table `security_events` - Événements de sécurité

**Description** : Détection et gestion des événements de sécurité automatiques et manuels.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `event_type` | VARCHAR(100) | NOT NULL | - | Type événement |
| `severity` | ENUM | NOT NULL | - | Niveau gravité |
| `target_user_id` | UUID | NULL, FK | - | Utilisateur cible |
| `ip_address` | INET | NULL | - | Adresse IP |
| `description` | TEXT | NOT NULL | - | Description événement |
| `event_data` | JSONB | NULL | - | Données événement |
| `status` | VARCHAR(50) | NOT NULL | 'OPEN' | Statut événement |
| `resolved_at` | TIMESTAMPTZ | NULL | - | Date résolution |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |

### Valeurs ENUM `severity`

- `LOW` : Faible
- `MEDIUM` : Moyen
- `HIGH` : Élevé
- `CRITICAL` : Critique

---

## 🔑 Table `mfa_tokens` - Tokens MFA

**Description** : Gestion des tokens d'authentification multi-facteurs temporaires.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `user_id` | UUID | NOT NULL, FK | - | Référence utilisateur |
| `method` | ENUM | NOT NULL | - | Méthode MFA |
| `token_hash` | VARCHAR(255) | NOT NULL | - | Hash du token |
| `secret` | VARCHAR(255) | NULL | - | Secret TOTP |
| `expires_at` | TIMESTAMPTZ | NOT NULL | - | Expiration token |
| `is_used` | BOOLEAN | NOT NULL | FALSE | Token utilisé |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `used_at` | TIMESTAMPTZ | NULL | - | Date utilisation |

### Valeurs ENUM `method`

- `TOTP` : Time-based OTP
- `SMS` : Code par SMS
- `EMAIL` : Code par email
- `PUSH` : Notification push

---

## ⚡ Table `rate_limiting` - Limitation de taux

**Description** : Gestion des limites de débit pour protéger contre les abus et surcharges.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `endpoint` | VARCHAR(200) | NOT NULL | - | Endpoint API |
| `identifier_type` | VARCHAR(50) | NOT NULL | - | Type identifiant |
| `identifier_value` | VARCHAR(255) | NOT NULL | - | Valeur identifiant |
| `requests_count` | INTEGER | NOT NULL | 1 | Nombre requêtes |
| `window_start` | TIMESTAMPTZ | NOT NULL | NOW() | Début fenêtre |
| `is_blocked` | BOOLEAN | NOT NULL | FALSE | Identifiant bloqué |
| `last_request` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière requête |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

---

## 🛡️ Table `security_policies` - Politiques de sécurité

**Description** : Configuration des politiques de sécurité et règles de protection.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(50) | NOT NULL | - | Code politique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom politique |
| `description` | TEXT | NULL | - | Description |
| `policy_type` | VARCHAR(50) | NOT NULL | - | Type politique |
| `rules` | JSONB | NOT NULL | - | Règles configuration |
| `valid_from` | TIMESTAMPTZ | NOT NULL | NOW() | Début validité |
| `valid_until` | TIMESTAMPTZ | NULL | - | Fin validité |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Politique active |
| `is_enforced` | BOOLEAN | NOT NULL | TRUE | Application forcée |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Structure JSONB `rules`

```json
{
  "password_policy": {
    "min_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_symbols": true,
    "max_age_days": 90
  },
  "session_policy": {
    "max_concurrent_sessions": 5,
    "idle_timeout_minutes": 30,
    "absolute_timeout_hours": 8
  },
  "rate_limiting": {
    "login_attempts": 5,
    "window_minutes": 15,
    "lockout_duration_minutes": 30
  }
}
```

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Audit logs ↔ Utilisateurs
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Sessions ↔ Utilisateurs
ALTER TABLE user_sessions 
ADD CONSTRAINT fk_user_sessions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Login attempts ↔ Utilisateurs
ALTER TABLE login_attempts 
ADD CONSTRAINT fk_login_attempts_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Security events ↔ Utilisateurs
ALTER TABLE security_events 
ADD CONSTRAINT fk_security_events_target_user 
FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- MFA tokens ↔ Utilisateurs
ALTER TABLE mfa_tokens 
ADD CONSTRAINT fk_mfa_tokens_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### Contraintes de validation

```sql
-- Session token unique
ALTER TABLE user_sessions ADD CONSTRAINT uk_user_sessions_token 
UNIQUE (session_token);

-- Expiration sessions cohérente
ALTER TABLE user_sessions ADD CONSTRAINT chk_user_sessions_expires 
CHECK (expires_at > created_at);

-- Email format valide
ALTER TABLE login_attempts ADD CONSTRAINT chk_login_attempts_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Table name non vide
ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_table_name 
CHECK (LENGTH(TRIM(table_name)) > 0);

-- Requests count positif
ALTER TABLE rate_limiting ADD CONSTRAINT chk_rate_limiting_requests_positive 
CHECK (requests_count >= 0);
```

### Index de performance

```sql
-- Audit logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- User sessions
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Login attempts
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX idx_login_attempts_suspicious ON login_attempts(is_suspicious);

-- Security events
CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_status ON security_events(status);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);

-- Rate limiting
CREATE INDEX idx_rate_limiting_endpoint ON rate_limiting(endpoint);
CREATE INDEX idx_rate_limiting_identifier ON rate_limiting(identifier_type, identifier_value);
CREATE INDEX idx_rate_limiting_window_start ON rate_limiting(window_start);
```

---

## 📊 Métriques et KPIs de sécurité

### Indicateurs de menaces
- **Tentatives d'intrusion** : Nombre par période
- **Taux de détection** : % menaces identifiées
- **Temps de réponse** : Délai détection → mitigation
- **Faux positifs** : % alertes non fondées

### Indicateurs de conformité
- **Couverture audit** : % actions tracées
- **Rétention logs** : Conformité durées légales
- **Violations GDPR** : Incidents données personnelles
- **Rapports réglementaires** : Déclarations obligatoires

### Indicateurs opérationnels
- **Disponibilité** : Uptime services critiques
- **Performance sécurité** : Impact sur latence
- **Efficacité rate limiting** : % abus bloqués
- **Sessions actives** : Nombre d'utilisateurs connectés

### Dashboard de sécurité temps réel
- **Alertes actives** : Événements en cours
- **Géolocalisation connexions** : Carte mondiale
- **Top IP suspectes** : Sources principales
- **Évolution tentatives** : Tendances sécuritaires

Cette documentation complète le système de sécurité d'Entrix V3.0, assurant une protection robuste, une surveillance continue et une conformité réglementaire pour toutes les opérations de la plateforme.