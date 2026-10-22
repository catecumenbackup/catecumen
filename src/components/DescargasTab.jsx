// src/components/DescargasTab.jsx
// Gestor de lecciones descargadas para ver sin conexión (Fase 2).
// Lista las copias cifradas guardadas en este dispositivo para la cuenta actual,
// con su tamaño, el total ocupado, y permite borrarlas.
import { useEffect, useState, useCallback } from "react";
import { C, BTN } from "../ui.js";
import { T } from "../i18n.js";
import * as videoStore from "../videoStore.js";

function fmt(bytes) {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return Math.max(1, Math.round(bytes / 1024)) + " KB";
  return (mb >= 100 ? Math.round(mb) : mb.toFixed(1)) + " MB";
}

export default function DescargasTab({ userId }) {
  const [items, setItems] = useState(null); // null = cargando
  const cargar = useCallback(async () => {
    const l = await videoStore.listar(userId);
    l.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    setItems(l);
  }, [userId]);

  useEffect(() => { cargar(); }, [cargar]);

  const borrar = async (clave) => { await videoStore.borrar(clave); cargar(); };
  const borrarTodas = async () => {
    for (const it of items || []) await videoStore.borrar(it.clave);
    cargar();
  };

  const total = (items || []).reduce((a, r) => a + (r.size || 0), 0);

  return (
    <div>
      <p style={{ color: C.ivoryM, fontFamily: "'Crimson Text',serif", fontSize: 15, marginBottom: 16 }}>
        {T("Lecciones que descargaste para verlas sin conexión en este dispositivo. Se guardan cifradas y ligadas a tu cuenta.",
           "Lessons you downloaded to watch offline on this device. They are stored encrypted and tied to your account.",
           "Leçons que vous avez téléchargées pour les voir hors ligne sur cet appareil. Elles sont chiffrées et liées à votre compte.",
           "Lektionen, die du zum Offline-Ansehen auf diesem Gerät heruntergeladen hast. Sie werden verschlüsselt und mit deinem Konto verknüpft gespeichert.",
           "Lições que você baixou para ver offline neste dispositivo. São salvas criptografadas e vinculadas à sua conta.",
           "Lezioni che hai scaricato per vederle offline su questo dispositivo. Sono salvate cifrate e legate al tuo account.")}
      </p>

      {items === null ? (
        <div style={{ color: C.ivoryM, padding: 20, textAlign: "center" }}>
          {T("Cargando…", "Loading…", "Chargement…", "Wird geladen…", "Carregando…", "Caricamento…")}
        </div>
      ) : items.length === 0 ? (
        <div style={{ color: C.ivoryM, padding: "20px 0", textAlign: "center", fontFamily: "'Crimson Text',serif" }}>
          {T("No tienes lecciones descargadas.", "You have no downloaded lessons.", "Vous n'avez aucune leçon téléchargée.",
             "Du hast keine heruntergeladenen Lektionen.", "Você não tem lições baixadas.", "Non hai lezioni scaricate.")}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: C.gold, fontFamily: "'Cinzel',serif", fontSize: 13 }}>
              {items.length} {items.length === 1
                ? T("lección", "lesson", "leçon", "Lektion", "lição", "lezione")
                : T("lecciones", "lessons", "leçons", "Lektionen", "lições", "lezioni")} · {fmt(total)}
            </span>
            <button onClick={borrarTodas} style={{ background: "none", border: "none", cursor: "pointer",
              color: "#F87171", textDecoration: "underline", fontSize: 12.5, fontFamily: "'Crimson Text',serif" }}>
              {T("Borrar todas", "Delete all", "Tout supprimer", "Alle löschen", "Excluir todas", "Elimina tutte")}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((it) => (
              <div key={it.clave} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 10, background: "var(--c-cardH)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 14.5,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(it.meta && it.meta.titulo) || T("Lección", "Lesson", "Leçon", "Lektion", "Lição", "Lezione")}
                  </div>
                  <div style={{ color: C.ivoryM, fontSize: 12 }}>
                    {fmt(it.size)}{it.meta && it.meta.lang ? " · " + String(it.meta.lang).toUpperCase() : ""}
                  </div>
                </div>
                <button onClick={() => borrar(it.clave)} style={{ ...BTN("sec"), fontSize: 11.5, flex: "0 0 auto",
                  padding: "7px 14px" }}>
                  🗑 {T("Borrar", "Delete", "Supprimer", "Löschen", "Excluir", "Elimina")}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
