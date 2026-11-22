import type { BucketAuditInput, BucketAuditResult } from '../types';

export type GigaUnit = 'Bytes' | 'KB' | 'MB' | 'GB';

export interface DataBucketItem {
  id: string;
  name: string;
  amount: number;
  unit: GigaUnit;
}

export interface GigaCalculationResult {
  baseQuotaGB: number;
  bonusQuotaGB: number;
  totalQuotaGB: number;
  consumptionGB: number;
  remainingGB: number;
  percentageRemaining: number;
  isExhausted: boolean;
  purActive: boolean;
  dailyThresholdExceeded: boolean;
  monthlyThresholdExceeded: boolean;
  alerts: {
    level: 'danger' | 'warning' | 'info' | 'success';
    title: string;
    description: string;
  }[];
}

/**
 * Converts value from Bytes, KB, MB, or GB to Gigabytes using binary standard (1024 base).
 * For bytes (PUJ tab): value / 1024 / 1024 / 1024
 */
export function convertUnitToGB(value: number, unit: GigaUnit): number {
  if (!value || isNaN(value) || value < 0) return 0;
  switch (unit) {
    case 'Bytes':
      return value / (1024 * 1024 * 1024);
    case 'KB':
      return value / (1024 * 1024);
    case 'MB':
      return value / 1024;
    case 'GB':
      return value;
    default:
      return value;
  }
}

export const convertDirect = convertUnitToGB;

export function bytesToGB(bytes: number): number {
  if (!bytes || isNaN(bytes) || bytes <= 0) return 0;
  return bytes / (1024 * 1024 * 1024);
}

export function mbToGB(mb: number): number {
  if (!mb || isNaN(mb) || mb <= 0) return 0;
  return mb / 1024;
}

/**
 * Formats data values cleanly for display (e.g. "45.20 GB" or "512 MB").
 */
export function formatGigaDisplay(gbValue: number): string {
  if (gbValue <= 0) return '0 GB';
  if (gbValue < 0.001) return '< 1 MB';
  if (gbValue < 1) {
    const mb = Math.round(gbValue * 1024);
    return `${mb.toLocaleString('es-CL')} MB`;
  }
  return `${gbValue.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GB`;
}

/**
 * Auditoria de Buckets CRM One:
 * - Cuenta 10000: Internet Libre (MB -> GB)
 * - Cuenta 1601: RRSS (MB -> GB)
 * - Cuenta 8: Monto $ / $68 = Minutos disponibles
 * - Cuenta 3: Monto $ / $4 = SMS disponibles
 * - Cuenta 0: Saldo Maestro $
 * - Cuenta 7: Saldo Voz Cuenta Exacta $
 */
export function calculateBucketAudit(params: BucketAuditInput): BucketAuditResult {
  const cuenta10000GB = mbToGB(params.cuenta10000MB || 0);
  const cuenta1601GB = mbToGB(params.cuenta1601MB || 0);
  const totalDataGB = Number((cuenta10000GB + cuenta1601GB).toFixed(3));
  
  const c8 = Math.max(0, params.cuenta8Monto || 0);
  const c3 = Math.max(0, params.cuenta3Monto || 0);
  const c0 = Math.max(0, params.cuenta0Monto || 0);
  const c7 = Math.max(0, params.cuenta7Monto || 0);

  const availableMinutes = Math.floor(c8 / 68);
  const availableSMS = Math.floor(c3 / 4);
  const totalCashBalance = c0 + c7;

  return {
    totalDataGB,
    cuenta10000GB: Number(cuenta10000GB.toFixed(3)),
    cuenta1601GB: Number(cuenta1601GB.toFixed(3)),
    availableMinutes,
    availableSMS,
    totalCashBalance
  };
}

export interface ParsedCRMOneText {
  baseValue: number;
  baseUnit: GigaUnit;
  bonusValue: number;
  bonusUnit: GigaUnit;
  consumptionValue: number;
  consumptionUnit: GigaUnit;
  detectedPlan?: string;
  isPyme?: boolean;
  notes: string[];
  // Direct Bucket Audit parsed fields
  bucketAudit?: Partial<BucketAuditInput>;
  directBytesPUJ?: number;
}

/**
 * Extracts numbers, units and keywords from raw CRM One text.
 */
export function parseRawCRMText(rawText: string): ParsedCRMOneText {
  const result: ParsedCRMOneText = {
    baseValue: 0,
    baseUnit: 'GB',
    bonusValue: 0,
    bonusUnit: 'MB',
    consumptionValue: 0,
    consumptionUnit: 'MB',
    notes: [],
    bucketAudit: {}
  };

  if (!rawText || !rawText.trim()) return result;

  const clean = rawText.replace(/\r/g, ' ');

  if (/pyme|empresa|corporativ|b2b/i.test(clean)) {
    result.isPyme = true;
    result.notes.push('Línea identificada como PyME / Empresas');
  }

  // Plan match
  const planMatch = clean.match(/(?:Plan|PRODUCTO|CONTRATO)[\s:]*([A-Za-z0-9\s+]+(?:Max\s+[SMLXL]+|Libre Pro|500\s*GB|800\s*GB|1000\s*GB|Persona Mayor)[A-Za-z0-9\s]*)/i)
    || clean.match(/(Max\s+[SMLXL]+(?:\s+Pro)?|Max\s+Libre\s+Pro|Plan\s+\d+\s*GB|Persona\s+Mayor)/i);
  if (planMatch) {
    result.detectedPlan = planMatch[1].trim();
    result.notes.push(`Plan detectado: ${result.detectedPlan}`);
  }

  // Look for Cuenta 10000 (Internet Libre MB)
  const c10000Match = clean.match(/(?:cuenta|cta\.?)\s*10000[\s:=-]+([\d.,]+)\s*(?:MB|Megas)?/i);
  if (c10000Match) {
    const val = parseFloat(c10000Match[1].replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(val)) {
      result.bucketAudit!.cuenta10000MB = val;
      result.notes.push(`Cuenta 10000 (Internet Libre): ${val} MB`);
    }
  }

  // Look for Cuenta 1601 (RRSS MB)
  const c1601Match = clean.match(/(?:cuenta|cta\.?)\s*1601[\s:=-]+([\d.,]+)\s*(?:MB|Megas)?/i);
  if (c1601Match) {
    const val = parseFloat(c1601Match[1].replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(val)) {
      result.bucketAudit!.cuenta1601MB = val;
      result.notes.push(`Cuenta 1601 (RRSS): ${val} MB`);
    }
  }

  // Look for Cuenta 8 (Monto Voz / 68)
  const c8Match = clean.match(/(?:cuenta|cta\.?)\s*8[\s:=-]+(?:[$])?([\d.,]+)/i);
  if (c8Match) {
    const val = parseFloat(c8Match[1].replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(val)) {
      result.bucketAudit!.cuenta8Monto = val;
      result.notes.push(`Cuenta 8 (Monto Voz): $${val}`);
    }
  }

  // Look for Cuenta 3 (Monto SMS / 4)
  const c3Match = clean.match(/(?:cuenta|cta\.?)\s*3[\s:=-]+(?:[$])?([\d.,]+)/i);
  if (c3Match) {
    const val = parseFloat(c3Match[1].replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(val)) {
      result.bucketAudit!.cuenta3Monto = val;
      result.notes.push(`Cuenta 3 (Monto SMS): $${val}`);
    }
  }

  // Look for Cuenta 0 (Saldo Maestro)
  const c0Match = clean.match(/(?:cuenta|cta\.?)\s*0[\s:=-]+(?:[$])?([\d.,]+)/i);
  if (c0Match) {
    const val = parseFloat(c0Match[1].replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(val)) {
      result.bucketAudit!.cuenta0Monto = val;
      result.notes.push(`Cuenta 0 (Saldo Maestro): $${val}`);
    }
  }

  // Look for Cuenta 7 (Saldo Voz Cuenta Exacta)
  const c7Match = clean.match(/(?:cuenta|cta\.?)\s*7[\s:=-]+(?:[$])?([\d.,]+)/i);
  if (c7Match) {
    const val = parseFloat(c7Match[1].replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(val)) {
      result.bucketAudit!.cuenta7Monto = val;
      result.notes.push(`Cuenta 7 (Saldo Voz Exacta): $${val}`);
    }
  }

  // Look for large Bytes number from PUJ tab (e.g. 107374182400 Bytes)
  const bytesPujMatch = clean.match(/(?:PUJ|politica\s*de\s*uso|consumo\s*bytes)[\s:=-]+([\d.,]+)\s*(?:Bytes)?/i)
    || clean.match(/([\d]{9,15})\s*Bytes/i);
  if (bytesPujMatch) {
    const val = parseFloat(bytesPujMatch[1].replace(/\./g, '').replace(/,/g, '.'));
    if (!isNaN(val)) {
      result.directBytesPUJ = val;
      result.notes.push(`PUJ Bytes detectados: ${val.toLocaleString('es-CL')} Bytes`);
    }
  }

  const extract = (patterns: RegExp[]): { value: number; unit: GigaUnit } | null => {
    for (const pat of patterns) {
      const match = clean.match(pat);
      if (match) {
        const rawNum = match[1].replace(/\./g, '').replace(/,/g, '.');
        const num = parseFloat(rawNum);
        const rawUnit = (match[2] || 'MB').toUpperCase();
        let unit: GigaUnit = 'MB';
        if (rawUnit.includes('BYTE')) unit = 'Bytes';
        else if (rawUnit.includes('G')) unit = 'GB';
        else if (rawUnit.includes('K')) unit = 'KB';
        else if (rawUnit.includes('M')) unit = 'MB';

        if (!isNaN(num)) return { value: num, unit };
      }
    }
    return null;
  };

  // Base
  const baseFound = extract([
    /(?:cuota\s*base|cuota\s*plan|plan\s*base|capacidad|asignad[oa]|limite\s*plan|saldo\s*inicial)[\s:=]*([\d.,]+)\s*(GB|MB|KB|Bytes|Gigas|Megas)/i,
    /(\d+)\s*(?:GB|Gigas)\s*(?:Libres|Plan|Asignados)/i
  ]);
  if (baseFound) {
    result.baseValue = baseFound.value;
    result.baseUnit = baseFound.unit;
    result.notes.push(`Cuota Base: ${baseFound.value} ${baseFound.unit}`);
  }

  // Bolsas / buckets
  const bonusFound = extract([
    /(?:bolsas?\s*adicional(?:es)?|bolsas?|extra|bono|paquete|adicional)[\s:=]*([\d.,]+)\s*(GB|MB|KB|Bytes|Gigas|Megas)/i,
    /(?:bolsa\s*rrss|bolsa\s*redes|bolsa\s*promo)[\s:=]*([\d.,]+)\s*(GB|MB|KB|Bytes)/i
  ]);
  if (bonusFound) {
    result.bonusValue = bonusFound.value;
    result.bonusUnit = bonusFound.unit;
    result.notes.push(`Bolsas Adicionales: ${bonusFound.value} ${bonusFound.unit}`);
  }

  // Consumption
  const consumptionFound = extract([
    /(?:consumo\s*actual|consumido|trafico\s*usado|datos\s*usados|utilizado|trafico\s*consumido)[\s:=]*([\d.,]+)\s*(GB|MB|KB|Bytes|Gigas|Megas)/i,
    /(?:consumo|usado)[\s:=]*([\d.,]+)\s*(GB|MB|KB|Bytes)/i
  ]);
  if (consumptionFound) {
    result.consumptionValue = consumptionFound.value;
    result.consumptionUnit = consumptionFound.unit;
    result.notes.push(`Consumo Actual: ${consumptionFound.value} ${consumptionFound.unit}`);
  }

  return result;
}

export interface CalculateGigasParams {
  baseValue: number;
  baseUnit: GigaUnit;
  buckets: DataBucketItem[];
  consumptionValue: number;
  consumptionUnit: GigaUnit;
  planName?: string;
  isPyme?: boolean;
  dailyConsumptionGB?: number;
  monthlyAccumulatedGB?: number;
}

/**
 * Pure calculation function for data quotas, buckets, consumption and technical alerts.
 */
export function calculateGigas(params: CalculateGigasParams): GigaCalculationResult {
  const baseGB = convertUnitToGB(params.baseValue, params.baseUnit);
  
  // Sum all extra buckets
  const bonusGB = params.buckets.reduce((acc, bucket) => {
    return acc + convertUnitToGB(bucket.amount, bucket.unit);
  }, 0);

  const consumptionGB = convertUnitToGB(params.consumptionValue, params.consumptionUnit);
  const totalQuotaGB = baseGB + bonusGB;
  const rawRemaining = totalQuotaGB - consumptionGB;
  const remainingGB = Math.max(0, Number(rawRemaining.toFixed(4)));

  const percentageRemaining = totalQuotaGB > 0
    ? Math.min(100, Math.max(0, Number(((remainingGB / totalQuotaGB) * 100).toFixed(1))))
    : 0;

  const isExhausted = remainingGB <= 0.0001;
  const planNameNorm = (params.planName || '').toLowerCase();
  const isMaxLibrePro = planNameNorm.includes('libre pro') || planNameNorm.includes('ilimitado');

  const alerts: GigaCalculationResult['alerts'] = [];

  if (isExhausted) {
    alerts.push({
      level: 'danger',
      title: 'CUOTA AGOTADA (0 GB DISPONIBLES)',
      description: 'El cliente consumió el 100% de su capacidad contratada. Requiere compra de bolsa o recarga en recargas.clarochile.cl.'
    });
  } else if (percentageRemaining < 10) {
    alerts.push({
      level: 'warning',
      title: 'CUOTA CRÍTICA (< 10% RESTANTE)',
      description: `Restan ${formatGigaDisplay(remainingGB)} (${percentageRemaining}% del total contratado).`
    });
  } else {
    alerts.push({
      level: 'success',
      title: 'ESTADO DE DATOS NORMAL',
      description: `Dispone de ${formatGigaDisplay(remainingGB)} (${percentageRemaining}%) navegando a máxima velocidad 5G.`
    });
  }

  // PUR Max Libre Pro
  let dailyThresholdExceeded = false;
  let monthlyThresholdExceeded = false;
  let purActive = false;

  if (isMaxLibrePro) {
    const daily = params.dailyConsumptionGB ?? 0;
    const monthly = params.monthlyAccumulatedGB ?? consumptionGB;

    if (daily >= 60 || monthly >= 1000) {
      dailyThresholdExceeded = daily >= 60;
      monthlyThresholdExceeded = monthly >= 1000;
      purActive = true;
      alerts.push({
        level: 'danger',
        title: 'POLÍTICA DE USO JUSTO (PUR) ACTIVA: 256 KBPS',
        description: `Excedió umbral contractual (${dailyThresholdExceeded ? '≥ 60 GB/día' : '≥ 1.000 GB/mes'}). Velocidad restringida técnicamente a 256 kbps.`
      });
    }
  }

  if (params.isPyme) {
    alerts.push({
      level: 'warning',
      title: 'GESTOR PYME: CAMPO "INTERNET ILIMITADO"',
      description: 'Al cargar bolsas adicionales en líneas PyME, desbloquear y desmarcar "Internet Ilimitado" en el Gestor de Bolsas.'
    });
  }

  return {
    baseQuotaGB: Number(baseGB.toFixed(3)),
    bonusQuotaGB: Number(bonusGB.toFixed(3)),
    totalQuotaGB: Number(totalQuotaGB.toFixed(3)),
    consumptionGB: Number(consumptionGB.toFixed(3)),
    remainingGB,
    percentageRemaining,
    isExhausted,
    purActive,
    dailyThresholdExceeded,
    monthlyThresholdExceeded,
    alerts
  };
}
