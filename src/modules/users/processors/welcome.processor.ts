// src/modules/users/processors/welcome.processor.ts

import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { WelcomeJobData, OnboardingCompleteJobData } from '../queues/welcome.queue';

@Injectable()
export class WelcomeProcessor {
  private readonly logger: LoggerService;

  constructor(
    private readonly emailService: EmailService,
    private readonly prismaService: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('WelcomeProcessor');
  }

  /**
   * Traite l'envoi d'email de bienvenue
   */
  async processWelcomeEmail(job: Job<WelcomeJobData>): Promise<void> {
    const { userId, email, firstName, lastName, registrationSource, metadata } = job.data;

    try {
      this.logger.info('Processing welcome email job', JSON.stringify({
        userId,
        email,
        jobId: job.id,
      }));

      // Vérifier que l'utilisateur existe encore selon le schema Prisma exact
      const user = await this.prismaService.users.findUnique({
        where: { id: userId },
        include: { 
          user_profiles: true // Relation correcte : user_profiles[] dans le schema
        },
      });

      if (!user) {
        this.logger.warn('User not found for welcome email', JSON.stringify({ userId }));
        return;
      }

      if (!user.is_active) { // Champ correct selon le schema
        this.logger.warn('User is inactive, skipping welcome email', JSON.stringify({ userId }));
        return;
      }

      // Préparer les données pour le template
      const templateData = {
        firstName: user.first_name, // Champs corrects selon le schema
        lastName: user.last_name,
        email: user.email,
        userId,
        registrationSource: registrationSource || 'web',
        activationUrl: `${process.env.FRONTEND_URL}/activate/${userId}`,
        profileUrl: `${process.env.FRONTEND_URL}/profile`,
        exploreUrl: `${process.env.FRONTEND_URL}/events`,
        supportUrl: `${process.env.FRONTEND_URL}/support`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe/${userId}`,
        metadata: metadata || {},
        hasProfile: !!user.user_profiles,
        isEmailVerified: !!user.email_verified, // DateTime? dans le schema
        isPhoneVerified: !!user.phone_verified, // DateTime? dans le schema
      };

      // Envoyer l'email de bienvenue avec la méthode correcte du EmailService
      const emailResult = await this.emailService.sendEmail({
        to: email,
        subject: `Bienvenue sur Entrix, ${user.first_name} ! 🎉`,
        template: 'welcome',
        context: templateData,
      });

      this.logger.info('Welcome email sent successfully', JSON.stringify({
        userId,
        email,
        messageId: emailResult.messageId,
        jobId: job.id,
      }));

      // Logger l'événement business avec la méthode correcte
      this.logger.logBusinessEvent('WELCOME_EMAIL_SENT', {
        userId,
        email,
        registrationSource,
        messageId: emailResult.messageId,
      }, userId);

    } catch (error) {
      this.logger.logErrorEvent(error, 'WelcomeProcessor.processWelcomeEmail', JSON.stringify({
        userId,
        email,
        jobId: job.id,
      }));
      throw error;
    }
  }

  /**
   * Traite l'envoi d'email d'onboarding terminé
   */
  async processOnboardingCompleteEmail(job: Job<OnboardingCompleteJobData>): Promise<void> {
    const { 
      userId, 
      email, 
      firstName, 
      completionPercentage, 
      incentiveApplied, 
      conversionData 
    } = job.data;

    try {
      this.logger.info('Processing onboarding complete email job', JSON.stringify({
        userId,
        email,
        completionPercentage,
        jobId: job.id,
      }));

      // Vérifier que l'utilisateur existe avec les relations correctes selon le schema
      const user = await this.prismaService.users.findUnique({
        where: { id: userId },
        include: { 
          user_profiles: true, // Relation correcte : user_profiles[]
          user_groups_user_groups_user_idTousers: { // Nom exact de la relation dans le schema
            include: {
              groups: true,
            },
          },
        },
      });

      if (!user || !user.is_active) {
        this.logger.warn('User not found or inactive for onboarding email', JSON.stringify({ 
          userId,
          exists: !!user,
          isActive: user?.is_active 
        }));
        return;
      }

      // Calculer les statistiques utilisateur
      const userStats = {
        groupsJoined: user.user_groups_user_groups_user_idTousers?.length || 0,
        profileCompletion: completionPercentage,
        hasProfile: !!user.user_profiles,
        emailVerified: !!user.email_verified, // DateTime? → boolean
        phoneVerified: !!user.phone_verified, // DateTime? → boolean
      };

      // Générer les prochaines étapes personnalisées
      const nextSteps = this.generateNextSteps(user, completionPercentage);

      // Préparer les données pour le template
      const templateData = {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        userId,
        completionPercentage,
        incentiveApplied: incentiveApplied || null,
        conversionData: conversionData || null,
        userStats,
        nextSteps,
        profileCompletionUrl: `${process.env.FRONTEND_URL}/profile/complete`,
        exploreEventsUrl: `${process.env.FRONTEND_URL}/events`,
        groupsUrl: `${process.env.FRONTEND_URL}/groups`,
        supportUrl: `${process.env.FRONTEND_URL}/support`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe/${userId}`,
      };

      // Déterminer le sujet selon le pourcentage de complétion
      let emailSubject = `Félicitations ${user.first_name} ! Votre profil Entrix est prêt 🎉`;
      if (completionPercentage >= 80) {
        emailSubject = `Parfait ${user.first_name} ! Votre profil Entrix est complet 🌟`;
      } else if (completionPercentage >= 50) {
        emailSubject = `Bien joué ${user.first_name} ! Encore quelques étapes... 🚀`;
      }

      // Envoyer l'email d'onboarding terminé
      const emailResult = await this.emailService.sendEmail({
        to: email,
        subject: emailSubject,
        template: 'onboarding-complete',
        context: templateData,
      });

      this.logger.info('Onboarding complete email sent successfully', JSON.stringify({
        userId,
        email,
        completionPercentage,
        messageId: emailResult.messageId,
        jobId: job.id,
      }));

      // Logger l'événement business
      this.logger.logBusinessEvent('ONBOARDING_COMPLETE_EMAIL_SENT', {
        userId,
        email,
        completionPercentage,
        incentiveApplied: !!incentiveApplied,
        fromConversion: !!conversionData,
        messageId: emailResult.messageId,
      }, userId);

    } catch (error) {
      this.logger.logErrorEvent(error, 'WelcomeProcessor.processOnboardingCompleteEmail', JSON.stringify({
        userId,
        email,
        completionPercentage,
        jobId: job.id,
      }));
      throw error;
    }
  }

  /**
   * Traite l'envoi d'email de rappel d'activation
   */
  async processActivationReminder(job: Job): Promise<void> {
    const { userId, email, firstName, reminderNumber } = job.data;

    try {
      this.logger.info('Processing activation reminder job', JSON.stringify({
        userId,
        email,
        reminderNumber,
        jobId: job.id,
      }));

      // Vérifier que l'utilisateur existe et n'est pas encore vérifié
      const user = await this.prismaService.users.findUnique({
        where: { id: userId },
      });

      if (!user || !user.is_active) {
        this.logger.warn('User not found or inactive for activation reminder', JSON.stringify({ 
          userId,
          exists: !!user,
          isActive: user?.is_active 
        }));
        return;
      }

      // Si l'email est déjà vérifié, pas besoin d'envoyer le rappel
      if (user.email_verified) { // DateTime? - si défini, alors vérifié
        this.logger.info('User email already verified, skipping reminder', JSON.stringify({ userId }));
        return;
      }

      // Générer un token d'activation (simple UUID pour cet exemple)
      const activationToken = user.id; // Utiliser l'ID utilisateur comme token pour simplifier

      const templateData = {
        firstName: user.first_name,
        email: user.email,
        userId,
        reminderNumber,
        activationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${activationToken}`,
        supportUrl: `${process.env.FRONTEND_URL}/support`,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      };

      // Choisir le sujet selon le numéro de rappel
      const subjects = {
        1: `${user.first_name}, n'oubliez pas de vérifier votre email 📧`,
        2: `Dernière chance de vérifier votre email, ${user.first_name} ⏰`,
        3: `${user.first_name}, votre compte Entrix vous attend toujours 💌`,
      };

      const emailResult = await this.emailService.sendEmail({
        to: email,
        subject: subjects[reminderNumber as keyof typeof subjects] || subjects[1],
        template: 'email-verification-reminder',
        context: templateData,
      });

      this.logger.info('Activation reminder sent successfully', JSON.stringify({
        userId,
        email,
        reminderNumber,
        messageId: emailResult.messageId,
        jobId: job.id,
      }));

      // Logger l'événement business
      this.logger.logBusinessEvent('EMAIL_VERIFICATION_REMINDER_SENT', {
        userId,
        email,
        reminderNumber,
        messageId: emailResult.messageId,
      }, userId);

    } catch (error) {
      this.logger.logErrorEvent(error, 'WelcomeProcessor.processActivationReminder', JSON.stringify({
        userId,
        reminderNumber,
        jobId: job.id,
      }));
      throw error;
    }
  }

  /**
   * Génère les prochaines étapes personnalisées selon le profil utilisateur
   */
  private generateNextSteps(user: any, completionPercentage: number): string[] {
    const steps: string[] = [];

    // Si le profil n'est pas complet
    if (completionPercentage < 80) {
      steps.push('Complétez votre profil pour des recommandations personnalisées');
    }

    // Si l'utilisateur n'a pas rejoint de groupe
    if (!user.user_groups_user_groups_user_idTousers || user.user_groups_user_groups_user_idTousers.length === 0) {
      steps.push('Rejoignez un groupe pour acheter vos billets en équipe');
    }

    // Si l'email n'est pas vérifié
    if (!user.email_verified) {
      steps.push('Vérifiez votre adresse email pour sécuriser votre compte');
    }

    // Si le téléphone n'est pas vérifié
    if (!user.phone_verified && user.phone) {
      steps.push('Vérifiez votre numéro de téléphone pour recevoir des notifications SMS');
    }

    // Si l'utilisateur n'a pas de profil complet
    if (!user.user_profiles) {
      steps.push('Ajoutez vos informations de profil pour une expérience personnalisée');
    }

    // Étapes générales
    steps.push('Explorez les événements à venir dans votre région');
    steps.push('Activez les notifications pour ne rien manquer');

    return steps.slice(0, 5); // Limiter à 5 étapes maximum
  }
}