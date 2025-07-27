"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_JOB_OPTIONS = exports.TOKEN_TO_JOB_TYPE = exports.getBullMQOptions = exports.BULLMQ_CONFIG_NAMESPACE = exports.BULLMQ_SERVICE = exports.JOB_OPTIONS = exports.JOB_PRIORITIES = exports.JOB_TYPES = exports.QUEUE_NAMES = void 0;
exports.QUEUE_NAMES = {
    EMAIL: 'email',
    NOTIFICATIONS: 'notifications',
    PAYMENTS: 'payments',
    REPORTS: 'reports',
    MAINTENANCE: 'maintenance',
    ALERTS: 'alerts',
};
exports.JOB_TYPES = {
    EMAIL: {
        SEND_WELCOME: 'send-welcome',
        SEND_VERIFICATION: 'send-verification',
        SEND_PASSWORD_RESET: 'send-password-reset',
        SEND_TICKET: 'send-ticket',
        SEND_INVOICE: 'send-invoice',
        SEND_REMINDER: 'send-reminder',
        SEND_INVITATION: 'send-invitation',
        SEND_MAGIC_LINK: 'send-magic-link',
        SEND_EMAIL_CHANGE: 'send-email-change',
        SEND_ACCOUNT_ACTIVATION: 'send-account-activation',
    },
    NOTIFICATIONS: {
        PUSH_NOTIFICATION: 'push-notification',
        SMS_NOTIFICATION: 'sms-notification',
        IN_APP_NOTIFICATION: 'in-app-notification',
        SMS_VERIFICATION: 'sms-verification',
        PHONE_VERIFICATION: 'phone-verification',
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
    MAINTENANCE: {
        CLEANUP_REPORT: 'cleanup_report',
        TOKEN_CLEANUP: 'token_cleanup',
        CACHE_OPTIMIZATION: 'cache_optimization',
        HEALTH_CHECK: 'health_check',
    },
    ALERTS: {
        MAINTENANCE_ALERT: 'maintenance_alert',
        SECURITY_ALERT: 'security_alert',
        THRESHOLD_ALERT: 'threshold_alert',
        SYSTEM_ALERT: 'system_alert',
    },
};
exports.JOB_PRIORITIES = {
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4,
    BACKGROUND: 5,
};
exports.JOB_OPTIONS = {
    DEFAULT: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
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
    CRITICAL_EMAIL: {
        attempts: 5,
        priority: exports.JOB_PRIORITIES.HIGH,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            age: 7 * 24 * 3600,
            count: 200,
        },
        removeOnFail: {
            age: 30 * 24 * 3600,
            count: 100,
        },
    },
    SMS: {
        attempts: 5,
        priority: exports.JOB_PRIORITIES.HIGH,
        backoff: {
            type: 'fixed',
            delay: 30000,
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
    MAINTENANCE: {
        attempts: 2,
        priority: exports.JOB_PRIORITIES.LOW,
        backoff: {
            type: 'exponential',
            delay: 60000,
        },
        removeOnComplete: {
            age: 3 * 24 * 3600,
            count: 50,
        },
        removeOnFail: {
            age: 7 * 24 * 3600,
            count: 25,
        },
    },
    ALERTS: {
        attempts: 3,
        priority: exports.JOB_PRIORITIES.CRITICAL,
        delay: 0,
        backoff: {
            type: 'fixed',
            delay: 5000,
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
};
exports.BULLMQ_SERVICE = 'BULLMQ_SERVICE';
exports.BULLMQ_CONFIG_NAMESPACE = 'bullmq';
const getBullMQOptions = (tokenType, priority = exports.JOB_PRIORITIES.NORMAL) => {
    const optionsMap = {
        'PASSWORD_RESET': exports.JOB_OPTIONS.CRITICAL_EMAIL,
        'EMAIL_VERIFICATION': exports.JOB_OPTIONS.DEFAULT,
        'PHONE_VERIFICATION': exports.JOB_OPTIONS.SMS,
        'INVITATION_USER': exports.JOB_OPTIONS.DEFAULT,
        'MAGIC_LINK_LOGIN': exports.JOB_OPTIONS.CRITICAL_EMAIL,
        'MAINTENANCE': exports.JOB_OPTIONS.MAINTENANCE,
        'ALERT': exports.JOB_OPTIONS.ALERTS,
    };
    const baseOptions = optionsMap[tokenType] || exports.JOB_OPTIONS.DEFAULT;
    return {
        ...baseOptions,
        priority,
    };
};
exports.getBullMQOptions = getBullMQOptions;
exports.TOKEN_TO_JOB_TYPE = {
    'EMAIL_VERIFICATION': exports.JOB_TYPES.EMAIL.SEND_VERIFICATION,
    'EMAIL_CHANGE': exports.JOB_TYPES.EMAIL.SEND_EMAIL_CHANGE,
    'PASSWORD_RESET': exports.JOB_TYPES.EMAIL.SEND_PASSWORD_RESET,
    'ACCOUNT_ACTIVATION': exports.JOB_TYPES.EMAIL.SEND_ACCOUNT_ACTIVATION,
    'INVITATION_USER': exports.JOB_TYPES.EMAIL.SEND_INVITATION,
    'INVITATION_GROUP': exports.JOB_TYPES.EMAIL.SEND_INVITATION,
    'MAGIC_LINK_LOGIN': exports.JOB_TYPES.EMAIL.SEND_MAGIC_LINK,
    'MAGIC_LINK_ACTION': exports.JOB_TYPES.EMAIL.SEND_MAGIC_LINK,
    'PHONE_VERIFICATION': exports.JOB_TYPES.NOTIFICATIONS.SMS_VERIFICATION,
};
exports.DEFAULT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000,
    },
    removeOnComplete: {
        age: 24 * 3600,
        count: 100,
    },
    removeOnFail: {
        age: 7 * 24 * 3600,
        count: 50,
    },
};
//# sourceMappingURL=bullmq.constants.js.map