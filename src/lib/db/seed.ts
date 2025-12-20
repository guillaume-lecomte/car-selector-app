import { eq } from 'drizzle-orm';

import { db } from './client';
import { brands, models } from './schema';

async function seed() {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(models);
      await tx.delete(brands);

      await tx.insert(brands).values([
        { name: 'TOYOTA' },
        { name: 'RENAULT' },
      ]);

      const [toyota, renault] = await Promise.all([
        tx.query.brands.findFirst({ where: eq(brands.name, 'TOYOTA') }),
        tx.query.brands.findFirst({ where: eq(brands.name, 'RENAULT') }),
      ]);

      if (!toyota || !renault) {
        throw new Error('Failed to retrieve inserted brands');
      }

      await tx.insert(models).values([
        // Toyota
        { name: 'Avensis', brandId: toyota.id },
        { name: 'Aygo', brandId: toyota.id },
        { name: 'Prius', brandId: toyota.id },
        { name: 'Yaris', brandId: toyota.id },
        // Renault
        { name: 'Clio', brandId: renault.id },
        { name: 'Espace', brandId: renault.id },
        { name: 'Mégane', brandId: renault.id },
        { name: 'Scenic', brandId: renault.id },
      ]);

      // eslint-disable-next-line no-console
      console.log('Database seeded successfully!');
    });
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seed();
