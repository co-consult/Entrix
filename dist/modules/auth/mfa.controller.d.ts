import { MfaService } from './mfa.service';
export declare class MfaController {
    private readonly mfaService;
    constructor(mfaService: MfaService);
    createChallenge(req: any): Promise<{}>;
    verify(req: any, dto: {
        code: string;
        method: 'email' | 'sms' | 'totp';
    }): Promise<{}>;
}
