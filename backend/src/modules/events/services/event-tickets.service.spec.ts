import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventTicketsService } from './event-tickets.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';

describe('EventTicketsService', () => {
  let service: EventTicketsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    createChildLogger: jest.fn(),
  } as unknown as LoggerService;

  const eventId = 'event-uuid-1';
  const organizerId = 'org-uuid-1';
  const mappingId = 'mapping-1';
  const zoneId = 'zone-1';
  const ticketTypeId = 'type-uuid-1';

  const baseEvent = {
    id: eventId,
    code: 'EVT-TEST',
    name: 'Concert Test',
    organizer_id: organizerId,
    mapping_id: mappingId,
    scheduled_start: new Date('2026-07-01T20:00:00Z'),
    scheduled_end: new Date('2026-07-01T23:00:00Z'),
    venues: { name: 'Salle Test' },
  };

  beforeEach(() => {
    mockLogger.createChildLogger = jest.fn().mockReturnValue(mockLogger);

    prisma = {
      events: {
        findUnique: jest.fn(),
      },
      ticket_types: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      venue_zones: {
        findUnique: jest.fn(),
      },
      event_ticket_config: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      tickets: {
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      physical_qr_codes: {
        findFirst: jest.fn(),
      },
      access_rights: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
      $queryRaw: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>;

    service = new EventTicketsService(prisma, mockLogger);
  });

  describe('upsertTicketConfig', () => {
    it('creates a new config when none exists (null zone)', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(baseEvent);
      (prisma.ticket_types.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.ticket_types.create as jest.Mock).mockResolvedValue({
        id: ticketTypeId,
        code: 'EVT-VIP',
        name: 'VIP',
      });
      (prisma.event_ticket_config.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.event_ticket_config.create as jest.Mock).mockResolvedValue({
        id: 'config-1',
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        zone_id: null,
        available_quantity: 100,
      });

      const result = await service.upsertTicketConfig(eventId, {
        ticket_type_name: 'VIP',
        price: 150,
        available_quantity: 100,
      });

      expect(result.success).toBe(true);
      expect(prisma.ticket_types.create).toHaveBeenCalled();
      expect(prisma.event_ticket_config.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event_id: eventId,
            zone_id: null,
            available_quantity: 100,
          }),
        }),
      );
    });

    it('updates existing config when same event/type/zone', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(baseEvent);
      (prisma.ticket_types.findUnique as jest.Mock).mockResolvedValue({
        id: ticketTypeId,
        code: 'EVT-STANDARD',
        name: 'Standard',
      });
      (prisma.event_ticket_config.findFirst as jest.Mock).mockResolvedValue({
        id: 'config-1',
        available_quantity: 50,
      });
      (prisma.event_ticket_config.update as jest.Mock).mockResolvedValue({
        id: 'config-1',
        price_override: 25,
      });

      const result = await service.upsertTicketConfig(eventId, {
        ticket_type_name: 'Standard',
        price: 25,
        available_quantity: 200,
      });

      expect(result.success).toBe(true);
      expect(prisma.event_ticket_config.update).toHaveBeenCalled();
      expect(prisma.event_ticket_config.create).not.toHaveBeenCalled();
    });

    it('reuses existing ticket type by code (ensureTicketType)', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(baseEvent);
      (prisma.ticket_types.findUnique as jest.Mock).mockResolvedValue({
        id: ticketTypeId,
        code: 'EVT-PREMIUM',
        name: 'Premium',
      });
      (prisma.event_ticket_config.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.event_ticket_config.create as jest.Mock).mockResolvedValue({ id: 'config-2' });

      await service.upsertTicketConfig(eventId, {
        ticket_type_name: 'Premium',
        price: 80,
        available_quantity: 30,
      });

      expect(prisma.ticket_types.create).not.toHaveBeenCalled();
    });

    it('throws when tier stock exceeds zone capacity', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(baseEvent);
      (prisma.ticket_types.findUnique as jest.Mock).mockResolvedValue({
        id: ticketTypeId,
        code: 'EVT-VIP',
        name: 'VIP',
      });
      (prisma.event_ticket_config.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.venue_zones.findUnique as jest.Mock).mockResolvedValue({
        id: zoneId,
        capacity: 867,
        name: 'Gradins 5',
        code: 'G5',
      });
      (prisma.event_ticket_config.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.upsertTicketConfig(eventId, {
          ticket_type_name: 'VIP',
          zone_id: zoneId,
          price: 100,
          available_quantity: 1000,
        }),
      ).rejects.toThrow(/ne peut pas dépasser la capacité/);
    });

    it('throws when event not found', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.upsertTicketConfig(eventId, {
          ticket_type_name: 'VIP',
          price: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateBatch', () => {
    const ticketType = { id: ticketTypeId, name: 'Standard', code: 'EVT-STANDARD' };

    it('throws when zone mapping mismatches event', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(baseEvent);
      (prisma.venue_zones.findUnique as jest.Mock).mockResolvedValue({
        id: zoneId,
        mapping_id: 'other-mapping',
      });

      await expect(
        service.generateBatch(eventId, {
          zone_id: zoneId,
          count: 5,
          price: 25,
          ticket_type_name: 'Standard',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws on oversell when available_quantity exceeded', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(baseEvent);
      (prisma.ticket_types.findUnique as jest.Mock).mockResolvedValue(ticketType);
      (prisma.event_ticket_config.findFirst as jest.Mock).mockResolvedValue({
        id: 'config-1',
        available_quantity: 10,
        sold_quantity: 8,
      });

      await expect(
        service.generateBatch(eventId, {
          count: 5,
          price: 25,
          ticket_type_id: ticketTypeId,
        }),
      ).rejects.toThrow(/stock restant/);
    });

    it('throws when zone capacity would be exceeded', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(baseEvent);
      (prisma.venue_zones.findUnique as jest.Mock).mockResolvedValue({
        id: zoneId,
        mapping_id: mappingId,
        code: 'TRIBA',
        capacity: 50,
      });
      (prisma.ticket_types.findUnique as jest.Mock).mockResolvedValue(ticketType);
      (prisma.event_ticket_config.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.tickets.count as jest.Mock).mockResolvedValue(48);

      await expect(
        service.generateBatch(eventId, {
          zone_id: zoneId,
          count: 5,
          price: 25,
          ticket_type_id: ticketTypeId,
        }),
      ).rejects.toThrow(/Capacité de la zone/);
    });

    it('creates tickets and access_rights and increments sold_quantity', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(baseEvent);
      (prisma.venue_zones.findUnique as jest.Mock).mockResolvedValue({
        id: zoneId,
        mapping_id: mappingId,
        code: 'TRIBA',
        capacity: 100,
      });
      (prisma.event_ticket_config.findFirst as jest.Mock).mockResolvedValue({
        id: 'config-1',
        available_quantity: 100,
        sold_quantity: 0,
      });
      (prisma.ticket_types.findUnique as jest.Mock).mockResolvedValue(ticketType);
      (prisma.tickets.count as jest.Mock).mockResolvedValue(0);

      const txMocks = {
        tickets: { create: jest.fn().mockResolvedValue({ id: 'ticket-1' }) },
        $executeRaw: jest.fn().mockResolvedValue(undefined),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(txMocks));
      (prisma.event_ticket_config.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.generateBatch(eventId, {
        count: 3,
        price: 25,
        ticket_type_id: ticketTypeId,
      });

      expect(result.success).toBe(true);
      expect(result.data.created).toBe(3);
      expect(result.data.tickets).toHaveLength(3);
      expect(result.data.tickets[0].qr_code).toMatch(/^NTRX:CSS:TKT:ALL:[A-Z0-9]{6,8}$/);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(txMocks.tickets.create).toHaveBeenCalledTimes(3);
      expect(txMocks.$executeRaw).toHaveBeenCalled();
      expect(prisma.event_ticket_config.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { sold_quantity: { increment: 3 } },
        }),
      );
    });
  });

  describe('listTicketConfigs', () => {
    it('returns tiers with remaining quantity and zone capacity stats', async () => {
      (prisma.events.findUnique as jest.Mock).mockResolvedValue(baseEvent);
      (prisma.tickets.groupBy as jest.Mock).mockResolvedValue([
        { zone_id: zoneId, _count: { id: 12 } },
      ]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { ticket_type_id: ticketTypeId, zone_id: zoneId, cnt: 12 },
      ]);
      (prisma.event_ticket_config.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'config-1',
          ticket_type_id: ticketTypeId,
          zone_id: zoneId,
          price_override: 50,
          available_quantity: 100,
          sold_quantity: 30,
          ticket_types: { name: 'VIP', base_price: 50 },
          venue_zones: { name: 'Tribune A', capacity: 200 },
        },
      ]);

      const result = await service.listTicketConfigs(eventId);

      expect(result.success).toBe(true);
      expect(result.data[0]).toMatchObject({
        ticket_type_name: 'VIP',
        zone_name: 'Tribune A',
        sold_quantity: 30,
        remaining: 70,
        zone_capacity: 200,
        zone_tickets_used: 12,
        zone_capacity_remaining: 188,
      });
    });
  });

  describe('deleteTicketConfig', () => {
    it('hard-deletes when sold_quantity is 0', async () => {
      (prisma.event_ticket_config.findFirst as jest.Mock).mockResolvedValue({
        id: 'config-1',
        event_id: eventId,
        sold_quantity: 0,
      });
      (prisma.event_ticket_config.delete as jest.Mock).mockResolvedValue({});

      const result = await service.deleteTicketConfig(eventId, 'config-1');
      expect(result.success).toBe(true);
      expect(prisma.event_ticket_config.delete).toHaveBeenCalled();
    });

    it('deactivates when sold_quantity > 0', async () => {
      (prisma.event_ticket_config.findFirst as jest.Mock).mockResolvedValue({
        id: 'config-1',
        event_id: eventId,
        sold_quantity: 5,
      });
      (prisma.event_ticket_config.update as jest.Mock).mockResolvedValue({});

      const result = await service.deleteTicketConfig(eventId, 'config-1');
      expect(result.success).toBe(true);
      expect(prisma.event_ticket_config.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { is_active: false } }),
      );
    });
  });
});
