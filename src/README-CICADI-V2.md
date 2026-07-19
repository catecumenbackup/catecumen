# CICADI — Plataforma Sacramental Católica v2.0

## Archivos entregados

| Archivo | Descripción |
|---|---|
| `SacramentosV2.jsx` | Aplicación React completa (~2,200 líneas) |
| `schema-v2.sql` | Esquema de base de datos Supabase v2 |
| `STRIPE-SETUP.md` | Guía completa de integración con Stripe |

---

## Integración en tu proyecto Vite

1. **Instalar dependencias:**
```bash
npm install react react-dom
```

2. **Copiar el archivo** `SacramentosV2.jsx` a `src/App.jsx`

3. **Colocar el video intro** en la carpeta `public/`:
```
public/
  catecumenvideo.mp4   ← tu video de introducción
```

4. **Actualizar `src/main.jsx`:**
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

5. **Variables de entorno** (`.env`):
```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

6. **Ejecutar:**
```bash
npm run dev
```

---

## Flujo completo de la aplicación

```
Video intro (catecumenvideo.mp4)
  └→ Modal de Bienvenida (CICADI)
      └→ Modal de Filtrado (6 opciones)
          ├→ [Catecúmeno] Selección de sacramentos → Encuadre → Registro → Contraseña → Pago
          ├→ [Papás] Encuadre prebautismal → Registro → Contraseña → Pago
          ├→ [Padrinos] Encuadre padrinos → Registro → Contraseña → Pago
          ├→ [Catequista] Encuadre catequista → Registro → Contraseña → Pago
          ├→ [Parroquia] Encuadre parroquia → Registro → Bienvenida
          └→ [Diócesis] Encuadre diócesis → Registro → Bienvenida

Tras el pago → Tronco Común 1 (21 temas, 5 módulos)
           → [Sacramento(s) elegido(s)]
           → Tronco Común 2: Confesión + Unción
           → Constancias (1 por sacramento)
```

---

## Características implementadas

### A) Bilingüismo ES/EN
- Detección automática desde `navigator.language`
- Función `T(español, inglés)` en toda la app

### B) Tronco Común 1
- 5 módulos, 21 temas + Repaso Final
- 5 preguntas teológicas por tema (105 preguntas totales)
- Escala 0–10, necesita ≥8 para aprobar

### C) Flujo de inicio
- Video `/catecumenvideo.mp4` con auto-play
- Modal de bienvenida CICADI
- Modal de filtrado con 6 categorías

### D) Registro completo
- Fecha de nacimiento + edad calculada
- Selector de parroquia / "no estoy seguro"
- Desglose de precio por país (desde `cuotasporpais`)
- Texto explicativo para documento oficial
- Botón "Realizar mi Inscripción y Pago"
- La constancia solo es válida para mayores de 18 años

### E) Selector de código telefónico internacional
- 39 países (todo el continente americano + España)

### F) Email de confirmación
- Catequista asignada: Nelly Montoya (hardcoded)
- Simulado en demo; se activa via Supabase Edge Function

### G) Back button warning
- `beforeunload` + `popstate` listeners activos

### H) Modal de contraseña
- Mínimo 8 chars, mayúscula, número, carácter especial
- Indicador de fortaleza visual (4 niveles)
- Confirmación de contraseña

### I) SQL v2
- Tablas: usuarios, cuotasporpais, parroquias, diocesis, pagos,
  videos, preguntas, inscripciones, progreso_videos,
  intentos_evaluacion, constancias
- RLS habilitado en todas las tablas
- Función pública `validar_constancia(codigo)`

### J) Tronco Común 2
- Confesión: 4 videos + repaso (5 × 5 = 25 preguntas)
- Unción: 3 videos + repaso (4 × 5 = 20 preguntas)
- Activado automáticamente al concluir la formación específica

### K) Constancias
- 1 por cada sacramento completado
- Download modal con código de validación QR
- Nota de validez para mayores de 18 años

### L) Lluvia de símbolos dorados
- Animación CSS al completar cada sección
- Símbolos: ✝ 🕊️ ✨ 🌟 💧 🕯️ 👑 ⛪ 🙏

### M) Dashboard
- Pestaña de Progreso: barra global + por sección
- Pestaña de Cuenta: editar email, teléfono, parroquia, contraseña
- Pestaña de Constancias: descarga por sacramento

---

## Pagos Stripe

Ver `STRIPE-SETUP.md` para la guía completa de activación.

Tarjetas de prueba:
- `4242 4242 4242 4242` — Éxito
- `4000 0000 0000 9995` — Declinada
- Cualquier fecha futura, CVC 3 dígitos

---

## Base de datos Supabase

1. Ir a Supabase → SQL Editor
2. Ejecutar `schema-v2.sql` completo
3. En **Table Editor** → `cuotasporpais`: los precios ya tienen datos de muestra
4. Activar **Row Level Security** (ya incluido en el script)

---

## Producción: lista de verificación

- [ ] `pk_test_` → `pk_live_` en variables de entorno
- [ ] Video `catecumenvideo.mp4` en `/public`
- [ ] Supabase configurado con `schema-v2.sql`
- [ ] Stripe webhook apuntando al dominio de producción
- [ ] Resend configurado para emails transaccionales
- [ ] Preguntas de evaluación cargadas en tabla `preguntas` de Supabase
- [ ] Videos subidos a Supabase Storage y URLs actualizados en tabla `videos`
