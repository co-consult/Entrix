import { SecurityEventType } from '../constants/auth.constants';
import { IDeviceInfo } from './session.interface';
export interface IRiskAssessment {
    score: number;
    factors: {
        unknownDevice: boolean;
        newLocation: boolean;
        unusualTime: boolean;
        failedAttempts: number;
        suspiciousIp: boolean;
        multipleSessions: boolean;
    };
    recommendation: 'ALLOW' | 'REQUIRE_MFA' | 'BLOCK' | 'ALERT';
    requiresMfa: boolean;
}
export interface ISecurityEvent {
    id: string;
    type: SecurityEventType;
    userId: string;
    ipAddress: string;
    userAgent: string;
    location?: string;
    riskScore: number;
    description: string;
    metadata?: any;
    resolved: boolean;
    createdAt: Date;
}
export interface ISecurityService {
    assessRisk(userId: string, deviceInfo: IDeviceInfo): Promise<IRiskAssessment>;
    logSecurityEvent(event: Omit<ISecurityEvent, 'id' | 'createdAt'>): Promise<ISecurityEvent>;
    getSecurityEvents(userId: string, limit?: number): Promise<ISecurityEvent[]>;
    checkSuspiciousActivity(userId: string): Promise<boolean>;
    blockSuspiciousIp(ip: string, duration: number): Promise<void>;
}
