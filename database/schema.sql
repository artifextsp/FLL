-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA FLL
-- Supabase (PostgreSQL)
-- ============================================

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de jurados (relación usuario-evento)
CREATE TABLE IF NOT EXISTS jurados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL, -- Referencia a usuarios de Ludens
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, evento_id)
);

-- Tabla de rúbricas
CREATE TABLE IF NOT EXISTS rubricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de aspectos de rúbrica
CREATE TABLE IF NOT EXISTS aspectos_rubrica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubrica_id UUID REFERENCES rubricas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  valor_maximo INTEGER NOT NULL DEFAULT 10,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de calificaciones
CREATE TABLE IF NOT EXISTS calificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurado_id UUID REFERENCES jurados(id) ON DELETE CASCADE,
  equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
  rubrica_id UUID REFERENCES rubricas(id) ON DELETE CASCADE,
  aspecto_id UUID REFERENCES aspectos_rubrica(id) ON DELETE CASCADE,
  puntuacion INTEGER NOT NULL CHECK (puntuacion >= 0),
  observacion_aspecto TEXT,
  observacion_general TEXT, -- Observación general por rúbrica (se guarda una vez por rúbrica)
  fecha_calificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(jurado_id, equipo_id, rubrica_id, aspecto_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_equipos_evento ON equipos(evento_id);
CREATE INDEX IF NOT EXISTS idx_jurados_evento ON jurados(evento_id);
CREATE INDEX IF NOT EXISTS idx_jurados_usuario ON jurados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rubricas_evento ON rubricas(evento_id);
CREATE INDEX IF NOT EXISTS idx_aspectos_rubrica ON aspectos_rubrica(rubrica_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_jurado ON calificaciones(jurado_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_equipo ON calificaciones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_rubrica ON calificaciones(rubrica_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipos_updated_at BEFORE UPDATE ON equipos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jurados_updated_at BEFORE UPDATE ON jurados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rubricas_updated_at BEFORE UPDATE ON rubricas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aspectos_rubrica_updated_at BEFORE UPDATE ON aspectos_rubrica
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calificaciones_updated_at BEFORE UPDATE ON calificaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios en tablas
COMMENT ON TABLE eventos IS 'Eventos de competencia FLL organizados por fechas';
COMMENT ON TABLE equipos IS 'Equipos participantes en eventos';
COMMENT ON TABLE jurados IS 'Asignación de jurados (usuarios) a eventos';
COMMENT ON TABLE rubricas IS 'Rúbricas de calificación asociadas a eventos';
COMMENT ON TABLE aspectos_rubrica IS 'Aspectos individuales de cada rúbrica con valores máximos';
COMMENT ON TABLE calificaciones IS 'Calificaciones realizadas por jurados a equipos';
