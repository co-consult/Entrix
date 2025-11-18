// src/modules/users/configs/anonymous.config.ts

import { registerAs } from '@nestjs/config';
import { IncentiveType } from '../types/enums';

export interface AnonymousConfig {
  onboarding: {
    keyLength: number;
    keyPrefix: string;
    defaultExpirationHours: number;
    maxExpirationHours: number;
    secretLength: number;
  };
  
  incentives: {
    enabled: boolean;
    defaultType: IncentiveType;
    configurations: Record<IncentiveType, {
      enabled: boolean;
      defaultValue: number;
      maxValue: number;
      description: string;
      conversionBonus: number;
    }>;
  };
  
  conversion: {
    enabled: boolean;
    requireEmailMatch: boolean;
    autoMigrateData: boolean;
    deleteAnonymousAfterConversion: boolean;
    maxConversionAttempts: number;
    conversionTimeoutMinutes: number;
  };
  
  session: {
    defaultDurationMinutes: number;
    maxDurationMinutes: number;
    extendOnActivity: boolean;
    maxExtensions: number;
    cleanupIntervalMinutes: number;
  };
  
  communication: {
    sendWelcomeEmail: boolean;
    sendOnboardingReminders: boolean;
    reminderIntervals: number[]; // en heures
    maxReminders: number;
    emailTemplates: {
      onboarding: string;
      conversion: string;
      reminder: string;
    };
  };
  
  analytics: {
    trackConversions: boolean;
    trackIncentiveEffectiveness: boolean;
    retentionPeriodDays: number;
    anonymizeAfterDays: number;
  };
  
  limits: {
    maxAnonymousPerEmail: number;
    maxCreationsPerHour: number;
    maxCreationsPerDay: number;
    cleanupExpiredAfterDays: number;
  };
}

export default registerAs('anonymous', (): AnonymousConfig => ({
  onboarding: {
    keyLength: parseInt(process.env.ANONYMOUS_KEY_LENGTH ?? '16', 10),
    keyPrefix: process.env.ANONYMOUS_KEY_PREFIX ?? 'ONB',
    defaultExpirationHours: parseInt(process.env.ANONYMOUS_DEFAULT_EXPIRATION_HOURS ?? '168', 10), // 7 jours
    maxExpirationHours: parseInt(process.env.ANONYMOUS_MAX_EXPIRATION_HOURS ?? '720', 10), // 30 jours
    secretLength: parseInt(process.env.ANONYMOUS_SECRET_LENGTH ?? '32', 10),
  },
  
  incentives: {
    enabled: process.env.ANONYMOUS_INCENTIVES_ENABLED !== 'false',
    defaultType: (process.env.ANONYMOUS_DEFAULT_INCENTIVE_TYPE as IncentiveType) ?? IncentiveType.BONUS_POINTS,
    
    configurations: {
      [IncentiveType.BONUS_POINTS]: {
        enabled: process.env.INCENTIVE_BONUS_POINTS_ENABLED !== 'false',
        defaultValue: parseInt(process.env.INCENTIVE_BONUS_POINTS_DEFAULT ?? '100', 10),
        maxValue: parseInt(process.env.INCENTIVE_BONUS_POINTS_MAX ?? '1000', 10),
        description: 'Points bonus à l\'inscription',
        conversionBonus: parseInt(process.env.INCENTIVE_BONUS_POINTS_CONVERSION_BONUS ?? '50', 10),
      },
      
      [IncentiveType.DISCOUNT_NEXT]: {
        enabled: process.env.INCENTIVE_DISCOUNT_ENABLED !== 'false',
        defaultValue: parseInt(process.env.INCENTIVE_DISCOUNT_DEFAULT ?? '10', 10), // pourcentage
        maxValue: parseInt(process.env.INCENTIVE_DISCOUNT_MAX ?? '50', 10),
        description: 'Réduction sur le prochain achat',
        conversionBonus: parseInt(process.env.INCENTIVE_DISCOUNT_CONVERSION_BONUS ?? '5', 10),
      },
      
      [IncentiveType.FREE_UPGRADE]: {
        enabled: process.env.INCENTIVE_UPGRADE_ENABLED !== 'false',
        defaultValue: 1, // nombre d'upgrades
        maxValue: parseInt(process.env.INCENTIVE_UPGRADE_MAX ?? '3', 10),
        description: 'Surclassement gratuit',
        conversionBonus: 1,
      },
      
      [IncentiveType.EXCLUSIVE_ACCESS]: {
        enabled: process.env.INCENTIVE_EXCLUSIVE_ENABLED !== 'false',
        defaultValue: parseInt(process.env.INCENTIVE_EXCLUSIVE_DURATION ?? '30', 10), // jours
        maxValue: parseInt(process.env.INCENTIVE_EXCLUSIVE_MAX ?? '90', 10),
        description: 'Accès exclusif aux ventes privées',
        conversionBonus: parseInt(process.env.INCENTIVE_EXCLUSIVE_CONVERSION_BONUS ?? '15', 10),
      },
      
      [IncentiveType.GIFT_VOUCHER]: {
        enabled: process.env.INCENTIVE_VOUCHER_ENABLED !== 'false',
        defaultValue: parseInt(process.env.INCENTIVE_VOUCHER_DEFAULT ?? '20', 10), // TND
        maxValue: parseInt(process.env.INCENTIVE_VOUCHER_MAX ?? '100', 10),
        description: 'Bon d\'achat cadeau',
        conversionBonus: parseInt(process.env.INCENTIVE_VOUCHER_CONVERSION_BONUS ?? '10', 10),
      },
    },
  },
  
  conversion: {
    enabled: process.env.ANONYMOUS_CONVERSION_ENABLED !== 'false',
    requireEmailMatch: process.env.ANONYMOUS_REQUIRE_EMAIL_MATCH !== 'false',
    autoMigrateData: process.env.ANONYMOUS_AUTO_MIGRATE_DATA !== 'false',
    deleteAnonymousAfterConversion: process.env.ANONYMOUS_DELETE_AFTER_CONVERSION !== 'false',
    maxConversionAttempts: parseInt(process.env.ANONYMOUS_MAX_CONVERSION_ATTEMPTS ?? '3', 10),
    conversionTimeoutMinutes: parseInt(process.env.ANONYMOUS_CONVERSION_TIMEOUT ?? '30', 10),
  },
  
  session: {
    defaultDurationMinutes: parseInt(process.env.ANONYMOUS_SESSION_DURATION ?? '60', 10),
    maxDurationMinutes: parseInt(process.env.ANONYMOUS_SESSION_MAX_DURATION ?? '1440', 10), // 24h
    extendOnActivity: process.env.ANONYMOUS_EXTEND_ON_ACTIVITY !== 'false',
    maxExtensions: parseInt(process.env.ANONYMOUS_MAX_EXTENSIONS ?? '5', 10),
    cleanupIntervalMinutes: parseInt(process.env.ANONYMOUS_CLEANUP_INTERVAL ?? '60', 10),
  },
  
  communication: {
    sendWelcomeEmail: process.env.ANONYMOUS_SEND_WELCOME_EMAIL !== 'false',
    sendOnboardingReminders: process.env.ANONYMOUS_SEND_REMINDERS !== 'false',
    reminderIntervals: process.env.ANONYMOUS_REMINDER_INTERVALS?.split(',').map(Number) ?? [24, 72, 168], // heures
    maxReminders: parseInt(process.env.ANONYMOUS_MAX_REMINDERS ?? '3', 10),
    emailTemplates: {
      onboarding: process.env.ANONYMOUS_ONBOARDING_TEMPLATE ?? 'anonymous-onboarding',
      conversion: process.env.ANONYMOUS_CONVERSION_TEMPLATE ?? 'anonymous-conversion',
      reminder: process.env.ANONYMOUS_REMINDER_TEMPLATE ?? 'anonymous-reminder',
    },
  },
  
  analytics: {
    trackConversions: process.env.ANONYMOUS_TRACK_CONVERSIONS !== 'false',
    trackIncentiveEffectiveness: process.env.ANONYMOUS_TRACK_INCENTIVES !== 'false',
    retentionPeriodDays: parseInt(process.env.ANONYMOUS_RETENTION_DAYS ?? '90', 10),
    anonymizeAfterDays: parseInt(process.env.ANONYMOUS_ANONYMIZE_AFTER_DAYS ?? '365', 10),
  },
  
  limits: {
    maxAnonymousPerEmail: parseInt(process.env.ANONYMOUS_MAX_PER_EMAIL ?? '5', 10),
    maxCreationsPerHour: parseInt(process.env.ANONYMOUS_MAX_CREATIONS_HOUR ?? '10', 10),
    maxCreationsPerDay: parseInt(process.env.ANONYMOUS_MAX_CREATIONS_DAY ?? '50', 10),
    cleanupExpiredAfterDays: parseInt(process.env.ANONYMOUS_CLEANUP_AFTER_DAYS ?? '30', 10),
  },
}));

// Configuration par défaut pour le développement
export const ANONYMOUS_CONFIG_DEFAULTS = {
  onboarding: {
    keyLength: 16,
    keyPrefix: 'ONB',
    defaultExpirationHours: 168, // 7 jours
    maxExpirationHours: 720, // 30 jours
    secretLength: 32,
  },
  
  incentives: {
    enabled: true,
    defaultType: IncentiveType.BONUS_POINTS,
  },
  
  conversion: {
    enabled: true,
    requireEmailMatch: true,
    autoMigrateData: true,
    deleteAnonymousAfterConversion: true,
    maxConversionAttempts: 3,
    conversionTimeoutMinutes: 30,
  },
  
  session: {
    defaultDurationMinutes: 60,
    maxDurationMinutes: 1440,
    extendOnActivity: true,
    maxExtensions: 5,
    cleanupIntervalMinutes: 60,
  },
  
  communication: {
    sendWelcomeEmail: true,
    sendOnboardingReminders: true,
    reminderIntervals: [24, 72, 168],
    maxReminders: 3,
  },
  
  analytics: {
    trackConversions: true,
    trackIncentiveEffectiveness: true,
    retentionPeriodDays: 90,
    anonymizeAfterDays: 365,
  },
  
  limits: {
    maxAnonymousPerEmail: 5,
    maxCreationsPerHour: 10,
    maxCreationsPerDay: 50,
    cleanupExpiredAfterDays: 30,
  },
};