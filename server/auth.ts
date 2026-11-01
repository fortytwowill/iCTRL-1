import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization, admin } from 'better-auth/plugins';
import { db } from './db';
import * as schema from './db/schema';

export const auth = betterAuth({
 database: drizzleAdapter(db, {
 provider: 'pg',
 schema: schema,
 }),
 emailAndPassword: {
 enabled: true,
 },
 plugins: [
 organization(),
 admin(),
 ],
 secret: process.env.BETTER_AUTH_SECRET || 'super-secret-key-for-dev-only',
 baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
});