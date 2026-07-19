// ============================================================================
// Genera el SQL UPDATE que puebla pregunta_en/fr/de/pt/it y opcion_*_en/fr/de/pt/it
// en las 270 filas ya insertadas por migracion_preguntas.sql (Etapa 2), usando
// las traducciones de scripts/translations_preguntas.mjs.
//
// Uso: node scripts/generate_i18n_update.mjs > scripts/migracion_i18n_preguntas.sql
//
// Requiere haber corrido antes scripts/etapa6_i18n_schema.sql (ALTER TABLE).
//
// Metadata de videos copiada de src/App.jsx (igual que migrate-preguntas.mjs):
// necesaria para resolver, fila por fila, qué video_id (slug+orden) y qué
// pregunta.orden corresponde a cada entrada de TR.
// ============================================================================
import { TR } from "./translations_preguntas.mjs";

const TC1_ALL = [
  {id:"t1",o:1},{id:"t2",o:2},{id:"t3",o:3},{id:"t4",o:4},{id:"t5",o:5},
  {id:"t6",o:6},{id:"t7",o:7},{id:"t8",o:8},{id:"t9",o:9},{id:"t10",o:10},
  {id:"t11",o:11},{id:"t12",o:12},{id:"t13",o:13},{id:"t14",o:14},{id:"t15",o:15},
  {id:"t16",o:16},{id:"t17",o:17},{id:"t18",o:18},{id:"t19",o:19},{id:"t20",o:20},
  {id:"t21",o:21},{id:"t_rep",o:22},
];
const TC2_CONFESION = [{id:"cf1",o:1},{id:"cf2",o:2},{id:"cf3",o:3},{id:"cf4",o:4},{id:"cf_r",o:5}];
const TC2_UNCION = [{id:"un1",o:1},{id:"un2",o:2},{id:"un3",o:3},{id:"un_r",o:4}];
const COURSES = {
  bautismo:[{id:"bv1",o:1},{id:"bv2",o:2},{id:"bv3",o:3},{id:"bv_r",o:4}],
  primera_comunion:[{id:"pv1",o:1},{id:"pv2",o:2},{id:"pv3",o:3},{id:"pv4",o:4},{id:"pv_r",o:5}],
  confirmacion:[{id:"cv1",o:1},{id:"cv2",o:2},{id:"cv3",o:3},{id:"cv4",o:4},{id:"cv5",o:5},{id:"cv_r",o:6}],
  prebautismal:[{id:"pb1",o:1},{id:"pb2",o:2},{id:"pb3",o:3},{id:"pb_r",o:4}],
  catequista:[{id:"cq1",o:1},{id:"cq2",o:2},{id:"cq3",o:3},{id:"cq_r",o:4}],
};

const SECTIONS = [
  {slug:"tc1",              videos:TC1_ALL},
  {slug:"bautismo",         videos:COURSES.bautismo},
  {slug:"primera_comunion", videos:COURSES.primera_comunion},
  {slug:"confirmacion",     videos:COURSES.confirmacion},
  {slug:"prebautismal",     videos:COURSES.prebautismal},
  {slug:"catequista",       videos:COURSES.catequista},
  {slug:"tc2_confesion",    videos:TC2_CONFESION},
  {slug:"tc2_uncion",       videos:TC2_UNCION},
];

// Misma lógica de reutilización cíclica que en App.jsx (líneas 592-596 / 594-596
// según versión): las preguntas de los sacramentos específicos reutilizan las
// de TC1 t1..t10 en ciclo.
const REUSE_ORDER = ["bv1","bv2","bv3","bv_r","pv1","pv2","pv3","pv4","pv_r","cv1","cv2","cv3","cv4","cv5","cv_r",
 "pb1","pb2","pb3","pb_r","cq1","cq2","cq3","cq4","cq_r"];
const BASE_TOPIC_KEYS = ["t1","t2","t3","t4","t5","t6","t7","t8","t9","t10"];
const topicKeyFor = {};
REUSE_ORDER.forEach((id,i)=>{ topicKeyFor[id] = BASE_TOPIC_KEYS[i % 10]; });

function resolveTopicKey(frontId){
  return topicKeyFor[frontId] || frontId; // t1..t21,t_rep,cf*,un* resuelven a sí mismos
}

function esc(s){ return String(s).replace(/'/g,"''"); }

const out=[];
out.push("-- ============================================================");
out.push("-- Migración: traducciones reales (en/fr/de/pt/it) para public.preguntas.");
out.push("-- Generado por scripts/generate_i18n_update.mjs — requiere haber corrido");
out.push("-- antes scripts/etapa6_i18n_schema.sql. Reemplaza el placeholder de");
out.push("-- pregunta_en/opcion_*_en (que duplicaba el español) por inglés real,");
out.push("-- y puebla fr/de/pt/it por primera vez.");
out.push("-- ============================================================");
out.push("");
out.push("BEGIN;");
out.push("");

let total=0;
const faltantes=[];
for(const {slug,videos} of SECTIONS){
  for(const v of videos){
    const topicKey = resolveTopicKey(v.id);
    const esSet = null; // no tocamos el español, ya está correcto
    const langs = ["en","fr","de","pt","it"];
    const perLang = {};
    let ok = true;
    for(const lang of langs){
      const arr = TR[topicKey]?.[lang];
      if(!arr || arr.length!==5){ ok=false; break; }
      perLang[lang]=arr;
    }
    if(!ok){ faltantes.push(`${slug}/${v.id} (topic ${topicKey})`); continue; }

    out.push(`-- ${slug} · orden ${v.o} · ${v.id} (traducciones de ${topicKey})`);
    const videoSub=`(SELECT vd.id FROM public.videos vd JOIN public.sacramentos sc ON sc.id = vd.sacramento_id WHERE sc.slug = '${slug}' AND vd.orden = ${v.o})`;
    for(let qi=0; qi<5; qi++){
      const orden = qi+1;
      const sets = langs.map(lang=>{
        const q = perLang[lang][qi];
        return `pregunta_${lang} = '${esc(q.q)}', opcion_a_${lang} = '${esc(q.a)}', opcion_b_${lang} = '${esc(q.b)}', opcion_c_${lang} = '${esc(q.c)}', opcion_d_${lang} = '${esc(q.d)}'`;
      }).join(", ");
      out.push(
        `UPDATE public.preguntas SET ${sets} `+
        `WHERE video_id = ${videoSub} AND orden = ${orden};`
      );
      total++;
    }
    out.push("");
  }
}

out.push("-- Salvaguarda: aborta si alguna fila quedó sin traducción (pregunta_en NULL).");
out.push("DO $$");
out.push("DECLARE faltan INT;");
out.push("BEGIN");
out.push("  SELECT COUNT(*) INTO faltan FROM public.preguntas WHERE pregunta_en IS NULL OR pregunta_fr IS NULL OR pregunta_de IS NULL OR pregunta_pt IS NULL OR pregunta_it IS NULL;");
out.push("  IF faltan > 0 THEN");
out.push("    RAISE EXCEPTION 'Migración de traducciones incompleta: % preguntas sin alguna traducción', faltan;");
out.push("  END IF;");
out.push("END $$;");
out.push("");
out.push("COMMIT;");
out.push("");
out.push(`-- Total de UPDATE generados: ${total} (esperado: 270 preguntas x 5 idiomas nuevos)`);
if(faltantes.length){
  out.push(`-- ⚠️ Videos sin traducción disponible (revisar TR en translations_preguntas.mjs): ${faltantes.join(", ")}`);
}

console.log(out.join("\n"));
