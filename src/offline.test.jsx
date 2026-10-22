// src/offline.test.jsx  (jsdom: necesita localStorage y window)
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mergeInto, enqueue, count, applyOp, syncQueue } from "./offline.js";

beforeEach(() => { localStorage.clear(); });

describe("mergeInto (lógica pura de la cola)", () => {
  it("fusiona el progreso del mismo (inscripción, video) en una sola entrada", () => {
    let q = [];
    q = mergeInto(q, { tipo: "progreso", inscripcion_id: "i1", video_id: "v1", fields: { visto: true } });
    q = mergeInto(q, { tipo: "progreso", inscripcion_id: "i1", video_id: "v1", fields: { aprobado: true } });
    expect(q).toHaveLength(1);
    expect(q[0].fields).toEqual({ visto: true, aprobado: true });
  });

  it("mantiene separadas entradas de videos distintos", () => {
    let q = [];
    q = mergeInto(q, { tipo: "progreso", inscripcion_id: "i1", video_id: "v1", fields: { visto: true } });
    q = mergeInto(q, { tipo: "progreso", inscripcion_id: "i1", video_id: "v2", fields: { visto: true } });
    expect(q).toHaveLength(2);
  });

  it("deduplica la encuesta por p_video_id (la última gana)", () => {
    let q = [];
    q = mergeInto(q, { tipo: "encuesta", payload: { p_video_id: "v1", p_claridad: 3 } });
    q = mergeInto(q, { tipo: "encuesta", payload: { p_video_id: "v1", p_claridad: 5 } });
    expect(q).toHaveLength(1);
    expect(q[0].payload.p_claridad).toBe(5);
  });

  it("acumula los intentos (histórico, no se deduplican)", () => {
    let q = [];
    q = mergeInto(q, { tipo: "intento", payload: { p_inscripcion_id: "i1" } });
    q = mergeInto(q, { tipo: "intento", payload: { p_inscripcion_id: "i1" } });
    expect(q).toHaveLength(2);
  });
});

describe("enqueue + count (persistencia)", () => {
  it("guarda y cuenta las operaciones pendientes", () => {
    expect(count()).toBe(0);
    enqueue({ tipo: "progreso", inscripcion_id: "i1", video_id: "v1", fields: { visto: true } });
    expect(count()).toBe(1);
  });
});

describe("applyOp (enrutado a Supabase)", () => {
  it("progreso → upsert en progreso_videos", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supa = { from: () => ({ upsert }) };
    const err = await applyOp(supa, { tipo: "progreso", inscripcion_id: "i1", video_id: "v1", fields: { visto: true } });
    expect(err).toBeNull();
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("encuesta → rpc guardar_encuesta_video", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const supa = { rpc };
    await applyOp(supa, { tipo: "encuesta", payload: { p_video_id: "v1" } });
    expect(rpc).toHaveBeenCalledWith("guardar_encuesta_video", { p_video_id: "v1" });
  });
});

describe("syncQueue (drenado y reintentos)", () => {
  it("vacía la cola cuando el servidor acepta todo", async () => {
    enqueue({ tipo: "progreso", inscripcion_id: "i1", video_id: "v1", fields: { visto: true } });
    enqueue({ tipo: "encuesta", payload: { p_video_id: "v1" } });
    const supa = { from: () => ({ upsert: async () => ({ error: null }) }), rpc: async () => ({ error: null }) };
    const res = await syncQueue(supa);
    expect(res.flushed).toBe(2);
    expect(count()).toBe(0);
  });

  it("conserva la cola si la red está caída", async () => {
    enqueue({ tipo: "progreso", inscripcion_id: "i1", video_id: "v1", fields: { visto: true } });
    const supa = { from: () => ({ upsert: async () => ({ error: { message: "Failed to fetch" } }) }) };
    const res = await syncQueue(supa);
    expect(res.offline).toBe(true);
    expect(count()).toBe(1); // no se pierde el avance
  });
});
