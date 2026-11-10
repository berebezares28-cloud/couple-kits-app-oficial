-- Solo agrega una operación; no cambia existencias ni registros existentes.
CREATE FUNCTION public.retirar_kit_local_sin_venta(
  p_operacion_id uuid,
  p_punto_id uuid,
  p_kit_id uuid,
  p_cantidad integer,
  p_fecha date,
  p_motivo text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_inventario_id uuid;
  v_disponible numeric;
  v_restante numeric;
  v_motivo text := pg_catalog.btrim(p_motivo);
  v_anterior public.movimientos_kits_local%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.finanzas_accesos WHERE user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'Tu cuenta no tiene acceso a Couple Kits' USING ERRCODE = '42501';
  END IF;
  IF p_operacion_id IS NULL OR p_punto_id IS NULL OR p_kit_id IS NULL
    OR p_cantidad IS NULL OR p_cantidad <= 0 OR p_fecha IS NULL
    OR v_motivo IS NULL OR pg_catalog.length(v_motivo) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Revisa el kit, la cantidad, la fecha y el motivo' USING ERRCODE = '22023';
  END IF;

  -- El mismo intento no descuenta dos veces, incluso con solicitudes simultáneas.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operacion_id::text, 0));
  SELECT * INTO v_anterior FROM public.movimientos_kits_local WHERE id = p_operacion_id;
  IF FOUND THEN
    IF v_anterior.punto_entrega_id IS DISTINCT FROM p_punto_id
      OR v_anterior.kit_id IS DISTINCT FROM p_kit_id
      OR v_anterior.tipo IS DISTINCT FROM 'salida'
      OR v_anterior.cantidad IS DISTINCT FROM p_cantidad::numeric
      OR v_anterior.fecha IS DISTINCT FROM p_fecha
      OR v_anterior.motivo IS DISTINCT FROM 'Retiro sin venta'
      OR v_anterior.notas IS DISTINCT FROM v_motivo
      OR v_anterior.venta_local_id IS NOT NULL THEN
      RAISE EXCEPTION 'Este intento de retiro ya se usó con otros datos' USING ERRCODE = '23505';
    END IF;
    SELECT cantidad INTO v_restante FROM public.inventario_kits_local
      WHERE punto_entrega_id = p_punto_id AND kit_id = p_kit_id;
    RETURN pg_catalog.jsonb_build_object('movimiento_id', p_operacion_id, 'cantidad_restante', COALESCE(v_restante, 0), 'repetido', true);
  END IF;

  SELECT id, cantidad INTO v_inventario_id, v_disponible
    FROM public.inventario_kits_local
    WHERE punto_entrega_id = p_punto_id AND kit_id = p_kit_id FOR UPDATE;
  IF NOT FOUND OR v_disponible < p_cantidad THEN
    RAISE EXCEPTION 'No hay suficientes kits disponibles en este local' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.inventario_kits_local
    SET cantidad = cantidad - p_cantidad, updated_at = pg_catalog.now()
    WHERE id = v_inventario_id RETURNING cantidad INTO v_restante;
  INSERT INTO public.movimientos_kits_local
    (id, punto_entrega_id, kit_id, tipo, cantidad, fecha, motivo, venta_local_id, notas)
    VALUES (p_operacion_id, p_punto_id, p_kit_id, 'salida', p_cantidad, p_fecha, 'Retiro sin venta', NULL, v_motivo);

  -- El movimiento y el descuento se confirman juntos, sin tocar ventas o insumos.
  RETURN pg_catalog.jsonb_build_object('movimiento_id', p_operacion_id, 'cantidad_restante', v_restante, 'repetido', false);
END;
$$;

REVOKE ALL ON FUNCTION public.retirar_kit_local_sin_venta(uuid, uuid, uuid, integer, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retirar_kit_local_sin_venta(uuid, uuid, uuid, integer, date, text) TO authenticated;
