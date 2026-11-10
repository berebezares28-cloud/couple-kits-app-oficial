-- Permisos para los miembros autorizados de Couple Kits.
-- No modifica, borra ni crea registros del negocio.

ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kits TO authenticated;
CREATE POLICY equipo_autorizado ON public.kits
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.entregas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entregas TO authenticated;
CREATE POLICY equipo_autorizado ON public.entregas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.insumos FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumos TO authenticated;
CREATE POLICY equipo_autorizado ON public.insumos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.pedido_kit_receta ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pedido_kit_receta FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_kit_receta TO authenticated;
CREATE POLICY equipo_autorizado ON public.pedido_kit_receta
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.ventas_local_kits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ventas_local_kits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ventas_local_kits TO authenticated;
CREATE POLICY equipo_autorizado ON public.ventas_local_kits
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.envios_islas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.envios_islas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.envios_islas TO authenticated;
CREATE POLICY equipo_autorizado ON public.envios_islas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.inventario_kits_local ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventario_kits_local FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventario_kits_local TO authenticated;
CREATE POLICY equipo_autorizado ON public.inventario_kits_local
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.pedido_kits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pedido_kits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_kits TO authenticated;
CREATE POLICY equipo_autorizado ON public.pedido_kits
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pedidos FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
CREATE POLICY equipo_autorizado ON public.pedidos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.inventario_islas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventario_islas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventario_islas TO authenticated;
CREATE POLICY equipo_autorizado ON public.inventario_islas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.compras_insumos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.compras_insumos FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_insumos TO authenticated;
CREATE POLICY equipo_autorizado ON public.compras_insumos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.recetas_kit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recetas_kit FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recetas_kit TO authenticated;
CREATE POLICY equipo_autorizado ON public.recetas_kit
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.ventas_local ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ventas_local FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ventas_local TO authenticated;
CREATE POLICY equipo_autorizado ON public.ventas_local
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.contenido_publicaciones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contenido_publicaciones FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contenido_publicaciones TO authenticated;
CREATE POLICY equipo_autorizado ON public.contenido_publicaciones
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.gastos_generales ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gastos_generales FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gastos_generales TO authenticated;
CREATE POLICY equipo_autorizado ON public.gastos_generales
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.puntos_entrega ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.puntos_entrega FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.puntos_entrega TO authenticated;
CREATE POLICY equipo_autorizado ON public.puntos_entrega
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.movimientos_inventario FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimientos_inventario TO authenticated;
CREATE POLICY equipo_autorizado ON public.movimientos_inventario
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

ALTER TABLE public.movimientos_kits_local ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.movimientos_kits_local FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimientos_kits_local TO authenticated;
CREATE POLICY equipo_autorizado ON public.movimientos_kits_local
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())));

