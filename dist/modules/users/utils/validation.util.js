"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtil = void 0;
const constants_1 = require("../constants");
class ValidationUtil {
    static validateEmail(email) {
        const errors = [];
        if (!email) {
            errors.push('L\'email est requis');
            return { isValid: false, errors };
        }
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail.length > constants_1.USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH) {
            errors.push(`L'email ne peut pas dépasser ${constants_1.USER_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH} caractères`);
        }
        if (!constants_1.USER_CONSTANTS.VALIDATION.EMAIL.REGEX.test(trimmedEmail)) {
            errors.push('Format d\'email invalide');
        }
        if (trimmedEmail.includes('+')) {
        }
        const domain = trimmedEmail.split('@')[1];
        if (domain) {
            const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
            if (disposableDomains.includes(domain)) {
                errors.push('Les emails temporaires ne sont pas autorisés');
            }
        }
        return { isValid: errors.length === 0, errors };
    }
    static validatePhone(phone) {
        const errors = [];
        if (!phone) {
            return { isValid: true, errors };
        }
        const trimmedPhone = phone.trim();
        if (trimmedPhone.length > constants_1.USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH) {
            errors.push(`Le téléphone ne peut pas dépasser ${constants_1.USER_CONSTANTS.VALIDATION.PHONE.MAX_LENGTH} caractères`);
        }
        if (!constants_1.USER_CONSTANTS.VALIDATION.PHONE.REGEX.test(trimmedPhone)) {
            errors.push('Format de téléphone invalide (ex: +21697123456)');
        }
        let normalizedPhone = trimmedPhone;
        if (trimmedPhone.startsWith('0')) {
            normalizedPhone = '+216' + trimmedPhone.substring(1);
        }
        else if (trimmedPhone.startsWith('216') && !trimmedPhone.startsWith('+216')) {
            normalizedPhone = '+' + trimmedPhone;
        }
        return {
            isValid: errors.length === 0,
            errors,
            normalizedPhone: errors.length === 0 ? normalizedPhone : undefined
        };
    }
    static validatePassword(password) {
        const errors = [];
        const { VALIDATION: { PASSWORD } } = constants_1.USER_CONSTANTS;
        if (!password) {
            errors.push('Le mot de passe est requis');
            return { isValid: false, errors, strength: 'weak' };
        }
        if (password.length < PASSWORD.MIN_LENGTH) {
            errors.push(`Le mot de passe doit contenir au moins ${PASSWORD.MIN_LENGTH} caractères`);
        }
        if (password.length > PASSWORD.MAX_LENGTH) {
            errors.push(`Le mot de passe ne peut pas dépasser ${PASSWORD.MAX_LENGTH} caractères`);
        }
        if (PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une majuscule');
        }
        if (PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une minuscule');
        }
        if (PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un chiffre');
        }
        if (PASSWORD.REQUIRE_SYMBOLS && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un caractère spécial');
        }
        const commonPasswords = ['123456', 'password', 'azerty', 'qwerty', '123456789', 'password123'];
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Ce mot de passe est trop commun');
        }
        let strength = 'weak';
        let score = 0;
        if (password.length >= 8)
            score++;
        if (password.length >= 12)
            score++;
        if (/[A-Z]/.test(password))
            score++;
        if (/[a-z]/.test(password))
            score++;
        if (/\d/.test(password))
            score++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
            score++;
        if (password.length >= 16)
            score++;
        if (score <= 3)
            strength = 'weak';
        else if (score <= 5)
            strength = 'medium';
        else
            strength = 'strong';
        return { isValid: errors.length === 0, errors, strength };
    }
    static validateGroupName(name) {
        const errors = [];
        const suggestions = [];
        if (!name) {
            errors.push('Le nom du groupe est requis');
            return { isValid: false, errors };
        }
        const trimmedName = name.trim();
        const { VALIDATION: { NAME } } = constants_1.GROUP_CONSTANTS;
        if (trimmedName.length < NAME.MIN_LENGTH) {
            errors.push(`Le nom doit contenir au moins ${NAME.MIN_LENGTH} caractères`);
        }
        if (trimmedName.length > NAME.MAX_LENGTH) {
            errors.push(`Le nom ne peut pas dépasser ${NAME.MAX_LENGTH} caractères`);
        }
        if (!NAME.REGEX.test(trimmedName)) {
            errors.push('Le nom contient des caractères non autorisés (lettres, chiffres, espaces, apostrophes et tirets uniquement)');
            suggestions.push('Supprimez les caractères spéciaux comme @, #, $, etc.');
        }
        const words = trimmedName.toLowerCase().split(/\s+/);
        const inappropriateWords = ['admin', 'support', 'entrix', 'test', 'temp'];
        const foundInappropriate = words.find(word => inappropriateWords.includes(word));
        if (foundInappropriate) {
            errors.push(`Le mot "${foundInappropriate}" n'est pas autorisé dans les noms de groupe`);
            suggestions.push('Choisissez un nom plus descriptif de votre groupe');
        }
        if (trimmedName.length < 10) {
            suggestions.push('Un nom plus descriptif aiderait les autres à comprendre le but du groupe');
        }
        return { isValid: errors.length === 0, errors, suggestions };
    }
    static validateDateOfBirth(dateOfBirth) {
        const errors = [];
        if (!dateOfBirth) {
            return { isValid: true, errors };
        }
        const today = new Date();
        const age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
        }
        if (dateOfBirth > today) {
            errors.push('La date de naissance ne peut pas être dans le futur');
        }
        if (age < 13) {
            errors.push('Vous devez avoir au moins 13 ans pour utiliser Entrix');
        }
        if (age > 120) {
            errors.push('Veuillez vérifier votre date de naissance');
        }
        return { isValid: errors.length === 0, errors, age };
    }
    static validateCountryCode(countryCode) {
        const errors = [];
        if (!countryCode) {
            errors.push('Le code pays est requis');
            return { isValid: false, errors };
        }
        const normalizedCode = countryCode.trim().toUpperCase();
        if (normalizedCode.length !== 2) {
            errors.push('Le code pays doit contenir exactement 2 lettres (norme ISO 3166-1)');
        }
        if (!/^[A-Z]{2}$/.test(normalizedCode)) {
            errors.push('Le code pays doit contenir uniquement des lettres');
        }
        const validCodes = [
            'TN', 'DZ', 'MA', 'LY', 'EG', 'FR', 'DE', 'IT', 'ES', 'GB', 'US', 'CA',
            'AU', 'AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'SY', 'IQ'
        ];
        if (!validCodes.includes(normalizedCode)) {
            errors.push('Code pays non reconnu');
        }
        return { isValid: errors.length === 0, errors, normalizedCode };
    }
    static validateOnboardingKey(key) {
        const errors = [];
        if (!key) {
            errors.push('La clé d\'onboarding est requise');
            return { isValid: false, errors };
        }
        const normalizedKey = key.trim().toUpperCase();
        if (normalizedKey.length < 10) {
            errors.push('La clé d\'onboarding doit contenir au moins 10 caractères');
        }
        if (normalizedKey.length > 50) {
            errors.push('La clé d\'onboarding ne peut pas dépasser 50 caractères');
        }
        const keyPattern = /^ONB_\d{4}_[A-Z]{3}_[A-Z0-9]{6,}$/;
        if (!keyPattern.test(normalizedKey)) {
            errors.push('Format de clé d\'onboarding invalide');
        }
        return { isValid: errors.length === 0, errors, normalizedKey };
    }
    static validateInvitationMessage(message) {
        const errors = [];
        const warnings = [];
        if (!message) {
            return { isValid: true, errors };
        }
        const trimmedMessage = message.trim();
        if (trimmedMessage.length > constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH) {
            errors.push(`Le message ne peut pas dépasser ${constants_1.INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH} caractères`);
        }
        const inappropriatePatterns = [
            /spam/i, /promo/i, /gratuit/i, /urgent/i, /cliquez/i
        ];
        if (inappropriatePatterns.some(pattern => pattern.test(trimmedMessage))) {
            warnings.push('Le message pourrait être considéré comme du spam');
        }
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        const urls = trimmedMessage.match(urlPattern);
        if (urls && urls.length > 2) {
            warnings.push('Évitez de mettre trop de liens dans votre message');
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
    static validateUserData(userData) {
        const errors = [];
        const warnings = [];
        if (userData.email) {
            const emailValidation = this.validateEmail(userData.email);
            errors.push(...emailValidation.errors);
        }
        if (userData.phone) {
            const phoneValidation = this.validatePhone(userData.phone);
            errors.push(...phoneValidation.errors);
        }
        if (userData.password) {
            const passwordValidation = this.validatePassword(userData.password);
            errors.push(...passwordValidation.errors);
            if (passwordValidation.strength === 'weak') {
                warnings.push('Votre mot de passe est faible, considérez le renforcer');
            }
        }
        if (userData.dateOfBirth) {
            const dobValidation = this.validateDateOfBirth(userData.dateOfBirth);
            errors.push(...dobValidation.errors);
        }
        if (userData.country) {
            const countryValidation = this.validateCountryCode(userData.country);
            errors.push(...countryValidation.errors);
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
}
exports.ValidationUtil = ValidationUtil;
//# sourceMappingURL=validation.util.js.map