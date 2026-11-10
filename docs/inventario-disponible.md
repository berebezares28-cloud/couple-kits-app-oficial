# Insumos disponibles para pedidos

La disponibilidad se consulta, sin reescribir las existencias guardadas:

`compras + entradas − pedidos directos entregados − kits en locales − kits vendidos en bulk`

Los dos últimos conceptos se convierten a insumos según la receta vigente de cada
kit. `resumen_insumos_locales` lee ambos en una misma consulta, con los permisos
del usuario. Los pedidos directos entregados conservan sus recetas históricas.

- Cargar kits a un local aumenta su reserva y reduce la disponibilidad principal.
- Vender en bulk reduce los kits del local y aumenta los vendidos. La suma no
  cambia: los insumos no se descuentan dos veces.
- Retirar sin venta reduce la reserva y libera los insumos para pedidos.
- Editar o eliminar una venta conserva el compromiso de los kits que vuelven al
  local. Los insumos se liberan cuando se registra su retiro del local.
- Finanzas reconoce el costo de venta al vender; cargar o retirar no genera COGS.

Insumos, alertas y disponibilidad de figuras del resumen de pedidos usan la misma
regla, sin filtros de fecha para las reservas. Se incluyen las existencias y ventas
históricas ya registradas. Un saldo negativo se muestra como déficit, no se oculta.

La función es `STABLE`, `SECURITY INVOKER`, sin permisos para visitantes, y exige
membresía del equipo. La migración solo agrega esa consulta; no cambia datos.

Prueba reproducible con PostgreSQL aislado y sin red:

`node scripts/test-stock-locales.cjs`

Cubre carga, venta, retiro, edición y eliminación de bulk, costos de Finanzas,
disponibilidad de figuras, stock individual/general y restricciones de acceso.
