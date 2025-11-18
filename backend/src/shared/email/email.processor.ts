import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from './email.service';
import { QUEUE_NAMES, JOB_TYPES } from '../bullmq/bullmq.constants';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Processeur pour traiter les jobs d'envoi d'emails
 */
@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor {
  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

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
      }, true); // Use blocking mode
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
      }, true); // Use blocking mode
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
  async handlePasswordResetEmail(job: Job<{ 
    email: string; 
    token: string; 
    type: string; 
    verification_url: string; 
    expires_at: Date;
    user_id?: string;
    ip_address?: string;
    user_agent?: string;
    device_fingerprint?: string;
  }>) {
    console.log('🚀 EMAIL PROCESSOR: handlePasswordResetEmail called');
    console.log('🚀 EMAIL PROCESSOR: Job data:', JSON.stringify(job.data, null, 2));
    
    const { email, token, verification_url, expires_at, user_id, ip_address, user_agent, device_fingerprint } = job.data;
    try {
      // Fetch user data for personalization
      let userData = null;
      if (user_id) {
        userData = await this.prisma.users.findUnique({
          where: { id: user_id },
          select: {
            first_name: true,
            last_name: true,
            email: true,
            last_login: true,
          }
        });
      }

      // Calculate expiry duration
      const now = new Date();
      const expiryTime = new Date(expires_at);
      const diffMinutes = Math.ceil((expiryTime.getTime() - now.getTime()) / (1000 * 60));
      const expiryDuration = diffMinutes > 60 ? `${Math.ceil(diffMinutes / 60)} heure(s)` : `${diffMinutes} minute(s)`;

      // Extract device information from user agent
      const deviceInfo = this.extractDeviceInfo(user_agent);
      
      // Get location from IP (simplified - in production you might use a geolocation service)
      const location = this.getLocationFromIP(ip_address);

      // Build environment-based URLs from FRONTEND_URL
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
      const resetPasswordUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

      console.log('📧 EMAIL PROCESSOR: Sending password reset email to:', email);
      console.log('📧 EMAIL PROCESSOR: Reset URL:', resetPasswordUrl);
      console.log('📧 EMAIL PROCESSOR: User data:', userData);
      console.log('📧 EMAIL PROCESSOR: About to call emailService.sendEmail');
      
      const emailResult = await this.emailService.sendEmail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe - Entrix',
        template: 'password-reset',
        context: { 
          token,
          resetLink: resetPasswordUrl,
          verificationCode: token,
          expiryDuration,
          requestDate: now.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          ipAddress: ip_address || 'Non disponible',
          location: location,
          deviceInfo: deviceInfo,
          firstName: userData?.first_name || 'Utilisateur',
          lastName: userData?.last_name || '',
          lastLogin: userData?.last_login ? 
            new Date(userData.last_login).toLocaleDateString('fr-FR') : 
            'Première connexion',
          supportUrl: `${frontendUrl}/support`,
          platformUrl: frontendUrl,
          securityTips: [
            'Utilisez un mot de passe unique et fort',
            'Activez l\'authentification à deux facteurs si disponible',
            'Ne partagez jamais vos identifiants',
            'Déconnectez-vous après chaque session'
          ]
        },
      }, true); // Use blocking mode to ensure email is sent
      
      console.log('📧 Email result:', emailResult);
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
        subject: 'Vos billets pour l\'événement',
        template: 'ticket',
        context: orderDetails,
      }, true); // Use blocking mode
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

  /**
   * Extrait les informations de l'appareil depuis le User-Agent
   */
  private extractDeviceInfo(userAgent?: string): string {
    if (!userAgent) return 'Appareil inconnu';

    const ua = userAgent.toLowerCase();
    
    // Détecter le navigateur
    let browser = 'Navigateur inconnu';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    // Détecter le système d'exploitation
    let os = 'Système inconnu';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    // Détecter si c'est un appareil mobile
    const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad');
    const deviceType = isMobile ? 'Mobile' : 'Desktop';

    return `${browser} sur ${os} (${deviceType})`;
  }

  /**
   * Obtient la localisation approximative depuis l'adresse IP
   */
  private getLocationFromIP(ipAddress?: string): string {
    if (!ipAddress) return 'Localisation non disponible';

    // IPs locales
    if (ipAddress.startsWith('127.') || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return 'Réseau local';
    }

    // IPv6 localhost
    if (ipAddress === '::1' || ipAddress === 'localhost') {
      return 'Environnement de test';
    }

    // IPv6 mapped IPv4 (Docker internal)
    if (ipAddress.startsWith('::ffff:192.168.') || ipAddress.startsWith('::ffff:10.')) {
      return 'Réseau local (Docker)';
    }

    // IPv6 mapped IPv4 (Docker internal)
    if (ipAddress.startsWith('::ffff:172.')) {
      return 'Réseau local (Docker)';
    }

    // Pour une vraie implémentation, vous pourriez utiliser un service comme:
    // - ipapi.co
    // - ipinfo.io
    // - MaxMind GeoIP
    
    // Pour l'instant, on retourne une indication plus informative
    return `IP externe: ${ipAddress}`;
  }
}
