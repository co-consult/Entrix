"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitMfa = exports.RateLimitPasswordReset = exports.RateLimitLogin = exports.RateLimitStrict = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.RATE_LIMIT_KEY = 'rateLimit';
const RateLimit = (config) => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, config);
exports.RateLimit = RateLimit;
const RateLimitStrict = () => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    keyGenerator: 'ip',
    blockDuration: 15 * 60,
});
exports.RateLimitStrict = RateLimitStrict;
const RateLimitLogin = () => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    keyGenerator: 'ip',
    skipSuccessful: true,
    blockDuration: 15 * 60,
});
exports.RateLimitLogin = RateLimitLogin;
const RateLimitPasswordReset = () => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
    keyGenerator: 'ip',
    blockDuration: 60 * 60,
});
exports.RateLimitPasswordReset = RateLimitPasswordReset;
const RateLimitMfa = () => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, {
    limit: 5,
    windowMs: 5 * 60 * 1000,
    keyGenerator: 'user',
    skipSuccessful: true,
    blockDuration: 5 * 60,
});
exports.RateLimitMfa = RateLimitMfa;
//# sourceMappingURL=rate-limit.decorator.js.map