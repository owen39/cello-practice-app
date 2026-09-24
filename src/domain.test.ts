import { describe, expect, it } from 'vitest';
import { areaSummary, exerciseSummary, inPastDays, localDay, shiftDay, summarize, type PracticeLog } from './domain';

const log = (day: `${number}-${number}-${number}`, exerciseId: string, areaId: string): PracticeLog => ({ id: `${day}-${exerciseId}`, day, exerciseId, areaId, createdAt: `${day}T12:00:00Z` });

describe('local calendar days', () => {
  it('formats the device-local date without UTC conversion', () => {
    const date = new Date(2026, 8, 24, 23, 30);
    expect(localDay(date)).toBe('2026-09-24');
  });
  it('uses inclusive rolling windows across month and year boundaries', () => {
    expect(shiftDay('2026-01-01', -6)).toBe('2025-12-26');
    expect(inPastDays('2025-12-26', '2026-01-01', 7)).toBe(true);
    expect(inPastDays('2025-12-25', '2026-01-01', 7)).toBe(false);
    expect(inPastDays('2026-01-02', '2026-01-01', 7)).toBe(false);
  });
});

describe('practice summaries', () => {
  const logs = [log('2026-09-24', 'a', 'bowing'), log('2026-09-24', 'b', 'bowing'), log('2026-09-18', 'a', 'scales'), log('2026-08-25', 'a', 'scales')];
  it('counts distinct days in an area and keeps the historical area snapshot', () => {
    expect(areaSummary(logs, 'bowing', '2026-09-24')).toEqual({ lastPracticed: '2026-09-24', days7: 1, days30: 1 });
    expect(areaSummary(logs, 'scales', '2026-09-24')).toEqual({ lastPracticed: '2026-09-18', days7: 1, days30: 1 });
  });
  it('counts an exercise separately and handles deletion by recomputing', () => {
    expect(exerciseSummary(logs, 'a', '2026-09-24').days30).toBe(2);
    expect(exerciseSummary(logs.filter((entry) => entry.id !== '2026-09-24-a'), 'a', '2026-09-24').lastPracticed).toBe('2026-09-18');
    expect(summarize([], '2026-09-24')).toEqual({ lastPracticed: undefined, days7: 0, days30: 0 });
  });
});
