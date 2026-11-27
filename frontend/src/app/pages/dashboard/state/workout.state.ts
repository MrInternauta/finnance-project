import { Action, createReducer, on } from '@ngrx/store';
import { ArticleResponse, MovementSummary } from '../models';
import { loadedDashboard, loadedExercise } from './workout.actions';

export const ExerciseFeatureKey = 'Exercise';
export const SummaryFeatureKey = 'Summary';
export interface ExerciseState {
  [ExerciseFeatureKey]: ArticleResponse | null;
  [SummaryFeatureKey]: MovementSummary | null;
}

export const exerciseInitialState: ExerciseState = {
  [ExerciseFeatureKey]: null,
  [SummaryFeatureKey]: null,
};

const _ExerciseReducer = createReducer(
  exerciseInitialState,
  on(loadedExercise, (state, { Exercise }) => ({
    ...state,
    [ExerciseFeatureKey]: Exercise,
  })),
  on(loadedDashboard, (state, { movements, summary }) => ({
    ...state,
    [ExerciseFeatureKey]: movements,
    [SummaryFeatureKey]: summary,
  }))
);

export function ExerciseReducer(state: any, action: Action) {
  return _ExerciseReducer(state, action);
}
