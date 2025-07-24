import { LoggerService } from '../../../shared/logger/logger.service';
import { SessionService } from '../services/session.service';
import { RefreshTokenDto, RefreshTokenResponseDto, SessionsListResponseDto, RevokeSessionResponseDto } from '../dto';
import { IUserProfile } from '../interfaces';
export declare class SessionController {
    private readonly sessionService;
    private readonly logger;
    constructor(sessionService: SessionService, loggerService: LoggerService);
    getCurrentSession(user: IUserProfile, sessionId: string): Promise<{
        success: boolean;
        data: {
            session: {
                sessionId: string;
                userId: string;
                deviceInfo: {
                    userAgent: string;
                    ipAddress: string;
                    deviceFingerprint: string;
                    geolocation: any;
                };
                createdAt: string;
                lastActivity: string;
                expiresAt: string;
                isActive: boolean;
            };
            user: IUserProfile;
            permissions: string[];
            preferences: any;
        };
    }>;
    refreshTokens(refreshDto: RefreshTokenDto): Promise<RefreshTokenResponseDto>;
    getUserSessions(userId: string, currentSessionId: string): Promise<SessionsListResponseDto>;
    revokeSession(sessionId: string, userId: string): Promise<RevokeSessionResponseDto>;
    private parseBrowser;
    private parseOS;
    private isMobile;
    private formatLocation;
}
