import { type PaginationMeta } from '@/lib/api/interfaces';

import { type Brand, type ModelWithBrand, type Selection } from '../schema';

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
export type BrandQueryResult = PaginatedResult<Brand>;
export type ModelQueryResult = PaginatedResult<ModelWithBrand>;
export type SelectionQueryResult = PaginatedResult<Selection>;
