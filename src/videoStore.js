// src/videoStore.js
// ─────────────────────────────────────────────────────────────────────────────
// Almacén de video OFFLINE cifrado en reposo (Fase 2, nivel "proporcional").
//
// Objetivo de protección (honesto): que en el dispositivo NUNCA quede un .mp4
// suelto y reutilizable, y que la copia descargada quede atada a la cuenta que
// la bajó — si alguien copia el almacén a otra cuenta/instalación, no descifra.
//
// Cómo: el contenido se cifra con AES-GCM (Web Crypto). La llave se DERIVA del
// id de la cuenta con HKDF (no se guarda la llave; se recalcula al reproducir).
// Otra cuenta deriva otra llave → el descifrado falla → no se reproduce.
//
// Límite honesto: como es offline SIN DRM de hardware, la derivación depende de
// un dato no secreto (el userId), así que un atacante decidido que extraiga el
// IndexedDB y conozca la derivación podría descifrar. Esto frena la copia CASUAL
// (el caso real) y mantiene el contenido cifrado en reposo. Para endurecer más,
// se puede mezclar un secreto por-usuario entregado por una edge function al
// descargar (ver `envolverConSecretoServidor` como punto de extensión).
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME = "catecumen-offline";
const STORE = "videos";
const SALT = "catecumen-offline-salt-v1";

// ── Cripto: llave AES-GCM derivada de la cuenta (HKDF-SHA256) ────────────────
async function keyFor(ownerId) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw", enc.encode("ck:" + String(ownerId || "anon")), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode(SALT), info: enc.encode("video-at-rest") },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

// Puras (testables sin IndexedDB): cifran/descifran bytes atados al ownerId.
export async function encryptBytes(ownerId, bytes) {
  const key = await keyFor(ownerId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return { iv, ct: new Uint8Array(ct) };
}
export async function decryptBytes(ownerId, iv, ct) {
  const key = await keyFor(ownerId);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new Uint8Array(pt);
}

// ── IndexedDB (envoltorio mínimo) ───────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("sin IndexedDB"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "clave" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function tx(db, mode) { return db.transaction(STORE, mode).objectStore(STORE); }
function pReq(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }

// ── API pública ─────────────────────────────────────────────────────────────

// Guarda bytes cifrados bajo `clave`, atados a `ownerId`. meta = datos libres
// (título, secId, etc.) que NO se cifran (solo para listar en la UI).
export async function guardar({ clave, ownerId, bytes, mime = "video/mp4", meta = {} }) {
  const { iv, ct } = await encryptBytes(ownerId, bytes);
  const db = await openDB();
  await pReq(tx(db, "readwrite").put({
    clave, ownerId: String(ownerId || "anon"), iv, ct, mime,
    size: ct.byteLength, ts: Date.now(), meta,
  }));
  db.close();
}

// Devuelve un Blob descifrado si existe y pertenece a `ownerId`; si no, null.
export async function obtenerBlob({ clave, ownerId }) {
  let db;
  try {
    db = await openDB();
    const rec = await pReq(tx(db, "readonly").get(clave));
    db.close();
    if (!rec) return null;
    if (rec.ownerId !== String(ownerId || "anon")) return null; // atada a otra cuenta
    const bytes = await decryptBytes(ownerId, rec.iv, rec.ct); // falla si la llave no corresponde
    return new Blob([bytes], { type: rec.mime || "video/mp4" });
  } catch { try { db && db.close(); } catch { /* no-op */ } return null; }
}

export async function tiene(clave) {
  try {
    const db = await openDB();
    const rec = await pReq(tx(db, "readonly").get(clave));
    db.close();
    return !!rec;
  } catch { return false; }
}

export async function borrar(clave) {
  try { const db = await openDB(); await pReq(tx(db, "readwrite").delete(clave)); db.close(); } catch { /* no-op */ }
}

export async function listar(ownerId) {
  try {
    const db = await openDB();
    const all = await pReq(tx(db, "readonly").getAll());
    db.close();
    return (all || [])
      .filter(r => ownerId == null || r.ownerId === String(ownerId))
      .map(r => ({ clave: r.clave, size: r.size, ts: r.ts, meta: r.meta || {} }));
  } catch { return []; }
}

export async function totalBytes(ownerId) {
  const l = await listar(ownerId);
  return l.reduce((a, r) => a + (r.size || 0), 0);
}

// Punto de extensión (endurecimiento futuro, no usado aún): mezclar un secreto
// por-usuario entregado por una edge function al descargar, para que la llave no
// dependa solo del userId. Dejar la firma lista evita romper los datos ya guardados.
export function envolverConSecretoServidor() { /* TODO: KEK servidor + wrap de CEK */ }
