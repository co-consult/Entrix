import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CssForeverException } from '../exceptions/cssforever.exception';

export type PartnerLifecycleAction = 'SUSPEND' | 'ACTIVATE' | 'CANCEL';

@Injectable()
export class CssForeverLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async suspend(params: {
    subscriptionId?: string;
    paymentReference?: string;
    reason?: string;
  }) {
    return this.applyLifecycle('SUSPEND', params);
  }

  async activate(params: {
    subscriptionId?: string;
    paymentReference?: string;
    reason?: string;
  }) {
    return this.applyLifecycle('ACTIVATE', params);
  }

  /** Annulation vente CSSForever : CANCELLED + libère QR + purge cache partenaire. */
  async cancel(params: {
    subscriptionId?: string;
    paymentReference?: string;
    reason?: string;
  }) {
    return this.applyLifecycle('CANCEL', params);
  }

  private async applyLifecycle(
    action: PartnerLifecycleAction,
    params: { subscriptionId?: string; paymentReference?: string; reason?: string },
  ) {
    const subscription = await this.resolveSubscription(params);
    if (!subscription) {
      throw new CssForeverException('NOT_FOUND', 'Abonnement Entrix introuvable', 404);
    }

    if (action === 'CANCEL') {
      return this.cancelSubscription(subscription, params.reason, params.paymentReference);
    }

    const targetStatus = action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
    const accessStatus = action === 'SUSPEND' ? 'SUSPENDED' : 'VALID';
    const nowIso = new Date().toISOString();
    const metadata = {
      ...((subscription.metadata as Record<string, unknown>) || {}),
      ...(action === 'SUSPEND'
        ? {
            suspendedAt: nowIso,
            suspendedBy: 'cssforever_partner',
            suspensionReason: params.reason || 'CSSFOREVER_BLOCK',
          }
        : {
            reactivatedAt: nowIso,
            reactivatedBy: 'cssforever_partner',
            reactivationReason: params.reason || 'CSSFOREVER_UNBLOCK',
          }),
    };

    const updated = await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: targetStatus,
        metadata,
        updated_at: new Date(),
      },
    });

    await this.prisma.access_rights.updateMany({
      where: { subscription_id: subscription.id },
      data: {
        status: accessStatus as any,
        updated_at: new Date(),
      },
    });

    return {
      status: 'OK',
      action,
      subscriptionId: updated.id,
      subscriptionStatus: updated.status,
      paymentReference:
        ((updated.metadata as Record<string, any>)?.paymentDetails?.reference as string) ||
        params.paymentReference ||
        null,
    };
  }

  private async cancelSubscription(
    subscription: { id: string; metadata: unknown },
    reason?: string,
    paymentReference?: string,
  ) {
    const meta = (subscription.metadata as Record<string, any>) || {};
    const qrCode = typeof meta.qrCode === 'string' ? meta.qrCode : null;
    const pref =
      paymentReference?.trim() ||
      (typeof meta?.paymentDetails?.reference === 'string'
        ? meta.paymentDetails.reference
        : null);
    const nowIso = new Date().toISOString();

    await this.prisma.$transaction(async (tx) => {
      await tx.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          metadata: {
            ...meta,
            cancelledAt: nowIso,
            cancelledBy: 'cssforever_partner',
            cancellationReason: reason || 'CSSFOREVER_CANCEL_SALE',
          },
          updated_at: new Date(),
        },
      });

      await tx.$executeRawUnsafe('ALTER TABLE access_rights DISABLE TRIGGER USER');
      try {
        await tx.access_rights.deleteMany({ where: { subscription_id: subscription.id } });
        if (qrCode) {
          await tx.access_rights.deleteMany({ where: { qr_code: qrCode } });
        }
      } finally {
        await tx.$executeRawUnsafe('ALTER TABLE access_rights ENABLE TRIGGER USER');
      }

      if (qrCode) {
        await tx.physical_qr_codes.updateMany({
          where: { qr_code: qrCode, status: 'ASSIGNED' },
          data: {
            status: 'AVAILABLE',
            assigned_at: null,
            assigned_by: null,
            updated_at: new Date(),
          },
        });
      }

      if (pref) {
        await tx.partner_payment_confirmations.deleteMany({
          where: { payment_reference: pref },
        });
      }
      await tx.$executeRaw`
        DELETE FROM partner_payment_confirmations
        WHERE response_payload->>'subscriptionId' = ${subscription.id}
      `;
    });

    return {
      status: 'OK',
      action: 'CANCEL' as const,
      subscriptionId: subscription.id,
      subscriptionStatus: 'CANCELLED',
      paymentReference: pref,
      qrFreed: qrCode,
    };
  }

  private async resolveSubscription(params: {
    subscriptionId?: string;
    paymentReference?: string;
  }) {
    const subscriptionId = params.subscriptionId?.trim();
    if (subscriptionId) {
      return this.prisma.subscriptions.findUnique({ where: { id: subscriptionId } });
    }

    const paymentReference = params.paymentReference?.trim();
    if (!paymentReference) {
      throw new CssForeverException(
        'INVALID_REQUEST',
        'subscriptionId ou paymentReference requis',
        400,
      );
    }

    const confirmation = await this.prisma.partner_payment_confirmations.findUnique({
      where: { payment_reference: paymentReference },
    });
    const cachedId = (confirmation?.response_payload as Record<string, unknown> | null)
      ?.subscriptionId;
    if (typeof cachedId === 'string' && cachedId.trim()) {
      const byCache = await this.prisma.subscriptions.findUnique({ where: { id: cachedId } });
      if (byCache) {
        return byCache;
      }
    }

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM subscriptions
      WHERE metadata->'paymentDetails'->>'reference' = ${paymentReference}
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    if (!rows.length) {
      return null;
    }
    return this.prisma.subscriptions.findUnique({ where: { id: rows[0].id } });
  }
}
