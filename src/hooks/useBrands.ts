import { useEffect } from 'react';

import { type Brand } from '@/lib/db/schema';

import { useApi } from './useApi';

export function useBrands() {
  const { data: brands, error, isLoading, fetchData } = useApi<Brand[]>();

  useEffect(() => {
    fetchData('/api/brands');
  }, [fetchData]);

  return {
    brands: brands || [],
    error,
    isLoading,
    refetch: () => fetchData('/api/brands'),
  };
}
