import { addDays, daysBetween, isBirthdayToday } from './dates';
import { colors } from './theme';
import type { Person, Touch } from './types';

export type Status = 'on' | 'fading' | 'untouched';

export interface Health {
  person: Person;
  lastTouch?: Touch;
  lastAt: Date;
  daysSince: number;
  /** daysSince / cadence — 1.0 means exactly due. */
  ratio: number;
  status: Status;
  dueAt: Date;
  isDue: boolean;
  overdueDays: number;
  birthdayToday: boolean;
  touchedToday: boolean;
}

export const STATUS_META: Record<
  Status,
  { label: string; stroke: string; text: string; dash?: string; ring: 'solid' | 'dashed' | 'dotted' }
> = {
  on: { label: 'On track', stroke: colors.accent, text: colors.accent, ring: 'solid' },
  fading: { label: 'Fading', stroke: colors.fading, text: colors.fadingText, dash: '6 4', ring: 'dashed' },
  untouched: { label: 'Untouched', stroke: colors.untouched, text: colors.untouched, dash: '0.5 5', ring: 'dotted' },
};

export function lastTouchFor(personId: string, touches: Touch[]): Touch | undefined {
  let best: Touch | undefined;
  for (const t of touches) {
    if (t.personId === personId && (!best || t.at > best.at)) best = t;
  }
  return best;
}

export function health(person: Person, touches: Touch[], now: Date): Health {
  const lastTouch = lastTouchFor(person.id, touches);
  const lastAt = new Date(lastTouch?.at ?? person.createdAt);
  const daysSince = Math.max(0, daysBetween(lastAt, now));
  const ratio = daysSince / Math.max(1, person.cadenceDays);
  const status: Status = ratio <= 1 ? 'on' : ratio <= 2 ? 'fading' : 'untouched';
  const dueAt =
    person.nextDueAt && lastTouch && person.nextDueAt > lastTouch.at
      ? new Date(person.nextDueAt)
      : addDays(lastAt, person.cadenceDays);
  const overdueDays = daysBetween(dueAt, now);
  const touchedToday = !!lastTouch && daysBetween(new Date(lastTouch.at), now) === 0;
  const birthdayToday = isBirthdayToday(person.birthday, now);
  return {
    person,
    lastTouch,
    lastAt,
    daysSince,
    ratio,
    status,
    dueAt,
    isDue: overdueDays >= 0 && !touchedToday,
    overdueDays,
    birthdayToday,
    touchedToday,
  };
}

export const healthAll = (people: Person[], touches: Touch[], now: Date) =>
  people.map((p) => health(p, touches, now));
