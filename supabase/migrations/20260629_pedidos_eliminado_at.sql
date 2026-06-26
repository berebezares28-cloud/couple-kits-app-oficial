-- Fecha en que se movió a eliminados (para purga a los 7 días)
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS eliminado_at timestamptz;

UPDATE pedidos
SET eliminado_at = COALESCE(created_at, now())
WHERE eliminado = true
  AND eliminado_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_eliminado_at
  ON pedidos (eliminado_at)
  WHERE eliminado = true;
