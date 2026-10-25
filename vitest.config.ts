import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for unit tests of landmark and motion modules.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
