import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        live: resolve(__dirname, "index.html"),
        investors: resolve(__dirname, "investors.html")
      }
    }
  }
});
