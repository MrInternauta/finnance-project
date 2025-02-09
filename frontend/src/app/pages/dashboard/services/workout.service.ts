import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_PREFIX } from 'src/app/core/constants';

import { environment } from '../../../../environments/environment';
import { ArticleCreate, ArticleItemResponse, ArticleResponse, CategoryResponse } from '../models';
import { ProductsFilterDto } from '../models/productFilter.dto';
import { AuthService } from '../../../auth/services/auth.service';

const API_URL = `${environment.url}${API_PREFIX}movements`;
const API_URL_CATEGORY = `${environment.url}${API_PREFIX}categories`;

@Injectable({
  providedIn: 'root',
})
export class WorkoutService {
  
  public product?: ArticleItemResponse | null = null;
  constructor(public http: HttpClient, private authService: AuthService) {}

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
    product.userId = this.authService.user?.id || 0;
    return this.http.post<any | null>(API_URL, product);
  }

  putProduct(productId: string, product: ArticleCreate) {
    product.userId = this.authService.user?.id || 0;
    return this.http.put<any | null>(`${API_URL}/${productId}`, product);
  }

  deleteProduct(productId: string) {
    return this.http.delete<any | null>(`${API_URL}/${productId}`);
  }
}
