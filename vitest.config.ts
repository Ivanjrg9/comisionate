import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  test: {
    include: ["tests/**/*.test.ts"],
    env: loadEnv(mode, process.cwd(), ""),
    testTimeout: 20000,
    fileParallelism: false, // los tests comparten la BD local
  },
}));
