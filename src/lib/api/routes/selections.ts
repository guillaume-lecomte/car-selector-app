import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { createSelection, deleteSelection, getAllSelections, getSelectionsByBrandAndModel } from '@/lib/db/queries/selections';

import { handleError } from '../errors';
import { CreateSelectionSchema, SelectionFilterQuerySchema, SelectionIdParamSchema } from '../schemas';

export const selectionsRoute = new Hono()
  /**
   * GET /api/selections
   * Récupère toutes les sélections avec pagination et filtres optionnels
   * 
   * Query params:
   * - page: number (default: 1)
   * - limit: number (default: 10, max: 100)
   * - brandId: number (optional)
   * - modelId: number (optional)
   * - year: number (optional)
   **/
  .get('/', zValidator('query', SelectionFilterQuerySchema), async (c) => {
    try {
      const query = c.req.valid('query');
      let result;

      if (query.brandId && query.modelId) {
        result = await getSelectionsByBrandAndModel(
          query.brandId,
          query.modelId,
          query.year ?? undefined,
          { page: query.page, limit: query.limit },
        );
      } else {
        result = await getAllSelections({
          page: query.page,
          limit: query.limit,
        });
      }

      return c.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return handleError(c, error);
    }
  })

  /**
   * POST /api/selections
   * Crée une nouvelle sélection
   */
  .post('/', zValidator('json', CreateSelectionSchema), async (c) => {
    try {
      const data = c.req.valid('json');
      const selection = await createSelection(data);
      
      return c.json(
        { 
          success: true, 
          data: selection, 
        },
        201,
      );
    } catch (error) {
      return handleError(c, error);
    }
  })

  /**
   * DELETE /api/selections/:id
   * Supprime une sélection
   */
  .delete('/:id', zValidator('param', SelectionIdParamSchema), async (c) => {
    try {
      const { id } = c.req.valid('param');
      const deleted = await deleteSelection(id);
      
      return c.json({ 
        success: true, 
        data: deleted,
        message: `Selection ${id} deleted successfully`, 
      });
    } catch (error) {
      return handleError(c, error);
    }
  });
