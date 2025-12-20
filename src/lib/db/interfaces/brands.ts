import { type Brand } from '../schema';

export type BrandInput = Omit<Brand, 'id' | 'createdAt'>;
