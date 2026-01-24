# 🔧 Fix: Error 401 Unauthorized en Supabase

## Problema
La aplicación muestra error `401 (Unauthorized)` al intentar cargar datos desde Supabase, aunque la configuración de conexión es correcta.

## Causa
Las políticas RLS (Row Level Security) en Supabase están bloqueando el acceso anónimo a las tablas.

## Solución

### Paso 1: Ejecutar el script SQL en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: `tvqugpqsmulwfqwwgkgp`
3. Ve a **SQL Editor** (en el menú lateral)
4. Abre el archivo `database/rls_anon_allowed.sql` de este proyecto
5. Copia TODO el contenido del archivo
6. Pégalo en el SQL Editor de Supabase
7. Haz clic en **RUN** (o presiona `Ctrl+Enter` / `Cmd+Enter`)

### Paso 2: Verificar que las políticas se crearon

Después de ejecutar el script, deberías ver mensajes de éxito. Para verificar:

1. En Supabase, ve a **Authentication** > **Policies**
2. O ejecuta esta consulta en el SQL Editor:

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

Deberías ver políticas `anon_all_*` para todas las tablas:
- `anon_all_eventos`
- `anon_all_equipos`
- `anon_all_jurados`
- `anon_all_rubricas`
- `anon_all_aspectos_rubrica`
- `anon_all_niveles_aspecto` ⚠️ **IMPORTANTE: Esta es nueva**
- `anon_all_calificaciones`

### Paso 3: Probar la aplicación

1. Recarga la aplicación en GitHub Pages: https://artifextsp.github.io/FLL
2. Inicia sesión con las credenciales de jurado
3. Deberías poder ver los eventos cargándose correctamente

## Notas Importantes

⚠️ **Esta configuración permite acceso completo (lectura y escritura) para usuarios anónimos**. Esto es apropiado para la fase BETA donde usamos autenticación simulada.

🔒 **Para producción**, deberías implementar políticas más restrictivas basadas en roles reales de Supabase Auth.

## Si el problema persiste

1. Verifica que RLS esté habilitado en todas las tablas:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('eventos', 'equipos', 'jurados', 'rubricas', 'aspectos_rubrica', 'niveles_aspecto', 'calificaciones');
```

Todos deberían mostrar `rowsecurity = true`.

2. Verifica que las políticas existan:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

3. Si alguna tabla no tiene políticas, ejecuta manualmente:
```sql
CREATE POLICY "anon_all_[NOMBRE_TABLA]" ON [nombre_tabla] FOR ALL USING (true) WITH CHECK (true);
```
