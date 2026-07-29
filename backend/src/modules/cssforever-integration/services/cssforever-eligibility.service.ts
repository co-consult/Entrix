import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CssForeverException } from '../exceptions/cssforever.exception';
import { PartnerSubscriptionTypeDto } from '../dto/cssforever-subscriptions.dto';
import { CssForeverMapperService } from './cssforever-mapper.service';
import { LegacySubscriberContext } from './cssforever-legacy-subscriber.service';

@Injectable()
export class CssForeverEligibilityService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mapper: CssForeverMapperService,
  ) {}

  now(): Date {
    const simulated = this.configService.get<string>('cssforever.simulateDate');
    if (simulated) {
      const d = new Date(simulated);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date();
  }

  assertNewSubscriptionsOpen(): void {
    const from = this.configService.get<string>('cssforever.newSubscriptionsFrom') || '2026-07-06';
    const openAt = this.parseParisDate(from, false);
    if (this.now() < openAt) {
      throw new CssForeverException(
        'NEW_SUBSCRIPTIONS_NOT_OPEN_YET',
        'Les nouvelles réservations seront ouvertes à partir du 6 juillet 2026',
      );
    }
  }

  getPriorityUntil(): string {
    return this.configService.get<string>('cssforever.priorityUntil') || '2026-07-05';
  }

  isInPriorityWindow(): boolean {
    const until = this.configService.get<string>('cssforever.priorityUntil') || '2026-07-05';
    const end = this.parseParisDate(until, true);
    return this.now() <= end;
  }

  async resolvePlan(
    type: PartnerSubscriptionTypeDto,
    standNumber?: string,
  ) {
    const season = this.configService.get<string>('cssforever.targetSeason');
    const code = this.mapper.mapSubscriptionTypeToPlanCode(type, standNumber);
    if (!code) {
      throw new CssForeverException('PLAN_NOT_FOUND', 'Plan d\'abonnement introuvable');
    }

    const plan = await this.prisma.subscription_plans.findFirst({
      where: {
        code,
        is_active: true,
        metadata: { path: ['season'], equals: season },
      },
    });

    if (!plan) {
      throw new CssForeverException('PLAN_NOT_FOUND', `Plan ${code} introuvable pour la saison ${season}`);
    }

    return plan;
  }

  async evaluateExistingSubscriber(subscriber: LegacySubscriberContext) {
    if (subscriber.confirmedAt || subscriber.subscriptionId) {
      return {
        eligibilityStatus: 'ALREADY_PAID' as const,
        paymentStatus: 'PAID' as const,
      };
    }

    const plan = await this.resolvePlan(
      subscriber.subscriptionType,
      subscriber.standNumber || undefined,
    );

    const activeQrCount = await this.prisma.physical_qr_codes.count({
      where: {
        subscription_plan_id: plan.id,
        status: { not: 'DISABLED' },
      },
    });

    if (plan.max_subscribers && activeQrCount >= plan.max_subscribers) {
      return {
        eligibilityStatus: 'NOT_ELIGIBLE' as const,
        paymentStatus: 'UNPAID' as const,
      };
    }

    return {
      eligibilityStatus: 'ELIGIBLE' as const,
      paymentStatus: 'UNPAID' as const,
      plan,
    };
  }

  async checkGradinAvailability(planId: string): Promise<'AVAILABLE' | 'UNAVAILABLE'> {
    const available = await this.prisma.physical_qr_codes.count({
      where: { subscription_plan_id: planId, status: 'AVAILABLE' },
    });
    return available > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
  }

  async checkChaiseAvailability(
    planId: string,
    standNumber?: string,
    rowNumber?: string,
    seatNumber?: string,
  ): Promise<'AVAILABLE' | 'UNAVAILABLE'> {
    const seat = this.mapper.normalizeSeat(rowNumber, seatNumber);
    if (!seat.label) {
      return this.checkGradinAvailability(planId);
    }

    const conflict = await this.prisma.physical_qr_codes.findFirst({
      where: {
        subscription_plan_id: planId,
        status: { in: ['ASSIGNED', 'RESERVED'] },
        OR: [{ metadata: { path: ['seat'], equals: seat.label } }],
      },
    });
    if (conflict) return 'UNAVAILABLE';

    const zoneCode = this.mapper.resolveZoneCode(standNumber);
    if (zoneCode) {
      const zone = await this.prisma.venue_zones.findFirst({ where: { code: zoneCode } });
      if (zone) {
        const dbSeat = await this.prisma.seats.findFirst({
          where: {
            zone_id: zone.id,
            OR: [
              { seat_number: seat.label, row_number: seat.row || undefined },
              { seat_number: seat.seat || undefined, row_number: seat.row || undefined },
            ],
            status: { not: 'AVAILABLE' },
          },
        });
        if (dbSeat) return 'UNAVAILABLE';
      }
    }

    const availableQr = await this.prisma.physical_qr_codes.count({
      where: { subscription_plan_id: planId, status: 'AVAILABLE' },
    });
    return availableQr > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
  }

  private parseParisDate(dateStr: string, endOfDay: boolean): Date {
    const suffix = endOfDay ? 'T23:59:59.999+01:00' : 'T00:00:00.000+01:00';
    return new Date(`${dateStr}${suffix}`);
  }
}
