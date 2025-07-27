"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeProcessor = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("../../../shared/email/email.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
let WelcomeProcessor = class WelcomeProcessor {
    emailService;
    prismaService;
    logger;
    constructor(emailService, prismaService, loggerService) {
        this.emailService = emailService;
        this.prismaService = prismaService;
        this.logger = loggerService.createChildLogger('WelcomeProcessor');
    }
    async processWelcomeEmail(job) {
        const { userId, email, firstName, lastName, registrationSource, metadata } = job.data;
        try {
            this.logger.info('Processing welcome email job', JSON.stringify({
                userId,
                email,
                jobId: job.id,
            }));
            const user = await this.prismaService.users.findUnique({
                where: { id: userId },
                include: {
                    user_profiles: true
                },
            });
            if (!user) {
                this.logger.warn('User not found for welcome email', JSON.stringify({ userId }));
                return;
            }
            if (!user.is_active) {
                this.logger.warn('User is inactive, skipping welcome email', JSON.stringify({ userId }));
                return;
            }
            const templateData = {
                firstName: user.first_name,
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
                isEmailVerified: !!user.email_verified,
                isPhoneVerified: !!user.phone_verified,
            };
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
            this.logger.logBusinessEvent('WELCOME_EMAIL_SENT', {
                userId,
                email,
                registrationSource,
                messageId: emailResult.messageId,
            }, userId);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'WelcomeProcessor.processWelcomeEmail', JSON.stringify({
                userId,
                email,
                jobId: job.id,
            }));
            throw error;
        }
    }
    async processOnboardingCompleteEmail(job) {
        const { userId, email, firstName, completionPercentage, incentiveApplied, conversionData } = job.data;
        try {
            this.logger.info('Processing onboarding complete email job', JSON.stringify({
                userId,
                email,
                completionPercentage,
                jobId: job.id,
            }));
            const user = await this.prismaService.users.findUnique({
                where: { id: userId },
                include: {
                    user_profiles: true,
                    user_groups_user_groups_user_idTousers: {
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
            const userStats = {
                groupsJoined: user.user_groups_user_groups_user_idTousers?.length || 0,
                profileCompletion: completionPercentage,
                hasProfile: !!user.user_profiles,
                emailVerified: !!user.email_verified,
                phoneVerified: !!user.phone_verified,
            };
            const nextSteps = this.generateNextSteps(user, completionPercentage);
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
            let emailSubject = `Félicitations ${user.first_name} ! Votre profil Entrix est prêt 🎉`;
            if (completionPercentage >= 80) {
                emailSubject = `Parfait ${user.first_name} ! Votre profil Entrix est complet 🌟`;
            }
            else if (completionPercentage >= 50) {
                emailSubject = `Bien joué ${user.first_name} ! Encore quelques étapes... 🚀`;
            }
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
            this.logger.logBusinessEvent('ONBOARDING_COMPLETE_EMAIL_SENT', {
                userId,
                email,
                completionPercentage,
                incentiveApplied: !!incentiveApplied,
                fromConversion: !!conversionData,
                messageId: emailResult.messageId,
            }, userId);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'WelcomeProcessor.processOnboardingCompleteEmail', JSON.stringify({
                userId,
                email,
                completionPercentage,
                jobId: job.id,
            }));
            throw error;
        }
    }
    async processActivationReminder(job) {
        const { userId, email, firstName, reminderNumber } = job.data;
        try {
            this.logger.info('Processing activation reminder job', JSON.stringify({
                userId,
                email,
                reminderNumber,
                jobId: job.id,
            }));
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
            if (user.email_verified) {
                this.logger.info('User email already verified, skipping reminder', JSON.stringify({ userId }));
                return;
            }
            const activationToken = user.id;
            const templateData = {
                firstName: user.first_name,
                email: user.email,
                userId,
                reminderNumber,
                activationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${activationToken}`,
                supportUrl: `${process.env.FRONTEND_URL}/support`,
                loginUrl: `${process.env.FRONTEND_URL}/login`,
            };
            const subjects = {
                1: `${user.first_name}, n'oubliez pas de vérifier votre email 📧`,
                2: `Dernière chance de vérifier votre email, ${user.first_name} ⏰`,
                3: `${user.first_name}, votre compte Entrix vous attend toujours 💌`,
            };
            const emailResult = await this.emailService.sendEmail({
                to: email,
                subject: subjects[reminderNumber] || subjects[1],
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
            this.logger.logBusinessEvent('EMAIL_VERIFICATION_REMINDER_SENT', {
                userId,
                email,
                reminderNumber,
                messageId: emailResult.messageId,
            }, userId);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'WelcomeProcessor.processActivationReminder', JSON.stringify({
                userId,
                reminderNumber,
                jobId: job.id,
            }));
            throw error;
        }
    }
    generateNextSteps(user, completionPercentage) {
        const steps = [];
        if (completionPercentage < 80) {
            steps.push('Complétez votre profil pour des recommandations personnalisées');
        }
        if (!user.user_groups_user_groups_user_idTousers || user.user_groups_user_groups_user_idTousers.length === 0) {
            steps.push('Rejoignez un groupe pour acheter vos billets en équipe');
        }
        if (!user.email_verified) {
            steps.push('Vérifiez votre adresse email pour sécuriser votre compte');
        }
        if (!user.phone_verified && user.phone) {
            steps.push('Vérifiez votre numéro de téléphone pour recevoir des notifications SMS');
        }
        if (!user.user_profiles) {
            steps.push('Ajoutez vos informations de profil pour une expérience personnalisée');
        }
        steps.push('Explorez les événements à venir dans votre région');
        steps.push('Activez les notifications pour ne rien manquer');
        return steps.slice(0, 5);
    }
};
exports.WelcomeProcessor = WelcomeProcessor;
exports.WelcomeProcessor = WelcomeProcessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], WelcomeProcessor);
//# sourceMappingURL=welcome.processor.js.map