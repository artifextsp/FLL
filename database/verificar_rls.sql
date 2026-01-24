-- ============================================
-- VERIFICAR POLÍTICAS RLS EN SUPABASE
-- Ejecutar en Supabase > SQL Editor
-- ============================================

-- Verificar que RLS está habilitado en todas las tablas
SELECT 
    tablename, 
    rowsecurity as "RLS Habilitado"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('eventos', 'equipos', 'jurados', 'rubricas', 'aspectos_rubrica', 'niveles_aspecto', 'calificaciones')
ORDER BY tablename;

-- Verificar que existen políticas para rol anon
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('eventos', 'equipos', 'jurados', 'rubricas', 'aspectos_rubrica', 'niveles_aspecto', 'calificaciones')
ORDER BY tablename, policyname;

-- Si alguna tabla no tiene políticas, deberías ver un mensaje como:
-- "No rows returned"
-- En ese caso, ejecuta el script rls_anon_allowed.sql completo

-- Probar acceso anónimo a eventos (debería funcionar si las políticas están bien)
-- Descomenta la siguiente línea para probar:
-- SELECT * FROM eventos WHERE activo = true LIMIT 1;
