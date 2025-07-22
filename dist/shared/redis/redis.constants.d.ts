export declare const REDIS_SERVICE = "REDIS_SERVICE";
export declare const REDIS_CONFIG_NAMESPACE = "redis";
export declare const REDIS_CLIENT = "REDIS_CLIENT";
export declare const REDIS_PREFIXES: {
    readonly SESSION: "session:";
    readonly CACHE: "cache:";
    readonly RATE_LIMIT: "rate_limit:";
    readonly QUEUE: "queue:";
    readonly LOCK: "lock:";
    readonly TEMP: "temp:";
};
export declare const REDIS_TTL: {
    readonly SESSION: 86400;
    readonly CACHE_SHORT: 300;
    readonly CACHE_MEDIUM: 3600;
    readonly CACHE_LONG: 86400;
    readonly RATE_LIMIT: 900;
    readonly LOCK: 30;
    readonly TEMP: 3600;
};
