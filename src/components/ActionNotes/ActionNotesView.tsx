import React, { useState, useMemo } from 'react';
import rawActionNotes from '../../data/actionNotes.json';
import { CopyButton } from '../common/CopyButton';
import type { ActionNoteTemplate } from '../../types';
import {
  Search,
  RotateCcw,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';

const ACTION_NOTES: ActionNoteTemplate[] = rawActionNotes as ActionNoteTemplate[];

type SystemFilter = 'Todos' | 'Tipifica' | 'FPV' | 'CRM One' | 'SDESK';

const getSystemInfo = (systemStr: string): { label: 'CRM One' | 'FPV' | 'Tipifica' | 'SDESK' | 'SUMA'; badgeClass: string } => {
  const upper = systemStr.toUpperCase();
  if (upper.startsWith('SUMA') || upper.includes('PORTAL.SHOP')) {
    return { label: 'SUMA', badgeClass: 'bg-emerald-100 text-emerald-800' };
  }
  if (upper.startsWith('FPV') || upper.includes('FPV (')) {
    return { label: 'FPV', badgeClass: 'bg-indigo-100 text-indigo-800' };
  }
  if (upper.includes('TIPIFICA')) {
    return { label: 'Tipifica', badgeClass: 'bg-amber-100 text-amber-800' };
  }
  if (upper.includes('SDESK') || upper.includes('HELPDESK')) {
    return { label: 'SDESK', badgeClass: 'bg-slate-200 text-slate-800' };
  }
  return { label: 'CRM One', badgeClass: 'bg-blue-100 text-blue-800' };
};

const formatListTitle = (title: string): string => {
  return title.replace(/\s*\(Texto de la Razón FPV\)/gi, '').trim();
};

export const ActionNotesView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<SystemFilter>('Todos');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(ACTION_NOTES[0].id);

  // Field values state keyed by template ID and field key
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    ACTION_NOTES.forEach(tmpl => {
      initial[tmpl.id] = {};
      tmpl.fields.forEach(f => {
        initial[tmpl.id][f.key] = '';
      });
    });
    return initial;
  });

  const filteredTemplates = useMemo(() => {
    return ACTION_NOTES.filter(t => {
      // 1. System filter pill
      if (selectedSystem !== 'Todos') {
        const sysInfo = getSystemInfo(t.system);
        const matches = sysInfo.label === selectedSystem || (selectedSystem === 'CRM One' && t.system.includes('CRM One'));
        if (!matches) {
          return false;
        }
      }

      // 2. Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        t.title.toLowerCase().includes(q) ||
        t.system.toLowerCase().includes(q) ||
        t.reasonHeader.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.preconditions && t.preconditions.some(p => p.toLowerCase().includes(q))) ||
        t.fields.some(f => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedSystem]);

  const selectedTemplate = useMemo(() => {
    return ACTION_NOTES.find(t => t.id === selectedTemplateId) || filteredTemplates[0] || ACTION_NOTES[0];
  }, [selectedTemplateId, filteredTemplates]);

  const currentValues = formValues[selectedTemplate.id] || {};

  const handleFieldChange = (key: string, val: string) => {
    setFormValues(prev => ({
      ...prev,
      [selectedTemplate.id]: {
        ...(prev[selectedTemplate.id] || {}),
        [key]: val
      }
    }));
  };

  const handleResetCurrentFields = () => {
    setFormValues(prev => ({
      ...prev,
      [selectedTemplate.id]: {}
    }));
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedSystem('Todos');
    setSelectedTemplateId(ACTION_NOTES[0].id);
    const resetInitial: Record<string, Record<string, string>> = {};
    ACTION_NOTES.forEach(tmpl => {
      resetInitial[tmpl.id] = {};
    });
    setFormValues(resetInitial);
  };

  // Interpolate double curlies {{key}} in template string
  const generatedNoteText = useMemo(() => {
    let text = selectedTemplate.template;
    selectedTemplate.fields.forEach(f => {
      const val = currentValues[f.key]?.trim() || `[${f.label}]`;
      text = text.replace(new RegExp(`\\{\\{${f.key}\\}\\}`, 'g'), val);
    });
    return text;
  }, [selectedTemplate, currentValues]);

  return (
    <div className="space-y-3.5 w-full">
      {/* Top Bar with Dedicated Slate/Red Accent Border [Alt+5] */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 border-t-[3px] border-t-slate-800 px-3.5 py-2.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Notas de Órdenes y Casos CRM One
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                Alt+5
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Texto de la Razón • Casos • Tipificaciones Oficiales
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition cursor-pointer active:scale-[0.98]"
          title="Restablecer búsqueda, filtros y campos de notas"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Limpiar</span>
        </button>
      </div>

      {/* Grid: Left Column (4 cols) + Right Panel (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Sidebar: lg:col-span-4 */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Search Bar */}
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar gestión..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-700/15 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Quick Filter Pills by System */}
          <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-slate-200/80 bg-slate-50/60">
            {(['Todos', 'Tipifica', 'FPV', 'CRM One', 'SDESK'] as const).map(sys => {
              const isSelected = selectedSystem === sys;
              return (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setSelectedSystem(sys)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 font-medium'
                  }`}
                >
                  {sys}
                </button>
              );
            })}
          </div>

          {/* Compact List of Gestiones */}
          <div className="divide-y divide-slate-200 max-h-[calc(100vh-270px)] overflow-y-auto flex-1">
            {filteredTemplates.map(tmpl => {
              const isSelected = selectedTemplate.id === tmpl.id;
              const sysInfo = getSystemInfo(tmpl.system);
              const displayTitle = formatListTitle(tmpl.title);

              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs transition cursor-pointer flex flex-col gap-1.5 active:scale-[0.99] ${
                    isSelected
                      ? 'bg-blue-50/90 border-l-4 border-l-[#DA291C] font-semibold text-slate-900'
                      : 'hover:bg-slate-50/80 text-slate-700 bg-white'
                  }`}
                >
                  <span className={`leading-snug text-sm ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                    {displayTitle}
                  </span>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${sysInfo.badgeClass}`}>
                      {sysInfo.label}
                    </span>
                    <span className="text-slate-500 text-[11px] font-medium shrink-0">
                      {tmpl.sla}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No se encontraron gestiones para el filtro o término ingresado.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: lg:col-span-8 */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-4 space-y-3.5 shadow-sm">
          {/* Header Specs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {selectedTemplate.title}
                </h3>
                {selectedTemplate.category && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-[#DA291C] border border-red-200 uppercase tracking-wider">
                    {selectedTemplate.category}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600 font-mono mt-1">
                <span>Ruta: <strong className="text-blue-700 font-semibold">{selectedTemplate.system}</strong></span>
                <span className="text-slate-300">•</span>
                <span>SLA: <strong className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">{selectedTemplate.sla}</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetCurrentFields}
              className="text-[11px] text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Limpiar campos</span>
            </button>
          </div>

          {/* Preconditions / Reglas Bloqueantes */}
          {selectedTemplate.preconditions && selectedTemplate.preconditions.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 text-amber-950 rounded-lg p-3 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Requisitos / Precondiciones Operativas</span>
              </div>
              <ul className="space-y-1 pl-4 list-disc text-[11px] leading-relaxed text-amber-900">
                {selectedTemplate.preconditions.map((prec, i) => (
                  <li key={i}>{prec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {selectedTemplate.fields.map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block truncate">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={currentValues[f.key] || ''}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:border-slate-700 focus:ring-2 focus:ring-slate-700/15 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Live Compact Monospace Note Preview (Terminal Oscura Táctil) */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Texto de la Razón / Nota Generada:
              </span>

              <CopyButton
                textToCopy={generatedNoteText}
                label="Copiar Nota"
                variant="primary"
                size="sm"
              />
            </div>

            <pre className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 font-mono whitespace-pre-wrap leading-relaxed max-h-[190px] overflow-y-auto shadow-inner selection:bg-red-600 selection:text-white">
              {generatedNoteText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
