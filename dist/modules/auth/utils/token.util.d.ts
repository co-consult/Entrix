import { JwtPayload, JwtRefreshPayload } from '../interfaces/auth.interfaces';
export declare class TokenUtil {
    static createAccessTokenPayload(userId: string, email: string, sessionId: string, deviceFingerprint?: string, roles?: string[], permissions?: string[]): JwtPayload;
    static createRefreshTokenPayload(userId: string, sessionId: string, rememberMe?: boolean): JwtRefreshPayload;
    static validateJwtPayload(payload: any, type: 'access' | 'refresh'): boolean;
    static extractUserInfo(payload: JwtPayload): {
        userId: string;
        email: string;
        sessionId: string;
        roles: string[];
        permissions: string[];
    };
    static isTokenExpiringSoon(payload: JwtPayload, thresholdMinutes?: number): boolean;
    static generateSessionId(): string;
    static generateBlacklistKey(tokenId: string): string;
    static getTimeUntilExpiry(payload: JwtPayload | JwtRefreshPayload): number;
    static formatAuthorizationHeader(token: string): string;
    static extractTokenFromHeader(authHeader?: string): string | null;
}
