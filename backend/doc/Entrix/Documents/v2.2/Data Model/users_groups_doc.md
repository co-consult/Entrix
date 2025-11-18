# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Users et Groupes

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel gère l'identité des utilisateurs, leurs profils, et les structures de groupes. Il constitue le socle identitaire de la plateforme Entrix tout en supportant les nouveaux cas d'usage anonymes.

### Principes de conception
- **Identité flexible** : Support des utilisateurs enregistrés ET anonymes
- **UUID universels** : Identifiants uniques pour tous les utilisateurs
- **Profils enrichis** : Données personnelles et préférences utilisateur
- **Groupes dynamiques** : Structures collaboratives et organisationnelles

---

## 👥 Table `users` - Utilisateurs

**Description** : Table centrale des utilisateurs enregistrés de la plateforme. Cette table coexiste avec le système de tickets/abonnements anonymes pour une flexibilité maximale.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique universel |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | - | Email principal pour connexion |
| `phone` | VARCHAR(20) | NULL | - | Téléphone mobile international |
| `first_name` | VARCHAR(100) | NOT NULL | - | Prénom de l'utilisateur |
| `last_name` | VARCHAR(100) | NOT NULL | - | Nom de famille |
| `avatar_url` | TEXT | NULL | - | URL vers photo de profil |
| `password_hash` | VARCHAR(255) | NOT NULL | - | Hash BCrypt du mot de passe |
| `date_of_birth` | DATE | NULL | - | Date de naissance |
| `gender` | ENUM | NULL | - | Genre utilisateur |
| `nationality` | VARCHAR(2) | NULL | 'TN' | Code pays ISO nationalité |
| `language_preference` | VARCHAR(5) | NOT NULL | 'fr-TN' | Langue préférée |
| `timezone` | VARCHAR(50) | NOT NULL | 'Africa/Tunis' | Fuseau horaire |
| `profile_completion` | INTEGER | NOT NULL | 0 | Score complétude profil (0-100) |
| `marketing_consent` | BOOLEAN | NOT NULL | FALSE | Accepte communications marketing |
| `data_processing_consent` | BOOLEAN | NOT NULL | TRUE | Consent traitement données |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Compte actif/suspendu |
| `is_verified` | BOOLEAN | NOT NULL | FALSE | Profil vérifié |
| `email_verified_at` | TIMESTAMPTZ | NULL | - | Date vérification email |
| `phone_verified_at` | TIMESTAMPTZ | NULL | - | Date vérification téléphone |
| `preferences` | JSONB | NULL | - | Préférences utilisateur |
| `metadata` | JSONB | NULL | - | Métadonnées flexibles |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création compte |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière modification |
| `last_login_at` | TIMESTAMPTZ | NULL | - | Dernière connexion |

### Valeurs ENUM

#### `gender`
- `MALE` : Homme
- `FEMALE` : Femme  
- `OTHER` : Autre
- `PREFER_NOT_TO_SAY` : Préfère ne pas dire

### Structure JSONB `preferences`

```json
{
  "notifications": {
    "email_marketing": true,
    "sms_marketing": false,
    "event_reminders": true,
    "order_updates": true,
    "last_minute_offers": true
  },
  "display": {
    "theme": "light",
    "currency_display": "TND",
    "date_format": "DD/MM/YYYY",
    "time_format": "24h"
  },
  "events": {
    "favorite_categories": ["SPORTS", "MUSIC"],
    "preferred_venues": ["venue_123", "venue_456"],
    "max_travel_distance": 50,
    "preferred_event_times": ["EVENING"]
  },
  "accessibility": {
    "requires_wheelchair_access": false,
    "requires_hearing_assistance": false,
    "dietary_restrictions": ["VEGETARIAN"],
    "special_needs": "Assistance pour mobilité réduite"
  }
}
```

### Règles de gestion

- **Email unique** : Un email = un seul compte utilisateur
- **Vérification obligatoire** : Email doit être vérifié pour achat
- **Soft delete** : Comptes désactivés avec `is_active = FALSE`
- **GDPR** : Droit à l'effacement avec anonymisation
- **Score profil** : Calculé selon champs remplis et vérifications

---

## 👤 Table `user_profiles` - Profils détaillés

**Description** : Extension des informations utilisateur pour personnalisation et services avancés.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `user_id` | UUID | PRIMARY KEY, FK | - | Référence utilisateur |
| `bio` | TEXT | NULL | - | Biographie/description |
| `website` | VARCHAR(255) | NULL | - | Site web personnel |
| `social_links` | JSONB | NULL | - | Réseaux sociaux |
| `interests` | TEXT[] | NULL | - | Centres d'intérêt |
| `occupation` | VARCHAR(100) | NULL | - | Profession |
| `company` | VARCHAR(200) | NULL | - | Entreprise |
| `education_level` | ENUM | NULL | - | Niveau éducation |
| `income_range` | ENUM | NULL | - | Tranche revenus |
| `family_status` | ENUM | NULL | - | Situation familiale |
| `address_line1` | VARCHAR(255) | NULL | - | Adresse ligne 1 |
| `address_line2` | VARCHAR(255) | NULL | - | Adresse ligne 2 |
| `city` | VARCHAR(100) | NULL | - | Ville |
| `postal_code` | VARCHAR(20) | NULL | - | Code postal |
| `country` | VARCHAR(2) | NULL | 'TN' | Code pays ISO |
| `emergency_contact_name` | VARCHAR(200) | NULL | - | Contact urgence nom |
| `emergency_contact_phone` | VARCHAR(20) | NULL | - | Contact urgence téléphone |
| `loyalty_points` | INTEGER | NOT NULL | 0 | Points fidélité |
| `referral_code` | VARCHAR(20) | UNIQUE | - | Code parrainage |
| `referred_by` | UUID | NULL, FK | - | Parrainé par |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `education_level`
- `PRIMARY` : Primaire
- `SECONDARY` : Secondaire
- `BACHELOR` : Licence/Bachelor
- `MASTER` : Master/Maîtrise
- `PHD` : Doctorat
- `OTHER` : Autre

#### `income_range`
- `UNDER_500` : Moins de 500 TND/mois
- `500_1000` : 500-1000 TND/mois
- `1000_2000` : 1000-2000 TND/mois
- `2000_5000` : 2000-5000 TND/mois
- `OVER_5000` : Plus de 5000 TND/mois

#### `family_status`
- `SINGLE` : Célibataire
- `MARRIED` : Marié(e)
- `DIVORCED` : Divorcé(e)
- `WIDOWED` : Veuf/Veuve
- `PARTNERSHIP` : Union libre

---

## 👥 Table `user_groups` - Groupes d'utilisateurs

**Description** : Groupes constitués d'utilisateurs pour achats groupés, gestion familiale ou organisationnelle.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom du groupe |
| `description` | TEXT | NULL | - | Description/objectif |
| `type` | ENUM | NOT NULL | - | Type de groupe |
| `owner_id` | UUID | NOT NULL, FK | - | Propriétaire du groupe |
| `max_members` | INTEGER | NULL | - | Limite nombre membres |
| `current_members` | INTEGER | NOT NULL | 0 | Nombre actuel membres |
| `is_private` | BOOLEAN | NOT NULL | TRUE | Groupe privé/public |
| `join_approval_required` | BOOLEAN | NOT NULL | TRUE | Approbation nécessaire |
| `settings` | JSONB | NULL | - | Paramètres groupe |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Groupe actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM `type`

- `FAMILY` : Groupe familial
- `FRIENDS` : Groupe d'amis
- `CORPORATE` : Groupe entreprise
- `ASSOCIATION` : Association/club
- `TEMPORARY` : Groupe temporaire pour événement
- `EDUCATIONAL` : Groupe éducatif/école

---

## 👥 Table `user_group_members` - Membres des groupes

**Description** : Liaison entre utilisateurs et groupes avec rôles et permissions spécifiques.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `group_id` | UUID | NOT NULL, FK | - | Référence groupe |
| `user_id` | UUID | NOT NULL, FK | - | Référence utilisateur |
| `role` | ENUM | NOT NULL | 'MEMBER' | Rôle dans le groupe |
| `can_invite` | BOOLEAN | NOT NULL | FALSE | Peut inviter membres |
| `can_purchase` | BOOLEAN | NOT NULL | FALSE | Peut acheter pour groupe |
| `can_manage_events` | BOOLEAN | NOT NULL | FALSE | Peut gérer événements |
| `spending_limit` | DECIMAL(10,2) | NULL | - | Limite dépenses autorisées |
| `joined_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date adhésion |
| `invited_by` | UUID | NULL, FK | - | Invité par |
| `approved_by` | UUID | NULL, FK | - | Approuvé par |
| `approved_at` | TIMESTAMPTZ | NULL | - | Date approbation |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Membre actif |

### Valeurs ENUM `role`

- `OWNER` : Propriétaire (droits complets)
- `ADMIN` : Administrateur
- `MANAGER` : Gestionnaire
- `PURCHASER` : Acheteur autorisé
- `MEMBER` : Membre standard
- `OBSERVER` : Observateur (lecture seule)

---

## 🎯 Intégration avec le système anonyme

### Principe de coexistence

Le modèle users/groupes coexiste avec le nouveau système anonyme :

**Utilisateurs enregistrés** :
- Profil complet avec historique
- Préférences personnalisées
- Points fidélité et avantages
- Gestion groupes et invitations

**Utilisateurs anonymes** :
- Tickets/abonnements avec `user_id = NULL`
- QR codes d'accès fonctionnels
- Clé secrète d'onboarding pour incitation inscription
- Conversion possible vers compte enregistré

### Workflow de conversion anonyme → enregistré

1. **Ticket/abonnement anonyme** créé avec informations de contact
2. **Expérience positive** avec la plateforme
3. **Incitation naturelle** via avantages membres visibles
4. **Processus d'inscription** simplifié et attractif
5. **Migration données** : ticket/abonnement lié au nouveau compte
6. **Avantages immédiats** : points bonus, préférences, historique

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Relation utilisateur ↔ profil (1:1)
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relation groupes ↔ propriétaire (N:1)
ALTER TABLE user_groups 
ADD CONSTRAINT fk_user_groups_owner 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Relation membres ↔ groupe (N:1)
ALTER TABLE user_group_members 
ADD CONSTRAINT fk_group_members_group 
FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE;

-- Relation membres ↔ utilisateur (N:1)
ALTER TABLE user_group_members 
ADD CONSTRAINT fk_group_members_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### Index recommandés

```sql
-- Performance requêtes fréquentes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_groups_owner ON user_groups(owner_id);
CREATE INDEX idx_group_members_group_user ON user_group_members(group_id, user_id);
```

### Contraintes de validation

```sql
-- Email valide
ALTER TABLE users ADD CONSTRAINT chk_users_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Nom/prénom non vides
ALTER TABLE users ADD CONSTRAINT chk_users_names_not_empty 
CHECK (LENGTH(TRIM(first_name)) > 0 AND LENGTH(TRIM(last_name)) > 0);

-- Groupe pas plus de membres que limite
ALTER TABLE user_groups ADD CONSTRAINT chk_group_member_limit 
CHECK (max_members IS NULL OR current_members <= max_members);
```

---

## 📊 Métriques et KPIs

### Indicateurs utilisateurs
- **Taux d'activation** : Utilisateurs avec email vérifié
- **Score de complétude** : Profils renseignés
- **Rétention** : Utilisateurs actifs par période
- **Conversion anonyme** : Taux transformation tickets anonymes → comptes

### Indicateurs groupes
- **Adoption groupes** : % utilisateurs dans groupes
- **Taille moyenne** : Nombre moyen membres par groupe
- **Activité groupes** : Achats via groupes vs individuels
- **Engagement** : Interactions entre membres groupes

Cette documentation constitue la base identitaire de la plateforme Entrix V3.0, permettant une gestion flexible des utilisateurs tout en supportant les nouveaux cas d'usage anonymes.