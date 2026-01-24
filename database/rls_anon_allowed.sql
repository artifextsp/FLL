-- ============================================
-- RLS: Permitir operaciones con rol anon
-- Para fase beta: la app usa login simulado, no Supabase Auth.
-- Ejecutar en Supabase > SQL Editor
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurados ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspectos_rubrica ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveles_aspecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las creaste antes
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer eventos" ON eventos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir eventos" ON eventos;
DROP POLICY IF EXISTS "anon_all_eventos" ON eventos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer equipos" ON equipos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir equipos" ON equipos;
DROP POLICY IF EXISTS "anon_all_equipos" ON equipos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer jurados" ON jurados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir jurados" ON jurados;
DROP POLICY IF EXISTS "anon_all_jurados" ON jurados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer rubricas" ON rubricas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir rubricas" ON rubricas;
DROP POLICY IF EXISTS "anon_all_rubricas" ON rubricas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer aspectos_rubrica" ON aspectos_rubrica;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir aspectos_rubrica" ON aspectos_rubrica;
DROP POLICY IF EXISTS "anon_all_aspectos_rubrica" ON aspectos_rubrica;
DROP POLICY IF EXISTS "anon_all_niveles_aspecto" ON niveles_aspecto;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "anon_all_calificaciones" ON calificaciones;

-- Crear políticas que permiten TODO para rol anon (BETA)
-- Eventos
CREATE POLICY "anon_all_eventos" ON eventos FOR ALL USING (true) WITH CHECK (true);

-- Equipos
CREATE POLICY "anon_all_equipos" ON equipos FOR ALL USING (true) WITH CHECK (true);

-- Jurados
CREATE POLICY "anon_all_jurados" ON jurados FOR ALL USING (true) WITH CHECK (true);

-- Rúbricas
CREATE POLICY "anon_all_rubricas" ON rubricas FOR ALL USING (true) WITH CHECK (true);

-- Aspectos de rúbrica
CREATE POLICY "anon_all_aspectos_rubrica" ON aspectos_rubrica FOR ALL USING (true) WITH CHECK (true);

-- Niveles de aspecto (NUEVA - faltaba)
CREATE POLICY "anon_all_niveles_aspecto" ON niveles_aspecto FOR ALL USING (true) WITH CHECK (true);

-- Calificaciones
CREATE POLICY "anon_all_calificaciones" ON calificaciones FOR ALL USING (true) WITH CHECK (true);
