"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
class UserMapper {
    static fromDb(dbRecord) {
        return {
            id: dbRecord.id,
            email: dbRecord.email,
            firstName: dbRecord.first_name,
            lastName: dbRecord.last_name,
            phone: dbRecord.phone,
            avatar: dbRecord.avatar,
            isActive: dbRecord.is_active,
            emailVerified: dbRecord.email_verified,
            phoneVerified: dbRecord.phone_verified,
            lastLogin: dbRecord.last_login,
            metadata: dbRecord.metadata,
            createdAt: dbRecord.created_at,
            updatedAt: dbRecord.updated_at,
        };
    }
    static toDb(userData) {
        return {
            email: userData.email,
            password: userData.password,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone || null,
            avatar: null,
            is_active: userData.isActive ?? true,
            email_verified: userData.emailVerified || null,
            phone_verified: userData.phoneVerified || null,
            last_login: null,
            metadata: userData.metadata || null,
        };
    }
    static fromRegisterRequest(registerData) {
        return {
            email: registerData.email,
            password: registerData.password,
            firstName: registerData.firstName,
            lastName: registerData.lastName,
            phone: registerData.phone,
            isActive: true,
            emailVerified: null,
            phoneVerified: null,
            metadata: {
                marketingConsent: registerData.marketingConsent || false,
                dateOfBirth: registerData.dateOfBirth,
                onboardingSecret: registerData.onboardingSecret,
                termsAccepted: registerData.termsAccepted,
                registrationDate: new Date().toISOString(),
            },
        };
    }
}
exports.UserMapper = UserMapper;
//# sourceMappingURL=user.interface.js.map