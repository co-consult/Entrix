import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';

export interface EventStats {
  totalTickets: number;
  validatedTickets: number;
  refusedTickets: number;
  occupancyRate: number;
  averageResponseTime: number;
  lastValidations: Array<{
    timestamp: string;
    qrCode: string;
    result: 'success' | 'denied';
    responseTime: number;
  }>;
}

@Injectable()
export class EventStatisticsService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('EventStatisticsService');
  }

  async getEventStatistics(eventId: string): Promise<EventStats> {
    const operationId = this.logger.startOperation('getEventStatistics', { eventId });

    try {
      // Check if event exists
      const event = await this.prisma.events.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Get validation statistics - get ALL validations for accurate counts
      const validations = await this.prisma.access_control_log.findMany({
        where: { event_id: eventId },
        orderBy: { scanned_at: 'desc' },
      });

      const totalValidations = validations.length;
      const validatedTickets = validations.filter(v => v.result === 'SUCCESS').length;
      const refusedTickets = validations.filter(v => v.result === 'DENIED').length;

      // Calculate occupancy rate
      const occupancyRate = event.max_capacity 
        ? (event.current_capacity / event.max_capacity) * 100 
        : 0;

      // Calculate average response time (mock for now)
      const averageResponseTime = 150; // milliseconds

      // Get last 10 validations
      const lastValidations = validations.slice(0, 10).map(v => ({
        timestamp: v.scanned_at.toISOString(),
        qrCode: v.access_right_id || 'Unknown',
        result: v.result === 'SUCCESS' ? 'success' as const : 'denied' as const,
        responseTime: 150, // Mock response time
      }));

      const result = {
        totalTickets: totalValidations,
        validatedTickets,
        refusedTickets,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        averageResponseTime,
        lastValidations,
      };

      this.logger.endOperation(operationId, 'success', true);
      return result;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getGateStatistics(eventId: string, gateId: string): Promise<any> {
    const operationId = this.logger.startOperation('getGateStatistics', { eventId, gateId });

    try {
      // Check if event exists
      const event = await this.prisma.events.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Get gate-specific validations
      const validations = await this.prisma.access_control_log.findMany({
        where: { 
          event_id: eventId, 
          access_point_id: gateId 
        },
        orderBy: { scanned_at: 'desc' },
        take: 50,
      });

      const totalValidations = validations.length;
      const validatedTickets = validations.filter(v => v.result === 'SUCCESS').length;
      const refusedTickets = validations.filter(v => v.result === 'DENIED').length;

      // Calculate success rate
      const successRate = totalValidations > 0 
        ? (validatedTickets / totalValidations) * 100 
        : 0;

      // Get recent activity (last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentValidations = validations.filter(v => v.scanned_at >= tenMinutesAgo);
      const recentValidated = recentValidations.filter(v => v.result === 'SUCCESS').length;

      const result = {
        gateId,
        eventId,
        totalValidations,
        validatedTickets,
        refusedTickets,
        successRate: Math.round(successRate * 100) / 100,
        recentActivity: {
          validations: recentValidations.length,
          validated: recentValidated,
          rate: recentValidations.length > 0 
            ? Math.round((recentValidated / recentValidations.length) * 100) 
            : 0,
        },
        lastUpdated: new Date().toISOString(),
      };

      this.logger.endOperation(operationId, 'success', true);
      return result;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getRealTimeStats(eventId: string): Promise<any> {
    const operationId = this.logger.startOperation('getRealTimeStats', { eventId });

    try {
      // Get current event capacity
      const event = await this.prisma.events.findUnique({
        where: { id: eventId },
        select: { max_capacity: true, current_capacity: true },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Get validations from last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentValidations = await this.prisma.access_control_log.findMany({
        where: {
          event_id: eventId,
          scanned_at: { gte: fiveMinutesAgo },
        },
        orderBy: { scanned_at: 'desc' },
      });

      const recentValidated = recentValidations.filter(v => v.result === 'SUCCESS').length;
      const recentDenied = recentValidations.filter(v => v.result === 'DENIED').length;

      // Calculate flow rate (validations per minute)
      const flowRate = recentValidations.length / 5; // 5 minutes

      const result = {
        eventId,
        capacity: {
          total: event.max_capacity || 0,
          current: event.current_capacity || 0,
          available: (event.max_capacity || 0) - (event.current_capacity || 0),
          occupancyRate: event.max_capacity 
            ? Math.round((event.current_capacity / event.max_capacity) * 100 * 100) / 100
            : 0,
        },
        recentActivity: {
          validations: recentValidations.length,
          validated: recentValidated,
          denied: recentDenied,
          successRate: recentValidations.length > 0 
            ? Math.round((recentValidated / recentValidations.length) * 100)
            : 0,
          flowRate: Math.round(flowRate * 100) / 100,
        },
        timestamp: new Date().toISOString(),
      };

      this.logger.endOperation(operationId, 'success', true);
      return result;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }
}
