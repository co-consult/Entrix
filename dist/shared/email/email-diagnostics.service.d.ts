import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
interface EmailDiagnosticResult {
    status: 'healthy' | 'warning' | 'error';
    checks: {
        configuration: DiagnosticCheck;
        connectivity: DiagnosticCheck;
        authentication: DiagnosticCheck;
        dnsResolution: DiagnosticCheck;
        testEmail: DiagnosticCheck;
    };
    recommendations: string[];
    summary: string;
}
interface DiagnosticCheck {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: any;
    duration?: number;
}
export declare class EmailDiagnosticsService {
    private readonly config;
    private readonly logger;
    private readonly resolveMx;
    constructor(config: ConfigService, loggerService: LoggerService);
    runFullDiagnostic(): Promise<EmailDiagnosticResult>;
    private checkConfiguration;
    private checkConnectivity;
    private checkAuthentication;
    private checkDnsResolution;
    private checkTestEmail;
    private createDiagnosticTransporter;
    private analyzeConnectionError;
    private analyzeAuthError;
    private analyzeEmailError;
    private generateRecommendations;
    private generateSummary;
    private determineOverallStatus;
    getRecommendedConfigurations(): Record<string, any>;
}
export {};
