-- ============================================================
-- PLATAFORMA DE PREPARACIÓN DE SACRAMENTOS CATÓLICOS
-- Supabase PostgreSQL Schema v1.0
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CATÁLOGOS
-- ============================================================

CREATE TABLE sacramentos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,   -- 'bautismo' | 'primera_comunion' | 'confirmacion'
  nombre        TEXT NOT NULL,
  descripcion   TEXT,
  horas_totales SMALLINT NOT NULL DEFAULT 10,
  color_hex     TEXT DEFAULT '#C8A951',
  orden         SMALLINT NOT NULL,
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sacramentos (slug, nombre, descripcion, horas_totales, orden) VALUES
  ('bautismo',         'Bautismo',         'Primer sacramento de iniciación cristiana',             8,  1),
  ('primera_comunion', 'Primera Comunión', 'Primer recibimiento del Cuerpo y Sangre de Cristo',    12,  2),
  ('confirmacion',     'Confirmación',     'Fortalecimiento en la fe por el Espíritu Santo',       16,  3);


CREATE TABLE videos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacramento_id     UUID NOT NULL REFERENCES sacramentos(id) ON DELETE CASCADE,
  titulo            TEXT NOT NULL,
  descripcion       TEXT,
  url_video         TEXT NOT NULL,          -- YouTube / Vimeo / CDN URL
  thumbnail_url     TEXT,
  duracion_segundos INTEGER NOT NULL DEFAULT 900,
  orden             SMALLINT NOT NULL,
  es_repaso_final   BOOLEAN DEFAULT FALSE,
  activo            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE preguntas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id            UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  pregunta            TEXT NOT NULL,
  opcion_a            TEXT NOT NULL,
  opcion_b            TEXT NOT NULL,
  opcion_c            TEXT NOT NULL,
  opcion_d            TEXT NOT NULL,
  respuesta_correcta  CHAR(1) NOT NULL CHECK (respuesta_correcta IN ('a','b','c','d')),
  explicacion         TEXT,               -- Muestra la explicación tras contestar
  puntaje             SMALLINT DEFAULT 2, -- Default: 5 preguntas × 2 pts = 10 pts máx
  orden               SMALLINT NOT NULL,
  activo              BOOLEAN DEFAULT TRUE
);


CREATE TABLE ministros (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  titulo      TEXT,                         -- 'Pbro.', 'Rvdo.', 'Diác.'
  rol         TEXT NOT NULL CHECK (rol IN ('sacerdote','diacono')),
  parroquia   TEXT,
  firma_url   TEXT,                         -- URL imagen de firma (Supabase Storage)
  activo      BOOLEAN DEFAULT TRUE
);


CREATE TABLE catequistas (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  TEXT NOT NULL,
  activo  BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- ESTUDIANTES
-- ============================================================

CREATE TABLE estudiantes (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo   TEXT NOT NULL,
  email             TEXT NOT NULL,
  pais_origen       TEXT NOT NULL,
  pais_residencia   TEXT NOT NULL,
  tipo_documento    TEXT NOT NULL,    -- 'CURP', 'DNI', 'CPF', 'CI', 'RUT', 'SSN'…
  numero_documento  TEXT NOT NULL,
  fecha_nacimiento  DATE,
  telefono          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  activo            BOOLEAN DEFAULT TRUE
);

CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_estudiantes_updated_at
  BEFORE UPDATE ON estudiantes
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================
-- INSCRIPCIONES Y PROGRESO
-- ============================================================

CREATE TABLE inscripciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id   UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  sacramento_id   UUID NOT NULL REFERENCES sacramentos(id),
  ministro_id     UUID REFERENCES ministros(id),
  catequista_id   UUID REFERENCES catequistas(id),
  fecha_inicio    TIMESTAMPTZ DEFAULT NOW(),
  fecha_conclusion TIMESTAMPTZ,
  estado          TEXT DEFAULT 'en_progreso'
    CHECK (estado IN ('en_progreso','aprobado','pausado','cancelado')),
  UNIQUE (estudiante_id, sacramento_id)
);


-- Progreso por video (una fila por estudiante × video)
CREATE TABLE progreso_videos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id      UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
  video_id            UUID NOT NULL REFERENCES videos(id),
  -- WATCH STATE
  visto               BOOLEAN DEFAULT FALSE,
  fecha_inicio_vista  TIMESTAMPTZ,
  fecha_fin_vista     TIMESTAMPTZ,
  -- EVAL STATE (se resetea cuando reprueba: aprobado=false, visto=false)
  aprobado            BOOLEAN DEFAULT FALSE,
  fecha_aprobado      TIMESTAMPTZ,
  UNIQUE (inscripcion_id, video_id)
);


-- Cada intento de evaluación queda registrado (auditoría completa)
CREATE TABLE intentos_evaluacion (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id  UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
  video_id        UUID NOT NULL REFERENCES videos(id),
  numero_intento  SMALLINT NOT NULL DEFAULT 1,  -- incrementa por (inscripcion_id, video_id)
  puntaje         NUMERIC(4,1) NOT NULL,         -- 0.0 – 10.0
  puntaje_maximo  NUMERIC(4,1) NOT NULL DEFAULT 10.0,
  respuestas      JSONB NOT NULL,  -- { "pregunta_uuid": "a" | "b" | "c" | "d" }
  aprobado        BOOLEAN NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-increments numero_intento por (inscripcion_id, video_id)
CREATE OR REPLACE FUNCTION trg_set_numero_intento()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(numero_intento), 0) + 1
  INTO NEW.numero_intento
  FROM intentos_evaluacion
  WHERE inscripcion_id = NEW.inscripcion_id AND video_id = NEW.video_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_intentos_numero
  BEFORE INSERT ON intentos_evaluacion
  FOR EACH ROW EXECUTE FUNCTION trg_set_numero_intento();

-- ============================================================
-- LÓGICA DE EVALUACIÓN: FUNCIÓN PRINCIPAL
-- Aplica regla: puntaje ≥ 8 → aprueba; < 8 → desmarca video
-- Llámala desde el frontend o desde un Edge Function
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_resultado_evaluacion(
  p_inscripcion_id  UUID,
  p_video_id        UUID,
  p_puntaje         NUMERIC,
  p_puntaje_maximo  NUMERIC,
  p_respuestas      JSONB
)
RETURNS JSON AS $$
DECLARE
  v_aprobado  BOOLEAN;
  v_result    JSON;
BEGIN
  v_aprobado := (p_puntaje >= 8.0);

  -- 1. Guardar intento
  INSERT INTO intentos_evaluacion
    (inscripcion_id, video_id, puntaje, puntaje_maximo, respuestas, aprobado)
  VALUES
    (p_inscripcion_id, p_video_id, p_puntaje, p_puntaje_maximo, p_respuestas, v_aprobado);

  IF v_aprobado THEN
    -- 2a. Marcar video como aprobado
    UPDATE progreso_videos
    SET aprobado       = TRUE,
        visto          = TRUE,
        fecha_aprobado = NOW()
    WHERE inscripcion_id = p_inscripcion_id AND video_id = p_video_id;

  ELSE
    -- 2b. DESMARCAR: el estudiante debe re-ver el video antes de reintentar
    UPDATE progreso_videos
    SET aprobado       = FALSE,
        visto          = FALSE,          -- ← clave del requisito
        fecha_aprobado = NULL,
        fecha_fin_vista = NULL
    WHERE inscripcion_id = p_inscripcion_id AND video_id = p_video_id;
  END IF;

  -- 3. Si este es el video de Repaso Final y se aprobó, cerrar inscripción
  IF v_aprobado THEN
    UPDATE inscripciones i
    SET estado           = 'aprobado',
        fecha_conclusion = NOW()
    WHERE i.id = p_inscripcion_id
      AND EXISTS (
        SELECT 1 FROM videos v
        WHERE v.id = p_video_id AND v.es_repaso_final = TRUE
      )
      AND NOT EXISTS (
        SELECT 1 FROM progreso_videos pv
        JOIN videos v ON v.id = pv.video_id
        WHERE pv.inscripcion_id = p_inscripcion_id
          AND v.es_repaso_final = FALSE
          AND (pv.aprobado = FALSE OR pv.aprobado IS NULL)
      );
  END IF;

  SELECT json_build_object(
    'aprobado',  v_aprobado,
    'puntaje',   p_puntaje,
    'mensaje',   CASE WHEN v_aprobado
                   THEN '¡Felicitaciones! Módulo superado.'
                   ELSE 'Debes obtener al menos 8 puntos. Vuelve a ver el video para reintentar.'
                 END
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CONSTANCIAS (Certificados de Finalización)
-- ============================================================

CREATE TABLE constancias (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Código QR: enlace a /validar/{codigo_validacion}
  codigo_validacion TEXT UNIQUE NOT NULL
    DEFAULT encode(gen_random_bytes(12), 'hex'),

  -- Relaciones
  inscripcion_id    UUID NOT NULL REFERENCES inscripciones(id),
  estudiante_id     UUID NOT NULL REFERENCES estudiantes(id),
  ministro_id       UUID REFERENCES ministros(id),
  catequista_id     UUID REFERENCES catequistas(id),

  -- Datos congelados al momento de emisión (11 campos requeridos)
  nombre_estudiante     TEXT NOT NULL,
  tipo_documento        TEXT NOT NULL,
  numero_documento      TEXT NOT NULL,
  pais_origen           TEXT NOT NULL,
  pais_residencia       TEXT NOT NULL,
  nombre_sacramento     TEXT NOT NULL,
  fecha_inicio          DATE NOT NULL,
  fecha_conclusion      DATE NOT NULL,
  horas_formacion       SMALLINT NOT NULL,
  nombre_ministro       TEXT,
  nombre_catequista     TEXT,

  -- Vigencia y fechas
  fecha_emision         TIMESTAMPTZ DEFAULT NOW(),
  fecha_vigencia        DATE NOT NULL,   -- = fecha_conclusion + 6 meses

  -- Storage
  pdf_url               TEXT,            -- URL pública en Supabase Storage

  -- Estado
  enviado_email         BOOLEAN DEFAULT FALSE,
  activo                BOOLEAN DEFAULT TRUE
);

-- Función generadora de constancia (llamada desde Edge Function tras aprobar Repaso Final)
CREATE OR REPLACE FUNCTION crear_constancia(p_inscripcion_id UUID)
RETURNS JSON AS $$
DECLARE
  v_insc       inscripciones;
  v_est        estudiantes;
  v_sac        sacramentos;
  v_min        ministros;
  v_cat        catequistas;
  v_codigo     TEXT;
  v_vigencia   DATE;
BEGIN
  SELECT * INTO v_insc FROM inscripciones  WHERE id = p_inscripcion_id;
  SELECT * INTO v_est  FROM estudiantes    WHERE id = v_insc.estudiante_id;
  SELECT * INTO v_sac  FROM sacramentos    WHERE id = v_insc.sacramento_id;
  SELECT * INTO v_min  FROM ministros      WHERE id = v_insc.ministro_id;
  SELECT * INTO v_cat  FROM catequistas    WHERE id = v_insc.catequista_id;

  v_vigencia := v_insc.fecha_conclusion::DATE + INTERVAL '6 months';

  INSERT INTO constancias (
    inscripcion_id, estudiante_id, ministro_id, catequista_id,
    nombre_estudiante, tipo_documento, numero_documento,
    pais_origen, pais_residencia, nombre_sacramento,
    fecha_inicio, fecha_conclusion, horas_formacion,
    nombre_ministro, nombre_catequista, fecha_vigencia
  ) VALUES (
    p_inscripcion_id, v_est.id, v_insc.ministro_id, v_insc.catequista_id,
    v_est.nombre_completo, v_est.tipo_documento, v_est.numero_documento,
    v_est.pais_origen, v_est.pais_residencia, v_sac.nombre,
    v_insc.fecha_inicio::DATE, v_insc.fecha_conclusion::DATE, v_sac.horas_totales,
    COALESCE(v_min.titulo || ' ' || v_min.nombre, NULL),
    v_cat.nombre,
    v_vigencia
  )
  ON CONFLICT DO NOTHING
  RETURNING codigo_validacion INTO v_codigo;

  RETURN json_build_object('codigo_validacion', v_codigo, 'fecha_vigencia', v_vigencia);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VALIDACIÓN PÚBLICA (para escaneo de QR — sin autenticación)
-- ============================================================
CREATE OR REPLACE FUNCTION public.validar_constancia(p_codigo TEXT)
RETURNS JSON AS $$
DECLARE v_result JSON;
BEGIN
  SELECT json_build_object(
    'valida',              TRUE,
    'nombre_estudiante',   c.nombre_estudiante,
    'tipo_documento',      c.tipo_documento,
    'numero_documento',    c.numero_documento,
    'pais_origen',         c.pais_origen,
    'pais_residencia',     c.pais_residencia,
    'nombre_sacramento',   c.nombre_sacramento,
    'fecha_inicio',        to_char(c.fecha_inicio, 'DD/MM/YYYY'),
    'fecha_conclusion',    to_char(c.fecha_conclusion, 'DD/MM/YYYY'),
    'horas_formacion',     c.horas_formacion,
    'nombre_ministro',     c.nombre_ministro,
    'nombre_catequista',   c.nombre_catequista,
    'fecha_vigencia',      to_char(c.fecha_vigencia, 'DD/MM/YYYY'),
    'vigente',             (c.fecha_vigencia >= CURRENT_DATE AND c.activo = TRUE)
  )
  INTO v_result
  FROM constancias c
  WHERE c.codigo_validacion = p_codigo AND c.activo = TRUE;

  IF v_result IS NULL THEN
    RETURN json_build_object('valida', FALSE,
      'mensaje', 'Constancia no encontrada o inválida');
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validar_constancia(TEXT) TO anon;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE sacramentos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministros            ENABLE ROW LEVEL SECURITY;
ALTER TABLE catequistas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_videos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE intentos_evaluacion  ENABLE ROW LEVEL SECURITY;
ALTER TABLE constancias          ENABLE ROW LEVEL SECURITY;

-- Catálogos: lectura pública
CREATE POLICY "pub_sacramentos"  ON sacramentos  FOR SELECT USING (activo = TRUE);
CREATE POLICY "pub_videos"       ON videos        FOR SELECT USING (activo = TRUE);
CREATE POLICY "auth_preguntas"   ON preguntas     FOR SELECT
  USING (auth.role() = 'authenticated' AND activo = TRUE);
CREATE POLICY "pub_ministros"    ON ministros     FOR SELECT USING (activo = TRUE);
CREATE POLICY "pub_catequistas"  ON catequistas   FOR SELECT USING (activo = TRUE);

-- Estudiantes: solo su propia fila
CREATE POLICY "own_read_est"   ON estudiantes FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_insert_est" ON estudiantes FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_update_est" ON estudiantes FOR UPDATE USING (auth.uid() = id);

-- Inscripciones
CREATE POLICY "own_read_insc"   ON inscripciones FOR SELECT USING (auth.uid() = estudiante_id);
CREATE POLICY "own_insert_insc" ON inscripciones FOR INSERT WITH CHECK (auth.uid() = estudiante_id);
CREATE POLICY "own_update_insc" ON inscripciones FOR UPDATE USING (auth.uid() = estudiante_id);

-- Progreso
CREATE POLICY "own_read_prog" ON progreso_videos FOR SELECT
  USING (inscripcion_id IN (SELECT id FROM inscripciones WHERE estudiante_id = auth.uid()));
CREATE POLICY "own_insert_prog" ON progreso_videos FOR INSERT
  WITH CHECK (inscripcion_id IN (SELECT id FROM inscripciones WHERE estudiante_id = auth.uid()));
CREATE POLICY "own_update_prog" ON progreso_videos FOR UPDATE
  USING (inscripcion_id IN (SELECT id FROM inscripciones WHERE estudiante_id = auth.uid()));

-- Intentos
CREATE POLICY "own_read_int" ON intentos_evaluacion FOR SELECT
  USING (inscripcion_id IN (SELECT id FROM inscripciones WHERE estudiante_id = auth.uid()));
CREATE POLICY "own_insert_int" ON intentos_evaluacion FOR INSERT
  WITH CHECK (inscripcion_id IN (SELECT id FROM inscripciones WHERE estudiante_id = auth.uid()));

-- Constancias: el estudiante ve la propia; validación pública vía función SECURITY DEFINER
CREATE POLICY "own_constancia" ON constancias FOR SELECT USING (auth.uid() = estudiante_id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_videos_sacramento       ON videos(sacramento_id, orden);
CREATE INDEX idx_preguntas_video         ON preguntas(video_id, orden);
CREATE INDEX idx_progreso_inscripcion    ON progreso_videos(inscripcion_id);
CREATE INDEX idx_intentos_inscripcion    ON intentos_evaluacion(inscripcion_id, video_id);
CREATE INDEX idx_constancias_codigo      ON constancias(codigo_validacion);
CREATE INDEX idx_constancias_estudiante  ON constancias(estudiante_id);
