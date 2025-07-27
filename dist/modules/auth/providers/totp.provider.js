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
exports.TotpProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const speakeasy = __importStar(require("speakeasy"));
const qrcode = __importStar(require("qrcode"));
const mfa_constants_1 = require("../constants/mfa.constants");
const logger_service_1 = require("../../../shared/logger/logger.service");
let TotpProvider = class TotpProvider {
    config;
    logger;
    constructor(config, loggerService) {
        this.config = config;
        this.logger = loggerService.createChildLogger('TotpProvider');
    }
    async generateSecret(userEmail) {
        const operationId = this.logger.startOperation('generateSecret', { userEmail });
        try {
            const secretData = speakeasy.generateSecret({
                name: `${mfa_constants_1.MFA_CONSTANTS.TOTP.ISSUER} (${userEmail})`,
                issuer: mfa_constants_1.MFA_CONSTANTS.TOTP.ISSUER,
                length: mfa_constants_1.MFA_CONSTANTS.TOTP.SECRET_LENGTH
            });
            const qrCodeUrl = await qrcode.toDataURL(secretData.otpauth_url || '');
            this.logger.endOperation('generateSecret', operationId, true);
            return {
                secret: secretData.base32,
                qrCode: qrCodeUrl
            };
        }
        catch (error) {
            this.logger.endOperation('generateSecret', operationId, false);
            this.logger.error('Failed to generate TOTP secret', error.stack);
            throw error;
        }
    }
    verifyCode(secret, code) {
        try {
            return speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token: code,
                window: mfa_constants_1.MFA_CONSTANTS.TOTP.WINDOW,
                step: mfa_constants_1.MFA_CONSTANTS.TOTP.STEP
            });
        }
        catch (error) {
            this.logger.error('Failed to verify TOTP code', error.stack);
            return false;
        }
    }
    async generateQrCode(secret, userEmail) {
        try {
            const otpauthUrl = speakeasy.otpauthURL({
                secret,
                label: `${mfa_constants_1.MFA_CONSTANTS.TOTP.ISSUER} (${userEmail})`,
                issuer: mfa_constants_1.MFA_CONSTANTS.TOTP.ISSUER,
                encoding: 'base32'
            });
            return await qrcode.toDataURL(otpauthUrl);
        }
        catch (error) {
            this.logger.error('Failed to generate QR code', error.stack);
            throw error;
        }
    }
    validateSecret(secret) {
        try {
            return secret && secret.length === mfa_constants_1.MFA_CONSTANTS.TOTP.SECRET_LENGTH;
        }
        catch {
            return false;
        }
    }
    generateCurrentCode(secret) {
        return speakeasy.totp({
            secret,
            encoding: 'base32',
            step: mfa_constants_1.MFA_CONSTANTS.TOTP.STEP
        });
    }
};
exports.TotpProvider = TotpProvider;
exports.TotpProvider = TotpProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], TotpProvider);
//# sourceMappingURL=totp.provider.js.map