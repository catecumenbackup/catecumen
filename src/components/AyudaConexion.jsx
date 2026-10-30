// src/components/AyudaConexion.jsx
// Abridor ligero y autónomo del modal de ayuda "sin conexión" (Fase 3).
// Mantiene su propio estado de apertura y carga el modal de forma diferida,
// igual que DirectorioButton. Dos presentaciones:
//   - variant="link"  → enlace discreto (para el banner de conexión).
//   - (por defecto)    → botón con estilo, para la bienvenida/área de estudio.
import { lazy, Suspense, useState } from "react";
import { C, BTN, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";
import { track as trackEvento } from "../track.js";

const AyudaConexionModal = lazy(() => import("./AyudaConexionModal.jsx"));

export function AyudaConexionButton({ variant = "button", estilo = {}, track = null }) {
  const [open, setOpen] = useState(false);
  const abrir = () => { if (track) trackEvento(track); setOpen(true); };
  const label = T("Estudiar con poca o sin conexión", "Study with little or no internet",
    "Étudier avec peu ou pas de connexion", "Mit wenig oder ohne Internet lernen",
    "Estudar com pouca ou nenhuma conexão", "Studiare con poca o nessuna connessione");

  const linkLabel = T("¿Cómo funciona?", "How does it work?", "Comment ça marche ?",
    "Wie funktioniert das?", "Como funciona?", "Come funziona?");

  return (
    <>
      {variant === "link" ? (
        <button onClick={abrir} style={{
          background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer",
          color: "#fff", textDecoration: "underline", fontFamily: "'Crimson Text',serif",
          fontSize: 13, opacity: 0.95,
        }}>{linkLabel}</button>
      ) : (
        <button onClick={abrir} style={{
          background: "#F3E6A6", color: "#4A3A08", border: "1px solid #E3CE72",
          borderRadius: 10, padding: "12px 14px", cursor: "pointer",
          fontFamily: "'Cinzel',serif", fontWeight: 700, letterSpacing: "0.04em", fontSize: 13,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxSizing: "border-box", width: estilo.width === "100%" ? "100%" : undefined,
          boxShadow: "0 3px 12px rgba(227,206,114,0.30)", ...estilo,
        }}>📶 {label}</button>
      )}

      {open && (
        <Suspense fallback={<div style={OVERLAY}><div style={{ color: C.gold, fontFamily: "'Cinzel',serif" }}>
          {T("Cargando…", "Loading…", "Chargement…", "Wird geladen…", "Carregando…", "Caricamento…")}</div></div>}>
          <AyudaConexionModal onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

export default AyudaConexionButton;
