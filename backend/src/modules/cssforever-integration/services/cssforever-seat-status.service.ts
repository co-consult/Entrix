import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CssForeverEligibilityService } from './cssforever-eligibility.service';
import { CssForeverMapperService } from './cssforever-mapper.service';
import { PartnerSubscriptionTypeDto } from '../dto/cssforever-subscriptions.dto';

export type PartnerSeatStatus =
  | 'AVAILABLE'
  | 'BLOCKED_OLD_SUBSCRIBER'
  | 'CONFIRMED'
  | 'UNAVAILABLE';

export interface PartnerSeatStatusItem {
  subscriptionType: PartnerSubscriptionTypeDto;
  standNumber?: string;
  rowNumber?: string;
  seatNumber?: string;
  status: PartnerSeatStatus;
  blockedUntil?: string;
  paymentStatus?: 'UNPAID' | 'PAID';
}

@Injectable()
export class CssForeverSeatStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mapper: CssForeverMapperService,
    private readonly eligibility: CssForeverEligibilityService,
  ) {}

  async getSeatsStatus(standFilter?: string): Promise<PartnerSeatStatusItem[]> {
    const season = this.configService.get<string>('cssforever.targetSeason');
    const priorityUntil = this.eligibility.getPriorityUntil();
    const inPriority = this.eligibility.isInPriorityWindow();

    const plans = await this.prisma.subscription_plans.findMany({
      where: {
        is_active: true,
        metadata: { path: ['season'], equals: season },
      },
      select: { id: true, code: true },
    });

    const planIds = plans.map((p) => p.id);
    const qrCodes = await this.prisma.physical_qr_codes.findMany({
      where: { subscription_plan_id: { in: planIds } },
      select: {
        status: true,
        metadata: true,
        subscription_plan_id: true,
      },
    });

    const legacyHolders = await this.prisma.partner_legacy_subscribers.findMany({
      where: {
        subscription_type: 'CHAISE',
        confirmed_at: null,
      },
    });

    const results: PartnerSeatStatusItem[] = [];
    const seen = new Set<string>();

    const add = (item: PartnerSeatStatusItem) => {
      const key = [
        item.subscriptionType,
        item.standNumber || '',
        item.rowNumber || '',
        item.seatNumber || '',
      ].join('|');
      if (seen.has(key)) return;
      if (standFilter && item.standNumber !== standFilter.toUpperCase()) return;
      seen.add(key);
      results.push(item);
    };

    for (const legacy of legacyHolders) {
      if (legacy.subscription_type !== 'CHAISE') continue;
      const stand = legacy.stand_number || undefined;
      if (standFilter && stand !== standFilter.toUpperCase()) continue;

      add({
        subscriptionType: PartnerSubscriptionTypeDto.CHAISE,
        standNumber: stand,
        rowNumber: legacy.row_number || undefined,
        seatNumber: legacy.seat_number || undefined,
        status: inPriority ? 'BLOCKED_OLD_SUBSCRIBER' : 'AVAILABLE',
        blockedUntil: inPriority ? priorityUntil : undefined,
        paymentStatus: 'UNPAID',
      });
    }

    for (const qr of qrCodes) {
      const meta = qr.metadata as Record<string, unknown> | null;
      const seatLabel = meta?.seat as string | undefined;
      if (!seatLabel) continue;

      const parsed = this.parseSeatLabel(seatLabel);
      const plan = plans.find((p) => p.id === qr.subscription_plan_id);
      const type = plan?.code?.toUpperCase().includes('GRADIN')
        ? PartnerSubscriptionTypeDto.GRADIN
        : PartnerSubscriptionTypeDto.CHAISE;

      let status: PartnerSeatStatus = 'AVAILABLE';
      let paymentStatus: 'UNPAID' | 'PAID' | undefined;

      if (qr.status === 'ASSIGNED' || qr.status === 'RESERVED') {
        status = 'CONFIRMED';
        paymentStatus = 'PAID';
      } else if (qr.status === 'DISABLED') {
        status = 'UNAVAILABLE';
      } else if (qr.status === 'AVAILABLE' && meta?.previous_qr_id && inPriority) {
        status = 'BLOCKED_OLD_SUBSCRIBER';
        paymentStatus = 'UNPAID';
      } else if (qr.status === 'AVAILABLE') {
        status = 'AVAILABLE';
      }

      add({
        subscriptionType: type,
        standNumber: parsed.stand,
        rowNumber: parsed.row,
        seatNumber: parsed.seat,
        status,
        blockedUntil: status === 'BLOCKED_OLD_SUBSCRIBER' ? priorityUntil : undefined,
        paymentStatus,
      });
    }

    return results;
  }

  private parseSeatLabel(label: string): {
    stand?: string;
    row?: string;
    seat?: string;
  } {
    const m = label.match(/^([A-Z])(\d+)$/i);
    if (m) {
      return { row: m[1].toUpperCase(), seat: m[2] };
    }
    return { seat: label };
  }
}
