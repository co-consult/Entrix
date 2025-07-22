"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_MESSAGES = exports.RATE_LIMIT_HEADERS = exports.DEFAULT_ALGORITHM = exports.DEFAULT_WINDOW_MS = exports.DEFAULT_RATE_LIMIT = void 0;
exports.DEFAULT_RATE_LIMIT = 100;
exports.DEFAULT_WINDOW_MS = 60000;
exports.DEFAULT_ALGORITHM = 'sliding_window';
exports.RATE_LIMIT_HEADERS = {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    retryAfter: 'Retry-After',
};
exports.RATE_LIMIT_MESSAGES = {
    EXCEEDED: 'Rate limit exceeded. Try again later.',
    BLACKLISTED: 'Access temporarily restricted.',
    INVALID_KEY: 'Invalid rate limit key.',
    SYSTEM_ERROR: 'Rate limiting system error.',
};
//# sourceMappingURL=interfaces.js.map