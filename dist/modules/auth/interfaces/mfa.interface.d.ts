import { MfaProvider } from '../constants/auth.constants';
export interface IMfaChallenge {
    methods: MfaProvider[];
    challengeToken: string;
    expiresIn: number;
}
export interface IMfaSetup {
    provider: MfaProvider;
    qrCode?: string;
    secret?: string;
    backupCodes?: string[];
}
export interface IMfaVerification {
    challengeToken: string;
    method: MfaProvider;
    code: string;
    trustDevice?: boolean;
}
export interface IMfaProvider {
    type: MfaProvider;
    setup(userId: string): Promise<IMfaSetup>;
    verify(userId: string, code: string): Promise<boolean>;
    generateChallenge(userId: string): Promise<string>;
    cleanup(userId: string): Promise<void>;
}
export interface IMfaService {
    setupMfa(userId: string, provider: MfaProvider): Promise<IMfaSetup>;
    verifyMfa(verification: IMfaVerification): Promise<boolean>;
    disableMfa(userId: string, provider: MfaProvider): Promise<boolean>;
    getAvailableProviders(userId: string): Promise<MfaProvider[]>;
    requiresMfa(userId: string, riskScore: number): Promise<boolean>;
}
