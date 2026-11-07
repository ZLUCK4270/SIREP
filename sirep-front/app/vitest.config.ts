/**
 * Responsabilidad: configurar el runner de pruebas unitarias.
 * Existe para probar la lógica pura del recorte y de la bandeja sin levantar
 * Next ni un navegador. El alias `@` replica el de `tsconfig.json`.
 */

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
