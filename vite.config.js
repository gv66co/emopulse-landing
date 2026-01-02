
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",            // Projekto šaknis
  publicDir: "public",  // Statiniai failai (pvz., modeliai)
  build: {
    outDir: "dist",     // Galutiniai failai bus dist
    emptyOutDir: true,  // Išvalo dist prieš build
    sourcemap: false    // (nebūtina) išjungia source map, kad build būtų lengvesnis
  },
  server: {
    port: 5173,         // Dev serverio port (numatytasis)
    open: true          // Automatiškai atidaro naršyklę
  }
});
