// ════════════════════════════════════════════════════════════════
//  CICADI — vite.config.js (multipágina)
//  Compila la app principal + /recuperar + /info en un solo build.
//  dist/index.html            →  https://www.catecumen.com/
//  dist/recuperar/index.html  →  https://www.catecumen.com/recuperar/
//  dist/info/index.html       →  https://www.catecumen.com/info/
// ════════════════════════════════════════════════════════════════
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// ── Plugin: incrusta el CSS dentro del HTML ────────────────────────────────
// El CSS del proyecto pesa <2 KB, pero al ir en archivo aparte bloquea el
// pintado durante un viaje completo al servidor (~170 ms según Lighthouse).
// Incrustado, desaparece esa petición. Si el <link> no se encuentra, no toca
// nada: es seguro por diseño.
function inlineCss() {
  return {
    name: "catecumen-inline-css",
    apply: "build",
    enforce: "post",
    generateBundle(_opciones, bundle) {
      const css = Object.keys(bundle).filter((f) => f.endsWith(".css"));
      if (!css.length) return;
      for (const archivo of Object.values(bundle)) {
        if (archivo.type !== "asset" || !archivo.fileName.endsWith(".html")) continue;
        let html = String(archivo.source);
        for (const nombre of css) {
          const hoja = bundle[nombre];
          if (!hoja || hoja.type !== "asset") continue;
          const base = nombre.split("/").pop();
          const re = new RegExp(`<link[^>]+href="[^"]*${base}"[^>]*>`, "g");
          if (re.test(html)) {
            html = html.replace(re, `<style>${String(hoja.source)}</style>`);
          }
        }
        archivo.source = html;
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCss()],
  // JSX con runtime AUTOMÁTICO (como la app): sin esto, las pruebas de
  // componentes transformaban el JSX al runtime clásico y fallaban con
  // "React is not defined". No afecta al build (plugin-react ya usa automático).
  esbuild: { jsx: "automatic" },
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

  // ── Pruebas (Vitest) ─────────────────────────────────────────────────────
  // Separación por extensión para no ralentizar la lógica pura:
  //   *.test.js   → entorno Node (lógica de logic.js), rápido.
  //   *.test.jsx  → entorno jsdom (componentes React con Testing Library).
  // El plugin react() de arriba transforma el JSX también en las pruebas.
  test: {
    environmentMatchGlobs: [["**/*.test.jsx", "jsdom"]],
    setupFiles: ["./src/test-setup.js"],
    css: false,          // no procesar CSS en pruebas (más rápido)
    clearMocks: true,
  },
});
// Nota: si tu versión de Vite (8+ con Rolldown) muestra una advertencia
// sobre rollupOptions, renombra la clave a `rolldownOptions` — la
// estructura interna `input` es idéntica.
