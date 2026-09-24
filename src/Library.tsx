import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { exerciseSummary, type Area, type Exercise, type PracticeLog } from './domain';
import { repository } from './storage';
import { useLocalDay } from './useLocalDay';

interface Catalog { areas: Area[]; exercises: Exercise[]; logs: PracticeLog[] }
const emptyCatalog: Catalog = { areas: [], exercises: [], logs: [] };

export function Library() {
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [search, setSearch] = useState('');
  const [areaName, setAreaName] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseAreaId, setExerciseAreaId] = useState('');
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAreaId, setEditAreaId] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const today = useLocalDay();

  const refresh = useCallback(async () => {
    const [areas, exercises, logs] = await Promise.all([
      repository.listAreas(), repository.listExercises(), repository.listLogs()
    ]);
    setCatalog({ areas, exercises, logs });
    setExerciseAreaId((current) => areas.some((area) => area.id === current) ? current : (areas[0]?.id ?? ''));
  }, []);

  useEffect(() => {
    void refresh().catch((cause: unknown) => setError(message(cause)));
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh().catch((cause: unknown) => setError(message(cause))); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  async function perform(action: () => Promise<unknown>, after?: () => void) {
    setError(undefined);
    setBusy(true);
    try { await action(); await refresh(); after?.(); }
    catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  const filtered = useMemo(() => catalog.exercises.filter((exercise) =>
    exercise.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ), [catalog.exercises, search]);

  function submitArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void perform(() => repository.createArea(areaName), () => setAreaName(''));
  }

  function submitExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void perform(() => repository.createExercise(exerciseName, exerciseAreaId), () => setExerciseName(''));
  }

  function beginAreaEdit(area: Area) { setEditingExercise(null); setEditingArea(area.id); setEditName(area.name); }
  function beginExerciseEdit(exercise: Exercise) { setEditingArea(null); setEditingExercise(exercise.id); setEditName(exercise.name); setEditAreaId(exercise.areaId); }

  return <div className="library">
    {error && <p role="alert" className="notice error">{error}</p>}
    <section className="card library-create" aria-labelledby="add-exercise-heading">
      <h2 id="add-exercise-heading">Add an exercise</h2>
      <form className="form-row" onSubmit={submitExercise}>
        <label>Exercise name<input value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} maxLength={120} required placeholder="e.g. Slow bows" /></label>
        <label>Practice area<select value={exerciseAreaId} onChange={(event) => setExerciseAreaId(event.target.value)} required>{catalog.areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
        <button className="primary" disabled={busy || !exerciseAreaId}>Add exercise</button>
      </form>
    </section>
    <section className="card library-areas" aria-labelledby="areas-heading">
      <div className="section-heading"><div><h2 id="areas-heading">Practice areas</h2><p>Rename areas as your practice changes. Archive an empty area when you no longer need it.</p></div></div>
      <form className="form-row compact" onSubmit={submitArea}>
        <label>New area<input value={areaName} onChange={(event) => setAreaName(event.target.value)} maxLength={80} required placeholder="e.g. Etudes" /></label>
        <button className="secondary" disabled={busy}>Add area</button>
      </form>
      <ul className="area-management">{catalog.areas.map((area) => {
        const activeCount = catalog.exercises.filter((exercise) => exercise.areaId === area.id).length;
        return <li key={area.id}>
          {editingArea === area.id ? <form className="inline-form" onSubmit={(event) => { event.preventDefault(); void perform(() => repository.renameArea(area.id, editName), () => setEditingArea(null)); }}>
            <label><span className="sr-only">Rename {area.name}</span><input autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={80} required /></label>
            <button className="small primary" disabled={busy}>Save</button><button className="small text-button" type="button" onClick={() => setEditingArea(null)}>Cancel</button>
          </form> : <><span><strong>{area.name}</strong><small>{activeCount} active {activeCount === 1 ? 'exercise' : 'exercises'}</small></span><div className="actions"><button className="small text-button" onClick={() => beginAreaEdit(area)} disabled={busy}>Rename</button><button className="small text-button" disabled={busy || activeCount > 0} title={activeCount > 0 ? 'Move or archive its active exercises first' : undefined} onClick={() => void perform(() => repository.archiveArea(area.id))}>Archive</button></div></>}
          {activeCount > 0 && <p className="helper">Move or archive its exercises before archiving this area.</p>}
        </li>;
      })}</ul>
    </section>
    <section className="library-browse" aria-labelledby="browse-heading">
      <div className="section-heading"><div><h2 id="browse-heading">Your exercises</h2><p>{catalog.exercises.length} active {catalog.exercises.length === 1 ? 'exercise' : 'exercises'}</p></div><label className="search-label">Search exercises<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an exercise" /></label></div>
      {catalog.exercises.length === 0 ? <div className="card empty"><h3>Start your library</h3><p>Add an exercise above. You can decide when to practice it later.</p></div> : filtered.length === 0 ? <div className="card empty"><h3>No matches</h3><p>Try a different search term.</p></div> : catalog.areas.map((area) => {
        const exercises = filtered.filter((exercise) => exercise.areaId === area.id);
        if (exercises.length === 0) return null;
        return <section className="area-group" aria-labelledby={`area-${area.id}`} key={area.id}><h3 id={`area-${area.id}`}>{area.name}</h3><ul className="exercise-list">{exercises.map((exercise) => {
          const summary = exerciseSummary(catalog.logs, exercise.id, today);
          const todayLog = catalog.logs.find((log) => log.exerciseId === exercise.id && log.day === today);
          return <li className="card exercise-card" key={exercise.id}>
            {editingExercise === exercise.id ? <form className="edit-exercise" onSubmit={(event) => { event.preventDefault(); void perform(() => repository.updateExercise(exercise.id, { name: editName, areaId: editAreaId }), () => setEditingExercise(null)); }}>
              <label>Exercise name<input autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={120} required /></label>
              <label>Practice area<select value={editAreaId} onChange={(event) => setEditAreaId(event.target.value)}>{catalog.areas.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label>
              <div className="actions"><button className="small primary" disabled={busy}>Save changes</button><button className="small text-button" type="button" onClick={() => setEditingExercise(null)}>Cancel</button></div>
            </form> : <><div className="exercise-main"><div><h4>{exercise.name}</h4><p className="exercise-meta">{summary.lastPracticed ? `Last practiced ${summary.lastPracticed}` : 'Not practiced yet'} · {summary.days7} days in the past 7 · {summary.days30} days in the past 30</p></div><div className="actions"><button className="small text-button" onClick={() => beginExerciseEdit(exercise)} disabled={busy}>Edit</button><button className="small text-button" onClick={() => void perform(() => repository.archiveExercise(exercise.id))} disabled={busy}>Archive</button></div></div><div className="practice-action">{todayLog ? <button className="secondary" onClick={() => void perform(() => repository.deleteLog(todayLog.id))} disabled={busy}>Practiced today · Undo</button> : <button className="primary" onClick={() => void perform(() => repository.logPractice(today, exercise.id))} disabled={busy}>Mark practiced today</button>}</div></>}
          </li>;
        })}</ul></section>;
      })}
    </section>
  </div>;
}

function message(cause: unknown): string { return cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'; }
