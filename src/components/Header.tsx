import React, { useState } from 'react';
import { useConsole, type TabId } from '../context/ConsoleContext';
import { Layers, HelpCircle, X } from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab } = useConsole();
  const [showHelpModal, setShowHelpModal] = useState(false);

  const navModules: { id: TabId; label: string; code: string; desc: string }[] = [
    { id: 'sva', label: 'SVA SMS', code: 'Alt+1', desc: 'Baja y códigos de mensajería' },
    { id: 'planes', label: 'Planes', code: 'Alt+2', desc: 'Ficha comercial y Claro Up' },
    { id: 'ciclos', label: 'Ciclos', code: 'Alt+3', desc: 'Ficha corte y proporcionales' },
    { id: 'gigas', label: 'Gigas', code: 'Alt+4', desc: 'Conversor PUJ y cuentas CRM' },
    { id: 'notas', label: 'Notas', code: 'Alt+5', desc: 'Texto razón y plantillas' }
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="w-full px-4 lg:px-6 py-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Brand / Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded bg-[#DA291C] flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-xs">
                C
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  ClaroConsult
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                  v3.1
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Sistemas en Línea" />
              </div>
            </div>

            {/* Center: 5 Module Tabs */}
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
              {navModules.map(mod => {
                const isActive = activeTab === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveTab(mod.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#DA291C] text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 font-medium'
                    }`}
                  >
                    <span>{mod.label}</span>
                    <kbd
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? 'bg-black/20 text-white'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      {mod.code}
                    </kbd>
                  </button>
                );
              })}
            </nav>

            {/* Right: Shortcuts Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                title="Ver atajos de teclado"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer active:scale-[0.98]"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Atajos</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#DA291C]" />
                Atajos de Teclado Operativos
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              {navModules.map(m => (
                <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">{m.label}</span>
                    <span className="text-[11px] text-slate-500">{m.desc}</span>
                  </div>
                  <kbd className="bg-white px-2 py-1 rounded text-xs font-mono text-slate-800 font-bold border border-slate-300 shadow-2xs">
                    {m.code}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer active:scale-[0.98] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
