import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { buildSampleData, emptyData } from './seed';
import type { AppData, Person, Touch } from './types';

const KEY = 'tend:data:v1';

interface Store {
  ready: boolean;
  data: AppData;
  /** Re-render clock: bumps when the app regains focus so "days ago" stays fresh. */
  now: Date;
  refreshNow: () => void;
  upsertPerson: (p: Person) => void;
  deletePerson: (id: string) => void;
  logTouch: (t: Omit<Touch, 'id'>, opts?: { nextDueAt?: string; remember?: string }) => void;
  removeRemember: (personId: string, index: number) => void;
  resetToSample: () => void;
  clearAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        setData(raw ? (JSON.parse(raw) as AppData) : buildSampleData());
      } catch {
        setData(buildSampleData());
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const upsertPerson = useCallback((p: Person) => {
    setData((d) => {
      const exists = d.people.some((x) => x.id === p.id);
      return { ...d, people: exists ? d.people.map((x) => (x.id === p.id ? p : x)) : [...d.people, p] };
    });
  }, []);

  const deletePerson = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      people: d.people.filter((p) => p.id !== id).map((p) => ({ ...p, knows: p.knows.filter((k) => k !== id) })),
      touches: d.touches.filter((t) => t.personId !== id),
    }));
  }, []);

  const logTouch = useCallback<Store['logTouch']>((t, opts) => {
    setData((d) => ({
      ...d,
      touches: [...d.touches, { ...t, id: newId() }],
      people: d.people.map((p) =>
        p.id === t.personId
          ? {
              ...p,
              nextDueAt: opts?.nextDueAt,
              remember: opts?.remember?.trim() ? [opts.remember.trim(), ...p.remember] : p.remember,
            }
          : p,
      ),
    }));
    setNow(new Date());
  }, []);

  const removeRemember = useCallback((personId: string, index: number) => {
    setData((d) => ({
      ...d,
      people: d.people.map((p) => (p.id === personId ? { ...p, remember: p.remember.filter((_, i) => i !== index) } : p)),
    }));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      data,
      now,
      refreshNow: () => setNow(new Date()),
      upsertPerson,
      deletePerson,
      logTouch,
      removeRemember,
      resetToSample: () => setData(buildSampleData()),
      clearAll: () => setData(emptyData()),
    }),
    [ready, data, now, upsertPerson, deletePerson, logTouch, removeRemember],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
