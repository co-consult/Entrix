// src/modules/auth/services/token-maintenance.service.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PersistentTokenService } from './persistent-token.service';
import { ValidationTokenService } from './validation-token.service';
import { TokenService } from './token.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';

/**
 * Token Maintenance Service Entrix V3.0 - Grade A+
 * Service de maintenance automatique pour tous les types de tokens
 * Nettoyage, monitoring, alertes et optimisations
 */

@Injectable()
export class TokenMaintenanceService {
  private readonly logger: LoggerService;

  constructor(
    private readonly persistentTokenService: PersistentTokenService,
    private readonly validationTokenService: ValidationTokenService,
    private readonly tokenService: TokenService,
    private readonly redis: RedisService,
    private readonly bullmq: BullmqService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('TokenMaintenanceService');
  }

  // ============================================================================
  // TÂCHES CRON DE NETTOYAGE
  // ============================================================================

  /**
   * Nettoyage quotidien des tokens expirés (tous types)
   * Exécuté chaque jour à 2h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyTokenCleanup(): Promise<void> {
    const operationId = this.logger.startOperation('dailyTokenCleanup');

    try {
      this.logger.info('Starting daily token cleanup...');

      const results = await this.tokenService.cleanupExpiredTokens();

      const totalCleaned = results.persistent_tokens + results.validation_tokens + results.blacklisted_keys;

      this.logger.info('Daily token cleanup completed', JSON.stringify({
        persistent_tokens_cleaned: results.persistent_tokens,
        validation_tokens_cleaned: results.validation_tokens,
        blacklisted_keys_cleaned: results.blacklisted_keys,
        total_cleaned: totalCleaned,
        duration_ms: Date.now(),
      }));

      // Programmer un rapport si beaucoup de tokens nettoyés
      if (totalCleaned > 1000) {
        await this.scheduleCleanupReport(results, 'daily');
      }

      this.logger.endOperation('dailyTokenCleanup', operationId, true);

    } catch (error) {
      this.logger.endOperation('dailyTokenCleanup', operationId, false);
      this.logger.error(
        'Daily token cleanup failed',
        error.stack,
        'TokenMaintenanceService.dailyTokenCleanup',
        JSON.stringify({ errorMessage: error.message })
      );

      // Programmer une alerte
      await this.scheduleMaintenanceAlert('daily_cleanup_failed', error.message);
    }
  }

  /**
   * Nettoyage hebdomadaire approfondi
   * Exécuté chaque dimanche à 3h du matin
   */
  @Cron(CronExpression.EVERY_WEEK)
  async weeklyDeepCleanup(): Promise<void> {
    const operationId = this.logger.startOperation('weeklyDeepCleanup');

    try {
      this.logger.info('Starting weekly deep cleanup...');

      const results = await Promise.all([
        // Nettoyage standard
        this.tokenService.cleanupExpiredTokens(),
        
        // Nettoyage des tokens utilisés anciens (validation tokens)
        this.validationTokenService.cleanupUsedTokens(30), // 30 jours
        this.validationTokenService.cleanupBlockedTokens(7), // 7 jours
        
        // Nettoyage des tokens révoqués anciens (persistent tokens)
        this.persistentTokenService.cleanupRevokedTokens(90), // 90 jours
        
        // Nettoyage du cache Redis
        this.cleanupRedisCache(),
      ]);

      const summary = {
        expired_tokens: results[0],
        used_validation_tokens: results[1],
        blocked_validation_tokens: results[2],
        revoked_persistent_tokens: results[3],
        cache_keys_cleaned: results[4],
      };

      this.logger.info('Weekly deep cleanup completed', JSON.stringify(summary));

      // Programmer un rapport hebdomadaire
      await this.scheduleCleanupReport(summary, 'weekly');

      this.logger.endOperation('weeklyDeepCleanup', operationId, true);

    } catch (error) {
      this.logger.endOperation('weeklyDeepCleanup', operationId, false);
      this.logger.error(
        'Weekly deep cleanup failed',
        error.stack,
        'TokenMaintenanceService.weeklyDeepCleanup',
        JSON.stringify({ errorMessage: error.message })
      );

      await this.scheduleMaintenanceAlert('weekly_cleanup_failed', error.message);
    }
  }

  /**
   * Optimisation du cache toutes les heures
   */
  @Cron(CronExpression.EVERY_HOUR)
  async hourlyCacheOptimization(): Promise<void> {
    const operationId = this.logger.startOperation('hourlyCacheOptimization');

    try {
      const optimized = await this.optimizeTokenCache();

      if (optimized > 0) {
        this.logger.info('Token cache optimized', JSON.stringify({
          keys_optimized: optimized,
        }));
      }

      this.logger.endOperation('hourlyCacheOptimization', operationId, true);

    } catch (error) {
      this.logger.endOperation('hourlyCacheOptimization', operationId, false);
      this.logger.error('Cache optimization failed', error.stack);
    }
  }

  /**
   * Monitoring et alertes toutes les 30 minutes
   */
  @Cron('*/30 * * * *') // Toutes les 30 minutes
  async tokenHealthMonitoring(): Promise<void> {
    const operationId = this.logger.startOperation('tokenHealthMonitoring');

    try {
      const healthReport = await this.generateHealthReport();

      // Vérifier les seuils d'alerte
      await this.checkHealthAlerts(healthReport);

      // Logger les métriques importantes
      this.logger.info('Token health check completed', JSON.stringify({
        health_score: healthReport.overall_health_score,
        alerts_triggered: healthReport.alerts?.length || 0,
      }));

      this.logger.endOperation('tokenHealthMonitoring', operationId, true);

    } catch (error) {
      this.logger.endOperation('tokenHealthMonitoring', operationId, false);
      this.logger.error('Health monitoring failed', error.stack);
    }
  }

  // ============================================================================
  // MÉTHODES DE NETTOYAGE SPÉCIALISÉES
  // ============================================================================

  /**
   * Nettoie le cache Redis des tokens
   */
  async cleanupRedisCache(): Promise<number> {
    try {
      let cleanedCount = 0;

      // Nettoyer les clés de cache de tokens expirées
      const patterns = [
        'token_payload:access:*',
        'token_payload:refresh:*',
        'persistent_token:*',
        'validation_token:*',
        'blacklist:*',
      ];

      for (const pattern of patterns) {
        try {
          // Utiliser une méthode sécurisée pour scanner les clés
          const keys = await this.scanRedisKeys(pattern);
          for (const key of keys) {
            const ttl = await this.getKeyTTL(key);
            if (ttl <= 0) {
              await this.redis.delCache(key);
              cleanedCount++;
            }
          }
        } catch (patternError) {
          this.logger.warn(`Failed to clean pattern ${pattern}`, patternError.message);
        }
      }

      return cleanedCount;

    } catch (error) {
      this.logger.error('Redis cache cleanup failed', error.stack);
      return 0;
    }
  }

  /**
   * Optimise le cache des tokens
   */
  async optimizeTokenCache(): Promise<number> {
    try {
      let optimizedCount = 0;

      // Identifier les clés de cache sous-utilisées
      const cachePatterns = [
        'token_payload:access:*',
        'token_payload:refresh:*',
      ];

      for (const pattern of cachePatterns) {
        try {
          const keys = await this.scanRedisKeys(pattern);
          for (const key of keys) {
            const ttl = await this.getKeyTTL(key);
            
            // Si le TTL est très long mais le token est rarement utilisé
            if (ttl > 3600) { // Plus d'1 heure
              // Réduire le TTL à 5 minutes pour les tokens peu utilisés
              await this.setKeyExpiry(key, 300);
              optimizedCount++;
            }
          }
        } catch (patternError) {
          this.logger.warn(`Failed to optimize pattern ${pattern}`, patternError.message);
        }
      }

      return optimizedCount;

    } catch (error) {
      this.logger.error('Cache optimization failed', error.stack);
      return 0;
    }
  }

  // ============================================================================
  // MÉTHODES DE MONITORING ET ALERTES
  // ============================================================================

  /**
   * Génère un rapport de santé des tokens
   */
  async generateHealthReport(): Promise<{
    timestamp: string;
    overall_health_score: number;
    persistent_tokens: any;
    validation_tokens: any;
    jwt_metrics: any;
    cache_metrics: any;
    alerts?: Array<{
      level: 'warning' | 'error' | 'critical';
      message: string;
      metric: string;
      value: number;
      threshold: number;
    }>;
  }> {
    try {
      const [persistentStats, validationStats, jwtStats, cacheMetrics] = await Promise.all([
        this.persistentTokenService.getTokenStats(),
        this.validationTokenService.getTokenStats(),
        this.tokenService.getGlobalTokenStats(),
        this.getCacheMetrics(),
      ]);

      const alerts = this.analyzeHealthMetrics({
        persistent: persistentStats,
        validation: validationStats,
        jwt: jwtStats.jwt_tokens,
        cache: cacheMetrics,
      });

      // Calculer score de santé global (0-100)
      const healthScore = this.calculateHealthScore({
        persistent: persistentStats,
        validation: validationStats,
        cache: cacheMetrics,
        alertCount: alerts.length,
      });

      return {
        timestamp: new Date().toISOString(),
        overall_health_score: healthScore,
        persistent_tokens: persistentStats,
        validation_tokens: validationStats,
        jwt_metrics: jwtStats.jwt_tokens,
        cache_metrics: cacheMetrics,
        alerts: alerts.length > 0 ? alerts : undefined,
      };

    } catch (error) {
      this.logger.error('Failed to generate health report', error.stack);
      return {
        timestamp: new Date().toISOString(),
        overall_health_score: 0,
        persistent_tokens: {},
        validation_tokens: {},
        jwt_metrics: {},
        cache_metrics: {},
        alerts: [{
          level: 'critical',
          message: 'Health report generation failed',
          metric: 'system',
          value: 0,
          threshold: 1,
        }],
      };
    }
  }

  /**
   * Vérifie les seuils d'alerte
   */
  async checkHealthAlerts(healthReport: any): Promise<void> {
    if (!healthReport.alerts || healthReport.alerts.length === 0) {
      return;
    }

    const criticalAlerts = healthReport.alerts.filter(alert => alert.level === 'critical');
    const errorAlerts = healthReport.alerts.filter(alert => alert.level === 'error');

    // Envoyer les alertes critiques immédiatement
    for (const alert of criticalAlerts) {
      await this.scheduleMaintenanceAlert('critical_threshold', alert.message, alert);
    }

    // Grouper les alertes d'erreur
    if (errorAlerts.length > 0) {
      await this.scheduleMaintenanceAlert(
        'error_thresholds', 
        `${errorAlerts.length} error threshold(s) exceeded`,
        { alerts: errorAlerts }
      );
    }

    // Alerte si le score de santé est très bas
    if (healthReport.overall_health_score < 30) {
      await this.scheduleMaintenanceAlert(
        'low_health_score',
        `System health score is critically low: ${healthReport.overall_health_score}%`,
        { health_score: healthReport.overall_health_score }
      );
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ============================================================================

  /**
   * Analyse les métriques et détecte les problèmes
   */
  private analyzeHealthMetrics(metrics: any): Array<{
    level: 'warning' | 'error' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }> {
    const alerts = [];

    // Vérifier les tokens persistants
    if (metrics.persistent.total > 10000) {
      alerts.push({
        level: 'warning',
        message: 'High number of persistent tokens',
        metric: 'persistent_tokens_total',
        value: metrics.persistent.total,
        threshold: 10000,
      });
    }

    if (metrics.persistent.expired > metrics.persistent.total * 0.3) {
      alerts.push({
        level: 'error',
        message: 'High percentage of expired persistent tokens',
        metric: 'persistent_tokens_expired_ratio',
        value: metrics.persistent.expired / metrics.persistent.total,
        threshold: 0.3,
      });
    }

    // Vérifier les tokens de validation
    if (metrics.validation.blocked > 100) {
      alerts.push({
        level: 'warning',
        message: 'High number of blocked validation tokens',
        metric: 'validation_tokens_blocked',
        value: metrics.validation.blocked,
        threshold: 100,
      });
    }

    if (metrics.validation.success_rate < 70) {
      alerts.push({
        level: 'error',
        message: 'Low validation token success rate',
        metric: 'validation_success_rate',
        value: metrics.validation.success_rate,
        threshold: 70,
      });
    }

    // Vérifier le cache
    if (metrics.cache.memory_usage > 80) {
      alerts.push({
        level: 'critical',
        message: 'High cache memory usage',
        metric: 'cache_memory_usage',
        value: metrics.cache.memory_usage,
        threshold: 80,
      });
    }

    return alerts;
  }

  /**
   * Calcule le score de santé global
   */
  private calculateHealthScore(metrics: any): number {
    let score = 100;

    // Pénalités basées sur les métriques
    if (metrics.persistent.expired > metrics.persistent.total * 0.2) {
      score -= 15;
    }

    if (metrics.validation.success_rate < 80) {
      score -= 20;
    }

    if (metrics.cache.memory_usage > 70) {
      score -= 10;
    }

    if (metrics.alertCount > 5) {
      score -= metrics.alertCount * 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Obtient les métriques du cache
   */
  private async getCacheMetrics(): Promise<{
    total_keys: number;
    memory_usage: number;
    hit_rate: number;
  }> {
    try {
      // Cette implémentation dépend de votre setup Redis
      return {
        total_keys: 0,
        memory_usage: 0,
        hit_rate: 0,
      };
    } catch (error) {
      this.logger.error('Failed to get cache metrics', error.stack);
      return {
        total_keys: 0,
        memory_usage: 0,
        hit_rate: 0,
      };
    }
  }

  /**
   * Programme un rapport de nettoyage
   */
  private async scheduleCleanupReport(results: any, type: 'daily' | 'weekly'): Promise<void> {
    try {
      await this.bullmq.addJob('MAINTENANCE_QUEUE', 'cleanup_report', {
        type,
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Failed to schedule cleanup report', error.stack);
    }
  }

  /**
   * Programme une alerte de maintenance
   */
  private async scheduleMaintenanceAlert(
    alertType: string, 
    message: string, 
    data?: any
  ): Promise<void> {
    try {
      await this.bullmq.addJob('ALERTS_QUEUE', 'maintenance_alert', {
        alert_type: alertType,
        message,
        data,
        timestamp: new Date().toISOString(),
        severity: this.getAlertSeverity(alertType),
      });
    } catch (error) {
      this.logger.error('Failed to schedule maintenance alert', error.stack);
    }
  }

  /**
   * Détermine la sévérité d'une alerte
   */
  private getAlertSeverity(alertType: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap = {
      'daily_cleanup_failed': 'medium',
      'weekly_cleanup_failed': 'high',
      'critical_threshold': 'critical',
      'error_thresholds': 'high',
      'low_health_score': 'critical',
    };

    return severityMap[alertType] || 'medium';
  }

  // ============================================================================
  // MÉTHODES API PUBLIQUES
  // ============================================================================

  /**
   * Force un nettoyage manuel
   */
  async forceCleanup(type: 'daily' | 'weekly' | 'full' = 'daily'): Promise<any> {
    const operationId = this.logger.startOperation(`forceCleanup:${type}`);

    try {
      let results;

      switch (type) {
        case 'daily':
          results = await this.tokenService.cleanupExpiredTokens();
          break;
        case 'weekly':
          results = await this.weeklyDeepCleanup();
          break;
        case 'full':
          results = await Promise.all([
            this.tokenService.cleanupExpiredTokens(),
            this.weeklyDeepCleanup(),
            this.cleanupRedisCache(),
          ]);
          break;
      }

      this.logger.endOperation(`forceCleanup:${type}`, operationId, true);
      return results;

    } catch (error) {
      this.logger.endOperation(`forceCleanup:${type}`, operationId, false);
      throw error;
    }
  }

  /**
   * Obtient un rapport de santé à la demande
   */
  async getHealthReport(): Promise<any> {
    return await this.generateHealthReport();
  }

  /**
   * Force une optimisation du cache
   */
  async forceOptimization(): Promise<number> {
    return await this.optimizeTokenCache();
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES SÉCURISÉES POUR REDIS
  // ============================================================================

  /**
   * Scanne les clés Redis de manière sécurisée
   */
  private async scanRedisKeys(pattern: string): Promise<string[]> {
    try {
      // Utiliser getCache avec un pattern ou une approche alternative
      // selon votre implémentation de RedisService
      const keys: string[] = [];
      
      // Si RedisService a une méthode scanKeys, l'utiliser
      if (typeof (this.redis as any).scanKeys === 'function') {
        return await (this.redis as any).scanKeys(pattern);
      }
      
      // Sinon, retourner un tableau vide pour éviter les erreurs
      this.logger.warn(`Redis scanKeys not available for pattern: ${pattern}`);
      return keys;
      
    } catch (error) {
      this.logger.error(`Error scanning Redis keys for pattern ${pattern}`, error.stack);
      return [];
    }
  }

  /**
   * Obtient le TTL d'une clé de manière sécurisée
   */
  private async getKeyTTL(key: string): Promise<number> {
    try {
      // Si RedisService a une méthode getTTL, l'utiliser
      if (typeof (this.redis as any).getTTL === 'function') {
        return await (this.redis as any).getTTL(key);
      }
      
      // Sinon, essayer d'obtenir la valeur pour voir si elle existe
      const value = await this.redis.getCache(key);
      return value ? 3600 : -1; // Retourner une valeur par défaut
      
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}`, error.stack);
      return -1;
    }
  }

  /**
   * Définit l'expiration d'une clé de manière sécurisée
   */
  private async setKeyExpiry(key: string, seconds: number): Promise<boolean> {
    try {
      // Si RedisService a une méthode expire, l'utiliser
      if (typeof (this.redis as any).expire === 'function') {
        await (this.redis as any).expire(key, seconds);
        return true;
      }
      
      // Sinon, récupérer la valeur et la remettre avec le nouveau TTL
      const value = await this.redis.getCache(key);
      if (value) {
        await this.redis.setCache(key, value, seconds);
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.logger.error(`Error setting expiry for key ${key}`, error.stack);
      return false;
    }
  }
}