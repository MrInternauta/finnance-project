import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_PREFIX } from 'src/app/core/constants';

import { environment } from '../../../../environments/environment';
import {
  ArticleCreate,
  ArticleItemResponse,
  ArticleResponse,
  BudgetsResponse,
  CategoryCreatedResponse,
  CategoryResponse,
  MonthsResponse,
  SummaryResponse,
} from '../models';
import { ProductsFilterDto } from '../models/productFilter.dto';

const API_URL = `${environment.url}${API_PREFIX}movements`;
const API_URL_CATEGORY = `${environment.url}${API_PREFIX}categories`;
const API_URL_BUDGETS = `${environment.url}${API_PREFIX}budgets`;

@Injectable({
  providedIn: 'root',
})
export class WorkoutService {
  public product?: ArticleItemResponse | null = null;
  constructor(public http: HttpClient) {}

  getCategories(params?: ProductsFilterDto) {
    return this.http.get<CategoryResponse | null>(API_URL_CATEGORY, {
      params: {
        ...params,
      },
    });
  }

  getProducts(params?: ProductsFilterDto) {
    return this.http.get<ArticleResponse | null>(API_URL, {
      params: {
        ...params,
      },
    });
  }

  postProduct(product: ArticleCreate) {
    return this.http.post<any | null>(API_URL, product);
  }

  putProduct(productId: string, product: ArticleCreate) {
    return this.http.put<any | null>(`${API_URL}/${productId}`, product);
  }

  deleteProduct(productId: string) {
    return this.http.delete<any | null>(`${API_URL}/${productId}`);
  }

  getSummary(params?: ProductsFilterDto) {
    return this.http.get<SummaryResponse | null>(`${API_URL}/summary`, {
      params: {
        ...params,
      },
    });
  }

  postCategory(name: string) {
    return this.http.post<CategoryCreatedResponse | null>(API_URL_CATEGORY, { name });
  }

  deleteCategory(categoryId: string | number) {
    return this.http.delete<any | null>(`${API_URL_CATEGORY}/${categoryId}`);
  }

  getMonthlySummary(params?: ProductsFilterDto) {
    return this.http.get<MonthsResponse | null>(`${API_URL}/summary/monthly`, {
      params: {
        ...params,
      },
    });
  }

  exportCsv(params?: ProductsFilterDto) {
    return this.http.get(`${API_URL}/export`, {
      params: {
        ...params,
      },
      responseType: 'blob',
    });
  }

  getBudgets(params?: ProductsFilterDto) {
    return this.http.get<BudgetsResponse | null>(API_URL_BUDGETS, {
      params: {
        ...params,
      },
    });
  }

  postBudget(categoryId: number, amount: number) {
    return this.http.post<any | null>(API_URL_BUDGETS, { categoryId, amount });
  }

  putBudget(budgetId: number, amount: number) {
    return this.http.put<any | null>(`${API_URL_BUDGETS}/${budgetId}`, { amount });
  }

  deleteBudget(budgetId: number) {
    return this.http.delete<any | null>(`${API_URL_BUDGETS}/${budgetId}`);
  }
}
