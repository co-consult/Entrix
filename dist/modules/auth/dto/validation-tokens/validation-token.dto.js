"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationResponseDto = exports.PasswordResetResponseDto = exports.VerifyEmailResponseDto = exports.ValidationTokenStatsResponseDto = exports.TokenUsageResponseDto = exports.TokenValidationResponseDto = exports.GeneratedValidationTokenResponseDto = exports.ValidationTokenResponseDto = exports.ValidationTokenFiltersDto = exports.ResendTokenDto = exports.UseTokenDto = exports.ValidateTokenDto = exports.VerifyPhoneDto = exports.CreatePhoneVerificationDto = exports.UseMagicLinkDto = exports.CreateMagicLinkDto = exports.AcceptInvitationDto = exports.CreateInvitationDto = exports.UsePasswordResetDto = exports.CreatePasswordResetDto = exports.CreateEmailVerificationDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateEmailVerificationDto {
    email;
    verification_type;
    previous_email;
}
exports.CreateEmailVerificationDto = CreateEmailVerificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Adresse email à vérifier' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateEmailVerificationDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['registration', 'email_change'],
        description: 'Type de vérification email'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['registration', 'email_change']),
    __metadata("design:type", String)
], CreateEmailVerificationDto.prototype, "verification_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email précédent (pour changement d\'email)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateEmailVerificationDto.prototype, "previous_email", void 0);
class CreatePasswordResetDto {
    email;
    client_info;
}
exports.CreatePasswordResetDto = CreatePasswordResetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Adresse email du compte' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreatePasswordResetDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations client pour audit' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePasswordResetDto.prototype, "client_info", void 0);
class UsePasswordResetDto {
    token;
    new_password;
    confirm_password;
}
exports.UsePasswordResetDto = UsePasswordResetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token de reset reçu par email' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UsePasswordResetDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nouveau mot de passe',
        minLength: 8,
        example: 'NewSecurePassword123!'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UsePasswordResetDto.prototype, "new_password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Confirmer le nouveau mot de passe' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UsePasswordResetDto.prototype, "confirm_password", void 0);
class CreateInvitationDto {
    email;
    role;
    group_id;
    organization_id;
    permissions;
    welcome_message;
    auto_accept;
}
exports.CreateInvitationDto = CreateInvitationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email de la personne invitée' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rôle à attribuer' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID du groupe/organisation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "group_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID de l\'organisation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "organization_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Permissions spécifiques' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateInvitationDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message de bienvenue personnalisé' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "welcome_message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Acceptation automatique' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateInvitationDto.prototype, "auto_accept", void 0);
class AcceptInvitationDto {
    token;
    firstName;
    lastName;
    password;
    phone;
    terms_accepted;
}
exports.AcceptInvitationDto = AcceptInvitationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token d\'invitation' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptInvitationDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Prénom' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptInvitationDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nom' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptInvitationDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mot de passe' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptInvitationDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Numéro de téléphone' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptInvitationDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Accepter les conditions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AcceptInvitationDto.prototype, "terms_accepted", void 0);
class CreateMagicLinkDto {
    email;
    action;
    redirect_url;
    context_data;
    expires_after_use;
}
exports.CreateMagicLinkDto = CreateMagicLinkDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email pour le magic link' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateMagicLinkDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Action du magic link',
        example: 'login'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMagicLinkDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL de redirection après utilisation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMagicLinkDto.prototype, "redirect_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Données contextuelles' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateMagicLinkDto.prototype, "context_data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expire après utilisation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMagicLinkDto.prototype, "expires_after_use", void 0);
class UseMagicLinkDto {
    token;
    client_info;
}
exports.UseMagicLinkDto = UseMagicLinkDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token du magic link' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UseMagicLinkDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations client' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UseMagicLinkDto.prototype, "client_info", void 0);
class CreatePhoneVerificationDto {
    phone;
    user_id;
}
exports.CreatePhoneVerificationDto = CreatePhoneVerificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Numéro de téléphone' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePhoneVerificationDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID utilisateur (si connecté)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePhoneVerificationDto.prototype, "user_id", void 0);
class VerifyPhoneDto {
    code;
    phone;
}
exports.VerifyPhoneDto = VerifyPhoneDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Code de vérification reçu par SMS' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPhoneDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Numéro de téléphone vérifié' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPhoneDto.prototype, "phone", void 0);
class ValidateTokenDto {
    token;
}
exports.ValidateTokenDto = ValidateTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token à valider' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidateTokenDto.prototype, "token", void 0);
class UseTokenDto {
    token;
    client_info;
}
exports.UseTokenDto = UseTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token à utiliser' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UseTokenDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Informations client pour audit' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UseTokenDto.prototype, "client_info", void 0);
class ResendTokenDto {
    email;
    token_type;
}
exports.ResendTokenDto = ResendTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email pour renvoyer le token' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ResendTokenDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.validation_token_type,
        description: 'Type de token à renvoyer'
    }),
    (0, class_validator_1.IsEnum)(client_1.validation_token_type),
    __metadata("design:type", String)
], ResendTokenDto.prototype, "token_type", void 0);
class ValidationTokenFiltersDto {
    email;
    token_type;
    is_used;
    is_blocked;
    created_after;
    created_before;
}
exports.ValidationTokenFiltersDto = ValidationTokenFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtrer par email' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ValidationTokenFiltersDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.validation_token_type,
        description: 'Filtrer par type'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.validation_token_type),
    __metadata("design:type", String)
], ValidationTokenFiltersDto.prototype, "token_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtrer par statut utilisé' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    __metadata("design:type", Boolean)
], ValidationTokenFiltersDto.prototype, "is_used", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtrer par statut bloqué' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    __metadata("design:type", Boolean)
], ValidationTokenFiltersDto.prototype, "is_blocked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Créés après cette date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    __metadata("design:type", Date)
], ValidationTokenFiltersDto.prototype, "created_after", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Créés avant cette date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    __metadata("design:type", Date)
], ValidationTokenFiltersDto.prototype, "created_before", void 0);
class ValidationTokenResponseDto {
    id;
    token_type;
    email;
    user_id;
    expires_at;
    is_used;
    used_at;
    attempt_count;
    max_attempts;
    is_blocked;
    created_at;
}
exports.ValidationTokenResponseDto = ValidationTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du token' }),
    __metadata("design:type", String)
], ValidationTokenResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type de token' }),
    __metadata("design:type", String)
], ValidationTokenResponseDto.prototype, "token_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email associé' }),
    __metadata("design:type", String)
], ValidationTokenResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID utilisateur' }),
    __metadata("design:type", String)
], ValidationTokenResponseDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date d\'expiration (ISO 8601)' }),
    __metadata("design:type", String)
], ValidationTokenResponseDto.prototype, "expires_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token utilisé' }),
    __metadata("design:type", Boolean)
], ValidationTokenResponseDto.prototype, "is_used", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date d\'utilisation (ISO 8601)' }),
    __metadata("design:type", String)
], ValidationTokenResponseDto.prototype, "used_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre de tentatives' }),
    __metadata("design:type", Number)
], ValidationTokenResponseDto.prototype, "attempt_count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Limite de tentatives' }),
    __metadata("design:type", Number)
], ValidationTokenResponseDto.prototype, "max_attempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token bloqué' }),
    __metadata("design:type", Boolean)
], ValidationTokenResponseDto.prototype, "is_blocked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de création (ISO 8601)' }),
    __metadata("design:type", String)
], ValidationTokenResponseDto.prototype, "created_at", void 0);
class GeneratedValidationTokenResponseDto {
    id;
    token_type;
    email;
    expires_at;
    max_attempts;
    verification_url;
    magic_link_url;
    message;
}
exports.GeneratedValidationTokenResponseDto = GeneratedValidationTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID du token généré' }),
    __metadata("design:type", String)
], GeneratedValidationTokenResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type de token' }),
    __metadata("design:type", String)
], GeneratedValidationTokenResponseDto.prototype, "token_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email de destination' }),
    __metadata("design:type", String)
], GeneratedValidationTokenResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date d\'expiration (ISO 8601)' }),
    __metadata("design:type", String)
], GeneratedValidationTokenResponseDto.prototype, "expires_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre max de tentatives' }),
    __metadata("design:type", Number)
], GeneratedValidationTokenResponseDto.prototype, "max_attempts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL de vérification complète' }),
    __metadata("design:type", String)
], GeneratedValidationTokenResponseDto.prototype, "verification_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL magic link complète' }),
    __metadata("design:type", String)
], GeneratedValidationTokenResponseDto.prototype, "magic_link_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message de confirmation' }),
    __metadata("design:type", String)
], GeneratedValidationTokenResponseDto.prototype, "message", void 0);
class TokenValidationResponseDto {
    isValid;
    errors;
    attempts_remaining;
    is_blocked;
    expires_at;
    can_resend;
}
exports.TokenValidationResponseDto = TokenValidationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token valide' }),
    __metadata("design:type", Boolean)
], TokenValidationResponseDto.prototype, "isValid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Erreurs de validation' }),
    __metadata("design:type", Array)
], TokenValidationResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tentatives restantes' }),
    __metadata("design:type", Number)
], TokenValidationResponseDto.prototype, "attempts_remaining", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Token bloqué' }),
    __metadata("design:type", Boolean)
], TokenValidationResponseDto.prototype, "is_blocked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date d\'expiration' }),
    __metadata("design:type", String)
], TokenValidationResponseDto.prototype, "expires_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Peut renvoyer le token' }),
    __metadata("design:type", Boolean)
], TokenValidationResponseDto.prototype, "can_resend", void 0);
class TokenUsageResponseDto {
    success;
    user_id;
    email;
    action_data;
    next_steps;
    errors;
    message;
}
exports.TokenUsageResponseDto = TokenUsageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Utilisation réussie' }),
    __metadata("design:type", Boolean)
], TokenUsageResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID utilisateur' }),
    __metadata("design:type", String)
], TokenUsageResponseDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email' }),
    __metadata("design:type", String)
], TokenUsageResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Données d\'action' }),
    __metadata("design:type", Object)
], TokenUsageResponseDto.prototype, "action_data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Prochaines étapes' }),
    __metadata("design:type", Array)
], TokenUsageResponseDto.prototype, "next_steps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Erreurs' }),
    __metadata("design:type", Array)
], TokenUsageResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message de succès' }),
    __metadata("design:type", String)
], TokenUsageResponseDto.prototype, "message", void 0);
class ValidationTokenStatsResponseDto {
    total;
    active;
    used;
    expired;
    blocked;
    by_type;
    success_rate;
    recent_activity;
}
exports.ValidationTokenStatsResponseDto = ValidationTokenStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre total de tokens' }),
    __metadata("design:type", Number)
], ValidationTokenStatsResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tokens actifs' }),
    __metadata("design:type", Number)
], ValidationTokenStatsResponseDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tokens utilisés' }),
    __metadata("design:type", Number)
], ValidationTokenStatsResponseDto.prototype, "used", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tokens expirés' }),
    __metadata("design:type", Number)
], ValidationTokenStatsResponseDto.prototype, "expired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tokens bloqués' }),
    __metadata("design:type", Number)
], ValidationTokenStatsResponseDto.prototype, "blocked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Répartition par type',
        example: {
            'EMAIL_VERIFICATION': 15,
            'PASSWORD_RESET': 5,
            'INVITATION_USER': 3
        }
    }),
    __metadata("design:type", Object)
], ValidationTokenStatsResponseDto.prototype, "by_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Taux de succès (%)' }),
    __metadata("design:type", Number)
], ValidationTokenStatsResponseDto.prototype, "success_rate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Activité récente',
        example: {
            last_24h: 8,
            last_7d: 45,
            last_30d: 120
        }
    }),
    __metadata("design:type", Object)
], ValidationTokenStatsResponseDto.prototype, "recent_activity", void 0);
class VerifyEmailResponseDto extends TokenUsageResponseDto {
    email_verified;
    verified_at;
}
exports.VerifyEmailResponseDto = VerifyEmailResponseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email vérifié avec succès' }),
    __metadata("design:type", Boolean)
], VerifyEmailResponseDto.prototype, "email_verified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date de vérification' }),
    __metadata("design:type", String)
], VerifyEmailResponseDto.prototype, "verified_at", void 0);
class PasswordResetResponseDto extends TokenUsageResponseDto {
    password_updated;
    sessions_closed;
}
exports.PasswordResetResponseDto = PasswordResetResponseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mot de passe mis à jour' }),
    __metadata("design:type", Boolean)
], PasswordResetResponseDto.prototype, "password_updated", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sessions fermées' }),
    __metadata("design:type", Number)
], PasswordResetResponseDto.prototype, "sessions_closed", void 0);
class InvitationResponseDto extends TokenUsageResponseDto {
    account_created;
    role_assigned;
    permissions_granted;
}
exports.InvitationResponseDto = InvitationResponseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Compte créé' }),
    __metadata("design:type", Boolean)
], InvitationResponseDto.prototype, "account_created", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Rôle attribué' }),
    __metadata("design:type", String)
], InvitationResponseDto.prototype, "role_assigned", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Permissions accordées' }),
    __metadata("design:type", Array)
], InvitationResponseDto.prototype, "permissions_granted", void 0);
//# sourceMappingURL=validation-token.dto.js.map