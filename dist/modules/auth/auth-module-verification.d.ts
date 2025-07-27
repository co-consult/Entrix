declare const verifyConstants: () => void;
declare const verifyPrismaSchema: () => Promise<void>;
declare const verifyTypes: () => void;
declare class MfaMappingVerification {
    static verifyMapping(): void;
    static verifyValidation(): void;
}
declare class ControllerVerification {
    static requiredEndpoints: {
        auth: string[];
        mfa: string[];
    };
    static verifyEndpointsDocumentation(): void;
}
declare class SecurityVerification {
    static verifySecurityFeatures(): void;
    static verifyMfaSecurityConfig(): void;
}
export declare function runAuthModuleVerification(): Promise<boolean>;
export { verifyConstants, verifyPrismaSchema, verifyTypes, MfaMappingVerification, ControllerVerification, SecurityVerification };
