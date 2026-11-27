export interface ProductsFilterDto {
  name?: string;
  date?: string;
  from?: string;
  to?: string;
  categoryId?: number;
  userId?: number;
  income?: boolean;
  limit?: number;
  offset?: number;
}
