export type Day = `${number}-${number}-${number}`;

export interface Area {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface Exercise {
  id: string;
  areaId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface TodaySelection {
  day: Day;
  exerciseId: string;
  createdAt: string;
}

export interface PracticeLog {
  id: string;
  day: Day;
  exerciseId: string;
  areaId: string;
  createdAt: string;
}

export interface PracticeSummary {
  lastPracticed: Day | undefined;
  days7: number;
  days30: number;
}

export function localDay(date: Date): Day {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as Day;
}

export function millisecondsUntilNextLocalDay(now: Date): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(1, nextMidnight.getTime() - now.getTime());
}

export function shiftDay(day: Day, offset: number): Day {
  const [year, month, date] = day.split('-').map(Number);
  // Midday avoids midnight transitions around daylight saving changes.
  return localDay(new Date(year, month - 1, date + offset, 12));
}

export function inPastDays(day: Day, today: Day, count: number): boolean {
  return day >= shiftDay(today, 1 - count) && day <= today;
}

export function summarize(logs: Pick<PracticeLog, 'day'>[], today: Day): PracticeSummary {
  const days = new Set(logs.map((log) => log.day));
  return {
    lastPracticed: [...days].sort().at(-1),
    days7: [...days].filter((day) => inPastDays(day, today, 7)).length,
    days30: [...days].filter((day) => inPastDays(day, today, 30)).length
  };
}

export function exerciseSummary(logs: PracticeLog[], exerciseId: string, today: Day): PracticeSummary {
  return summarize(logs.filter((log) => log.exerciseId === exerciseId), today);
}

export function areaSummary(logs: PracticeLog[], areaId: string, today: Day): PracticeSummary {
  return summarize(logs.filter((log) => log.areaId === areaId), today);
}
