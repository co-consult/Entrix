// src/modules/users/utils/onboarding.util.ts

import { randomBytes, createHash } from 'crypto';
import { IncentiveType } from '../types/enums';

/**
 * Utilitaires pour l'onboarding et la génération de clés secrètes
 */
export class OnboardingUtil {

  /**
   * Génère une clé d'onboarding unique et sécurisée
   */
  static generateOnboardingKey(
    prefix: string = 'ONB',
    context: string = 'GEN',
    length: number = 8
  ): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Génération de la partie aléatoire
    const randomPart = randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .toUpperCase()
      .substring(0, length);
    
    // Format: ONB_YYYY_CTX_RANDOMPART
    return `${prefix}_${year}${month}_${context}_${randomPart}`;
  }

  /**
   * Génère une clé d'onboarding avec contexte spécifique
   */
  static generateContextualOnboardingKey(options: {
    eventType?: string;
    ticketType?: string;
    userType?: string;
    campaign?: string;
  }): string {
    let context = 'GEN';
    
    if (options.eventType) {
      const eventContexts: Record<string, string> = {
        'SPORT': 'SPT',
        'MUSIC': 'MUS', 
        'CULTURE': 'CUL',
        'BUSINESS': 'BIZ',
        'EDUCATION': 'EDU',
        'ENTERTAINMENT': 'ENT',
      };
      context = eventContexts[options.eventType] || 'EVT';
    }
    
    if (options.ticketType) {
      const ticketContexts: Record<string, string> = {
        'VIP': 'VIP',
        'PREMIUM': 'PRM',
        'STANDARD': 'STD',
        'STUDENT': 'STU',
      };
      const ticketContext = ticketContexts[options.ticketType];
      if (ticketContext) {
        context = `${context}${ticketContext}`;
      }
    }

    return this.generateOnboardingKey('ONB', context);
  }

  /**
   * Valide le format d'une clé d'onboarding
   */
  static validateOnboardingKeyFormat(key: string): {
    isValid: boolean;
    parts?: {
      prefix: string;
      yearMonth: string;
      context: string;
      random: string;
    };
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!key || typeof key !== 'string') {
      errors.push('Clé d\'onboarding invalide');
      return { isValid: false, errors };
    }

    const normalizedKey = key.trim().toUpperCase();
    
    // Check for CSS 2025 format first: XXXX-XXXX
    const css2025Pattern = /^([A-Z0-9]{4})-([A-Z0-9]{4})$/;
    const css2025Match = normalizedKey.match(css2025Pattern);
    
    if (css2025Match) {
      const [, part1, part2] = css2025Match;
      
      // Both parts should be 4 alphanumeric characters
      if (!/^[A-Z0-9]{4}$/.test(part1) || !/^[A-Z0-9]{4}$/.test(part2)) {
        errors.push('Format invalide pour la clé CSS 2025');
      }
      
      const isValid = errors.length === 0;
      return {
        isValid,
        parts: isValid ? { 
          prefix: 'CSS2025', 
          yearMonth: part1, 
          context: 'PHYSICAL', 
          random: part2
        } : undefined,
        errors,
      };
    }
    
    // Legacy format: ONB_YYYYMM_XXX_XXXXXXX
    const parts = normalizedKey.split('_');

    if (parts.length !== 4) {
      errors.push('Format de clé incorrect (attendu: PREFIX_YYYYMM_CONTEXT_RANDOM ou XXXX-XXXX)');
      return { isValid: false, errors };
    }

    const [prefix, yearMonth, context, random] = parts;

    // Validation du préfixe
    if (prefix !== 'ONB') {
      errors.push('Préfixe de clé invalide pour le format legacy');
    }

    // Validation année/mois
    if (!/^\d{6}$/.test(yearMonth)) {
      errors.push('Format date invalide dans la clé legacy');
    } else {
      const year = parseInt(yearMonth.substring(0, 4));
      const month = parseInt(yearMonth.substring(4, 6));
      
      if (year < 2020 || year > 2030) {
        errors.push('Année invalide dans la clé legacy');
      }
      
      if (month < 1 || month > 12) {
        errors.push('Mois invalide dans la clé legacy');
      }
    }

    // Validation contexte
    if (!/^[A-Z]{3,8}$/.test(context)) {
      errors.push('Contexte invalide dans la clé legacy');
    }

    // Validation partie aléatoire
    if (!/^[A-Z0-9]{6,12}$/.test(random)) {
      errors.push('Partie aléatoire invalide dans la clé legacy');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      parts: isValid ? { prefix, yearMonth, context, random } : undefined,
      errors,
    };
  }

  /**
   * Génère un hash sécurisé pour une clé d'onboarding
   */
  static generateKeyHash(key: string, salt?: string): string {
    const actualSalt = salt || randomBytes(16).toString('hex');
    return createHash('sha256')
      .update(key + actualSalt)
      .digest('hex');
  }

  /**
   * Détermine l'incentive approprié selon le contexte
   */
  static determineIncentive(context: {
    eventType?: string;
    ticketPrice?: number;
    userHistory?: 'new' | 'returning' | 'vip';
    groupSize?: number;
    campaign?: string;
  }): {
    type: IncentiveType;
    value: number;
    description: string;
    priority: 'low' | 'medium' | 'high';
  } {
    // Logique intelligente pour déterminer l'incentive optimal
    
    // Utilisateur VIP ou prix élevé → incentive premium
    if (context.userHistory === 'vip' || (context.ticketPrice && context.ticketPrice > 200)) {
      return {
        type: IncentiveType.EXCLUSIVE_ACCESS,
        value: 30, // 30 jours d'accès exclusif
        description: 'Accès exclusif VIP aux ventes privées pendant 30 jours',
        priority: 'high',
      };
    }

    // Achat en groupe → points bonus
    if (context.groupSize && context.groupSize > 3) {
      const bonusPoints = Math.min(context.groupSize * 25, 200);
      return {
        type: IncentiveType.BONUS_POINTS,
        value: bonusPoints,
        description: `${bonusPoints} points bonus pour votre achat en groupe`,
        priority: 'medium',
      };
    }

    // Événement sport → différents types selon le prix
    if (context.eventType === 'SPORT') {
      if (context.ticketPrice && context.ticketPrice > 100) {
        return {
          type: IncentiveType.FREE_UPGRADE,
          value: 1,
          description: 'Surclassement gratuit sur votre prochain achat',
          priority: 'high',
        };
      } else {
        return {
          type: IncentiveType.BONUS_POINTS,
          value: 100,
          description: '100 points fidélité supporter à l\'inscription',
          priority: 'medium',
        };
      }
    }

    // Événement musique → réduction
    if (context.eventType === 'MUSIC') {
      return {
        type: IncentiveType.DISCOUNT_NEXT,
        value: 15,
        description: '15% de réduction sur votre prochain concert',
        priority: 'medium',
      };
    }

    // Événement culture → bon d'achat
    if (context.eventType === 'CULTURE') {
      const voucherValue = Math.max(20, Math.floor((context.ticketPrice || 50) * 0.2));
      return {
        type: IncentiveType.GIFT_VOUCHER,
        value: voucherValue,
        description: `Bon d'achat de ${voucherValue} TND pour les événements culturels`,
        priority: 'medium',
      };
    }

    // Nouveau client → points de bienvenue
    if (context.userHistory === 'new') {
      return {
        type: IncentiveType.BONUS_POINTS,
        value: 150,
        description: '150 points de bienvenue + accès aux offres exclusives',
        priority: 'high',
      };
    }

    // Campagne spécifique
    if (context.campaign) {
      const campaignIncentives: Record<string, any> = {
        'summer2025': {
          type: IncentiveType.DISCOUNT_NEXT,
          value: 20,
          description: 'Offre été 2025 : 20% sur votre prochain achat',
          priority: 'high',
        },
        'student': {
          type: IncentiveType.BONUS_POINTS,
          value: 75,
          description: '75 points étudiants + réductions exclusives',
          priority: 'medium',
        },
        'family': {
          type: IncentiveType.FREE_UPGRADE,
          value: 2,
          description: '2 surclassements famille gratuits',
          priority: 'high',
        },
      };

      if (campaignIncentives[context.campaign]) {
        return campaignIncentives[context.campaign];
      }
    }

    // Incentive par défaut
    return {
      type: IncentiveType.BONUS_POINTS,
      value: 100,
      description: '100 points bonus à l\'inscription sur Entrix',
      priority: 'medium',
    };
  }

  /**
   * Calcule la date d'expiration d'une clé d'onboarding
   */
  static calculateExpirationDate(
    incentiveType: IncentiveType,
    customHours?: number
  ): Date {
    const now = new Date();
    let hoursToAdd = customHours;

    if (!hoursToAdd) {
      // Durées par défaut selon le type d'incentive
      const defaultDurations: Record<IncentiveType, number> = {
        [IncentiveType.BONUS_POINTS]: 168, // 7 jours
        [IncentiveType.DISCOUNT_NEXT]: 240, // 10 jours
        [IncentiveType.FREE_UPGRADE]: 336, // 14 jours
        [IncentiveType.EXCLUSIVE_ACCESS]: 120, // 5 jours (urgence)
        [IncentiveType.GIFT_VOUCHER]: 720, // 30 jours
      };

      hoursToAdd = defaultDurations[incentiveType] || 168;
    }

    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  /**
   * Génère un message d'onboarding personnalisé
   */
  static generateOnboardingMessage(
    guestName: string,
    incentive: {
      type: IncentiveType;
      value: number;
      description: string;
    },
    context?: {
      eventName?: string;
      eventDate?: Date;
      organizerName?: string;
    }
  ): {
    subject: string;
    greeting: string;
    incentiveText: string;
    callToAction: string;
    footer: string;
  } {
    const firstName = guestName.split(' ')[0];
    
    // Sujet personnalisé
    let subject = `${firstName}, vos billets sont prêts`;
    if (context?.eventName) {
      subject += ` pour ${context.eventName}`;
    }
    subject += ' + Surprise exclusive !';

    // Salutation
    const greeting = `Bonjour ${firstName},`;

    // Texte incentive avec emojis selon le type
    const incentiveEmojis: Record<IncentiveType, string> = {
      [IncentiveType.BONUS_POINTS]: '⭐',
      [IncentiveType.DISCOUNT_NEXT]: '💰',
      [IncentiveType.FREE_UPGRADE]: '🎁',
      [IncentiveType.EXCLUSIVE_ACCESS]: '🔥',
      [IncentiveType.GIFT_VOUCHER]: '🎫',
    };

    const emoji = incentiveEmojis[incentive.type] || '🎉';
    const incentiveText = `${emoji} OFFRE EXCLUSIVE POUR VOUS :\n${incentive.description}`;

    // Call to action
    const callToAction = `Créez votre compte Entrix en 30 secondes pour débloquer cet avantage :`;

    // Footer personnalisé
    let footer = 'L\'équipe Entrix';
    if (context?.organizerName) {
      footer = `${context.organizerName} & l'équipe Entrix`;
    }

    return {
      subject,
      greeting,
      incentiveText,
      callToAction,
      footer,
    };
  }

  /**
   * Génère une URL d'onboarding sécurisée
   */
  static generateOnboardingUrl(
    onboardingKey: string,
    baseUrl: string = 'https://entrix.tn',
    additionalParams?: Record<string, string>
  ): string {
    const url = new URL(`${baseUrl}/onboard/${onboardingKey}`);
    
    // Ajout de paramètres de tracking
    url.searchParams.set('utm_source', 'onboarding');
    url.searchParams.set('utm_medium', 'email');
    url.searchParams.set('utm_campaign', 'conversion');
    
    // Paramètres additionnels
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Valide qu'une clé d'onboarding n'est pas expirée
   */
  static isKeyExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Calcule le temps restant avant expiration
   */
  static getTimeUntilExpiration(expiresAt: Date): {
    isExpired: boolean;
    totalHours: number;
    totalDays: number;
    humanReadable: string;
  } {
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const isExpired = diffMs <= 0;

    if (isExpired) {
      return {
        isExpired: true,
        totalHours: 0,
        totalDays: 0,
        humanReadable: 'Expiré',
      };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    let humanReadable = '';
    if (totalDays > 0) {
      humanReadable = `${totalDays} jour${totalDays > 1 ? 's' : ''}`;
      if (remainingHours > 0) {
        humanReadable += ` et ${remainingHours} heure${remainingHours > 1 ? 's' : ''}`;
      }
    } else {
      humanReadable = `${totalHours} heure${totalHours > 1 ? 's' : ''}`;
    }

    return {
      isExpired: false,
      totalHours,
      totalDays,
      humanReadable,
    };
  }

  /**
   * Génère des statistiques d'onboarding
   */
  static generateOnboardingStats(onboardingData: Array<{
    createdAt: Date;
    expiresAt: Date;
    incentiveType: IncentiveType;
    converted: boolean;
    convertedAt?: Date;
  }>): {
    total: number;
    active: number;
    expired: number;
    converted: number;
    conversionRate: number;
    averageTimeToConversion: number;
    incentiveEffectiveness: Record<IncentiveType, {
      total: number;
      converted: number;
      rate: number;
    }>;
  } {
    const now = new Date();
    const total = onboardingData.length;
    const active = onboardingData.filter(item => 
      !item.converted && item.expiresAt > now
    ).length;
    const expired = onboardingData.filter(item => 
      !item.converted && item.expiresAt <= now
    ).length;
    const converted = onboardingData.filter(item => item.converted).length;
    
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    // Temps moyen de conversion en heures
    const convertedItems = onboardingData.filter(item => 
      item.converted && item.convertedAt
    );
    const averageTimeToConversion = convertedItems.length > 0 
      ? convertedItems.reduce((sum, item) => {
          const diffMs = item.convertedAt!.getTime() - item.createdAt.getTime();
          return sum + (diffMs / (1000 * 60 * 60));
        }, 0) / convertedItems.length
      : 0;

    // Efficacité par type d'incentive
    const incentiveEffectiveness: Record<IncentiveType, any> = {} as any;
    
    Object.values(IncentiveType).forEach(type => {
      const itemsOfType = onboardingData.filter(item => item.incentiveType === type);
      const convertedOfType = itemsOfType.filter(item => item.converted);
      
      incentiveEffectiveness[type] = {
        total: itemsOfType.length,
        converted: convertedOfType.length,
        rate: itemsOfType.length > 0 ? (convertedOfType.length / itemsOfType.length) * 100 : 0,
      };
    });

    return {
      total,
      active,
      expired,
      converted,
      conversionRate,
      averageTimeToConversion,
      incentiveEffectiveness,
    };
  }
}