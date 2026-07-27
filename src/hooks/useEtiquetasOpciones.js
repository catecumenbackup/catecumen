import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { PICK } from "../i18n.js";

// Lee las etiquetas configurables (p.ej. "Próximamente") de las opciones del
// modal de registro. Una etiqueta activa inhabilita esa opción/sacramento.
export default function useEtiquetasOpciones(){
  const [etiquetas,setEtiquetas]=useState({});
  useEffect(()=>{
    let vivo=true;
    (async()=>{
      try{
        const {data,error}=await supabase.rpc("obtener_etiquetas_opciones");
        if(error||!Array.isArray(data)||!vivo)return;
        const m={};
        data.forEach(e=>{
          const txt=PICK({es:e.texto_es,en:e.texto_en,fr:e.texto_fr,
                          de:e.texto_de,pt:e.texto_pt,it:e.texto_it});
          if(txt&&txt.trim())m[e.clave]={txt:txt.trim(),
            bg:e.color_fondo||"#B3261E", fg:e.color_texto||"#E5C97A"};
        });
        if(vivo)setEtiquetas(m);
      }catch{/* sin conexión: sin etiquetas */}
    })();
    return()=>{vivo=false;};
  },[]);
  return etiquetas;
}
