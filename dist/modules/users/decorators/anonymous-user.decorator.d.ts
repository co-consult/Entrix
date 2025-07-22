export interface AnonymousUserData {
    id?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    onboardingKey?: string;
    incentiveType?: string;
    incentiveValue?: number;
    sessionId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    fingerprint?: string;
}
export declare const AnonymousUser: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | keyof AnonymousUserData)[]) => ParameterDecorator;
export declare const AnonymousUserEmail: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const OnboardingKey: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const AnonymousSessionId: (...dataOrPipes: unknown[]) => ParameterDecorator;
