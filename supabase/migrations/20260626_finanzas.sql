-- Finanzas: gastos G&A, saldos de cuenta, método de pago en ventas bulk

CREATE TABLE IF NOT EXISTS gastos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto text NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  monto numeric NOT NULL CHECK (monto > 0),
  categoria text NOT NULL CHECK (
    categoria IN (
      'marketing',
      'generacion_contenido',
      'suscripciones',
      'transporte',
      'promociones_descuentos',
      'otros'
    )
  ),
  metodo_pago text NOT NULL CHECK (
    metodo_pago IN ('Mercado Pago', 'Efectivo', 'Nu')
  ),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saldos_cuenta (
  metodo_pago text PRIMARY KEY CHECK (
    metodo_pago IN ('Mercado Pago', 'Efectivo', 'Nu')
  ),
  saldo_inicial numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO saldos_cuenta (metodo_pago, saldo_inicial)
VALUES
  ('Mercado Pago', 0),
  ('Efectivo', 0),
  ('Nu', 0)
ON CONFLICT (metodo_pago) DO NOTHING;

ALTER TABLE ventas_local
  ADD COLUMN IF NOT EXISTS metodo_pago text
    CHECK (
      metodo_pago IS NULL OR
      metodo_pago IN ('Mercado Pago', 'Efectivo', 'Nu')
    );

ALTER TABLE compras_insumos
  ADD COLUMN IF NOT EXISTS metodo_pago text
    CHECK (
      metodo_pago IS NULL OR
      metodo_pago IN ('Mercado Pago', 'Efectivo', 'Nu')
    );
