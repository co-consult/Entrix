import { IDeviceInfo } from '../interfaces/session.interface';
import { IRiskAssessment } from '../interfaces/security.interface';
import { GeolocationInfo } from './geolocation.util';
export interface RiskFactors {
    unknownDevice: boolean;
    newLocation: boolean;
    unusualTime: boolean;
    failedAttempts: number;
    suspiciousIp: boolean;
    multipleSessions: boolean;
    velocityAnomaly: boolean;
    browserInconsistency: boolean;
}
export interface UserBehaviorProfile {
    userId: string;
    commonLocations: string[];
    commonDevices: string[];
    typicalLoginTimes: number[];
    averageSessionDuration: number;
    lastLoginLocation?: string;
    lastLoginDevice?: string;
    recentFailedAttempts: number;
    activeSessions: number;
}
export declare class RiskScoringUtil {
    static calculateRiskScore(deviceInfo: IDeviceInfo, userProfile: UserBehaviorProfile, geoInfo?: Partial<GeolocationInfo>): IRiskAssessment;
    private static analyzeRiskFactors;
    private static computeRiskScore;
    private static getRecommendation;
    private static isUnknownDevice;
    private static isNewLocation;
    private static isUnusualTime;
    private static isSuspiciousIp;
    private static detectVelocityAnomaly;
    private static detectBrowserInconsistency;
    static updateUserBehaviorProfile(userProfile: UserBehaviorProfile, deviceInfo: IDeviceInfo, loginSuccess: boolean): UserBehaviorProfile;
}
