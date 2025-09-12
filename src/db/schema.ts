import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const species = sqliteTable('species', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(), // 'crop' | 'plant' | 'tree'
  commonName: text('common_name').notNull(),
  scientificName: text('scientific_name').notNull(),
  family: text('family').notNull(),
  tags: text('tags', { mode: 'json' }), // string array
  growthHabit: text('growth_habit'), // herb, shrub, tree, vine
  lifecycle: text('lifecycle'), // annual/biennial/perennial
  climate: text('climate'),
  region: text('region'),
  soil: text('soil'),
  water: text('water'),
  sunlight: text('sunlight'),
  spacing: text('spacing'),
  sowingPlanting: text('sowing_planting'),
  fertilization: text('fertilization'),
  pests: text('pests'),
  diseases: text('diseases'),
  management: text('management'),
  harvest: text('harvest'),
  yield: text('yield'),
  seasonality: text('seasonality'),
  uses: text('uses'),
  imageUrl: text('image_url'),
  language: text('language').notNull().default('en'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  categoryIdx: index('idx_species_category').on(table.category),
  commonNameIdx: index('idx_species_common_name').on(table.commonName),
}));