import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
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
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
