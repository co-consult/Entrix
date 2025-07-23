import { JwtPayload, JwtRefreshPayload } from './auth.interfaces';
import { IUserProfile } from './user.interface';
import { IUserSession, IDeviceInfo } from './session.interface';
export interface ITokenService {
    generateAccessToken(payload: JwtPayload): Promise<string>;
    generateRefreshToken(payload: JwtRefreshPayload): Promise<string>;
    verifyAccessToken(token: string): Promise<JwtPayload>;
    verifyRefreshToken(token: string): Promise<JwtRefreshPayload>;
    blacklistToken(token: string): Promise<void>;
    isTokenBlacklisted(token: string): Promise<boolean>;
}
export interface ITokenContext {
    user: IUserProfile;
    session: IUserSession;
    deviceInfo: IDeviceInfo;
    permissions: string[];
    roles: string[];
}
