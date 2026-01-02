
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",            // Projekto šaknis
  publicDir: "public",  // Statiniai failai (pvz., modeliai)
  build: {
    outDir: "dist",     // Galutiniai failai bus dist
    emptyOutDir: true   // Išvalo dist prieš build
  }
});
