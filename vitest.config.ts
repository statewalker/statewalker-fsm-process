import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${resolve(__dirname, "src")}/`,
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["**/tmp/*", "**/node_modules/**", "**/*.semantic.test.ts"],
  },
});
