// src/modules/auth/providers/email.provider.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { IEmailProvider } from '../interfaces/mfa.interface';
import { MFA_CONSTANTS } from '../constants/mfa.constants';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';

/**
 * Provider Email OTP Entrix V3.0
 * Gestion des codes par email
 */
@Injectable()
export class EmailProvider implements IEmailProvider {
  private readonly logger: LoggerService;

  constructor(
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('EmailProvider');
  }

  /**
   * Envoie un email avec code OTP
   */
  async sendEmail(email: string, subject: string, content: string): Promise<boolean> {
    const operationId = this.logger.startOperation('sendEmail', { 
      email: this.maskEmail(email) 
    });

    try {
      const result = await this.emailService.sendEmail({
        to: email,
        subject,
        template: 'mfa-code',
        context: {
            code: this.extractCodeFromContent(content),
            expirationMinutes: 10
        }
        }, true);

      const success = result.success;

      this.logger.endOperation('sendEmail', operationId, success);
      return success;

    } catch (error) {
      this.logger.endOperation('sendEmail', operationId, false);
      this.logger.error('Failed to send email', error.stack, 'EmailProvider.sendEmail', JSON.stringify({
        email: this.maskEmail(email),
        error: error.message
      }));
      throw error;
    }
  }

  /**
   * Génère un code OTP à 6 chiffres
   */
  generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Génère le contenu HTML de l'email MFA
   */
  generateEmailContent(code: string, userFirstName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Code de vérification Entrix</title>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f7fafc; }
          .code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1a365d; 
            text-align: center; 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            letter-spacing: 8px;
            margin: 20px 0;
          }
          .warning { 
            background: #fed7d7; 
            color: #9b2c2c; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 20px 0; 
          }
          .footer { color: #718096; font-size: 12px; text-align: center; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Entrix</h1>
            <p>Code de vérification</p>
          </div>
          
          <div class="content">
            ${userFirstName ? `<p>Bonjour ${userFirstName},</p>` : '<p>Bonjour,</p>'}
            
            <p>Votre code de vérification pour accéder à votre compte Entrix :</p>
            
            <div class="code">${code}</div>
            
            <p><strong>Ce code expire dans ${MFA_CONSTANTS.PROVIDERS.EMAIL_OTP.validity_duration / 60} minutes.</strong></p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong><br>
              • Ne partagez jamais ce code avec qui que ce soit<br>
              • Entrix ne vous demandera jamais ce code par téléphone<br>
              • Si vous n'avez pas demandé ce code, ignorez cet email
            </div>
            
            <p>Si vous avez des questions, contactez notre support à <a href="mailto:support@entrix.tn">support@entrix.tn</a></p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Entrix. Tous droits réservés.</p>
            <p>Cet email a été envoyé depuis une adresse non surveillée. Ne répondez pas à cet email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Génère le sujet de l'email
   */
  generateEmailSubject(): string {
    return 'Entrix - Votre code de vérification';
  }

  /**
   * Masque un email pour les logs
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local[0] + '***' + local.slice(-1)
      : local;
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Extrait le code du contenu (pour template)
   */
  private extractCodeFromContent(content: string): string {
    const match = content.match(/\b\d{6}\b/);
    return match ? match[0] : '';
  }

  /**
   * Vérifie si l'envoi email est activé
   */
  isEnabled(): boolean {
    return this.config.get<boolean>('MFA_EMAIL_ENABLED', true);
  }

  /**
   * Valide le format email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}