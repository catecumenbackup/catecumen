#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
retimear_subtitulos.py — Alineación forzada REAL de los subtítulos de Catecumen.

Qué hace
--------
Toma los .vtt BORRADOR ya generados (que tienen el TEXTO EXACTO del guion) y
corrige sus TIEMPOS palabra por palabra, usando el audio real de cada video.
No cambia el texto: solo re-sincroniza. Produce .vtt nuevos con timing preciso.

Método: transcribe el audio con faster-whisper (timestamps por palabra) y alinea
la secuencia de palabras de TU texto contra las de la transcripción (difflib),
asignando a cada frase el tiempo real en que se dice. Donde el audio tiene pausas
(p. ej. el "minuto de silencio" de los bloques D), los tiempos lo reflejan.

Por qué en tu equipo y no en la nube de Claude: la descarga del modelo de IA
estaba bloqueada por la red del entorno de Claude. En tu PC con internet, corre.

Requisitos (una sola vez)
-------------------------
    pip install faster-whisper
    # ffmpeg debe estar instalado y en el PATH (https://ffmpeg.org/download.html)

Uso
---
    python retimear_subtitulos.py \
        --videos "C:/CATECUMEN/VIDEOS RESTAURADOS" \
        --vtt    "C:/CATECUMEN/public/subtitulos" \
        --out    "C:/CATECUMEN/public/subtitulos" \
        --model  small

    # --out puede ser el MISMO que --vtt para sobrescribir los borradores.
    # --model: tiny / base / small / medium / large-v3  (más grande = más preciso y lento).
    #          Para español, "small" o "medium" dan muy buen resultado.
    # Empareja cada .vtt con su video por el prefijo del nombre:
    #   "KER-01-A.es.vtt"  <->  "KER-01 A · ....mp4"   (KER-01 A)
    # Así sirve para Kerygma, TC1, Confirmación, Unción y Confesión por igual,
    # siempre que los videos empiecen por ese mismo código (p. ej. "TC1-03 B · ...").

Salida: escribe los .vtt re-sincronizados en --out y un resumen por consola.
"""
import argparse, os, re, glob, sys, unicodedata, difflib

def norm(w):
    w = unicodedata.normalize("NFKD", w)
    w = "".join(c for c in w if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", w.lower())

def parse_vtt(path):
    """Devuelve lista de cues [{'text':..}] en orden (ignora los tiempos viejos)."""
    cues = []
    block = []
    for raw in open(path, encoding="utf-8").read().splitlines():
        line = raw.rstrip("\n")
        if line.strip() == "":
            if block: cues.append(block); block = []
            continue
        block.append(line)
    if block: cues.append(block)
    out = []
    for b in cues:
        # saltar cabecera WEBVTT / NOTE
        if b and (b[0].startswith("WEBVTT") or b[0].startswith("NOTE")):
            continue
        # quitar número de índice y la línea de tiempos si están
        lines = b[:]
        if lines and re.fullmatch(r"\d+", lines[0].strip()): lines = lines[1:]
        if lines and "-->" in lines[0]: lines = lines[1:]
        text = " ".join(lines).strip()
        if text: out.append(text)
    return out

def load_audio(path, sr=16000):
    """Decodifica el audio a float32 mono 16 kHz con PyAV (evita la función
    decode_audio de faster-whisper, incompatible con PyAV 19+ en Python 3.14)."""
    import av, numpy as np
    container = av.open(path)
    try:
        stream = next(s for s in container.streams if s.type == "audio")
    except StopIteration:
        container.close(); raise RuntimeError("el video no tiene pista de audio")
    resampler = av.audio.resampler.AudioResampler(format="s16", layout="mono", rate=sr)
    out = []
    def _take(frames):
        for fr in frames:
            if fr is None: continue
            out.append(fr.to_ndarray().reshape(-1))
    for frame in container.decode(stream):
        res = resampler.resample(frame)
        _take(res if isinstance(res, (list, tuple)) else [res])
    try:
        res = resampler.resample(None)  # flush
        _take(res if isinstance(res, (list, tuple)) else [res])
    except Exception:
        pass
    container.close()
    if not out: raise RuntimeError("no se pudo leer audio")
    return np.concatenate(out).astype(np.float32) / 32768.0

def ts(x):
    if x < 0: x = 0
    h = int(x // 3600); m = int((x % 3600) // 60); s = x % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"

def code_of(name):
    m = re.match(r"(KER|TC1|CONF|UNC|REC)-(\d{2})[ \-]([ABCD])", name, re.I)
    if not m: return None
    return f"{m.group(1).upper()}-{m.group(2)}-{m.group(3).upper()}"

def find_video(viddir, code):
    # code = "KER-01-A" -> busca "KER-01 A*"
    pre = code.replace("-", " ", 0)  # no-op; construimos patrón manual
    fam, num, letter = code.split("-")
    for f in glob.glob(os.path.join(viddir, "*.mp4")):
        b = os.path.basename(f)
        if re.match(rf"{fam}-{num}[ \-]{letter}\b", b, re.I):
            return f
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--videos", required=True)
    ap.add_argument("--vtt", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="small")
    ap.add_argument("--lang", default="es")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("Falta faster-whisper. Instala con:  pip install faster-whisper")

    print(f"Cargando modelo '{args.model}' (la 1ª vez lo descarga)…")
    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    vtts = sorted(glob.glob(os.path.join(args.vtt, "*.vtt")))
    hechos, sin_video = 0, []
    for vp in vtts:
        code = code_of(os.path.basename(vp))
        if not code: continue
        vid = find_video(args.videos, code)
        if not vid:
            sin_video.append(code); continue
        cues = parse_vtt(vp)
        if not cues: continue

        # 1) transcripción con tiempos por palabra (decodificamos el audio con
        #    PyAV y lo pasamos como arreglo, para no depender de decode_audio).
        try:
            audio = load_audio(vid)
        except Exception as e:
            print(f"!! {code}: no se pudo decodificar el audio ({e}); lo salto"); continue
        segs, _ = model.transcribe(audio, language=args.lang, word_timestamps=True, vad_filter=True)
        asr = []  # (norm, start, end)
        for s in segs:
            for w in (s.words or []):
                n = norm(w.word)
                if n: asr.append((n, w.start, w.end))
        if not asr:
            print(f"!! {code}: sin palabras ASR, lo salto"); continue

        # 2) secuencia de palabras de TU texto, con a qué cue pertenece cada una
        my = []  # (norm, cue_idx)
        for ci, c in enumerate(cues):
            for w in c.split():
                n = norm(w)
                if n: my.append((n, ci))

        # 3) alineación difflib entre mis palabras y las del ASR
        sm = difflib.SequenceMatcher(a=[m[0] for m in my], b=[a[0] for a in asr], autojunk=False)
        # tiempo por índice de MI palabra (interpolado donde no hay match exacto)
        t_at = [None] * len(my)
        for i1, j1, n in sm.get_matching_blocks():
            for k in range(n):
                t_at[i1 + k] = asr[j1 + k][1]  # start de la palabra ASR correspondiente
        # rellenar huecos por interpolación lineal
        known = [i for i, t in enumerate(t_at) if t is not None]
        if not known:
            print(f"!! {code}: sin anclas de alineación, lo salto"); continue
        # bordes
        for i in range(0, known[0]): t_at[i] = t_at[known[0]]
        for i in range(known[-1] + 1, len(my)): t_at[i] = asr[-1][2]
        for a, b in zip(known, known[1:]):
            if b - a > 1:
                t0, t1 = t_at[a], t_at[b]
                for k in range(a + 1, b):
                    t_at[k] = t0 + (t1 - t0) * (k - a) / (b - a)
        # forzar monotonía
        for i in range(1, len(t_at)):
            if t_at[i] < t_at[i - 1]: t_at[i] = t_at[i - 1]

        # 4) tiempo de inicio de cada cue = tiempo de su 1ª palabra; fin = inicio del siguiente
        cue_start = {}
        for idx, (_, ci) in enumerate(my):
            if ci not in cue_start: cue_start[ci] = t_at[idx]
        starts = [cue_start.get(ci, 0.0) for ci in range(len(cues))]
        last_end = asr[-1][2]
        lines = ["WEBVTT", "NOTE forced-aligned (faster-whisper)", ""]
        for ci, c in enumerate(cues):
            st = starts[ci]
            en = starts[ci + 1] if ci + 1 < len(cues) else last_end
            if en < st + 0.8: en = st + 0.8
            lines += [str(ci + 1), f"{ts(st)} --> {ts(en)}", c, ""]
        outp = os.path.join(args.out, os.path.basename(vp))
        open(outp, "w", encoding="utf-8").write("\n".join(lines))
        hechos += 1
        print(f"OK {code}  cues={len(cues)}  ASRpalabras={len(asr)}")

    print(f"\nRe-sincronizados: {hechos}")
    if sin_video: print("Sin video emparejado:", sin_video)

if __name__ == "__main__":
    main()
