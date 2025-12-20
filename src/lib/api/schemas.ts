import { z } from 'zod';

export const IdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Brands
export const BrandIdSchema = z.object({
  brandId: z.coerce.number().int().positive(),
});

export const CreateBrandSchema = z.object({
  name: z.string().min(2).max(50),
});

export const UpdateBrandSchema = CreateBrandSchema.partial();

// Models
export const ModelIdSchema = z.object({
  modelId: z.coerce.number().int().positive(),
});

export const CreateModelSchema = z.object({
  name: z.string().min(2).max(50),
  brandId: z.coerce.number().int().positive(),
});

export const UpdateModelSchema = CreateModelSchema.partial();

export const BrandIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        throw new Error('Brand ID must be a valid number');
      }
      return parsed;
    })
    .pipe(z.number().int().positive('Brand ID must be a positive integer')),
});

export const ModelsQuerySchema = z.object({
  brandId: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        throw new Error('brandId must be a valid number');
      }
      return parsed;
    })
    .pipe(z.number().int().positive('brandId must be a positive integer')),
});

export const ModelIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        throw new Error('Model ID must be a valid number');
      }
      return parsed;
    })
    .pipe(z.number().int().positive('Model ID must be a positive integer')),
});

export const SelectionIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        throw new Error('Selection ID must be a valid number');
      }
      return parsed;
    })
    .pipe(z.number().int().positive('Selection ID must be a positive integer')),
});

export const CreateSelectionSchema = z.object({
  brandId: z
    .number()
    .int()
    .positive('brandId must be a positive integer'),

  modelId: z
    .number()
    .int()
    .positive('modelId must be a positive integer'),

  year: z
    .number()
    .int()
    .min(1900, 'Year must be after 1900')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the distant future')
    .optional()
    .nullable(),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const SelectionFilterQuerySchema = PaginationQuerySchema.extend({
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().positive().optional(),
});
