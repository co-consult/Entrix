"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitExceededException = void 0;
const common_1 = require("@nestjs/common");
class RateLimitExceededException extends common_1.TooManyRequestsException {
    limitType;
    limit;
    window;
    retryAfter;
    details;
    constructor(limitType, limit, window, retryAfter, details) {
        super({
            error: 'RATE_LIMIT_EXCEEDED',
            message: `Limite de taux dépassée: ${limit} requêtes par ${window} secondes`,
            limit_type: limitType,
            limit,
            window_seconds: window,
            retry_after_seconds: retryAfter,
            details,
            timestamp: new Date().toISOString(),
        });
        this.limitType = limitType;
        this.limit = limit;
        this.window = window;
        this.retryAfter = retryAfter;
        this.details = details;
    }
    static forIP(ipAddress, limit, window, currentCount) {
        return new RateLimitExceededException('IP_RATE_LIMIT', limit, window, window, {
            identifier: ipAddress,
            current_count: currentCount,
        });
    }
    static forUser(userId, limit, window, currentCount) {
        return new RateLimitExceededException('USER_RATE_LIMIT', limit, window, window, {
            identifier: userId,
            current_count: currentCount,
        });
    }
    static forEndpoint(endpoint, limit, window, currentCount) {
        return new RateLimitExceededException('ENDPOINT_RATE_LIMIT', limit, window, window, {
            identifier: endpoint,
            current_count: currentCount,
        });
    }
}
exports.RateLimitExceededException = RateLimitExceededException;
//# sourceMappingURL=rate-limit-exceeded.exception.js.map