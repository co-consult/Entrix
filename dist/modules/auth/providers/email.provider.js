"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const mfa_constants_1 = require("../constants/mfa.constants");
const email_service_1 = require("../../../shared/email/email.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let EmailProvider = class EmailProvider {
    config;
    emailService;
    logger;
    constructor(config, emailService, loggerService) {
        this.config = config;
        this.emailService = emailService;
        this.logger = loggerService.createChildLogger('EmailProvider');
    }
    async sendEmail(email, subject, content) {
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
        }
        catch (error) {
            this.logger.endOperation('sendEmail', operationId, false);
            this.logger.error('Failed to send email', error.stack, 'EmailProvider.sendEmail', JSON.stringify({
                email: this.maskEmail(email),
                error: error.message
            }));
            throw error;
        }
    }
    generateCode() {
        return crypto.randomInt(100000, 999999).toString();
    }
    generateEmailContent(code, userFirstName) {
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
            
            <p><strong>Ce code expire dans ${mfa_constants_1.MFA_CONSTANTS.PROVIDERS.EMAIL_OTP.validity_duration / 60} minutes.</strong></p>
            
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
    generateEmailSubject() {
        return 'Entrix - Votre code de vérification';
    }
    maskEmail(email) {
        const [local, domain] = email.split('@');
        const maskedLocal = local.length > 2
            ? local[0] + '***' + local.slice(-1)
            : local;
        return `${maskedLocal}@${domain}`;
    }
    extractCodeFromContent(content) {
        const match = content.match(/\b\d{6}\b/);
        return match ? match[0] : '';
    }
    isEnabled() {
        return this.config.get('MFA_EMAIL_ENABLED', true);
    }
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};
exports.EmailProvider = EmailProvider;
exports.EmailProvider = EmailProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], EmailProvider);
//# sourceMappingURL=email.provider.js.map