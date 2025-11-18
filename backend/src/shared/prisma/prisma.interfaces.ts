/**
 * Interface de configuration Prisma chargée via @nestjs/config
 */
export interface PrismaModuleConfig {
  /** URL de connexion à la base de données */
  databaseUrl: string;
  /** Niveau de log Prisma (info, warn, error, query) */
  logLevel: 'info' | 'warn' | 'error' | 'query';
  /** Taille minimale du pool de connexions */
  poolMin: number;
  /** Taille maximale du pool de connexions */
  poolMax: number;
} 