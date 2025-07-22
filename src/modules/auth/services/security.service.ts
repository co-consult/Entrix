// src/modules/auth/services/security.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface SecurityEvent {
  id: string;
  userId: string;
  type: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'SUSPICIOUS_ACTIVITY' | 'PASSWORD_CHANGE' | 'ACCOUNT_LOCKED';
  description: string;
  ipAddress: string;
  userAgent: string;
  riskScore: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface RiskAssessment {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  recommendations: string[];
}

@Injectable()
export class SecurityService {
  private readonly RATE_LIMIT_PREFIX = 'rate_limit:';
  private readonly SECURITY_EVENT_PREFIX = 'security_event:';
  private readonly FAILED_ATTEMPTS_PREFIX = 'failed_attempts:';
  private readonly ACCOUNT_LOCK_PREFIX = 'account_lock:';

  constructor(
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Évaluation du risque d'une tentative de connexion
   */
  async assessLoginRisk(
    userId: string,
    ipAddress: string,
    userAgent: string,
    email: string
  ): Promise<RiskAssessment> {
    const factors: string[] = [];
    let score = 0;

    // Facteur 1: Géolocalisation inhabituelle
    const isUnusualLocation = await this.checkUnusualLocation(userId, ipAddress);
    if (isUnusualLocation) {
      score += 30;
      factors.push('Localisation inhabituelle');
    }

    // Facteur 2: Appareil inconnu
    const isUnknownDevice = await this.checkUnknownDevice(userId, userAgent);
    if (isUnknownDevice) {
      score += 25;
      factors.push('Appareil inconnu');
    }

    // Facteur 3: Tentatives échouées récentes
    const failedAttempts = await this.getFailedAttempts(email);
    if (failedAttempts > 2) {
      score += 20;
      factors.push(`${failedAttempts} tentatives échouées récentes`);
    }

    // Facteur 4: Heure inhabituelle
    const isUnusualTime = await this.checkUnusualTime(userId);
    if (isUnusualTime) {
      score += 15;
      factors.push('Heure de connexion inhabituelle');
    }

    // Facteur 5: IP suspecte
    const isSuspiciousIp = await this.checkSuspiciousIp(ipAddress);
    if (isSuspiciousIp) {
      score += 40;
      factors.push('Adresse IP suspecte');
    }

    // Déterminer le niveau de risque
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (score >= 80) level = 'CRITICAL';
    else if (score >= 60) level = 'HIGH';
    else if (score >= 30) level = 'MEDIUM';
    else level = 'LOW';

    // Recommandations basées sur le niveau
    const recommendations = this.generateRecommendations(level, factors);

    return {
      score,
      level,
      factors,
      recommendations
    };
  }

  /**
   * Enregistrement d'un événement de sécurité
   */
  async logSecurityEvent(
    userId: string,
    type: SecurityEvent['type'],
    description: string,
    ipAddress: string,
    userAgent: string,
    riskScore: number = 0,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      userId,
      type,
      description,
      ipAddress,
      userAgent,
      riskScore,
      metadata,
      createdAt: new Date()
    };

    try {
      // Stocker l'événement en Redis (avec TTL de 30 jours)
      const eventKey = `${this.SECURITY_EVENT_PREFIX}${event.id}`;
      await this.redis.setCache(eventKey, event, 30 * 24 * 60 * 60);

      // Ajouter à la liste des événements de l'utilisateur
      const userEventsKey = `${this.SECURITY_EVENT_PREFIX}user:${userId}`;
      const userEvents = await this.redis.getCache<string[]>(userEventsKey) || [];
      userEvents.unshift(event.id);
      
      // Garder seulement les 100 derniers événements
      if (userEvents.length > 100) {
        userEvents.splice(100);
      }
      
      await this.redis.setCache(userEventsKey, userEvents, 30 * 24 * 60 * 60);

      // Si événement critique, notifier immédiatement
      if (riskScore >= 80) {
        await this.handleCriticalSecurityEvent(event);
      }

      this.logger.log(`Security event logged: ${type} for user ${userId} (risk: ${riskScore})`);
    } catch (error) {
      this.logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Vérification et incrémentation des tentatives échouées
   */
  async recordFailedAttempt(email: string, ipAddress: string): Promise<{ attempts: number; locked: boolean }> {
    const emailKey = `${this.FAILED_ATTEMPTS_PREFIX}email:${email}`;
    const ipKey = `${this.FAILED_ATTEMPTS_PREFIX}ip:${ipAddress}`;
    
    // Utiliser la méthode correcte increment() au lieu de incr()
    const emailAttempts = await this.redis.increment(emailKey, 15 * 60); // 15 minutes TTL
    const ipAttempts = await this.redis.increment(ipKey, 15 * 60);

    const maxAttempts = 5;
    const locked = emailAttempts >= maxAttempts || ipAttempts >= maxAttempts;

    if (locked) {
      await this.lockAccount(email, 'Too many failed login attempts');
    }

    return {
      attempts: Math.max(emailAttempts, ipAttempts),
      locked
    };
  }

  /**
   * Réinitialisation des tentatives échouées après connexion réussie
   */
  async clearFailedAttempts(email: string, ipAddress: string): Promise<void> {
    const emailKey = `${this.FAILED_ATTEMPTS_PREFIX}email:${email}`;
    const ipKey = `${this.FAILED_ATTEMPTS_PREFIX}ip:${ipAddress}`;
    
    await this.redis.del(emailKey);
    await this.redis.del(ipKey);
  }

  /**
   * Vérification si un compte est verrouillé
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${email}`;
    return await this.redis.exists(lockKey);
  }

  /**
   * Verrouillage d'un compte
   */
  async lockAccount(email: string, reason: string): Promise<void> {
    const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${email}`;
    const lockData = {
      email,
      reason,
      lockedAt: new Date(),
      unlockAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };

    await this.redis.setCache(lockKey, lockData, 30 * 60); // 30 minutes TTL

    // Envoyer email de notification
    await this.sendAccountLockNotification(email, reason);

    this.logger.warn(`Account locked: ${email} - ${reason}`);
  }

  /**
   * Déverrouillage d'un compte
   */
  async unlockAccount(email: string): Promise<void> {
    const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${email}`;
    await this.redis.del(lockKey);
    
    this.logger.log(`Account unlocked: ${email}`);
  }

  /**
   * Obtenir les événements de sécurité d'un utilisateur
   */
  async getUserSecurityEvents(userId: string, limit: number = 20): Promise<SecurityEvent[]> {
    try {
      const userEventsKey = `${this.SECURITY_EVENT_PREFIX}user:${userId}`;
      const eventIds = await this.redis.getCache<string[]>(userEventsKey) || [];
      
      const events: SecurityEvent[] = [];
      for (const eventId of eventIds.slice(0, limit)) {
        const eventKey = `${this.SECURITY_EVENT_PREFIX}${eventId}`;
        const event = await this.redis.getCache<SecurityEvent>(eventKey);
        if (event) {
          events.push(event);
        }
      }

      return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      this.logger.error(`Failed to get security events for user ${userId}:`, error);
      return [];
    }
  }

  // Méthodes privées

  private async checkUnusualLocation(userId: string, ipAddress: string): Promise<boolean> {
    // TODO: Implémenter la vérification de géolocalisation
    // Pour l'instant, retourner false
    return false;
  }

  private async checkUnknownDevice(userId: string, userAgent: string): Promise<boolean> {
    // TODO: Implémenter la vérification d'appareil
    // Pour l'instant, retourner false
    return false;
  }

  private async getFailedAttempts(email: string): Promise<number> {
    const emailKey = `${this.FAILED_ATTEMPTS_PREFIX}email:${email}`;
    const value = await this.redis.get(emailKey);
    return value ? parseInt(value, 10) : 0;
  }

  private async checkUnusualTime(userId: string): Promise<boolean> {
    // TODO: Implémenter la vérification d'heure habituelle
    // Pour l'instant, retourner false
    return false;
  }

  private async checkSuspiciousIp(ipAddress: string): Promise<boolean> {
    // TODO: Implémenter la vérification d'IP suspecte
    // Pour l'instant, retourner false
    return false;
  }

  private generateRecommendations(level: string, factors: string[]): string[] {
    const recommendations: string[] = [];
    
    if (level === 'CRITICAL' || level === 'HIGH') {
      recommendations.push('Activer la double authentification');
      recommendations.push('Vérifier l\'activité récente du compte');
    }
    
    if (factors.includes('Localisation inhabituelle')) {
      recommendations.push('Confirmer la localisation par email');
    }
    
    if (factors.includes('Appareil inconnu')) {
      recommendations.push('Vérifier l\'appareil utilisé');
    }

    return recommendations;
  }

  private async handleCriticalSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Envoyer une alerte par email
      // Utiliser la méthode correcte sendMail() au lieu de send()
      await this.email.sendMail({
        to: 'security@entrix.tn',
        subject: `🚨 Alerte sécurité critique - ${event.type}`,
        template: 'security-alert',
        context: {
          event,
          timestamp: event.createdAt.toISOString(),
          severity: 'CRITICAL'
        }
      });

      this.logger.error(`CRITICAL SECURITY EVENT: ${event.type} for user ${event.userId}`);
    } catch (error) {
      this.logger.error('Failed to handle critical security event:', error);
    }
  }

  private async sendAccountLockNotification(email: string, reason: string): Promise<void> {
    try {
      // Utiliser la méthode correcte sendMail() au lieu de send()
      await this.email.sendMail({
        to: email,
        subject: '🔒 Votre compte a été temporairement verrouillé',
        template: 'account-locked',
        context: {
          reason,
          unlockTime: '30 minutes',
          supportEmail: 'support@entrix.tn'
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send account lock notification to ${email}:`, error);
    }
  }

  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}