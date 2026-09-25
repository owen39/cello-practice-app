import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { areaSummary, exerciseSummary } from './domain';
import { IndexedDbRepository } from './storage';

function fresh() {
  return new IndexedDbRepository(`cello-test-${crypto.randomUUID()}`);
}

describe('local repository', () => {
  it('seeds suggested areas once and preserves created exercises across repository instances', async () => {
    const name = `cello-test-${crypto.randomUUID()}`;
    const first = new IndexedDbRepository(name);
    await first.initialize();
    const areas = await first.listAreas();
    expect(areas.map((area) => area.name)).toEqual(['Scales', 'Left hand', 'Bowing', 'Pieces', 'Other']);
    const exercise = await first.createExercise('Open strings', areas[2].id);
    const reopened = new IndexedDbRepository(name);
    await reopened.initialize();
    expect(await reopened.listAreas()).toHaveLength(5);
    expect(await reopened.listExercises()).toEqual([exercise]);
  });

  it('makes logging idempotent and keeps the historical area when an exercise moves', async () => {
    const repo = fresh();
    await repo.initialize();
    const [scales, , bowing] = await repo.listAreas();
    const exercise = await repo.createExercise('Slow bows', bowing.id);
    const first = await repo.logPractice('2026-09-24', exercise.id);
    expect(await repo.listSelections('2026-09-24')).toEqual([]);
    expect(await repo.logPractice('2026-09-24', exercise.id)).toEqual(first);
    await repo.updateExercise(exercise.id, { name: exercise.name, areaId: scales.id });
    const next = await repo.logPractice('2026-09-25', exercise.id);
    expect([first.areaId, next.areaId]).toEqual([bowing.id, scales.id]);
    expect(await repo.listLogs()).toHaveLength(2);
    await repo.deleteLog(first.id);
    expect(await repo.listLogs()).toEqual([next]);
  });

  it('keeps a log when selection is removed and guards area history', async () => {
    const repo = fresh();
    await repo.initialize();
    const bowing = (await repo.listAreas())[2];
    const exercise = await repo.createExercise('String crossings', bowing.id);
    await repo.selectExercise('2026-09-24', exercise.id);
    const selection = await repo.listSelections('2026-09-24');
    await repo.selectExercise('2026-09-24', exercise.id);
    expect(await repo.listSelections('2026-09-24')).toEqual(selection);
    expect(await repo.listSelections('2026-09-25')).toEqual([]);
    await repo.logPractice('2026-09-24', exercise.id);
    await repo.removeSelection('2026-09-24', exercise.id);
    expect(await repo.listSelections('2026-09-24')).toEqual([]);
    expect(await repo.listLogs()).toHaveLength(1);
    expect((await repo.listLogs())[0].day).toBe('2026-09-24');
    await repo.selectExercise('2026-09-25', exercise.id);
    expect(await repo.listSelections('2026-09-25')).toHaveLength(1);
    expect(await repo.listSelections('2026-09-24')).toEqual([]);
    expect(await repo.listLogs()).toHaveLength(1);
    await expect(repo.archiveArea(bowing.id)).rejects.toThrow('Move or archive');
    await repo.archiveExercise(exercise.id);
    await repo.archiveArea(bowing.id);
    expect(await repo.listExercises()).toEqual([]);
    expect(await repo.listExercises(true)).toHaveLength(1);
    expect(await repo.listAreas(true)).toHaveLength(5);
  });

  it('allows archiving an emptied area after recategorization without changing a past log', async () => {
    const repo = fresh();
    await repo.initialize();
    const [scales, , bowing] = await repo.listAreas();
    const exercise = await repo.createExercise('Bow circles', bowing.id);
    const past = await repo.logPractice('2026-09-23', exercise.id);
    await repo.updateExercise(exercise.id, { name: 'Bow circles', areaId: scales.id });
    await repo.archiveArea(bowing.id);
    expect((await repo.listAreas()).some((area) => area.id === bowing.id)).toBe(false);
    expect((await repo.listAreas(true)).find((area) => area.id === bowing.id)?.archivedAt).toBeDefined();
    expect((await repo.listLogs()).find((log) => log.id === past.id)?.areaId).toBe(bowing.id);
  });

  it('retains archived exercise names and recomputes counts after a correction', async () => {
    const repo = fresh();
    await repo.initialize();
    const area = (await repo.listAreas())[0];
    const exercise = await repo.createExercise('C major scale', area.id);
    const log = await repo.logPractice('2026-09-24', exercise.id);
    await repo.archiveExercise(exercise.id);
    expect(await repo.listExercises()).toEqual([]);
    expect((await repo.listExercises(true))[0].name).toBe('C major scale');
    expect(exerciseSummary(await repo.listLogs(), exercise.id, '2026-09-24').days7).toBe(1);
    await repo.deleteLog(log.id);
    expect(exerciseSummary(await repo.listLogs(), exercise.id, '2026-09-24').days7).toBe(0);
    expect(areaSummary(await repo.listLogs(), area.id, '2026-09-24').lastPracticed).toBeUndefined();
  });

  it('restores archived areas before their exercises while retaining practice history', async () => {
    const repo = fresh();
    await repo.initialize();
    const area = (await repo.listAreas())[0];
    const exercise = await repo.createExercise('C major scale', area.id);
    const log = await repo.logPractice('2026-09-24', exercise.id);
    await repo.archiveExercise(exercise.id);
    await repo.archiveArea(area.id);
    await expect(repo.restoreExercise(exercise.id)).rejects.toThrow('Restore its practice area');
    await repo.restoreArea(area.id);
    await repo.restoreExercise(exercise.id);
    expect((await repo.listAreas()).some((item) => item.id === area.id)).toBe(true);
    expect((await repo.listExercises()).some((item) => item.id === exercise.id)).toBe(true);
    expect(await repo.listLogs()).toEqual([log]);
    await expect(repo.restoreExercise(exercise.id)).rejects.toThrow('Archived exercise not found');
  });

  it('round-trips a local backup including archived records, selections, and logs', async () => {
    const source = fresh();
    await source.initialize();
    const area = (await source.listAreas())[2];
    const exercise = await source.createExercise('Slow bow', area.id);
    await source.selectExercise('2026-09-24', exercise.id);
    await source.logPractice('2026-09-24', exercise.id);
    await source.archiveExercise(exercise.id);
    const backup = await source.exportBackup();
    const destination = fresh();
    await destination.initialize();
    await destination.importBackup(JSON.parse(JSON.stringify(backup)) as unknown);
    const restored = await destination.exportBackup();
    expect({ ...restored, exportedAt: backup.exportedAt }).toEqual(backup);
    expect((await destination.listExercises(true))[0].name).toBe('Slow bow');
  });

  it('rejects an invalid backup before replacing current data', async () => {
    const repo = fresh();
    await repo.initialize();
    const area = (await repo.listAreas())[0];
    const exercise = await repo.createExercise('Open strings', area.id);
    const backup = await repo.exportBackup();
    backup.exercises[0].areaId = 'missing-area';
    await expect(repo.importBackup(backup)).rejects.toThrow('missing exercise or area references');
    expect((await repo.listExercises())[0].id).toBe(exercise.id);
  });
});
