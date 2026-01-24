# Guía de Despliegue en GitHub Pages

## Configuración para GitHub Pages

Esta guía te ayudará a desplegar la aplicación FLL directamente desde GitHub Pages, eliminando la dependencia de Vercel.

## Pasos para Configurar GitHub Pages

### 1. Preparar el Repositorio

1. Asegúrate de que todos los cambios estén commiteados y pusheados:
   ```bash
   git add .
   git commit -m "Configuración para GitHub Pages"
   git push origin main
   ```

### 2. Configurar GitHub Pages en el Repositorio

1. Ve a tu repositorio en GitHub: `https://github.com/artifextsp/FLL`
2. Click en **Settings** (Configuración)
3. En el menú lateral, busca **Pages** (Páginas)
4. En **Source** (Origen), selecciona:
   - **Branch**: `main`
   - **Folder**: `/ (root)` o `/docs` si prefieres usar la carpeta docs
5. Click en **Save** (Guardar)

### 3. Configurar el Build para GitHub Pages

El repositorio está configurado para usar `/FLL` como base path. Si tu repositorio tiene otro nombre, actualiza:

1. **En `vite.config.js`**: Cambia `BASE_PATH` si es necesario
2. **En `js/auth.js`**: La función `getBasePath()` detecta automáticamente GitHub Pages

### 4. Build y Deploy

**Opción A: Build Manual**

1. Ejecuta el build:
   ```bash
   npm run build
   ```

2. Copia el contenido de `dist/` a la raíz del repositorio (o a `docs/` si configuraste GitHub Pages para usar docs)

3. Commit y push:
   ```bash
   git add .
   git commit -m "Deploy a GitHub Pages"
   git push origin main
   ```

**Opción B: GitHub Actions (Automático)**

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          BASE_PATH: /FLL
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 5. Acceder a la Aplicación

Una vez configurado, tu aplicación estará disponible en:
- `https://artifextsp.github.io/FLL/`

## Estructura de URLs en GitHub Pages

- Login: `https://artifextsp.github.io/FLL/`
- Admin Dashboard: `https://artifextsp.github.io/FLL/admin/dashboard.html`
- Jurado Dashboard: `https://artifextsp.github.io/FLL/jurado/dashboard.html`
- Equipo Dashboard: `https://artifextsp.github.io/FLL/equipo/dashboard.html`

## Detección Automática

El código detecta automáticamente si está en:
- **GitHub Pages**: Usa `/FLL` como base path
- **Desarrollo local**: Usa `''` (root)
- **Otros hostings**: Detecta `/fll` en el pathname

## Variables de Entorno

Para desarrollo local, crea `.env.local`:
```
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

**Nota**: GitHub Pages es estático, así que las variables de entorno deben estar hardcodeadas en el código o usar un servicio externo para configuración.

## Ventajas de GitHub Pages

✅ Gratis y sin límites  
✅ Integración directa con GitHub  
✅ HTTPS automático  
✅ Sin configuración compleja de servidor  
✅ Despliegue automático con GitHub Actions  

## Desventajas

❌ Solo archivos estáticos (no backend)  
❌ Variables de entorno limitadas  
❌ Sin rewrites complejos (pero no los necesitamos)  

## Troubleshooting

### Problema: Las rutas no funcionan
**Solución**: Verifica que `.nojekyll` esté en la raíz del repositorio

### Problema: Los assets no cargan
**Solución**: Verifica que `vite.config.js` tenga el `base` correcto (`/FLL`)

### Problema: Redirecciones no funcionan
**Solución**: GitHub Pages sirve archivos estáticos directamente, las redirecciones deben ser manejadas por JavaScript (ya implementado)

## Próximos Pasos

1. Configura GitHub Pages en el repositorio
2. Haz push de los cambios
3. Espera unos minutos para que GitHub Pages se actualice
4. Prueba la aplicación en `https://artifextsp.github.io/FLL/`
