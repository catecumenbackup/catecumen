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
      output: {
        // ── Separación de dependencias (code splitting de vendor) ──────────
        // React y Supabase no cambian entre despliegues. Al aislarlos en sus
        // propios archivos, el navegador los guarda en caché (1 año, ver
        // .htaccess) y en cada release el usuario solo vuelve a descargar
        // TU código, no las librerías. Beneficia sobre todo a los alumnos
        // que regresan a continuar el curso.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("/react/") ||
              id.includes("react/jsx") || id.includes("scheduler")) {
            return "vendor-react";
          }
          if (id.includes("@supabase")) return "vendor-supabase";
          return "vendor";
        },
      },
    },
  },
});
// Nota: si tu versión de Vite (8+ con Rolldown) muestra una advertencia
// sobre rollupOptions, renombra la clave a `rolldownOptions` — la
// estructura interna `input` es idéntica.
