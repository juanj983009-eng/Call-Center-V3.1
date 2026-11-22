import rawPlansData from '../data/plansCatalog.json';
import type { PlanItem, PlansCatalogData, PlanCategory } from '../types';

const data = rawPlansData as PlansCatalogData;

export const PLANS: PlanItem[] = data.plans;
export const RESTRICTIONS: string[] = data.restrictions;

// Alias for backwards compatibility
export const ALL_PLANS = PLANS;

export function getPlanById(id: string): PlanItem | undefined {
  return PLANS.find(p => p.id === id);
}

export function getPlansByCategory(category: PlanCategory): PlanItem[] {
  return PLANS.filter(p => p.category === category);
}

export interface PlanComparisonDiff {
  planA: PlanItem;
  planB: PlanItem;
  priceDiff: number;
  dataDiffGB: number;
  isUpgrade: boolean;
  isDowngrade: boolean;
  claroUpWarning: boolean;
  promoLossWarning: boolean;
}

/**
 * Compares two mobile plans side-by-side with commercial and technical rules.
 */
export function compareTwoPlans(planAId: string, planBId: string, hasClaroUp = false): PlanComparisonDiff {
  const planA = getPlanById(planAId) || PLANS[0];
  const planB = getPlanById(planBId) || PLANS[1] || PLANS[0];

  const priceDiff = planB.normalPrice - planA.normalPrice;
  const dataDiffGB = planB.gbHighSpeed - planA.gbHighSpeed;
  const isUpgrade = priceDiff > 0 || dataDiffGB > 0;
  const isDowngrade = priceDiff < 0;

  // Claro Up restriction: Downgrades are strictly blocked with Claro Up active
  const claroUpWarning = hasClaroUp && planB.normalPrice < planA.normalPrice;

  // Promo loss warning: Changing plan as existing client applies normal price without intro discount
  const promoLossWarning = Boolean(planB.promoPrice !== null && planB.promoPrice < planB.normalPrice);

  return {
    planA,
    planB,
    priceDiff,
    dataDiffGB,
    isUpgrade,
    isDowngrade,
    claroUpWarning,
    promoLossWarning
  };
}
