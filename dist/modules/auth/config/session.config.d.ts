import { ConfigService } from '@nestjs/config';
export interface SessionConfig {
    defaultDuration: number;
    rememberMeDuration: number;
    idleTimeout: number;
    maxConcurrentSessions: number;
    cleanupInterval: number;
    redis: {
        keyPrefix: string;
        ttl: number;
    };
}
export declare const getSessionConfig: (configService: ConfigService) => SessionConfig;
