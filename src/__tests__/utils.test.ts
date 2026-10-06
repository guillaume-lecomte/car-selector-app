import { describe, expect, it } from '@jest/globals';

import { calculatePaginationMeta, isUniqueViolation, validatePaginationParams } from '@/lib/utils';

describe('validatePaginationParams', () => {
  it('uses the defaults', () => {
    expect(validatePaginationParams({})).toEqual({ page: 1, limit: 10 });
  });

  it('clamps page and limit', () => {
    expect(validatePaginationParams({ page: -3, limit: 1000 })).toEqual({ page: 1, limit: 100 });
    expect(validatePaginationParams({ page: 2, limit: 0 })).toEqual({ page: 2, limit: 1 });
  });
});

describe('calculatePaginationMeta', () => {
  it('describes a middle page', () => {
    expect(calculatePaginationMeta(2, 10, 35)).toEqual({
      currentPage: 2,
      pageSize: 10,
      totalItems: 35,
      totalPages: 4,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('reports no next page on the last page', () => {
    expect(calculatePaginationMeta(4, 10, 35).hasNextPage).toBe(false);
  });

  it('rejects invalid input', () => {
    expect(() => calculatePaginationMeta(0, 10, 5)).toThrow();
    expect(() => calculatePaginationMeta(1, 0, 5)).toThrow();
    expect(() => calculatePaginationMeta(1, 10, -1)).toThrow();
  });
});

describe('isUniqueViolation', () => {
  it('recognises the PostgreSQL code directly or in the cause', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
    expect(isUniqueViolation({ cause: { code: '23505' } })).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isUniqueViolation(new Error('boom'))).toBe(false);
    expect(isUniqueViolation({ code: '23503' })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
