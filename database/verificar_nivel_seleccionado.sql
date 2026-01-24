-- ============================================
-- VERIFICAR Y AGREGAR CAMPO nivel_seleccionado
-- Ejecutar en Supabase > SQL Editor si falta el campo
-- ============================================

-- Verificar si existe el campo nivel_seleccionado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'calificaciones'
AND column_name = 'nivel_seleccionado';

-- Si no existe (no devuelve filas), ejecutar:
ALTER TABLE calificaciones 
ADD COLUMN IF NOT EXISTS nivel_seleccionado INTEGER 
CHECK (nivel_seleccionado >= 1 AND nivel_seleccionado <= 4);

-- Comentario en la columna
COMMENT ON COLUMN calificaciones.nivel_seleccionado IS 'Nivel seleccionado por el jurado (1-4) para este aspecto';

-- Verificar que se creó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'calificaciones'
ORDER BY ordinal_position;
