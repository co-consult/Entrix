// src/modules/users/utils/validation.util.ts

import { USER_CONSTANTS, GROUP_CONSTANTS, INVITATION_CONSTANTS } from '../constants';

/**
 * Utilitaires de validation métier pour le module users
 */
export class ValidationUtil {
  
  /**
   * Valide un email selon les règles métier
   */
  static validateEmail(email: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('L\'email est requis');
      return { isValid: false, errors };
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    if (trimmedEmail.length > USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH) {
      errors.push(`L'email ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH} caractères`);
    }

    if (!USER_CONSTANTS.VALIDATION.EMAIL.REGEX.test(trimmedEmail)) {
      errors.push('Format d\'email invalide');
    }

    // Vérifications additionnelles métier
    if (trimmedEmail.includes('+')) {
      // Accepté mais avertissement
    }

    const domain = trimmedEmail.split('@')[1];
    if (domain) {
      // Domaines jetables blacklistés (exemples)
      const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
      if (disposableDomains.includes(domain)) {
        errors.push('Les emails temporaires ne sont pas autorisés');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Valide un numéro de téléphone
   */
  static validatePhone(phone: string): { isValid: boolean; errors: string[]; normalizedPhone?: string } {
    const errors: string[] = [];
    
    if (!phone) {
      return { isValid: true, errors }; // Téléphone optionnel
    }

    const trimmedPhone = phone.trim();
    
    if (trimmedPhone.length > USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH) {
      errors.push(`Le téléphone ne peut pas dépasser ${USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH} caractères`);
    }

    // Remove phone format validation - accept any format
    // if (!USER_CONSTANTS.VALIDATION.PHONE.REGEX.test(trimmedPhone)) {
    //   errors.push('Format de téléphone invalide (ex: +21697123456)');
    // }

    // Remove normalization - keep phone as provided
    let normalizedPhone = trimmedPhone;
    // if (trimmedPhone.startsWith('0')) {
    //   normalizedPhone = '+216' + trimmedPhone.substring(1);
    // } else if (trimmedPhone.startsWith('216') && !trimmedPhone.startsWith('+216')) {
    //   normalizedPhone = '+' + trimmedPhone;
    // }

    return { 
      isValid: errors.length === 0, 
      errors, 
      normalizedPhone: errors.length === 0 ? normalizedPhone : undefined 
    };
  }

  /**
   * Valide un mot de passe selon les règles de sécurité
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' } {
    const errors: string[] = [];
    const { VALIDATION: { PASSWORD } } = USER_CONSTANTS;
    
    if (!password) {
      errors.push('Le mot de passe est requis');
      return { isValid: false, errors, strength: 'weak' };
    }

    if (password.length < PASSWORD.MIN_LENGTH) {
      errors.push(`Le mot de passe doit contenir au moins ${PASSWORD.MIN_LENGTH} caractères`);
    }

    if (password.length > PASSWORD.MAX_LENGTH) {
      errors.push(`Le mot de passe ne peut pas dépasser ${PASSWORD.MAX_LENGTH} caractères`);
    }

    if (PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    if (PASSWORD.REQUIRE_SYMBOLS && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    // Vérifications de sécurité additionnelles
    const commonPasswords = ['123456', 'password', 'azerty', 'qwerty', '123456789', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Ce mot de passe est trop commun');
    }

    // Calcul de la force
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    if (password.length >= 16) score++;

    if (score <= 3) strength = 'weak';
    else if (score <= 5) strength = 'medium';
    else strength = 'strong';

    return { isValid: errors.length === 0, errors, strength };
  }

  /**
   * Valide un nom de groupe
   */
  static validateGroupName(name: string): { isValid: boolean; errors: string[]; suggestions?: string[] } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    if (!name) {
      errors.push('Le nom du groupe est requis');
      return { isValid: false, errors };
    }

    const trimmedName = name.trim();
    const { VALIDATION: { NAME } } = GROUP_CONSTANTS;

    if (trimmedName.length < NAME.MIN_LENGTH) {
      errors.push(`Le nom doit contenir au moins ${NAME.MIN_LENGTH} caractères`);
    }

    if (trimmedName.length > NAME.MAX_LENGTH) {
      errors.push(`Le nom ne peut pas dépasser ${NAME.MAX_LENGTH} caractères`);
    }

    if (!NAME.REGEX.test(trimmedName)) {
      errors.push('Le nom contient des caractères non autorisés (lettres, chiffres, espaces, apostrophes et tirets uniquement)');
      suggestions.push('Supprimez les caractères spéciaux comme @, #, $, etc.');
    }

    // Vérifications métier
    const words = trimmedName.toLowerCase().split(/\s+/);
    const inappropriateWords = ['admin', 'support', 'entrix', 'test', 'temp'];
    const foundInappropriate = words.find(word => inappropriateWords.includes(word));
    
    if (foundInappropriate) {
      errors.push(`Le mot "${foundInappropriate}" n'est pas autorisé dans les noms de groupe`);
      suggestions.push('Choisissez un nom plus descriptif de votre groupe');
    }

    // Suggestions d'amélioration
    if (trimmedName.length < 10) {
      suggestions.push('Un nom plus descriptif aiderait les autres à comprendre le but du groupe');
    }

    return { isValid: errors.length === 0, errors, suggestions };
  }

  /**
   * Valide une date de naissance
   */
  static validateDateOfBirth(dateOfBirth: Date): { isValid: boolean; errors: string[]; age?: number } {
    const errors: string[] = [];
    
    if (!dateOfBirth) {
      return { isValid: true, errors }; // Date de naissance optionnelle
    }

    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      // Age réel
    }

    if (dateOfBirth > today) {
      errors.push('La date de naissance ne peut pas être dans le futur');
    }

    if (age < 13) {
      errors.push('Vous devez avoir au moins 13 ans pour utiliser Entrix');
    }

    if (age > 120) {
      errors.push('Veuillez vérifier votre date de naissance');
    }

    return { isValid: errors.length === 0, errors, age };
  }

  /**
   * Valide un code pays ISO
   */
  static validateCountryCode(countryCode: string): { isValid: boolean; errors: string[]; normalizedCode?: string } {
    const errors: string[] = [];
    
    if (!countryCode) {
      errors.push('Le code pays est requis');
      return { isValid: false, errors };
    }

    const normalizedCode = countryCode.trim().toUpperCase();
    
    if (normalizedCode.length !== 2) {
      errors.push('Le code pays doit contenir exactement 2 lettres (norme ISO 3166-1)');
    }

    if (!/^[A-Z]{2}$/.test(normalizedCode)) {
      errors.push('Le code pays doit contenir uniquement des lettres');
    }

    // Validation avec liste des codes ISO valides (exemples)
    const validCodes = [
      'TN', 'DZ', 'MA', 'LY', 'EG', 'FR', 'DE', 'IT', 'ES', 'GB', 'US', 'CA', 
      'AU', 'AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'SY', 'IQ'
    ];
    
    if (!validCodes.includes(normalizedCode)) {
      errors.push('Code pays non reconnu');
    }

    return { isValid: errors.length === 0, errors, normalizedCode };
  }

  /**
   * Valide une clé d'onboarding
   */
  static validateOnboardingKey(key: string): { isValid: boolean; errors: string[]; normalizedKey?: string } {
    const errors: string[] = [];
    
    if (!key) {
      errors.push('La clé d\'onboarding est requise');
      return { isValid: false, errors };
    }

    const normalizedKey = key.trim().toUpperCase();
    
    if (normalizedKey.length < 8) {
      errors.push('La clé d\'onboarding doit contenir au moins 8 caractères');
    }

    if (normalizedKey.length > 50) {
      errors.push('La clé d\'onboarding ne peut pas dépasser 50 caractères');
    }

    // Formats acceptés:
    // 1. Legacy format: ONB_YYYY_XXX_XXXXXXX
    // 2. CSS 2025 format: XXXX-XXXX
    const legacyPattern = /^ONB_\d{4}_[A-Z]{3}_[A-Z0-9]{6,}$/;
    const css2025Pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    
    if (!legacyPattern.test(normalizedKey) && !css2025Pattern.test(normalizedKey)) {
      errors.push('Format de clé d\'onboarding invalide. Formats acceptés: ONB_YYYY_XXX_XXXXXXX ou XXXX-XXXX');
    }

    return { isValid: errors.length === 0, errors, normalizedKey };
  }

  /**
   * Valide un message d'invitation
   */
  static validateInvitationMessage(message: string): { isValid: boolean; errors: string[]; warnings?: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!message) {
      return { isValid: true, errors }; // Message optionnel
    }

    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length > INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH) {
      errors.push(`Le message ne peut pas dépasser ${INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH} caractères`);
    }

    // Vérifications de contenu inapproprié (basique)
    const inappropriatePatterns = [
      /spam/i, /promo/i, /gratuit/i, /urgent/i, /cliquez/i
    ];
    
    if (inappropriatePatterns.some(pattern => pattern.test(trimmedMessage))) {
      warnings.push('Le message pourrait être considéré comme du spam');
    }

    // Vérification des URLs
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = trimmedMessage.match(urlPattern);
    if (urls && urls.length > 2) {
      warnings.push('Évitez de mettre trop de liens dans votre message');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Valide un ensemble de données utilisateur complet
   */
  static validateUserData(userData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    password?: string;
    dateOfBirth?: Date;
    country?: string;
  }): { isValid: boolean; errors: string[]; warnings?: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation email
    if (userData.email) {
      const emailValidation = this.validateEmail(userData.email);
      errors.push(...emailValidation.errors);
    }

    // Validation téléphone
    if (userData.phone) {
      const phoneValidation = this.validatePhone(userData.phone);
      errors.push(...phoneValidation.errors);
    }

    // Validation mot de passe
    if (userData.password) {
      const passwordValidation = this.validatePassword(userData.password);
      errors.push(...passwordValidation.errors);
      if (passwordValidation.strength === 'weak') {
        warnings.push('Votre mot de passe est faible, considérez le renforcer');
      }
    }

    // Validation date de naissance
    if (userData.dateOfBirth) {
      const dobValidation = this.validateDateOfBirth(userData.dateOfBirth);
      errors.push(...dobValidation.errors);
    }

    // Validation pays
    if (userData.country) {
      const countryValidation = this.validateCountryCode(userData.country);
      errors.push(...countryValidation.errors);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}