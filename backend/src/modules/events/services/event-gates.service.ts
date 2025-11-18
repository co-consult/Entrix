import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';

export interface Gate {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentOccupancy: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  type: 'MAIN_ENTRANCE' | 'VIP_ENTRANCE' | 'STAFF_ENTRANCE' | 'EMERGENCY_EXIT' | 'ZONE_TRANSITION';
}

@Injectable()
export class EventGatesService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('EventGatesService');
  }

  // For now, we'll use mock data since we don't have a gates table yet
  private mockGates: Gate[] = [
    {
      id: 'gate-1',
      name: 'Porte Principale A',
      location: 'Entrée principale - Parking Nord',
      capacity: 1000,
      currentOccupancy: 0,
      status: 'ACTIVE',
      type: 'MAIN_ENTRANCE',
    },
    {
      id: 'gate-2',
      name: 'Porte Principale B',
      location: 'Entrée principale - Parking Sud',
      capacity: 800,
      currentOccupancy: 0,
      status: 'ACTIVE',
      type: 'MAIN_ENTRANCE',
    },
    {
      id: 'gate-3',
      name: 'Entrée VIP',
      location: 'Zone VIP - Accès direct',
      capacity: 200,
      currentOccupancy: 0,
      status: 'ACTIVE',
      type: 'VIP_ENTRANCE',
    },
    {
      id: 'gate-4',
      name: 'Entrée Staff',
      location: 'Zone technique - Arrière',
      capacity: 100,
      currentOccupancy: 0,
      status: 'ACTIVE',
      type: 'STAFF_ENTRANCE',
    },
    {
      id: 'gate-5',
      name: 'Sortie de Secours 1',
      location: 'Zone Est - Sortie d\'urgence',
      capacity: 500,
      currentOccupancy: 0,
      status: 'ACTIVE',
      type: 'EMERGENCY_EXIT',
    },
  ];

  async getEventGates(eventId: string): Promise<Gate[]> {
    const operationId = this.logger.startOperation('getEventGates', { eventId });

    try {
      // In a real implementation, this would query the database
      // For now, return mock data
      this.logger.endOperation(operationId, 'success', true);
      return this.mockGates;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getGateById(gateId: string): Promise<Gate> {
    const operationId = this.logger.startOperation('getGateById', { gateId });

    try {
      const gate = this.mockGates.find(g => g.id === gateId);
      if (!gate) {
        throw new NotFoundException('Gate not found');
      }

      this.logger.endOperation(operationId, 'success', true);
      return gate;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async updateGateOccupancy(gateId: string, occupancy: number): Promise<void> {
    const operationId = this.logger.startOperation('updateGateOccupancy', { gateId, occupancy });

    try {
      const gate = this.mockGates.find(g => g.id === gateId);
      if (gate) {
        gate.currentOccupancy = Math.max(0, Math.min(gate.capacity, occupancy));
      }

      this.logger.endOperation(operationId, 'success', true);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async incrementGateOccupancy(gateId: string, increment: number = 1): Promise<void> {
    const operationId = this.logger.startOperation('incrementGateOccupancy', { gateId, increment });

    try {
      const gate = this.mockGates.find(g => g.id === gateId);
      if (gate) {
        gate.currentOccupancy = Math.min(gate.capacity, gate.currentOccupancy + increment);
      }

      this.logger.endOperation(operationId, 'success', true);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async decrementGateOccupancy(gateId: string, decrement: number = 1): Promise<void> {
    const operationId = this.logger.startOperation('decrementGateOccupancy', { gateId, decrement });

    try {
      const gate = this.mockGates.find(g => g.id === gateId);
      if (gate) {
        gate.currentOccupancy = Math.max(0, gate.currentOccupancy - decrement);
      }

      this.logger.endOperation(operationId, 'success', true);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getGateStatistics(gateId: string): Promise<any> {
    const operationId = this.logger.startOperation('getGateStatistics', { gateId });

    try {
      const gate = await this.getGateById(gateId);
      
      const result = {
        gateId: gate.id,
        gateName: gate.name,
        capacity: gate.capacity,
        currentOccupancy: gate.currentOccupancy,
        occupancyRate: (gate.currentOccupancy / gate.capacity) * 100,
        availableCapacity: gate.capacity - gate.currentOccupancy,
        status: gate.status,
        type: gate.type,
        lastUpdated: new Date().toISOString(),
      };

      this.logger.endOperation(operationId, 'success', true);
      return result;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }
}
