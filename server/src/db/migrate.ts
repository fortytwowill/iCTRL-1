import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index.js";

async function main() {
  console.log("[iCTRL] Running migrations...");
  await migrate(db, { migrationsFolder: "./server/drizzle" });
  console.log("[iCTRL] Migrations complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[iCTRL] Migration failed:", err);
  process.exit(1);
});