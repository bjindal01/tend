export type CircleId = 'inner' | 'friends' | 'family' | 'work' | 'network';

export type TouchType = 'call' | 'text' | 'meet' | 'video' | 'email';

export interface Person {
  id: string;
  name: string;
  /** Short context line, e.g. "College roommate · Oakland". */
  about?: string;
  circle: CircleId;
  /** How often you want to be in touch, in days. */
  cadenceDays: number;
  phone?: string;
  email?: string;
  /** Birthday as MM-DD. */
  birthday?: string;
  /** Things to remember for next time. */
  remember: string[];
  /** Ids of people this person knows (mutual ties on the map). */
  knows: string[];
  colorIdx: number;
  createdAt: string;
  /** If set, the next nudge date chosen when the last touch was logged. */
  nextDueAt?: string;
}

export interface Touch {
  id: string;
  personId: string;
  type: TouchType;
  at: string;
  note?: string;
}

export interface AppData {
  version: 1;
  people: Person[];
  touches: Touch[];
}

export const CIRCLES: { id: CircleId; label: string; ring: 1 | 2 | 3 }[] = [
  { id: 'inner', label: 'Inner circle', ring: 1 },
  { id: 'friends', label: 'Close friends', ring: 2 },
  { id: 'family', label: 'Family', ring: 2 },
  { id: 'work', label: 'Work network', ring: 3 },
  { id: 'network', label: 'Friends & network', ring: 3 },
];

export const circleLabel = (id: CircleId) => CIRCLES.find((c) => c.id === id)?.label ?? id;

export const TOUCH_TYPES: { id: TouchType; label: string }[] = [
  { id: 'call', label: 'Call' },
  { id: 'text', label: 'Text' },
  { id: 'meet', label: 'In person' },
  { id: 'video', label: 'Video' },
  { id: 'email', label: 'Email' },
];

export const touchLabel = (t: TouchType) => TOUCH_TYPES.find((x) => x.id === t)?.label ?? t;
