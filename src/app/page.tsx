import { CarSelector } from '@/components/CarSelector';
import { SelectionsList } from '@/components/SelectionsList';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 space-y-12">
        <CarSelector />
        <SelectionsList />
      </div>
    </div>
  );
}
