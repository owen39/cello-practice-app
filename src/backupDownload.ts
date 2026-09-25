import { localDay } from './domain';
import { repository } from './storage';
import { markReminderHandled } from './backupReminderSchedule';

export async function downloadPracticeBackup(): Promise<void> {
  const backup = await repository.exportBackup();
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `cello-practice-${localDay(new Date())}.json`;
  document.body.appendChild(link);
  try {
    link.click();
    markReminderHandled();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
