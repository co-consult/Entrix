// src/shared/hashing/hashing.service.ts
/**
 * Service centralisé de hashing et vérification
 * 
 * Responsabilités :
 * - Hash des mots de passe utilisateurs
 * - Hash des tokens MFA
 * - Hash des clés API
 * - Vérification sécurisée avec bcrypt
 * - Configuration centralisée
 * 
 * Utilisation :
 * - AuthService : mots de passe utilisateurs
 * - MfaService : tokens MFA et codes de secours
 * - ApiKeyService : clés API
 * - Tous autres besoins de hashing sécurisé
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

export interface HashingConfig {
  passwordRounds: number;
  tokenRounds: number;
  apiKeyRounds: number;
  algorithm: string;
}

export interface HashingMetrics {
  hashesGenerated: number;
  verificationsPerformed: number;
  failedVerifications: number;
  averageHashTime: number;
  averageVerifyTime: number;
}

@Injectable()
export class HashingService {
  private readonly logger = new Logger(HashingService.name);
  private readonly config: HashingConfig;
  private readonly metrics: HashingMetrics;

  constructor(private readonly configService: ConfigService) {
    // Configuration centralisée
    this.config = {
      passwordRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      tokenRounds: parseInt(process.env.BCRYPT_TOKEN_ROUNDS || process.env.BCRYPT_ROUNDS || '10'),
      apiKeyRounds: parseInt(process.env.BCRYPT_API_ROUNDS || '8'),
      algorithm: 'bcrypt',
    };

    // Métriques de performance
    this.metrics = {
      hashesGenerated: 0,
      verificationsPerformed: 0,
      failedVerifications: 0,
      averageHashTime: 0,
      averageVerifyTime: 0,
    };

    this.logConfiguration();
  }

  // ============================================================================
  // MÉTHODES PRINCIPALES
  // ============================================================================

  /**
   * Hash d'un mot de passe utilisateur (rounds élevés pour sécurité)
   */
  async hashPassword(plainPassword: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      if (!plainPassword || typeof plainPassword !== 'string') {
        throw new Error('Le mot de passe doit être une chaîne non vide');
      }

      const hash = await bcrypt.hash(plainPassword, this.config.passwordRounds);
      
      // Métriques
      const hashTime = Date.now() - startTime;
      this.updateHashMetrics(hashTime);
      
      this.logger.debug(`Mot de passe hashé avec ${this.config.passwordRounds} rounds en ${hashTime}ms`);
      
      return hash;
    } catch (error) {
      this.logger.error('Erreur lors du hash du mot de passe:', error);
      throw new Error('Impossible de hasher le mot de passe');
    }
  }

  /**
   * Hash d'un token MFA/temporaire (rounds moyens pour performance)
   */
  async hashToken(plainToken: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      if (!plainToken || typeof plainToken !== 'string') {
        throw new Error('Le token doit être une chaîne non vide');
      }

      const hash = await bcrypt.hash(plainToken, this.config.tokenRounds);
      
      // Métriques
      const hashTime = Date.now() - startTime;
      this.updateHashMetrics(hashTime);
      
      this.logger.debug(`Token hashé avec ${this.config.tokenRounds} rounds en ${hashTime}ms`);
      
      return hash;
    } catch (error) {
      this.logger.error('Erreur lors du hash du token:', error);
      throw new Error('Impossible de hasher le token');
    }
  }

  /**
   * Hash d'une clé API (rounds faibles pour performance)
   */
  async hashApiKey(plainApiKey: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      if (!plainApiKey || typeof plainApiKey !== 'string') {
        throw new Error('La clé API doit être une chaîne non vide');
      }

      const hash = await bcrypt.hash(plainApiKey, this.config.apiKeyRounds);
      
      // Métriques
      const hashTime = Date.now() - startTime;
      this.updateHashMetrics(hashTime);
      
      this.logger.debug(`Clé API hashée avec ${this.config.apiKeyRounds} rounds en ${hashTime}ms`);
      
      return hash;
    } catch (error) {
      this.logger.error('Erreur lors du hash de la clé API:', error);
      throw new Error('Impossible de hasher la clé API');
    }
  }

  /**
   * Vérification sécurisée (résistante aux attaques timing)
   */
  async compare(plainText: string, hash: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      if (!plainText || !hash) {
        // Toujours faire une comparaison pour éviter les attaques timing
        await bcrypt.compare('dummy', '$2b$12$dummyhashtopreventtimingattacks');
        return false;
      }

      if (!this.validateHashFormat(hash)) {
        this.logger.warn('Format de hash invalide détecté');
        // Comparaison dummy pour timing constant
        await bcrypt.compare('dummy', '$2b$12$dummyhashtopreventtimingattacks');
        return false;
      }

      const isValid = await bcrypt.compare(plainText, hash);
      
      // Métriques
      const verifyTime = Date.now() - startTime;
      this.updateVerifyMetrics(verifyTime, isValid);
      
      this.logger.debug(`Vérification effectuée en ${verifyTime}ms: ${isValid ? 'valide' : 'invalide'}`);
      
      return isValid;
    } catch (error) {
      this.logger.error('Erreur lors de la vérification:', error);
      // Comparaison dummy en cas d'erreur
      await bcrypt.compare('dummy', '$2b$12$dummyhashtopreventtimingattacks');
      return false;
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Valide le format d'un hash bcrypt
   */
  validateHashFormat(hash: string): boolean {
    if (!hash || typeof hash !== 'string') {
      return false;
    }

    // Format bcrypt: $2a$, $2b$, $2x$, $2y$ + rounds + salt+hash
    const bcryptRegex = /^\$2[abxy]\$\d{1,2}\$[A-Za-z0-9./]{53}$/;
    return bcryptRegex.test(hash);
  }

  /**
   * Extrait le nombre de rounds d'un hash
   */
  extractRounds(hash: string): number | null {
    if (!this.validateHashFormat(hash)) {
      return null;
    }

    const parts = hash.split('$');
    return parseInt(parts[2]) || null;
  }

  /**
   * Vérifie si un hash doit être rehashé (rounds obsolètes)
   */
  shouldRehash(hash: string, targetRounds: number): boolean {
    const currentRounds = this.extractRounds(hash);
    return currentRounds !== null && currentRounds < targetRounds;
  }

  /**
   * Rehash un mot de passe si nécessaire
   */
  async rehashPasswordIfNeeded(plainPassword: string, currentHash: string): Promise<string | null> {
    if (this.shouldRehash(currentHash, this.config.passwordRounds)) {
      this.logger.log(`Rehash nécessaire: ${this.extractRounds(currentHash)} -> ${this.config.passwordRounds} rounds`);
      return await this.hashPassword(plainPassword);
    }
    return null;
  }

  /**
   * Génère une empreinte de hash pour le debug (masque les données sensibles)
   */
  getHashFingerprint(hash: string): string {
    if (!hash || hash.length < 10) {
      return 'invalid-hash';
    }
    
    const rounds = this.extractRounds(hash);
    const prefix = hash.substring(0, 7); // $2b$12$
    const suffix = hash.substring(hash.length - 6); // derniers 6 caractères
    
    return `${prefix}...${suffix} (${rounds} rounds)`;
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): HashingConfig {
    return { ...this.config };
  }

  /**
   * Obtient les métriques de performance
   */
  getMetrics(): HashingMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset les métriques
   */
  resetMetrics(): void {
    this.metrics.hashesGenerated = 0;
    this.metrics.verificationsPerformed = 0;
    this.metrics.failedVerifications = 0;
    this.metrics.averageHashTime = 0;
    this.metrics.averageVerifyTime = 0;
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private logConfiguration(): void {
    this.logger.log('🔐 Configuration du HashingService:');
    this.logger.log(`   • Algorithme: ${this.config.algorithm}`);
    this.logger.log(`   • Rounds mots de passe: ${this.config.passwordRounds}`);
    this.logger.log(`   • Rounds tokens: ${this.config.tokenRounds}`);
    this.logger.log(`   • Rounds clés API: ${this.config.apiKeyRounds}`);
  }

  private updateHashMetrics(hashTime: number): void {
    this.metrics.hashesGenerated++;
    this.metrics.averageHashTime = 
      (this.metrics.averageHashTime * (this.metrics.hashesGenerated - 1) + hashTime) / 
      this.metrics.hashesGenerated;
  }

  private updateVerifyMetrics(verifyTime: number, isValid: boolean): void {
    this.metrics.verificationsPerformed++;
    if (!isValid) {
      this.metrics.failedVerifications++;
    }
    
    this.metrics.averageVerifyTime = 
      (this.metrics.averageVerifyTime * (this.metrics.verificationsPerformed - 1) + verifyTime) / 
      this.metrics.verificationsPerformed;
  }
}