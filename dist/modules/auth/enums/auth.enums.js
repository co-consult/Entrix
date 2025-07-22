"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = exports.AuthErrorCode = exports.AuthProvider = void 0;
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["LOCAL"] = "local";
    AuthProvider["GOOGLE"] = "google";
    AuthProvider["FACEBOOK"] = "facebook";
    AuthProvider["APPLE"] = "apple";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
var AuthErrorCode;
(function (AuthErrorCode) {
    AuthErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    AuthErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    AuthErrorCode["EMAIL_NOT_VERIFIED"] = "EMAIL_NOT_VERIFIED";
    AuthErrorCode["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    AuthErrorCode["MFA_REQUIRED"] = "MFA_REQUIRED";
    AuthErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    AuthErrorCode["TOKEN_INVALID"] = "TOKEN_INVALID";
    AuthErrorCode["TOO_MANY_ATTEMPTS"] = "TOO_MANY_ATTEMPTS";
})(AuthErrorCode || (exports.AuthErrorCode = AuthErrorCode = {}));
var TokenType;
(function (TokenType) {
    TokenType["ACCESS"] = "access";
    TokenType["REFRESH"] = "refresh";
    TokenType["RESET_PASSWORD"] = "reset_password";
    TokenType["EMAIL_VERIFICATION"] = "email_verification";
    TokenType["MFA"] = "mfa";
})(TokenType || (exports.TokenType = TokenType = {}));
//# sourceMappingURL=auth.enums.js.map