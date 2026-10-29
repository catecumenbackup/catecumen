// src/data/pricing.js — sistema de precios PPP.
// PPP_PAISES: país → {tier, moneda, fx, chargeInUSD}. CUOTAS: tabla derivada
// (respaldo local); al iniciar, App la SOBREESCRIBE por país con los datos de
// Supabase (cuotasporpais). Es un objeto mutable compartido por referencia.
import { calcularCuotaPais } from "../logic.js";

const PPP_PAISES={
  // ── Nivel 1 — Alto ingreso (~$130 USD) ──────────────────────────────
  "Estados Unidos":{tier:1,cur:"USD",fx:1},
  "Canadá":{tier:1,cur:"CAD",fx:1.377},
  "España":{tier:1,cur:"EUR",fx:0.923},
  "Portugal":{tier:1,cur:"EUR",fx:0.923},

  // ── Nivel 2 — Ingreso medio-alto (~$66 USD) ─────────────────────────
  "México":{tier:2,cur:"MXN",fx:17.58},
  "Chile":{tier:2,cur:"CLP",fx:953.0},
  "Uruguay":{tier:2,cur:"UYU",fx:40.0},
  "Costa Rica":{tier:2,cur:"CRC",fx:504.5},
  "Panamá":{tier:2,cur:"USD",fx:1},
  "Puerto Rico":{tier:2,cur:"USD",fx:1},
  "Trinidad y Tobago":{tier:2,cur:"TTD",fx:6.80},
  "Jamaica":{tier:2,cur:"USD",fx:1}, // se cobra en USD (evita riesgo de liquidación JMD)

  // ── Nivel 3 — Ingreso medio (~$30 USD) ──────────────────────────────
  "Colombia":{tier:3,cur:"COP",fx:4100.0},
  "Perú":{tier:3,cur:"PEN",fx:3.73},
  "Ecuador":{tier:3,cur:"USD",fx:1},
  "Brasil":{tier:3,cur:"BRL",fx:5.60},
  "Rep. Dominicana":{tier:3,cur:"DOP",fx:60.0},
  "Guatemala":{tier:3,cur:"GTQ",fx:7.80},
  "Bolivia":{tier:3,cur:"BOB",fx:6.91},
  "El Salvador":{tier:3,cur:"USD",fx:1},
  "Honduras":{tier:3,cur:"HNL",fx:24.7},
  "Nicaragua":{tier:3,cur:"USD",fx:1}, // se cobra en USD (evita riesgo de liquidación NIO)
  "Paraguay":{tier:3,cur:"PYG",fx:7500.0},

  // ── Nivel 4 — Economías complejas / alta inflación (~$10 USD, cobro en USD) ─
  "Argentina":{tier:4,cur:"USD",fx:1,chargeInUSD:true},
  "Venezuela":{tier:4,cur:"USD",fx:1,chargeInUSD:true},
  "Cuba":{tier:4,cur:"USD",fx:1,chargeInUSD:true},
  "Haití":{tier:4,cur:"USD",fx:1,chargeInUSD:true},
};

// ── Cuota de PAPÁS (prebautismal) y PADRINOS por país, en MONEDA LOCAL ──────
// Valor explícito, ajustado al poder adquisitivo de cada país (GNI per cápita
// PPP, Banco Mundial) y anclado en dos puntos fijos: países de alto ingreso $20
// y México $200 MXN (~$11.4). Referencia de mercado para cursos equivalentes en
// línea de preparación bautismal/padrinos: ~$10–15 USD (Ascension "Belonging"
// ~$11.95; Zoom parroquial ~$10). Solo afecta papás/padrinos — NO catecúmeno ni
// catequista. México también va por la tabla cuotasporpais (activo); aquí queda
// como respaldo con el mismo valor. Para cambiar un precio, edita su número aquí.
const CUOTA_PRE_PAD = {
  // Alto ingreso — $20 (Canadá = equivalente en CAD)
  "Estados Unidos": 20, "Canadá": 28, "España": 20, "Portugal": 20,
  // Alto LatAm — ~$18
  "Panamá": 18, "Puerto Rico": 18,
  // Medio-alto — ~$13–14
  "Chile": 13300, "Uruguay": 520, "Costa Rica": 6560, "Trinidad y Tobago": 88,
  // México — ancla ($11.4)
  "México": 200,
  // Medio — ~$8–11
  "Rep. Dominicana": 660, "Colombia": 36900, "Brasil": 50,
  "Perú": 30, "Paraguay": 60000, "Ecuador": 7, "Jamaica": 8,
  // Medio-bajo — ~$5–6
  "Guatemala": 47, "Bolivia": 41, "El Salvador": 6, "Honduras": 125, "Nicaragua": 5,
  // Economías complejas / crisis — $3–5 (cobro en USD)
  "Argentina": 5, "Venezuela": 3, "Cuba": 3, "Haití": 3,
};

const CUOTAS=Object.fromEntries(
  Object.entries(PPP_PAISES).map(([pais,info])=>[pais,calcularCuotaPais(info)])
);
// Aplica el override de papás/padrinos (pre y pad) sobre la cuota calculada.
for (const [pais, monto] of Object.entries(CUOTA_PRE_PAD)) {
  if (CUOTAS[pais]) { CUOTAS[pais].pre = monto; CUOTAS[pais].pad = monto; }
}

export { PPP_PAISES, CUOTAS, CUOTA_PRE_PAD };
