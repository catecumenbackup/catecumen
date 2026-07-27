// Pruebas de la lógica pura del curso (Vitest).  Ejecutar: npm run test
import { describe, it, expect } from "vitest";
import { buildSeq, translate, pick } from "./logic.js";

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
