import { useCallback, useEffect, useRef, useState } from 'react';
import { downloadPracticeBackup } from './backupDownload';
import { lastReminderHandledAt, markReminderHandled, reminderDue } from './backupReminderSchedule';
import { repository } from './storage';

export function BackupReminder() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const check = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    const exercises = await repository.listExercises(true);
    const firstExerciseAt = exercises.reduce((first, exercise) => {
      const createdAt = Date.parse(exercise.createdAt);
      return Number.isFinite(createdAt) ? Math.min(first, createdAt) : first;
    }, Number.POSITIVE_INFINITY);
    if (reminderDue(Date.now(), firstExerciseAt, lastReminderHandledAt())) setOpen(true);
  }, []);

  useEffect(() => {
    void check().catch(() => {});
    const onReturn = () => { void check().catch(() => {}); };
    window.addEventListener('focus', onReturn);
    document.addEventListener('visibilitychange', onReturn);
    return () => {
      window.removeEventListener('focus', onReturn);
      document.removeEventListener('visibilitychange', onReturn);
    };
  }, [check]);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  function remindNextWeek() {
    markReminderHandled();
    setOpen(false);
    setError(undefined);
  }

  async function download() {
    setBusy(true);
    setError(undefined);
    try {
      await downloadPracticeBackup();
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare the backup. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <dialog ref={dialog} className="backup-reminder" aria-labelledby="backup-reminder-title" aria-describedby="backup-reminder-description" onCancel={(event) => { event.preventDefault(); remindNextWeek(); }}>
    <h2 id="backup-reminder-title">Time to back up your practice</h2>
    <p id="backup-reminder-description">Save a copy of your exercises and practice history. Your records are stored on this device.</p>
    {error && <p role="alert" className="notice error">{error}</p>}
    <div className="backup-reminder-actions">
      <button type="button" className="primary" autoFocus disabled={busy} onClick={() => void download()}>Download backup</button>
      <button type="button" className="secondary" disabled={busy} onClick={remindNextWeek}>Remind me next week</button>
    </div>
  </dialog>;
}
