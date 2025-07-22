# API Spécifications - Module Organisateurs
## Entrix V3.0 Backend - NestJS + TypeScript + Prisma

---

## 📋 Vue d'ensemble

Ce module gère les **entités organisatrices d'événements** : entreprises, associations, institutions qui utilisent la plateforme Entrix. Il constitue l'**épine dorsale commerciale** avec processus de **validation rigoureuse**, **commission adaptative** et **écosystème partenaires**.

### **Technologies utilisées**
- **Framework** : NestJS + TypeScript
- **ORM** : Prisma avec relations complexes
- **Validation** : class-validator avec règles métier strictes
- **Upload** : Multer pour documents légaux
- **PDF** : Génération factures et contrats

### **Endpoints Base URL**
```
https://api.entrix.tn/v3/organizers
```

---

## 🏢 Gestion Organisateurs

### **POST /organizers**
Candidature nouvel organisateur avec documents.

#### Request
```typescript
interface CreateOrganizerRequest {
  // Informations de base
  name: string;                    // Nom commercial
  legalName: string;              // Raison sociale officielle
  type: OrganizerType;            // Type d'organisateur
  description?: string;           // Description publique
  
  // Informations légales
  registrationNumber?: string;    // N° registre commerce
  taxId?: string;                 // Identifiant fiscal tunisien
  foundedDate?: string;           // Date fondation YYYY-MM-DD
  
  // Contact
  email: string;                  // Email principal
  phone: string;                  // Téléphone principal
  website?: string;               // Site web
  
  // Adresse
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  country: string;                // Default: 'TN'
  
  // Contacts
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
  };
  backupContact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
  };
  
  // Documents légaux
  legalDocuments: {
    commercialRegister?: {
      number: string;
      issuedDate: string;
      expiryDate?: string;
      fileUrl: string;
    };
    taxCertificate?: {
      number: string;
      issuedDate: string;
      expiryDate: string;
      fileUrl: string;
    };
    insurance?: {
      provider: string;
      policyNumber: string;
      coverageAmount: number;
      validUntil: string;
      fileUrl: string;
    };
  };
  
  // Informations bancaires (chiffrées)
  bankingDetails: {
    bankName: string;
    accountNumber: string;        // Sera chiffré
    iban?: string;                // Sera chiffré
    swiftCode?: string;
    accountHolderName: string;
  };
  
  // Réseaux sociaux
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  
  // Préférences commerciales
  preferences?: {
    preferredCommissionRate?: number; // Proposition
    paymentDelayDays?: number;        // Délai souhaité
    preferredPaymentMethod?: string;
    eventCategories?: string[];       // Catégories ciblées
  };
}
```

#### Validation Rules
```typescript
@IsString()
@MinLength(2)
@MaxLength(200)
@Matches(/^[a-zA-Z0-9À-ÿ\s\-'.&()]+$/)
name: string;

@IsString()
@MinLength(2)
@MaxLength(200)
legalName: string;

@IsEnum(OrganizerType)
type: OrganizerType;

@IsEmail({}, { message: 'Email format invalide' })
@IsNotEmpty()
email: string;

@IsPhoneNumber('TN', { message: 'Numéro tunisien valide requis' })
phone: string;

@IsOptional()
@IsUrl({}, { message: 'URL website invalide' })
website?: string;

@ValidateNested()
@Type(() => PrimaryContactDto)
primaryContact: PrimaryContactDto;

@ValidateNested()
@Type(() => LegalDocumentsDto)
legalDocuments: LegalDocumentsDto;

@ValidateNested()
@Type(() => BankingDetailsDto)
bankingDetails: BankingDetailsDto;
```

#### Success Response (201)
```typescript
interface CreateOrganizerResponse {
  success: true;
  data: {
    organizer: {
      id: string;
      code: string;              // Code généré automatiquement
      name: string;
      legalName: string;
      type: string;
      status: 'PENDING';         // Toujours PENDING à la création
      verificationLevel: 'BASIC';
      
      // Contacts
      email: string;
      phone: string;
      website?: string;
      
      // Adresse
      address: {
        line1: string;
        line2?: string;
        city: string;
        postalCode?: string;
        country: string;
      };
      
      // Documents uploadés
      documentsUploaded: string[];
      
      // Étapes suivantes
      nextSteps: string[];
      
      // Timestamps
      createdAt: string;
      submittedAt: string;
    };
    
    // Processus validation
    validationProcess: {
      estimatedDuration: string;  // "5-7 jours ouvrables"
      requiredDocuments: string[];
      contactPerson: {
        name: string;
        email: string;
        phone: string;
      };
    };
  };
  message: 'Candidature soumise avec succès';
}
```

---

### **GET /organizers/:organizerId**
Détails organisateur complets.

#### Success Response (200)
```typescript
interface OrganizerDetailsResponse {
  success: true;
  data: {
    organizer: {
      id: string;
      code: string;
      name: string;
      legalName: string;
      type: string;
      description?: string;
      
      // Statuts
      status: string;
      verificationLevel: string;
      isVerified: boolean;
      
      // Informations légales
      registrationNumber?: string;
      taxId?: string;
      foundedDate?: string;
      
      // Contact
      email: string;
      phone: string;
      website?: string;
      
      // Adresse complète
      address: {
        line1: string;
        line2?: string;
        city: string;
        postalCode?: string;
        country: string;
      };
      
      // Contacts
      primaryContact: ContactInfo;
      backupContact?: ContactInfo;
      
      // Médias
      logoUrl?: string;
      coverImageUrl?: string;
      
      // Configuration commerciale
      commissionRate: number;
      paymentDelayDays: number;
      paymentMethod: string;
      
      // Réseaux sociaux
      socialMedia?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
        youtube?: string;
      };
      
      // Statistiques
      stats: {
        totalEvents: number;
        activeEvents: number;
        totalRevenue: number;
        totalTicketsSold: number;
        averageRating: number;
        customerSatisfaction: number;
        joinedAt: string;
        lastEventDate?: string;
      };
      
      // Événements récents
      recentEvents: Array<{
        id: string;
        title: string;
        startsAt: string;
        venue: string;
        ticketsSold: number;
        revenue: number;
        status: string;
      }>;
      
      // Évaluations récentes
      recentRatings: Array<{
        id: string;
        rating: number;
        comment?: string;
        event: string;
        customerName: string;
        createdAt: string;
      }>;
      
      // Timestamps
      createdAt: string;
      updatedAt: string;
      validatedAt?: string;
    };
  };
}
```

---

### **PUT /organizers/:organizerId**
Mise à jour informations organisateur.

#### Request
```typescript
interface UpdateOrganizerRequest {
  // Informations modifiables
  name?: string;
  description?: string;
  website?: string;
  
  // Contact
  email?: string;
  phone?: string;
  
  // Adresse
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  
  // Contacts
  primaryContact?: Partial<ContactInfo>;
  backupContact?: Partial<ContactInfo>;
  
  // Médias
  logoUrl?: string;
  coverImageUrl?: string;
  
  // Réseaux sociaux
  socialMedia?: Partial<SocialMediaLinks>;
  
  // Préférences (soumises à approbation)
  preferences?: {
    preferredCommissionRate?: number;
    paymentDelayDays?: number;
    preferredPaymentMethod?: string;
    eventCategories?: string[];
  };
  
  // Documents mis à jour
  updatedDocuments?: {
    type: 'commercial_register' | 'tax_certificate' | 'insurance';
    number?: string;
    issuedDate?: string;
    expiryDate?: string;
    fileUrl: string;
  }[];
}
```

#### Success Response (200)
```typescript
interface UpdateOrganizerResponse {
  success: true;
  data: {
    organizer: OrganizerDetails;
    updatedFields: string[];
    requiresRevalidation: boolean;
    pendingApprovals?: string[]; // Changements nécessitant approbation
  };
  message: 'Organisateur mis à jour avec succès';
}
```

---

### **GET /organizers**
Liste organisateurs avec filtres avancés.

#### Query Parameters
```typescript
interface OrganizersQuery {
  // Filtres de base
  type?: OrganizerType;
  status?: OrganizerStatus;
  verificationLevel?: VerificationLevel;
  isVerified?: boolean;
  
  // Filtres géographiques
  city?: string;
  country?: string;
  region?: string;
  
  // Filtres performance
  minRating?: number;           // Rating minimum
  minEvents?: number;           // Nombre min événements
  hasActiveEvents?: boolean;    // A des événements actifs
  
  // Filtres temporels
  joinedAfter?: string;         // Rejoint après date
  joinedBefore?: string;        // Rejoint avant date
  lastEventAfter?: string;      // Dernier événement après
  
  // Recherche textuelle
  search?: string;              // Nom, description, ville
  
  // Catégories
  eventCategories?: string[];   // Catégories d'événements
  
  // Tri
  sortBy?: 'name' | 'joinedAt' | 'rating' | 'totalEvents' | 'totalRevenue';
  sortOrder?: 'ASC' | 'DESC';
  
  // Pagination
  page?: number;
  limit?: number;
}
```

#### Success Response (200)
```typescript
interface OrganizersListResponse {
  success: true;
  data: {
    organizers: Array<{
      id: string;
      code: string;
      name: string;
      type: string;
      status: string;
      verificationLevel: string;
      
      // Localisation
      city: string;
      country: string;
      
      // Performance
      totalEvents: number;
      averageRating: number;
      isActive: boolean;
      
      // Médias
      logoUrl?: string;
      
      // Quick stats
      stats: {
        activeEvents: number;
        upcomingEvents: number;
        totalTicketsSold: number;
        joinedAt: string;
      };
      
      // Catégories principales
      primaryCategories: string[];
    }>;
    
    // Filtres appliqués
    appliedFilters: {
      type?: string;
      status?: string;
      search?: string;
      location?: string;
    };
    
    // Statistiques globales
    summary: {
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      byVerificationLevel: Record<string, number>;
    };
    
    pagination: PaginationMeta;
  };
}
```

---

## 💰 Gestion Commissions

### **GET /organizers/:organizerId/commissions**
Historique commissions organisateur.

#### Query Parameters
```typescript
interface CommissionsQuery {
  // Période
  fromDate?: string;            // ISO 8601
  toDate?: string;
  
  // Statuts
  status?: 'CALCULATED' | 'INVOICED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'DISPUTED';
  
  // Filtres montants
  minAmount?: number;
  maxAmount?: number;
  
  // Pagination
  page?: number;
  limit?: number;
}
```

#### Success Response (200)
```typescript
interface CommissionsResponse {
  success: true;
  data: {
    commissions: Array<{
      id: string;
      periodStart: string;
      periodEnd: string;
      
      // Montants
      totalSales: number;
      commissionRate: number;
      commissionAmount: number;
      paymentFees: number;
      bonusEarnings: number;
      penaltyDeductions: number;
      netAmount: number;
      currency: string;
      
      // Statut
      status: string;
      invoiceNumber?: string;
      invoiceDate?: string;
      paymentDueDate?: string;
      paidAmount: number;
      paidAt?: string;
      paymentMethod?: string;
      
      // Détail calculs
      breakdown?: {
        eventCount: number;
        ticketsSold: number;
        refundAdjustments: number;
        volumeBonus: number;
        loyaltyBonus: number;
        qualityBonus: number;
      };
      
      // Métadonnées
      createdAt: string;
      updatedAt: string;
    }>;
    
    // Résumé financier
    summary: {
      totalEarnings: number;
      totalPaid: number;
      totalPending: number;
      totalOverdue: number;
      averageCommissionRate: number;
      lastPaymentDate?: string;
      nextPaymentDue?: string;
    };
    
    pagination: PaginationMeta;
  };
}
```

---

### **POST /organizers/:organizerId/commissions/calculate**
Calcul commission pour période donnée.

#### Request
```typescript
interface CalculateCommissionRequest {
  periodStart: string;          // ISO 8601 date
  periodEnd: string;            // ISO 8601 date
  includeAdjustments?: boolean; // Inclure ajustements remboursements
  applyBonuses?: boolean;       // Appliquer bonus performance
}
```

#### Success Response (200)
```typescript
interface CalculateCommissionResponse {
  success: true;
  data: {
    calculation: {
      period: {
        start: string;
        end: string;
        durationDays: number;
      };
      
      // Base calcul
      totalSales: number;
      baseCommissionRate: number;
      baseCommissionAmount: number;
      
      // Ajustements
      refundAdjustments: number;
      chargebackAdjustments: number;
      
      // Frais plateforme
      paymentProcessingFees: number;
      platformFees: number;
      
      // Bonus
      volumeBonus: {
        threshold: number;
        bonusRate: number;
        amount: number;
      };
      loyaltyBonus: {
        yearsActive: number;
        bonusRate: number;
        amount: number;
      };
      qualityBonus: {
        avgRating: number;
        bonusRate: number;
        amount: number;
      };
      
      // Pénalités
      latePenalties: number;
      qualityPenalties: number;
      
      // Résultat final
      grossAmount: number;
      totalDeductions: number;
      netAmount: number;
      currency: string;
      
      // Détail événements
      eventsBreakdown: Array<{
        eventId: string;
        eventTitle: string;
        eventDate: string;
        ticketsSold: number;
        grossRevenue: number;
        commissionAmount: number;
      }>;
      
      // Prochaines échéances
      estimatedPaymentDate: string;
      paymentMethod: string;
    };
    
    // Actions possibles
    actions: {
      canCreateInvoice: boolean;
      canRequestEarlyPayment: boolean;
      canDispute: boolean;
    };
  };
}
```

---

## ⭐ Système d'Évaluation

### **GET /organizers/:organizerId/ratings**
Évaluations organisateur.

#### Query Parameters
```typescript
interface RatingsQuery {
  // Filtres
  minRating?: number;           // 1-5
  maxRating?: number;
  hasComment?: boolean;
  
  // Période
  fromDate?: string;
  toDate?: string;
  
  // Événements
  eventId?: string;
  eventCategory?: string;
  
  // Tri
  sortBy?: 'createdAt' | 'rating' | 'eventDate';
  sortOrder?: 'ASC' | 'DESC';
  
  // Pagination
  page?: number;
  limit?: number;
}
```

#### Success Response (200)
```typescript
interface RatingsResponse {
  success: true;
  data: {
    ratings: Array<{
      id: string;
      
      // Évaluation
      overallRating: number;      // 1-5
      organizationRating: number;
      communicationRating: number;
      venueQualityRating: number;
      valueForMoneyRating: number;
      
      // Commentaire
      comment?: string;
      isRecommended: boolean;
      
      // Contexte
      event: {
        id: string;
        title: string;
        category: string;
        date: string;
        venue: string;
      };
      
      // Évaluateur (anonymisé si nécessaire)
      reviewer: {
        id?: string;            // Null si anonyme
        firstName: string;      // Anonymisé : "Spectateur M."
        verified: boolean;
        attendeeType: string;   // 'INDIVIDUAL', 'GROUP', 'CORPORATE'
      };
      
      // Métadonnées
      createdAt: string;
      isVerified: boolean;
      helpfulVotes: number;
    }>;
    
    // Statistiques globales
    summary: {
      totalRatings: number;
      averageRating: number;
      ratingDistribution: {
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
      };
      
      // Moyennes par critère
      averages: {
        organization: number;
        communication: number;
        venueQuality: number;
        valueForMoney: number;
      };
      
      // Tendances
      trends: {
        last30Days: number;
        last90Days: number;
        improvement: boolean;
      };
      
      // Recommandations
      recommendationRate: number; // %
    };
    
    pagination: PaginationMeta;
  };
}
```

---

## 📄 Documents et Validation

### **POST /organizers/:organizerId/documents**
Upload nouveau document.

#### Request (multipart/form-data)
```typescript
// Form data
documentType: 'commercial_register' | 'tax_certificate' | 'insurance' | 'other';
file: File;                     // PDF, max 10MB
metadata: {
  number?: string;
  issuedDate?: string;
  expiryDate?: string;
  description?: string;
};
```

#### Success Response (201)
```typescript
interface UploadDocumentResponse {
  success: true;
  data: {
    document: {
      id: string;
      type: string;
      filename: string;
      fileSize: number;
      fileUrl: string;
      
      // Métadonnées
      number?: string;
      issuedDate?: string;
      expiryDate?: string;
      description?: string;
      
      // Statut validation
      verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
      verifiedAt?: string;
      verifiedBy?: string;
      verificationNotes?: string;
      
      uploadedAt: string;
    };
    
    // Impact sur statut organisateur
    organizerStatus: {
      currentStatus: string;
      requiresReview: boolean;
      missingDocuments: string[];
    };
  };
}
```

---

### **PUT /organizers/:organizerId/validation-status**
Mise à jour statut validation (Admin uniquement).

#### Request
```typescript
interface UpdateValidationRequest {
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | 'SUSPENDED';
  verificationLevel?: 'BASIC' | 'STANDARD' | 'ENHANCED' | 'PREMIUM' | 'INSTITUTIONAL';
  
  // Conditions spécifiques
  conditions?: {
    maxEventCapacity?: number;
    requiredDocuments?: string[];
    supervisionRequired?: boolean;
    reviewPeriodMonths?: number;
  };
  
  // Configuration commerciale
  approvedCommissionRate?: number;
  approvedPaymentDelay?: number;
  approvedPaymentMethod?: string;
  
  // Notes validation
  validationNotes?: string;
  internalNotes?: string;       // Non visible par organisateur
  
  // Actions automatiques
  sendNotification?: boolean;
  generateContract?: boolean;
}
```

#### Success Response (200)
```typescript
interface UpdateValidationResponse {
  success: true;
  data: {
    organizer: {
      id: string;
      status: string;
      verificationLevel: string;
      validatedAt?: string;
      validatedBy?: string;
    };
    
    // Changements appliqués
    changes: {
      statusChanged: boolean;
      verificationLevelChanged: boolean;
      commercialTermsUpdated: boolean;
      conditionsApplied: string[];
    };
    
    // Actions déclenchées
    triggeredActions: {
      notificationSent: boolean;
      contractGenerated: boolean;
      accountActivated: boolean;
      accessGranted: string[];
    };
    
    // Prochaines étapes
    nextSteps: string[];
  };
}
```

---

## 📊 Types TypeScript

### **Interfaces principales**

```typescript
interface Organizer {
  id: string;
  code: string;
  name: string;
  legalName: string;
  type: OrganizerType;
  description?: string;
  
  // Informations légales
  registrationNumber?: string;
  taxId?: string;
  foundedDate?: Date;
  
  // Contact
  email: string;
  phone: string;
  website?: string;
  
  // Adresse
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  country: string;
  
  // Statuts
  status: OrganizerStatus;
  verificationLevel: VerificationLevel;
  isVerified: boolean;
  
  // Configuration commerciale
  commissionRate: number;
  paymentDelayDays: number;
  paymentMethod: PaymentMethod;
  
  // Contacts
  primaryContact: ContactInfo;
  backupContact?: ContactInfo;
  
  // Médias
  logoUrl?: string;
  coverImageUrl?: string;
  
  // Documents et détails (chiffrés)
  legalDocuments?: any;
  bankingDetails?: any;
  socialMedia?: SocialMediaLinks;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
}

enum OrganizerType {
  SPORTS_CLUB = 'SPORTS_CLUB',
  MUSIC_VENUE = 'MUSIC_VENUE',
  THEATER_COMPANY = 'THEATER_COMPANY',
  CULTURAL_CENTER = 'CULTURAL_CENTER',
  CONFERENCE_ORGANIZER = 'CONFERENCE_ORGANIZER',
  FESTIVAL_ORGANIZER = 'FESTIVAL_ORGANIZER',
  CORPORATE = 'CORPORATE',
  EDUCATIONAL_INSTITUTION = 'EDUCATIONAL_INSTITUTION',
  GOVERNMENT_AGENCY = 'GOVERNMENT_AGENCY',
  NON_PROFIT = 'NON_PROFIT',
  RELIGIOUS = 'RELIGIOUS',
  CHARITY = 'CHARITY',
  MEDIA_COMPANY = 'MEDIA_COMPANY',
  VENUE_OPERATOR = 'VENUE_OPERATOR',
  OTHER = 'OTHER'
}

enum OrganizerStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  CONDITIONAL = 'CONDITIONAL',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
  BANNED = 'BANNED',
  INACTIVE = 'INACTIVE'
}

enum VerificationLevel {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  ENHANCED = 'ENHANCED',
  PREMIUM = 'PREMIUM',
  INSTITUTIONAL = 'INSTITUTIONAL'
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
}

interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

interface Commission {
  id: string;
  organizerId: string;
  periodStart: Date;
  periodEnd: Date;
  totalSales: number;
  commissionRate: number;
  commissionAmount: number;
  paymentFees: number;
  bonusEarnings: number;
  penaltyDeductions: number;
  netAmount: number;
  currency: string;
  status: CommissionStatus;
  breakdown?: any;
  createdAt: Date;
}

enum CommissionStatus {
  CALCULATED = 'CALCULATED',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  DISPUTED = 'DISPUTED',
  WAIVED = 'WAIVED',
  ADJUSTED = 'ADJUSTED'
}
```

---

## 🚨 Codes d'erreur spécifiques

| Code | HTTP | Description |
|------|------|-------------|
| `ORGANIZER_NOT_FOUND` | 404 | Organisateur introuvable |
| `DUPLICATE_ORGANIZER_CODE` | 409 | Code organisateur déjà utilisé |
| `DUPLICATE_REGISTRATION_NUMBER` | 409 | N° registre déjà utilisé |
| `INVALID_DOCUMENT_TYPE` | 400 | Type document non supporté |
| `DOCUMENT_TOO_LARGE` | 413 | Document > 10MB |
| `VALIDATION_IN_PROGRESS` | 409 | Validation déjà en cours |
| `INSUFFICIENT_VERIFICATION_LEVEL` | 403 | Niveau vérification insuffisant |
| `ORGANIZER_SUSPENDED` | 423 | Organisateur suspendu |
| `COMMISSION_ALREADY_CALCULATED` | 409 | Commission déjà calculée |
| `COMMISSION_PERIOD_INVALID` | 400 | Période commission invalide |
| `PAYMENT_OVERDUE` | 409 | Paiements en retard |
| `DOCUMENTS_MISSING` | 428 | Documents obligatoires manquants |
| `VERIFICATION_EXPIRED` | 410 | Vérification expirée |
| `RATING_NOT_ALLOWED` | 403 | Évaluation non autorisée |

Cette spécification couvre l'ensemble du module de gestion des organisateurs pour Entrix V3.0, avec processus de validation rigoureux, gestion des commissions et système d'évaluation complet.