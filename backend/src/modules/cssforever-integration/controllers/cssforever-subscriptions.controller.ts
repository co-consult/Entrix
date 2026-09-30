import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PartnerApiGuard } from '../guards/partner-api.guard';
import { CssForeverExceptionFilter } from '../filters/cssforever-exception.filter';
import {
  ActivateSubscriptionDto,
  CheckExistingDto,
  CheckNewDto,
  ConfirmExistingDto,
  ConfirmNewDto,
  PartnerSubscriptionTypeDto,
  SuspendSubscriptionDto,
} from '../dto/cssforever-subscriptions.dto';
import { CssForeverLegacySubscriberService } from '../services/cssforever-legacy-subscriber.service';
import { CssForeverEligibilityService } from '../services/cssforever-eligibility.service';
import { CssForeverSeatStatusService } from '../services/cssforever-seat-status.service';
import { CssForeverConfirmService } from '../services/cssforever-confirm.service';
import { CssForeverLifecycleService } from '../services/cssforever-lifecycle.service';
import { CssForeverReceiptService } from '../services/cssforever-receipt.service';
import { CssForeverAuditService } from '../services/cssforever-audit.service';
import { CssForeverMapperService } from '../services/cssforever-mapper.service';
import { CssForeverException } from '../exceptions/cssforever.exception';

@ApiTags('CSSForever Partner')
@Controller('partner/subscriptions')
@UseGuards(PartnerApiGuard)
@UseFilters(CssForeverExceptionFilter)
export class CssForeverSubscriptionsController {
  constructor(
    private readonly legacyService: CssForeverLegacySubscriberService,
    private readonly eligibility: CssForeverEligibilityService,
    private readonly seatStatus: CssForeverSeatStatusService,
    private readonly confirmService: CssForeverConfirmService,
    private readonly lifecycleService: CssForeverLifecycleService,
    private readonly receiptService: CssForeverReceiptService,
    private readonly audit: CssForeverAuditService,
    private readonly mapper: CssForeverMapperService,
  ) {}

  @Post('check-existing')
  @ApiOperation({ summary: 'Vérifier ancien abonné CSSForever' })
  async checkExisting(@Body() dto: CheckExistingDto, @Req() req: any) {
    const requestId = req.headers['x-request-id'];
    try {
      const subscriber = await this.legacyService.authenticate(dto.login, dto.password);
      const evaluation = await this.eligibility.evaluateExistingSubscriber(subscriber);
      const plan =
        evaluation.eligibilityStatus === 'ELIGIBLE'
          ? await this.eligibility.resolvePlan(
              subscriber.subscriptionType,
              subscriber.standNumber || undefined,
            )
          : null;

      const response = {
        status: 'OK',
        subscriber: {
          firstName: subscriber.firstName,
          lastName: subscriber.lastName,
          phone: subscriber.phone,
          email: subscriber.email,
        },
        previousSubscription: {
          type: subscriber.subscriptionType,
          standNumber: subscriber.standNumber || undefined,
          rowNumber: subscriber.rowNumber || undefined,
          seatNumber: subscriber.seatNumber || undefined,
        },
        newSubscription: {
          type: subscriber.subscriptionType,
          price: plan ? Number(plan.price) : 0,
          currency: plan?.currency || 'TND',
          eligibilityStatus: evaluation.eligibilityStatus,
          priorityUntil: this.eligibility.getPriorityUntil(),
          paymentStatus: evaluation.paymentStatus,
        },
      };

      await this.audit.log({
        requestId,
        endpoint: '/partner/subscriptions/check-existing',
        method: 'POST',
        ip: req.ip,
        apiKeyPrefix: String(req.headers['x-api-key'] || '').slice(0, 12),
        payloadHash: this.audit.hashPayload({ login: dto.login }),
        responseStatus: 'OK',
      });

      return response;
    } catch (e) {
      await this.audit.log({
        requestId,
        endpoint: '/partner/subscriptions/check-existing',
        method: 'POST',
        ip: req.ip,
        payloadHash: this.audit.hashPayload({ login: dto.login }),
        responseStatus: 'KO',
        errorCode: e instanceof CssForeverException ? e.errorCode : 'ERROR',
      });
      throw e;
    }
  }

  @Post('confirm-existing')
  @ApiOperation({ summary: 'Confirmer abonnement ancien abonné après paiement Flouci' })
  async confirmExisting(@Body() dto: ConfirmExistingDto, @Req() req: any) {
    try {
      const response = await this.confirmService.confirmExisting(dto);
      await this.audit.log({
        endpoint: '/partner/subscriptions/confirm-existing',
        method: 'POST',
        ip: req.ip,
        payloadHash: this.audit.hashPayload({
          login: dto.login,
          paymentReference: dto.paymentReference,
        }),
        responseStatus: 'OK',
      });
      return response;
    } catch (e) {
      await this.audit.log({
        endpoint: '/partner/subscriptions/confirm-existing',
        method: 'POST',
        ip: req.ip,
        responseStatus: 'KO',
        errorCode: e instanceof CssForeverException ? e.errorCode : 'ERROR',
      });
      throw e;
    }
  }

  @Post('check-new')
  @ApiOperation({ summary: 'Vérifier disponibilité nouvel abonné' })
  async checkNew(@Body() dto: CheckNewDto, @Req() req: any) {
    try {
      this.eligibility.assertNewSubscriptionsOpen();
      const plan = await this.eligibility.resolvePlan(
        dto.subscriptionType,
        dto.standNumber,
        dto.planCode,
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

      const response = {
        status: 'OK',
        subscriptionType: dto.subscriptionType,
        price: Number(plan.price),
        currency: plan.currency || 'TND',
        availabilityStatus: 'AVAILABLE',
      };

      await this.audit.log({
        endpoint: '/partner/subscriptions/check-new',
        method: 'POST',
        ip: req.ip,
        payloadHash: this.audit.hashPayload(dto),
        responseStatus: 'OK',
      });
      return response;
    } catch (e) {
      await this.audit.log({
        endpoint: '/partner/subscriptions/check-new',
        method: 'POST',
        ip: req.ip,
        responseStatus: 'KO',
        errorCode: e instanceof CssForeverException ? e.errorCode : 'ERROR',
      });
      throw e;
    }
  }

  @Post('confirm-new')
  @ApiOperation({ summary: 'Confirmer nouvel abonnement après paiement' })
  async confirmNew(@Body() dto: ConfirmNewDto, @Req() req: any) {
    try {
      const response = await this.confirmService.confirmNew(dto);
      await this.audit.log({
        endpoint: '/partner/subscriptions/confirm-new',
        method: 'POST',
        ip: req.ip,
        payloadHash: this.audit.hashPayload({
          email: dto.email,
          paymentReference: dto.paymentReference,
        }),
        responseStatus: 'OK',
      });
      return response;
    } catch (e) {
      await this.audit.log({
        endpoint: '/partner/subscriptions/confirm-new',
        method: 'POST',
        ip: req.ip,
        responseStatus: 'KO',
        errorCode: e instanceof CssForeverException ? e.errorCode : 'ERROR',
      });
      throw e;
    }
  }

  @Post('suspend')
  @ApiOperation({ summary: 'Suspendre un abonnement (blocage CSSForever)' })
  async suspend(@Body() dto: SuspendSubscriptionDto, @Req() req: any) {
    try {
      const response = await this.lifecycleService.suspend(dto);
      await this.audit.log({
        endpoint: '/partner/subscriptions/suspend',
        method: 'POST',
        ip: req.ip,
        payloadHash: this.audit.hashPayload({
          subscriptionId: dto.subscriptionId,
          paymentReference: dto.paymentReference,
        }),
        responseStatus: 'OK',
      });
      return response;
    } catch (e) {
      await this.audit.log({
        endpoint: '/partner/subscriptions/suspend',
        method: 'POST',
        ip: req.ip,
        responseStatus: 'KO',
        errorCode: e instanceof CssForeverException ? e.errorCode : 'ERROR',
      });
      throw e;
    }
  }

  @Post('activate')
  @ApiOperation({ summary: 'Réactiver un abonnement suspendu' })
  async activate(@Body() dto: ActivateSubscriptionDto, @Req() req: any) {
    try {
      const response = await this.lifecycleService.activate(dto);
      await this.audit.log({
        endpoint: '/partner/subscriptions/activate',
        method: 'POST',
        ip: req.ip,
        payloadHash: this.audit.hashPayload({
          subscriptionId: dto.subscriptionId,
          paymentReference: dto.paymentReference,
        }),
        responseStatus: 'OK',
      });
      return response;
    } catch (e) {
      await this.audit.log({
        endpoint: '/partner/subscriptions/activate',
        method: 'POST',
        ip: req.ip,
        responseStatus: 'KO',
        errorCode: e instanceof CssForeverException ? e.errorCode : 'ERROR',
      });
      throw e;
    }
  }

  @Get('seats-status')
  @ApiOperation({ summary: 'Liste des places bloquées / réservées / payées' })
  async getSeatsStatus(@Query('standNumber') standNumber?: string) {
    const seats = await this.seatStatus.getSeatsStatus(standNumber);
    return { status: 'OK', seats };
  }

  @Get('receipts/:token')
  @ApiOperation({ summary: 'Télécharger le reçu partenaire (token signé)' })
  async downloadReceipt(@Param('token') token: string, @Res() res: Response) {
    const verified = this.receiptService.verifyReceiptToken(token);
    if (!verified) {
      throw new CssForeverException('INVALID_RECEIPT_TOKEN', 'Lien de reçu invalide ou expiré', 401);
    }
    const buffer = await this.receiptService.generateReceiptPdf(verified.orderId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${verified.orderId}.pdf"`,
    });
    res.send(buffer);
  }
}
