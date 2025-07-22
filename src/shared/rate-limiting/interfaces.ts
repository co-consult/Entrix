/**
 * Options de configuration pour le rate limiting
 */
export interface RateLimitOptions {
  /** Nombre maximum de requêtes autorisées */
  limit?: number;
  /** Fenêtre de temps en millisecondes */
  windowMs?: number;
  /** Algorithme de rate limiting */
  algorithm?: 'sliding_window' | 'token_bucket' | 'fixed_window';
  /** Message personnalisé en cas de dépassement */
  message?: string;
  /** Skip le rate limiting pour cette requête */
  skip?: boolean;
  /** Identifiant personnalisé */
  keyGenerator?: (req: any) => string;
}

export interface RateLimitingMetrics {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  errorCount: number;
}

/**
 * Résultat d'une vérification de rate limit
 */
export interface RateLimitResult {
  /** Indique si la requête est autorisée */
  allowed: boolean;
  /** Nombre de requêtes restantes */
  remaining: number;
  /** Timestamp de reset de la limite */
  resetTime: number;
  /** Nombre total de requêtes dans la fenêtre */
  totalRequests: number;
}

/**
 * État du rate limiting pour un identifiant
 */
export interface RateLimitState {
  /** Nombre de requêtes effectuées */
  count: number;
  /** Timestamp d'expiration */
  expiresAt: number;
  /** Dernière requête */
  lastRequest?: number;
  /** Tokens restants (pour token bucket) */
  tokens?: number;
  /** Dernier refill (pour token bucket) */
  lastRefill?: number;
}

/**
 * Configuration des niveaux de rate limiting
 */
export interface RateLimitTiers {
  /** Limites par IP */
  ip: {
    /** Limite générale par IP */
    general: RateLimitOptions;
    /** Limite stricte pour APIs sensibles */
    strict: RateLimitOptions;
    /** Limite pour les endpoints d'authentification */
    auth: RateLimitOptions;
  };
  /** Limites par utilisateur */
  user: {
    /** Limite générale par utilisateur */
    general: RateLimitOptions;
    /** Limite pour les actions premium */
    premium: RateLimitOptions;
    /** Limite pour les uploads */
    upload: RateLimitOptions;
  };
  /** Limites globales */
  global: {
    /** Limite globale du système */
    system: RateLimitOptions;
    /** Limite par endpoint */
    endpoint: RateLimitOptions;
  };
}

/**
 * Métriques de rate limiting
 */
export interface RateLimitMetrics {
  /** Nombre total de requêtes */
  totalRequests: number;
  /** Nombre de requêtes bloquées */
  blockedRequests: number;
  /** Nombre de requêtes autorisées */
  allowedRequests: number;
  /** Nombre d'erreurs */
  errorCount: number;
  /** Taux de blocage en pourcentage */
  blockRate: number;
  /** Taux d'autorisation en pourcentage */
  allowRate: number;
  /** Taux d'erreur en pourcentage */
  errorRate: number;
}

/**
 * Configuration du rate limiting adaptatif
 */
export interface AdaptiveRateLimitConfig {
  /** Limite de base */
  baseLimit: number;
  /** Facteur de charge minimum */
  minLoadFactor: number;
  /** Facteur de charge maximum */
  maxLoadFactor: number;
  /** Seuil d'activation */
  activationThreshold: number;
  /** Durée d'observation en ms */
  observationWindow: number;
}

/**
 * Événement de rate limiting
 */
export interface RateLimitEvent {
  /** Type d'événement */
  type: 'limit_exceeded' | 'whitelist_added' | 'blacklist_added' | 'limit_reset';
  /** Identifiant concerné */
  identifier: string;
  /** Timestamp */
  timestamp: number;
  /** Métadonnées */
  metadata?: any;
}

/**
 * Statistiques détaillées
 */
export interface RateLimitStats {
  /** Identifiant */
  identifier?: string;
  /** Requêtes actuelles */
  currentRequests: number;
  /** Métriques */
  metrics: RateLimitMetrics;
  /** Top des IPs limitées */
  topLimitedIps?: string[];
  /** Historique récent */
  recentEvents?: RateLimitEvent[];
}

/**
 * Configuration des headers HTTP
 */
export interface RateLimitHeaders {
  /** Header pour la limite */
  limit: string;
  /** Header pour les requêtes restantes */
  remaining: string;
  /** Header pour le reset */
  reset: string;
  /** Header pour le retry-after */
  retryAfter: string;
}

/**
 * Constantes par défaut
 */
export const DEFAULT_RATE_LIMIT = 100;
export const DEFAULT_WINDOW_MS = 60000; // 1 minute
export const DEFAULT_ALGORITHM = 'sliding_window';

/**
 * Headers HTTP standard
 */
export const RATE_LIMIT_HEADERS: RateLimitHeaders = {
  limit: 'X-RateLimit-Limit',
  remaining: 'X-RateLimit-Remaining',
  reset: 'X-RateLimit-Reset',
  retryAfter: 'Retry-After',
};

/**
 * Messages d'erreur standard
 */
export const RATE_LIMIT_MESSAGES = {
  EXCEEDED: 'Rate limit exceeded. Try again later.',
  BLACKLISTED: 'Access temporarily restricted.',
  INVALID_KEY: 'Invalid rate limit key.',
  SYSTEM_ERROR: 'Rate limiting system error.',
} as const;