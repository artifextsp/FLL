-- ============================================
-- RLS: Permitir operaciones con rol anon
-- Para fase beta: la app usa login simulado, no Supabase Auth.
-- Ejecutar en Supabase > SQL Editor
-- ============================================

-- Eliminar políticas existentes si las creaste antes
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer eventos" ON eventos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir eventos" ON eventos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer equipos" ON equipos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir equipos" ON equipos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer jurados" ON jurados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir jurados" ON jurados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer rubricas" ON rubricas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir rubricas" ON rubricas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer aspectos_rubrica" ON aspectos_rubrica;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir aspectos_rubrica" ON aspectos_rubrica;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden escribir calificaciones" ON calificaciones;

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

-- Calificaciones
CREATE POLICY "anon_all_calificaciones" ON calificaciones FOR ALL USING (true) WITH CHECK (true);
