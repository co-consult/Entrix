// src/modules/users/interfaces/anonymous.interface.ts

import { User } from '../types/user.types';
import { IncentiveType } from '../types/enums';
import { ValidationResult } from './user.interface';

// Interface de service utilisateurs anonymes
export interface IAnonymousService {
  // Gestion utilisateurs anonymes
  createAnonymousUser(data: CreateAnonymousData): Promise<AnonymousUser>;
  findByEmail(email: string): Promise<AnonymousUser | null>;
  findByOnboardingKey(key: string): Promise<AnonymousUser | null>;
  
  // Conversion vers utilisateur enregistré
  convertToRegistered(conversionData: ConversionData): Promise<ConversionResult>;
  validateOnboardingKey(key: string): Promise<OnboardingKeyValidation>;
  
  // Onboarding et incentives
  generateOnboardingKey(data: OnboardingKeyData): Promise<string>;
  applyIncentive(userId: string, incentiveType: IncentiveType, value: number): Promise<void>;
  
  // Analytics
  getConversionStats(period?: DateRange): Promise<ConversionStats>;
  getAnonymousStats(): Promise<AnonymousStats>;
}

// Interface de repository anonyme
export interface IAnonymousRepository {
  create(data: CreateAnonymousData): Promise<AnonymousUser>;
  findByEmail(email: string): Promise<AnonymousUser | null>;
  findByOnboardingKey(key: string): Promise<AnonymousUser | null>;
  update(id: string, data: UpdateAnonymousData): Promise<AnonymousUser>;
  delete(id: string): Promise<void>;
  findMany(filters: AnonymousFilters): Promise<AnonymousUser[]>;
  count(filters?: AnonymousFilters): Promise<number>;
}

// Utilisateur anonyme
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

// Données de création d'utilisateur anonyme
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

// Données de mise à jour d'utilisateur anonyme
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

// Données de conversion
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

// Résultat de conversion
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

// Données de clé d'onboarding
export interface OnboardingKeyData {
  anonymousUserId: string;
  incentiveType: IncentiveType;
  incentiveValue: number;
  description: string;
  expiresInHours?: number;
}

// Validation de clé d'onboarding
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

// Filtres pour utilisateurs anonymes
export interface AnonymousFilters {
  converted?: boolean;
  hasIncentive?: boolean;
  incentiveType?: IncentiveType;
  createdAfter?: Date;
  createdBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

// Période de dates
export interface DateRange {
  from: Date;
  to: Date;
}

// Statistiques de conversion
export interface ConversionStats {
  totalAnonymous: number;
  totalConverted: number;
  conversionRate: number;
  averageConversionTime: number; // en heures
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

// Statistiques générales anonymes
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

// Interface de validation anonyme
export interface IAnonymousValidator {
  validateCreateData(data: CreateAnonymousData): ValidationResult;
  validateConversionData(data: ConversionData): ValidationResult;
  validateEmail(email: string): boolean;
  validatePhone(phone: string): boolean;
  validateIncentive(type: IncentiveType, value: number): boolean;
}

// Événement anonyme
export interface AnonymousEvent {
  type: 'ANONYMOUS_CREATED' | 'ONBOARDING_KEY_GENERATED' | 'CONVERSION_ATTEMPTED' | 'CONVERSION_SUCCESSFUL' | 'INCENTIVE_APPLIED';
  anonymousUserId?: string;
  convertedUserId?: string;
  data: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Configuration des incentives
export interface IncentiveConfig {
  type: IncentiveType;
  defaultValue: number;
  maxValue: number;
  description: string;
  isActive: boolean;
  conversionBonus: number; // Bonus supplémentaire pour la conversion
}

// Campagne d'onboarding
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