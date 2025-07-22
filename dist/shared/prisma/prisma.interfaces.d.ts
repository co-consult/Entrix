export interface PrismaModuleConfig {
    databaseUrl: string;
    logLevel: 'info' | 'warn' | 'error' | 'query';
    poolMin: number;
    poolMax: number;
}
