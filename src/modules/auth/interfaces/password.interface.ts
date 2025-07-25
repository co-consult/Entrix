// src/modules/auth/interfaces/password.interface.ts

/**
 * Interfaces de gestion des mots de passe Entrix V3.0
 * ✅ NOUVEAU : Service centralisé pour résoudre le double hashage
 * Toutes les opérations de mots de passe passent par ce service
 */

// Interface reset mot de passe (inchangée)
export interface IPasswordReset {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}

// Interface validation force password
export interface IPasswordValidation {
  isValid: boolean;
  score: number; // 0-100
  strength: 'weak' | 'medium' | 'strong';
  suggestions: string[];
}

// ✅ NOUVEAU : Interface service mot de passe centralisé
export interface IPasswordService {
  // Hash et vérification (méthodes de base)
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  
  // ✅ NOUVELLES MÉTHODES centralisées pour éviter duplication
  verifyUserPassword(userId: string, password: string): Promise<boolean>;
  verifyUserPasswordByEmail(email: string, password: string): Promise<boolean>;
  
  // Validation et sécurité
  validatePasswordStrength(password: string): Promise<IPasswordValidation>;
  
  // Réinitialisation
  generateResetToken(email: string): Promise<string>;
  validateResetToken(token: string): Promise<IPasswordReset | null>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
}