# DOCUMENTATION UTILISATEURS/RÔLES/GROUPES
## Plateforme Entrix - Système de Gestion des Utilisateurs

---

**Version :** 1.0  
**Date :** Juin 2025  
**Système :** Gestion multi-rôles et groupes avec droits granulaires  

---

## 📋 VUE D'ENSEMBLE DU SYSTÈME

### Principe général
Le système de gestion des utilisateurs d'Entrix repose sur une architecture à trois niveaux :

1. **UTILISATEURS** : Identités uniques avec authentification
2. **RÔLES** : Catégories générales définissant le niveau d'accès (USER, SUBSCRIBER, VIP, STAFF, ADMIN)
3. **GROUPES** : Droits spécifiques et segmentation précise (Abonnés Tribune 2025, Loges VIP, Staff Sécurité)

### Règle de priorité
**Le rôle avec le niveau (level) le plus élevé détermine les droits appliqués.**

---

## 🗄️ TABLES DU SYSTÈME

### **1. Table `users`**

#### **Rôle de la table**
Table centrale d'authentification et d'identité unique des utilisateurs. Contient les informations minimales nécessaires pour l'authentification et l'identification.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique utilisateur | `550e8400-e29b-41d4-a716-446655440001` |
| `email` | String | Unique, NOT NULL | Email de connexion | `karim.supporter@email.com` |
| `phone` | String | Optional | Numéro de téléphone | `+216 98 123 456`, `null` |
| `first_name` | String | NOT NULL | Prénom | `Karim`, `Fatma`, `Ahmed` |
| `last_name` | String | NOT NULL | Nom de famille | `Trabelsi`, `Mansouri`, `Ben Ali` |
| `avatar` | String | Optional | URL photo de profil | `/uploads/avatars/user123.jpg`, `null` |
| `password` | String | NOT NULL | Mot de passe hashé bcrypt | `$2b$12$abc123...` |
| `is_active` | Boolean | Default: true | Compte actif ou suspendu | `true`, `false` |
| `email_verified` | DateTime | Optional | Date vérification email | `2025-06-15T10:30:00Z`, `null` |
| `phone_verified` | DateTime | Optional | Date vérification téléphone | `2025-06-15T10:35:00Z`, `null` |
| `created_at` | DateTime | Default: now() | Date création compte | `2025-01-15T09:00:00Z` |
| `updated_at` | DateTime | Auto-update | Dernière modification | `2025-06-20T14:30:00Z` |
| `last_login` | DateTime | Optional | Dernière connexion | `2025-06-20T18:45:00Z`, `null` |

#### **Exemple de données**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "email": "karim.trabelsi@email.com",
  "phone": "+216 98 123 456",
  "first_name": "Karim",
  "last_name": "Trabelsi",
  "avatar": "/uploads/avatars/karim123.jpg",
  "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4uJg9PJ2Jm",
  "is_active": true,
  "email_verified": "2025-01-15T10:30:00Z",
  "phone_verified": "2025-01-15T10:35:00Z",
  "created_at": "2025-01-15T09:00:00Z",
  "updated_at": "2025-06-20T14:30:00Z",
  "last_login": "2025-06-20T18:45:00Z"
}
```

---

### **2. Table `user_profiles`**

#### **Rôle de la table**
Profils étendus des utilisateurs avec informations démographiques, préférences et données spécifiques aux supporters. Séparée de la table users pour optimiser l'authentification.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `660e8400-e29b-41d4-a716-446655440001` |
| `user_id` | UUID | Foreign Key, Unique | Référence utilisateur | UUID de users |
| `date_of_birth` | Date | Optional | Date de naissance | `1985-03-15`, `null` |
| `gender` | gender | Optional | Genre | `MALE`, `FEMALE`, `OTHER` |
| `address` | Text | Optional | Adresse complète | `123 Rue Habib Bourguiba, Tunis` |
| `city` | String | Optional | Ville | `Tunis`, `Sfax`, `Sousse` |
| `country` | String | Default: TN | Code pays ISO | `TN`, `FR`, `MA` |
| `language` | String | Default: fr | Langue préférée | `fr`, `ar`, `en` |
| `notifications` | Boolean | Default: true | Recevoir notifications | `true`, `false` |
| `newsletter` | Boolean | Default: false | Newsletter marketing | `true`, `false` |
| `supporter_since` | Date | Optional | Supporter depuis | `2010-09-01`, `null` |
| `favorite_player` | String | Optional | Joueur favori | `Youssef Msakni`, `Ali Maaloul` |
| `created_at` | DateTime | Default: now() | Date création | `2025-01-15T09:05:00Z` |
| `updated_at` | DateTime | Auto-update | Dernière modification | `2025-06-20T14:30:00Z` |

#### **Exemple de données**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "date_of_birth": "1985-03-15",
  "gender": "MALE",
  "address": "123 Avenue Habib Bourguiba, Tunis 1000",
  "city": "Tunis",
  "country": "TN",
  "language": "fr",
  "notifications": true,
  "newsletter": true,
  "supporter_since": "2010-09-01",
  "favorite_player": "Youssef Msakni",
  "created_at": "2025-01-15T09:05:00Z",
  "updated_at": "2025-06-20T14:30:00Z"
}
```

---

### **3. Table `roles`**

#### **Rôle de la table**
Définition des rôles généraux du système avec hiérarchie par niveaux. Détermine les capacités globales des utilisateurs indépendamment des contextes spécifiques.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `770e8400-e29b-41d4-a716-446655440001` |
| `code` | String | Unique, NOT NULL | Code technique | `USER`, `SUBSCRIBER`, `VIP`, `STAFF`, `ADMIN` |
| `name` | String | NOT NULL | Nom affiché | `Utilisateur Standard`, `Abonné`, `VIP` |
| `description` | Text | Optional | Description détaillée | `Accès de base à la billetterie publique` |
| `level` | Integer | NOT NULL, 0-100 | Niveau hiérarchique | `0`, `10`, `20`, `50`, `100` |
| `is_active` | Boolean | Default: true | Rôle actif | `true`, `false` |
| `created_at` | DateTime | Default: now() | Date création | `2025-01-01T00:00:00Z` |
| `updated_at` | DateTime | Auto-update | Dernière modification | `2025-01-01T00:00:00Z` |

#### **Exemples de données**

**Rôles standards du système :**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "USER",
    "name": "Utilisateur Standard",
    "description": "Accès de base à la billetterie publique",
    "level": 0,
    "is_active": true
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "SUBSCRIBER",
    "name": "Abonné",
    "description": "Accès prioritaire billetterie et tarifs préférentiels",
    "level": 10,
    "is_active": true
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "code": "VIP",
    "name": "VIP",
    "description": "Accès zones premium et services exclusifs",
    "level": 20,
    "is_active": true
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "code": "STAFF",
    "name": "Personnel",
    "description": "Accès back-office et zones restreintes",
    "level": 50,
    "is_active": true
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "code": "ADMIN",
    "name": "Administrateur",
    "description": "Accès complet administration plateforme",
    "level": 100,
    "is_active": true
  }
]
```

---

### **4. Table `groups`**

#### **Rôle de la table**
Groupes pour droits spécifiques et segmentation marketing. Permet un contrôle granulaire des accès et une personnalisation fine de l'expérience utilisateur.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `880e8400-e29b-41d4-a716-446655440001` |
| `code` | String | Unique, NOT NULL | Code technique | `TRIBUNES_2025`, `VIP_LOGES_2025` |
| `name` | String | NOT NULL | Nom affiché | `Abonnés Tribunes Saison 2025` |
| `description` | Text | Optional | Description détaillée | `Accès à tous les matchs domicile en tribune` |
| `type` | group_type | NOT NULL | Type de groupe | `ACCESS`, `MARKETING`, `MIXED` |
| `valid_from` | DateTime | Default: now() | Date début validité | `2024-09-01T00:00:00Z` |
| `valid_until` | DateTime | Optional | Date fin validité | `2025-05-31T23:59:59Z`, `null` |
| `is_active` | Boolean | Default: true | Groupe actif | `true`, `false` |
| `max_members` | Integer | Optional | Limite membres | `8800`, `200`, `null` |
| `metadata` | JSONB | Optional | Configuration JSON | Voir exemples |
| `created_at` | DateTime | Default: now() | Date création | `2024-08-01T10:00:00Z` |
| `updated_at` | DateTime | Auto-update | Dernière modification | `2024-08-01T10:00:00Z` |

#### **Types de groupes**
- **ACCESS** : Droits d'accès physique uniquement
- **MARKETING** : Segmentation marketing uniquement  
- **MIXED** : Droits d'accès + segmentation marketing

#### **Exemples de données**

**Groupe d'accès saisonnier :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "code": "TRIBUNES_2025",
  "name": "Abonnés Tribunes Saison 2025",
  "description": "Accès à tous les matchs domicile en tribune principale",
  "type": "ACCESS",
  "valid_from": "2024-09-01T00:00:00Z",
  "valid_until": "2025-05-31T23:59:59Z",
  "is_active": true,
  "max_members": 8800,
  "metadata": {
    "zones": ["tribune_principale"],
    "services": ["parking_standard"],
    "season": "2024-2025",
    "matchTypes": ["championship", "cup"],
    "restrictions": {
      "noAwayMatches": true,
      "derbyRequiresSupplement": true
    }
  }
}
```

**Groupe VIP premium :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440002",
  "code": "VIP_LOGES_2025",
  "name": "Loges VIP Saison 2025",
  "description": "Accès loges VIP avec services premium",
  "type": "ACCESS",
  "valid_from": "2024-09-01T00:00:00Z",
  "valid_until": "2025-05-31T23:59:59Z",
  "is_active": true,
  "max_members": 200,
  "metadata": {
    "zones": ["loges_vip", "salon_vip", "parking_vip"],
    "services": ["parking_vip", "cocktail", "restauration", "concierge"],
    "amenities": ["climatisation", "wifi_premium", "tv_prive"],
    "benefits": {
      "freeParking": true,
      "priorityBooking": true,
      "exclusiveEvents": true,
      "transferRights": 2
    }
  }
}
```

**Groupe marketing segmenté :**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440005",
  "code": "SUPPORTERS_ANCIENS",
  "name": "Supporters Historiques",
  "description": "Supporters du club depuis plus de 10 ans",
  "type": "MARKETING",
  "valid_from": "2024-01-01T00:00:00Z",
  "valid_until": null,
  "is_active": true,
  "max_members": null,
  "metadata": {
    "criteria": {
      "minYearsSupport": 10,
      "loyaltyScore": "high"
    },
    "benefits": [
      "discount_15_percent",
      "priority_tickets",
      "exclusive_merchandise"
    ],
    "communications": [
      "newsletter_exclusive",
      "invitations_events",
      "behind_scenes_content"
    ],
    "targeting": {
      "preferredChannels": ["email", "sms"],
      "frequency": "weekly",
      "contentTypes": ["history", "legends", "nostalgia"]
    }
  }
}
```

---

### **5. Table `user_roles`**

#### **Rôle de la table**
Table de liaison entre utilisateurs et rôles avec gestion temporelle. Permet d'assigner plusieurs rôles à un utilisateur avec des périodes de validité distinctes.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `990e8400-e29b-41d4-a716-446655440001` |
| `user_id` | UUID | Foreign Key | Référence utilisateur | UUID de users |
| `role_id` | UUID | Foreign Key | Référence rôle | UUID de roles |
| `assigned_at` | DateTime | Default: now() | Date attribution | `2025-01-15T10:00:00Z` |
| `valid_until` | DateTime | Optional | Date expiration | `2025-12-31T23:59:59Z`, `null` |
| `status` | membership_status | Default: ACTIVE | Statut attribution | `ACTIVE`, `SUSPENDED`, `EXPIRED` |
| `assigned_by` | UUID | Foreign Key, Optional | Attribué par | UUID de users (admin) |
| `notes` | Text | Optional | Notes attribution | `Promotion client fidèle` |
| `created_at` | DateTime | Default: now() | Date création | `2025-01-15T10:00:00Z` |
| `updated_at` | DateTime | Auto-update | Dernière modification | `2025-01-15T10:00:00Z` |

#### **Contraintes métier**
- Un utilisateur ne peut avoir qu'une seule attribution active par rôle
- Validation automatique de la hiérarchie des rôles
- Nettoyage automatique des attributions expirées

---

### **6. Table `user_groups`**

#### **Rôle de la table**
Table de liaison entre utilisateurs et groupes avec métadonnées spécifiques. Permet l'appartenance à plusieurs groupes avec des configurations individualisées.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | UUID | Primary Key | Identifiant unique | `aa0e8400-e29b-41d4-a716-446655440001` |
| `user_id` | UUID | Foreign Key | Référence utilisateur | UUID de users |
| `group_id` | UUID | Foreign Key | Référence groupe | UUID de groups |
| `joined_at` | DateTime | Default: now() | Date adhésion | `2024-09-01T09:00:00Z` |
| `valid_until` | DateTime | Optional | Date expiration | `2025-05-31T23:59:59Z`, `null` |
| `status` | membership_status | Default: ACTIVE | Statut appartenance | `ACTIVE`, `SUSPENDED`, `EXPIRED` |
| `metadata` | JSONB | Optional | Données spécifiques | Voir exemples |
| `added_by` | UUID | Foreign Key, Optional | Ajouté par | UUID de users (admin) |
| `notes` | Text | Optional | Notes appartenance | `Transfert depuis groupe 2024` |
| `created_at` | DateTime | Default: now() | Date création | `2024-09-01T09:00:00Z` |
| `updated_at` | DateTime | Auto-update | Dernière modification | `2024-09-01T09:00:00Z` |

#### **Exemples de métadonnées**

**Abonné avec place assignée :**
```json
{
  "assignedSeat": {
    "zone": "tribune_principale",
    "sector": "B",
    "row": "15",
    "seat": "23"
  },
  "preferences": {
    "parkingSpot": "P2-145",
    "notifications": ["matchday", "delays"],
    "merchandise": true
  },
  "history": {
    "previousSeasons": ["2023-2024", "2022-2023"],
    "loyaltyPoints": 150,
    "referrals": 2
  }
}
```

**Membre VIP avec privilèges :**
```json
{
  "vipLevel": "GOLD",
  "assignedLoge": "L-05",
  "conciergeContact": "+216 98 765 432",
  "transferRights": {
    "remaining": 2,
    "used": 0,
    "restrictions": ["family_only"]
  },
  "preferences": {
    "cateringMenu": "premium",
    "beveragePackage": "complete",
    "parkingType": "valet"
  },
  "specialAccess": [
    "player_tunnel_visit",
    "coach_interviews",
    "training_sessions"
  ]
}
```

---

## 📊 ÉNUMÉRATIONS DÉTAILLÉES

### Types de genre
```sql
CREATE TYPE gender AS ENUM (
    'MALE',     -- Masculin
    'FEMALE',   -- Féminin  
    'OTHER'     -- Autre/Non spécifié
);
```

### Types de groupes
```sql
CREATE TYPE group_type AS ENUM (
    'ACCESS',    -- Groupe de droits d'accès uniquement
    'MARKETING', -- Groupe de segmentation marketing uniquement
    'MIXED'      -- Groupe mixte (accès + marketing)
);
```

### Statuts d'appartenance
```sql
CREATE TYPE membership_status AS ENUM (
    'ACTIVE',    -- Appartenance active
    'SUSPENDED', -- Suspendue temporairement  
    'EXPIRED',   -- Expirée (dépassement date limite)
    'CANCELLED'  -- Annulée définitivement
);
```

---

## 🔄 EXEMPLES D'USAGE COMPLETS

### **Cas 1 : Supporter Standard avec Abonnement**

**Utilisateur "Karim Trabelsi" :**
```json
{
  "user": {
    "email": "karim.trabelsi@email.com",
    "first_name": "Karim",
    "last_name": "Trabelsi", 
    "is_active": true
  },
  "profile": {
    "city": "Tunis",
    "supporter_since": "2010-09-01",
    "favorite_player": "Youssef Msakni",
    "notifications": true,
    "language": "fr"
  },
  "roles": [
    {
      "role": "SUBSCRIBER",
      "level": 10,
      "assigned_at": "2024-09-01T10:00:00Z",
      "valid_until": "2025-05-31T23:59:59Z",
      "status": "ACTIVE"
    }
  ],
  "groups": [
    {
      "group": "TRIBUNES_2025",
      "type": "ACCESS",
      "metadata": {
        "assignedSeat": {"zone": "tribune_principale", "sector": "B", "row": "15", "seat": "23"},
        "preferences": {"parkingSpot": "P2-145"}
      },
      "valid_until": "2025-05-31T23:59:59Z"
    },
    {
      "group": "SUPPORTERS_ANCIENS",
      "type": "MARKETING",
      "metadata": {"loyaltyPoints": 150, "yearsSupportActive": 15},
      "valid_until": null
    }
  ]
}
```

**Droits résultants :**
- **Rôle appliqué** : SUBSCRIBER (level 10)
- **Accès billetterie** : Phase prioritaire abonnés
- **Accès physique** : Tribune principale, place B-15-23, parking P2-145
- **Marketing** : Communications supporters anciens + réductions 15%

### **Cas 2 : Client VIP Multi-Groupes**

**Utilisateur "Amina Ben Salem" :**
```json
{
  "user": {
    "email": "amina.bensalem@business.tn",
    "first_name": "Amina",
    "last_name": "Ben Salem",
    "is_active": true
  },
  "profile": {
    "city": "Tunis",
    "supporter_since": "2015-01-01",
    "notifications": true,
    "language": "fr"
  },
  "roles": [
    {
      "role": "VIP",
      "level": 20,
      "assigned_at": "2024-09-01T10:00:00Z",
      "valid_until": null,
      "status": "ACTIVE"
    }
  ],
  "groups": [
    {
      "group": "VIP_LOGES_2025",
      "type": "ACCESS",
      "metadata": {
        "assignedLoge": "L-05",
        "vipLevel": "GOLD",
        "conciergeContact": "+216 98 765 432",
        "transferRights": {"remaining": 2, "used": 0}
      },
      "valid_until": "2025-05-31T23:59:59Z"
    },
    {
      "group": "CORPORATE_CLIENTS",
      "type": "MARKETING", 
      "metadata": {"companyName": "TechCorp", "packageType": "premium"},
      "valid_until": null
    }
  ]
}
```

**Droits résultants :**
- **Rôle appliqué** : VIP (level 20) 
- **Accès billetterie** : Phase VIP (ultra-priorité)
- **Accès physique** : Loge L-05, salon VIP, parking premium
- **Marketing** : Communications corporate + invitations événements
- **Services** : Cocktail pré-match, concierge, visibilité publicitaire

### **Cas 3 : Staff Multi-Fonctions**

**Utilisateur "Sami Benaissa" :**
```json
{
  "user": {
    "email": "sami.security@club.tn",
    "first_name": "Sami",
    "last_name": "Benaissa", 
    "is_active": true
  },
  "profile": {
    "city": "Tunis",
    "notifications": true,
    "language": "fr"
  },
  "roles": [
    {
      "role": "STAFF",
      "level": 50,
      "valid_until": null,
      "status": "ACTIVE"
    }
  ],
  "groups": [
    {
      "group": "STAFF_SECURITY",
      "type": "ACCESS",
      "metadata": {"badge": "SEC-001", "clearanceLevel": "high", "zones": "all"},
      "valid_until": null
    },
    {
      "group": "ACCESS_CONTROLLERS",
      "type": "ACCESS", 
      "metadata": {"assignedGates": ["portail_a", "entree_vip"], "shift": "evening"},
      "valid_until": null
    },
    {
      "group": "PERSONNEL_PERMANENT",
      "type": "MARKETING",
      "metadata": {"employeeId": "EMP-001", "department": "security", "seniority": 5},
      "valid_until": null
    }
  ]
}
```

**Droits résultants :**
- **Rôle appliqué** : STAFF (level 50)
- **Accès billetterie** : Tickets gratuits famille + tarifs préférentiels
- **Accès physique** : Toutes zones, multi-entrée, horaires étendus
- **Fonctions** : Contrôle accès portails A et VIP
- **Services** : Formation continue, événements staff

---

## 🔄 FLUX DE VALIDATION DES DROITS

### **Algorithme de détermination des droits**

```
1. Récupérer tous les UserRole actifs de l'utilisateur
2. Sélectionner le Role avec le level le plus élevé
3. Récupérer tous les UserGroup actifs de l'utilisateur  
4. Appliquer les droits du Role principal
5. Enrichir avec les droits spécifiques des Groups
6. Résoudre les conflits (Role prime sur Group)
7. Retourner les droits consolidés
```

### **Fonctions SQL utiles**

```sql
-- Obtenir le rôle principal d'un utilisateur
SELECT * FROM get_user_primary_role('550e8400-e29b-41d4-a716-446655440001');

-- Vue des appartenances actives
SELECT * FROM v_active_memberships 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';

-- Nettoyage des appartenances expirées
SELECT cleanup_expired_memberships();
```

---

## 🚀 OPTIMISATIONS ET PERFORMANCE

### **Index critiques**
- `idx_users_email` : Recherche rapide par email (connexion)
- `idx_user_roles_user_status_active` : Validation droits temps réel
- `idx_user_groups_user_status_active` : Groupes actifs par utilisateur
- `idx_roles_level` : Hiérarchie des rôles

### **Vues matérialisées recommandées**
```sql
-- Vue matérialisée des droits utilisateurs (à rafraîchir périodiquement)
CREATE MATERIALIZED VIEW mv_user_permissions AS
SELECT 
    u.id as user_id,
    u.email,
    pr.role_code as primary_role,
    pr.role_level,
    array_agg(DISTINCT g.code) as active_groups,
    COUNT(ug.group_id) as groups_count
FROM users u
LEFT JOIN LATERAL get_user_primary_role(u.id) pr ON true
LEFT JOIN user_groups ug ON u.id = ug.user_id AND ug.status = 'ACTIVE'
LEFT JOIN groups g ON ug.group_id = g.id AND g.is_active = true
WHERE u.is_active = true
GROUP BY u.id, u.email, pr.role_code, pr.role_level;

-- Index sur la vue matérialisée
CREATE INDEX idx_mv_user_permissions_user_id ON mv_user_permissions(user_id);
CREATE INDEX idx_mv_user_permissions_role ON mv_user_permissions(primary_role);
```

### **Sécurité Row Level Security (RLS)**
- Politiques activées sur toutes les tables sensibles
- Utilisateurs accèdent uniquement à leurs données
- Staff/Admin ont accès étendu selon leurs rôles
- Context variables `app.current_user_id` pour filtrage automatique

---

## 📝 RECOMMANDATIONS D'IMPLÉMENTATION

### **Migration Prisma**
```typescript
// schema.prisma
model User {
  id            String    @id @default(cuid()) @map("id") @db.Uuid
  email         String    @unique
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  // ... autres champs
  
  profile       UserProfile?
  roles         UserRole[]
  groups        UserGroup[]
  
  @@map("users")
}
```

### **Services NestJS**
```typescript
@Injectable()
export class UserPermissionsService {
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    // Logique de récupération des droits consolidés
  }
  
  async validateAccess(userId: string, resource: string): Promise<boolean> {
    // Validation d'accès basée sur rôles/groupes
  }
}
```

### **Middleware d'authentification**
```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private permissionsService: UserPermissionsService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const requiredRole = this.reflector.get<string>('role', context.getHandler());
    
    return await this.permissionsService.validateAccess(userId, requiredRole);
  }
}
```

---

## 🔧 MAINTENANCE ET MONITORING

### **Tâches automatisées**
```sql
-- Nettoyage quotidien (cron job)
SELECT daily_cleanup();

-- Vérification intégrité des données
SELECT 
    COUNT(*) as users_without_profile
FROM users u 
LEFT JOIN user_profiles up ON u.id = up.user_id 
WHERE up.user_id IS NULL;

-- Monitoring des groupes saturés
SELECT 
    g.code,
    g.name,
    g.max_members,
    COUNT(ug.user_id) as current_members,
    (COUNT(ug.user_id)::FLOAT / g.max_members * 100) as occupancy_pct
FROM groups g
JOIN user_groups ug ON g.id = ug.group_id AND ug.status = 'ACTIVE'
WHERE g.max_members IS NOT NULL
GROUP BY g.id, g.code, g.name, g.max_members
HAVING COUNT(ug.user_id)::FLOAT / g.max_members > 0.9
ORDER BY occupancy_pct DESC;
```

### **Métriques importantes**
- Nombre d'utilisateurs actifs par rôle
- Taux d'occupation des groupes à capacité limitée
- Fréquence des changements de rôles/groupes
- Performance des requêtes de validation des droits

### **Alertes recommandées**
- Groupes saisonniers approchant leur capacité maximale
- Utilisateurs avec des rôles incohérents (niveau décroissant)
- Augmentation inhabituelle des attributions de rôles élevés
- Sessions de validation de droits trop lentes (>100ms)

---

## 📋 CHECKLIST DE VALIDATION

### **Avant mise en production**
- [ ] Types UUID uniformisés sur toutes les tables
- [ ] Foreign keys testées et fonctionnelles
- [ ] Index de performance créés et optimisés
- [ ] Contraintes métier validées avec données réelles
- [ ] Fonctions utilitaires testées unitairement
- [ ] Politiques RLS configurées et testées
- [ ] Vues et vues matérialisées performantes
- [ ] Scripts de migration Prisma validés
- [ ] Guards NestJS implémentés et testés
- [ ] Monitoring et alertes configurés

### **Tests de charge recommandés**
- Validation de droits pour 10,000 utilisateurs simultanés
- Attribution/révocation de rôles en masse
- Requêtes complexes sur groupes avec métadonnées JSON
- Performance des vues avec données volumineuses (>100K utilisateurs)

---

## 🎯 ÉVOLUTIONS FUTURES

### **Fonctionnalités avancées**
- **Rôles temporaires** : Attribution automatique avec expiration
- **Approbation workflow** : Circuit de validation pour rôles sensibles  
- **Audit avancé** : Traçabilité complète des changements de droits
- **API GraphQL** : Requêtes optimisées pour interfaces complexes
- **Cache Redis** : Mise en cache des permissions fréquemment utilisées

### **Intégrations possibles**
- **SSO/SAML** : Authentification entreprise
- **LDAP/Active Directory** : Synchronisation annuaires
- **CRM** : Synchronisation données clients
- **Analytics** : Segmentation comportementale avancée
- **Mobile** : Notifications push ciblées par groupes