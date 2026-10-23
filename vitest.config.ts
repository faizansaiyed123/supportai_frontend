import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    // client.ts reads this once at module load, so it must be set before import
    env: { NEXT_PUBLIC_API_BASE_URL: "http://api.test/api" },
    // tests/e2e holds Playwright specs, which vitest must not pick up: they import
    // @playwright/test and drive a real browser, so under vitest they fail to collect.
    // configDefaults must be spread in - naming `exclude` replaces the defaults outright.
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
