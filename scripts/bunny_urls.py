#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bunny_urls.py — Genera el SQL que pone la URL HLS de cada video de Bunny en la
tabla `videos` de Supabase, emparejando por el título (que empieza por el código
"KER-01 A", "TC1-03 B", etc.) con (sacramento, orden).

Evita pegar 24+ URLs a mano en el panel. No toca subtítulos (esos ya se asignan
con kerygma-subtitulos.sql).

Requisitos
----------
    pip install requests        # (o usa urllib, abajo ya va con urllib, sin deps)

Datos que necesitas (de tu panel de Bunny)
------------------------------------------
  • API key de la Video Library:  Stream → tu librería → pestaña "API" → "API Key"
    (es un secreto; se usa solo localmente, no se guarda en el repo).
  • Library ID:                    756611 (va en la URL del panel).
  • CDN hostname:                  algo como  vz-xxxxxxxx-xxx.b-cdn.net
    (Stream → librería → "API"/"Embed"/"Delivery"; NO es secreto).

Uso
---
    set BUNNY_API_KEY=pega-aqui-tu-api-key           (Windows CMD)
    $env:BUNNY_API_KEY="pega-aqui-tu-api-key"        (PowerShell)
    python scripts\bunny_urls.py --library 756611 --host vz-xxxx.b-cdn.net --out scripts\kerygma-videos.sql

    # Por defecto genera el .m3u8 (HLS) de cada video:  https://HOST/<guid>/playlist.m3u8
    # Procesa TODO lo que haya en la librería y lo casa por el código del título.

Después: revisa el .sql y córrelo en el SQL Editor de Supabase. Luego, en el
reproductor, VideoModal firma esas URLs con Token Authentication (si lo activaste).
"""
import argparse, os, re, sys, json, urllib.request

FAM2SLUG = {"KER": "kerigma", "TC1": "tc1", "CONF": "confirmacion",
            "UNC": "tc2_uncion", "REC": "tc2_confesion"}
BL = {"A": 1, "B": 2, "C": 3, "D": 4}

def code_from_title(t):
    m = re.match(r"\s*(KER|TC1|CONF|UNC|REC)-(\d{1,2})[ \-]([ABCD])\b", t, re.I)
    if not m: return None
    fam = m.group(1).upper(); num = int(m.group(2)); letter = m.group(3).upper()
    slug = FAM2SLUG.get(fam)
    if not slug: return None
    orden = (num - 1) * 4 + BL[letter]
    return slug, orden

def fetch_videos(library, api_key):
    vids, page = [], 1
    while True:
        url = f"https://video.bunnycdn.com/library/{library}/videos?page={page}&itemsPerPage=100&orderBy=date"
        req = urllib.request.Request(url, headers={"AccessKey": api_key, "accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode("utf-8"))
        items = data.get("items", [])
        if not items: break
        vids.extend(items)
        if len(vids) >= data.get("totalItems", len(vids)): break
        page += 1
    return vids

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--library", required=True)
    ap.add_argument("--host", required=True, help="CDN hostname, p.ej. vz-xxxx.b-cdn.net")
    ap.add_argument("--out", default="bunny-videos.sql")
    ap.add_argument("--idioma", default="es")
    ap.add_argument("--api-key", default=os.environ.get("BUNNY_API_KEY", ""))
    args = ap.parse_args()
    if not args.api_key:
        sys.exit("Falta la API key. Pon BUNNY_API_KEY en el entorno o usa --api-key.")
    host = args.host.replace("https://", "").replace("http://", "").strip("/")

    vids = fetch_videos(args.library, args.api_key)
    print(f"Videos en la librería: {len(vids)}")
    lines = ["-- bunny-videos.sql — URLs HLS de Bunny por (sacramento, orden). Generado por bunny_urls.py.",
             "-- Revisar antes de correr. Idempotente (UPDATE por slug+orden+idioma)."]
    casados, sin_codigo = 0, []
    for v in vids:
        title = v.get("title", "")
        guid = v.get("guid", "")
        cm = code_from_title(title)
        if not cm or not guid:
            sin_codigo.append(title); continue
        slug, orden = cm
        url = f"https://{host}/{guid}/playlist.m3u8"
        lines.append(
            f"UPDATE public.videos SET url_video='{url}' "
            f"WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='{slug}') "
            f"AND orden={orden} AND idioma='{args.idioma}';")
        casados += 1
    open(args.out, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"Emparejados por código: {casados}  → {args.out}")
    if sin_codigo:
        print("Sin código reconocible en el título (revisa manualmente):")
        for t in sin_codigo[:50]: print("  -", t)

if __name__ == "__main__":
    main()
