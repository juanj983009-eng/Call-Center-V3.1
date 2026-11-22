import React, { useState, useMemo } from 'react';
import {
  convertUnitToGB,
  calculateBucketAudit,
  parseRawCRMText,
  type GigaUnit
} from '../../domain/gigaCalculator';
import { CopyButton } from '../common/CopyButton';
import {
  RotateCcw,
  Sparkles,
  CheckCircle2,
  HardDrive,
  Database,
  Binary
} from 'lucide-react';

export const GigaCalculatorView: React.FC = () => {
  // 1. Direct Converter State (starts at 0, no dummy data)
  const [directValue, setDirectValue] = useState<number>(0);
  const [directUnit, setDirectUnit] = useState<GigaUnit>('Bytes');

  // Mini Quick Balance Calculator State (starts at 0)
  const [cuotaTotalGB, setCuotaTotalGB] = useState<number>(0);
  const [consumidoGB, setConsumidoGB] = useState<number>(0);

  // 2. CRM One Bucket Audit State (starts at 0, no dummy data)
  const [cuenta10000MB, setCuenta10000MB] = useState<number>(0);
  const [cuenta1601MB, setCuenta1601MB] = useState<number>(0);
  const [cuenta8Monto, setCuenta8Monto] = useState<number>(0);
  const [cuenta3Monto, setCuenta3Monto] = useState<number>(0);
  const [cuenta0Monto, setCuenta0Monto] = useState<number>(0);
  const [cuenta7Monto, setCuenta7Monto] = useState<number>(0);

  // 3. Raw Textarea State
  const [rawText, setRawText] = useState<string>('');
  const [parseLogs, setParseLogs] = useState<string[]>([]);

  // Direct conversion result
  const directGB = useMemo(() => {
    return convertUnitToGB(directValue, directUnit);
  }, [directValue, directUnit]);

  // Mini calculator result (Saldo Disponible)
  const saldoDisponibleResult = useMemo(() => {
    const total = Math.max(0, cuotaTotalGB || 0);
    const used = Math.max(0, consumidoGB || 0);
    const remaining = Math.max(0, Number((total - used).toFixed(2)));
    const percent = total > 0 ? Math.min(100, Math.max(0, (remaining / total) * 100)) : 0;
    const isExhausted = total > 0 && remaining <= 0;

    return {
      remaining,
      percent: Number(percent.toFixed(1)),
      isExhausted
    };
  }, [cuotaTotalGB, consumidoGB]);

  // Bucket audit result
  const bucketResult = useMemo(() => {
    return calculateBucketAudit({
      cuenta10000MB,
      cuenta1601MB,
      cuenta8Monto,
      cuenta3Monto,
      cuenta0Monto,
      cuenta7Monto
    });
  }, [cuenta10000MB, cuenta1601MB, cuenta8Monto, cuenta3Monto, cuenta0Monto, cuenta7Monto]);

  // Handle parsing raw text from CRM One
  const handleProcessRawText = () => {
    if (!rawText.trim()) return;
    const parsed = parseRawCRMText(rawText);
    const logs: string[] = [...parsed.notes];

    if (parsed.directBytesPUJ) {
      setDirectValue(parsed.directBytesPUJ);
      setDirectUnit('Bytes');
      logs.push(`Conversor: ${parsed.directBytesPUJ.toLocaleString('es-CL')} Bytes`);
    }

    if (parsed.baseValue > 0) {
      const baseInGB = convertUnitToGB(parsed.baseValue, parsed.baseUnit);
      setCuotaTotalGB(Number(baseInGB.toFixed(2)));
    }

    if (parsed.consumptionValue > 0) {
      const usedInGB = convertUnitToGB(parsed.consumptionValue, parsed.consumptionUnit);
      setConsumidoGB(Number(usedInGB.toFixed(2)));
    }

    if (parsed.bucketAudit) {
      if (parsed.bucketAudit.cuenta10000MB !== undefined) {
        setCuenta10000MB(parsed.bucketAudit.cuenta10000MB);
      }
      if (parsed.bucketAudit.cuenta1601MB !== undefined) {
        setCuenta1601MB(parsed.bucketAudit.cuenta1601MB);
      }
      if (parsed.bucketAudit.cuenta8Monto !== undefined) {
        setCuenta8Monto(parsed.bucketAudit.cuenta8Monto);
      }
      if (parsed.bucketAudit.cuenta3Monto !== undefined) {
        setCuenta3Monto(parsed.bucketAudit.cuenta3Monto);
      }
      if (parsed.bucketAudit.cuenta0Monto !== undefined) {
        setCuenta0Monto(parsed.bucketAudit.cuenta0Monto);
      }
      if (parsed.bucketAudit.cuenta7Monto !== undefined) {
        setCuenta7Monto(parsed.bucketAudit.cuenta7Monto);
      }
    }

    setParseLogs(logs);
  };

  const handleResetScreen = () => {
    setDirectValue(0);
    setDirectUnit('Bytes');
    setCuotaTotalGB(0);
    setConsumidoGB(0);
    setCuenta10000MB(0);
    setCuenta1601MB(0);
    setCuenta8Monto(0);
    setCuenta3Monto(0);
    setCuenta0Monto(0);
    setCuenta7Monto(0);
    setRawText('');
    setParseLogs([]);
  };

  return (
    <div className="space-y-3.5 w-full">
      {/* Top Bar with Dedicated Sky/Cyan Accent Border [Alt+4] */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 border-t-[3px] border-t-sky-600 px-3.5 py-2.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Binary className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Calculadora de Gigas y Cuentas CRM One
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                Alt+4
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Postpago PUJ vs Prepago Unidades Incluidas • Auditoría de Bolsas
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetScreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition cursor-pointer active:scale-[0.98]"
          title="Restablecer todos los campos a cero"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Limpiar</span>
        </button>
      </div>

      {/* Two Clean High-Density Columns with Strong Identity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* ========================================================================= */}
        {/* PANEL IZQUIERDO: 2. PREPAGO / CUENTA EXACTA: UNIDADES INCLUIDAS (6 cols) */}
        {/* Cabecera Gris Pizarra bg-slate-800 text-white                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            {/* Cabecera Pizarra */}
            <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  2. Prepago / Cuenta Exacta: Unidades Incluidas
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-200 border border-slate-600 font-semibold">
                Saldos en Cuentas
              </span>
            </div>

            <div className="p-3.5 space-y-3">
              <p className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                Ruta CRM One: <strong className="text-slate-800">Suscriptor → Flecha desplegable → Unidades Incluidas</strong>
              </p>

              {/* Vertical list of accounts with self-explanatory labels */}
              <div className="space-y-1.5 text-xs">
                {/* Cuenta 10000: Internet Libre */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/90">
                  <span className="text-slate-800 font-medium w-48 truncate" title="Internet Libre (Cta 10000 - MB)">
                    Internet Libre (Cta 10000 - MB)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={cuenta10000MB || ''}
                      onChange={e => setCuenta10000MB(Number(e.target.value))}
                      placeholder="Ej. 51200"
                      className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right font-mono text-slate-900 font-bold placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-mono w-6">MB</span>
                  </div>
                  <div className="w-24 text-right font-mono font-bold text-sky-700 text-xs">
                    {bucketResult.cuenta10000GB} GB
                  </div>
                </div>

                {/* Cuenta 1601: Redes Sociales */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/90">
                  <span className="text-slate-800 font-medium w-48 truncate" title="Redes Sociales (Cta 1601 - MB)">
                    Redes Sociales (Cta 1601 - MB)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={cuenta1601MB || ''}
                      onChange={e => setCuenta1601MB(Number(e.target.value))}
                      placeholder="Ej. 10240"
                      className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right font-mono text-slate-900 font-bold placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-mono w-6">MB</span>
                  </div>
                  <div className="w-24 text-right font-mono font-bold text-sky-700 text-xs">
                    {bucketResult.cuenta1601GB} GB
                  </div>
                </div>

                {/* Cuenta 8: Saldo Minutos */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/90">
                  <span className="text-slate-800 font-medium w-48 truncate" title="Saldo Minutos (Cta 8 - $ ÷ $68)">
                    Saldo Minutos (Cta 8 - $ ÷ $68)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={cuenta8Monto || ''}
                      onChange={e => setCuenta8Monto(Number(e.target.value))}
                      placeholder="Ej. 6800"
                      className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right font-mono text-slate-900 font-bold placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-mono w-6">$</span>
                  </div>
                  <div className="w-24 text-right font-mono font-bold text-slate-900 text-xs">
                    {bucketResult.availableMinutes} Min
                  </div>
                </div>

                {/* Cuenta 3: Saldo SMS */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/90">
                  <span className="text-slate-800 font-medium w-48 truncate" title="Saldo SMS (Cta 3 - $ ÷ $4)">
                    Saldo SMS (Cta 3 - $ ÷ $4)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={cuenta3Monto || ''}
                      onChange={e => setCuenta3Monto(Number(e.target.value))}
                      placeholder="Ej. 200"
                      className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right font-mono text-slate-900 font-bold placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-mono w-6">$</span>
                  </div>
                  <div className="w-24 text-right font-mono font-bold text-slate-900 text-xs">
                    {bucketResult.availableSMS} SMS
                  </div>
                </div>

                {/* Cuenta 0: Saldo Maestro Recarga */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/90">
                  <span className="text-slate-800 font-medium w-48 truncate" title="Saldo Maestro Recarga (Cta 0 - $)">
                    Saldo Maestro Recarga (Cta 0 - $)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={cuenta0Monto || ''}
                      onChange={e => setCuenta0Monto(Number(e.target.value))}
                      placeholder="Ej. 1500"
                      className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right font-mono text-slate-900 font-bold placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-mono w-6">$</span>
                  </div>
                  <div className="w-24 text-right font-mono font-bold text-slate-900 text-xs">
                    ${cuenta0Monto.toLocaleString('es-CL')}
                  </div>
                </div>

                {/* Cuenta 7: Saldo Voz Cuenta Exacta */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/90">
                  <span className="text-slate-800 font-medium w-48 truncate" title="Saldo Voz Cuenta Exacta (Cta 7 - $)">
                    Saldo Voz Cuenta Exacta (Cta 7 - $)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={cuenta7Monto || ''}
                      onChange={e => setCuenta7Monto(Number(e.target.value))}
                      placeholder="Ej. 500"
                      className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right font-mono text-slate-900 font-bold placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-mono w-6">$</span>
                  </div>
                  <div className="w-24 text-right font-mono font-bold text-slate-900 text-xs">
                    ${cuenta7Monto.toLocaleString('es-CL')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Result Summary Bar */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200">
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block">Total Datos</span>
                <span className="text-xs font-black text-sky-700">{bucketResult.totalDataGB} GB</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block">Minutos</span>
                <span className="text-xs font-black text-slate-900">{bucketResult.availableMinutes} Min</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block">Mensajes</span>
                <span className="text-xs font-black text-slate-900">{bucketResult.availableSMS} SMS</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 block">Saldo $</span>
                <span className="text-xs font-black text-slate-900">${bucketResult.totalCashBalance.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANEL DERECHO: 1. POSTPAGO: CONVERSOR PUJ (BYTES / MB → GB) (6 cols)     */}
        {/* Cabecera Azul Oscuro bg-blue-950 text-white                               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-3.5">
          {/* Sub-card 1: Conversor PUJ */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-sm">
            {/* Cabecera Azul Profundo */}
            <div className="bg-blue-950 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  1. Postpago: Conversor PUJ (Bytes / MB → GB)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900 text-sky-200 border border-blue-800 font-semibold">
                Política Uso Justo
              </span>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                Ruta CRM One: <strong className="text-slate-800">Suscriptor → Política de Uso Justo (PUJ)</strong>
              </p>

              {/* Input Conversor Directo */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                <div className="sm:col-span-5">
                  <input
                    type="number"
                    value={directValue || ''}
                    onChange={e => setDirectValue(Number(e.target.value))}
                    placeholder="Ej. 107374182400"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={directUnit}
                    onChange={e => setDirectUnit(e.target.value as GigaUnit)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 font-semibold focus:border-sky-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Bytes">Bytes (PUJ / 1024³)</option>
                    <option value="MB">MB (Unidades / 1024)</option>
                    <option value="KB">KB (Kilobytes / 1024²)</option>
                    <option value="GB">GB (Gigabytes)</option>
                  </select>
                </div>

                <div className="sm:col-span-3 text-right">
                  <CopyButton
                    textToCopy={`${directGB.toFixed(2)} GB`}
                    label="Copiar GB"
                    variant="secondary"
                    size="sm"
                  />
                </div>
              </div>

              {/* Direct Result KPI Táctil de Alto Contraste */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between font-mono text-white shadow-sm">
                <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Resultado:</span>
                <span className="text-2xl font-black text-sky-400">
                  {directGB.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} GB
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  = {(directGB * 1024).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB
                </span>
              </div>

              {/* Mini Calculadora Rápida de Saldo Disponible */}
              <div className="bg-slate-50 border border-slate-200/90 p-3.5 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Mini Calculadora: Saldo Disponible
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Cuota Total - Consumido = Restante
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  {/* Cuota Total (GB) */}
                  <div className="sm:col-span-5 space-y-0.5">
                    <label className="text-[9px] uppercase font-semibold text-slate-500 block truncate">
                      Cuota Total Plan (GB)
                    </label>
                    <input
                      type="number"
                      value={cuotaTotalGB || ''}
                      onChange={e => setCuotaTotalGB(Number(e.target.value))}
                      placeholder="Ej. 500"
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-1 text-center text-slate-400 font-bold text-sm hidden sm:block">
                    -
                  </div>

                  {/* Consumido (GB) */}
                  <div className="sm:col-span-6 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] uppercase font-semibold text-slate-500 block truncate">
                        Consumido (GB)
                      </label>
                      {directGB > 0 && (
                        <button
                          type="button"
                          onClick={() => setConsumidoGB(Number(directGB.toFixed(2)))}
                          className="text-[9px] font-mono text-sky-700 hover:text-sky-900 underline cursor-pointer"
                          title="Usar valor convertido arriba"
                        >
                          ← Usar conversor
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      value={consumidoGB || ''}
                      onChange={e => setConsumidoGB(Number(e.target.value))}
                      placeholder="Ej. 120"
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Saldo Restante KPI Result */}
                <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 font-mono shadow-xs">
                  <span className="text-[11px] font-bold text-slate-700">Gigas Restantes:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${
                      saldoDisponibleResult.isExhausted ? 'text-red-700' : 'text-emerald-700'
                    }`}>
                      {saldoDisponibleResult.remaining.toLocaleString('es-CL', { minimumFractionDigits: 2 })} GB
                    </span>
                    {cuotaTotalGB > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        ({saldoDisponibleResult.percent}% disp.)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-card 2: Pegado Texto CRM One */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pegado Rápido Texto CRM One
              </span>
              <button
                type="button"
                onClick={handleProcessRawText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DA291C] hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Procesar y Autollenar</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Pega texto desde 'Productos Asignados', 'PUJ' o 'Saldos' (ej: Cuenta 10000: 51200 MB, Cuenta 8: $6800, o 107374182400 Bytes)..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:border-sky-600 focus:outline-none resize-none"
            />

            {parseLogs.length > 0 && (
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-[10px] text-emerald-900 flex flex-wrap gap-x-3 gap-y-1 items-center">
                <span className="text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  {parseLogs.length} campo(s):
                </span>
                {parseLogs.map((log, idx) => (
                  <span key={idx} className="font-mono text-emerald-950">
                    {log}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
