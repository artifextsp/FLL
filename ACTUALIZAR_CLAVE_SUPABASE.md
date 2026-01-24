# 🔑 Actualizar Clave Anónima de Supabase

## Pasos para obtener la clave correcta:

1. Ve a tu proyecto en Supabase:
   - https://supabase.com/dashboard/project/tvqugpqsmulwfqwwgkgp

2. En el menú lateral, ve a **Settings** → **API**

3. En la sección **Project API keys**, encuentra la clave **"anon public"**

4. Copia la clave completa (debe empezar con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

5. Una vez que tengas la clave, actualiza el archivo `js/config.js` en la línea 11:

```javascript
const SUPABASE_KEY_FALLBACK = 'TU_CLAVE_AQUI';
```

6. Ejecuta el build y despliega:
```bash
npm run build
git add js/config.js
git commit -m "Fix: Actualizar clave anónima de Supabase"
git push origin main
```

## Verificación

Después de actualizar, la aplicación debería:
- ✅ Conectarse correctamente a Supabase
- ✅ Cargar eventos sin error 401
- ✅ Permitir calificar equipos

## Nota de Seguridad

⚠️ **Esta clave es pública y está expuesta en el código del frontend**. Esto es normal para la clave "anon", pero asegúrate de que las políticas RLS estén correctamente configuradas para proteger tus datos.
