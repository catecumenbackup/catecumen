// src/data/course.js
// Contenido del curso (secciones, videos, preguntas) + metadatos y helpers PUROS.
// Extraído de App.jsx en la modularización. Sin JSX ni dependencias del ámbito de App.
// SecIcon (que usa JSX/iconos) vive en ../components/SecIcon.jsx.

const TC1_MODULES=[
  {id:"m1",num:"I",
   es:"La Revelación y la Respuesta (El Encuentro)",
   en:"Revelation and Response (The Encounter)",
   videos:[
    {id:"t1",o:1,es:"El anhelo de Dios",en:"The Longing for God",dur:"30 min",mod:"I"},
    {id:"t2",o:2,es:"La Revelación Divina",en:"Divine Revelation",dur:"30 min",mod:"I"},
    {id:"t3",o:3,es:"La Fe: Respuesta al llamado de Dios",en:"Faith: Response to God's Call",dur:"30 min",mod:"I"},
  ]},
  {id:"m2",num:"II",
   es:"La Profesión de Fe (El Credo)",
   en:"The Profession of Faith (The Creed)",
   videos:[
    {id:"t4",o:4,es:"Dios Padre: Creador y Providencia",en:"God the Father: Creator",dur:"30 min",mod:"II"},
    {id:"t5",o:5,es:"Jesucristo: Verdadero Dios y Verdadero Hombre",en:"Jesus Christ: True God and True Man",dur:"30 min",mod:"II"},
    {id:"t6",o:6,es:"El Misterio Pascual: Pasión, Muerte y Resurrección",en:"The Paschal Mystery",dur:"30 min",mod:"II"},
    {id:"t7",o:7,es:"El Espíritu Santo: Señor y Dador de Vida",en:"The Holy Spirit: Lord and Giver of Life",dur:"30 min",mod:"II"},
    {id:"t8",o:8,es:"La Iglesia: Una, Santa, Católica y Apostólica",en:"The Church: One, Holy, Catholic, Apostolic",dur:"30 min",mod:"II"},
    {id:"t9",o:9,es:"María: Madre de Dios y Madre de la Iglesia",en:"Mary: Mother of God and the Church",dur:"30 min",mod:"II"},
  ]},
  {id:"m3",num:"III",
   es:"La Celebración del Misterio Cristiano (Los Sacramentos)",
   en:"The Celebration of the Christian Mystery",
   videos:[
    {id:"t10",o:10,es:"La Liturgia y los Sacramentos",en:"Liturgy and the Sacraments",dur:"30 min",mod:"III"},
    {id:"t11",o:11,es:"Introducción al Bautismo",en:"Introduction to Baptism",dur:"30 min",mod:"III"},
    {id:"t12",o:12,es:"Introducción a la Confirmación",en:"Introduction to Confirmation",dur:"30 min",mod:"III"},
    {id:"t13",o:13,es:"Introducción a la Eucaristía",en:"Introduction to the Eucharist",dur:"30 min",mod:"III"},
    {id:"t14",o:14,es:"Sacramentos de Sanación: Reconciliación y Unción",en:"Sacraments of Healing",dur:"30 min",mod:"III"},
  ]},
  {id:"m4",num:"IV",
   es:"La Vida en Cristo (La Moral Cristiana)",
   en:"Life in Christ (Christian Morality)",
   videos:[
    {id:"t15",o:15,es:"Dignidad de la persona y libertad humana",en:"Human Dignity and Freedom",dur:"30 min",mod:"IV"},
    {id:"t16",o:16,es:"El pecado y la gracia de Dios",en:"Sin and God's Grace",dur:"30 min",mod:"IV"},
    {id:"t17",o:17,es:"Los Diez Mandamientos",en:"The Ten Commandments",dur:"30 min",mod:"IV"},
    {id:"t18",o:18,es:"La Ley Evangélica y las Bienaventuranzas",en:"The Gospel Law and the Beatitudes",dur:"30 min",mod:"IV"},
  ]},
  {id:"m5",num:"V",
   es:"La Oración Cristiana (El Diálogo íntimo)",
   en:"Christian Prayer (The Intimate Dialogue)",
   videos:[
    {id:"t19",o:19,es:"¿Qué es la oración? Tipos de oración",en:"What is Prayer? Types of Prayer",dur:"30 min",mod:"V"},
    {id:"t20",o:20,es:"Formas de expresión: Oración, Meditación y Contemplación",en:"Forms of Prayer",dur:"30 min",mod:"V"},
    {id:"t21",o:21,es:"El Padre Nuestro: El resumen del Evangelio",en:"The Our Father: Summary of the Gospel",dur:"30 min",mod:"V"},
  ]},
  {id:"mR",num:"★",es:"Evaluación Final",en:"Final Evaluation",
   videos:[{id:"t_rep",o:22,es:"Repaso Final — Tronco Común 1",en:"Final Review — Common Core 1",dur:"45 min",mod:"★",repaso:true}]},
];
const TC1_ALL = TC1_MODULES.flatMap(m=>m.videos);

// ─── CONTENIDO TC2 (Confesión + Unción) ───────────────────────────
const TC2_CONFESION=[
  {id:"cf1",o:1,es:"¿Qué es el Sacramento de la Reconciliación?",en:"The Sacrament of Reconciliation",dur:"30 min"},
  {id:"cf2",o:2,es:"Los actos del penitente: Contrición, Confesión y Satisfacción",en:"Acts of the Penitent",dur:"30 min"},
  {id:"cf3",o:3,es:"Los efectos de la Confesión",en:"Effects of Confession",dur:"30 min"},
  {id:"cf4",o:4,es:"Cómo hacer una buena Confesión",en:"How to Make a Good Confession",dur:"30 min"},
  {id:"cf_r",o:5,es:"Repaso Final — La Confesión",en:"Final Review — Confession",dur:"30 min",repaso:true},
];
const TC2_UNCION=[
  {id:"un1",o:1,es:"¿Qué es el Sacramento de la Unción de los Enfermos?",en:"The Sacrament of Anointing of the Sick",dur:"30 min"},
  {id:"un2",o:2,es:"Los efectos de la Unción y quiénes lo reciben",en:"Effects and Recipients",dur:"30 min"},
  {id:"un3",o:3,es:"La celebración de la Unción de los Enfermos",en:"Celebrating the Anointing",dur:"30 min"},
  {id:"un_r",o:4,es:"Repaso Final — La Unción",en:"Final Review — Anointing",dur:"30 min",repaso:true},
];

// ─── CURSOS SACRAMENTOS ESPECÍFICOS ───────────────────────────────
// ─── MÓDULO 0 · KERIGMA ───────────────────────────────────────────
// Cimiento espiritual previo a TC1. Aplica SOLO a catecúmenos de Bautismo,
// Confirmación y Primera Comunión (una sola vez, aunque cursen los 3). No
// aplica a papás (prebautismal) ni padrinos. Por ahora 1 video con evaluación;
// ampliable desde el panel admin.
const KERIGMA=[
  {id:"kg1",o:1,es:"El Kerigma: el primer anuncio del Evangelio",en:"The Kerygma: the first proclamation of the Gospel",fr:"Le Kérygme : la première annonce de l'Évangile",de:"Das Kerygma: die erste Verkündigung des Evangeliums",pt:"O Querigma: o primeiro anúncio do Evangelho",it:"Il Kerygma: il primo annuncio del Vangelo",dur:"30 min"},
];
const COURSES={
  bautismo:[
    {id:"bv1",o:1,es:"¿Qué es el Bautismo?",en:"What is Baptism?",dur:"30 min"},
    {id:"bv2",o:2,es:"El Agua: Símbolo de vida nueva",en:"Water: Symbol of New Life",dur:"30 min"},
    {id:"bv3",o:3,es:"El Rito Bautismal y sus signos",en:"The Baptismal Rite and Its Signs",dur:"30 min"},
    {id:"bv_r",o:4,es:"Repaso Final — Bautismo",en:"Final Review — Baptism",dur:"30 min",repaso:true},
  ],
  primera_comunion:[
    {id:"pv1",o:1,es:"La Eucaristía en la historia de la salvación",en:"The Eucharist in Salvation History",dur:"30 min"},
    {id:"pv2",o:2,es:"La Presencia Real: La Transubstanciación",en:"The Real Presence: Transubstantiation",dur:"30 min"},
    {id:"pv3",o:3,es:"Preparación espiritual para la Primera Comunión",en:"Spiritual Preparation",dur:"30 min"},
    {id:"pv4",o:4,es:"La Santa Misa: El Sacrificio Eucarístico",en:"Holy Mass: The Eucharistic Sacrifice",dur:"30 min"},
    {id:"pv_r",o:5,es:"Repaso Final — Primera Comunión",en:"Final Review — First Communion",dur:"30 min",repaso:true},
  ],
  confirmacion:[
    {id:"cv1",o:1,es:"El Espíritu Santo en la Iglesia y en el creyente",en:"The Holy Spirit in the Church",dur:"30 min"},
    {id:"cv2",o:2,es:"Los 7 Dones del Espíritu Santo",en:"The 7 Gifts of the Holy Spirit",dur:"30 min"},
    {id:"cv3",o:3,es:"La Confirmación en la Sagrada Escritura",en:"Confirmation in Scripture",dur:"30 min"},
    {id:"cv4",o:4,es:"Ser testigo de Cristo en el mundo",en:"Being a Witness of Christ",dur:"30 min"},
    {id:"cv5",o:5,es:"El Rito de la Confirmación",en:"The Rite of Confirmation",dur:"30 min"},
    {id:"cv_r",o:6,es:"Repaso Final — Confirmación",en:"Final Review — Confirmation",dur:"30 min",repaso:true},
  ],
  prebautismal:[
    {id:"pb1",o:1,es:"El sentido y propósito del Bautismo Infantil",en:"The Meaning of Infant Baptism",dur:"30 min"},
    {id:"pb2",o:2,es:"El papel de los padres en el Bautismo",en:"Parents' Role in Baptism",dur:"30 min"},
    {id:"pb3",o:3,es:"Los signos y símbolos del Bautismo",en:"Signs and Symbols of Baptism",dur:"30 min"},
    {id:"pb_r",o:4,es:"Repaso Final — Formación Prebautismal",en:"Final Review — Pre-Baptismal",dur:"30 min",repaso:true},
  ],
  catequista:[
    {id:"cq1",o:1,es:"1.1 ¿Qué es la Neuropedagogía? Definición, neuromitos y neuroplasticidad",en:"1.1 What is Neuropedagogy? Definition, neuromyths and neuroplasticity",dur:"30 min"},
    {id:"cq2",o:2,es:"1.2 El encuentro entre Ciencia y Fe. Evitar el reduccionismo biológico",en:"1.2 The Encounter between Science and Faith. Avoiding biological reductionism",dur:"30 min"},
    {id:"cq3",o:3,es:"1.3 Anatomía básica para catequistas. El cerebro triuno simplificado",en:"1.3 Basic Anatomy for Catechists. The simplified triune brain",dur:"30 min"},
    {id:"cq_r",o:4,es:"Repaso Final — Módulo I",en:"Final Review — Module I",dur:"30 min",repaso:true},
  ],
};

// ─── PREGUNTAS TC1 (5 por tema, escala 10 pts, necesita ≥8) ──────
// Formato: {id, q, o:{a,b,c,d}, k:"letra_correcta"}
const Q={
  t1:[
    {id:1,q:"¿Qué afirma San Agustín sobre el corazón humano?",o:{a:"Es naturalmente bueno",b:"Está inquieto hasta descansar en Dios",c:"Es autosuficiente",d:"Busca solo el placer"},k:"b"},
    {id:2,q:"¿Por qué puede el hombre conocer a Dios por la razón?",o:{a:"Por revelación especial únicamente",b:"Es imposible sin la fe",c:"Porque las obras visibles revelan al Creador invisible",d:"Solo mediante la filosofía moderna"},k:"c"},
    {id:3,q:"¿Qué significa que Dios 'toma la iniciativa' con el hombre?",o:{a:"Que el hombre crea a Dios",b:"Que Dios nos busca antes de que lo busquemos",c:"Que la religión es obra humana",d:"Que Dios necesita al hombre"},k:"b"},
    {id:4,q:"Según el CIC n.27, el deseo de Dios en el hombre es...",o:{a:"Un invento de la Iglesia",b:"Opcional y personal",c:"Natural e inscrito en su corazón",d:"Solo emocional"},k:"c"},
    {id:5,q:"La 'vía cosmológica' para conocer a Dios argumenta que...",o:{a:"La Biblia prueba a Dios",b:"Todo efecto tiene una Causa Primera",c:"La ciencia confirma la fe",d:"El universo es eterno"},k:"b"},
  ],
  t2:[
    {id:1,q:"¿Cuáles son las dos fuentes de la Palabra de Dios?",o:{a:"La razón y la fe",b:"Los Evangelios y las cartas de Pablo",c:"La Sagrada Escritura y la Sagrada Tradición",d:"El Papa y los Concilios"},k:"c"},
    {id:2,q:"El Concilio Vaticano II sobre la Revelación se expresó en la Constitución...",o:{a:"Gaudium et Spes",b:"Lumen Gentium",c:"Dei Verbum",d:"Sacrosanctum Concilium"},k:"c"},
    {id:3,q:"La inspiración bíblica significa que...",o:{a:"Los autores inventaron los relatos",b:"Dios es el autor principal y los humanos sus instrumentos",c:"Todo es alegoría",d:"Solo el NT es inspirado"},k:"b"},
    {id:4,q:"¿Qué es el 'Depósito de la fe'?",o:{a:"Los objetos sagrados de la Iglesia",b:"Los fondos económicos del Vaticano",c:"Las verdades reveladas por Dios entregadas a la Iglesia",d:"Los documentos del Concilio Vaticano I"},k:"c"},
    {id:5,q:"El Magisterio tiene autoridad para...",o:{a:"Crear nuevos dogmas a su arbitrio",b:"Interpretar auténticamente la Palabra de Dios",c:"Cambiar la Sagrada Escritura",d:"Suprimir libros bíblicos"},k:"b"},
  ],
  t3:[
    {id:1,q:"La fe teológica es ante todo...",o:{a:"Un sentimiento religioso",b:"Un don gratuito de Dios",c:"Una conclusión filosófica",d:"Una obligación cultural"},k:"b"},
    {id:2,q:"¿Qué es el acto de fe?",o:{a:"Recitar el Credo",b:"Ir a Misa todos los domingos",c:"La libre adhesión personal a Dios y su Revelación",d:"Recibir los sacramentos"},k:"c"},
    {id:3,q:"La carta de Santiago enseña que la fe sin obras es...",o:{a:"Suficiente para salvarse",b:"La fe más pura",c:"Fe muerta",d:"El ideal cristiano"},k:"c"},
    {id:4,q:"¿Cuál es el objeto formal de la fe?",o:{a:"La Biblia",b:"La Iglesia",c:"Los milagros",d:"Dios mismo, verdad primera que no puede engañar"},k:"d"},
    {id:5,q:"La fe salva porque...",o:{a:"Nos hace mejores personas",b:"Une al hombre con Cristo y le da vida divina",c:"Nos da tranquilidad emocional",d:"Es una virtud moral"},k:"b"},
  ],
  t4:[
    {id:1,q:"¿Qué significa 'Creador ex nihilo'?",o:{a:"Dios usó materia preexistente",b:"La creación es un proceso evolutivo",c:"Dios creó todo de la nada",d:"El universo siempre existió"},k:"c"},
    {id:2,q:"La Providencia divina significa que Dios...",o:{a:"Abandona su creación al azar",b:"Conduce todas las cosas hacia su fin con sabiduría y amor",c:"Solo interviene en los milagros",d:"Permite el mal sin razón"},k:"b"},
    {id:3,q:"¿Cuántas Personas hay en la Santísima Trinidad?",o:{a:"Una",b:"Dos",c:"Tres",d:"Cuatro"},k:"c"},
    {id:4,q:"¿Por qué Dios es llamado 'Padre'?",o:{a:"Porque tiene género masculino",b:"Porque nos creó y nos sostiene con amor paternal",c:"Es solo una metáfora social",d:"Porque Jesús lo eligió arbitrariamente"},k:"b"},
    {id:5,q:"La creación es...",o:{a:"Una necesidad de Dios",b:"Un acto de amor gratuito de Dios",c:"Un error que necesita redención",d:"Obra de ángeles"},k:"b"},
  ],
  t5:[
    {id:1,q:"¿Qué enseña el dogma de la 'Unión Hipostática'?",o:{a:"Jesús tiene dos personas y dos naturalezas",b:"Jesús es solo Dios, no hombre",c:"Jesús es una sola Persona con dos naturalezas completas",d:"Jesús tiene una naturaleza mixta"},k:"c"},
    {id:2,q:"La Encarnación del Hijo de Dios fue...",o:{a:"Un espejismo",b:"Real: el Verbo tomó verdadera naturaleza humana",c:"Solo simbólica",d:"Temporal, sin cuerpo real"},k:"b"},
    {id:3,q:"¿Qué significa 'Emmanuel'?",o:{a:"Señor salva",b:"Rey de reyes",c:"Dios con nosotros",d:"Hijo del hombre"},k:"c"},
    {id:4,q:"¿En qué ciudad nació Jesús?",o:{a:"Nazaret",b:"Jerusalén",c:"Cafarnaúm",d:"Belén"},k:"d"},
    {id:5,q:"El concilio que definió las dos naturalezas de Cristo fue...",o:{a:"Nicea (325)",b:"Constantinopla (381)",c:"Éfeso (431)",d:"Calcedonia (451)"},k:"d"},
  ],
  t6:[
    {id:1,q:"¿Qué evento constituye el 'núcleo del Evangelio'?",o:{a:"El Sermón del Monte",b:"La multiplicación de panes",c:"La Pasión, Muerte y Resurrección de Jesús",d:"La Última Cena únicamente"},k:"c"},
    {id:2,q:"La Resurrección de Jesús fue...",o:{a:"Un mito para dar esperanza",b:"Solo espiritual, no corporal",c:"Un hecho histórico: su cuerpo glorificado resucitó",d:"Una visión de los apóstoles"},k:"c"},
    {id:3,q:"¿Qué significa la Ascensión de Jesús?",o:{a:"Que Jesús desapareció para siempre",b:"Que Jesús subió en cuerpo glorificado a la derecha del Padre",c:"Que su espíritu subió al cielo",d:"Que los apóstoles perdieron su guía"},k:"b"},
    {id:4,q:"Con su muerte, Jesús...",o:{a:"Demostró que era humano",b:"Fracasó en su misión",c:"Nos redimió del pecado y de la muerte",d:"Fue abandonado definitivamente por Dios"},k:"c"},
    {id:5,q:"'Misterio Pascual' se refiere a...",o:{a:"Solo a la Pascua judía",b:"La Pasión, Muerte, Resurrección y Ascensión de Cristo",c:"La última Cena únicamente",d:"La Navidad de Jesús"},k:"b"},
  ],
  t7:[
    {id:1,q:"¿A qué fiesta conmemora la venida del Espíritu Santo?",o:{a:"Navidad",b:"Pascua",c:"Pentecostés",d:"Epifanía"},k:"c"},
    {id:2,q:"¿Cuántos son los dones del Espíritu Santo?",o:{a:"Tres",b:"Cinco",c:"Siete",d:"Nueve"},k:"c"},
    {id:3,q:"El Espíritu Santo procede del Padre...",o:{a:"Solo",b:"Y del Hijo (Filioque)",c:"Y de los apóstoles",d:"Y de María"},k:"b"},
    {id:4,q:"¿Cuál es el símbolo bíblico más conocido del Espíritu Santo?",o:{a:"El cordero",b:"El pez",c:"La paloma",d:"El pan"},k:"c"},
    {id:5,q:"El Espíritu Santo actúa principalmente...",o:{a:"En los milagros visibles únicamente",b:"En los apóstoles solamente",c:"Animando a la Iglesia y santificando a los creyentes",d:"En el Antiguo Testamento"},k:"c"},
  ],
  t8:[
    {id:1,q:"¿Cuáles son las cuatro marcas de la Iglesia?",o:{a:"Romana, Apostólica, Latina y Misionera",b:"Una, Santa, Católica y Apostólica",c:"Bíblica, Sacramental, Jerárquica y Misionera",d:"Papal, Conciliar, Universal y Local"},k:"b"},
    {id:2,q:"¿Quién es la cabeza visible de la Iglesia en la tierra?",o:{a:"Los cardenales",b:"El concilio ecuménico",c:"El Papa",d:"Los obispos en conjunto"},k:"c"},
    {id:3,q:"El 'Cuerpo Místico de Cristo' se refiere a...",o:{a:"Las reliquias de Jesús",b:"La Iglesia, unida a Cristo como su cabeza",c:"La Eucaristía únicamente",d:"Los mártires de la Iglesia"},k:"b"},
    {id:4,q:"La 'comunión de los santos' incluye...",o:{a:"Solo a los canonizados",b:"A los fieles en la tierra, en el purgatorio y en el cielo",c:"Solo a los sacerdotes",d:"Solo a los que viven virtuosamente"},k:"b"},
    {id:5,q:"La sucesión apostólica garantiza...",o:{a:"Que los sacerdotes son perfectos",b:"La continuidad del ministerio de los apóstoles en la Iglesia",c:"Que el Papa siempre tiene razón",d:"Que los dogmas cambian con el tiempo"},k:"b"},
  ],
  t9:[
    {id:1,q:"¿Qué es la Inmaculada Concepción?",o:{a:"La concepción virginal de Jesús",b:"María fue concebida sin pecado original por gracia de Dios",c:"María es Dios",d:"María no tuvo hijos"},k:"b"},
    {id:2,q:"¿Qué proclama el dogma de la Asunción de María?",o:{a:"María fue al cielo en espíritu solamente",b:"María murió y sus restos están en Jerusalén",c:"Al fin de su vida, María fue asunta en cuerpo y alma al cielo",d:"María aún vive en la tierra"},k:"c"},
    {id:3,q:"En el Concilio de Éfeso (431), María fue proclamada...",o:{a:"Reina del Universo",b:"Theotokos (Madre de Dios)",c:"Mediadora de todas las gracias",d:"Corredentora"},k:"b"},
    {id:4,q:"¿Cuál es el papel de María en la salvación?",o:{a:"Igual al de Cristo",b:"Solo fue madre biológica de Jesús",c:"Colaboradora y Madre del Redentor y de la Iglesia",d:"No tiene papel específico"},k:"c"},
    {id:5,q:"La devoción mariana en la Iglesia Católica incluye...",o:{a:"Adoración igual a la de Dios",b:"Solo el rezo del Rosario",c:"Veneración (hiperdulía) y petición de intercesión",d:"Creer que María es divina"},k:"c"},
  ],
  t10:[
    {id:1,q:"Un sacramento es...",o:{a:"Un rito inventado por la Iglesia",b:"Un signo eficaz de la gracia instituido por Cristo",c:"Una ceremonia de tradición cultural",d:"Solo un símbolo sin efecto real"},k:"b"},
    {id:2,q:"¿Cuántos sacramentos hay en la Iglesia Católica?",o:{a:"Cinco",b:"Seis",c:"Siete",d:"Doce"},k:"c"},
    {id:3,q:"'Ex opere operato' significa que los sacramentos...",o:{a:"Dependen de la virtud del sacerdote",b:"Producen su efecto por el rito mismo, por la acción de Cristo",c:"Son solo simbólicos",d:"Solo funcionan con fe perfecta"},k:"b"},
    {id:4,q:"¿Qué es la liturgia?",o:{a:"Solo la Misa dominical",b:"La participación del Pueblo de Dios en la obra de Dios",c:"Los cantos religiosos",d:"El vestido del sacerdote"},k:"b"},
    {id:5,q:"Los sacramentos de iniciación son...",o:{a:"Bautismo, Eucaristía y Matrimonio",b:"Bautismo, Confirmación y Eucaristía",c:"Bautismo, Penitencia y Unción",d:"Solo el Bautismo"},k:"b"},
  ],
  t11:[
    {id:1,q:"¿Qué efecto principal tiene el Bautismo?",o:{a:"La ordenación sacerdotal",b:"El perdón del pecado original y la incorporación a la Iglesia",c:"La confirmación en la fe",d:"El acceso a la Eucaristía únicamente"},k:"b"},
    {id:2,q:"¿Cuál es la materia del Bautismo?",o:{a:"El aceite",b:"La sal",c:"El agua",d:"El pan"},k:"c"},
    {id:3,q:"El carácter bautismal es...",o:{a:"Temporal, dura un año",b:"Imborrable e irrepetible",c:"Solo espiritual, sin efecto real",d:"Se pierde con el pecado mortal"},k:"b"},
    {id:4,q:"¿Por qué el Bautismo es 'la puerta de la fe'?",o:{a:"Porque da acceso al templo",b:"Porque sin él no se puede recibir ningún otro sacramento",c:"Porque se recita el Credo",d:"Porque es el más antiguo"},k:"b"},
    {id:5,q:"¿Quién puede bautizar en caso de necesidad?",o:{a:"Solo el obispo",b:"Solo sacerdotes ordenados",c:"Cualquier persona con agua e intención debida",d:"Solo los diáconos"},k:"c"},
  ],
  t12:[
    {id:1,q:"La Confirmación perfecciona...",o:{a:"El Matrimonio",b:"La gracia bautismal y une más plenamente a la Iglesia",c:"La Eucaristía",d:"El Orden sacerdotal"},k:"b"},
    {id:2,q:"El signo externo de la Confirmación es...",o:{a:"El agua",b:"El pan y el vino",c:"La imposición de manos y la unción con el Santo Crisma",d:"La sal y el aceite de oliva"},k:"c"},
    {id:3,q:"¿Qué significa 'Confirmación'?",o:{a:"Confirmación de los votos bautismales únicamente",b:"El 'sello' del Espíritu Santo que fortalece y envía",c:"Aprobación de los estudios religiosos",d:"Ratificación del Bautismo recibido de infante"},k:"b"},
    {id:4,q:"La Confirmación deja...",o:{a:"Una mancha en el alma",b:"Un carácter espiritual imborrable",c:"Solo un recuerdo",d:"Una deuda con la Iglesia"},k:"b"},
    {id:5,q:"El ministro ordinario de la Confirmación es...",o:{a:"El sacerdote párroco",b:"El Papa",c:"El obispo",d:"El diácono"},k:"c"},
  ],
  t13:[
    {id:1,q:"La Eucaristía es 'fuente y culmen' de la vida cristiana porque...",o:{a:"Es la más antigua",b:"Contiene y da a Cristo mismo",c:"Es obligatoria los domingos",d:"Fue la última institución de Jesús"},k:"b"},
    {id:2,q:"La Transubstanciación enseña que...",o:{a:"El pan y el vino son símbolos de Cristo",b:"La sustancia del pan y el vino se convierten real y verdaderamente en el Cuerpo y Sangre de Cristo",c:"Cristo está presente solo espiritualmente",d:"Solo el sacerdote puede recibir el Cuerpo de Cristo"},k:"b"},
    {id:3,q:"¿Cuándo instituyó Jesús la Eucaristía?",o:{a:"En las bodas de Caná",b:"En la multiplicación de los panes",c:"En la Última Cena",d:"En la Ascensión"},k:"c"},
    {id:4,q:"Para recibir la Comunión se requiere...",o:{a:"Ser sacerdote",b:"Estar en gracia de Dios y en ayuno eucarístico",c:"Solo ser bautizado",d:"Saber leer la Biblia"},k:"b"},
    {id:5,q:"El sacrificio de la Misa es...",o:{a:"Una repetición del Calvario",b:"Una representación teatral",c:"La actualización del único sacrificio de Cristo",d:"Un sacrificio nuevo cada domingo"},k:"c"},
  ],
  t14:[
    {id:1,q:"¿Para qué es necesaria la Confesión antes de la Eucaristía?",o:{a:"Es solo una tradición opcional",b:"Para estar en estado de gracia y evitar la comunión indigna",c:"Solo si se tiene pecado mortal público",d:"El sacerdote lo decide caso por caso"},k:"b"},
    {id:2,q:"¿Quiénes pueden recibir la Unción de los Enfermos?",o:{a:"Solo los que van a morir en horas",b:"Solo los que tienen más de 70 años",c:"Los fieles en peligro de muerte por enfermedad o vejez",d:"Cualquier cristiano que lo pida"},k:"c"},
    {id:3,q:"Los efectos de la Reconciliación incluyen...",o:{a:"Solo el perdón externo",b:"El perdón de los pecados, reconciliación con Dios y la Iglesia",c:"Solo la tranquilidad psicológica",d:"La eliminación de las consecuencias civiles del pecado"},k:"b"},
    {id:4,q:"La Unción de los Enfermos fue instituida por...",o:{a:"San Pablo",b:"La Iglesia primitiva",c:"Jesucristo, referida en Santiago 5,14",d:"El Concilio de Trento"},k:"c"},
    {id:5,q:"El signo externo de la Unción es...",o:{a:"Agua bendita",b:"Imposición de manos y unción con Óleo de enfermos",c:"Incienso",d:"Pan sin levadura"},k:"b"},
  ],
  t15:[
    {id:1,q:"¿En qué se basa la dignidad de la persona humana?",o:{a:"En sus logros personales",b:"En haber sido creada a imagen y semejanza de Dios",c:"En su inteligencia",d:"En su posición social"},k:"b"},
    {id:2,q:"La libertad humana en la perspectiva cristiana es...",o:{a:"Hacer lo que quiero sin restricciones",b:"Un don para el bien, orientada hacia Dios",c:"Solo una ilusión",d:"Condicionada solo por las leyes civiles"},k:"b"},
    {id:3,q:"¿Qué es la ley moral natural?",o:{a:"Las leyes del Estado",b:"Una regla inventada por la Iglesia",c:"La participación de la criatura racional en la ley eterna de Dios",d:"Los instintos humanos básicos"},k:"c"},
    {id:4,q:"La conciencia moral es...",o:{a:"La voz de la sociedad",b:"La opinión personal sin restricciones",c:"El juicio de la razón que reconoce la bondad moral de un acto",d:"El sentimiento de culpa únicamente"},k:"c"},
    {id:5,q:"'Imago Dei' significa que el hombre...",o:{a:"Es un dios menor",b:"Fue creado a imagen y semejanza de Dios",c:"Puede conocer todo como Dios",d:"Tiene naturaleza divina"},k:"b"},
  ],
  t16:[
    {id:1,q:"¿Cuáles son las tres condiciones del pecado mortal?",o:{a:"Intención, acción y resultado",b:"Materia grave, pleno conocimiento y deliberado consentimiento",c:"Frecuencia, gravedad e impacto social",d:"Voluntad, emoción y circunstancias"},k:"b"},
    {id:2,q:"¿Qué es la gracia santificante?",o:{a:"Un premio por buenas obras",b:"La participación en la vida divina que hace al hombre hijo de Dios",c:"La iluminación intelectual",d:"Un sentimiento de paz interior"},k:"b"},
    {id:3,q:"¿Qué es la justificación?",o:{a:"Demostrar que no se pecó",b:"El proceso por el que Dios por su gracia hace justo al hombre",c:"El juicio final",d:"La declaración de inocencia en el juicio"},k:"b"},
    {id:4,q:"El pecado venial...",o:{a:"No daña la relación con Dios",b:"Rompe totalmente la comunión con Dios",c:"Debilita la caridad y el amor a Dios sin destruirlos",d:"Tiene consecuencias solo en esta vida"},k:"c"},
    {id:5,q:"¿Qué es la gracia actual?",o:{a:"La gracia que se recibe en la Misa",b:"Una ayuda transitoria de Dios para obrar el bien",c:"El estado permanente de santidad",d:"La gracia recibida en el Bautismo"},k:"b"},
  ],
  t17:[
    {id:1,q:"¿Cuáles son los tres primeros mandamientos?",o:{a:"Amar a Dios, al prójimo y a la naturaleza",b:"Amor a Dios: No tener dioses ajenos, no usar el nombre en vano, santificar el día del Señor",c:"No matar, no robar, no mentir",d:"Fe, Esperanza y Caridad"},k:"b"},
    {id:2,q:"El cuarto mandamiento ordena...",o:{a:"No codiciar los bienes ajenos",b:"No cometer adulterio",c:"Honrar al padre y a la madre",d:"No jurar en falso"},k:"c"},
    {id:3,q:"¿Qué prohíbe el quinto mandamiento?",o:{a:"El matrimonio fuera de la Iglesia",b:"Cualquier daño a la vida humana",c:"El consumo de alcohol",d:"El divorcio"},k:"b"},
    {id:4,q:"El octavo mandamiento prohíbe...",o:{a:"El robo de bienes materiales",b:"La fornicación",c:"El falso testimonio y la mentira",d:"La idolatría"},k:"c"},
    {id:5,q:"Jesús resumió el Decálogo en...",o:{a:"Las Bienaventuranzas",b:"El mandamiento del amor a Dios y al prójimo",c:"El Padrenuestro",d:"Las obras de misericordia"},k:"b"},
  ],
  t18:[
    {id:1,q:"¿Cuántas Bienaventuranzas proclamó Jesús en el Sermón del Monte?",o:{a:"Cinco",b:"Siete",c:"Ocho",d:"Diez"},k:"c"},
    {id:2,q:"El 'mandamiento nuevo' de Jesús es...",o:{a:"Observar los diez mandamientos",b:"Amarnos los unos a los otros como Él nos amó",c:"Hacer el bien y evitar el mal",d:"Respetar a los sacerdotes"},k:"b"},
    {id:3,q:"La primera Bienaventuranza dice...",o:{a:"Bienaventurados los que lloran",b:"Bienaventurados los misericordiosos",c:"Bienaventurados los pobres de espíritu, porque de ellos es el Reino",d:"Bienaventurados los mansos"},k:"c"},
    {id:4,q:"¿Cuál es la diferencia entre la ley de Moisés y la Ley Evangélica?",o:{a:"La Ley de Moisés es más exigente",b:"La Ley Evangélica pide más: actitudes del corazón y amor sin límites",c:"Son prácticamente iguales",d:"La Ley Evangélica anuló completamente la de Moisés"},k:"b"},
    {id:5,q:"Las Bienaventuranzas enseñan el camino a...",o:{a:"El éxito mundano",b:"La prosperidad económica",c:"La verdadera felicidad y la vida eterna",d:"El reconocimiento social"},k:"c"},
  ],
  t19:[
    {id:1,q:"¿Cómo define el Catecismo la oración?",o:{a:"Una actividad religiosa opcional",b:"La elevación del alma a Dios o la petición de bienes convenientes",c:"Solo la recitación del Rosario",d:"Un ritual litúrgico obligatorio"},k:"b"},
    {id:2,q:"¿Cuáles son los seis tipos de oración según el CIC?",o:{a:"Matutina, vespertina, del mediodía, nocturna, de ayuno y de acción",b:"Bendición, adoración, petición, intercesión, acción de gracias y alabanza",c:"Personal, comunitaria, litúrgica, espontánea, formal y contemplativa",d:"Vocal, mental, afectiva, de súplica, de agradecimiento y de amor"},k:"b"},
    {id:3,q:"La oración de 'petición' se diferencia de la 'intercesión' en que...",o:{a:"No hay diferencia real",b:"La petición es para uno mismo; la intercesión es pedir por otros",c:"La intercesión es solo para los sacerdotes",d:"La petición es solo para necesidades materiales"},k:"b"},
    {id:4,q:"¿Qué es la 'oración de alabanza'?",o:{a:"Pedir cosas a Dios",b:"Agradecer los bienes recibidos",c:"Reconocer a Dios por quien Él es, sin pedir nada",d:"Confesar los pecados"},k:"c"},
    {id:5,q:"¿Por qué Jesús se retiraba a orar?",o:{a:"Para descansar de la multitud",b:"Para dar ejemplo y mantener su comunión con el Padre",c:"Era una obligación cultural de su tiempo",d:"Para memorizar la Escritura"},k:"b"},
  ],
  t20:[
    {id:1,q:"¿Qué es la Lectio Divina?",o:{a:"Leer la Biblia rápidamente",b:"Lectura orante de la Escritura: leer, meditar, orar y contemplar",c:"Un curso bíblico académico",d:"Solo para religiosos y sacerdotes"},k:"b"},
    {id:2,q:"La oración vocal se caracteriza por...",o:{a:"No necesitar palabras",b:"Usar palabras (habladas o pensadas) para dirigirse a Dios",c:"Ser únicamente la oración litúrgica",d:"Solo rezar fórmulas aprendidas"},k:"b"},
    {id:3,q:"La meditación cristiana busca...",o:{a:"El vaciamiento de la mente",b:"Estados alterados de conciencia",c:"Aplicar la inteligencia, imaginación y afecto a la Palabra de Dios",d:"La relajación física únicamente"},k:"c"},
    {id:4,q:"La contemplación es...",o:{a:"Una forma de filosofía",b:"Un reposo orante en Dios, fruto de la meditación sostenida",c:"Solo para místicos",d:"La oración litúrgica pública"},k:"b"},
    {id:5,q:"La Liturgia de las Horas (Breviario) es...",o:{a:"Solo para religiosos",b:"La oración oficial de la Iglesia que santifica las horas del día",c:"Un libro opcional de devociones",d:"Un sustituto de la Misa"},k:"b"},
  ],
  t21:[
    {id:1,q:"Tertuliano llamó al Padrenuestro...",o:{a:"La oración de los mártires",b:"El resumen de todo el Evangelio",c:"La oración más larga de la Biblia",d:"La primera oración cristiana"},k:"b"},
    {id:2,q:"¿Cuántas peticiones tiene el Padrenuestro?",o:{a:"Cinco",b:"Seis",c:"Siete",d:"Nueve"},k:"c"},
    {id:3,q:"'Hágase tu voluntad en la tierra como en el cielo' expresa...",o:{a:"Una resignación pasiva",b:"La adhesión activa al proyecto amoroso de Dios",c:"La aceptación del sufrimiento",d:"El deseo de ir al cielo"},k:"b"},
    {id:4,q:"'Perdónanos nuestras ofensas como también nosotros perdonamos' enseña que...",o:{a:"El perdón de Dios es condicional a nuestro perdón",b:"El perdón de Dios está vinculado a nuestra disposición de perdonar",c:"Dios perdona sin importar nuestras acciones",d:"Solo los sacerdotes pueden perdonar"},k:"b"},
    {id:5,q:"¿Por qué el Padrenuestro dice 'Padre nuestro' y no 'Padre mío'?",o:{a:"Es una fórmula heredada del judaísmo",b:"Porque la oración cristiana es siempre comunitaria y eclesial",c:"Para incluir a los no creyentes",d:"Es solo una traducción convencional"},k:"b"},
  ],
  t_rep:[
    {id:1,q:"¿Cuáles son los tres pilares de la fe cristiana según el CIC?",o:{a:"Fe, esperanza y caridad",b:"La oración, los sacramentos y la moral",c:"El Credo, los sacramentos, la oración y la moral",d:"La Biblia, la Tradición y el Magisterio"},k:"c"},
    {id:2,q:"La Trinidad es...",o:{a:"Tres dioses diferentes",b:"Un solo Dios en tres Personas distintas",c:"Una sola persona con tres funciones",d:"Dios, María y los ángeles"},k:"b"},
    {id:3,q:"¿Cuál es el sacramento que completa la iniciación cristiana?",o:{a:"El Matrimonio",b:"La Penitencia",c:"La Eucaristía",d:"La Confirmación"},k:"c"},
    {id:4,q:"La moral cristiana se fundamenta en...",o:{a:"Las leyes civiles",b:"La dignidad humana, el amor a Dios y al prójimo",c:"Las tradiciones culturales",d:"La opinión de la mayoría"},k:"b"},
    {id:5,q:"La oración del Padrenuestro fue enseñada por...",o:{a:"San Pablo",b:"Los apóstoles",c:"El mismo Jesucristo",d:"La Iglesia primitiva"},k:"c"},
  ],
  // TC2 - Confesión
  cf1:[
    {id:1,q:"¿Cuál es el nombre completo de este sacramento?",o:{a:"Sacramento de Perdón",b:"Sacramento de la Penitencia y la Reconciliación",c:"Sacramento del Arrepentimiento",d:"Sacramento de la Absolución"},k:"b"},
    {id:2,q:"¿Quién instituyó el sacramento de la Confesión?",o:{a:"Los apóstoles en Pentecostés",b:"La Iglesia primitiva",c:"El mismo Jesucristo resucitado",d:"El Concilio de Trento"},k:"c"},
    {id:3,q:"¿Cuándo instituyó Jesús el sacramento de la Confesión?",o:{a:"En la Última Cena",b:"Al resucitar, al soplar sobre los apóstoles (Jn 20,22-23)",c:"En el Sermón del Monte",d:"En la Transfiguración"},k:"b"},
    {id:4,q:"El ministro del sacramento de la Reconciliación es...",o:{a:"Cualquier creyente con fe",b:"El sacerdote con facultad de absolver",c:"El diácono",d:"El obispo únicamente"},k:"b"},
    {id:5,q:"El secreto de la Confesión (sigilo sacramental) es...",o:{a:"Solo una tradición recomendable",b:"Absoluto e inviolable bajo cualquier circunstancia",c:"Válido solo para pecados graves",d:"Puede romperse ante la justicia civil"},k:"b"},
  ],
  cf2:[
    {id:1,q:"¿Cuáles son los tres actos del penitente?",o:{a:"Rezar, ayunar y dar limosna",b:"Confesar, comulgar y rezar",c:"Contrición, confesión oral y satisfacción (penitencia)",d:"Arrepentimiento, propósito y promesa"},k:"c"},
    {id:2,q:"¿Qué es la contrición perfecta?",o:{a:"Arrepentirse por miedo al infierno",b:"Arrepentirse por amor a Dios, por quien es Él",c:"El dolor más intenso posible",d:"Llorar por los pecados cometidos"},k:"b"},
    {id:3,q:"La 'integridad de la confesión' requiere...",o:{a:"Confesar solo los pecados mortales",b:"Confesar todos los pecados mortales en especie y número",c:"Confesar los pecados según la gravedad",d:"Confesar lo que el sacerdote pregunte"},k:"b"},
    {id:4,q:"La 'satisfacción' o penitencia busca...",o:{a:"Pagar a Dios por los pecados",b:"Reparar el daño causado y fortalecer la conversión",c:"Demostrar que uno es sincero",d:"Sustituir el purgatorio"},k:"b"},
    {id:5,q:"¿Qué es el 'propósito de enmienda'?",o:{a:"Promesa de no pecar nunca más",b:"Decisión firme de evitar el pecado y sus ocasiones",c:"Un período de prueba",d:"Solo aplica para pecados habituales"},k:"b"},
  ],
  cf3:[
    {id:1,q:"¿Cuál es el efecto principal de la Confesión?",o:{a:"La tranquilidad psicológica",b:"El perdón de los pecados y la restauración de la amistad con Dios",c:"La eliminación del purgatorio",d:"La gracia sacramental permanente"},k:"b"},
    {id:2,q:"La Confesión también perdona...",o:{a:"Solo los pecados mortales",b:"Solo los pecados veniales",c:"Todos los pecados confesados con contrición",d:"Solo los pecados que uno recuerda"},k:"c"},
    {id:3,q:"¿Qué significa que la Confesión reconcilia con la Iglesia?",o:{a:"Que el sacerdote acepta al penitente de nuevo",b:"Que restaura la comunión plena rota por el pecado grave",c:"Que se vuelve a registrar en la parroquia",d:"Que se obtiene el perdón de los otros fieles"},k:"b"},
    {id:4,q:"Los efectos espirituales de la Confesión incluyen...",o:{a:"Solo el perdón externo",b:"Paz espiritual, fuerza para combatir el pecado y aumento de la gracia",c:"Solo la reconciliación social",d:"La garantía de no pecar más"},k:"b"},
    {id:5,q:"¿Con qué frecuencia recomienda la Iglesia confesarse?",o:{a:"Una vez al año es suficiente",b:"Solo ante pecado mortal",c:"Al menos una vez al año, con frecuencia regular recomendada",d:"Cada semana obligatoriamente"},k:"c"},
  ],
  cf4:[
    {id:1,q:"Para hacer una buena Confesión, el primer paso es...",o:{a:"Elegir bien al sacerdote confesor",b:"Hacer un examen de conciencia",c:"Aprender las fórmulas de memoria",d:"Tener lista la penitencia"},k:"b"},
    {id:2,q:"El 'examen de conciencia' consiste en...",o:{a:"Recordar los pecados del año",b:"Reflexionar sobre los actos propios a la luz de la ley de Dios",c:"Leer un libro de pecados",d:"Preguntar a otro lo que debo confesar"},k:"b"},
    {id:3,q:"¿Cuándo es válida la absolución general sin confesión individual?",o:{a:"Siempre que haya muchos penitentes",b:"Solo en situaciones de peligro de muerte inminente de muchos",c:"En Navidad y Pascua",d:"Nunca, siempre es inválida"},k:"b"},
    {id:4,q:"Después de confesar, ¿qué debe hacer el penitente?",o:{a:"Ir a la Comunión inmediatamente",b:"Cumplir la penitencia impuesta lo antes posible",c:"Confesar de nuevo para estar más seguro",d:"Contárselo a un familiar"},k:"b"},
    {id:5,q:"Si uno olvida confesar un pecado mortal...",o:{a:"La Confesión es inválida",b:"El pecado olvidado queda perdonado indirectamente; debe confesarlo luego",c:"Debe volver a confesar todo desde el principio",d:"Queda condenado por ese pecado"},k:"b"},
  ],
  cf_r:[
    {id:1,q:"¿Por qué la Confesión frecuente es recomendable incluso sin pecado mortal?",o:{a:"Es solo una tradición sin valor real",b:"Aumenta la gracia, fortalece la virtud y da paz espiritual",c:"Es obligatoria para todos los católicos",d:"Porque el sacerdote lo necesita"},k:"b"},
    {id:2,q:"¿Qué diferencia hay entre contrición perfecta e imperfecta (atrición)?",o:{a:"No hay diferencia teológica",b:"La perfecta nace del amor a Dios; la imperfecta, del miedo a los castigos",c:"La imperfecta es inválida",d:"La perfecta no necesita Confesión"},k:"b"},
    {id:3,q:"Los frutos de la Confesión frecuente incluyen...",o:{a:"Solo el perdón de pecados",b:"Conocimiento propio, conversión continua y formación de la conciencia",c:"La garantía de ir al cielo",d:"Solo beneficios psicológicos"},k:"b"},
    {id:4,q:"¿Qué es un 'confesor espiritual'?",o:{a:"Cualquier sacerdote disponible",b:"Un sacerdote que guía habitualmente la vida espiritual del penitente",c:"El sacerdote del barrio",d:"El obispo de la diócesis"},k:"b"},
    {id:5,q:"El sacramento de la Reconciliación es un acto de...",o:{a:"Justicia retributiva",b:"Misericordia divina que restaura la relación con Dios",c:"Obligación legal eclesiástica",d:"Pura psicología religiosa"},k:"b"},
  ],
  un1:[
    {id:1,q:"¿Qué es el Sacramento de la Unción de los Enfermos?",o:{a:"Solo la Extremaunción para los moribundos",b:"Un sacramento para fortalecer a los fieles en peligro de muerte por enfermedad o vejez",c:"Una bendición especial del sacerdote",d:"Un rito de despedida"},k:"b"},
    {id:2,q:"¿En qué texto bíblico se funda la Unción de los Enfermos?",o:{a:"Lucas 10",b:"Romanos 8",c:"Santiago 5,14-15",d:"Juan 11"},k:"c"},
    {id:3,q:"¿Quién puede recibir la Unción de los Enfermos?",o:{a:"Solo los que están muriendo",b:"Cualquier fiel enfermo en peligro grave o vejez",c:"Solo los mayores de 80 años",d:"Solo en hospitales"},k:"b"},
    {id:4,q:"¿Quién es el ministro de la Unción de los Enfermos?",o:{a:"Cualquier creyente",b:"El diácono",c:"El sacerdote o el obispo",d:"El enfermero cristiano"},k:"c"},
    {id:5,q:"La materia de la Unción de los Enfermos es...",o:{a:"Agua bendita",b:"Óleo de enfermos bendecido por el obispo",c:"El Santo Crisma",d:"Aceite de oliva sin bendecir"},k:"b"},
  ],
  un2:[
    {id:1,q:"¿Cuáles son los efectos de la Unción de los Enfermos?",o:{a:"Solo la curación física si Dios lo quiere",b:"Fortaleza espiritual, perdón de pecados, salud corporal (si conveniente) y preparación para el paso a la vida eterna",c:"La remisión de todas las penas del purgatorio",d:"Solo la paz psicológica del enfermo"},k:"b"},
    {id:2,q:"¿Se puede recibir la Unción más de una vez?",o:{a:"Solo una vez en la vida",b:"Sí, en enfermedades o peligros distintos",c:"Solo si el enfermo se recuperó y se enferma de nuevo",d:"Nunca, es como el Bautismo"},k:"b"},
    {id:3,q:"La Unción de los Enfermos une al enfermo con...",o:{a:"Los santos del cielo",b:"La Pasión de Cristo de manera especial",c:"Los demás enfermos del mundo",d:"El sacerdote que lo unge"},k:"b"},
    {id:4,q:"¿Qué es el 'Viático'?",o:{a:"Un libro de oraciones para enfermos",b:"La Eucaristía recibida en peligro de muerte como provisión para el camino",c:"La última absolución antes de morir",d:"La Unción de los Enfermos"},k:"b"},
    {id:5,q:"¿Cuándo es apropiado llamar al sacerdote para la Unción?",o:{a:"Solo cuando el médico confirme que el paciente va a morir",b:"Al inicio de una enfermedad grave, sin esperar a que empeore",c:"Solo si el enfermo lo pide explícitamente",d:"Cuando el enfermo ya no puede hablar"},k:"b"},
  ],
  un3:[
    {id:1,q:"La celebración de la Unción puede incluir...",o:{a:"Solo la unción del enfermo",b:"La escucha de la Palabra de Dios, la Confesión, la unción, y si es posible la Eucaristía",c:"Un rosario y la unción",d:"Solo oraciones del sacerdote"},k:"b"},
    {id:2,q:"¿En qué partes del cuerpo se hace la unción?",o:{a:"Solo la frente",b:"La frente y las manos del enfermo",c:"Todo el cuerpo",d:"Solo el pecho"},k:"b"},
    {id:3,q:"La fórmula de la Unción dice: 'Por esta santa unción...'",o:{a:"el Señor te libre del pecado original",b:"el Señor, en su amor y misericordia, te ayude con la gracia del Espíritu Santo",c:"Dios te concede la vida eterna",d:"queden borrados tus pecados confesados"},k:"b"},
    {id:4,q:"¿Es necesaria la Confesión antes de la Unción?",o:{a:"Siempre, sin excepción",b:"Sí, si el enfermo puede confesarse; si no puede, la Unción suple",c:"No, no existe ninguna relación entre ambos",d:"Solo si hay pecados mortales conocidos"},k:"b"},
    {id:5,q:"La Unción de los Enfermos contribuye a...",o:{a:"Curar siempre físicamente al enfermo",b:"La salvación integral del enfermo: cuerpo y alma",c:"Acelerar la muerte natural",d:"Solo calmar la angustia"},k:"b"},
  ],
  un_r:[
    {id:1,q:"Los sacramentos de la iniciación son: Bautismo, Confirmación y...",o:{a:"Matrimonio",b:"Orden Sagrado",c:"Eucaristía",d:"Penitencia"},k:"c"},
    {id:2,q:"Los sacramentos de sanación son...",o:{a:"Bautismo y Confirmación",b:"Penitencia y Unción de los Enfermos",c:"Eucaristía y Matrimonio",d:"Orden y Confirmación"},k:"b"},
    {id:3,q:"El sacramento que completa la formación sacramental de iniciación es...",o:{a:"El Matrimonio",b:"El Orden Sagrado",c:"La Eucaristía",d:"La Confirmación"},k:"c"},
    {id:4,q:"La Iglesia recomienda recibir la Unción de los Enfermos...",o:{a:"Solo en agonía",b:"Al inicio de una enfermedad grave o vejez",c:"Una sola vez en la vida",d:"Solo si no hay sacerdote disponible"},k:"b"},
    {id:5,q:"¿Cuál es la base del amor cristiano al enfermo?",o:{a:"La compasión natural",b:"La identificación de Cristo con el que sufre: 'Estuve enfermo y me visitaron'",c:"La solidaridad social",d:"El temor a la muerte"},k:"b"},
  ],
};
// Para videos de sacramentos específicos reutilizamos preguntas de TC1 en el demo
// (en producción se cargan de Supabase)
["bv1","bv2","bv3","bv_r","pv1","pv2","pv3","pv4","pv_r","cv1","cv2","cv3","cv4","cv5","cv_r",
 "pb1","pb2","pb3","pb_r","cq1","cq2","cq3","cq4","cq_r"].forEach((id,i)=>{
  const src=Object.keys(Q)[i%10];
  Q[id]=Q[src];
});

const videoPruebaUrls=(section)=>({
  es:`/videos-prueba/es/${section}.mp4`, en:`/videos-prueba/en/${section}.mp4`,
  fr:`/videos-prueba/fr/${section}.mp4`, de:`/videos-prueba/de/${section}.mp4`,
  pt:`/videos-prueba/pt/${section}.mp4`, it:`/videos-prueba/it/${section}.mp4`,
});

const SEC_META={
  kerigma:   {es:"Kerigma",                       en:"Kerygma",                    icon:"__flame__", cert:false, videos:KERIGMA, videoPrueba:videoPruebaUrls("tc1")},
  tc1:       {es:"Tronco Común 1",               en:"Common Core 1",              icon:"✝️",  cert:false, videos:TC1_ALL, videoPrueba:videoPruebaUrls("tc1")},
  bautismo:  {es:"Bautismo",                      en:"Baptism",                    icon:"__bautismo_img__",cert:true,videos:COURSES.bautismo, videoPrueba:videoPruebaUrls("bautismo")},
  confirmacion:{es:"Confirmación",                en:"Confirmation",               icon:"__confirmacion_img__",cert:true,videos:COURSES.confirmacion, videoPrueba:videoPruebaUrls("confirmacion")},
  primera_comunion:{es:"Primera Comunión",        en:"First Communion",            icon:"__caliz__",cert:true,videos:COURSES.primera_comunion, videoPrueba:videoPruebaUrls("primera_comunion")},
  prebautismal:{es:"Formación Pre-Sacramental",     en:"Pre-Sacramental Formation",    icon:"👨‍👩‍👧",cert:true,  videos:COURSES.prebautismal, videoPrueba:videoPruebaUrls("prebautismal")},
  catequista:{es:"Neuropedagogía Catequética — Módulo I: Fundamentos y Conceptos", en:"Catechetical Neuropedagogy — Module I: Foundations and Concepts", icon:"🧠", cert:true, videos:COURSES.catequista, videoPrueba:videoPruebaUrls("catequista")},
  tc2_confesion:{es:"La Confesión (TC2)",         en:"Confession (TC2)",           icon:"🙏",  cert:true,  videos:TC2_CONFESION, videoPrueba:videoPruebaUrls("tc2_confesion")},
  tc2_uncion:{es:"Unción de los Enfermos (TC2)", en:"Anointing of the Sick (TC2)",icon:"✨",  cert:true,  videos:TC2_UNCION, videoPrueba:videoPruebaUrls("tc2_uncion")},
};

// ⚠️ MODO DE PRUEBA — fase de pruebas: el usuario ve 1 solo video, acredita 1
// sola evaluación y obtiene su constancia. La secuencia se reduce a una sección.
// Poner en false para PRODUCCIÓN (restaura el curso completo).
const TEST_MODE = false;
if (TEST_MODE) {
  Object.keys(SEC_META).forEach(k => {
    const m = SEC_META[k];
    if (m.videos && m.videos.length > 1) m.videos = [m.videos[0]]; // solo el 1er video
    m.cert = true; // asegurar constancia en modo prueba
  });
}

function isSectionDone(secId, prog){
  const vids=SEC_META[secId]?.videos||[];
  return vids.length>0 && vids.every(v=>prog?.[secId]?.[v.id]?.passed);
}

function videoState(secId, vid, prog, vids){
  const p=prog?.[secId]?.[vid.id];
  if(p?.passed) return "passed";
  if(p?.visto) return "watched";
  const idx=vids.findIndex(v=>v.id===vid.id);
  if(idx===0) return "available";
  return prog?.[secId]?.[vids[idx-1].id]?.passed ? "available" : "locked";
}

export { TC1_MODULES, TC1_ALL, TC2_CONFESION, TC2_UNCION, KERIGMA, COURSES, Q,
         videoPruebaUrls, SEC_META, TEST_MODE, isSectionDone, videoState };
