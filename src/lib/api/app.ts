import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { brandsRoute } from './routes/brands';
import { modelsRoute } from './routes/models';
import { selectionsRoute } from './routes/selections';

const app = new Hono().basePath('/api');

const origin = process.env.NEXT_PUBLIC_APP_URL;
if (!origin) {
  throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for CORS origin');
}

app.use('*', logger());
app.use(
  '*',
  cors({
    origin,
    credentials: true,
  }),
);

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.route('/brands', brandsRoute);
app.route('/models', modelsRoute);
app.route('/selections', selectionsRoute);


app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Route not found',
      code: 'NOT_FOUND',
      path: c.req.path,
    },
    404,
  );
});

app.onError((error, c) => {
  console.error('Unhandled error:', error);

  return c.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    500,
  );
});

export default app;
