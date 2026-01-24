# Configuración de Supabase - Estado Actual

## ✅ Credenciales Configuradas

Las credenciales de Supabase han sido configuradas en el archivo `.env.local`:

- **URL**: `https://tvqugpqsmulwfqwwgkgp.supabase.co`
- **Anon Key**: Configurada
- **API Base**: `https://tvqugpqsmulwfqwwgkgp.supabase.co/rest/v1`

## 📋 Próximos Pasos para Completar la Configuración

### 1. Ejecutar el Esquema de Base de Datos

Necesitas ejecutar el archivo `database/schema.sql` en Supabase para crear todas las tablas:

1. **Ir a Supabase Dashboard**:
   - Accede a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abrir SQL Editor**:
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New query"

3. **Ejecutar el Schema**:
   - Abre el archivo `database/schema.sql` de este proyecto
   - Copia todo el contenido
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en "Run" o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

4. **Verificar las Tablas**:
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver las siguientes tablas:
     - ✅ `eventos`
     - ✅ `equipos`
     - ✅ `jurados`
     - ✅ `rubricas`
     - ✅ `aspectos_rubrica`
     - ✅ `calificaciones`

### 2. Configurar Row Level Security (RLS)

Después de crear las tablas, configura las políticas de seguridad:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurados ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspectos_rubrica ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

-- Política básica: Permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer eventos"
  ON eventos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden leer equipos"
  ON equipos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden leer jurados"
  ON jurados FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden leer rubricas"
  ON rubricas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden leer aspectos_rubrica"
  ON aspectos_rubrica FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden leer calificaciones"
  ON calificaciones FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política para escritura (ajustar según necesidades de permisos)
-- Por ahora, permitir escritura a usuarios autenticados
-- En producción, deberías restringir esto según roles

CREATE POLICY "Usuarios autenticados pueden escribir eventos"
  ON eventos FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden escribir equipos"
  ON equipos FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden escribir jurados"
  ON jurados FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden escribir rubricas"
  ON rubricas FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden escribir aspectos_rubrica"
  ON aspectos_rubrica FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden escribir calificaciones"
  ON calificaciones FOR ALL
  USING (auth.role() = 'authenticated');
```

**Nota**: Estas políticas son básicas para desarrollo. En producción, deberás ajustarlas según los roles de usuario (admin, jurado, equipo).

### 3. Verificar la Conexión

Para verificar que todo está configurado correctamente:

1. **Instalar dependencias** (si aún no lo has hecho):
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. **Verificar en la consola del navegador**:
   - Abre la aplicación en http://localhost:3000
   - Abre DevTools (F12)
   - Ve a la pestaña "Console"
   - No debería haber errores de conexión a Supabase

### 4. Configurar Variables en Vercel (Para Producción)

Cuando despliegues en Vercel, necesitarás agregar las variables de entorno:

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega las siguientes variables:
   - `VITE_SUPABASE_URL` = `https://tvqugpqsmulwfqwwgkgp.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tu anon key completa)
   - `VITE_API_BASE` = `https://tvqugpqsmulwfqwwgkgp.supabase.co/rest/v1`
   - `VITE_APP_NAME` = `Sistema de Calificación FLL`

## 🔒 Seguridad

- ✅ El archivo `.env.local` está en `.gitignore` y NO se subirá al repositorio
- ✅ Las credenciales reales están solo en tu máquina local
- ⚠️ **NUNCA** subas archivos `.env.local` o `.env` con credenciales reales a GitHub
- ⚠️ Para producción, usa las variables de entorno de Vercel

## 📝 Notas Importantes

- **Anon Key vs Secret Key**: 
  - La **anon key** es pública y segura para usar en el frontend
  - La **secret key** NUNCA debe usarse en el frontend, solo en el backend

- **API Keys proporcionadas**:
  - Anon Key: ✅ Configurada (segura para frontend)
  - Public API Key: No necesaria para este proyecto
  - Secret Key: ⚠️ NO usar en frontend, guardar solo para uso backend si es necesario

## ✅ Checklist de Configuración

- [x] Credenciales configuradas en `.env.local`
- [ ] Esquema de base de datos ejecutado en Supabase
- [ ] Tablas creadas y verificadas
- [ ] Row Level Security configurado
- [ ] Conexión verificada localmente
- [ ] Variables de entorno configuradas en Vercel (cuando despliegues)

## 🆘 Solución de Problemas

### Error: "Failed to fetch" o "Network error"
- Verifica que las credenciales en `.env.local` sean correctas
- Verifica que el proyecto de Supabase esté activo
- Verifica que RLS permita la operación que intentas realizar

### Error: "relation does not exist"
- Asegúrate de haber ejecutado `database/schema.sql` completamente
- Verifica que todas las tablas se crearon correctamente

### Error: "permission denied"
- Verifica que RLS esté configurado correctamente
- Asegúrate de que las políticas permitan la operación que intentas
