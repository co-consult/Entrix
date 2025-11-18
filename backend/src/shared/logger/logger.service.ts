import { Injectable, LoggerService as NestLoggerService, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import winston, { Logger as WinstonLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LOGGER_CONFIG_NAMESPACE } from './logger.constants';
import { LoggerModuleConfig } from './logger.interfaces';

/**
 * Service Logger centralisé pour l'application (Winston)
 * - Gère la configuration, les transports, les formats et l'intégration NestJS
 * - Fournit des méthodes spécialisées pour les événements business, sécurité, performance, etc.
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: WinstonLogger;
  private context: string = 'Application';

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.setupLogger();
  }

  /**
   * Configuration du logger Winston
   */
  private setupLogger() {
    const config = this.configService.get<LoggerModuleConfig>(LOGGER_CONFIG_NAMESPACE);
    const logTransports = [];

    // Format du log avec plus d'informations
    let logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    );

    if (config.format === 'simple') {
      logFormat = format.combine(
        logFormat,
        format.printf(({ level, message, timestamp, context, ...meta }) => {
          return `[${timestamp}] ${level.toUpperCase()}: ${context ? `[${context}] ` : ''}${message}`;
        })
      );
    } else if (config.format === 'pretty') {
      logFormat = format.combine(
        logFormat,
        format.colorize(),
        format.printf(({ level, message, timestamp, context, ...meta }) => {
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
          return `[${timestamp}] ${level}: ${context ? `[${context}] ` : ''}${message}${metaStr}`;
        })
      );
    } else {
      logFormat = format.combine(
        logFormat,
        format.json()
      );
    }

    // Transport console
    if (config.enableConsole) {
      logTransports.push(new transports.Console({
        level: config.level,
        format: logFormat,
        handleExceptions: true,
        handleRejections: true,
      }));
    }

    // Transport fichier (avec rotation)
    if (config.enableFile && config.filePath) {
      // Logs généraux
      logTransports.push(new DailyRotateFile({
        filename: config.filePath,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: config.maxSize || '10m',
        maxFiles: config.maxFiles || '30d',
        level: config.level,
        format: logFormat,
        handleExceptions: true,
        handleRejections: true,
      }));

      // Logs d'erreur séparés
      logTransports.push(new DailyRotateFile({
        filename: config.filePath.replace('%DATE%', 'error-%DATE%'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: config.maxSize || '10m',
        maxFiles: config.maxFiles || '30d',
        level: 'error',
        format: logFormat,
        handleExceptions: true,
        handleRejections: true,
      }));

      // Logs business séparés
      logTransports.push(new DailyRotateFile({
        filename: config.filePath.replace('%DATE%', 'business-%DATE%'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: config.maxSize || '10m',
        maxFiles: config.maxFiles || '30d',
        level: 'info',
        format: logFormat,
        handleExceptions: true,
        handleRejections: true,
      }));
    }

    this.logger = winston.createLogger({
      level: config.level,
      format: logFormat,
      transports: logTransports,
      exitOnError: false,
      defaultMeta: {
        service: 'entrix-backend',
        environment: process.env.NODE_ENV || 'development',
      },
    });

    // Log de démarrage
    this.logger.info('🚀 Logger service initialized', {
      level: config.level,
      format: config.format,
      transports: logTransports.length,
    });
  }

  /**
   * Définit le contexte pour ce logger
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Crée un logger enfant avec un contexte spécifique
   */
  createChildLogger(context: string): LoggerService {
    const childLogger = new LoggerService(this.configService);
    childLogger.setContext(context);
    return childLogger;
  }

  // ============================================================================
  // MÉTHODES STANDARD NESTJS
  // ============================================================================

  log(message: any, context?: string, ...meta: any[]) {
    this.logger.info(message, {
      context: context || this.context,
      ...meta,
    });
  }

  info(message: any, context?: string, ...meta: any[]) {
    this.logger.info(message, {
      context: context || this.context,
      ...meta,
    });
  }

  warn(message: any, context?: string, ...meta: any[]) {
    this.logger.warn(message, {
      context: context || this.context,
      ...meta,
    });
  }

  error(message: any, trace?: string, context?: string, ...meta: any[]) {
    this.logger.error(message, {
      context: context || this.context,
      trace,
      ...meta,
    });
  }

  debug(message: any, context?: string, ...meta: any[]) {
    this.logger.debug(message, {
      context: context || this.context,
      ...meta,
    });
  }

  verbose(message: any, context?: string, ...meta: any[]) {
    this.logger.verbose(message, {
      context: context || this.context,
      ...meta,
    });
  }

  // ============================================================================
  // MÉTHODES BUSINESS SPÉCIALISÉES
  // ============================================================================

  /**
   * Log d'événement business avec catégorisation
   */
  logBusinessEvent(
    event: string,
    data: any,
    userId?: string,
    organizerId?: string,
    metadata?: any
  ): void {
    this.logger.info(`[BUSINESS] ${event}`, {
      context: 'BusinessEvent',
      eventType: event,
      userId,
      organizerId,
      data,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements de paiement
   */
  logPaymentEvent(
    orderId: string,
    amount: number,
    currency: string = 'TND',
    status: 'initiated' | 'processing' | 'completed' | 'failed' | 'refunded',
    provider?: string,
    metadata?: any
  ): void {
    this.logger.info(`[PAYMENT] ${status.toUpperCase()}`, {
      context: 'PaymentEvent',
      orderId,
      amount,
      currency,
      status,
      provider,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements de sécurité
   */
  logSecurityEvent(
    event: string,
    userId?: string,
    ip?: string,
    userAgent?: string,
    metadata?: any
  ): void {
    this.logger.warn(`[SECURITY] ${event}`, {
      context: 'SecurityEvent',
      eventType: event,
      userId,
      ip,
      userAgent,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements d'authentification
   */
  logAuthEvent(
    event: 'login' | 'logout' | 'register' | 'password_reset' | 'email_verification' | 'failed_login',
    userId?: string,
    email?: string,
    ip?: string,
    userAgent?: string,
    metadata?: any
  ): void {
    const level = event === 'failed_login' ? 'warn' : 'info';
    this.logger[level](`[AUTH] ${event.toUpperCase()}`, {
      context: 'AuthEvent',
      eventType: event,
      userId,
      email,
      ip,
      userAgent,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements de performance
   */
  logPerformanceEvent(
    operation: string,
    duration: number,
    metadata?: any
  ): void {
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
    this.logger[level](`[PERFORMANCE] ${operation}`, {
      context: 'PerformanceEvent',
      operation,
      duration,
      slow: duration > 1000,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements d'erreur avec catégorisation
   */
  logErrorEvent(
    error: Error,
    context?: string,
    userId?: string,
    metadata?: any
  ): void {
    this.logger.error(`[ERROR] ${error.message}`, {
      context: context || 'ErrorEvent',
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      userId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements d'API avec détails de requête
   */
  logApiEvent(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
    ip?: string,
    userAgent?: string,
    metadata?: any
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.logger[level](`[API] ${method} ${url}`, {
      context: 'ApiEvent',
      method,
      url,
      statusCode,
      duration,
      userId,
      ip,
      userAgent,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements de cache
   */
  logCacheEvent(
    event: 'hit' | 'miss' | 'set' | 'del' | 'expire',
    key: string,
    ttl?: number,
    metadata?: any
  ): void {
    this.logger.debug(`[CACHE] ${event.toUpperCase()}`, {
      context: 'CacheEvent',
      eventType: event,
      key,
      ttl,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements de queue/job
   */
  logJobEvent(
    event: 'created' | 'processing' | 'completed' | 'failed' | 'retry',
    jobType: string,
    jobId: string,
    duration?: number,
    metadata?: any
  ): void {
    const level = event === 'failed' ? 'error' : event === 'retry' ? 'warn' : 'info';
    this.logger[level](`[JOB] ${event.toUpperCase()}`, {
      context: 'JobEvent',
      eventType: event,
      jobType,
      jobId,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements de webhook
   */
  logWebhookEvent(
    event: 'received' | 'processed' | 'failed' | 'retry',
    provider: string,
    webhookType: string,
    webhookId?: string,
    metadata?: any
  ): void {
    const level = event === 'failed' ? 'error' : event === 'retry' ? 'warn' : 'info';
    this.logger[level](`[WEBHOOK] ${event.toUpperCase()}`, {
      context: 'WebhookEvent',
      eventType: event,
      provider,
      webhookType,
      webhookId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log des événements de notification
   */
  logNotificationEvent(
    event: 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked',
    type: 'email' | 'sms' | 'push' | 'in_app',
    recipient: string,
    notificationId?: string,
    metadata?: any
  ): void {
    const level = event === 'failed' ? 'error' : 'info';
    this.logger[level](`[NOTIFICATION] ${event.toUpperCase()}`, {
      context: 'NotificationEvent',
      eventType: event,
      type,
      recipient,
      notificationId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Méthode pour logger le début d'une opération
   */
  startOperation(operationName: string, metadata?: any): string {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.info(`[OPERATION] START ${operationName}`, {
      context: 'OperationEvent',
      operationId,
      operationName,
      metadata,
      timestamp: new Date().toISOString(),
    });

    return operationId;
  }

  /**
   * Méthode pour logger la fin d'une opération
   */
  endOperation(operationName: string, operationId: string, success: boolean, duration?: number, metadata?: any): void {
    const level = success ? 'info' : 'error';
    
    this.logger[level](`[OPERATION] END ${operationName}`, {
      context: 'OperationEvent',
      operationId,
      operationName,
      success,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Méthode pour logger avec une structure personnalisée
   */
  logStructured(
    level: 'info' | 'warn' | 'error' | 'debug' | 'verbose',
    message: string,
    data: any
  ): void {
    this.logger[level](message, {
      context: this.context,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Méthode pour logger les métriques
   */
  logMetrics(component: string, metrics: any): void {
    this.logger.info(`[METRICS] ${component}`, {
      context: 'MetricsEvent',
      component,
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Méthode pour logger les événements de santé (health check)
   */
  logHealthCheck(
    component: string,
    status: 'healthy' | 'unhealthy' | 'degraded',
    details?: any
  ): void {
    const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
    
    this.logger[level](`[HEALTH] ${component}`, {
      context: 'HealthEvent',
      component,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}