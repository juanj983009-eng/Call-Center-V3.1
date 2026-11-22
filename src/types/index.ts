// Shared Type Definitions for ClaroConsult

export type UnitType = 'Bytes' | 'KB' | 'MB' | 'GB';

// 1. SVA Catalog Types
export interface SvaSmsCommand {
  keyword: string;
  shortcode: string;
  note?: string;
}

export interface SvaCatalogItem {
  id: string;
  name: string;
  provider: string;
  type: string; // e.g. "Propio", "Terceros"
  priceRef: string;
  sms: SvaSmsCommand[];
  sumaAvailable: boolean;
  blacklistRequired: boolean;
  altChannel: string;
}

// 2. Mobile Plans Catalog Types
export type PlanCategory =
  | 'Vigente Nov 2026'
  | 'Parrilla Anterior (07-2023 / 10-2024)'
  | 'Order Entry / Riesgo'
  | 'Líneas Adicionales'
  | 'Planes GGTT';

export interface PlanItem {
  id: string;
  category: PlanCategory;
  name: string;
  crmCode: string;
  modality: string;
  normalPrice: number;
  promoPrice: number | null;
  promoDuration: string;
  gbHighSpeed: number;
  pujRule: string;
  minutes: string;
  sms: number;
  roaming: string;
  ldi: string;
  ott: string;
}

export interface PlansCatalogData {
  plans: PlanItem[];
  restrictions: string[];
}

// 3. Billing Cycles Types (15 Official Cycles)
export interface BillingCycleItem {
  code: number;
  cycleDay: number;
  period: string;
  issueDay: string;
  dueDay: string;
  cutOffDay: string;
  graceDaysAfterDue: number;
  accountLoadOffset: string;
}

export interface BillingCyclesData {
  cycles: BillingCycleItem[];
  rules: string[];
}

export interface CycleDifferentialParams {
  oldCycleDay: number;
  newCycleDay: number;
  changeDateStr?: string; // ISO YYYY-MM-DD
  cargoFijo: number;
  hasLeasedDevice?: boolean;
  deviceInstallment?: number;
}

export interface CycleDifferentialResult {
  oldCycleStartDate: Date;
  oldCycleEndDate: Date;
  oldCycleNextStart: Date;
  changeDate: Date;
  newCycleStartDate: Date;
  oldCycleStartFormatted: string; // e.g. "12/04"
  oldCycleEndFormatted: string;   // e.g. "11/05"
  changeDateFormatted: string;     // e.g. "15/04"
  newCycleStartFormatted: string;  // e.g. "21/05"
  bridgePeriodFormatted: string;   // e.g. "12/05 al 20/05"
  bridgeDays: number;
  daysInOldCycleBeforeChange: number;
  bridgeDaysToNewCycle: number;
  totalTransitionDays: number;
  daysInMonth: number;
  dailyRate: number;
  proportionalAdjustment: number;
  smallProportionalBill: number;
  combinedBill: number;
  estimatedTransitionBill: number;
  billDifferential: number;
  hasLeasedDevice: boolean;
  deviceInstallment: number;
}

export interface ProportionalCalculationResult {
  dailyCost: number;
  effectiveDays: number;
  baseDays: 30 | 31;
  proportionalAmount: number;
  hasEquipmentRental: boolean;
  equipmentAdvanceNotice: boolean;
}

// 4. Giga Calculator & CRM One Buckets
export interface BucketAuditInput {
  cuenta10000MB: number; // Internet Libre
  cuenta1601MB: number;   // Redes Sociales
  cuenta8Monto: number;   // Saldo Minutos ($ / 68)
  cuenta3Monto: number;   // Saldo SMS ($ / 4)
  cuenta0Monto: number;   // Saldo Maestro ($)
  cuenta7Monto: number;   // Saldo Voz Cuenta Exacta ($)
}

export interface BucketAuditResult {
  totalDataGB: number;
  cuenta10000GB: number;
  cuenta1601GB: number;
  availableMinutes: number;
  availableSMS: number;
  totalCashBalance: number;
}

// 5. Action Notes & Execution Templates
export interface ActionNoteField {
  key: string;
  label: string;
  placeholder: string;
}

export interface ActionNoteTemplate {
  id: string;
  title: string;
  category?: string;
  system: string;
  reasonHeader: string;
  sla: string;
  preconditions?: string[];
  fields: ActionNoteField[];
  template: string;
}
