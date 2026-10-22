// src/offline.js
// ─────────────────────────────────────────────────────────────────────────────
// Cola de sincronización para estudiar SIN conexión (Fase 1).
//
// Idea: separar "leer" de "escribir". Cuando el alumno ve un video, aprueba una
// evaluación o responde la encuesta y la escritura a Supabase falla (sin señal o
// red intermitente), la mutación NO se pierde: se guarda en una cola durable
// (localStorage) y se reintenta al volver la conexión ("online") y al arrancar.
//
// Todas las escrituras son idempotentes (upserts con clave única, o RPC que
// hacen upsert), así que reenviar la misma operación no duplica datos.
//
// La lógica pura (mergeInto) está aislada para poder probarla con Vitest.
// ─────────────────────────────────────────────────────────────────────────────

const Q_KEY = "catecumen_sync_q";
const MAX_TRIES = 5; // tras varios errores de servidor, se descarta para no atascar la cola

// ── Persistencia segura en localStorage ─────────────────────────────────────
function qGet() {
  try {
    const raw = localStorage.getItem(Q_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function qSet(arr) {
  try {
    localStorage.setItem(Q_KEY, JSON.stringify(Array.isArray(arr) ? arr : []));
  } catch { /* cuota llena o storage no disponible: no rompemos el flujo */ }
  try { window.dispatchEvent(new Event("catecumen-sync")); } catch { /* SSR/tests */ }
}

export function count() { return qGet().length; }

// ── Lógica pura: insertar/mezclar una operación en la cola ──────────────────
// - progreso: una sola entrada por (inscripcion_id, video_id); se fusionan campos.
// - encuesta: una sola entrada por video (la última gana; la RPC hace upsert).
// - intento:  histórico de intentos; se conserva cada uno.
export function mergeInto(queue, op) {
  const q = Array.isArray(queue) ? queue.slice() : [];
  const fresh = { ...op, _t: 0 };
  if (op.tipo === "progreso") {
    const i = q.findIndex(x => x.tipo === "progreso"
      && x.inscripcion_id === op.inscripcion_id && x.video_id === op.video_id);
    if (i >= 0) { q[i] = { ...q[i], fields: { ...q[i].fields, ...op.fields }, _t: 0 }; return q; }
    q.push(fresh); return q;
  }
  if (op.tipo === "encuesta") {
    const vid = op.payload && op.payload.p_video_id;
    const i = q.findIndex(x => x.tipo === "encuesta" && x.payload && x.payload.p_video_id === vid);
    if (i >= 0) { q[i] = fresh; return q; }
    q.push(fresh); return q;
  }
  q.push(fresh); // intento u otros: se acumulan
  return q;
}

export function enqueue(op) {
  if (!op || !op.tipo) return;
  qSet(mergeInto(qGet(), op));
}

// ── ¿Es un error de RED (reintentar) o del SERVIDOR (no insistir para siempre)? ──
function isNetworkErr(err) {
  try { if (typeof navigator !== "undefined" && navigator.onLine === false) return true; } catch { /* no-op */ }
  const m = ((err && (err.message || err.msg || err.details)) || "").toString().toLowerCase();
  return /failed to fetch|networkerror|network error|load failed|fetch|timeout|offline/.test(m);
}

// ── Ejecutar una operación contra Supabase ──────────────────────────────────
// Devuelve el objeto error (o null si fue bien). No lanza: centraliza el manejo.
export async function applyOp(supabase, op) {
  try {
    if (op.tipo === "progreso") {
      const { error } = await supabase.from("progreso_videos").upsert(
        { inscripcion_id: op.inscripcion_id, video_id: op.video_id, ...op.fields },
        { onConflict: "inscripcion_id,video_id" });
      return error || null;
    }
    if (op.tipo === "intento") {
      const { error } = await supabase.rpc("registrar_intento", op.payload);
      return error || null;
    }
    if (op.tipo === "encuesta") {
      const { error } = await supabase.rpc("guardar_encuesta_video", op.payload);
      return error || null;
    }
    return null; // tipo desconocido: se descarta
  } catch (e) { return e; }
}

// ── Drenar la cola ──────────────────────────────────────────────────────────
// Reintenta en orden. Si cae la red, conserva lo pendiente y lo reintenta luego.
let _syncing = false;
export async function syncQueue(supabase) {
  if (_syncing) return { flushed: 0, remaining: count(), busy: true };
  try { if (typeof navigator !== "undefined" && navigator.onLine === false)
    return { flushed: 0, remaining: count(), offline: true }; } catch { /* no-op */ }
  _syncing = true;
  try {
    const q = qGet();
    const keep = [];
    let flushed = 0;
    for (let i = 0; i < q.length; i++) {
      const op = q[i];
      const err = await applyOp(supabase, op);
      if (!err) { flushed++; continue; }
      if (isNetworkErr(err)) {               // red caída: conserva éste y el resto
        for (let j = i; j < q.length; j++) keep.push(q[j]);
        qSet(keep);
        return { flushed, remaining: keep.length, offline: true };
      }
      const tries = (op._t || 0) + 1;         // error del servidor: reintenta algunas veces
      if (tries < MAX_TRIES) keep.push({ ...op, _t: tries });
      // si llega al tope, se descarta para no atascar la cola
    }
    qSet(keep);
    return { flushed, remaining: keep.length };
  } finally { _syncing = false; }
}
