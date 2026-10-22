import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "node:path";

export default defineConfig(({ mode }) => ({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/**/*.test.ts"],
    env: loadEnv(mode, process.cwd(), ""),
    testTimeout: 20000,
    fileParallelism: false, // los tests comparten la BD local
  },
}));
