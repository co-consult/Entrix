// src/modules/auth/decorators/require-mfa.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * Decorators MFA Entrix V3.0
 * Gestion authentification multifacteur
 */

// Clé metadata pour MFA requis
export const REQUIRE_MFA_KEY = 'requireMfa';

// Clé metadata pour niveau MFA
export const MFA_LEVEL_KEY = 'mfaLevel';

/**
 * Decorator @RequireMfa() - Force authentification multifacteur
 * Usage: @RequireMfa()
 */
export const RequireMfa = () => SetMetadata(REQUIRE_MFA_KEY, true);

/**
 * Decorator @MfaLevel() - Définit niveau MFA requis
 * Usage: @MfaLevel('high')
 */
export const MfaLevel = (level: 'basic' | 'high' | 'critical') => 
  SetMetadata(MFA_LEVEL_KEY, level);

/**
 * Decorator @RequireHighMfa() - Force MFA niveau élevé
 * Usage: @RequireHighMfa()
 */
export const RequireHighMfa = () => SetMetadata(MFA_LEVEL_KEY, 'high');

/**
 * Decorator @RequireCriticalMfa() - Force MFA critique
 * Usage: @RequireCriticalMfa()
 */
export const RequireCriticalMfa = () => SetMetadata(MFA_LEVEL_KEY, 'critical');