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
exports.CreateGroupDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const group_constants_1 = require("../../constants/group.constants");
class GroupPermissionsDto {
    canInvite;
    canPurchase;
    canViewOrders;
    spendingLimit;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Peut inviter de nouveaux membres',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'canInvite doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupPermissionsDto.prototype, "canInvite", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Peut effectuer des achats',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'canPurchase doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupPermissionsDto.prototype, "canPurchase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Peut voir les commandes du groupe',
        example: false,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'canViewOrders doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupPermissionsDto.prototype, "canViewOrders", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Limite de dépense en TND (null = illimitée)',
        example: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La limite de dépense doit être un nombre entier' }),
    (0, class_validator_1.Min)(0, { message: 'La limite de dépense doit être positive' }),
    (0, class_validator_1.Max)(100000, { message: 'La limite de dépense ne peut pas dépasser 100 000 TND' }),
    __metadata("design:type", Number)
], GroupPermissionsDto.prototype, "spendingLimit", void 0);
class GroupSettingsDto {
    isPrivate;
    requireApproval;
    maxMembers;
    allowInvites;
    defaultPermissions;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Groupe privé (non visible publiquement)',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'isPrivate doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "isPrivate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Approbation requise pour rejoindre',
        example: false,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'requireApproval doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "requireApproval", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre maximum de membres',
        example: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le nombre maximum de membres doit être un entier' }),
    (0, class_validator_1.Min)(2, { message: 'Un groupe doit avoir au moins 2 membres maximum' }),
    (0, class_validator_1.Max)(1000, { message: 'Un groupe ne peut pas dépasser 1000 membres' }),
    __metadata("design:type", Number)
], GroupSettingsDto.prototype, "maxMembers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Membres peuvent inviter d\'autres personnes',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'allowInvites doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "allowInvites", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Permissions par défaut pour nouveaux membres',
        type: GroupPermissionsDto,
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GroupPermissionsDto),
    __metadata("design:type", GroupPermissionsDto)
], GroupSettingsDto.prototype, "defaultPermissions", void 0);
class InitialInviteDto {
    email;
    userId;
    name;
    role;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email de la personne à inviter',
        example: 'ami@example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'email doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], InitialInviteDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de l\'utilisateur à inviter',
        example: 'user-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L\'ID utilisateur doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], InitialInviteDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nom de la personne (si email)',
        example: 'Ahmed Amari',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], InitialInviteDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Rôle proposé',
        example: 'MEMBER',
        enum: Object.values(group_constants_1.GROUP_CONSTANTS.ROLES),
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le rôle doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(Object.values(group_constants_1.GROUP_CONSTANTS.ROLES), {
        message: `Le rôle doit être l'un de: ${Object.values(group_constants_1.GROUP_CONSTANTS.ROLES).join(', ')}`,
    }),
    __metadata("design:type", String)
], InitialInviteDto.prototype, "role", void 0);
class CreateGroupDto {
    name;
    description;
    type;
    settings;
    initialInvites;
    metadata;
}
exports.CreateGroupDto = CreateGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom du groupe',
        example: 'Groupe CA Supporters',
        minLength: group_constants_1.GROUP_CONSTANTS.VALIDATION.NAME.MIN_LENGTH,
        maxLength: group_constants_1.GROUP_CONSTANTS.VALIDATION.NAME.MAX_LENGTH,
    }),
    (0, class_validator_1.IsString)({ message: 'Le nom doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(group_constants_1.GROUP_CONSTANTS.VALIDATION.NAME.MIN_LENGTH, {
        message: `Le nom doit contenir au moins ${group_constants_1.GROUP_CONSTANTS.VALIDATION.NAME.MIN_LENGTH} caractères`,
    }),
    (0, class_validator_1.MaxLength)(group_constants_1.GROUP_CONSTANTS.VALIDATION.NAME.MAX_LENGTH, {
        message: `Le nom ne peut pas dépasser ${group_constants_1.GROUP_CONSTANTS.VALIDATION.NAME.MAX_LENGTH} caractères`,
    }),
    (0, class_validator_1.Matches)(group_constants_1.GROUP_CONSTANTS.VALIDATION.NAME.REGEX, {
        message: 'Le nom contient des caractères non autorisés',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description du groupe',
        example: 'Groupe de supporters du Club Africain pour acheter nos billets ensemble',
        maxLength: group_constants_1.GROUP_CONSTANTS.VALIDATION.DESCRIPTION.MAX_LENGTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La description doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(group_constants_1.GROUP_CONSTANTS.VALIDATION.DESCRIPTION.MAX_LENGTH, {
        message: `La description ne peut pas dépasser ${group_constants_1.GROUP_CONSTANTS.VALIDATION.DESCRIPTION.MAX_LENGTH} caractères`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de groupe',
        example: 'FRIENDS',
        enum: Object.values(group_constants_1.GROUP_CONSTANTS.TYPES),
    }),
    (0, class_validator_1.IsString)({ message: 'Le type doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(Object.values(group_constants_1.GROUP_CONSTANTS.TYPES), {
        message: `Le type doit être l'un de: ${Object.values(group_constants_1.GROUP_CONSTANTS.TYPES).join(', ')}`,
    }),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Configuration du groupe',
        type: GroupSettingsDto,
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GroupSettingsDto),
    __metadata("design:type", GroupSettingsDto)
], CreateGroupDto.prototype, "settings", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Invitations initiales à envoyer',
        type: [InitialInviteDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Les invitations initiales doivent être un tableau' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InitialInviteDto),
    __metadata("design:type", Array)
], CreateGroupDto.prototype, "initialInvites", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées additionnelles',
        example: { source: 'web', campaign: 'friends' },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    __metadata("design:type", Object)
], CreateGroupDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-group.dto.js.map