/**
 * Constantes pour BullMQ
 */

// Noms des queues
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  PAYMENTS: 'payments',
  REPORTS: 'reports',
} as const;

// Types de jobs par queue
export const JOB_TYPES = {
  EMAIL: {
    SEND_WELCOME: 'send-welcome',
    SEND_VERIFICATION: 'send-verification',
    SEND_PASSWORD_RESET: 'send-password-reset',
    SEND_TICKET: 'send-ticket',
    SEND_INVOICE: 'send-invoice',
    SEND_REMINDER: 'send-reminder',
  },
  NOTIFICATIONS: {
    PUSH_NOTIFICATION: 'push-notification',
    SMS_NOTIFICATION: 'sms-notification',
    IN_APP_NOTIFICATION: 'in-app-notification',
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
} as const;

// Priorités des jobs
export const JOB_PRIORITIES = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
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

/**
 * Token d'injection du service BullMQ
 */
export const BULLMQ_SERVICE = 'BULLMQ_SERVICE';

/**
 * Namespace de configuration pour @nestjs/config
 */
export const BULLMQ_CONFIG_NAMESPACE = 'bullmq';
