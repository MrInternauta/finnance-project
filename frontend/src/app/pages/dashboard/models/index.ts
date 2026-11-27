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
  user?: User;
}

export interface ArticleCreate {
  id?: string | number;
  name: string;
  date: Date;
  description: string;
  quantity: number;
  income?: boolean;
  categoryId?: number;
}

export interface CategoryResponse {
  categories: CategoryItemResponse[];
}

export interface CategoryItemResponse {
  id: number;
  name: string;
  isDefault?: boolean;
}

export interface SummaryCategoryItem {
  categoryId: number | null;
  name: string;
  income: number;
  expense: number;
}

export interface MovementSummary {
  from: string | null;
  to: string | null;
  income: number;
  expense: number;
  balance: number;
  byCategory: SummaryCategoryItem[];
}

export interface SummaryResponse {
  summary: MovementSummary;
}

export interface CategoryCreatedResponse {
  message: string;
  product: CategoryItemResponse;
}

export interface MonthSummary {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface MonthsResponse {
  months: MonthSummary[];
}

export interface BudgetItem {
  id: number;
  category: { id: number; name: string } | null;
  amount: number;
  spent: number;
  remaining: number;
}

export interface BudgetsResponse {
  budgets: BudgetItem[];
}
