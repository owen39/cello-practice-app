import { describe, expect, it } from 'vitest';
import { BACKUP_REMINDER_INTERVAL_MS, reminderDue } from './backupReminderSchedule';

describe('weekly backup reminder', () => {
  const firstExercise = Date.parse('2026-09-01T12:00:00Z');

  it('waits a full week after the first exercise', () => {
    expect(reminderDue(firstExercise + BACKUP_REMINDER_INTERVAL_MS - 1, firstExercise)).toBe(false);
    expect(reminderDue(firstExercise + BACKUP_REMINDER_INTERVAL_MS, firstExercise)).toBe(true);
  });

  it('waits another week after either a backup or a deferral', () => {
    const handled = firstExercise + BACKUP_REMINDER_INTERVAL_MS;
    expect(reminderDue(handled + BACKUP_REMINDER_INTERVAL_MS - 1, firstExercise, handled)).toBe(false);
    expect(reminderDue(handled + BACKUP_REMINDER_INTERVAL_MS, firstExercise, handled)).toBe(true);
  });

  it('ignores future or invalid exercise dates', () => {
    expect(reminderDue(firstExercise, firstExercise + 1)).toBe(false);
    expect(reminderDue(firstExercise, Number.NaN)).toBe(false);
  });
});
