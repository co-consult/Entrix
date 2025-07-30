import { LoggerService } from '../../../shared/logger/logger.service';
import { SecurityService } from '../services/security.service';
import { DeviceService } from '../services/device.service';
import { MfaService } from '../services/mfa.service';
import { SecurityEventsQueryDto, SecurityEventsResponseDto, TrustedDeviceDto, TrustedDeviceResponseDto } from '../dto';
import { IUserProfile } from '../interfaces';
export declare class SecurityController {
    private readonly securityService;
    private readonly deviceService;
    private readonly mfaService;
    private readonly logger;
    constructor(securityService: SecurityService, deviceService: DeviceService, mfaService: MfaService, loggerService: LoggerService);
    getSecurityEvents(query: SecurityEventsQueryDto, userId: string): Promise<SecurityEventsResponseDto>;
    verifyDevice(verifyDeviceDto: TrustedDeviceDto, userId: string, deviceFingerprint: string, clientInfo: {
        ip: string;
        userAgent: string;
    }): Promise<TrustedDeviceResponseDto>;
    getTrustedDevices(userId: string): Promise<{
        success: boolean;
        data: {
            devices: {
                deviceFingerprint: any;
                userAgent: any;
                ipAddress: any;
                lastUsed: any;
                location: string;
                trusted: boolean;
            }[];
            total: number;
            securityScore: number;
        };
    }>;
    revokeTrustedDevice(deviceId: string, userId: string): Promise<{
        success: boolean;
        data: {
            deviceRevoked: boolean;
            sessionsTerminated: number;
        };
    }>;
    assessCurrentRisk(userId: string, deviceFingerprint: string, clientInfo: {
        ip: string;
        userAgent: string;
    }): Promise<{
        success: boolean;
        data: {
            score: number;
            factors: {
                unknownDevice: boolean;
                newLocation: boolean;
                unusualTime: boolean;
                failedAttempts: number;
                suspiciousIp: boolean;
                multipleSessions: boolean;
            };
            recommendation: "ALLOW" | "ALERT" | "REQUIRE_MFA" | "BLOCK";
            requiresMfa: boolean;
            details: {
                geolocation: {
                    country: string;
                    city: string;
                    suspicious: boolean;
                };
                device: {
                    fingerprint: string;
                    trusted: boolean;
                    lastSeen: string;
                };
                behavior: {
                    loginPattern: string;
                    velocityScore: number;
                };
            };
        };
    }>;
    getSecuritySummary(user: IUserProfile, userId: string): Promise<{
        success: boolean;
        data: {
            securityScore: number;
            mfaEnabled: boolean;
            mfaProviders: any[];
            emailVerified: boolean;
            phoneVerified: boolean;
            trustedDevices: number;
            activeSessions: number;
            recentEvents: number;
            recommendations: string[];
            lastSecurityUpdate: Date;
        };
    }>;
    private verifyDeviceCode;
    private isMobile;
    private formatLocation;
    private calculateSecurityScore;
    private generateSecurityRecommendations;
}
