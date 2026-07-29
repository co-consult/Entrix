import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CssForeverException } from '../exceptions/cssforever.exception';
import { PartnerSubscriptionTypeDto } from '../dto/cssforever-subscriptions.dto';
import { CssForeverMapperService } from './cssforever-mapper.service';

export interface LegacySubscriberContext {
  id: string;
  login: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  subscriptionType: PartnerSubscriptionTypeDto;
  standNumber: string | null;
  rowNumber: string | null;
  seatNumber: string | null;
  linkedQrCode: string | null;
  linkedSerial: string | null;
  subscriptionId: string | null;
  confirmedAt: Date | null;
}

@Injectable()
export class CssForeverLegacySubscriberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mapper: CssForeverMapperService,
  ) {}

  async authenticate(login: string, password: string): Promise<LegacySubscriberContext> {
    const subscriber = await this.prisma.partner_legacy_subscribers.findUnique({
      where: { login },
    });

    if (!subscriber) {
      throw new CssForeverException('INVALID_CREDENTIALS', 'Login ou mot de passe incorrect', 401);
    }

    const valid = await bcrypt.compare(password, subscriber.password_hash);
    if (!valid) {
      throw new CssForeverException('INVALID_CREDENTIALS', 'Login ou mot de passe incorrect', 401);
    }

    return this.toContext(subscriber);
  }

  async findByLogin(login: string): Promise<LegacySubscriberContext | null> {
    const subscriber = await this.prisma.partner_legacy_subscribers.findUnique({
      where: { login },
    });
    return subscriber ? this.toContext(subscriber) : null;
  }

  async resolveRenewalQr(subscriber: LegacySubscriberContext): Promise<{
    qrCode: string;
    planId: string;
    onboardingKey: string;
  } | null> {
    if (subscriber.linkedQrCode) {
      const qr = await this.prisma.physical_qr_codes.findUnique({
        where: { qr_code: subscriber.linkedQrCode },
        select: {
          qr_code: true,
          onboarding_key: true,
          subscription_plan_id: true,
          status: true,
        },
      });
      if (qr?.subscription_plan_id && qr.status === 'AVAILABLE') {
        return {
          qrCode: qr.qr_code,
          planId: qr.subscription_plan_id,
          onboardingKey: qr.onboarding_key,
        };
      }
    }

    const targetSeason = this.configService.get<string>('cssforever.targetSeason');
    const planCode = this.mapper.mapSubscriptionTypeToPlanCode(
      subscriber.subscriptionType,
      subscriber.standNumber || undefined,
    );
    if (!planCode) return null;

    const plan = await this.prisma.subscription_plans.findFirst({
      where: {
        code: planCode,
        metadata: { path: ['season'], equals: targetSeason },
      },
      select: { id: true },
    });
    if (!plan) return null;

    const seat = this.mapper.normalizeSeat(subscriber.rowNumber, subscriber.seatNumber);

    const candidates = await this.prisma.physical_qr_codes.findMany({
      where: {
        subscription_plan_id: plan.id,
        status: 'AVAILABLE',
      },
      select: {
        qr_code: true,
        onboarding_key: true,
        metadata: true,
      },
      take: 500,
    });

    if (subscriber.subscriptionType === PartnerSubscriptionTypeDto.CHAISE && seat.label) {
      const match = candidates.find((qr) => {
        const meta = qr.metadata as Record<string, unknown> | null;
        return meta?.seat === seat.label;
      });
      if (match) {
        return {
          qrCode: match.qr_code,
          planId: plan.id,
          onboardingKey: match.onboarding_key,
        };
      }

      const migrationMatch = candidates.find((qr) => {
        const meta = qr.metadata as Record<string, unknown> | null;
        return Boolean(meta?.previous_qr_id) || Boolean(meta?.renewal_pin_preserved);
      });
      if (migrationMatch) {
        return {
          qrCode: migrationMatch.qr_code,
          planId: plan.id,
          onboardingKey: migrationMatch.onboarding_key,
        };
      }
    }

    const anyAvailable = candidates[0];
    if (!anyAvailable) return null;

    return {
      qrCode: anyAvailable.qr_code,
      planId: plan.id,
      onboardingKey: anyAvailable.onboarding_key,
    };
  }

  private toContext(subscriber: any): LegacySubscriberContext {
    return {
      id: subscriber.id,
      login: subscriber.login,
      firstName: subscriber.first_name,
      lastName: subscriber.last_name,
      phone: subscriber.phone,
      email: subscriber.email,
      subscriptionType: subscriber.subscription_type as PartnerSubscriptionTypeDto,
      standNumber: subscriber.stand_number,
      rowNumber: subscriber.row_number,
      seatNumber: subscriber.seat_number,
      linkedQrCode: subscriber.linked_qr_code,
      linkedSerial: subscriber.linked_serial,
      subscriptionId: subscriber.subscription_id,
      confirmedAt: subscriber.confirmed_at,
    };
  }
}
