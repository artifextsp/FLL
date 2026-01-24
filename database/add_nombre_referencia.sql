-- ============================================
-- Agregar columna nombre_referencia a jurados
-- Ejecutar en Supabase > SQL Editor
-- ============================================

-- Agregar columna para guardar el nombre del jurado (referencia visual)
ALTER TABLE jurados ADD COLUMN IF NOT EXISTS nombre_referencia VARCHAR(255);

-- Comentario en la columna
COMMENT ON COLUMN jurados.nombre_referencia IS 'Nombre del jurado para referencia visual (no se usa para autenticación)';
