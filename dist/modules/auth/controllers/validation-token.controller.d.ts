import { LoggerService } from '../../../shared/logger/logger.service';
import { ValidationTokenService } from '../services/validation-token.service';
import { CreateEmailVerificationDto, CreatePasswordResetDto, UsePasswordResetDto, CreateInvitationDto, AcceptInvitationDto, CreateMagicLinkDto, UseMagicLinkDto, CreatePhoneVerificationDto, VerifyPhoneDto, ValidateTokenDto, UseTokenDto, ResendTokenDto, ValidationTokenFiltersDto, ValidationTokenResponseDto, GeneratedValidationTokenResponseDto, TokenValidationResponseDto, TokenUsageResponseDto, ValidationTokenStatsResponseDto, VerifyEmailResponseDto, PasswordResetResponseDto, InvitationResponseDto } from '../dto/validation-tokens/validation-token.dto';
export declare class ValidationTokenController {
    private readonly validationTokenService;
    private readonly logger;
    constructor(validationTokenService: ValidationTokenService, loggerService: LoggerService);
    createEmailVerification(createDto: CreateEmailVerificationDto, clientInfo: any): Promise<GeneratedValidationTokenResponseDto>;
    verifyEmail(useTokenDto: UseTokenDto, clientInfo: any): Promise<VerifyEmailResponseDto>;
    createPasswordReset(createDto: CreatePasswordResetDto, clientInfo: any): Promise<GeneratedValidationTokenResponseDto>;
    resetPassword(resetDto: UsePasswordResetDto, clientInfo: any): Promise<PasswordResetResponseDto>;
    createInvitation(inviterId: string, createDto: CreateInvitationDto): Promise<GeneratedValidationTokenResponseDto>;
    acceptInvitation(acceptDto: AcceptInvitationDto, clientInfo: any): Promise<InvitationResponseDto>;
    createMagicLink(createDto: CreateMagicLinkDto, clientInfo: any): Promise<GeneratedValidationTokenResponseDto>;
    useMagicLink(useDto: UseMagicLinkDto, clientInfo: any): Promise<TokenUsageResponseDto>;
    createPhoneVerification(userId: string, createDto: CreatePhoneVerificationDto): Promise<GeneratedValidationTokenResponseDto>;
    verifyPhone(userId: string, verifyDto: VerifyPhoneDto, clientInfo: any): Promise<TokenUsageResponseDto>;
    validateToken(validateDto: ValidateTokenDto): Promise<TokenValidationResponseDto>;
    resendToken(resendDto: ResendTokenDto, clientInfo: any): Promise<GeneratedValidationTokenResponseDto>;
    getMyTokens(userId: string, filters: ValidationTokenFiltersDto): Promise<ValidationTokenResponseDto[]>;
    getTokenStats(userId: string): Promise<ValidationTokenStatsResponseDto>;
}
