-- Diario de contenido (independiente de finanzas)
CREATE TABLE IF NOT EXISTS contenido_publicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  tipo text NOT NULL CHECK (tipo IN ('organico', 'anuncio_pagado')),
  plataforma text NOT NULL DEFAULT 'instagram',
  titulo text NOT NULL,
  notas text,
  alcance integer,
  likes integer,
  comentarios integer,
  clics integer,
  ventas_atribuidas integer,
  monto_anuncio numeric,
  url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contenido_fecha
  ON contenido_publicaciones(fecha DESC);

CREATE INDEX IF NOT EXISTS idx_contenido_tipo
  ON contenido_publicaciones(tipo);
