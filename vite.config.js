import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html',
        adminDashboard: './admin/dashboard.html',
        juradoDashboard: './jurado/dashboard.html',
        equipoDashboard: './equipo/dashboard.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
