# Guía Visual: Configurar Variables de Entorno en Vercel

## 📍 Ubicación en Vercel

1. Ve a tu proyecto en Vercel
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral izquierdo, haz clic en **Environment Variables**

## ➕ Agregar Variables - Paso a Paso

### Opción 1: Agregar Manualmente (Recomendado)

#### Variable 1: VITE_SUPABASE_URL
1. En el campo **Key** (columna izquierda), escribe:
   ```
   VITE_SUPABASE_URL
   ```
2. En el campo **Value** (columna derecha), escribe:
   ```
   https://tvqugpqsmulwfqwwgkgp.supabase.co
   ```

#### Variable 2: VITE_SUPABASE_ANON_KEY
1. Haz clic en el botón **"+ Add Another"** (arriba a la derecha)
2. En el nuevo campo **Key**, escribe:
   ```
   VITE_SUPABASE_ANON_KEY
   ```
3. En el nuevo campo **Value**, pega la clave completa:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cXVncHFzbXVsd2Zxd3dna2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDgyMjcsImV4cCI6MjA4NDc4NDIyN30.H3Tk5QWTsjQuS4--_AnL2PipZjvVE-XYfU5920zP1C
   ```
4. ⚠️ **IMPORTANTE**: Activa el toggle **"Sensitive"** para esta variable (oculta el valor por seguridad)

#### Variable 3: VITE_API_BASE
1. Haz clic en **"+ Add Another"** nuevamente
2. En el campo **Key**, escribe:
   ```
   VITE_API_BASE
   ```
3. En el campo **Value**, escribe:
   ```
   https://tvqugpqsmulwfqwwgkgp.supabase.co/rest/v1
   ```

#### Variable 4: VITE_APP_NAME
1. Haz clic en **"+ Add Another"** una vez más
2. En el campo **Key**, escribe:
   ```
   VITE_APP_NAME
   ```
3. En el campo **Value**, escribe:
   ```
   Sistema de Calificación FLL
   ```

### Opción 2: Importar desde .env (Más Rápido)

1. Haz clic en el botón **"Import .env"** (abajo a la izquierda del diálogo)
2. Copia y pega el siguiente contenido completo:

```env
VITE_SUPABASE_URL=https://tvqugpqsmulwfqwwgkgp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cXVncHFzbXVsd2Zxd3dna2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDgyMjcsImV4cCI6MjA4NDc4NDIyN30.H3Tk5QWTsjQuS4--_AnL2PipZjvVE-XYfU5920zP1C
VITE_API_BASE=https://tvqugpqsmulwfqwwgkgp.supabase.co/rest/v1
VITE_APP_NAME=Sistema de Calificación FLL
```

3. Vercel automáticamente parseará las variables y las mostrará en los campos
4. Después de importar, asegúrate de activar el toggle **"Sensitive"** para `VITE_SUPABASE_ANON_KEY`

## ⚙️ Configuración Adicional

### Environments (Entornos)
- Deja seleccionado **"All Environments"** para que las variables funcionen en:
  - Production (Producción)
  - Preview (Vista previa)
  - Development (Desarrollo)

O selecciona específicamente según tus necesidades.

### Sensitive (Sensible)
- ✅ **Activa** el toggle "Sensitive" para `VITE_SUPABASE_ANON_KEY`
- Esto oculta el valor en la interfaz de Vercel por seguridad
- Las otras variables pueden quedarse sin el toggle activado

## 💾 Guardar

1. Revisa que todas las 4 variables estén correctamente escritas
2. Haz clic en el botón **"Save"** (Guardar) en la esquina inferior derecha del diálogo
3. Espera a que aparezca el mensaje de confirmación

## ✅ Verificación

Después de guardar, deberías ver las 4 variables listadas en la página de Environment Variables:

- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY (con icono de candado si marcaste "Sensitive")
- ✅ VITE_API_BASE
- ✅ VITE_APP_NAME

## 🔄 Aplicar Cambios

**IMPORTANTE**: Después de agregar las variables, necesitas hacer un nuevo despliegue para que se apliquen:

1. Ve a la pestaña **"Deployments"** en Vercel
2. Haz clic en los tres puntos (...) del último despliegue
3. Selecciona **"Redeploy"** (Redesplegar)
4. O simplemente haz un nuevo push a GitHub y Vercel desplegará automáticamente

## 🆘 Solución de Problemas

### Las variables no aparecen después de guardar
- Refresca la página (F5)
- Verifica que hiciste clic en "Save"

### Error al importar .env
- Asegúrate de copiar todo el contenido sin espacios extra al inicio
- Verifica que cada línea tenga el formato `KEY=value`

### Las variables no funcionan en producción
- Verifica que seleccionaste "All Environments" o "Production"
- Haz un nuevo despliegue después de agregar las variables

## 📝 Resumen de Variables a Agregar

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://tvqugpqsmulwfqwwgkgp.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (completa) |
| `VITE_API_BASE` | `https://tvqugpqsmulwfqwwgkgp.supabase.co/rest/v1` |
| `VITE_APP_NAME` | `Sistema de Calificación FLL` |
