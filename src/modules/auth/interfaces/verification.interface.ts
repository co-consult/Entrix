// src/modules/auth/interfaces/verification.interface.ts

/**
 * Interfaces vérification utilisateur Entrix V3.0
 * Gestion statut vérification email/téléphone
 */

export interface IVerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  verificationLevel: 'NONE' | 'EMAIL' | 'PHONE' | 'FULL';
}

export interface IEmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  email: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface IPhoneVerificationToken {
  id: string;
  userId: string;
  token: string;
  phone: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface IVerificationRequest {
  userId: string;
  type: 'EMAIL' | 'PHONE';
  contact: string; // email ou phone
}

export interface IVerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  userId?: string;
  verificationLevel?: 'NONE' | 'EMAIL' | 'PHONE' | 'FULL';
}

// Service interface pour vérification
export interface IEmailVerificationService {
  generateVerificationToken(userId: string, email: string): Promise<IEmailVerificationToken>;
  verifyEmail(token: string): Promise<IVerificationResult>;
  resendVerification(email: string): Promise<{ success: boolean; message: string }>;
  cleanupExpiredTokens(): Promise<number>;
}

// Constants pour vérification
export const VERIFICATION_CONSTANTS = {
  EMAIL_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 heures
  PHONE_TOKEN_EXPIRY: 5 * 60 * 1000,       // 5 minutes
  MAX_RESEND_ATTEMPTS: 3,
  RESEND_COOLDOWN: 60 * 1000,               // 1 minute
} as const;