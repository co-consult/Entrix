export interface RedisModuleConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
    tls?: boolean;
}
