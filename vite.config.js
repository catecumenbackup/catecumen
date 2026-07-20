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
    // No publicar sourcemaps: evitan exponer el código fuente legible en producción.
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        recuperar: resolve(__dirname, "recuperar/index.html"),
        info: resolve(__dirname, "info/index.html"),
        admin: resolve(__dirname, "admin/index.html"),
      },
    },
  },
  // NOTA (jul 2026): se probó separar React/Supabase en chunks propios
  // (manualChunks). En este hosting compartido EMPEORÓ el rendimiento de 84
  // a 70: más archivos = más viajes de ida y vuelta, y el Speed Index subió
  // de 1.2 s a 4.9 s. Un solo bundle resultó más rápido aquí. No reintroducir
  // sin medir antes con PageSpeed.
});
// Nota: si tu versión de Vite (8+ con Rolldown) muestra una advertencia
// sobre rollupOptions, renombra la clave a `rolldownOptions` — la
// estructura interna `input` es idéntica.
