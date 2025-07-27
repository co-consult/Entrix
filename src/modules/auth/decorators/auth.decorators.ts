// src/modules/auth/decorators/auth.decorators.ts

import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

/**
 * Décorateurs d'authentification Entrix V3.0
 * Collection complète des décorateurs pour l'auth
 */

// ============================================================================
// DÉCORATEURS DE PARAMÈTRES (EXTRACTION DE DONNÉES DE LA REQUÊTE)
// ============================================================================

/**
 * Extrait l'utilisateur courant depuis la requête
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Extrait l'ID de l'utilisateur courant
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id || request.user?.sub;
  },
);

/**
 * Extrait les informations de session courante
 */
export const CurrentSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.session;
  },
);

/**
 * Extrait l'ID de session courante
 */
export const SessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sessionId || request.session?.id;
  },
);

/**
 * Extrait les informations client (IP, User-Agent, etc.)
 */
export const ClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      ip_address: request.ip || request.connection?.remoteAddress,
      user_agent: request.headers?.['user-agent'],
      device_fingerprint: request.headers?.['x-device-fingerprint'],
      geolocation: request.headers?.['x-geolocation'],
      forwarded_for: request.headers?.['x-forwarded-for'],
    };
  },
);

/**
 * Extrait le device fingerprint
 */
export const DeviceFingerprint = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers?.['x-device-fingerprint'] || 
           request.body?.deviceFingerprint ||
           request.query?.deviceFingerprint;
  },
);

// ============================================================================
// DÉCORATEURS DE MÉTADONNÉES (CONFIGURATION DES ENDPOINTS)
// ============================================================================

/**
 * Marque un endpoint comme nécessitant MFA
 */
export const RequireMfa = () => SetMetadata('requireMfa', true);

/**
 * Marque un endpoint comme nécessitant un device de confiance
 */
export const RequireTrustedDevice = () => SetMetadata('requireTrustedDevice', true);

/**
 * Spécifie les rôles requis pour accéder à l'endpoint
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Spécifie les permissions requises pour accéder à l'endpoint
 */
export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

// ============================================================================
// DÉCORATEURS DE LIMITATION ET AUDIT
// ============================================================================

/**
 * Configuration du rate limiting pour un endpoint
 */
export interface RateLimitOptions {
  limit: number;         // Nombre max de requêtes
  windowMs: number;      // Fenêtre de temps en millisecondes
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export const RateLimit = (options: RateLimitOptions) => 
  SetMetadata('rateLimit', options);

/**
 * Configuration de l'audit logging pour un endpoint
 */
export interface AuditLogOptions {
  action: string;
  level: 'info' | 'warn' | 'error';
  includeRequest?: boolean;
  includeResponse?: boolean;
  sensitiveFields?: string[];
}

export const AuditLog = (options: AuditLogOptions) => 
  SetMetadata('auditLog', options);

// ============================================================================
// DÉCORATEURS DE SÉCURITÉ AVANCÉE
// ============================================================================

/**
 * Spécifie le niveau de sécurité requis
 */
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

export const SecurityLevel = (level: SecurityLevel) => 
  SetMetadata('securityLevel', level);

/**
 * Marque un endpoint comme sensible (audit renforcé)
 */
export const Sensitive = (reason?: string) => 
  SetMetadata('sensitive', { enabled: true, reason });

/**
 * Configure la validation du risk scoring
 */
export interface RiskScoreOptions {
  maxScore: number;      // Score de risque maximum accepté
  factors?: string[];    // Facteurs de risque à évaluer
  action?: 'allow' | 'mfa' | 'block'; // Action si seuil dépassé
}

export const RiskScore = (options: RiskScoreOptions) => 
  SetMetadata('riskScore', options);

// ============================================================================
// DÉCORATEURS DE CACHE ET PERFORMANCE
// ============================================================================

/**
 * Configuration du cache pour un endpoint
 */
export interface CacheOptions {
  ttl: number;           // TTL en secondes
  key?: string;          // Clé de cache personnalisée
  vary?: string[];       // Headers à inclure dans la clé
}

export const Cache = (options: CacheOptions) => 
  SetMetadata('cache', options);

/**
 * Marque un endpoint pour bypass du cache
 */
export const NoCache = () => SetMetadata('noCache', true);

// ============================================================================
// DÉCORATEURS DE VALIDATION ET TRANSFORMATION
// ============================================================================

/**
 * Validation personnalisée des données d'entrée
 */
export interface ValidationOptions {
  groups?: string[];
  skipMissingProperties?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
}

export const ValidateInput = (options: ValidationOptions) => 
  SetMetadata('validateInput', options);

/**
 * Transformation des données de sortie
 */
export interface TransformOptions {
  excludeFields?: string[];
  includeFields?: string[];
  transformations?: Record<string, (value: any) => any>;
}

export const TransformOutput = (options: TransformOptions) => 
  SetMetadata('transformOutput', options);

// ============================================================================
// DÉCORATEURS DE MONITORING ET MÉTRIQUES
// ============================================================================

/**
 * Active le monitoring des performances pour un endpoint
 */
export interface MonitoringOptions {
  trackDuration?: boolean;
  trackMemory?: boolean;
  trackErrors?: boolean;
  sampleRate?: number;   // Taux d'échantillonnage (0-1)
}

export const Monitor = (options: MonitoringOptions = {}) => 
  SetMetadata('monitor', { enabled: true, ...options });

/**
 * Marque un endpoint pour collecte de métriques business
 */
export const BusinessMetric = (metricName: string, data?: Record<string, any>) => 
  SetMetadata('businessMetric', { name: metricName, data });

// ============================================================================
// DÉCORATEURS DE FEATURE FLAGS
// ============================================================================

/**
 * Contrôle l'accès via feature flags
 */
export const FeatureFlag = (flagName: string, defaultValue: boolean = false) => 
  SetMetadata('featureFlag', { name: flagName, default: defaultValue });

/**
 * Marque un endpoint comme expérimental
 */
export const Experimental = (version?: string) => 
  SetMetadata('experimental', { enabled: true, version });

// ============================================================================
// EXEMPLES D'UTILISATION
// ============================================================================

/*
@Controller('auth')
export class AuthController {

  @Post('login')
  @Public()
  @RateLimit({ limit: 5, windowMs: 60000 })
  @AuditLog({ action: 'user_login', level: 'info' })
  @Monitor({ trackDuration: true, trackErrors: true })
  async login(
    @Body() loginDto: LoginDto,
    @ClientInfo() clientInfo: any
  ) {
    // Endpoint public avec rate limiting et audit
  }

  @Get('profile')
  @Roles('USER', 'ADMIN')
  @Cache({ ttl: 300 })
  @TransformOutput({ excludeFields: ['password', 'tokens'] })
  async getProfile(@CurrentUserId() userId: string) {
    // Endpoint protégé avec cache et transformation
  }

  @Delete('sessions')
  @RequireMfa()
  @SecurityLevel('high')
  @Sensitive('Account security action')
  @AuditLog({ action: 'logout_all', level: 'warn' })
  async logoutAll(@CurrentUser() user: any) {
    // Endpoint critique avec MFA et audit renforcé
  }

  @Post('admin/users')
  @Roles('ADMIN')
  @RiskScore({ maxScore: 50, action: 'mfa' })
  @FeatureFlag('advanced_user_management')
  @BusinessMetric('admin_user_creation')
  async createUser(@Body() userData: CreateUserDto) {
    // Endpoint admin avec contrôles avancés
  }
}
*/