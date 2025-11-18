/**
 * Interface de configuration Logger chargée via @nestjs/config
 */
export interface LoggerModuleConfig {
  /** Niveau de log (info, warn, error, debug, etc.) */
  level: string;
  /** Format du log (json, simple, pretty) */
  format: 'json' | 'simple' | 'pretty';
  /** Activer la sortie console */
  enableConsole: boolean;
  /** Activer la sortie fichier */
  enableFile: boolean;
  /** Chemin du fichier de log (si enableFile) */
  filePath?: string;
  /** Taille max d'un fichier de log (ex: 10m, 100m) */
  maxSize?: string;
  /** Nombre max de fichiers de log à conserver */
  maxFiles?: string;
} 