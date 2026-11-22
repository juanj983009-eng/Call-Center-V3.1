import React, { useState, useMemo } from 'react';
import {
  PLANS,
  RESTRICTIONS,
  compareTwoPlans
} from '../../domain/planComparison';
import type { PlanItem, PlanCategory } from '../../types';
import {
  ShieldAlert,
  RotateCcw,
  BookOpen,
  X,
  AlertTriangle,
  ArrowLeftRight,
  Search,
  Wifi,
  Phone,
  MessageSquare,
  Globe,
  Radio,
  Tv
} from 'lucide-react';

const CATEGORY_PILLS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'Vigente Nov 2026', label: 'Nov 2026' },
  { id: 'Líneas Adicionales', label: 'Adicionales' },
  { id: 'Planes GGTT', label: 'GGTT' },
  { id: 'Parrilla Anterior (07-2023 / 10-2024)', label: 'Anteriores' },
  { id: 'Order Entry / Riesgo', label: 'Order Entry' },
] as const;

export const PlanComparatorView: React.FC = () => {
  // Mode switcher: Default is 'catalog', 'compare' is secondary
  const [mode, setMode] = useState<'catalog' | 'compare'>('catalog');
  const [showRestrictions, setShowRestrictions] = useState<boolean>(false);

  // --- Vista 1: Catálogo y Ficha Individual ---
  const [selectedPlanId, setSelectedPlanId] = useState<string>(PLANS[0].id);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<'ALL' | PlanCategory>('ALL');

  // --- Vista 2: Comparador Lado a Lado ---
  const [planACategoryFilter, setPlanACategoryFilter] = useState<string>('ALL');
  const [planBCategoryFilter, setPlanBCategoryFilter] = useState<string>('ALL');
  const [planAId, setPlanAId] = useState<string>('plan-max-l-antiguo');
  const [planBId, setPlanBId] = useState<string>('plan-800-libre-2026');
  const [hasClaroUp, setHasClaroUp] = useState<boolean>(false);

  // Filtered catalog list for Vista 1
  const filteredCatalogPlans = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return PLANS.filter(p => {
      const matchCat = catalogCategory === 'ALL' || p.category === catalogCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.crmCode.toLowerCase().includes(q) ||
        p.modality.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [catalogSearch, catalogCategory]);

  const activePlan: PlanItem = useMemo(() => {
    return PLANS.find(p => p.id === selectedPlanId) || filteredCatalogPlans[0] || PLANS[0];
  }, [selectedPlanId, filteredCatalogPlans]);

  // Comparison logic for Vista 2
  const comparison = useMemo(() => {
    return compareTwoPlans(planAId, planBId, hasClaroUp);
  }, [planAId, planBId, hasClaroUp]);

  // Options for Plan A select based on category mini-filter
  const plansForA = useMemo(() => {
    if (planACategoryFilter === 'ALL') return PLANS;
    return PLANS.filter(p => p.category === planACategoryFilter);
  }, [planACategoryFilter]);

  // Options for Plan B select based on category mini-filter
  const plansForB = useMemo(() => {
    if (planBCategoryFilter === 'ALL') return PLANS;
    return PLANS.filter(p => p.category === planBCategoryFilter);
  }, [planBCategoryFilter]);

  const handleSwapPlans = () => {
    const temp = planAId;
    setPlanAId(planBId);
    setPlanBId(temp);
  };

  const handleCompareThisPlan = (planId: string) => {
    setPlanAId(planId);
    setPlanACategoryFilter('ALL');
    setMode('compare');
  };

  const handleResetScreen = () => {
    setCatalogSearch('');
    setCatalogCategory('ALL');
    setSelectedPlanId(PLANS[0].id);
    setPlanACategoryFilter('ALL');
    setPlanBCategoryFilter('ALL');
    setPlanAId('plan-max-l-antiguo');
    setPlanBId('plan-800-libre-2026');
    setHasClaroUp(false);
  };

  // Build comparison rows with dynamic highlight logic
  const comparisonRows = useMemo(() => {
    // 1. Cargo normal logic
    let cargoStatus: 'better' | 'worse' | 'neutral' = 'neutral';
    let cargoNote: string | undefined = undefined;

    if (comparison.claroUpWarning) {
      cargoStatus = 'worse';
      cargoNote = 'Bloqueo Claro Up';
    } else if (comparison.planB.normalPrice < comparison.planA.normalPrice) {
      cargoStatus = 'better';
      cargoNote = `-$${(comparison.planA.normalPrice - comparison.planB.normalPrice).toLocaleString('es-CL')}/mes`;
    } else if (comparison.planB.normalPrice > comparison.planA.normalPrice) {
      cargoStatus = 'worse';
      cargoNote = `+$${(comparison.planB.normalPrice - comparison.planA.normalPrice).toLocaleString('es-CL')}/mes`;
    }

    // 2. Gigas alta velocidad logic
    let gbStatus: 'better' | 'worse' | 'neutral' = 'neutral';
    let gbNote: string | undefined = undefined;

    if (comparison.planB.gbHighSpeed > comparison.planA.gbHighSpeed) {
      gbStatus = 'better';
      gbNote = `+${comparison.planB.gbHighSpeed - comparison.planA.gbHighSpeed} GB`;
    } else if (comparison.planB.gbHighSpeed < comparison.planA.gbHighSpeed) {
      gbStatus = 'worse';
      gbNote = `-${comparison.planA.gbHighSpeed - comparison.planB.gbHighSpeed} GB`;
    }

    return [
      {
        attribute: 'Cargo Normal',
        valA: `$${comparison.planA.normalPrice.toLocaleString('es-CL')}`,
        valB: `$${comparison.planB.normalPrice.toLocaleString('es-CL')}`,
        status: cargoStatus,
        noteB: cargoNote
      },
      {
        attribute: 'Promo Portabilidad',
        valA: comparison.planA.promoPrice !== null && comparison.planA.promoPrice < comparison.planA.normalPrice
          ? `$${comparison.planA.promoPrice.toLocaleString('es-CL')} (${comparison.planA.promoDuration})`
          : 'Sin promo',
        valB: comparison.planB.promoPrice !== null && comparison.planB.promoPrice < comparison.planB.normalPrice
          ? `$${comparison.planB.promoPrice.toLocaleString('es-CL')} (${comparison.planB.promoDuration})`
          : 'Tarifa normal',
        status: 'neutral' as const
      },
      {
        attribute: 'Gigas Alta Velocidad',
        valA: `${comparison.planA.gbHighSpeed} GB`,
        valB: `${comparison.planB.gbHighSpeed} GB`,
        status: gbStatus,
        noteB: gbNote
      },
      {
        attribute: 'Regla PUJ (Baja Vel.)',
        valA: comparison.planA.pujRule,
        valB: comparison.planB.pujRule,
        status: 'neutral' as const
      },
      {
        attribute: 'Minutos Nacionales',
        valA: comparison.planA.minutes,
        valB: comparison.planB.minutes,
        status: 'neutral' as const
      },
      {
        attribute: 'Mensajes SMS',
        valA: `${comparison.planA.sms} SMS`,
        valB: `${comparison.planB.sms} SMS`,
        status: 'neutral' as const
      },
      {
        attribute: 'Roaming Internacional',
        valA: comparison.planA.roaming,
        valB: comparison.planB.roaming,
        status: 'neutral' as const
      },
      {
        attribute: 'LDI (Carrier 171)',
        valA: comparison.planA.ldi,
        valB: comparison.planB.ldi,
        status: 'neutral' as const
      },
      {
        attribute: 'Beneficios OTT',
        valA: comparison.planA.ott,
        valB: comparison.planB.ott,
        status: 'neutral' as const
      },
      {
        attribute: 'Código CRM / Modalidad',
        valA: `${comparison.planA.crmCode} (${comparison.planA.modality})`,
        valB: `${comparison.planB.crmCode} (${comparison.planB.modality})`,
        status: 'neutral' as const
      }
    ];
  }, [comparison]);

  return (
    <div className="space-y-4 w-full">
      {/* 1. BARRA SUPERIOR DE CONTROLES */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-4">
        {/* Izquierda (Selector de Modo): Dos botones tipo pestaña */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('catalog')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition cursor-pointer active:scale-[0.98] ${
              mode === 'catalog'
                ? 'bg-[#DA291C] text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            1. Ficha de Plan (Catálogo)
          </button>
          <button
            type="button"
            onClick={() => setMode('compare')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition cursor-pointer active:scale-[0.98] ${
              mode === 'compare'
                ? 'bg-[#DA291C] text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            2. Comparar 2 Planes
          </button>
        </div>

        {/* Derecha: Botón Restricciones y Limpiar */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowRestrictions(!showRestrictions)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-[0.98] ${
              showRestrictions
                ? 'bg-slate-800 text-white border-slate-600 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 shadow-2xs'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Restricciones ({RESTRICTIONS.length})</span>
          </button>

          <button
            type="button"
            onClick={handleResetScreen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition cursor-pointer active:scale-[0.98]"
            title="Restablecer filtros y selección"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Collapsible Restrictions Drawer */}
      {showRestrictions && (
        <div className="bg-white border-2 border-slate-200 p-4 rounded-xl text-xs space-y-3 shadow-md animate-fade-slide">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
              Restricciones Operativas en Cambio de Plan
            </span>
            <button
              onClick={() => setShowRestrictions(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px] text-slate-600">
            {RESTRICTIONS.map((rule, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex items-start gap-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{idx + 1}.</span>
                <span className="leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. VISTA POR DEFECTO (mode === 'catalog'): CATÁLOGO + FICHA */}
      {/* ======================================================== */}
      {mode === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Columna Izquierda (lg:col-span-4) — Lista Compacta de Planes */}
          <div className="lg:col-span-4 bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Buscador de texto */}
            <div className="bg-slate-50/90 p-2.5 border-b border-slate-200/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Buscar plan, código CRM..."
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Píldoras clicables compactas por categoría (Reemplazo del <select>) */}
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-100/70 border-b border-slate-200/80">
              {CATEGORY_PILLS.map(pill => {
                const isSelected = catalogCategory === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setCatalogCategory(pill.id as 'ALL' | PlanCategory)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold shadow-2xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Lista Scrolleable Compacta (px-3 py-2, 1 sola línea) */}
            <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-200 flex-1">
              {filteredCatalogPlans.map(p => {
                const isSelected = activePlan.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`w-full text-left px-3 py-2 transition cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99] ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-l-[#DA291C] font-semibold text-slate-900'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1 truncate">
                      <span className="block truncate text-xs font-semibold text-slate-800">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono block truncate">
                        {p.gbHighSpeed} GB • {p.category.split(' ')[0]}
                      </span>
                    </div>

                    <span
                      className={`font-mono text-xs font-bold shrink-0 ${
                        isSelected ? 'text-blue-700' : 'text-slate-900'
                      }`}
                    >
                      ${p.normalPrice.toLocaleString('es-CL')}
                    </span>
                  </button>
                );
              })}

              {filteredCatalogPlans.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No se encontraron planes con los filtros aplicados.
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha (lg:col-span-8) — Ficha Técnica del Plan */}
          <div className="lg:col-span-8 shadow-sm rounded-xl overflow-hidden">
            {/* Cabecera Azul Marino con Botón Rápido "Comparar este plan ⇄" */}
            <div className="bg-slate-900 text-white p-6 rounded-t-xl space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {activePlan.name}
                    </h2>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold">
                      {activePlan.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-300 font-mono flex-wrap">
                    <span className="bg-white/10 px-2.5 py-0.5 rounded border border-white/10 font-bold text-white">
                      {activePlan.modality}
                    </span>
                    <span>Código CRM One: <strong className="text-blue-300 font-bold">{activePlan.crmCode}</strong></span>
                  </div>
                </div>

                {/* Botón rápido "Comparar este plan ⇄" */}
                <button
                  type="button"
                  onClick={() => handleCompareThisPlan(activePlan.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer active:scale-[0.98] shadow-xs shrink-0"
                  title="Cargar como Plan Origen en la herramienta de comparación"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Comparar este plan ⇄</span>
                </button>
              </div>

              {/* 2 Cajas de precio lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 font-mono">
                {/* 1. Caja Cargo Normal */}
                <div className="bg-slate-800 border border-slate-700 p-3.5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      CARGO NORMAL
                    </span>
                    <span className="text-2xl font-black text-white">
                      ${activePlan.normalPrice.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    / mes (sin promo)
                  </span>
                </div>

                {/* 2. Caja Oferta Promocional */}
                <div className="bg-blue-950 border border-blue-700 p-3.5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-300 block tracking-wider">
                      OFERTA PROMOCIONAL
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      {activePlan.promoPrice !== null && activePlan.promoPrice < activePlan.normalPrice
                        ? `$${activePlan.promoPrice.toLocaleString('es-CL')}`
                        : `$${activePlan.normalPrice.toLocaleString('es-CL')}`}
                    </span>
                  </div>
                  <span className="text-xs text-blue-200 font-semibold bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                    {activePlan.promoDuration}
                  </span>
                </div>
              </div>
            </div>

            {/* Cuerpo Blanco con 6 tarjetas de especificaciones en relieve */}
            <div className="bg-white border-x-2 border-b-2 border-slate-200 p-5 rounded-b-xl grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* 1. INTERNET + PUJ */}
              <div className="bg-white border border-slate-200 hover:border-blue-300 transition-colors p-4 rounded-xl shadow-xs flex items-start gap-3.5">
                <div className="bg-blue-50 text-blue-700 p-2.5 rounded-lg shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Internet + PUJ
                  </span>
                  <div className="text-base font-black font-mono text-blue-700">
                    {activePlan.gbHighSpeed} GB <span className="text-xs text-slate-600 font-normal">Alta Velocidad</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    <strong className="text-slate-800">Regla PUJ:</strong> {activePlan.pujRule}
                  </p>
                </div>
              </div>

              {/* 2. MINUTOS NACIONALES */}
              <div className="bg-white border border-slate-200 hover:border-blue-300 transition-colors p-4 rounded-xl shadow-xs flex items-start gap-3.5">
                <div className="bg-blue-50 text-blue-700 p-2.5 rounded-lg shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Minutos
                  </span>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {activePlan.minutes}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Llamadas a fijos y móviles de todo Chile
                  </p>
                </div>
              </div>

              {/* 3. MENSAJERÍA SMS */}
              <div className="bg-white border border-slate-200 hover:border-blue-300 transition-colors p-4 rounded-xl shadow-xs flex items-start gap-3.5">
                <div className="bg-blue-50 text-blue-700 p-2.5 rounded-lg shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    SMS
                  </span>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {activePlan.sms} SMS
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Mensajes de texto nacionales a cualquier operador
                  </p>
                </div>
              </div>

              {/* 4. ROAMING INTERNACIONAL */}
              <div className="bg-white border border-slate-200 hover:border-blue-300 transition-colors p-4 rounded-xl shadow-xs flex items-start gap-3.5">
                <div className="bg-blue-50 text-blue-700 p-2.5 rounded-lg shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Roaming
                  </span>
                  <div className="text-xs font-semibold text-slate-800 font-mono">
                    {activePlan.roaming}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Cobertura internacional contratada en destino
                  </p>
                </div>
              </div>

              {/* 5. LARGA DISTANCIA (LDI) */}
              <div className="bg-white border border-slate-200 hover:border-blue-300 transition-colors p-4 rounded-xl shadow-xs flex items-start gap-3.5">
                <div className="bg-blue-50 text-blue-700 p-2.5 rounded-lg shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    LDI
                  </span>
                  <div className="text-xs font-semibold text-slate-800 font-mono">
                    {activePlan.ldi}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Marcación obligatoria con Carrier 171
                  </p>
                </div>
              </div>

              {/* 6. STREAMING OTT */}
              <div className="bg-white border border-slate-200 hover:border-blue-300 transition-colors p-4 rounded-xl shadow-xs flex items-start gap-3.5">
                <div className="bg-blue-50 text-blue-700 p-2.5 rounded-lg shrink-0">
                  <Tv className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Streaming OTT
                  </span>
                  <div className="text-xs font-bold text-slate-900">
                    {activePlan.ott}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Suscripción incluida en el cargo fijo mensual
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. VISTA SECUNDARIA (mode === 'compare'): COMPARADOR 2 PLANES */}
      {/* ======================================================== */}
      {mode === 'compare' && (
        <div className="space-y-4">
          {/* Panel de Selección Dual con Mini-Filtro por Categoría y Botón Central ⇄ */}
          <div className="bg-white border-2 border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Tarjeta Plan Actual / Origen (md:col-span-5) */}
              <div className="md:col-span-5 bg-slate-50/90 border border-slate-200/90 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Plan Actual / Origen
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    PLAN A
                  </span>
                </div>

                {/* Mini-filtro por categoría Plan A */}
                <select
                  value={planACategoryFilter}
                  onChange={e => {
                    const newCat = e.target.value;
                    setPlanACategoryFilter(newCat);
                    if (newCat !== 'ALL') {
                      const match = PLANS.find(p => p.category === newCat);
                      if (match) setPlanAId(match.id);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 font-medium focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Todas las Categorías</option>
                  <option value="Vigente Nov 2026">Vigente Nov 2026</option>
                  <option value="Parrilla Anterior (07-2023 / 10-2024)">Parrilla Anterior</option>
                  <option value="Planes GGTT">Planes GGTT</option>
                  <option value="Líneas Adicionales">Líneas Adicionales</option>
                  <option value="Order Entry / Riesgo">Order Entry / Riesgo</option>
                </select>

                {/* Select del Plan A */}
                <select
                  value={planAId}
                  onChange={e => setPlanAId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:border-blue-600 focus:outline-none cursor-pointer truncate"
                >
                  {plansForA.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.normalPrice.toLocaleString('es-CL')} ({p.gbHighSpeed} GB)
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón Central Intercambio Rápido ⇄ (md:col-span-2) */}
              <div className="md:col-span-2 flex flex-col items-center justify-center gap-1.5 py-1">
                <button
                  type="button"
                  onClick={handleSwapPlans}
                  className="flex items-center justify-center w-11 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-full transition cursor-pointer active:scale-95 shadow-md border-2 border-white"
                  title="Invertir planes (Origen ⇄ Destino)"
                >
                  <ArrowLeftRight className="w-4 h-4 text-white" />
                </button>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Invertir
                </span>
              </div>

              {/* Tarjeta Plan Nuevo / Destino (md:col-span-5) */}
              <div className="md:col-span-5 bg-blue-50/70 border border-blue-200/90 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-950">
                    Plan Nuevo / Destino
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                    PLAN B
                  </span>
                </div>

                {/* Mini-filtro por categoría Plan B */}
                <select
                  value={planBCategoryFilter}
                  onChange={e => {
                    const newCat = e.target.value;
                    setPlanBCategoryFilter(newCat);
                    if (newCat !== 'ALL') {
                      const match = PLANS.find(p => p.category === newCat);
                      if (match) setPlanBId(match.id);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 font-medium focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Todas las Categorías</option>
                  <option value="Vigente Nov 2026">Vigente Nov 2026</option>
                  <option value="Parrilla Anterior (07-2023 / 10-2024)">Parrilla Anterior</option>
                  <option value="Planes GGTT">Planes GGTT</option>
                  <option value="Líneas Adicionales">Líneas Adicionales</option>
                  <option value="Order Entry / Riesgo">Order Entry / Riesgo</option>
                </select>

                {/* Select del Plan B */}
                <select
                  value={planBId}
                  onChange={e => setPlanBId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:border-blue-600 focus:outline-none cursor-pointer truncate"
                >
                  {plansForB.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.normalPrice.toLocaleString('es-CL')} ({p.gbHighSpeed} GB)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox Claro Up */}
            <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition">
                <input
                  type="checkbox"
                  checked={hasClaroUp}
                  onChange={e => setHasClaroUp(e.target.checked)}
                  className="accent-[#DA291C] w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-800 text-xs font-semibold">Cliente con Claro Up Activo</span>
                <span className="text-[10px] text-slate-500 font-mono">(Requiere nuevo plan ≥ plan origen)</span>
              </label>
            </div>
          </div>

          {/* Alerta Crítica si Claro Up Bloquea Downselling */}
          {comparison.claroUpWarning && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-3 text-red-900 shadow-sm">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <span>
                  <strong className="text-red-700 font-bold uppercase">Bloqueo Claro Up:</strong> Downselling no permitido. Plan nuevo (${comparison.planB.normalPrice.toLocaleString('es-CL')}) es menor a plan origen (${comparison.planA.normalPrice.toLocaleString('es-CL')}).
                </span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 font-bold shrink-0">
                BLOQUEADO
              </span>
            </div>
          )}

          {/* Nota de Descuentos si Aplica */}
          {comparison.promoLossWarning && (
            <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                En cambio de plan para cliente existente aplica tarifa normal (${comparison.planB.normalPrice.toLocaleString('es-CL')}) y se deben borrar los descuentos previos de la orden.
              </span>
            </div>
          )}

          {/* Tabla Comparativa con Diferencias Resaltadas (Verde Esmeralda / Rojo) */}
          <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Table Column Headers */}
            <div className="grid grid-cols-12 bg-slate-100 px-4 py-3 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              <div className="col-span-4">Atributo</div>
              <div className="col-span-4 text-slate-800 font-semibold truncate">
                {comparison.planA.name}
              </div>
              <div className="col-span-4 text-slate-900 font-bold truncate">
                {comparison.planB.name}
              </div>
            </div>

            {/* Rows con resaltado condicional */}
            <div className="divide-y divide-slate-100 text-xs">
              {comparisonRows.map((row, idx) => {
                const isBetter = row.status === 'better';
                const isWorse = row.status === 'worse';

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 px-4 py-2.5 items-center transition-colors ${
                      isWorse
                        ? 'bg-red-50/50'
                        : isBetter
                        ? 'bg-emerald-50/50'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {/* Atributo */}
                    <div className="col-span-4 font-semibold text-slate-600 text-[11px]">
                      {row.attribute}
                    </div>

                    {/* Plan A Value */}
                    <div className="col-span-4 pr-2 text-slate-700 font-mono text-[11px] truncate">
                      {row.valA}
                    </div>

                    {/* Plan B Value con Resaltado Dinámico */}
                    <div className="col-span-4 pr-2 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-mono text-[11px] ${
                          isWorse
                            ? 'text-[#DA291C] font-bold'
                            : isBetter
                            ? 'text-emerald-700 font-bold'
                            : 'text-slate-900 font-semibold'
                        }`}
                      >
                        {row.valB}
                      </span>

                      {row.noteB && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isWorse
                              ? 'bg-red-100 text-[#DA291C] border border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {row.noteB}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
