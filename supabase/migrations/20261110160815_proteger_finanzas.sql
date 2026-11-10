-- Solo cambia permisos: conserva todos los movimientos e importes existentes.
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gastos FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.gastos TO authenticated;
CREATE POLICY gastos_equipo_finanzas ON public.gastos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.saldos_cuenta ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.saldos_cuenta FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.saldos_cuenta TO authenticated;
CREATE POLICY saldos_equipo_finanzas ON public.saldos_cuenta
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));
