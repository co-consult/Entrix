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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtil = void 0;
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
const auth_constants_1 = require("../constants/auth.constants");
class CryptoUtil {
    static SALT_ROUNDS = 12;
    static HASH_ALGORITHM = 'sha256';
    static async hashPassword(password) {
        try {
            return await bcrypt.hash(password, this.SALT_ROUNDS);
        }
        catch (error) {
            throw new Error(`Erreur hachage mot de passe: ${error.message}`);
        }
    }
    static async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        }
        catch (error) {
            throw new Error(`Erreur vérification mot de passe: ${error.message}`);
        }
    }
    static generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    static generateUuid() {
        return crypto.randomUUID();
    }
    static sha256Hash(data) {
        return crypto.createHash(this.HASH_ALGORITHM).update(data).digest('hex');
    }
    static generateOtpCode(length = auth_constants_1.AUTH_CONSTANTS.SECURITY.MFA_CODE_LENGTH) {
        const digits = '0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        return result;
    }
    static generateBackupCodes(count = 10, length = 8) {
        const codes = [];
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < count; i++) {
            let code = '';
            for (let j = 0; j < length; j++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            codes.push(code);
        }
        return codes;
    }
    static encrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', key);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        };
    }
    static decrypt(encryptedData, key) {
        const decipher = crypto.createDecipher('aes-256-gcm', key);
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    static validatePasswordStrength(password) {
        const suggestions = [];
        let score = 0;
        if (password.length >= 8)
            score += 20;
        else
            suggestions.push('Utilisez au moins 8 caractères');
        if (password.length >= 12)
            score += 10;
        if (password.length >= 16)
            score += 10;
        if (/[a-z]/.test(password))
            score += 15;
        else
            suggestions.push('Ajoutez des lettres minuscules');
        if (/[A-Z]/.test(password))
            score += 15;
        else
            suggestions.push('Ajoutez des lettres majuscules');
        if (/[0-9]/.test(password))
            score += 15;
        else
            suggestions.push('Ajoutez des chiffres');
        if (/[^A-Za-z0-9]/.test(password))
            score += 15;
        else
            suggestions.push('Ajoutez des symboles (!@#$%^&*)');
        if (/123/.test(password) || /abc/.test(password)) {
            score -= 10;
            suggestions.push('Évitez les séquences communes');
        }
        if (/(.)\1{2,}/.test(password)) {
            score -= 10;
            suggestions.push('Évitez la répétition de caractères');
        }
        return {
            isValid: score >= 70,
            score: Math.max(0, Math.min(100, score)),
            suggestions
        };
    }
}
exports.CryptoUtil = CryptoUtil;
//# sourceMappingURL=crypto.util.js.map