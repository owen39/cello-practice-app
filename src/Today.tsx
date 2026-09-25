import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Area, Day, Exercise, PracticeLog, TodaySelection } from './domain';
import { repository } from './storage';
import { formatDay } from './display';
import { useLocalDay } from './useLocalDay';

interface Snapshot { areas: Area[]; exercises: Exercise[]; selections: TodaySelection[]; logs: PracticeLog[] }
const empty: Snapshot = { areas: [], exercises: [], selections: [], logs: [] };

export function Today({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const day = useLocalDay();
  const [snapshot, setSnapshot] = useState<Snapshot>(empty);
  const [chosenId, setChosenId] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (forDay: Day) => {
    const [areas, exercises, selections, logs] = await Promise.all([
      repository.listAreas(true), repository.listExercises(true), repository.listSelections(forDay), repository.listLogs()
    ]);
    setSnapshot({ areas, exercises, selections, logs });
    setChosenId((current) => exercises.some((exercise) => exercise.id === current && !exercise.archivedAt && !selections.some((selected) => selected.exerciseId === current)) ? current : '');
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try { if (active) await refresh(day); }
      catch (cause) { if (active) setError(message(cause)); }
    }
    void load();
    const onFocus = () => { void load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => { active = false; window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, [day, refresh]);

  async function perform(action: () => Promise<unknown>) {
    setBusy(true); setError(undefined);
    try { await action(); await refresh(day); }
    catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  const selected = useMemo(() => snapshot.selections.filter((item) => item.day === day).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [snapshot.selections, day]);
  const selectedIds = useMemo(() => new Set(selected.map((item) => item.exerciseId)), [selected]);
  const available = snapshot.exercises.filter((exercise) => !exercise.archivedAt && !selectedIds.has(exercise.id));
  const todayLogs = snapshot.logs.filter((log) => log.day === day);
  const extraLogs = todayLogs.filter((log) => !selectedIds.has(log.exerciseId));
  const exerciseById = new Map(snapshot.exercises.map((exercise) => [exercise.id, exercise]));
  const areaById = new Map(snapshot.areas.map((area) => [area.id, area]));

  function displayName(exerciseId: string) { return exerciseById.get(exerciseId)?.name ?? 'Archived exercise'; }
  function displayArea(exerciseId: string) { return areaById.get(exerciseById.get(exerciseId)?.areaId ?? '')?.name ?? 'Archived area'; }

  return <div className="today-view">
    {error && <p role="alert" className="notice error">{error}</p>}
    <section className="card" aria-labelledby="today-list-heading">
      <div className="section-heading"><div><h2 id="today-list-heading">Today’s list</h2><p>{formatDay(day)} · Choose only what feels useful today.</p></div><span className="count-badge">{selected.length} selected</span></div>
      {selected.length === 0 ? <div className="today-empty"><h3>Your list is open</h3><p>Add an exercise below. You can also practice directly from the Library without adding it here.</p></div> :
        <ul className="today-list">{selected.map(({ exerciseId }) => {
          const exercise = exerciseById.get(exerciseId);
          const log = todayLogs.find((item) => item.exerciseId === exerciseId);
          return <li key={exerciseId} className="today-item">
            <div><strong>{displayName(exerciseId)}</strong><small>{displayArea(exerciseId)}</small><span className="done-status">{log ? 'Practiced today' : 'Ready when you are'}</span></div>
            <div className="actions">{log ? <button className="secondary" aria-label={`Undo today's practice for ${displayName(exerciseId)}`} disabled={busy} onClick={() => void perform(() => repository.deleteLog(log.id))}>Undo practice</button> : <button className="primary" aria-label={`Mark ${displayName(exerciseId)} practiced today`} disabled={busy || !!exercise?.archivedAt} onClick={() => void perform(() => repository.logPractice(day, exerciseId))}>Mark practiced</button>}<button className="small text-button" aria-label={`Remove ${displayName(exerciseId)} from today's list`} disabled={busy} onClick={() => void perform(() => repository.removeSelection(day, exerciseId))}>Remove from list</button></div>
          </li>;
        })}</ul>}
      <form className="form-row add-today" onSubmit={(event) => { event.preventDefault(); if (chosenId) void perform(() => repository.selectExercise(day, chosenId)); }}>
        <label>Add to today’s list<select value={chosenId} onChange={(event) => setChosenId(event.target.value)} disabled={busy || available.length === 0}><option value="">Choose an exercise</option>{available.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name} · {displayArea(exercise.id)}</option>)}</select></label>
        <button className="secondary" disabled={busy || !chosenId}>Add to today</button>
      </form>
      {available.length === 0 && snapshot.exercises.filter((exercise) => !exercise.archivedAt).length === 0 && <div className="today-start"><p className="helper">Add an exercise in the Library to get started.</p><button className="secondary" type="button" onClick={onOpenLibrary}>Go to Library</button></div>}
    </section>
    {extraLogs.length > 0 && <section className="card" aria-labelledby="extra-heading"><h2 id="extra-heading">Also practiced today</h2><p>These were marked in the Library without adding them to today’s list.</p><ul className="today-list">{extraLogs.map((log) => <li className="today-item" key={log.id}><div><strong>{displayName(log.exerciseId)}</strong><small>{areaById.get(log.areaId)?.name ?? 'Archived area'}</small></div><button className="small text-button" aria-label={`Undo today's practice for ${displayName(log.exerciseId)}`} disabled={busy} onClick={() => void perform(() => repository.deleteLog(log.id))}>Undo practice</button></li>)}</ul></section>}
  </div>;
}

function message(cause: unknown): string { return cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'; }
