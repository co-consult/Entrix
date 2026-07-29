export type SeasonStatus =
  | 'none'
  | 'draft_plans'
  | 'qrs_ready'
  | 'qrs_in_use'
  | 'sales_active'
  | 'archived';

export type SeasonAction = 'generate_qr' | 'rollback' | 'cancel_draft' | 'activate' | 'clone';

export interface SeasonPlanBreakdown {
  planId: string;
  planCode: string;
  planName: string;
  qrTotal: number;
  qrAvailable: number;
  qrAssigned: number;
  qrDisabled: number;
  archivedSourceCount: number;
  subscriptionCount: number;
  revenue: number;
}

export interface SeasonSummary {
  seasonId: string;
  label: string;
  status: SeasonStatus;
  planCount: number;
  qrCount: number;
  qrAvailableCount: number;
  assignedQrCount: number;
  soldQrCount: number;
  disabledSourceQrCount: number;
  subscriptionCount: number;
  totalRevenue: number;
  salesClosedPlanCount: number;
  plansOnSaleCount: number;
  sourceSeasonId?: string;
  serialPrefix?: string | null;
  plans: SeasonPlanBreakdown[];
}

export interface SeasonPreflightResult {
  action: SeasonAction;
  allowed: boolean;
  blockers: string[];
  warnings: string[];
  counts: Record<string, number>;
  sourceSeason?: string;
  targetSeason: string;
}

export interface GenerateQRPreview {
  total: number;
  renewals: number;
  newStock: number;
  perPlan: Array<{
    planCode: string;
    total: number;
    renewals: number;
    newStock: number;
  }>;
}
