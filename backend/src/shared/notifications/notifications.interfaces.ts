/**
 * Type des canaux de notification supportés
 */
export type NotificationChannel = 'email' | 'ws' | 'sms' | 'push';

/**
 * Type des niveaux de priorité supportés
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Payload générique d'une notification
 */
export interface NotificationPayload {
  to: string | string[];
  subject?: string;
  message: string;
  html?: string;
  data?: Record<string, any>;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{ filename: string; path: string; contentType?: string }>;
}

/**
 * Options d'envoi de notification
 */
export interface NotificationOptions {
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  payload: NotificationPayload;
  meta?: Record<string, any>;
} 