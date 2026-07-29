import { registerAs } from '@nestjs/config';

export default registerAs('cssforever', () => ({
  targetSeason: process.env.CSSFOREVER_TARGET_SEASON || '2026-2027',
  previousSeason: process.env.CSSFOREVER_PREVIOUS_SEASON || '2025-2026',
  organizerId:
    process.env.CSSFOREVER_ORGANIZER_ID || 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e',
  apiKey: process.env.CSSFOREVER_API_KEY || '',
  allowedIps: (process.env.CSSFOREVER_ALLOWED_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  simulateDate: process.env.CSSFOREVER_SIMULATE_DATE || '',
  priorityUntil: process.env.CSSFOREVER_PRIORITY_UNTIL || '2026-07-05',
  newSubscriptionsFrom: process.env.CSSFOREVER_NEW_SUBS_FROM || '2026-07-06',
  receiptSecret: process.env.CSSFOREVER_RECEIPT_SECRET || process.env.JWT_SECRET || 'cssforever-receipt',
  publicApiUrl:
    process.env.CSSFOREVER_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000/api/v1',
  planGradinDefault: process.env.CSSFOREVER_PLAN_GRADIN || '',
  planChaiseDefault: process.env.CSSFOREVER_PLAN_CHAISE || '',
  deliveryAddress: process.env.CSSFOREVER_DELIVERY_ADDRESS || 'COMPLEXE_CSS',
  deliveryDate: process.env.CSSFOREVER_DELIVERY_DATE || '2026-07-05',
}));
