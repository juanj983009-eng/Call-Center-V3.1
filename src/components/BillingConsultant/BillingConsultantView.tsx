import React, { useState, useMemo, useRef } from 'react';
import {
  BILLING_CYCLES,
  BILLING_RULES,
  calculateCycleDifferential,
  formatCLP,
  getCycleByCode
} from '../../domain/billingCycle';
import type { BillingCycleItem } from '../../types';
import {
  RotateCcw,
  BookOpen,
  X,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  CreditCard,
  Zap,
  CalendarDays,
  Calculator,
  Receipt
} from 'lucide-react';

function formatDateToLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTodayLocalISO(): string {
  return formatDateToLocalISO(new Date());
}

function getTomorrowLocalISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateToLocalISO(d);
}

type BillViewMode = 'SEPARADAS' | 'COMBINADA';

export const BillingConsultantView: React.FC = () => {
  // Top Section: Selected Cycle for Consultation
  const [selectedCycleCode, setSelectedCycleCode] = useState<number>(2);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Bottom Section: Cycle Change Simulator State
  const [oldCycleCode, setOldCycleCode] = useState<number>(12);
  const [newCycleCode, setNewCycleCode] = useState<number>(21);
  const [changeDateStr, setChangeDateStr] = useState<string>(() => getTodayLocalISO());
  const [cargoFijo, setCargoFijo] = useState<number>(9990);
  const [hasLeasedDevice, setHasLeasedDevice] = useState<boolean>(false);
  const [deviceInstallment, setDeviceInstallment] = useState<number>(15000);
  const [billViewMode, setBillViewMode] = useState<BillViewMode>('SEPARADAS');

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Consulted Cycle
  const currentCycle: BillingCycleItem = useMemo(() => {
    return getCycleByCode(selectedCycleCode) || BILLING_CYCLES[0];
  }, [selectedCycleCode]);

  // Differential Calculation Result
  const oldCycleItem = useMemo(() => getCycleByCode(oldCycleCode) || BILLING_CYCLES[0], [oldCycleCode]);
  const newCycleItem = useMemo(() => getCycleByCode(newCycleCode) || BILLING_CYCLES[10], [newCycleCode]);

  const diffResult = useMemo(() => {
    return calculateCycleDifferential({
      oldCycleDay: oldCycleItem.cycleDay,
      newCycleDay: newCycleItem.cycleDay,
      changeDateStr,
      cargoFijo,
      hasLeasedDevice,
      deviceInstallment
    });
  }, [oldCycleItem, newCycleItem, changeDateStr, cargoFijo, hasLeasedDevice, deviceInstallment]);

  // Quick Date Shortcut Calculations
  const todayISO = useMemo(() => getTodayLocalISO(), []);
  const tomorrowISO = useMemo(() => getTomorrowLocalISO(), []);

  const { oldCycleStartISO, oldCycleEndISO } = useMemo(() => {
    const now = new Date();
    const todayDay = now.getDate();
    const y = now.getFullYear();
    const m = now.getMonth();

    // Start date of active period
    let startDate: Date;
    if (todayDay >= oldCycleItem.cycleDay) {
      startDate = new Date(y, m, oldCycleItem.cycleDay);
    } else {
      const prevMonthDays = new Date(y, m, 0).getDate();
      const clamped = Math.min(oldCycleItem.cycleDay, prevMonthDays);
      startDate = new Date(y, m - 1, clamped);
    }

    // End date of active period
    let endDate: Date;
    if (todayDay >= oldCycleItem.cycleDay) {
      const nextMonthDays = new Date(y, m + 2, 0).getDate();
      const targetDay = oldCycleItem.cycleDay === 1 ? nextMonthDays : oldCycleItem.cycleDay - 1;
      const clamped = Math.min(targetDay, nextMonthDays);
      endDate = new Date(y, m + 1, clamped);
    } else {
      const thisMonthDays = new Date(y, m + 1, 0).getDate();
      const targetDay = oldCycleItem.cycleDay === 1 ? thisMonthDays : oldCycleItem.cycleDay - 1;
      const clamped = Math.min(targetDay, thisMonthDays);
      endDate = new Date(y, m, clamped);
    }

    return {
      oldCycleStartISO: formatDateToLocalISO(startDate),
      oldCycleEndISO: formatDateToLocalISO(endDate)
    };
  }, [oldCycleItem.cycleDay]);

  const handleOpenDatePicker = () => {
    try {
      dateInputRef.current?.showPicker?.();
    } catch {
      dateInputRef.current?.focus();
    }
  };

  const handleResetScreen = () => {
    setSelectedCycleCode(2);
    setOldCycleCode(12);
    setNewCycleCode(21);
    setChangeDateStr(getTodayLocalISO());
    setCargoFijo(9990);
    setHasLeasedDevice(false);
    setDeviceInstallment(15000);
    setBillViewMode('SEPARADAS');
  };

  return (
    <div className="space-y-3.5 w-full">
      {/* Top Bar with Dedicated Indigo Accent Border [Alt+3] */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 border-t-[3px] border-t-indigo-600 px-3.5 py-2.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Ciclos de Facturación y Cobro
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                Alt+3
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              15 Ciclos Oficiales Móvil • Consulta y Simulador de Proporcionales
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Rules button */}
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-[0.98] ${
              showRules
                ? 'bg-slate-100 text-slate-900 border-slate-300 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Reglas de Ciclo (5)</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetScreen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition cursor-pointer active:scale-[0.98]"
            title="Restablecer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Collapsible Rules Drawer */}
      {showRules && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs space-y-3 shadow-md animate-fade-slide">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
              Reglas Oficiales de Facturación y Ciclos Claro Chile
            </span>
            <button
              onClick={() => setShowRules(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-slate-600">
            {BILLING_RULES.map((rule, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-mono text-slate-500 font-bold block mb-0.5">Regla {idx + 1}</span>
                <span className="leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECCIÓN SUPERIOR (PROTAGONISTA): CONSULTOR DE CICLOS      */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-sm">
        {/* Cabecera del Panel de Consulta */}
        <div className="bg-slate-50/80 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Consulta de Ficha Oficial de Ciclo
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              Ciclo {currentCycle.code} Seleccionado
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Día de corte base: {currentCycle.cycleDay} de cada mes
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Barra Horizontal con los 15 Ciclos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Selecciona un Ciclo para desplegar su ficha:</span>
              <span className="text-slate-400 font-mono">15 ciclos en red</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {BILLING_CYCLES.map(c => {
                const isSelected = selectedCycleCode === c.code;
                const is81 = c.code === 81;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setSelectedCycleCode(c.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shrink-0 cursor-pointer flex items-center gap-1 border active:scale-[0.98] ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : is81
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>Ciclo {c.code}</span>
                    {is81 && (
                      <span className={`text-[9px] font-sans px-1.5 py-0.2 rounded font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Cta Cte
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grilla Limpia de 5 Tarjetas KPI del Ciclo Seleccionado */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* KPI 1: Período de Consumo */}
            <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Período de Consumo</span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900">
                {currentCycle.period}
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                Tráfico y cuota mensual
              </span>
            </div>

            {/* KPI 2: Emisión Boleta */}
            <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Emisión Boleta</span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900">
                {currentCycle.issueDay}
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                Facturación a mes vencido
              </span>
            </div>

            {/* KPI 3: Fecha Vencimiento */}
            <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Fecha Vencimiento</span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900">
                {currentCycle.dueDay}
              </div>
              <span className="text-[10px] text-slate-500 block truncate font-medium">
                6 días gracia post-vencimiento
              </span>
            </div>

            {/* KPI 4: Fecha Corte */}
            <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DA291C]" />
                <span>Fecha Corte</span>
              </div>
              <div className="text-xs font-mono font-bold text-[#DA291C]">
                {currentCycle.cutOffDay}
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                Suspensión por no pago
              </span>
            </div>

            {/* KPI 5: Carga Cta Cte / Bolsas */}
            <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Carga Cta Cte / Bolsas</span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 truncate" title={currentCycle.accountLoadOffset}>
                {currentCycle.accountLoadOffset}
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                Renovación de saldo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN INFERIOR: SIMULADOR INTELIGENTE DE CAMBIO DE CICLO Y PROPORCIONAL */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-slate-300 rounded-xl shadow-sm overflow-hidden">
        {/* Cabecera Oscura y Robusta para el Simulador */}
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              2. Simulador de Cambio de Ciclo: Boleta Chica Proporcional
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
              Base Comercial 30 Días
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-300">
            Valor día plan: {diffResult.dailyRate ? `${formatCLP(diffResult.dailyRate)}/día` : ''}
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Formulario de Controles Compactos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-start text-xs">
            {/* Control 1: Ciclo Anterior (3 cols) */}
            <div className="lg:col-span-3 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Ciclo Anterior (Actual)
              </label>
              <select
                value={oldCycleCode}
                onChange={e => setOldCycleCode(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 focus:outline-none cursor-pointer"
              >
                {BILLING_CYCLES.map(c => (
                  <option key={c.code} value={c.code}>
                    Ciclo {c.code} (Día {c.cycleDay}) {c.code === 81 ? '[Cta Cte]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Control 2: Ciclo Nuevo (3 cols) */}
            <div className="lg:col-span-3 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                <span>Ciclo Nuevo (Destino)</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </label>
              <select
                value={newCycleCode}
                onChange={e => setNewCycleCode(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 focus:outline-none cursor-pointer"
              >
                {BILLING_CYCLES.map(c => (
                  <option key={c.code} value={c.code}>
                    Ciclo {c.code} (Día {c.cycleDay}) {c.code === 81 ? '[Cta Cte]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Control 3: Fecha de Solicitud (4 cols) con Alto Contraste y Atajos de 1 Clic */}
            <div className="lg:col-span-4 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Fecha de Solicitud / Cambio
                </label>
                <span className="text-[10px] font-mono text-slate-400 font-medium">
                  {changeDateStr ? `${changeDateStr.split('-')[2]}/${changeDateStr.split('-')[1]}` : ''}
                </span>
              </div>

              <div
                onClick={handleOpenDatePicker}
                className="relative cursor-pointer group"
                title="Clic para abrir selector de fecha"
              >
                <input
                  ref={dateInputRef}
                  type="date"
                  value={changeDateStr}
                  onChange={e => setChangeDateStr(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 focus:outline-none cursor-pointer [color-scheme:light]"
                />
              </div>

              {/* Barra compacta de 4 botones rápidos (pills) */}
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setChangeDateStr(todayISO)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition cursor-pointer border active:scale-[0.98] ${
                    changeDateStr === todayISO
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title={`Hoy (${todayISO.split('-')[2]}/${todayISO.split('-')[1]})`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setChangeDateStr(tomorrowISO)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition cursor-pointer border active:scale-[0.98] ${
                    changeDateStr === tomorrowISO
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title={`Mañana (${tomorrowISO.split('-')[2]}/${tomorrowISO.split('-')[1]})`}
                >
                  Mañana
                </button>
                <button
                  type="button"
                  onClick={() => setChangeDateStr(oldCycleStartISO)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition cursor-pointer border active:scale-[0.98] ${
                    changeDateStr === oldCycleStartISO
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title={`Inicio Ciclo ${oldCycleItem.code} (${oldCycleStartISO.split('-')[2]}/${oldCycleStartISO.split('-')[1]})`}
                >
                  Inicio Ciclo Ant.
                </button>
                <button
                  type="button"
                  onClick={() => setChangeDateStr(oldCycleEndISO)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition cursor-pointer border active:scale-[0.98] ${
                    changeDateStr === oldCycleEndISO
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title={`Cierre Ciclo ${oldCycleItem.code} (${oldCycleEndISO.split('-')[2]}/${oldCycleEndISO.split('-')[1]})`}
                >
                  Cierre Ciclo Ant.
                </button>
              </div>
            </div>

            {/* Control 4: Cargo Fijo Plan (2 cols) */}
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Cargo Fijo Plan ($)
              </label>
              <input
                type="number"
                value={cargoFijo || ''}
                onChange={e => setCargoFijo(Number(e.target.value))}
                placeholder="9990"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 focus:outline-none"
              />
            </div>
          </div>

          {/* Toggle Equipo Arriendo & Cuota Adicional */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-100 p-3.5 rounded-xl border border-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasLeasedDevice}
                onChange={e => setHasLeasedDevice(e.target.checked)}
                className="accent-indigo-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800">
                ¿Línea tiene equipo en arriendo?
              </span>
            </label>

            {hasLeasedDevice && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono">• Cuota de Arriendo: $</span>
                <input
                  type="number"
                  value={deviceInstallment || ''}
                  onChange={e => setDeviceInstallment(Number(e.target.value))}
                  placeholder="15000"
                  className="w-28 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:outline-none"
                />
                <span className="text-[11px] text-amber-800 font-mono font-medium">
                  (Aviso: Adelantará 1 cuota completa del equipo en la boleta)
                </span>
              </div>
            )}
          </div>

          {/* Panel de Resultados en Tiempo Real (12 Cols Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
            {/* Cronología de Fechas y Días (7 cols) */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-300 p-4 rounded-xl space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Línea de Tiempo Operativa de Ajuste
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Período puente: <strong className="text-indigo-700 font-bold">{diffResult.bridgeDays} días de cobro</strong>
                </span>
              </div>

              {/* Stepper horizontal con alto contraste */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 border border-slate-300 p-3 rounded-lg font-mono text-center shadow-xs">
                {/* Nodo 1: Cierre Último Ciclo Ant. */}
                <div className="bg-slate-100 border border-slate-300 text-slate-800 rounded-lg p-2 space-y-0.5">
                  <span className="text-[9px] uppercase text-slate-500 font-bold block">1. Cierre Ciclo Ant.</span>
                  <span className="text-xs font-bold text-slate-900 block">{diffResult.oldCycleEndFormatted}</span>
                  <span className="text-[9px] text-slate-500 block">Día {oldCycleItem.cycleDay === 1 ? 'fin mes' : oldCycleItem.cycleDay - 1}</span>
                </div>

                {/* Nodo 2: Período Boleta Chica (Puente - Destacado) */}
                <div className="bg-blue-50 border-2 border-blue-600 text-blue-950 shadow-sm rounded-lg p-2 space-y-0.5">
                  <span className="text-[9px] uppercase text-blue-700 font-black block">2. Boleta Chica</span>
                  <span className="text-xs font-black text-blue-950 block">{diffResult.bridgePeriodFormatted}</span>
                  <span className="text-[10px] text-blue-700 font-bold block">+{diffResult.bridgeDays} días puente</span>
                </div>

                {/* Nodo 3: Inicio Nuevo Ciclo */}
                <div className="bg-emerald-50 border border-emerald-400 text-emerald-950 rounded-lg p-2 space-y-0.5">
                  <span className="text-[9px] uppercase text-emerald-700 font-bold block">3. Inicio Nuevo Ciclo</span>
                  <span className="text-xs font-bold text-emerald-800 block">{diffResult.newCycleStartFormatted}</span>
                  <span className="text-[9px] text-emerald-600 block">Día {newCycleItem.cycleDay}</span>
                </div>
              </div>

              {/* Desglose de días en cajas con fondo slate-100 */}
              <div className="grid grid-cols-2 gap-2.5 text-[11px] text-slate-600 font-mono">
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 shadow-xs space-y-0.5">
                  <span className="text-[10px] text-slate-500 block font-sans font-semibold">Último Ciclo Anterior</span>
                  <span className="text-xs font-bold text-slate-900 block">Cierra el {diffResult.oldCycleEndFormatted}</span>
                  <span className="text-[10px] text-slate-500 block">
                    Factura normal de {formatCLP(cargoFijo)}
                  </span>
                </div>

                <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 shadow-xs space-y-0.5">
                  <span className="text-[10px] text-indigo-700 block font-sans font-semibold">Días Puente Boleta Chica</span>
                  <span className="text-xs font-bold text-indigo-800 block">+{diffResult.bridgeDays} días de ajuste</span>
                  <span className="text-[10px] text-slate-500 block">
                    Proporcional: {formatCLP(diffResult.proportionalAdjustment)} ({formatCLP(diffResult.dailyRate)}/día)
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Principal: Panel de Boleta en Alto Contraste (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between shadow-sm space-y-3.5">
              <div>
                {/* Switch en la cabecera */}
                <div className="flex items-center justify-between gap-1 pb-2.5 border-b border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    Modo Facturación:
                  </span>
                  <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-slate-700 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setBillViewMode('SEPARADAS')}
                      className={`px-2.5 py-1 rounded transition cursor-pointer ${
                        billViewMode === 'SEPARADAS'
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      2 Boletas (Estándar)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillViewMode('COMBINADA')}
                      className={`px-2.5 py-1 rounded transition cursor-pointer ${
                        billViewMode === 'COMBINADA'
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      1 Boleta (Excepcional)
                    </button>
                  </div>
                </div>

                {/* KPI Principal según Modo */}
                {billViewMode === 'SEPARADAS' ? (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
                      <Receipt className="w-4 h-4 text-indigo-400" />
                      <span>Boleta Chica (Proporcional)</span>
                    </div>

                    <div className="text-3xl font-black font-mono text-white tracking-tight">
                      {formatCLP(diffResult.smallProportionalBill)}
                    </div>

                    <div className="text-[11px] text-slate-300 font-mono leading-relaxed pt-1">
                      Solo los <strong className="text-white font-bold">{diffResult.bridgeDays} días puente</strong> ({diffResult.bridgePeriodFormatted}) × {formatCLP(diffResult.dailyRate)}/día
                      {diffResult.hasLeasedDevice && ` + cuota arriendo ${formatCLP(diffResult.deviceInstallment)}`}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>Boleta Combinada (Cargo + Proporcional)</span>
                    </div>

                    <div className="text-3xl font-black font-mono text-white tracking-tight">
                      {formatCLP(diffResult.combinedBill)}
                    </div>

                    <div className="text-[11px] text-slate-300 font-mono leading-relaxed pt-1">
                      {formatCLP(cargoFijo)} (mes completo) + {formatCLP(diffResult.proportionalAdjustment)} ({diffResult.bridgeDays} días: {diffResult.bridgePeriodFormatted})
                      {diffResult.hasLeasedDevice && ` + arriendo ${formatCLP(diffResult.deviceInstallment)}`}
                    </div>
                  </div>
                )}
              </div>

              {/* Tarjeta Secundaria Informativa */}
              <div className="pt-2.5 border-t border-slate-800">
                {billViewMode === 'SEPARADAS' ? (
                  <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg p-3 text-xs space-y-1 font-sans">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-300 text-[11px]">Boleta Normal Ciclo Anterior:</span>
                      <span className="text-white font-bold">{formatCLP(cargoFijo)}</span>
                    </div>
                    <p className="text-[11px] text-indigo-200 leading-snug">
                      El cliente recibirá 2 boletas ese mes: su última boleta normal del ciclo anterior + esta boleta chica de ajuste para igualar al nuevo ciclo.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg p-3 text-xs space-y-1 font-sans">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-300 text-[11px]">Factura Consolidada:</span>
                      <span className="text-white font-bold">{formatCLP(diffResult.combinedBill)}</span>
                    </div>
                    <p className="text-[11px] text-amber-200 leading-snug">
                      Factura consolidada: el sistema une excepcionalmente el cargo fijo base del ciclo anterior con los días de transición al nuevo ciclo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
