export interface BullmqRedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
    tls?: boolean;
}
export interface BullmqModuleConfig {
    prefix: string;
    concurrency: number;
    redis: BullmqRedisConfig;
}
