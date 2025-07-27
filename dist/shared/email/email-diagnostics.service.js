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
exports.EmailDiagnosticsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const dns = __importStar(require("dns"));
const util_1 = require("util");
const logger_service_1 = require("../logger/logger.service");
let EmailDiagnosticsService = class EmailDiagnosticsService {
    config;
    logger;
    resolveMx = (0, util_1.promisify)(dns.resolveMx);
    constructor(config, loggerService) {
        this.config = config;
        this.logger = loggerService.createChildLogger('EmailDiagnostics');
    }
    async runFullDiagnostic() {
        const operationId = this.logger.startOperation('runFullDiagnostic');
        try {
            const checks = {
                configuration: await this.checkConfiguration(),
                connectivity: await this.checkConnectivity(),
                authentication: await this.checkAuthentication(),
                dnsResolution: await this.checkDnsResolution(),
                testEmail: await this.checkTestEmail()
            };
            const recommendations = this.generateRecommendations(checks);
            const summary = this.generateSummary(checks);
            const status = this.determineOverallStatus(checks);
            this.logger.endOperation('runFullDiagnostic', operationId, true);
            return {
                status,
                checks,
                recommendations,
                summary
            };
        }
        catch (error) {
            this.logger.endOperation('runFullDiagnostic', operationId, false);
            throw error;
        }
    }
    async checkConfiguration() {
        const startTime = Date.now();
        try {
            const requiredSettings = [
                'SMTP_HOST',
                'SMTP_PORT',
                'SMTP_USER',
                'SMTP_PASSWORD',
                'EMAIL_FROM'
            ];
            const missingSettings = [];
            const settings = {};
            for (const setting of requiredSettings) {
                const value = this.config.get(setting);
                if (!value) {
                    missingSettings.push(setting);
                }
                else {
                    settings[setting] = setting.includes('PASSWORD') ? '***' : value;
                }
            }
            if (missingSettings.length > 0) {
                return {
                    name: 'Configuration SMTP',
                    status: 'fail',
                    message: `Paramètres manquants: ${missingSettings.join(', ')}`,
                    details: { missingSettings, currentSettings: settings },
                    duration: Date.now() - startTime
                };
            }
            const port = parseInt(this.config.get('SMTP_PORT', '587'));
            const secure = this.config.get('SMTP_SECURE', false);
            const warnings = [];
            if (port === 25) {
                warnings.push('Port 25 souvent bloqué par les FAI');
            }
            if (port === 465 && !secure) {
                warnings.push('Port 465 nécessite secure: true');
            }
            if (port === 587 && secure) {
                warnings.push('Port 587 utilise généralement STARTTLS, pas SSL direct');
            }
            return {
                name: 'Configuration SMTP',
                status: warnings.length > 0 ? 'warning' : 'pass',
                message: warnings.length > 0 ? `Avertissements: ${warnings.join(', ')}` : 'Configuration complète',
                details: { settings, warnings },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                name: 'Configuration SMTP',
                status: 'fail',
                message: `Erreur lors de la vérification: ${error.message}`,
                duration: Date.now() - startTime
            };
        }
    }
    async checkConnectivity() {
        const startTime = Date.now();
        try {
            const transporter = this.createDiagnosticTransporter();
            const connected = await Promise.race([
                transporter.verify(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de connexion (10s)')), 10000))
            ]);
            return {
                name: 'Connectivité SMTP',
                status: 'pass',
                message: 'Connexion au serveur SMTP réussie',
                details: {
                    host: this.config.get('SMTP_HOST'),
                    port: this.config.get('SMTP_PORT'),
                    connected: true
                },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                name: 'Connectivité SMTP',
                status: 'fail',
                message: `Impossible de se connecter: ${error.message}`,
                details: this.analyzeConnectionError(error.message),
                duration: Date.now() - startTime
            };
        }
    }
    async checkAuthentication() {
        const startTime = Date.now();
        try {
            const transporter = this.createDiagnosticTransporter();
            await transporter.verify();
            return {
                name: 'Authentification SMTP',
                status: 'pass',
                message: 'Authentification réussie',
                details: {
                    user: this.config.get('SMTP_USER'),
                    authMethod: 'LOGIN'
                },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            const errorAnalysis = this.analyzeAuthError(error.message);
            return {
                name: 'Authentification SMTP',
                status: 'fail',
                message: `Échec d'authentification: ${error.message}`,
                details: errorAnalysis,
                duration: Date.now() - startTime
            };
        }
    }
    async checkDnsResolution() {
        const startTime = Date.now();
        try {
            const smtpHost = this.config.get('SMTP_HOST');
            const emailDomain = this.config.get('EMAIL_FROM', '').split('@')[1];
            const checks = await Promise.allSettled([
                this.resolveMx(smtpHost),
                emailDomain ? this.resolveMx(emailDomain) : Promise.resolve([])
            ]);
            const smtpMx = checks[0].status === 'fulfilled' ? checks[0].value : null;
            const domainMx = checks[1].status === 'fulfilled' ? checks[1].value : null;
            const details = {
                smtpHost,
                smtpMxRecords: smtpMx,
                emailDomain,
                domainMxRecords: domainMx
            };
            if (!smtpMx) {
                return {
                    name: 'Résolution DNS',
                    status: 'fail',
                    message: `Impossible de résoudre ${smtpHost}`,
                    details,
                    duration: Date.now() - startTime
                };
            }
            return {
                name: 'Résolution DNS',
                status: 'pass',
                message: 'Résolution DNS réussie',
                details,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                name: 'Résolution DNS',
                status: 'fail',
                message: `Erreur DNS: ${error.message}`,
                duration: Date.now() - startTime
            };
        }
    }
    async checkTestEmail() {
        const startTime = Date.now();
        try {
            const transporter = this.createDiagnosticTransporter();
            const testEmail = this.config.get('EMAIL_TEST_RECIPIENT');
            if (!testEmail) {
                return {
                    name: 'Test d\'envoi',
                    status: 'warning',
                    message: 'EMAIL_TEST_RECIPIENT non configuré - test ignoré',
                    duration: Date.now() - startTime
                };
            }
            const result = await transporter.sendMail({
                from: this.config.get('EMAIL_FROM'),
                to: testEmail,
                subject: 'Test diagnostic CSS - ' + new Date().toISOString(),
                text: 'Email de test du système de diagnostic du Club Sportif Sfaxien',
                html: '<p>Email de test du système de diagnostic du <strong>Club Sportif Sfaxien</strong></p>'
            });
            return {
                name: 'Test d\'envoi',
                status: 'pass',
                message: 'Email de test envoyé avec succès',
                details: {
                    messageId: result.messageId,
                    recipient: testEmail,
                    accepted: result.accepted,
                    rejected: result.rejected
                },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                name: 'Test d\'envoi',
                status: 'fail',
                message: `Échec d'envoi: ${error.message}`,
                details: this.analyzeEmailError(error.message),
                duration: Date.now() - startTime
            };
        }
    }
    createDiagnosticTransporter() {
        return nodemailer.createTransporter({
            host: this.config.get('SMTP_HOST'),
            port: this.config.get('SMTP_PORT', 587),
            secure: this.config.get('SMTP_SECURE', false),
            auth: {
                user: this.config.get('SMTP_USER'),
                pass: this.config.get('SMTP_PASSWORD'),
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
            debug: true
        });
    }
    analyzeConnectionError(errorMessage) {
        const analysis = {
            errorType: 'unknown',
            possibleCauses: [],
            solutions: []
        };
        if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
            analysis.errorType = 'dns_resolution';
            analysis.possibleCauses.push('Nom d\'hôte SMTP incorrect');
            analysis.solutions.push('Vérifier SMTP_HOST dans la configuration');
        }
        if (errorMessage.includes('ECONNREFUSED')) {
            analysis.errorType = 'connection_refused';
            analysis.possibleCauses.push('Port SMTP incorrect', 'Serveur SMTP arrêté');
            analysis.solutions.push('Vérifier SMTP_PORT', 'Contacter l\'administrateur du serveur SMTP');
        }
        if (errorMessage.includes('ETIMEDOUT')) {
            analysis.errorType = 'timeout';
            analysis.possibleCauses.push('Firewall bloquant', 'Serveur SMTP lent');
            analysis.solutions.push('Vérifier les règles firewall', 'Essayer un autre port (587, 465, 25)');
        }
        if (errorMessage.includes('certificate') || errorMessage.includes('TLS')) {
            analysis.errorType = 'tls_certificate';
            analysis.possibleCauses.push('Certificat TLS invalide', 'Configuration SSL/TLS incorrecte');
            analysis.solutions.push('Vérifier SMTP_SECURE', 'Ajouter rejectUnauthorized: false pour test');
        }
        return analysis;
    }
    analyzeAuthError(errorMessage) {
        const analysis = {
            errorType: 'auth_failed',
            possibleCauses: [],
            solutions: []
        };
        if (errorMessage.includes('535') || errorMessage.includes('authentication failed')) {
            analysis.possibleCauses.push('Nom d\'utilisateur ou mot de passe incorrect');
            analysis.solutions.push('Vérifier SMTP_USER et SMTP_PASSWORD');
        }
        if (errorMessage.includes('534')) {
            analysis.possibleCauses.push('Authentification à deux facteurs activée');
            analysis.solutions.push('Générer un mot de passe d\'application');
        }
        return analysis;
    }
    analyzeEmailError(errorMessage) {
        const analysis = {
            errorType: 'send_failed',
            possibleCauses: [],
            solutions: []
        };
        if (errorMessage.includes('451')) {
            analysis.errorType = 'temporary_failure';
            analysis.possibleCauses.push('Erreur temporaire du serveur', 'Limite de taux atteinte');
            analysis.solutions.push('Réessayer dans quelques minutes', 'Réduire la fréquence d\'envoi');
        }
        if (errorMessage.includes('550')) {
            analysis.errorType = 'rejected';
            analysis.possibleCauses.push('Email rejeté par le destinataire', 'Domain ou IP blacklisté');
            analysis.solutions.push('Vérifier la réputation de l\'IP', 'Configurer SPF/DKIM');
        }
        return analysis;
    }
    generateRecommendations(checks) {
        const recommendations = [];
        if (checks.configuration.status === 'fail') {
            recommendations.push('Configurer tous les paramètres SMTP requis');
        }
        if (checks.connectivity.status === 'fail') {
            recommendations.push('Vérifier la connectivité réseau et les paramètres firewall');
        }
        if (checks.authentication.status === 'fail') {
            recommendations.push('Vérifier les identifiants SMTP et l\'authentification 2FA');
        }
        if (checks.testEmail.status === 'fail') {
            recommendations.push('Configurer un transporteur de fallback');
            recommendations.push('Implémenter un système de retry pour les emails');
        }
        recommendations.push('Configurer SPF, DKIM et DMARC pour améliorer la délivrabilité');
        recommendations.push('Surveiller la réputation de l\'IP d\'envoi');
        recommendations.push('Implémenter des templates email responsive');
        return recommendations;
    }
    generateSummary(checks) {
        const total = Object.keys(checks).length;
        const passed = Object.values(checks).filter((check) => check.status === 'pass').length;
        const failed = Object.values(checks).filter((check) => check.status === 'fail').length;
        const warnings = Object.values(checks).filter((check) => check.status === 'warning').length;
        return `${passed}/${total} vérifications réussies${failed > 0 ? `, ${failed} échecs` : ''}${warnings > 0 ? `, ${warnings} avertissements` : ''}`;
    }
    determineOverallStatus(checks) {
        const statuses = Object.values(checks).map((check) => check.status);
        if (statuses.includes('fail')) {
            return 'error';
        }
        if (statuses.includes('warning')) {
            return 'warning';
        }
        return 'healthy';
    }
    getRecommendedConfigurations() {
        return {
            gmail: {
                SMTP_HOST: 'smtp.gmail.com',
                SMTP_PORT: 587,
                SMTP_SECURE: false,
                note: 'Utiliser un mot de passe d\'application avec 2FA activé'
            },
            office365: {
                SMTP_HOST: 'smtp.office365.com',
                SMTP_PORT: 587,
                SMTP_SECURE: false,
                note: 'Authentification moderne requise'
            },
            mailgun: {
                SMTP_HOST: 'smtp.mailgun.org',
                SMTP_PORT: 587,
                SMTP_SECURE: false,
                note: 'Service transactionnel recommandé pour la production'
            },
            sendgrid: {
                SMTP_HOST: 'smtp.sendgrid.net',
                SMTP_PORT: 587,
                SMTP_SECURE: false,
                note: 'Excellent pour les emails en volume'
            }
        };
    }
};
exports.EmailDiagnosticsService = EmailDiagnosticsService;
exports.EmailDiagnosticsService = EmailDiagnosticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], EmailDiagnosticsService);
//# sourceMappingURL=email-diagnostics.service.js.map