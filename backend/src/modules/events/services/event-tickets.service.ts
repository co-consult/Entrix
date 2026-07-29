import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { randomBytes } from 'crypto';
import {
  UpsertEventTicketConfigDto,
  GenerateEventTicketsBatchDto,
} from '../dto/event-tickets.dto';
import { ListEventTicketsQueryDto } from '../dto/list-event-tickets.dto';
import {
  SellEventTicketsDto,
  ListEventTicketSalesQueryDto,
} from '../dto/sell-event-tickets.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventTicketsService {
  private readonly logger: LoggerService;
  private static readonly DEFAULT_ORGANIZER_ID = 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e';
  private static readonly MAX_BATCH_SIZE = 5000;
  private static readonly GENERATE_CHUNK_SIZE = 75;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('EventTicketsService');
  }

  async listEventTickets(eventId: string, query?: ListEventTicketsQueryDto) {
    const event = await this.prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Événement introuvable');

    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ticketsWhereInput = { event_id: eventId };

    if (query?.ticket_type?.trim()) {
      where.ticket_types = { name: query.ticket_type.trim() };
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { ticket_number: { contains: term, mode: 'insensitive' } },
        { access_rights: { some: { qr_code: { contains: term, mode: 'insensitive' } } } },
        { venue_zones: { code: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [tickets, total, validCount] = await Promise.all([
      this.prisma.tickets.findMany({
        where,
        include: {
          ticket_types: true,
          venue_zones: true,
          access_rights: {
            select: {
              id: true,
              qr_code: true,
              access_code: true,
              status: true,
              valid_from: true,
              valid_until: true,
              created_at: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tickets.count({ where }),
      this.prisma.access_rights.count({
        where: { event_id: eventId, source_type: 'TICKET', status: 'VALID' },
      }),
    ]);

    return {
      success: true,
      data: tickets.map((t) => this.mapTicketRow(t)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        total,
        valid: validCount,
      },
    };
  }

  private mapTicketRow(t: {
    id: string;
    ticket_number: string;
    event_id: string;
    zone_id: string | null;
    price_paid: Prisma.Decimal;
    is_active: boolean;
    created_at: Date;
    ticket_types: { name: string } | null;
    venue_zones: { name: string; code: string } | null;
    access_rights: Array<{
      qr_code: string;
      access_code: string;
      status: string;
      created_at: Date;
    }>;
  }) {
    const ar = t.access_rights[0];
    return {
      id: t.id,
      ticket_number: t.ticket_number,
      event_id: t.event_id,
      zone_id: t.zone_id,
      zone_name: t.venue_zones?.name,
      zone_code: t.venue_zones?.code,
      price_paid: Number(t.price_paid),
      ticket_type: t.ticket_types?.name,
      is_active: t.is_active,
      qr_code: ar?.qr_code,
      access_code: ar?.access_code,
      status: ar?.status,
      created_at: t.created_at,
    };
  }

  async listTicketConfigs(eventId: string) {
    const event = await this.prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Événement introuvable');

    const configs = await this.prisma.event_ticket_config.findMany({
      where: { event_id: eventId, is_active: true },
      include: {
        ticket_types: true,
        venue_zones: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const zoneIds = [...new Set(configs.map((c) => c.zone_id).filter(Boolean))] as string[];
    const zoneTicketCounts = new Map<string, number>();
    if (zoneIds.length > 0) {
      const counts = await this.prisma.tickets.groupBy({
        by: ['zone_id'],
        where: { event_id: eventId, zone_id: { in: zoneIds }, is_active: true },
        _count: { id: true },
      });
      for (const row of counts) {
        if (row.zone_id) zoneTicketCounts.set(row.zone_id, row._count.id);
      }
    }

    const unsoldByTier = await this.getUnsoldCountsByTier(eventId);

    return {
      success: true,
      data: configs.map((c) => {
        const tierKey = `${c.ticket_type_id}:${c.zone_id ?? 'null'}`;
        const availableForSale = unsoldByTier.get(tierKey) ?? 0;
        const available = c.available_quantity;
        const sold = c.sold_quantity ?? 0;
        const remaining =
          available != null ? Math.max(0, available - sold) : null;
        const zoneCapacity = c.venue_zones?.capacity ?? null;
        const zoneTicketsUsed = c.zone_id ? (zoneTicketCounts.get(c.zone_id) ?? 0) : null;
        const zoneCapacityRemaining =
          zoneCapacity != null && c.zone_id
            ? Math.max(0, zoneCapacity - (zoneTicketsUsed ?? 0))
            : null;
        return {
          id: c.id,
          ticket_type_id: c.ticket_type_id,
          ticket_type_name: c.ticket_types?.name,
          zone_id: c.zone_id,
          zone_name: c.venue_zones?.name ?? null,
          zone_capacity: zoneCapacity,
          zone_tickets_used: zoneTicketsUsed,
          zone_capacity_remaining: zoneCapacityRemaining,
          price: c.price_override != null ? Number(c.price_override) : Number(c.ticket_types?.base_price ?? 0),
          available_quantity: available,
          sold_quantity: sold,
          remaining,
          available_for_sale: availableForSale,
        };
      }),
    };
  }

  async listSellableOptions(eventId: string) {
    const event = await this.prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Événement introuvable');

    const rows = await this.prisma.$queryRaw<
      Array<{
        ticket_type_id: string;
        ticket_type_name: string;
        zone_id: string | null;
        zone_name: string | null;
        available_for_sale: number;
        price: string | number | null;
      }>
    >`
      SELECT
        t.ticket_type_id,
        tt.name AS ticket_type_name,
        t.zone_id,
        vz.name AS zone_name,
        COUNT(*)::int AS available_for_sale,
        COALESCE(
          (
            SELECT etc.price_override
            FROM event_ticket_config etc
            WHERE etc.event_id = t.event_id
              AND etc.ticket_type_id = t.ticket_type_id
              AND etc.zone_id IS NOT DISTINCT FROM t.zone_id
            ORDER BY etc.is_active DESC, etc.updated_at DESC
            LIMIT 1
          ),
          tt.base_price
        ) AS price
      FROM tickets t
      INNER JOIN ticket_types tt ON tt.id = t.ticket_type_id
      LEFT JOIN venue_zones vz ON vz.id = t.zone_id
      WHERE t.event_id = ${eventId}::uuid
        AND t.is_active = true
        AND (t.metadata->>'sale_status' IS NULL OR t.metadata->>'sale_status' <> 'SOLD')
      GROUP BY t.ticket_type_id, tt.name, t.zone_id, vz.name, tt.base_price, t.event_id
      HAVING COUNT(*) > 0
      ORDER BY tt.name ASC, vz.name ASC NULLS LAST
    `;

    return {
      success: true,
      data: rows.map((r) => ({
        ticket_type_id: r.ticket_type_id,
        ticket_type_name: r.ticket_type_name,
        zone_id: r.zone_id,
        zone_name: r.zone_name,
        available_for_sale: Number(r.available_for_sale),
        price: Number(r.price ?? 0),
        option_key: `${r.ticket_type_id}:${r.zone_id ?? 'null'}`,
      })),
    };
  }

  async sellTickets(
    eventId: string,
    dto: SellEventTicketsDto,
    seller?: { id?: string; email?: string; first_name?: string; last_name?: string },
  ) {
    const event = await this.prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Événement introuvable');

    const ticketType = await this.prisma.ticket_types.findUnique({
      where: { id: dto.ticket_type_id },
    });
    if (!ticketType) throw new BadRequestException('Type de billet introuvable');

    const zoneKey = dto.zone_id ?? null;
    const config = await this.prisma.event_ticket_config.findFirst({
      where: {
        event_id: eventId,
        ticket_type_id: dto.ticket_type_id,
        zone_id: zoneKey,
      },
      orderBy: [{ is_active: 'desc' }, { updated_at: 'desc' }],
    });
    const unitPrice =
      config?.price_override != null
        ? Number(config.price_override)
        : Number(ticketType.base_price ?? 0);

    const ticketIds = await this.findUnsoldTicketIds(
      eventId,
      dto.ticket_type_id,
      zoneKey,
      dto.quantity,
    );

    const availableTickets = await this.prisma.tickets.findMany({
      where: { id: { in: ticketIds } },
      include: {
        access_rights: { select: { qr_code: true, id: true }, take: 1 },
        venue_zones: { select: { name: true, code: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    if (availableTickets.length < dto.quantity) {
      throw new BadRequestException(
        `Stock insuffisant : ${availableTickets.length} billet(s) disponible(s), ${dto.quantity} demandé(s).`,
      );
    }

    const totalAmount = unitPrice * dto.quantity;
    const guestName = dto.guest_name?.trim() || 'Client comptoir';
    const soldAt = new Date().toISOString();

    const result = await this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.generateOrderNumber(tx);
      const order = await tx.orders.create({
        data: {
          order_number: orderNumber,
          user_id: null,
          primary_organizer_id: event.organizer_id,
          status: 'CONFIRMED',
          subtotal_amount: totalAmount,
          total_amount: totalAmount,
          currency: 'TND',
          purchase_channel: 'COUNTER',
          guest_name: guestName,
          guest_email: dto.guest_email || null,
          guest_phone: dto.guest_phone || null,
          metadata: {
            orderType: 'TICKET',
            eventId,
            eventName: event.name,
            ticketTypeId: dto.ticket_type_id,
            ticketTypeName: ticketType.name,
            zoneId: zoneKey,
            quantity: dto.quantity,
            paymentMethod: dto.payment_method,
            sellerId: seller?.id,
            sellerEmail: seller?.email,
            sellerName: seller?.first_name
              ? `${seller.first_name} ${seller.last_name || ''}`.trim()
              : undefined,
            note: dto.note,
          },
          confirmed_at: new Date(),
        },
      });

      const soldRows: Array<{
        ticket_id: string;
        ticket_number: string;
        qr_code?: string;
        zone_name?: string;
      }> = [];

      await tx.$executeRaw`ALTER TABLE order_items DISABLE TRIGGER ALL`;
      try {
        for (const ticket of availableTickets) {
          const existingMeta = (ticket.metadata as Record<string, unknown>) || {};
          await tx.tickets.update({
            where: { id: ticket.id },
            data: {
              price_paid: unitPrice,
              metadata: {
                ...existingMeta,
                sale_status: 'SOLD',
                order_id: order.id,
                sold_at: soldAt,
                payment_method: dto.payment_method,
                guest_name: guestName,
              },
            },
          });

          await tx.$executeRaw`
            INSERT INTO order_items (
              id, order_id, ticket_type_id, item_type, item_name,
              quantity, unit_price, discount_amount, total_price, currency,
              item_configuration, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), ${order.id}::uuid, ${dto.ticket_type_id}::uuid,
              'TICKET', ${ticketType.name}, 1, ${unitPrice}, 0, ${unitPrice}, 'TND',
              ${JSON.stringify({ ticket_id: ticket.id, zone_id: ticket.zone_id, event_id: eventId })}::jsonb,
              NOW(), NOW()
            )
          `;

          soldRows.push({
            ticket_id: ticket.id,
            ticket_number: ticket.ticket_number,
            qr_code: ticket.access_rights[0]?.qr_code,
            zone_name: ticket.venue_zones?.name,
          });
        }
      } finally {
        await tx.$executeRaw`ALTER TABLE order_items ENABLE TRIGGER ALL`;
      }

      return { order, tickets: soldRows };
    });

    this.logger.info(`Sold ${dto.quantity} event tickets for event ${eventId}, order ${result.order.id}`);

    return {
      success: true,
      data: {
        order_id: result.order.id,
        order_number: result.order.order_number,
        total_amount: totalAmount,
        quantity: dto.quantity,
        tickets: result.tickets,
      },
      message: `${dto.quantity} billet(s) vendu(s)`,
    };
  }

  async listTicketSales(eventId: string, query?: ListEventTicketSalesQueryDto) {
    const event = await this.prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Événement introuvable');

    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ordersWhereInput = {
      metadata: {
        path: ['orderType'],
        equals: 'TICKET',
      },
      AND: [{ metadata: { path: ['eventId'], equals: eventId } }],
    };

    const [orders, total, revenueAgg] = await Promise.all([
      this.prisma.orders.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.orders.count({ where }),
      this.prisma.orders.aggregate({
        where,
        _sum: { total_amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      success: true,
      data: orders.map((o) => {
        const meta = (o.metadata as Record<string, unknown>) || {};
        return {
          id: o.id,
          order_number: o.order_number,
          guest_name: o.guest_name,
          guest_phone: o.guest_phone,
          total_amount: Number(o.total_amount),
          currency: o.currency,
          payment_method: meta.paymentMethod,
          ticket_type_name: meta.ticketTypeName,
          quantity: meta.quantity,
          seller_name: meta.sellerName,
          created_at: o.created_at,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        total_sales: total,
        total_revenue: Number(revenueAgg._sum.total_amount ?? 0),
      },
    };
  }

  private tierKey(ticketTypeId: string, zoneId: string | null): string {
    return `${ticketTypeId}:${zoneId ?? 'null'}`;
  }

  private async getUnsoldCountsByTier(eventId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<
      Array<{ ticket_type_id: string; zone_id: string | null; cnt: number }>
    >`
      SELECT ticket_type_id, zone_id, COUNT(*)::int AS cnt
      FROM tickets
      WHERE event_id = ${eventId}::uuid
        AND is_active = true
        AND (metadata->>'sale_status' IS NULL OR metadata->>'sale_status' <> 'SOLD')
      GROUP BY ticket_type_id, zone_id
    `;
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(this.tierKey(row.ticket_type_id, row.zone_id), Number(row.cnt));
    }
    return map;
  }

  private async findUnsoldTicketIds(
    eventId: string,
    ticketTypeId: string,
    zoneId: string | null,
    limit: number,
  ): Promise<string[]> {
    const rows =
      zoneId != null
        ? await this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM tickets
            WHERE event_id = ${eventId}::uuid
              AND ticket_type_id = ${ticketTypeId}::uuid
              AND zone_id = ${zoneId}
              AND is_active = true
              AND (metadata->>'sale_status' IS NULL OR metadata->>'sale_status' <> 'SOLD')
            ORDER BY created_at ASC
            LIMIT ${limit}
          `
        : await this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM tickets
            WHERE event_id = ${eventId}::uuid
              AND ticket_type_id = ${ticketTypeId}::uuid
              AND zone_id IS NULL
              AND is_active = true
              AND (metadata->>'sale_status' IS NULL OR metadata->>'sale_status' <> 'SOLD')
            ORDER BY created_at ASC
            LIMIT ${limit}
          `;
    return rows.map((r) => r.id);
  }

  private async generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
    const latest = await tx.orders.findFirst({
      orderBy: { created_at: 'desc' },
      select: { order_number: true },
    });
    if (!latest?.order_number?.startsWith('ORD_')) {
      return 'ORD_00000001';
    }
    const num = parseInt(latest.order_number.replace('ORD_', ''), 10);
    const next = Number.isFinite(num) ? num + 1 : 1;
    return `ORD_${next.toString().padStart(8, '0')}`;
  }

  async deleteTicketConfig(eventId: string, configId: string) {
    const config = await this.prisma.event_ticket_config.findFirst({
      where: { id: configId, event_id: eventId },
    });
    if (!config) throw new NotFoundException('Configuration de billet introuvable');

    if ((config.sold_quantity ?? 0) > 0) {
      await this.prisma.event_ticket_config.update({
        where: { id: configId },
        data: { is_active: false },
      });
      return {
        success: true,
        message: 'Tier désactivé (des billets ont déjà été vendus/générés)',
      };
    }

    await this.prisma.event_ticket_config.delete({ where: { id: configId } });
    return { success: true, message: 'Tier supprimé' };
  }

  async upsertTicketConfig(eventId: string, dto: UpsertEventTicketConfigDto) {
    const event = await this.prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Événement introuvable');

    const ticketType = await this.ensureTicketType(
      dto.ticket_type_name,
      dto.price,
      event.organizer_id,
    );

    const zoneKey = dto.zone_id ?? null;
    const existing = await this.prisma.event_ticket_config.findFirst({
      where: {
        event_id: eventId,
        ticket_type_id: ticketType.id,
        zone_id: zoneKey,
      },
    });

    if (existing) {
      const zoneId = dto.zone_id ?? existing.zone_id;
      const finalAvailable = dto.available_quantity ?? existing.available_quantity;
      if (zoneId) {
        if (finalAvailable == null) {
          throw new BadRequestException(
            'Le stock est obligatoire lorsqu\'une zone est sélectionnée.',
          );
        }
        await this.assertTierPoolWithinZoneCapacity(
          eventId,
          zoneId,
          finalAvailable,
          existing.id,
          existing.sold_quantity ?? 0,
        );
      }

      const updated = await this.prisma.event_ticket_config.update({
        where: { id: existing.id },
        data: {
          price_override: dto.price,
          available_quantity: dto.available_quantity ?? existing.available_quantity,
          is_active: true,
        },
      });
      return { success: true, data: updated };
    }

    if (dto.zone_id) {
      if (dto.available_quantity == null) {
        throw new BadRequestException(
          'Le stock est obligatoire lorsqu\'une zone est sélectionnée.',
        );
      }
      await this.assertTierPoolWithinZoneCapacity(
        eventId,
        dto.zone_id,
        dto.available_quantity,
        undefined,
        0,
      );
    }

    const created = await this.prisma.event_ticket_config.create({
      data: {
        event_id: eventId,
        ticket_type_id: ticketType.id,
        zone_id: dto.zone_id ?? null,
        organizer_id: event.organizer_id,
        price_override: dto.price,
        available_quantity: dto.available_quantity ?? null,
        is_active: true,
      },
    });

    return { success: true, data: created };
  }

  async generateBatch(eventId: string, dto: GenerateEventTicketsBatchDto) {
    if (dto.count > EventTicketsService.MAX_BATCH_SIZE) {
      throw new BadRequestException(
        `Maximum ${EventTicketsService.MAX_BATCH_SIZE} billets par génération.`,
      );
    }

    const event = await this.prisma.events.findUnique({
      where: { id: eventId },
      include: { venues: true },
    });
    if (!event) throw new NotFoundException('Événement introuvable');

    let zoneCode = 'ALL';
    let zoneCapacity: number | null = null;
    if (dto.zone_id) {
      const zone = await this.prisma.venue_zones.findUnique({ where: { id: dto.zone_id } });
      if (!zone) throw new BadRequestException('Zone introuvable');
      if (zone.mapping_id !== event.mapping_id) {
        throw new BadRequestException('La zone ne correspond pas à la cartographie de l\'événement');
      }
      zoneCode = zone.code ?? 'ALL';
      zoneCapacity = zone.capacity ?? null;
    }

    const typeName = dto.ticket_type_name || 'Standard';
    const ticketType = dto.ticket_type_id
      ? await this.prisma.ticket_types.findUnique({ where: { id: dto.ticket_type_id } })
      : await this.ensureTicketType(typeName, dto.price, event.organizer_id);

    if (!ticketType) throw new BadRequestException('Type de billet introuvable');

    const zoneKey = dto.zone_id ?? null;
    const existingConfig = await this.prisma.event_ticket_config.findFirst({
      where: {
        event_id: eventId,
        ticket_type_id: ticketType.id,
        zone_id: zoneKey,
        is_active: true,
      },
    });

    if (existingConfig?.available_quantity != null) {
      const sold = existingConfig.sold_quantity ?? 0;
      const remaining = existingConfig.available_quantity - sold;
      if (dto.count > remaining) {
        throw new BadRequestException(
          `Quantité demandée (${dto.count}) dépasse le stock restant (${Math.max(0, remaining)}).`,
        );
      }
    }

    if (dto.zone_id) {
      if (zoneCapacity == null || zoneCapacity <= 0) {
        throw new BadRequestException(
          'La zone sélectionnée n\'a pas de capacité définie — impossible de générer des billets.',
        );
      }
      await this.assertEventZoneCapacityForGeneration(eventId, dto.zone_id, dto.count, zoneCapacity);
    }

    const validFrom = event.scheduled_start;
    const validUntil = event.scheduled_end;
    const createdTickets: Array<{ ticket_number: string; qr_code: string; access_code: string }> = [];

    const reservedSuffixes = this.generateInMemorySuffixes(dto.count);
    const batchOffset = Date.now();

    for (let offset = 0; offset < dto.count; offset += EventTicketsService.GENERATE_CHUNK_SIZE) {
      const chunkSize = Math.min(EventTicketsService.GENERATE_CHUNK_SIZE, dto.count - offset);
      const chunkSuffixes = reservedSuffixes.slice(offset, offset + chunkSize);

      await this.prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`ALTER TABLE access_rights DISABLE TRIGGER ALL`;

          try {
            for (let i = 0; i < chunkSize; i++) {
              const globalIndex = offset + i;
              const ticketNumber = this.generateTicketNumber(event.code, batchOffset + globalIndex);
              const suffix = chunkSuffixes[i];
              const qrCode = this.buildEventTicketQrCode(zoneCode, suffix);
              const accessCode = this.generateAccessCode();

              const ticket = await tx.tickets.create({
                data: {
                  ticket_number: ticketNumber,
                  ticket_type_id: ticketType.id,
                  event_id: eventId,
                  zone_id: dto.zone_id ?? null,
                  organizer_id: event.organizer_id,
                  price_paid: dto.price,
                  currency: 'TND',
                  is_active: true,
                  metadata: { source: 'admin_batch', zone_code: zoneCode },
                },
              });

              const accessMetadata = JSON.stringify({
                event_name: event.name,
                ticket_type: ticketType.name,
                zone_code: zoneCode,
              });

              await tx.$executeRaw`
                INSERT INTO access_rights (
                  qr_code, access_code, event_id, organizer_id, ticket_id, zone_id,
                  source_type, status, valid_from, valid_until, max_uses, current_uses, access_metadata
                ) VALUES (
                  ${qrCode}, ${accessCode}, ${eventId}::uuid, ${event.organizer_id}::uuid,
                  ${ticket.id}::uuid, ${dto.zone_id ?? null},
                  'TICKET'::access_source_type, 'VALID'::access_right_status,
                  ${validFrom}, ${validUntil}, 1, 0, ${accessMetadata}::jsonb
                )
              `;

              createdTickets.push({
                ticket_number: ticketNumber,
                qr_code: qrCode,
                access_code: accessCode,
              });
            }
          } finally {
            await tx.$executeRaw`ALTER TABLE access_rights ENABLE TRIGGER ALL`;
          }
        },
        { timeout: 120000, maxWait: 15000 },
      );
    }

    await this.prisma.event_ticket_config.updateMany({
      where: {
        event_id: eventId,
        ticket_type_id: ticketType.id,
        ...(dto.zone_id ? { zone_id: dto.zone_id } : { zone_id: null }),
      },
      data: {
        sold_quantity: { increment: dto.count },
      },
    });

    this.logger.info(`Generated ${dto.count} event tickets for event ${eventId}`);

    return {
      success: true,
      data: {
        created: dto.count,
        tickets: createdTickets.slice(0, 50),
        tickets_truncated: createdTickets.length > 50,
      },
      message: `${dto.count} billet(s) généré(s)`,
    };
  }

  private async ensureTicketType(name: string, price: number, organizerId: string) {
    const code = `EVT-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 40)}`;
    const existing = await this.prisma.ticket_types.findUnique({ where: { code } });
    if (existing) return existing;

    return this.prisma.ticket_types.create({
      data: {
        code,
        name,
        base_price: price,
        currency: 'TND',
        organizer_id: organizerId || EventTicketsService.DEFAULT_ORGANIZER_ID,
        is_active: true,
      },
    });
  }

  private async countEventZoneTickets(eventId: string, zoneId: string): Promise<number> {
    return this.prisma.tickets.count({
      where: { event_id: eventId, zone_id: zoneId, is_active: true },
    });
  }

  /** Blocks batch generation when it would exceed the zone's physical capacity. */
  private async assertEventZoneCapacityForGeneration(
    eventId: string,
    zoneId: string,
    additionalCount: number,
    zoneCapacity?: number | null,
  ): Promise<void> {
    let capacity = zoneCapacity ?? null;
    let label = 'zone';

    if (capacity == null || capacity <= 0) {
      const zone = await this.prisma.venue_zones.findUnique({
        where: { id: zoneId },
        select: { capacity: true, name: true, code: true },
      });
      capacity = zone?.capacity ?? null;
      label = zone?.name || zone?.code || label;
    } else {
      const zone = await this.prisma.venue_zones.findUnique({
        where: { id: zoneId },
        select: { name: true, code: true },
      });
      label = zone?.name || zone?.code || label;
    }

    if (capacity == null || capacity <= 0) return;

    const current = await this.countEventZoneTickets(eventId, zoneId);
    const remaining = capacity - current;
    if (additionalCount > remaining) {
      throw new BadRequestException(
        `Capacité de la zone « ${label} » dépassée : ${current}/${capacity} place(s) utilisée(s), ` +
          `${additionalCount} demandée(s), ${Math.max(0, remaining)} restante(s).`,
      );
    }
  }

  /**
   * Ensures the combined ticket pool across all tiers in a zone cannot exceed zone capacity.
   * Uses: existing tickets + sum(available - sold) per tier <= zone.capacity
   */
  private async assertTierPoolWithinZoneCapacity(
    eventId: string,
    zoneId: string,
    availableQuantity: number,
    excludeConfigId: string | undefined,
    soldQuantity: number,
  ): Promise<void> {
    const zone = await this.prisma.venue_zones.findUnique({
      where: { id: zoneId },
      select: { capacity: true, name: true, code: true },
    });
    if (!zone?.capacity || zone.capacity <= 0) {
      throw new BadRequestException(
        'La zone sélectionnée n\'a pas de capacité définie.',
      );
    }

    const label = zone.name || zone.code || 'zone';

    if (availableQuantity > zone.capacity) {
      throw new BadRequestException(
        `Le stock de la catégorie (${availableQuantity}) ne peut pas dépasser la capacité de la zone « ${label} » (${zone.capacity}).`,
      );
    }

    const siblingConfigs = await this.prisma.event_ticket_config.findMany({
      where: {
        event_id: eventId,
        zone_id: zoneId,
        is_active: true,
        ...(excludeConfigId ? { id: { not: excludeConfigId } } : {}),
      },
      select: { available_quantity: true, sold_quantity: true },
    });

    let sumAvailableOthers = 0;
    let poolFromOthers = 0;
    for (const c of siblingConfigs) {
      if (c.available_quantity != null) {
        sumAvailableOthers += c.available_quantity;
        poolFromOthers += Math.max(0, c.available_quantity - (c.sold_quantity ?? 0));
      }
    }

    if (sumAvailableOthers + availableQuantity > zone.capacity) {
      const maxForTier = Math.max(0, zone.capacity - sumAvailableOthers);
      throw new BadRequestException(
        `La somme des stocks de catégories pour « ${label} » (${sumAvailableOthers + availableQuantity}) ` +
          `dépasse la capacité (${zone.capacity}). Maximum pour cette catégorie : ${maxForTier}.`,
      );
    }

    const currentTickets = await this.countEventZoneTickets(eventId, zoneId);
    const thisPool = Math.max(0, availableQuantity - soldQuantity);
    const maxTotal = currentTickets + poolFromOthers + thisPool;

    if (maxTotal > zone.capacity) {
      const allowedPool = Math.max(0, zone.capacity - currentTickets - poolFromOthers + soldQuantity);
      throw new BadRequestException(
        `Stock total des catégories pour « ${label} » dépasserait la capacité (${zone.capacity}). ` +
          `Maximum autorisé pour cette catégorie : ${allowedPool}.`,
      );
    }
  }

  /** Fast in-memory suffix generation (8 chars) — collision risk negligible at batch scale. */
  private generateInMemorySuffixes(count: number): string[] {
    const set = new Set<string>();
    const result: string[] = [];
    while (result.length < count) {
      const suffix = this.generateRandomAlphanumeric(8);
      if (!set.has(suffix)) {
        set.add(suffix);
        result.push(suffix);
      }
    }
    return result;
  }

  private generateRandomAlphanumeric(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(bytes[i] % chars.length);
    }
    return result;
  }

  /** NTRX:CSS:TKT:ZONE:XXXXXX — aligned with physical subscription QR format */
  private buildEventTicketQrCode(zoneCode: string, suffix: string): string {
    const zone = (zoneCode || 'ALL')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 20);
    return `NTRX:CSS:TKT:${zone}:${suffix}`;
  }

  private async reserveUniqueQrSuffix(
    usedInBatch: Set<string>,
    client: Prisma.TransactionClient | PrismaService,
  ): Promise<string> {
    for (let attempts = 0; attempts < 100; attempts++) {
      const suffix = this.generateRandomAlphanumeric(6);
      if (usedInBatch.has(suffix)) continue;

      const suffixPattern = `:${suffix}`;
      const [physExists, accessExists] = await Promise.all([
        client.physical_qr_codes.findFirst({
          where: { qr_code: { endsWith: suffixPattern } },
          select: { id: true },
        }),
        client.access_rights.findFirst({
          where: { qr_code: { endsWith: suffixPattern } },
          select: { id: true },
        }),
      ]);

      if (!physExists && !accessExists) {
        usedInBatch.add(suffix);
        return suffix;
      }
    }
    throw new BadRequestException('Impossible de générer un code QR unique');
  }

  private generateTicketNumber(eventCode: string, index: number): string {
    const suffix = randomBytes(4).toString('hex').toUpperCase();
    const batch = Date.now().toString(36).toUpperCase().slice(-6);
    return `T${eventCode.replace(/[^A-Z0-9]/gi, '').slice(0, 12)}-${batch}${suffix}${index}`;
  }

  private generateAccessCode(): string {
    return `ACC-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
