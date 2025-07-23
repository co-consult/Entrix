"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenUtil = void 0;
const crypto_util_1 = require("./crypto.util");
const auth_constants_1 = require("../constants/auth.constants");
class TokenUtil {
    static createAccessTokenPayload(userId, email, sessionId, deviceFingerprint, roles, permissions) {
        const now = Math.floor(Date.now() / 1000);
        return {
            sub: userId,
            email,
            iat: now,
            exp: now + auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
            aud: 'entrix-users',
            iss: 'entrix-v3',
            sessionId,
            deviceFingerprint,
            roles: roles || [],
            permissions: permissions || [],
        };
    }
    static createRefreshTokenPayload(userId, sessionId, rememberMe = false) {
        const now = Math.floor(Date.now() / 1000);
        const expiryDuration = rememberMe
            ? auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY_REMEMBER
            : auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY;
        return {
            sub: userId,
            sessionId,
            tokenId: crypto_util_1.CryptoUtil.generateUuid(),
            iat: now,
            exp: now + expiryDuration,
            aud: 'entrix-refresh',
            iss: 'entrix-v3',
        };
    }
    static validateJwtPayload(payload, type) {
        if (!payload || typeof payload !== 'object')
            return false;
        const requiredFields = ['sub', 'iat', 'exp', 'aud', 'iss'];
        for (const field of requiredFields) {
            if (!payload[field])
                return false;
        }
        if (type === 'access') {
            return !!(payload.email && payload.sessionId);
        }
        else if (type === 'refresh') {
            return !!(payload.sessionId && payload.tokenId);
        }
        return false;
    }
    static extractUserInfo(payload) {
        return {
            userId: payload.sub,
            email: payload.email,
            sessionId: payload.sessionId,
            roles: payload.roles || [],
            permissions: payload.permissions || [],
        };
    }
    static isTokenExpiringSoon(payload, thresholdMinutes = 5) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - now;
        return timeUntilExpiry <= (thresholdMinutes * 60);
    }
    static generateSessionId() {
        return `sess_${Date.now()}_${crypto_util_1.CryptoUtil.generateSecureToken(16)}`;
    }
    static generateBlacklistKey(tokenId) {
        return `blacklist:token:${tokenId}`;
    }
    static getTimeUntilExpiry(payload) {
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, payload.exp - now);
    }
    static formatAuthorizationHeader(token) {
        return `Bearer ${token}`;
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}
exports.TokenUtil = TokenUtil;
//# sourceMappingURL=token.util.js.map