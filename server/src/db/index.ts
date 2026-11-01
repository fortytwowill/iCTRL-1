import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString =
  process.env.DATABASE_URL || "postgresql://ictl:ictl@localhost:5432/ictl";

// Disable prefetch in non-dev to avoid connection leaks in serverless-like envs
const client = postgres(connectionString, { max: 10, prepare: false });

export const db = drizzle(client, { schema });