const DAY = 24 * 60 * 60 * 1000;

export const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Whole calendar days from `from` to `to` (local time). */
export const daysBetween = (from: Date, to: Date) =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY);

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

export const daysAgoLabel = (days: number) => {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

export const shortDate = (d: Date) =>
  d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const longDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export const weekdayDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export const timeLabel = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const isBirthdayToday = (birthday: string | undefined, now: Date) => {
  if (!birthday) return false;
  const [m, d] = birthday.split('-').map(Number);
  return now.getMonth() + 1 === m && now.getDate() === d;
};

/** Days until the next occurrence of an MM-DD birthday (0 = today). */
export const daysUntilBirthday = (birthday: string | undefined, now: Date) => {
  if (!birthday) return undefined;
  const [m, d] = birthday.split('-').map(Number);
  if (!m || !d) return undefined;
  let next = new Date(now.getFullYear(), m - 1, d);
  if (startOfDay(next) < startOfDay(now)) next = new Date(now.getFullYear() + 1, m - 1, d);
  return daysBetween(now, next);
};

export const cadenceLabel = (days: number) => {
  if (days === 7) return 'weekly';
  if (days === 14) return 'every 2 wks';
  if (days === 30) return 'monthly';
  if (days === 90) return 'quarterly';
  if (days % 7 === 0) return `every ${days / 7} wks`;
  return `every ${days} days`;
};
