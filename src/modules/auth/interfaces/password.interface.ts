// src/modules/auth/interfaces/password.interface.ts

/**
 * Interfaces de gestion des mots de passe Entrix V3.0
 */

// Interface reset mot de passe
export interface IPasswordReset {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}

// Interface service mot de passe
export interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generateResetToken(email: string): Promise<string>;
  validateResetToken(token: string): Promise<IPasswordReset | null>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
  validatePasswordStrength(password: string): Promise<{ isValid: boolean; score: number; suggestions: string[] }>;
}