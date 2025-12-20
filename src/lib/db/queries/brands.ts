
import { count, asc, eq, sql } from 'drizzle-orm';

import { AppError } from '@/lib/api/errors';
import { db } from '@/lib/db/client';
import { type Brand, brands } from '@/lib/db/schema';
import { calculatePaginationMeta } from '@/lib/utils';

import { type BrandInput } from '../interfaces/brands';
import { type PaginatedResult } from '../interfaces/query-result';


/**
 * Récupère toutes les marques avec pagination
 * @param options - Options de pagination
 * @returns Promise avec les marques paginées et métadonnées
 */
export async function getAllBrands(
  options: {
    limit?: number;
    offset?: number;
  } = {},
): Promise<PaginatedResult<Brand>> {
  try {
    const { limit = 100, offset = 0 } = options;

    if (limit < 1 || offset < 0) {
      throw new AppError(
        400,
        'Invalid pagination parameters',
        'INVALID_PAGINATION',
        { limit, offset },
      );
    }

    const [brandsResult, countResult] = await Promise.all([
      db.select()
        .from(brands)
        .orderBy(asc(brands.name))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() })
        .from(brands),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      data: brandsResult as Brand[],
      meta: calculatePaginationMeta(
        Math.floor(offset / limit) + 1,
        limit,
        total,
      ),
    };
  } catch (error) {
    throw new AppError(
      500,
      'Failed to fetch brands from database',
      'DB_QUERY_ERROR',
      {
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options,
      },
    );
  }
}

/**
 * Vérifie l'existence d'une marque avec retour typé strict
 * @param brandId - ID de la marque
 * @returns Promise<boolean> (toujours résolue)
 */
export async function brandExists(brandId: number): Promise<boolean> {
  try {
    if (!Number.isInteger(brandId) || brandId <= 0) {
      return false;
    }

    const [result] = await db
      .select({ exists: sql<boolean>`exists(${db.select().from(brands).where(eq(brands.id, brandId))})` })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    return !!result?.exists;
  } catch (error) {
    console.error(`Failed to check brand existence for ID ${brandId}:`, error);
    return false;
  }
}

/**
 * Crée une nouvelle marque avec validation
 * @param brandData - Données de la marque (typées)
 * @returns Promise de Brand créée
 */
export async function createBrand(brandData: BrandInput): Promise<Brand> {
  try {
    if (!brandData.name || brandData.name.trim().length < 2) {
      throw new AppError(
        400,
        'Brand name must be at least 2 characters',
        'INVALID_BRAND_NAME',
        { name: brandData.name },
      );
    }

    const [newBrand] = await db
      .insert(brands)
      .values({
        name: brandData.name.trim().toUpperCase(),
        createdAt: new Date(),
      })
      .returning();

    return newBrand as Brand;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      throw new AppError(
        409,
        `Brand "${brandData.name}" already exists`,
        'BRAND_ALREADY_EXISTS',
        { name: brandData.name },
      );
    }

    throw new AppError(
      500,
      'Failed to create brand',
      'DB_INSERT_ERROR',
      {
        brandData,
        originalError: error instanceof Error ? error.message : String(error),
      },
    );
  }
}
