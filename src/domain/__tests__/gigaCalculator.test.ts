import { describe, it, expect } from 'vitest';
import {
  calculateGigas,
  convertUnitToGB,
  formatGigaDisplay,
  parseRawCRMText,
  calculateBucketAudit,
  bytesToGB,
  mbToGB
} from '../gigaCalculator';

describe('gigaCalculator module', () => {
  it('converts Bytes, KB, MB to GB dividing by 1024 accordingly', () => {
    // 1 GB = 1024 MB = 1048576 KB = 1073741824 Bytes
    expect(convertUnitToGB(1073741824, 'Bytes')).toBe(1);
    expect(convertUnitToGB(1048576, 'KB')).toBe(1);
    expect(convertUnitToGB(1024, 'MB')).toBe(1);
    expect(convertUnitToGB(50, 'GB')).toBe(50);

    expect(bytesToGB(1073741824)).toBe(1);
    expect(mbToGB(2048)).toBe(2);
  });

  it('audits CRM One accounts (10000, 1601, 8, 3, 0, 7) accurately', () => {
    const audit = calculateBucketAudit({
      cuenta10000MB: 51200, // 50 GB
      cuenta1601MB: 10240,  // 10 GB
      cuenta8Monto: 6800,   // 6800 / 68 = 100 min
      cuenta3Monto: 200,    // 200 / 4 = 50 SMS
      cuenta0Monto: 1500,
      cuenta7Monto: 500
    });

    expect(audit.cuenta10000GB).toBe(50);
    expect(audit.cuenta1601GB).toBe(10);
    expect(audit.totalDataGB).toBe(60);
    expect(audit.availableMinutes).toBe(100);
    expect(audit.availableSMS).toBe(50);
    expect(audit.totalCashBalance).toBe(2000);
  });

  it('correctly calculates remainder and percentage with extra buckets', () => {
    const res = calculateGigas({
      baseValue: 100,
      baseUnit: 'GB',
      buckets: [
        { id: '1', name: 'Bolsa 1', amount: 10240, unit: 'MB' }, // +10 GB
        { id: '2', name: 'Bolsa 2', amount: 5, unit: 'GB' }       // +5 GB
      ],
      consumptionValue: 65,
      consumptionUnit: 'GB'
    });

    expect(res.totalQuotaGB).toBe(115);
    expect(res.consumptionGB).toBe(65);
    expect(res.remainingGB).toBe(50);
    expect(res.percentageRemaining).toBeCloseTo(43.5, 1);
    expect(res.isExhausted).toBe(false);
  });

  it('triggers technical quota exhaustion alert when remaining is 0', () => {
    const res = calculateGigas({
      baseValue: 50,
      baseUnit: 'GB',
      buckets: [],
      consumptionValue: 50,
      consumptionUnit: 'GB'
    });

    expect(res.isExhausted).toBe(true);
    expect(res.remainingGB).toBe(0);
    const dangerAlert = res.alerts.find(a => a.level === 'danger');
    expect(dangerAlert).toBeDefined();
    expect(dangerAlert?.title).toContain('CUOTA AGOTADA');
  });

  it('enforces PUR 60 GB/day or 1000 GB/month limit with 256 kbps alert for Max Libre Pro', () => {
    const res = calculateGigas({
      baseValue: 1000,
      baseUnit: 'GB',
      buckets: [],
      consumptionValue: 400,
      consumptionUnit: 'GB',
      planName: 'Max Libre Pro',
      dailyConsumptionGB: 65
    });

    expect(res.purActive).toBe(true);
    expect(res.dailyThresholdExceeded).toBe(true);
    const purAlert = res.alerts.find(a => a.title.includes('USO JUSTO'));
    expect(purAlert).toBeDefined();
    expect(purAlert?.description).toContain('256 kbps');
  });

  it('parses raw CRM One unformatted text extracting base, bags and consumption', () => {
    const rawText = `
      LINEA POSTPAGO ACTIVA
      PLAN: Max L 100 GB
      Cuota Base: 100 GB
      Bolsas Adicionales: 10240 MB
      Consumo Actual: 45000 MB
      Segmento PyME
      Cuenta 10000: 51200 MB
      Cuenta 1601: 5120 MB
      Cuenta 8: $3400
      Cuenta 3: $100
    `;

    const parsed = parseRawCRMText(rawText);
    expect(parsed.detectedPlan).toContain('Max L');
    expect(parsed.baseValue).toBe(100);
    expect(parsed.baseUnit).toBe('GB');
    expect(parsed.bonusValue).toBe(10240);
    expect(parsed.bonusUnit).toBe('MB');
    expect(parsed.consumptionValue).toBe(45000);
    expect(parsed.consumptionUnit).toBe('MB');
    expect(parsed.isPyme).toBe(true);
    expect(parsed.bucketAudit?.cuenta10000MB).toBe(51200);
    expect(parsed.bucketAudit?.cuenta1601MB).toBe(5120);
    expect(parsed.bucketAudit?.cuenta8Monto).toBe(3400);
    expect(parsed.bucketAudit?.cuenta3Monto).toBe(100);
  });

  it('formats display strings cleanly', () => {
    expect(formatGigaDisplay(0)).toBe('0 GB');
    expect(formatGigaDisplay(0.5)).toBe('512 MB');
    expect(formatGigaDisplay(12.5)).toBe('12,50 GB');
  });
});
