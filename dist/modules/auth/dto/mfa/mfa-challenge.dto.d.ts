import { MfaProvider } from '../../constants/auth.constants';
export declare class MfaChallengeResponseDto {
    methods: MfaProvider[];
    challengeToken: string;
    expiresIn: number;
    instructions: string;
    methodsInfo: Record<string, any>;
}
