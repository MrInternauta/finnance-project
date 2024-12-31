import { User } from 'src/app/core/models';
export interface ArticleResponse {
  movements: ArticleItemResponse[];
}

export interface ArticleItemResponse {
  id: number;
  categoryId?: number;
  userId?: number;
  name: string;
  date: Date;
  description: string;
  quantity: number;
  income?: boolean;
  category?: CategoryItemResponse;
  user?: User
}

export interface ArticleCreate {
  id?: string | number;
  name: string;
  date: Date;
  description: string;
  quantity: number;
  income?: boolean;
  categoryId?: number;
  userId?: number;

}

export interface CategoryResponse {
  categories: CategoryItemResponse[];
}

export interface CategoryItemResponse {
  id: number;
  name: string;
}
