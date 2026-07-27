// Efectos de lluvia dorada / estrellas (celebración: pago, evaluación aprobada,
// constancia). Autónomos, sin dependencias de ui/i18n.
const RAIN_SYMS=["✝","🕊️","✨","🌟","💧","✝️","👑","⛪","🙏","🌺"];

export function GoldenRain({show}){
  if(!show) return null;
  const drops=Array.from({length:30},(_,i)=>({
    sym:RAIN_SYMS[i%RAIN_SYMS.length],
    left:Math.random()*100,
    delay:Math.random()*2,
    dur:2+Math.random()*2,
    size:16+Math.random()*20,
  }));
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
      <style>{`
        @keyframes goldFall{0%{transform:translateY(-80px) rotate(0deg);opacity:1}
          100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
      `}</style>
      {drops.map((d,i)=>(
        <span key={i} style={{
          position:"absolute",top:-80,left:`${d.left}%`,fontSize:d.size,
          animation:`goldFall ${d.dur}s ${d.delay}s ease-in forwards`,
          filter:"sepia(1) saturate(3) hue-rotate(15deg)",
        }}>{d.sym}</span>
      ))}
    </div>
  );
}

export function StarRain({show}){
  if(!show) return null;
  const stars=Array.from({length:44},(_,i)=>({
    left:Math.random()*100,
    delay:Math.random()*2.2,
    dur:3+Math.random()*3,
    size:11+Math.random()*15,
    tw:0.7+Math.random()*0.8,
  }));
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:10000,overflow:"hidden"}}>
      <style>{`
        @keyframes starFall{0%{transform:translateY(-10vh) rotate(0deg)}100%{transform:translateY(112vh) rotate(720deg)}}
        @keyframes starTwinkle{0%,100%{opacity:.45;transform:scale(.8)}50%{opacity:1;transform:scale(1.25)}}
      `}</style>
      {stars.map((s,i)=>(
        <span key={i} style={{
          position:"absolute",top:0,left:`${s.left}%`,
          animation:`starFall ${s.dur}s ${s.delay}s linear forwards`,
        }}>
          <span style={{
            display:"inline-block",fontSize:s.size,
            color:i%2?"#E5C97A":"#C8A951",
            filter:"drop-shadow(0 0 5px rgba(200,169,81,0.9))",
            animation:`starTwinkle ${s.tw}s ${s.delay}s ease-in-out infinite`,
          }}>★</span>
        </span>
      ))}
    </div>
  );
}
