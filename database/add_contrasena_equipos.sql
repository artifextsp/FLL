-- ============================================
-- Agregar campo contraseña a tabla equipos
-- ============================================

-- Agregar columna contrasena (VARCHAR(4)) para contraseña de 4 dígitos
ALTER TABLE equipos 
ADD COLUMN IF NOT EXISTS contrasena VARCHAR(4);

-- Comentario en la columna
COMMENT ON COLUMN equipos.contrasena IS 'Contraseña de 4 dígitos para que cada equipo acceda a sus calificaciones detalladas';

-- Generar contraseñas aleatorias para equipos existentes que no tengan contraseña
UPDATE equipos 
SET contrasena = LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE contrasena IS NULL OR contrasena = '';
