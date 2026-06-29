-- Estados de contenido: publicado, programado, por_hacer, por_programar
ALTER TABLE contenido_publicaciones
  ADD COLUMN IF NOT EXISTS estado text;

UPDATE contenido_publicaciones
SET estado = CASE
  WHEN publicado = true THEN 'publicado'
  ELSE 'programado'
END
WHERE estado IS NULL;

ALTER TABLE contenido_publicaciones
  ALTER COLUMN estado SET DEFAULT 'por_hacer';

UPDATE contenido_publicaciones
SET estado = 'por_hacer'
WHERE estado IS NULL;

ALTER TABLE contenido_publicaciones
  ALTER COLUMN estado SET NOT NULL;

ALTER TABLE contenido_publicaciones
  DROP CONSTRAINT IF EXISTS contenido_publicaciones_estado_check;

ALTER TABLE contenido_publicaciones
  ADD CONSTRAINT contenido_publicaciones_estado_check
  CHECK (
    estado IN (
      'publicado',
      'programado',
      'por_hacer',
      'por_programar'
    )
  );

CREATE INDEX IF NOT EXISTS idx_contenido_estado
  ON contenido_publicaciones(estado);
