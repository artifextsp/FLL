-- ============================================
-- NUEVA ESTRUCTURA: Niveles de Puntuación por Aspecto
-- Cada aspecto puede tener múltiples niveles (1-4) con descripciones
-- ============================================

-- Tabla para niveles de cada aspecto
CREATE TABLE IF NOT EXISTS niveles_aspecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aspecto_id UUID REFERENCES aspectos_rubrica(id) ON DELETE CASCADE,
  nivel INTEGER NOT NULL CHECK (nivel >= 1 AND nivel <= 4),
  descripcion TEXT NOT NULL,
  puntuacion INTEGER NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aspecto_id, nivel)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_niveles_aspecto ON niveles_aspecto(aspecto_id, orden);

-- Trigger para updated_at
CREATE TRIGGER update_niveles_aspecto_updated_at BEFORE UPDATE ON niveles_aspecto
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentario
COMMENT ON TABLE niveles_aspecto IS 'Niveles de puntuación progresivos para cada aspecto (1=Básico, 2=En Desarrollo, 3=Cumplido, 4=Superado)';

-- Modificar tabla calificaciones para guardar el nivel seleccionado
ALTER TABLE calificaciones ADD COLUMN IF NOT EXISTS nivel_seleccionado INTEGER CHECK (nivel_seleccionado >= 1 AND nivel_seleccionado <= 4);

-- Comentario en la nueva columna
COMMENT ON COLUMN calificaciones.nivel_seleccionado IS 'Nivel seleccionado por el jurado (1-4) para este aspecto';
