import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SubscriptionSalesService } from '../../subscription-sales/services/subscription-sales.service';
import {
  PaymentMethod,
  SaleChannel,
  SaleMode,
} from '../../subscription-sales/types/sale-types';
import { CssForeverException } from '../exceptions/cssforever.exception';
import {
  ConfirmExistingDto,
  ConfirmNewDto,
  PartnerSubscriptionTypeDto,
} from '../dto/cssforever-subscriptions.dto';
import { CssForeverEligibilityService } from './cssforever-eligibility.service';
import { CssForeverLegacySubscriberService } from './cssforever-legacy-subscriber.service';
import { CssForeverMapperService } from './cssforever-mapper.service';
import { CssForeverReceiptService } from './cssforever-receipt.service';

@Injectable()
export class CssForeverConfirmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly subscriptionSales: SubscriptionSalesService,
    private readonly legacyService: CssForeverLegacySubscriberService,
    private readonly eligibility: CssForeverEligibilityService,
    private readonly mapper: CssForeverMapperService,
    private readonly receiptService: CssForeverReceiptService,
  ) {}

  async confirmExisting(dto: ConfirmExistingDto) {
    const existing = await this.prisma.partner_payment_confirmations.findUnique({
      where: { payment_reference: dto.paymentReference },
    });
    if (existing?.response_payload) {
      return existing.response_payload as Record<string, unknown>;
    }

    const subscriber = await this.legacyService.findByLogin(dto.login);
    if (!subscriber) {
      throw new CssForeverException('INVALID_CREDENTIALS', 'Abonné introuvable');
    }
    const evaluation = await this.eligibility.evaluateExistingSubscriber(subscriber);

    if (evaluation.eligibilityStatus === 'ALREADY_PAID') {
      throw new CssForeverException('ALREADY_CONFIRMED', 'Abonnement déjà confirmé');
    }
    if (evaluation.eligibilityStatus === 'NOT_ELIGIBLE') {
      throw new CssForeverException('NOT_ELIGIBLE', 'Abonnement non éligible');
    }

    const renewal = await this.legacyService.resolveRenewalQr(subscriber);
    if (!renewal) {
      throw new CssForeverException('NO_STOCK', 'Aucune carte QR disponible pour ce renouvellement');
    }

    const plan = evaluation.plan!;
    const amount = Number(plan.price);

    if (dto.amountPaid < amount) {
      throw new CssForeverException(
        'INVALID_AMOUNT',
        `Montant insuffisant: attendu ${amount} ${plan.currency}`,
      );
    }

    const saleResult = await this.subscriptionSales.createSubscriptionSale({
      planId: renewal.planId,
      quantity: 1,
      qrCodes: [renewal.qrCode],
      saleMode: SaleMode.IDENTIFIED,
      saleChannel: SaleChannel.PARTNER,
      paymentMethod: PaymentMethod.FLOUCI,
      amount,
      currency: plan.currency || dto.currency,
      customerInfo: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
      },
      paymentDetails: {
        provider: dto.paymentProvider,
        reference: dto.paymentReference,
        date: dto.paymentDate,
        channel: 'CSSFOREVER',
      },
      metadata: {
        partner: 'CSSFOREVER',
        flow: 'confirm-existing',
        login: dto.login,
        deliveryAddress: dto.deliveryAddress || this.configService.get('cssforever.deliveryAddress'),
      },
    });

    const subscriptionId = saleResult.subscriptions[0]?.id;
    const orderId = saleResult.order.id;

    await this.prisma.partner_legacy_subscribers.update({
      where: { id: subscriber.id },
      data: {
        confirmed_at: new Date(),
        subscription_id: subscriptionId,
        linked_user_id: saleResult.user?.id,
        email: dto.email,
        first_name: dto.firstName,
        last_name: dto.lastName,
        phone: dto.phone,
        updated_at: new Date(),
      },
    });

    const orderRow = await this.prisma.orders.findUnique({
      where: { id: orderId },
      select: { order_number: true },
    });

    const seat = this.buildSeatResponse(subscriber);
    const response = {
      status: 'OK',
      subscriptionId,
      subscriptionType: dto.subscriptionType,
      price: amount,
      paymentStatus: 'PAID',
      reservationStatus: 'CONFIRMED',
      seat: dto.subscriptionType === PartnerSubscriptionTypeDto.CHAISE ? seat : undefined,
      receiptNumber: this.receiptService.buildReceiptNumber(orderRow?.order_number),
      receiptDownloadUrl: this.receiptService.buildReceiptDownloadUrl(orderId),
      delivery: {
        address: dto.deliveryAddress || this.configService.get('cssforever.deliveryAddress'),
        deliveryDate: this.configService.get('cssforever.deliveryDate'),
      },
    };

    await this.prisma.partner_payment_confirmations.create({
      data: {
        payment_reference: dto.paymentReference,
        subscription_id: subscriptionId,
        order_id: orderId,
        partner_login: dto.login,
        flow_type: 'EXISTING',
        amount_paid: dto.amountPaid,
        currency: dto.currency,
        response_payload: response as unknown as Prisma.InputJsonValue,
      },
    });

    return response;
  }

  async confirmNew(dto: ConfirmNewDto) {
    const existing = await this.prisma.partner_payment_confirmations.findUnique({
      where: { payment_reference: dto.paymentReference },
    });
    if (existing?.response_payload) {
      return existing.response_payload as Record<string, unknown>;
    }

    this.eligibility.assertNewSubscriptionsOpen();

    const plan = await this.eligibility.resolvePlan(
      dto.subscriptionType,
      dto.standNumber,
    );

    const availability =
      dto.subscriptionType === PartnerSubscriptionTypeDto.CHAISE
        ? await this.eligibility.checkChaiseAvailability(
            plan.id,
            dto.standNumber,
            dto.rowNumber,
            dto.seatNumber,
          )
        : await this.eligibility.checkGradinAvailability(plan.id);

    if (availability !== 'AVAILABLE') {
      throw new CssForeverException('NOT_AVAILABLE', 'Place ou stock non disponible');
    }

    const availableQr = await this.prisma.physical_qr_codes.findFirst({
      where: { subscription_plan_id: plan.id, status: 'AVAILABLE' },
      orderBy: { serial_number: 'asc' },
    });

    if (!availableQr) {
      throw new CssForeverException('NO_STOCK', 'Aucune carte QR disponible');
    }

    const amount = Number(plan.price);
    if (dto.amountPaid < amount) {
      throw new CssForeverException(
        'INVALID_AMOUNT',
        `Montant insuffisant: attendu ${amount} ${plan.currency}`,
      );
    }

    const saleResult = await this.subscriptionSales.createSubscriptionSale({
      planId: plan.id,
      quantity: 1,
      qrCodes: [availableQr.qr_code],
      saleMode: SaleMode.IDENTIFIED,
      saleChannel: SaleChannel.PARTNER,
      paymentMethod: PaymentMethod.FLOUCI,
      amount,
      currency: plan.currency || dto.currency,
      customerInfo: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
      },
      paymentDetails: {
        provider: dto.paymentProvider,
        reference: dto.paymentReference,
        date: dto.paymentDate,
        channel: 'CSSFOREVER',
      },
      metadata: {
        partner: 'CSSFOREVER',
        flow: 'confirm-new',
        standNumber: dto.standNumber,
        rowNumber: dto.rowNumber,
        seatNumber: dto.seatNumber,
        deliveryAddress: dto.deliveryAddress,
      },
    });

    const subscriptionId = saleResult.subscriptions[0]?.id;
    const orderId = saleResult.order.id;

    const orderRow = await this.prisma.orders.findUnique({
      where: { id: orderId },
      select: { order_number: true },
    });

    const seat = this.mapper.toClientSeat({
      standNumber: dto.standNumber,
      rowNumber: dto.rowNumber,
      seatNumber: dto.seatNumber,
    });

    const response = {
      status: 'OK',
      subscriptionId,
      generatedLogin: dto.email,
      subscriptionType: dto.subscriptionType,
      price: amount,
      paymentStatus: 'PAID',
      reservationStatus: 'CONFIRMED',
      seat:
        dto.subscriptionType === PartnerSubscriptionTypeDto.CHAISE ? seat : undefined,
      receiptNumber: this.receiptService.buildReceiptNumber(orderRow?.order_number),
      receiptDownloadUrl: this.receiptService.buildReceiptDownloadUrl(orderId),
    };

    await this.prisma.partner_payment_confirmations.create({
      data: {
        payment_reference: dto.paymentReference,
        subscription_id: subscriptionId,
        order_id: orderId,
        flow_type: 'NEW',
        amount_paid: dto.amountPaid,
        currency: dto.currency,
        response_payload: response as unknown as Prisma.InputJsonValue,
      },
    });

    return response;
  }

  private buildSeatResponse(subscriber: {
    standNumber: string | null;
    rowNumber: string | null;
    seatNumber: string | null;
  }) {
    return this.mapper.toClientSeat({
      standNumber: subscriber.standNumber,
      rowNumber: subscriber.rowNumber,
      seatNumber: subscriber.seatNumber,
    });
  }
}
