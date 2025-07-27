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
exports.EmailProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const email_service_1 = require("./email.service");
const bullmq_constants_1 = require("../bullmq/bullmq.constants");
let EmailProcessor = class EmailProcessor {
    emailService;
    constructor(emailService) {
        this.emailService = emailService;
    }
    async handleWelcomeEmail(job) {
        const { email, firstName } = job.data;
        try {
            await this.emailService.sendEmail({
                to: email,
                subject: 'Bienvenue sur Entrix',
                template: 'welcome',
                context: { firstName },
            });
            return { success: true };
        }
        catch (error) {
            console.error(`Failed to send welcome email to ${email}:`, error);
            throw error;
        }
    }
    async handleVerificationEmail(job) {
        const { email, token } = job.data;
        try {
            await this.emailService.sendEmail({
                to: email,
                subject: 'Vérification de votre email',
                template: 'verification',
                context: { token },
            });
            return { success: true };
        }
        catch (error) {
            console.error(`Failed to send verification email to ${email}:`, error);
            throw error;
        }
    }
    async handlePasswordResetEmail(job) {
        const { email, token } = job.data;
        try {
            await this.emailService.sendEmail({
                to: email,
                subject: 'Réinitialisation de votre mot de passe',
                template: 'password-reset',
                context: { token },
            });
            return { success: true };
        }
        catch (error) {
            console.error(`Failed to send password reset email to ${email}:`, error);
            throw error;
        }
    }
    async handleTicketEmail(job) {
        const { orderId, email } = job.data;
        try {
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
        }
        catch (error) {
            console.error(`Failed to send ticket email for order ${orderId}:`, error);
            throw error;
        }
    }
    async handleInvoiceEmail(job) {
        const { orderId, email } = job.data;
        try {
            console.log(`Sending invoice for order ${orderId} to ${email}`);
            return { success: true };
        }
        catch (error) {
            console.error(`Failed to send invoice for order ${orderId}:`, error);
            throw error;
        }
    }
    async handleReminderEmail(job) {
        const { eventId, userId, email } = job.data;
        try {
            console.log(`Sending event reminder for ${eventId} to ${email}`);
            return { success: true };
        }
        catch (error) {
            console.error(`Failed to send reminder for event ${eventId}:`, error);
            throw error;
        }
    }
    async onFailed(job, error) {
        console.error(`Job ${job.id} of type ${job.name} failed:`, error);
        if (job.attemptsMade >= (job.opts.attempts || 3)) {
            console.error(`Job ${job.id} failed after all attempts. Manual intervention required.`);
        }
    }
    async onCompleted(job, result) {
        console.log(`Email job ${job.id} completed successfully:`, result.messageId);
    }
};
exports.EmailProcessor = EmailProcessor;
__decorate([
    (0, bull_1.Process)(bullmq_constants_1.JOB_TYPES.EMAIL.SEND_WELCOME),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleWelcomeEmail", null);
__decorate([
    (0, bull_1.Process)(bullmq_constants_1.JOB_TYPES.EMAIL.SEND_VERIFICATION),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleVerificationEmail", null);
__decorate([
    (0, bull_1.Process)(bullmq_constants_1.JOB_TYPES.EMAIL.SEND_PASSWORD_RESET),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handlePasswordResetEmail", null);
__decorate([
    (0, bull_1.Process)(bullmq_constants_1.JOB_TYPES.EMAIL.SEND_TICKET),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleTicketEmail", null);
__decorate([
    (0, bull_1.Process)(bullmq_constants_1.JOB_TYPES.EMAIL.SEND_INVOICE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleInvoiceEmail", null);
__decorate([
    (0, bull_1.Process)(bullmq_constants_1.JOB_TYPES.EMAIL.SEND_REMINDER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleReminderEmail", null);
exports.EmailProcessor = EmailProcessor = __decorate([
    (0, bull_1.Processor)(bullmq_constants_1.QUEUE_NAMES.EMAIL),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map