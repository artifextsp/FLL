-- ============================================
-- Verificar y asignar contraseñas a equipos existentes
-- ============================================

-- 1. Ver equipos que NO tienen contraseña
SELECT 
    id,
    nombre,
    evento_id,
    contrasena,
    CASE 
        WHEN contrasena IS NULL OR contrasena = '' THEN '❌ Sin contraseña'
        ELSE '✅ Con contraseña'
    END AS estado
FROM equipos
WHERE activo = true
ORDER BY nombre;

-- 2. Asignar contraseñas a equipos que NO tienen (si aún no se ejecutó el script principal)
UPDATE equipos 
SET contrasena = LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE (contrasena IS NULL OR contrasena = '') AND activo = true;

-- 3. Ver todas las contraseñas asignadas (para compartir con los equipos)
SELECT 
    e.nombre AS equipo,
    ev.nombre AS evento,
    e.contrasena AS contraseña,
    CASE 
        WHEN e.contrasena IS NULL OR e.contrasena = '' THEN '❌ Sin contraseña'
        ELSE '✅ Asignada'
    END AS estado
FROM equipos e
LEFT JOIN eventos ev ON e.evento_id = ev.id
WHERE e.activo = true
ORDER BY ev.nombre, e.nombre;

-- 4. Regenerar contraseña para un equipo específico (reemplaza 'EQUIPO_ID' con el UUID del equipo)
-- UPDATE equipos 
-- SET contrasena = LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
-- WHERE id = 'EQUIPO_ID';

-- 5. Regenerar todas las contraseñas (CUIDADO: esto cambiará todas las contraseñas existentes)
-- UPDATE equipos 
-- SET contrasena = LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
-- WHERE activo = true;
