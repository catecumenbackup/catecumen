#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bunny_urls.py — Carga AUTOMÁTICA y a prueba de errores de las URLs de video de
Bunny Stream a Supabase (tabla `videos`) y, con ello, a la plataforma.

Qué hace y por qué NO te equivocas con esto
-------------------------------------------
  • Toma los GUID directamente de la API de Bunny (no copias nada a mano), así
    que NUNCA se cuela una URL firmada (bcdn_token=…/expires=…), un placeholder
    ni un GUID pegado mal. Siempre guarda el formato LIMPIO que espera la app:
        https://<host>/<guid>/playlist.m3u8
    (la app la firma sola al reproducir, con Token Authentication).
  • Empareja cada video con (sacramento, orden) por el CÓDIGO del título
    ("KER-02 B", "TC1-03 D", …). orden = (tema-1)*4 + bloque (A=1,B=2,C=3,D=4).
  • Valida antes de escribir: avisa de slots repetidos, GUID duplicados y títulos
    que no reconoce. Si hay conflicto grave, NO aplica.

Modos
-----
  (por defecto)   Lee Bunny, empareja, MUESTRA un resumen y escribe un .sql para
                  revisar/correr en el SQL Editor. No toca la base.
  --apply         Además, ESCRIBE directo en Supabase (REST, service role). Un
                  solo comando y listo; no copias SQL.
  --verify        Audita lo que YA hay en `videos`: marca URLs con token, con
                  placeholder, sin formato /<guid>/playlist.m3u8, y GUID duplicados.

Secrets (solo en tu equipo; nunca se guardan en el repo)
--------------------------------------------------------
  BUNNY_API_KEY                API key de la Video Library (Stream → librería → API).
  SUPABASE_SERVICE_ROLE_KEY    solo para --apply y --verify (Supabase → Settings →
                               API → service_role). Omítela para solo generar SQL.
  SUPABASE_URL                 opcional; si no, se lee VITE_SUPABASE_URL de ../.env.

Uso (PowerShell)
----------------
  $env:BUNNY_API_KEY="tu-api-key"
  python scripts\bunny_urls.py                      # genera el .sql (revisar)
  $env:SUPABASE_SERVICE_ROLE_KEY="tu-service-key"
  python scripts\bunny_urls.py --apply              # escribe en Supabase
  python scripts\bunny_urls.py --verify             # audita lo que ya está
"""
import argparse, os, re, sys, json, urllib.request, urllib.error

# ── Defaults de ESTA cuenta (ya no hay que recordarlos) ──────────────────────
DEFAULT_LIBRARY = "796078"
DEFAULT_HOST    = "vz-20178245-a58.b-cdn.net"

# Familia del título → slug del sacramento. Los videos de Confirmación/Unción/
# Confesión en Bunny vienen titulados TE2 / TC2U / TC2R, pero el sacramento (y el
# nombre del .vtt) usan CONF / UNC / REC. Ambos juegos de códigos se aceptan.
FAM2SLUG = {"KER": "kerigma", "TC1": "tc1",
            "CONF": "confirmacion", "UNC": "tc2_uncion", "REC": "tc2_confesion",
            "TE2": "confirmacion", "TC2U": "tc2_uncion", "TC2R": "tc2_confesion",
            "TE1B": "bautismo"}
# Familia del título → prefijo del archivo de subtítulos (.vtt).
FAM2VTT = {"KER": "KER", "TC1": "TC1", "CONF": "CONF", "UNC": "UNC", "REC": "REC",
           "TE2": "CONF", "TC2U": "UNC", "TC2R": "REC",
           "TE1B": "TE1B"}
BL = {"A": 1, "B": 2, "C": 3, "D": 4}
# Orden importa: las familias de 4 letras (TC2U/TC2R) antes que las de 3 (TE2) y
# que TC1, para que la alternancia del regex no corte mal.
# Tolerante: acepta "TC2R-06 A", "TC2R-06-A" y también "TC2R-06 bloque A"
# (algún video quedó titulado con "bloque A" en vez de solo "A").
CODE_RE = re.compile(
    r"\s*(TC2U|TC2R|TE1B|TC1|TE2|KER|CONF|UNC|REC)[ \-]?(\d{1,2})[ \-]?(?:bloque\s*)?([ABCD])\b", re.I)
GUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)

# Subtítulos: los .vtt viven en public/subtitulos y se sirven desde el sitio.
SUB_BASE = "https://www.catecumen.com/subtitulos/"
SUBS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "subtitulos")


def codigo_vtt(title):
    """'KER-02 B' → 'KER-02-B', 'TE2-01 A' → 'CONF-01-A' (nombre del .vtt). None si no reconoce."""
    m = CODE_RE.match(title or "")
    if not m:
        return None
    pre = FAM2VTT.get(m.group(1).upper())
    if not pre:
        return None
    return f"{pre}-{int(m.group(2)):02d}-{m.group(3).upper()}"


def sub_url_si_existe(title, idioma):
    """URL del subtítulo si el archivo .vtt existe localmente (solo 'es' por ahora)."""
    if idioma != "es":
        return None
    code = codigo_vtt(title)
    if not code:
        return None
    fname = f"{code}.es.vtt"
    return (SUB_BASE + fname) if os.path.isfile(os.path.join(SUBS_DIR, fname)) else None


def code_from_title(t):
    """'KER-02 B' → ('kerigma', 6); 'TE2-01 A' → ('confirmacion', 1). None si no reconoce."""
    m = CODE_RE.match(t or "")
    if not m:
        return None
    slug = FAM2SLUG.get(m.group(1).upper())
    if not slug:
        return None
    return slug, (int(m.group(2)) - 1) * 4 + BL[m.group(3).upper()]


# ── Lectura del .env del proyecto (solo para SUPABASE_URL, por comodidad) ─────
def env_from_dotenv(key):
    try:
        here = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(here, "..", ".env"), encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith(key + "="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    except OSError:
        pass
    return ""


def supabase_url():
    return (os.environ.get("SUPABASE_URL")
            or env_from_dotenv("VITE_SUPABASE_URL") or "").rstrip("/")


# ── HTTP helpers ─────────────────────────────────────────────────────────────
def http(method, url, headers, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=40) as r:
        raw = r.read().decode("utf-8")
        return r.status, (json.loads(raw) if raw else None)


def fetch_bunny_videos(library, api_key):
    # Deduplicamos por GUID: al paginar con orderBy=date, Bunny puede devolver el
    # MISMO video en el borde de dos páginas (si comparten fecha o el orden cambia
    # entre peticiones). Sin deduplicar, ese video repetido se veía como un
    # "CONFLICTO" (dos videos para el mismo slot) que además cambiaba en cada
    # corrida. Contamos los crudos para decidir cuándo parar, pero devolvemos uno
    # por GUID.
    por_guid, page, crudos, total = {}, 1, 0, None
    while True:
        url = (f"https://video.bunnycdn.com/library/{library}/videos"
               f"?page={page}&itemsPerPage=100&orderBy=date")
        _, data = http("GET", url, {"AccessKey": api_key, "accept": "application/json"})
        items = (data or {}).get("items", [])
        if not items:
            break
        for it in items:
            g = it.get("guid")
            if g and g not in por_guid:
                por_guid[g] = it
        crudos += len(items)
        total = (data or {}).get("totalItems", total)
        if total is not None and crudos >= total:
            break
        page += 1
    return list(por_guid.values())


def sb_headers(service_key, extra=None):
    h = {"apikey": service_key, "Authorization": "Bearer " + service_key,
         "Content-Type": "application/json"}
    if extra:
        h.update(extra)
    return h


# ── Emparejado Bunny → (slug, orden) con validación ──────────────────────────
def construir_mapa(vids, host, idioma):
    """Devuelve (asignaciones, sin_codigo, conflictos).
    asignaciones: lista de dicts {slug,orden,guid,title,url}."""
    por_slot = {}      # (slug,orden) -> list de (title,guid,length)
    sin_codigo = []
    for v in vids:
        title = v.get("title", ""); guid = v.get("guid", "")
        cm = code_from_title(title)
        if not cm or not GUID_RE.match(guid or ""):
            sin_codigo.append(title or "(sin título)")
            continue
        por_slot.setdefault(cm, []).append((title, guid, int(v.get("length") or 0)))

    asignaciones, conflictos = [], []
    for (slug, orden), lst in sorted(por_slot.items()):
        # Solo es conflicto si hay GUIDs DISTINTOS en el mismo slot (dos videos
        # diferentes). Si el mismo GUID aparece repetido, es un duplicado inocuo:
        # nos quedamos con uno y asignamos normalmente.
        guids_distintos = {g for _, g, _ in lst}
        if len(guids_distintos) > 1:
            conflictos.append(((slug, orden), [(t, g) for t, g, _ in lst]))
            continue  # NO asignar un slot con dos videos realmente distintos
        title, guid, length = lst[0]
        asignaciones.append({
            "slug": slug, "orden": orden, "guid": guid, "title": title, "length": length,
            "url": f"https://{host}/{guid}/playlist.m3u8",
            "sub": sub_url_si_existe(title, idioma)})   # None si no hay .vtt para ese video
    return asignaciones, sin_codigo, conflictos


def sql_de(asignaciones, idioma):
    out = ["-- bunny-videos.sql — generado por bunny_urls.py (revisar antes de correr).",
           "-- Idempotente: UPDATE por (slug, orden, idioma). URLs limpias /<guid>/playlist.m3u8."]
    for a in asignaciones:
        sets = f"url_video='{a['url']}'"
        if a.get("sub"):
            sets += f", url_subtitulos='{a['sub']}'"
        out.append(
            f"UPDATE public.videos SET {sets} "
            f"WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='{a['slug']}') "
            f"AND orden={a['orden']} AND idioma='{idioma}';")
    return "\n".join(out) + "\n"


# ── --apply: escribe directo en Supabase (REST, service role) ────────────────
def aplicar(asignaciones, idioma, sb_url, service_key, activar=False, crear=False):
    _, sacs = http("GET", f"{sb_url}/rest/v1/sacramentos?select=id,slug",
                   sb_headers(service_key))
    slug2id = {s["slug"]: s["id"] for s in (sacs or [])}
    ok = creadas = falt = err = 0
    for a in asignaciones:
        sid = slug2id.get(a["slug"])
        if not sid:
            print(f"  ! sacramento desconocido: {a['slug']}"); err += 1; continue
        q = (f"{sb_url}/rest/v1/videos?sacramento_id=eq.{sid}"
             f"&orden=eq.{a['orden']}&idioma=eq.{idioma}")
        body = {"url_video": a["url"]}
        if a.get("sub"):
            body["url_subtitulos"] = a["sub"]     # enlaza el .vtt si existe
        if activar:
            body["activo"] = True                 # --activar: reactiva al poner la URL
        try:
            _, rows = http("PATCH", q,
                           sb_headers(service_key, {"Prefer": "return=representation"}),
                           body)
            n = len(rows or [])
            if n:
                ok += n
                continue
            # No existía la fila (orden no sembrado).
            if not crear:
                print(f"  · sin fila para {a['slug']} orden {a['orden']} ({idioma})"); falt += 1
                continue
            # --crear: insertar la fila completa (título y duración de Bunny; activo).
            nueva = {
                "sacramento_id": sid, "orden": a["orden"], "idioma": idioma,
                "titulo_es": a["title"], "titulo_en": a["title"],
                "url_video": a["url"], "duracion_segundos": a.get("length", 0),
                "es_repaso_final": False, "activo": True,
            }
            if a.get("sub"):
                nueva["url_subtitulos"] = a["sub"]
            http("POST", f"{sb_url}/rest/v1/videos",
                 sb_headers(service_key, {"Prefer": "return=representation"}), nueva)
            creadas += 1
        except urllib.error.HTTPError as e:
            detalle = ""
            try: detalle = " :: " + e.read().decode("utf-8")[:120]
            except Exception: pass
            print(f"  ! error {a['slug']} orden {a['orden']}: HTTP {e.code}{detalle}"); err += 1
    print(f"\nAplicado: {ok} actualizadas · {creadas} creadas · {falt} sin fila (usa --crear) · {err} errores.")


# ── --verify: audita lo que YA está en la base ───────────────────────────────
def verificar(sb_url, service_key, idioma):
    url = (f"{sb_url}/rest/v1/videos?select=orden,url_video,sacramentos(slug)"
           f"&idioma=eq.{idioma}&url_video=neq.PENDIENTE&order=orden")
    _, rows = http("GET", url, sb_headers(service_key))
    rows = rows or []
    problemas, guids = [], {}
    for r in rows:
        u = r.get("url_video") or ""
        slug = (r.get("sacramentos") or {}).get("slug", "?")
        orden = r.get("orden")
        m = re.search(r"/([0-9a-f-]{36})/playlist\.m3u8$", u, re.I)
        if "bcdn_token" in u or "token=" in u or "expires=" in u:
            problemas.append((slug, orden, "URL FIRMADA (token) — pega solo /<guid>/playlist.m3u8"))
        elif not m:
            problemas.append((slug, orden, "formato inválido (¿placeholder? ¿falta /<guid>/playlist.m3u8?)"))
        else:
            g = m.group(1).lower()
            guids.setdefault(g, []).append(f"{slug} orden {orden}")
    dups = {g: v for g, v in guids.items() if len(v) > 1}
    print(f"Videos con URL real ({idioma}): {len(rows)}")
    if problemas:
        print(f"\n❌ {len(problemas)} URL con problema:")
        for slug, orden, msg in problemas:
            print(f"   - {slug} orden {orden}: {msg}")
    if dups:
        print(f"\n❌ GUID duplicados (dos temas al mismo video):")
        for g, where in dups.items():
            print(f"   - {g}: {', '.join(where)}")
    if not problemas and not dups:
        print("\n✅ Todo correcto: formato limpio /<guid>/playlist.m3u8 y sin GUID duplicados.")


def main():
    ap = argparse.ArgumentParser(description="Carga de URLs de Bunny a Supabase (a prueba de errores).")
    ap.add_argument("--library", default=DEFAULT_LIBRARY)
    ap.add_argument("--host", default=DEFAULT_HOST, help="CDN hostname, p.ej. vz-xxxx.b-cdn.net")
    ap.add_argument("--idioma", default="es")
    ap.add_argument("--out", default="bunny-videos.sql")
    ap.add_argument("--api-key", default=os.environ.get("BUNNY_API_KEY", ""))
    ap.add_argument("--apply", action="store_true", help="escribe directo en Supabase (service role)")
    ap.add_argument("--activar", action="store_true", help="con --apply: marca activo=true al poner la URL")
    ap.add_argument("--crear", action="store_true", help="con --apply: INSERTA la fila si el orden no existe (título y duración de Bunny)")
    ap.add_argument("--verify", action="store_true", help="audita las URLs que ya están en la base")
    ap.add_argument("--solo", default="", help="procesa SOLO un video por su código, p.ej. --solo \"KER-03 B\"")
    args = ap.parse_args()
    host = args.host.replace("https://", "").replace("http://", "").strip("/")

    # ── Modo auditoría ──
    if args.verify:
        sb, key = supabase_url(), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not sb or not key:
            sys.exit("Para --verify necesito SUPABASE_URL (o VITE_SUPABASE_URL en .env) y SUPABASE_SERVICE_ROLE_KEY.")
        verificar(sb, key, args.idioma)
        return

    if not args.api_key:
        sys.exit("Falta la API key de Bunny. Define BUNNY_API_KEY o usa --api-key.")

    vids = fetch_bunny_videos(args.library, args.api_key)
    print(f"Videos en la librería Bunny: {len(vids)}")
    asignaciones, sin_codigo, conflictos = construir_mapa(vids, host, args.idioma)

    # --solo: quedarse con UN video por su código (p.ej. "KER-03 B").
    if args.solo:
        objetivo = code_from_title(args.solo)
        if not objetivo:
            sys.exit(f"--solo: no reconozco el código '{args.solo}'. Usa algo como \"KER-03 B\".")
        asignaciones = [a for a in asignaciones if (a["slug"], a["orden"]) == objetivo]
        conflictos = [c for c in conflictos if c[0] == objetivo]
        sin_codigo = []
        if not asignaciones and not conflictos:
            sys.exit(f"--solo: no hay ningún video en Bunny con el código '{args.solo}' "
                     f"(revisa el título del video).")

    con_sub = sum(1 for a in asignaciones if a.get("sub"))
    print(f"Emparejados por código de título: {len(asignaciones)}  (con subtítulo .vtt: {con_sub})")
    for a in asignaciones:
        print(f"   {a['slug']:14} orden {a['orden']:>2}  ←  {a['title'][:46]}"
              + ("  [+sub]" if a.get("sub") else ""))
    if sin_codigo:
        print(f"\n⚠ Sin código reconocible ({len(sin_codigo)}) — se IGNORAN:")
        for t in sin_codigo[:50]:
            print(f"   - {t[:60]}")
    if conflictos:
        print(f"\n❌ CONFLICTO: dos videos distintos para el mismo (sacramento, orden). "
              f"NO se asignan hasta resolverlo:")
        for (slug, orden), lst in conflictos:
            print(f"   - {slug} orden {orden}:")
            for title, guid in lst:
                print(f"       · {title[:50]}  [{guid}]")

    # Siempre deja el .sql para revisar/correr a mano.
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(sql_de(asignaciones, args.idioma))
    print(f"\nSQL escrito en: {args.out}  ({len(asignaciones)} UPDATE)")

    if args.apply:
        sb, key = supabase_url(), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not sb or not key:
            sys.exit("Para --apply necesito SUPABASE_URL (o VITE_SUPABASE_URL en .env) y SUPABASE_SERVICE_ROLE_KEY.")
        if conflictos:
            sys.exit("Hay conflictos sin resolver (arriba). Corrige los títulos en Bunny y reintenta; no aplico nada.")
        print("\nAplicando a Supabase…"
              + ("  (+activar)" if args.activar else "")
              + ("  (+crear filas faltantes)" if args.crear else ""))
        aplicar(asignaciones, args.idioma, sb, key, activar=args.activar, crear=args.crear)
        print("Listo. Verifica con:  python scripts/bunny_urls.py --verify")
    else:
        print("\n(Modo revisión) Revisa el .sql y córrelo en el SQL Editor, o usa --apply para escribir solo.")


if __name__ == "__main__":
    main()
