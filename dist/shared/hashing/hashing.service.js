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
var HashingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
let HashingService = HashingService_1 = class HashingService {
    configService;
    logger = new common_1.Logger(HashingService_1.name);
    config;
    metrics;
    constructor(configService) {
        this.configService = configService;
        this.config = {
            passwordRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
            tokenRounds: parseInt(process.env.BCRYPT_TOKEN_ROUNDS || process.env.BCRYPT_ROUNDS || '10'),
            apiKeyRounds: parseInt(process.env.BCRYPT_API_ROUNDS || '8'),
            algorithm: 'bcrypt',
        };
        this.metrics = {
            hashesGenerated: 0,
            verificationsPerformed: 0,
            failedVerifications: 0,
            averageHashTime: 0,
            averageVerifyTime: 0,
        };
        this.logConfiguration();
    }
    async hashPassword(plainPassword) {
        const startTime = Date.now();
        try {
            if (!plainPassword || typeof plainPassword !== 'string') {
                throw new Error('Le mot de passe doit être une chaîne non vide');
            }
            const hash = await bcrypt.hash(plainPassword, this.config.passwordRounds);
            const hashTime = Date.now() - startTime;
            this.updateHashMetrics(hashTime);
            this.logger.debug(`Mot de passe hashé avec ${this.config.passwordRounds} rounds en ${hashTime}ms`);
            return hash;
        }
        catch (error) {
            this.logger.error('Erreur lors du hash du mot de passe:', error);
            throw new Error('Impossible de hasher le mot de passe');
        }
    }
    async hashToken(plainToken) {
        const startTime = Date.now();
        try {
            if (!plainToken || typeof plainToken !== 'string') {
                throw new Error('Le token doit être une chaîne non vide');
            }
            const hash = await bcrypt.hash(plainToken, this.config.tokenRounds);
            const hashTime = Date.now() - startTime;
            this.updateHashMetrics(hashTime);
            this.logger.debug(`Token hashé avec ${this.config.tokenRounds} rounds en ${hashTime}ms`);
            return hash;
        }
        catch (error) {
            this.logger.error('Erreur lors du hash du token:', error);
            throw new Error('Impossible de hasher le token');
        }
    }
    async hashApiKey(plainApiKey) {
        const startTime = Date.now();
        try {
            if (!plainApiKey || typeof plainApiKey !== 'string') {
                throw new Error('La clé API doit être une chaîne non vide');
            }
            const hash = await bcrypt.hash(plainApiKey, this.config.apiKeyRounds);
            const hashTime = Date.now() - startTime;
            this.updateHashMetrics(hashTime);
            this.logger.debug(`Clé API hashée avec ${this.config.apiKeyRounds} rounds en ${hashTime}ms`);
            return hash;
        }
        catch (error) {
            this.logger.error('Erreur lors du hash de la clé API:', error);
            throw new Error('Impossible de hasher la clé API');
        }
    }
    async compare(plainText, hash) {
        const startTime = Date.now();
        try {
            if (!plainText || !hash) {
                await bcrypt.compare('dummy', '$2b$12$dummyhashtopreventtimingattacks');
                return false;
            }
            if (!this.validateHashFormat(hash)) {
                this.logger.warn('Format de hash invalide détecté');
                await bcrypt.compare('dummy', '$2b$12$dummyhashtopreventtimingattacks');
                return false;
            }
            const isValid = await bcrypt.compare(plainText, hash);
            const verifyTime = Date.now() - startTime;
            this.updateVerifyMetrics(verifyTime, isValid);
            this.logger.debug(`Vérification effectuée en ${verifyTime}ms: ${isValid ? 'valide' : 'invalide'}`);
            return isValid;
        }
        catch (error) {
            this.logger.error('Erreur lors de la vérification:', error);
            await bcrypt.compare('dummy', '$2b$12$dummyhashtopreventtimingattacks');
            return false;
        }
    }
    validateHashFormat(hash) {
        if (!hash || typeof hash !== 'string') {
            return false;
        }
        const bcryptRegex = /^\$2[abxy]\$\d{1,2}\$[A-Za-z0-9./]{53}$/;
        return bcryptRegex.test(hash);
    }
    extractRounds(hash) {
        if (!this.validateHashFormat(hash)) {
            return null;
        }
        const parts = hash.split('$');
        return parseInt(parts[2]) || null;
    }
    shouldRehash(hash, targetRounds) {
        const currentRounds = this.extractRounds(hash);
        return currentRounds !== null && currentRounds < targetRounds;
    }
    async rehashPasswordIfNeeded(plainPassword, currentHash) {
        if (this.shouldRehash(currentHash, this.config.passwordRounds)) {
            this.logger.log(`Rehash nécessaire: ${this.extractRounds(currentHash)} -> ${this.config.passwordRounds} rounds`);
            return await this.hashPassword(plainPassword);
        }
        return null;
    }
    getHashFingerprint(hash) {
        if (!hash || hash.length < 10) {
            return 'invalid-hash';
        }
        const rounds = this.extractRounds(hash);
        const prefix = hash.substring(0, 7);
        const suffix = hash.substring(hash.length - 6);
        return `${prefix}...${suffix} (${rounds} rounds)`;
    }
    getConfig() {
        return { ...this.config };
    }
    getMetrics() {
        return { ...this.metrics };
    }
    resetMetrics() {
        this.metrics.hashesGenerated = 0;
        this.metrics.verificationsPerformed = 0;
        this.metrics.failedVerifications = 0;
        this.metrics.averageHashTime = 0;
        this.metrics.averageVerifyTime = 0;
    }
    logConfiguration() {
        this.logger.log('🔐 Configuration du HashingService:');
        this.logger.log(`   • Algorithme: ${this.config.algorithm}`);
        this.logger.log(`   • Rounds mots de passe: ${this.config.passwordRounds}`);
        this.logger.log(`   • Rounds tokens: ${this.config.tokenRounds}`);
        this.logger.log(`   • Rounds clés API: ${this.config.apiKeyRounds}`);
    }
    updateHashMetrics(hashTime) {
        this.metrics.hashesGenerated++;
        this.metrics.averageHashTime =
            (this.metrics.averageHashTime * (this.metrics.hashesGenerated - 1) + hashTime) /
                this.metrics.hashesGenerated;
    }
    updateVerifyMetrics(verifyTime, isValid) {
        this.metrics.verificationsPerformed++;
        if (!isValid) {
            this.metrics.failedVerifications++;
        }
        this.metrics.averageVerifyTime =
            (this.metrics.averageVerifyTime * (this.metrics.verificationsPerformed - 1) + verifyTime) /
                this.metrics.verificationsPerformed;
    }
};
exports.HashingService = HashingService;
exports.HashingService = HashingService = HashingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HashingService);
//# sourceMappingURL=hashing.service.js.map