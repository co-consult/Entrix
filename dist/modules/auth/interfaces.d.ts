export interface AuthPayload {
    userId: string;
    email: string;
    roles: string[];
}
export interface JwtToken {
    accessToken: string;
    refreshToken: string;
}
