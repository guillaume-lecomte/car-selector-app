import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { getModelsByBrand } from '@/lib/db/queries/models';

import { handleError } from '../errors';
import { ModelsQuerySchema } from '../schemas';

export const modelsRoute = new Hono()
  /**
   * GET /api/models?brandId=1
   * Récupère tous les modèles d'une marque
   */
  .get('/', zValidator('query', ModelsQuerySchema), async (c) => {
    try {
      const { brandId } = c.req.valid('query');
      const result = await getModelsByBrand(brandId);
      
      return c.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });

    } catch (error) {
      return handleError(c, error);
    }
  });
