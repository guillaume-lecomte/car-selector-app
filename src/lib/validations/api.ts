import { z } from 'zod';

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

export type ModelsQueryInput = z.infer<typeof ModelsQuerySchema>;

export const SelectionSchema = z.object({
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
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional()
    .nullable()
    .transform((val) => val === undefined ? null : val),
});

export type SelectionInput = z.infer<typeof SelectionSchema>;

export const PaginationSchema = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10))),
  
  limit: z
    .string()
    .default('20')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10)))),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
