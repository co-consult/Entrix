# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Authentification et Sessions

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel gère l'authentification des utilisateurs, les sessions actives, la sécurité des accès et les mécanismes de récupération. Il intègre les nouveaux besoins d'onboarding via clés secrètes pour les utilisateurs anonymes.

### Principes de conception
- **Sécurité multicouche** : Authentification robuste et sessions sécurisées
- **Flexibilité d'accès** : Support multi-appareils et sessions parallèles
- **Onboarding intelligent** : Conversion utilisateurs anonymes via clés secrètes
- **Audit complet** : Traçabilité de toutes les activités d'authentification

---

## 🔐 Table `user_sessions` - Sessions utilisateur

**Description** : Gestion des sessions actives et historique des connexions utilisateur pour sécurité et traçabilité.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique session |
| `user_id` | UUID | NOT NULL, FK | - | Référence utilisateur |
| `session_token` | VARCHAR(255) | UNIQUE, NOT NULL | - | Token session crypté |
| `refresh_token` | VARCHAR(255) | UNIQUE, NULL | - | Token rafraîchissement |
| `device_type` | ENUM | NOT NULL | - | Type d'appareil |
| `device_id` | VARCHAR(255) | NULL | - | Identifiant appareil |
| `device_name` | VARCHAR(100) | NULL | - | Nom appareil |
| `browser_name` | VARCHAR(50) | NULL | - | Nom navigateur |
| `browser_version` | VARCHAR(20) | NULL | - | Version navigateur |
| `os_name` | VARCHAR(50) | NULL | - | Système exploitation |
| `os_version` | VARCHAR(20) | NULL | - | Version OS |
| `ip_address` | INET | NOT NULL | - | Adresse IP connexion |
| `geolocation` | JSONB | NULL | - | Localisation géographique |
| `user_agent` | TEXT | NULL | - | User agent complet |
| `status` | ENUM | NOT NULL | 'ACTIVE' | Statut session |
| `login_method` | ENUM | NOT NULL | - | Méthode connexion |
| `two_factor_verified` | BOOLEAN | NOT NULL | FALSE | 2FA vérifié |
| `is_trusted_device` | BOOLEAN | NOT NULL | FALSE | Appareil de confiance |
| `remember_me` | BOOLEAN | NOT NULL | FALSE | Se souvenir de moi |
| `expires_at` | TIMESTAMPTZ | NOT NULL | - | Expiration session |
| `last_activity_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière activité |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `ended_at` | TIMESTAMPTZ | NULL | - | Date fin session |
| `ended_reason` | ENUM | NULL | - | Raison fin session |

### Valeurs ENUM

#### `device_type`
- `DESKTOP` : Ordinateur de bureau
- `LAPTOP` : Ordinateur portable
- `TABLET` : Tablette
- `MOBILE` : Téléphone mobile
- `TV` : Télévision connectée
- `WATCH` : Montre connectée
- `OTHER` : Autre appareil

#### `status`
- `ACTIVE` : Session active
- `EXPIRED` : Session expirée
- `TERMINATED` : Session terminée
- `SUSPENDED` : Session suspendue
- `COMPROMISED` : Session compromise

#### `login_method`
- `PASSWORD` : Mot de passe
- `SOCIAL_GOOGLE` : Connexion Google
- `SOCIAL_FACEBOOK` : Connexion Facebook
- `SOCIAL_APPLE` : Connexion Apple
- `SMS_OTP` : Code SMS
- `EMAIL_MAGIC_LINK` : Lien magique email
- `BIOMETRIC` : Biométrie
- `SSO` : Single Sign-On

#### `ended_reason`
- `LOGOUT` : Déconnexion volontaire
- `TIMEOUT` : Expiration inactivité
- `EXPIRED` : Expiration naturelle
- `TERMINATED_BY_USER` : Terminée par utilisateur
- `TERMINATED_BY_ADMIN` : Terminée par admin
- `SECURITY_BREACH` : Violation sécurité
- `DEVICE_LIMIT` : Limite appareils atteinte

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

## 🔑 Table `user_password_resets` - Réinitialisations mot de passe

**Description** : Gestion sécurisée des demandes de réinitialisation de mot de passe avec tokens temporaires.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `user_id` | UUID | NOT NULL, FK | - | Référence utilisateur |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | - | Token réinitialisation |
| `email` | VARCHAR(255) | NOT NULL | - | Email destination |
| `ip_address` | INET | NOT NULL | - | IP demande |
| `user_agent` | TEXT | NULL | - | User agent |
| `attempts` | INTEGER | NOT NULL | 0 | Tentatives utilisation |
| `max_attempts` | INTEGER | NOT NULL | 3 | Max tentatives |
| `used_at` | TIMESTAMPTZ | NULL | - | Date utilisation |
| `expires_at` | TIMESTAMPTZ | NOT NULL | - | Expiration token |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |

---

## 📱 Table `user_two_factor` - Authentification 2FA

**Description** : Configuration et gestion de l'authentification à deux facteurs pour sécurité renforcée.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `user_id` | UUID | PRIMARY KEY, FK | - | Référence utilisateur |
| `method` | ENUM | NOT NULL | - | Méthode 2FA |
| `is_enabled` | BOOLEAN | NOT NULL | FALSE | 2FA activé |
| `secret_key` | VARCHAR(255) | NULL | - | Clé secrète TOTP |
| `backup_codes` | TEXT[] | NULL | - | Codes de sauvegarde |
| `phone_number` | VARCHAR(20) | NULL | - | Numéro SMS |
| `phone_verified` | BOOLEAN | NOT NULL | FALSE | Téléphone vérifié |
| `recovery_email` | VARCHAR(255) | NULL | - | Email récupération |
| `last_used_at` | TIMESTAMPTZ | NULL | - | Dernière utilisation |
| `failed_attempts` | INTEGER | NOT NULL | 0 | Tentatives échouées |
| `locked_until` | TIMESTAMPTZ | NULL | - | Verrouillé jusqu'à |
| `enabled_at` | TIMESTAMPTZ | NULL | - | Date activation |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM `method`

- `TOTP` : Time-based OTP (Google Authenticator)
- `SMS` : Code par SMS
- `EMAIL` : Code par email
- `PUSH` : Notification push
- `HARDWARE_TOKEN` : Token matériel
- `BIOMETRIC` : Empreinte/Face ID

---



## 🔒 Table `user_login_attempts` - Tentatives de connexion

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
| `failure_reason` | ENUM | NULL | - | Raison échec |
| `session_id` | UUID | NULL, FK | - | Session créée si succès |
| `geolocation` | JSONB | NULL | - | Localisation |
| `risk_score` | INTEGER | NOT NULL | 0 | Score risque (0-100) |
| `blocked_by_rate_limit` | BOOLEAN | NOT NULL | FALSE | Bloqué rate limiting |
| `requires_captcha` | BOOLEAN | NOT NULL | FALSE | CAPTCHA requis |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date tentative |

### Valeurs ENUM `failure_reason`

- `INVALID_EMAIL` : Email inexistant
- `INVALID_PASSWORD` : Mot de passe incorrect
- `ACCOUNT_LOCKED` : Compte verrouillé
- `ACCOUNT_DISABLED` : Compte désactivé
- `EMAIL_NOT_VERIFIED` : Email non vérifié
- `TWO_FACTOR_REQUIRED` : 2FA requis
- `TWO_FACTOR_FAILED` : 2FA échec
- `RATE_LIMITED` : Limite dépassée
- `CAPTCHA_FAILED` : CAPTCHA échec
- `SUSPICIOUS_ACTIVITY` : Activité suspecte

---

## 🛡️ Table `trusted_devices` - Appareils de confiance

**Description** : Gestion des appareils de confiance pour simplifier l'authentification récurrente.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `user_id` | UUID | NOT NULL, FK | - | Référence utilisateur |
| `device_fingerprint` | VARCHAR(255) | NOT NULL | - | Empreinte appareil |
| `device_name` | VARCHAR(100) | NOT NULL | - | Nom appareil |
| `device_type` | ENUM | NOT NULL | - | Type appareil |
| `last_ip` | INET | NOT NULL | - | Dernière IP |
| `last_location` | JSONB | NULL | - | Dernière localisation |
| `trust_score` | INTEGER | NOT NULL | 100 | Score confiance |
| `verified_by_2fa` | BOOLEAN | NOT NULL | FALSE | Vérifié par 2FA |
| `last_used_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière utilisation |
| `expires_at` | TIMESTAMPTZ | NOT NULL | - | Expiration confiance |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Appareil actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date ajout |
| `revoked_at` | TIMESTAMPTZ | NULL | - | Date révocation |

---

## 🔄 Workflows d'authentification

### Workflow connexion standard

1. **Tentative connexion** → Enregistrement dans `user_login_attempts`
2. **Validation identifiants** → Vérification email/password
3. **Contrôles sécurité** → Rate limiting, geolocation, risk score
4. **2FA si requis** → Vérification second facteur
5. **Création session** → Génération tokens dans `user_sessions`
6. **Appareil de confiance** → Mise à jour si applicable



### Workflow réinitialisation mot de passe

1. **Demande utilisateur** → Email avec token sécurisé
2. **Validation token** → Vérification validité et tentatives
3. **Nouveau mot de passe** → Hash et stockage sécurisé
4. **Invalidation sessions** → Déconnexion autres appareils
5. **Notification sécurité** → Alerte changement mot de passe

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Sessions ↔ Utilisateurs
ALTER TABLE user_sessions 
ADD CONSTRAINT fk_sessions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Reset passwords ↔ Utilisateurs
ALTER TABLE user_password_resets 
ADD CONSTRAINT fk_password_resets_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2FA ↔ Utilisateurs
ALTER TABLE user_two_factor 
ADD CONSTRAINT fk_two_factor_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


```

### Index de performance

```sql
-- Recherche sessions actives
CREATE INDEX idx_sessions_active ON user_sessions(user_id, status) 
WHERE status = 'ACTIVE';

-- Recherche par token
CREATE INDEX idx_sessions_token ON user_sessions(session_token);

-- Monitoring tentatives connexion
CREATE INDEX idx_login_attempts_ip_time ON user_login_attempts(ip_address, created_at);


```

### Contraintes de sécurité

```sql
-- Session token minimum 32 caractères
ALTER TABLE user_sessions ADD CONSTRAINT chk_session_token_length 
CHECK (LENGTH(session_token) >= 32);



-- Expiration sessions future
ALTER TABLE user_sessions ADD CONSTRAINT chk_session_expiry 
CHECK (expires_at > created_at);
```

---

## 📊 Métriques et monitoring

### Indicateurs de sécurité
- **Taux échec connexion** : Ratio tentatives échouées/réussies
- **Détection anomalies** : Connexions inhabituelles (IP, géoloc)
- **Adoption 2FA** : % utilisateurs avec 2FA activé
- **Sessions compromises** : Détection et réponse

### Indicateurs de performance
- **Durée moyenne session** : Engagement utilisateur
- **Multi-appareil** : Utilisateurs sur plusieurs devices
- **Géolocalisation** : Répartition géographique connexions
- **Rétention authentification** : Fréquence retour utilisateurs

Cette documentation couvre tous les aspects de l'authentification et des sessions dans Entrix V3.0, permettant une gestion sécurisée et flexible des accès utilisateur avec support des workflows anonymes et des mécanismes de conversion naturelle.