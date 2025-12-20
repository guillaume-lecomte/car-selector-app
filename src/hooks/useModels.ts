import { useEffect } from 'react';

import type { Model } from '@/lib/db/schema';

import { useApi } from './useApi';

export function useModels(
  brandId: number | null,
  options: {
    limit?: number;
    offset?: number;
  } = {},
) {
  const {
    data: models,
    error,
    isLoading,
    paginationMeta,
    fetchData,
    reset,
    setData,
    setError,
    setIsLoading,
    setPaginationMeta,
  } = useApi<Model[]>();

  useEffect(() => {
    if (!brandId) {
      reset();
      return;
    }

    const queryParams = new URLSearchParams();
    if (brandId) queryParams.append('brandId', brandId.toString());
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.offset) queryParams.append('offset', options.offset.toString());

    fetchData(`/api/models?${queryParams.toString()}`);
  }, [brandId, options.limit, options.offset, fetchData, reset]);

  return {
    models: models || [],
    paginationMeta,
    error,
    isLoading,
    refetch: () => {
      if (brandId) {
        const queryParams = new URLSearchParams();
        queryParams.append('brandId', brandId.toString());
        if (options.limit) queryParams.append('limit', options.limit.toString());
        if (options.offset) queryParams.append('offset', options.offset.toString());
        return fetchData(`/api/models?${queryParams.toString()}`);
      }
      return Promise.resolve();
    },
    setModels: (models: Model[]) => setData(models),
    setPaginationMeta,
    setError,
    setIsLoading,
  };
}
