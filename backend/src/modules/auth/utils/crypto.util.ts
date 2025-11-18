// src/modules/auth/utils/crypto.util.ts

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Utilitaires cryptographiques Entrix V3.0
 * Grade A+ - Fonctions sécurisées et optimisées
 */

export class CryptoUtil {
  private static readonly SALT_ROUNDS = 12;
  private static readonly HASH_ALGORITHM = 'sha256';

  /**
   * Hash un mot de passe avec bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      throw new Error(`Erreur hachage mot de passe: ${error.message}`);
    }
  }

  /**
   * Vérifie un mot de passe contre son hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`Erreur vérification mot de passe: ${error.message}`);
    }
  }

  /**
   * Génère un token sécurisé aléatoire
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Génère un UUID v4
   */
  static generateUuid(): string {
    return crypto.randomUUID();
  }

  /**
   * Hash SHA256 d'une chaîne
   */
  static sha256Hash(data: string): string {
    return crypto.createHash(this.HASH_ALGORITHM).update(data).digest('hex');
  }

  /**
   * Génère un code OTP numérique
   */
  static generateOtpCode(length: number = AUTH_CONSTANTS.SECURITY.MFA_CODE_LENGTH): string {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  }

  /**
   * Génère des codes de récupération
   */
  static generateBackupCodes(count: number = 10, length: number = 8): string[] {
    const codes: string[] = [];
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < length; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Chiffrement AES-256-GCM
   */
  static encrypt(text: string, key: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Déchiffrement AES-256-GCM
   */
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Validation force mot de passe
   */
  static validatePasswordStrength(password: string): { 
    isValid: boolean; 
    score: number; 
    suggestions: string[] 
  } {
    const suggestions: string[] = [];
    let score = 0;

    // Longueur
    if (password.length >= 8) score += 20;
    else suggestions.push('Utilisez au moins 8 caractères');

    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Complexité
    if (/[a-z]/.test(password)) score += 15;
    else suggestions.push('Ajoutez des lettres minuscules');

    if (/[A-Z]/.test(password)) score += 15;
    else suggestions.push('Ajoutez des lettres majuscules');

    if (/[0-9]/.test(password)) score += 15;
    else suggestions.push('Ajoutez des chiffres');

    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    else suggestions.push('Ajoutez des symboles (!@#$%^&*)');

    // Patterns communs (pénalités)
    if (/123/.test(password) || /abc/.test(password)) {
      score -= 10;
      suggestions.push('Évitez les séquences communes');
    }

    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      suggestions.push('Évitez la répétition de caractères');
    }

    return {
      isValid: score >= 70,
      score: Math.max(0, Math.min(100, score)),
      suggestions
    };
  }
}