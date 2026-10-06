import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';

export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const models = pgTable(
  'models',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    brandId: integer('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Index pour optimiser les requêtes "tous les modèles d'une marque"
    index('models_brand_id_idx').on(table.brandId),
    // Contrainte : un modèle unique par marque (ex: Toyota Corolla ne peut exister 2 fois)
    unique('models_brand_name_unique').on(table.brandId, table.name),
  ],
);

export const selections = pgTable(
  'selections',
  {
    id: serial('id').primaryKey(),
    brandId: integer('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    modelId: integer('model_id')
      .notNull()
      .references(() => models.id, { onDelete: 'cascade' }),
    year: integer('year'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // NULLS NOT DISTINCT: two selections without a year for the same brand and
    // model are duplicates too (PostgreSQL treats NULLs as distinct by default).
    unique('selections_brand_model_year_unique')
      .on(table.brandId, table.modelId, table.year)
      .nullsNotDistinct(),
    // Index pour optimiser les requêtes par marque
    index('selections_brand_id_idx').on(table.brandId),
    // Index pour optimiser les requêtes par modèle
    index('selections_model_id_idx').on(table.modelId),
    // Index pour les queries chronologiques
    index('selections_created_at_idx').on(table.createdAt),
  ],
);

export const brandsRelations = relations(brands, ({ many }) => ({
  models: many(models),
  selections: many(selections),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
  brand: one(brands, {
    fields: [models.brandId],
    references: [brands.id],
  }),
  selections: many(selections),
}));

export const selectionsRelations = relations(selections, ({ one }) => ({
  brand: one(brands, {
    fields: [selections.brandId],
    references: [brands.id],
  }),
  model: one(models, {
    fields: [selections.modelId],
    references: [models.id],
  }),
}));


export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;

export type Selection = typeof selections.$inferSelect;
export type NewSelection = typeof selections.$inferInsert;

export type BrandWithModels = Brand & {
  models: Model[];
};

export type ModelWithBrand = Model & {
  brand: Brand;
};

export type SelectionWithDetails = Selection & {
  brand: Brand;
  model: Model;
};

export type SelectionInput = {
  brandId: number;
  modelId: number;
  year?: number | null;
};
