// src/data/course.js
// Contenido del curso (secciones, videos, preguntas) + metadatos y helpers PUROS.
// Extraído de App.jsx en la modularización. Sin JSX ni dependencias del ámbito de App.
// SecIcon (que usa JSX/iconos) vive en ../components/SecIcon.jsx.

const TC1_MODULES=[
  {id:"TC1-01",num:"I",es:"EL DESEO DE DIOS Y LA CREACIÓN",en:"EL DESEO DE DIOS Y LA CREACIÓN",videos:[
    {id:"tc1_01a",o:1,es:"En voz de San Agustín",en:"En voz de San Agustín",dur:"2 min",mod:"TC1-01",modEs:"EL DESEO DE DIOS Y LA CREACIÓN",blk:"A",evalua:false},
    {id:"tc1_01b",o:2,es:"Dios es un Padre · El mundo fue creado por amor",en:"Dios es un Padre · El mundo fue creado por amor",dur:"5 min",mod:"TC1-01",modEs:"EL DESEO DE DIOS Y LA CREACIÓN",blk:"B",evalua:false},
    {id:"tc1_01c",o:3,es:"El aliento de vida",en:"El aliento de vida",dur:"3 min",mod:"TC1-01",modEs:"EL DESEO DE DIOS Y LA CREACIÓN",blk:"C",evalua:false},
    {id:"tc1_01d",o:4,es:"El reto de asombro · Tres minutos diarios · Sin teléfono",en:"El reto de asombro · Tres minutos diarios · Sin teléfono",dur:"2 min",mod:"TC1-01",modEs:"EL DESEO DE DIOS Y LA CREACIÓN",blk:"D",evalua:true},
  ]},
  {id:"TC1-02",num:"II",es:"EL MISTERIO DEL MAL Y LA LIBERTAD",en:"EL MISTERIO DEL MAL Y LA LIBERTAD",videos:[
    {id:"tc1_02a",o:5,es:"En voz de Santo Tomás de Aquino",en:"En voz de Santo Tomás de Aquino",dur:"2 min",mod:"TC1-02",modEs:"EL MISTERIO DEL MAL Y LA LIBERTAD",blk:"A",evalua:false},
    {id:"tc1_02b",o:6,es:"Qué es el mal · De dónde viene · Lo que no se explica",en:"Qué es el mal · De dónde viene · Lo que no se explica",dur:"5 min",mod:"TC1-02",modEs:"EL MISTERIO DEL MAL Y LA LIBERTAD",blk:"B",evalua:false},
    {id:"tc1_02c",o:7,es:"Las espinas · El sudor",en:"Las espinas · El sudor",dur:"3 min",mod:"TC1-02",modEs:"EL MISTERIO DEL MAL Y LA LIBERTAD",blk:"C",evalua:false},
    {id:"tc1_02d",o:8,es:"La oración de abandono · De «por qué» a «para qué» · Tres advertencias",en:"La oración de abandono · De «por qué» a «para qué» · Tres advertencias",dur:"3 min",mod:"TC1-02",modEs:"EL MISTERIO DEL MAL Y LA LIBERTAD",blk:"D",evalua:true},
  ]},
  {id:"TC1-03",num:"III",es:"LA HISTORIA DE LA SALVACIÓN",en:"LA HISTORIA DE LA SALVACIÓN",videos:[
    {id:"tc1_03a",o:9,es:"En voz de Abraham",en:"En voz de Abraham",dur:"2 min",mod:"TC1-03",modEs:"LA HISTORIA DE LA SALVACIÓN",blk:"A",evalua:false},
    {id:"tc1_03b",o:10,es:"De Adán a Cristo · Las seis Alianzas",en:"De Adán a Cristo · Las seis Alianzas",dur:"5 min",mod:"TC1-03",modEs:"LA HISTORIA DE LA SALVACIÓN",blk:"B",evalua:false},
    {id:"tc1_03c",o:11,es:"El mapa y la línea de tiempo",en:"El mapa y la línea de tiempo",dur:"3 min",mod:"TC1-03",modEs:"LA HISTORIA DE LA SALVACIÓN",blk:"C",evalua:false},
    {id:"tc1_03d",o:12,es:"Conexión personal · El penúltimo capítulo · Tres preguntas",en:"Conexión personal · El penúltimo capítulo · Tres preguntas",dur:"3 min",mod:"TC1-03",modEs:"LA HISTORIA DE LA SALVACIÓN",blk:"D",evalua:true},
  ]},
  {id:"TC1-04",num:"IV",es:"LA SAGRADA ESCRITURA — NUESTRA CARTA DE AMOR",en:"LA SAGRADA ESCRITURA — NUESTRA CARTA DE AMOR",videos:[
    {id:"tc1_04a",o:13,es:"En voz de Santa Teresita",en:"En voz de Santa Teresita",dur:"2 min",mod:"TC1-04",modEs:"LA SAGRADA ESCRITURA — NUESTRA CARTA DE AMOR",blk:"A",evalua:false},
    {id:"tc1_04b",o:14,es:"Dos autores · Un solo retrato · Una carta que espera respuesta",en:"Dos autores · Un solo retrato · Una carta que espera respuesta",dur:"4 min",mod:"TC1-04",modEs:"LA SAGRADA ESCRITURA — NUESTRA CARTA DE AMOR",blk:"B",evalua:false},
    {id:"tc1_04c",o:15,es:"El lugar de la Biblia en tu casa",en:"El lugar de la Biblia en tu casa",dur:"3 min",mod:"TC1-04",modEs:"LA SAGRADA ESCRITURA — NUESTRA CARTA DE AMOR",blk:"C",evalua:false},
    {id:"tc1_04d",o:16,es:"El diálogo del corazón · Cuatro pasos · Las cartas tienen tu nombre",en:"El diálogo del corazón · Cuatro pasos · Las cartas tienen tu nombre",dur:"3 min",mod:"TC1-04",modEs:"LA SAGRADA ESCRITURA — NUESTRA CARTA DE AMOR",blk:"D",evalua:true},
  ]},
  {id:"TC1-05",num:"V",es:"LA BIBLIA — SU ORIGEN Y ESTRUCTURA",en:"LA BIBLIA — SU ORIGEN Y ESTRUCTURA",videos:[
    {id:"tc1_05a",o:17,es:"En voz de San Jerónimo",en:"En voz de San Jerónimo",dur:"1 min",mod:"TC1-05",modEs:"LA BIBLIA — SU ORIGEN Y ESTRUCTURA",blk:"A",evalua:false},
    {id:"tc1_05b",o:18,es:"Quién la escribió · Cuáles entran · Cómo se organizó",en:"Quién la escribió · Cuáles entran · Cómo se organizó",dur:"5 min",mod:"TC1-05",modEs:"LA BIBLIA — SU ORIGEN Y ESTRUCTURA",blk:"B",evalua:false},
    {id:"tc1_05c",o:19,es:"El pergamino y la Biblia de hoy",en:"El pergamino y la Biblia de hoy",dur:"3 min",mod:"TC1-05",modEs:"LA BIBLIA — SU ORIGEN Y ESTRUCTURA",blk:"C",evalua:false},
    {id:"tc1_05d",o:20,es:"Navegación · Libro, capítulo, versículo · Hasta que deje de costarte",en:"Navegación · Libro, capítulo, versículo · Hasta que deje de costarte",dur:"3 min",mod:"TC1-05",modEs:"LA BIBLIA — SU ORIGEN Y ESTRUCTURA",blk:"D",evalua:true},
  ]},
  {id:"TC1-06",num:"VI",es:"CÓMO LEER LA BIBLIA",en:"CÓMO LEER LA BIBLIA",videos:[
    {id:"tc1_06a",o:21,es:"En voz de San Juan Crisóstomo",en:"En voz de San Juan Crisóstomo",dur:"1 min",mod:"TC1-06",modEs:"CÓMO LEER LA BIBLIA",blk:"A",evalua:false},
    {id:"tc1_06b",o:22,es:"Los cuatro sentidos · Las tres condiciones",en:"Los cuatro sentidos · Las tres condiciones",dur:"5 min",mod:"TC1-06",modEs:"CÓMO LEER LA BIBLIA",blk:"B",evalua:false},
    {id:"tc1_06c",o:23,es:"El Evangeliario en la Misa",en:"El Evangeliario en la Misa",dur:"3 min",mod:"TC1-06",modEs:"CÓMO LEER LA BIBLIA",blk:"C",evalua:false},
    {id:"tc1_06d",o:24,es:"Hábito de lectura · Marcos, cinco minutos · Si fallas, no empieces de cero",en:"Hábito de lectura · Marcos, cinco minutos · Si fallas, no empieces de cero",dur:"3 min",mod:"TC1-06",modEs:"CÓMO LEER LA BIBLIA",blk:"D",evalua:true},
  ]},
  {id:"TC1-07",num:"VII",es:"JESUCRISTO — EL VERBO ENCARNADO",en:"JESUCRISTO — EL VERBO ENCARNADO",videos:[
    {id:"tc1_07a",o:25,es:"En voz de San Juan Evangelista",en:"En voz de San Juan Evangelista",dur:"2 min",mod:"TC1-07",modEs:"JESUCRISTO — EL VERBO ENCARNADO",blk:"A",evalua:false},
    {id:"tc1_07b",o:26,es:"Qué dice la Encarnación · Y para qué se hizo carne",en:"Qué dice la Encarnación · Y para qué se hizo carne",dur:"4 min",mod:"TC1-07",modEs:"JESUCRISTO — EL VERBO ENCARNADO",blk:"B",evalua:false},
    {id:"tc1_07c",o:27,es:"El pesebre de Belén",en:"El pesebre de Belén",dur:"3 min",mod:"TC1-07",modEs:"JESUCRISTO — EL VERBO ENCARNADO",blk:"C",evalua:false},
    {id:"tc1_07d",o:28,es:"El Ángelus · A las doce del mediodía · El Verbo se hizo carne",en:"El Ángelus · A las doce del mediodía · El Verbo se hizo carne",dur:"3 min",mod:"TC1-07",modEs:"JESUCRISTO — EL VERBO ENCARNADO",blk:"D",evalua:true},
  ]},
  {id:"TC1-08",num:"VIII",es:"LA REDENCIÓN — EL SACRIFICIO DE LA CRUZ",en:"LA REDENCIÓN — EL SACRIFICIO DE LA CRUZ",videos:[
    {id:"tc1_08a",o:29,es:"En voz de San Pablo Apóstol",en:"En voz de San Pablo Apóstol",dur:"1 min",mod:"TC1-08",modEs:"LA REDENCIÓN — EL SACRIFICIO DE LA CRUZ",blk:"A",evalua:false},
    {id:"tc1_08b",o:30,es:"Lo que la Cruz no es · Lo que sí es · Tu dolor con destinatario",en:"Lo que la Cruz no es · Lo que sí es · Tu dolor con destinatario",dur:"4 min",mod:"TC1-08",modEs:"LA REDENCIÓN — EL SACRIFICIO DE LA CRUZ",blk:"B",evalua:false},
    {id:"tc1_08c",o:31,es:"El crucifijo de la pared",en:"El crucifijo de la pared",dur:"3 min",mod:"TC1-08",modEs:"LA REDENCIÓN — EL SACRIFICIO DE LA CRUZ",blk:"C",evalua:false},
    {id:"tc1_08d",o:32,es:"La ofrenda del dolor · Cinco palabras · Empieza por lo pequeño",en:"La ofrenda del dolor · Cinco palabras · Empieza por lo pequeño",dur:"3 min",mod:"TC1-08",modEs:"LA REDENCIÓN — EL SACRIFICIO DE LA CRUZ",blk:"D",evalua:true},
  ]},
  {id:"TC1-09",num:"IX",es:"LA IGLESIA — CUERPO DE CRISTO",en:"LA IGLESIA — CUERPO DE CRISTO",videos:[
    {id:"tc1_09a",o:33,es:"En voz de San Pedro",en:"En voz de San Pedro",dur:"2 min",mod:"TC1-09",modEs:"LA IGLESIA — CUERPO DE CRISTO",blk:"A",evalua:false},
    {id:"tc1_09b",o:34,es:"Qué es · Cómo se reconoce · En qué se distingue",en:"Qué es · Cómo se reconoce · En qué se distingue",dur:"4 min",mod:"TC1-09",modEs:"LA IGLESIA — CUERPO DE CRISTO",blk:"B",evalua:false},
    {id:"tc1_09c",o:35,es:"Las llaves del Reino",en:"Las llaves del Reino",dur:"3 min",mod:"TC1-09",modEs:"LA IGLESIA — CUERPO DE CRISTO",blk:"C",evalua:false},
    {id:"tc1_09d",o:36,es:"Pertenencia · Reza por el Papa · Santa aunque formada por pecadores",en:"Pertenencia · Reza por el Papa · Santa aunque formada por pecadores",dur:"3 min",mod:"TC1-09",modEs:"LA IGLESIA — CUERPO DE CRISTO",blk:"D",evalua:true},
  ]},
  {id:"TC1-10",num:"X",es:"LOS TRES PILARES DE LA FE",en:"LOS TRES PILARES DE LA FE",videos:[
    {id:"tc1_10a",o:37,es:"En voz de San Ireneo de Lyon",en:"En voz de San Ireneo de Lyon",dur:"2 min",mod:"TC1-10",modEs:"LOS TRES PILARES DE LA FE",blk:"A",evalua:false},
    {id:"tc1_10b",o:38,es:"Una sola fuente · Tres modos de que llegue íntegra",en:"Una sola fuente · Tres modos de que llegue íntegra",dur:"4 min",mod:"TC1-10",modEs:"LOS TRES PILARES DE LA FE",blk:"B",evalua:false},
    {id:"tc1_10c",o:39,es:"La imposición de manos",en:"La imposición de manos",dur:"3 min",mod:"TC1-10",modEs:"LOS TRES PILARES DE LA FE",blk:"C",evalua:false},
    {id:"tc1_10d",o:40,es:"La brújula segura · Un Catecismo físico · Es un libro para consultar",en:"La brújula segura · Un Catecismo físico · Es un libro para consultar",dur:"3 min",mod:"TC1-10",modEs:"LOS TRES PILARES DE LA FE",blk:"D",evalua:true},
  ]},
  {id:"TC1-11",num:"XI",es:"LA GRACIA — EL REGALO DIVINO FRENTE AL PECADO",en:"LA GRACIA — EL REGALO DIVINO FRENTE AL PECADO",videos:[
    {id:"tc1_11a",o:41,es:"En voz de María Magdalena",en:"En voz de María Magdalena",dur:"2 min",mod:"TC1-11",modEs:"LA GRACIA — EL REGALO DIVINO FRENTE AL PECADO",blk:"A",evalua:false},
    {id:"tc1_11b",o:42,es:"Qué es la gracia · Venial y mortal · Siempre se recupera",en:"Qué es la gracia · Venial y mortal · Siempre se recupera",dur:"4 min",mod:"TC1-11",modEs:"LA GRACIA — EL REGALO DIVINO FRENTE AL PECADO",blk:"B",evalua:false},
    {id:"tc1_11c",o:43,es:"La esponja en el océano",en:"La esponja en el océano",dur:"3 min",mod:"TC1-11",modEs:"LA GRACIA — EL REGALO DIVINO FRENTE AL PECADO",blk:"C",evalua:false},
    {id:"tc1_11d",o:44,es:"Examen de conciencia · Dos minutos · Termina siempre reconciliado",en:"Examen de conciencia · Dos minutos · Termina siempre reconciliado",dur:"3 min",mod:"TC1-11",modEs:"LA GRACIA — EL REGALO DIVINO FRENTE AL PECADO",blk:"D",evalua:true},
  ]},
  {id:"TC1-12",num:"XII",es:"LOS SACRAMENTOS — EL MISTERIO DE LA GRACIA",en:"LOS SACRAMENTOS — EL MISTERIO DE LA GRACIA",videos:[
    {id:"tc1_12a",o:45,es:"En voz de San Juan María Vianney",en:"En voz de San Juan María Vianney",dur:"2 min",mod:"TC1-12",modEs:"LOS SACRAMENTOS — EL MISTERIO DE LA GRACIA",blk:"A",evalua:false},
    {id:"tc1_12b",o:46,es:"Signos eficaces · Ex opere operato · Un sistema blindado",en:"Signos eficaces · Ex opere operato · Un sistema blindado",dur:"4 min",mod:"TC1-12",modEs:"LOS SACRAMENTOS — EL MISTERIO DE LA GRACIA",blk:"B",evalua:false},
    {id:"tc1_12c",o:47,es:"Las manos consagradas",en:"Las manos consagradas",dur:"2 min",mod:"TC1-12",modEs:"LOS SACRAMENTOS — EL MISTERIO DE LA GRACIA",blk:"C",evalua:false},
    {id:"tc1_12d",o:48,es:"La certeza contra el escrúpulo · No es una práctica, es un agradecimiento",en:"La certeza contra el escrúpulo · No es una práctica, es un agradecimiento",dur:"3 min",mod:"TC1-12",modEs:"LOS SACRAMENTOS — EL MISTERIO DE LA GRACIA",blk:"D",evalua:true},
  ]},
  {id:"TC1-13",num:"XIII",es:"LOS SACRAMENTOS — SIGNOS Y PREFIGURACIONES",en:"LOS SACRAMENTOS — SIGNOS Y PREFIGURACIONES",videos:[
    {id:"tc1_13a",o:49,es:"En voz de San Ambrosio de Milán",en:"En voz de San Ambrosio de Milán",dur:"2 min",mod:"TC1-13",modEs:"LOS SACRAMENTOS — SIGNOS Y PREFIGURACIONES",blk:"A",evalua:false},
    {id:"tc1_13b",o:50,es:"Qué es una prefiguración · El arcoíris de Noé · Por qué materia",en:"Qué es una prefiguración · El arcoíris de Noé · Por qué materia",dur:"4 min",mod:"TC1-13",modEs:"LOS SACRAMENTOS — SIGNOS Y PREFIGURACIONES",blk:"B",evalua:false},
    {id:"tc1_13c",o:51,es:"Agua, óleo, pan y vino",en:"Agua, óleo, pan y vino",dur:"3 min",mod:"TC1-13",modEs:"LOS SACRAMENTOS — SIGNOS Y PREFIGURACIONES",blk:"C",evalua:false},
    {id:"tc1_13d",o:52,es:"Despertar litúrgico · No te concentres más — percibe más · El ofertorio",en:"Despertar litúrgico · No te concentres más — percibe más · El ofertorio",dur:"3 min",mod:"TC1-13",modEs:"LOS SACRAMENTOS — SIGNOS Y PREFIGURACIONES",blk:"D",evalua:true},
  ]},
  {id:"TC1-14",num:"XIV",es:"LOS SACRAMENTALES EN LA VIDA DE GRACIA",en:"LOS SACRAMENTALES EN LA VIDA DE GRACIA",videos:[
    {id:"tc1_14a",o:53,es:"En voz de San Benito de Nursia",en:"En voz de San Benito de Nursia",dur:"2 min",mod:"TC1-14",modEs:"LOS SACRAMENTALES EN LA VIDA DE GRACIA",blk:"A",evalua:false},
    {id:"tc1_14b",o:54,es:"Qué son · En qué se distinguen del sacramento · Y del amuleto",en:"Qué son · En qué se distinguen del sacramento · Y del amuleto",dur:"3 min",mod:"TC1-14",modEs:"LOS SACRAMENTALES EN LA VIDA DE GRACIA",blk:"B",evalua:false},
    {id:"tc1_14c",o:55,es:"El agua bendita",en:"El agua bendita",dur:"3 min",mod:"TC1-14",modEs:"LOS SACRAMENTALES EN LA VIDA DE GRACIA",blk:"C",evalua:false},
    {id:"tc1_14d",o:56,es:"Sacralizar lo ordinario · Bendecir es decir bien de algo · Di para qué lo usas",en:"Sacralizar lo ordinario · Bendecir es decir bien de algo · Di para qué lo usas",dur:"3 min",mod:"TC1-14",modEs:"LOS SACRAMENTALES EN LA VIDA DE GRACIA",blk:"D",evalua:true},
  ]},
  {id:"TC1-15",num:"XV",es:"LA ORACIÓN — EL ALIENTO DE LA VIDA DE GRACIA",en:"LA ORACIÓN — EL ALIENTO DE LA VIDA DE GRACIA",videos:[
    {id:"tc1_15a",o:57,es:"En voz de Santa Teresa de Ávila",en:"En voz de Santa Teresa de Ávila",dur:"2 min",mod:"TC1-15",modEs:"LA ORACIÓN — EL ALIENTO DE LA VIDA DE GRACIA",blk:"A",evalua:false},
    {id:"tc1_15b",o:58,es:"La definición de Teresa · Los cinco tipos de oración",en:"La definición de Teresa · Los cinco tipos de oración",dur:"4 min",mod:"TC1-15",modEs:"LA ORACIÓN — EL ALIENTO DE LA VIDA DE GRACIA",blk:"B",evalua:false},
    {id:"tc1_15c",o:59,es:"Tres posturas de la oración",en:"Tres posturas de la oración",dur:"3 min",mod:"TC1-15",modEs:"LA ORACIÓN — EL ALIENTO DE LA VIDA DE GRACIA",blk:"C",evalua:false},
    {id:"tc1_15d",o:60,es:"El diezmo del tiempo · Quince minutos innegociables · La fidelidad vale más que el resultado",en:"El diezmo del tiempo · Quince minutos innegociables · La fidelidad vale más que el resultado",dur:"3 min",mod:"TC1-15",modEs:"LA ORACIÓN — EL ALIENTO DE LA VIDA DE GRACIA",blk:"D",evalua:true},
  ]},
  {id:"TC1-16",num:"XVI",es:"LA VIDA CRISTIANA ANTE LAS PROPUESTAS DEL MUNDO",en:"LA VIDA CRISTIANA ANTE LAS PROPUESTAS DEL MUNDO",videos:[
    {id:"tc1_16a",o:61,es:"En voz de San Juan Pablo II",en:"En voz de San Juan Pablo II",dur:"2 min",mod:"TC1-16",modEs:"LA VIDA CRISTIANA ANTE LAS PROPUESTAS DEL MUNDO",blk:"A",evalua:false},
    {id:"tc1_16b",o:62,es:"Sincretismo · Magia y oración · Dónde está el punto exacto",en:"Sincretismo · Magia y oración · Dónde está el punto exacto",dur:"4 min",mod:"TC1-16",modEs:"LA VIDA CRISTIANA ANTE LAS PROPUESTAS DEL MUNDO",blk:"B",evalua:false},
    {id:"tc1_16c",o:63,es:"La Cruz como única protección",en:"La Cruz como única protección",dur:"3 min",mod:"TC1-16",modEs:"LA VIDA CRISTIANA ANTE LAS PROPUESTAS DEL MUNDO",blk:"C",evalua:false},
    {id:"tc1_16d",o:64,es:"Purificación del hogar · Sin miedo y a plena luz · No tengas miedo",en:"Purificación del hogar · Sin miedo y a plena luz · No tengas miedo",dur:"3 min",mod:"TC1-16",modEs:"LA VIDA CRISTIANA ANTE LAS PROPUESTAS DEL MUNDO",blk:"D",evalua:true},
  ]},
];
const TC1_ALL = TC1_MODULES.flatMap(m=>m.videos);

// ─── CONTENIDO TC2 (Confesión + Unción) ───────────────────────────
const TC2_CONFESION=[
  {id:"rec01a",o:1,es:"Gancho · El hijo que vuelve al Padre",en:"Gancho · El hijo que vuelve al Padre",dur:"2 min",mod:"REC-01",modEs:"LA CONVERSIÓN: VOLVER AL PADRE",blk:"A",evalua:false},
  {id:"rec01b",o:2,es:"El arrepentimiento a solas no basta · Jesús sopla y envía a perdonar · Convertirse es darse la vuelta",en:"El arrepentimiento a solas no basta · Jesús sopla y envía a perdonar · Convertirse es darse la vuelta",dur:"7 min",mod:"REC-01",modEs:"LA CONVERSIÓN: VOLVER AL PADRE",blk:"B",evalua:false},
  {id:"rec01c",o:3,es:"Las llaves · Atar y desatar · La absolución se recibe",en:"Las llaves · Atar y desatar · La absolución se recibe",dur:"4 min",mod:"REC-01",modEs:"LA CONVERSIÓN: VOLVER AL PADRE",blk:"C",evalua:false},
  {id:"rec01d",o:4,es:"Pregunta de sinceridad · ¿A qué me llama Dios a volver?",en:"Pregunta de sinceridad · ¿A qué me llama Dios a volver?",dur:"2 min",mod:"REC-01",modEs:"LA CONVERSIÓN: VOLVER AL PADRE",blk:"D",evalua:true},
  {id:"rec02a",o:5,es:"En voz del Rey David",en:"En voz del Rey David",dur:"2 min",mod:"REC-02",modEs:"EL PECADO Y LA NECESIDAD DE SANACIÓN",blk:"A",evalua:false},
  {id:"rec02b",o:6,es:"El pecado es ruptura de una relación · No hay pecado sin daño · No todo pesa igual",en:"El pecado es ruptura de una relación · No hay pecado sin daño · No todo pesa igual",dur:"7 min",mod:"REC-02",modEs:"EL PECADO Y LA NECESIDAD DE SANACIÓN",blk:"B",evalua:false},
  {id:"rec02c",o:7,es:"La estola morada · El secreto de confesión",en:"La estola morada · El secreto de confesión",dur:"4 min",mod:"REC-02",modEs:"EL PECADO Y LA NECESIDAD DE SANACIÓN",blk:"C",evalua:false},
  {id:"rec02d",o:8,es:"Quitarse las máscaras · El Salmo 51 · Mirar y no quedarse ahí",en:"Quitarse las máscaras · El Salmo 51 · Mirar y no quedarse ahí",dur:"2 min",mod:"REC-02",modEs:"EL PECADO Y LA NECESIDAD DE SANACIÓN",blk:"D",evalua:true},
  {id:"rec03a",o:9,es:"En voz de San Agustín",en:"En voz de San Agustín",dur:"2 min",mod:"REC-03",modEs:"LA CONCIENCIA CRISTIANA Y EL EXAMEN DE VIDA",blk:"A",evalua:false},
  {id:"rec03b",o:10,es:"El examen de conciencia · No es una auditoría · Dos preguntas",en:"El examen de conciencia · No es una auditoría · Dos preguntas",dur:"7 min",mod:"REC-03",modEs:"LA CONCIENCIA CRISTIANA Y EL EXAMEN DE VIDA",blk:"B",evalua:false},
  {id:"rec03c",o:11,es:"La luz · El polvo ya estaba · La luz viene de fuera",en:"La luz · El polvo ya estaba · La luz viene de fuera",dur:"4 min",mod:"REC-03",modEs:"LA CONCIENCIA CRISTIANA Y EL EXAMEN DE VIDA",blk:"C",evalua:false},
  {id:"rec03d",o:12,es:"Examen guiado · Diez minutos · Tres actitudes",en:"Examen guiado · Diez minutos · Tres actitudes",dur:"2 min",mod:"REC-03",modEs:"LA CONCIENCIA CRISTIANA Y EL EXAMEN DE VIDA",blk:"D",evalua:true},
  {id:"rec04a",o:13,es:"En voz de Santa María Magdalena",en:"En voz de Santa María Magdalena",dur:"2 min",mod:"REC-04",modEs:"CONTRICIÓN Y PROPÓSITO DE ENMIENDA",blk:"A",evalua:false},
  {id:"rec04b",o:14,es:"Remordimiento y contrición · Basta la contrición imperfecta · Propósito de enmienda",en:"Remordimiento y contrición · Basta la contrición imperfecta · Propósito de enmienda",dur:"7 min",mod:"REC-04",modEs:"CONTRICIÓN Y PROPÓSITO DE ENMIENDA",blk:"B",evalua:false},
  {id:"rec04c",o:15,es:"Los golpes en el pecho · «Lo mío es mío», no «todo es mío»",en:"Los golpes en el pecho · «Lo mío es mío», no «todo es mío»",dur:"4 min",mod:"REC-04",modEs:"CONTRICIÓN Y PROPÓSITO DE ENMIENDA",blk:"C",evalua:false},
  {id:"rec04d",o:16,es:"Cortes quirúrgicos · Quitar la ocasión · Pedir ayuda si hace falta",en:"Cortes quirúrgicos · Quitar la ocasión · Pedir ayuda si hace falta",dur:"2 min",mod:"REC-04",modEs:"CONTRICIÓN Y PROPÓSITO DE ENMIENDA",blk:"D",evalua:true},
  {id:"rec05a",o:17,es:"En voz de San Juan Nepomuceno",en:"En voz de San Juan Nepomuceno",dur:"2 min",mod:"REC-05",modEs:"CÓMO CONFESARSE (PASO A PASO)",blk:"A",evalua:false},
  {id:"rec05b",o:18,es:"Los cinco miedos · Acusarse de lo propio · Sin justificarse",en:"Los cinco miedos · Acusarse de lo propio · Sin justificarse",dur:"7 min",mod:"REC-05",modEs:"CÓMO CONFESARSE (PASO A PASO)",blk:"B",evalua:false},
  {id:"rec05c",o:19,es:"El rito paso a paso · Dura menos que una fila del banco",en:"El rito paso a paso · Dura menos que una fila del banco",dur:"4 min",mod:"REC-05",modEs:"CÓMO CONFESARSE (PASO A PASO)",blk:"C",evalua:false},
  {id:"rec05d",o:20,es:"El ensayo · La frase de entrada · Poner fecha",en:"El ensayo · La frase de entrada · Poner fecha",dur:"2 min",mod:"REC-05",modEs:"CÓMO CONFESARSE (PASO A PASO)",blk:"D",evalua:true},
  {id:"rec06a",o:21,es:"En voz del Cura de Ars",en:"En voz del Cura de Ars",dur:"2 min",mod:"REC-06",modEs:"EL SACERDOTE COMO MINISTRO DE LA RECONCILIACIÓN",blk:"A",evalua:false},
  {id:"rec06b",o:22,es:"In persona Christi · Discierne, cura y orienta · No sustituye al psicólogo",en:"In persona Christi · Discierne, cura y orienta · No sustituye al psicólogo",dur:"7 min",mod:"REC-06",modEs:"EL SACERDOTE COMO MINISTRO DE LA RECONCILIACIÓN",blk:"B",evalua:false},
  {id:"rec06c",o:23,es:"La rejilla y el confesionario · El tribunal de la misericordia",en:"La rejilla y el confesionario · El tribunal de la misericordia",dur:"4 min",mod:"REC-06",modEs:"EL SACERDOTE COMO MINISTRO DE LA RECONCILIACIÓN",blk:"C",evalua:false},
  {id:"rec06d",o:24,es:"Diferenciar roles · Amigo, psicólogo y confesor",en:"Diferenciar roles · Amigo, psicólogo y confesor",dur:"2 min",mod:"REC-06",modEs:"EL SACERDOTE COMO MINISTRO DE LA RECONCILIACIÓN",blk:"D",evalua:true},
  {id:"rec07a",o:25,es:"En voz de Zaqueo",en:"En voz de Zaqueo",dur:"2 min",mod:"REC-07",modEs:"LA PENITENCIA Y LA REPARACIÓN",blk:"A",evalua:false},
  {id:"rec07b",o:26,es:"Rehabilitación, no castigo · Se cura con lo contrario · Reparar",en:"Rehabilitación, no castigo · Se cura con lo contrario · Reparar",dur:"7 min",mod:"REC-07",modEs:"LA PENITENCIA Y LA REPARACIÓN",blk:"B",evalua:false},
  {id:"rec07c",o:27,es:"Las obras de misericordia · Todas apuntan hacia afuera",en:"Las obras de misericordia · Todas apuntan hacia afuera",dur:"4 min",mod:"REC-07",modEs:"LA PENITENCIA Y LA REPARACIÓN",blk:"C",evalua:false},
  {id:"rec07d",o:28,es:"Reparación activa · La más pequeña a tu alcance · En silencio",en:"Reparación activa · La más pequeña a tu alcance · En silencio",dur:"2 min",mod:"REC-07",modEs:"LA PENITENCIA Y LA REPARACIÓN",blk:"D",evalua:true},
  {id:"rec08a",o:29,es:"En voz de San Juan Pablo II",en:"En voz de San Juan Pablo II",dur:"2 min",mod:"REC-08",modEs:"DESPUÉS DE LA ABSOLUCIÓN (ORACIÓN Y PERSEVERANCIA)",blk:"A",evalua:false},
  {id:"rec08b",o:30,es:"Quita la culpa, no la costumbre · Volver no es fracasar · Cuatro apoyos",en:"Quita la culpa, no la costumbre · Volver no es fracasar · Cuatro apoyos",dur:"7 min",mod:"REC-08",modEs:"DESPUÉS DE LA ABSOLUCIÓN (ORACIÓN Y PERSEVERANCIA)",blk:"B",evalua:false},
  {id:"rec08c",o:31,es:"El agua bendita · Recuerdo del Bautismo · El tercer día",en:"El agua bendita · Recuerdo del Bautismo · El tercer día",dur:"4 min",mod:"REC-08",modEs:"DESPUÉS DE LA ABSOLUCIÓN (ORACIÓN Y PERSEVERANCIA)",blk:"C",evalua:false},
  {id:"rec08d",o:32,es:"El plan de vuelo · Tres líneas · Saber por dónde se vuelve",en:"El plan de vuelo · Tres líneas · Saber por dónde se vuelve",dur:"2 min",mod:"REC-08",modEs:"DESPUÉS DE LA ABSOLUCIÓN (ORACIÓN Y PERSEVERANCIA)",blk:"D",evalua:true},
];
const TC2_UNCION=[
  {id:"unc01a",o:1,es:"Gancho · La compasión de Dios ante el enfermo",en:"Gancho · La compasión de Dios ante el enfermo",dur:"2 min",mod:"UNC-01",modEs:"CRISTO MÉDICO Y LA COMPASIÓN DE DIOS",blk:"A",evalua:false},
  {id:"unc01b",o:2,es:"La enfermedad no es castigo ni regalo · El buen samaritano · La posada es la Iglesia",en:"La enfermedad no es castigo ni regalo · El buen samaritano · La posada es la Iglesia",dur:"7 min",mod:"UNC-01",modEs:"CRISTO MÉDICO Y LA COMPASIÓN DE DIOS",blk:"B",evalua:false},
  {id:"unc01c",o:3,es:"La mano tendida · Tocar antes de hablar · No preparar nada",en:"La mano tendida · Tocar antes de hablar · No preparar nada",dur:"4 min",mod:"UNC-01",modEs:"CRISTO MÉDICO Y LA COMPASIÓN DE DIOS",blk:"C",evalua:false},
  {id:"unc01d",o:4,es:"Reflexión personal · Escribir una oración · No tienes que poder solo",en:"Reflexión personal · Escribir una oración · No tienes que poder solo",dur:"2 min",mod:"UNC-01",modEs:"CRISTO MÉDICO Y LA COMPASIÓN DE DIOS",blk:"D",evalua:true},
  {id:"unc02a",o:5,es:"En voz de Santiago Apóstol",en:"En voz de Santiago Apóstol",dur:"2 min",mod:"UNC-02",modEs:"FUNDAMENTO BÍBLICO: EL MANDATO DE SANTIAGO",blk:"A",evalua:false},
  {id:"unc02b",o:6,es:"Las cuatro líneas de Santiago · Palabras y materia · «Se levantará»",en:"Las cuatro líneas de Santiago · Palabras y materia · «Se levantará»",dur:"7 min",mod:"UNC-02",modEs:"FUNDAMENTO BÍBLICO: EL MANDATO DE SANTIAGO",blk:"B",evalua:false},
  {id:"unc02c",o:7,es:"El aceite · Alimento, medicina y consagración",en:"El aceite · Alimento, medicina y consagración",dur:"4 min",mod:"UNC-02",modEs:"FUNDAMENTO BÍBLICO: EL MANDATO DE SANTIAGO",blk:"C",evalua:false},
  {id:"unc02d",o:8,es:"Memorizar la frase · El teléfono de la parroquia",en:"Memorizar la frase · El teléfono de la parroquia",dur:"2 min",mod:"UNC-02",modEs:"FUNDAMENTO BÍBLICO: EL MANDATO DE SANTIAGO",blk:"D",evalua:true},
  {id:"unc03a",o:9,es:"En voz de San Carlos Borromeo",en:"En voz de San Carlos Borromeo",dur:"2 min",mod:"UNC-03",modEs:"¿QUÉ ES REALMENTE LA UNCIÓN?",blk:"A",evalua:false},
  {id:"unc03b",o:10,es:"Qué es un sacramento · No depende de tu fervor · No es magia ni amuleto",en:"Qué es un sacramento · No depende de tu fervor · No es magia ni amuleto",dur:"7 min",mod:"UNC-03",modEs:"¿QUÉ ES REALMENTE LA UNCIÓN?",blk:"B",evalua:false},
  {id:"unc03c",o:11,es:"Los dos gestos · Las manos piden, el aceite dice dónde",en:"Los dos gestos · Las manos piden, el aceite dice dónde",dur:"4 min",mod:"UNC-03",modEs:"¿QUÉ ES REALMENTE LA UNCIÓN?",blk:"C",evalua:false},
  {id:"unc03d",o:12,es:"Deseo humano y sacramento · Haz la visita",en:"Deseo humano y sacramento · Haz la visita",dur:"2 min",mod:"UNC-03",modEs:"¿QUÉ ES REALMENTE LA UNCIÓN?",blk:"D",evalua:true},
  {id:"unc04a",o:13,es:"En voz de San Pablo VI",en:"En voz de San Pablo VI",dur:"2 min",mod:"UNC-04",modEs:"¿CUÁNDO Y A QUIÉN PEDIRLA?",blk:"A",evalua:false},
  {id:"unc04b",o:14,es:"Tres situaciones, no la agonía · Se puede repetir · A quién llamar",en:"Tres situaciones, no la agonía · Se puede repetir · A quién llamar",dur:"7 min",mod:"UNC-04",modEs:"¿CUÁNDO Y A QUIÉN PEDIRLA?",blk:"B",evalua:false},
  {id:"unc04c",o:15,es:"La llamada · Reconocer que es serio · Preguntarle al enfermo",en:"La llamada · Reconocer que es serio · Preguntarle al enfermo",dur:"4 min",mod:"UNC-04",modEs:"¿CUÁNDO Y A QUIÉN PEDIRLA?",blk:"C",evalua:false},
  {id:"unc04d",o:16,es:"Plan de acción · Quién llama · Hablarlo estando sanos",en:"Plan de acción · Quién llama · Hablarlo estando sanos",dur:"2 min",mod:"UNC-04",modEs:"¿CUÁNDO Y A QUIÉN PEDIRLA?",blk:"D",evalua:true},
  {id:"unc05a",o:17,es:"En voz de San Camilo de Lelis",en:"En voz de San Camilo de Lelis",dur:"2 min",mod:"UNC-05",modEs:"MINISTRO, MATERIA Y FORMA",blk:"A",evalua:false},
  {id:"unc05b",o:18,es:"Ministro, materia y forma · «Te ayude», no «te cure»",en:"Ministro, materia y forma · «Te ayude», no «te cure»",dur:"7 min",mod:"UNC-05",modEs:"MINISTRO, MATERIA Y FORMA",blk:"B",evalua:false},
  {id:"unc05c",o:19,es:"La cruz en la frente y en las manos",en:"La cruz en la frente y en las manos",dur:"4 min",mod:"UNC-05",modEs:"MINISTRO, MATERIA Y FORMA",blk:"C",evalua:false},
  {id:"unc05d",o:20,es:"¿Por qué un sacerdote? · Lo que solo tú puedes hacer",en:"¿Por qué un sacerdote? · Lo que solo tú puedes hacer",dur:"2 min",mod:"UNC-05",modEs:"MINISTRO, MATERIA Y FORMA",blk:"D",evalua:true},
  {id:"unc06a",o:21,es:"En voz de San Pablo Apóstol",en:"En voz de San Pablo Apóstol",dur:"2 min",mod:"UNC-06",modEs:"LOS EFECTOS DE LA GRACIA SACRAMENTAL",blk:"A",evalua:false},
  {id:"unc06b",o:22,es:"Los cinco efectos · No es una pastilla · «Te basta mi gracia»",en:"Los cinco efectos · No es una pastilla · «Te basta mi gracia»",dur:"7 min",mod:"UNC-06",modEs:"LOS EFECTOS DE LA GRACIA SACRAMENTAL",blk:"B",evalua:false},
  {id:"unc06c",o:23,es:"La paz · No es alegría ni resignación",en:"La paz · No es alegría ni resignación",dur:"4 min",mod:"UNC-06",modEs:"LOS EFECTOS DE LA GRACIA SACRAMENTAL",blk:"C",evalua:false},
  {id:"unc06d",o:24,es:"Una frase por efecto · No fue por falta de fe",en:"Una frase por efecto · No fue por falta de fe",dur:"2 min",mod:"UNC-06",modEs:"LOS EFECTOS DE LA GRACIA SACRAMENTAL",blk:"D",evalua:true},
  {id:"unc07a",o:25,es:"En voz de Santa Teresita del Niño Jesús",en:"En voz de Santa Teresita del Niño Jesús",dur:"2 min",mod:"UNC-07",modEs:"DISPOSICIONES INTERIORES: LA FE QUE SANA",blk:"A",evalua:false},
  {id:"unc07b",o:26,es:"Sacramento de fe · No cerrar la puerta · La confianza es una decisión",en:"Sacramento de fe · No cerrar la puerta · La confianza es una decisión",dur:"7 min",mod:"UNC-07",modEs:"DISPOSICIONES INTERIORES: LA FE QUE SANA",blk:"B",evalua:false},
  {id:"unc07c",o:27,es:"La postura de entrega · Abrir las manos",en:"La postura de entrega · Abrir las manos",dur:"4 min",mod:"UNC-07",modEs:"DISPOSICIONES INTERIORES: LA FE QUE SANA",blk:"C",evalua:false},
  {id:"unc07d",o:28,es:"Oración de abandono · Pide curarte primero",en:"Oración de abandono · Pide curarte primero",dur:"2 min",mod:"UNC-07",modEs:"DISPOSICIONES INTERIORES: LA FE QUE SANA",blk:"D",evalua:true},
  {id:"unc08a",o:29,es:"En voz de la Virgen María",en:"En voz de la Virgen María",dur:"2 min",mod:"UNC-08",modEs:"EL SACRAMENTO ECLESIAL (NO SE VIVE SOLO)",blk:"A",evalua:false},
  {id:"unc08b",o:30,es:"De toda la Iglesia · Que la parroquia vaya · El que cuida",en:"De toda la Iglesia · Que la parroquia vaya · El que cuida",dur:"7 min",mod:"UNC-08",modEs:"EL SACRAMENTO ECLESIAL (NO SE VIVE SOLO)",blk:"B",evalua:false},
  {id:"unc08c",o:31,es:"La imposición de manos · Toda la Iglesia sosteniendo",en:"La imposición de manos · Toda la Iglesia sosteniendo",dur:"4 min",mod:"UNC-08",modEs:"EL SACRAMENTO ECLESIAL (NO SE VIVE SOLO)",blk:"C",evalua:false},
  {id:"unc08d",o:32,es:"Un nombre · Visitar, Comunión, relevar al cuidador",en:"Un nombre · Visitar, Comunión, relevar al cuidador",dur:"2 min",mod:"UNC-08",modEs:"EL SACRAMENTO ECLESIAL (NO SE VIVE SOLO)",blk:"D",evalua:true},
  {id:"unc09a",o:33,es:"En voz de San José",en:"En voz de San José",dur:"2 min",mod:"UNC-09",modEs:"MISTAGOGIA: VIVIR EN LA ESPERANZA",blk:"A",evalua:false},
  {id:"unc09b",o:34,es:"Mistagogia · El Viático, no un adiós · Nadie se pierde por horarios",en:"Mistagogia · El Viático, no un adiós · Nadie se pierde por horarios",dur:"7 min",mod:"UNC-09",modEs:"MISTAGOGIA: VIVIR EN LA ESPERANZA",blk:"B",evalua:false},
  {id:"unc09c",o:35,es:"El Cirio Pascual · La misma llama",en:"El Cirio Pascual · La misma llama",dur:"4 min",mod:"UNC-09",modEs:"MISTAGOGIA: VIVIR EN LA ESPERANZA",blk:"C",evalua:false},
  {id:"unc09d",o:36,es:"Plan de perseverancia · Salmo 23 · No desaparezcas de la parroquia",en:"Plan de perseverancia · Salmo 23 · No desaparezcas de la parroquia",dur:"2 min",mod:"UNC-09",modEs:"MISTAGOGIA: VIVIR EN LA ESPERANZA",blk:"D",evalua:true},
];

// ─── CURSOS SACRAMENTOS ESPECÍFICOS ───────────────────────────────
// ─── MÓDULO 0 · KERIGMA ───────────────────────────────────────────
// Cimiento espiritual previo a TC1. Aplica SOLO a catecúmenos de Bautismo,
// Confirmación y Primera Comunión (una sola vez, aunque cursen los 3). No
// aplica a papás (prebautismal) ni padrinos. Por ahora 1 video con evaluación;
// ampliable desde el panel admin.
// Estructura real: 6 temas × 4 bloques (A/B/C/D). Cada bloque es un video; la
// evaluación va UNA vez por tema, en el bloque D (evalua:true). A/B/C se completan
// al verse (evalua:false). mod = código del tema; modEs = título del tema.
const KERIGMA=[
  {id:"kg1a",o:1,es:"En voz de San Juan Apóstol",en:"En voz de San Juan Apóstol",dur:"2 min",mod:"KER-01",modEs:"DIOS TE AMA Y TE LLAMA",blk:"A",evalua:false},
  {id:"kg1b",o:2,es:"La iniciativa es de Dios · La parábola del Padre · Dios bajó la escalera",en:"La iniciativa es de Dios · La parábola del Padre · Dios bajó la escalera",dur:"5 min",mod:"KER-01",modEs:"DIOS TE AMA Y TE LLAMA",blk:"B",evalua:false},
  {id:"kg1c",o:3,es:"El abrazo · El anillo · El vestido · La puerta abierta",en:"El abrazo · El anillo · El vestido · La puerta abierta",dur:"3 min",mod:"KER-01",modEs:"DIOS TE AMA Y TE LLAMA",blk:"C",evalua:false},
  {id:"kg1d",o:4,es:"Identificar la barrera · Un minuto de silencio · Orgullo, culpa o miedo",en:"Identificar la barrera · Un minuto de silencio · Orgullo, culpa o miedo",dur:"3 min",mod:"KER-01",modEs:"DIOS TE AMA Y TE LLAMA",blk:"D",evalua:true},
  {id:"kg2a",o:5,es:"En voz del Rey David",en:"En voz del Rey David",dur:"2 min",mod:"KER-02",modEs:"EL PECADO Y LA NECESIDAD DE SALVACIÓN",blk:"A",evalua:false},
  {id:"kg2b",o:6,es:"El pecado es una enfermedad · Las tres rupturas · Reconocerlo libera",en:"El pecado es una enfermedad · Las tres rupturas · Reconocerlo libera",dur:"5 min",mod:"KER-02",modEs:"EL PECADO Y LA NECESIDAD DE SALVACIÓN",blk:"B",evalua:false},
  {id:"kg2c",o:7,es:"El barro · La mano extendida",en:"El barro · La mano extendida",dur:"3 min",mod:"KER-02",modEs:"EL PECADO Y LA NECESIDAD DE SALVACIÓN",blk:"C",evalua:false},
  {id:"kg2d",o:8,es:"Diagnóstico sincero · Sin justificarte · Necesito que me rescates",en:"Diagnóstico sincero · Sin justificarte · Necesito que me rescates",dur:"2 min",mod:"KER-02",modEs:"EL PECADO Y LA NECESIDAD DE SALVACIÓN",blk:"D",evalua:true},
  {id:"kg3a",o:9,es:"En voz de María Magdalena",en:"En voz de María Magdalena",dur:"2 min",mod:"KER-03",modEs:"JESUCRISTO MURIÓ Y RESUCITÓ POR TI",blk:"A",evalua:false},
  {id:"kg3b",o:10,es:"El corazón del Kerygma · El pago del rescate · La Resurrección",en:"El corazón del Kerygma · El pago del rescate · La Resurrección",dur:"5 min",mod:"KER-03",modEs:"JESUCRISTO MURIÓ Y RESUCITÓ POR TI",blk:"B",evalua:false},
  {id:"kg3c",o:11,es:"La Cruz · La piedra removida",en:"La Cruz · La piedra removida",dur:"3 min",mod:"KER-03",modEs:"JESUCRISTO MURIÓ Y RESUCITÓ POR TI",blk:"C",evalua:false},
  {id:"kg3d",o:12,es:"Apropiación del sacrificio · Dos minutos de silencio · Lo hiciste por mí",en:"Apropiación del sacrificio · Dos minutos de silencio · Lo hiciste por mí",dur:"2 min",mod:"KER-03",modEs:"JESUCRISTO MURIÓ Y RESUCITÓ POR TI",blk:"D",evalua:true},
  {id:"kg4a",o:13,es:"En voz de Zaqueo",en:"En voz de Zaqueo",dur:"2 min",mod:"KER-04",modEs:"RESPONDE CON FE Y CONVERSIÓN",blk:"A",evalua:false},
  {id:"kg4b",o:14,es:"Qué es la fe · Qué es la conversión · Qué debo hacer",en:"Qué es la fe · Qué es la conversión · Qué debo hacer",dur:"5 min",mod:"KER-04",modEs:"RESPONDE CON FE Y CONVERSIÓN",blk:"B",evalua:false},
  {id:"kg4c",o:15,es:"El giro",en:"El giro",dur:"3 min",mod:"KER-04",modEs:"RESPONDE CON FE Y CONVERSIÓN",blk:"C",evalua:false},
  {id:"kg4d",o:16,es:"La primera acción · Hoy, concreta y que cueste · Que se note el giro",en:"La primera acción · Hoy, concreta y que cueste · Que se note el giro",dur:"3 min",mod:"KER-04",modEs:"RESPONDE CON FE Y CONVERSIÓN",blk:"D",evalua:true},
  {id:"kg5a",o:17,es:"En voz de San Pablo Apóstol",en:"En voz de San Pablo Apóstol",dur:"2 min",mod:"KER-05",modEs:"EL ESPÍRITU SANTO ABRE UNA VIDA NUEVA",blk:"A",evalua:false},
  {id:"kg5b",o:18,es:"No un código moral · Una vida animada por Alguien más",en:"No un código moral · Una vida animada por Alguien más",dur:"4 min",mod:"KER-05",modEs:"EL ESPÍRITU SANTO ABRE UNA VIDA NUEVA",blk:"B",evalua:false},
  {id:"kg5c",o:19,es:"El aliento · El fuego",en:"El aliento · El fuego",dur:"3 min",mod:"KER-05",modEs:"EL ESPÍRITU SANTO ABRE UNA VIDA NUEVA",blk:"C",evalua:false},
  {id:"kg5d",o:20,es:"Respiración espiritual · Tres exhalaciones · Toma el volante",en:"Respiración espiritual · Tres exhalaciones · Toma el volante",dur:"2 min",mod:"KER-05",modEs:"EL ESPÍRITU SANTO ABRE UNA VIDA NUEVA",blk:"D",evalua:true},
  {id:"kg6a",o:21,es:"En voz de Madre Teresa",en:"En voz de Madre Teresa",dur:"2 min",mod:"KER-06",modEs:"LA NUEVA VIDA SE RECONOCE EN LA CARIDAD",blk:"A",evalua:false},
  {id:"kg6b",o:22,es:"Caridad concreta · Reconciliación · Disponibilidad",en:"Caridad concreta · Reconciliación · Disponibilidad",dur:"4 min",mod:"KER-06",modEs:"LA NUEVA VIDA SE RECONOCE EN LA CARIDAD",blk:"B",evalua:false},
  {id:"kg6c",o:23,es:"La palangana y la toalla",en:"La palangana y la toalla",dur:"3 min",mod:"KER-06",modEs:"LA NUEVA VIDA SE RECONOCE EN LA CARIDAD",blk:"C",evalua:false},
  {id:"kg6d",o:24,es:"Caridad oculta · Por alguien difícil · Que no se entere nadie",en:"Caridad oculta · Por alguien difícil · Que no se entere nadie",dur:"3 min",mod:"KER-06",modEs:"LA NUEVA VIDA SE RECONOCE EN LA CARIDAD",blk:"D",evalua:true},
];
const CONFIRMACION=[
  {id:"cfm01a",o:1,es:"En voz de la Virgen María",en:"En voz de la Virgen María",dur:"2 min",mod:"CONF-01",modEs:"PENTECOSTÉS SE HACE VIDA EN MÍ",blk:"A",evalua:false},
  {id:"cfm01b",o:2,es:"Perpetuación, no conmemoración · El Espíritu actúa hoy · Derramamiento y plenitud",en:"Perpetuación, no conmemoración · El Espíritu actúa hoy · Derramamiento y plenitud",dur:"7 min",mod:"CONF-01",modEs:"PENTECOSTÉS SE HACE VIDA EN MÍ",blk:"B",evalua:false},
  {id:"cfm01c",o:3,es:"Viento y fuego · Una llama sobre cada uno · Valentía, no entusiasmo",en:"Viento y fuego · Una llama sobre cada uno · Valentía, no entusiasmo",dur:"4 min",mod:"CONF-01",modEs:"PENTECOSTÉS SE HACE VIDA EN MÍ",blk:"C",evalua:false},
  {id:"cfm01d",o:4,es:"Respirar al Espíritu · Silencio real · «Ven, Espíritu Santo»",en:"Respirar al Espíritu · Silencio real · «Ven, Espíritu Santo»",dur:"2 min",mod:"CONF-01",modEs:"PENTECOSTÉS SE HACE VIDA EN MÍ",blk:"D",evalua:true},
  {id:"cfm02a",o:5,es:"En voz de San Juan Crisóstomo",en:"En voz de San Juan Crisóstomo",dur:"2 min",mod:"CONF-02",modEs:"SOY DEL SEÑOR Y LO RENUEVO",blk:"A",evalua:false},
  {id:"cfm02b",o:6,es:"No empieza de cero · Madura la configuración con Cristo · Carácter indeleble",en:"No empieza de cero · Madura la configuración con Cristo · Carácter indeleble",dur:"7 min",mod:"CONF-02",modEs:"SOY DEL SEÑOR Y LO RENUEVO",blk:"B",evalua:false},
  {id:"cfm02c",o:7,es:"Renovación de las promesas bautismales · Ahora puedes decir que no",en:"Renovación de las promesas bautismales · Ahora puedes decir que no",dur:"4 min",mod:"CONF-02",modEs:"SOY DEL SEÑOR Y LO RENUEVO",blk:"C",evalua:false},
  {id:"cfm02d",o:8,es:"Mi fe bautismal hoy · Escribir a mano · Enseñárselo a alguien",en:"Mi fe bautismal hoy · Escribir a mano · Enseñárselo a alguien",dur:"2 min",mod:"CONF-02",modEs:"SOY DEL SEÑOR Y LO RENUEVO",blk:"D",evalua:true},
  {id:"cfm03a",o:9,es:"En voz de San Cirilo de Jerusalén",en:"En voz de San Cirilo de Jerusalén",dur:"2 min",mod:"CONF-03",modEs:"SIGNO Y PALABRA",blk:"A",evalua:false},
  {id:"cfm03b",o:10,es:"La esencia: unción y fórmula a la vez · «Recibe el Don del Espíritu Santo»",en:"La esencia: unción y fórmula a la vez · «Recibe el Don del Espíritu Santo»",dur:"7 min",mod:"CONF-03",modEs:"SIGNO Y PALABRA",blk:"B",evalua:false},
  {id:"cfm03c",o:11,es:"El Santo Crisma · La Misa Crismal · Rey, sacerdote y profeta",en:"El Santo Crisma · La Misa Crismal · Rey, sacerdote y profeta",dur:"4 min",mod:"CONF-03",modEs:"SIGNO Y PALABRA",blk:"C",evalua:false},
  {id:"cfm03d",o:12,es:"Ensayo orante · Los cuatro segundos · Sellado para la vida diaria",en:"Ensayo orante · Los cuatro segundos · Sellado para la vida diaria",dur:"2 min",mod:"CONF-03",modEs:"SIGNO Y PALABRA",blk:"D",evalua:true},
  {id:"cfm04a",o:13,es:"En voz de San Felipe Neri",en:"En voz de San Felipe Neri",dur:"2 min",mod:"CONF-04",modEs:"RECIBIR PARA VIVIR",blk:"A",evalua:false},
  {id:"cfm04b",o:14,es:"Los siete dones · Virtudes remos, dones velas",en:"Los siete dones · Virtudes remos, dones velas",dur:"7 min",mod:"CONF-04",modEs:"RECIBIR PARA VIVIR",blk:"B",evalua:false},
  {id:"cfm04c",o:15,es:"La imposición de manos · Samaria (Hechos 8)",en:"La imposición de manos · Samaria (Hechos 8)",dur:"4 min",mod:"CONF-04",modEs:"RECIBIR PARA VIVIR",blk:"C",evalua:false},
  {id:"cfm04d",o:16,es:"Apropiación del don · Elige uno · Pídelo antes de hacerlo",en:"Apropiación del don · Elige uno · Pídelo antes de hacerlo",dur:"2 min",mod:"CONF-04",modEs:"RECIBIR PARA VIVIR",blk:"D",evalua:true},
  {id:"cfm05a",o:17,es:"En voz de San Pablo Apóstol",en:"En voz de San Pablo Apóstol",dur:"2 min",mod:"CONF-05",modEs:"NO ES UN ACTO PRIVADO",blk:"A",evalua:false},
  {id:"cfm05b",o:18,es:"Personal no es privado · Vínculo con la Iglesia · Válido pero sin frutos",en:"Personal no es privado · Vínculo con la Iglesia · Válido pero sin frutos",dur:"7 min",mod:"CONF-05",modEs:"NO ES UN ACTO PRIVADO",blk:"B",evalua:false},
  {id:"cfm05c",o:19,es:"El saludo de paz del Obispo · Un encargo, no una cortesía",en:"El saludo de paz del Obispo · Un encargo, no una cortesía",dur:"4 min",mod:"CONF-05",modEs:"NO ES UN ACTO PRIVADO",blk:"C",evalua:false},
  {id:"cfm05d",o:20,es:"Conversatorio · ¿Qué es ser Iglesia para mí?",en:"Conversatorio · ¿Qué es ser Iglesia para mí?",dur:"2 min",mod:"CONF-05",modEs:"NO ES UN ACTO PRIVADO",blk:"D",evalua:true},
  {id:"cfm06a",o:21,es:"En voz de San Ignacio de Antioquía",en:"En voz de San Ignacio de Antioquía",dur:"2 min",mod:"CONF-06",modEs:"DAR TESTIMONIO",blk:"A",evalua:false},
  {id:"cfm06b",o:22,es:"Fuerza especial: impulsa y capacita · Edificar en fe y caridad · Testigo",en:"Fuerza especial: impulsa y capacita · Edificar en fe y caridad · Testigo",dur:"7 min",mod:"CONF-06",modEs:"DAR TESTIMONIO",blk:"B",evalua:false},
  {id:"cfm06c",o:23,es:"La figura del Obispo · Sucesor de los Apóstoles · Mitra y báculo",en:"La figura del Obispo · Sucesor de los Apóstoles · Mitra y báculo",dur:"4 min",mod:"CONF-06",modEs:"DAR TESTIMONIO",blk:"C",evalua:false},
  {id:"cfm06d",o:24,es:"El paso al servicio · Breve y verificable · Aparecer",en:"El paso al servicio · Breve y verificable · Aparecer",dur:"2 min",mod:"CONF-06",modEs:"DAR TESTIMONIO",blk:"D",evalua:true},
  {id:"cfm07a",o:25,es:"En voz de San Justino Mártir",en:"En voz de San Justino Mártir",dur:"2 min",mod:"CONF-07",modEs:"CREER CON CUENTA Y COHERENCIA",blk:"A",evalua:false},
  {id:"cfm07b",o:26,es:"Dar cuenta de la esperanza · Saber el Credo · Mente configurada, no memoria ciega",en:"Dar cuenta de la esperanza · Saber el Credo · Mente configurada, no memoria ciega",dur:"7 min",mod:"CONF-07",modEs:"CREER CON CUENTA Y COHERENCIA",blk:"B",evalua:false},
  {id:"cfm07c",o:27,es:"La Profesión de Fe · El Credo como contraseña · Los mártires",en:"La Profesión de Fe · El Credo como contraseña · Los mártires",dur:"4 min",mod:"CONF-07",modEs:"CREER CON CUENTA Y COHERENCIA",blk:"C",evalua:false},
  {id:"cfm07d",o:28,es:"El manifiesto personal · Tres líneas sobre la resurrección",en:"El manifiesto personal · Tres líneas sobre la resurrección",dur:"2 min",mod:"CONF-07",modEs:"CREER CON CUENTA Y COHERENCIA",blk:"D",evalua:true},
  {id:"cfm08a",o:29,es:"En voz de Santa Isabel de la Trinidad",en:"En voz de Santa Isabel de la Trinidad",dur:"2 min",mod:"CONF-08",modEs:"EL ENCUENTRO MADURA",blk:"A",evalua:false},
  {id:"cfm08b",o:30,es:"La información no basta · Relación viva, íntima y real · Frecuencia, no intensidad",en:"La información no basta · Relación viva, íntima y real · Frecuencia, no intensidad",dur:"7 min",mod:"CONF-08",modEs:"EL ENCUENTRO MADURA",blk:"B",evalua:false},
  {id:"cfm08c",o:31,es:"La Epíclesis · Invocar antes de pedir · «Ven»",en:"La Epíclesis · Invocar antes de pedir · «Ven»",dur:"4 min",mod:"CONF-08",modEs:"EL ENCUENTRO MADURA",blk:"C",evalua:false},
  {id:"cfm08d",o:32,es:"Rutina orante · Evangelio, silencio, invocación, examen",en:"Rutina orante · Evangelio, silencio, invocación, examen",dur:"2 min",mod:"CONF-08",modEs:"EL ENCUENTRO MADURA",blk:"D",evalua:true},
  {id:"cfm09a",o:33,es:"En voz de San Francisco de Sales",en:"En voz de San Francisco de Sales",dur:"2 min",mod:"CONF-09",modEs:"DE LA PREPARACIÓN A LA PERSEVERANCIA",blk:"A",evalua:false},
  {id:"cfm09b",o:34,es:"No es el final · Frutos: vida santa, sacramentos, caridad · El motor, no la voluntad",en:"No es el final · Frutos: vida santa, sacramentos, caridad · El motor, no la voluntad",dur:"7 min",mod:"CONF-09",modEs:"DE LA PREPARACIÓN A LA PERSEVERANCIA",blk:"B",evalua:false},
  {id:"cfm09c",o:35,es:"El Envío Litúrgico · «Ite, missa est» · Misa y misión",en:"El Envío Litúrgico · «Ite, missa est» · Misa y misión",dur:"4 min",mod:"CONF-09",modEs:"DE LA PREPARACIÓN A LA PERSEVERANCIA",blk:"C",evalua:false},
  {id:"cfm09d",o:36,es:"El plan de 30 días · Dos metas · Levántate con dulzura",en:"El plan de 30 días · Dos metas · Levántate con dulzura",dur:"2 min",mod:"CONF-09",modEs:"DE LA PREPARACIÓN A LA PERSEVERANCIA",blk:"D",evalua:true},
  {id:"cfm10a",o:37,es:"En voz de San Carlos Borromeo",en:"En voz de San Carlos Borromeo",dur:"2 min",mod:"CONF-10",modEs:"APROXIMARSE CON DISPOSICIÓN",blk:"A",evalua:false},
  {id:"cfm10b",o:38,es:"Ex opere operato · Los frutos dependen de tu apertura · Confesión previa",en:"Ex opere operato · Los frutos dependen de tu apertura · Confesión previa",dur:"7 min",mod:"CONF-10",modEs:"APROXIMARSE CON DISPOSICIÓN",blk:"B",evalua:false},
  {id:"cfm10c",o:39,es:"Los cuatro segundos en cámara lenta · El «Amén» firme",en:"Los cuatro segundos en cámara lenta · El «Amén» firme",dur:"4 min",mod:"CONF-10",modEs:"APROXIMARSE CON DISPOSICIÓN",blk:"C",evalua:false},
  {id:"cfm10d",o:40,es:"Silencio y retiro · Adoración · Confesión · Preparar la casa",en:"Silencio y retiro · Adoración · Confesión · Preparar la casa",dur:"2 min",mod:"CONF-10",modEs:"APROXIMARSE CON DISPOSICIÓN",blk:"D",evalua:true},
  {id:"cfm11a",o:41,es:"En voz de San Pedro Apóstol",en:"En voz de San Pedro Apóstol",dur:"2 min",mod:"CONF-11",modEs:"LA IMPOSICIÓN DE MANOS",blk:"A",evalua:false},
  {id:"cfm11b",o:42,es:"Desde el Antiguo Testamento · El mismo Espíritu de Pentecostés · De espectador a testigo",en:"Desde el Antiguo Testamento · El mismo Espíritu de Pentecostés · De espectador a testigo",dur:"7 min",mod:"CONF-11",modEs:"LA IMPOSICIÓN DE MANOS",blk:"B",evalua:false},
  {id:"cfm11c",o:43,es:"Manos extendidas sobre el grupo · Techo y protección · Descarga apostólica",en:"Manos extendidas sobre el grupo · Techo y protección · Descarga apostólica",dur:"4 min",mod:"CONF-11",modEs:"LA IMPOSICIÓN DE MANOS",blk:"C",evalua:false},
  {id:"cfm11d",o:44,es:"Oración de apertura · Las manos sobre el pecho",en:"Oración de apertura · Las manos sobre el pecho",dur:"2 min",mod:"CONF-11",modEs:"LA IMPOSICIÓN DE MANOS",blk:"D",evalua:true},
  {id:"cfm12a",o:45,es:"En voz de San Ireneo de Lyon",en:"En voz de San Ireneo de Lyon",dur:"2 min",mod:"CONF-12",modEs:"LA UNCIÓN CON EL CRISMA",blk:"A",evalua:false},
  {id:"cfm12b",o:46,es:"El sello · Como el sello de un rey · Propiedad de Dios, apto para el combate",en:"El sello · Como el sello de un rey · Propiedad de Dios, apto para el combate",dur:"7 min",mod:"CONF-12",modEs:"LA UNCIÓN CON EL CRISMA",blk:"B",evalua:false},
  {id:"cfm12c",o:47,es:"La cruz en la frente · Vertical y horizontal · La comunión de los santos",en:"La cruz en la frente · Vertical y horizontal · La comunión de los santos",dur:"4 min",mod:"CONF-12",modEs:"LA UNCIÓN CON EL CRISMA",blk:"C",evalua:false},
  {id:"cfm12d",o:48,es:"Compromiso de testimonio · No discutas, cuenta · Volver a intentarlo",en:"Compromiso de testimonio · No discutas, cuenta · Volver a intentarlo",dur:"2 min",mod:"CONF-12",modEs:"LA UNCIÓN CON EL CRISMA",blk:"D",evalua:true},
];
const COURSES={
  bautismo:[
    {id:"bv1",o:1,es:"¿Qué es el Bautismo?",en:"What is Baptism?",dur:"15 min"},
    {id:"bv2",o:2,es:"El Agua: Símbolo de vida nueva",en:"Water: Symbol of New Life",dur:"15 min"},
    {id:"bv3",o:3,es:"El Rito Bautismal y sus signos",en:"The Baptismal Rite and Its Signs",dur:"15 min"},
    {id:"bv_r",o:4,es:"Repaso Final — Bautismo",en:"Final Review — Baptism",dur:"15 min",repaso:true},
  ],
  primera_comunion:[
    {id:"pv1",o:1,es:"La Eucaristía en la historia de la salvación",en:"The Eucharist in Salvation History",dur:"15 min"},
    {id:"pv2",o:2,es:"La Presencia Real: La Transubstanciación",en:"The Real Presence: Transubstantiation",dur:"15 min"},
    {id:"pv3",o:3,es:"Preparación espiritual para la Primera Comunión",en:"Spiritual Preparation",dur:"15 min"},
    {id:"pv4",o:4,es:"La Santa Misa: El Sacrificio Eucarístico",en:"Holy Mass: The Eucharistic Sacrifice",dur:"15 min"},
    {id:"pv_r",o:5,es:"Repaso Final — Primera Comunión",en:"Final Review — First Communion",dur:"15 min",repaso:true},
  ],
  confirmacion:CONFIRMACION,
  prebautismal:[
    {id:"pb1",o:1,es:"El sentido y propósito del Bautismo Infantil",en:"The Meaning of Infant Baptism",dur:"15 min"},
    {id:"pb2",o:2,es:"El papel de los padres en el Bautismo",en:"Parents' Role in Baptism",dur:"15 min"},
    {id:"pb3",o:3,es:"Los signos y símbolos del Bautismo",en:"Signs and Symbols of Baptism",dur:"15 min"},
    {id:"pb_r",o:4,es:"Repaso Final — Formación Prebautismal",en:"Final Review — Pre-Baptismal",dur:"15 min",repaso:true},
  ],
  catequista:[
    {id:"cq1",o:1,es:"1.1 ¿Qué es la Neuropedagogía? Definición, neuromitos y neuroplasticidad",en:"1.1 What is Neuropedagogy? Definition, neuromyths and neuroplasticity",dur:"15 min"},
    {id:"cq2",o:2,es:"1.2 El encuentro entre Ciencia y Fe. Evitar el reduccionismo biológico",en:"1.2 The Encounter between Science and Faith. Avoiding biological reductionism",dur:"15 min"},
    {id:"cq3",o:3,es:"1.3 Anatomía básica para catequistas. El cerebro triuno simplificado",en:"1.3 Basic Anatomy for Catechists. The simplified triune brain",dur:"15 min"},
    {id:"cq_r",o:4,es:"Repaso Final — Módulo I",en:"Final Review — Module I",dur:"15 min",repaso:true},
  ],
};

// ─── RESÚMENES POR TEMA (repaso antes de la evaluación) ──────────
// Clave = código del tema (mod). Cada punto: {tipo:'doctrina'|'practica', texto}.
// Al menos 1 doctrina y 1 práctica por tema, tono individual ("tú"), sin preguntas.
// Por idioma (es por ahora; el equipo de contenido añade/afina el resto y otros
// idiomas desde el panel en el futuro). Si un tema no tiene resumen, el modal cae
// al repaso por bloques.
const RESUMENES={
  "KER-01":{es:[
    {tipo:"doctrina",texto:"Dios no es un vigilante que anota tus errores: es un Padre que toma la iniciativa y sale a buscarte primero."},
    {tipo:"doctrina",texto:"Él te ama porque es Padre, no porque te lo ganes; no puedes hacer que te ame más ni menos."},
    {tipo:"doctrina",texto:"El cristianismo no es subir una escalera hasta Dios, sino dejarte alcanzar por Él, que bajó la escalera."},
    {tipo:"practica",texto:"Antes de seguir, nombra en silencio qué te impide dejarte amar hoy: orgullo, culpa o miedo."},
  ]},
  "KER-02":{es:[
    {tipo:"doctrina",texto:"El pecado no es romper una regla: es una enfermedad que daña tres relaciones —con Dios, con los demás y contigo mismo."},
    {tipo:"doctrina",texto:"El primer efecto del pecado no fue un castigo, sino esconderte por vergüenza; reconocerlo libera."},
    {tipo:"practica",texto:"Nombra una debilidad recurrente, sin justificarte, y dísela a Dios: «Aquí necesito que me rescates»."},
  ]},
  "KER-03":{es:[
    {tipo:"doctrina",texto:"La Cruz no es una tragedia ni la ira de Dios descargada en su Hijo: es el pago de tu rescate."},
    {tipo:"doctrina",texto:"Cristo asume tu lejanía —hasta la muerte— para devolverte al Padre, y resucita."},
    {tipo:"practica",texto:"Ante un crucifijo, en silencio, repite y hazla tuya una sola frase: «Lo hiciste por mí»."},
  ]},
  "KER-04":{es:[
    {tipo:"doctrina",texto:"La fe no es saber doctrina: es confiarle tu vida a Cristo. Si no hay nada en juego, es solo opinión."},
    {tipo:"doctrina",texto:"Conversión (metanoia) no es una vida más gris: es un cambio de rumbo que responde al amor recibido."},
    {tipo:"practica",texto:"Da hoy un primer paso concreto, que se note y que te cueste algo."},
  ]},
  "KER-05":{es:[
    {tipo:"doctrina",texto:"El Espíritu Santo no es una energía: es Dios mismo, Persona, don de Cristo resucitado."},
    {tipo:"doctrina",texto:"Él despierta, fortalece y sostiene tu fe; el reto no es empezar, es durar."},
    {tipo:"practica",texto:"Antes de empezar tu día, pídele que tome el control: «Ven, toma el volante»."},
  ]},
  "KER-06":{es:[
    {tipo:"doctrina",texto:"El encuentro con Cristo siempre crea comunidad y servicio: no existe un «cristianismo de sofá»."},
    {tipo:"doctrina",texto:"La prueba de una conversión real es la reconciliación: perdonar como fuiste perdonado."},
    {tipo:"practica",texto:"Haz esta semana una caridad concreta por una persona con nombre, y que no se entere nadie."},
  ]},
  "TC1-01":{es:[
    {tipo:"doctrina",texto:"Dios no es una energía ni una fuerza impersonal: es un Padre que conoce y quiere a cada uno por su nombre."},
    {tipo:"doctrina",texto:"«Creación de la nada» (ex nihilo) significa que todo lo que existe es don gratuito, no un accidente ni una emanación."},
    {tipo:"doctrina",texto:"Solo una Persona deja el tipo de vacío que inquieta el corazón; a una energía se la usa, a un Padre se le responde."},
    {tipo:"practica",texto:"Mira hoy algo vivo o real creado por Dios, sin teléfono de por medio, y déjate asombrar un instante."},
  ]},
  "TC1-02":{es:[
    {tipo:"doctrina",texto:"El mal no es una sustancia que Dios haya creado: es una privación del bien, como la oscuridad es ausencia de luz."},
    {tipo:"doctrina",texto:"Dios no fuerza el mal: lo permite, y sabe sacar un bien mayor incluso de lo que a nosotros nos destroza."},
    {tipo:"practica",texto:"Cambia «¿por qué a mí?» por «Señor, ¿para qué permites esto?»: el «para qué» abre el futuro, el «por qué» cierra en el pasado."},
  ]},
  "TC1-03":{es:[
    {tipo:"doctrina",texto:"Dios es pedagogo y paciente: no improvisa, prepara la salvación por etapas a lo largo de la historia."},
    {tipo:"doctrina",texto:"Su método son las Alianzas: pactos con que fue educando a la humanidad hasta la plenitud en Cristo."},
    {tipo:"doctrina",texto:"Tu vida no es el final de la historia, sino su penúltimo capítulo: estás en el tramo decisivo, no obligado a resolverlo todo."},
    {tipo:"practica",texto:"Agradece hoy ser parte de una historia que empezó antes de ti y no termina contigo."},
  ]},
  "TC1-04":{es:[
    {tipo:"doctrina",texto:"Que Dios hable con palabras humanas se llama condescendencia: «desciende con» nosotros para hacerse entender."},
    {tipo:"doctrina",texto:"La Escritura tiene dos autores reales: Dios que inspira y un autor humano con su estilo; por eso Isaías no suena como Marcos."},
    {tipo:"practica",texto:"Antes de leer la Biblia, pregunta: «Señor, ¿qué me quieres decir hoy?», y responde algo a la frase que se te quede."},
  ]},
  "TC1-05":{es:[
    {tipo:"doctrina",texto:"La inspiración del Espíritu Santo no es un dictado palabra por palabra: Dios se sirve de autores reales y libres."},
    {tipo:"doctrina",texto:"La inspiración garantiza la verdad que Dios puso para nuestra salvación, no datos de astronomía o geología."},
    {tipo:"practica",texto:"Aprende a navegar una cita: libro, capítulo, versículo (Juan 3, 16) — y recuerda que «3, 16» y «3:16» son lo mismo."},
  ]},
  "TC1-06":{es:[
    {tipo:"doctrina",texto:"El sentido literal —lo que el autor quiso decir— es la base de todos los demás; «literal» no es «literalista»."},
    {tipo:"doctrina",texto:"Sobre el sentido literal se apoyan los sentidos espirituales; leer bien una parábola es saber que es una parábola."},
    {tipo:"practica",texto:"Toma el hábito de leer el Evangelio de Marcos cinco minutos al día; el enemigo no es la pereza, sino el plan demasiado grande."},
  ]},
  "TC1-07":{es:[
    {tipo:"doctrina",texto:"Jesucristo es verdadero Dios y verdadero hombre: cien por ciento de cada cosa, no una mezcla ni un disfraz."},
    {tipo:"doctrina",texto:"Esa unión de dos naturalezas en una sola Persona se llama unión hipostática: sin confusión, sin cambio, sin división, sin separación."},
    {tipo:"practica",texto:"Reza el Ángelus al mediodía: «Y el Verbo se hizo carne, y habitó entre nosotros»."},
  ]},
  "TC1-08":{es:[
    {tipo:"doctrina",texto:"La Cruz no es la ira de Dios descargada en un inocente: castigar a un inocente no sería justicia."},
    {tipo:"doctrina",texto:"«Tanto amó Dios al mundo que entregó a su Hijo»: la Cruz es entrega por amor, no desahogo de un Dios furioso."},
    {tipo:"practica",texto:"Ante lo que te duela, haz la «ofrenda del dolor»: «Señor, lo uno a tu Cruz», para darle un destino en vez de dejarlo estéril."},
  ]},
  "TC1-09":{es:[
    {tipo:"doctrina",texto:"La Iglesia es Cuerpo Místico de Cristo: la unión es real aunque no biológica; no es un club del que uno se da de alta y de baja."},
    {tipo:"doctrina",texto:"Sus cuatro notas son: Una, Santa, Católica y Apostólica; es santa porque su santidad viene de Cristo, no de sus miembros."},
    {tipo:"practica",texto:"Reza por el Papa y por quien te cueste de la Iglesia: no se puede tratar como enemigo a alguien por quien rezas."},
  ]},
  "TC1-10":{es:[
    {tipo:"doctrina",texto:"La fe tiene una sola fuente —Cristo— que nos llega por tres pilares inseparables."},
    {tipo:"doctrina",texto:"Esos pilares son la Sagrada Escritura, la Sagrada Tradición (lo recibido de los apóstoles) y el Magisterio que la interpreta."},
    {tipo:"practica",texto:"Usa el Catecismo como libro de consulta ante una duda concreta; sus citas son números de párrafo, iguales en toda edición e idioma."},
  ]},
  "TC1-11":{es:[
    {tipo:"doctrina",texto:"La gracia santificante no es una ayuda puntual ni un premio: es la vida misma de Dios dentro de ti, un estado del alma."},
    {tipo:"doctrina",texto:"El pecado venial enferma esa vida; el pecado mortal la destruye. Por eso importa cuidarla."},
    {tipo:"practica",texto:"Haz un examen de conciencia de dos minutos al acostarte, empezando por agradecer algo bueno del día, no por las faltas."},
  ]},
  "TC1-12":{es:[
    {tipo:"doctrina",texto:"Los sacramentos son signos eficaces: no solo señalan, hacen lo que significan; son siete e instituidos por Cristo."},
    {tipo:"doctrina",texto:"Actúan «ex opere operato», por la obra misma: es Cristo quien actúa, no la santidad del ministro ni la fuerza de tu sentimiento."},
    {tipo:"practica",texto:"No dudes del perdón recibido en la confesión: el escrúpulo es la duda que vuelve sobre lo ya perdonado; apóyate en Cristo, no en tus emociones."},
  ]},
  "TC1-13":{es:[
    {tipo:"doctrina",texto:"Una prefiguración es un hecho real del Antiguo Testamento que anticipa algo mayor: Dios usa la naturaleza como lenguaje."},
    {tipo:"doctrina",texto:"El agua del diluvio destruye y a la vez salva a los que están dentro del arca: así el signo prepara el bautismo."},
    {tipo:"practica",texto:"En la próxima Misa, haz un «despertar litúrgico»: percibe con los sentidos los signos (agua, luz, gesto), no solo con la cabeza."},
  ]},
  "TC1-14":{es:[
    {tipo:"doctrina",texto:"Los sacramentales los instituye la Iglesia, no Cristo; no dan la gracia por sí mismos, sino que disponen para recibirla."},
    {tipo:"doctrina",texto:"Actúan según la fe y la devoción de quien los usa; «bendecir» (benedicere) es «decir bien» de algo y reconocerlo como de Dios."},
    {tipo:"practica",texto:"Como bautizado, bendice lo cotidiano: la mesa, a tus hijos, tu casa; es un derecho de tu bautismo."},
  ]},
  "TC1-15":{es:[
    {tipo:"doctrina",texto:"Para Santa Teresa, la oración es «tratar de amistad con quien sabemos nos ama»: no una audiencia que haya que rezar «bien»."},
    {tipo:"doctrina",texto:"La oración se construye con frecuencia, no con intensidad esporádica: poco, pero todos los días."},
    {tipo:"practica",texto:"Aparta un «diezmo del tiempo»: un cuarto de hora de silencio innegociable al día, que no se mueve aunque surja algo."},
  ]},
  "TC1-16":{es:[
    {tipo:"doctrina",texto:"El sincretismo mezcla sistemas religiosos incompatibles como piezas intercambiables; el Primer Mandamiento lo excluye."},
    {tipo:"doctrina",texto:"La relación con Dios es de otra categoría: Él es Persona, no una energía que se manipula con una técnica."},
    {tipo:"practica",texto:"Revisa con serenidad, a plena luz y sin miedo, qué objetos o prácticas usas buscando control; la purificación es una renuncia consciente, no un ritual."},
  ]},
  "CONF-01":{es:[
    {tipo:"doctrina",texto:"La Confirmación perpetúa Pentecostés: no lo conmemora, lo continúa. El mismo Espíritu que descendió entonces se da hoy a cada bautizado."},
    {tipo:"doctrina",texto:"Es el sacramento del Espíritu por excelencia: no viene a hacer otra cosa, viene Él mismo como don. En el Bautismo entra a habitar; en la Confirmación se derrama para enviar."},
    {tipo:"practica",texto:"No esperes una experiencia espectacular: será un rito breve, con aceite y sin fenómenos visibles, y será exactamente lo mismo que aquella mañana."},
    {tipo:"practica",texto:"Reza cada día hasta tu Confirmación, aunque no sientas nada: «Ven, Espíritu Santo, llena mi corazón y enciende en mí el fuego de tu amor»."},
  ]},
  "CONF-02":{es:[
    {tipo:"doctrina",texto:"La Confirmación no empieza de cero: madura y lleva a su plenitud la configuración con Cristo iniciada en el Bautismo, como la semilla que crece."},
    {tipo:"doctrina",texto:"Imprime un carácter indeleble que no se borra nunca —ni por el pecado ni por el abandono—, por eso se recibe una sola vez."},
    {tipo:"doctrina",texto:"Se recibe con uso de razón: exige que la fe sea tuya, no heredada; es el día en que asumes personalmente lo que otros dijeron por ti."},
    {tipo:"practica",texto:"Escribe a mano qué crees hoy, qué buscas al confirmarte y qué temores tienes; enséñale al menos el tercer punto a tu catequista o padrino."},
  ]},
  "CONF-03":{es:[
    {tipo:"doctrina",texto:"La esencia del sacramento es breve: la unción con el Santo Crisma en la frente junto con la fórmula, dichas a la vez. Todo lo demás la enmarca."},
    {tipo:"doctrina",texto:"La fórmula es «Recibe por esta señal el Don del Espíritu Santo»: no te dan algo suyo, te dan a Él. Tu única palabra, el «Amén», significa «así es, lo asumo»."},
    {tipo:"doctrina",texto:"Ser ungido estaba reservado a reyes, sacerdotes y profetas; en la Confirmación eso se reparte a cualquier bautizado."},
    {tipo:"practica",texto:"Ensaya ese momento con los ojos cerrados y pregúntate qué cambia en tu vida diaria estar sellado por Dios; ese día, no te pierdas esos cuatro segundos."},
  ]},
  "CONF-04":{es:[
    {tipo:"doctrina",texto:"Los siete dones (del profeta Isaías) no son superpoderes, sino disposiciones que te dejan mover por Dios: las virtudes son remos, los dones son velas."},
    {tipo:"doctrina",texto:"Cada don obra en la vida corriente: sabiduría, entendimiento, consejo, fortaleza (el aguante largo), ciencia, piedad y temor de Dios (cuidado de no dañar a quien te ama, no miedo al castigo)."},
    {tipo:"practica",texto:"Elige un solo don, el que más te falte hoy, y una acción concreta y verificable para esta semana; y pídelo antes de hacerlo, porque los dones se piden, no se entrenan."},
  ]},
  "CONF-05":{es:[
    {tipo:"doctrina",texto:"Personal no es lo mismo que privado: la fe es personal, pero la Confirmación te ata más estrecho a la Iglesia, no te da más intimidad a solas."},
    {tipo:"doctrina",texto:"El sacramento se recibe válidamente aunque estés mal dispuesto, pero los frutos dependen de ti: sin vínculo real con la comunidad puede quedar un rito vacío."},
    {tipo:"practica",texto:"El saludo de paz del Obispo es un encargo: la paz de tu comunidad pasa a ser asunto tuyo. Pregúntate si alguien notaría que dejaste de ir, y sal del conversatorio con algo concreto que hacer."},
  ]},
  "CONF-06":{es:[
    {tipo:"doctrina",texto:"El Espíritu te impulsa (hace que quieras) y te capacita (hace que puedas) con una «fuerza especial» para ser testigo y edificar el Cuerpo en la fe y en la caridad."},
    {tipo:"doctrina",texto:"La Confirmación te ata a la misma misión de los Apóstoles; por eso la da el Obispo, sucesor directo de ellos, cuyo báculo es un cayado de pastor, no un cetro de mando."},
    {tipo:"practica",texto:"Dar testimonio es no esconderlo, ser fiable y saber responder. Comprométete hoy a un servicio eclesial breve y verificable en tu parroquia: empieza apareciendo."},
  ]},
  "CONF-07":{es:[
    {tipo:"doctrina",texto:"Hay que poder «dar razón de la esperanza» con mansedumbre y respeto; eso empieza por saber qué dice el Credo, no por dominar todo el Catecismo."},
    {tipo:"doctrina",texto:"No se trata de memorizar dogmas ciegamente, sino de tener la mente configurada con la verdad para que los actos coincidan con lo que profesan los labios."},
    {tipo:"doctrina",texto:"Tener dudas no es lo contrario de la fe —lo es la indiferencia—; basta con que las dudas tengan nombre para poder trabajarlas."},
    {tipo:"practica",texto:"Escribe tres líneas, en primera persona, sobre cómo el que Jesús resucitara cambia tus decisiones concretas de esta semana; si no sale nada, llévalo así a tu catequista."},
  ]},
  "CONF-08":{es:[
    {tipo:"doctrina",texto:"La catequesis informativa no basta: la gracia se asimila en una relación viva, íntima y real con el Dios Trinitario —al Padre le hablas como hijo, al Hijo lo sigues, al Espíritu lo invocas."},
    {tipo:"doctrina",texto:"La oración personal es tu epíclesis diaria: como el sacerdote sobre el altar, pides que el Espíritu descienda sobre una materia común, que eres tú."},
    {tipo:"practica",texto:"Sostén una rutina diaria de unos diez minutos (Evangelio del día, cinco minutos de silencio, invocación al Espíritu y examen al acostarte); si fallas un día, sigue al siguiente sin castigarte."},
  ]},
  "CONF-09":{es:[
    {tipo:"doctrina",texto:"La Confirmación no cierra la iniciación: el orden original es Bautismo, Confirmación y Eucaristía, que es la que culmina porque se repite toda la vida."},
    {tipo:"doctrina",texto:"Los frutos pedidos son vida santa (hacer bien, por amor, lo de cada día), perseverancia en los sacramentos (Eucaristía dominical y Confesión frecuente) y testimonio de caridad."},
    {tipo:"doctrina",texto:"Nada de esto se mantiene por fuerza de voluntad: lo recibido es el motor; los frutos crecen cuando dejas que Otro trabaje, como el árbol plantado junto al agua."},
    {tipo:"practica",texto:"Escribe antes del día tu plan para los 30 días siguientes, con solo dos metas (un hábito de Misa u oración y una caridad en silencio); y cuando falles, levántate con dulzura y vuelve al domingo siguiente."},
  ]},
  "CONF-10":{es:[
    {tipo:"doctrina",texto:"El sacramento actúa por obra de Dios (ex opere operato), con independencia de lo que sientas; pero los frutos dependen de qué tan abierto esté tu corazón."},
    {tipo:"doctrina",texto:"Por eso la Iglesia pide llegar en estado de gracia mediante la Confesión previa: no se entra bien en una casa cerrada por dentro."},
    {tipo:"practica",texto:"Dedica los días previos a silencio y retiro, adoración y confesión, y deja la víspera lo más vacía posible; el día de la Confirmación, di tu «Amén» fuerte y claro."},
  ]},
  "CONF-11":{es:[
    {tipo:"doctrina",texto:"Imponer las manos, desde el Antiguo Testamento, es transmitir una misión o un don; en la Confirmación el Obispo invoca con ese gesto al mismo Espíritu de Pentecostés."},
    {tipo:"doctrina",texto:"Su efecto es pasar de espectador a testigo: nadie lo hace por decisión propia, sino porque alguien le entrega algo. Samaria muestra que desde el inicio hubo algo que el Bautismo no daba."},
    {tipo:"practica",texto:"Cada noche hasta tu Confirmación, pon las manos sobre tu pecho y pide: «Ven, Espíritu Santo, desciende sobre mí y prepárame»; es ponerte en posición de recibir."},
  ]},
  "CONF-12":{es:[
    {tipo:"doctrina",texto:"La unción con el Crisma es un sello, un carácter indeleble: como el sello de un rey, dice de quién vienes, te da autoridad y no se puede quitar sin destruir."},
    {tipo:"doctrina",texto:"Eres propiedad de Dios —no una cosa, sino alguien que ya no está disponible para cualquier cosa y a quien Alguien defiende— y quedas apto para el combate, es decir, habilitado."},
    {tipo:"doctrina",texto:"La cruz en la frente lleva el programa entero: el trazo vertical une a Dios contigo, el horizontal te extiende a los demás; el signo de paz te integra en la comunión de los santos."},
    {tipo:"practica",texto:"Identifica una situación concreta donde te avergüenza decir que eres cristiano y, sin discutir, simplemente no te desmientas: cuenta un hecho tuyo. Si fallas, vuelve a intentarlo mañana."},
  ]},
  "UNC-01":{es:[
    {tipo:"doctrina",texto:"La enfermedad no es un castigo de Dios ni un regalo disfrazado: es un mal contra el que hay que luchar con médicos y tratamientos, y a la vez un lugar donde pueden cambiar cosas hondas."},
    {tipo:"doctrina",texto:"En la parábola del samaritano, la posada a la que lleva al herido es la Iglesia: no un club de sanos, sino el lugar donde se cuida al que sufre."},
    {tipo:"practica",texto:"Si visitas a un enfermo y no sabes qué decir, no prepares nada: siéntate, toma su mano y quédate; el silencio incómodo lo es para el que llega, no para el que está en la cama."},
    {tipo:"practica",texto:"Escribe hoy, con calma, una oración para el día en que la salud falle; y si ya cuidas a alguien, recuerda que no tienes que poder con esto solo."},
  ]},
  "UNC-02":{es:[
    {tipo:"doctrina",texto:"El sacramento está fundado en cuatro líneas de Santiago: el enfermo llama a los presbíteros, que oran «sobre» él y lo ungen con aceite en el nombre del Señor."},
    {tipo:"doctrina",texto:"Como todo sacramento, une palabras y materia que se toca; y «el Señor hará que se levante» se cumple siempre: a veces de la cama, y al final, de la muerte."},
    {tipo:"practica",texto:"Aprende de memoria la frase de Santiago y guarda hoy en el teléfono el número de tu parroquia; el día que haga falta nadie tendrá cabeza para buscarlo."},
  ]},
  "UNC-03":{es:[
    {tipo:"doctrina",texto:"Un sacramento es un encuentro real con Cristo a través de algo que se ve y se toca; no lo produce el enfermo, así que funciona aunque esté agotado, sedado o con miedo."},
    {tipo:"doctrina",texto:"No es magia ni amuleto: la magia busca un resultado, el sacramento abre una puerta y deja entrar a Alguien. Las manos piden el Espíritu y el aceite dice: aquí, sobre esta persona."},
    {tipo:"practica",texto:"El deseo de un amigo y el sacramento son cosas distintas y hacen falta las dos: haz la visita y la llamada, porque acompañar cada semana solo lo puedes hacer tú."},
  ]},
  "UNC-04":{es:[
    {tipo:"doctrina",texto:"Se pide en tres situaciones y ninguna es la agonía: enfermedad grave, fragilidad por la edad, o la víspera de una operación seria; y se puede repetir cuando la enfermedad se agrava."},
    {tipo:"doctrina",texto:"Se administra aunque el enfermo ya no esté consciente, si habría querido recibirla; pedirla a tiempo no es rendirse, sino buscar fuerzas antes de necesitarlas."},
    {tipo:"practica",texto:"Decidan en casa, estando todos sanos, quién llama al sacerdote, guarden el teléfono de la parroquia y dejen de tratar su llegada como una mala señal."},
  ]},
  "UNC-05":{es:[
    {tipo:"doctrina",texto:"El ministro es solo un sacerdote u obispo, que actúa in persona Christi; que los demás no unjan no hace valer menos su trabajo: son tareas distintas y el enfermo necesita las dos."},
    {tipo:"doctrina",texto:"La materia es aceite bendecido por el obispo el Jueves Santo; la forma pide «te ayude» y «te conforte», no «te cure». La unción se hace en la frente (lo que se piensa) y en las manos (lo que se hizo)."},
    {tipo:"practica",texto:"Pregúntate qué es lo que solo tú puedes hacer por el enfermo —estar el martes por la tarde, hablarle de algo que no sea su enfermedad— y hazlo esta semana, sin esperar nada."},
  ]},
  "UNC-06":{es:[
    {tipo:"doctrina",texto:"La Unción da fuerza y paz, une el sufrimiento al de Cristo, perdona los pecados si no se pudo confesar, a veces devuelve la salud (en cuarto lugar, «si conviene») y prepara para el último paso."},
    {tipo:"doctrina",texto:"No es una pastilla ni garantiza la curación; cuando alguien no se cura, nunca es porque faltó fe. A San Pablo, que pidió tres veces, se le dijo: «Te basta mi gracia»."},
    {tipo:"practica",texto:"Si acompañaste a alguien que murió y alguna vez pensaste que no creíste lo suficiente, suéltalo: estuviste ahí, que es lo que se te pedía, y eso ya está hecho y no se deshace."},
  ]},
  "UNC-07":{es:[
    {tipo:"doctrina",texto:"Es un sacramento de fe, pero no pide una fe fuerte: basta no cerrar la puerta, querer recibirlo. La sequedad y el enojo con Dios no descalifican —lo contrario de la fe es la indiferencia."},
    {tipo:"doctrina",texto:"La disposición que cuenta es la confianza, que no es un sentimiento sino una decisión: se puede tomar sin ganas, entre dientes y sin creérsela del todo, y vale igual."},
    {tipo:"practica",texto:"Aprende ahora, estando bien, una oración de abandono que pida primero curarte; si hoy no puedes decir «llévame contigo», di solo la primera mitad: se llega por partes."},
  ]},
  "UNC-08":{es:[
    {tipo:"doctrina",texto:"El sacramento es de toda la Iglesia: el enfermo, desde su cama, contribuye al bien de todos, y si no puede ir a la parroquia, es la parroquia la que debe ir a él."},
    {tipo:"doctrina",texto:"Las manos extendidas del sacerdote representan a toda la Iglesia —viva y difunta— sosteniendo a esa persona: no le quitan la enfermedad, se ponen encima como un techo."},
    {tipo:"practica",texto:"Pide en la parroquia que lleven la Comunión al enfermo y que lo nombren en la Misa, y releva unas horas al que lo cuida —a quien nadie visita—; elige un nombre y hazlo esta semana."},
  ]},
  "UNC-09":{es:[
    {tipo:"doctrina",texto:"La Unción no es el último sacramento: el último es la Comunión como Viático, «provisiones para el viaje». Primero se unge para poder con la enfermedad; si llega el final, se da de comer para el camino."},
    {tipo:"doctrina",texto:"Nadie se pierde por un problema de horarios: Dios no está atado a sus sacramentos. Por quien murió sin recibirlos todavía se puede rezar y ofrecer una Misa."},
    {tipo:"practica",texto:"En una casa con un enfermo, sostén una oración diaria corta (el salmo 23, leído en voz alta aunque duerma), pide que le lleven la Comunión y no desaparezcas de la parroquia durante la enfermedad."},
  ]},
  "REC-01":{es:[
    {tipo:"doctrina",texto:"El arrepentimiento a solas alcanza el perdón de Dios, pero no da que otro te lo diga en voz alta; por eso hay quien lleva años perdonándose solo y sigue cargando lo mismo."},
    {tipo:"doctrina",texto:"La confesión no es un invento clerical: la tarde de la resurrección Cristo sopló sobre los apóstoles y les dio el encargo de perdonar. Convertirse no es «ser mejor», es darse la vuelta."},
    {tipo:"doctrina",texto:"Las llaves de Pedro son para «atar y desatar», verbos de cuerdas: el mal no te encierra, te ata; la absolución no se gana ni se merece, se recibe."},
    {tipo:"practica",texto:"Lee Juan 20, 19-23 y escribe a mano, solo para ti y sin adjetivos, a qué te está llamando Dios a volver ahora; esta semana basta con haberlo nombrado."},
  ]},
  "REC-02":{es:[
    {tipo:"doctrina",texto:"El pecado no es romper una regla lejana ni un mero problema psicológico: es una ruptura en una relación, hacer daño a alguien cercano; y lo que se hace a solas también llega a los demás."},
    {tipo:"doctrina",texto:"No todo pesa igual: para que algo sea grave hacen falta materia seria, saberlo perfectamente y plena libertad. Una conciencia que lo pesa todo igual está estropeada."},
    {tipo:"doctrina",texto:"La confesión no borra lo que pasó ni deshace la historia: te devuelve a ti y te vuelve a poner en camino, que es lo único que hace falta para luego reparar."},
    {tipo:"practica",texto:"Identifica un área donde siempre te justificas, escríbela con su nombre y sin eufemismos, y reza el Salmo 51: mira lo que hiciste, pero no te quedes ahí castigándote."},
  ]},
  "REC-03":{es:[
    {tipo:"doctrina",texto:"La confesión empieza antes, a solas, con el examen de conciencia; no es una auditoría que busca todo, sino ver con claridad una o dos cosas: qué actitudes me alejan y dónde hice daño."},
    {tipo:"doctrina",texto:"Como el polvo en un rayo de luz, examinarse no ensucia a nadie: solo hace visible lo que ya estaba. Y esa luz viene de fuera, por eso se lee primero el Evangelio y después uno se mira."},
    {tipo:"practica",texto:"Haz un examen de diez minutos con reloj, tras leer un pasaje (por ejemplo Mateo 5), anota tres actitudes, cierra el cuaderno y no vuelvas a él hasta confesarte: esto es para llevarlo, no para rumiarlo."},
  ]},
  "REC-04":{es:[
    {tipo:"doctrina",texto:"El remordimiento duele por lo que me va a pasar a mí y por eso no cura; la contrición duele por el daño hecho a otro. La prueba: «si nadie se hubiera enterado, ¿me seguiría doliendo?»."},
    {tipo:"doctrina",texto:"No hace falta el dolor perfecto: basta la contrición imperfecta, la que nace del miedo o de estar harto de uno mismo. El sentimiento no es el requisito; la decisión de ir, sí."},
    {tipo:"doctrina",texto:"El propósito de enmienda no es prometer no volver a caer, sino decidir pelearlo cortando la ocasión; el dolor que hunde no viene de Dios: lo de Dios te pone de pie y te manda a hacer algo."},
    {tipo:"practica",texto:"Identifica la ocasión concreta donde siempre cae lo mismo y córtala esta semana con algo que no dependa de aguantarte; si no puedes solo, pedir ayuda no es falta de fe."},
  ]},
  "REC-05":{es:[
    {tipo:"doctrina",texto:"Los cinco miedos típicos no son obstáculo: puedes decir el acto de contrición con tus palabras, un pecado olvidado de buena fe queda perdonado, y no existe nada que un sacerdote no pueda absolver en nombre de Cristo."},
    {tipo:"doctrina",texto:"Dentro uno se acusa de lo suyo, claro y breve, sin nombrar a terceros y sin justificarse: el que se explica no se confiesa, se defiende, y ahí no hace falta abogado."},
    {tipo:"practica",texto:"Escribe en una tarjeta tu frase de entrada («Padre, hace mucho que no me confieso…»), apunta detrás las tres cosas del examen, y pon en el calendario, con día y hora, el horario de confesiones de una parroquia."},
  ]},
  "REC-06":{es:[
    {tipo:"doctrina",texto:"El sacerdote no perdona con poder propio: actúa in persona Christi, por eso dice «yo te absuelvo». De suyo discierne, cura y orienta, y lo dicho en voz alta ante alguien ya no se puede seguir negociando."},
    {tipo:"doctrina",texto:"El confesionario no sustituye al psicólogo ni al revés: la confesión quita la culpa real por algo que hiciste; la angustia, el duelo o una enfermedad se tratan aparte. Hacen falta las dos puertas."},
    {tipo:"practica",texto:"La rejilla está para protegerte a ti, no para esconder al sacerdote, y puedes elegir rejilla o cara a cara; compara contárselo a un amigo, a un psicólogo y a un confesor, y mira cuál de las tres te falta."},
  ]},
  "REC-07":{es:[
    {tipo:"doctrina",texto:"La penitencia no es una multa ni el precio del perdón —que ya se dio gratis—: es rehabilitación. El pecado deja culpa, que se absuelve, y hábitos, que se desandan con ejercicio."},
    {tipo:"doctrina",texto:"Se cura con lo contrario (contra la avaricia, dar; contra la soberbia, servir sin que se note), y cuando hay daño concreto hay que reparar: lo tomado se devuelve, y el buen nombre también."},
    {tipo:"doctrina",texto:"Ninguna reparación seria se decide a solas ni se hace revelando lo que hizo otro; si lo que hay que devolver es imposible, se repara lo que se pueda y lo demás se da a otros. Nadie queda atrapado por una deuda impagable."},
    {tipo:"practica",texto:"Elige un daño concreto y repara el paso más pequeño a tu alcance esta semana, sin explicarte, sin esperar respuesta y sin contarlo; si es grande o toca a terceros, llévalo antes a un confesor."},
  ]},
  "REC-08":{es:[
    {tipo:"doctrina",texto:"La absolución quita la culpa de raíz, pero no la costumbre: como un tratamiento, la primera toma cura y hay que seguir. Volver con el mismo pecado durante años no es el fracaso del sacramento, es el sacramento funcionando."},
    {tipo:"doctrina",texto:"Entre una confesión y otra sostienen cuatro cosas pequeñas: un momento fijo de oración, un examen breve de noche, la Misa dominical y alguien con quien hablar de esto. El mínimo es una vez al año si hay pecado grave; para la mayoría, una vez al mes funciona."},
    {tipo:"practica",texto:"El agua bendita a la entrada recuerda el Bautismo, que no se pierde; en el «tercer día», cuando acabas de caer y piensas que no vale la pena, moja los dedos y santíguate: «sigo siendo de aquí, y puedo volver»."},
    {tipo:"practica",texto:"Escribe un plan de vida espiritual de tres líneas que te parezca ridículamente poco (hora de oración, Misa del domingo, fecha de la próxima confesión); cuando lo incumplas, no empieces de cero: sigue al día siguiente."},
  ]},
};

// Hoja PDF de repaso por TEMA (clave = mod). Vacío por ahora; cuando se suban las
// hojas, poner la URL por tema aquí (o moverlo a BD con el panel). Si no hay URL,
// el botón "Descargar la hoja" no se pinta.
const HOJAS_PDF={
  "KER-01": "/hojas/KER-01.pdf",
  "KER-02": "/hojas/KER-02.pdf",
  "KER-03": "/hojas/KER-03.pdf",
  "KER-04": "/hojas/KER-04.pdf",
  "KER-05": "/hojas/KER-05.pdf",
  "KER-06": "/hojas/KER-06.pdf",
  "TC1-01": "/hojas/TC1-01.pdf",
  "TC1-02": "/hojas/TC1-02.pdf",
  "TC1-03": "/hojas/TC1-03.pdf",
  "TC1-04": "/hojas/TC1-04.pdf",
  "TC1-05": "/hojas/TC1-05.pdf",
  "TC1-06": "/hojas/TC1-06.pdf",
  "TC1-07": "/hojas/TC1-07.pdf",
  "TC1-08": "/hojas/TC1-08.pdf",
  "TC1-09": "/hojas/TC1-09.pdf",
  "TC1-10": "/hojas/TC1-10.pdf",
  "TC1-11": "/hojas/TC1-11.pdf",
  "TC1-12": "/hojas/TC1-12.pdf",
  "TC1-13": "/hojas/TC1-13.pdf",
  "TC1-14": "/hojas/TC1-14.pdf",
  "TC1-15": "/hojas/TC1-15.pdf",
  "TC1-16": "/hojas/TC1-16.pdf",
};
// Resúmenes cargados desde la BD (panel admin). Objeto MUTABLE compartido: App lo
// rellena al arrancar con `obtener_resumenes`. Si un tema está aquí, prevalece
// sobre el de course.js. Forma: { "TC1-01": { resumen:{es:[...]}, hoja_pdf_url } }.
const RESUMENES_DB={};
// Helper: resumen (puntos por idioma) + hoja PDF de un tema (mod). BD > course.js.
function resumenDeTema(mod, lang="es"){
  const db=RESUMENES_DB[mod]||{};
  const r=RESUMENES[mod];
  const puntos = (db.resumen ? (db.resumen[lang]||db.resumen.es) : (r?(r[lang]||r.es):null)) || null;
  const hojaPdf = (db.hoja_pdf_url || HOJAS_PDF[mod] || null);
  return { puntos, hojaPdf };
}

// ─── PREGUNTAS TC1 (5 por tema, escala 10 pts, necesita ≥8) ──────
// Formato: {id, q, o:{a,b,c,d}, k:"letra_correcta"}
const Q={
  // ── KERIGMA — una evaluación por tema (en el bloque D) ──
  kg1d:[
    {id:1,q:"¿De quién es siempre la iniciativa en la relación con Dios?",o:{a:"Del ser humano, que busca a Dios primero",b:"De Dios, que ama y busca primero",c:"De la Iglesia como intermediaria",d:"Es simultánea"},k:"b"},
    {id:2,q:"¿Por qué ama Dios al ser humano?",o:{a:"Porque se lo gana portándose bien",b:"Por su constancia en la oración",c:"Porque Él es Padre; la causa está en Él, no en nosotros",d:"Porque somos moralmente limpios"},k:"c"},
    {id:3,q:"En la parábola mal llamada 'del hijo pródigo', ¿quién es el verdadero protagonista?",o:{a:"El hijo menor",b:"El hijo mayor",c:"El Padre misericordioso",d:"Los jornaleros"},k:"c"},
    {id:4,q:"¿Qué significaba el anillo que el padre manda poner al hijo?",o:{a:"Un adorno de bienvenida",b:"El sello con autoridad para actuar en nombre de la casa",c:"Una señal de penitencia",d:"El pago de la herencia"},k:"b"},
    {id:5,q:"La frase que resume el itinerario: 'El cristianismo no es un esfuerzo por alcanzar a Dios, sino…'",o:{a:"cumplir los mandamientos con rigor",b:"subir la escalera hacia lo divino",c:"dejarse alcanzar por Él",d:"demostrar méritos antes de ser aceptado"},k:"c"},
  ],
  kg2d:[
    {id:1,q:"¿Qué es realmente el pecado, según el video?",o:{a:"Una infracción administrativa de las reglas",b:"Una enfermedad mortal que daña y se propaga",c:"Un error sin consecuencias",d:"Algo que solo afecta a Dios"},k:"b"},
    {id:2,q:"El pecado rompe tres relaciones. ¿Cuáles?",o:{a:"Con Dios, con la Iglesia y con el Estado",b:"Con Dios, con los demás y con uno mismo",c:"Con el pasado, el presente y el futuro",d:"Con el cuerpo, la mente y el alma"},k:"b"},
    {id:3,q:"El primer efecto del pecado en la historia humana fue…",o:{a:"Un castigo inmediato",b:"Que el hombre se escondió, por vergüenza",c:"La muerte física",d:"La expulsión de los demás"},k:"b"},
    {id:4,q:"¿Qué le hace el pecado a la mirada sobre el prójimo?",o:{a:"Lo convierte en instrumento: algo que sirve o estorba",b:"Lo idealiza",c:"No afecta la relación",d:"Lo vuelve invisible"},k:"a"},
    {id:5,q:"En el ejercicio 'diagnóstico sincero', ¿qué actitud se pide?",o:{a:"Justificar el error con el contexto",b:"Nombrar el hecho sin 'pero' y pedir ser rescatado",c:"Prometer que no volverá a pasar",d:"Compararse con quien hace cosas peores"},k:"b"},
  ],
  kg3d:[
    {id:1,q:"La Pasión y Muerte de Cristo son, ante todo…",o:{a:"Una tragedia o injusticia sin más",b:"El pago de tu rescate",c:"Un mito",d:"Solo un ejemplo moral"},k:"b"},
    {id:2,q:"¿Qué deformación de la Cruz se rechaza explícitamente?",o:{a:"Que Cristo resucitó",b:"Que Dios estaba furioso y descargó su ira en su Hijo",c:"Que el pecado existe",d:"Que hay rescate"},k:"b"},
    {id:3,q:"¿Qué hace Cristo con nuestra lejanía?",o:{a:"La ignora",b:"La castiga",c:"La asume para devolvernos al Padre",d:"La aumenta"},k:"c"},
    {id:4,q:"Un rescate, por definición…",o:{a:"Lo paga el propio retenido",b:"Lo paga un tercero desde fuera",c:"No cuesta nada",d:"Es solo simbólico"},k:"b"},
    {id:5,q:"El ejercicio 'apropiación del sacrificio' busca pasar de…",o:{a:"Sentir mucho a sentir poco",b:"Saber que murió por todos a reconocer que murió por ti",c:"La teoría a la memoria",d:"La duda a la certeza emocional"},k:"b"},
  ],
  kg4d:[
    {id:1,q:"¿Qué es la fe, según el video?",o:{a:"Estar de acuerdo con la doctrina",b:"Confiar tu vida a Cristo",c:"Memorizar el catecismo",d:"Saber responder objeciones"},k:"b"},
    {id:2,q:"La diferencia entre información y fe se ilustra con…",o:{a:"Un maestro y un alumno",b:"Conocer al cirujano vs. acostarte en la camilla y dejar que te opere",c:"Un libro y una película",d:"Un mapa y una brújula"},k:"b"},
    {id:3,q:"Si no hay nada en juego ni riesgo, la fe es en realidad…",o:{a:"Humildad",b:"Opinión",c:"Esperanza",d:"Caridad"},k:"b"},
    {id:4,q:"La palabra griega del Evangelio para 'conversión' es…",o:{a:"Kerygma",b:"Metanoia",c:"Koinonía",d:"Ágape"},k:"b"},
    {id:5,q:"La conversión (metanoia) NO es…",o:{a:"Un cambio de mente y de rumbo",b:"Una vida más gris llena de prohibiciones",c:"Volver al Padre",d:"Una respuesta al amor recibido"},k:"b"},
  ],
  kg5d:[
    {id:1,q:"El Espíritu Santo es…",o:{a:"Una energía o fuerza impersonal",b:"El don de Cristo resucitado: Dios mismo y Persona",c:"Una técnica espiritual",d:"Un símbolo"},k:"b"},
    {id:2,q:"¿Cómo se relaciona uno con el Espíritu Santo?",o:{a:"Se maneja y se usa",b:"Se acoge y se le obedece",c:"Se activa con métodos",d:"Se controla"},k:"b"},
    {id:3,q:"Los tres verbos de su acción interior son…",o:{a:"Juzga, premia y castiga",b:"Despierta, fortalece y sostiene la fe",c:"Crea, ordena y destruye",d:"Enseña, examina y aprueba"},k:"b"},
    {id:4,q:"El primer movimiento de fe de tu vida…",o:{a:"Fue mérito tuyo",b:"Ya era Él actuando; nadie se despierta solo",c:"No cuenta",d:"Fue casualidad"},k:"b"},
    {id:5,q:"El problema real de la vida cristiana no es empezar, sino…",o:{a:"Sentir",b:"Durar: sostenerlo en el tiempo",c:"Saber",d:"Convencer"},k:"b"},
  ],
  kg6d:[
    {id:1,q:"El anuncio de Jesús siempre produce…",o:{a:"Emociones privadas",b:"Comunidad y servicio",c:"Conocimiento teórico",d:"Descanso"},k:"b"},
    {id:2,q:"La expresión 'cristianismo de sofá' se usa para afirmar que…",o:{a:"Es válido vivir la fe en privado y con comodidad",b:"NO existe una versión individual, cómoda y sin responsabilidad",c:"Hay que descansar del servicio",d:"La fe es un consumo legítimo"},k:"b"},
    {id:3,q:"La pregunta que distingue la fe verdadera de la 'espiritualidad de consumo' es…",o:{a:"¿Cuánto sé?",b:"¿Mi fe le cuesta algo a alguien o solo me da algo a mí?",c:"¿Cuánto rezo?",d:"¿Me siento bien?"},k:"b"},
    {id:4,q:"'Caridad concreta' significa…",o:{a:"Amar a la humanidad en general",b:"Una persona con nombre, esta semana, con algo medible",c:"Tener buenos deseos",d:"Donaciones anónimas grandes"},k:"b"},
    {id:5,q:"¿Dónde se ve si la conversión fue real, según el video?",o:{a:"En el conocimiento",b:"En la reconciliación: perdonar como fui perdonado",c:"En las emociones",d:"En la asistencia a misa"},k:"b"},
  ],
  // ── TRONCO COMÚN 1 — una evaluación por tema (bloque D) ──
  tc1_01d:[
    {id:1,q:"Según el video, ¿qué es Dios?",o:{a:"Una energía cósmica impersonal",b:"Un Padre que conoce y quiere",c:"Una fuerza que se canaliza",d:"Un campo de luz"},k:"b"},
    {id:2,q:"«Creación ex nihilo» significa que Dios creó…",o:{a:"A partir de materia que ya existía",b:"De la nada",c:"Por evolución ciega",d:"Copiando un modelo previo"},k:"b"},
    {id:3,q:"¿Por qué una «energía» no explica la inquietud del corazón?",o:{a:"Porque es muy poderosa",b:"Porque solo una persona deja ese tipo de vacío",c:"Porque no existe",d:"Porque es puramente física"},k:"b"},
    {id:4,q:"El «reto de asombro» se hace mirando…",o:{a:"Una pantalla",b:"Una fotografía de un paisaje",c:"Algo vivo o real creado por Dios, sin teléfono",d:"Un edificio"},k:"c"},
    {id:5,q:"A una energía se la usa; a un Padre…",o:{a:"Se le ignora",b:"Se le responde",c:"Se le canaliza",d:"Se le administra"},k:"b"},
  ],
  tc1_02d:[
    {id:1,q:"El mal, según el video, es…",o:{a:"Una sustancia oscura que existe por sí misma",b:"Una privación del bien",c:"Una creación de Dios",d:"Una fuerza igual al bien"},k:"b"},
    {id:2,q:"La oscuridad ilustra el mal porque…",o:{a:"Tiene partículas propias",b:"Es ausencia de luz: lo que falta cuando algo no está",c:"Es más fuerte que la luz",d:"La crea Dios"},k:"b"},
    {id:3,q:"La «oración de abandono» cambia «¿por qué a mí?» por…",o:{a:"«¿Quién tiene la culpa?»",b:"«¿Para qué permites esto, Señor?»",c:"«¿Por qué siempre yo?»",d:"«¿Cuándo terminará?»"},k:"b"},
    {id:4,q:"La diferencia entre «por qué» y «para qué» es que…",o:{a:"Son iguales",b:"«Por qué» mira al pasado cerrado y «para qué» hacia adelante",c:"Ambas miran al pasado",d:"Ninguna sirve"},k:"b"},
    {id:5,q:"Se dice «¿para qué lo permites?» porque Dios…",o:{a:"Causa el mal",b:"No fuerza el mal, lo permite",c:"Ignora el mal",d:"Disfruta el mal"},k:"b"},
  ],
  tc1_03d:[
    {id:1,q:"¿Por qué Dios tardó siglos en enviar a Cristo?",o:{a:"Por descuido",b:"Porque es paciente y pedagogo: prepara por etapas",c:"Porque no podía",d:"Como castigo"},k:"b"},
    {id:2,q:"El método con que Dios educó a la humanidad fueron…",o:{a:"Las plagas",b:"Las Alianzas (pactos)",c:"Los imperios",d:"Las guerras"},k:"b"},
    {id:3,q:"«Tu vida no es el final de la historia, es el…»",o:{a:"Prólogo",b:"Penúltimo capítulo",c:"Relleno",d:"Ensayo"},k:"b"},
    {id:4,q:"Que tu vida sea «penúltimo capítulo» significa que…",o:{a:"Es insignificante",b:"Estás en el tramo decisivo, cerca del final",c:"No importa",d:"Es solo un borrador"},k:"b"},
    {id:5,q:"«No es el final» te quita…",o:{a:"Toda responsabilidad",b:"Un peso que nunca fue tuyo: resolverlo todo",c:"La fe",d:"La esperanza"},k:"b"},
  ],
  tc1_04d:[
    {id:1,q:"Que Dios hable «con palabras humanas» se llama…",o:{a:"Dictado",b:"Condescendencia divina («descender con»)",c:"Traducción",d:"Invención"},k:"b"},
    {id:2,q:"La Escritura tiene…",o:{a:"Un solo autor divino",b:"Dos autores: Dios que inspira y un autor humano real",c:"Muchos autores sin Dios",d:"Ninguno"},k:"b"},
    {id:3,q:"Que Isaías no suene como Marcos muestra que la Escritura es…",o:{a:"Un dictado idéntico",b:"Una colaboración",c:"Un plagio",d:"Un invento"},k:"b"},
    {id:4,q:"En el «diálogo del corazón», antes de leer hay que…",o:{a:"Resumir",b:"Preguntar «Señor, ¿qué me quieres decir hoy?»",c:"Terminar el capítulo",d:"Analizar el griego"},k:"b"},
    {id:5,q:"El objetivo de esa lectura es…",o:{a:"Avanzar mucho",b:"Que una frase se te quede y responder algo",c:"Memorizar",d:"Estudiar historia"},k:"b"},
  ],
  tc1_05d:[
    {id:1,q:"La «inspiración del Espíritu Santo» NO significa…",o:{a:"Que Dios se sirvió de autores reales",b:"Un dictado palabra por palabra",c:"Que los dos son autores",d:"Que garantiza la verdad de salvación"},k:"b"},
    {id:2,q:"La inspiración garantiza…",o:{a:"Datos de astronomía",b:"La verdad que Dios puso para nuestra salvación",c:"Geología exacta",d:"Biología moderna"},k:"b"},
    {id:3,q:"Una cita bíblica tiene tres partes, en orden…",o:{a:"Versículo, capítulo, libro",b:"Libro, capítulo, versículo",c:"Página, línea, palabra",d:"Autor, fecha, lugar"},k:"b"},
    {id:4,q:"En «Juan 3, 16», el 16 es…",o:{a:"El libro",b:"El capítulo",c:"El versículo",d:"La página"},k:"c"},
    {id:5,q:"«Juan 3, 16» y «Juan 3:16» son…",o:{a:"Distintos",b:"Lo mismo (convención de estilo)",c:"Errores",d:"Dos pasajes diferentes"},k:"b"},
  ],
  tc1_06d:[
    {id:1,q:"El sentido que es base de todos los demás es…",o:{a:"El alegórico",b:"El literal (lo que el autor quiso decir)",c:"El moral",d:"El anagógico"},k:"b"},
    {id:2,q:"«Literal no es literalista»: leer bien una parábola es…",o:{a:"Tomarla como dato botánico",b:"Entender que es una parábola",c:"Ignorarla",d:"Cambiarla"},k:"b"},
    {id:3,q:"El hábito de lectura propuesto es leer…",o:{a:"La Biblia entera en un año",b:"El Evangelio de Marcos, cinco minutos diarios",c:"Una hora diaria",d:"Solo los domingos"},k:"b"},
    {id:4,q:"¿Por qué Marcos?",o:{a:"Es el más largo",b:"Es el más corto y rápido: se termina pronto",c:"Es el más difícil",d:"No tiene acción"},k:"b"},
    {id:5,q:"El enemigo del hábito no es la pereza, sino…",o:{a:"El tiempo",b:"La ambición: planes enormes que se abandonan",c:"La Biblia",d:"La falta de fe"},k:"b"},
  ],
  tc1_07d:[
    {id:1,q:"La Encarnación afirma que Cristo es…",o:{a:"Mitad Dios y mitad hombre",b:"Verdadero Dios y verdadero hombre, cien por ciento de cada uno",c:"Un disfraz de Dios",d:"Un hombre adoptado por Dios"},k:"b"},
    {id:2,q:"La unión de las dos naturalezas en una sola Persona se llama…",o:{a:"Sincretismo",b:"Unión hipostática",c:"Condescendencia",d:"Prefiguración"},k:"b"},
    {id:3,q:"Las cuatro negaciones son: sin confusión, sin cambio, sin división y…",o:{a:"Sin amor",b:"Sin separación",c:"Sin fe",d:"Sin gracia"},k:"b"},
    {id:4,q:"La oración propuesta, que se reza al mediodía, es…",o:{a:"El rosario",b:"El Ángelus",c:"El Credo",d:"Las vísperas"},k:"b"},
    {id:5,q:"Su frase central es «Y el Verbo se hizo carne, y…»",o:{a:"subió al cielo",b:"habitó entre nosotros",c:"nos juzgó",d:"se fue"},k:"b"},
  ],
  tc1_08d:[
    {id:1,q:"La imagen FALSA de la Cruz que se desmonta es…",o:{a:"Que Cristo se entrega por amor",b:"Que Dios, furioso, descargó su ira en su Hijo",c:"Que resucitó",d:"Que repara la deuda"},k:"b"},
    {id:2,q:"Esa imagen es falsa, entre otras cosas, porque…",o:{a:"Es agradable",b:"Castigar a un inocente no es justicia",c:"Honra a Dios",d:"Está en el evangelio"},k:"b"},
    {id:3,q:"El evangelio dice que «tanto amó Dios al mundo que…»",o:{a:"tuvo que desahogarse",b:"entregó a su Hijo",c:"lo castigó",d:"se alejó"},k:"b"},
    {id:4,q:"El ejercicio «ofrenda del dolor» es decir ante lo que duele…",o:{a:"«¿Por qué a mí?»",b:"«Señor, lo uno a tu Cruz»",c:"«No es nada»",d:"«Me lo merezco»"},k:"b"},
    {id:5,q:"Unir el dolor a la Cruz NO significa…",o:{a:"Que deje de ser estéril",b:"Que el dolor sea bueno o haya que disfrutarlo",c:"Darle un destino",d:"Que entre donde produjo vida"},k:"b"},
  ],
  tc1_09d:[
    {id:1,q:"Que la Iglesia sea «Cuerpo Místico» significa que la unión es…",o:{a:"Biológica",b:"Real aunque no biológica",c:"Una metáfora vacía",d:"Un club"},k:"b"},
    {id:2,q:"A diferencia de un club, en un cuerpo los miembros…",o:{a:"Se apuntan y se dan de baja",b:"Comparten la misma vida que circula",c:"Son intercambiables",d:"No se necesitan"},k:"b"},
    {id:3,q:"Las cuatro notas de la Iglesia son: Una, Santa, Católica y…",o:{a:"Romana",b:"Apostólica",c:"Antigua",d:"Universal"},k:"b"},
    {id:4,q:"La Iglesia es santa aunque la formen pecadores porque su santidad viene de…",o:{a:"Sus miembros",b:"Cristo, que la sostiene",c:"El Papa",d:"La historia"},k:"b"},
    {id:5,q:"Se reza por el Papa porque…",o:{a:"Hay que estar de acuerdo con él",b:"Rezar por alguien impide tratarlo como enemigo",c:"Es obligatorio opinar",d:"Garantiza el acuerdo"},k:"b"},
  ],
  tc1_10d:[
    {id:1,q:"Los tres pilares no son tres fuentes: la fuente es una sola…",o:{a:"La Biblia",b:"Cristo",c:"El Papa",d:"La Tradición"},k:"b"},
    {id:2,q:"Los tres pilares son: Sagrada Escritura, Sagrada Tradición y…",o:{a:"La razón",b:"El Magisterio",c:"La ciencia",d:"La costumbre"},k:"b"},
    {id:3,q:"«Tradición» (con mayúscula) significa…",o:{a:"Costumbre antigua",b:"Transmisión de lo que los apóstoles recibieron de Cristo",c:"Folklore",d:"Rutina"},k:"b"},
    {id:4,q:"El Catecismo es, sobre todo, un libro para…",o:{a:"Leer de corrido",b:"Consultar ante una duda concreta",c:"Decorar",d:"Regalar"},k:"b"},
    {id:5,q:"Las citas del Catecismo son números de párrafo porque…",o:{a:"Son páginas",b:"El número es el mismo en cualquier edición e idioma",c:"Es un error",d:"Cambian cada edición"},k:"b"},
  ],
  tc1_11d:[
    {id:1,q:"La gracia santificante es…",o:{a:"Una ayuda puntual",b:"La vida misma de Dios dentro de ti",c:"Un sentimiento",d:"Un premio por buena conducta"},k:"b"},
    {id:2,q:"Se llama «santificante» (y no «actual») porque…",o:{a:"Es pasajera",b:"Es un estado permanente del alma",c:"Se gana",d:"Se siente"},k:"b"},
    {id:3,q:"Respecto a esa vida de Dios: el pecado venial la… y el mortal la…",o:{a:"destruye / enferma",b:"enferma / destruye",c:"ignora / premia",d:"aumenta / disminuye"},k:"b"},
    {id:4,q:"El examen de conciencia propuesto empieza por…",o:{a:"Las faltas",b:"Agradecer algo bueno del día",c:"Un interrogatorio",d:"Dormir"},k:"b"},
    {id:5,q:"¿Por qué empezar por el agradecimiento?",o:{a:"Para alargarlo",b:"Porque empezar por las faltas lo vuelve un interrogatorio",c:"Para sentirse mejor",d:"Por costumbre"},k:"b"},
  ],
  tc1_12d:[
    {id:1,q:"Un «signo eficaz»…",o:{a:"Solo señala",b:"Hace lo que significa",c:"Decora",d:"Simboliza sin más"},k:"b"},
    {id:2,q:"Los sacramentos fueron instituidos por…",o:{a:"La Iglesia",b:"Cristo: son siete y no se añaden ni quitan",c:"Los apóstoles",d:"Los concilios"},k:"b"},
    {id:3,q:"«Ex opere operato» significa que el sacramento actúa…",o:{a:"Según la santidad del sacerdote",b:"Por la obra misma: es Cristo quien actúa",c:"Solo si crees mucho",d:"A veces"},k:"b"},
    {id:4,q:"El «escrúpulo» es…",o:{a:"Un pecado nuevo",b:"La duda que vuelve después de haber sido perdonado",c:"Una virtud",d:"Una penitencia"},k:"b"},
    {id:5,q:"No debemos dudar del perdón de la confesión porque depende de…",o:{a:"Tu confesión perfecta",b:"Cristo, que actúa por la obra misma",c:"Tus sentimientos",d:"El sacerdote"},k:"b"},
  ],
  tc1_13d:[
    {id:1,q:"Una «prefiguración» es un hecho real del A.T. que…",o:{a:"Es inventado después",b:"Anticipa algo mayor que vendrá",c:"Es mágico",d:"No ocurrió"},k:"b"},
    {id:2,q:"El arcoíris de Noé es a la vez…",o:{a:"Solo magia",b:"Fenómeno físico y signo real",c:"Solo física",d:"Solo símbolo"},k:"b"},
    {id:3,q:"Con el arcoíris, Dios muestra que…",o:{a:"Rompe la naturaleza",b:"Usa la naturaleza como lenguaje",c:"Necesita magia",d:"Improvisa"},k:"b"},
    {id:4,q:"El agua del diluvio, como prefiguración, a la vez…",o:{a:"Solo destruye",b:"Destruye y salva a los que están dentro",c:"Solo salva",d:"No hace nada"},k:"b"},
    {id:5,q:"El «despertar litúrgico» propone en la Misa…",o:{a:"Concentrarse más con la cabeza",b:"Percibir más con los sentidos",c:"Distraerse",d:"Salir antes"},k:"b"},
  ],
  tc1_14d:[
    {id:1,q:"Los sacramentales los instituye…",o:{a:"Cristo",b:"La Iglesia",c:"Cada fiel",d:"Nadie"},k:"b"},
    {id:2,q:"A diferencia del sacramento, el sacramental…",o:{a:"Da la gracia por sí mismo",b:"Dispone para recibir la gracia",c:"Es uno de los siete",d:"No cambia nunca"},k:"b"},
    {id:3,q:"El sacramental actúa según…",o:{a:"La obra misma",b:"La fe y la devoción de quien lo usa",c:"El azar",d:"Solo el ministro"},k:"b"},
    {id:4,q:"«Bendecir» (benedicere) significa…",o:{a:"Cargar de energía",b:"Decir bien de algo y reconocerlo de Dios",c:"Un conjuro",d:"Cambiar la materia"},k:"b"},
    {id:5,q:"¿Quién puede bendecir lo cotidiano (la mesa, a los hijos)?",o:{a:"Solo el obispo",b:"Todo bautizado",c:"Nadie",d:"Solo religiosos"},k:"b"},
  ],
  tc1_15d:[
    {id:1,q:"Para Santa Teresa, la oración es «tratar de amistad… con quien sabemos nos…»",o:{a:"juzga",b:"ama",c:"vigila",d:"exige"},k:"b"},
    {id:2,q:"«Tratar de amistad» descarta la idea de que hay que…",o:{a:"Hablar de verdad",b:"Rezar «bien», como en una audiencia",c:"Ser frecuente",d:"Estar a solas"},k:"b"},
    {id:3,q:"La oración se construye con…",o:{a:"Intensidad esporádica",b:"Frecuencia ordinaria: poco todos los días",c:"Encuentros cada seis meses",d:"Grandes esfuerzos"},k:"b"},
    {id:4,q:"El «diezmo del tiempo» es…",o:{a:"La décima parte del día",b:"Un cuarto de hora de silencio innegociable al día",c:"Una hora semanal",d:"Rezar en público"},k:"b"},
    {id:5,q:"«Innegociable» significa que ese rato…",o:{a:"Se mueve cuando surge algo",b:"No se mueve aunque surja algo",c:"Es opcional",d:"Se hace si sobra tiempo"},k:"b"},
  ],
  tc1_16d:[
    {id:1,q:"El «sincretismo» es…",o:{a:"Rezar mucho",b:"Mezclar sistemas religiosos incompatibles como piezas intercambiables",c:"Estudiar teología",d:"Ir a Misa"},k:"b"},
    {id:2,q:"El Primer Mandamiento afirma que la relación con Dios…",o:{a:"Es la primera de una lista",b:"Es de otra categoría: no admite sustitutos parciales",c:"Es opcional",d:"Es una técnica"},k:"b"},
    {id:3,q:"El corazón del video es que Dios es…",o:{a:"Una energía manipulable",b:"Persona, no una energía que se controla",c:"Un astro",d:"Un ritual"},k:"b"},
    {id:4,q:"Una consulta esotérica busca siempre…",o:{a:"Amistad con Dios",b:"Información o control mediante una técnica",c:"Humildad",d:"Caridad"},k:"b"},
    {id:5,q:"La «purificación del hogar» NO se hace…",o:{a:"Con serenidad y a plena luz",b:"Con miedo, como un ritual",c:"Revisando el uso de los objetos",d:"Con una renuncia consciente"},k:"b"},
  ],
  // ── CONFIRMACIÓN — una evaluación por tema (bloque D) ──
  cfm01d:[
    {id:1,q:"La Confirmación «perpetúa» Pentecostés. Perpetuar significa que aquel acontecimiento…",o:{a:"Se recuerda cada año",b:"Sigue ocurriendo hoy",c:"Se repite solo en Jerusalén",d:"Ya pasó y se conmemora"},k:"b"},
    {id:2,q:"¿Qué hace única a la Confirmación entre los siete sacramentos?",o:{a:"Es la única con aceite",b:"El Espíritu no viene a hacer otra cosa: viene Él mismo como don",c:"Solo la da el Papa",d:"Perdona los pecados"},k:"b"},
    {id:3,q:"La imagen que distingue Bautismo y Confirmación: en el Bautismo el Espíritu entra a habitar; en la Confirmación…",o:{a:"se marcha",b:"se derrama para enviar",c:"descansa",d:"se divide"},k:"b"},
    {id:4,q:"Las lenguas de fuego de Pentecostés se posaron…",o:{a:"como una sola llama sobre el grupo",b:"una sobre cada uno",c:"sobre nadie",d:"solo sobre Pedro"},k:"b"},
    {id:5,q:"El ejercicio «respirar al Espíritu» empieza por…",o:{a:"pedir muchas cosas",b:"un minuto de silencio real antes de rezar",c:"cantar",d:"leer la Biblia entera"},k:"b"},
  ],
  cfm02d:[
    {id:1,q:"La Confirmación, respecto al Bautismo…",o:{a:"empieza de cero",b:"madura y perfecciona algo ya iniciado",c:"lo anula",d:"no tiene relación"},k:"b"},
    {id:2,q:"«Perfeccionar» aquí significa…",o:{a:"arreglar algo que estaba mal hecho",b:"llevar a su plenitud algo completo pero no desplegado",c:"repetirlo",d:"corregir un error"},k:"b"},
    {id:3,q:"¿Por qué la Confirmación exige la fe previa del que la recibe?",o:{a:"Porque se recibe con uso de razón y la fe debe ser tuya",b:"Porque es un examen",c:"Porque el Bautismo no valió",d:"Por costumbre de calendario"},k:"a"},
    {id:4,q:"Como imprime un carácter indeleble, la Confirmación…",o:{a:"se repite cada año",b:"se recibe una sola vez",c:"se borra con el pecado",d:"caduca a los años"},k:"b"},
    {id:5,q:"En la renovación de las promesas, a diferencia del Bautismo de un bebé, tú…",o:{a:"no hablas",b:"puedes decir que no, y por eso tu «sí» vale",c:"respondes en secreto",d:"firmas un papel"},k:"b"},
  ],
  cfm03d:[
    {id:1,q:"La esencia del sacramento es…",o:{a:"la homilía",b:"la unción con el Crisma en la frente junto con la fórmula, a la vez",c:"la procesión",d:"el canto de entrada"},k:"b"},
    {id:2,q:"«Signo y palabra a la vez» significa que…",o:{a:"vale el gesto antes y las palabras después",b:"el gesto y las palabras van juntos en el mismo momento",c:"solo importan las palabras",d:"solo importa el gesto"},k:"b"},
    {id:3,q:"La fórmula del sacramento es…",o:{a:"«Yo te bautizo»",b:"«Recibe por esta señal el Don del Espíritu Santo»",c:"«La paz sea contigo»",d:"«Este es mi Cuerpo»"},k:"b"},
    {id:4,q:"El Santo Crisma se consagra…",o:{a:"en cada parroquia",b:"en la Misa Crismal del Jueves Santo, en la catedral",c:"en Roma",d:"en casa del confirmando"},k:"b"},
    {id:5,q:"Ser «ungido» en la antigüedad estaba reservado a…",o:{a:"los soldados",b:"reyes, sacerdotes y profetas",c:"los niños",d:"los extranjeros"},k:"b"},
  ],
  cfm04d:[
    {id:1,q:"La diferencia entre virtudes y dones se ilustra así: las virtudes son remos y los dones son…",o:{a:"anclas",b:"velas",c:"timones",d:"redes"},k:"b"},
    {id:2,q:"Los dones del Espíritu son…",o:{a:"cinco",b:"siete, tomados del profeta Isaías",c:"doce",d:"tres"},k:"b"},
    {id:3,q:"La «fortaleza», bien entendida, sirve sobre todo para…",o:{a:"el martirio heroico de un minuto",b:"el aguante largo, el día doscientos sin entusiasmo",c:"ganar discusiones",d:"el éxito"},k:"b"},
    {id:4,q:"El «temor de Dios» NO es…",o:{a:"cuidado de no dañar a quien te ama",b:"miedo al castigo",c:"como no querer hacer daño a tu madre",d:"un don del Espíritu"},k:"b"},
    {id:5,q:"El consejo para el ejercicio de los dones es…",o:{a:"trabajar los siete a la vez",b:"elegir uno, el que más te falte, y pedirlo antes de actuar",c:"no elegir ninguno",d:"solo leer sobre ellos"},k:"b"},
  ],
  cfm05d:[
    {id:1,q:"El error que hay que superar es confundir…",o:{a:"personal con comunitario",b:"personal con privado",c:"fe con razón",d:"Bautismo con Confirmación"},k:"b"},
    {id:2,q:"La Confirmación, en cuanto al vínculo, te da…",o:{a:"más intimidad a solas con Dios",b:"un vínculo más estrecho con la Iglesia",c:"independencia",d:"privacidad"},k:"b"},
    {id:3,q:"Que un sacramento sea válido pero quede «rito vacío» significa que…",o:{a:"no ocurrió",b:"ocurrió de verdad, pero sin frutos por falta de disposición",c:"hay que repetirlo",d:"fue inválido"},k:"b"},
    {id:4,q:"El saludo de paz del Obispo es, sobre todo…",o:{a:"una cortesía para cerrar el trámite",b:"un encargo: la paz de tu comunidad pasa a ser asunto tuyo",c:"una despedida",d:"una bendición final"},k:"b"},
    {id:5,q:"La pregunta que mide el vínculo real es…",o:{a:"¿crees en la Iglesia en abstracto?",b:"¿hay alguien en tu comunidad que notaría si dejaras de ir?",c:"¿sabes el Credo?",d:"¿vas los domingos?"},k:"b"},
  ],
  cfm06d:[
    {id:1,q:"La «fuerza especial» del Espíritu hace dos cosas: te impulsa (mover) y te…",o:{a:"juzga",b:"capacita (dar capacidad)",c:"obliga",d:"premia"},k:"b"},
    {id:2,q:"La finalidad del testimonio es edificar el Cuerpo en…",o:{a:"número y dinero",b:"la fe y la caridad",c:"poder e influencia",d:"silencio"},k:"b"},
    {id:3,q:"Dar testimonio, en la práctica, es sobre todo…",o:{a:"predicar en la calle y discutir",b:"no esconderlo, ser fiable y saber responder",c:"publicar frases en redes",d:"convertir a todos"},k:"b"},
    {id:4,q:"¿Por qué el ministro propio de la Confirmación es el Obispo?",o:{a:"Porque tiene más tiempo",b:"Porque es el sucesor directo de los Apóstoles",c:"Porque vive lejos",d:"Por tradición local"},k:"b"},
    {id:5,q:"El báculo del Obispo es…",o:{a:"un cetro de mando",b:"un cayado de pastor, instrumento de trabajo",c:"un adorno",d:"un arma"},k:"b"},
  ],
  cfm07d:[
    {id:1,q:"«Dar cuenta» de la fe, según el Nuevo Testamento, se hace…",o:{a:"ganando discusiones",b:"con mansedumbre y respeto",c:"imponiéndose",d:"en silencio"},k:"b"},
    {id:2,q:"Dar cuenta empieza por algo muy delimitado:",o:{a:"dominar todo el Catecismo",b:"saber qué dice el Credo",c:"estudiar la historia de la Iglesia",d:"memorizar la Biblia"},k:"b"},
    {id:3,q:"Una «mente configurada con la verdad» NO es…",o:{a:"la que reacciona desde lo que cree",b:"memorizar dogmas ciegamente",c:"como saber un idioma sin traducir",d:"coherencia entre fe y actos"},k:"b"},
    {id:4,q:"Respecto a las dudas, lo contrario de la fe es…",o:{a:"la duda",b:"la indiferencia",c:"la pregunta",d:"el estudio"},k:"b"},
    {id:5,q:"El Credo funcionó como «contraseña» (symbolon): originalmente era…",o:{a:"una moneda",b:"una ficha partida en dos que encajaba al reencontrarse",c:"un sello de cera",d:"una llave"},k:"b"},
  ],
  cfm08d:[
    {id:1,q:"La afirmación dura del video es que…",o:{a:"la relación basta sin doctrina",b:"la catequesis informativa no basta",c:"no hace falta rezar",d:"el examen es lo importante"},k:"b"},
    {id:2,q:"La gracia se asimila a través de una relación con Dios que es…",o:{a:"teórica",b:"viva, íntima y real",c:"ocasional",d:"impersonal"},k:"b"},
    {id:3,q:"Que la relación sea «trinitaria» cambia cómo rezas: al Padre le hablas como hijo, al Hijo lo sigues, y al Espíritu…",o:{a:"lo ignoras",b:"lo invocas",c:"lo estudias",d:"le temes"},k:"b"},
    {id:4,q:"La oración se sostiene por…",o:{a:"intensidad esporádica",b:"frecuencia",c:"duración",d:"emoción"},k:"b"},
    {id:5,q:"La «epíclesis» significa invocación: por eso la oración más antigua y corta del cristiano es…",o:{a:"«dame»",b:"«Ven, Espíritu Santo»",c:"«gracias»",d:"«amén»"},k:"b"},
  ],
  cfm09d:[
    {id:1,q:"La Confirmación no es el final: el orden original de la iniciación es Bautismo, Confirmación y…",o:{a:"Matrimonio",b:"Eucaristía, que culmina porque se repite toda la vida",c:"Orden",d:"Unción"},k:"b"},
    {id:2,q:"Que «Dios exija frutos» se entiende bien así:",o:{a:"es un castigo",b:"a un árbol se le pide fruto porque se le trata como árbol",c:"es una amenaza",d:"es opcional"},k:"b"},
    {id:3,q:"Los frutos pedidos incluyen la perseverancia en los sacramentos: Eucaristía dominical y…",o:{a:"ayuno",b:"Confesión frecuente",c:"rosario diario",d:"peregrinación"},k:"b"},
    {id:4,q:"«Nadie mantiene esto por fuerza de voluntad»: lo recibido en la Confirmación es…",o:{a:"una obligación",b:"el motor; los frutos crecen cuando dejas que Otro trabaje",c:"un premio",d:"una carga"},k:"b"},
    {id:5,q:"«Ite, missa est» es una despedida, pero de «missa» vienen dos palabras: Misa y…",o:{a:"mensaje",b:"misión",c:"ministro",d:"misterio"},k:"b"},
  ],
  cfm10d:[
    {id:1,q:"El «ex opere operato» garantiza que el sacramento…",o:{a:"depende de lo que sientas",b:"actúa por sí mismo, aunque estés distraído o nervioso",c:"depende de la santidad del ministro",d:"a veces falla"},k:"b"},
    {id:2,q:"Lo que sí depende de ti son…",o:{a:"la validez",b:"los frutos, según qué tan abierto esté tu corazón",c:"las palabras",d:"el gesto"},k:"b"},
    {id:3,q:"Lo que la Iglesia pide expresamente antes de la Confirmación es…",o:{a:"ayunar",b:"estar en estado de gracia mediante la Confesión previa",c:"memorizar el Credo",d:"un donativo"},k:"b"},
    {id:4,q:"Si hace mucho que no te confiesas, lo recomendable es…",o:{a:"callarlo",b:"decírselo al sacerdote al empezar",c:"recordarlo todo perfectamente",d:"no ir"},k:"b"},
    {id:5,q:"«Amén» significa…",o:{a:"gracias",b:"así es, lo creo, lo asumo — de una raíz que significa firmeza",c:"de acuerdo",d:"adiós"},k:"b"},
  ],
  cfm11d:[
    {id:1,q:"Desde el Antiguo Testamento, imponer las manos significa…",o:{a:"castigar",b:"transmitir una misión o un don",c:"saludar",d:"bendecir la comida"},k:"b"},
    {id:2,q:"Al imponer las manos, el Obispo invoca…",o:{a:"a un espíritu parecido",b:"al mismo Espíritu que descendió en Pentecostés",c:"a los santos",d:"a los ángeles"},k:"b"},
    {id:3,q:"La diferencia clave del video es entre espectador y testigo: un testigo…",o:{a:"solo mira",b:"vio algo y por tanto tiene algo que decir",c:"se emociona",d:"sabe mucho"},k:"b"},
    {id:4,q:"El episodio de Samaria (Hechos 8) prueba que…",o:{a:"el Bautismo basta",b:"desde el principio hubo algo que el Bautismo no daba y llegaba por manos apostólicas",c:"no hacía falta el Espíritu",d:"los apóstoles no servían"},k:"b"},
    {id:5,q:"Las manos extendidas sin tocar tienen forma de…",o:{a:"puño",b:"techo: un gesto de protección",c:"cruz",d:"copa"},k:"b"},
  ],
  cfm12d:[
    {id:1,q:"El sello (carácter indeleble) se compara con el sello de un rey, que hace tres cosas; NO hace…",o:{a:"decir de quién viene",b:"reescribir el texto ya escrito",c:"dar autoridad",d:"impedir quitarse sin destruir"},k:"b"},
    {id:2,q:"«Eres propiedad de Dios» NO significa…",o:{a:"que dejas de estar disponible para cualquier cosa",b:"que eres una cosa sin libertad",c:"que Alguien responde por ti",d:"que se te defiende"},k:"b"},
    {id:3,q:"«Apto para el combate»: la palabra «apto» dice que estás…",o:{a:"garantizado como ganador",b:"habilitado, sin excusa de incapacidad",c:"obligado a pelear",d:"exento"},k:"b"},
    {id:4,q:"La unción se traza en cruz: el trazo vertical une a Dios contigo, y el horizontal…",o:{a:"no significa nada",b:"se extiende hacia los demás",c:"borra lo anterior",d:"marca el final"},k:"b"},
    {id:5,q:"El consejo para el compromiso de testimonio es…",o:{a:"discutir y convencer",b:"no discutir, contar: narrar un hecho tuyo, que no admite refutación",c:"callar siempre",d:"publicarlo en redes"},k:"b"},
  ],
  // ── UNCIÓN DE LOS ENFERMOS — una evaluación por tema (bloque D) ──
  unc01d:[
    {id:1,q:"Sobre «¿por qué me pasó a mí?», la fe dice primero que la enfermedad…",o:{a:"es un castigo por el pecado",b:"no es un castigo",c:"es un regalo",d:"hay que agradecerla"},k:"b"},
    {id:2,q:"La enfermedad tampoco es…",o:{a:"un mal",b:"un regalo o bendición disfrazada",c:"algo contra lo que luchar",d:"un lugar donde la vida se detiene"},k:"b"},
    {id:3,q:"En la parábola del samaritano, la «posada» donde deja al herido representa…",o:{a:"el hospital",b:"la Iglesia",c:"su casa",d:"el templo vacío"},k:"b"},
    {id:4,q:"La enfermedad puede llevar a dos sitios opuestos: a la amargura, o a…",o:{a:"nada",b:"replantearse la vida y descubrir qué importaba de verdad",c:"la curación segura",d:"una fe perfecta"},k:"b"},
    {id:5,q:"La consecuencia para quien cuida a un enfermo es…",o:{a:"poder con todo solo",b:"no tener que poder solo: para eso existe la posada",c:"tener siempre respuestas",d:"no descansar nunca"},k:"b"},
  ],
  unc02d:[
    {id:1,q:"Santiago dice «¿está enfermo alguno?», no «¿se muere alguno?»: desde el inicio esto era para…",o:{a:"moribundos",b:"enfermos, no solo moribundos",c:"sacerdotes",d:"niños"},k:"b"},
    {id:2,q:"«Que oren sobre él», no «por él»: la preposición obliga a…",o:{a:"rezar desde lejos",b:"que alguien vaya hasta donde está el enfermo",c:"escribir una carta",d:"esperar"},k:"b"},
    {id:3,q:"Un sacramento tiene dos piezas: unas palabras y…",o:{a:"un libro",b:"algo material que se toca",c:"un testigo",d:"un canto"},k:"b"},
    {id:4,q:"«El Señor hará que se levante» significa que todo ungido…",o:{a:"se cura siempre",b:"se levanta a veces de la cama y siempre, al final, de la muerte",c:"nunca se cura",d:"sana si tiene fe"},k:"b"},
    {id:5,q:"El ejercicio de la semana es…",o:{a:"leer toda la Biblia",b:"memorizar la frase de Santiago y guardar el teléfono de la parroquia",c:"ayunar",d:"visitar un hospital"},k:"b"},
  ],
  unc03d:[
    {id:1,q:"La oración es algo que le decimos a Dios; el sacramento es…",o:{a:"también eso",b:"algo que Dios nos hace a nosotros",c:"una técnica",d:"un deseo"},k:"b"},
    {id:2,q:"Un sacramento funciona aunque el enfermo esté agotado o sedado porque…",o:{a:"depende de su fe",b:"no lo produce él",c:"depende del aceite",d:"depende del sacerdote"},k:"b"},
    {id:3,q:"«No es magia ni amuleto»: la magia busca un resultado y el sacramento…",o:{a:"también busca un resultado",b:"abre una puerta y deja entrar a Alguien",c:"no hace nada",d:"depende de la cantidad"},k:"b"},
    {id:4,q:"El signo son dos gestos inseparables: las manos piden y el aceite…",o:{a:"cura",b:"dice: aquí, sobre esta persona",c:"perfuma",d:"protege"},k:"b"},
    {id:5,q:"El deseo de un amigo («que te mejores») frente al sacramento…",o:{a:"vale menos",b:"es bueno y verdadero, pero son cosas distintas y hacen falta las dos",c:"es lo mismo",d:"sobra"},k:"b"},
  ],
  unc04d:[
    {id:1,q:"La Unción se pide en tres situaciones, y ninguna es agonizar; una es…",o:{a:"solo al morir",b:"ante una enfermedad grave, no necesariamente terminal",c:"tras la muerte",d:"en cualquier resfriado"},k:"b"},
    {id:2,q:"¿Se puede recibir más de una vez?",o:{a:"no, una sola vez en la vida",b:"sí, cada vez que la enfermedad se agrava o aparece una nueva",c:"solo dos veces",d:"solo si se curó"},k:"b"},
    {id:3,q:"Si el enfermo ya no está consciente…",o:{a:"ya no sirve",b:"se le unge igual, si habría querido recibirla",c:"hay que esperar",d:"solo se reza"},k:"b"},
    {id:4,q:"Pedirla a tiempo, cuando el diagnóstico es serio…",o:{a:"es rendirse",b:"no es rendirse: es buscar fuerzas antes de necesitarlas",c:"acerca la muerte",d:"está prohibido"},k:"b"},
    {id:5,q:"El gesto que no hace el sacerdote sino la familia, y con el que empieza todo, es…",o:{a:"la unción",b:"la llamada: alguien tiene que llamar",c:"el silencio",d:"abrir las manos"},k:"b"},
  ],
  unc05d:[
    {id:1,q:"El ministro de la Unción es…",o:{a:"cualquier laico que quiera al enfermo",b:"solo un sacerdote o un obispo",c:"una enfermera",d:"un familiar"},k:"b"},
    {id:2,q:"Que solo el sacerdote pueda ungir significa que lo que hacen los demás…",o:{a:"vale menos",b:"es un trabajo distinto, igual de necesario",c:"no cuenta",d:"sobra"},k:"b"},
    {id:3,q:"La materia es aceite de oliva bendecido…",o:{a:"por el propio sacerdote",b:"por el obispo, una vez al año, el Jueves Santo",c:"en casa",d:"en Roma"},k:"b"},
    {id:4,q:"El verbo principal de la fórmula NO es «te cure», sino…",o:{a:"«te ayude» y «te conforte»",b:"«te salve del cuerpo»",c:"«te levante ya»",d:"«te duerma»"},k:"a"},
    {id:5,q:"La unción se hace en dos lugares: la frente (lo de dentro) y…",o:{a:"el pecho",b:"las manos (lo que hizo esa persona)",c:"los pies",d:"los ojos"},k:"b"},
  ],
  unc06d:[
    {id:1,q:"De los cinco efectos, la recuperación de la salud va en el puesto…",o:{a:"primero",b:"cuarto, y «si conviene a la salvación de su alma»",c:"único",d:"no figura"},k:"b"},
    {id:2,q:"El primer efecto de la Unción es…",o:{a:"la curación",b:"un don del Espíritu Santo que da fuerza, paz y ánimo",c:"el perdón",d:"el Viático"},k:"b"},
    {id:3,q:"Si el enfermo ya no pudo confesarse, la Unción…",o:{a:"no hace nada",b:"perdona los pecados",c:"exige confesión previa",d:"espera"},k:"b"},
    {id:4,q:"Cuando alguien no se cura, la explicación…",o:{a:"es que faltó fe",b:"nunca es que faltó fe",c:"es culpa de la familia",d:"es que dudó"},k:"b"},
    {id:5,q:"A San Pablo, que pidió tres veces, se le respondió…",o:{a:"«te voy a quitar esto»",b:"«te basta mi gracia»: vas a poder con esto, y no solo",c:"nada",d:"«ten más fe»"},k:"b"},
  ],
  unc07d:[
    {id:1,q:"«Sacramento de fe» NO significa…",o:{a:"no cerrar la puerta",b:"tener una fe fuerte para que funcione",c:"querer recibirlo",d:"confiar"},k:"b"},
    {id:2,q:"No sentir nada (la sequedad)…",o:{a:"descalifica",b:"es lo más común en una enfermedad larga, no es falta de fe",c:"es pecado",d:"impide el sacramento"},k:"b"},
    {id:3,q:"Estar enojado con Dios…",o:{a:"es un obstáculo",b:"es normal y está en la Biblia; lo contrario de la fe es la indiferencia",c:"descalifica",d:"hay que ocultarlo"},k:"b"},
    {id:4,q:"La disposición que de verdad cuenta es la confianza, que es…",o:{a:"un sentimiento",b:"una decisión que se puede tomar sin ganas",c:"alegría",d:"resignación"},k:"b"},
    {id:5,q:"Abrir las manos antes de la unción es la postura de…",o:{a:"rendirse y dejar el tratamiento",b:"«hágase en mí según tu palabra»; una mano cerrada no puede recibir",c:"exigir",d:"despedirse"},k:"b"},
  ],
  unc08d:[
    {id:1,q:"La Iglesia afirma que el enfermo, desde su cama…",o:{a:"no aporta nada",b:"contribuye al bien de todos los demás",c:"estorba",d:"debe curarse solo"},k:"b"},
    {id:2,q:"Si el enfermo no puede ir a la parroquia…",o:{a:"pierde la Comunión",b:"es la parroquia la que va a donde él está",c:"espera a sanar",d:"no hay nada que hacer"},k:"b"},
    {id:3,q:"Tres cosas que se piden en la parroquia: llevar la Comunión, nombrarlo en la Misa, y…",o:{a:"cobrar",b:"que alguien lo visite",c:"un certificado",d:"una Misa de pago"},k:"b"},
    {id:4,q:"Sobre el que cuida: pedir ayuda y descansar…",o:{a:"es abandonar al enfermo",b:"no es traicionar a nadie: un cuidador agotado cuida peor",c:"está mal visto",d:"es egoísta"},k:"b"},
    {id:5,q:"Las manos extendidas que no llegan a tocar muestran lo que una comunidad puede hacer:",o:{a:"quitar la enfermedad",b:"ponerse encima, como un techo, sin quitar lo que el enfermo tiene",c:"nada",d:"curar"},k:"b"},
  ],
  unc09d:[
    {id:1,q:"«Mistagogia» es…",o:{a:"un sacramento",b:"aprender una cosa viviéndola, después de haberla recibido",c:"una oración",d:"un rito"},k:"b"},
    {id:2,q:"El último sacramento que recibe un cristiano no es la Unción, sino…",o:{a:"la Confesión",b:"la Comunión, que entonces se llama Viático",c:"la Confirmación",d:"el Bautismo"},k:"b"},
    {id:3,q:"«Viático» significa…",o:{a:"despedida",b:"«provisiones para el viaje»",c:"última unción",d:"funeral"},k:"b"},
    {id:4,q:"Si alguien murió de golpe o sin recibir nada…",o:{a:"se perdió",b:"nadie se pierde por un problema de horarios: Dios no está atado a sus sacramentos",c:"hay que culparse",d:"ya no se puede hacer nada"},k:"b"},
    {id:5,q:"Por un difunto todavía se puede…",o:{a:"nada",b:"rezar y pedir que se ofrezca una Misa por él",c:"ungirlo",d:"repetir el funeral"},k:"b"},
  ],
  // ── LA CONFESIÓN (RECONCILIACIÓN) — una evaluación por tema (bloque D) ──
  rec01d:[
    {id:1,q:"El arrepentimiento interior a solas alcanza el perdón de Dios, pero no da…",o:{a:"nada",b:"que alguien te lo diga en voz alta",c:"contrición",d:"la absolución, nunca"},k:"b"},
    {id:2,q:"La tarde de la resurrección, Cristo sopló sobre los apóstoles y dijo…",o:{a:"«construid la Iglesia»",b:"«a quienes perdonéis los pecados, les quedan perdonados»",c:"«id al mundo entero»",d:"«esto es mi Cuerpo»"},k:"b"},
    {id:3,q:"«Convertirse» (metanoia) significa literalmente…",o:{a:"ser mejor persona",b:"darse la vuelta, cambiar de dirección",c:"hacer un propósito",d:"rezar más"},k:"b"},
    {id:4,q:"La imagen que usa Jesús para la conversión no es un tribunal, sino…",o:{a:"un juez",b:"un padre que sale corriendo antes de que el hijo termine su discurso",c:"un maestro",d:"un rey"},k:"b"},
    {id:5,q:"Las llaves de Pedro («lo que ates/desates en la tierra…») usan verbos de…",o:{a:"puertas: abrir y cerrar",b:"cuerdas: atar y desatar",c:"libros",d:"armas"},k:"b"},
  ],
  rec02d:[
    {id:1,q:"El pecado es, ante todo…",o:{a:"romper una regla antigua",b:"una ruptura en una relación: hacer daño a alguien cercano",c:"un problema solo psicológico",d:"una costumbre"},k:"b"},
    {id:2,q:"«No existe el pecado que no le hace daño a nadie» porque…",o:{a:"todo se acaba sabiendo",b:"lo que uno hace a solas cambia a la persona que luego trata a los demás",c:"Dios se entera",d:"siempre hay testigos"},k:"b"},
    {id:3,q:"Para que un pecado sea grave hacen falta tres cosas a la vez: materia seria, plena libertad y…",o:{a:"que se repita",b:"saberlo perfectamente",c:"que alguien se entere",d:"que duela"},k:"b"},
    {id:4,q:"La confesión no borra lo que pasó; lo que hace es…",o:{a:"deshacer la historia",b:"devolverte a ti y volver a ponerte en camino",c:"que lo olvides",d:"castigarte"},k:"b"},
    {id:5,q:"El secreto de confesión…",o:{a:"tiene excepciones por orden de un juez",b:"no tiene ninguna excepción; romperlo excomulga automáticamente al sacerdote",c:"dura un año",d:"se puede contar a la familia"},k:"b"},
  ],
  rec03d:[
    {id:1,q:"El examen de conciencia bien hecho NO es…",o:{a:"ver con claridad una o dos cosas",b:"una auditoría que repasa cada hora buscando fallos",c:"corto",d:"ponerse ante el Evangelio"},k:"b"},
    {id:2,q:"Se mira con dos preguntas: qué actitudes me alejan y…",o:{a:"cuántas veces fallé",b:"dónde le hice daño a alguien, con lo que hice o dejé de hacer",c:"quién tuvo la culpa",d:"qué siento"},k:"b"},
    {id:3,q:"Entre lo que casi nadie lleva al confesionario está la «omisión», que es…",o:{a:"un acto malo",b:"el bien que se podía hacer y no se hizo",c:"una mentira",d:"un robo"},k:"b"},
    {id:4,q:"La escena del polvo en el rayo de luz enseña que…",o:{a:"mirarse ensucia",b:"el polvo ya estaba: la luz solo lo hace visible, nadie empeora por examinarse",c:"la luz lo trae",d:"mejor no mirar"},k:"b"},
    {id:5,q:"Se lee primero el Evangelio y después uno se mira porque…",o:{a:"da igual el orden",b:"una conciencia que se juzga con su propia vara sale aprobada siempre",c:"es más rápido",d:"lo pide la ley"},k:"b"},
  ],
  rec04d:[
    {id:1,q:"El remordimiento se distingue de la contrición en que el remordimiento…",o:{a:"mira el daño al otro",b:"habla todo el rato de uno mismo y por eso no cura",c:"nace del amor a Dios",d:"es suficiente"},k:"b"},
    {id:2,q:"La prueba «si nadie se hubiera enterado, ¿me seguiría doliendo?»: si es que sí, es…",o:{a:"remordimiento",b:"contrición",c:"miedo",d:"orgullo"},k:"b"},
    {id:3,q:"Para recibir el sacramento válidamente…",o:{a:"hace falta el dolor perfecto",b:"basta la contrición imperfecta (del miedo, de estar harto de uno mismo)",c:"hay que sentir mucho",d:"no hace falta ir"},k:"b"},
    {id:4,q:"El propósito de enmienda no es prometer no volver a caer, sino…",o:{a:"sentirse culpable",b:"la decisión de pelearlo hoy, cortando la ocasión",c:"prometerlo todo",d:"esperar"},k:"b"},
    {id:5,q:"La señal de que un arrepentimiento viene de Dios es que…",o:{a:"te deja sentado dándole vueltas",b:"te pone de pie y te manda a hacer algo",c:"te hunde",d:"usa palabras religiosas"},k:"b"},
  ],
  rec05d:[
    {id:1,q:"Si se olvida un pecado de buena fe…",o:{a:"la confesión es inválida",b:"queda perdonado igual; se menciona en la siguiente si uno se acuerda",c:"hay que volver corriendo",d:"no se absuelve"},k:"b"},
    {id:2,q:"«Lo que tengo que decir es demasiado grave»: la verdad es que…",o:{a:"hay pecados que no se pueden absolver",b:"no existe algo que un sacerdote no pueda absolver en nombre de Cristo",c:"depende del pecado",d:"hay que ir con el obispo"},k:"b"},
    {id:3,q:"Al acusarse, uno dice lo suyo y…",o:{a:"nombra a los demás",b:"no nombra a terceros ni cuenta lo que hizo el otro",c:"explica el contexto",d:"se defiende"},k:"b"},
    {id:4,q:"El último paso del rito: el sacerdote dice «Yo te absuelvo…» y uno responde…",o:{a:"«gracias»",b:"«Amén»",c:"«adiós»",d:"nada"},k:"b"},
    {id:5,q:"Lo que más sorprende al que vuelve tras veinte años es…",o:{a:"lo largo que es",b:"lo corto y poco solemne que es: entre tres y ocho minutos",c:"el interrogatorio",d:"la penitencia"},k:"b"},
  ],
  rec06d:[
    {id:1,q:"El sacerdote en el confesionario…",o:{a:"perdona con poder propio",b:"actúa in persona Christi; por eso dice «yo te absuelvo»",c:"solo escucha",d:"solo aconseja"},k:"b"},
    {id:2,q:"Hace tres cosas que sí son suyas: discierne, cura y…",o:{a:"juzga",b:"orienta",c:"condena",d:"cobra"},k:"b"},
    {id:3,q:"¿Por qué decirlo en voz alta ante alguien y no solo por dentro? Porque lo dicho en voz alta…",o:{a:"suena mejor",b:"ya no se puede seguir negociando ni matizando",c:"se olvida",d:"se comparte"},k:"b"},
    {id:4,q:"El confesionario y el psicólogo…",o:{a:"compiten",b:"son dos cosas distintas y hacen falta las dos",c:"son lo mismo",d:"se excluyen"},k:"b"},
    {id:5,q:"La rejilla del confesionario está sobre todo para…",o:{a:"esconder al sacerdote",b:"proteger al que entra: poder decir cualquier cosa sin que le vean la cara",c:"decorar",d:"separar por respeto"},k:"b"},
  ],
  rec07d:[
    {id:1,q:"La penitencia que impone el sacerdote NO es…",o:{a:"rehabilitación",b:"una multa o el precio del perdón",c:"ejercicio",d:"para desandar hábitos"},k:"b"},
    {id:2,q:"«Se cura con lo contrario»: contra la avaricia, la medicina es…",o:{a:"rezar",b:"dar dinero",c:"ayunar",d:"callar"},k:"b"},
    {id:3,q:"Cuando hay un daño concreto, la Iglesia pide algo más que oraciones:",o:{a:"olvidar",b:"reparar: lo que se tomó se devuelve, y el buen nombre también",c:"confesarse de nuevo",d:"pagar una multa"},k:"b"},
    {id:4,q:"Ninguna reparación seria se decide a solas, y nunca se repara…",o:{a:"con lo propio",b:"revelando lo que hizo otra persona",c:"en silencio",d:"por partes"},k:"b"},
    {id:5,q:"Si lo que hay que devolver es imposible (la persona murió)…",o:{a:"uno queda atrapado para siempre",b:"se repara lo que se pueda y lo demás se da a otros, p. ej. a los pobres",c:"no se hace nada",d:"se olvida"},k:"b"},
  ],
  rec08d:[
    {id:1,q:"La absolución quita la culpa entera, pero no quita…",o:{a:"el perdón",b:"la costumbre: el hábito queda intacto",c:"la gracia",d:"la fe"},k:"b"},
    {id:2,q:"Volver a confesar el mismo pecado durante años…",o:{a:"es el fracaso del sacramento",b:"es el sacramento funcionando: el que vuelve no es el que perdió",c:"invalida la confesión",d:"no sirve"},k:"b"},
    {id:3,q:"Para sostenerse entre una confesión y otra hacen falta cuatro cosas pequeñas; una es…",o:{a:"un retiro anual",b:"un momento fijo de oración",c:"ayunar",d:"peregrinar"},k:"b"},
    {id:4,q:"La «dirección espiritual» es…",o:{a:"solo para gente muy avanzada",b:"ver a un sacerdote cada dos o tres meses para hablar de cómo va la vida",c:"un curso",d:"una penitencia"},k:"b"},
    {id:5,q:"El plan de vida espiritual debe parecer «ridículamente poco» porque…",o:{a:"así se cumple; un plan ambicioso abandonado deja peor y añade culpa",b:"no importa",c:"la Iglesia lo exige corto",d:"es más santo"},k:"a"},
  ],
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

// ¿Este bloque requiere aprobar evaluación para completarse?
//   - Bloques nuevos (A/B/C) → evalua:false → se completan al VERSE.
//   - Bloque D (y videos antiguos sin `evalua`) → requieren evaluación aprobada.
function requiereEval(vid){ return vid?.evalua===undefined ? true : !!vid.evalua; }

// ¿Un bloque está COMPLETADO? (verlo basta si no evalúa; si evalúa, hay que aprobar)
function videoDone(secId, vid, prog){
  const p=prog?.[secId]?.[vid?.id];
  return requiereEval(vid) ? !!p?.passed : !!p?.visto;
}

function isSectionDone(secId, prog){
  const vids=SEC_META[secId]?.videos||[];
  return vids.length>0 && vids.every(v=>videoDone(secId,v,prog));
}

function videoState(secId, vid, prog, vids){
  const p=prog?.[secId]?.[vid.id];
  if(requiereEval(vid)){
    if(p?.passed) return "passed";
    if(p?.visto) return "watched";      // visto pero falta la evaluación
  } else {
    if(p?.visto) return "done";         // bloque sin evaluación: verlo lo completa
  }
  const idx=vids.findIndex(v=>v.id===vid.id);
  if(idx===0) return "available";
  return videoDone(secId,vids[idx-1],prog) ? "available" : "locked";
}

export { TC1_MODULES, TC1_ALL, TC2_CONFESION, TC2_UNCION, KERIGMA, COURSES, Q, RESUMENES, HOJAS_PDF, RESUMENES_DB, resumenDeTema,
         videoPruebaUrls, SEC_META, TEST_MODE, isSectionDone, videoState, requiereEval, videoDone };
