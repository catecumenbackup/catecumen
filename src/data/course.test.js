import { describe, it, expect } from "vitest";
import { SEC_META, Q, TEST_MODE, isSectionDone, videoState, COURSES, TC1_ALL, KERIGMA } from "./course.js";

describe("course data", () => {
  it("TEST_MODE está en false (producción)", () => {
    expect(TEST_MODE).toBe(false);
  });

  it("SEC_META tiene las secciones núcleo con forma {es,en,icon,videos}", () => {
    for (const k of ["kerigma", "tc1", "bautismo", "confirmacion", "primera_comunion"]) {
      expect(SEC_META[k]).toBeTruthy();
      expect(typeof SEC_META[k].es).toBe("string");
      expect(typeof SEC_META[k].en).toBe("string");
      expect(Array.isArray(SEC_META[k].videos)).toBe(true);
    }
  });

  it("kerigma no da constancia; los sacramentos sí", () => {
    expect(SEC_META.kerigma.cert).toBe(false);
    expect(SEC_META.bautismo.cert).toBe(true);
  });

  it("TC1_ALL aplana los 22 temas de los módulos", () => {
    expect(TC1_ALL.length).toBe(22);
    expect(SEC_META.tc1.videos).toBe(TC1_ALL);
  });

  it("Q tiene preguntas para los temas de TC1 y para los sacramentos reutilizados", () => {
    expect(Array.isArray(Q.t1)).toBe(true);
    expect(Q.t1.length).toBe(5);
    expect(Array.isArray(Q.bv1)).toBe(true); // reutilizadas por el forEach
  });
});

describe("isSectionDone", () => {
  it("false si falta aprobar algún video", () => {
    const prog = { bautismo: { bv1: { passed: true } } };
    expect(isSectionDone("bautismo", prog)).toBe(false);
  });
  it("true cuando todos los videos están aprobados", () => {
    const vids = COURSES.bautismo;
    const prog = { bautismo: Object.fromEntries(vids.map((v) => [v.id, { passed: true }])) };
    expect(isSectionDone("bautismo", prog)).toBe(true);
  });
  it("false para sección sin videos o sin progreso", () => {
    expect(isSectionDone("bautismo", {})).toBe(false);
    expect(isSectionDone("noexiste", {})).toBe(false);
  });
});

describe("videoState", () => {
  const vids = [{ id: "a" }, { id: "b" }, { id: "c" }];
  it("el primer video siempre está disponible", () => {
    expect(videoState("s", vids[0], {}, vids)).toBe("available");
  });
  it("un video posterior está bloqueado si el anterior no se aprobó", () => {
    expect(videoState("s", vids[1], {}, vids)).toBe("locked");
  });
  it("se desbloquea cuando el anterior se aprobó", () => {
    const prog = { s: { a: { passed: true } } };
    expect(videoState("s", vids[1], prog, vids)).toBe("available");
  });
  it("refleja passed y watched del propio video", () => {
    expect(videoState("s", vids[0], { s: { a: { passed: true } } }, vids)).toBe("passed");
    expect(videoState("s", vids[0], { s: { a: { visto: true } } }, vids)).toBe("watched");
  });
});
