import type { Area, Day, Exercise, PracticeLog, TodaySelection } from './domain';

export interface PracticeRepository {
  initialize(): Promise<void>;
  listAreas(includeArchived?: boolean): Promise<Area[]>;
  createArea(name: string): Promise<Area>;
  renameArea(id: string, name: string): Promise<void>;
  archiveArea(id: string): Promise<void>;
  listExercises(includeArchived?: boolean): Promise<Exercise[]>;
  createExercise(name: string, areaId: string): Promise<Exercise>;
  updateExercise(id: string, changes: Pick<Exercise, 'name' | 'areaId'>): Promise<void>;
  archiveExercise(id: string): Promise<void>;
  listSelections(day: Day): Promise<TodaySelection[]>;
  selectExercise(day: Day, exerciseId: string): Promise<void>;
  removeSelection(day: Day, exerciseId: string): Promise<void>;
  listLogs(): Promise<PracticeLog[]>;
  logPractice(day: Day, exerciseId: string): Promise<PracticeLog>;
  deleteLog(id: string): Promise<void>;
}
