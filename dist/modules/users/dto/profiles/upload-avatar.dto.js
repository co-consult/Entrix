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
exports.UploadAvatarResponseDto = exports.UploadAvatarDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const user_constants_1 = require("../../constants/user.constants");
class UploadAvatarDto {
    replace = true;
    generateSizes = true;
    outputFormat = 'webp';
    quality = 85;
    keepMetadata = false;
}
exports.UploadAvatarDto = UploadAvatarDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Remplacer l\'avatar existant',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'replace doit être un booléen' }),
    __metadata("design:type", Boolean)
], UploadAvatarDto.prototype, "replace", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Générer automatiquement les différentes tailles',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'generateSizes doit être un booléen' }),
    __metadata("design:type", Boolean)
], UploadAvatarDto.prototype, "generateSizes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Format de sortie souhaité',
        example: 'webp',
        enum: user_constants_1.USER_CONSTANTS.AVATAR.ALLOWED_FORMATS,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le format doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(user_constants_1.USER_CONSTANTS.AVATAR.ALLOWED_FORMATS, {
        message: `Le format doit être l'un de: ${user_constants_1.USER_CONSTANTS.AVATAR.ALLOWED_FORMATS.join(', ')}`,
    }),
    __metadata("design:type", String)
], UploadAvatarDto.prototype, "outputFormat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Qualité de compression (1-100)',
        example: 85,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UploadAvatarDto.prototype, "quality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Conserver les métadonnées EXIF',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'keepMetadata doit être un booléen' }),
    __metadata("design:type", Boolean)
], UploadAvatarDto.prototype, "keepMetadata", void 0);
class UploadAvatarResponseDto {
    originalUrl;
    thumbnailUrl;
    sizes;
    uploadedAt;
    fileSize;
    mimeType;
    dimensions;
}
exports.UploadAvatarResponseDto = UploadAvatarResponseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL de l\'avatar original',
        example: 'https://cdn.entrix.tn/avatars/user123/original.webp',
    }),
    __metadata("design:type", String)
], UploadAvatarResponseDto.prototype, "originalUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL de la vignette',
        example: 'https://cdn.entrix.tn/avatars/user123/thumbnail.webp',
    }),
    __metadata("design:type", String)
], UploadAvatarResponseDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URLs des différentes tailles',
        example: {
            small: 'https://cdn.entrix.tn/avatars/user123/50x50.webp',
            medium: 'https://cdn.entrix.tn/avatars/user123/100x100.webp',
            large: 'https://cdn.entrix.tn/avatars/user123/200x200.webp',
            xlarge: 'https://cdn.entrix.tn/avatars/user123/400x400.webp',
        },
    }),
    __metadata("design:type", Object)
], UploadAvatarResponseDto.prototype, "sizes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date de l\'upload',
        example: '2025-07-17T10:30:00Z',
    }),
    __metadata("design:type", String)
], UploadAvatarResponseDto.prototype, "uploadedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Taille du fichier en octets',
        example: 125432,
    }),
    __metadata("design:type", Number)
], UploadAvatarResponseDto.prototype, "fileSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type MIME du fichier',
        example: 'image/webp',
    }),
    __metadata("design:type", String)
], UploadAvatarResponseDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Dimensions de l\'image originale',
        example: { width: 400, height: 400 },
    }),
    __metadata("design:type", Object)
], UploadAvatarResponseDto.prototype, "dimensions", void 0);
//# sourceMappingURL=upload-avatar.dto.js.map