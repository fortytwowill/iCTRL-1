import { defineConfig } from 'drizzle-kit';

export default defineConfig({
 schema: './server/db/schema.ts',
 out: './server/drizzle',
 dialect: 'postgresql',
 dbCredentials: {
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ictl',
 },
});