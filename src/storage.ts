import Dexie, { type Table } from 'dexie';
import type { Area, Day, Exercise, PracticeLog, TodaySelection } from './domain';
import type { PracticeRepository } from './repository';
import { parseBackup, type PracticeBackup } from './backup';

const starterAreas = ['Scales', 'Left hand', 'Bowing', 'Pieces', 'Other'];

class PracticeDatabase extends Dexie {
  areas!: Table<Area, string>;
  exercises!: Table<Exercise, string>;
  selections!: Table<TodaySelection, [Day, string]>;
  logs!: Table<PracticeLog, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      areas: 'id, sortOrder, archivedAt',
      exercises: 'id, areaId, archivedAt',
      selections: '[day+exerciseId], day, exerciseId',
      logs: 'id, &[day+exerciseId], day, exerciseId, areaId'
    });
  }
}

function requiredName(name: string): string {
  const clean = name.trim();
  if (!clean) throw new Error('Name is required.');
  return clean;
}

export class IndexedDbRepository implements PracticeRepository {
  private db: PracticeDatabase;

  constructor(databaseName = 'cello-practice-companion') {
    this.db = new PracticeDatabase(databaseName);
  }

  async initialize(): Promise<void> {
    await this.db.transaction('rw', this.db.areas, async () => {
      if (await this.db.areas.count()) return;
      const now = new Date().toISOString();
      await this.db.areas.bulkAdd(starterAreas.map((name, sortOrder) => ({
        id: crypto.randomUUID(), name, sortOrder, createdAt: now, updatedAt: now
      })));
    });
  }

  async listAreas(includeArchived = false): Promise<Area[]> {
    const areas = await this.db.areas.toArray();
    return areas.filter((area) => includeArchived || !area.archivedAt)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  async createArea(name: string): Promise<Area> {
    const now = new Date().toISOString();
    const area = { id: crypto.randomUUID(), name: requiredName(name), sortOrder: (await this.db.areas.count()), createdAt: now, updatedAt: now };
    await this.db.areas.add(area);
    return area;
  }

  async renameArea(id: string, name: string): Promise<void> {
    if (!await this.db.areas.update(id, { name: requiredName(name), updatedAt: new Date().toISOString() })) throw new Error('Area not found.');
  }

  async archiveArea(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.areas, this.db.exercises, async () => {
      const area = await this.db.areas.get(id);
      if (!area || area.archivedAt) throw new Error('Active area not found.');
      if (await this.db.exercises.where('areaId').equals(id).filter((exercise) => !exercise.archivedAt).count()) {
        throw new Error('Move or archive active exercises before archiving this area.');
      }
      await this.db.areas.update(id, { archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    });
  }

  async restoreArea(id: string): Promise<void> {
    const area = await this.db.areas.get(id);
    if (!area?.archivedAt) throw new Error('Archived area not found.');
    await this.db.areas.update(id, { archivedAt: undefined, updatedAt: new Date().toISOString() });
  }

  async listExercises(includeArchived = false): Promise<Exercise[]> {
    const exercises = await this.db.exercises.toArray();
    return exercises.filter((exercise) => includeArchived || !exercise.archivedAt)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createExercise(name: string, areaId: string): Promise<Exercise> {
    const area = await this.db.areas.get(areaId);
    if (!area || area.archivedAt) throw new Error('Choose an active area.');
    const now = new Date().toISOString();
    const exercise = { id: crypto.randomUUID(), name: requiredName(name), areaId, createdAt: now, updatedAt: now };
    await this.db.exercises.add(exercise);
    return exercise;
  }

  async updateExercise(id: string, changes: Pick<Exercise, 'name' | 'areaId'>): Promise<void> {
    const area = await this.db.areas.get(changes.areaId);
    if (!area || area.archivedAt) throw new Error('Choose an active area.');
    if (!await this.db.exercises.update(id, { ...changes, name: requiredName(changes.name), updatedAt: new Date().toISOString() })) throw new Error('Exercise not found.');
  }

  async archiveExercise(id: string): Promise<void> {
    if (!await this.db.exercises.update(id, { archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })) throw new Error('Exercise not found.');
  }

  async restoreExercise(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.areas, this.db.exercises, async () => {
      const exercise = await this.db.exercises.get(id);
      if (!exercise?.archivedAt) throw new Error('Archived exercise not found.');
      const area = await this.db.areas.get(exercise.areaId);
      if (!area || area.archivedAt) throw new Error('Restore its practice area before restoring this exercise.');
      await this.db.exercises.update(id, { archivedAt: undefined, updatedAt: new Date().toISOString() });
    });
  }

  listSelections(day: Day): Promise<TodaySelection[]> {
    return this.db.selections.where('day').equals(day).toArray();
  }

  async selectExercise(day: Day, exerciseId: string): Promise<void> {
    const exercise = await this.db.exercises.get(exerciseId);
    if (!exercise || exercise.archivedAt) throw new Error('Active exercise not found.');
    if (await this.db.selections.get([day, exerciseId])) return;
    await this.db.selections.add({ day, exerciseId, createdAt: new Date().toISOString() });
  }

  async removeSelection(day: Day, exerciseId: string): Promise<void> {
    await this.db.selections.delete([day, exerciseId]);
  }

  async listLogs(): Promise<PracticeLog[]> {
    const logs = await this.db.logs.toArray();
    return logs.sort((a, b) => b.day.localeCompare(a.day) || b.createdAt.localeCompare(a.createdAt));
  }

  async logPractice(day: Day, exerciseId: string): Promise<PracticeLog> {
    return this.db.transaction('rw', this.db.logs, this.db.exercises, async () => {
      const previous = await this.db.logs.where('[day+exerciseId]').equals([day, exerciseId]).first();
      if (previous) return previous;
      const exercise = await this.db.exercises.get(exerciseId);
      if (!exercise || exercise.archivedAt) throw new Error('Active exercise not found.');
      const log = { id: crypto.randomUUID(), day, exerciseId, areaId: exercise.areaId, createdAt: new Date().toISOString() };
      await this.db.logs.add(log);
      return log;
    });
  }

  async deleteLog(id: string): Promise<void> {
    await this.db.logs.delete(id);
  }

  async exportBackup(): Promise<PracticeBackup> {
    return this.db.transaction('r', this.db.areas, this.db.exercises, this.db.selections, this.db.logs, async () => ({
      format: 'cello-practice-backup' as const,
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      areas: await this.db.areas.toArray(),
      exercises: await this.db.exercises.toArray(),
      selections: await this.db.selections.toArray(),
      logs: await this.db.logs.toArray()
    }));
  }

  async importBackup(value: unknown): Promise<void> {
    const backup = parseBackup(value);
    await this.db.transaction('rw', this.db.areas, this.db.exercises, this.db.selections, this.db.logs, async () => {
      await Promise.all([this.db.areas.clear(), this.db.exercises.clear(), this.db.selections.clear(), this.db.logs.clear()]);
      await this.db.areas.bulkAdd(backup.areas);
      await this.db.exercises.bulkAdd(backup.exercises);
      await this.db.selections.bulkAdd(backup.selections);
      await this.db.logs.bulkAdd(backup.logs);
    });
  }
}

export const repository = new IndexedDbRepository();
