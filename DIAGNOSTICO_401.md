# 🔍 Diagnóstico: Error 401 Unauthorized

## Estado Actual

El despliegue en GitHub Pages fue exitoso, pero la aplicación sigue mostrando errores `401 (Unauthorized)` al intentar cargar datos desde Supabase.

## Posibles Causas

1. **Políticas RLS no aplicadas correctamente** (más probable)
2. **Clave API con espacios o caracteres inválidos**
3. **Problema con la configuración de Supabase**

## Pasos de Diagnóstico

### Paso 1: Verificar Políticas RLS en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/tvqugpqsmulwfqwwgkgp
2. Abre el **SQL Editor**
3. Ejecuta el script `database/verificar_rls.sql` que acabo de crear
4. Verifica que:
   - Todas las tablas muestren `RLS Habilitado = true`
   - Existan políticas `anon_all_*` para todas las tablas

### Paso 2: Si faltan políticas, ejecutar script completo

Si el script de verificación muestra que faltan políticas:

1. Abre `database/rls_anon_allowed.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Ejecuta el script completo
5. Verifica que no haya errores

### Paso 3: Verificar la clave API

1. En Supabase, ve a **Settings** → **API**
2. Copia la **"Anon Key (Legacy)"** completa
3. Verifica que no tenga espacios al inicio o final
4. Compara con la clave en `js/config.js` línea 11

### Paso 4: Probar consulta directa

En el SQL Editor de Supabase, ejecuta:

```sql
-- Esto debería funcionar si las políticas están bien
SELECT * FROM eventos WHERE activo = true LIMIT 1;
```

Si esta consulta funciona pero la aplicación sigue dando 401, el problema está en cómo se está usando la clave API en el frontend.

## Solución Temporal (Solo para Testing)

Si necesitas probar rápidamente, puedes deshabilitar temporalmente RLS:

```sql
ALTER TABLE eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipos DISABLE ROW LEVEL SECURITY;
ALTER TABLE jurados DISABLE ROW LEVEL SECURITY;
ALTER TABLE rubricas DISABLE ROW LEVEL SECURITY;
ALTER TABLE aspectos_rubrica DISABLE ROW LEVEL SECURITY;
ALTER TABLE niveles_aspecto DISABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones DISABLE ROW LEVEL SECURITY;
```

⚠️ **NO uses esto en producción**. Solo para debugging.

## Próximos Pasos

1. Ejecuta el script de verificación
2. Comparte los resultados
3. Si faltan políticas, ejecuta el script completo de RLS
4. Recarga la aplicación y verifica si funciona
