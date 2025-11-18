// src/modules/auth/controllers/persistent-token.controller.ts

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { persistent_token_type } from '@prisma/client';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PersistentTokenService } from '../services/persistent-token.service';
import { 
  CreatePersistentTokenDto,
  UpdatePersistentTokenDto,
  GenerateApiKeyDto,
  RevokePersistentTokenDto,
  PersistentTokenFiltersDto,
  PersistentTokenResponseDto,
  GeneratedPersistentTokenResponseDto,
  PersistentTokenStatsResponseDto,
  ValidatePersistentTokenDto,
  ValidatePersistentTokenResponseDto
} from '../dto/persistent-tokens/create-persistent-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { 
  CurrentUser, 
  CurrentUserId,
  AuditLog,
  RateLimit
} from '../decorators';
import { IUserProfile } from '../interfaces';

/**
 * Persistent Token Controller Entrix V3.0 - Grade A+
 * Gestion des tokens persistants (API keys, refresh longue durée, etc.)
 * Respecte l'architecture auth et utilise les services partagés
 */

@ApiTags('Persistent Tokens')
@Controller('auth/tokens')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true 
}))
export class PersistentTokenController {
  private readonly logger: LoggerService;

  constructor(
    private readonly persistentTokenService: PersistentTokenService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('PersistentTokenController');
  }

  // ============================================================================
  // ENDPOINTS DE CRÉATION
  // ============================================================================

  /**
   * POST /auth/tokens
   * Créer un token persistant générique
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 10, windowMs: 60000 }) // 10 créations/minute
  @AuditLog({ action: 'create_persistent_token', level: 'info' })
  @ApiOperation({ 
    summary: 'Créer un token persistant',
    description: 'Crée un nouveau token persistant selon le type spécifié'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Token créé avec succès',
    type: GeneratedPersistentTokenResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 429, description: 'Limite de tokens atteinte' })
  async createToken(
    @CurrentUserId() userId: string,
    @Body() createTokenDto: CreatePersistentTokenDto
  ): Promise<GeneratedPersistentTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/tokens');

    try {
      const tokenData = {
        user_id: userId,
        ...createTokenDto,
      };

      const generatedToken = await this.persistentTokenService.createToken(tokenData);

      this.logger.endOperation('createToken', operationId, true);

      return {
        id: generatedToken.id,
        token: generatedToken.token,
        token_prefix: generatedToken.token_prefix,
        token_type: generatedToken.token_type,
        scopes: generatedToken.scopes,
        expires_at: generatedToken.expires_at?.toISOString() || null,
        created_at: generatedToken.created_at.toISOString(),
        security_warning: 'Sauvegardez ce token immédiatement. Il ne sera plus affiché pour des raisons de sécurité.',
      };

    } catch (error) {
      this.logger.endOperation('createToken', operationId, false);
      throw error;
    }
  }

  /**
   * POST /auth/tokens/api-key
   * Générer une clé API
   */
  @Post('api-key')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 5, windowMs: 300000 }) // 5 API keys/5min
  @AuditLog({ action: 'generate_api_key', level: 'info' })
  @ApiOperation({ 
    summary: 'Générer une clé API',
    description: 'Génère une nouvelle clé API pour les intégrations externes'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Clé API générée',
    type: GeneratedPersistentTokenResponseDto
  })
  async generateApiKey(
    @CurrentUserId() userId: string,
    @Body() generateApiKeyDto: GenerateApiKeyDto
  ): Promise<GeneratedPersistentTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/tokens/api-key');

    try {
      const apiKey = await this.persistentTokenService.generateApiKey(
        userId,
        generateApiKeyDto.name,
        generateApiKeyDto.scopes
      );

      this.logger.endOperation('generateApiKey', operationId, true);

      return {
        id: apiKey.id,
        token: apiKey.token,
        token_prefix: apiKey.token_prefix,
        token_type: apiKey.token_type,
        scopes: apiKey.scopes,
        expires_at: apiKey.expires_at?.toISOString() || null,
        created_at: apiKey.created_at.toISOString(),
        security_warning: 'Cette clé API ne sera plus affichée. Conservez-la en lieu sûr.',
      };

    } catch (error) {
      this.logger.endOperation('generateApiKey', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS DE RÉCUPÉRATION
  // ============================================================================

  /**
   * GET /auth/tokens
   * Lister les tokens de l'utilisateur
   */
  @Get()
  @ApiOperation({ 
    summary: 'Lister mes tokens',
    description: 'Récupère la liste des tokens persistants de l\'utilisateur connecté'
  })
  @ApiQuery({ name: 'token_type', enum: persistent_token_type, required: false })
  @ApiQuery({ name: 'is_active', type: Boolean, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des tokens',
    type: [PersistentTokenResponseDto]
  })
  async getUserTokens(
    @CurrentUserId() userId: string,
    @Query() filters: PersistentTokenFiltersDto
  ): Promise<PersistentTokenResponseDto[]> {
    const operationId = this.logger.startOperation('GET /auth/tokens');

    try {
      const tokens = await this.persistentTokenService.getUserTokens(userId, filters);

      this.logger.endOperation('getUserTokens', operationId, true);

      return tokens.map(token => ({
        id: token.id,
        token_type: token.token_type,
        token_prefix: token.token_prefix,
        name: token.name,
        description: token.description,
        scopes: token.scopes,
        expires_at: token.expires_at,
        last_used_at: token.last_used_at,
        usage_count: token.usage_count,
        is_active: token.is_active,
        created_at: token.created_at,
      }));

    } catch (error) {
      this.logger.endOperation('getUserTokens', operationId, false);
      throw error;
    }
  }

  /**
   * GET /auth/tokens/:id
   * Récupérer un token spécifique
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Détails d\'un token',
    description: 'Récupère les détails d\'un token spécifique'
  })
  @ApiParam({ name: 'id', description: 'ID du token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Détails du token',
    type: PersistentTokenResponseDto
  })
  @ApiResponse({ status: 404, description: 'Token non trouvé' })
  async getToken(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) tokenId: string
  ): Promise<PersistentTokenResponseDto> {
    const operationId = this.logger.startOperation('GET /auth/tokens/:id');

    try {
      const token = await this.persistentTokenService.getToken(tokenId);

      if (!token) {
        this.logger.endOperation('getToken', operationId, false);
        throw new Error('Token not found');
      }

      // Vérifier que le token appartient à l'utilisateur
      if (token.user_id !== userId) {
        this.logger.endOperation('getToken', operationId, false);
        throw new Error('Access denied');
      }

      this.logger.endOperation('getToken', operationId, true);

      return {
        id: token.id,
        token_type: token.token_type,
        token_prefix: token.token_prefix,
        name: token.name,
        description: token.description,
        scopes: token.scopes,
        expires_at: token.expires_at?.toISOString() || null,
        last_used_at: token.last_used_at?.toISOString() || null,
        usage_count: token.usage_count,
        is_active: token.is_active,
        created_at: token.created_at.toISOString(),
      };

    } catch (error) {
      this.logger.endOperation('getToken', operationId, false);
      throw error;
    }
  }

  /**
   * GET /auth/tokens/stats
   * Statistiques des tokens
   */
  @Get('stats')
  @ApiOperation({ 
    summary: 'Statistiques des tokens',
    description: 'Récupère les statistiques d\'utilisation des tokens'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques des tokens',
    type: PersistentTokenStatsResponseDto
  })
  async getTokenStats(
    @CurrentUserId() userId: string
  ): Promise<PersistentTokenStatsResponseDto> {
    const operationId = this.logger.startOperation('GET /auth/tokens/stats');

    try {
      const stats = await this.persistentTokenService.getTokenStats(userId);

      this.logger.endOperation('getTokenStats', operationId, true);

      return stats;

    } catch (error) {
      this.logger.endOperation('getTokenStats', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS DE MODIFICATION
  // ============================================================================

  /**
   * PUT /auth/tokens/:id
   * Mettre à jour un token
   */
  @Put(':id')
  @AuditLog({ action: 'update_persistent_token', level: 'info' })
  @ApiOperation({ 
    summary: 'Mettre à jour un token',
    description: 'Met à jour les propriétés d\'un token persistant'
  })
  @ApiParam({ name: 'id', description: 'ID du token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token mis à jour',
    type: PersistentTokenResponseDto
  })
  async updateToken(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) tokenId: string,
    @Body() updateTokenDto: UpdatePersistentTokenDto
  ): Promise<PersistentTokenResponseDto> {
    const operationId = this.logger.startOperation('PUT /auth/tokens/:id');

    try {
      // Vérifier que le token appartient à l'utilisateur
      const existingToken = await this.persistentTokenService.getToken(tokenId);
      if (!existingToken || existingToken.user_id !== userId) {
        this.logger.endOperation('updateToken', operationId, false);
        throw new Error('Token not found or access denied');
      }

      const updatedToken = await this.persistentTokenService.updateToken(tokenId, updateTokenDto);

      this.logger.endOperation('updateToken', operationId, true);

      return {
        id: updatedToken.id,
        token_type: updatedToken.token_type,
        token_prefix: updatedToken.token_prefix,
        name: updatedToken.name,
        description: updatedToken.description,
        scopes: updatedToken.scopes,
        expires_at: updatedToken.expires_at?.toISOString() || null,
        last_used_at: updatedToken.last_used_at?.toISOString() || null,
        usage_count: updatedToken.usage_count,
        is_active: updatedToken.is_active,
        created_at: updatedToken.created_at.toISOString(),
      };

    } catch (error) {
      this.logger.endOperation('updateToken', operationId, false);
      throw error;
    }
  }

  /**
   * POST /auth/tokens/:id/refresh
   * Actualiser un token (générer nouveau token)
   */
  @Post(':id/refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 3, windowMs: 3600000 }) // 3 refresh/heure
  @AuditLog({ action: 'refresh_persistent_token', level: 'warn' })
  @ApiOperation({ 
    summary: 'Actualiser un token',
    description: 'Génère un nouveau token avec la même configuration'
  })
  @ApiParam({ name: 'id', description: 'ID du token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token actualisé',
    type: GeneratedPersistentTokenResponseDto
  })
  async refreshToken(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) tokenId: string
  ): Promise<GeneratedPersistentTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/tokens/:id/refresh');

    try {
      // Vérifier que le token appartient à l'utilisateur
      const existingToken = await this.persistentTokenService.getToken(tokenId);
      if (!existingToken || existingToken.user_id !== userId) {
        this.logger.endOperation('refreshToken', operationId, false);
        throw new Error('Token not found or access denied');
      }

      const refreshedToken = await this.persistentTokenService.refreshToken(tokenId);

      this.logger.endOperation('refreshToken', operationId, true);

      return {
        id: refreshedToken.id,
        token: refreshedToken.token,
        token_prefix: refreshedToken.token_prefix,
        token_type: refreshedToken.token_type,
        scopes: refreshedToken.scopes,
        expires_at: refreshedToken.expires_at?.toISOString() || null,
        created_at: refreshedToken.created_at.toISOString(),
        security_warning: 'L\'ancien token est maintenant invalide. Utilisez ce nouveau token.',
      };

    } catch (error) {
      this.logger.endOperation('refreshToken', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS DE RÉVOCATION
  // ============================================================================

  /**
   * DELETE /auth/tokens/:id
   * Révoquer un token
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog({ action: 'revoke_persistent_token', level: 'warn' })
  @ApiOperation({ 
    summary: 'Révoquer un token',
    description: 'Révoque définitivement un token persistant'
  })
  @ApiParam({ name: 'id', description: 'ID du token' })
  @ApiResponse({ status: 204, description: 'Token révoqué' })
  @ApiResponse({ status: 404, description: 'Token non trouvé' })
  async revokeToken(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) tokenId: string,
    @Body() revokeDto?: RevokePersistentTokenDto
  ): Promise<void> {
    const operationId = this.logger.startOperation('DELETE /auth/tokens/:id');

    try {
      // Vérifier que le token appartient à l'utilisateur
      const existingToken = await this.persistentTokenService.getToken(tokenId);
      if (!existingToken || existingToken.user_id !== userId) {
        this.logger.endOperation('revokeToken', operationId, false);
        throw new Error('Token not found or access denied');
      }

      const revoked = await this.persistentTokenService.revokeToken(
        tokenId, 
        revokeDto?.reason || 'User revocation',
        userId
      );

      if (!revoked) {
        this.logger.endOperation('revokeToken', operationId, false);
        throw new Error('Failed to revoke token');
      }

      this.logger.endOperation('revokeToken', operationId, true);

    } catch (error) {
      this.logger.endOperation('revokeToken', operationId, false);
      throw error;
    }
  }

  /**
   * DELETE /auth/tokens
   * Révoquer tous les tokens
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'revoke_all_persistent_tokens', level: 'error' })
  @ApiOperation({ 
    summary: 'Révoquer tous mes tokens',
    description: 'Révoque tous les tokens persistants de l\'utilisateur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Nombre de tokens révoqués',
    schema: { 
      type: 'object', 
      properties: { 
        revoked_count: { type: 'number' },
        message: { type: 'string' }
      } 
    }
  })
  async revokeAllTokens(
    @CurrentUserId() userId: string,
    @Body() revokeDto?: RevokePersistentTokenDto
  ): Promise<{ revoked_count: number; message: string }> {
    const operationId = this.logger.startOperation('DELETE /auth/tokens');

    try {
      const revokedCount = await this.persistentTokenService.revokeAllUserTokens(
        userId, 
        revokeDto?.reason || 'User bulk revocation'
      );

      this.logger.endOperation('revokeAllTokens', operationId, true);

      return {
        revoked_count: revokedCount,
        message: `${revokedCount} token(s) révoqué(s) avec succès.`,
      };

    } catch (error) {
      this.logger.endOperation('revokeAllTokens', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS DE VALIDATION
  // ============================================================================

  /**
   * POST /auth/tokens/validate
   * Valider un token (usage interne/debug)
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 100, windowMs: 60000 }) // 100 validations/minute
  @ApiOperation({ 
    summary: 'Valider un token',
    description: 'Valide un token persistant et retourne ses informations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultat de validation',
    type: ValidatePersistentTokenResponseDto
  })
  async validateToken(
    @CurrentUserId() userId: string,
    @Body() validateDto: ValidatePersistentTokenDto
  ): Promise<ValidatePersistentTokenResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/tokens/validate');

    try {
      const validation = await this.persistentTokenService.validateToken(validateDto.token);

      // Vérifier que l'utilisateur peut valider ce token (seulement ses propres tokens)
      if (validation.isValid && validation.userId !== userId) {
        this.logger.endOperation('validateToken', operationId, false);
        return {
          isValid: false,
          errors: ['Access denied'],
        };
      }

      this.logger.endOperation('validateToken', operationId, true);

      return {
        isValid: validation.isValid,
        userId: validation.userId,
        scopes: validation.scopes,
        errors: validation.errors,
        lastUsed: validation.lastUsed?.toISOString(),
        usageCount: validation.usageCount,
        user: validation.token && (validation.token as any).users ? {
          id: (validation.token as any).users.id,
          email: (validation.token as any).users.email,
          is_active: (validation.token as any).users.is_active,
        } : undefined,
      };

    } catch (error) {
      this.logger.endOperation('validateToken', operationId, false);
      throw error;
    }
  }
}