/**
 * Token d'injection du service Redis
 */
export const REDIS_SERVICE = 'REDIS_SERVICE';

/**
 * Namespace de configuration pour @nestjs/config
 */
export const REDIS_CONFIG_NAMESPACE = 'redis';

/**
 * Constantes pour le module Redis
 */

// Token d'injection pour le client Redis
export const REDIS_CLIENT = 'REDIS_CLIENT';

// Préfixes pour les clés Redis
export const REDIS_PREFIXES = {
  SESSION: 'session:',
  CACHE: 'cache:',
  RATE_LIMIT: 'rate_limit:',
  QUEUE: 'queue:',
  LOCK: 'lock:',
  TEMP: 'temp:',
} as const;

// TTL par défaut (en secondes)
export const REDIS_TTL = {
  SESSION: 86400, // 24 heures
  CACHE_SHORT: 300, // 5 minutes
  CACHE_MEDIUM: 3600, // 1 heure
  CACHE_LONG: 86400, // 24 heures
  RATE_LIMIT: 900, // 15 minutes
  LOCK: 30, // 30 secondes
  TEMP: 3600, // 1 heure
} as const; 
