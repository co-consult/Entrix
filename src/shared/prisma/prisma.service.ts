// src/shared/prisma/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PRISMA_CONFIG_NAMESPACE } from './prisma.constants';
import { PrismaModuleConfig } from './prisma.interfaces';

// Configuration des types pour les événements Prisma
type LogDefinition = {
  level: 'info' | 'query' | 'warn' | 'error';
  emit: 'event';
};

type GetEvents<T extends Record<PropertyKey, any>> = T extends { level: infer U } ? U : never;

// Type du PrismaClient avec les événements configurés
type PrismaClientWithEvents = PrismaClient<
  {
    log: LogDefinition[];
  },
  GetEvents<LogDefinition>
>;

// Interface publique pour les métriques
export interface PrismaMetrics {
  queryCount: number;
  errorCount: number;
  totalQueryTime: number;
  avgQueryTime: number;
  transactionCount: number;
  connectionCount: number;
  retryCount: number;
}

/**
 * Service Prisma centralisé pour l'accès à la base de données
 * - Gère la connexion, les transactions, les métriques et le shutdown hook
 * - Fournit des méthodes utilitaires pour les opérations avec retry et monitoring
 */
@Injectable()
export class PrismaService 
  extends (PrismaClient as new (...args: any[]) => PrismaClientWithEvents)
  implements OnModuleInit, OnModuleDestroy 
{
  private readonly logger = new Logger(PrismaService.name);
  private metrics: PrismaMetrics = {
    queryCount: 0,
    errorCount: 0,
    totalQueryTime: 0,
    avgQueryTime: 0,
    transactionCount: 0,
    connectionCount: 0,
    retryCount: 0
  };

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    const config = configService.get<PrismaModuleConfig>(PRISMA_CONFIG_NAMESPACE);
    
    super({
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    } as Prisma.PrismaClientOptions);

    // Configuration des event listeners pour les métriques
    this.setupEventListeners();
  }

  /**
   * Configuration des event listeners pour le monitoring
   */
  private setupEventListeners() {
    // Écoute des queries pour les métriques
    this.$on('query', (event: Prisma.QueryEvent) => {
      this.metrics.queryCount++;
      this.metrics.totalQueryTime += event.duration;
      this.metrics.avgQueryTime = this.metrics.totalQueryTime / this.metrics.queryCount;
      
      // Log des queries lentes (>1000ms)
      if (event.duration > 1000) {
        this.logger.warn(`🐌 Query lente détectée: ${event.duration}ms - ${event.query}`);
      }
      
      // Log des queries très lentes (>5000ms) 
      if (event.duration > 5000) {
        this.logger.error(`🚨 Query très lente: ${event.duration}ms - ${event.query}`, {
          duration: event.duration,
          query: event.query,
          params: event.params
        });
      }
    });

    // Écoute des erreurs pour le monitoring
    this.$on('error', (event: Prisma.LogEvent) => {
      this.metrics.errorCount++;
      this.logger.error(`❌ Erreur Prisma: ${event.message}`, {
        target: event.target,
        timestamp: event.timestamp
      });
    });

    // Écoute des infos pour le debugging
    this.$on('info', (event: Prisma.LogEvent) => {
      this.logger.log(`ℹ️ Info Prisma: ${event.message}`, {
        target: event.target,
        timestamp: event.timestamp
      });
    });

    // Écoute des warnings
    this.$on('warn', (event: Prisma.LogEvent) => {
      this.logger.warn(`⚠️ Warning Prisma: ${event.message}`, {
        target: event.target,
        timestamp: event.timestamp
      });
    });
  }

  /**
   * Initialisation du module
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.metrics.connectionCount++;
      this.logger.log('🔗 Connexion à la base de données établie');
      
      // Test de santé initial
      const healthCheck = await this.healthCheck();
      if (healthCheck.status === 'healthy') {
        this.logger.log('✅ Base de données opérationnelle');
      } else {
        this.logger.warn('⚠️ Problème de santé détecté sur la base de données');
      }
    } catch (error) {
      this.logger.error('❌ Échec de connexion à la base de données', error);
      throw error;
    }
  }

  /**
   * Destruction du module
   */
  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('🔌 Connexion à la base de données fermée');
      
      // Log des métriques finales
      this.logger.log('📊 Métriques finales Prisma:', {
        totalQueries: this.metrics.queryCount,
        totalErrors: this.metrics.errorCount,
        averageQueryTime: Math.round(this.metrics.avgQueryTime),
        totalTransactions: this.metrics.transactionCount,
        totalRetries: this.metrics.retryCount
      });
    } catch (error) {
      this.logger.error('❌ Erreur lors de la fermeture de connexion', error);
    }
  }

  /**
   * Vérification de santé de la base de données
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    timestamp: Date;
    metrics: PrismaMetrics;
  }> {
    try {
      const start = Date.now();
      
      // Test simple de connexion
      await this.$queryRaw`SELECT 1`;
      
      const duration = Date.now() - start;
      
      // Considérer comme unhealthy si la requête prend plus de 5 secondes
      const isHealthy = duration < 5000;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy 
          ? `Base de données réactive (${duration}ms)` 
          : `Base de données lente (${duration}ms)`,
        timestamp: new Date(),
        metrics: { ...this.metrics }
      };
    } catch (error) {
      this.logger.error('❌ Health check failed', error);
      return {
        status: 'unhealthy',
        message: `Erreur de connexion: ${error.message}`,
        timestamp: new Date(),
        metrics: { ...this.metrics }
      };
    }
  }

  /**
   * Pagination automatique pour les requêtes
   */
  async paginate<T, A>(
    model: any,
    args: A & {
      where?: any;
      orderBy?: any;
      select?: any;
      include?: any;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // Limite maximale de 100 éléments
    
    const [data, total] = await Promise.all([
      model.findMany({
        ...args,
        skip,
        take,
      }),
      model.count({
        where: args.where,
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      data,
      total,
      page,
      limit: take,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Pagination avec curseur pour de meilleures performances sur de gros datasets
   */
  async paginateWithCursor<T>(
    model: any,
    args: {
      where?: any;
      orderBy: any;
      cursor?: any;
      select?: any;
      include?: any;
    },
    limit: number = 20
  ): Promise<{
    data: T[];
    nextCursor?: any;
    hasNext: boolean;
  }> {
    const take = Math.min(limit + 1, 100); // +1 pour détecter s'il y a une page suivante
    
    const results = await model.findMany({
      ...args,
      take,
    });

    const hasNext = results.length > limit;
    const data = hasNext ? results.slice(0, -1) : results;
    const nextCursor = hasNext ? results[results.length - 2] : null;

    return {
      data,
      nextCursor,
      hasNext,
    };
  }

  /**
   * Exécution avec retry automatique
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: Error;
    let delay = delayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          this.metrics.retryCount++;
          this.logger.log(`✅ Opération réussie après ${attempt} tentative(s)`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Ne pas retry sur certaines erreurs
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          this.logger.error(`❌ Échec après ${maxRetries} tentatives`, error);
          break;
        }
        
        this.logger.warn(`⚠️ Tentative ${attempt} échouée, retry dans ${delay}ms`, {
          error: error.message,
          attempt,
          maxRetries
        });
        
        await this.delay(delay);
        delay *= backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * Transaction avec retry automatique
   */
  async transactionWithRetry<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    return this.executeWithRetry(
      () => {
        this.metrics.transactionCount++;
        return this.$transaction(operation);
      },
      maxRetries
    );
  }

  /**
   * Détermine si une erreur ne doit pas être retryée
   */
  private isNonRetryableError(error: any): boolean {
    // Erreurs de validation Prisma
    if (error.code === 'P2002') return true; // Unique constraint
    if (error.code === 'P2025') return true; // Record not found
    if (error.code === 'P2003') return true; // Foreign key constraint
    if (error.code === 'P2004') return true; // Constraint failed
    
    // Erreurs de syntaxe
    if (error.code?.startsWith('P1')) return true;
    
    return false;
  }

  /**
   * Utilitaire de délai pour les retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtenir les métriques actuelles
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptimeSeconds: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date()
    };
  }

  /**
   * Reset des métriques (utile pour les tests)
   */
  resetMetrics() {
    this.metrics = {
      queryCount: 0,
      errorCount: 0,
      totalQueryTime: 0,
      avgQueryTime: 0,
      transactionCount: 0,
      connectionCount: 0,
      retryCount: 0
    };
  }
}