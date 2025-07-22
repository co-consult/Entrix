/**
 * Interface de configuration Redis pour BullMQ
 */
export interface BullmqRedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  tls?: boolean;
}

/**
 * Interface de configuration BullMQ chargée via @nestjs/config
 */
export interface BullmqModuleConfig {
  prefix: string;
  concurrency: number;
  redis: BullmqRedisConfig;
} 