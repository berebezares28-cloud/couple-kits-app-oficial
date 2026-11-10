-- Registro independiente: no modifica datos ni tablas existentes.
CREATE TABLE public.finanzas_accesos (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finanzas_accesos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.finanzas_accesos FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.finanzas_accesos TO authenticated;
CREATE POLICY finanzas_acceso_propio ON public.finanzas_accesos
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE TABLE public.ingresos_extra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto text NOT NULL CHECK (length(btrim(concepto)) BETWEEN 1 AND 200),
  fecha date NOT NULL,
  monto numeric(12, 2) NOT NULL CHECK (monto > 0 AND monto <= 9999999999.99),
  metodo_pago text NOT NULL CHECK (metodo_pago IN ('Mercado Pago', 'Efectivo', 'Nu')),
  notas text CHECK (notas IS NULL OR length(notas) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ingresos_extra_fecha_id_idx ON public.ingresos_extra (fecha DESC, id);

ALTER TABLE public.ingresos_extra ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ingresos_extra FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.ingresos_extra TO authenticated;

-- Finanzas se comparte únicamente entre los miembros autorizados del equipo.
CREATE POLICY ingresos_extra_lectura ON public.ingresos_extra
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())
  ));
CREATE POLICY ingresos_extra_registro ON public.ingresos_extra
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())
  ));
CREATE POLICY ingresos_extra_eliminacion ON public.ingresos_extra
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())
  ));
