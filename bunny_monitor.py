#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bunny_monitor.py — Monitor de codificación de Bunny Stream (panel Streamlit).

Cómo correrlo
-------------
    pip install streamlit requests        (una sola vez)
    cd C:\\catecumen
    streamlit run bunny_monitor.py        (abre http://localhost:8501)

Dos vistas (selector en la barra lateral):
  • "Toda la librería" — tabla con el ESTADO y el % de codificación de TODOS los
    videos del lote, resumen (cuántos finalizados / en proceso / con error) y los
    pendientes arriba. Ideal para vigilar una subida completa.
  • "Un video" — detalle de un solo video por su GUID.
Con "Actualizar cada 5 s" el panel se refresca solo.
"""
import streamlit as st
import requests
import time
from datetime import datetime, timezone

st.set_page_config(page_title="Bunny Stream Monitor", page_icon="🎬", layout="wide")
st.title("🎬 Bunny Stream Monitor")
st.caption("Panel de monitoreo de codificación de Bunny.net")

ESTADOS = {
    0: ("Creado", "⏳"), 1: ("Subido", "📤"), 2: ("Procesando", "⚙️"),
    3: ("Transcodificando", "🎞️"), 4: ("Finalizado", "✅"), 5: ("Error", "❌"),
    6: ("Falló la subida", "⛔"), 7: ("Segmentando (JIT)", "🧩"), 8: ("Listo (JIT)", "✅"),
}
FINAL_OK = {4, 8}
EN_PROCESO = {0, 1, 2, 3, 7}
CON_ERROR = {5, 6}


def estado_de(status):
    return ESTADOS.get(status, ("Desconocido", "❔"))


def fmt_ts(iso):
    """Formatea una fecha ISO de Bunny (UTC) a hora local 'YYYY-MM-DD HH:MM'."""
    if not iso:
        return ""
    try:
        s = str(iso).replace("Z", "").split(".")[0]
        dt = datetime.fromisoformat(s).replace(tzinfo=timezone.utc).astimezone()
        return dt.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return str(iso)[:16].replace("T", " ")


with st.sidebar:
    st.header("Configuración Bunny Stream")
    library_id = st.text_input("Library ID", value="796078")
    api_key = st.text_input("API Key", type="password")
    vista = st.radio("Vista", ["Toda la librería", "Un video"], index=0)
    video_id = st.text_input("Video GUID (solo vista 'Un video')",
                             value="5ff5fec3-380b-47e7-9421-1615e29eb518")
    actualizar = st.checkbox("Actualizar automáticamente cada 5 segundos", value=True)
    consultar = st.button("Consultar", type="primary")

if not api_key:
    st.info("Introduce tu API Key en el panel lateral para comenzar.")
    st.stop()


def headers():
    return {"accept": "application/json", "AccessKey": api_key}


def obtener_video(guid):
    url = f"https://video.bunnycdn.com/library/{library_id}/videos/{guid}"
    r = requests.get(url, headers=headers(), timeout=20)
    r.raise_for_status()
    return r.json()


def obtener_todos():
    vids, page = [], 1
    while True:
        url = (f"https://video.bunnycdn.com/library/{library_id}/videos"
               f"?page={page}&itemsPerPage=100&orderBy=date")
        r = requests.get(url, headers=headers(), timeout=30)
        r.raise_for_status()
        data = r.json()
        items = data.get("items", [])
        if not items:
            break
        vids.extend(items)
        if len(vids) >= data.get("totalItems", len(vids)):
            break
        page += 1
    return vids


# ── Horas REALES de fin de codificación (del webhook de Bunny, guardadas en
#    Supabase por la edge function `bunny-webhook` y leídas aquí por su RPC).
SUPABASE_URL = "https://jqlfjfamraavsbhdusuq.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbGZqZmFtcmFhdnNiaGR1c3VxIiwicm9sZSI6ImFub24i"
    "LCJpYXQiOjE3ODEyMDEwNjIsImV4cCI6MjA5Njc3NzA2Mn0."
    "AFD2j0ERaNqx4gii8z3sOvdbkIJl3Kzs_qyDErm7SL8"
)


def obtener_codificaciones():
    """Devuelve {guid: 'YYYY-MM-DD HH:MM'} con la hora real de fin de Bunny.
    Si la tabla/RPC aún no existe o no hay red, devuelve {} sin romper el panel."""
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/bunny_codificaciones_listar",
            headers={"apikey": SUPABASE_ANON_KEY,
                     "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                     "content-type": "application/json"},
            json={}, timeout=15,
        )
        r.raise_for_status()
        return {row["guid"]: fmt_ts(row.get("codificado_en")) for row in r.json()}
    except Exception:
        return {}


# ─────────────────────────── VISTA: TODA LA LIBRERÍA ─────────────────────────
def vista_libreria():
    vids = obtener_todos()
    total = len(vids)
    fin = sum(1 for v in vids if v.get("status") in FINAL_OK)
    proc = sum(1 for v in vids if v.get("status") in EN_PROCESO)
    err = sum(1 for v in vids if v.get("status") in CON_ERROR)

    st.divider()
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Videos", total)
    c2.metric("✅ Finalizados", fin)
    c3.metric("⚙️ En proceso", proc)
    c4.metric("❌ Con error", err)
    if total:
        st.progress(fin / total, text=f"{fin} de {total} codificados")

    # Pendientes/errores primero; dentro, por menor progreso.
    def orden(v):
        s = v.get("status", -1)
        prioridad = 0 if s in CON_ERROR else (1 if s in EN_PROCESO else 2)
        return (prioridad, v.get("encodeProgress", 0), v.get("title", ""))

    # Hora REAL de fin de codificación: la manda el webhook de Bunny (Status=3
    # Finished, campo Timestamp) y la guarda la edge function en Supabase.
    enc = obtener_codificaciones()

    filas = []
    for v in sorted(vids, key=orden):
        txt, ico = estado_de(v.get("status"))
        guid = v.get("guid", "")
        if guid in enc:
            codificado = enc[guid]                       # hora real de Bunny (webhook)
        elif v.get("status") in FINAL_OK:
            codificado = "~ " + fmt_ts(v.get("dateUploaded"))  # sin webhook (subido antes); aprox.
        else:
            codificado = "—"                             # aún codificando
        filas.append({
            "Video": v.get("title", "(sin título)")[:70],
            "Estado": f"{ico} {txt}",
            "%": v.get("encodeProgress", 0),
            "Codificado": codificado,
            "Resoluciones": v.get("availableResolutions") or "—",
            "Dur (s)": v.get("length", 0),
            "Tamaño (MB)": round(v.get("storageSize", 0) / 1024 / 1024, 1),
        })

    st.dataframe(
        filas, width="stretch", hide_index=True,
        column_config={"%": st.column_config.ProgressColumn(
            "% codificación", min_value=0, max_value=100, format="%d%%")},
    )
    st.caption("🕐 «Codificado» = hora REAL en que Bunny terminó de codificar (webhook de Bunny). "
               "El prefijo «~» es la fecha de subida (videos codificados antes de activar el webhook, sin hora real).")
    if proc == 0 and err == 0 and total:
        st.success("¡Todo el lote está codificado! 🎉")
    elif err:
        st.error(f"{err} video(s) con error — revísalos en Bunny.")
    st.caption("Última consulta: " + time.strftime("%H:%M:%S"))


# ─────────────────────────── VISTA: UN VIDEO ─────────────────────────────────
def vista_un_video():
    video = obtener_video(video_id)
    estado, icono = estado_de(video.get("status"))
    progreso = video.get("encodeProgress", 0)
    st.divider()
    col1, col2 = st.columns([1, 2])
    with col1:
        if video.get("thumbnailUrl"):
            st.image(video["thumbnailUrl"], width="stretch")
    with col2:
        st.subheader(video.get("title", "Sin título"))
        st.markdown(f"### {icono} {estado}")
        st.progress(min(max(progreso, 0), 100), text=f"Codificación: {progreso}%")
        st.caption(f"Video GUID: {video.get('guid','')}")
    st.divider()
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Progreso", f"{progreso}%")
    c2.metric("Duración", f"{video.get('length', 0)} s")
    c3.metric("Resolución", f"{video.get('width', 0)} × {video.get('height', 0)}")
    c4.metric("Visualizaciones", video.get("views", 0))
    st.subheader("Detalles técnicos")
    st.write("**Resoluciones disponibles:**", video.get("availableResolutions", "Pendientes"))
    st.write("**Códec:**", video.get("outputCodecs", "No disponible"))
    st.write("**Tamaño:**", f"{video.get('storageSize', 0) / 1024 / 1024:.2f} MB")
    st.write("**Fecha de subida:**", fmt_ts(video.get("dateUploaded")) or "No disponible")
    enc = obtener_codificaciones()
    guid = video.get("guid", "")
    if guid in enc:
        st.write("**Codificado (hora real de Bunny):**", enc[guid])
    elif video.get("status") in FINAL_OK:
        st.write("**Codificado:**", "~ " + (fmt_ts(video.get("dateUploaded")) or "—") + "  (sin webhook: codificado antes de activarlo)")
    if video.get("status") in FINAL_OK:
        st.success("¡El video está completamente codificado!")
    elif video.get("status") in CON_ERROR:
        st.error("La codificación ha fallado.")
    else:
        st.warning("El video todavía está en proceso.")
    st.caption("Última consulta: " + time.strftime("%H:%M:%S"))


if consultar or actualizar:
    try:
        if vista == "Toda la librería":
            vista_libreria()
        else:
            vista_un_video()
        if actualizar:
            time.sleep(5)
            st.rerun()
    except requests.exceptions.HTTPError as e:
        st.error(f"Error HTTP: {e}")
    except requests.exceptions.RequestException as e:
        st.error(f"Error de conexión: {e}")
    except Exception as e:
        st.error(f"Error: {e}")
