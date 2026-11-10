-- Consulta de disponibilidad. No actualiza inventarios, ventas ni movimientos.
CREATE FUNCTION public.resumen_insumos_locales(p_insumo_id uuid DEFAULT NULL)
RETURNS TABLE (
  insumo_id uuid,
  reservado_locales numeric,
  consumido_bulk numeric,
  total_no_disponible numeric
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'Tu cuenta no tiene acceso a Couple Kits' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH kits_comprometidos AS (
    SELECT l.kit_id, SUM(l.cantidad) AS reservados, 0::numeric AS vendidos
      FROM public.inventario_kits_local l WHERE l.cantidad > 0 GROUP BY l.kit_id
    UNION ALL
    SELECT v.kit_id, 0::numeric AS reservados, SUM(v.cantidad) AS vendidos
      FROM public.ventas_local_kits v WHERE v.cantidad > 0 GROUP BY v.kit_id
  )
  SELECT r.insumo_id,
    SUM(r.cantidad * k.reservados),
    SUM(r.cantidad * k.vendidos),
    SUM(r.cantidad * (k.reservados + k.vendidos))
  FROM kits_comprometidos k
  JOIN public.recetas_kit r ON r.kit_id = k.kit_id
  WHERE r.cantidad > 0 AND (p_insumo_id IS NULL OR r.insumo_id = p_insumo_id)
  GROUP BY r.insumo_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resumen_insumos_locales(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resumen_insumos_locales(uuid) TO authenticated;
