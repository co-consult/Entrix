# API Spécifications - Module Gestion Users & Groupes
## Entrix V3.0 Backend - NestJS + TypeScript + Prisma

---

## 📋 Vue d'ensemble

Ce module gère la **gestion complète des utilisateurs**, leurs **profils enrichis**, les **groupes collaboratifs** et les **interactions sociales** sur Entrix V3.0. Il supporte les **utilisateurs anonymes**, **profils complets**, **groupes d'achat** et **communautés organisées**.

### **Technologies utilisées**
- **Framework** : NestJS + TypeScript
- **ORM** : Prisma avec relations complexes
- **Validation** : class-validator avec règles métier
- **Upload** : Multer pour avatars/médias
- **Cache** : Redis pour performances

### **Endpoints Base URL**
```
https://api.entrix.tn/v3/users
```

---

## 👤 Gestion Utilisateurs

### **GET /users/profile**
Récupération profil utilisateur connecté.

#### Headers
```typescript
Authorization: Bearer <access_token>
```

#### Success Response (200)
```typescript
interface UserProfileResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      avatar?: string;
      dateOfBirth?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
      nationality?: string;
      city?: string;
      
      // Status et vérifications
      isEmailVerified: boolean;
      isPhoneVerified: boolean;
      profileCompletion: number; // 0-100%
      accountStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
      
      // Métadonnées
      createdAt: string;
      lastLoginAt?: string;
      lastActivityAt?: string;
      
      // Préférences
      preferences: {
        language: string;
        timezone: string;
        currency: string;
        notifications: NotificationPreferences;
        privacy: PrivacySettings;
      };
      
      // Stats utilisateur
      stats: {
        totalOrders: number;
        totalSpent: number;
        eventsAttended: number;
        loyaltyPoints: number;
        referralsCount: number;
      };
      
      // Abonnements et niveaux
      subscription?: {
        tier: 'FREE' | 'PREMIUM' | 'VIP';
        expiresAt?: string;
        benefits: string[];
      };
    };
  };
}
```

---

### **PUT /users/profile**
Mise à jour profil utilisateur.

#### Request
```typescript
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;     // YYYY-MM-DD
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  nationality?: string;     // Code ISO 2 lettres
  city?: string;
  bio?: string;            // Max 500 caractères
  
  // Préférences
  preferences?: {
    language?: string;      // 'fr-TN', 'ar-TN', 'en-US'
    timezone?: string;      // 'Africa/Tunis'
    currency?: string;      // 'TND'
    notifications?: NotificationPreferences;
    privacy?: PrivacySettings;
  };
  
  // Réseaux sociaux
  socialProfiles?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}
```

#### Validation Rules
```typescript
@IsOptional()
@IsString()
@MinLength(2)
@MaxLength(50)
@Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
firstName?: string;

@IsOptional()
@IsPhoneNumber('TN')
phone?: string;

@IsOptional()
@IsDateString()
@IsBefore(new Date()) // Date dans le passé
dateOfBirth?: string;

@IsOptional()
@IsString()
@MaxLength(500)
bio?: string;

@IsOptional()
@IsIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
gender?: string;
```

#### Success Response (200)
```typescript
interface UpdateProfileResponse {
  success: true;
  data: {
    user: UserProfile;
    profileCompletion: number;
    updatedFields: string[];
  };
  message: 'Profil mis à jour avec succès';
}
```

---

### **POST /users/avatar**
Upload avatar utilisateur.

#### Request (multipart/form-data)
```typescript
// Form data
avatar: File; // Max 5MB, formats: jpg, png, webp
```

#### Validation
- **Taille** : Maximum 5MB
- **Formats** : JPEG, PNG, WebP
- **Dimensions** : Minimum 100x100px, Maximum 2000x2000px
- **Ratio** : Carré recommandé (1:1)

#### Success Response (200)
```typescript
interface UploadAvatarResponse {
  success: true;
  data: {
    avatar: {
      originalUrl: string;
      thumbnailUrl: string;
      mediumUrl: string;
      largeUrl: string;
    };
    uploadedAt: string;
  };
}
```

---

### **DELETE /users/avatar**
Suppression avatar utilisateur.

#### Success Response (200)
```typescript
interface DeleteAvatarResponse {
  success: true;
  data: {
    avatarDeleted: boolean;
  };
  message: 'Avatar supprimé avec succès';
}
```

---

### **GET /users/search**
Recherche utilisateurs (pour invitations groupes).

#### Query Parameters
```typescript
interface UserSearchQuery {
  q: string;               // Terme recherche (nom, email)
  limit?: number;          // Default: 20, Max: 50
  offset?: number;
  filters?: {
    city?: string;
    verified?: boolean;    // Utilisateurs vérifiés uniquement
    mutualConnections?: boolean; // Connexions communes
  };
}
```

#### Success Response (200)
```typescript
interface UserSearchResponse {
  success: true;
  data: {
    users: Array<{
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      city?: string;
      isVerified: boolean;
      mutualGroups?: number;
      canInvite: boolean;    // Basé sur privacy settings
    }>;
    pagination: PaginationMeta;
  };
}
```

---

### **GET /users/:userId/public-profile**
Profil public d'un utilisateur.

#### Success Response (200)
```typescript
interface PublicProfileResponse {
  success: true;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      bio?: string;
      city?: string;
      joinedAt: string;
      
      // Stats publiques (selon privacy settings)
      publicStats?: {
        eventsAttended?: number;
        groupsJoined?: number;
        reviewsCount?: number;
        averageRating?: number;
      };
      
      // Badges et réalisations
      badges: Array<{
        id: string;
        name: string;
        description: string;
        iconUrl: string;
        earnedAt: string;
      }>;
    };
    relationshipStatus?: 'NONE' | 'GROUP_MEMBER' | 'BLOCKED';
  };
}
```

---

## 👥 Gestion Groupes

### **GET /users/groups**
Liste des groupes de l'utilisateur.

#### Query Parameters
```typescript
interface UserGroupsQuery {
  status?: 'ACTIVE' | 'PENDING' | 'INVITED' | 'LEFT';
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
  limit?: number;
  offset?: number;
}
```

#### Success Response (200)
```typescript
interface UserGroupsResponse {
  success: true;
  data: {
    groups: Array<{
      id: string;
      name: string;
      description?: string;
      avatar?: string;
      type: 'FAMILY' | 'FRIENDS' | 'CORPORATE' | 'COMMUNITY' | 'SUPPORTERS';
      memberCount: number;
      myRole: string;
      myPermissions: string[];
      
      // Activité récente
      lastActivity?: string;
      upcomingEvents?: number;
      
      // Status invitation
      invitationStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
      invitedBy?: {
        id: string;
        firstName: string;
        lastName: string;
      };
      invitedAt?: string;
    }>;
    pagination: PaginationMeta;
  };
}
```

---

### **POST /users/groups**
Création nouveau groupe.

#### Request
```typescript
interface CreateGroupRequest {
  name: string;            // 3-100 caractères
  description?: string;    // Max 500 caractères
  type: 'FAMILY' | 'FRIENDS' | 'CORPORATE' | 'COMMUNITY' | 'SUPPORTERS';
  
  // Configuration
  settings: {
    isPrivate: boolean;        // Groupe privé ou public
    requireApproval: boolean;  // Approbation pour rejoindre
    maxMembers?: number;       // Limite membres (default: 50)
    allowInvites: boolean;     // Membres peuvent inviter
  };
  
  // Permissions par défaut nouveaux membres
  defaultPermissions: {
    canPurchase: boolean;
    canInvite: boolean;
    canViewOrders: boolean;
    spendingLimit?: number;    // Limite TND
  };
  
  // Invitations initiales
  initialInvites?: Array<{
    email?: string;
    userId?: string;
    role?: 'ADMIN' | 'MANAGER' | 'MEMBER';
  }>;
}
```

#### Validation Rules
```typescript
@IsString()
@MinLength(3)
@MaxLength(100)
@Matches(/^[a-zA-Z0-9À-ÿ\s'-]+$/)
name: string;

@IsOptional()
@IsString()
@MaxLength(500)
description?: string;

@IsIn(['FAMILY', 'FRIENDS', 'CORPORATE', 'COMMUNITY', 'SUPPORTERS'])
type: string;

@ValidateNested()
@Type(() => GroupSettings)
settings: GroupSettings;
```

#### Success Response (201)
```typescript
interface CreateGroupResponse {
  success: true;
  data: {
    group: GroupDetails;
    invitationsSent: number;
    myRole: 'OWNER';
  };
  message: 'Groupe créé avec succès';
}
```

---

### **GET /users/groups/:groupId**
Détails d'un groupe spécifique.

#### Success Response (200)
```typescript
interface GroupDetailsResponse {
  success: true;
  data: {
    group: {
      id: string;
      name: string;
      description?: string;
      avatar?: string;
      type: string;
      
      // Métadonnées
      createdAt: string;
      createdBy: {
        id: string;
        firstName: string;
        lastName: string;
      };
      
      // Configuration
      settings: GroupSettings;
      
      // Membres
      memberCount: number;
      members: Array<{
        id: string;
        user: {
          id: string;
          firstName: string;
          lastName: string;
          avatar?: string;
        };
        role: string;
        permissions: string[];
        joinedAt: string;
        lastActivity?: string;
        spendingLimit?: number;
        totalSpent?: number; // Si permission de voir
      }>;
      
      // Mon statut dans le groupe
      myMembership: {
        role: string;
        permissions: string[];
        canLeave: boolean;
        canInvite: boolean;
        spendingLimit?: number;
        totalSpent?: number;
      };
      
      // Activité récente
      recentActivity: Array<{
        id: string;
        type: 'MEMBER_JOINED' | 'ORDER_PLACED' | 'EVENT_ATTENDED' | 'ROLE_CHANGED';
        description: string;
        actor: {
          firstName: string;
          lastName: string;
        };
        createdAt: string;
      }>;
      
      // Stats groupe
      stats: {
        totalOrders: number;
        totalSpent: number;
        eventsAttended: number;
        avgOrderValue: number;
      };
    };
  };
}
```

---

### **PUT /users/groups/:groupId**
Mise à jour groupe (Owner/Admin uniquement).

#### Request
```typescript
interface UpdateGroupRequest {
  name?: string;
  description?: string;
  settings?: Partial<GroupSettings>;
  defaultPermissions?: Partial<GroupPermissions>;
}
```

#### Success Response (200)
```typescript
interface UpdateGroupResponse {
  success: true;
  data: {
    group: GroupDetails;
    updatedFields: string[];
  };
}
```

---

### **POST /users/groups/:groupId/invite**
Invitation membres au groupe.

#### Request
```typescript
interface InviteToGroupRequest {
  invitations: Array<{
    email?: string;          // Email si utilisateur pas sur plateforme
    userId?: string;         // ID si utilisateur existant
    role?: 'ADMIN' | 'MANAGER' | 'MEMBER';
    permissions?: Partial<GroupPermissions>;
    personalMessage?: string; // Message personnalisé
  }>;
  
  // Configuration invitation
  expiresIn?: number;        // Heures avant expiration (default: 168 = 7 jours)
  requireApproval?: boolean; // Override setting groupe
}
```

#### Success Response (200)
```typescript
interface InviteToGroupResponse {
  success: true;
  data: {
    invitationsSent: number;
    invitationsCreated: Array<{
      id: string;
      email?: string;
      userId?: string;
      status: 'SENT' | 'ERROR';
      expiresAt: string;
    }>;
    errors?: Array<{
      email?: string;
      userId?: string;
      error: string;
    }>;
  };
}
```

---

### **PUT /users/groups/:groupId/members/:memberId**
Gestion membre du groupe.

#### Request
```typescript
interface UpdateGroupMemberRequest {
  action: 'UPDATE_ROLE' | 'UPDATE_PERMISSIONS' | 'SET_SPENDING_LIMIT' | 'REMOVE';
  
  // Pour UPDATE_ROLE
  newRole?: 'ADMIN' | 'MANAGER' | 'MEMBER';
  
  // Pour UPDATE_PERMISSIONS
  permissions?: Partial<GroupPermissions>;
  
  // Pour SET_SPENDING_LIMIT
  spendingLimit?: number;   // null pour illimité
  
  // Raison (pour logs)
  reason?: string;
}
```

#### Success Response (200)
```typescript
interface UpdateGroupMemberResponse {
  success: true;
  data: {
    member: GroupMember;
    actionPerformed: string;
    notificationSent: boolean;
  };
}
```

---

### **POST /users/groups/:groupId/join**
Demande d'adhésion à un groupe public.

#### Request
```typescript
interface JoinGroupRequest {
  message?: string;         // Message pour propriétaires
}
```

#### Success Response (200)
```typescript
interface JoinGroupResponse {
  success: true;
  data: {
    status: 'JOINED' | 'PENDING_APPROVAL';
    membership?: GroupMember;
    approvalRequired: boolean;
  };
}
```

---

### **POST /users/groups/:groupId/leave**
Quitter un groupe.

#### Request
```typescript
interface LeaveGroupRequest {
  reason?: string;          // Raison optionnelle
  transferOwnership?: string; // ID nouveau owner si je suis owner
}
```

#### Success Response (200)
```typescript
interface LeaveGroupResponse {
  success: true;
  data: {
    leftGroup: boolean;
    ownershipTransferred?: boolean;
    newOwner?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}
```

---

## 🔔 Notifications & Invitations

### **GET /users/invitations**
Liste invitations en attente.

#### Query Parameters
```typescript
interface InvitationsQuery {
  type?: 'GROUP' | 'EVENT' | 'FRIEND';
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  limit?: number;
  offset?: number;
}
```

#### Success Response (200)
```typescript
interface InvitationsResponse {
  success: true;
  data: {
    invitations: Array<{
      id: string;
      type: string;
      status: string;
      
      // Détails invitation
      invitedBy: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
      };
      
      // Contexte (groupe, événement, etc.)
      context: {
        id: string;
        name: string;
        description?: string;
        avatar?: string;
      };
      
      // Message personnalisé
      personalMessage?: string;
      
      // Permissions proposées
      proposedRole?: string;
      proposedPermissions?: string[];
      
      // Timing
      createdAt: string;
      expiresAt: string;
      respondBy?: string;
    }>;
    pagination: PaginationMeta;
  };
}
```

---

### **POST /users/invitations/:invitationId/respond**
Réponse à une invitation.

#### Request
```typescript
interface RespondInvitationRequest {
  action: 'ACCEPT' | 'DECLINE';
  message?: string;         // Message optionnel
}
```

#### Success Response (200)
```typescript
interface RespondInvitationResponse {
  success: true;
  data: {
    action: string;
    invitation: Invitation;
    membership?: GroupMember; // Si accepté et groupe
    notificationSent: boolean;
  };
}
```

---

## 📊 Types TypeScript

### **Interfaces principales**

```typescript
interface NotificationPreferences {
  email: {
    orderConfirmation: boolean;
    eventReminders: boolean;
    groupInvitations: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  sms: {
    orderConfirmation: boolean;
    eventReminders: boolean;
    urgentNotifications: boolean;
  };
  push: {
    orderUpdates: boolean;
    eventReminders: boolean;
    groupActivity: boolean;
    promotions: boolean;
  };
  frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'NEVER';
}

interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  showEmail: boolean;
  showPhone: boolean;
  showCity: boolean;
  showStats: boolean;
  allowSearch: boolean;
  allowGroupInvites: boolean;
  allowFriendRequests: boolean;
}

interface GroupSettings {
  isPrivate: boolean;
  requireApproval: boolean;
  maxMembers: number;
  allowInvites: boolean;
  allowMemberInvites: boolean;
  allowPublicJoin: boolean;
  autoApproveInvites: boolean;
}

interface GroupPermissions {
  canPurchase: boolean;
  canInvite: boolean;
  canViewOrders: boolean;
  canManageEvents: boolean;
  canViewMembers: boolean;
  canModifyGroup: boolean;
  spendingLimit?: number;
}

interface GroupMember {
  id: string;
  user: UserProfile;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
  permissions: GroupPermissions;
  joinedAt: string;
  invitedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  lastActivity?: string;
  isActive: boolean;
  totalSpent?: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

---

## 🚨 Codes d'erreur spécifiques

| Code | HTTP | Description |
|------|------|-------------|
| `USER_NOT_FOUND` | 404 | Utilisateur introuvable |
| `GROUP_NOT_FOUND` | 404 | Groupe introuvable |
| `INSUFFICIENT_PERMISSIONS` | 403 | Permissions insuffisantes |
| `GROUP_FULL` | 409 | Groupe au maximum de membres |
| `ALREADY_MEMBER` | 409 | Déjà membre du groupe |
| `INVITATION_EXPIRED` | 410 | Invitation expirée |
| `INVITATION_ALREADY_RESPONDED` | 409 | Invitation déjà traitée |
| `CANNOT_LEAVE_AS_OWNER` | 409 | Propriétaire doit transférer ownership |
| `INVALID_SPENDING_LIMIT` | 400 | Limite dépense invalide |
| `PROFILE_INCOMPLETE` | 428 | Profil incomplet pour action |
| `UPLOAD_FILE_TOO_LARGE` | 413 | Fichier trop volumineux |
| `UNSUPPORTED_FILE_TYPE` | 415 | Type fichier non supporté |

Cette spécification couvre l'ensemble du module de gestion des utilisateurs et groupes pour Entrix V3.0, avec fonctionnalités sociales avancées et gestion granulaire des permissions.