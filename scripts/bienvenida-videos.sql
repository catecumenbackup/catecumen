-- bienvenida-videos.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Popup de bienvenida que ve el alumno la PRIMERA vez que entra al área de
-- videos (saludo pastoral + guía breve de cómo funciona). Editable desde el
-- panel (Admin → Bienvenida) sin recompilar.
--
-- Reutiliza la tabla `ajustes(clave,valor jsonb)` (la misma del modo
-- preinscripción). Clave: 'bienvenida_videos'. Estructura del valor:
--   { activa:bool, titulo:{es..it}, cuerpo:{es..it} }
-- El frontend lo lee con la RPC pública `obtener_ajuste`; el admin lo guarda
-- con `admin_guardar_ajuste`. ON CONFLICT DO NOTHING: re-ejecutar NO pisa lo
-- que el admin haya editado.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.ajustes (clave, valor) VALUES (
  'bienvenida_videos',
  jsonb_build_object(
    'activa', true,
    'titulo', jsonb_build_object(
      'es','¡Bienvenido a tu formación!',
      'en','Welcome to your formation!',
      'fr','Bienvenue dans ta formation !',
      'de','Willkommen in deiner Ausbildung!',
      'pt','Bem-vindo à tua formação!',
      'it','Benvenuto nella tua formazione!'
    ),
    'cuerpo', jsonb_build_object(
      'es', E'Nos alegra que inicies este camino. Que el Señor abra tu corazón y acompañe cada paso de tu preparación.\n\nAsí funciona tu formación:\n• Avanza video por video: al terminar cada uno respondes una breve evaluación (necesitas 8 de 10 para aprobar).\n• Las lecciones se desbloquean en orden; completa una para pasar a la siguiente.\n• Cada día, al iniciar tu sesión, verás una oración para disponer tu corazón.\n• ¿Dudas de fe? Usa «Consultar a tu catequista». Para libros y recursos, la «Biblioteca». Para un problema técnico, «Soporte».\n\nAl concluir recibirás tu constancia. ¡Que Dios bendiga tu camino!',
      'en', E'We are glad you are beginning this journey. May the Lord open your heart and accompany every step of your preparation.\n\nHow your formation works:\n• Move video by video: after each one you answer a short quiz (you need 8 out of 10 to pass).\n• Lessons unlock in order; complete one to move on to the next.\n• Each day, as you begin your session, a prayer will help you prepare your heart.\n• Questions about the faith? Use “Ask your catechist.” For books and resources, the “Library.” For a technical issue, “Support.”\n\nWhen you finish you will receive your certificate. May God bless your journey!',
      'fr', E'Nous sommes heureux que tu commences ce chemin. Que le Seigneur ouvre ton cœur et accompagne chaque pas de ta préparation.\n\nComment fonctionne ta formation :\n• Avance vidéo par vidéo : à la fin de chacune, tu réponds à un court questionnaire (il faut 8 sur 10 pour réussir).\n• Les leçons se déverrouillent dans l''ordre ; termine l''une pour passer à la suivante.\n• Chaque jour, au début de ta session, une prière t''aidera à disposer ton cœur.\n• Des questions sur la foi ? Utilise « Consulter ton catéchiste ». Pour les livres et ressources, la « Bibliothèque ». Pour un problème technique, « Support ».\n\nÀ la fin, tu recevras ton attestation. Que Dieu bénisse ton chemin !',
      'de', E'Wir freuen uns, dass du diesen Weg beginnst. Möge der Herr dein Herz öffnen und jeden Schritt deiner Vorbereitung begleiten.\n\nSo funktioniert deine Ausbildung:\n• Gehe Video für Video vor: Nach jedem beantwortest du ein kurzes Quiz (du brauchst 8 von 10 zum Bestehen).\n• Die Lektionen werden der Reihe nach freigeschaltet; schließe eine ab, um zur nächsten zu gelangen.\n• Jeden Tag siehst du zu Beginn deiner Einheit ein Gebet, um dein Herz zu bereiten.\n• Fragen zum Glauben? Nutze „Deinen Katecheten fragen“. Für Bücher und Ressourcen die „Bibliothek“. Bei technischen Problemen „Support“.\n\nAm Ende erhältst du deine Bescheinigung. Gott segne deinen Weg!',
      'pt', E'Ficamos felizes por iniciares este caminho. Que o Senhor abra o teu coração e acompanhe cada passo da tua preparação.\n\nComo funciona a tua formação:\n• Avança vídeo por vídeo: ao terminar cada um respondes a uma breve avaliação (precisas de 8 em 10 para aprovar).\n• As lições desbloqueiam em ordem; conclui uma para passar à seguinte.\n• A cada dia, ao iniciar a tua sessão, verás uma oração para dispor o teu coração.\n• Dúvidas de fé? Usa «Consultar o teu catequista». Para livros e recursos, a «Biblioteca». Para um problema técnico, «Suporte».\n\nAo concluir receberás o teu certificado. Que Deus abençoe o teu caminho!',
      'it', E'Siamo felici che tu inizi questo cammino. Il Signore apra il tuo cuore e accompagni ogni passo della tua preparazione.\n\nCome funziona la tua formazione:\n• Procedi video per video: al termine di ciascuno rispondi a un breve quiz (servono 8 su 10 per superarlo).\n• Le lezioni si sbloccano in ordine; completane una per passare alla successiva.\n• Ogni giorno, all''inizio della tua sessione, vedrai una preghiera per disporre il cuore.\n• Dubbi di fede? Usa «Consulta il tuo catechista». Per libri e risorse, la «Biblioteca». Per un problema tecnico, «Supporto».\n\nAl termine riceverai il tuo attestato. Che Dio benedica il tuo cammino!'
    )
  )
)
ON CONFLICT (clave) DO NOTHING;
