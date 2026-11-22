import { describe, it, expect } from 'vitest';
import {
  calculateCycleDifferential,
  formatCLP,
  getCycleByCode,
  BILLING_CYCLES,
  BILLING_RULES
} from '../billingCycle';

describe('billingCycle module', () => {
  it('loads the 15 official cycles with complete specs', () => {
    expect(BILLING_CYCLES.length).toBe(15);

    const cycle2 = getCycleByCode(2);
    expect(cycle2).toBeDefined();
    expect(cycle2?.cycleDay).toBe(2);
    expect(cycle2?.graceDaysAfterDue).toBe(6);

    const cycle81 = getCycleByCode(81);
    expect(cycle81).toBeDefined();
    expect(cycle81?.cycleDay).toBe(8);
    expect(cycle81?.accountLoadOffset).toContain('Variante Cta Cte');

    const cycle8 = getCycleByCode(8);
    expect(cycle8?.accountLoadOffset).toContain('+6 días');
  });

  it('contains the 5 official billing rules', () => {
    expect(BILLING_RULES.length).toBe(5);
    expect(BILLING_RULES[0]).toContain('Facturación a mes vencido');
    expect(BILLING_RULES[1]).toContain('6 días adicionales');
  });

  it('calculates 9 exact bridge days between cycle 12 and cycle 21 (small proportional bill)', () => {
    // Old cycle: 12 (closes on 11, restarts on 12)
    // New cycle: 21 (starts on 21)
    // Bridge days = 21 - 12 = 9 days exact (12th through 20th)
    // Cargo fijo = $9.990 -> dailyRate = 9990 / 30 = 333
    // smallProportionalBill = Math.round(333 * 9) = 2997
    // combinedBill = 9990 + 2997 = 12987
    const res = calculateCycleDifferential({
      oldCycleDay: 12,
      newCycleDay: 21,
      changeDateStr: '2026-04-15',
      cargoFijo: 9990,
      hasLeasedDevice: false
    });

    expect(res.bridgeDays).toBe(9);
    expect(res.daysInMonth).toBe(30);
    expect(res.dailyRate).toBe(333);
    expect(res.smallProportionalBill).toBe(Math.round((9990 / 30) * 9));
    expect(res.combinedBill).toBe(9990 + res.smallProportionalBill);
    expect(res.bridgePeriodFormatted).toContain('al');
  });

  it('validates 10 exact bridge days between cycle 2 and cycle 12', () => {
    // Old cycle: 2 (closes on 01, restarts on 02)
    // New cycle: 12 (starts on 12)
    // Bridge days = 12 - 2 = 10 days exact (02 through 11)
    const res = calculateCycleDifferential({
      oldCycleDay: 2,
      newCycleDay: 12,
      changeDateStr: '2026-11-20',
      cargoFijo: 9990
    });

    expect(res.bridgeDays).toBe(10);
    expect(res.smallProportionalBill).toBe(Math.round((9990 / 30) * 10));
  });

  it('calculates cycle differential across months with leased device installment', () => {
    // Old cycle: 21, New cycle: 8
    // In April (30 days): from April 21 to May 08 = 17 days
    const res = calculateCycleDifferential({
      oldCycleDay: 21,
      newCycleDay: 8,
      changeDateStr: '2026-04-15',
      cargoFijo: 9990,
      hasLeasedDevice: true,
      deviceInstallment: 15000
    });

    expect(res.bridgeDays).toBe(17);
    expect(res.hasLeasedDevice).toBe(true);
    expect(res.deviceInstallment).toBe(15000);
    const expectedProportional = Math.round((9990 / 30) * 17);
    expect(res.smallProportionalBill).toBe(expectedProportional + 15000);
    expect(res.combinedBill).toBe(9990 + expectedProportional + 15000);
  });

  it('formats CLP numbers accurately', () => {
    expect(formatCLP(12990)).toBe('$12.990');
    expect(formatCLP(0)).toBe('$0');
  });
});
