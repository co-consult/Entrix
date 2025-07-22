export interface EmailModuleConfig {
    from: string;
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
    defaultReplyTo?: string;
    provider: 'smtp' | 'sendgrid' | 'mailgun';
    templatesPath?: string;
}
export interface SendMailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        path: string;
        contentType?: string;
    }>;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    template?: string;
    context?: Record<string, any>;
}
