import { createAction, props } from '@ngrx/store';
import { ArticleResponse, MovementSummary } from '../models';
import { ProductsFilterDto } from '../models/productFilter.dto';

export const loadExerciseType = '[Exercise] loadExercise Success';
export const loadExercise = createAction(loadExerciseType);

export const loadedExerciseType = '[Exercise] Loaded Exercise Success';
export const loadedExercise = createAction(loadedExerciseType, props<{ Exercise: ArticleResponse }>());

export const loadDashboardType = '[Dashboard] Load Dashboard';
export const loadDashboard = createAction(loadDashboardType, props<{ params?: ProductsFilterDto }>());

export const loadedDashboardType = '[Dashboard] Loaded Dashboard';
export const loadedDashboard = createAction(
  loadedDashboardType,
  props<{ movements: ArticleResponse | null; summary: MovementSummary | null }>()
);
