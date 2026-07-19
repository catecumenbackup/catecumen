// ════════════════════════════════════════════════════════════════
//  CICADI — vite.config.js (multipágina)
//  Compila la app principal + /recuperar + /info en un solo build.
//  dist/index.html            →  https://www.catecumen.com/
//  dist/recuperar/index.html  →  https://www.catecumen.com/recuperar/
//  dist/info/index.html       →  https://www.catecumen.com/info/
// ════════════════════════════════════════════════════════════════
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        recuperar: resolve(__dirname, "recuperar/index.html"),
        info: resolve(__dirname, "info/index.html"),
        admin: resolve(__dirname, "admin/index.html"),
      },
    },
  },
});
// Nota: si tu versión de Vite (8+ con Rolldown) muestra una advertencia
// sobre rollupOptions, renombra la clave a `rolldownOptions` — la
// estructura interna `input` es idéntica.
