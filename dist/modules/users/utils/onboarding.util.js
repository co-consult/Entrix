"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingUtil = void 0;
const crypto_1 = require("crypto");
const enums_1 = require("../types/enums");
class OnboardingUtil {
    static generateOnboardingKey(prefix = 'ONB', context = 'GEN', length = 8) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const randomPart = (0, crypto_1.randomBytes)(Math.ceil(length / 2))
            .toString('hex')
            .toUpperCase()
            .substring(0, length);
        return `${prefix}_${year}${month}_${context}_${randomPart}`;
    }
    static generateContextualOnboardingKey(options) {
        let context = 'GEN';
        if (options.eventType) {
            const eventContexts = {
                'SPORT': 'SPT',
                'MUSIC': 'MUS',
                'CULTURE': 'CUL',
                'BUSINESS': 'BIZ',
                'EDUCATION': 'EDU',
                'ENTERTAINMENT': 'ENT',
            };
            context = eventContexts[options.eventType] || 'EVT';
        }
        if (options.ticketType) {
            const ticketContexts = {
                'VIP': 'VIP',
                'PREMIUM': 'PRM',
                'STANDARD': 'STD',
                'STUDENT': 'STU',
            };
            const ticketContext = ticketContexts[options.ticketType];
            if (ticketContext) {
                context = `${context}${ticketContext}`;
            }
        }
        return this.generateOnboardingKey('ONB', context);
    }
    static validateOnboardingKeyFormat(key) {
        const errors = [];
        if (!key || typeof key !== 'string') {
            errors.push('Clé d\'onboarding invalide');
            return { isValid: false, errors };
        }
        const normalizedKey = key.trim().toUpperCase();
        const parts = normalizedKey.split('_');
        if (parts.length !== 4) {
            errors.push('Format de clé incorrect (attendu: PREFIX_YYYYMM_CONTEXT_RANDOM)');
            return { isValid: false, errors };
        }
        const [prefix, yearMonth, context, random] = parts;
        if (prefix !== 'ONB') {
            errors.push('Préfixe de clé invalide');
        }
        if (!/^\d{6}$/.test(yearMonth)) {
            errors.push('Format date invalide dans la clé');
        }
        else {
            const year = parseInt(yearMonth.substring(0, 4));
            const month = parseInt(yearMonth.substring(4, 6));
            if (year < 2020 || year > 2030) {
                errors.push('Année invalide dans la clé');
            }
            if (month < 1 || month > 12) {
                errors.push('Mois invalide dans la clé');
            }
        }
        if (!/^[A-Z]{3,8}$/.test(context)) {
            errors.push('Contexte invalide dans la clé');
        }
        if (!/^[A-Z0-9]{6,12}$/.test(random)) {
            errors.push('Partie aléatoire invalide dans la clé');
        }
        const isValid = errors.length === 0;
        return {
            isValid,
            parts: isValid ? { prefix, yearMonth, context, random } : undefined,
            errors,
        };
    }
    static generateKeyHash(key, salt) {
        const actualSalt = salt || (0, crypto_1.randomBytes)(16).toString('hex');
        return (0, crypto_1.createHash)('sha256')
            .update(key + actualSalt)
            .digest('hex');
    }
    static determineIncentive(context) {
        if (context.userHistory === 'vip' || (context.ticketPrice && context.ticketPrice > 200)) {
            return {
                type: enums_1.IncentiveType.EXCLUSIVE_ACCESS,
                value: 30,
                description: 'Accès exclusif VIP aux ventes privées pendant 30 jours',
                priority: 'high',
            };
        }
        if (context.groupSize && context.groupSize > 3) {
            const bonusPoints = Math.min(context.groupSize * 25, 200);
            return {
                type: enums_1.IncentiveType.BONUS_POINTS,
                value: bonusPoints,
                description: `${bonusPoints} points bonus pour votre achat en groupe`,
                priority: 'medium',
            };
        }
        if (context.eventType === 'SPORT') {
            if (context.ticketPrice && context.ticketPrice > 100) {
                return {
                    type: enums_1.IncentiveType.FREE_UPGRADE,
                    value: 1,
                    description: 'Surclassement gratuit sur votre prochain achat',
                    priority: 'high',
                };
            }
            else {
                return {
                    type: enums_1.IncentiveType.BONUS_POINTS,
                    value: 100,
                    description: '100 points fidélité supporter à l\'inscription',
                    priority: 'medium',
                };
            }
        }
        if (context.eventType === 'MUSIC') {
            return {
                type: enums_1.IncentiveType.DISCOUNT_NEXT,
                value: 15,
                description: '15% de réduction sur votre prochain concert',
                priority: 'medium',
            };
        }
        if (context.eventType === 'CULTURE') {
            const voucherValue = Math.max(20, Math.floor((context.ticketPrice || 50) * 0.2));
            return {
                type: enums_1.IncentiveType.GIFT_VOUCHER,
                value: voucherValue,
                description: `Bon d'achat de ${voucherValue} TND pour les événements culturels`,
                priority: 'medium',
            };
        }
        if (context.userHistory === 'new') {
            return {
                type: enums_1.IncentiveType.BONUS_POINTS,
                value: 150,
                description: '150 points de bienvenue + accès aux offres exclusives',
                priority: 'high',
            };
        }
        if (context.campaign) {
            const campaignIncentives = {
                'summer2025': {
                    type: enums_1.IncentiveType.DISCOUNT_NEXT,
                    value: 20,
                    description: 'Offre été 2025 : 20% sur votre prochain achat',
                    priority: 'high',
                },
                'student': {
                    type: enums_1.IncentiveType.BONUS_POINTS,
                    value: 75,
                    description: '75 points étudiants + réductions exclusives',
                    priority: 'medium',
                },
                'family': {
                    type: enums_1.IncentiveType.FREE_UPGRADE,
                    value: 2,
                    description: '2 surclassements famille gratuits',
                    priority: 'high',
                },
            };
            if (campaignIncentives[context.campaign]) {
                return campaignIncentives[context.campaign];
            }
        }
        return {
            type: enums_1.IncentiveType.BONUS_POINTS,
            value: 100,
            description: '100 points bonus à l\'inscription sur Entrix',
            priority: 'medium',
        };
    }
    static calculateExpirationDate(incentiveType, customHours) {
        const now = new Date();
        let hoursToAdd = customHours;
        if (!hoursToAdd) {
            const defaultDurations = {
                [enums_1.IncentiveType.BONUS_POINTS]: 168,
                [enums_1.IncentiveType.DISCOUNT_NEXT]: 240,
                [enums_1.IncentiveType.FREE_UPGRADE]: 336,
                [enums_1.IncentiveType.EXCLUSIVE_ACCESS]: 120,
                [enums_1.IncentiveType.GIFT_VOUCHER]: 720,
            };
            hoursToAdd = defaultDurations[incentiveType] || 168;
        }
        return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    }
    static generateOnboardingMessage(guestName, incentive, context) {
        const firstName = guestName.split(' ')[0];
        let subject = `${firstName}, vos billets sont prêts`;
        if (context?.eventName) {
            subject += ` pour ${context.eventName}`;
        }
        subject += ' + Surprise exclusive !';
        const greeting = `Bonjour ${firstName},`;
        const incentiveEmojis = {
            [enums_1.IncentiveType.BONUS_POINTS]: '⭐',
            [enums_1.IncentiveType.DISCOUNT_NEXT]: '💰',
            [enums_1.IncentiveType.FREE_UPGRADE]: '🎁',
            [enums_1.IncentiveType.EXCLUSIVE_ACCESS]: '🔥',
            [enums_1.IncentiveType.GIFT_VOUCHER]: '🎫',
        };
        const emoji = incentiveEmojis[incentive.type] || '🎉';
        const incentiveText = `${emoji} OFFRE EXCLUSIVE POUR VOUS :\n${incentive.description}`;
        const callToAction = `Créez votre compte Entrix en 30 secondes pour débloquer cet avantage :`;
        let footer = 'L\'équipe Entrix';
        if (context?.organizerName) {
            footer = `${context.organizerName} & l'équipe Entrix`;
        }
        return {
            subject,
            greeting,
            incentiveText,
            callToAction,
            footer,
        };
    }
    static generateOnboardingUrl(onboardingKey, baseUrl = 'https://entrix.tn', additionalParams) {
        const url = new URL(`${baseUrl}/onboard/${onboardingKey}`);
        url.searchParams.set('utm_source', 'onboarding');
        url.searchParams.set('utm_medium', 'email');
        url.searchParams.set('utm_campaign', 'conversion');
        if (additionalParams) {
            Object.entries(additionalParams).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }
        return url.toString();
    }
    static isKeyExpired(expiresAt) {
        return new Date() > expiresAt;
    }
    static getTimeUntilExpiration(expiresAt) {
        const now = new Date();
        const diffMs = expiresAt.getTime() - now.getTime();
        const isExpired = diffMs <= 0;
        if (isExpired) {
            return {
                isExpired: true,
                totalHours: 0,
                totalDays: 0,
                humanReadable: 'Expiré',
            };
        }
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        const totalDays = Math.floor(totalHours / 24);
        const remainingHours = totalHours % 24;
        let humanReadable = '';
        if (totalDays > 0) {
            humanReadable = `${totalDays} jour${totalDays > 1 ? 's' : ''}`;
            if (remainingHours > 0) {
                humanReadable += ` et ${remainingHours} heure${remainingHours > 1 ? 's' : ''}`;
            }
        }
        else {
            humanReadable = `${totalHours} heure${totalHours > 1 ? 's' : ''}`;
        }
        return {
            isExpired: false,
            totalHours,
            totalDays,
            humanReadable,
        };
    }
    static generateOnboardingStats(onboardingData) {
        const now = new Date();
        const total = onboardingData.length;
        const active = onboardingData.filter(item => !item.converted && item.expiresAt > now).length;
        const expired = onboardingData.filter(item => !item.converted && item.expiresAt <= now).length;
        const converted = onboardingData.filter(item => item.converted).length;
        const conversionRate = total > 0 ? (converted / total) * 100 : 0;
        const convertedItems = onboardingData.filter(item => item.converted && item.convertedAt);
        const averageTimeToConversion = convertedItems.length > 0
            ? convertedItems.reduce((sum, item) => {
                const diffMs = item.convertedAt.getTime() - item.createdAt.getTime();
                return sum + (diffMs / (1000 * 60 * 60));
            }, 0) / convertedItems.length
            : 0;
        const incentiveEffectiveness = {};
        Object.values(enums_1.IncentiveType).forEach(type => {
            const itemsOfType = onboardingData.filter(item => item.incentiveType === type);
            const convertedOfType = itemsOfType.filter(item => item.converted);
            incentiveEffectiveness[type] = {
                total: itemsOfType.length,
                converted: convertedOfType.length,
                rate: itemsOfType.length > 0 ? (convertedOfType.length / itemsOfType.length) * 100 : 0,
            };
        });
        return {
            total,
            active,
            expired,
            converted,
            conversionRate,
            averageTimeToConversion,
            incentiveEffectiveness,
        };
    }
}
exports.OnboardingUtil = OnboardingUtil;
//# sourceMappingURL=onboarding.util.js.map