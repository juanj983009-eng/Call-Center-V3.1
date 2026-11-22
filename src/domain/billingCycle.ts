import rawBillingData from '../data/billingCycles.json';
import type {
  BillingCycleItem,
  BillingCyclesData,
  CycleDifferentialParams,
  CycleDifferentialResult,
  ProportionalCalculationResult
} from '../types';

const data = rawBillingData as BillingCyclesData;

export const BILLING_CYCLES: BillingCycleItem[] = data.cycles;
export const BILLING_RULES: string[] = data.rules;

// Alias for backwards compatibility
export const BILLING_CYCLES_DATA = BILLING_CYCLES;

export function formatCLP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0';
  return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

export function getCycleByCode(code: number): BillingCycleItem | undefined {
  return BILLING_CYCLES.find(c => c.code === code);
}

export function getCycleById(code: number): BillingCycleItem | undefined {
  return getCycleByCode(code);
}

function formatDateShort(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function getDayBefore(d: Date): Date {
  const prev = new Date(d.getTime());
  prev.setDate(prev.getDate() - 1);
  return prev;
}

/**
 * Calculates exact cycle change transition days, bridge adjustment,
 * small proportional bill, combined bill, and visual timeline nodes.
 */
export function calculateCycleDifferential(params: CycleDifferentialParams): CycleDifferentialResult {
  const {
    oldCycleDay,
    newCycleDay,
    changeDateStr,
    cargoFijo,
    hasLeasedDevice = false,
    deviceInstallment = 0
  } = params;

  // 1. Parse Change Date
  let changeDate: Date;
  if (changeDateStr && /^\d{4}-\d{2}-\d{2}$/.test(changeDateStr)) {
    const [y, m, d] = changeDateStr.split('-').map(Number);
    changeDate = new Date(y, m - 1, d, 12, 0, 0);
  } else {
    const now = new Date();
    changeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }

  const changeYear = changeDate.getFullYear();
  const changeMonth = changeDate.getMonth(); // 0-indexed
  const changeDayOfMonth = changeDate.getDate();

  // 2. Determine oldCycleStartDate and oldCycleNextStart
  let oldCycleStartDate: Date;
  let oldCycleNextStart: Date;

  if (changeDayOfMonth >= oldCycleDay) {
    oldCycleStartDate = new Date(changeYear, changeMonth, oldCycleDay, 12, 0, 0);
    const nextMonthDays = new Date(changeYear, changeMonth + 2, 0).getDate();
    const clampedDay = Math.min(oldCycleDay, nextMonthDays);
    oldCycleNextStart = new Date(changeYear, changeMonth + 1, clampedDay, 12, 0, 0);
  } else {
    const prevMonthDays = new Date(changeYear, changeMonth, 0).getDate();
    const clampedPrev = Math.min(oldCycleDay, prevMonthDays);
    oldCycleStartDate = new Date(changeYear, changeMonth - 1, clampedPrev, 12, 0, 0);
    const thisMonthDays = new Date(changeYear, changeMonth + 1, 0).getDate();
    const clampedCurrent = Math.min(oldCycleDay, thisMonthDays);
    oldCycleNextStart = new Date(changeYear, changeMonth, clampedCurrent, 12, 0, 0);
  }

  // The old cycle closes normally on the day immediately prior to oldCycleNextStart
  const oldCycleEndDate = getDayBefore(oldCycleNextStart);

  // 3. Determine newCycleStartDate (first occurrence of newCycleDay strictly after oldCycleNextStart)
  let newCycleStartDate: Date;
  const nextStartYear = oldCycleNextStart.getFullYear();
  const nextStartMonth = oldCycleNextStart.getMonth();
  const nextStartDay = oldCycleNextStart.getDate();

  if (newCycleDay > nextStartDay) {
    const thisMonthDays = new Date(nextStartYear, nextStartMonth + 1, 0).getDate();
    const clampedDay = Math.min(newCycleDay, thisMonthDays);
    newCycleStartDate = new Date(nextStartYear, nextStartMonth, clampedDay, 12, 0, 0);
  } else if (newCycleDay < nextStartDay) {
    const nextMonthDays = new Date(nextStartYear, nextStartMonth + 2, 0).getDate();
    const clampedDay = Math.min(newCycleDay, nextMonthDays);
    newCycleStartDate = new Date(nextStartYear, nextStartMonth + 1, clampedDay, 12, 0, 0);
  } else {
    // Same cycle
    newCycleStartDate = new Date(oldCycleNextStart.getTime());
  }

  // 4. Calculate exact bridge days (from oldCycleNextStart to newCycleStartDate - 1)
  const msPerDay = 86400000;
  const bridgeDays = Math.max(
    0,
    Math.round((newCycleStartDate.getTime() - oldCycleNextStart.getTime()) / msPerDay)
  );

  const daysInOldCycleBeforeChange = Math.max(
    0,
    Math.round((changeDate.getTime() - oldCycleStartDate.getTime()) / msPerDay)
  );

  const bridgeEndDate = getDayBefore(newCycleStartDate);
  const bridgePeriodFormatted = bridgeDays > 0
    ? `${formatDateShort(oldCycleNextStart)} al ${formatDateShort(bridgeEndDate)}`
    : 'Sin días puente';

  // 5. Standard 30-Day Commercial Base Calculations
  const safeCargo = Math.max(0, cargoFijo || 0);
  const dailyRate = safeCargo / 30;
  const rentalFee = hasLeasedDevice ? Math.max(0, deviceInstallment || 0) : 0;

  const proportionalAdjustment = Math.round(dailyRate * bridgeDays);
  const smallProportionalBill = proportionalAdjustment + rentalFee;
  const combinedBill = safeCargo + smallProportionalBill;
  const estimatedTransitionBill = smallProportionalBill;
  const billDifferential = smallProportionalBill - safeCargo;

  return {
    oldCycleStartDate,
    oldCycleEndDate,
    oldCycleNextStart,
    changeDate,
    newCycleStartDate,
    oldCycleStartFormatted: formatDateShort(oldCycleStartDate),
    oldCycleEndFormatted: formatDateShort(oldCycleEndDate),
    changeDateFormatted: formatDateShort(changeDate),
    newCycleStartFormatted: formatDateShort(newCycleStartDate),
    bridgePeriodFormatted,
    bridgeDays,
    daysInOldCycleBeforeChange,
    bridgeDaysToNewCycle: bridgeDays,
    totalTransitionDays: bridgeDays,
    daysInMonth: 30,
    dailyRate: Math.round(dailyRate),
    proportionalAdjustment,
    smallProportionalBill,
    combinedBill,
    estimatedTransitionBill,
    billDifferential,
    hasLeasedDevice,
    deviceInstallment: rentalFee
  };
}

/**
 * Backward-compatible helper for basic proportional calculation.
 */
export function calculateProportional(params: {
  cargoFijo: number;
  effectiveDays: number;
  baseDays?: 30 | 31;
  hasEquipmentRental?: boolean;
}): ProportionalCalculationResult {
  const { cargoFijo, effectiveDays, baseDays = 30, hasEquipmentRental = false } = params;
  const safeBase = baseDays === 31 ? 31 : 30;
  const safeDays = Math.max(0, effectiveDays || 0);
  const dailyCost = cargoFijo > 0 ? cargoFijo / safeBase : 0;
  const proportionalAmount = Math.round(dailyCost * safeDays);

  return {
    dailyCost: Math.round(dailyCost),
    effectiveDays: safeDays,
    baseDays: safeBase,
    proportionalAmount,
    hasEquipmentRental,
    equipmentAdvanceNotice: hasEquipmentRental
  };
}
