import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Headers,
  Get,
  Query,
  Param,
  UseGuards
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AccessControlService } from '../services/access-control.service';
import { 
  AccessControlValidationDto,
  AccessControlResponseDto
} from '../dto/access-control.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { RateLimit } from '../../auth/decorators/rate-limit.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

/**
 * Access Control Controller Entrix V3.0
 * Endpoints for real-time access control validation
 * Creates access control log records for tracking entry/exit
 */

@ApiTags('Access Control')
@Controller('access-control')
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true 
}))
export class AccessControlController {
  private readonly logger: LoggerService;

  constructor(
    private readonly accessControlService: AccessControlService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('AccessControlController');
  }

  /**
   * POST /api/v1/access-control/validate
   * **ENDPOINT CRITIQUE** - Validation temps réel d'un QR code à l'entrée
   * Creates access control log record and returns validation result
   */
  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 1000, windowMs: 60000 }) // 1000 validations/minute
  @ApiOperation({ 
    summary: 'Validation temps réel d\'un QR code',
    description: 'Valide un QR code pour l\'accès et crée un enregistrement de contrôle d\'accès'
  })
  @ApiBody({ type: AccessControlValidationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Résultat de validation',
    type: AccessControlResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données de validation invalides' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Erreur serveur' 
  })
  async validateAccess(
    @Body() validationDto: AccessControlValidationDto,
    @Headers('authorization') authHeader?: string
  ): Promise<AccessControlResponseDto> {
    const operationId = this.logger.startOperation('POST /access-control/validate', {
      qr_code: validationDto.qr_code,
      venue_id: validationDto.venue_id,
      entry_point: validationDto.entry_point
    });

    try {
      // Extract user info from JWT token if available
      let authenticatedUser = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          
          // Decode JWT token to get real user information
          const payload = this.jwtService.verify(token, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            issuer: 'entrix-v3',
            audience: 'entrix-users',
          });
          
          // Extract user information from JWT payload
          authenticatedUser = {
            user_id: payload.sub,
            email: payload.email,
            roles: payload.roles,
            agent_id: payload.sub, // Use user ID as agent ID for consistency
            session_id: payload.sessionId
          };
          
          this.logger.info('Successfully extracted user info from JWT token', JSON.stringify({
            user_id: payload.sub,
            email: payload.email,
            roles: payload.roles
          }));
          
        } catch (error) {
          this.logger.warn('Failed to decode JWT token for access control validation', JSON.stringify({
            error: error.message
          }));
          // Fallback to agent_id from request if JWT decoding fails
          authenticatedUser = {
            agent_id: validationDto.agent_id
          };
        }
      }

      // Validate access and create log record
      const validationResult = await this.accessControlService.validateAccess(validationDto, authenticatedUser);

      this.logger.endOperation('validateAccess', operationId, true);

      return {
        success: true,
        data: validationResult,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.endOperation('validateAccess', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }

  
  /**
   * GET /api/v1/access-control/logs
   * Get access control logs with filtering and pagination
   */
  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get access control logs',
    description: 'Retrieve access control logs with filtering and pagination'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'result', required: false, description: 'Filter by result (SUCCESS/DENIED)' })
  @ApiQuery({ name: 'denial_reason', required: false, description: 'Filter by denial reason' })
  @ApiQuery({ name: 'event_id', required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'date_from', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'date_to', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'sort_by', required: false, description: 'Sort field', example: 'scanned_at' })
  @ApiQuery({ name: 'sort_order', required: false, description: 'Sort order', example: 'desc' })
  @ApiResponse({ 
    status: 200, 
    description: 'Access control logs retrieved successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden' 
  })
  async getAccessLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('result') result?: string,
    @Query('denial_reason') denial_reason?: string,
    @Query('event_id') event_id?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
    @Query('sort_by') sort_by: string = 'scanned_at',
    @Query('sort_order') sort_order: 'asc' | 'desc' = 'desc'
  ) {
    const operationId = this.logger.startOperation('GET /access-control/logs', {
      page, limit, search, result, denial_reason, event_id, date_from, date_to
    });

    try {
      const logs = await this.accessControlService.getAccessLogs({
        page,
        limit,
        search,
        result,
        denial_reason,
        event_id,
        date_from,
        date_to,
        sort_by,
        sort_order
      });

      this.logger.endOperation('getAccessLogs', operationId, true);
      return logs;
    } catch (error) {
      this.logger.endOperation('getAccessLogs', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }

  /**
   * GET /api/v1/access-control/logs/:id
   * Get specific access control log details
   */
  @Get('logs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get access control log details',
    description: 'Retrieve detailed information about a specific access control log'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Access control log details retrieved successfully'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Access control log not found'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden' 
  })
  async getAccessLogById(@Param('id') id: string) {
    const operationId = this.logger.startOperation('GET /access-control/logs/:id', { logId: id });

    try {
      const log = await this.accessControlService.getAccessLogById(id);

      this.logger.endOperation('getAccessLogById', operationId, true);
      return log;
    } catch (error) {
      this.logger.endOperation('getAccessLogById', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }

  /**
   * GET /api/v1/access-control/analytics
   * Get access control analytics and statistics
   */
  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get access control analytics',
    description: 'Retrieve analytics and statistics for access control'
  })
  @ApiQuery({ name: 'event_id', required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'date_from', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'date_to', required: false, description: 'Filter to date (ISO string)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Access control analytics retrieved successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden' 
  })
  async getAccessAnalytics(
    @Query('event_id') event_id?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string
  ) {
    const operationId = this.logger.startOperation('GET /access-control/analytics', {
      event_id, date_from, date_to
    });

    try {
      const analytics = await this.accessControlService.getAccessAnalytics({
        event_id,
        date_from,
        date_to
      });

      this.logger.endOperation('getAccessAnalytics', operationId, true);
      return analytics;
    } catch (error) {
      this.logger.endOperation('getAccessAnalytics', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }

  /**
   * GET /api/v1/access-control/denial-analysis
   * Get detailed denial analysis
   */
  @Get('denial-analysis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get denial analysis',
    description: 'Retrieve detailed analysis of access denials'
  })
  @ApiQuery({ name: 'event_id', required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'date_from', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'date_to', required: false, description: 'Filter to date (ISO string)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Denial analysis retrieved successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden' 
  })
  async getDenialAnalysis(
    @Query('event_id') event_id?: string,
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string
  ) {
    const operationId = this.logger.startOperation('GET /access-control/denial-analysis', {
      event_id, date_from, date_to
    });

    try {
      const analysis = await this.accessControlService.getDenialAnalysis({
        event_id,
        date_from,
        date_to
      });

      this.logger.endOperation('getDenialAnalysis', operationId, true);
      return analysis;
    } catch (error) {
      this.logger.endOperation('getDenialAnalysis', operationId, false, undefined, { error: error.message });
      throw error;
    }
  }
}
