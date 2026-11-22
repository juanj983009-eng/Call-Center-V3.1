import React from 'react';
import { ConsoleProvider, useConsole } from './context/ConsoleContext';
import { Header } from './components/Header';
import { SvaSmsView } from './components/SvaSms/SvaSmsView';
import { PlanComparatorView } from './components/PlanComparator/PlanComparatorView';
import { BillingConsultantView } from './components/BillingConsultant/BillingConsultantView';
import { GigaCalculatorView } from './components/GigaCalculator/GigaCalculatorView';
import { ActionNotesView } from './components/ActionNotes/ActionNotesView';

const ModuleSwitcher: React.FC = () => {
  const { activeTab } = useConsole();

  return (
    <main key={activeTab} className="flex-1 w-full px-3 py-3 lg:px-6 lg:py-4 max-w-[1920px] mx-auto overflow-x-hidden animate-fade-slide">
      {activeTab === 'sva' && <SvaSmsView />}
      {activeTab === 'planes' && <PlanComparatorView />}
      {activeTab === 'ciclos' && <BillingConsultantView />}
      {activeTab === 'gigas' && <GigaCalculatorView />}
      {activeTab === 'notas' && <ActionNotesView />}
    </main>
  );
};

export function App() {
  return (
    <ConsoleProvider>
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-red-500/20 selection:text-red-900">
        <Header />
        <ModuleSwitcher />

        {/* Global Compact Light Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
            <span className="text-slate-600 font-medium">Sistemas Claro Chile: En Línea</span>
            <span className="text-slate-300">•</span>
            <span>Parrilla Noviembre 2026</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Navegación: <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-bold">Alt+1..5</kbd></span>
            <span className="text-[#DA291C] font-bold">#ClaroConsult</span>
          </div>
        </footer>
      </div>
    </ConsoleProvider>
  );
}

export default App;
