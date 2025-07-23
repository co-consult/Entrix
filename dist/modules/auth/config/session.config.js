"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionConfig = void 0;
const session_constants_1 = require("../constants/session.constants");
const getSessionConfig = (configService) => ({
    defaultDuration: configService.get('SESSION_DURATION', session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION),
    rememberMeDuration: configService.get('SESSION_REMEMBER_DURATION', session_constants_1.SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION),
    idleTimeout: configService.get('SESSION_IDLE_TIMEOUT', session_constants_1.SESSION_CONSTANTS.DURATION.IDLE_TIMEOUT),
    maxConcurrentSessions: configService.get('MAX_CONCURRENT_SESSIONS', session_constants_1.SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS),
    cleanupInterval: configService.get('SESSION_CLEANUP_INTERVAL', session_constants_1.SESSION_CONSTANTS.DURATION.CLEANUP_INTERVAL),
    redis: {
        keyPrefix: session_constants_1.SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX,
        ttl: configService.get('SESSION_REDIS_TTL', session_constants_1.SESSION_CONSTANTS.DURATION.DEFAULT_SESSION),
    },
});
exports.getSessionConfig = getSessionConfig;
//# sourceMappingURL=session.config.js.map