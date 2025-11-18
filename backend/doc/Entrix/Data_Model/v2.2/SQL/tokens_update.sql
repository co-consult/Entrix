-- Migration Entrix V3.0 - Nouvelles Tables Tokens
-- Ajouter ces tables au schema.prisma puis exécuter : npx prisma db push

-- ============================================================================
-- 1. CRÉER LES NOUVEAUX ENUMS
-- ============================================================================

-- Enum pour les types de tokens persistants
CREATE TYPE persistent_token_type AS ENUM (
  'API_KEY',
  'REFRESH_LONG',
  'ACCESS_LONG',
  'MOBILE_SESSION',
  'INTEGRATION'
);

-- Enum pour les types de tokens de validation
CREATE TYPE validation_token_type AS ENUM (
  'EMAIL_VERIFICATION',
  'EMAIL_CHANGE',
  'PASSWORD_RESET',
  'ACCOUNT_ACTIVATION',
  'INVITATION_USER',
  'INVITATION_GROUP',
  'MAGIC_LINK_LOGIN',
  'MAGIC_LINK_ACTION',
  'PHONE_VERIFICATION',
  'ACCOUNT_DELETION'
);

-- ============================================================================
-- 2. CRÉER LA TABLE PERSISTENT_TOKENS
-- ============================================================================

CREATE TABLE persistent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_type persistent_token_type NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  token_prefix VARCHAR(8) NOT NULL,
  name VARCHAR(100),
  description VARCHAR(255),
  scopes TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_used_ip INET,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  revoked_reason VARCHAR(255),
  device_info JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes et relations
  CONSTRAINT fk_persistent_tokens_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_persistent_tokens_revoked_by 
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uk_persistent_tokens_hash 
    UNIQUE (token_hash)
);

-- Index pour performance
CREATE INDEX idx_persistent_tokens_user ON persistent_tokens(user_id);
CREATE INDEX idx_persistent_tokens_type ON persistent_tokens(token_type);
CREATE INDEX idx_persistent_tokens_user_active ON persistent_tokens(user_id, token_type, is_active);
CREATE INDEX idx_persistent_tokens_expires ON persistent_tokens(expires_at);
CREATE INDEX idx_persistent_tokens_last_used ON persistent_tokens(last_used_at);
CREATE INDEX idx_persistent_tokens_status ON persistent_tokens(is_active, is_revoked);
CREATE INDEX idx_persistent_tokens_created ON persistent_tokens(created_at);
CREATE INDEX idx_persistent_tokens_prefix ON persistent_tokens(token_prefix);

-- ============================================================================
-- 3. CRÉER LA TABLE VALIDATION_TOKENS
-- ============================================================================

CREATE TABLE validation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email VARCHAR(255) NOT NULL,
  token_type validation_token_type NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  token_plain VARCHAR(64), -- Pour tokens courts comme SMS
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  used_ip INET,
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_at TIMESTAMPTZ,
  
  -- Données spécifiques selon le type
  reset_password_data JSONB,
  invitation_data JSONB,
  verification_data JSONB,
  magic_link_data JSONB,
  
  -- Métadonnées
  client_info JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes et relations
  CONSTRAINT fk_validation_tokens_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_validation_tokens_hash 
    UNIQUE (token_hash)
);

-- Index pour performance et sécurité
CREATE INDEX idx_validation_tokens_user ON validation_tokens(user_id);
CREATE INDEX idx_validation_tokens_email ON validation_tokens(email);
CREATE INDEX idx_validation_tokens_type ON validation_tokens(token_type);
CREATE INDEX idx_validation_tokens_email_active ON validation_tokens(email, token_type, is_used);
CREATE INDEX idx_validation_tokens_expires ON validation_tokens(expires_at);
CREATE INDEX idx_validation_tokens_used ON validation_tokens(is_used);
CREATE INDEX idx_validation_tokens_blocked ON validation_tokens(is_blocked);
CREATE INDEX idx_validation_tokens_created ON validation_tokens(created_at);
CREATE INDEX idx_validation_tokens_attempts ON validation_tokens(attempt_count, max_attempts);

-- ============================================================================
-- 4. METTRE À JOUR LA TABLE USERS (RELATIONS)
-- ============================================================================

-- Ajouter les relations dans le modèle Prisma users :
/*
model users {
  // ... champs existants ...
  
  // Nouvelles relations
  persistent_tokens                   persistent_tokens[]
  validation_tokens                   validation_tokens[]
  revoked_persistent_tokens           persistent_tokens[] @relation("persistent_tokens_revoked_by")
  
  // ... relations existantes ...
}
*/

-- ============================================================================
-- 5. DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Créer quelques tokens de test pour validation
-- ATTENTION : Ne pas utiliser en production !

/*
-- Exemple d'API key de test
INSERT INTO persistent_tokens (
  user_id, 
  token_type, 
  token_hash, 
  token_prefix, 
  name, 
  scopes
) VALUES (
  (SELECT id FROM users LIMIT 1),
  'API_KEY',
  '$2b$10$example_hash_here',
  'ent_api_',
  'Test API Key',
  ARRAY['read:profile', 'read:events']
);

-- Exemple de token de vérification email
INSERT INTO validation_tokens (
  user_id,
  email,
  token_type,
  token_hash,
  expires_at,
  verification_data
) VALUES (
  (SELECT id FROM users LIMIT 1),
  'test@example.com',
  'EMAIL_VERIFICATION',
  '$2b$10$example_hash_here',
  NOW() + INTERVAL '24 hours',
  '{"verification_type": "registration"}'::jsonb
);
*/

-- ============================================================================
-- 6. VÉRIFICATIONS POST-MIGRATION
-- ============================================================================

-- Vérifier que les tables ont été créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('persistent_tokens', 'validation_tokens');

-- Vérifier les contraintes
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name IN ('persistent_tokens', 'validation_tokens');

-- Vérifier les index
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('persistent_tokens', 'validation_tokens');

-- ============================================================================
-- 7. COMMANDES PRISMA À EXÉCUTER
-- ============================================================================

/*
1. Ajouter les nouveaux modèles au schema.prisma (copier depuis new_token_tables_schema)

2. Générer et appliquer la migration :
   npx prisma db push

3. Ou créer une migration nommée :
   npx prisma migrate dev --name add_token_tables

4. Générer le client Prisma mis à jour :
   npx prisma generate

5. Vérifier dans Prisma Studio :
   npx prisma studio
*/

-- ============================================================================
-- 8. NOTES IMPORTANTES
-- ============================================================================

/*
SÉCURITÉ :
- Les token_hash utilisent bcrypt ou argon2
- Jamais stocker les tokens en clair (sauf token_plain pour SMS courts)
- Les scopes sont un array PostgreSQL pour flexibilité
- Les métadonnées JSON permettent l'extensibilité

PERFORMANCE :
- Index sur user_id, token_type, expires_at pour requêtes rapides
- Index composites pour les requêtes complexes
- TTL automatique via expires_at

MAINTENANCE :
- Les tâches CRON nettoient automatiquement les tokens expirés
- Les tokens révoqués sont gardés 90 jours pour audit
- Les tokens utilisés sont gardés 30 jours pour historique

MONITORING :
- Tous les événements sont logués
- Statistiques disponibles via les services
- Alertes automatiques sur seuils dépassés
*/