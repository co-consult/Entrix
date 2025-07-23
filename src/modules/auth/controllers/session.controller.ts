// src/modules/auth/controllers/session.controller.ts

import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger';
import { LoggerService } from '../../../shared/logger/logger.service';
import { SessionService } from '../services/session.service';
import { 
  RefreshTokenDto, 
  RefreshTokenResponseDto,
  SessionsListResponseDto,
  RevokeSessionResponseDto
} from '../dto/session';
import { JwtAuthGuard, JwtRefreshGuard } from '../guards';
import { 
  CurrentUser, 
  CurrentUserId, 
  SessionId
} from '../decorators/current-user.decorator';
import { AuditLog, RateLimit } from '../decorators/audit-log.decorator';
import { IUserProfile } from '../interfaces';

/**
 * Session Controller Entrix V3.0 - Grade A+
 * Gestion sessions utilisateur et refresh tokens
 */

@ApiTags('Sessions')
@Controller('auth')
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true 
}))
export class SessionController {
  private readonly logger: LoggerService;

  constructor(
    private readonly sessionService: SessionService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('SessionController');
  }

  /**
   * GET /auth/session
   * Informations session courante
   */
  @Get('session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Informations session courante',
    description: 'Récupère détails de la session active'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Informations session récupérées'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Session invalide'
  })
  async getCurrentSession(
    @CurrentUser() user: IUserProfile,
    @SessionId() sessionId: string
  ) {
    const operationId = this.logger.startOperation('GET /auth/session', {
      userId: user.id,
      sessionId,
    });

    try {
      // Récupérer sessions actives utilisateur
      const sessions = await this.sessionService.getUserActiveSessions(user.id);
      const currentSession = sessions.find(s => s.id === sessionId);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          session: currentSession ? {
            sessionId: currentSession.id,
            userId: currentSession.user_id,
            deviceInfo: {
              userAgent: currentSession.user_agent,
              ipAddress: currentSession.ip_address,
              deviceFingerprint: currentSession.device_fingerprint,
              geolocation: currentSession.geolocation,
            },
            createdAt: currentSession.created_at.toISOString(),
            lastActivity: currentSession.last_activity.toISOString(),
            expiresAt: currentSession.expires_at.toISOString(),
            isActive: currentSession.is_active,
          } : null,
          user,
          permissions: user.permissions || [],
          preferences: user.metadata?.preferences || {},
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/refresh
   * Renouvellement tokens
   */
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @RateLimit({ limit: 20, windowMs: 60000 }) // 20 refresh/minute
  @AuditLog({ action: 'token_refresh', level: 'info' })
  @ApiOperation({ 
    summary: 'Renouvellement tokens',
    description: 'Génère nouveaux access/refresh tokens'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tokens renouvelés',
    type: RefreshTokenResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Refresh token invalide'
  })
  async refreshTokens(
    @Body() refreshDto: RefreshTokenDto
  ): Promise<RefreshTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/refresh');

    try {
      const tokens = await this.sessionService.refreshSession(refreshDto.refreshToken);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          tokens,
          sessionExtended: true,
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * GET /auth/sessions
   * Liste sessions actives utilisateur
   */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Sessions actives utilisateur',
    description: 'Liste toutes les sessions actives'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste sessions récupérée',
    type: SessionsListResponseDto
  })
  async getUserSessions(
    @CurrentUserId() userId: string,
    @SessionId() currentSessionId: string
  ): Promise<SessionsListResponseDto> {
    const operationId = this.logger.startOperation('GET /auth/sessions', {
      userId,
    });

    try {
      const sessions = await this.sessionService.getUserActiveSessions(userId);

      const sessionsList = sessions.map(session => ({
        sessionId: session.id,
        deviceInfo: {
          userAgent: session.user_agent || 'Unknown',
          browser: this.parseBrowser(session.user_agent),
          os: this.parseOS(session.user_agent),
          isMobile: this.isMobile(session.user_agent),
        },
        location: this.formatLocation(session.geolocation),
        createdAt: session.created_at.toISOString(),
        lastActivity: session.last_activity.toISOString(),
        isCurrent: session.id === currentSessionId,
      }));

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          sessions: sessionsList,
          total: sessionsList.length,
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * DELETE /auth/sessions/:sessionId
   * Révocation session spécifique
   */
  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @AuditLog({ action: 'session_revoke', level: 'warn' })
  @ApiOperation({ 
    summary: 'Révoquer session',
    description: 'Révoque une session spécifique'
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session à révoquer' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session révoquée',
    type: RevokeSessionResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session introuvable'
  })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUserId() userId: string
  ): Promise<RevokeSessionResponseDto> {
    const operationId = this.logger.startOperation('DELETE /auth/sessions/:sessionId', {
      sessionId,
      userId,
    });

    try {
      // Vérifier que la session appartient à l'utilisateur
      const userSessions = await this.sessionService.getUserActiveSessions(userId);
      const sessionExists = userSessions.some(s => s.id === sessionId);

      if (!sessionExists) {
        this.logger.endOperation(operationId, 'not_found');
        return {
          success: false,
          data: {
            sessionRevoked: false,
            sessionId,
          },
        };
      }

      const revoked = await this.sessionService.revokeSession(sessionId);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          sessionRevoked: revoked,
          sessionId,
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Méthodes helper privées
   */

  private parseBrowser(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Unknown';
  }

  private parseOS(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  }

  private isMobile(userAgent?: string): boolean {
    if (!userAgent) return false;
    return /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
  }

  private formatLocation(geolocation?: any): string {
    if (!geolocation) return 'Localisation inconnue';
    
    const parts = [];
    if (geolocation.city) parts.push(geolocation.city);
    if (geolocation.country) parts.push(geolocation.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Localisation inconnue';
  }
}