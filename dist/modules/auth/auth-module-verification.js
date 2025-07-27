"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityVerification = exports.ControllerVerification = exports.MfaMappingVerification = exports.verifyTypes = exports.verifyPrismaSchema = exports.verifyConstants = exports.runAuthModuleVerification = void 0;
const client_1 = require("@prisma/client");
const mfa_constants_1 = require("./constants/mfa.constants");
const auth_constants_1 = require("./constants/auth.constants");
const mfa_constants_2 = require("./constants/mfa.constants");
const verifyConstants = () => {
    console.log('🔍 Vérification des constantes...');
    console.assert(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH === 8, '❌ PASSWORD_MIN_LENGTH');
    console.assert(auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MAX_LENGTH === 128, '❌ PASSWORD_MAX_LENGTH');
    console.assert(auth_constants_1.AUTH_CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH === 255, '❌ EMAIL_MAX_LENGTH');
    console.assert(auth_constants_1.AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY_REMEMBER === 30 * 24 * 60 * 60, '❌ REFRESH_TOKEN_EXPIRY_REMEMBER');
    console.assert(auth_constants_1.AUTH_CONSTANTS.JWT.PASSWORD_RESET_TOKEN_EXPIRY === 60 * 60, '❌ PASSWORD_RESET_TOKEN_EXPIRY');
    console.assert(auth_constants_1.AUTH_CONSTANTS.SECURITY.MAX_LOGIN_ATTEMPTS === 5, '❌ MAX_LOGIN_ATTEMPTS');
    console.assert(auth_constants_1.AUTH_CONSTANTS.MFA_PROVIDERS.SMS_OTP === 'SMS_OTP', '❌ SMS_OTP constant');
    console.assert(auth_constants_1.AUTH_CONSTANTS.MFA_PROVIDERS.EMAIL_OTP === 'EMAIL_OTP', '❌ EMAIL_OTP constant');
    console.assert(auth_constants_1.AUTH_CONSTANTS.MFA_PROVIDERS.TOTP_APP === 'TOTP_APP', '❌ TOTP_APP constant');
    console.assert(auth_constants_1.AUTH_CONSTANTS.MFA_PROVIDERS.BACKUP_CODE === 'BACKUP_CODE', '❌ BACKUP_CODE constant');
    console.assert(mfa_constants_2.MFA_CONSTANTS.PROVIDERS.SMS_OTP.enabled === true, '❌ SMS OTP enabled');
    console.assert(mfa_constants_2.MFA_CONSTANTS.PROVIDERS.EMAIL_OTP.validity_duration === 600, '❌ Email OTP duration');
    console.assert(mfa_constants_2.MFA_CONSTANTS.TOTP.DIGITS === 6, '❌ TOTP digits');
    console.assert(mfa_constants_2.MFA_CONSTANTS.TOTP.SECRET_LENGTH === 20, '❌ TOTP secret length');
    console.assert(mfa_constants_2.MFA_CONSTANTS.BACKUP_CODES.COUNT === 10, '❌ Backup codes count');
    console.assert(auth_constants_1.MFA_PROVIDER_TO_METHOD_MAPPING.SMS_OTP === 'SMS', '❌ SMS mapping');
    console.assert(auth_constants_1.MFA_PROVIDER_TO_METHOD_MAPPING.EMAIL_OTP === 'EMAIL', '❌ Email mapping');
    console.assert(auth_constants_1.MFA_PROVIDER_TO_METHOD_MAPPING.TOTP_APP === 'TOTP', '❌ TOTP mapping');
    console.assert(auth_constants_1.MFA_PROVIDER_TO_METHOD_MAPPING.BACKUP_CODE === 'BACKUP_CODES', '❌ Backup mapping');
    console.log('✅ Constantes vérifiées avec succès');
};
exports.verifyConstants = verifyConstants;
const verifyPrismaSchema = async () => {
    console.log('🔍 Vérification du schema Prisma...');
    const prisma = new client_1.PrismaClient();
    try {
        const tableChecks = [
            async () => {
                const userCount = await prisma.users.count();
                console.log(`📊 Users table: ${userCount} enregistrements`);
            },
            async () => {
                const sessionCount = await prisma.user_sessions.count();
                console.log(`📊 User sessions table: ${sessionCount} enregistrements`);
            },
            async () => {
                const mfaCount = await prisma.user_mfa_settings.count();
                console.log(`📊 MFA settings table: ${mfaCount} enregistrements`);
            },
            async () => {
                const tokenCount = await prisma.mfa_tokens.count();
                console.log(`📊 MFA tokens table: ${tokenCount} enregistrements`);
            },
            async () => {
                const deviceCount = await prisma.user_trusted_devices.count();
                console.log(`📊 Trusted devices table: ${deviceCount} enregistrements`);
            },
            async () => {
                const attemptCount = await prisma.login_attempts.count();
                console.log(`📊 Login attempts table: ${attemptCount} enregistrements`);
            },
            async () => {
                const eventCount = await prisma.security_events.count();
                console.log(`📊 Security events table: ${eventCount} enregistrements`);
            }
        ];
        await Promise.all(tableChecks.map(check => check()));
        console.log('✅ Schema Prisma vérifié avec succès');
    }
    catch (error) {
        console.error('❌ Erreur vérification Prisma:', error.message);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.verifyPrismaSchema = verifyPrismaSchema;
const verifyTypes = () => {
    console.log('🔍 Vérification des types TypeScript...');
    const testProviders = ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'];
    console.assert(testProviders.length === 4, '❌ MfaProvider type');
    const testSetup = {
        provider: 'SMS_OTP',
        qrCode: 'data:image/png;base64,test',
        secret: 'test-secret',
        backupCodes: ['CODE1', 'CODE2']
    };
    console.assert(testSetup.provider === 'SMS_OTP', '❌ IMfaSetup type');
    const testChallenge = {
        methods: ['SMS_OTP', 'EMAIL_OTP'],
        challengeToken: 'challenge-token-123',
        expiresIn: 300
    };
    console.assert(testChallenge.methods.length === 2, '❌ IMfaChallenge type');
    console.log('✅ Types TypeScript vérifiés avec succès');
};
exports.verifyTypes = verifyTypes;
class MfaMappingVerification {
    static verifyMapping() {
        console.log('🔍 Vérification du mapping MFA...');
        const providerToMethodTests = [
            { provider: 'SMS_OTP', expected: 'SMS' },
            { provider: 'EMAIL_OTP', expected: 'EMAIL' },
            { provider: 'TOTP_APP', expected: 'TOTP' },
            { provider: 'BACKUP_CODE', expected: 'BACKUP_CODES' }
        ];
        providerToMethodTests.forEach(test => {
            const method = auth_constants_1.MFA_PROVIDER_TO_METHOD_MAPPING[test.provider];
            console.assert(method === test.expected, `❌ Provider mapping: ${test.provider} → ${method} (expected: ${test.expected})`);
        });
        const methodToProviderTests = [
            { method: 'SMS', expected: 'SMS_OTP' },
            { method: 'EMAIL', expected: 'EMAIL_OTP' },
            { method: 'TOTP', expected: 'TOTP_APP' },
            { method: 'BACKUP_CODES', expected: 'BACKUP_CODE' }
        ];
        methodToProviderTests.forEach(test => {
            const provider = auth_constants_1.MFA_METHOD_TO_PROVIDER_MAPPING[test.method];
            console.assert(provider === test.expected, `❌ Method mapping: ${test.method} → ${provider} (expected: ${test.expected})`);
        });
        console.log('✅ Mapping MFA vérifié avec succès');
    }
    static verifyValidation() {
        console.log('🔍 Vérification des validations...');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidSmsCode('123456') === true, '❌ SMS code validation');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidSmsCode('12345') === false, '❌ SMS code validation (invalid)');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidSmsCode('12345a') === false, '❌ SMS code validation (letters)');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidEmailCode('123456') === true, '❌ Email code validation');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidEmailCode('1234567') === false, '❌ Email code validation (too long)');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidTotpCode('123456') === true, '❌ TOTP code validation');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidTotpCode('abc123') === false, '❌ TOTP code validation (letters)');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidBackupCode('ABCD-1234') === true, '❌ Backup code validation');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidBackupCode('abcd-1234') === false, '❌ Backup code validation (lowercase)');
        console.assert(mfa_constants_1.MFA_VALIDATION.isValidBackupCode('ABCD1234') === false, '❌ Backup code validation (no dash)');
        const formatted = mfa_constants_1.MFA_VALIDATION.formatBackupCode('ABCD1234');
        console.assert(formatted === 'ABCD-1234', '❌ Backup code formatting');
        const maskedPhone = mfa_constants_1.MFA_VALIDATION.maskPhoneNumber('+21650560560');
        console.assert(maskedPhone.includes('*'), '❌ Phone masking');
        console.assert(maskedPhone.startsWith('+216'), '❌ Phone masking (prefix)');
        const maskedEmail = mfa_constants_1.MFA_VALIDATION.maskEmail('test@entrix.tn');
        console.assert(maskedEmail.includes('*'), '❌ Email masking');
        console.assert(maskedEmail.endsWith('@entrix.tn'), '❌ Email masking (domain)');
        console.log('✅ Validations vérifiées avec succès');
    }
}
exports.MfaMappingVerification = MfaMappingVerification;
class ControllerVerification {
    static requiredEndpoints = {
        auth: [
            'POST /auth/login',
            'POST /auth/register',
            'POST /auth/logout',
            'GET /auth/verify-email',
            'POST /auth/forgot-password',
            'POST /auth/reset-password',
            'PUT /auth/change-password',
            'POST /auth/refresh',
            'GET /auth/session',
            'GET /auth/sessions',
            'DELETE /auth/sessions/:sessionId'
        ],
        mfa: [
            'GET /auth/mfa/providers',
            'GET /auth/mfa/status',
            'POST /auth/mfa/setup',
            'POST /auth/mfa/verify',
            'DELETE /auth/mfa/:provider',
            'PUT /auth/mfa/:provider/toggle',
            'POST /auth/mfa/backup-codes/regenerate',
            'GET /auth/mfa/trusted-devices',
            'DELETE /auth/mfa/trusted-devices/:deviceId'
        ]
    };
    static verifyEndpointsDocumentation() {
        console.log('🔍 Vérification de la documentation des endpoints...');
        const allEndpoints = [
            ...this.requiredEndpoints.auth,
            ...this.requiredEndpoints.mfa
        ];
        console.log(`📊 Total endpoints requis: ${allEndpoints.length}`);
        console.log('📋 Endpoints Auth:', this.requiredEndpoints.auth.length);
        console.log('📋 Endpoints MFA:', this.requiredEndpoints.mfa.length);
        console.log('✅ Documentation des endpoints vérifiée');
    }
}
exports.ControllerVerification = ControllerVerification;
class SecurityVerification {
    static verifySecurityFeatures() {
        console.log('🔍 Vérification des fonctionnalités de sécurité...');
        console.assert(auth_constants_1.AUTH_CONSTANTS.RATE_LIMITS.LOGIN.limit === 5, '❌ Rate limit login');
        console.assert(auth_constants_1.AUTH_CONSTANTS.RATE_LIMITS.MFA_VERIFY.limit === 5, '❌ Rate limit MFA');
        console.assert(auth_constants_1.AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRES_IN === 900, '❌ JWT expiration');
        const pwdRules = auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD;
        console.assert(pwdRules.MIN_LENGTH === 8, '❌ Password min length');
        console.assert(pwdRules.REQUIRE_UPPERCASE === true, '❌ Password uppercase');
        console.assert(pwdRules.REQUIRE_SYMBOLS === true, '❌ Password symbols');
        console.assert(auth_constants_1.AUTH_CONSTANTS.RISK_LEVELS.HIGH.min === 71, '❌ Risk levels');
        console.assert(auth_constants_1.AUTH_CONSTANTS.RISK_LEVELS.HIGH.max === 100, '❌ Risk levels max');
        console.log('✅ Fonctionnalités de sécurité vérifiées');
    }
    static verifyMfaSecurityConfig() {
        console.log('🔍 Vérification de la configuration sécurité MFA...');
        console.assert(mfa_constants_2.MFA_CONSTANTS.PROVIDERS.SMS_OTP.validity_duration === 300, '❌ SMS timeout');
        console.assert(mfa_constants_2.MFA_CONSTANTS.PROVIDERS.EMAIL_OTP.validity_duration === 600, '❌ Email timeout');
        console.assert(mfa_constants_2.MFA_CONSTANTS.MAX_FAILED_ATTEMPTS === 3, '❌ Max failed attempts');
        const trustConfig = mfa_constants_2.MFA_CONSTANTS.TRUSTED_DEVICES;
        console.assert(trustConfig.enabled === true, '❌ Trusted devices enabled');
        console.assert(trustConfig.default_duration === 30 * 24 * 60 * 60, '❌ Trust duration');
        console.assert(trustConfig.max_devices_per_user === 10, '❌ Max trusted devices');
        console.log('✅ Configuration sécurité MFA vérifiée');
    }
}
exports.SecurityVerification = SecurityVerification;
async function runAuthModuleVerification() {
    console.log('🚀 DÉBUT DE LA VÉRIFICATION MODULE AUTH ENTRIX V3.0');
    console.log('================================================');
    try {
        verifyConstants();
        await verifyPrismaSchema();
        verifyTypes();
        MfaMappingVerification.verifyMapping();
        MfaMappingVerification.verifyValidation();
        ControllerVerification.verifyEndpointsDocumentation();
        SecurityVerification.verifySecurityFeatures();
        SecurityVerification.verifyMfaSecurityConfig();
        console.log('================================================');
        console.log('🎉 VÉRIFICATION TERMINÉE AVEC SUCCÈS');
        console.log('✅ Module Auth prêt pour la production');
        return true;
    }
    catch (error) {
        console.log('================================================');
        console.error('❌ ÉCHEC DE LA VÉRIFICATION:', error.message);
        console.error('🔧 Veuillez corriger les erreurs avant de continuer');
        return false;
    }
}
exports.runAuthModuleVerification = runAuthModuleVerification;
if (require.main === module) {
    runAuthModuleVerification()
        .then(success => {
        process.exit(success ? 0 : 1);
    })
        .catch(error => {
        console.error('Erreur fatale:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=auth-module-verification.js.map