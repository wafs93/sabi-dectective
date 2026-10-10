import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // "server-only" throws outside a React Server bundle; tests run in plain Node.
    alias: { "server-only": fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
