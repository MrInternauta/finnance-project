export interface ProductsFilterDto {
  name?: string;
  date?: string;
  categoryId?: number;
  userId?: number;
  income?: boolean;
  limit: number;
  offset: number;
}
