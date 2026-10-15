import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Швидкі перевірки (`npm test`): правила й словники без мережі й без браузера.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
