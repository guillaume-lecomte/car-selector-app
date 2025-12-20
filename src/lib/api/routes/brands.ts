import { Hono } from 'hono';

import { getAllBrands } from '@/lib/db/queries/brands';

import { handleError } from '../errors';

export const brandsRoute = new Hono()
  /**
   * GET /api/brands
   * Récupère toutes les marques
   */
  .get('/', async (c) => {
    try {
      const result = await getAllBrands();
      
      return c.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });

    } catch (error) {
      return handleError(c, error);
    }
  });
