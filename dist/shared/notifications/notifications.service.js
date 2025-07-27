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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const email_service_1 = require("../email/email.service");
const logger_service_1 = require("../logger/logger.service");
const notifications_constants_1 = require("./notifications.constants");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    configService;
    emailService;
    appLogger;
    logger = new common_1.Logger(NotificationsService_1.name);
    config;
    constructor(configService, emailService, appLogger) {
        this.configService = configService;
        this.emailService = emailService;
        this.appLogger = appLogger;
        this.config = this.configService.get(notifications_constants_1.NOTIFICATIONS_CONFIG_NAMESPACE);
    }
    async sendNotification(options) {
        const channel = options.channel || this.config.defaultChannel;
        const priority = options.priority || 'normal';
        this.appLogger.info(`[Notifications] Envoi via ${channel} (priorité: ${priority})`, JSON.stringify(options.payload));
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
                this.logger.log(`[WS] Notification à ${options.payload.to}: ${options.payload.message}`);
                break;
            case 'sms':
                if (!this.config.smsEnabled) {
                    this.appLogger.warn('Canal SMS désactivé');
                    return;
                }
                this.logger.log(`[SMS] Notification à ${options.payload.to}: ${options.payload.message}`);
                break;
            case 'push':
                if (!this.config.pushEnabled) {
                    this.appLogger.warn('Canal Push désactivé');
                    return;
                }
                this.logger.log(`[PUSH] Notification à ${options.payload.to}: ${options.payload.message}`);
                break;
            default:
                this.appLogger.error(`Canal de notification inconnu: ${channel}`);
                throw new Error(`Canal de notification inconnu: ${channel}`);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __param(1, (0, common_1.Inject)(email_service_1.EmailService)),
    __param(2, (0, common_1.Inject)(logger_service_1.LoggerService)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map