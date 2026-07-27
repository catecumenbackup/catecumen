import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { T } from "../i18n.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";

// Verificación pública de una constancia por su código (QR → ?validar=<código>).
// Llama a la RPC validar_constancia y muestra los datos si es auténtica.
// Pantalla hoja, sin dependencias del ámbito del curso. Probada en su .test.jsx.
export default function ValidarConstanciaModal({ codigo, onClose }) {
  const [estado, setEstado] = useState("cargando"); // cargando | ok | invalida | error
  const [info, setInfo] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("validar_constancia", { p_codigo: codigo });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (row && row.valida) { setInfo(row); setEstado("ok"); }
        else setEstado("invalida");
      } catch (e) { console.error("validar_constancia:", e); setEstado("error"); }
    })();
  }, [codigo]);
  const fmt = (d) => (d ? new Date(d).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "—");
  return (
    <div style={OVERLAY} onClick={onClose}>
      <div style={{ ...MODAL, maxWidth: 460, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        {estado === "cargando" && <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 16 }}>{T("Verificando constancia…", "Verifying certificate…", "Vérification de l'attestation…", "Bescheinigung wird überprüft…", "Verificando certificado…", "Verifica dell'attestato…")}</p>}
        {estado === "ok" && info && (<>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{info.vigente ? "✅" : "⚠️"}</div>
          <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 19, marginBottom: 4 }}>
            {info.vigente ? T("Constancia válida y vigente", "Valid and current certificate", "Attestation valide et en vigueur", "Gültige und aktuelle Bescheinigung", "Certificado válido e vigente", "Attestato valido e in corso") : T("Constancia auténtica (vigencia vencida)", "Authentic certificate (expired)", "Attestation authentique (expirée)", "Echte Bescheinigung (abgelaufen)", "Certificado autêntico (expirado)", "Attestato autentico (scaduto)")}
          </h2>
          <div style={{ textAlign: "left", marginTop: 14, fontFamily: "'Crimson Text',serif", color: C.ivory, fontSize: 14.5, lineHeight: 1.9 }}>
            <div><b>{T("Nombre", "Name", "Nom", "Name", "Nome", "Nome")}:</b> {info.nombre}</div>
            <div><b>{T("Formación", "Formation", "Formation", "Ausbildung", "Formação", "Formazione")}:</b> {info.sacramento}</div>
            <div><b>{T("País", "Country", "Pays", "Land", "País", "Paese")}:</b> {info.pais_residencia}</div>
            <div><b>{T("Catequista", "Catechist", "Catéchiste", "Katechetin", "Catequista", "Catechista")}:</b> {info.catequista}</div>
            <div><b>{T("Serie", "Serial", "Série", "Seriennr.", "Série", "Serie")}:</b> <span style={{ fontFamily: "monospace", color: C.gold }}>{info.serie}</span></div>
            <div><b>{T("Expedición", "Issued", "Délivrance", "Ausstellung", "Expedição", "Rilascio")}:</b> {fmt(info.fecha_emision)}</div>
            <div><b>{T("Vigencia", "Valid until", "Validité", "Gültig bis", "Validade", "Validità")}:</b> {fmt(info.fecha_vigencia)}</div>
          </div>
        </>)}
        {estado === "invalida" && (<>
          <div style={{ fontSize: 44, marginBottom: 8 }}>❌</div>
          <h2 style={{ fontFamily: "'Cinzel',serif", color: "#C0392B", fontSize: 18 }}>{T("Constancia no encontrada", "Certificate not found", "Attestation introuvable", "Bescheinigung nicht gefunden", "Certificado não encontrado", "Attestato non trovato")}</h2>
          <p style={{ color: C.ivoryM, fontSize: 14, marginTop: 8 }}>{T("El código no corresponde a ninguna constancia emitida.", "The code does not match any issued certificate.", "Le code ne correspond à aucune attestation émise.", "Der Code entspricht keiner ausgestellten Bescheinigung.", "O código não corresponde a nenhum certificado emitido.", "Il codice non corrisponde ad alcun attestato emesso.")}</p>
        </>)}
        {estado === "error" && <p style={{ color: "#C0392B", fontSize: 14 }}>{T("No se pudo verificar. Intenta más tarde.", "Could not verify. Try again later.", "Impossible de vérifier. Réessayez plus tard.", "Überprüfung fehlgeschlagen. Später erneut versuchen.", "Não foi possível verificar. Tente mais tarde.", "Impossibile verificare. Riprova più tardi.")}</p>}
        <button onClick={onClose} style={{ ...BTN("sec"), marginTop: 20 }}>{T("Cerrar", "Close", "Fermer", "Schließen", "Fechar", "Chiudi")}</button>
      </div>
    </div>
  );
}
