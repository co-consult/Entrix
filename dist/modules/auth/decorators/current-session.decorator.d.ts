export interface SessionContext {
    sessionId: string;
    deviceFingerprint?: string;
    ipAddress: string;
    userAgent: string;
    issuedAt: number;
    expiresAt: number;
}
export declare const CurrentSession: (...dataOrPipes: (keyof SessionContext | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
export declare const SessionId: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const DeviceFingerprint: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const ClientInfo: (...dataOrPipes: ("userAgent" | "ip" | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
