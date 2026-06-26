CREATE TABLE IF NOT EXISTS puntos_entrega (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  tiene_comision boolean NOT NULL DEFAULT false,
  porcentaje_comision numeric,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS recibe_comision boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS porcentaje_comision numeric,
  ADD COLUMN IF NOT EXISTS punto_entrega_id uuid REFERENCES puntos_entrega(id);

CREATE TABLE IF NOT EXISTS ventas_local (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  punto_entrega_id uuid NOT NULL REFERENCES puntos_entrega(id),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  ingreso_total numeric NOT NULL DEFAULT 0,
  comision_monto numeric NOT NULL DEFAULT 0,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ventas_local_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_local_id uuid NOT NULL REFERENCES ventas_local(id) ON DELETE CASCADE,
  kit_id uuid REFERENCES kits(id),
  cantidad numeric NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0
);
