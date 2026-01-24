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

export { CONFIG, Logger };
