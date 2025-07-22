"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_TTL = exports.REDIS_PREFIXES = exports.REDIS_CLIENT = exports.REDIS_CONFIG_NAMESPACE = exports.REDIS_SERVICE = void 0;
exports.REDIS_SERVICE = 'REDIS_SERVICE';
exports.REDIS_CONFIG_NAMESPACE = 'redis';
exports.REDIS_CLIENT = 'REDIS_CLIENT';
exports.REDIS_PREFIXES = {
    SESSION: 'session:',
    CACHE: 'cache:',
    RATE_LIMIT: 'rate_limit:',
    QUEUE: 'queue:',
    LOCK: 'lock:',
    TEMP: 'temp:',
};
exports.REDIS_TTL = {
    SESSION: 86400,
    CACHE_SHORT: 300,
    CACHE_MEDIUM: 3600,
    CACHE_LONG: 86400,
    RATE_LIMIT: 900,
    LOCK: 30,
    TEMP: 3600,
};
//# sourceMappingURL=redis.constants.js.map