"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationTokenErrorCode = exports.VALIDATION_TOKEN_ATTEMPT_LIMITS = exports.VALIDATION_TOKEN_DURATIONS = void 0;
exports.VALIDATION_TOKEN_DURATIONS = {
    EMAIL_VERIFICATION: 24 * 60,
    EMAIL_CHANGE: 30,
    PASSWORD_RESET: 60,
    ACCOUNT_ACTIVATION: 72 * 60,
    INVITATION_USER: 7 * 24 * 60,
    INVITATION_GROUP: 7 * 24 * 60,
    MAGIC_LINK_LOGIN: 15,
    MAGIC_LINK_ACTION: 60,
    PHONE_VERIFICATION: 10,
    ACCOUNT_DELETION: 24 * 60,
};
exports.VALIDATION_TOKEN_ATTEMPT_LIMITS = {
    EMAIL_VERIFICATION: 5,
    EMAIL_CHANGE: 3,
    PASSWORD_RESET: 3,
    ACCOUNT_ACTIVATION: 5,
    INVITATION_USER: 10,
    INVITATION_GROUP: 10,
    MAGIC_LINK_LOGIN: 3,
    MAGIC_LINK_ACTION: 5,
    PHONE_VERIFICATION: 5,
    ACCOUNT_DELETION: 3,
};
var ValidationTokenErrorCode;
(function (ValidationTokenErrorCode) {
    ValidationTokenErrorCode["TOKEN_NOT_FOUND"] = "TOKEN_NOT_FOUND";
    ValidationTokenErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ValidationTokenErrorCode["TOKEN_USED"] = "TOKEN_USED";
    ValidationTokenErrorCode["TOKEN_BLOCKED"] = "TOKEN_BLOCKED";
    ValidationTokenErrorCode["ATTEMPTS_EXCEEDED"] = "ATTEMPTS_EXCEEDED";
    ValidationTokenErrorCode["INVALID_TOKEN_FORMAT"] = "INVALID_TOKEN_FORMAT";
    ValidationTokenErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ValidationTokenErrorCode["EMAIL_MISMATCH"] = "EMAIL_MISMATCH";
    ValidationTokenErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
})(ValidationTokenErrorCode || (exports.ValidationTokenErrorCode = ValidationTokenErrorCode = {}));
//# sourceMappingURL=validation-token.interface.js.map