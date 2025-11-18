import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_CONFIG_NAMESPACE, REDIS_PREFIXES, REDIS_TTL } from './redis.constants';
import { RedisModuleConfig } from './redis.interfaces';

/**
 * Service Redis centralisé pour l'accès au cache et pub/sub
 * - Gère la connexion, la configuration, les logs et le shutdown hook
 * - Fournit des méthodes utilitaires pour le cache, les verrous et les sessions
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalOperations: 0
  };

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  /**
   * Initialisation de la connexion Redis
   */
  async onModuleInit() {
    const config = this.configService.get<RedisModuleConfig>(REDIS_CONFIG_NAMESPACE);
    const options: RedisOptions = {
      host: config.host,
      port: config.port,
      db: config.db,
      password: config.password,
      tls: config.tls ? {} : undefined,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: false,
    };

    this.client = new Redis(options);
    
    // Event handlers
    this.client.on('connect', () => {
      this.logger.log('✅ Connexion Redis établie');
    });
    
    this.client.on('error', (err) => {
      this.metrics.errors++;
      this.logger.error('❌ Erreur Redis', err);
    });
    
    this.client.on('close', () => {
      this.logger.warn('🔌 Connexion Redis fermée');
    });
    
    this.client.on('reconnecting', () => {
      this.logger.warn('🔄 Tentative de reconnexion Redis...');
    });

    // Log initial connection info
    this.logger.log(`🚀 Redis connecté sur ${config.host}:${config.port} (DB: ${config.db})`);
  }

  /**
   * Récupère le client ioredis natif (pour les opérations avancées)
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Set une clé dans Redis avec métriques
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    try {
      this.metrics.totalOperations++;
      if (ttlSeconds) {
        return await this.client.set(key, value, 'EX', ttlSeconds);
      }
      return await this.client.set(key, value);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get une clé depuis Redis avec métriques
   */
  async get(key: string): Promise<string | null> {
    try {
      this.metrics.totalOperations++;
      const value = await this.client.get(key);
      if (value) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }
      return value;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Supprime une clé dans Redis
   */
  async del(key: string): Promise<number> {
    try {
      this.metrics.totalOperations++;
      return await this.client.del(key);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES AVANCÉES
  // ============================================================================

  /**
   * Set un objet dans le cache avec sérialisation JSON
   */
  async setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const cacheKey = `${REDIS_PREFIXES.CACHE}${key}`;
    await this.set(cacheKey, JSON.stringify(value), ttlSeconds || REDIS_TTL.CACHE_MEDIUM);
  }

  /**
   * Get un objet depuis le cache avec désérialisation JSON
   */
  async getCache<T>(key: string): Promise<T | null> {
    const cacheKey = `${REDIS_PREFIXES.CACHE}${key}`;
    const value = await this.get(cacheKey);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Supprime une clé du cache
   */
  async delCache(key: string): Promise<number> {
    const cacheKey = `${REDIS_PREFIXES.CACHE}${key}`;
    return await this.del(cacheKey);
  }

  /**
   * Acquiert un verrou distribué
   */
  async acquireLock(key: string, ttlSeconds: number = REDIS_TTL.LOCK): Promise<boolean> {
    try {
      this.metrics.totalOperations++;
      const lockKey = `${REDIS_PREFIXES.LOCK}${key}`;
      const result = await this.client.set(lockKey, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Lock acquisition error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Libère un verrou distribué
   */
  async releaseLock(key: string): Promise<number> {
    const lockKey = `${REDIS_PREFIXES.LOCK}${key}`;
    return await this.del(lockKey);
  }

  /**
   * Exécute une fonction avec un verrou distribué
   */
  async withLock<T>(key: string, callback: () => Promise<T>, ttlSeconds: number = REDIS_TTL.LOCK): Promise<T> {
    const lockAcquired = await this.acquireLock(key, ttlSeconds);
    if (!lockAcquired) {
      throw new Error(`Could not acquire lock for key: ${key}`);
    }

    try {
      return await callback();
    } finally {
      await this.releaseLock(key);
    }
  }

  /**
   * Gestion des sessions utilisateur
   */
  async setSession(sessionId: string, data: any, ttlSeconds: number = REDIS_TTL.SESSION): Promise<void> {
    const sessionKey = `${REDIS_PREFIXES.SESSION}${sessionId}`;
    await this.set(sessionKey, JSON.stringify(data), ttlSeconds);
  }

  /**
   * Récupère une session utilisateur
   */
  async getSession<T>(sessionId: string): Promise<T | null> {
    const sessionKey = `${REDIS_PREFIXES.SESSION}${sessionId}`;
    const data = await this.get(sessionKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Supprime une session utilisateur
   */
  async delSession(sessionId: string): Promise<number> {
    const sessionKey = `${REDIS_PREFIXES.SESSION}${sessionId}`;
    return await this.del(sessionKey);
  }

  /**
   * Incrémente un compteur avec TTL
   */
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      this.metrics.totalOperations++;
      const result = await this.client.incr(key);
      if (result === 1 && ttlSeconds) {
        await this.client.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Redis INCR error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie si une clé existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      this.metrics.totalOperations++;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Définit un TTL sur une clé existante
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      this.metrics.totalOperations++;
      const result = await this.client.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Recherche des clés par pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      this.metrics.totalOperations++;
      return await this.client.keys(pattern);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Nettoyage des clés expirées par pattern
   */
  async cleanup(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      
      this.metrics.totalOperations++;
      const result = await this.client.del(...keys);
      this.logger.log(`🧹 Nettoyage Redis: ${result} clés supprimées (pattern: ${pattern})`);
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Redis CLEANUP error for pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Obtient les métriques Redis
   */
  getMetrics() {
    const hitRate = this.metrics.totalOperations > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 
      : 0;
    
    return {
      ...this.metrics,
      hitRate: parseFloat(hitRate.toFixed(2)),
      errorRate: this.metrics.totalOperations > 0 
        ? (this.metrics.errors / this.metrics.totalOperations) * 100 
        : 0
    };
  }

  /**
   * Reset les métriques
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalOperations: 0
    };
  }

  /**
   * Ping Redis pour vérifier la connexion
   */
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      this.logger.error('Redis PING error:', error);
      throw error;
    }
  }

  /**
   * Obtient des informations sur le serveur Redis
   */
  async info(): Promise<string> {
    try {
      return await this.client.info();
    } catch (error) {
      this.logger.error('Redis INFO error:', error);
      throw error;
    }
  }

  /**
   * Ferme proprement la connexion Redis
   */
  async onModuleDestroy() {
    if (this.client) {
      // Log final metrics
      const metrics = this.getMetrics();
      this.logger.log(`📊 Métriques Redis finales: ${JSON.stringify(metrics)}`);
      
      await this.client.quit();
      this.logger.log('🔒 Connexion Redis fermée proprement');
    }
  }
}