import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.semantic.test.ts"],
    testTimeout: 120_000,
  },
});
