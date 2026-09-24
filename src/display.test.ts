import { describe, expect, it } from 'vitest';
import { daysSince } from './domain';
import { lastPracticedLabel } from './display';

describe('recency labels', () => {
  it('uses calendar days rather than elapsed hours across daylight saving changes', () => {
    expect(daysSince('2026-03-28', '2026-03-30')).toBe(2);
    expect(lastPracticedLabel('2026-03-28', '2026-03-30')).toBe('Last practiced 2 days ago');
  });
  it('uses neutral wording for empty, current, and previous day', () => {
    expect(lastPracticedLabel(undefined, '2026-09-24')).toBe('Not practiced yet');
    expect(lastPracticedLabel('2026-09-24', '2026-09-24')).toBe('Practiced today');
    expect(lastPracticedLabel('2026-09-23', '2026-09-24')).toBe('Last practiced yesterday');
  });
});
