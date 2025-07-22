// src/modules/auth/services/sessions.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { v4 as uuidv4 } from 'uuid';

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivityAt: Date;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class SessionsService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly SESSION_DURATION = 24 * 60 * 60; // 24 heures en secondes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Créer une nouvelle session utilisateur
   */
  async createSession(
    userId: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION * 1000);

    const session: UserSession = {
      id: sessionId,
      userId,
      ipAddress,
      userAgent,
      isActive: true,
      lastActivityAt: now,
      createdAt: now,
      expiresAt,
    };

    try {
      // Stocker la session en Redis
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await this.redis.setCache(sessionKey, session, this.SESSION_DURATION);

      // Ajouter à la liste des sessions de l'utilisateur
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      const userSessions = await this.redis.getCache<string[]>(userSessionsKey) || [];
      userSessions.push(sessionId);
      await this.redis.setCache(userSessionsKey, userSessions, this.SESSION_DURATION);

      this.logger.log(`Session created for user ${userId}: ${sessionId}`);
      return session;
    } catch (error) {
      this.logger.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Récupérer une session par son ID
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    try {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      const session = await this.redis.getCache<UserSession>(sessionKey);
      
      if (!session) {
        return null;
      }

      // Vérifier si la session a expiré
      if (new Date() > session.expiresAt) {
        await this.revokeSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to get session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Mettre à jour l'activité d'une session
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return;
      }

      session.lastActivityAt = new Date();
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await this.redis.setCache(sessionKey, session, this.SESSION_DURATION);
    } catch (error) {
      this.logger.error(`Failed to update session activity ${sessionId}:`, error);
    }
  }

  /**
   * Révoquer une session spécifique
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return;
      }

      // Supprimer la session de Redis
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await this.redis.del(sessionKey);

      // Retirer de la liste des sessions utilisateur
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${session.userId}`;
      const userSessions = await this.redis.getCache<string[]>(userSessionsKey) || [];
      const updatedSessions = userSessions.filter(id => id !== sessionId);
      
      if (updatedSessions.length > 0) {
        await this.redis.setCache(userSessionsKey, updatedSessions, this.SESSION_DURATION);
      } else {
        await this.redis.del(userSessionsKey);
      }

      this.logger.log(`Session revoked: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Révoquer toutes les sessions d'un utilisateur
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      const userSessions = await this.redis.getCache<string[]>(userSessionsKey) || [];

      // Supprimer toutes les sessions
      for (const sessionId of userSessions) {
        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
        await this.redis.del(sessionKey);
      }

      // Supprimer la liste des sessions utilisateur
      await this.redis.del(userSessionsKey);

      this.logger.log(`All sessions revoked for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke all sessions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Lister toutes les sessions actives d'un utilisateur
   */
  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      const sessionIds = await this.redis.getCache<string[]>(userSessionsKey) || [];

      const sessions: UserSession[] = [];
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      this.logger.error(`Failed to get user sessions for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Nettoyer les sessions expirées
   */
  async cleanupExpiredSessions(): Promise<number> {
    let cleanedCount = 0;
    
    try {
      // Cette méthode devrait être appelée périodiquement via un cron job
      // Pour l'instant, nous nous fions à la TTL de Redis pour la suppression automatique
      
      this.logger.log(`Cleanup completed: ${cleanedCount} expired sessions removed`);
      return cleanedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  /**
   * Valider une session et la prolonger si nécessaire
   */
  async validateAndRefreshSession(sessionId: string): Promise<UserSession | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      // Mettre à jour l'activité
      await this.updateSessionActivity(sessionId);
      
      return session;
    } catch (error) {
      this.logger.error(`Failed to validate session ${sessionId}:`, error);
      return null;
    }
  }
}