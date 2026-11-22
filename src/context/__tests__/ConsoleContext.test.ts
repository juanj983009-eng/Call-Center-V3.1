import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getInitialTab, isValidTab, VALID_TABS } from '../ConsoleContext';

describe('Navigation persistence and tab validation', () => {
  const originalWindow = globalThis.window;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const mockWindow = {
      location: { hash: '' },
      localStorage: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
        clear: () => { mockStorage = {}; }
      }
    };
    // @ts-expect-error mock window for node vitest
    globalThis.window = mockWindow;
  });

  afterAll(() => {
    globalThis.window = originalWindow;
  });

  it('validates official module tabs', () => {
    expect(VALID_TABS).toEqual(['sva', 'planes', 'ciclos', 'gigas', 'notas']);
    expect(isValidTab('sva')).toBe(true);
    expect(isValidTab('planes')).toBe(true);
    expect(isValidTab('ciclos')).toBe(true);
    expect(isValidTab('gigas')).toBe(true);
    expect(isValidTab('notas')).toBe(true);
    expect(isValidTab('invalid_tab')).toBe(false);
  });

  it('resolves initial tab from URL hash as top priority', () => {
    window.location.hash = '#gigas';
    window.localStorage.setItem('claroconsult_active_tab', 'ciclos');
    expect(getInitialTab()).toBe('gigas');
  });

  it('resolves initial tab from localStorage if hash is missing or invalid', () => {
    window.location.hash = '';
    window.localStorage.setItem('claroconsult_active_tab', 'notas');
    expect(getInitialTab()).toBe('notas');

    window.location.hash = '#unknown';
    expect(getInitialTab()).toBe('notas');
  });

  it('defaults to sva if both hash and localStorage are missing', () => {
    window.location.hash = '';
    window.localStorage.clear();
    expect(getInitialTab()).toBe('sva');
  });
});
