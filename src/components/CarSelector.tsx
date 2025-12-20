'use client';

import { useState } from 'react';

import { type SelectionFormData, useCreateSelection } from '@/hooks';
import { useBrands } from '@/hooks/useBrands';
import { useModels } from '@/hooks/useModels';

import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { Select } from './ui/Select';


export function CarSelector() {
  const [formData, setFormData] = useState<SelectionFormData>({
    brandId: null,
    modelId: null,
    year: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { brands, isLoading: isLoadingBrands } = useBrands();
  const { models, isLoading: isLoadingModels } = useModels(formData.brandId);
  const {
    createSelection,
    isLoading: isSubmitting,
    message,
    clearMessage,
  } = useCreateSelection();

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value ? parseInt(e.target.value, 10) : null;

    setFormData({
      brandId,
      modelId: null,
      year: null,
    });

    setErrors({});
    clearMessage();
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value ? parseInt(e.target.value, 10) : null;

    setFormData((prev) => ({
      ...prev,
      modelId,
      year: null,
    }));

    setErrors((prev) => ({ ...prev, modelId: '' }));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value ? parseInt(e.target.value, 10) : null;

    setFormData((prev) => ({ ...prev, year }));
    setErrors((prev) => ({ ...prev, year: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brandId) {
      newErrors.brandId = 'Please select a brand';
    }

    if (!formData.modelId) {
      newErrors.modelId = 'Please select a model';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const { brandId, modelId, year } = formData;
    if (brandId == null || modelId == null) return;

    const success = await createSelection({
      brandId,
      modelId,
      year,
    });

    if (success) {
      setFormData({
        brandId: null,
        modelId: null,
        year: null,
      });
      setErrors({});
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Select Your Car
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Brand"
          value={formData.brandId?.toString() || ''}
          onChange={handleBrandChange}
          error={errors.brandId}
          disabled={isLoadingBrands}
          options={brands.map((brand) => ({
            value: brand.id.toString(),
            label: brand.name,
          }))}
        />

        <Select
          label="Model"
          value={formData.modelId?.toString() || ''}
          onChange={handleModelChange}
          error={errors.modelId}
          disabled={!formData.brandId || isLoadingModels}
          options={models.map((model) => ({
            value: model.id.toString(),
            label: model.name,
          }))}
        />

        <Select
          label="Year (optional)"
          value={formData.year?.toString() || ''}
          onChange={handleYearChange}
          error={errors.year}
          disabled={!formData.modelId}
          options={years.map((year) => ({
            value: year.toString(),
            label: year.toString(),
          }))}
        />

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!formData.brandId || !formData.modelId || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Saving...' : 'Save Selection'}
        </Button>
      </form>
      {message && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={clearMessage}
          className="mt-4"
        />
      )}
    </div>
  );
}
