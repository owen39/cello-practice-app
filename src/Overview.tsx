import { useCallback, useEffect, useState } from 'react';
import { areaSummary, exerciseSummary, type Area, type Exercise, type PracticeLog, type PracticeSummary } from './domain';
import { lastPracticedLabel } from './display';
import { repository } from './storage';
import { useLocalDay } from './useLocalDay';

export function Overview() {
  const today = useLocalDay();
  const [areas, setAreas] = useState<Area[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    const [nextAreas, nextExercises, nextLogs] = await Promise.all([
      repository.listAreas(), repository.listExercises(), repository.listLogs()
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

  return <div className="overview-view">
    {error && <p role="alert" className="notice error">{error}</p>}
    <section className="card" aria-labelledby="area-overview-heading">
      <h2 id="area-overview-heading">Practice areas</h2>
      <p>Days when you practiced at least one exercise in each area.</p>
      <ul className="stats-list">{areas.map((area) => <li key={area.id}><h3>{area.name}</h3><Stats summary={areaSummary(logs, area.id, today)} today={today} /></li>)}</ul>
    </section>
    <section className="card" aria-labelledby="exercise-overview-heading">
      <h2 id="exercise-overview-heading">Exercises</h2>
      <p>Each exercise counts once per calendar day.</p>
      {exercises.length === 0 ? <div className="overview-empty"><h3>No exercises yet</h3><p>Add your first exercise in the Library to see its practice here.</p></div> :
        <ul className="stats-list">{areas.map((area) => {
          const inArea = exercises.filter((exercise) => exercise.areaId === area.id);
          if (inArea.length === 0) return null;
          return <li className="stats-group" key={area.id}><h3>{area.name}</h3><ul>{inArea.map((exercise) => <li key={exercise.id}><h4>{exercise.name}</h4><Stats summary={exerciseSummary(logs, exercise.id, today)} today={today} /></li>)}</ul></li>;
        })}</ul>}
    </section>
  </div>;
}

function Stats({ summary, today }: { summary: PracticeSummary; today: ReturnType<typeof useLocalDay> }) {
  return <div className="stats-detail"><p>{lastPracticedLabel(summary.lastPracticed, today)}</p><div className="stat-pair"><span><strong>{summary.days7}</strong> days in past 7</span><span><strong>{summary.days30}</strong> days in past 30</span></div></div>;
}

function message(cause: unknown): string { return cause instanceof Error ? cause.message : 'Could not load practice overview.'; }
