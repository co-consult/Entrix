import { User } from '../types/user.types';
import { IncentiveType } from '../types/enums';
import { ValidationResult } from './user.interface';
export interface IAnonymousService {
    createAnonymousUser(data: CreateAnonymousData): Promise<AnonymousUser>;
    findByEmail(email: string): Promise<AnonymousUser | null>;
    findByOnboardingKey(key: string): Promise<AnonymousUser | null>;
    convertToRegistered(conversionData: ConversionData): Promise<ConversionResult>;
    validateOnboardingKey(key: string): Promise<OnboardingKeyValidation>;
    generateOnboardingKey(data: OnboardingKeyData): Promise<string>;
    applyIncentive(userId: string, incentiveType: IncentiveType, value: number): Promise<void>;
    getConversionStats(period?: DateRange): Promise<ConversionStats>;
    getAnonymousStats(): Promise<AnonymousStats>;
}
export interface IAnonymousRepository {
    create(data: CreateAnonymousData): Promise<AnonymousUser>;
    findByEmail(email: string): Promise<AnonymousUser | null>;
    findByOnboardingKey(key: string): Promise<AnonymousUser | null>;
    update(id: string, data: UpdateAnonymousData): Promise<AnonymousUser>;
    delete(id: string): Promise<void>;
    findMany(filters: AnonymousFilters): Promise<AnonymousUser[]>;
    count(filters?: AnonymousFilters): Promise<number>;
}
export interface AnonymousUser {
    id: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    onboardingKey?: string;
    incentiveType?: IncentiveType;
    incentiveValue?: number;
    incentiveDescription?: string;
    expiresAt?: Date;
    converted: boolean;
    convertedAt?: Date;
    convertedUserId?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateAnonymousData {
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    incentiveType?: IncentiveType;
    incentiveValue?: number;
    incentiveDescription?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
}
export interface UpdateAnonymousData {
    guestName?: string;
    guestPhone?: string;
    incentiveType?: IncentiveType;
    incentiveValue?: number;
    incentiveDescription?: string;
    expiresAt?: Date;
    converted?: boolean;
    convertedAt?: Date;
    convertedUserId?: string;
    metadata?: Record<string, any>;
}
export interface ConversionData {
    onboardingKey: string;
    userData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        password: string;
    };
    profileData?: {
        city?: string;
        country?: string;
        language?: string;
        dateOfBirth?: Date;
        gender?: 'M' | 'F' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    };
    acceptedTerms: boolean;
    marketingConsent?: boolean;
}
export interface ConversionResult {
    success: boolean;
    user?: User;
    incentiveApplied: boolean;
    incentiveDetails?: {
        type: IncentiveType;
        value: number;
        description: string;
    };
    errors?: string[];
    migrationSummary?: {
        ticketsMigrated: number;
        subscriptionsMigrated: number;
        ordersMigrated: number;
    };
}
export interface OnboardingKeyData {
    anonymousUserId: string;
    incentiveType: IncentiveType;
    incentiveValue: number;
    description: string;
    expiresInHours?: number;
}
export interface OnboardingKeyValidation {
    isValid: boolean;
    isExpired: boolean;
    isUsed: boolean;
    anonymousUser?: AnonymousUser;
    incentiveDetails?: {
        type: IncentiveType;
        value: number;
        description: string;
    };
    errors?: string[];
}
export interface AnonymousFilters {
    converted?: boolean;
    hasIncentive?: boolean;
    incentiveType?: IncentiveType;
    createdAfter?: Date;
    createdBefore?: Date;
    expiresAfter?: Date;
    expiresBefore?: Date;
}
export interface DateRange {
    from: Date;
    to: Date;
}
export interface ConversionStats {
    totalAnonymous: number;
    totalConverted: number;
    conversionRate: number;
    averageConversionTime: number;
    conversionsByIncentive: Array<{
        incentiveType: IncentiveType;
        total: number;
        converted: number;
        rate: number;
    }>;
    conversionTrend: Array<{
        date: string;
        anonymous: number;
        converted: number;
        rate: number;
    }>;
    topIncentives: Array<{
        type: IncentiveType;
        description: string;
        totalUsed: number;
        conversionRate: number;
    }>;
}
export interface AnonymousStats {
    totalAnonymous: number;
    activeAnonymous: number;
    expiredAnonymous: number;
    convertedAnonymous: number;
    pendingConversion: number;
    averageTimeToConversion: number;
    mostEffectiveIncentive: {
        type: IncentiveType;
        conversionRate: number;
    };
}
export interface IAnonymousValidator {
    validateCreateData(data: CreateAnonymousData): ValidationResult;
    validateConversionData(data: ConversionData): ValidationResult;
    validateEmail(email: string): boolean;
    validatePhone(phone: string): boolean;
    validateIncentive(type: IncentiveType, value: number): boolean;
}
export interface AnonymousEvent {
    type: 'ANONYMOUS_CREATED' | 'ONBOARDING_KEY_GENERATED' | 'CONVERSION_ATTEMPTED' | 'CONVERSION_SUCCESSFUL' | 'INCENTIVE_APPLIED';
    anonymousUserId?: string;
    convertedUserId?: string;
    data: Record<string, any>;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface IncentiveConfig {
    type: IncentiveType;
    defaultValue: number;
    maxValue: number;
    description: string;
    isActive: boolean;
    conversionBonus: number;
}
export interface OnboardingCampaign {
    id: string;
    name: string;
    description: string;
    incentiveType: IncentiveType;
    incentiveValue: number;
    isActive: boolean;
    validFrom: Date;
    validUntil: Date;
    targetAudience?: {
        eventTypes?: string[];
        locations?: string[];
        demographics?: Record<string, any>;
    };
    stats: {
        totalSent: number;
        totalConverted: number;
        conversionRate: number;
    };
}
