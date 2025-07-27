// src/modules/auth/services/password-validation.service.ts

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { IPasswordValidation } from '../interfaces/password.interface';

/**
 * Password Validation Service Entrix V3.0 - Grade A+
 * Service de validation de la force des mots de passe
 * ✅ CORRIGÉ : Utilise AUTH_CONSTANTS.PASSWORD correctement
 */

@Injectable()
export class PasswordValidationService {
  private readonly logger: LoggerService;

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.createChildLogger('PasswordValidationService');
  }

  /**
   * Valide la force d'un mot de passe selon les critères Entrix
   * ✅ CORRIGÉ : Utilise AUTH_CONSTANTS.PASSWORD.MIN_STRENGTH_SCORE
   */
  async validatePasswordStrength(password: string): Promise<IPasswordValidation> {
    const operationId = this.logger.startOperation('validatePasswordStrength');

    try {
      let score = 0;
      const suggestions: string[] = [];

      // 1. Vérifier la longueur minimale
      if (password.length < AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
        suggestions.push(AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.TOO_SHORT.replace('{min}', AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH.toString()));
        this.logger.endOperation('validatePasswordStrength', operationId, false);
        return {
          isValid: false,
          score: 0,
          strength: 'weak',
          suggestions,
        };
      }

      // 2. Score de base pour la longueur
      score += Math.min(25, (password.length - AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) * AUTH_CONSTANTS.PASSWORD.SCORING.LENGTH_BONUS);

      // 3. Vérifier les types de caractères
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSymbols = /[^A-Za-z0-9]/.test(password);

      if (hasUppercase) {
        score += AUTH_CONSTANTS.PASSWORD.SCORING.UPPERCASE_BONUS;
      } else {
        suggestions.push(AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.ADD_UPPERCASE);
      }

      if (hasLowercase) {
        score += AUTH_CONSTANTS.PASSWORD.SCORING.LOWERCASE_BONUS;
      } else {
        suggestions.push(AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.ADD_LOWERCASE);
      }

      if (hasNumbers) {
        score += AUTH_CONSTANTS.PASSWORD.SCORING.NUMBERS_BONUS;
      } else {
        suggestions.push(AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.ADD_NUMBERS);
      }

      if (hasSymbols) {
        score += AUTH_CONSTANTS.PASSWORD.SCORING.SYMBOLS_BONUS;
      } else {
        suggestions.push(AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.ADD_SYMBOLS);
      }

      // 4. Bonus pour mélange de types
      if (hasUppercase && hasLowercase) {
        score += AUTH_CONSTANTS.PASSWORD.SCORING.MIXED_CASE_BONUS;
      }

      // 5. Bonus pour chiffres et symboles au milieu
      if (hasNumbers && password.length > 2) {
        const middleNumbers = password.slice(1, -1).match(/[0-9]/g);
        if (middleNumbers) {
          score += middleNumbers.length * AUTH_CONSTANTS.PASSWORD.SCORING.MIDDLE_NUMBERS_BONUS;
        }
      }

      if (hasSymbols && password.length > 2) {
        const middleSymbols = password.slice(1, -1).match(/[^A-Za-z0-9]/g);
        if (middleSymbols) {
          score += middleSymbols.length * AUTH_CONSTANTS.PASSWORD.SCORING.MIDDLE_SYMBOLS_BONUS;
        }
      }

      // 6. Pénalités
      score += this.calculatePenalties(password);

      // 7. Ajuster les suggestions selon les pénalités
      this.addPenaltySuggestions(password, suggestions);

      // 8. Limiter le score entre 0 et 100
      const finalScore = Math.max(0, Math.min(100, score));

      // 9. Déterminer si le mot de passe est valide
      const isValid = finalScore >= AUTH_CONSTANTS.PASSWORD.MIN_STRENGTH_SCORE;

      const validation: IPasswordValidation = {
        isValid,
        score: finalScore,
        strength: this.getPasswordStrengthLevel(finalScore),
        suggestions: isValid ? [] : suggestions,
      };

      this.logger.endOperation('validatePasswordStrength', operationId, true);
      this.logger.info('Password strength validated', JSON.stringify({
        score: finalScore,
        strength: validation.strength,
        isValid,
        suggestionCount: suggestions.length,
      }));

      return validation;

    } catch (error) {
      this.logger.endOperation('validatePasswordStrength', operationId, false);
      this.logger.error(
        'Failed to validate password strength',
        error.stack,
        'PasswordValidationService.validatePasswordStrength',
        JSON.stringify({ errorMessage: error.message })
      );

      // Retourner un résultat sécurisé en cas d'erreur
      return {
        isValid: false,
        score: 0,
        strength: 'weak',
        suggestions: ['Erreur de validation. Veuillez réessayer.'],
      };
    }
  }

  /**
   * Calcule les pénalités pour patterns faibles
   */
  private calculatePenalties(password: string): number {
    let penalties = 0;

    // Pénalité pour mots de passe courants
    const lowerPassword = password.toLowerCase();
    for (const pattern of AUTH_CONSTANTS.PASSWORD.WEAK_PATTERNS) {
      if (lowerPassword.includes(pattern.toLowerCase())) {
        penalties += AUTH_CONSTANTS.PASSWORD.SCORING.COMMON_PATTERNS_PENALTY;
        break; // Une seule pénalité pour les patterns courants
      }
    }

    // Pénalité pour répétitions de caractères
    const repeatedChars = password.match(/(.)\1{2,}/g);
    if (repeatedChars) {
      penalties += repeatedChars.length * AUTH_CONSTANTS.PASSWORD.SCORING.REPEAT_CHARS_PENALTY;
    }

    // Pénalité pour séquences consécutives
    penalties += this.checkSequentialPenalties(password);

    // Pénalité si que des lettres
    if (/^[A-Za-z]+$/.test(password)) {
      penalties += AUTH_CONSTANTS.PASSWORD.SCORING.LETTERS_ONLY_PENALTY;
    }

    // Pénalité si que des chiffres
    if (/^[0-9]+$/.test(password)) {
      penalties += AUTH_CONSTANTS.PASSWORD.SCORING.NUMBERS_ONLY_PENALTY;
    }

    return penalties;
  }

  /**
   * Vérifie les séquences consécutives
   */
  private checkSequentialPenalties(password: string): number {
    let penalties = 0;
    const lowerPassword = password.toLowerCase();

    // Vérifier séquences de lettres
    for (const sequence of AUTH_CONSTANTS.PASSWORD.LETTER_SEQUENCES) {
      if (lowerPassword.includes(sequence) || lowerPassword.includes(sequence.split('').reverse().join(''))) {
        penalties += AUTH_CONSTANTS.PASSWORD.SCORING.SEQUENTIAL_LETTERS_PENALTY;
      }
    }

    // Vérifier séquences de chiffres
    for (const sequence of AUTH_CONSTANTS.PASSWORD.NUMBER_SEQUENCES) {
      if (password.includes(sequence) || password.includes(sequence.split('').reverse().join(''))) {
        penalties += AUTH_CONSTANTS.PASSWORD.SCORING.SEQUENTIAL_NUMBERS_PENALTY;
      }
    }

    return penalties;
  }

  /**
   * Ajoute des suggestions basées sur les pénalités détectées
   */
  private addPenaltySuggestions(password: string, suggestions: string[]): void {
    const lowerPassword = password.toLowerCase();

    // Suggestions pour patterns faibles
    for (const pattern of AUTH_CONSTANTS.PASSWORD.WEAK_PATTERNS) {
      if (lowerPassword.includes(pattern.toLowerCase())) {
        suggestions.push(AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.AVOID_PATTERNS);
        break;
      }
    }

    // Suggestions pour répétitions
    if (/(.)\1{2,}/.test(password)) {
      suggestions.push(AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.AVOID_REPETITION);
    }

    // Suggestions pour améliorer le mélange
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);

    const typeCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;
    if (typeCount < 3) {
      suggestions.push(AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.MIX_CHARACTER_TYPES);
    }

    // Suggestion pour phrase de passe si trop complexe
    if (password.length < 12 && suggestions.length > 3) {
      suggestions.push(AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.USE_PASSPHRASE);
    }

    // Éliminer les doublons
    const uniqueSuggestions = [...new Set(suggestions)];
    suggestions.length = 0;
    suggestions.push(...uniqueSuggestions.slice(0, 5)); // Limiter à 5 suggestions
  }

  /**
   * Détermine le niveau de force du mot de passe
   */
  private getPasswordStrengthLevel(score: number): 'weak' | 'medium' | 'strong' {
    if (score < AUTH_CONSTANTS.PASSWORD.WEAK_SCORE_THRESHOLD) {
      return 'weak';
    } else if (score < AUTH_CONSTANTS.PASSWORD.MEDIUM_SCORE_THRESHOLD) {
      return 'medium';
    } else {
      return 'strong';
    }
  }

  /**
   * Méthode utilitaire pour vérifier rapidement si un mot de passe respecte les critères de base
   */
  async isPasswordValid(password: string): Promise<boolean> {
    try {
      const validation = await this.validatePasswordStrength(password);
      return validation.isValid;
    } catch (error) {
      this.logger.error('Error checking password validity', error.stack);
      return false;
    }
  }

  /**
   * Génère des suggestions d'amélioration pour un mot de passe
   */
  async getPasswordSuggestions(password: string): Promise<string[]> {
    try {
      const validation = await this.validatePasswordStrength(password);
      return validation.suggestions;
    } catch (error) {
      this.logger.error('Error getting password suggestions', error.stack);
      return ['Erreur lors de la génération des suggestions'];
    }
  }

  /**
   * Évalue si un mot de passe est acceptable pour un niveau de sécurité donné
   */
  async isPasswordAcceptableForSecurityLevel(
    password: string, 
    securityLevel: 'low' | 'medium' | 'high'
  ): Promise<boolean> {
    const validation = await this.validatePasswordStrength(password);
    
    const requiredScores = {
      low: 40,
      medium: AUTH_CONSTANTS.PASSWORD.MIN_STRENGTH_SCORE,
      high: 80,
    };

    return validation.score >= requiredScores[securityLevel];
  }
}