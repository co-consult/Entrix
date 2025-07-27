// src/modules/auth/services/risk-assessment.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { IMfaRiskAssessment } from '../interfaces/mfa.interface';
import { MfaProvider } from '../constants/auth.constants';

interface RiskContext {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  geolocation?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
}

/**
 * Service d'évaluation des risques MFA Entrix V3.0
 * Analyse les facteurs de risque pour déterminer si MFA est requis
 */
@Injectable()
export class RiskAssessmentService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('RiskAssessmentService');
  }

  /**
   * Évalue le risque d'une tentative de connexion
   */
  async assessLoginRisk(userId: string, context: RiskContext): Promise<number> {
    const operationId = this.logger.startOperation('assessLoginRisk', { 
      userId,
      hasDeviceFingerprint: !!context.deviceFingerprint
    });

    try {
      const riskFactors = await Promise.all([
        this.checkNewDevice(userId, context.deviceFingerprint),
        this.checkNewLocation(userId, context.ipAddress),
        this.checkSuspiciousActivity(userId, context.ipAddress),
        this.checkTimeOfAccess(),
        this.checkMultipleFailures(userId),
        this.checkVelocityRisk(userId, context.ipAddress),
        this.checkUserBehaviorAnomaly(userId, context)
      ]);

      const riskScore = this.calculateRiskScore(riskFactors);

      // Logger le résultat d'évaluation
      this.logger.endOperation('assessLoginRisk', operationId, true, undefined, {
        riskScore,
        factors: riskFactors.map((factor, index) => ({ 
          [`factor${index}`]: factor 
        }))
      });

      // Stocker l'évaluation pour analyse future
      await this.storeRiskAssessment(userId, riskScore, riskFactors, context);

      return riskScore;

    } catch (error) {
      this.logger.endOperation('assessLoginRisk', operationId, false);
      this.logger.error('Risk assessment failed', error.stack, 'RiskAssessmentService.assessLoginRisk', JSON.stringify({
        userId,
        error: error.message
      }));
      
      // En cas d'erreur, être conservateur et retourner un risque élevé
      return 75;
    }
  }

  /**
   * Génère une évaluation complète des risques
   */
  async generateRiskAssessment(userId: string, context: RiskContext): Promise<IMfaRiskAssessment> {
    const operationId = this.logger.startOperation('generateRiskAssessment', { userId });

    try {
      const riskScore = await this.assessLoginRisk(userId, context);

      const factors = {
        newDevice: await this.checkNewDevice(userId, context.deviceFingerprint),
        newLocation: await this.checkNewLocation(userId, context.ipAddress),
        suspiciousActivity: await this.checkSuspiciousActivity(userId, context.ipAddress),
        timeOfAccess: await this.checkTimeOfAccess(),
        multipleFailures: await this.checkMultipleFailures(userId)
      };

      const recommendedMethods = await this.getRecommendedMethods(userId, riskScore);
      const requireMfa = riskScore > await this.getMfaThreshold(userId);

      this.logger.endOperation('generateRiskAssessment', operationId, true);

      return {
        riskScore,
        factors,
        recommendedMethods,
        requireMfa
      };

    } catch (error) {
      this.logger.endOperation('generateRiskAssessment', operationId, false);
      throw error;
    }
  }

  /**
   * Met à jour le profil de risque utilisateur après une action
   */
  async updateUserRiskProfile(userId: string, action: 'LOGIN_SUCCESS' | 'LOGIN_FAIL' | 'MFA_SUCCESS' | 'MFA_FAIL', context: RiskContext): Promise<void> {
    try {
      const profileKey = `user_risk_profile:${userId}`;
      const profile = await this.redis.getCache<any>(profileKey) || {
        successfulLogins: 0,
        failedLogins: 0,
        mfaSuccesses: 0,
        mfaFailures: 0,
        knownIps: [],
        knownDevices: [],
        lastActivity: null,
        riskEvents: []
      };

      // Mettre à jour selon l'action
      switch (action) {
        case 'LOGIN_SUCCESS':
          profile.successfulLogins++;
          break;
        case 'LOGIN_FAIL':
          profile.failedLogins++;
          break;
        case 'MFA_SUCCESS':
          profile.mfaSuccesses++;
          break;
        case 'MFA_FAIL':
          profile.mfaFailures++;
          break;
      }

      // Ajouter IP/device aux listes connues
      if (context.ipAddress && !profile.knownIps.includes(context.ipAddress)) {
        profile.knownIps.push(context.ipAddress);
        if (profile.knownIps.length > 10) {
          profile.knownIps = profile.knownIps.slice(-10); // Garder les 10 dernières
        }
      }

      if (context.deviceFingerprint && !profile.knownDevices.includes(context.deviceFingerprint)) {
        profile.knownDevices.push(context.deviceFingerprint);
        if (profile.knownDevices.length > 5) {
          profile.knownDevices = profile.knownDevices.slice(-5); // Garder les 5 derniers
        }
      }

      profile.lastActivity = new Date().toISOString();

      // Stocker le profil mis à jour (expire après 90 jours)
      await this.redis.setCache(profileKey, profile, 90 * 24 * 60 * 60);

    } catch (error) {
      this.logger.error('Failed to update user risk profile', error.stack);
    }
  }

  // ===================
  // FACTEURS DE RISQUE
  // ===================

  /**
   * Vérifie si c'est un nouvel appareil
   */
  private async checkNewDevice(userId: string, deviceFingerprint?: string): Promise<boolean> {
    if (!deviceFingerprint) return true;

    try {
      const knownDevice = await this.prisma.user_sessions.findFirst({
        where: {
          user_id: userId,
          device_fingerprint: deviceFingerprint
        },
        select: { id: true }
      });

      return !knownDevice;
    } catch {
      return true;
    }
  }

  /**
   * Vérifie si c'est une nouvelle localisation
   */
  private async checkNewLocation(userId: string, ipAddress?: string): Promise<boolean> {
    if (!ipAddress) return true;

    try {
      const recentLogin = await this.prisma.login_attempts.findFirst({
        where: {
          user_id: userId,
          ip_address: ipAddress,
          success: true,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
          }
        },
        select: { id: true }
      });

      return !recentLogin;
    } catch {
      return true;
    }
  }

  /**
   * Vérifie les activités suspectes
   */
  private async checkSuspiciousActivity(userId: string, ipAddress?: string): Promise<boolean> {
    if (!ipAddress) return false;

    try {
      // Vérifier les tentatives échouées récentes
      const failedAttempts = await this.prisma.login_attempts.count({
        where: {
          ip_address: ipAddress,
          success: false,
          created_at: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Dernière heure
          }
        }
      });

      // Vérifier si IP marquée comme suspecte
      const suspiciousEvents = await this.prisma.security_events.count({
        where: {
          ip_address: ipAddress,
          severity: {
            in: ['HIGH', 'MAXIMUM']
          },
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
          }
        }
      });

      return failedAttempts > 3 || suspiciousEvents > 0;
    } catch {
      return false;
    }
  }

  /**
   * Vérifie l'heure d'accès
   */
  private async checkTimeOfAccess(): Promise<boolean> {
    const now = new Date();
    const hour = now.getHours();
    
    // Considérer comme risqué si connexion entre 2h et 6h du matin
    return hour >= 2 && hour <= 6;
  }

  /**
   * Vérifie les échecs multiples
   */
  private async checkMultipleFailures(userId: string): Promise<boolean> {
    try {
      const recentFailures = await this.prisma.login_attempts.count({
        where: {
          user_id: userId,
          success: false,
          created_at: {
            gte: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes
          }
        }
      });

      return recentFailures >= 3;
    } catch {
      return false;
    }
  }

  /**
   * Vérifie la vélocité des tentatives
   */
  private async checkVelocityRisk(userId: string, ipAddress?: string): Promise<boolean> {
    try {
      if (!ipAddress) return false;

      // Vérifier le nombre de tentatives dans les 5 dernières minutes
      const recentAttempts = await this.prisma.login_attempts.count({
        where: {
          ip_address: ipAddress,
          created_at: {
            gte: new Date(Date.now() - 5 * 60 * 1000)
          }
        }
      });

      return recentAttempts > 5;
    } catch {
      return false;
    }
  }

  /**
   * Vérifie les anomalies comportementales
   */
  private async checkUserBehaviorAnomaly(userId: string, context: RiskContext): Promise<boolean> {
    try {
      const profileKey = `user_risk_profile:${userId}`;
      const profile = await this.redis.getCache<any>(profileKey);

      if (!profile) return false;

      // Vérifier si l'IP/device sont dans les listes connues
      const unknownIp = context.ipAddress && !profile.knownIps.includes(context.ipAddress);
      const unknownDevice = context.deviceFingerprint && !profile.knownDevices.includes(context.deviceFingerprint);

      // Calculer le ratio d'échecs récent
      const totalAttempts = profile.successfulLogins + profile.failedLogins;
      const failureRate = totalAttempts > 0 ? profile.failedLogins / totalAttempts : 0;

      return (unknownIp && unknownDevice) || failureRate > 0.3;
    } catch {
      return false;
    }
  }

  // ===================
  // CALCULS ET UTILITAIRES
  // ===================

  /**
   * Calcule le score de risque final
   */
  private calculateRiskScore(factors: boolean[]): number {
    const weights = [
      25, // Nouvel appareil
      20, // Nouvelle localisation  
      30, // Activité suspecte
      10, // Heure d'accès
      15, // Échecs multiples
      20, // Vélocité
      25  // Anomalie comportementale
    ];

    let score = 0;
    factors.forEach((factor, index) => {
      if (factor && weights[index]) {
        score += weights[index];
      }
    });

    // Normaliser entre 0 et 100
    return Math.min(100, score);
  }

  /**
   * Obtient le seuil MFA pour un utilisateur
   */
  private async getMfaThreshold(userId: string): Promise<number> {
    try {
      // Vérifier si l'utilisateur a des rôles qui nécessitent MFA stricte
      const userRoles = await this.prisma.user_roles.findMany({
        where: {
          user_id: userId,
          status: 'ACTIVE'
        },
        include: {
          roles: {
            select: {
              code: true
            }
          }
        }
      });

      const hasAdminRole = userRoles.some(ur => 
        ['ADMIN', 'SUPER_ADMIN', 'ORGANIZER'].includes(ur.roles.code)
      );

      // Seuil plus bas pour les rôles privilégiés
      return hasAdminRole ? 30 : 50;
    } catch {
      return 50; // Valeur par défaut
    }
  }

  /**
   * Recommande les méthodes MFA selon le risque
   */
  private async getRecommendedMethods(userId: string, riskScore: number): Promise<MfaProvider[]> {
    try {
      const availableMethods = await this.getConfiguredMethods(userId);

      if (riskScore >= 80) {
        // Risque très élevé : TOTP + SMS obligatoire si disponible
        return availableMethods.filter(m => ['TOTP_APP', 'SMS_OTP'].includes(m));
      } else if (riskScore >= 60) {
        // Risque élevé : TOTP préféré
        return availableMethods.includes('TOTP_APP') 
          ? ['TOTP_APP'] 
          : availableMethods.slice(0, 1);
      } else {
        // Risque modéré : n'importe quelle méthode
        return availableMethods.slice(0, 1);
      }
    } catch {
      return ['EMAIL_OTP']; // Fallback
    }
  }

  /**
   * Récupère les méthodes configurées pour un utilisateur
   */
  private async getConfiguredMethods(userId: string): Promise<MfaProvider[]> {
    try {
      const settings = await this.prisma.user_mfa_settings.findMany({
        where: {
          user_id: userId,
          is_enabled: true
        },
        select: {
          method: true
        }
      });

      return settings.map(s => this.mapMethodToProvider(s.method));
    } catch {
      return ['EMAIL_OTP'];
    }
  }

  /**
   * Stocke l'évaluation de risque pour analyse
   */
  private async storeRiskAssessment(
    userId: string, 
    riskScore: number, 
    factors: boolean[], 
    context: RiskContext
  ): Promise<void> {
    try {
      const assessmentKey = `risk_assessment:${userId}:${Date.now()}`;
      const assessment = {
        userId,
        riskScore,
        factors: {
          newDevice: factors[0],
          newLocation: factors[1],
          suspiciousActivity: factors[2],
          timeOfAccess: factors[3],
          multipleFailures: factors[4],
          velocityRisk: factors[5],
          behaviorAnomaly: factors[6]
        },
        context,
        timestamp: new Date().toISOString()
      };

      // Stocker pendant 7 jours pour analyse
      await this.redis.setCache(assessmentKey, assessment, 7 * 24 * 60 * 60);
    } catch (error) {
      this.logger.error('Failed to store risk assessment', error.stack);
    }
  }

  /**
   * Mappe method enum vers provider
   */
  private mapMethodToProvider(method: any): MfaProvider {
    const mapping = {
      'SMS': 'SMS_OTP',
      'EMAIL': 'EMAIL_OTP',
      'TOTP': 'TOTP_APP',
      'BACKUP_CODES': 'BACKUP_CODE'
    };
    return mapping[method] || 'EMAIL_OTP';
  }

  /**
   * Obtient les statistiques de risque globales
   */
  async getRiskStatistics(): Promise<{
    averageRiskScore: number;
    highRiskUsers: number;
    totalAssessments: number;
    riskDistribution: Record<string, number>;
  }> {
    try {
      // Récupérer toutes les évaluations récentes (dernières 24h)
      const assessmentKeys = await this.redis.keys('risk_assessment:*');
      const recentKeys = assessmentKeys.filter(key => {
        const timestamp = parseInt(key.split(':')[2]);
        return Date.now() - timestamp < 24 * 60 * 60 * 1000;
      });

      const assessments = await Promise.all(
        recentKeys.map(key => this.redis.getCache<any>(key))
      );

      const validAssessments = assessments.filter(Boolean);
      
      if (validAssessments.length === 0) {
        return {
          averageRiskScore: 0,
          highRiskUsers: 0,
          totalAssessments: 0,
          riskDistribution: {}
        };
      }

      const riskScores = validAssessments.map(a => a.riskScore);
      const averageRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
      const highRiskUsers = riskScores.filter(score => score >= 70).length;

      const riskDistribution = {
        'Low (0-30)': riskScores.filter(s => s < 30).length,
        'Medium (30-60)': riskScores.filter(s => s >= 30 && s < 60).length,
        'High (60-80)': riskScores.filter(s => s >= 60 && s < 80).length,
        'Critical (80+)': riskScores.filter(s => s >= 80).length
      };

      return {
        averageRiskScore: Math.round(averageRiskScore),
        highRiskUsers,
        totalAssessments: validAssessments.length,
        riskDistribution
      };

    } catch (error) {
      this.logger.error('Failed to get risk statistics', error.stack);
      return {
        averageRiskScore: 0,
        highRiskUsers: 0,
        totalAssessments: 0,
        riskDistribution: {}
      };
    }
  }
}