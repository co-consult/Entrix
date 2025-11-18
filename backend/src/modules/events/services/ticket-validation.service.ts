import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';

export interface ValidationResult {
  success: boolean;
  result: 'GRANTED' | 'DENIED';
  message: string;
  ticketType?: 'TICKET' | 'SUBSCRIPTION';
  userDisplayName?: string;
  remainingUses?: number;
  specialInstructions?: string[];
  alertLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  denialReason?: string;
  responseTime: number;
  timestamp: string;
}

export interface ValidationRequest {
  qrCode: string;
  eventId: string;
  gateId: string;
  agentId?: string;
  scanMetadata?: any;
}

@Injectable()
export class TicketValidationService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('TicketValidationService');
  }

  async validateTicket(validationRequest: ValidationRequest): Promise<ValidationResult> {
    const operationId = this.logger.startOperation('validateTicket', { 
      qrCode: validationRequest.qrCode.substring(0, 8) + '...',
      eventId: validationRequest.eventId 
    });
    
    const startTime = Date.now();
    
    try {
      const { qrCode, eventId, gateId, agentId, scanMetadata } = validationRequest;

      // Validate QR code format
      if (!qrCode || qrCode.length < 10) {
        return this.createDeniedResult('QR code invalide', 'INVALID_FORMAT', startTime);
      }

      // Find access right
      const accessRight = await this.prisma.access_rights.findUnique({
        where: { qr_code: qrCode },
        include: {
          users: true,
          events: true,
        },
      });

      if (!accessRight) {
        return this.createDeniedResult('QR code non reconnu', 'NOT_FOUND', startTime);
      }

      // Check if event exists and is active
      const event = await this.prisma.events.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return this.createDeniedResult('Événement non trouvé', 'EVENT_NOT_FOUND', startTime);
      }

      if (event.status !== 'LIVE') {
        return this.createDeniedResult('Événement non actif', 'EVENT_NOT_ACTIVE', startTime);
      }

      // Validate access right
      const validationResult = await this.validateAccessRight(accessRight, event, gateId);
      
      // Log the validation
      await this.logValidation({
        accessRightId: accessRight.id,
        eventId,
        gateId,
        agentId,
        result: validationResult.result,
        scanMetadata,
      });

      // Update usage count if granted
      if (validationResult.result === 'GRANTED') {
        await this.updateUsageCount(accessRight);
      }

      const result = {
        ...validationResult,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.logger.endOperation(operationId, 'success', true);
      return result;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      return this.createDeniedResult('Erreur système', 'SYSTEM_ERROR', startTime);
    }
  }

  private async validateAccessRight(
    accessRight: any,
    event: any,
    gateId: string,
  ): Promise<ValidationResult> {
    const now = new Date();

    // Check if access right is active
    if (accessRight.status !== 'VALID') {
      return this.createDeniedResult(
        `Accès ${accessRight.status.toLowerCase()}`,
        'INACTIVE_ACCESS',
        0
      );
    }

    // Check validity period
    if (accessRight.valid_from && now < accessRight.valid_from) {
      return this.createDeniedResult(
        'Accès pas encore valide',
        'NOT_YET_VALID',
        0
      );
    }

    if (accessRight.valid_until && now > accessRight.valid_until) {
      return this.createDeniedResult(
        'Accès expiré',
        'EXPIRED',
        0
      );
    }

    // Check usage limits
    if (accessRight.current_uses >= accessRight.max_uses) {
      return this.createDeniedResult(
        'Nombre maximum d\'utilisations atteint',
        'USAGE_LIMIT_EXCEEDED',
        0
      );
    }

    // Check venue restrictions
    if (accessRight.zone_id && accessRight.zone_id !== event.venue_id) {
      return this.createDeniedResult(
        'Accès non autorisé pour ce lieu',
        'WRONG_VENUE',
        0
      );
    }

    // Check event restrictions for subscriptions
    if (accessRight.subscription_id) {
      const eventIncluded = await this.checkEventIncludedInSubscription(
        accessRight.subscription_id,
        event.id
      );

      if (!eventIncluded) {
        return this.createDeniedResult(
          'Événement non inclus dans l\'abonnement',
          'EVENT_NOT_INCLUDED',
          0
        );
      }
    }

    // Check for recent failed attempts
    const recentFailures = await this.checkRecentFailures(accessRight.id);
    if (recentFailures >= 3) {
      return this.createDeniedResult(
        'Trop de tentatives échouées récentes',
        'TOO_MANY_FAILURES',
        0
      );
    }

    // All validations passed
    return {
      success: true,
      result: 'GRANTED',
      message: 'Accès autorisé',
      ticketType: accessRight.subscription_id ? 'SUBSCRIPTION' : 'TICKET',
      userDisplayName: this.getUserDisplayName(accessRight),
      remainingUses: accessRight.max_uses - accessRight.current_uses - 1,
      specialInstructions: this.getSpecialInstructions(accessRight, event),
      alertLevel: 'LOW',
      responseTime: 0,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkEventIncludedInSubscription(
    subscriptionId: string,
    eventId: string,
  ): Promise<boolean> {
    // This would check if the event is included in the subscription plan
    // For now, we'll assume all events are included
    return true;
  }

  private async checkRecentFailures(accessRightId: string): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const failures = await this.prisma.access_control_log.count({
      where: {
        access_right_id: accessRightId,
        result: 'DENIED',
        scanned_at: { gte: fiveMinutesAgo },
      },
    });

    return failures;
  }

  private async logValidation(logData: {
    accessRightId: string;
    eventId: string;
    gateId: string;
    agentId?: string;
    result: string;
    scanMetadata?: any;
  }): Promise<void> {
    await this.prisma.access_control_log.create({
      data: {
        access_right_id: logData.accessRightId,
        event_id: logData.eventId,
        user_id: 'system', // You might want to get the actual user ID
        action: 'ENTRY',
        result: logData.result as any,
        scan_metadata: logData.scanMetadata || {},
        scanned_at: new Date(),
      },
    });
  }

  private async updateUsageCount(accessRight: any): Promise<void> {
    await this.prisma.access_rights.update({
      where: { id: accessRight.id },
      data: {
        current_uses: accessRight.current_uses + 1,
        used_at: new Date(),
      },
    });
  }

  private getUserDisplayName(accessRight: any): string {
    if (accessRight.users) {
      return `${accessRight.users.first_name || ''} ${accessRight.users.last_name || ''}`.trim();
    }
    
    return 'Utilisateur anonyme';
  }

  private getSpecialInstructions(accessRight: any, event: any): string[] {
    const instructions: string[] = [];

    // Add event-specific instructions
    if (event.metadata?.special_instructions) {
      instructions.push(event.metadata.special_instructions);
    }

    return instructions;
  }

  private createDeniedResult(
    message: string,
    reason: string,
    startTime: number,
  ): ValidationResult {
    return {
      success: false,
      result: 'DENIED',
      message,
      denialReason: reason,
      alertLevel: 'MEDIUM',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  async getTicketDetails(qrCode: string): Promise<any> {
    const operationId = this.logger.startOperation('getTicketDetails', { 
      qrCode: qrCode.substring(0, 8) + '...' 
    });

    try {
      const accessRight = await this.prisma.access_rights.findUnique({
        where: { qr_code: qrCode },
        include: {
          users: true,
          events: true,
        },
      });

      if (!accessRight) {
        throw new NotFoundException('Ticket non trouvé');
      }

      const result = {
        id: accessRight.id,
        qrCode: accessRight.qr_code,
        accessType: accessRight.subscription_id ? 'SUBSCRIPTION' : 'TICKET',
        status: accessRight.status,
        userDisplayName: this.getUserDisplayName(accessRight),
        validFrom: accessRight.valid_from,
        validUntil: accessRight.valid_until,
        currentUses: accessRight.current_uses,
        maxUses: accessRight.max_uses,
        remainingUses: accessRight.max_uses - accessRight.current_uses,
        event: accessRight.events ? {
          id: accessRight.events.id,
          name: accessRight.events.name,
          scheduledStart: accessRight.events.scheduled_start,
          venueId: accessRight.events.venue_id,
        } : null,
        subscription: accessRight.subscription_id ? {
          id: accessRight.subscription_id,
        } : null,
      };

      this.logger.endOperation(operationId, 'success', true);
      return result;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getRecentValidations(eventId: string, limit: number = 10): Promise<any[]> {
    const operationId = this.logger.startOperation('getRecentValidations', { eventId, limit });

    try {
      const validations = await this.prisma.access_control_log.findMany({
        where: { event_id: eventId },
        include: {
          access_rights: {
            include: {
              users: true,
            },
          },
        },
        orderBy: { scanned_at: 'desc' },
        take: limit,
      });

      const result = validations.map(validation => ({
        id: validation.id,
        qrCode: validation.access_rights?.qr_code,
        result: validation.result,
        userDisplayName: validation.access_rights?.users 
          ? `${validation.access_rights.users.first_name || ''} ${validation.access_rights.users.last_name || ''}`.trim()
          : 'Anonyme',
        timestamp: validation.scanned_at,
        gateId: validation.access_point_id,
        responseTime: 0, // Would be calculated from actual response time
      }));

      this.logger.endOperation(operationId, 'success', true);
      return result;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getValidationHistory(eventId: string, date: string): Promise<any[]> {
    const operationId = this.logger.startOperation('getValidationHistory', { eventId, date });

    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const validations = await this.prisma.access_control_log.findMany({
        where: {
          event_id: eventId,
          scanned_at: { gte: startDate, lt: endDate },
        },
        include: {
          access_rights: {
            include: {
              users: true,
            },
          },
        },
        orderBy: { scanned_at: 'asc' },
      });

      const result = validations.map(validation => ({
        id: validation.id,
        qrCode: validation.access_rights?.qr_code,
        result: validation.result,
        userDisplayName: validation.access_rights?.users 
          ? `${validation.access_rights.users.first_name || ''} ${validation.access_rights.users.last_name || ''}`.trim()
          : 'Anonyme',
        timestamp: validation.scanned_at,
        gateId: validation.access_point_id,
      }));

      this.logger.endOperation(operationId, 'success', true);
      return result;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }
}
