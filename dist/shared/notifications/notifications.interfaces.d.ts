export type NotificationChannel = 'email' | 'ws' | 'sms' | 'push';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';
export interface NotificationPayload {
    to: string | string[];
    subject?: string;
    message: string;
    html?: string;
    data?: Record<string, any>;
    template?: string;
    context?: Record<string, any>;
    attachments?: Array<{
        filename: string;
        path: string;
        contentType?: string;
    }>;
}
export interface NotificationOptions {
    channel?: NotificationChannel;
    priority?: NotificationPriority;
    payload: NotificationPayload;
    meta?: Record<string, any>;
}
