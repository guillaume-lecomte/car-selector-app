import { beforeAll, describe, expect, it } from '@jest/globals';

import { db } from '@/lib/db/client';
import { brands, models } from '@/lib/db/schema';

type TestApp = { request: (path: string, init?: RequestInit) => Response | Promise<Response> };

let app: TestApp;
let toyotaId: number;
let yarisId: number;
let clioId: number;

const post = (body: unknown) =>
  app.request('/api/selections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

interface Body {
  status?: string;
  code?: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

const json = async (response: Response) => (await response.json()) as Body;
const names = (body: Body) => (body.data as { name: string }[]).map((item) => item.name);

beforeAll(async () => {
  // The app refuses to start without the CORS origin
  process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';
  app = (await import('@/lib/api/app')).default as unknown as TestApp;
});

// The tables are emptied after each test by src/__tests__/setup.ts
async function seed() {
  const [toyota, renault] = await db
    .insert(brands)
    .values([{ name: 'TOYOTA' }, { name: 'RENAULT' }])
    .returning();
  if (!toyota || !renault) throw new Error('Seed failed');

  const [yaris] = await db
    .insert(models)
    .values([
      { name: 'Yaris', brandId: toyota.id },
      { name: 'Prius', brandId: toyota.id },
    ])
    .returning();
  const [clio] = await db.insert(models).values([{ name: 'Clio', brandId: renault.id }]).returning();
  if (!yaris || !clio) throw new Error('Seed failed');

  toyotaId = toyota.id;
  yarisId = yaris.id;
  clioId = clio.id;
}

describe('API', () => {
  it('answers the health check', async () => {
    const response = await app.request('/api/health');
    expect(response.status).toBe(200);
    expect((await json(response)).status).toBe('ok');
  });

  it('lists brands and the models of a brand', async () => {
    await seed();

    const brandsBody = await json(await app.request('/api/brands'));
    expect(names(brandsBody).sort()).toEqual(['RENAULT', 'TOYOTA']);

    const modelsBody = await json(await app.request(`/api/models?brandId=${toyotaId}`));
    expect(names(modelsBody)).toEqual(['Prius', 'Yaris']);
  });

  describe('POST /api/selections', () => {
    it('creates a selection', async () => {
      await seed();

      const response = await post({ brandId: toyotaId, modelId: yarisId, year: 2020 });
      const body = await json(response);

      expect(response.status).toBe(201);
      expect(body.data).toMatchObject({ year: 2020, brand: { name: 'TOYOTA' }, model: { name: 'Yaris' } });
    });

    it('answers 409 for a duplicate', async () => {
      await seed();
      await post({ brandId: toyotaId, modelId: yarisId, year: 2020 });

      const response = await post({ brandId: toyotaId, modelId: yarisId, year: 2020 });

      expect(response.status).toBe(409);
      expect((await json(response)).code).toBe('SELECTION_ALREADY_EXISTS');
    });

    it('answers 409 for a duplicate with no year', async () => {
      await seed();
      await post({ brandId: toyotaId, modelId: yarisId });

      const response = await post({ brandId: toyotaId, modelId: yarisId });

      expect(response.status).toBe(409);
    });

    it('creates exactly one selection when the same request is sent 10 times at once', async () => {
      await seed();

      const responses = await Promise.all(
        Array.from({ length: 10 }, () => post({ brandId: toyotaId, modelId: yarisId })),
      );
      const statuses = responses.map((r) => r.status).sort();

      expect(statuses.filter((s) => s === 201)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(9);
    });

    it('answers 400 when the model does not belong to the brand', async () => {
      await seed();

      const response = await post({ brandId: toyotaId, modelId: clioId });

      expect(response.status).toBe(400);
      expect((await json(response)).code).toBe('MODEL_BRAND_MISMATCH');
    });

    it('answers 404 for an unknown model', async () => {
      await seed();

      const response = await post({ brandId: toyotaId, modelId: 999999 });

      expect(response.status).toBe(404);
    });

    it('answers 400 for an invalid body', async () => {
      const response = await post({ brandId: 'x' });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/selections', () => {
    it('paginates', async () => {
      await seed();
      for (let year = 2000; year < 2012; year++) {
        await post({ brandId: toyotaId, modelId: yarisId, year });
      }

      const first = await json(await app.request('/api/selections?page=1&limit=10'));
      const second = await json(await app.request('/api/selections?page=2&limit=10'));

      expect(first.data as unknown[]).toHaveLength(10);
      expect(first.meta).toMatchObject({ totalItems: 12, totalPages: 2, hasNextPage: true });
      expect(second.data as unknown[]).toHaveLength(2);
      expect(second.meta?.hasNextPage).toBe(false);
    });

    it('refuses a page size above 100', async () => {
      const response = await app.request('/api/selections?limit=101');
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/selections/:id', () => {
    it('deletes a selection, then answers 404', async () => {
      await seed();
      const created = await json(await post({ brandId: toyotaId, modelId: yarisId, year: 2020 }));
      const id = (created.data as { id: number }).id;

      const deleted = await app.request(`/api/selections/${id}`, { method: 'DELETE' });
      expect(deleted.status).toBe(200);

      const again = await app.request(`/api/selections/${id}`, { method: 'DELETE' });
      expect(again.status).toBe(404);
      expect((await json(again)).code).toBe('SELECTION_NOT_FOUND');
    });
  });
});
