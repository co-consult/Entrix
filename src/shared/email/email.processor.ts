import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from './email.service';
import { QUEUE_NAMES, JOB_TYPES } from '../bullmq/bullmq.constants';

/**
 * Processeur pour traiter les jobs d'envoi d'emails
 */
@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor {
  constructor(private emailService: EmailService) {}

  /**
   * Traite l'envoi d'un email de bienvenue
   */
  @Process(JOB_TYPES.EMAIL.SEND_WELCOME)
  async handleWelcomeEmail(job: Job<{ userId: string; email: string; firstName: string }>) {
    const { email, firstName } = job.data;
    try {
      await this.emailService.sendEmail({
        to: email,
        subject: 'Bienvenue sur Entrix',
        template: 'welcome',
        context: { firstName },
      });
      return { success: true };
    } catch (error) {
      console.error(`Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Traite l'envoi d'un email de vérification
   */
  @Process(JOB_TYPES.EMAIL.SEND_VERIFICATION)
  async handleVerificationEmail(job: Job<{ userId: string; email: string; token: string }>) {
    const { email, token } = job.data;
    try {
      await this.emailService.sendEmail({
        to: email,
        subject: 'Vérification de votre email',
        template: 'verification',
        context: { token },
      });
      return { success: true };
    } catch (error) {
      console.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Traite l'envoi d'un email de réinitialisation de mot de passe
   */
  @Process(JOB_TYPES.EMAIL.SEND_PASSWORD_RESET)
  async handlePasswordResetEmail(job: Job<{ email: string; token: string }>) {
    const { email, token } = job.data;
    try {
      await this.emailService.sendEmail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        template: 'password-reset',
        context: { token },
      });
      return { success: true };
    } catch (error) {
      console.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Traite l'envoi des billets par email
   */
  @Process(JOB_TYPES.EMAIL.SEND_TICKET)
  async handleTicketEmail(job: Job<{ orderId: string; userId: string; email: string }>) {
    const { orderId, email } = job.data;
    try {
      // TODO: Récupérer les détails de la commande depuis la base
      // Pour l'instant, utilisons des données fictives
      const orderDetails = {
        orderNumber: orderId,
        eventName: 'Concert Example',
        eventDate: new Date(),
        venueName: 'Venue Example',
        tickets: [],
        totalAmount: 100,
        qrCodeUrl: 'https://example.com/qr',
      };
      await this.emailService.sendEmail({
        to: email,
        subject: 'Vos billets pour l’événement',
        template: 'ticket',
        context: orderDetails,
      });
      return { success: true };
    } catch (error) {
      console.error(`Failed to send ticket email for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Traite l'envoi d'une facture
   */
  @Process(JOB_TYPES.EMAIL.SEND_INVOICE)
  async handleInvoiceEmail(job: Job<{ orderId: string; email: string }>) {
    const { orderId, email } = job.data;
    
    try {
      // TODO: Implémenter l'envoi de facture
      console.log(`Sending invoice for order ${orderId} to ${email}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to send invoice for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Traite l'envoi d'un rappel d'événement
   */
  @Process(JOB_TYPES.EMAIL.SEND_REMINDER)
  async handleReminderEmail(job: Job<{ eventId: string; userId: string; email: string }>) {
    const { eventId, userId, email } = job.data;
    
    try {
      // TODO: Implémenter l'envoi de rappel
      console.log(`Sending event reminder for ${eventId} to ${email}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to send reminder for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Gestionnaire d'erreur global pour le processeur
   */
  async onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} of type ${job.name} failed:`, error);
    
    // TODO: Implémenter la logique de notification d'erreur
    // Par exemple, notifier l'équipe technique si un job échoue après toutes les tentatives
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      console.error(`Job ${job.id} failed after all attempts. Manual intervention required.`);
    }
  }

  /**
   * Gestionnaire de complétion
   */
  async onCompleted(job: Job, result: any) {
    console.log(`Email job ${job.id} completed successfully:`, result.messageId);
  }
}
