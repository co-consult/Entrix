"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BULLMQ_CONFIG_NAMESPACE = exports.BULLMQ_SERVICE = exports.DEFAULT_JOB_OPTIONS = exports.JOB_PRIORITIES = exports.JOB_TYPES = exports.QUEUE_NAMES = void 0;
exports.QUEUE_NAMES = {
    EMAIL: 'email',
    NOTIFICATIONS: 'notifications',
    PAYMENTS: 'payments',
    REPORTS: 'reports',
};
exports.JOB_TYPES = {
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
};
exports.JOB_PRIORITIES = {
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4,
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
exports.BULLMQ_SERVICE = 'BULLMQ_SERVICE';
exports.BULLMQ_CONFIG_NAMESPACE = 'bullmq';
//# sourceMappingURL=bullmq.constants.js.map