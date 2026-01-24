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
// Vite reemplaza import.meta.env.* durante el build, si no están disponibles quedan como undefined o ""
// Usamos una función helper para asegurar que siempre tengamos un valor válido
function getEnvVar(envVar, fallback) {
  const value = import.meta.env[envVar];
  // Si es undefined, null, o string vacío, usar fallback
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return fallback;
  }
  return typeof value === 'string' ? value.trim() : value;
}

const CONFIG = {
  API_BASE: getEnvVar('VITE_API_BASE', API_BASE_FALLBACK),
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL', SUPABASE_URL_FALLBACK),
  SUPABASE_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY', SUPABASE_KEY_FALLBACK),
  APP_NAME: getEnvVar('VITE_APP_NAME', 'Sistema de Calificación FLL')
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
console.log('- URL Supabase:', CONFIG.SUPABASE_URL ? CONFIG.SUPABASE_URL.substring(0, 30) + '...' : 'NO DEFINIDA');
console.log('- Anon Key:', CONFIG.SUPABASE_KEY ? 'DEFINIDA (' + CONFIG.SUPABASE_KEY.substring(0, 20) + '...)' : 'NO DEFINIDA');
console.log('- API Base:', CONFIG.API_BASE || 'NO DEFINIDA', '(opcional)');

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
  console.error('❌ ERROR CRÍTICO: Configuración de Supabase incompleta');
  console.error('- SUPABASE_URL:', CONFIG.SUPABASE_URL || 'NO DEFINIDA');
  console.error('- SUPABASE_KEY:', CONFIG.SUPABASE_KEY ? 'DEFINIDA' : 'NO DEFINIDA');
} else {
  console.log('✅ Configuración de Supabase completa');
}

export { CONFIG, Logger };
