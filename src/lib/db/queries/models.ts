import { eq, asc, count } from 'drizzle-orm';

import { AppError } from '@/lib/api/errors';
import { db } from '@/lib/db/client';
import { brands, models, type ModelWithBrand } from '@/lib/db/schema';
import { calculatePaginationMeta } from '@/lib/utils';

import { type Model } from '../interfaces/models';
import { type PaginatedResult } from '../interfaces/query-result';

/**
 * Récupère tous les modèles d'une marque avec pagination
 * @param brandId - ID de la marque
 * @param options - Options de pagination
 * @returns Promise avec les modèles paginés et métadonnées
 * @throws AppError(400) si l'ID de la marque est invalide
 * @throws AppError(404) si la marque n'existe pas
 */
export async function getModelsByBrand(
  brandId: number,
  options: {
    limit?: number;
    offset?: number;
    includeBrand?: boolean;
  } = {},
): Promise<PaginatedResult<Model>> {
  try {
    if (!Number.isInteger(brandId) || brandId <= 0) {
      throw new AppError(400, 'Invalid brand ID', 'INVALID_BRAND_ID', { brandId });
    }

    const [brand] = await db
      .select({ id: brands.id, name: brands.name, createdAt: brands.createdAt })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    if (!brand) {
      throw new AppError(404, `Brand with ID ${brandId} not found`, 'BRAND_NOT_FOUND', { brandId });
    }

    const { limit = 100, offset = 0, includeBrand = false } = options;

    const [modelsResult, countResult] = await Promise.all([
      db.select(getModelColumns(includeBrand))
        .from(models)
        .where(eq(models.brandId, brandId))
        .orderBy(asc(models.name))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() })
        .from(models)
        .where(eq(models.brandId, brandId)),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      data: modelsResult as Model[],
      meta: calculatePaginationMeta(
        Math.floor(offset / limit) + 1,
        limit,
        total,
      ),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      500,
      'Failed to fetch models from database',
      'DB_QUERY_ERROR',
      { brandId, originalError: error },
    );
  }
}

/**
 * Vérifie si un modèle existe
 * @param modelId - ID du modèle
 * @returns Promise<boolean> - true si le modèle existe
 */
export async function modelExists(modelId: number): Promise<boolean> {
  try {
    if (!Number.isInteger(modelId) || modelId <= 0) return false;

    const [result] = await db
      .select({ id: models.id })
      .from(models)
      .where(eq(models.id, modelId))
      .limit(1);

    return !!result;
  } catch {
    return false;
  }
}

/**
 * Valide qu'un modèle appartient à une marque donnée
 * @param modelId - ID du modèle
 * @param brandId - ID de la marque
 * @returns Promise<ModelWithBrand> - Le modèle validé
 * @throws AppError(400) si le modèle n'appartient pas à la marque
 * @throws AppError(404) si le modèle ou la marque n'existe pas
 */
export async function validateModelBrand(
  modelId: number,
  brandId: number,
): Promise<ModelWithBrand> {
  try {
    const model = await getModelById(modelId);

    if (model.brandId !== brandId) {
      throw new AppError(
        400,
        `Model ${modelId} does not belong to brand ${brandId}`,
        'MODEL_BRAND_MISMATCH',
        {
          modelId,
          expectedBrandId: brandId,
          actualBrandId: model.brandId,
          modelName: model.name,
          brandName: model.brand.name,
        },
      );
    }

    return model;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      500,
      'Failed to validate model-brand relationship',
      'VALIDATION_ERROR',
      {
        modelId,
        brandId,
        originalError: error instanceof Error ? error.message : String(error),
      },
    );
  }
}

/**
 * Récupère un modèle par son ID avec sa marque associée
 * @param modelId - ID du modèle
 * @returns Promise avec le modèle complet
 * @throws AppError(404) si le modèle n'existe pas
 */
async function getModelById(modelId: number): Promise<ModelWithBrand> {
  try {
    if (!Number.isInteger(modelId) || modelId <= 0) {
      throw new AppError(
        400,
        'Invalid model ID',
        'INVALID_MODEL_ID',
        { modelId },
      );
    }

    const [model] = await db
      .select({
        ...getModelColumns(),
        brand: {
          id: brands.id,
          name: brands.name,
        },
      })
      .from(models)
      .where(eq(models.id, modelId))
      .leftJoin(brands, eq(models.brandId, brands.id))
      .limit(1);

    if (!model) {
      throw new AppError(
        404,
        `Model with ID ${modelId} not found`,
        'MODEL_NOT_FOUND',
        { modelId },
      );
    }

    return model as ModelWithBrand;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      500,
      'Failed to fetch model from database',
      'DB_QUERY_ERROR',
      {
        modelId,
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    );
  }
}

function getModelColumns(includeBrand: boolean = false) {
  const baseColumns = {
    id: models.id,
    name: models.name,
    brandId: models.brandId,
    createdAt: models.createdAt,
  };

  if (includeBrand) {
    return {
      ...baseColumns,
      brand: {
        id: brands.id,
        name: brands.name,
        createdAt: brands.createdAt,
      },
    };
  }

  return baseColumns;
}
