import { type Brand } from '../schema';

export interface Model {
  id: number;
  name: string;
  brandId: number;
  createdAt?: Date;
  updatedAt?: Date;
  brand?: Brand;
}

export interface ModelWithBrand extends Model {
  brand: Brand;
}

export type ModelInput = Omit<Model, 'id' | 'createdAt' | 'brand'>;
