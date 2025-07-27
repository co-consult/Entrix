import { LoggerService } from '../../../shared/logger/logger.service';
import { PersistentTokenService } from '../services/persistent-token.service';
import { CreatePersistentTokenDto, UpdatePersistentTokenDto, GenerateApiKeyDto, RevokePersistentTokenDto, PersistentTokenFiltersDto, PersistentTokenResponseDto, GeneratedPersistentTokenResponseDto, PersistentTokenStatsResponseDto, ValidatePersistentTokenDto, ValidatePersistentTokenResponseDto } from '../dto/persistent-tokens/create-persistent-token.dto';
export declare class PersistentTokenController {
    private readonly persistentTokenService;
    private readonly logger;
    constructor(persistentTokenService: PersistentTokenService, loggerService: LoggerService);
    createToken(userId: string, createTokenDto: CreatePersistentTokenDto): Promise<GeneratedPersistentTokenResponseDto>;
    generateApiKey(userId: string, generateApiKeyDto: GenerateApiKeyDto): Promise<GeneratedPersistentTokenResponseDto>;
    getUserTokens(userId: string, filters: PersistentTokenFiltersDto): Promise<PersistentTokenResponseDto[]>;
    getToken(userId: string, tokenId: string): Promise<PersistentTokenResponseDto>;
    getTokenStats(userId: string): Promise<PersistentTokenStatsResponseDto>;
    updateToken(userId: string, tokenId: string, updateTokenDto: UpdatePersistentTokenDto): Promise<PersistentTokenResponseDto>;
    refreshToken(userId: string, tokenId: string): Promise<GeneratedPersistentTokenResponseDto>;
    revokeToken(userId: string, tokenId: string, revokeDto?: RevokePersistentTokenDto): Promise<void>;
    revokeAllTokens(userId: string, revokeDto?: RevokePersistentTokenDto): Promise<{
        revoked_count: number;
        message: string;
    }>;
    validateToken(userId: string, validateDto: ValidatePersistentTokenDto): Promise<ValidatePersistentTokenResponseDto>;
}
