// src/modules/auth/interfaces/user.interface.ts

/**
 * Interfaces utilisateur pour authentification Entrix V3.0
 * CORRIGÉ : Harmonisation camelCase avec module Users existant
 * Respecte convention application TypeScript
 */

// Interface profil utilisateur (format APPLICATION - camelCase)
export interface IUserProfile {
  id: string;
  email: string;
  firstName: string;        // ✅ CORRIGÉ : camelCase
  lastName: string;         // ✅ CORRIGÉ : camelCase
  phone: string | null;
  avatar: string | null;
  isActive: boolean;        // ✅ CORRIGÉ : camelCase
  emailVerified: Date | null;  // ✅ CORRIGÉ : camelCase
  phoneVerified: Date | null;  // ✅ CORRIGÉ : camelCase
  lastLogin: Date | null;      // ✅ CORRIGÉ : camelCase
  metadata: any | null;
  createdAt: Date;          // ✅ CORRIGÉ : camelCase
  updatedAt: Date;          // ✅ CORRIGÉ : camelCase
  // Relations calculées
  roles?: string[];
  permissions?: string[];
  subscription?: {
    tier: 'FREE' | 'PREMIUM' | 'VIP';
    expiresAt?: string;
  };
  preferences?: any;
}

// Interface données Prisma (format BASE DE DONNÉES - snake_case)
// Utilisée UNIQUEMENT pour mapping DB ↔ Application
export interface IUserDbRecord {
  id: string;
  email: string;
  first_name: string;       // Format DB snake_case
  last_name: string;        // Format DB snake_case
  phone: string | null;
  avatar: string | null;
  is_active: boolean;       // Format DB snake_case
  email_verified: Date | null;   // Format DB snake_case
  phone_verified: Date | null;   // Format DB snake_case
  last_login: Date | null;       // Format DB snake_case
  metadata: any | null;
  created_at: Date;         // Format DB snake_case
  updated_at: Date;         // Format DB snake_case
  password: string;         // Champ DB uniquement
}

// Interface requête login selon api_specs_auth_session.md
export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  captchaToken?: string;
  deviceFingerprint?: string;
}

// Interface requête register selon api_specs_auth_session.md
export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;        // ✅ CORRIGÉ : camelCase
  lastName: string;         // ✅ CORRIGÉ : camelCase
  phone?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  marketingConsent?: boolean;
  onboardingSecret?: string; // Clé conversion anonyme
  termsAccepted: boolean;
}

// Interface données de création utilisateur (interne)
export interface ICreateUserData {
  email: string;
  password: string; // Sera hashé
  firstName: string;        // ✅ CORRIGÉ : camelCase input
  lastName: string;         // ✅ CORRIGÉ : camelCase input
  phone?: string;
  isActive?: boolean;       // ✅ CORRIGÉ : camelCase input
  emailVerified?: Date | null;  // ✅ CORRIGÉ : camelCase input
  phoneVerified?: Date | null;  // ✅ CORRIGÉ : camelCase input
  metadata?: any;
}

/**
 * MAPPERS DB ↔ APPLICATION
 * Conversion entre formats snake_case (DB) et camelCase (App)
 */

export class UserMapper {
  /**
   * Convertit record Prisma (snake_case) vers interface app (camelCase)
   */
  static fromDb(dbRecord: IUserDbRecord): IUserProfile {
    return {
      id: dbRecord.id,
      email: dbRecord.email,
      firstName: dbRecord.first_name,     // DB → App
      lastName: dbRecord.last_name,       // DB → App
      phone: dbRecord.phone,
      avatar: dbRecord.avatar,
      isActive: dbRecord.is_active,       // DB → App
      emailVerified: dbRecord.email_verified,  // DB → App
      phoneVerified: dbRecord.phone_verified,  // DB → App
      lastLogin: dbRecord.last_login,     // DB → App
      metadata: dbRecord.metadata,
      createdAt: dbRecord.created_at,     // DB → App
      updatedAt: dbRecord.updated_at,     // DB → App
    };
  }

  /**
   * Convertit données app (camelCase) vers format Prisma (snake_case)
   */
  static toDb(userData: ICreateUserData): Omit<IUserDbRecord, 'id' | 'created_at' | 'updated_at'> {
    return {
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,     // App → DB
      last_name: userData.lastName,       // App → DB
      phone: userData.phone || null,
      avatar: null,
      is_active: userData.isActive ?? true,      // App → DB
      email_verified: userData.emailVerified || null,  // App → DB
      phone_verified: userData.phoneVerified || null,  // App → DB
      last_login: null,                   // App → DB
      metadata: userData.metadata || null,
    };
  }

  /**
   * Mappe données register DTO vers format création
   */
  static fromRegisterRequest(registerData: IRegisterRequest): ICreateUserData {
    return {
      email: registerData.email,
      password: registerData.password,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      phone: registerData.phone,
      isActive: true,
      emailVerified: null, // À vérifier après inscription
      phoneVerified: null,
      metadata: {
        marketingConsent: registerData.marketingConsent || false,
        dateOfBirth: registerData.dateOfBirth,
        onboardingSecret: registerData.onboardingSecret,
        termsAccepted: registerData.termsAccepted,
        registrationDate: new Date().toISOString(),
      },
    };
  }
}