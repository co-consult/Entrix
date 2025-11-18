// src/modules/auth/decorators/api-key.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * Decorators API Key Entrix V3.0
 * Authentification via clés API pour intégrations
 */

// Clé metadata pour API key
export const API_KEY_REQUIRED_KEY = 'apiKeyRequired';
export const API_KEY_SCOPES_KEY = 'apiKeyScopes';

/**
 * Decorator @RequireApiKey() - Requiert clé API valide
 * Usage: @RequireApiKey()
 */
export const RequireApiKey = () => SetMetadata(API_KEY_REQUIRED_KEY, true);

/**
 * Decorator @ApiKeyScopes() - Définit portées requises pour API key
 * Usage: @ApiKeyScopes('events:read', 'tickets:write')
 */
export const ApiKeyScopes = (...scopes: string[]) => 
  SetMetadata(API_KEY_SCOPES_KEY, scopes);

/**
 * Decorator @PublicApiKey() - API key pour endpoints publics
 * Usage: @PublicApiKey()
 */
export const PublicApiKey = () => SetMetadata(API_KEY_SCOPES_KEY, ['public']);

/**
 * Decorator @PartnerApiKey() - API key pour partenaires
 * Usage: @PartnerApiKey()
 */
export const PartnerApiKey = () => SetMetadata(API_KEY_SCOPES_KEY, ['partner']);

/**
 * Decorator @InternalApiKey() - API key interne uniquement
 * Usage: @InternalApiKey()
 */
export const InternalApiKey = () => SetMetadata(API_KEY_SCOPES_KEY, ['internal']);