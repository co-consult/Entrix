export declare const QUEUE_NAMES: {
    readonly EMAIL: "email";
    readonly NOTIFICATIONS: "notifications";
    readonly PAYMENTS: "payments";
    readonly REPORTS: "reports";
};
export declare const JOB_TYPES: {
    readonly EMAIL: {
        readonly SEND_WELCOME: "send-welcome";
        readonly SEND_VERIFICATION: "send-verification";
        readonly SEND_PASSWORD_RESET: "send-password-reset";
        readonly SEND_TICKET: "send-ticket";
        readonly SEND_INVOICE: "send-invoice";
        readonly SEND_REMINDER: "send-reminder";
    };
    readonly NOTIFICATIONS: {
        readonly PUSH_NOTIFICATION: "push-notification";
        readonly SMS_NOTIFICATION: "sms-notification";
        readonly IN_APP_NOTIFICATION: "in-app-notification";
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
};
export declare const JOB_PRIORITIES: {
    readonly CRITICAL: 1;
    readonly HIGH: 2;
    readonly NORMAL: 3;
    readonly LOW: 4;
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
export declare const BULLMQ_SERVICE = "BULLMQ_SERVICE";
export declare const BULLMQ_CONFIG_NAMESPACE = "bullmq";
