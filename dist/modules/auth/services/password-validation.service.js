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
exports.PasswordValidationService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const auth_constants_1 = require("../constants/auth.constants");
let PasswordValidationService = class PasswordValidationService {
    logger;
    constructor(loggerService) {
        this.logger = loggerService.createChildLogger('PasswordValidationService');
    }
    async validatePasswordStrength(password) {
        const operationId = this.logger.startOperation('validatePasswordStrength');
        try {
            let score = 0;
            const suggestions = [];
            if (password.length < auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
                suggestions.push(auth_constants_1.AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.TOO_SHORT.replace('{min}', auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH.toString()));
                this.logger.endOperation('validatePasswordStrength', operationId, false);
                return {
                    isValid: false,
                    score: 0,
                    strength: 'weak',
                    suggestions,
                };
            }
            score += Math.min(25, (password.length - auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) * auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.LENGTH_BONUS);
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumbers = /[0-9]/.test(password);
            const hasSymbols = /[^A-Za-z0-9]/.test(password);
            if (hasUppercase) {
                score += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.UPPERCASE_BONUS;
            }
            else {
                suggestions.push(auth_constants_1.AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.ADD_UPPERCASE);
            }
            if (hasLowercase) {
                score += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.LOWERCASE_BONUS;
            }
            else {
                suggestions.push(auth_constants_1.AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.ADD_LOWERCASE);
            }
            if (hasNumbers) {
                score += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.NUMBERS_BONUS;
            }
            else {
                suggestions.push(auth_constants_1.AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.ADD_NUMBERS);
            }
            if (hasSymbols) {
                score += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.SYMBOLS_BONUS;
            }
            else {
                suggestions.push(auth_constants_1.AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.ADD_SYMBOLS);
            }
            if (hasUppercase && hasLowercase) {
                score += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.MIXED_CASE_BONUS;
            }
            if (hasNumbers && password.length > 2) {
                const middleNumbers = password.slice(1, -1).match(/[0-9]/g);
                if (middleNumbers) {
                    score += middleNumbers.length * auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.MIDDLE_NUMBERS_BONUS;
                }
            }
            if (hasSymbols && password.length > 2) {
                const middleSymbols = password.slice(1, -1).match(/[^A-Za-z0-9]/g);
                if (middleSymbols) {
                    score += middleSymbols.length * auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.MIDDLE_SYMBOLS_BONUS;
                }
            }
            score += this.calculatePenalties(password);
            this.addPenaltySuggestions(password, suggestions);
            const finalScore = Math.max(0, Math.min(100, score));
            const isValid = finalScore >= auth_constants_1.AUTH_CONSTANTS.PASSWORD.MIN_STRENGTH_SCORE;
            const validation = {
                isValid,
                score: finalScore,
                strength: this.getPasswordStrengthLevel(finalScore),
                suggestions: isValid ? [] : suggestions,
            };
            this.logger.endOperation('validatePasswordStrength', operationId, true);
            this.logger.info('Password strength validated', JSON.stringify({
                score: finalScore,
                strength: validation.strength,
                isValid,
                suggestionCount: suggestions.length,
            }));
            return validation;
        }
        catch (error) {
            this.logger.endOperation('validatePasswordStrength', operationId, false);
            this.logger.error('Failed to validate password strength', error.stack, 'PasswordValidationService.validatePasswordStrength', JSON.stringify({ errorMessage: error.message }));
            return {
                isValid: false,
                score: 0,
                strength: 'weak',
                suggestions: ['Erreur de validation. Veuillez réessayer.'],
            };
        }
    }
    calculatePenalties(password) {
        let penalties = 0;
        const lowerPassword = password.toLowerCase();
        for (const pattern of auth_constants_1.AUTH_CONSTANTS.PASSWORD.WEAK_PATTERNS) {
            if (lowerPassword.includes(pattern.toLowerCase())) {
                penalties += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.COMMON_PATTERNS_PENALTY;
                break;
            }
        }
        const repeatedChars = password.match(/(.)\1{2,}/g);
        if (repeatedChars) {
            penalties += repeatedChars.length * auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.REPEAT_CHARS_PENALTY;
        }
        penalties += this.checkSequentialPenalties(password);
        if (/^[A-Za-z]+$/.test(password)) {
            penalties += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.LETTERS_ONLY_PENALTY;
        }
        if (/^[0-9]+$/.test(password)) {
            penalties += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.NUMBERS_ONLY_PENALTY;
        }
        return penalties;
    }
    checkSequentialPenalties(password) {
        let penalties = 0;
        const lowerPassword = password.toLowerCase();
        for (const sequence of auth_constants_1.AUTH_CONSTANTS.PASSWORD.LETTER_SEQUENCES) {
            if (lowerPassword.includes(sequence) || lowerPassword.includes(sequence.split('').reverse().join(''))) {
                penalties += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.SEQUENTIAL_LETTERS_PENALTY;
            }
        }
        for (const sequence of auth_constants_1.AUTH_CONSTANTS.PASSWORD.NUMBER_SEQUENCES) {
            if (password.includes(sequence) || password.includes(sequence.split('').reverse().join(''))) {
                penalties += auth_constants_1.AUTH_CONSTANTS.PASSWORD.SCORING.SEQUENTIAL_NUMBERS_PENALTY;
            }
        }
        return penalties;
    }
    addPenaltySuggestions(password, suggestions) {
        const lowerPassword = password.toLowerCase();
        for (const pattern of auth_constants_1.AUTH_CONSTANTS.PASSWORD.WEAK_PATTERNS) {
            if (lowerPassword.includes(pattern.toLowerCase())) {
                suggestions.push(auth_constants_1.AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.AVOID_PATTERNS);
                break;
            }
        }
        if (/(.)\1{2,}/.test(password)) {
            suggestions.push(auth_constants_1.AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.AVOID_REPETITION);
        }
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSymbols = /[^A-Za-z0-9]/.test(password);
        const typeCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;
        if (typeCount < 3) {
            suggestions.push(auth_constants_1.AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.MIX_CHARACTER_TYPES);
        }
        if (password.length < 12 && suggestions.length > 3) {
            suggestions.push(auth_constants_1.AUTH_CONSTANTS.PASSWORD.SUGGESTIONS.USE_PASSPHRASE);
        }
        const uniqueSuggestions = [...new Set(suggestions)];
        suggestions.length = 0;
        suggestions.push(...uniqueSuggestions.slice(0, 5));
    }
    getPasswordStrengthLevel(score) {
        if (score < auth_constants_1.AUTH_CONSTANTS.PASSWORD.WEAK_SCORE_THRESHOLD) {
            return 'weak';
        }
        else if (score < auth_constants_1.AUTH_CONSTANTS.PASSWORD.MEDIUM_SCORE_THRESHOLD) {
            return 'medium';
        }
        else {
            return 'strong';
        }
    }
    async isPasswordValid(password) {
        try {
            const validation = await this.validatePasswordStrength(password);
            return validation.isValid;
        }
        catch (error) {
            this.logger.error('Error checking password validity', error.stack);
            return false;
        }
    }
    async getPasswordSuggestions(password) {
        try {
            const validation = await this.validatePasswordStrength(password);
            return validation.suggestions;
        }
        catch (error) {
            this.logger.error('Error getting password suggestions', error.stack);
            return ['Erreur lors de la génération des suggestions'];
        }
    }
    async isPasswordAcceptableForSecurityLevel(password, securityLevel) {
        const validation = await this.validatePasswordStrength(password);
        const requiredScores = {
            low: 40,
            medium: auth_constants_1.AUTH_CONSTANTS.PASSWORD.MIN_STRENGTH_SCORE,
            high: 80,
        };
        return validation.score >= requiredScores[securityLevel];
    }
};
exports.PasswordValidationService = PasswordValidationService;
exports.PasswordValidationService = PasswordValidationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], PasswordValidationService);
//# sourceMappingURL=password-validation.service.js.map