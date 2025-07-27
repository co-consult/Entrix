import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { LoggerService } from '../logger/logger.service';
import { NOTIFICATIONS_CONFIG_NAMESPACE, NOTIFICATION_CHANNELS } from './notifications.constants';
import { NotificationOptions, NotificationChannel, NotificationPriority } from './notifications.interfaces';

/**
 * Service Notifications centralisé pour l'envoi multi-canaux (email, ws, sms, push)
 * - Orchestration, priorisation, logs, gestion des erreurs
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly config;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(EmailService) private readonly emailService: EmailService,
    @Inject(LoggerService) private readonly appLogger: LoggerService,
    // Ajoutez ici d'autres services (SMS, WebSocket, Push) si besoin
  ) {
    this.config = this.configService.get(NOTIFICATIONS_CONFIG_NAMESPACE);
  }

  /**
   * Envoie une notification via le canal approprié
   */
  async sendNotification(options: NotificationOptions): Promise<void> {
    const channel: NotificationChannel = options.channel || this.config.defaultChannel;
    const priority: NotificationPriority = options.priority || 'normal';
    this.appLogger.info(
      `[Notifications] Envoi via ${channel} (priorité: ${priority})`,
      JSON.stringify(options.payload)
    );

    switch (channel) {
      case 'email':
        if (!this.config.emailEnabled) {
          this.appLogger.warn('Canal email désactivé');
          return;
        }
        await this.emailService.sendEmail({
          to: options.payload.to,
          subject: options.payload.subject || '[Entrix] Notification',
          html: options.payload.html,
          text: options.payload.message,
          attachments: options.payload.attachments,
          template: options.payload.template,
          context: options.payload.context,
        });
        break;
      case 'ws':
        if (!this.config.wsEnabled) {
          this.appLogger.warn('Canal WebSocket désactivé');
          return;
        }
        // TODO: Intégrer le gateway WebSocket ici
        this.logger.log(`[WS] Notification à ${options.payload.to}: ${options.payload.message}`);
        break;
      case 'sms':
        if (!this.config.smsEnabled) {
          this.appLogger.warn('Canal SMS désactivé');
          return;
        }
        // TODO: Intégrer le provider SMS ici
        this.logger.log(`[SMS] Notification à ${options.payload.to}: ${options.payload.message}`);
        break;
      case 'push':
        if (!this.config.pushEnabled) {
          this.appLogger.warn('Canal Push désactivé');
          return;
        }
        // TODO: Intégrer le provider Push ici
        this.logger.log(`[PUSH] Notification à ${options.payload.to}: ${options.payload.message}`);
        break;
      default:
        this.appLogger.error(`Canal de notification inconnu: ${channel}`);
        throw new Error(`Canal de notification inconnu: ${channel}`);
    }
  }
} 