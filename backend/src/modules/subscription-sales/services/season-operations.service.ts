import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { seasonLabelFromId } from '../constants/seasons';
import type {
  SeasonAction,
  SeasonPlanBreakdown,
  SeasonPreflightResult,
  SeasonStatus,
  SeasonSummary,
} from '../interfaces/season-operations.interface';
import { SeasonQRMigrationService, migrationArchiveReasons } from './season-qr-migration.service';
import { SubscriptionPlansService } from './subscription-plans.service';

@Injectable()
export class SeasonOperationsService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly qrMigration: SeasonQRMigrationService,
    private readonly plansService: SubscriptionPlansService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('SeasonOperationsService');
  }

  async listSeasonsWithStats(organizerId: string) {
    const base = await this.plansService.listSeasonsForOrganizer(organizerId);
    const enriched = await Promise.all(
      base.map(async (s) => {
        const summary = await this.getSeasonSummary(organizerId, s.id);
        return {
          ...s,
          status: summary.status,
          planCount: summary.planCount,
          qrCount: summary.qrCount,
          assignedQrCount: summary.assignedQrCount,
        };
      }),
    );
    return enriched;
  }

  async getSeasonSummary(organizerId: string, seasonId: string): Promise<SeasonSummary> {
    const plans = await this.getSeasonPlans(organizerId, seasonId);
    const planIds = plans.map((p) => p.id);

    if (planIds.length === 0) {
      return {
        seasonId,
        label: seasonLabelFromId(seasonId),
        status: 'none',
        planCount: 0,
        qrCount: 0,
        qrAvailableCount: 0,
        assignedQrCount: 0,
        soldQrCount: 0,
        disabledSourceQrCount: 0,
        subscriptionCount: 0,
        totalRevenue: 0,
        salesClosedPlanCount: 0,
        plansOnSaleCount: 0,
        plans: [],
      };
    }

    const qrStats = await this.prisma.physical_qr_codes.groupBy({
      by: ['subscription_plan_id', 'status'],
      where: { subscription_plan_id: { in: planIds } },
      _count: { id: true },
    });

    const archivedSoldStats = await this.prisma.physical_qr_codes.groupBy({
      by: ['subscription_plan_id'],
      where: {
        subscription_plan_id: { in: planIds },
        status: 'DISABLED',
        metadata: { path: ['original_status'], equals: 'ASSIGNED' },
      },
      _count: { id: true },
    });
    const archivedSoldByPlan = new Map(
      archivedSoldStats.map((s) => [s.subscription_plan_id, s._count.id]),
    );

    const subscriptionCounts = await this.prisma.subscriptions.groupBy({
      by: ['plan_id'],
      where: { plan_id: { in: planIds } },
      _count: { id: true },
      _sum: { price_paid: true },
    });
    const subsByPlan = new Map(subscriptionCounts.map((s) => [s.plan_id, s._count.id]));
    const revenueByPlan = new Map(
      subscriptionCounts.map((s) => [s.plan_id, Number(s._sum.price_paid || 0)]),
    );

    const sourceSeasonId = await this.inferSourceSeasonFromPlans(organizerId, seasonId);
    let archivedSourceQrCount = 0;
    if (sourceSeasonId) {
      const sourcePlanIds = await this.getSeasonPlanIds(organizerId, sourceSeasonId);
      const archivedSource = await this.prisma.physical_qr_codes.findMany({
        where: {
          subscription_plan_id: { in: sourcePlanIds },
          status: 'DISABLED',
        },
        select: { metadata: true },
      });
      const reasons = new Set(migrationArchiveReasons(seasonId));
      archivedSourceQrCount = archivedSource.filter((qr) => {
        const meta = qr.metadata as Record<string, unknown> | null;
        return reasons.has(meta?.archived_reason as string);
      }).length;
    }

    const planBreakdowns: SeasonPlanBreakdown[] = plans.map((plan) => {
      const meta = plan.metadata as Record<string, unknown> | null;
      const planQr = qrStats.filter((q) => q.subscription_plan_id === plan.id);
      const total = planQr.reduce((s, q) => s + q._count.id, 0);
      const available = planQr.find((q) => q.status === 'AVAILABLE')?._count.id || 0;
      const assignedActive = planQr.find((q) => q.status === 'ASSIGNED')?._count.id || 0;
      const archivedSold = archivedSoldByPlan.get(plan.id) || 0;
      const assigned = assignedActive + archivedSold;
      const disabled = planQr.find((q) => q.status === 'DISABLED')?._count.id || 0;

      return {
        planId: plan.id,
        planCode: plan.code,
        planName: plan.name,
        qrTotal: total,
        qrAvailable: available,
        qrAssigned: assigned,
        qrDisabled: disabled,
        archivedSourceCount: 0,
        subscriptionCount: subsByPlan.get(plan.id) || 0,
        revenue: revenueByPlan.get(plan.id) || 0,
      };
    });

    const qrCount = planBreakdowns.reduce((s, p) => s + p.qrTotal, 0);
    const qrAvailableCount = planBreakdowns.reduce((s, p) => s + p.qrAvailable, 0);
    const assignedQrCount = planBreakdowns.reduce((s, p) => s + p.qrAssigned, 0);
    const subscriptionCount = planBreakdowns.reduce((s, p) => s + p.subscriptionCount, 0);
    const totalRevenue = planBreakdowns.reduce((s, p) => s + p.revenue, 0);
    const soldQrCount = Math.max(assignedQrCount, subscriptionCount);

    const now = new Date();
    const salesClosedPlanCount = plans.filter((p) => {
      const meta = p.metadata as Record<string, unknown> | null;
      return meta?.sales_closed === true;
    }).length;

    const plansOnSaleCount = plans.filter((p) => {
      const meta = p.metadata as Record<string, unknown> | null;
      if (meta?.sales_closed === true) return false;
      if (!p.is_active) return false;
      const started = !p.sale_start_date || p.sale_start_date <= now;
      const notEnded = !p.sale_end_date || p.sale_end_date >= now;
      return started && notEnded;
    }).length;

    const status = this.computeStatus({
      planCount: plans.length,
      qrCount,
      assignedQrCount,
      subscriptionCount,
      salesClosedPlanCount,
      plansOnSaleCount,
      planTotal: plans.length,
    });

    const serialPrefix = (plans[0]?.metadata as any)?.serial_prefix ?? null;

    return {
      seasonId,
      label: seasonLabelFromId(seasonId),
      status,
      planCount: plans.length,
      qrCount,
      qrAvailableCount,
      assignedQrCount,
      soldQrCount,
      disabledSourceQrCount: archivedSourceQrCount,
      subscriptionCount,
      totalRevenue,
      salesClosedPlanCount,
      plansOnSaleCount,
      sourceSeasonId,
      serialPrefix,
      plans: planBreakdowns,
    };
  }

  async preflight(
    organizerId: string,
    targetSeason: string,
    action: SeasonAction,
    sourceSeason?: string,
  ): Promise<SeasonPreflightResult> {
    const summary = await this.getSeasonSummary(organizerId, targetSeason);
    const blockers: string[] = [];
    const warnings: string[] = [];
    const counts: Record<string, number> = {
      planCount: summary.planCount,
      qrCount: summary.qrCount,
      assignedQrCount: summary.assignedQrCount,
      subscriptionCount: summary.subscriptionCount,
    };

    const resolvedSource =
      sourceSeason ||
      summary.sourceSeasonId ||
      (await this.inferSourceSeasonForMigration(organizerId, targetSeason));

    switch (action) {
      case 'clone': {
        if (summary.planCount > 0) {
          blockers.push(`La saison ${targetSeason} a déjà ${summary.planCount} plan(s).`);
        }
        if (!resolvedSource) {
          blockers.push('Aucune saison source disponible.');
        }
        break;
      }
      case 'generate_qr': {
        if (!resolvedSource) {
          blockers.push('Saison source introuvable.');
        }
        if (summary.planCount === 0) {
          blockers.push('Aucun plan sur la saison cible — clonez d\'abord les plans.');
        }
        if (summary.qrCount > 0) {
          blockers.push(`La saison cible a déjà ${summary.qrCount} QR code(s).`);
        }
        try {
          if (resolvedSource) {
            const preview = await this.qrMigration.previewGeneration(
              organizerId,
              resolvedSource,
              targetSeason,
            );
            counts.migrationPairs = preview.total;
            counts.renewals = preview.renewals;
            counts.newStock = preview.newStock;
            if (preview.total === 0) {
              blockers.push('Aucune paire QR à migrer (vérifiez previous_plan_id).');
            }
          }
        } catch (e: any) {
          blockers.push(e.message || 'Impossible de prévisualiser la migration QR.');
        }
        break;
      }
      case 'rollback': {
        if (summary.qrCount === 0) {
          blockers.push('Aucun QR sur la saison cible.');
        }
        if (summary.status === 'sales_active') {
          blockers.push(
            'Rollback impossible sur une saison avec ventes actives — fermez les ventes d\'abord.',
          );
        }
        if (summary.assignedQrCount > 0) {
          blockers.push(`${summary.assignedQrCount} QR assigné(s) — rollback bloqué.`);
        }
        if (summary.subscriptionCount > 0) {
          blockers.push(`${summary.subscriptionCount} abonnement(s) — rollback bloqué.`);
        }
        if (summary.disabledSourceQrCount === 0 && resolvedSource) {
          blockers.push('Aucune carte source archivée pour cette migration.');
        }
        const targetPlanIds = summary.plans.map((p) => p.planId);
        if (targetPlanIds.length > 0) {
          const accessRightsOnTarget = await this.prisma.access_rights.count({
            where: {
              subscriptions: { plan_id: { in: targetPlanIds } },
            },
          });
          counts.accessRightsOnTarget = accessRightsOnTarget;
          if (accessRightsOnTarget > 0) {
            blockers.push(
              `${accessRightsOnTarget} droit(s) d'accès lié(s) — rollback bloqué.`,
            );
          }
        }
        counts.archivedSource = summary.disabledSourceQrCount;
        break;
      }
      case 'cancel_draft': {
        if (summary.planCount === 0) {
          blockers.push('Aucun plan à supprimer.');
        }
        if (summary.qrCount > 0) {
          blockers.push(`Suppression impossible: ${summary.qrCount} QR code(s) existent.`);
        }
        if (summary.subscriptionCount > 0) {
          blockers.push(`Suppression impossible: ${summary.subscriptionCount} abonnement(s).`);
        }
        break;
      }
      case 'activate': {
        if (!resolvedSource) {
          blockers.push('Saison source introuvable.');
        }
        if (summary.planCount === 0) {
          blockers.push('Aucun plan sur la saison cible.');
        }
        if (summary.qrCount === 0) {
          warnings.push('Aucun QR généré — les ventes s\'ouvriront sans stock QR.');
        }
        break;
      }
    }

    return {
      action,
      allowed: blockers.length === 0,
      blockers,
      warnings,
      counts,
      sourceSeason: resolvedSource,
      targetSeason,
    };
  }

  async cancelDraftSeason(organizerId: string, targetSeason: string) {
    const check = await this.preflight(organizerId, targetSeason, 'cancel_draft');
    if (!check.allowed) {
      throw new ConflictException(check.blockers.join(' '));
    }

    const plans = await this.getSeasonPlans(organizerId, targetSeason);
    const planIds = plans.map((p) => p.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription_plan_zones.deleteMany({
        where: { subscription_plan_id: { in: planIds } },
      });

      for (const plan of plans) {
        const meta = plan.metadata as Record<string, unknown> | null;
        const prevId = meta?.previous_plan_id as string | undefined;
        if (prevId) {
          const prev = await tx.subscription_plans.findUnique({ where: { id: prevId } });
          if (prev) {
            const prevMeta = { ...((prev.metadata as Record<string, unknown>) || {}) };
            delete prevMeta.successor_plan_id;
            await tx.subscription_plans.update({
              where: { id: prevId },
              data: { metadata: prevMeta as Prisma.InputJsonValue, updated_at: new Date() },
            });
          }
        }
      }

      await tx.subscription_plans.deleteMany({
        where: { id: { in: planIds } },
      });
    });

    await this.clearPlanCaches(organizerId);

    this.logger.logBusinessEvent('SEASON_DRAFT_CANCELLED', { targetSeason, deletedPlans: planIds.length });

    return { deletedPlans: planIds.length, targetSeason };
  }

  private computeStatus(input: {
    planCount: number;
    qrCount: number;
    assignedQrCount: number;
    subscriptionCount: number;
    salesClosedPlanCount: number;
    plansOnSaleCount: number;
    planTotal: number;
  }): SeasonStatus {
    if (input.planCount === 0) return 'none';
    if (input.qrCount === 0) return 'draft_plans';
    if (input.assignedQrCount > 0 || input.subscriptionCount > 0) return 'qrs_in_use';
    if (input.plansOnSaleCount > 0) return 'sales_active';
    if (input.salesClosedPlanCount === input.planTotal && input.planTotal > 0) return 'archived';
    return 'qrs_ready';
  }

  private async inferSourceSeasonFromPlans(
    organizerId: string,
    targetSeason: string,
  ): Promise<string | undefined> {
    const plans = await this.getSeasonPlans(organizerId, targetSeason);
    for (const plan of plans) {
      const meta = plan.metadata as Record<string, unknown> | null;
      const prevId = meta?.previous_plan_id as string | undefined;
      if (prevId) {
        const prev = await this.prisma.subscription_plans.findUnique({
          where: { id: prevId },
          select: { metadata: true },
        });
        const prevSeason = (prev?.metadata as any)?.season as string | undefined;
        if (prevSeason) return prevSeason;
      }
    }
    return undefined;
  }

  /** Fallback for migration preflight only — not for summary display. */
  private async inferSourceSeasonForMigration(
    organizerId: string,
    targetSeason: string,
  ): Promise<string | undefined> {
    const explicit = await this.inferSourceSeasonFromPlans(organizerId, targetSeason);
    if (explicit) return explicit;
    return this.inferLatestOtherSeason(organizerId, targetSeason);
  }

  private async inferLatestOtherSeason(
    organizerId: string,
    excludeSeason: string,
  ): Promise<string | undefined> {
    const seasons = await this.plansService.listSeasonsForOrganizer(organizerId);
    const others = seasons.map((s) => s.id).filter((id) => id !== excludeSeason);
    return others.sort((a, b) => b.localeCompare(a))[0];
  }

  async resolveSourceSeason(organizerId: string, targetSeason: string): Promise<string | undefined> {
    return this.inferSourceSeasonFromPlans(organizerId, targetSeason);
  }

  private async getSeasonPlans(organizerId: string, seasonId: string) {
    return this.prisma.subscription_plans.findMany({
      where: {
        organizer_id: organizerId,
        metadata: { path: ['season'], equals: seasonId },
      },
      orderBy: { code: 'asc' },
    });
  }

  private async getSeasonPlanIds(organizerId: string, seasonId: string) {
    const plans = await this.getSeasonPlans(organizerId, seasonId);
    return plans.map((p) => p.id);
  }

  private async clearPlanCaches(organizerId: string) {
    await this.redis.delCache(`subscription-plans:available:${organizerId}`);
    await this.redis.delCache(`subscription-plans:all-organizer:${organizerId}`);
  }
}
