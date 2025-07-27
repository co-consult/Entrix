import { Request } from 'express';
import { IUserProfile } from './user.interface';
export interface AuthenticatedRequest extends Request {
    user: IUserProfile;
    mfaContext?: {
        hasMfaConfigured: boolean;
        configuredMethods: string[];
        isDeviceTrusted: boolean;
        trustedDevicesCount: number;
        deviceFingerprint?: string;
        ipAddress?: string;
        userAgent?: string;
    };
    sessionId?: string;
    deviceFingerprint?: string;
}
export interface OptionalAuthRequest extends Request {
    user?: IUserProfile;
}
export declare function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest;
