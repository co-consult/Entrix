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
exports.RevokeSessionResponseDto = exports.SessionsListResponseDto = exports.SessionItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SessionItemDto {
    sessionId;
    deviceInfo;
    location;
    createdAt;
    lastActivity;
    isCurrent;
}
exports.SessionItemDto = SessionItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Identifiant de session',
        example: 'sess_1234567890abcdef'
    }),
    __metadata("design:type", String)
], SessionItemDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations de l\'appareil',
        example: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            browser: 'Chrome',
            os: 'Windows',
            isMobile: false
        }
    }),
    __metadata("design:type", Object)
], SessionItemDto.prototype, "deviceInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Localisation géographique',
        example: 'Tunis, Tunisia'
    }),
    __metadata("design:type", String)
], SessionItemDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date de création de la session (ISO 8601)',
        example: '2025-07-24T10:30:00Z'
    }),
    __metadata("design:type", String)
], SessionItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dernière activité (ISO 8601)',
        example: '2025-07-24T10:45:00Z'
    }),
    __metadata("design:type", String)
], SessionItemDto.prototype, "lastActivity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indique si c\'est la session courante',
        example: true
    }),
    __metadata("design:type", Boolean)
], SessionItemDto.prototype, "isCurrent", void 0);
class SessionsListResponseDto {
    success;
    data;
}
exports.SessionsListResponseDto = SessionsListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de la requête',
        example: true
    }),
    __metadata("design:type", Boolean)
], SessionsListResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Données des sessions',
        type: 'object',
        properties: {
            sessions: {
                type: 'array',
                items: { $ref: '#/components/schemas/SessionItemDto' }
            },
            total: {
                type: 'number',
                example: 3
            }
        }
    }),
    __metadata("design:type", Object)
], SessionsListResponseDto.prototype, "data", void 0);
class RevokeSessionResponseDto {
    success;
    data;
}
exports.RevokeSessionResponseDto = RevokeSessionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Statut de la requête',
        example: true
    }),
    __metadata("design:type", Boolean)
], RevokeSessionResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Résultat de la révocation',
        type: 'object',
        properties: {
            sessionRevoked: {
                type: 'boolean',
                example: true
            },
            sessionId: {
                type: 'string',
                example: 'sess_1234567890abcdef'
            }
        }
    }),
    __metadata("design:type", Object)
], RevokeSessionResponseDto.prototype, "data", void 0);
//# sourceMappingURL=sessions-list-response.dto.js.map