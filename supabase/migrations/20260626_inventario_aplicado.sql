-- inventario_aplicado en pedidos (evita doble descuento de stock)

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS inventario_aplicado boolean DEFAULT false;

UPDATE pedidos
SET inventario_aplicado = true
WHERE estatus = 'Entregado'
  AND inventario_aplicado IS NOT TRUE;
