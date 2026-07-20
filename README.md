# Catecumen — El Aula Global de la Catequesis

Plataforma web de **formación sacramental católica a distancia** ([catecumen.com](https://www.catecumen.com)),
en colaboración con el Centro Internacional de Catequesis a Distancia (CICADI/ICDC) y la
Diócesis de Querétaro, México.

> ⚠️ **Software propietario — Copyright © 2026 CICADI/ICDC. Todos los derechos reservados.**
> Este repositorio **NO es de código abierto**. Queda prohibida su copia, clonación, ingeniería
> inversa, redistribución o uso total o parcial sin autorización previa y por escrito.
> Ver la cláusula 12 (Licencia de Software) en `public/normatividad_catecumen.pdf`.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite (rolldown-vite v8), SPA monolítica |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Pagos | Stripe (tarjeta y efectivo: OXXO / Boleto / Multibanco) |
| Hosting | Hostinger (despliegue manual subiendo `dist/`) |
| Idiomas | 6 — es, en, fr, de, pt, it |

## Estructura

```
src/App.jsx           Toda la aplicación (monolítico)
index.html            Entrada principal de Vite
info/index.html       Página pública "Sobre Catecumen"
recuperar/index.html  Recuperación de contraseña
admin/index.html      Consola de administración
public/               Assets servidos tal cual (iconos, videos, PDF)
supabase/functions/   Edge Functions
scripts/              Migraciones SQL y utilidades
_archivo/             Backups y fuentes (ignorado por git, no se despliega)
```

> **Regla crítica:** los archivos de `info/`, `recuperar/` y `admin/` deben llamarse
> **exactamente `index.html`**. Vite ignora silenciosamente cualquier otro nombre.

## Desarrollo

```bash
npm install
npm run dev
```

Requiere un archivo `.env` (no versionado) con:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Despliegue

```powershell
cd C:\catecumen
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run build
# subir el contenido de dist/ a Hostinger
```

Antes de publicar:

1. Verifica que `TEST_MODE` esté en `false` en `src/App.jsx`.
2. Sube `CACHE_VERSION` en `public/sw.js` para invalidar la caché de la PWA.
3. Confirma que cambió el hash del bundle (`dist/assets/main-XXXX.js`).
4. Prueba en **ventana de incógnito**.

## Documentación interna

El contexto completo del proyecto (base de datos, edge functions, consola de
administración, convenciones y trampas conocidas) está en **`CLAUDE.md`**.

---

**Contacto:** info@catecumen.com
