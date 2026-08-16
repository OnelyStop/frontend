import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  // Migrations need session mode; the transaction pooler on :6543 rejects DDL.
  // Supabase serves session mode on :5432 of the same pooler host, so derive it
  // when DIRECT_URL isn't set explicitly.
  dbCredentials: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL!.replace(":6543/", ":5432/"),
  },
  // auth.* is Supabase-managed — without this, drizzle-kit tries to drop it.
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
