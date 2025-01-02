import { ActionReducerMap } from '@ngrx/store';

import * as auth from '../../auth/state/auth.state';
import * as product from '../../pages/dashboard/state/workout.state';

export interface AppState {
  session_data: auth.IAuthState;
  // exercises: product.ExerciseState;
  // cart: cart.CartState;
}

export const appReducers: ActionReducerMap<AppState> = {
  session_data: auth.authReducer,
  // exercises: product.ExerciseReducer,
  // cart: cart.CartReducer,
};
