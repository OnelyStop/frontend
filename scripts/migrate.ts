// Applies gazette-migrations/*.sql to the local PGlite database
// (env.PGLITE_DATA_DIR). This is independent from the app's Supabase migrations
// in src/migrations/.
// getDb() runs the migrator on first init, so this just triggers that. Bun
// auto-loads .env.local.
import { getDb } from "@/lib/gazette/db";

await getDb();
console.log("migrations applied");
process.exit(0);
