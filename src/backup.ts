import { localDay, type Area, type Exercise, type PracticeLog, type TodaySelection } from './domain';

export interface PracticeBackup {
  format: 'cello-practice-backup';
  version: 1;
  exportedAt: string;
  areas: Area[];
  exercises: Exercise[];
  selections: TodaySelection[];
  logs: PracticeLog[];
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const optionalString = (value: unknown) => value === undefined || string(value);

function validDay(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  return localDay(new Date(year, month - 1, day, 12)) === value;
}

function unique(values: string[]): boolean { return new Set(values).size === values.length; }

/** Validate an untrusted file completely before replacing IndexedDB contents. */
export function parseBackup(value: unknown): PracticeBackup {
  if (!record(value) || value.format !== 'cello-practice-backup' || value.version !== 1 || !string(value.exportedAt)
    || !Array.isArray(value.areas) || !Array.isArray(value.exercises) || !Array.isArray(value.selections) || !Array.isArray(value.logs)) {
    throw new Error('This is not a supported Cello Practice backup.');
  }
  const backup = value as unknown as PracticeBackup;
  if (backup.areas.length === 0 || !backup.areas.every((area) => record(area) && string(area.id) && string(area.name) && typeof area.sortOrder === 'number' && Number.isFinite(area.sortOrder) && string(area.createdAt) && string(area.updatedAt) && optionalString(area.archivedAt))
    || !backup.exercises.every((exercise) => record(exercise) && string(exercise.id) && string(exercise.areaId) && string(exercise.name) && string(exercise.createdAt) && string(exercise.updatedAt) && optionalString(exercise.archivedAt))
    || !backup.selections.every((selection) => record(selection) && validDay(selection.day) && string(selection.exerciseId) && string(selection.createdAt))
    || !backup.logs.every((log) => record(log) && string(log.id) && validDay(log.day) && string(log.exerciseId) && string(log.areaId) && string(log.createdAt))) {
    throw new Error('The backup contains invalid practice data.');
  }
  const areaIds = backup.areas.map((area) => area.id);
  const exerciseIds = backup.exercises.map((exercise) => exercise.id);
  if (!unique(areaIds) || !unique(exerciseIds) || !unique(backup.logs.map((log) => log.id))
    || !unique(backup.logs.map((log) => `${log.day}|${log.exerciseId}`))
    || !unique(backup.selections.map((selection) => `${selection.day}|${selection.exerciseId}`))) {
    throw new Error('The backup contains duplicate records.');
  }
  const areas = new Set(areaIds);
  const exercises = new Set(exerciseIds);
  if (backup.exercises.some((exercise) => !areas.has(exercise.areaId))
    || backup.logs.some((log) => !areas.has(log.areaId) || !exercises.has(log.exerciseId))
    || backup.selections.some((selection) => !exercises.has(selection.exerciseId))) {
    throw new Error('The backup has missing exercise or area references.');
  }
  return backup;
}
