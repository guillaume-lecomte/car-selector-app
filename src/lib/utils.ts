import { type PaginationMeta, type PaginationParams } from './api/interfaces';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from './constants';

export function validatePaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, params.limit ?? DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  return { page, limit };
}

/**
 * Calcule les métadonnées de pagination
 * @param page - Le numéro de la page actuelle (commence à 1)
 * @param limit - Le nombre d'éléments par page
 * @param totalItems - Le nombre total d'éléments disponibles
 * @returns Un objet contenant les métadonnées de pagination */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta {
  if (page < 1) {
    throw new Error('Page number must be greater than or equal to 1');
  }

  if (limit < 1) {
    throw new Error('Page size must be greater than or equal to 1');
  }

  if (totalItems < 0) {
    throw new Error('Total items must be greater than or equal to 0');
  }

  const totalPages = Math.ceil(totalItems / limit);

  const currentPage = Math.min(page, totalPages);

  return {
    currentPage,
    pageSize: limit,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * Vrai si l'erreur vient d'une violation de contrainte d'unicité PostgreSQL
 * (code 23505), que le driver l'expose directement ou dans `cause`.
 */
export function isUniqueViolation(error: unknown): boolean {
  const candidate = error as { code?: string; cause?: { code?: string } } | null;
  return candidate?.code === '23505' || candidate?.cause?.code === '23505';
}
