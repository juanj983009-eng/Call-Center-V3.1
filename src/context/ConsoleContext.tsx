import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';

export type TabId = 'sva' | 'planes' | 'ciclos' | 'gigas' | 'notas';
export type ModuleNumber = 1 | 2 | 3 | 4 | 5;

export const VALID_TABS: readonly TabId[] = ['sva', 'planes', 'ciclos', 'gigas', 'notas'] as const;

export const TAB_TO_NUMBER: Record<TabId, ModuleNumber> = {
  sva: 1,
  planes: 2,
  ciclos: 3,
  gigas: 4,
  notas: 5
};

export const NUMBER_TO_TAB: Record<ModuleNumber, TabId> = {
  1: 'sva',
  2: 'planes',
  3: 'ciclos',
  4: 'gigas',
  5: 'notas'
};

export function isValidTab(val: unknown): val is TabId {
  return typeof val === 'string' && (VALID_TABS as readonly string[]).includes(val.toLowerCase());
}

export function getInitialTab(): TabId {
  // a) Primero revisa window.location.hash.replace('#', '')
  if (typeof window !== 'undefined' && window.location.hash) {
    const hash = window.location.hash.replace('#', '').trim().toLowerCase();
    if (isValidTab(hash)) {
      return hash;
    }
  }

  // b) Si no hay hash válido, revisa localStorage.getItem('claroconsult_active_tab')
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('claroconsult_active_tab')?.trim().toLowerCase();
      if (isValidTab(stored)) {
        return stored;
      }
    } catch {
      // Ignora errores si el almacenamiento está restringido en navegación privada
    }
  }

  // c) Caso contrario, retorna el módulo por defecto ('sva')
  return 'sva';
}

interface ConsoleContextType {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  activeModule: ModuleNumber;
  setActiveModule: (mod: ModuleNumber) => void;
}

const ConsoleContext = createContext<ConsoleContextType | null>(null);

export const ConsoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<TabId>(() => getInitialTab());
  const [, startTransition] = useTransition();

  const setActiveTab = (tab: TabId) => {
    startTransition(() => {
      setActiveTabState(tab);
    });
  };

  const setActiveModule = (mod: ModuleNumber) => {
    const mappedTab = NUMBER_TO_TAB[mod] || 'sva';
    setActiveTab(mappedTab);
  };

  const activeModule = TAB_TO_NUMBER[activeTab] || 1;

  // 1. Sincronización automática de activeTab con localStorage y URL hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('claroconsult_active_tab', activeTab);
      } catch {
        // Manejo silencioso en sandboxes
      }
    }

    const currentHash = window.location.hash.replace('#', '').trim().toLowerCase();
    if (currentHash !== activeTab) {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  // 2. Listener para sincronización con navegación Atrás/Adelante del navegador
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      if (isValidTab(hash) && hash !== activeTab) {
        setActiveTabState(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // 3. Listener de atajos de teclado Alt+1..5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('sva');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('planes');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('ciclos');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('gigas');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTab('notas');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ConsoleContext.Provider value={{ activeTab, setActiveTab, activeModule, setActiveModule }}>
      {children}
    </ConsoleContext.Provider>
  );
};

export function useConsole() {
  const ctx = useContext(ConsoleContext);
  if (!ctx) {
    throw new Error('useConsole must be used within ConsoleProvider');
  }
  return ctx;
}
