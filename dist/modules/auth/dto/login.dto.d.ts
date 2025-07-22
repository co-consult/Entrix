export declare class LoginDto {
    email: string;
    password: string;
    rememberMe?: boolean;
    deviceFingerprint?: string;
    mfaCode?: string;
}
export declare class LoginCheckDto {
    email: string;
}
export declare class OAuthLoginDto {
    provider: 'google' | 'facebook' | 'apple';
    accessToken: string;
    rememberMe?: boolean;
}
