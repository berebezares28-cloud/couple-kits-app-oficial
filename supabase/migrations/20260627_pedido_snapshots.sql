-- Precio congelado por línea de pedido
ALTER TABLE pedido_kits
  ADD COLUMN IF NOT EXISTS precio_unitario numeric,
  ADD COLUMN IF NOT EXISTS subtotal numeric;

-- Receta congelada por línea (solo pedidos futuros al cambiar receta global)
CREATE TABLE IF NOT EXISTS pedido_kit_receta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_kit_id uuid NOT NULL REFERENCES pedido_kits(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES insumos(id),
  cantidad numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (pedido_kit_id, insumo_id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_kit_receta_pedido_kit
  ON pedido_kit_receta(pedido_kit_id);

-- Soft delete de pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS eliminado boolean NOT NULL DEFAULT false;

-- Backfill precios históricos con el precio actual del kit
UPDATE pedido_kits pk
SET
  precio_unitario = COALESCE(pk.precio_unitario, k.precio_venta, 0),
  subtotal = COALESCE(
    pk.subtotal,
    COALESCE(k.precio_venta, 0) * COALESCE(pk.cantidad, 1)
  )
FROM kits k
WHERE pk.kit_id = k.id
  AND (pk.precio_unitario IS NULL OR pk.subtotal IS NULL);

-- Backfill recetas congeladas desde la receta actual
INSERT INTO pedido_kit_receta (pedido_kit_id, insumo_id, cantidad)
SELECT pk.id, rk.insumo_id, rk.cantidad
FROM pedido_kits pk
JOIN recetas_kit rk ON rk.kit_id = pk.kit_id
WHERE NOT EXISTS (
  SELECT 1
  FROM pedido_kit_receta pkr
  WHERE pkr.pedido_kit_id = pk.id
);
