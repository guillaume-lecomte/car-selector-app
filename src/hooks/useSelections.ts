import { useEffect, useState, useCallback } from 'react';

import { useSelectionsContext } from '@/contexts/SelectionsContext';
import type { Selection, SelectionWithDetails } from '@/lib/db/schema';
import type { SelectionFormData, FeedbackMessage, ApiErrorResponse } from '@/lib/types';

import { useApi } from './useApi';

export function useSelections() {
  const { refreshKey } = useSelectionsContext();
  const {
    data: selections,
    error,
    isLoading,
    fetchData,
    reset,
  } = useApi<SelectionWithDetails[]>();

  useEffect(() => {
    fetchData('/api/selections');
  }, [fetchData, refreshKey]);

  return {
    selections: selections || [],
    error,
    isLoading,
    refetch: () => fetchData('/api/selections'),
    reset,
  };
}

export function useCreateSelection() {
  const { triggerRefresh } = useSelectionsContext();
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const {
    isLoading,
    fetchData,
    setError,
    setIsLoading,
  } = useApi<Selection>({
    onSuccess: () => {
      setMessage({
        type: 'success',
        text: 'Selection created successfully!',
      });
      triggerRefresh();
    },
    onError: (error) => {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create selection',
      });
    },
  });

  const createSelection = useCallback(
    async (formData: SelectionFormData): Promise<boolean> => {
      setMessage(null);
      setIsLoading(true);
      setError(null);

      try {
        await fetchData('/api/selections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        return true;
      } catch (err) {
        const apiError = err as ApiErrorResponse;
        setMessage({
          type: 'error',
          text: apiError.message || 'Failed to create selection',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchData, setError, setIsLoading, setMessage],
  );

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    createSelection,
    isLoading,
    message,
    clearMessage,
  };
}


export function useDeleteSelection() {
  const { triggerRefresh } = useSelectionsContext();
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const {
    isLoading,
    fetchData,
    setError,
    setIsLoading,
  } = useApi<Selection>({
    onSuccess: () => {
      setMessage({
        type: 'success',
        text: 'Selection deleted successfully!',
      });
      triggerRefresh();
    },
    onError: (error) => {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to delete selection',
      });
    },
  });

  const deleteSelection = useCallback(
    async (selectionId: number): Promise<boolean> => {
      setMessage(null);
      setIsLoading(true);
      setError(null);

      try {
        await fetchData(`/api/selections/${selectionId}`, {
          method: 'DELETE',
        });
        return true;
      } catch {
        setError({
          success: false,
          message: 'Failed to delete selection',
          code: 'DELETE_SELECTION_ERROR',
          status: 500,
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchData, setError, setIsLoading],
  );

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    deleteSelection,
    isLoading,
    message,
    clearMessage,
  };
}
