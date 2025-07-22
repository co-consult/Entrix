/**
 * Types et interfaces pour le module Email
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export enum EmailTemplates {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password-reset',
  TICKET_PURCHASE = 'ticket-purchase',
  TICKET_TRANSFER = 'ticket-transfer',
  EVENT_REMINDER = 'event-reminder',
  PAYMENT_RECEIPT = 'payment-receipt',
  REFUND_CONFIRMATION = 'refund-confirmation',
  ORGANIZER_WELCOME = 'organizer-welcome',
  ORGANIZER_APPROVED = 'organizer-approved',
  EVENT_PUBLISHED = 'event-published',
  SALES_REPORT = 'sales-report',
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response?: string;
}
