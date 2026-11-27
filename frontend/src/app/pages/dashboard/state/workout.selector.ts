import { AppState } from '@gymTrack/core';
import { createSelector, DefaultProjectorFn, MemoizedSelector } from '@ngrx/store';
import { ArticleResponse, MovementSummary } from '../models';
import { ExerciseFeatureKey, ExerciseState, SummaryFeatureKey } from './workout.state';

export interface FeatureState {
  counter: number;
}

export const selectExerciseFeature = (state: AppState) => state.exercises;

export const selectListExercise: MemoizedSelector<
  AppState,
  ArticleResponse | null,
  DefaultProjectorFn<any | null>
> = createSelector(selectExerciseFeature, (state: ExerciseState) => state[ExerciseFeatureKey]);

export const selectMovements = createSelector(
  selectExerciseFeature,
  (state: ExerciseState) => state[ExerciseFeatureKey]?.movements || []
);

export const selectSummary: MemoizedSelector<
  AppState,
  MovementSummary | null,
  DefaultProjectorFn<MovementSummary | null>
> = createSelector(selectExerciseFeature, (state: ExerciseState) => state[SummaryFeatureKey]);
