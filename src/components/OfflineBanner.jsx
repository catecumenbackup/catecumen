// src/components/OfflineBanner.jsx
// Aviso honesto de estado de conexión (Fase 0 + Fase 1).
//  - Sin conexión: explica que el avance se guarda en el dispositivo y se
//    sincroniza al reconectar, y que el video (por ahora) necesita conexión.
//  - En línea con pendientes: muestra que se está sincronizando el avance.
// Se oculta solo cuando hay conexión y la cola está vacía.
import { useEffect, useState } from "react";
import { C } from "../ui.js";
import { T } from "../i18n.js";
import { useOnline } from "../hooks/useOnline.js";
import { count } from "../offline.js";
import { AyudaConexionButton } from "./AyudaConexion.jsx";

export default function OfflineBanner() {
  const online = useOnline();
  const [pend, setPend] = useState(0);

  useEffect(() => {
    const refresh = () => setPend(count());
    refresh();
    window.addEventListener("catecumen-sync", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    const iv = setInterval(refresh, 4000); // respaldo por si cambia fuera de eventos
    return () => {
      window.removeEventListener("catecumen-sync", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      clearInterval(iv);
    };
  }, []);

  if (online && pend === 0) return null;

  const offline = !online;
  const bg = offline ? "var(--c-wine)" : "var(--c-blue)";
  const msg = offline
    ? T(
        "Sin conexión. Tu avance se guarda en tu dispositivo y se sincronizará al reconectar. Los videos requieren conexión.",
        "You're offline. Your progress is saved on your device and will sync when you reconnect. Videos require a connection.",
        "Hors ligne. Votre progression est enregistrée sur votre appareil et se synchronisera à la reconnexion. Les vidéos nécessitent une connexion.",
        "Offline. Dein Fortschritt wird auf deinem Gerät gespeichert und bei erneuter Verbindung synchronisiert. Videos benötigen eine Verbindung.",
        "Sem conexão. Seu progresso é salvo no seu dispositivo e será sincronizado ao reconectar. Os vídeos exigem conexão.",
        "Offline. I tuoi progressi sono salvati sul dispositivo e si sincronizzeranno alla riconnessione. I video richiedono una connessione."
      )
    : T(
        `Sincronizando tu avance… (${pend} pendiente${pend === 1 ? "" : "s"})`,
        `Syncing your progress… (${pend} pending)`,
        `Synchronisation de votre progression… (${pend} en attente)`,
        `Fortschritt wird synchronisiert… (${pend} ausstehend)`,
        `Sincronizando seu progresso… (${pend} pendente${pend === 1 ? "" : "s"})`,
        `Sincronizzazione dei progressi… (${pend} in sospeso)`
      );

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 905,
        background: bg, color: "#fff",
        padding: "7px 14px", textAlign: "center",
        fontFamily: "'Crimson Text',serif", fontSize: 13.5, lineHeight: 1.35,
        boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 9, height: 9, borderRadius: "50%", flex: "0 0 auto",
          background: offline ? C.gold : "#fff",
          opacity: offline ? 1 : 0.9,
          animation: offline ? "none" : "catPulse 1.1s ease-in-out infinite",
        }}
      />
      <span>{msg}</span>
      {offline && <AyudaConexionButton variant="link" />}
      <style>{"@keyframes catPulse{0%,100%{opacity:.35}50%{opacity:1}}"}</style>
    </div>
  );
}
