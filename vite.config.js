import { defineConfig } from 'vite';
import { resolve } from 'path';

// Base path para GitHub Pages (cambiar si el repositorio tiene otro nombre)
const BASE_PATH = process.env.BASE_PATH || '/FLL';

export default defineConfig({
  root: '.',
  base: BASE_PATH,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Asegurar que las dependencias se empaqueten correctamente
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        adminDashboard: resolve(__dirname, 'admin/dashboard.html'),
        adminEventos: resolve(__dirname, 'admin/eventos.html'),
        adminEquipos: resolve(__dirname, 'admin/equipos.html'),
        adminJurados: resolve(__dirname, 'admin/jurados.html'),
        adminRubricas: resolve(__dirname, 'admin/rubricas.html'),
        juradoDashboard: resolve(__dirname, 'jurado/dashboard.html'),
        juradoCalificar: resolve(__dirname, 'jurado/calificar.html'),
        equipoDashboard: resolve(__dirname, 'equipo/dashboard.html'),
        equipoResultados: resolve(__dirname, 'equipo/resultados.html')
      },
      output: {
        // Asegurar que los módulos se empaqueten correctamente
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Asegurar que las dependencias se incluyan en el bundle
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  resolve: {
    // Asegurar que las dependencias se resuelvan correctamente
    dedupe: ['@supabase/supabase-js']
  },
  optimizeDeps: {
    // Pre-bundling de dependencias
    include: ['@supabase/supabase-js']
  },
  server: {
    port: 3000,
    open: true
  }
});
