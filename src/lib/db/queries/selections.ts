import { eq, and, desc, isNull, sql } from 'drizzle-orm';

import { AppError } from '@/lib/api/errors';
import { type PaginatedResponse, type PaginationParams } from '@/lib/api/interfaces';
import { db } from '@/lib/db/client';
import { brands, models, type Selection, type SelectionInput, selections } from '@/lib/db/schema';
import { calculatePaginationMeta, validatePaginationParams } from '@/lib/utils';

import { validateModelBrand } from './models';
import { type PaginatedResult } from '../interfaces/query-result';

/**
 * Récupère toutes les sélections avec pagination
 * @param params - Paramètres de pagination (page et limit)
 * @returns Promise contenant les sélections paginées et les métadonnées de pagination
 * @throws AppError(500) en cas d'erreur de base de données
 */
export async function getAllSelections(
  params: PaginationParams = {},
): Promise<PaginatedResult<Selection>> {
  try {
    const { page, limit } = validatePaginationParams(params);
    const offset = (page - 1) * limit;

    const [totalResult, data] = await Promise.all([
      db.select({ total: sql<number>`count(*)::int` }).from(selections),
      db.select({
        id: selections.id,
        brandId: selections.brandId,
        modelId: selections.modelId,
        year: selections.year,
        createdAt: selections.createdAt,
        brand: {
          id: brands.id,
          name: brands.name,
          createdAt: brands.createdAt,
        },
        model: {
          id: models.id,
          name: models.name,
          brandId: models.brandId,
          createdAt: models.createdAt,
        },
      })
        .from(selections)
        .innerJoin(brands, eq(selections.brandId, brands.id))
        .innerJoin(models, eq(selections.modelId, models.id))
        .orderBy(desc(selections.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      data: data as Selection[],
      meta: calculatePaginationMeta(page, limit, total),
    };
  } catch (error) {
    throw new AppError(
      500,
      'Failed to fetch selections from database',
      'DB_QUERY_ERROR',
      { originalError: error },
    );
  }
}

/**
 * Récupère les sélections par marque, modèle et année avec pagination
 * @param brandId - ID de la marque à filtrer
 * @param modelId - ID du modèle à filtrer
 * @param year - Année optionnelle pour filtrer (null pour les sélections sans année)
 * @param params - Paramètres de pagination (page et limit)
 * @returns Promise contenant les sélections filtrées paginées et les métadonnées de pagination
 * @throws AppError(400) si les IDs fournis sont invalides
 * @throws AppError(500) en cas d'erreur de base de données
 */
export async function getSelectionsByBrandAndModel(
  brandId: number,
  modelId: number,
  year?: number | null,
  params: PaginationParams = {},
): Promise<PaginatedResponse<Selection>> {
  try {
    const { page, limit } = validatePaginationParams(params);
    const offset = (page - 1) * limit;

    if (!Number.isInteger(brandId) || brandId <= 0) {
      throw new AppError(400, 'Invalid brand ID', 'INVALID_BRAND_ID', { brandId });
    }

    if (!Number.isInteger(modelId) || modelId <= 0) {
      throw new AppError(400, 'Invalid model ID', 'INVALID_MODEL_ID', { modelId });
    }

    const conditions = [
      eq(selections.brandId, brandId),
      eq(selections.modelId, modelId),
    ];

    if (year !== undefined) {
      conditions.push(
        year === null ? isNull(selections.year) : eq(selections.year, year),
      );
    }

    const whereClause = and(...conditions);

    const [totalResult, data] = await Promise.all([
      db.select({ total: sql<number>`count(*)::int` })
        .from(selections)
        .where(whereClause),
      db.select({
        id: selections.id,
        brandId: selections.brandId,
        modelId: selections.modelId,
        year: selections.year,
        createdAt: selections.createdAt,
        brand: {
          id: brands.id,
          name: brands.name,
          createdAt: brands.createdAt,
        },
        model: {
          id: models.id,
          name: models.name,
          brandId: models.brandId,
          createdAt: models.createdAt,
        },
      })
        .from(selections)
        .innerJoin(brands, eq(selections.brandId, brands.id))
        .innerJoin(models, eq(selections.modelId, models.id))
        .where(whereClause)
        .orderBy(desc(selections.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = totalResult[0]?.total ?? 0;
    const meta = calculatePaginationMeta(page, limit, total);

    return { data: data as Selection[], meta };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Failed to fetch selections:', error);
    throw new AppError(
      500,
      'Failed to fetch selections',
      'DB_QUERY_ERROR',
      { brandId, modelId, year, originalError: error },
    );
  }
}

/**
 * Récupère une sélection par son ID avec toutes ses relations
 * @param selectionId - ID de la sélection à récupérer
 * @returns Promise contenant la sélection complète
 * @throws AppError(400) si l'ID fourni est invalide
 * @throws AppError(404) si la sélection n'existe pas
 * @throws AppError(500) en cas d'erreur de base de données
 */
export async function getSelectionById(selectionId: number): Promise<Selection> {
  try {
    if (!Number.isInteger(selectionId) || selectionId <= 0) {
      throw new AppError(400, 'Invalid selection ID', 'INVALID_SELECTION_ID', { selectionId });
    }

    const [selection] = await db
      .select({
        id: selections.id,
        brandId: selections.brandId,
        modelId: selections.modelId,
        year: selections.year,
        createdAt: selections.createdAt,
        brand: {
          id: brands.id,
          name: brands.name,
          createdAt: brands.createdAt,
        },
        model: {
          id: models.id,
          name: models.name,
          brandId: models.brandId,
          createdAt: models.createdAt,
        },
      })
      .from(selections)
      .innerJoin(brands, eq(selections.brandId, brands.id))
      .innerJoin(models, eq(selections.modelId, models.id))
      .where(eq(selections.id, selectionId))
      .limit(1);

    if (!selection) {
      throw new AppError(
        404,
        `Selection with ID ${selectionId} not found`,
        'SELECTION_NOT_FOUND',
        { selectionId },
      );
    }

    return selection;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error(`Failed to fetch selection ${selectionId}:`, error);
    throw new AppError(
      500,
      'Failed to fetch selection from database',
      'DB_QUERY_ERROR',
      { selectionId, originalError: error },
    );
  }
}

/**
 * Crée une nouvelle sélection dans la base de données
 * @param data - Données de la nouvelle sélection
 * @returns Promise contenant la sélection créée complète
 * @throws AppError(400) si les données fournies sont invalides
 * @throws AppError(409) si une sélection similaire existe déjà
 * @throws AppError(500) en cas d'erreur de base de données
 */
export async function createSelection(data: SelectionInput): Promise<Selection> {
  try {
    if (!Number.isInteger(data.brandId) || data.brandId <= 0) {
      throw new AppError(400, 'Invalid brand ID', 'INVALID_BRAND_ID', { brandId: data.brandId });
    }

    if (!Number.isInteger(data.modelId) || data.modelId <= 0) {
      throw new AppError(400, 'Invalid model ID', 'INVALID_MODEL_ID', { modelId: data.modelId });
    }

    await validateModelBrand(data.modelId, data.brandId);

    const existingConditions = [
      eq(selections.brandId, data.brandId),
      eq(selections.modelId, data.modelId),
    ];

    if (data.year !== undefined) {
      existingConditions.push(data.year === null ? isNull(selections.year) : eq(selections.year, data.year));
    } else {
      existingConditions.push(isNull(selections.year));
    }

    const [existing] = await db
      .select({ id: selections.id })
      .from(selections)
      .where(and(...existingConditions))
      .limit(1);

    if (existing) {
      throw new AppError(
        409,
        'A selection with these parameters already exists',
        'SELECTION_ALREADY_EXISTS',
        { brandId: data.brandId, modelId: data.modelId, year: data.year },
      );
    }

    const [selection] = await db
      .insert(selections)
      .values({
        brandId: data.brandId,
        modelId: data.modelId,
        year: data.year ?? null,
      })
      .returning();

    if (selection?.id == null) {
      throw new AppError(
        500,
        'Failed to create selection',
        'DB_INSERT_NO_RESULT',
        { data },
      );
    }

    return await getSelectionById(selection.id);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Failed to create selection:', error);
    throw new AppError(
      500,
      'Failed to create selection',
      'DB_INSERT_ERROR',
      { data, originalError: error },
    );
  }
}

/**
 * Supprime une sélection de la base de données
 * @param selectionId - ID de la sélection à supprimer
 * @returns Promise contenant l'ID de la sélection supprimée
 * @throws AppError(404) si la sélection n'existe pas
 * @throws AppError(500) en cas d'erreur de base de données
 */
export async function deleteSelection(selectionId: number): Promise<{ id: number }> {
  try {
    await getSelectionById(selectionId);

    const [deleted] = await db
      .delete(selections)
      .where(eq(selections.id, selectionId))
      .returning({ id: selections.id });

    if (!deleted) {
      throw new AppError(
        500,
        'Failed to delete selection',
        'DB_DELETE_ERROR',
        { selectionId },
      );
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error(`Failed to delete selection ${selectionId}:`, error);
    throw new AppError(
      500,
      'Failed to delete selection',
      'DB_DELETE_ERROR',
      { selectionId, originalError: error },
    );
  }
}
