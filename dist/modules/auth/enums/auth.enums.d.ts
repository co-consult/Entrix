export declare enum AuthProvider {
    LOCAL = "local",
    GOOGLE = "google",
    FACEBOOK = "facebook",
    APPLE = "apple"
}
export declare enum AuthErrorCode {
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    MFA_REQUIRED = "MFA_REQUIRED",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    TOKEN_INVALID = "TOKEN_INVALID",
    TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS"
}
export declare enum TokenType {
    ACCESS = "access",
    REFRESH = "refresh",
    RESET_PASSWORD = "reset_password",
    EMAIL_VERIFICATION = "email_verification",
    MFA = "mfa"
}
