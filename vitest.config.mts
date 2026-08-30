import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" -> "src/*" path in tsconfig.json. Vitest does not read
    // tsconfig paths on its own, and without this every "@/..." import fails to
    // resolve at test time while type-checking fine.
    alias: {
      "@": resolve(__dirname, "src"),
      // `server-only` throws unless it is loaded in a React Server Component,
      // which a test never is. The package ships this no-op for exactly that,
      // and Next still enforces the real guard at build time.
      "server-only": resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    // Node, not jsdom: what is worth testing here is server-side -- signatures,
    // money arithmetic, state transitions. A browser environment would only
    // slow it down.
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
