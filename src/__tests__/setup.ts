import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { brands, models, selections } from '@/lib/db/schema';

beforeAll(async () => {
  try {
    await db.execute(sql`SELECT 1`);
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl?.includes('test')) {
      throw new Error('DATABASE_URL must contain "test" for safety!');
    }
    
    await cleanupAllTables();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
});

afterEach(async () => {
  await cleanupAllTables();
});

afterAll(async () => {
  try {
    await cleanupAllTables();
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
});

async function cleanupAllTables(): Promise<void> {
  try {
    await db.delete(selections);
    await db.delete(models);
    await db.delete(brands);
  } catch (error) {
    console.error('Failed to cleanup tables:', error);
    throw error;
  }
}

jest.setTimeout(15000);
