export interface SessionContext {
    sessionId?: string;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
    geolocation?: any;
}
export declare const CurrentSession: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | keyof SessionContext)[]) => ParameterDecorator;
export declare const SessionId: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const DeviceFingerprint: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const ClientInfo: (...dataOrPipes: unknown[]) => ParameterDecorator;
