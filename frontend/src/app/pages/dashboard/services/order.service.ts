import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_PREFIX } from 'src/app/core/constants';

import { environment } from '../../../../environments/environment';
import { OrderFilterDto } from '../models/order.filter.dto';
import { OrderResponse } from '../models/order.model';
import { ArticleResponse } from '@gymTrack/pages/dashboard/models';

const API_URL = `${environment.url}${API_PREFIX}movements`;

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  public itemSelected!: OrderResponse | null;
  constructor(public http: HttpClient) {}

  getOrders(params?: OrderFilterDto) {
    return this.http.get<ArticleResponse | null>(API_URL, {
      params: {
        ...params,
      },
    });
  }
}
