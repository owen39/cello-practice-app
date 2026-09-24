import { useCallback, useEffect, useMemo, useState } from 'react';
import { groupLogsByDay, type Area, type Exercise, type PracticeLog } from './domain';
import { formatDay } from './display';
import { repository } from './storage';

export function History() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [error, setError] = useState<string>();
  const [busyId, setBusyId] = useState<string>();

  const refresh = useCallback(async () => {
    const [nextAreas, nextExercises, nextLogs] = await Promise.all([
      repository.listAreas(true), repository.listExercises(true), repository.listLogs()
    ]);
    setAreas(nextAreas); setExercises(nextExercises); setLogs(nextLogs);
  }, []);

  useEffect(() => {
    let active = true;
    const load = () => { void refresh().catch((cause: unknown) => { if (active) setError(message(cause)); }); };
    load();
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', load);
    return () => { active = false; window.removeEventListener('focus', load); document.removeEventListener('visibilitychange', load); };
  }, [refresh]);

  const grouped = useMemo(() => groupLogsByDay(logs), [logs]);
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const areaById = new Map(areas.map((area) => [area.id, area]));

  async function correct(log: PracticeLog) {
    setError(undefined); setBusyId(log.id);
    try { await repository.deleteLog(log.id); await refresh(); }
    catch (cause) { setError(message(cause)); }
    finally { setBusyId(undefined); }
  }

  return <div className="history-view">
    {error && <p role="alert" className="notice error">{error}</p>}
    {grouped.length === 0 ? <section className="card empty"><h2>No practice recorded yet</h2><p>Mark an exercise practiced from Today or the Library. It will appear here by date.</p></section> :
      grouped.map(([day, entries]) => <section className="card history-day" key={day} aria-labelledby={`history-${day}`}>
        <div className="section-heading"><h2 id={`history-${day}`}>{formatDay(day)}</h2><span className="count-badge">{entries.length} {entries.length === 1 ? 'exercise' : 'exercises'}</span></div>
        <ul>{entries.map((log) => {
          const exercise = exerciseById.get(log.exerciseId);
          return <li key={log.id}><div><strong>{exercise?.name ?? 'Exercise no longer available'}</strong><small>{areaById.get(log.areaId)?.name ?? 'Area no longer available'}{exercise?.archivedAt ? ' · Archived exercise' : ''}</small></div><button className="small text-button" disabled={busyId !== undefined} onClick={() => void correct(log)}>Delete entry</button></li>;
        })}</ul>
      </section>)}
  </div>;
}

function message(cause: unknown): string { return cause instanceof Error ? cause.message : 'Could not update practice history.'; }
