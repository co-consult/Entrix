// src/modules/auth/dto/index.ts

/**
 * Index des DTOs Auth Entrix V3.0
 * Export centralisé pour imports simplifiés
 * 
 * Usage:
 * import { LoginDto, RegisterDto, MfaVerifyDto } from '../dto';
 */

// ========================
// AUTH DTOs
// ========================
export * from './auth/login.dto';
export * from './auth/register.dto';
export * from './auth/login-response.dto';
export * from './auth/register-response.dto';

// ========================
// SESSION DTOs
// ========================
export * from './session/refresh-token.dto';
export * from './session/logout.dto';
export * from './session/device-info.dto';
export * from './session/device-info.dto';
export * from './session/sessions-list.dto';

// ========================
// PASSWORD DTOs
// ========================
export * from './password/forgot-password.dto';
export * from './password/reset-password.dto';
export * from './password/change-password.dto';

// ========================
// MFA DTOs
// ========================
export * from './mfa/mfa-setup.dto';
export * from './mfa/mfa-verify.dto';
export * from './mfa/mfa-challenge.dto';

// ========================
// SECURITY DTOs
// ========================
export * from './security/security-event.dto';
export * from './security/trusted-device.dto';
export * from './security/risk-assessment.dto';