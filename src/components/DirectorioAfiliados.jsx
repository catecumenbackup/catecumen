import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { COUNTRIES, MX_ESTADOS } from "../data/countries.js";
import { C, BTN, MODAL, OVERLAY } from "../ui.js";
import { T } from "../i18n.js";

// Buscador PÚBLICO de parroquias y diócesis afiliadas: por cercanía (geolocalización)
// o por texto, con mapa Leaflet + OpenStreetMap (gratis, sin API key). Consume las
// RPCs buscar_afiliados_cercanos / buscar_afiliados_texto (accesibles para anon).
// Leaflet se carga por CDN bajo demanda (no engorda el bundle).
let leafletPromise = null;
function cargarLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.L) return Promise.resolve(window.L);
  if (!document.getElementById("leaflet-css")) {
    const l = document.createElement("link");
    l.id = "leaflet-css"; l.rel = "stylesheet";
    l.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(l);
  }
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => res(window.L); s.onerror = () => rej(new Error("leaflet"));
    document.head.appendChild(s);
  });
  return leafletPromise;
}

// Verde = con convenio firmado. Rojo = está en el directorio diocesano pero
// todavía no se afilia. Se usan en el marcador y en la leyenda, de un solo
// lugar, para que nunca se despinten entre sí.
const VERDE_ROJO = { verde: "#3FAE6A", rojo: "#E0574F" };

export default function DirectorioAfiliados({ onClose }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState(null);      // null | 'parroquia' | 'diocesis'
  const [pais, setPais] = useState("");        // país seleccionado ('' = todos)
  const [estado, setEstado] = useState("");    // estado (solo México)
  const [municipio, setMunicipio] = useState(""); // municipio (solo México, texto)
  const esMexico = pais === "México";
  const selStyle = { background: C.card, color: C.ivory, border: `1px solid ${C.borderD}`, borderRadius: 10, padding: "8px 10px", fontFamily: "'Crimson Text',serif", fontSize: 13.5, outline: "none" };
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [err, setErr] = useState("");
  const [buscado, setBuscado] = useState(false);
  const [sel, setSel] = useState(null); // afiliado seleccionado al hacer clic en su marcador
  const [localizando, setLocalizando] = useState(false); // pidiendo ubicación
  // Opciones de geolocalización: sin alta precisión (más rápido por WiFi/red) y
  // aceptando una posición reciente en caché (maximumAge) para respuesta casi
  // inmediata en vez de forzar un fix nuevo (que tarda varios segundos).
  const GEO_OPTS = { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 };
  // Identificador de la última búsqueda: evita que una respuesta que llega tarde
  // (p. ej. el "todas" inicial) sobrescriba a una más reciente (las "cercanas").
  const reqRef = useRef(0);
  const [desktop, setDesktop] = useState(typeof window !== "undefined" && window.innerWidth >= 900);
  const mapDiv = useRef(null), mapRef = useRef(null), layerRef = useRef(null);

  useEffect(() => {
    const h = () => setDesktop(window.innerWidth >= 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Mapa: crea/actualiza marcadores cuando cambian los resultados.
  useEffect(() => {
    let cancel = false;
    cargarLeaflet().then((L) => {
      if (cancel || !mapDiv.current) return;
      // Si cambió el layout (móvil↔escritorio), el contenedor del mapa es otro nodo.
      if (mapRef.current && mapRef.current.getContainer() !== mapDiv.current) {
        mapRef.current.remove(); mapRef.current = null; layerRef.current = null;
      }
      if (!mapRef.current) {
        mapRef.current = L.map(mapDiv.current, { scrollWheelZoom: false }).setView([14, -80], 3);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { attribution: "© OpenStreetMap", maxZoom: 18 }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }
      const lay = layerRef.current; lay.clearLayers();
      const pts = [];
      resultados.forEach((r) => {
        if (r.lat == null || r.lng == null) return;
        // El COLOR del aro dice la situación, no el tipo de organización:
        //   verde = ya afiliada          rojo = en trámite de afiliación
        // La FORMA sigue distinguiendo la jerarquía: la diócesis lleva insignia
        // grande con 🏛️; la parroquia, el monograma de Catecumen.
        const aro = r.afiliada === false ? VERDE_ROJO.rojo : VERDE_ROJO.verde;
        const icon = r.tipo === "diocesis"
          ? L.divIcon({ className: "", iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -18],
              html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#F0D68A,#9C7A28);display:flex;align-items:center;justify-content:center;font-size:21px;border:3px solid ${aro};box-shadow:0 3px 9px rgba(0,0,0,.55)">🏛️</div>` })
          : L.divIcon({ className: "", iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -15],
              html: `<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;border:3px solid ${aro};box-shadow:0 2px 6px rgba(0,0,0,.5);background:#0B1526"><img src="/icon-192.png" alt="" style="width:100%;height:100%;object-fit:cover"></div>` });
        const mk = L.marker([r.lat, r.lng], { icon });
        // Muestra los datos en el panel propio (React) y hace zoom sobre el marcador.
        mk.on("click", () => { setSel(r); if (mapRef.current) mapRef.current.setView([r.lat, r.lng], 14, { animate: true }); });
        lay.addLayer(mk);
        pts.push([r.lat, r.lng]);
      });
      if (pts.length) mapRef.current.fitBounds(pts, { padding: [30, 30], maxZoom: 12 });
      setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 120);
    }).catch(() => {});
    return () => { cancel = true; };
  }, [resultados, desktop]);

  useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);

  const buscarCerca = () => {
    setErr(""); setSel(null);
    if (!navigator.geolocation) {
      setErr(T("Tu navegador no permite geolocalización. Busca por nombre o ciudad.", "Your browser doesn't support geolocation. Search by name or city.", "Votre navigateur ne prend pas en charge la géolocalisation. Recherchez par nom ou ville.", "Ihr Browser unterstützt keine Geolokalisierung. Suchen Sie nach Name oder Stadt.", "Seu navegador não suporta geolocalização. Busque por nome ou cidade.", "Il tuo browser non supporta la geolocalizzazione. Cerca per nome o città."));
      return;
    }
    setCargando(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const id = ++reqRef.current;
      try {
        const { data, error } = await supabase.rpc("buscar_afiliados_cercanos",
          { p_lat: pos.coords.latitude, p_lng: pos.coords.longitude, p_tipo: tipo });
        if (id !== reqRef.current) return;
        if (error) throw error;
        setResultados(Array.isArray(data) ? data : []); setBuscado(true);
      } catch { if (id === reqRef.current) setErr(errBusqueda()); }
      finally { setCargando(false); }
    }, () => {
      setCargando(false);
      setErr(T("No pudimos obtener tu ubicación. Búscala por nombre o ciudad.", "We couldn't get your location. Search by name or city.", "Nous n'avons pas pu obtenir votre position. Recherchez par nom ou ville.", "Wir konnten Ihren Standort nicht ermitteln. Suchen Sie nach Name oder Stadt.", "Não conseguimos obter sua localização. Busque por nome ou cidade.", "Non è stato possibile ottenere la tua posizione. Cerca per nome o città."));
    }, GEO_OPTS);
  };

  const buscar = async () => {
    setErr(""); setSel(null); setCargando(true);
    const id = ++reqRef.current;
    try {
      const { data, error } = await supabase.rpc("buscar_afiliados_texto", {
        p_q: q, p_tipo: tipo, p_pais: pais || null,
        p_estado: esMexico ? (estado || null) : null,
        p_municipio: esMexico ? (municipio || null) : null,
      });
      if (id !== reqRef.current) return; // llegó tarde: hay una búsqueda más reciente
      if (error) throw error;
      setResultados(Array.isArray(data) ? data : []); setBuscado(true);
    } catch { if (id === reqRef.current) setErr(errBusqueda()); }
    finally { setCargando(false); }
  };
  const errBusqueda = () => T("No se pudo completar la búsqueda. Intenta de nuevo.", "The search could not be completed. Please try again.", "La recherche n'a pas pu aboutir. Réessayez.", "Die Suche konnte nicht abgeschlossen werden. Bitte erneut versuchen.", "Não foi possível concluir a busca. Tente novamente.", "Impossibile completare la ricerca. Riprova.");

  // Auto-búsqueda: al abrir (país "" = todas → todos los marcadores en el mapa)
  // y cada vez que cambia país / estado / tipo, sin pulsar "Buscar".
  useEffect(() => { buscar(); }, [pais, estado, tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al abrir, solicita la ubicación del usuario. Si la concede, muestra las más
  // cercanas; si la niega o falla, se queda con "todas" (sin mostrar error).
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let vivo = true;
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      // Toma el id DESPUÉS de obtener la posición, así gana a la búsqueda "todas"
      // inicial aunque ésta resuelva un instante después.
      const id = ++reqRef.current;
      try {
        const { data, error } = await supabase.rpc("buscar_afiliados_cercanos",
          { p_lat: pos.coords.latitude, p_lng: pos.coords.longitude, p_tipo: tipo });
        if (!vivo || id !== reqRef.current || error) return;
        setResultados(Array.isArray(data) ? data : []); setBuscado(true); setSel(null);
      } catch { /* silencioso */ }
      finally { if (vivo) setLocalizando(false); }
    }, () => { if (vivo) setLocalizando(false); /* denegada / sin ubicación: se queda con "todas", sin error */ }, GEO_OPTS);
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Leyenda de los marcadores. Va pegada al mapa en los dos layouts.
  const leyenda = (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14,
      padding: "7px 16px", borderTop: `1px solid ${C.gold}18`, background: C.card,
      fontSize: 11.5, color: C.ivory, flexShrink: 0 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#0B1526",
          border: `3px solid ${VERDE_ROJO.verde}`, flexShrink: 0 }} />
        {T("Parroquia afiliada", "Affiliated parish", "Paroisse affiliée",
           "Angeschlossene Pfarrei", "Paróquia afiliada", "Parrocchia affiliata")}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#0B1526",
          border: `3px solid ${VERDE_ROJO.rojo}`, flexShrink: 0 }} />
        {T("Parroquia en trámite de afiliación", "Parish pending affiliation",
           "Paroisse en cours d'affiliation", "Pfarrei im Beitrittsverfahren",
           "Paróquia em processo de afiliação", "Parrocchia in via di affiliazione")}
      </span>
    </div>
  );

  const filtros = [
    { k: null, lbl: T("Todas", "All", "Toutes", "Alle", "Todas", "Tutte") },
    { k: "parroquia", lbl: T("Parroquias", "Parishes", "Paroisses", "Pfarreien", "Paróquias", "Parrocchie") },
    { k: "diocesis", lbl: T("Diócesis", "Dioceses", "Diocèses", "Diözesen", "Dioceses", "Diocesi") },
  ];

  // Piezas compartidas por ambos layouts. En móvil se apilan; en escritorio el
  // mapa va grande a la izquierda y controles + info + resultados a la derecha.
  const controles = (
    <div style={{ padding: "9px 16px", borderBottom: `1px solid ${C.gold}18`, display: "flex", flexDirection: "column", gap: 7 }}>
      {/* Buscador por palabra + país + Buscar en una sola línea */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") buscar(); }}
          placeholder={T("Nombre, ciudad o país…", "Name, city or country…", "Nom, ville ou pays…", "Name, Stadt oder Land…", "Nome, cidade ou país…", "Nome, città o paese…")}
          style={{ flex: "1 1 130px", minWidth: 110, background: C.card, color: C.ivory, border: `1px solid ${C.borderD}`, borderRadius: 10, padding: "8px 12px", fontFamily: "'Crimson Text',serif", fontSize: 14.5, outline: "none" }} />
        <select value={pais} onChange={(e) => { setPais(e.target.value); setEstado(""); setMunicipio(""); }} style={{ ...selStyle, flex: "0 1 auto" }}>
          <option value="">{T("Todos los países", "All countries", "Tous les pays", "Alle Länder", "Todos os países", "Tutti i paesi")}</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={buscar} disabled={cargando} style={{ ...BTN("pri"), fontSize: 12, padding: "8px 14px" }}>
          🔍 {T("Buscar", "Search", "Chercher", "Suchen", "Buscar", "Cerca")}
        </button>
      </div>
      {esMexico && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} style={selStyle}>
            <option value="">{T("Todos los estados", "All states", "Tous les états", "Alle Bundesstaaten", "Todos os estados", "Tutti gli stati")}</option>
            {MX_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={municipio} onChange={(e) => setMunicipio(e.target.value)}
            placeholder={T("Municipio", "Municipality", "Municipalité", "Gemeinde", "Município", "Comune")}
            style={{ ...selStyle, width: 160 }} />
        </div>
      )}
      {/* "Cerca de mí" + filtros en una sola fila para ahorrar altura */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={buscarCerca} disabled={cargando}
          style={{ ...BTN("sec"), fontSize: 11.5, padding: "7px 10px", flex: "1 1 auto", justifyContent: "center", whiteSpace: "nowrap" }}>
          📍 {T("Cerca de mí", "Near me", "Près de moi", "In meiner Nähe", "Perto de mim", "Vicino a me")}
        </button>
        {filtros.map((f) => (
          <button key={String(f.k)} onClick={() => setTipo(f.k)}
            style={{ ...BTN(tipo === f.k ? "pri" : "sec"), fontSize: 11.5, padding: "7px 6px", flex: "1 1 0", justifyContent: "center" }}>{f.lbl}</button>
        ))}
      </div>
      {localizando && <p style={{ color: C.goldL, fontSize: 12.5, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "inline-block", width: 11, height: 11, border: `2px solid ${C.gold}`, borderTopColor: "transparent", borderRadius: "50%", animation: "dirSpin .7s linear infinite" }} />
        {T("Buscando cerca de ti…", "Finding places near you…", "Recherche près de vous…", "Suche in deiner Nähe…", "Buscando perto de você…", "Ricerca vicino a te…")}
      </p>}
      {err && <p style={{ color: "#F87171", fontSize: 13, margin: 0 }}>⚠️ {err}</p>}
    </div>
  );

  const panelInfo = sel && (
    <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.gold}30`, background: "rgba(200,169,81,0.09)", flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ color: C.gold, fontFamily: "'Cinzel',serif", fontSize: 14.5 }}>
          {sel.tipo === "diocesis" ? "🏛️" : "⛪"} {sel.nombre}
        </span>
        <button onClick={() => setSel(null)} aria-label="cerrar"
          style={{ background: "none", border: "none", color: C.ivoryM, cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0 }}>✕</button>
      </div>
      {sel.responsable && <p style={{ color: C.ivory, fontFamily: "'Crimson Text',serif", fontSize: 13.5, margin: "3px 0 0" }}>{sel.responsable}</p>}
      <p style={{ color: C.ivoryM, fontSize: 12.5, margin: "3px 0 0" }}>
        {[sel.direccion, sel.pais].filter(Boolean).join(" · ")}
        {sel.distancia_km != null ? ` · ${sel.distancia_km} km` : ""}
      </p>
      <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
        {sel.email && <a href={`mailto:${sel.email}`} style={{ color: C.gold, fontSize: 12.5 }}>✉️ {sel.email}</a>}
        {sel.telefono && <a href={`tel:${String(sel.telefono).replace(/\s/g, "")}`} style={{ color: C.gold, fontSize: 12.5 }}>📞 {sel.telefono}</a>}
      </div>
    </div>
  );

  const listaResultados = (
    <>
      {cargando && <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic" }}>{T("Buscando…", "Searching…", "Recherche…", "Suche…", "Buscando…", "Ricerca…")}</p>}
      {!cargando && buscado && resultados.length === 0 && (
        <p style={{ color: C.ivoryM, textAlign: "center", fontStyle: "italic", padding: "16px 0" }}>
          {T("No se encontraron afiliados. Prueba con otro nombre o amplía la búsqueda.", "No affiliates found. Try another name or widen the search.", "Aucun affilié trouvé. Essayez un autre nom ou élargissez la recherche.", "Keine angeschlossenen Einrichtungen gefunden. Versuchen Sie einen anderen Namen.", "Nenhum afiliado encontrado. Tente outro nome ou amplie a busca.", "Nessun affiliato trovato. Prova un altro nome o amplia la ricerca.")}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {resultados.map((r, i) => {
          const et = r.tipo === "diocesis"
            ? T("Diócesis", "Diocese", "Diocèse", "Diözese", "Diocese", "Diocesi")
            : T("Parroquia", "Parish", "Paroisse", "Pfarrei", "Paróquia", "Parrocchia");
          return (
            <div key={i} onClick={() => { setSel(r); if (r.lat != null && mapRef.current) mapRef.current.setView([r.lat, r.lng], 13); }}
              style={{ background: sel === r ? "rgba(200,169,81,0.14)" : "rgba(200,169,81,0.05)", border: `1px solid ${sel === r ? C.gold + "66" : C.borderD}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, cursor: "pointer" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{r.tipo === "diocesis" ? "🏛️" : "⛪"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: C.ivory, fontFamily: "'Cinzel',serif", fontSize: 14.5, margin: 0 }}>{r.nombre}</p>
                <p style={{ color: C.gold, fontSize: 11.5, margin: "2px 0 0", letterSpacing: "0.04em" }}>
                  {et}{r.distancia_km != null ? ` · ${r.distancia_km} km` : ""}
                </p>
                {r.responsable && <p style={{ color: C.ivoryM, fontSize: 13, margin: "4px 0 0", fontFamily: "'Crimson Text',serif" }}>{r.responsable}</p>}
                <p style={{ color: C.ivoryM, fontSize: 12.5, margin: "3px 0 0" }}>
                  {[r.direccion, r.pais].filter(Boolean).join(" · ")}
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                  {r.email && <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()} style={{ color: C.gold, fontSize: 12.5 }}>✉️ {r.email}</a>}
                  {r.telefono && <a href={`tel:${r.telefono.replace(/\s/g, "")}`} onClick={(e) => e.stopPropagation()} style={{ color: C.gold, fontSize: 12.5 }}>📞 {r.telefono}</a>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div style={{ ...OVERLAY, background: "rgba(9,16,28,0.9)", padding: 0 }} onClick={onClose}>
      {/* Modal ANCLADO a la ventana (position:fixed, pinado a los 4 bordes). Así
          nunca puede recortarse arriba/abajo por más alto que sea el contenido:
          las áreas internas (mapa fijo, resultados) hacen scroll dentro. */}
      <div className="catePanel" onClick={(e) => e.stopPropagation()}
        style={{ ...MODAL, position: "fixed", top: desktop ? 24 : 10, bottom: desktop ? 24 : 10, left: desktop ? 24 : 10, right: desktop ? 24 : 10, margin: "auto",
          width: "auto", maxWidth: desktop ? 1160 : 760, height: "auto", maxHeight: "none",
          display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <style>{`@keyframes dirSpin{to{transform:rotate(360deg)}}`}</style>
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "16px 20px", borderBottom: `1px solid ${C.gold}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>⛪</span>
            <h2 style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 16, margin: 0 }}>
              {T("Encuentra una parroquia o diócesis afiliada", "Find an affiliated parish or diocese", "Trouvez une paroisse ou un diocèse affilié", "Finde eine angeschlossene Pfarrei oder Diözese", "Encontre uma paróquia ou diocese afiliada", "Trova una parrocchia o diocesi affiliata")}
            </h2>
          </div>
          <button onClick={onClose} style={{ ...BTN("sec"), fontSize: 12, padding: "6px 12px" }}>✕</button>
        </div>

        {desktop ? (
          <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
            {/* Mapa (mitad izquierda) */}
            <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div ref={mapDiv} style={{ flex: "1 1 0", minHeight: 0, background: C.card }} />
              {leyenda}
            </div>
            {/* Columna derecha (mitad): controles + info + resultados */}
            <div style={{ flex: "1 1 0", minWidth: 320, display: "flex", flexDirection: "column", minHeight: 0, borderLeft: `1px solid ${C.gold}22` }}>
              {controles}
              {panelInfo}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>{listaResultados}</div>
            </div>
          </div>
        ) : (
          <>
            {controles}
            <div ref={mapDiv} style={{ height: 240, background: C.card, flexShrink: 0 }} />
            {leyenda}
            {panelInfo}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", minHeight: 120 }}>{listaResultados}</div>
          </>
        )}
      </div>
    </div>
  );
}
