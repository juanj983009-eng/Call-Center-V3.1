import { describe, it, expect } from 'vitest';
import {
  PLANS,
  RESTRICTIONS,
  getPlansByCategory,
  compareTwoPlans
} from '../planComparison';

describe('planComparison module', () => {
  it('contains plans across 5 categories and the 8 operational restrictions', () => {
    expect(PLANS.length).toBe(24);
    expect(RESTRICTIONS.length).toBe(8);

    const vigentes = getPlansByCategory('Vigente Nov 2026');
    expect(vigentes.length).toBe(7);

    const anteriores = getPlansByCategory('Parrilla Anterior (07-2023 / 10-2024)');
    expect(anteriores.length).toBe(5);

    const orderEntry = getPlansByCategory('Order Entry / Riesgo');
    expect(orderEntry.length).toBe(2);

    const adicionales = getPlansByCategory('Líneas Adicionales');
    expect(adicionales.length).toBe(4);

    const ggtt = getPlansByCategory('Planes GGTT');
    expect(ggtt.length).toBe(6);

    const plan500 = PLANS.find(p => p.id === 'plan-500-libre-2026');
    expect(plan500).toBeDefined();
    expect(plan500?.gbHighSpeed).toBe(500);
    expect(plan500?.pujRule).toBeDefined();
    expect(plan500?.minutes).toBeDefined();
    expect(plan500?.sms).toBe(500);
    expect(plan500?.roaming).toBeDefined();
    expect(plan500?.ldi).toBeDefined();
  });

  it('detects Claro Up downgrade restriction when new plan has lower normal fixed price', () => {
    // Max L Antiguo ($15.990) migrating down to Plan 500 GB Libre ($9.990) with Claro Up
    const diff = compareTwoPlans('plan-max-l-antiguo', 'plan-500-libre-2026', true);

    expect(diff.claroUpWarning).toBe(true);
    expect(diff.priceDiff).toBe(9990 - 15990);
    expect(diff.isDowngrade).toBe(true);
  });

  it('allows Claro Up when new plan has equal or higher normal fixed price', () => {
    // Max M Antiguo ($12.990) migrating up to Plan 800 GB Libre ($12.990) with Claro Up
    const diff = compareTwoPlans('plan-max-m-antiguo', 'plan-800-libre-2026', true);

    expect(diff.claroUpWarning).toBe(false);
  });

  it('warns about promotion loss when switching to plans with introductory discount', () => {
    // Plan 800 Libre has normalPrice 12990 and promoPrice 11990
    const diff = compareTwoPlans('plan-max-m-antiguo', 'plan-800-libre-2026', false);
    expect(diff.promoLossWarning).toBe(true);
  });
});
