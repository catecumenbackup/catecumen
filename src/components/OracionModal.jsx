// src/components/OracionModal.jsx
// Oración de inicio de sesión. Dos versiones:
//   ver="L" (larga)  → al empezar la formación de cada sacramento / de papás-padrinos.
//   ver="C" (corta)  → al iniciar la sesión diaria.
// Fondo: /oracion-fondo.jpg (vela + cruz). Texto cargado a la izquierda.
// Se monta sobre document.body (createPortal) para no quedar recortada por
// ancestros con transform, igual que AyudaConexionModal.
import { createPortal } from "react-dom";
import { C } from "../ui.js";
import { T } from "../i18n.js";

const FONDO = "/oracion-fondo.jpg";

export default function OracionModal({ ver = "C", onClose }) {
  const larga = ver === "L";

  const titulo = larga
    ? T("Oración para iniciar mi camino de fe", "A prayer to begin my journey of faith",
        "Prière pour commencer mon chemin de foi", "Gebet zu Beginn meines Glaubensweges",
        "Oração para iniciar meu caminho de fé", "Preghiera per iniziare il mio cammino di fede")
    : T("Oración para comenzar", "A prayer to begin", "Prière pour commencer",
        "Gebet zu Beginn", "Oração para começar", "Preghiera per iniziare");

  const cuerpo = larga
    ? T(
`Dios de infinita misericordia,
hoy me acerco a ti con el corazón abierto y dispuesto.
Gracias por llamarme a conocerte más y por encender en mí el deseo de buscarte.
Gracias por todo lo que pones en mi vida y que hoy hace posible esta catequesis.
Sé que este espacio digital es solo una herramienta,
pero confío en que tú, Dios Espíritu Santo, estás aquí conmigo.
Te pido sabiduría para comprender tu Palabra,
paciencia para avanzar con tu guía
y constancia para no abandonar este camino.
Que lo que hoy aprenda no se quede solo en mi mente,
sino que transforme mi corazón y guíe mis acciones de cada día.
María, Madre de la Iglesia, acompáñame en esta catequesis.`,
`God of infinite mercy,
today I come to you with an open and willing heart.
Thank you for calling me to know you more and for kindling in me the desire to seek you.
Thank you for all that you place in my life and that today makes this catechesis possible.
I know this digital space is only a tool,
but I trust that you, God the Holy Spirit, are here with me.
I ask you for wisdom to understand your Word,
patience to advance under your guidance,
and perseverance not to abandon this path.
May what I learn today not remain only in my mind,
but transform my heart and guide my actions each day.
Mary, Mother of the Church, accompany me in this catechesis.`,
`Dieu de miséricorde infinie,
aujourd'hui je viens à toi avec un cœur ouvert et disponible.
Merci de m'appeler à mieux te connaître et d'allumer en moi le désir de te chercher.
Merci pour tout ce que tu mets dans ma vie et qui rend aujourd'hui possible cette catéchèse.
Je sais que cet espace numérique n'est qu'un outil,
mais j'ai confiance que toi, Dieu Esprit Saint, tu es ici avec moi.
Je te demande la sagesse pour comprendre ta Parole,
la patience pour avancer sous ta conduite
et la persévérance pour ne pas abandonner ce chemin.
Que ce que j'apprends aujourd'hui ne reste pas seulement dans mon esprit,
mais transforme mon cœur et guide mes actions chaque jour.
Marie, Mère de l'Église, accompagne-moi dans cette catéchèse.`,
`Gott der unendlichen Barmherzigkeit,
heute komme ich zu dir mit offenem und bereitem Herzen.
Danke, dass du mich rufst, dich mehr zu erkennen, und in mir das Verlangen entzündest, dich zu suchen.
Danke für alles, was du in mein Leben legst und was heute diese Katechese möglich macht.
Ich weiß, dass dieser digitale Raum nur ein Werkzeug ist,
doch ich vertraue darauf, dass du, Gott Heiliger Geist, hier bei mir bist.
Ich bitte dich um Weisheit, um dein Wort zu verstehen,
um Geduld, um unter deiner Führung voranzugehen,
und um Beständigkeit, um diesen Weg nicht aufzugeben.
Möge das, was ich heute lerne, nicht nur in meinem Verstand bleiben,
sondern mein Herz verwandeln und mein Handeln jeden Tag leiten.
Maria, Mutter der Kirche, begleite mich in dieser Katechese.`,
`Deus de infinita misericórdia,
hoje me aproximo de ti com o coração aberto e disposto.
Obrigado por me chamares a conhecer-te mais e por acenderes em mim o desejo de te buscar.
Obrigado por tudo o que colocas na minha vida e que hoje torna possível esta catequese.
Sei que este espaço digital é apenas uma ferramenta,
mas confio em que tu, Deus Espírito Santo, estás aqui comigo.
Peço-te sabedoria para compreender a tua Palavra,
paciência para avançar sob a tua orientação
e perseverança para não abandonar este caminho.
Que aquilo que hoje aprendo não fique só na minha mente,
mas transforme o meu coração e guie as minhas ações de cada dia.
Maria, Mãe da Igreja, acompanha-me nesta catequese.`,
`Dio di infinita misericordia,
oggi mi avvicino a te con il cuore aperto e disponibile.
Grazie per avermi chiamato a conoscerti di più e per aver acceso in me il desiderio di cercarti.
Grazie per tutto ciò che poni nella mia vita e che oggi rende possibile questa catechesi.
So che questo spazio digitale è solo uno strumento,
ma confido che tu, Dio Spirito Santo, sei qui con me.
Ti chiedo sapienza per comprendere la tua Parola,
pazienza per avanzare sotto la tua guida
e costanza per non abbandonare questo cammino.
Che ciò che oggi imparo non resti solo nella mia mente,
ma trasformi il mio cuore e guidi le mie azioni di ogni giorno.
Maria, Madre della Chiesa, accompagnami in questa catechesi.`)
    : T(
`Dios de infinita misericordia,
abre mi mente para comprender tu Palabra
y mi corazón para vivirla cada día.
Ven, Dios Espíritu Santo, guía esta sesión;
y tú, María, Madre de la Iglesia, acompáñame.`,
`God of infinite mercy,
open my mind to understand your Word
and my heart to live it each day.
Come, God the Holy Spirit, guide this session;
and you, Mary, Mother of the Church, accompany me.`,
`Dieu de miséricorde infinie,
ouvre mon esprit pour comprendre ta Parole
et mon cœur pour la vivre chaque jour.
Viens, Dieu Esprit Saint, guide cette session ;
et toi, Marie, Mère de l'Église, accompagne-moi.`,
`Gott der unendlichen Barmherzigkeit,
öffne meinen Verstand, um dein Wort zu verstehen,
und mein Herz, um es jeden Tag zu leben.
Komm, Gott Heiliger Geist, leite diese Einheit;
und du, Maria, Mutter der Kirche, begleite mich.`,
`Deus de infinita misericórdia,
abre a minha mente para compreender a tua Palavra
e o meu coração para vivê-la cada dia.
Vem, Deus Espírito Santo, guia esta sessão;
e tu, Maria, Mãe da Igreja, acompanha-me.`,
`Dio di infinita misericordia,
apri la mia mente per comprendere la tua Parola
e il mio cuore per viverla ogni giorno.
Vieni, Dio Spirito Santo, guida questa sessione;
e tu, Maria, Madre della Chiesa, accompagnami.`);

  const amen = T("Amén", "Amen", "Amen", "Amen", "Amém", "Amen");
  const boton = T("Comenzar la sesión", "Begin the session", "Commencer la session",
    "Einheit beginnen", "Começar a sessão", "Inizia la sessione");

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(8,5,2,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "min(960px,96vw)", minHeight: 430, borderRadius: 16,
          overflow: "hidden", display: "flex", boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
          backgroundImage:
            "linear-gradient(90deg,rgba(14,8,2,0.95) 0%,rgba(14,8,2,0.9) 36%,rgba(14,8,2,0.5) 62%,rgba(14,8,2,0) 84%),url(" + FONDO + ")",
          backgroundSize: "cover", backgroundPosition: "right center" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center",
          width: "60%", minWidth: 280, padding: "clamp(26px,4.2vw,50px)", textAlign: "left" }}>
          <div style={{ fontFamily: "'Cinzel',serif", color: C.goldL, fontWeight: 700,
            fontSize: "clamp(18px,2.3vw,26px)", lineHeight: 1.25, marginBottom: 18,
            textShadow: "0 2px 10px rgba(0,0,0,0.75)" }}>🕯️ {titulo}</div>
          <div style={{ color: "#F3ECD8", fontFamily: "'Crimson Text',serif",
            fontSize: "clamp(13px,1.5vw,16.5px)", lineHeight: 1.66, whiteSpace: "pre-line",
            textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>{cuerpo}</div>
          <div style={{ color: C.goldL, fontFamily: "'Crimson Text',serif", fontStyle: "italic",
            fontSize: "clamp(14px,1.6vw,18px)", marginTop: 8,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>{amen}</div>
          <button onClick={onClose}
            style={{ marginTop: 22, alignSelf: "flex-start", fontFamily: "'Cinzel',serif",
              fontWeight: 700, fontSize: 14, padding: "11px 26px", border: "none", borderRadius: 9,
              cursor: "pointer", color: "#2A1807",
              background: "linear-gradient(135deg,#E5C97A,#C8A951 55%,#9A7A2A)",
              boxShadow: "0 6px 18px rgba(200,169,81,0.35)" }}>{boton}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
