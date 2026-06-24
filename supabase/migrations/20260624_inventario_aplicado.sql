-- Ejecuta esto en Supabase → SQL Editor (una sola vez)

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS inventario_aplicado boolean DEFAULT false;

-- Marca pedidos ya entregados para NO volver a descontar inventario
UPDATE pedidos
SET inventario_aplicado = true
WHERE estatus = 'Entregado';

-- Respaldo por si la columna falla: marca en la nota
UPDATE pedidos
SET nota = COALESCE(nota, '') || E'\n[inventario_aplicado]'
WHERE estatus = 'Entregado'
  AND (nota IS NULL OR nota NOT LIKE '%[inventario_aplicado]%');
