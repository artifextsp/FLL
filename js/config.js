// ============================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ============================================

// NOTA: GitHub Pages es estático y no soporta variables de entorno del servidor
// Para producción, estas credenciales deberían estar en variables de entorno
// En desarrollo local, se pueden usar desde .env.local

// Valores por defecto hardcodeados para GitHub Pages (BETA)
const SUPABASE_URL_FALLBACK = 'https://tvqugpqsmulwfqwwgkgp.supabase.co';
const SUPABASE_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cXVncHFzbXVsd2Zxd3dna2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDgyMjcsImV4cCI6MjA4NDc4NDIyN30.H3Tk5QWTsjQuS4--_AnL2PipZjvVE-XYfU5920zP1C';
const API_BASE_FALLBACK = 'https://tvqugpqsmulwfqwwgkgp.supabase.co/rest/v1';

// Configuración final: usar variables de entorno si están disponibles, sino usar fallback
const CONFIG = {
  API_BASE: import.meta.env.VITE_API_BASE || API_BASE_FALLBACK,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK,
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_KEY_FALLBACK,
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Sistema de Calificación FLL'
};

// Logger simple para desarrollo
const Logger = {
  log: (...args) => console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  info: (...args) => console.info('[INFO]', ...args)
};

// Diagnóstico de configuración (solo para debug)
console.log('🔍 Diagnóstico de Configuración:');
console.log('- URL Supabase definida:', !!CONFIG.SUPABASE_URL);
console.log('- Anon Key definida:', !!CONFIG.SUPABASE_KEY);
console.log('- API Base definida:', !!CONFIG.API_BASE, '(opcional; el login no la usa)');

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
  console.error('❌ ERROR CRÍTICO: Configuración de Supabase incompleta');
}

export { CONFIG, Logger };
