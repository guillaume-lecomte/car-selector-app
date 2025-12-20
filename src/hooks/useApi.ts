import { useState, useCallback } from 'react';

import { type PaginationMeta } from '@/lib/api/interfaces';
import { type ApiErrorResponse, type ApiResponse, type UseApiOptions, type UseApiReturn } from '@/lib/types';

export function useApi<T>(options?: UseApiOptions<T>): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);

  const fetchData = useCallback(
    async (url: string, fetchOptions?: RequestInit): Promise<T> => {
      setIsLoading(true);
      setError(null);
      setPaginationMeta(null);

      try {
        const response = await fetch(url, fetchOptions);

        const json = await response.json() as ApiResponse<T>;

        if (!json.success) {
          throw {
            ...json,
            message: json.message || 'An error occurred while fetching data',
          };
        }

        setData(json.data);
        setPaginationMeta(json.meta || null);

        if (json.meta) {
          options?.onSuccess?.(json.data, json.meta);
        } else {
          options?.onSuccess?.(json.data);
        }

        return json.data;
      } catch (err) {
        const apiError = err as ApiErrorResponse;

        setError({
          success: false,
          message: apiError.message || 'An unexpected error occurred',
          code: apiError.code || 'UNKNOWN_ERROR',
          details: apiError.details,
          status: apiError.status || 500,
        });

        options?.onError?.(apiError);

        throw apiError;
      } finally {
        setIsLoading(false);
      }
    }, [options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setPaginationMeta(null);
  }, []);

  return {
    data,
    error,
    isLoading,
    paginationMeta,
    fetchData,
    setData,
    setError,
    setIsLoading,
    setPaginationMeta,
    reset,
  };
}
