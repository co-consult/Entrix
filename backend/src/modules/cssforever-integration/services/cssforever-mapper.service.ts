import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseZoneAliasesFromEnv } from '../config/zone-aliases';
import { PartnerSubscriptionTypeDto } from '../dto/cssforever-subscriptions.dto';

@Injectable()
export class CssForeverMapperService {
  private readonly zoneAliases: Record<string, string>;

  constructor(private readonly configService: ConfigService) {
    this.zoneAliases = parseZoneAliasesFromEnv(process.env.CSSFOREVER_ZONE_ALIASES);
  }

  resolveZoneCode(standNumber?: string | null): string | null {
    if (!standNumber) return null;
    const key = standNumber.trim().toUpperCase();
    return this.zoneAliases[key] || key;
  }

  /**
   * Client may send rowNumber as letter (A) or digit; seatNumber as number.
   * Entrix metadata often uses composite e.g. A12.
   */
  normalizeSeat(
    rowNumber?: string | null,
    seatNumber?: string | null,
  ): { row: string | null; seat: string | null; label: string | null } {
    if (!rowNumber && !seatNumber) {
      return { row: null, seat: null, label: null };
    }

    const row = rowNumber?.trim().toUpperCase() || null;
    const seat = seatNumber?.trim() || null;

    if (row && seat) {
      if (/^[A-Z]$/.test(row) && /^\d+$/.test(seat)) {
        return { row, seat, label: `${row}${seat}` };
      }
      if (/^\d+$/.test(row) && /^\d+$/.test(seat)) {
        return { row, seat, label: `${row}${seat}` };
      }
      return { row, seat, label: `${row}${seat}` };
    }

    return { row, seat, label: row || seat };
  }

  mapSubscriptionTypeToPlanCode(
    type: PartnerSubscriptionTypeDto,
    standNumber?: string,
  ): string | null {
    if (type === PartnerSubscriptionTypeDto.GRADIN) {
      const zone = this.resolveZoneCode(standNumber);
      if (!zone) {
        return this.configService.get<string>('cssforever.planGradinDefault') || null;
      }
      if (zone === 'G3' || zone === 'P2' || zone === 'GRADIN_P2' || zone === 'GRADIN-P2-2627') {
        return 'GRADIN-P2-2627';
      }
      if (zone === 'P3' || zone === 'GRADIN_P3' || zone === 'GRADIN-P3-2627') {
        return 'GRADIN-P3-2627';
      }
      if (zone === 'P4' || zone === 'GRADIN_P4' || zone === 'GRADIN-P4-2627') {
        return 'GRADIN-P4-2627';
      }
      if (zone === 'G') return 'GRADINS_VB-2627';
      return this.configService.get<string>('cssforever.planGradinDefault') || null;
    }

    const stand = (standNumber || '').trim().toUpperCase();
    if (stand === 'CHAISE_1' || stand === 'CHAISE1' || stand === 'CHAISE1-2627') return 'CHAISE1-2627';
    if (stand === 'CHAISE_2' || stand === 'CHAISE2' || stand === 'CHAISE2-2627') return 'CHAISE2-2627';
    if (stand === 'CENTRALE' || stand === 'CENTRALE-2627') return 'CENTRALE-2627';
    if (stand === 'HONNEUR' || stand === 'HONNEUR-2627') return 'HONNEUR-2627';
    if (stand === 'LOGES' || stand === 'LOGE' || stand === 'LOGE-2627') return 'LOGE-2627';
    if (stand === 'VOITURES' || stand === 'VOITURE' || stand === 'VOITURE-2627') return 'VOITURE-2627';

    return this.configService.get<string>('cssforever.planChaiseDefault') || 'CENTRALE-2627';
  }

  toClientSeat(meta: {
    standNumber?: string | null;
    rowNumber?: string | null;
    seatNumber?: string | null;
  }) {
    return {
      standNumber: meta.standNumber || undefined,
      rowNumber: meta.rowNumber || undefined,
      seatNumber: meta.seatNumber || undefined,
    };
  }
}
