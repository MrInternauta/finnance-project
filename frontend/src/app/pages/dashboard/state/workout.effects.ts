import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, forkJoin } from 'rxjs';
import { map, mergeMap, catchError, take } from 'rxjs/operators';
import { WorkoutService } from '../services/workout.service';
import { loadDashboard, loadDashboardType, loadExerciseType, loadedDashboardType, loadedExerciseType } from './workout.actions';

@Injectable()
export class ExercisesEffects {
  loadExercises$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadExerciseType),
      mergeMap(() =>
        this.exercisesService.getProducts().pipe(
          map((response) => ({
            type: loadedExerciseType,
            Exercise: response,
          })),
          catchError(() => EMPTY)
        )
      )
    )
  );

  loadDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadDashboardType),
      mergeMap((action: ReturnType<typeof loadDashboard>) =>
        forkJoin({
          movements: this.exercisesService.getProducts(action.params),
          // Summary always covers the full period: only the date range applies, never the income filter.
          summary: this.exercisesService.getSummary({ from: action.params?.from, to: action.params?.to }),
        }).pipe(
          map(({ movements, summary }) => ({
            type: loadedDashboardType,
            movements,
            summary: summary?.summary || null,
          })),
          catchError(() => EMPTY)
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private exercisesService: WorkoutService
  ) {}
}
