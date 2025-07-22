/**
 * Interface de configuration Email chargée via @nestjs/config
 */
export interface EmailModuleConfig {
  /** Adresse d'expédition par défaut */
  from: string;
  /** Hôte SMTP ou API */
  host: string;
  /** Port SMTP */
  port: number;
  /** Utilisateur SMTP/API */
  user: string;
  /** Mot de passe SMTP/API */
  pass: string;
  /** Connexion sécurisée (TLS/SSL) */
  secure: boolean;
  /** Adresse reply-to par défaut (optionnel) */
  defaultReplyTo?: string;
  /** Provider (smtp, sendgrid, mailgun) */
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  /** Chemin des templates d'email (optionnel) */
  templatesPath?: string;
}

/**
 * Interface d'options d'envoi d'email
 */
export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; path: string; contentType?: string }>;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  template?: string;
  context?: Record<string, any>;
} 