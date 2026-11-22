import React, { useState, useMemo } from 'react';
import rawSvaData from '../../data/svaCatalog.json';
import type { SvaCatalogItem } from '../../types';
import {
  Search,
  RotateCcw,
  BookOpen,
  X,
  Check,
  Copy,
  ExternalLink,
  ShieldAlert,
  Smartphone
} from 'lucide-react';

const SVA_LIST: SvaCatalogItem[] = rawSvaData as SvaCatalogItem[];

type SvaFilter = 'ALL' | 'SMS' | 'SUMA' | 'BLACKLIST' | 'NO_SMS';

export const SvaSmsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<SvaFilter>('ALL');
  const [showRules, setShowRules] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return SVA_LIST.filter(item => {
      let matchFilter = true;
      if (activeFilter === 'SMS') matchFilter = Boolean(item.sms && item.sms.length > 0);
      else if (activeFilter === 'SUMA') matchFilter = Boolean(item.sumaAvailable);
      else if (activeFilter === 'BLACKLIST') matchFilter = Boolean(item.blacklistRequired);
      else if (activeFilter === 'NO_SMS') matchFilter = Boolean(!item.sms || item.sms.length === 0);

      if (!matchFilter) return false;
      if (!q) return true;

      const inName = item.name.toLowerCase().includes(q);
      const inProvider = item.provider.toLowerCase().includes(q);
      const inAlt = item.altChannel.toLowerCase().includes(q);
      const inPrice = item.priceRef.toLowerCase().includes(q);
      const inSms = item.sms.some(s =>
        s.keyword.toLowerCase().includes(q) ||
        s.shortcode.includes(q) ||
        (s.note && s.note.toLowerCase().includes(q))
      );

      return inName || inProvider || inAlt || inPrice || inSms;
    });
  }, [searchTerm, activeFilter]);

  const handleResetScreen = () => {
    setSearchTerm('');
    setActiveFilter('ALL');
  };

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <div className="space-y-3.5 w-full">
      {/* Top Bar with Dedicated Red Accent Border [Alt+1] */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 border-t-[3px] border-t-[#DA291C] px-3.5 py-2.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-[#DA291C]">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                SVA SMS y Agregadores
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                Alt+1
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Desuscripción Directa • {filteredItems.length} de {SVA_LIST.length} servicios
            </span>
          </div>
        </div>

        {/* Search, Filter Pills & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar servicio, palabra o código..."
              className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-none w-52 sm:w-64 transition"
            />
          </div>

          {/* Quick Operational Filters */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs overflow-x-auto">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'SMS', label: 'Por SMS' },
              { id: 'SUMA', label: 'Vía SUMA' },
              { id: 'BLACKLIST', label: 'Lista Negra' },
              { id: 'NO_SMS', label: 'Sin SMS (App/FPV)' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as SvaFilter)}
                className={`px-2.5 py-1 rounded font-medium shrink-0 transition cursor-pointer active:scale-[0.98] ${
                  activeFilter === f.id
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reglas Drawer Button */}
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-[0.98] ${
              showRules
                ? 'bg-slate-100 text-slate-900 border-slate-300 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Reglas SVA</span>
          </button>

          {/* Limpiar Pantalla */}
          <button
            type="button"
            onClick={handleResetScreen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition cursor-pointer active:scale-[0.98]"
            title="Limpiar búsqueda y filtros"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Collapsible Rules Drawer */}
      {showRules && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs space-y-3 shadow-md animate-fade-slide">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              Reglas y Procedimientos de Desuscripción SVA
            </span>
            <button
              onClick={() => setShowRules(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              <strong className="text-slate-900 block mb-1 font-semibold">Baja Directa por SMS</strong>
              El cliente envía la palabra clave al código corto desde su línea móvil Claro. Cancelación inmediata sin costo de mensajería para el usuario.
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              <strong className="text-slate-900 block mb-1 font-semibold">Portal SUMA (customer.portal.shop)</strong>
              Permite al ejecutivo cancelar suscripciones de agregadores (Gameloft, Bemobi, Renxo, Pienzzo) ingresando directamente el MSISDN del titular.
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              <strong className="text-slate-900 block mb-1 font-semibold">Tipifica Lista Negra</strong>
              Enrolar la línea en lista de bloqueo para evitar que agregadores vuelvan a activar cobros semanales o mensuales no consentidos.
            </div>
          </div>
        </div>
      )}

      {/* Grilla de Tarjetas Compactas de 2 Columnas con Alta Jerarquía */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {filteredItems.length === 0 ? (
          <div className="col-span-full p-10 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200 shadow-sm">
            No se encontraron servicios que coincidan con la búsqueda o filtro activo.
          </div>
        ) : (
          filteredItems.map(item => {
            const hasSms = item.sms && item.sms.length > 0;
            const isTerceros = item.type.toLowerCase().includes('tercero');
            const hasBadges = Boolean(item.sumaAvailable || item.blacklistRequired);

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 hover:border-blue-400/80 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between group shadow-sm"
              >
                {/* 1. Cabecera de Tarjeta Separada */}
                <div className="bg-slate-50/80 border-b border-slate-200/80 px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition">
                        {item.name}
                      </h4>
                      <span className="text-xs font-mono text-slate-500">
                        ({item.provider})
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 ${
                        isTerceros
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-200/70 text-slate-700 border border-slate-300/70'
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-mono line-clamp-1 mt-0.5">
                    {item.priceRef}
                  </p>
                </div>

                {/* 2. Cuerpo Central: Bloque de Comando SMS Táctil de Alto Contraste */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-center">
                  {hasSms ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {item.sms.map((s, idx) => {
                        const copyId = `${item.id}-${idx}`;
                        const fullCopy = `Enviar SMS con ${s.keyword} al ${s.shortcode}`;
                        const isCopied = copiedId === copyId;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => copyText(fullCopy, copyId)}
                            className={`flex-1 min-w-[220px] rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 transition cursor-pointer text-left active:scale-[0.98] ${
                              isCopied
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                            }`}
                            title={`Clic para copiar: ${fullCopy}`}
                          >
                            <div className="flex items-center gap-2 font-mono">
                              {s.note && (
                                <span className="text-[10px] text-slate-300 font-sans font-medium mr-0.5">
                                  [{s.note}]
                                </span>
                              )}
                              <span className="text-xs font-black text-white tracking-wider">
                                {s.keyword}
                              </span>
                              <span className="text-slate-400 text-xs font-bold">➔</span>
                              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-mono font-bold tracking-wider shadow-2xs">
                                {s.shortcode}
                              </span>
                            </div>

                            <div className="shrink-0">
                              {isCopied ? (
                                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-100">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                  <span>Copiado</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 group-hover:text-slate-200">
                                  <Copy className="w-3 h-3 opacity-80" />
                                  <span>Copiar</span>
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Canal alternativo con botón de alto contraste */
                    <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 text-xs flex items-center justify-between gap-3">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Canal de Desactivación:
                        </span>
                        <p className="text-xs font-mono text-slate-800 leading-snug line-clamp-2" title={item.altChannel}>
                          {item.altChannel}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyText(item.altChannel, `${item.id}-alt`)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold shrink-0 transition cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                          copiedId === `${item.id}-alt`
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                        }`}
                        title="Copiar ruta alternativa"
                      >
                        {copiedId === `${item.id}-alt` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Pie de Tarjeta: Badges solo si existen (sin texto de relleno) */}
                {hasBadges && (
                  <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-50/50 border-t border-slate-100">
                    {item.sumaAvailable && (
                      <button
                        type="button"
                        onClick={() => copyText('customer.portal.shop', `${item.id}-suma`)}
                        className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded font-semibold transition cursor-pointer active:scale-[0.98] ${
                          copiedId === `${item.id}-suma`
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 border border-emerald-200'
                        }`}
                        title="Clic para copiar enlace del portal SUMA"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>SUMA (customer.portal.shop)</span>
                        {copiedId === `${item.id}-suma` && <span className="font-bold">✓</span>}
                      </button>
                    )}

                    {item.blacklistRequired && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                        title="Enrolar en CRM One > Perfil > Lista Negra"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>Requiere Lista Negra (Tipifica)</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
