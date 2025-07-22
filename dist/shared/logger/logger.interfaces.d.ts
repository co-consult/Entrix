export interface LoggerModuleConfig {
    level: string;
    format: 'json' | 'simple' | 'pretty';
    enableConsole: boolean;
    enableFile: boolean;
    filePath?: string;
    maxSize?: string;
    maxFiles?: string;
}
