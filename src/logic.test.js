// Pruebas de la lógica pura del curso (Vitest).  Ejecutar: npm run test
import { describe, it, expect } from "vitest";
import { buildSeq, translate, pick,
  redondearCuota, calcularCuotaPais, aplicarBeca, PPP_TIER_USD, formatSerie,
  cuotaFromRow, resolverCuota } from "./logic.js";

describe("buildSeq — secuencia del curso", () => {
  it("catequista solo cursa su módulo, sin TC1/TC2/Kerigma", () => {
    expect(buildSeq("catequista", [])).toEqual(["catequista"]);
  });

  it("modo prueba reduce todo a una sola sección", () => {
    expect(buildSeq("catecumeno", ["bautismo"], true)).toEqual(["tc1"]);
  });

  it("catecúmeno de 1 sacramento: Kerigma → TC1 → sacramento → TC2", () => {
    expect(buildSeq("catecumeno", ["bautismo"])).toEqual([
      "kerigma", "tc1", "bautismo", "tc2_confesion", "tc2_uncion",
    ]);
  });

  it("catecúmeno de los 3 sacramentos: Kerigma UNA vez, en orden", () => {
    expect(buildSeq("catecumeno", ["bautismo", "confirmacion", "primera_comunion"])).toEqual([
      "kerigma", "tc1", "bautismo", "confirmacion", "primera_comunion",
      "tc2_confesion", "tc2_uncion",
    ]);
  });

  it("respeta el orden fijo aunque los sacramentos lleguen desordenados", () => {
    const seq = buildSeq("catecumeno", ["primera_comunion", "bautismo", "confirmacion"]);
    expect(seq).toEqual([
      "kerigma", "tc1", "bautismo", "confirmacion", "primera_comunion",
      "tc2_confesion", "tc2_uncion",
    ]);
  });

  it("el Kerigma aparece EXACTAMENTE una vez y antes de TC1", () => {
    const seq = buildSeq("catecumeno", ["bautismo", "confirmacion", "primera_comunion"]);
    expect(seq.filter((x) => x === "kerigma")).toHaveLength(1);
    expect(seq.indexOf("kerigma")).toBeLessThan(seq.indexOf("tc1"));
  });

  it("catecúmeno sin sacramentos elegidos: igual lleva Kerigma y TC1", () => {
    expect(buildSeq("catecumeno", [])).toEqual([
      "kerigma", "tc1", "tc2_confesion", "tc2_uncion",
    ]);
  });

  it("papá (prebautismal) NO lleva Kerigma", () => {
    const seq = buildSeq("prebautismal", []);
    expect(seq).not.toContain("kerigma");
    expect(seq).toEqual(["tc1", "prebautismal", "tc2_confesion", "tc2_uncion"]);
  });

  it("padrino NO lleva Kerigma", () => {
    const seq = buildSeq("padrino", []);
    expect(seq).not.toContain("kerigma");
    expect(seq).toEqual(["tc1", "bautismo", "tc2_confesion", "tc2_uncion"]);
  });

  it("catequista NO lleva Kerigma", () => {
    expect(buildSeq("catequista", [])).not.toContain("kerigma");
  });

  it("tolera sacs indefinido sin romper", () => {
    expect(() => buildSeq("catecumeno", undefined)).not.toThrow();
    expect(buildSeq("catecumeno", undefined)).toContain("kerigma");
  });
});

describe("translate — i18n con respaldo", () => {
  it("devuelve el idioma pedido cuando existe", () => {
    expect(translate("en", "Hola", "Hi")).toBe("Hi");
    expect(translate("fr", "Hola", "Hi", "Salut")).toBe("Salut");
  });

  it("cae a español si el idioma no se proporcionó", () => {
    expect(translate("de", "Hola", "Hi")).toBe("Hola"); // de = es por defecto
  });

  it("cae a español si el idioma es desconocido", () => {
    expect(translate("zz", "Hola", "Hi")).toBe("Hola");
  });
});

describe("pick — selector de objeto multiidioma", () => {
  const obj = { es: "Bautismo", en: "Baptism", fr: "Baptême" };

  it("elige el idioma activo", () => {
    expect(pick("en", obj)).toBe("Baptism");
    expect(pick("fr", obj)).toBe("Baptême");
  });

  it("cae a español si falta el idioma", () => {
    expect(pick("it", obj)).toBe("Bautismo");
  });

  it("cae a inglés si no hay español", () => {
    expect(pick("it", { en: "Only EN" })).toBe("Only EN");
  });

  it("devuelve cadena vacía con objeto nulo o vacío", () => {
    expect(pick("es", null)).toBe("");
    expect(pick("es", {})).toBe("");
  });
});

describe("redondearCuota — redondeo amigable por magnitud", () => {
  it("montos pequeños (<100): al entero", () => {
    expect(redondearCuota(10)).toBe(10);
    expect(redondearCuota(66.4)).toBe(66);
    expect(redondearCuota(29.6)).toBe(30);
  });
  it("cientos (100–999): al múltiplo de 5", () => {
    expect(redondearCuota(132)).toBe(130);
    expect(redondearCuota(133)).toBe(135);
  });
  it("miles (1000–9999): al múltiplo de 10", () => {
    expect(redondearCuota(1164)).toBe(1160);
    expect(redondearCuota(1166)).toBe(1170);
  });
  it("decenas de miles (≥10000): al múltiplo de 100", () => {
    expect(redondearCuota(75040)).toBe(75000);
    expect(redondearCuota(75060)).toBe(75100);
  });
});

describe("calcularCuotaPais — cuotas PPP por país", () => {
  it("EE.UU. (nivel 1, USD, fx 1): cuota completa 130, y ratios", () => {
    const q = calcularCuotaPais({ tier: 1, cur: "USD", fx: 1 });
    expect(q.b).toBe(130);
    expect(q.c).toBe(130);
    expect(q.p).toBe(130);
    expect(q.pre).toBe(redondearCuota(130 * 0.60)); // presacramental/padrino
    expect(q.cat).toBe(redondearCuota(130 * 0.77)); // catequista
    expect(q.cur).toBe("USD");
    expect(q.tier).toBe(1);
    expect(q.chargeInUSD).toBe(false);
  });
  it("los 3 sacramentos cuestan igual (b=c=p)", () => {
    const q = calcularCuotaPais({ tier: 2, cur: "MXN", fx: 17.58 });
    expect(q.b).toBe(q.c);
    expect(q.c).toBe(q.p);
  });
  it("marca chargeInUSD cuando el país lo indica (p.ej. Argentina)", () => {
    const q = calcularCuotaPais({ tier: 4, cur: "USD", fx: 1, chargeInUSD: true });
    expect(q.chargeInUSD).toBe(true);
    expect(q.b).toBe(PPP_TIER_USD[4]); // 10 USD
  });
});

describe("aplicarBeca — Beca de Esperanza (20%)", () => {
  it("sin beca: devuelve el monto base (redondeado)", () => {
    expect(aplicarBeca(130, false)).toBe(130);
    expect(aplicarBeca(66, false)).toBe(66);
  });
  it("con beca: aplica 20% de descuento", () => {
    expect(aplicarBeca(130, true)).toBe(104); // 130 * 0.8
    expect(aplicarBeca(1160, true)).toBe(928); // 1160 * 0.8
  });
  it("redondea a entero montos con decimales", () => {
    expect(aplicarBeca(66, true)).toBe(53); // 52.8 → 53
  });
});

describe("formatSerie — serie de la constancia (CAT-ISO-SAC-AÑO-NNNNNN)", () => {
  it("produce el formato canónico documentado", () => {
    expect(formatSerie("MX", "BAU", 2026, 42)).toBe("CAT-MX-BAU-2026-000042");
  });
  it("normaliza a mayúsculas y recorta segmentos", () => {
    expect(formatSerie("mx", "bautismo", 2026, 7)).toBe("CAT-MX-BAU-2026-000007");
  });
  it("descarta acentos/no alfanuméricos del país (México → MX)", () => {
    expect(formatSerie("México", "confirmacion", 2026, 1)).toBe("CAT-MX-CON-2026-000001");
  });
  it("rellena con X si faltan caracteres", () => {
    expect(formatSerie("", "", 2026, 0)).toBe("CAT-XX-XXX-2026-000000");
  });
  it("acota el consecutivo a 6 dígitos (módulo 1.000.000)", () => {
    expect(formatSerie("US", "PRI", 2026, 1000042)).toBe("CAT-US-PRI-2026-000042");
  });
  it("acepta el consecutivo como texto", () => {
    expect(formatSerie("US", "PRI", 2026, "123")).toBe("CAT-US-PRI-2026-000123");
  });
  it("siempre empieza con CAT- y tiene 5 segmentos", () => {
    const s = formatSerie("br", "euc", 2027, 999999);
    expect(s.startsWith("CAT-")).toBe(true);
    expect(s.split("-")).toHaveLength(5);
    expect(s).toBe("CAT-BR-EUC-2027-999999");
  });
});

describe("cuotaFromRow — normaliza fila de cuotasporpais (Supabase)", () => {
  it("mapea los campos y parsea a número", () => {
    const q = cuotaFromRow({
      pais: "México", bautismo: "1160", confirmacion: "1160", primera_comunion: "1160",
      prebautismal: "700", catequista: "890", padrino: "700", moneda: "MXN",
    });
    expect(q).toEqual({ b: 1160, c: 1160, p: 1160, pre: 700, cat: 890, pad: 700, cur: "MXN" });
  });
  it("campos faltantes o inválidos → 0 (nunca NaN)", () => {
    const q = cuotaFromRow({ pais: "X", bautismo: null, confirmacion: undefined, primera_comunion: "" });
    expect(q.b).toBe(0);
    expect(q.c).toBe(0);
    expect(q.p).toBe(0);
    expect(Number.isNaN(q.b)).toBe(false);
  });
  it("moneda ausente cae a USD", () => {
    expect(cuotaFromRow({ pais: "X" }).cur).toBe("USD");
  });
});

describe("resolverCuota — país seleccionado → cuota", () => {
  const tabla = { "México": { b: 1160, cur: "MXN" }, "Estados Unidos": { b: 130, cur: "USD" } };
  it("devuelve la cuota del país existente", () => {
    expect(resolverCuota("México", tabla)).toEqual({ b: 1160, cur: "MXN" });
  });
  it("país no listado → null (no se puede continuar sin cuota)", () => {
    expect(resolverCuota("Narnia", tabla)).toBeNull();
  });
  it("país vacío o tabla nula → null", () => {
    expect(resolverCuota("", tabla)).toBeNull();
    expect(resolverCuota("México", null)).toBeNull();
  });
});
