export declare const QUEUE_NAMES: {
    readonly EMAIL: "email";
    readonly NOTIFICATIONS: "notifications";
    readonly PAYMENTS: "payments";
    readonly REPORTS: "reports";
    readonly MAINTENANCE: "maintenance";
    readonly ALERTS: "alerts";
};
export declare const JOB_TYPES: {
    readonly EMAIL: {
        readonly SEND_WELCOME: "send-welcome";
        readonly SEND_VERIFICATION: "send-verification";
        readonly SEND_PASSWORD_RESET: "send-password-reset";
        readonly SEND_TICKET: "send-ticket";
        readonly SEND_INVOICE: "send-invoice";
        readonly SEND_REMINDER: "send-reminder";
        readonly SEND_INVITATION: "send-invitation";
        readonly SEND_MAGIC_LINK: "send-magic-link";
        readonly SEND_EMAIL_CHANGE: "send-email-change";
        readonly SEND_ACCOUNT_ACTIVATION: "send-account-activation";
    };
    readonly NOTIFICATIONS: {
        readonly PUSH_NOTIFICATION: "push-notification";
        readonly SMS_NOTIFICATION: "sms-notification";
        readonly IN_APP_NOTIFICATION: "in-app-notification";
        readonly SMS_VERIFICATION: "sms-verification";
        readonly PHONE_VERIFICATION: "phone-verification";
    };
    readonly PAYMENTS: {
        readonly PROCESS_PAYMENT: "process-payment";
        readonly PROCESS_REFUND: "process-refund";
        readonly CALCULATE_COMMISSION: "calculate-commission";
        readonly GENERATE_PAYOUT: "generate-payout";
    };
    readonly REPORTS: {
        readonly GENERATE_SALES_REPORT: "generate-sales-report";
        readonly GENERATE_ATTENDANCE_REPORT: "generate-attendance-report";
        readonly GENERATE_FINANCIAL_REPORT: "generate-financial-report";
        readonly EXPORT_DATA: "export-data";
    };
    readonly MAINTENANCE: {
        readonly CLEANUP_REPORT: "cleanup_report";
        readonly TOKEN_CLEANUP: "token_cleanup";
        readonly CACHE_OPTIMIZATION: "cache_optimization";
        readonly HEALTH_CHECK: "health_check";
    };
    readonly ALERTS: {
        readonly MAINTENANCE_ALERT: "maintenance_alert";
        readonly SECURITY_ALERT: "security_alert";
        readonly THRESHOLD_ALERT: "threshold_alert";
        readonly SYSTEM_ALERT: "system_alert";
    };
};
export declare const JOB_PRIORITIES: {
    readonly CRITICAL: 1;
    readonly HIGH: 2;
    readonly NORMAL: 3;
    readonly LOW: 4;
    readonly BACKGROUND: 5;
};
export declare const JOB_OPTIONS: {
    readonly DEFAULT: {
        readonly attempts: 3;
        readonly backoff: {
            readonly type: "exponential";
            readonly delay: 2000;
        };
        readonly removeOnComplete: {
            readonly age: number;
            readonly count: 100;
        };
        readonly removeOnFail: {
            readonly age: number;
            readonly count: 50;
        };
    };
    readonly CRITICAL_EMAIL: {
        readonly attempts: 5;
        readonly priority: 2;
        readonly backoff: {
            readonly type: "exponential";
            readonly delay: 1000;
        };
        readonly removeOnComplete: {
            readonly age: number;
            readonly count: 200;
        };
        readonly removeOnFail: {
            readonly age: number;
            readonly count: 100;
        };
    };
    readonly SMS: {
        readonly attempts: 5;
        readonly priority: 2;
        readonly backoff: {
            readonly type: "fixed";
            readonly delay: 30000;
        };
        readonly removeOnComplete: {
            readonly age: number;
            readonly count: 50;
        };
        readonly removeOnFail: {
            readonly age: number;
            readonly count: 25;
        };
    };
    readonly MAINTENANCE: {
        readonly attempts: 2;
        readonly priority: 4;
        readonly backoff: {
            readonly type: "exponential";
            readonly delay: 60000;
        };
        readonly removeOnComplete: {
            readonly age: number;
            readonly count: 50;
        };
        readonly removeOnFail: {
            readonly age: number;
            readonly count: 25;
        };
    };
    readonly ALERTS: {
        readonly attempts: 3;
        readonly priority: 1;
        readonly delay: 0;
        readonly backoff: {
            readonly type: "fixed";
            readonly delay: 5000;
        };
        readonly removeOnComplete: {
            readonly age: number;
            readonly count: 100;
        };
        readonly removeOnFail: {
            readonly age: number;
            readonly count: 50;
        };
    };
};
export declare const BULLMQ_SERVICE = "BULLMQ_SERVICE";
export declare const BULLMQ_CONFIG_NAMESPACE = "bullmq";
export declare const getBullMQOptions: (tokenType: string, priority?: number) => any;
export declare const TOKEN_TO_JOB_TYPE: {
    readonly EMAIL_VERIFICATION: "send-verification";
    readonly EMAIL_CHANGE: "send-email-change";
    readonly PASSWORD_RESET: "send-password-reset";
    readonly ACCOUNT_ACTIVATION: "send-account-activation";
    readonly INVITATION_USER: "send-invitation";
    readonly INVITATION_GROUP: "send-invitation";
    readonly MAGIC_LINK_LOGIN: "send-magic-link";
    readonly MAGIC_LINK_ACTION: "send-magic-link";
    readonly PHONE_VERIFICATION: "sms-verification";
};
export declare const DEFAULT_JOB_OPTIONS: {
    readonly attempts: 3;
    readonly backoff: {
        readonly type: "exponential";
        readonly delay: 2000;
    };
    readonly removeOnComplete: {
        readonly age: number;
        readonly count: 100;
    };
    readonly removeOnFail: {
        readonly age: number;
        readonly count: 50;
    };
};
