/**
 * Constantes pour BullMQ
 */

// Noms des queues
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  PAYMENTS: 'payments',
  REPORTS: 'reports',
  MAINTENANCE: 'maintenance',      // ✅ NOUVEAU : Pour TokenMaintenanceService
  ALERTS: 'alerts',               // ✅ NOUVEAU : Pour alertes système
} as const;

// Types de jobs par queue
export const JOB_TYPES = {
  EMAIL: {
    SEND_WELCOME: 'send-welcome',
    SEND_VERIFICATION: 'send-verification',           // Utilisé pour EMAIL_VERIFICATION
    SEND_PASSWORD_RESET: 'send-password-reset',       // Utilisé pour PASSWORD_RESET
    SEND_TICKET: 'send-ticket',
    SEND_INVOICE: 'send-invoice',
    SEND_REMINDER: 'send-reminder',
    // ✅ NOUVEAUX TYPES pour tokens de validation
    SEND_INVITATION: 'send-invitation',              // Pour INVITATION_USER/GROUP
    SEND_MAGIC_LINK: 'send-magic-link',             // Pour MAGIC_LINK_*
    SEND_EMAIL_CHANGE: 'send-email-change',         // Pour EMAIL_CHANGE
    SEND_ACCOUNT_ACTIVATION: 'send-account-activation', // Pour ACCOUNT_ACTIVATION
  },
  NOTIFICATIONS: {
    PUSH_NOTIFICATION: 'push-notification',
    SMS_NOTIFICATION: 'sms-notification',            // Utilisé pour SMS de vérification
    IN_APP_NOTIFICATION: 'in-app-notification',
    // ✅ NOUVEAUX TYPES pour notifications tokens
    SMS_VERIFICATION: 'sms-verification',           // Codes de vérification SMS
    PHONE_VERIFICATION: 'phone-verification',       // Vérification téléphone
  },
  PAYMENTS: {
    PROCESS_PAYMENT: 'process-payment',
    PROCESS_REFUND: 'process-refund',
    CALCULATE_COMMISSION: 'calculate-commission',
    GENERATE_PAYOUT: 'generate-payout',
  },
  REPORTS: {
    GENERATE_SALES_REPORT: 'generate-sales-report',
    GENERATE_ATTENDANCE_REPORT: 'generate-attendance-report',
    GENERATE_FINANCIAL_REPORT: 'generate-financial-report',
    EXPORT_DATA: 'export-data',
  },
  // ✅ NOUVELLES QUEUES pour maintenance
  MAINTENANCE: {
    CLEANUP_REPORT: 'cleanup_report',               // Rapports de nettoyage
    TOKEN_CLEANUP: 'token_cleanup',                 // Nettoyage automatique
    CACHE_OPTIMIZATION: 'cache_optimization',       // Optimisation cache
    HEALTH_CHECK: 'health_check',                  // Vérifications de santé
  },
  ALERTS: {
    MAINTENANCE_ALERT: 'maintenance_alert',         // Alertes de maintenance
    SECURITY_ALERT: 'security_alert',              // Alertes de sécurité
    THRESHOLD_ALERT: 'threshold_alert',            // Alertes de seuils
    SYSTEM_ALERT: 'system_alert',                  // Alertes système
  },
} as const;

// ✅ NOUVELLES PRIORITÉS pour tokens
export const JOB_PRIORITIES = {
  CRITICAL: 1,      // Alertes critiques, sécurité
  HIGH: 2,         // Tokens de validation urgents (reset password)
  NORMAL: 3,       // Tokens standards (email verification)
  LOW: 4,          // Maintenance, nettoyage
  BACKGROUND: 5,   // Tâches de fond, statistiques
} as const;

// ✅ OPTIONS SPÉCIALISÉES par type de job
export const JOB_OPTIONS = {
  // Options par défaut
  DEFAULT: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // 24 heures
      count: 100,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 jours
      count: 50,
    },
  },

  // Options pour emails critiques (reset password, etc.)
  CRITICAL_EMAIL: {
    attempts: 5,
    priority: JOB_PRIORITIES.HIGH,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 7 * 24 * 3600, // 7 jours (plus long pour audit)
      count: 200,
    },
    removeOnFail: {
      age: 30 * 24 * 3600, // 30 jours
      count: 100,
    },
  },

  // Options pour SMS (plus de tentatives, délais courts)
  SMS: {
    attempts: 5,
    priority: JOB_PRIORITIES.HIGH,
    backoff: {
      type: 'fixed',
      delay: 30000, // 30 secondes entre tentatives
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 50,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
      count: 25,
    },
  },

  // Options pour maintenance (tentatives réduites, priorité basse)
  MAINTENANCE: {
    attempts: 2,
    priority: JOB_PRIORITIES.LOW,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute
    },
    removeOnComplete: {
      age: 3 * 24 * 3600, // 3 jours
      count: 50,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
      count: 25,
    },
  },

  // Options pour alertes (immédiat, haute priorité)
  ALERTS: {
    attempts: 3,
    priority: JOB_PRIORITIES.CRITICAL,
    delay: 0, // Immédiat
    backoff: {
      type: 'fixed',
      delay: 5000, // 5 secondes
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 100,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
      count: 50,
    },
  },
} as const;

/**
 * Token d'injection du service BullMQ
 */
export const BULLMQ_SERVICE = 'BULLMQ_SERVICE';

/**
 * Namespace de configuration pour @nestjs/config
 */
export const BULLMQ_CONFIG_NAMESPACE = 'bullmq';

/**
 * ✅ HELPER FUNCTIONS pour obtenir les bonnes options
 */
export const getBullMQOptions = (tokenType: string, priority: number = JOB_PRIORITIES.NORMAL) => {
  // Mapper les types de tokens aux options appropriées
  const optionsMap = {
    'PASSWORD_RESET': JOB_OPTIONS.CRITICAL_EMAIL,
    'EMAIL_VERIFICATION': JOB_OPTIONS.DEFAULT,
    'PHONE_VERIFICATION': JOB_OPTIONS.SMS,
    'INVITATION_USER': JOB_OPTIONS.DEFAULT,
    'MAGIC_LINK_LOGIN': JOB_OPTIONS.CRITICAL_EMAIL,
    'MAINTENANCE': JOB_OPTIONS.MAINTENANCE,
    'ALERT': JOB_OPTIONS.ALERTS,
  };

  const baseOptions = optionsMap[tokenType] || JOB_OPTIONS.DEFAULT;
  
  return {
    ...baseOptions,
    priority,
  };
};

/**
 * ✅ MAPPING des types de tokens vers les types de jobs
 */
export const TOKEN_TO_JOB_TYPE = {
  'EMAIL_VERIFICATION': JOB_TYPES.EMAIL.SEND_VERIFICATION,
  'EMAIL_CHANGE': JOB_TYPES.EMAIL.SEND_EMAIL_CHANGE,
  'PASSWORD_RESET': JOB_TYPES.EMAIL.SEND_PASSWORD_RESET,
  'ACCOUNT_ACTIVATION': JOB_TYPES.EMAIL.SEND_ACCOUNT_ACTIVATION,
  'INVITATION_USER': JOB_TYPES.EMAIL.SEND_INVITATION,
  'INVITATION_GROUP': JOB_TYPES.EMAIL.SEND_INVITATION,
  'MAGIC_LINK_LOGIN': JOB_TYPES.EMAIL.SEND_MAGIC_LINK,
  'MAGIC_LINK_ACTION': JOB_TYPES.EMAIL.SEND_MAGIC_LINK,
  'PHONE_VERIFICATION': JOB_TYPES.NOTIFICATIONS.SMS_VERIFICATION,
} as const;

// Options par défaut pour les jobs
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: {
    age: 24 * 3600, // 24 heures
    count: 100,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // 7 jours
    count: 50,
  },
} as const;
