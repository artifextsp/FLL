// ============================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ============================================

const CONFIG = {
  API_BASE: import.meta.env.VITE_API_BASE || '',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
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
console.log('- API Base definida:', !!CONFIG.API_BASE);

if (!CONFIG.SUPABASE_URL) {
  console.error('❌ ERROR CRÍTICO: VITE_SUPABASE_URL no está definida. Verifica las variables de entorno en Vercel.');
}

export { CONFIG, Logger };
