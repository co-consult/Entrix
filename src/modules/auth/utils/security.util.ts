// src/modules/auth/utils/security.util.ts

import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Utilitaires sécurité généraux Entrix V3.0
 */

export class SecurityUtil {
  /**
   * Valide format et force mot de passe
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];

    // Longueur
    if (password.length < AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
      errors.push(`Minimum ${AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères`);
    }

    if (password.length > AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH) {
      errors.push(`Maximum ${AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH} caractères`);
    }

    // Complexité
    if (!/[a-z]/.test(password)) {
      errors.push('Doit contenir au moins une minuscule');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Doit contenir au moins une majuscule');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Doit contenir au moins un chiffre');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Doit contenir au moins un symbole');
    }

    // Patterns faibles
    if (/123|abc|qwe|password|admin|user/i.test(password)) {
      errors.push('Évitez les séquences communes');
    }

    if (/(.)\1{2,}/.test(password)) {
      errors.push('Évitez la répétition de caractères');
    }

    // Calcul force
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (errors.length === 0) {
      if (password.length >= 12 && /[^A-Za-z0-9].*[^A-Za-z0-9]/.test(password)) {
        strength = 'strong';
      } else {
        strength = 'medium';
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  /**
   * Génère headers de sécurité
   */
  static generateSecurityHeaders(): Record<string, string> {
    return {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'",
    };
  }

  /**
   * Masque email pour affichage sécurisé
   */
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}*@${domain}`;
    }
    const masked = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
    return `${masked}@${domain}`;
  }

  /**
   * Masque numéro de téléphone
   */
  static maskPhoneNumber(phone: string): string {
    if (phone.length <= 4) return phone;
    return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
  }

  /**
   * Valide format email tunisien
   */
  static isValidTunisianEmail(email: string): boolean {
    const tunisianDomains = [
      '.tn', '.com.tn', '.org.tn', '.net.tn', '.gov.tn', '.edu.tn'
    ];
    
    return tunisianDomains.some(domain => email.toLowerCase().endsWith(domain));
  }

  /**
   * Détecte tentative de brute force
   */
  static isBruteForcePattern(attempts: { timestamp: Date; success: boolean }[]): boolean {
    const now = new Date();
    const recentAttempts = attempts.filter(
      attempt => now.getTime() - attempt.timestamp.getTime() < 15 * 60 * 1000 // 15 minutes
    );

    // Plus de 10 tentatives en 15 minutes
    if (recentAttempts.length > 10) return true;

    // Plus de 5 échecs consécutifs
    const recentFailures = recentAttempts
      .filter(attempt => !attempt.success)
      .slice(-5);
    
    return recentFailures.length >= 5;
  }

  /**
   * Génère clé de rate limiting
   */
  static generateRateLimitKey(type: string, identifier: string): string {
    return `rate_limit:${type}:${identifier}`;
  }

  /**
   * Calcule délai d'attente exponentiel
   */
  static calculateBackoffDelay(attemptNumber: number, baseDelay: number = 1000): number {
    // Backoff exponentiel avec jitter
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), 300000); // Max 5 minutes
    const jitter = Math.random() * 0.1 * delay; // 10% de jitter
    return Math.floor(delay + jitter);
  }

  /**
   * Valide token JWT basique (sans vérification signature)
   */
  static isValidJwtFormat(token: string): boolean {
    if (!token) return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      // Vérifie que chaque partie est du base64 valide
      parts.forEach(part => {
        JSON.parse(Buffer.from(part, 'base64').toString());
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extrait payload JWT sans vérification
   */
  static extractJwtPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Vérifie expiration token
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.extractJwtPayload(token);
    if (!payload || !payload.exp) return true;
    
    return Date.now() >= payload.exp * 1000;
  }
}
