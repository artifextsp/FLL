-- ============================================
-- Generar reporte de contraseñas para compartir con equipos
-- ============================================

-- Este query genera un reporte completo con todas las contraseñas
-- Útil para imprimir o compartir con los equipos

SELECT 
    ev.nombre AS "Evento",
    e.nombre AS "Equipo",
    e.contrasena AS "Contraseña",
    CASE 
        WHEN e.contrasena IS NULL OR e.contrasena = '' THEN '⚠️ PENDIENTE'
        ELSE '✅ LISTA'
    END AS "Estado"
FROM equipos e
LEFT JOIN eventos ev ON e.evento_id = ev.id
WHERE e.activo = true
ORDER BY ev.nombre, e.nombre;

-- Para ver solo equipos sin contraseña:
-- SELECT 
--     ev.nombre AS evento,
--     e.nombre AS equipo,
--     e.id AS equipo_id
-- FROM equipos e
-- LEFT JOIN eventos ev ON e.evento_id = ev.id
-- WHERE (e.contrasena IS NULL OR e.contrasena = '') AND e.activo = true
-- ORDER BY ev.nombre, e.nombre;
