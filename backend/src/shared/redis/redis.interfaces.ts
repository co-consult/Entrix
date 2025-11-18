/**
 * Interface de configuration Redis chargée via @nestjs/config
 */
export interface RedisModuleConfig {
  /** Hôte Redis */
  host: string;
  /** Port Redis */
  port: number;
  /** Mot de passe Redis (optionnel) */
  password?: string;
  /** Numéro de base de données Redis (par défaut 0) */
  db: number;
  /** Connexion TLS (optionnel) */
  tls?: boolean;
} 