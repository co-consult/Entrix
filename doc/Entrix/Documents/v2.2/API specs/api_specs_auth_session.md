# API Spécifications - Module Authentification & Session
## Entrix V3.0 Backend - NestJS + TypeScript + Prisma

---

## 📋 Vue d'ensemble

Ce module gère l'**authentification complète**, les **sessions sécurisées** et l'**autorisation adaptative** pour tous les types d'utilisateurs d'Entrix V3.0. Il supporte les **connexions anonymes**, **utilisateurs enregistrés**, **MFA adaptatif** et **SSO enterprise**.

### **Technologies utilisées**
- **Framework** : NestJS + TypeScript
- **ORM** : Prisma
- **JWT** : @nestjs/jwt avec rotation tokens
- **Validation** : class-validator + class-transformer
- **Sécurité** : bcrypt, rate-limiting, CAPTCHA

### **Endpoints Base URL**
```
https://api.entrix.tn/v3/auth
```

---

## 🔐 Authentification

### **POST /auth/login**
Connexion utilisateur avec validation adaptative.

#### Request
```typescript
interface LoginRequest {
  email: string;           // Format email valide
  password: string;        // Min 8 caractères
  rememberMe?: boolean;    // Session prolongée
  captchaToken?: string;   // Requis après 2 échecs
  deviceFingerprint?: string; // Empreinte device pour sécurité
}
```

#### Validation Rules
```typescript
@IsEmail({}, { message: 'Format email invalide' })
@IsNotEmpty({ message: 'Email requis' })
email: string;

@IsString()
@MinLength(8, { message: 'Mot de passe minimum 8 caractères' })
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
  message: 'Mot de passe doit contenir minuscule, majuscule et chiffre' 
})
password: string;

@IsOptional()
@IsBoolean()
rememberMe?: boolean;
```

#### Success Response (200)
```typescript
interface LoginResponse {
  success: true;
  data: {
    user: UserProfile;
    tokens: {
      accessToken: string;     // JWT 15 minutes
      refreshToken: string;    // JWT 7 jours (30 si rememberMe)
      tokenType: 'Bearer';
      expiresIn: number;       // Secondes avant expiration
    };
    session: {
      sessionId: string;
      expiresAt: string;       // ISO 8601
      deviceInfo: DeviceInfo;
    };
    mfaRequired?: {
      methods: string[];       // ['SMS_OTP', 'TOTP_APP']
      challengeToken: string;  // Token temporaire pour MFA
      expiresIn: number;       // 300 secondes
    };
  };
  meta: {
    riskScore: number;        // 0-100
    requiresMfa: boolean;
    ipGeolocation: string;
  };
}
```

#### Error Responses
```typescript
// 400 - Validation Error
{
  success: false,
  error: {
    code: 'VALIDATION_FAILED',
    message: 'Données de connexion invalides',
    details: [
      {
        field: 'email',
        message: 'Format email invalide'
      }
    ]
  }
}

// 401 - Invalid Credentials
{
  success: false,
  error: {
    code: 'INVALID_CREDENTIALS',
    message: 'Email ou mot de passe incorrect',
    attemptsRemaining: 3,
    lockoutTime?: number // Si compte bloqué
  }
}

// 423 - Account Locked
{
  success: false,
  error: {
    code: 'ACCOUNT_LOCKED',
    message: 'Compte verrouillé pour sécurité',
    unlockAt: '2025-01-15T10:30:00Z',
    contactSupport: true
  }
}

// 429 - Rate Limited
{
  success: false,
  error: {
    code: 'RATE_LIMITED',
    message: 'Trop de tentatives. Réessayez dans 15 minutes',
    retryAfter: 900
  }
}
```

---

### **POST /auth/mfa/verify**
Vérification authentification multifacteur.

#### Request
```typescript
interface MfaVerifyRequest {
  challengeToken: string;   // Token reçu lors du login
  method: 'SMS_OTP' | 'TOTP_APP' | 'EMAIL_OTP' | 'BACKUP_CODE';
  code: string;            // Code à 6 chiffres
  trustDevice?: boolean;   // Marquer device comme fiable
}
```

#### Success Response (200)
```typescript
interface MfaVerifyResponse {
  success: true;
  data: {
    user: UserProfile;
    tokens: TokenPair;
    session: SessionInfo;
    trustedDevice?: {
      deviceId: string;
      expiresAt: string;    // 30 jours
    };
  };
}
```

---

### **POST /auth/register**
Inscription nouvel utilisateur.

#### Request
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;    // YYYY-MM-DD
  marketingConsent?: boolean;
  onboardingSecret?: string; // Clé conversion anonyme
  termsAccepted: boolean;   // Obligatoire
}
```

#### Validation Rules
```typescript
@IsEmail()
@IsNotEmpty()
email: string;

@IsString()
@MinLength(8)
@MaxLength(128)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
password: string;

@IsString()
@MinLength(2)
@MaxLength(50)
@Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Caractères alphabétiques uniquement' })
firstName: string;

@IsOptional()
@IsPhoneNumber('TN', { message: 'Numéro tunisien valide requis' })
phone?: string;

@IsBoolean()
@IsTrue({ message: 'Acceptation conditions obligatoire' })
termsAccepted: boolean;
```

#### Success Response (201)
```typescript
interface RegisterResponse {
  success: true;
  data: {
    user: UserProfile;
    tokens: TokenPair;
    onboarding?: {
      incentiveApplied: boolean;
      incentiveType: string;
      incentiveValue: number;
      migratedTickets: number;
    };
    verification: {
      emailSent: boolean;
      verificationRequired: boolean;
    };
  };
}
```

---

### **POST /auth/forgot-password**
Demande réinitialisation mot de passe.

#### Request
```typescript
interface ForgotPasswordRequest {
  email: string;
  captchaToken?: string;
}
```

#### Success Response (200)
```typescript
interface ForgotPasswordResponse {
  success: true;
  data: {
    emailSent: boolean;
    resetTokenSent: boolean;
    expiresIn: number;       // 3600 secondes (1h)
  };
  message: 'Email de réinitialisation envoyé si compte existant';
}
```

---

### **POST /auth/reset-password**
Réinitialisation avec token.

#### Request
```typescript
interface ResetPasswordRequest {
  token: string;           // Token reçu par email
  newPassword: string;
  confirmPassword: string;
}
```

#### Validation
```typescript
@IsJWT({ message: 'Token invalide' })
token: string;

@IsString()
@MinLength(8)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
newPassword: string;

@IsString()
@IsEqualTo('newPassword', { message: 'Mots de passe non identiques' })
confirmPassword: string;
```

---

## 🎫 Session Management

### **GET /auth/session**
Récupération informations session courante.

#### Headers
```typescript
Authorization: Bearer <access_token>
```

#### Success Response (200)
```typescript
interface SessionResponse {
  success: true;
  data: {
    session: {
      sessionId: string;
      userId: string;
      deviceInfo: {
        userAgent: string;
        ipAddress: string;
        geolocation: string;
        deviceFingerprint: string;
      };
      createdAt: string;
      lastActivity: string;
      expiresAt: string;
      isActive: boolean;
    };
    user: UserProfile;
    permissions: string[];
    preferences: UserPreferences;
  };
}
```

---

### **POST /auth/refresh**
Renouvellement tokens avec refresh token.

#### Request
```typescript
interface RefreshRequest {
  refreshToken: string;
}
```

#### Success Response (200)
```typescript
interface RefreshResponse {
  success: true;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;    // Nouveau refresh token (rotation)
      tokenType: 'Bearer';
      expiresIn: number;
    };
    sessionExtended: boolean;
  };
}
```

#### Error Responses
```typescript
// 401 - Invalid Refresh Token
{
  success: false,
  error: {
    code: 'INVALID_REFRESH_TOKEN',
    message: 'Token de rafraîchissement invalide ou expiré',
    requireLogin: true
  }
}
```

---

### **DELETE /auth/logout**
Déconnexion avec invalidation tokens.

#### Headers
```typescript
Authorization: Bearer <access_token>
```

#### Request Body (Optional)
```typescript
interface LogoutRequest {
  allDevices?: boolean;     // Déconnexion tous appareils
}
```

#### Success Response (200)
```typescript
interface LogoutResponse {
  success: true;
  data: {
    message: 'Déconnexion réussie';
    tokensInvalidated: number;
    sessionsTerminated: number;
  };
}
```

---

### **GET /auth/sessions**
Liste des sessions actives utilisateur.

#### Success Response (200)
```typescript
interface SessionsListResponse {
  success: true;
  data: {
    sessions: Array<{
      sessionId: string;
      deviceInfo: DeviceInfo;
      location: string;
      createdAt: string;
      lastActivity: string;
      isCurrent: boolean;
    }>;
    total: number;
  };
}
```

---

### **DELETE /auth/sessions/:sessionId**
Révocation session spécifique.

#### Success Response (200)
```typescript
interface RevokeSessionResponse {
  success: true;
  data: {
    sessionRevoked: boolean;
    sessionId: string;
  };
}
```

---

## 🔒 Sécurité Avancée

### **POST /auth/verify-device**
Vérification nouveau device.

#### Request
```typescript
interface DeviceVerificationRequest {
  verificationCode: string; // Code reçu par email/SMS
  deviceName?: string;      // Nom personnalisé
  trustDevice?: boolean;
}
```

---

### **GET /auth/security-events**
Historique événements sécurité.

#### Query Parameters
```typescript
interface SecurityEventsQuery {
  limit?: number;           // Default: 20, Max: 100
  offset?: number;
  eventType?: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'MFA_SETUP' | 'SUSPICIOUS_ACTIVITY';
  fromDate?: string;        // ISO 8601
  toDate?: string;
}
```

#### Success Response (200)
```typescript
interface SecurityEventsResponse {
  success: true;
  data: {
    events: Array<{
      id: string;
      type: string;
      description: string;
      ipAddress: string;
      userAgent: string;
      location: string;
      riskScore: number;
      createdAt: string;
      resolved: boolean;
    }>;
    pagination: PaginationMeta;
  };
}
```

---

## 🛡️ Rate Limiting & Sécurité

### **Limites par endpoint**

| Endpoint | Limite | Fenêtre | Action si dépassé |
|----------|--------|---------|-------------------|
| `/auth/login` | 5 tentatives | 15 minutes | Blocage IP + CAPTCHA |
| `/auth/register` | 3 inscriptions | 1 heure | Blocage IP |
| `/auth/forgot-password` | 3 demandes | 1 heure | Blocage temporaire |
| `/auth/mfa/verify` | 5 tentatives | 5 minutes | Invalidation challenge |
| `/auth/refresh` | 20 requêtes | 1 minute | Throttling |

### **Headers de sécurité**
```typescript
// Réponses incluent toujours
{
  'X-RateLimit-Remaining': '4',
  'X-RateLimit-Reset': '1642694400',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}
```

---

## 🧪 Types TypeScript

### **Interfaces principales**

```typescript
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  roles: string[];
  permissions: string[];
  subscription?: {
    tier: 'FREE' | 'PREMIUM' | 'VIP';
    expiresAt?: string;
  };
  preferences: UserPreferences;
  createdAt: string;
  lastLoginAt?: string;
}

interface DeviceInfo {
  deviceId: string;
  userAgent: string;
  browser: string;
  os: string;
  isMobile: boolean;
  ipAddress: string;
  geolocation?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}
```

---

## 📊 Codes d'erreur spécifiques

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email/password incorrect |
| `ACCOUNT_LOCKED` | 423 | Compte verrouillé sécurité |
| `EMAIL_NOT_VERIFIED` | 403 | Email non vérifié |
| `MFA_REQUIRED` | 428 | MFA obligatoire |
| `INVALID_MFA_CODE` | 401 | Code MFA incorrect |
| `DEVICE_NOT_TRUSTED` | 428 | Device nécessite vérification |
| `SESSION_EXPIRED` | 401 | Session expirée |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalide |
| `RATE_LIMITED` | 429 | Trop de tentatives |
| `WEAK_PASSWORD` | 400 | Mot de passe trop faible |
| `EMAIL_ALREADY_EXISTS` | 409 | Email déjà utilisé |
| `INVALID_RESET_TOKEN` | 400 | Token reset invalide/expiré |

Cette spécification couvre l'ensemble du module d'authentification et session pour Entrix V3.0, avec sécurité renforcée et expérience utilisateur optimisée.