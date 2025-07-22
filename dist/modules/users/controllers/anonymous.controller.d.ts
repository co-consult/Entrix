import { CreateAnonymousDto } from '../dto/anonymous/create-anonymous.dto';
import { ConvertAnonymousDto } from '../dto/anonymous/convert-anonymous.dto';
import { AnonymousService } from '../services/anonymous.service';
import { AnonymousUser, ConversionResult, OnboardingKeyValidation, ConversionStats, AnonymousStats } from '../interfaces/anonymous.interface';
import { IncentiveType } from '../types/enums';
import { StandardResponse, CreatedResponse } from '../types/response.types';
export declare class AnonymousController {
    private readonly anonymousService;
    constructor(anonymousService: AnonymousService);
    create(createAnonymousDto: CreateAnonymousDto): Promise<CreatedResponse<AnonymousUser>>;
    findByEmail(email: string): Promise<StandardResponse<AnonymousUser | null>>;
    findByOnboardingKey(key: string): Promise<StandardResponse<AnonymousUser | null>>;
    convertToRegistered(convertDto: ConvertAnonymousDto): Promise<StandardResponse<ConversionResult>>;
    validateOnboardingKey(key: string): Promise<StandardResponse<OnboardingKeyValidation>>;
    generateOnboardingKey(keyData: {
        anonymousUserId: string;
        incentiveType: IncentiveType;
        incentiveValue: number;
        description: string;
        expiresInHours?: number;
    }): Promise<CreatedResponse<{
        onboardingKey: string;
        expiresAt: Date;
    }>>;
    applyIncentive(incentiveData: {
        userId: string;
        incentiveType: IncentiveType;
        value: number;
    }): Promise<StandardResponse<null>>;
    getConversionStats(from?: string, to?: string): Promise<StandardResponse<ConversionStats>>;
    getAnonymousStats(): Promise<StandardResponse<AnonymousStats>>;
}
