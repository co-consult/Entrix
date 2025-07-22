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
exports.UpdatePrivacyDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class NotificationPreferencesDto {
    email;
    sms;
    push;
    marketing;
    eventUpdates;
    groupInvitations;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notifications par email',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'email doit être un booléen' }),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notifications par SMS',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'sms doit être un booléen' }),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "sms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notifications push',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'push doit être un booléen' }),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "push", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notifications marketing',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'marketing doit être un booléen' }),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "marketing", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notifications de mise à jour d\'événements',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'eventUpdates doit être un booléen' }),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "eventUpdates", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notifications d\'invitations de groupe',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'groupInvitations doit être un booléen' }),
    __metadata("design:type", Boolean)
], NotificationPreferencesDto.prototype, "groupInvitations", void 0);
class PrivacySettingsDto {
    profileVisible;
    showActivity;
    allowFriendRequests;
    showPurchaseHistory;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Profil visible publiquement',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'profileVisible doit être un booléen' }),
    __metadata("design:type", Boolean)
], PrivacySettingsDto.prototype, "profileVisible", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Afficher l\'activité',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'showActivity doit être un booléen' }),
    __metadata("design:type", Boolean)
], PrivacySettingsDto.prototype, "showActivity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Autoriser les demandes d\'amitié',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'allowFriendRequests doit être un booléen' }),
    __metadata("design:type", Boolean)
], PrivacySettingsDto.prototype, "allowFriendRequests", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Afficher l\'historique d\'achats',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'showPurchaseHistory doit être un booléen' }),
    __metadata("design:type", Boolean)
], PrivacySettingsDto.prototype, "showPurchaseHistory", void 0);
class UpdatePrivacyDto {
    notifications;
    privacy;
}
exports.UpdatePrivacyDto = UpdatePrivacyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Préférences de notifications',
        type: NotificationPreferencesDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => NotificationPreferencesDto),
    __metadata("design:type", NotificationPreferencesDto)
], UpdatePrivacyDto.prototype, "notifications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Paramètres de confidentialité',
        type: PrivacySettingsDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PrivacySettingsDto),
    __metadata("design:type", PrivacySettingsDto)
], UpdatePrivacyDto.prototype, "privacy", void 0);
//# sourceMappingURL=update-privacy.dto.js.map