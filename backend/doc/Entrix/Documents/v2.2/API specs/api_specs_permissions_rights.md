# API Spécifications - Module Droits et Permissions
## Entrix V3.0 Backend - NestJS + TypeScript + Prisma

---

## 📋 Vue d'ensemble

Ce module gère le **système RBAC (Role-Based Access Control) granulaire** d'Entrix V3.0 avec **permissions contextuelles**, **délégation temporaire** et **audit complet**. Il centralise tous les droits d'accès : billets, abonnements, zones, événements et fonctionnalités administratives.

### **Technologies utilisées**
- **Framework** : NestJS + TypeScript
- **ORM** : Prisma avec relations complexes
- **Cache** : Redis pour permissions fréquentes
- **Validation** : class-validator avec règles business
- **Audit** : Traçabilité complète des modifications

### **Endpoints Base URL**
```
https://api.entrix.tn/v3/permissions
```

---

## 🔐 Gestion des Rôles

### **GET /permissions/roles**
Liste des rôles disponibles avec hiérarchie.

#### Query Parameters
```typescript
interface RolesQuery {
  scope?: 'SYSTEM' | 'ORGANIZER' | 'VENUE' | 'GROUP';
  includePermissions?: boolean;
  includeHierarchy?: boolean;
  active?: boolean;
}
```

#### Success Response (200)
```typescript
interface RolesResponse {
  success: true;
  data: {
    roles: Array<{
      id: string;
      name: string;
      displayName: string;
      description: string;
      scope: 'SYSTEM' | 'ORGANIZER' | 'VENUE' | 'GROUP';
      level: number;          // Niveau hiérarchique (1=plus haut)
      isSystem: boolean;      // Rôle système non modifiable
      
      // Hiérarchie
      parentRoles?: string[];
      childRoles?: string[];
      inheritsFrom?: string[];
      
      // Permissions associées
      permissions?: Array<{
        id: string;
        name: string;
        resource: string;
        action: string;
        conditions?: any;
      }>;
      
      // Métadonnées
      createdAt: string;
      updatedAt: string;
      usersCount?: number;    // Nombre d'utilisateurs avec ce rôle
    }>;
    hierarchy: RoleHierarchy;
  };
}
```

---

### **POST /permissions/roles**
Création nouveau rôle personnalisé.

#### Request
```typescript
interface CreateRoleRequest {
  name: string;             // snake_case, unique
  displayName: string;      // Nom affiché
  description: string;
  scope: 'ORGANIZER' | 'VENUE' | 'GROUP'; // Pas SYSTEM
  
  // Héritage
  inheritsFrom?: string[];  // IDs rôles parents
  
  // Permissions explicites
  permissions: Array<{
    resource: string;       // 'events', 'orders', 'users', etc.
    actions: string[];      // ['read', 'write', 'delete']
    conditions?: {          // Conditions contextuelles
      ownResourceOnly?: boolean;
      organizerScope?: boolean;
      timeRestrictions?: {
        startTime?: string;
        endTime?: string;
        daysOfWeek?: number[];
      };
      resourceFilters?: Record<string, any>;
    };
  }>;
  
  // Configuration
  settings: {
    isTemporary?: boolean;  // Rôle temporaire
    maxDuration?: number;   // Heures si temporaire
    requiresApproval?: boolean; // Attribution nécessite approbation
    delegatable?: boolean;  // Peut être délégué
  };
}
```

#### Validation Rules
```typescript
@IsString()
@Matches(/^[a-z_]+$/, { message: 'Format snake_case requis' })
@MinLength(3)
@MaxLength(50)
name: string;

@IsString()
@MinLength(3)
@MaxLength(100)
displayName: string;

@IsIn(['ORGANIZER', 'VENUE', 'GROUP'])
scope: string;

@IsArray()
@ValidateNested({ each: true })
@Type(() => PermissionRule)
permissions: PermissionRule[];
```

#### Success Response (201)
```typescript
interface CreateRoleResponse {
  success: true;
  data: {
    role: Role;
    inheritedPermissions: Permission[];
    effectivePermissions: Permission[];
  };
  message: 'Rôle créé avec succès';
}
```

---

### **GET /permissions/roles/:roleId**
Détails d'un rôle avec permissions effectives.

#### Success Response (200)
```typescript
interface RoleDetailsResponse {
  success: true;
  data: {
    role: Role;
    
    // Permissions détaillées
    explicitPermissions: Permission[];
    inheritedPermissions: Permission[];
    effectivePermissions: Permission[];
    
    // Analyse conflits
    permissionConflicts?: Array<{
      permission: string;
      conflictType: 'INHERITANCE_OVERRIDE' | 'CONDITION_CONFLICT';
      resolution: string;
    }>;
    
    // Utilisation
    assignedUsers: Array<{
      userId: string;
      userName: string;
      assignedAt: string;
      assignedBy: string;
      context?: any;
    }>;
    
    // Hiérarchie
    roleHierarchy: {
      parents: Role[];
      children: Role[];
      level: number;
    };
  };
}
```

---

### **PUT /permissions/roles/:roleId**
Modification rôle existant.

#### Request
```typescript
interface UpdateRoleRequest {
  displayName?: string;
  description?: string;
  
  // Modifications permissions
  addPermissions?: PermissionRule[];
  removePermissions?: string[]; // IDs permissions
  updatePermissions?: Array<{
    permissionId: string;
    conditions?: any;
  }>;
  
  // Héritage
  addParentRoles?: string[];
  removeParentRoles?: string[];
  
  // Configuration
  settings?: Partial<RoleSettings>;
}
```

---

## 🎫 Gestion des Droits d'Accès

### **GET /permissions/access-rights**
Liste des droits d'accès avec filtres.

#### Query Parameters
```typescript
interface AccessRightsQuery {
  userId?: string;
  eventId?: string;
  venueId?: string;
  organizerId?: string;
  
  // Types de droits
  rightType?: 'TICKET' | 'SUBSCRIPTION' | 'STAFF' | 'VIP' | 'ADMIN';
  status?: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  
  // Filtres temporels
  validFrom?: string;      // ISO 8601
  validUntil?: string;
  usedAfter?: string;
  
  // Pagination
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'validUntil' | 'lastUsed';
  sortOrder?: 'ASC' | 'DESC';
}
```

#### Success Response (200)
```typescript
interface AccessRightsResponse {
  success: true;
  data: {
    accessRights: Array<{
      id: string;
      qrCode: string;
      rightType: string;
      status: string;
      
      // Contexte
      userId?: string;
      eventId?: string;
      venueId?: string;
      organizerId: string;
      
      // Validité
      validFrom?: string;
      validUntil?: string;
      maxUsages?: number;
      usageCount: number;
      
      // Accès autorisés
      allowedZones: Array<{
        zoneId: string;
        zoneName: string;
        accessLevel: string;
      }>;
      
      // Permissions spéciales
      permissions: {
        canTransfer: boolean;
        canRefund: boolean;
        canUpgrade: boolean;
        allowCompanions: number;
      };
      
      // Métadonnées
      sourceType: 'TICKET' | 'SUBSCRIPTION' | 'MANUAL_GRANT';
      sourceId?: string;
      createdAt: string;
      lastUsedAt?: string;
      
      // Restrictions
      restrictions?: {
        ipWhitelist?: string[];
        deviceLimits?: number;
        geofencing?: {
          latitude: number;
          longitude: number;
          radiusMeters: number;
        };
      };
    }>;
    
    // Statistiques
    summary: {
      total: number;
      active: number;
      used: number;
      expired: number;
      revoked: number;
    };
    
    pagination: PaginationMeta;
  };
}
```

---

### **POST /permissions/access-rights**
Création manuelle droit d'accès.

#### Request
```typescript
interface CreateAccessRightRequest {
  rightType: 'STAFF' | 'VIP' | 'ADMIN' | 'MANUAL';
  
  // Bénéficiaire
  userId?: string;         // Utilisateur enregistré
  guestInfo?: {           // Utilisateur anonyme
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
  };
  
  // Contexte
  eventId?: string;       // Événement spécifique
  venueId?: string;       // Lieu (tous événements)
  organizerId: string;    // Organisateur émetteur
  
  // Validité
  validFrom?: string;     // Default: maintenant
  validUntil?: string;    // Obligatoire
  maxUsages?: number;     // null = illimité
  
  // Zones d'accès
  allowedZones: Array<{
    zoneId: string;
    accessLevel: 'BASIC' | 'PREMIUM' | 'VIP' | 'STAFF';
    timeSlots?: Array<{
      startTime: string;
      endTime: string;
    }>;
  }>;
  
  // Permissions
  permissions: {
    canTransfer: boolean;
    canRefund: boolean;
    canUpgrade: boolean;
    allowCompanions: number;
    specialAccess?: string[]; // ['backstage', 'parking_vip', 'fast_track']
  };
  
  // Restrictions optionnelles
  restrictions?: {
    ipWhitelist?: string[];
    deviceLimits?: number;
    requiresEscort?: boolean;
    geofencing?: GeofenceConfig;
  };
  
  // Métadonnées
  reason: string;         // Raison création
  notes?: string;
  internalReference?: string;
}
```

#### Success Response (201)
```typescript
interface CreateAccessRightResponse {
  success: true;
  data: {
    accessRight: AccessRight;
    qrCode: string;
    qrCodeUrl: string;      // URL image QR code
    deliveryOptions: {
      email: boolean;
      sms: boolean;
      downloadUrl: string;
    };
  };
  message: 'Droit d\'accès créé avec succès';
}
```

---

### **PUT /permissions/access-rights/:accessRightId**
Modification droit d'accès existant.

#### Request
```typescript
interface UpdateAccessRightRequest {
  // Modification validité
  validUntil?: string;
  maxUsages?: number;
  
  // Modification zones
  addZones?: Array<{
    zoneId: string;
    accessLevel: string;
  }>;
  removeZones?: string[];
  updateZones?: Array<{
    zoneId: string;
    accessLevel?: string;
    timeSlots?: TimeSlot[];
  }>;
  
  // Modification permissions
  permissions?: Partial<AccessPermissions>;
  
  // Modification restrictions
  restrictions?: Partial<AccessRestrictions>;
  
  // Statut
  status?: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  
  // Audit
  reason: string;
  notes?: string;
}
```

---

### **POST /permissions/access-rights/:accessRightId/transfer**
Transfert droit d'accès vers autre utilisateur.

#### Request
```typescript
interface TransferAccessRightRequest {
  // Nouveau bénéficiaire
  newUserId?: string;
  newGuestInfo?: GuestInfo;
  
  // Conditions transfert
  transferType: 'PERMANENT' | 'TEMPORARY';
  temporaryUntil?: string; // Si temporaire
  
  // Validation
  transferCode?: string;   // Code reçu par email/SMS
  currentUserConfirmation: boolean;
  
  // Métadonnées
  reason?: string;
  message?: string;        // Message au nouveau bénéficiaire
}
```

#### Success Response (200)
```typescript
interface TransferAccessRightResponse {
  success: true;
  data: {
    transfer: {
      id: string;
      fromUserId?: string;
      toUserId?: string;
      transferType: string;
      status: 'PENDING' | 'COMPLETED' | 'REJECTED';
      completedAt?: string;
    };
    accessRight: AccessRight;
    notificationsSent: {
      originalOwner: boolean;
      newOwner: boolean;
    };
  };
}
```

---

## 🔍 Vérification Permissions

### **POST /permissions/check**
Vérification permissions utilisateur pour action.

#### Request
```typescript
interface CheckPermissionRequest {
  userId: string;
  resource: string;        // 'events', 'orders', 'users', etc.
  action: string;          // 'read', 'write', 'delete', 'manage'
  
  // Contexte
  resourceId?: string;     // ID ressource spécifique
  organizerId?: string;    // Scope organisateur
  venueId?: string;        // Scope lieu
  
  // Contexte supplémentaire pour conditions
  context?: {
    eventDate?: string;
    orderAmount?: number;
    userRole?: string;
    timeOfDay?: string;
    ipAddress?: string;
    deviceType?: string;
    [key: string]: any;
  };
}
```

#### Success Response (200)
```typescript
interface CheckPermissionResponse {
  success: true;
  data: {
    hasPermission: boolean;
    
    // Détails autorisation
    grantedBy: Array<{
      type: 'ROLE' | 'DIRECT' | 'INHERITED' | 'TEMPORARY';
      source: string;       // Nom rôle/permission
      conditions?: any;
      expiresAt?: string;
    }>;
    
    // Restrictions appliquées
    restrictions?: {
      timeWindows?: Array<{
        start: string;
        end: string;
      }>;
      conditions?: string[];
      limitations?: any;
    };
    
    // Permissions associées
    relatedPermissions?: string[];
    
    // Audit
    checkedAt: string;
    checkId: string;        // Pour traçabilité
  };
}
```

---

### **GET /permissions/user-permissions/:userId**
Permissions effectives d'un utilisateur.

#### Query Parameters
```typescript
interface UserPermissionsQuery {
  organizerId?: string;    // Scope organisateur
  venueId?: string;        // Scope lieu
  includeInherited?: boolean;
  includeTemporary?: boolean;
  groupByResource?: boolean;
}
```

#### Success Response (200)
```typescript
interface UserPermissionsResponse {
  success: true;
  data: {
    userId: string;
    
    // Rôles actifs
    activeRoles: Array<{
      roleId: string;
      roleName: string;
      scope: string;
      assignedAt: string;
      expiresAt?: string;
      assignedBy: string;
      context?: any;
    }>;
    
    // Permissions par ressource
    permissions: Record<string, {
      resource: string;
      actions: string[];
      conditions?: any;
      restrictions?: any;
      sources: Array<{
        type: 'ROLE' | 'DIRECT';
        name: string;
        inherited?: boolean;
      }>;
    }>;
    
    // Permissions temporaires
    temporaryPermissions?: Array<{
      permission: string;
      grantedBy: string;
      grantedAt: string;
      expiresAt: string;
      reason: string;
    }>;
    
    // Restrictions globales
    globalRestrictions?: {
      ipWhitelist?: string[];
      timeWindows?: TimeWindow[];
      deviceLimits?: any;
    };
    
    // Résumé capacités
    capabilities: {
      canManageEvents: boolean;
      canProcessOrders: boolean;
      canManageUsers: boolean;
      canAccessAdmin: boolean;
      canCreateContent: boolean;
      maxSpendingLimit?: number;
    };
  };
}
```

---

## 🎛️ Administration Avancée

### **POST /permissions/delegate**
Délégation temporaire de permissions.

#### Request
```typescript
interface DelegatePermissionRequest {
  // Délégation
  fromUserId: string;      // Délégant
  toUserId: string;        // Délégataire
  
  // Permissions à déléguer
  permissions: Array<{
    resource: string;
    actions: string[];
    conditions?: any;
  }>;
  
  // Durée
  delegationType: 'FIXED_DURATION' | 'UNTIL_DATE' | 'MANUAL_REVOKE';
  duration?: number;       // Heures si FIXED_DURATION
  expiresAt?: string;      // Date si UNTIL_DATE
  
  // Restrictions
  restrictions?: {
    maxUsages?: number;
    allowSubdelegation?: boolean;
    requireConfirmation?: boolean;
    auditLevel?: 'BASIC' | 'DETAILED';
  };
  
  // Justification
  reason: string;
  approvalRequired?: boolean;
}
```

#### Success Response (201)
```typescript
interface DelegatePermissionResponse {
  success: true;
  data: {
    delegation: {
      id: string;
      status: 'ACTIVE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REVOKED';
      fromUser: UserInfo;
      toUser: UserInfo;
      permissions: DelegatedPermission[];
      createdAt: string;
      expiresAt?: string;
      usageCount: number;
      maxUsages?: number;
    };
    requiresApproval: boolean;
    approvers?: UserInfo[];
  };
}
```

---

### **GET /permissions/audit-log**
Journal d'audit des permissions.

#### Query Parameters
```typescript
interface AuditLogQuery {
  userId?: string;
  resource?: string;
  action?: string;
  outcome?: 'GRANTED' | 'DENIED' | 'EXPIRED' | 'REVOKED';
  
  // Période
  fromDate?: string;
  toDate?: string;
  
  // Filtres
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  changeType?: 'ROLE_ASSIGNED' | 'PERMISSION_GRANTED' | 'ACCESS_CHECKED' | 'DELEGATION_CREATED';
  
  // Pagination
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'userId';
}
```

#### Success Response (200)
```typescript
interface AuditLogResponse {
  success: true;
  data: {
    auditEvents: Array<{
      id: string;
      timestamp: string;
      
      // Acteur
      userId?: string;
      userName?: string;
      ipAddress: string;
      userAgent: string;
      
      // Action
      action: string;
      resource: string;
      resourceId?: string;
      outcome: string;
      
      // Contexte
      changeType: string;
      severity: string;
      description: string;
      
      // Détails
      oldValues?: any;
      newValues?: any;
      metadata?: any;
      
      // Traçabilité
      sessionId?: string;
      requestId?: string;
      correlationId?: string;
    }>;
    
    pagination: PaginationMeta;
    
    // Statistiques période
    summary: {
      totalEvents: number;
      byOutcome: Record<string, number>;
      bySeverity: Record<string, number>;
      topUsers: Array<{
        userId: string;
        userName: string;
        eventCount: number;
      }>;
    };
  };
}
```

---

## 📊 Types TypeScript

### **Interfaces principales**

```typescript
interface Permission {
  id: string;
  name: string;
  displayName: string;
  description: string;
  resource: string;
  action: string;
  
  // Conditions d'application
  conditions?: {
    contextRequired?: string[];
    timeRestrictions?: TimeRestriction;
    resourceFilters?: ResourceFilter;
    userAttributes?: UserAttributeFilter;
  };
  
  // Métadonnées
  category: string;
  scope: 'SYSTEM' | 'ORGANIZER' | 'VENUE' | 'GROUP';
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  scope: string;
  level: number;
  isSystem: boolean;
  
  // Relations
  parentRoles: string[];
  childRoles: string[];
  permissions: Permission[];
  
  // Configuration
  settings: RoleSettings;
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface AccessRight {
  id: string;
  qrCode: string;
  rightType: string;
  status: string;
  
  // Bénéficiaire
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  
  // Contexte
  eventId?: string;
  venueId?: string;
  organizerId: string;
  
  // Validité
  validFrom?: Date;
  validUntil?: Date;
  maxUsages?: number;
  usageCount: number;
  
  // Accès
  allowedZones: ZoneAccess[];
  permissions: AccessPermissions;
  restrictions?: AccessRestrictions;
  
  // Métadonnées
  sourceType: string;
  sourceId?: string;
  createdAt: Date;
  createdBy: string;
  lastUsedAt?: Date;
}

interface ZoneAccess {
  zoneId: string;
  zoneName: string;
  accessLevel: 'BASIC' | 'PREMIUM' | 'VIP' | 'STAFF';
  timeSlots?: TimeSlot[];
  restrictions?: any;
}

interface AccessPermissions {
  canTransfer: boolean;
  canRefund: boolean;
  canUpgrade: boolean;
  allowCompanions: number;
  specialAccess?: string[];
}

interface AccessRestrictions {
  ipWhitelist?: string[];
  deviceLimits?: number;
  requiresEscort?: boolean;
  geofencing?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  timeWindows?: TimeWindow[];
}

interface TimeWindow {
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  daysOfWeek?: number[];   // 0=dimanche, 1=lundi, etc.
  startDate?: string;      // YYYY-MM-DD
  endDate?: string;        // YYYY-MM-DD
}
```

---

## 🚨 Codes d'erreur spécifiques

| Code | HTTP | Description |
|------|------|-------------|
| `PERMISSION_DENIED` | 403 | Permission insuffisante |
| `ROLE_NOT_FOUND` | 404 | Rôle introuvable |
| `ACCESS_RIGHT_NOT_FOUND` | 404 | Droit d'accès introuvable |
| `INVALID_PERMISSION_CONTEXT` | 400 | Contexte permission invalide |
| `ROLE_HIERARCHY_CONFLICT` | 409 | Conflit hiérarchie rôles |
| `CANNOT_DELETE_SYSTEM_ROLE` | 409 | Rôle système non supprimable |
| `ACCESS_RIGHT_EXPIRED` | 410 | Droit d'accès expiré |
| `ACCESS_RIGHT_REVOKED` | 410 | Droit d'accès révoqué |
| `TRANSFER_NOT_ALLOWED` | 403 | Transfert non autorisé |
| `DELEGATION_EXPIRED` | 410 | Délégation expirée |
| `MAX_DELEGATIONS_EXCEEDED` | 429 | Limite délégations atteinte |
| `APPROVAL_REQUIRED` | 202 | Approbation requise pour action |

Cette spécification couvre l'ensemble du système de permissions et droits d'accès pour Entrix V3.0, avec contrôle granulaire et audit complet.