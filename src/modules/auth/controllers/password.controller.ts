// src/modules/auth/controllers/password.controller.ts

import { 
  Controller, 
  Post, 
  Put,
  Body, 
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
  ApiBearerAuth
} from '@nestjs/swagger';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PasswordService } from '../services/password.service';
import { 
  ForgotPasswordDto, 
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto
} from '../dto/password';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUserId, Public } from '../decorators/current-user.decorator';
import { 
  RateLimitPasswordReset,
  AuditCritical,
  RateLimit
} from '../decorators/audit-log.decorator';

/**
 * Password Controller Entrix V3.0 - Grade A+
 * Gestion mots de passe et réinitialisations
 */

@ApiTags('Password Management')
@Controller('auth')
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true 
}))
export class PasswordController {
  private readonly logger: LoggerService;

  constructor(
    private readonly passwordService: PasswordService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('PasswordController');
  }

  /**
   * POST /auth/forgot-password
   * Demande réinitialisation mot de passe
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @RateLimitPasswordReset()
  @AuditCritical('password_reset_request')
  @ApiOperation({ 
    summary: 'Demande réinitialisation mot de passe',
    description: 'Génère token de réinitialisation et envoie email'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email de réinitialisation envoyé',
    type: ForgotPasswordResponseDto
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Trop de demandes'
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto
  ): Promise<ForgotPasswordResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/forgot-password', {
      email: forgotPasswordDto.email,
    });

    try {
      const token = await this.passwordService.generateResetToken(forgotPasswordDto.email);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          emailSent: true,
          resetTokenSent: true,
          expiresIn: 3600, // 1 heure
        },
        message: 'Email de réinitialisation envoyé si compte existant',
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/reset-password
   * Réinitialisation avec token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 5, windowMs: 300000 }) // 5 tentatives/5min
  @AuditCritical('password_reset_complete')
  @ApiOperation({ 
    summary: 'Réinitialisation mot de passe',
    description: 'Confirme nouveau mot de passe avec token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Mot de passe réinitialisé',
    type: ResetPasswordResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Token invalide ou mot de passe faible'
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<ResetPasswordResponseDto> {
    const operationId = this.logger.startOperation('POST /auth/reset-password');

    try {
      // Vérifier que les mots de passe correspondent
      if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      const success = await this.passwordService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword
      );

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          passwordReset: success,
          autoLogin: false, // Sécurité: force reconnexion
        },
        message: 'Mot de passe réinitialisé avec succès',
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * PUT /auth/change-password
   * Changement mot de passe utilisateur connecté
   */
  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @RateLimit({ limit: 3, windowMs: 3600000 }) // 3 changements/heure
  @AuditCritical('password_change')
  @ApiOperation({ 
    summary: 'Changement mot de passe',
    description: 'Modifie mot de passe pour utilisateur connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Mot de passe modifié',
    type: ChangePasswordResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Mot de passe actuel incorrect ou nouveau mot de passe faible'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Authentification requise'
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUserId() userId: string
  ): Promise<ChangePasswordResponseDto> {
    const operationId = this.logger.startOperation('PUT /auth/change-password', {
      userId,
    });

    try {
      // Vérifier que les mots de passe correspondent
      if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      const success = await this.passwordService.changePassword(
        userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      );

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: {
          passwordChanged: success,
          securityEventLogged: true,
        },
        message: 'Mot de passe modifié avec succès',
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * POST /auth/validate-password
   * Validation force mot de passe
   */
  @Public()
  @Post('validate-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, windowMs: 60000 }) // 10 validations/minute
  @ApiOperation({ 
    summary: 'Validation force mot de passe',
    description: 'Vérifie si mot de passe respecte critères sécurité'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Validation effectuée',
    schema: {
      example: {
        isValid: true,
        score: 85,
        strength: 'strong',
        suggestions: []
      }
    }
  })
  async validatePassword(
    @Body('password') password: string
  ) {
    const operationId = this.logger.startOperation('POST /auth/validate-password');

    try {
      const validation = await this.passwordService.validatePasswordStrength(password);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        data: validation,
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }
}