"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtil = void 0;
const auth_constants_1 = require("../constants/auth.constants");
class SecurityUtil {
    static validatePassword(password) {
        const errors = [];
        if (password.length < auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
            errors.push(`Minimum ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères`);
        }
        if (password.length > auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH) {
            errors.push(`Maximum ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH} caractères`);
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Doit contenir au moins une minuscule');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Doit contenir au moins une majuscule');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Doit contenir au moins un chiffre');
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push('Doit contenir au moins un symbole');
        }
        if (/123|abc|qwe|password|admin|user/i.test(password)) {
            errors.push('Évitez les séquences communes');
        }
        if (/(.)\1{2,}/.test(password)) {
            errors.push('Évitez la répétition de caractères');
        }
        let strength = 'weak';
        if (errors.length === 0) {
            if (password.length >= 12 && /[^A-Za-z0-9].*[^A-Za-z0-9]/.test(password)) {
                strength = 'strong';
            }
            else {
                strength = 'medium';
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            strength
        };
    }
    static generateSecurityHeaders() {
        return {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Security-Policy': "default-src 'self'",
        };
    }
    static maskEmail(email) {
        const [localPart, domain] = email.split('@');
        if (localPart.length <= 2) {
            return `${localPart[0]}*@${domain}`;
        }
        const masked = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
        return `${masked}@${domain}`;
    }
    static maskPhoneNumber(phone) {
        if (phone.length <= 4)
            return phone;
        return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
    }
    static isValidTunisianEmail(email) {
        const tunisianDomains = [
            '.tn', '.com.tn', '.org.tn', '.net.tn', '.gov.tn', '.edu.tn'
        ];
        return tunisianDomains.some(domain => email.toLowerCase().endsWith(domain));
    }
    static isBruteForcePattern(attempts) {
        const now = new Date();
        const recentAttempts = attempts.filter(attempt => now.getTime() - attempt.timestamp.getTime() < 15 * 60 * 1000);
        if (recentAttempts.length > 10)
            return true;
        const recentFailures = recentAttempts
            .filter(attempt => !attempt.success)
            .slice(-5);
        return recentFailures.length >= 5;
    }
    static generateRateLimitKey(type, identifier) {
        return `rate_limit:${type}:${identifier}`;
    }
    static calculateBackoffDelay(attemptNumber, baseDelay = 1000) {
        const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), 300000);
        const jitter = Math.random() * 0.1 * delay;
        return Math.floor(delay + jitter);
    }
    static isValidJwtFormat(token) {
        if (!token)
            return false;
        const parts = token.split('.');
        if (parts.length !== 3)
            return false;
        try {
            parts.forEach(part => {
                JSON.parse(Buffer.from(part, 'base64').toString());
            });
            return true;
        }
        catch {
            return false;
        }
    }
    static extractJwtPayload(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3)
                return null;
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            return payload;
        }
        catch {
            return null;
        }
    }
    static isTokenExpired(token) {
        const payload = this.extractJwtPayload(token);
        if (!payload || !payload.exp)
            return true;
        return Date.now() >= payload.exp * 1000;
    }
}
exports.SecurityUtil = SecurityUtil;
//# sourceMappingURL=security.util.js.map