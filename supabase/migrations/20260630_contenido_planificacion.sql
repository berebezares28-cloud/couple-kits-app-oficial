-- Planificación de contenido: estado publicado y formato
ALTER TABLE contenido_publicaciones
  ADD COLUMN IF NOT EXISTS publicado boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS formato text NOT NULL DEFAULT 'reel'
    CHECK (formato IN ('reel', 'carrusel', 'foto', 'story', 'otro'));

CREATE INDEX IF NOT EXISTS idx_contenido_publicado
  ON contenido_publicaciones(publicado);

CREATE INDEX IF NOT EXISTS idx_contenido_formato
  ON contenido_publicaciones(formato);
