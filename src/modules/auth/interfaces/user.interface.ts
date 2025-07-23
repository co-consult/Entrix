// src/modules/auth/interfaces/user.interface.ts

/**
 * Interfaces utilisateur pour authentification Entrix V3.0
 * Respecte schema.prisma users
 */

// Interface profil utilisateur selon schema.prisma exact
export interface IUserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar: string | null;
  is_active: boolean;
  email_verified: Date | null;
  phone_verified: Date | null;
  last_login: Date | null;
  metadata: any | null; // JSONB
  created_at: Date;
  updated_at: Date;
  // Relations calculées
  roles?: string[];
  permissions?: string[];
  subscription?: {
    tier: 'FREE' | 'PREMIUM' | 'VIP';
    expiresAt?: string;
  };
  preferences?: any;
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
  firstName: string;
  lastName: string;
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
  first_name: string;
  last_name: string;
  phone?: string;
  is_active?: boolean;
  email_verified?: Date | null;
  phone_verified?: Date | null;
  metadata?: any;
}