import { daysSince, type Day } from './domain';

export function formatDay(day: Day): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, date, 12));
}

export function lastPracticedLabel(day: Day | undefined, today: Day): string {
  if (!day) return 'Not practiced yet';
  const elapsed = daysSince(day, today);
  if (elapsed === 0) return 'Practiced today';
  if (elapsed === 1) return 'Last practiced yesterday';
  if (elapsed > 1) return `Last practiced ${elapsed} days ago`;
  return `Last practiced ${formatDay(day)}`;
}
