export const BACKUP_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const reminderKey = 'cello-practice-backup-reminder-v1';

export function reminderDue(now: number, firstExerciseAt: number, lastHandledAt?: number): boolean {
  if (!Number.isFinite(firstExerciseAt) || firstExerciseAt > now) return false;
  const anchor = Math.max(firstExerciseAt, lastHandledAt ?? 0);
  return now - anchor >= BACKUP_REMINDER_INTERVAL_MS;
}

export function lastReminderHandledAt(): number | undefined {
  try {
    const value = Number(window.localStorage.getItem(reminderKey));
    return Number.isFinite(value) && value > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

export function markReminderHandled(at = Date.now()): void {
  try {
    window.localStorage.setItem(reminderKey, String(at));
  } catch {
    // The reminder is optional; practice data remains in IndexedDB.
  }
}
