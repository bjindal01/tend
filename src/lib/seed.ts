import { addDays } from './dates';
import type { AppData, CircleId, Person, Touch, TouchType } from './types';

interface SeedPerson {
  id: string;
  name: string;
  about: string;
  circle: CircleId;
  cadenceDays: number;
  lastDaysAgo: number;
  colorIdx: number;
  birthdayInDays?: number;
  remember?: string[];
  knows?: string[];
  lastNote?: string;
}

/** Fictional sample contacts so the app looks alive on first launch. */
const SAMPLE: SeedPerson[] = [
  { id: 'arjun', name: 'Arjun Mehta', about: 'Brother-in-law · Fremont', circle: 'inner', cadenceDays: 7, lastDaysAgo: 2, colorIdx: 3, knows: ['mom'] },
  { id: 'nadia', name: 'Nadia Karimi', about: 'Best friend · Mission', circle: 'inner', cadenceDays: 7, lastDaysAgo: 5, colorIdx: 4, lastNote: 'Dinner at her place' },
  { id: 'daniel', name: 'Daniel Ortiz', about: 'Climbing partner', circle: 'inner', cadenceDays: 7, lastDaysAgo: 12, colorIdx: 1, knows: ['leo'], remember: ['Training for a Yosemite trip in spring'] },
  {
    id: 'maya', name: 'Maya Chen', about: 'College roommate · Oakland', circle: 'friends', cadenceDays: 14, lastDaysAgo: 18, colorIdx: 0, birthdayInDays: 0,
    remember: ['Running the Berkeley Half next month', 'Partner Jordan; daughter Ellie just started 1st grade', 'Prefers voice notes over long texts'],
    knows: ['priya'], lastNote: 'Her team reorg — she is leading the new platform group',
  },
  { id: 'priya', name: 'Priya Raman', about: 'Former teammate', circle: 'friends', cadenceDays: 14, lastDaysAgo: 9, colorIdx: 2, remember: ['Ask about the new role'] },
  { id: 'sam', name: 'Sam Whitfield', about: 'Neighbor · Noe Valley', circle: 'friends', cadenceDays: 14, lastDaysAgo: 0, colorIdx: 5, knows: ['chris'] },
  { id: 'mom', name: 'Mom', about: 'Family', circle: 'family', cadenceDays: 7, lastDaysAgo: 3, colorIdx: 0, knows: ['jess'] },
  { id: 'jess', name: 'Jess Lindqvist', about: 'Cousin · Seattle', circle: 'family', cadenceDays: 14, lastDaysAgo: 40, colorIdx: 1, birthdayInDays: 9 },
  { id: 'leo', name: 'Leo Brandt', about: 'Old soccer team', circle: 'network', cadenceDays: 30, lastDaysAgo: 62, colorIdx: 3, knows: ['anika'], remember: ['Just moved into a new place — housewarming?'] },
  { id: 'anika', name: 'Anika Shah', about: 'Grad school friend', circle: 'network', cadenceDays: 90, lastDaysAgo: 197, colorIdx: 4 },
  { id: 'chris', name: 'Chris Park', about: 'Ex-colleague · now at a startup', circle: 'work', cadenceDays: 30, lastDaysAgo: 12, colorIdx: 2, knows: ['ken'] },
  { id: 'tomas', name: 'Tomás Reyes', about: 'Industry peer', circle: 'work', cadenceDays: 30, lastDaysAgo: 45, colorIdx: 0 },
  { id: 'ruth', name: 'Ruth Abara', about: 'Mentor', circle: 'work', cadenceDays: 60, lastDaysAgo: 150, colorIdx: 0, remember: ['Send her the article on team design'] },
  { id: 'ken', name: 'Ken Mori', about: 'Former manager', circle: 'work', cadenceDays: 90, lastDaysAgo: 30, colorIdx: 1 },
];

const TYPES: TouchType[] = ['call', 'text', 'meet', 'text', 'video', 'call', 'email'];

/** Small deterministic PRNG so sample history is stable. */
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function buildSampleData(now = new Date()): AppData {
  const rand = rng(42);
  const people: Person[] = [];
  const touches: Touch[] = [];
  let n = 0;
  for (const s of SAMPLE) {
    let birthday: string | undefined;
    if (s.birthdayInDays !== undefined) {
      const b = addDays(now, s.birthdayInDays);
      birthday = `${String(b.getMonth() + 1).padStart(2, '0')}-${String(b.getDate()).padStart(2, '0')}`;
    }
    people.push({
      id: s.id,
      name: s.name,
      about: s.about,
      circle: s.circle,
      cadenceDays: s.cadenceDays,
      birthday,
      remember: s.remember ?? [],
      knows: s.knows ?? [],
      colorIdx: s.colorIdx,
      createdAt: addDays(now, -365).toISOString(),
    });
    // History: walk back from the last touch at roughly the person's cadence.
    let ago = s.lastDaysAgo;
    let first = true;
    while (ago < 120) {
      const at = addDays(now, -ago);
      at.setHours(first && ago === 0 ? Math.max(0, now.getHours() - 1) : 9 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);
      touches.push({
        id: `seed-${n++}`,
        personId: s.id,
        type: TYPES[Math.floor(rand() * TYPES.length)],
        at: at.toISOString(),
        note: first ? s.lastNote : undefined,
      });
      first = false;
      ago += Math.max(2, Math.round(s.cadenceDays * (0.6 + rand() * 0.6)));
    }
  }
  return { version: 1, people, touches };
}

export const emptyData = (): AppData => ({ version: 1, people: [], touches: [] });
