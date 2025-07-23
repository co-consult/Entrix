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
exports.RiskAssessmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class RiskAssessmentDto {
    score;
    factors;
    recommendation;
    requiresMfa;
    details;
}
exports.RiskAssessmentDto = RiskAssessmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Score de risque (0-100)',
        minimum: 0,
        maximum: 100,
    }),
    __metadata("design:type", Number)
], RiskAssessmentDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], RiskAssessmentDto.prototype, "factors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['ALLOW', 'REQUIRE_MFA', 'BLOCK', 'ALERT'],
    }),
    __metadata("design:type", String)
], RiskAssessmentDto.prototype, "recommendation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], RiskAssessmentDto.prototype, "requiresMfa", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], RiskAssessmentDto.prototype, "details", void 0);
//# sourceMappingURL=risk-assessment.dto.js.map