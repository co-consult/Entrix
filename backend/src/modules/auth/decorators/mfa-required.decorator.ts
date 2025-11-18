// src/modules/auth/decorators/mfa-required.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const MFA_REQUIRED_KEY = 'mfaRequired';

/**
 * Décorateur MFA Required Entrix V3.0
 * Indique qu'une route/méthode nécessite une authentification multifacteur
 * 
 * @param required - Si true, MFA est obligatoire pour cette route
 * 
 * Usage:
 * ```typescript
 * @MfaRequired()
 * @Get('sensitive-data')
 * async getSensitiveData() {
 *   // Cette route nécessite MFA
 * }
 * 
 * @MfaRequired(false)
 * @Get('public-data') 
 * async getPublicData() {
 *   // Cette route n'exige pas MFA même si configuré globalement
 * }
 * ```
 */
export const MfaRequired = (required: boolean = true) => SetMetadata(MFA_REQUIRED_KEY, required);

/**
 * Alias pour forcer MFA sur une route
 */
export const RequireMfa = () => MfaRequired(true);

/**
 * Alias pour exempter une route du MFA 
 */
export const SkipMfa = () => MfaRequired(false);