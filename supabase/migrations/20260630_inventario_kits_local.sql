-- Inventario de kits armados por punto de entrega (local)
CREATE TABLE IF NOT EXISTS inventario_kits_local (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  punto_entrega_id uuid NOT NULL REFERENCES puntos_entrega(id) ON DELETE CASCADE,
  kit_id uuid NOT NULL REFERENCES kits(id),
  cantidad numeric NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (punto_entrega_id, kit_id)
);

CREATE INDEX IF NOT EXISTS idx_inventario_kits_local_punto
  ON inventario_kits_local(punto_entrega_id);

-- Historial de entradas (dejar kits) y salidas (ventas bulk)
CREATE TABLE IF NOT EXISTS movimientos_kits_local (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  punto_entrega_id uuid NOT NULL REFERENCES puntos_entrega(id) ON DELETE CASCADE,
  kit_id uuid NOT NULL REFERENCES kits(id),
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  cantidad numeric NOT NULL CHECK (cantidad > 0),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  motivo text,
  venta_local_id uuid REFERENCES ventas_local(id) ON DELETE SET NULL,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_kits_local_punto
  ON movimientos_kits_local(punto_entrega_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_kits_local_venta
  ON movimientos_kits_local(venta_local_id)
  WHERE venta_local_id IS NOT NULL;
