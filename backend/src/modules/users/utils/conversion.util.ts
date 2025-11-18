// src/modules/users/utils/conversion.util.ts

import { IncentiveType } from '../types/enums';
import { AnonymousUser, ConversionData, ConversionResult } from '../interfaces/anonymous.interface';

/**
 * Utilitaires pour la conversion d'utilisateurs anonymes vers utilisateurs enregistrés
 */
export class ConversionUtil {

  /**
   * Valide les données de conversion
   */
  static validateConversionData(
    conversionData: ConversionData,
    anonymousUser: AnonymousUser
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérification email match
    if (conversionData.userData.email.toLowerCase() !== anonymousUser.guestEmail.toLowerCase()) {
      errors.push('L\'email doit correspondre à celui utilisé lors de l\'achat anonyme');
    }

    // Vérification clé d'onboarding
    if (!anonymousUser.onboardingKey) {
      errors.push('Aucune clé d\'onboarding associée à cet utilisateur anonyme');
    }

    // Vérification expiration
    if (anonymousUser.expiresAt && new Date() > anonymousUser.expiresAt) {
      errors.push('La clé d\'onboarding a expiré');
      warnings.push('Contactez le support pour récupérer vos avantages');
    }

    // Vérification déjà converti
    if (anonymousUser.converted) {
      errors.push('Cet utilisateur anonyme a déjà été converti');
    }

    // Validation des conditions
    if (!conversionData.acceptedTerms) {
      errors.push('Vous devez accepter les conditions générales');
    }

    // Vérifications métier
    const nameWords = `${conversionData.userData.firstName} ${conversionData.userData.lastName}`.toLowerCase();
    const guestNameWords = anonymousUser.guestName.toLowerCase();
    
    if (!this.namesAreSimilar(nameWords, guestNameWords)) {
      warnings.push('Le nom saisi diffère de celui utilisé lors de l\'achat anonyme');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Compare deux noms pour détecter les similitudes
   */
  private static namesAreSimilar(name1: string, name2: string): boolean {
    const normalize = (name: string) => name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const words1 = normalize(name1);
    const words2 = normalize(name2);

    // Vérifier si au moins un mot correspond
    return words1.some(word1 => 
      words2.some(word2 => 
        word1.includes(word2) || word2.includes(word1) || 
        this.levenshteinDistance(word1, word2) <= 2
      )
    );
  }

  /**
   * Calcule la distance de Levenshtein entre deux chaînes
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Prépare les données pour la migration
   */
  static prepareMigrationData(anonymousUser: AnonymousUser): {
    ticketIds: string[];
    subscriptionIds: string[];
    orderIds: string[];
    metadata: Record<string, any>;
  } {
    const migrationData = {
      ticketIds: [],
      subscriptionIds: [],
      orderIds: [],
      metadata: {
        originalAnonymousId: anonymousUser.id,
        originalGuestName: anonymousUser.guestName,
        originalGuestEmail: anonymousUser.guestEmail,
        conversionDate: new Date().toISOString(),
        incentiveApplied: !!anonymousUser.incentiveType,
        ...anonymousUser.metadata,
      },
    };

    // Les IDs seront récupérés via des requêtes à la base
    // Cette méthode prépare la structure
    return migrationData;
  }

  /**
   * Calcule l'incentive à appliquer lors de la conversion
   */
  static calculateIncentive(anonymousUser: AnonymousUser): {
    type: IncentiveType | null;
    value: number;
    description: string;
    additionalBonus: number;
  } {
    if (!anonymousUser.incentiveType || !anonymousUser.incentiveValue) {
      return {
        type: null,
        value: 0,
        description: 'Aucun incentive disponible',
        additionalBonus: 0,
      };
    }

    const baseValue = anonymousUser.incentiveValue;
    let additionalBonus = 0;

    // Bonus de conversion selon le type
    switch (anonymousUser.incentiveType) {
      case IncentiveType.BONUS_POINTS:
        additionalBonus = Math.floor(baseValue * 0.5); // 50% bonus
        break;
      case IncentiveType.DISCOUNT_NEXT:
        additionalBonus = Math.min(baseValue + 5, 50); // +5% max 50%
        break;
      case IncentiveType.FREE_UPGRADE:
        additionalBonus = 1; // +1 upgrade
        break;
      case IncentiveType.EXCLUSIVE_ACCESS:
        additionalBonus = 15; // +15 jours
        break;
      case IncentiveType.GIFT_VOUCHER:
        additionalBonus = Math.floor(baseValue * 0.3); // 30% bonus
        break;
      default:
        additionalBonus = 0;
    }

    const finalValue = baseValue + additionalBonus;
    const description = anonymousUser.incentiveDescription || 
      this.getDefaultIncentiveDescription(anonymousUser.incentiveType, finalValue);

    return {
      type: anonymousUser.incentiveType,
      value: finalValue,
      description,
      additionalBonus,
    };
  }

  /**
   * Génère une description par défaut pour un incentive
   */
  private static getDefaultIncentiveDescription(type: IncentiveType, value: number): string {
    switch (type) {
      case IncentiveType.BONUS_POINTS:
        return `${value} points bonus à l'inscription`;
      case IncentiveType.DISCOUNT_NEXT:
        return `${value}% de réduction sur votre prochain achat`;
      case IncentiveType.FREE_UPGRADE:
        return `${value} surclassement${value > 1 ? 's' : ''} gratuit${value > 1 ? 's' : ''}`;
      case IncentiveType.EXCLUSIVE_ACCESS:
        return `${value} jours d'accès exclusif aux ventes privées`;
      case IncentiveType.GIFT_VOUCHER:
        return `Bon d'achat de ${value} TND`;
      default:
        return 'Avantage spécial à l\'inscription';
    }
  }

  /**
   * Génère un résumé de conversion
   */
  static generateConversionSummary(
    anonymousUser: AnonymousUser,
    createdUser: any,
    migrationData: any,
    incentiveApplied: boolean
  ): ConversionResult {
    const incentiveDetails = this.calculateIncentive(anonymousUser);

    return {
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        phone: createdUser.phone,
        first_name: createdUser.firstName,
        last_name: createdUser.lastName,
        avatar: createdUser.avatar,
        password: createdUser.password,
        is_active: createdUser.isActive,
        email_verified: createdUser.emailVerified,
        phone_verified: createdUser.phoneVerified,
        created_at: createdUser.createdAt,
        updated_at: createdUser.updatedAt,
        last_login: createdUser.lastLogin,
        metadata: createdUser.metadata,
      },
      incentiveApplied,
      incentiveDetails: incentiveApplied ? {
        type: incentiveDetails.type!,
        value: incentiveDetails.value,
        description: incentiveDetails.description,
      } : undefined,
      migrationSummary: {
        ticketsMigrated: migrationData.ticketIds?.length || 0,
        subscriptionsMigrated: migrationData.subscriptionIds?.length || 0,
        ordersMigrated: migrationData.orderIds?.length || 0,
      },
    };
  }

  /**
   * Valide qu'une conversion peut être effectuée
   */
  static canConvert(anonymousUser: AnonymousUser): { 
    canConvert: boolean; 
    reasons: string[]; 
    blockers: string[] 
  } {
    const reasons: string[] = [];
    const blockers: string[] = [];

    // Vérifications bloquantes
    if (anonymousUser.converted) {
      blockers.push('Utilisateur déjà converti');
    }

    if (anonymousUser.expiresAt && new Date() > anonymousUser.expiresAt) {
      blockers.push('Clé d\'onboarding expirée');
    }

    if (!anonymousUser.onboardingKey) {
      blockers.push('Aucune clé d\'onboarding disponible');
    }

    // Vérifications informatives
    if (!anonymousUser.incentiveType) {
      reasons.push('Aucun incentive associé');
    }

    if (!anonymousUser.guestPhone) {
      reasons.push('Aucun numéro de téléphone fourni');
    }

    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(anonymousUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreation > 30) {
      reasons.push('Création ancienne (plus de 30 jours)');
    }

    return {
      canConvert: blockers.length === 0,
      reasons,
      blockers,
    };
  }

  /**
   * Estime le score de qualité de la conversion
   */
  static calculateConversionQualityScore(
    anonymousUser: AnonymousUser,
    conversionData: ConversionData
  ): {
    score: number; // 0-100
    factors: Array<{ factor: string; score: number; weight: number; impact: string }>;
  } {
    const factors = [
      {
        factor: 'Email match',
        score: conversionData.userData.email.toLowerCase() === anonymousUser.guestEmail.toLowerCase() ? 100 : 0,
        weight: 30,
        impact: 'critical',
      },
      {
        factor: 'Name similarity',
        score: this.namesAreSimilar(
          `${conversionData.userData.firstName} ${conversionData.userData.lastName}`,
          anonymousUser.guestName
        ) ? 100 : 50,
        weight: 20,
        impact: 'high',
      },
      {
        factor: 'Phone provided',
        score: conversionData.userData.phone ? 100 : 0,
        weight: 10,
        impact: 'medium',
      },
      {
        factor: 'Profile data completeness',
        score: conversionData.profileData ? 
          Object.keys(conversionData.profileData).length * 20 : 0,
        weight: 15,
        impact: 'medium',
      },
      {
        factor: 'Conversion timing',
        score: Math.max(0, 100 - Math.floor(
          (Date.now() - new Date(anonymousUser.createdAt).getTime()) / (1000 * 60 * 60 * 24) * 2
        )),
        weight: 15,
        impact: 'low',
      },
      {
        factor: 'Marketing consent',
        score: conversionData.marketingConsent ? 100 : 50,
        weight: 10,
        impact: 'low',
      },
    ];

    const totalScore = factors.reduce((sum, factor) => {
      return sum + (factor.score * factor.weight / 100);
    }, 0);

    return {
      score: Math.round(totalScore),
      factors,
    };
  }

  /**
   * Génère des recommandations post-conversion
   */
  static generatePostConversionRecommendations(
    user: any,
    migrationSummary: any,
    incentiveApplied: boolean
  ): string[] {
    const recommendations: string[] = [];

    // Recommandations basées sur le profil
    if (!user.avatar) {
      recommendations.push('Ajoutez une photo de profil');
    }

    if (!user.phone) {
      recommendations.push('Ajoutez votre numéro de téléphone pour la sécurité');
    }

    // Recommandations basées sur la migration
    if (migrationSummary.ticketsMigrated > 0) {
      recommendations.push('Consultez vos billets dans "Mes achats"');
    }

    if (migrationSummary.subscriptionsMigrated > 0) {
      recommendations.push('Gérez vos abonnements dans votre espace personnel');
    }

    // Recommandations basées sur l'incentive
    if (incentiveApplied) {
      recommendations.push('Utilisez vos avantages dans la section "Mes récompenses"');
    }

    // Recommandations générales
    recommendations.push('Explorez les événements recommandés pour vous');
    recommendations.push('Rejoignez ou créez des groupes avec vos amis');
    recommendations.push('Configurez vos préférences de notifications');

    return recommendations;
  }
}