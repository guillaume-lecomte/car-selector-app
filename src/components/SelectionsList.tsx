'use client';

import { useState } from 'react';

import { Trash2, Calendar, Car } from 'lucide-react';

import { useDeleteSelection, useSelections } from '@/hooks';

import { Alert } from './ui/Alert';
import { Button } from './ui/Button';

export function SelectionsList() {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const { 
    selections, 
    isLoading: isLoadingSelections, 
    error: loadError,
    refetch, 
  } = useSelections();
  
  const { 
    deleteSelection, 
    isLoading: isDeleting, 
    message, 
    clearMessage, 
  } = useDeleteSelection();

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this selection?')) {
      return;
    }

    setDeletingId(id);
    const success = await deleteSelection(id);
    
    if (success) {
      await refetch();
    }
    
    setDeletingId(null);
  };

  if (isLoadingSelections) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert
          type="error"
          message={loadError.message}
          onClose={() => window.location.reload()}
        />
      </div>
    );
  }

  if (selections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Selections Yet
          </h3>
          <p className="text-gray-600">
            Start by selecting your first car!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-2xl font-bold text-white">
            My Car Selections
          </h2>
          <p className="text-blue-100 mt-1">
            {selections.length} {selections.length === 1 ? 'selection' : 'selections'}
          </p>
        </div>

        {message && (
          <div className="p-4 border-b">
            <Alert
              type={message.type}
              message={message.text}
              onClose={clearMessage}
            />
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {selections.map((selection) => (
            <div
              key={selection.id}
              className="p-6 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Car className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selection.brand.name} {selection.model.name}
                      </h3>
                      {selection.year && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{selection.year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Created: {new Date(selection.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <Button
                  onClick={() => handleDelete(selection.id)}
                  disabled={isDeleting && deletingId === selection.id}
                  isLoading={isDeleting && deletingId === selection.id}
                  variant="primary"
                  className="ml-4"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting && deletingId === selection.id ? 'Deleting...' : null}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
