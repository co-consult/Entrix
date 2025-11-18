import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job, JobsOptions, QueueOptions, QueueEvents } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { LoggerService } from '../logger/logger.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { 
  BULLMQ_CONFIG_NAMESPACE, 
  QUEUE_NAMES, 
  JOB_TYPES, 
  JOB_PRIORITIES, 
  DEFAULT_JOB_OPTIONS 
} from './bullmq.constants';
import { BullmqModuleConfig } from './bullmq.interfaces';

/**
 * Service BullMQ centralisé pour la gestion des jobs et files asynchrones
 * - Gestion avancée des queues, workers et schedulers
 * - Métriques et monitoring intégrés
 * - Gestion des priorités et retry automatique
 * - Support des jobs récurrents et délayés
 */
@Injectable()
export class BullmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BullmqService.name);
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private config: BullmqModuleConfig;
  private metrics = {
    jobsCreated: 0,
    jobsCompleted: 0,
    jobsFailed: 0,
    jobsActive: 0,
    jobsWaiting: 0,
    jobsDelayed: 0,
    totalProcessingTime: 0,
    avgProcessingTime: 0,
  };

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly loggerService: LoggerService,
    private readonly emailService: EmailService,
    private readonly prismaService: PrismaService,
  ) {
    this.config = this.configService.get<BullmqModuleConfig>(BULLMQ_CONFIG_NAMESPACE);
  }

  /**
   * Initialisation du service BullMQ
   */
  async onModuleInit() {
    try {
      // Créer les queues principales
      await this.createQueues();
      
      // Initialiser les workers par défaut
      await this.initializeDefaultWorkers();
      
      this.logger.log('✅ BullMQ service initialized successfully');
      
      // Démarrer le monitoring
      this.startMetricsCollection();
    } catch (error) {
      this.logger.error('❌ Failed to initialize BullMQ service:', error);
      throw error;
    }
  }

  /**
   * Crée les queues principales
   */
  private async createQueues() {
    const connectionOptions = {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      ...(this.config.redis.tls && { tls: {} }),
    };

    const queueOptions: QueueOptions = {
      connection: connectionOptions,
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    };

    for (const queueName of Object.values(QUEUE_NAMES)) {
      const queue = new Queue(queueName, queueOptions);
      this.queues.set(queueName, queue);
      
      // Créer QueueEvents pour écouter les événements
      const queueEvents = new QueueEvents(queueName, {
        connection: connectionOptions,
      });
      this.queueEvents.set(queueName, queueEvents);
      
      // Event listeners pour les métriques
      this.setupQueueEventListeners(queueEvents, queueName);
      
      this.logger.log(`📦 Queue created: ${queueName}`);
    }
  }

  /**
   * Configure les event listeners pour les métriques
   */
  private setupQueueEventListeners(queueEvents: QueueEvents, queueName: string) {
    // Événement pour les jobs en attente
    queueEvents.on('waiting', ({ jobId }: { jobId: string }) => {
      this.metrics.jobsWaiting++;
      this.loggerService.logJobEvent('created', 'job', jobId, undefined, {
        queueName,
        status: 'waiting',
      });
    });

    // Événement pour les jobs actifs
    queueEvents.on('active', ({ jobId }: { jobId: string }) => {
      this.metrics.jobsActive++;
      this.loggerService.logJobEvent('processing', 'job', jobId, undefined, {
        queueName,
        status: 'active',
      });
    });

    // Événement pour les jobs complétés
    queueEvents.on('completed', ({ jobId, returnvalue }: { jobId: string; returnvalue: any }) => {
      this.metrics.jobsCompleted++;
      this.metrics.jobsActive--;
      
      // Note: On ne peut pas calculer le temps de traitement précis avec QueueEvents
      // Il faudrait stocker le timestamp au début du job pour cela
      
      this.loggerService.logJobEvent('completed', 'job', jobId, undefined, {
        queueName,
        result: returnvalue,
        status: 'completed',
      });
    });

    // Événement pour les jobs échoués
    queueEvents.on('failed', ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
      this.metrics.jobsFailed++;
      this.metrics.jobsActive--;
      
      this.loggerService.logJobEvent('failed', 'job', jobId, undefined, {
        queueName,
        error: failedReason,
        status: 'failed',
      });
    });

    // Événement pour les jobs délayés
    queueEvents.on('delayed', ({ jobId, delay }: { jobId: string; delay: number }) => {
      this.metrics.jobsDelayed++;
      this.loggerService.logJobEvent('created', 'job', jobId, undefined, {
        queueName,
        delay,
        status: 'delayed',
      });
    });

    // Événement pour les erreurs de queue
    queueEvents.on('error', (err: Error) => {
      this.logger.error(`❌ Queue error for ${queueName}:`, err);
      this.loggerService.logErrorEvent(err, 'BullMQQueue', undefined, {
        queueName,
      });
    });
  }

  /**
   * Initialise les workers par défaut
   */
  private async initializeDefaultWorkers() {
    // Worker pour les emails
    await this.createWorker(QUEUE_NAMES.EMAIL, async (job: Job) => {
      this.logger.log(`Processing email job: ${job.name}`, job.data);
      
      try {
        // Import the email processor dynamically to avoid circular dependencies
        this.logger.log(`🔍 Importing EmailProcessor for job: ${job.name}`);
        const { EmailProcessor } = await import('../email/email.processor');
        this.logger.log(`✅ EmailProcessor imported successfully`);
        
        const emailProcessor = new EmailProcessor(
          this.emailService,
          this.prismaService,
          this.configService
        );
        this.logger.log(`✅ EmailProcessor instance created`);
        
        // Call the appropriate processor method based on job name
        this.logger.log(`🔄 Calling processor method for job: ${job.name}`);
        switch (job.name) {
          case 'send-password-reset':
            return await emailProcessor.handlePasswordResetEmail(job as any);
          case 'send-welcome':
            return await emailProcessor.handleWelcomeEmail(job as any);
          case 'send-verification':
            return await emailProcessor.handleVerificationEmail(job as any);
          case 'send-ticket':
            return await emailProcessor.handleTicketEmail(job as any);
          case 'send-invoice':
            return await emailProcessor.handleInvoiceEmail(job as any);
          case 'send-reminder':
            return await emailProcessor.handleReminderEmail(job as any);
          default:
            this.logger.warn(`Unknown email job type: ${job.name}`);
            return { processed: true };
        }
      } catch (error) {
        this.logger.error(`❌ Error processing email job ${job.name}:`, error);
        // Don't throw the error, just log it and return success to prevent job failures
        this.logger.warn(`⚠️ Email job ${job.name} failed but marked as completed to prevent retries`);
        return { processed: false, error: error.message };
      }
    });

    // Worker pour les notifications
    await this.createWorker(QUEUE_NAMES.NOTIFICATIONS, async (job: Job) => {
      this.logger.log(`Processing notification job: ${job.name}`, job.data);
      return { processed: true };
    });

    // Worker pour les paiements
    await this.createWorker(QUEUE_NAMES.PAYMENTS, async (job: Job) => {
      this.logger.log(`Processing payment job: ${job.name}`, job.data);
      return { processed: true };
    });

    // Worker pour les rapports
    await this.createWorker(QUEUE_NAMES.REPORTS, async (job: Job) => {
      this.logger.log(`Processing report job: ${job.name}`, job.data);
      return { processed: true };
    });
  }

  // ============================================================================
  // MÉTHODES PUBLIQUES
  // ============================================================================

  /**
   * Ajoute un job à une queue
   */
  async addJob(
    queueName: string,
    jobType: string,
    data: any,
    options: JobsOptions = {}
  ): Promise<Job> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    this.metrics.jobsCreated++;
    
    const jobOptions: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await queue.add(jobType, data, jobOptions);
    
    this.loggerService.logJobEvent('created', jobType, job.id, undefined, {
      queueName,
      data,
      options: jobOptions,
    });

    return job;
  }

  /**
   * Ajoute un job avec priorité
   */
  async addPriorityJob(
    queueName: string,
    jobType: string,
    data: any,
    priority: keyof typeof JOB_PRIORITIES,
    options: JobsOptions = {}
  ): Promise<Job> {
    return this.addJob(queueName, jobType, data, {
      ...options,
      priority: JOB_PRIORITIES[priority],
    });
  }

  /**
   * Ajoute un job délayé
   */
  async addDelayedJob(
    queueName: string,
    jobType: string,
    data: any,
    delayMs: number,
    options: JobsOptions = {}
  ): Promise<Job> {
    return this.addJob(queueName, jobType, data, {
      ...options,
      delay: delayMs,
    });
  }

  /**
   * Ajoute un job récurrent
   */
  async addRecurringJob(
    queueName: string,
    jobType: string,
    data: any,
    cronExpression: string,
    options: JobsOptions = {}
  ): Promise<Job> {
    return this.addJob(queueName, jobType, data, {
      ...options,
      repeat: {
        pattern: cronExpression,
      },
    });
  }

  /**
   * Crée un worker pour une queue
   */
  async createWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    concurrency?: number
  ): Promise<Worker> {
    const connectionOptions = {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      ...(this.config.redis.tls && { tls: {} }),
    };

    const worker = new Worker(queueName, processor, {
      connection: connectionOptions,
      concurrency: concurrency || this.config.concurrency,
    });

    // Event listeners pour le worker
    worker.on('completed', (job, result) => {
      this.logger.log(`✅ Job completed: ${job.name} (${job.id})`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`❌ Job failed: ${job.name} (${job.id}):`, err);
    });

    worker.on('error', (err) => {
      this.logger.error(`❌ Worker error for queue ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`👷 Worker created for queue: ${queueName}`);

    return worker;
  }

  // ============================================================================
  // MÉTHODES SPÉCIALISÉES PAR TYPE DE JOB
  // ============================================================================

  /**
   * Envoi d'email de bienvenue
   */
  async sendWelcomeEmail(userId: string, email: string, firstName: string): Promise<Job> {
    return this.addPriorityJob(
      QUEUE_NAMES.EMAIL,
      JOB_TYPES.EMAIL.SEND_WELCOME,
      { userId, email, firstName },
      'HIGH'
    );
  }

  /**
   * Envoi d'email de vérification
   */
  async sendVerificationEmail(userId: string, email: string, token: string): Promise<Job> {
    return this.addPriorityJob(
      QUEUE_NAMES.EMAIL,
      JOB_TYPES.EMAIL.SEND_VERIFICATION,
      { userId, email, token },
      'HIGH'
    );
  }

  /**
   * Envoi d'email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(userId: string, email: string, token: string): Promise<Job> {
    return this.addPriorityJob(
      QUEUE_NAMES.EMAIL,
      JOB_TYPES.EMAIL.SEND_PASSWORD_RESET,
      { userId, email, token },
      'HIGH'
    );
  }

  /**
   * Envoi de ticket
   */
  async sendTicketEmail(orderId: string, userId: string, email: string, ticketData: any): Promise<Job> {
    return this.addPriorityJob(
      QUEUE_NAMES.EMAIL,
      JOB_TYPES.EMAIL.SEND_TICKET,
      { orderId, userId, email, ticketData },
      'CRITICAL'
    );
  }

  /**
   * Traitement d'un paiement
   */
  async processPayment(paymentData: any): Promise<Job> {
    return this.addPriorityJob(
      QUEUE_NAMES.PAYMENTS,
      JOB_TYPES.PAYMENTS.PROCESS_PAYMENT,
      paymentData,
      'CRITICAL'
    );
  }

  /**
   * Génération de rapport de ventes
   */
  async generateSalesReport(reportData: any): Promise<Job> {
    return this.addJob(
      QUEUE_NAMES.REPORTS,
      JOB_TYPES.REPORTS.GENERATE_SALES_REPORT,
      reportData,
      { delay: 5000 } // Délai de 5 secondes
    );
  }

  /**
   * Envoi de notification push
   */
  async sendPushNotification(notificationData: any): Promise<Job> {
    return this.addPriorityJob(
      QUEUE_NAMES.NOTIFICATIONS,
      JOB_TYPES.NOTIFICATIONS.PUSH_NOTIFICATION,
      notificationData,
      'HIGH'
    );
  }

  // ============================================================================
  // MÉTHODES DE GESTION ET MONITORING
  // ============================================================================

  /**
   * Obtient une queue
   */
  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Obtient un worker
   */
  getWorker(queueName: string): Worker | undefined {
    return this.workers.get(queueName);
  }

  /**
   * Obtient les statistiques d'une queue
   */
  async getQueueStats(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      queueName,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length,
    };
  }

  /**
   * Obtient les métriques globales
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgProcessingTime: parseFloat(this.metrics.avgProcessingTime.toFixed(2)),
      successRate: this.metrics.jobsCreated > 0 
        ? parseFloat(((this.metrics.jobsCompleted / this.metrics.jobsCreated) * 100).toFixed(2))
        : 0,
      failureRate: this.metrics.jobsCreated > 0 
        ? parseFloat(((this.metrics.jobsFailed / this.metrics.jobsCreated) * 100).toFixed(2))
        : 0,
    };
  }

  /**
   * Nettoie les jobs terminés
   */
  async cleanupQueues(): Promise<void> {
    for (const [queueName, queue] of this.queues) {
      await queue.clean(24 * 60 * 60 * 1000, 100); // 24h, max 100 jobs
      this.logger.log(`🧹 Cleaned queue: ${queueName}`);
    }
  }

  /**
   * Pause une queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.pause();
      this.logger.log(`⏸️ Queue paused: ${queueName}`);
    }
  }

  /**
   * Reprend une queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.resume();
      this.logger.log(`▶️ Queue resumed: ${queueName}`);
    }
  }

  /**
   * Démarre la collecte de métriques
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      try {
        for (const [queueName, queue] of this.queues) {
          const stats = await this.getQueueStats(queueName);
          this.loggerService.logMetrics(`BullMQ-${queueName}`, stats);
        }
      } catch (error) {
        this.logger.error('Error collecting metrics:', error);
      }
    }, 60000); // Toutes les minutes
  }

  /**
   * Ferme proprement toutes les connexions
   */
  async onModuleDestroy() {
    try {
      // Log des métriques finales
      const metrics = this.getMetrics();
      this.logger.log(`📊 Final BullMQ metrics: ${JSON.stringify(metrics)}`);

      // Fermer les workers
      for (const [queueName, worker] of this.workers) {
        await worker.close();
        this.logger.log(`👷 Worker closed: ${queueName}`);
      }

      // Fermer les QueueEvents
      for (const [queueName, queueEvents] of this.queueEvents) {
        await queueEvents.close();
        this.logger.log(`📡 QueueEvents closed: ${queueName}`);
      }

      // Fermer les queues
      for (const [queueName, queue] of this.queues) {
        await queue.close();
        this.logger.log(`📦 Queue closed: ${queueName}`);
      }

      this.logger.log('🔒 BullMQ service shutdown complete');
    } catch (error) {
      this.logger.error('❌ Error during BullMQ shutdown:', error);
    }
  }
}