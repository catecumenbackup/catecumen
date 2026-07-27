import { SEC_META } from "../data/course.js";
import { FlameIcon, CalizIcon, iconoBautismo, iconoConfirmacion } from "./icons.jsx";

// Ícono de una sección del curso. Resuelve los marcadores de SEC_META a
// componentes SVG (llama/cáliz) o imágenes (bautismo/confirmación), y cae
// de vuelta al emoji para el resto.
export default function SecIcon({id,size=36}){
  const ic=SEC_META[id]?.icon;
  if(ic==="__caliz__") return <CalizIcon size={size}/>;
  if(ic==="__flame__")   return <FlameIcon size={size}/>;
  if(ic==="__bautismo_img__") return <img src={iconoBautismo} width={size} height={size} style={{objectFit:"contain",filter:"sepia(1) saturate(3) brightness(0.95)",display:"block"}}/>;
  if(ic==="__confirmacion_img__") return <img src={iconoConfirmacion} width={size} height={size} style={{objectFit:"contain",filter:"sepia(1) saturate(3) brightness(0.95)",display:"block"}}/>;
  return <span style={{fontSize:size,display:"inline-block",lineHeight:1}}>{ic}</span>;
}
