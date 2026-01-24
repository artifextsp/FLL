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
        juradoDashboard: resolve(__dirname, 'jurado/dashboard.html'),
        equipoDashboard: resolve(__dirname, 'equipo/dashboard.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
