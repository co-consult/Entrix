// src/modules/auth/dto/index.ts
/**
 * Export centralisé de tous les DTOs d'authentification
 * 
 * Organisation :
 * - DTOs de requête (validation des données entrantes)
 * - DTOs de réponse (format des données sortantes)
 * - DTOs pour chaque endpoint du module auth
 * 
 * Utilisation :
 * import { LoginDto, RegisterDto, AuthResponseDto } from '@modules/auth/dto';
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

// DTOs de base pour login/register
export { LoginDto } from './login.dto';
export { RegisterDto } from './register.dto';
export { RefreshTokenDto } from './refresh-token.dto';

// DTOs pour gestion mot de passe
export { ForgotPasswordDto } from './forgot-password.dto';
export { ResetPasswordDto } from './reset-password.dto';
export { ChangePasswordDto } from './change-password.dto';

// DTOs pour vérification
export { VerifyEmailDto, ResendVerificationEmailDto } from './verify-email.dto';
export { VerifyPhoneDto, SendPhoneVerificationDto } from './verify-phone.dto';
export { SendVerificationDto, SendVerificationResponseDto, VerificationType } from './send-verification.dto';

// DTOs pour MFA
export { MfaEnableDto } from './mfa-enable.dto';
export { MfaVerifyDto } from './mfa-verify.dto';
export { MfaDisableDto } from './mfa-disable.dto';
export { 
  GenerateBackupCodesDto, 
  UseBackupCodeDto, 
  RevokeBackupCodesDto, 
  BackupCodesResponseDto 
} from './mfa-backup-codes.dto';

// DTOs pour sessions
export { LogoutDto } from './logout.dto';
export { LogoutAllDto, LogoutAllResponseDto } from './logout-all.dto';
export { 
  SessionInfoDto, 
  UserSessionsDto, 
  GeolocationDto,
  CurrentSessionDto,
  SessionStatsDto,
  GeolocationCoordinatesDto,
  DeviceInfoDto,
  SessionSecurityInfoDto
} from './session-info.dto';

// DTOs de réponse
export { AuthResponseDto } from './auth-response.dto';
export { TokenPairDto } from './token-pair.dto';
export { UserInfoDto, UserRoleDto } from './user-info.dto';
export { MfaConfigDto, MfaMethodConfigDto, BackupCodesInfoDto } from './mfa-config.dto';

// Types spécifiques aux DTOs (préfixés pour éviter conflits)
export {
  // Enums DTOs
  DtoVerificationTypeEnum,
  DtoDeliveryMethodEnum,
  DtoSecurityLevelEnum,
  DtoAuthenticationTypeEnum,
  DtoSessionStatusEnum,
  DtoSecurityEventTypeEnum,
  
  // Interfaces DTOs
  DtoBaseResponse,
  DtoDataResponse,
  DtoErrorResponse,
  DtoPaginatedResponse,
  DtoRequestMetadata,
  DtoSecurityInfo,
  DtoSecurityPolicyConfig,
  DtoValidationOptions,
  DtoAuthContext,
  
  // Types DTOs
  DtoVerificationType,
  DtoDeliveryMethod,
  DtoSecurityLevel,
  DtoAuthenticationType,
  DtoSessionStatus,
  DtoSecurityEventType,
  
  // Constantes DTOs
  DTO_DEFAULT_CONFIG,
  DTO_ERROR_MESSAGES,
  DTO_CUSTOM_STATUS_CODES,
} from './auth.types';

// Types communs d'authentification (imports corrigés)
export type {
  AuthResponse,
  AuthUser,
  TokenPair,
  SessionInfo,
  LoginAttempt,
  SecurityEvent,
  BlacklistEntry,
  SecurityPolicy,
  JwtPayload,
  RefreshTokenPayload,
  AuthContext,
  MfaConfig,
} from '../../../common/types/auth.types';

// Import UserSession depuis le bon fichier
export type { UserSession } from '../../../common/types/user.types';