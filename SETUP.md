# Guía de Configuración Inicial - Sistema de Calificación FLL

## 📋 Checklist de Configuración

### 1. Configuración del Repositorio GitHub

```bash
# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: Estructura base del proyecto FLL"

# Agregar remote (reemplazar con tu URL)
git remote add origin https://github.com/tu-usuario/fll-calificacion.git

# Push inicial
git branch -M main
git push -u origin main
```

### 2. Configuración de Supabase

1. **Crear proyecto en Supabase**:
   - Ir a https://supabase.com
   - Crear nuevo proyecto
   - Anotar la URL del proyecto y la API Key

2. **Crear esquema de base de datos**:
   - Ir a SQL Editor en Supabase
   - Copiar y ejecutar el contenido de `database/schema.sql`
   - Verificar que todas las tablas se crearon correctamente

3. **Configurar Row Level Security (RLS)**:
   ```sql
   -- Habilitar RLS en todas las tablas
   ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
   ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
   ALTER TABLE jurados ENABLE ROW LEVEL SECURITY;
   ALTER TABLE rubricas ENABLE ROW LEVEL SECURITY;
   ALTER TABLE aspectos_rubrica ENABLE ROW LEVEL SECURITY;
   ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
   
   -- Políticas básicas (ajustar según necesidades)
   -- Permitir lectura a usuarios autenticados
   CREATE POLICY "Usuarios autenticados pueden leer eventos"
     ON eventos FOR SELECT
     USING (auth.role() = 'authenticated');
   
   -- Permitir escritura solo a admins (ajustar según lógica de negocio)
   CREATE POLICY "Admins pueden escribir eventos"
     ON eventos FOR ALL
     USING (auth.role() = 'authenticated');
   ```

4. **Obtener credenciales**:
   - URL del proyecto: `https://xxxxx.supabase.co`
   - API Key (anon/public): Se encuentra en Settings > API

### 3. Configuración de Variables de Entorno

1. **Crear archivo `.env.local`** (no versionar):
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
   VITE_API_BASE=https://xxxxx.supabase.co/rest/v1
   VITE_APP_NAME=Sistema de Calificación FLL
   ```

2. **Para desarrollo local**:
   - El archivo `.env.local` se carga automáticamente con Vite

3. **Para Vercel**:
   - Ir a Settings > Environment Variables
   - Agregar cada variable manualmente
   - O usar CLI: `vercel env add VITE_SUPABASE_URL`

### 4. Instalación de Dependencias

```bash
# Instalar dependencias
npm install

# Verificar instalación
npm list
```

### 5. Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:3000
```

### 6. Configuración de Vercel

1. **Conectar repositorio**:
   - Ir a https://vercel.com
   - Importar proyecto desde GitHub
   - Seleccionar el repositorio `fll-calificacion`

2. **Configurar build**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Configurar variables de entorno**:
   - Agregar todas las variables de `.env.example`
   - Usar los valores de tu proyecto Supabase

4. **Desplegar**:
   - Hacer clic en "Deploy"
   - Esperar a que termine el despliegue
   - La URL será: `https://fll-calificacion.vercel.app`

### 7. Configuración de Dominio (Opcional)

1. **En Vercel**:
   - Ir a Settings > Domains
   - Agregar dominio personalizado
   - Seguir instrucciones de DNS

## 🔧 Verificación Post-Configuración

### Verificar Supabase
```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar estructura de una tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'eventos';
```

### Verificar Conexión
1. Abrir la aplicación en el navegador
2. Abrir DevTools (F12)
3. Verificar en Console que no hay errores de conexión
4. Verificar que las variables de entorno se cargan correctamente

### Verificar Autenticación
1. Intentar hacer login (usando sistema de Ludens)
2. Verificar que se guarda en `localStorage` con clave `pcre_user`
3. Verificar redirección según tipo de usuario

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Error: "VITE_SUPABASE_URL is not defined"
- Verificar que el archivo `.env.local` existe
- Verificar que las variables comienzan con `VITE_`
- Reiniciar el servidor de desarrollo

### Error: "Failed to fetch" en Supabase
- Verificar que la URL y API Key son correctas
- Verificar que RLS permite la operación
- Verificar CORS en Supabase (Settings > API)

### Error en Vercel: "Build failed"
- Verificar que `package.json` tiene el script `build`
- Verificar que las variables de entorno están configuradas
- Revisar logs de build en Vercel

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Vite](https://vitejs.dev/guide/)
- [Documentación de Chart.js](https://www.chartjs.org/docs/)

## ✅ Checklist Final

- [ ] Repositorio GitHub creado y configurado
- [ ] Proyecto Supabase creado
- [ ] Esquema de base de datos ejecutado
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas
- [ ] Servidor de desarrollo funcionando
- [ ] Proyecto desplegado en Vercel
- [ ] Conexión a Supabase verificada
- [ ] Autenticación funcionando

## 🚀 Siguiente Paso

Una vez completada la configuración inicial, proceder con la **Fase 2: Módulo de Administración**.

Ver `ROADMAP.md` para detalles completos de cada fase.
