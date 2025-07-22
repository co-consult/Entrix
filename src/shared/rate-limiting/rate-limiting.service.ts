import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { REDIS_PREFIXES } from '../redis/redis.constants';
import { RateLimitOptions, RateLimitResult, RateLimitingMetrics } from './interfaces';

/**
 * Service de rate limiting basé sur Redis pour la production
 * - Support des algorithms sliding window et token bucket
 * - Clustering-ready avec stockage distribué
 * - Métriques et monitoring intégrés
 */
@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  private metrics = {
    totalRequests: 0,
    blockedRequests: 0,
    allowedRequests: 0,
    errorCount: 0,
  };

  // Valeurs par défaut
  private readonly DEFAULT_LIMIT = 100;
  private readonly DEFAULT_WINDOW_MS = 60000; // 1 minute
  private readonly DEFAULT_ALGORITHM = 'sliding_window';

  constructor(private readonly redis: RedisService) {}

  /**
   * Vérifie si une requête est autorisée (sliding window algorithm)
   */
  async checkLimit(
    identifier: string,
    options: RateLimitOptions = {}
  ): Promise<RateLimitResult> {
    const limit = options.limit ?? this.DEFAULT_LIMIT;
    const windowMs = options.windowMs ?? this.DEFAULT_WINDOW_MS;
    const algorithm = options.algorithm ?? this.DEFAULT_ALGORITHM;

    this.metrics.totalRequests++;

    try {
      let result: RateLimitResult;

      switch (algorithm) {
        case 'sliding_window':
          result = await this.slidingWindowCheck(identifier, limit, windowMs);
          break;
        case 'token_bucket':
          result = await this.tokenBucketCheck(identifier, limit, windowMs);
          break;
        case 'fixed_window':
          result = await this.fixedWindowCheck(identifier, limit, windowMs);
          break;
        default:
          result = await this.slidingWindowCheck(identifier, limit, windowMs);
      }

      if (result.allowed) {
        this.metrics.allowedRequests++;
      } else {
        this.metrics.blockedRequests++;
        this.logger.warn(`🚫 Rate limit exceeded for ${identifier}`, {
          identifier,
          limit,
          remaining: result.remaining,
          resetTime: new Date(result.resetTime),
        });
      }

      return result;
    } catch (error) {
      this.metrics.errorCount++;
      this.logger.error(`❌ Rate limiting error for ${identifier}:`, error);
      
      // En cas d'erreur, on autorise par défaut (fail-open)
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + windowMs,
        totalRequests: 1,
      };
    }
  }

  /**
   * Sliding window algorithm - le plus précis
   */
  private async slidingWindowCheck(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const key = `${REDIS_PREFIXES.RATE_LIMIT}sliding:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const client = this.redis.getClient();
    
    // Transaction Redis pour atomicité
    const pipeline = client.pipeline();
    
    // Supprimer les entrées expirées
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Compter les requêtes actuelles
    pipeline.zcard(key);
    
    // Ajouter la requête actuelle
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Définir l'expiration
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline failed');
    }
    
    const currentCount = results[1][1] as number;
    const allowed = currentCount < limit;
    
    // Si on dépasse la limite, retirer la requête ajoutée
    if (!allowed) {
      await client.zpopmax(key);
    }
    
    return {
      allowed,
      remaining: Math.max(0, limit - currentCount - (allowed ? 1 : 0)),
      resetTime: now + windowMs,
      totalRequests: currentCount + (allowed ? 1 : 0),
    };
  }

  /**
   * Token bucket algorithm - bon pour les burst allowances
   */
  private async tokenBucketCheck(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const key = `${REDIS_PREFIXES.RATE_LIMIT}bucket:${identifier}`;
    const now = Date.now();
    
    const client = this.redis.getClient();
    
    // Script Lua pour atomicité
    const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or limit
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calcul du refill
      local elapsed = now - lastRefill
      local refillRate = limit / window
      local newTokens = math.min(limit, tokens + (elapsed * refillRate))
      
      if newTokens >= 1 then
        newTokens = newTokens - 1
        redis.call('HMSET', key, 'tokens', newTokens, 'lastRefill', now)
        redis.call('EXPIRE', key, math.ceil(window / 1000))
        return {1, newTokens, now + window}
      else
        redis.call('HMSET', key, 'tokens', newTokens, 'lastRefill', now)
        redis.call('EXPIRE', key, math.ceil(window / 1000))
        return {0, 0, now + ((1 - newTokens) / refillRate)}
      end
    `;
    
    const result = await client.eval(script, 1, key, limit, windowMs, now) as number[];
    
    return {
      allowed: result[0] === 1,
      remaining: Math.floor(result[1]),
      resetTime: result[2],
      totalRequests: limit - Math.floor(result[1]),
    };
  }

  /**
   * Fixed window algorithm - le plus simple
   */
  private async fixedWindowCheck(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const key = `${REDIS_PREFIXES.RATE_LIMIT}fixed:${identifier}:${windowStart}`;
    
    const client = this.redis.getClient();
    
    const current = await client.incr(key);
    
    if (current === 1) {
      await client.expire(key, Math.ceil(windowMs / 1000));
    }
    
    const allowed = current <= limit;
    
    return {
      allowed,
      remaining: Math.max(0, limit - current),
      resetTime: windowStart + windowMs,
      totalRequests: current,
    };
  }

  /**
   * Vérifie les limites par IP avec différents niveaux
   */
  async checkIpLimit(
    ip: string,
    options: RateLimitOptions = {}
  ): Promise<RateLimitResult> {
    return this.checkLimit(`ip:${ip}`, options);
  }

  /**
   * Vérifie les limites par utilisateur
   */
  async checkUserLimit(
    userId: string,
    options: RateLimitOptions = {}
  ): Promise<RateLimitResult> {
    return this.checkLimit(`user:${userId}`, options);
  }

  /**
   * Vérifie les limites par route/endpoint
   */
  async checkRouteLimit(
    ip: string,
    route: string,
    options: RateLimitOptions = {}
  ): Promise<RateLimitResult> {
    return this.checkLimit(`route:${route}:${ip}`, options);
  }

  /**
   * Vérifie les limites globales
   */
  async checkGlobalLimit(
    options: RateLimitOptions = {}
  ): Promise<RateLimitResult> {
    return this.checkLimit('global', options);
  }

  /**
   * Système de rate limiting adaptatif basé sur la charge
   */
  async checkAdaptiveLimit(
    identifier: string,
    baseLimit: number,
    windowMs: number,
    loadFactor: number = 1.0
  ): Promise<RateLimitResult> {
    const adaptedLimit = Math.floor(baseLimit * (2 - loadFactor));
    
    return this.checkLimit(identifier, {
      limit: Math.max(1, adaptedLimit),
      windowMs,
    });
  }

  /**
   * Whitelist d'IPs ou d'utilisateurs
   */
  async isWhitelisted(identifier: string): Promise<boolean> {
    const key = `${REDIS_PREFIXES.RATE_LIMIT}whitelist:${identifier}`;
    return await this.redis.exists(key);
  }

  /**
   * Ajoute à la whitelist
   */
  async addToWhitelist(identifier: string, ttlSeconds?: number): Promise<void> {
    const key = `${REDIS_PREFIXES.RATE_LIMIT}whitelist:${identifier}`;
    await this.redis.set(key, '1', ttlSeconds);
    
    this.logger.log(`✅ Added to whitelist: ${identifier}`);
  }

  /**
   * Supprime de la whitelist
   */
  async removeFromWhitelist(identifier: string): Promise<void> {
    const key = `${REDIS_PREFIXES.RATE_LIMIT}whitelist:${identifier}`;
    await this.redis.del(key);
    
    this.logger.log(`❌ Removed from whitelist: ${identifier}`);
  }

  /**
   * Blacklist temporaire
   */
  async addToBlacklist(identifier: string, ttlSeconds: number = 3600): Promise<void> {
    const key = `${REDIS_PREFIXES.RATE_LIMIT}blacklist:${identifier}`;
    await this.redis.set(key, '1', ttlSeconds);
    
    this.logger.warn(`🚫 Added to blacklist: ${identifier} for ${ttlSeconds}s`);
  }

  /**
   * Vérifie si blacklisté
   */
  async isBlacklisted(identifier: string): Promise<boolean> {
    const key = `${REDIS_PREFIXES.RATE_LIMIT}blacklist:${identifier}`;
    return await this.redis.exists(key);
  }

  /**
   * Reset manuel d'un rate limit
   */
  async resetLimit(identifier: string): Promise<void> {
    const patterns = [
      `${REDIS_PREFIXES.RATE_LIMIT}sliding:${identifier}`,
      `${REDIS_PREFIXES.RATE_LIMIT}bucket:${identifier}`,
      `${REDIS_PREFIXES.RATE_LIMIT}fixed:${identifier}:*`,
    ];
    
    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redis.del(key)));
      }
    }
    
    this.logger.log(`🔄 Reset rate limit for: ${identifier}`);
  }

  /**
   * Obtient des statistiques détaillées
   */
  async getStats(identifier?: string): Promise<{
    identifier?: string;
    currentRequests: number;
    metrics: RateLimitingMetrics;
    topLimitedIps?: string[];
  }> {
    const stats: any = {
      metrics: { ...this.metrics },
    };
    
    if (identifier) {
      stats.identifier = identifier;
      // Récupérer les stats spécifiques pour cet identifier
      const keys = await this.redis.keys(`${REDIS_PREFIXES.RATE_LIMIT}*${identifier}*`);
      stats.currentRequests = keys.length;
    } else {
      // Stats globales
      const allKeys = await this.redis.keys(`${REDIS_PREFIXES.RATE_LIMIT}*`);
      stats.currentRequests = allKeys.length;
      
      // Top des IPs limitées (optionnel)
      const ipKeys = allKeys.filter(key => key.includes(':ip:'));
      stats.topLimitedIps = ipKeys.slice(0, 10);
    }
    
    return stats;
  }

  /**
   * Nettoyage des données expirées
   */
  async cleanup(): Promise<number> {
    const pattern = `${REDIS_PREFIXES.RATE_LIMIT}*`;
    const deletedKeys = await this.redis.cleanup(pattern);
    
    this.logger.log(`🧹 Rate limiting cleanup: ${deletedKeys} keys removed`);
    return deletedKeys;
  }

  /**
   * Obtient les métriques
   */
  getMetrics() {
    const total = this.metrics.totalRequests;
    
    return {
      ...this.metrics,
      blockRate: total > 0 ? parseFloat(((this.metrics.blockedRequests / total) * 100).toFixed(2)) : 0,
      allowRate: total > 0 ? parseFloat(((this.metrics.allowedRequests / total) * 100).toFixed(2)) : 0,
      errorRate: total > 0 ? parseFloat(((this.metrics.errorCount / total) * 100).toFixed(2)) : 0,
    };
  }

  /**
   * Reset des métriques
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      errorCount: 0,
    };
  }
}