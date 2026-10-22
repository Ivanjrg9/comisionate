import { defineConfig } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const PORT = 3100;

// Requiere `supabase start` con el seed cargado. Usa el Chrome instalado (no descarga navegadores).
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, channel: "chrome", locale: "es-ES", trace: "retain-on-failure" },
  projects: [
    { name: "escritorio", use: { viewport: { width: 1280, height: 800 } } },
    { name: "movil", testMatch: /publico\.spec\.ts/, use: { viewport: { width: 375, height: 800 }, hasTouch: true } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 240_000,
    env: { NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
  },
});
