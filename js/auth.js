// ============================================
// SISTEMA DE AUTENTICACIÓN FLL
// Versión 2.0 - Simple, Robusto y Estable
// ============================================

/**
 * ANÁLISIS DEL PROBLEMA RAÍZ:
 * 
 * 1. Complejidad excesiva: Múltiples funciones async, delays, verificaciones redundantes
 * 2. Race conditions: Verificaciones de localStorage con delays que causan inconsistencias
 * 3. Lógica de redirección compleja: Múltiples métodos que interfieren entre sí
 * 4. Base path cacheado: Puede causar problemas si cambia el contexto
 * 5. Validaciones redundantes: Múltiples verificaciones que fallan en diferentes momentos
 * 
 * SOLUCIÓN: Sistema simple, síncrono donde sea posible, sin delays innecesarios,
 * lógica de redirección directa, manejo claro de roles sin ambigüedades.
 */

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = 'fll_user_session';
const VALID_ROLES = ['admin', 'jurado', 'estudiante'];

// ============================================
// UTILIDADES BÁSICAS
// ============================================

/**
 * Obtiene el base path de la aplicación
 * Lógica simple y directa sin cache para evitar inconsistencias
 */
function getBasePath() {
  if (typeof window === 'undefined' || !window.location) return '';
  
  const pathname = window.location.pathname.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();
  
  // Si estamos en Vercel o el pathname contiene /fll, usar /FLL
  if (hostname.includes('vercel.app') || pathname.startsWith('/fll')) {
    return '/FLL';
  }
  
  return '';
}

/**
 * Construye la URL completa para una ruta relativa
 */
function buildUrl(path) {
  const base = getBasePath();
  const basePath = base ? base + '/' : '/';
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return window.location.origin + basePath + cleanPath;
}

// ============================================
// GESTIÓN DE SESIÓN
// ============================================

/**
 * Obtiene el usuario actual de la sesión
 * Síncrono y simple - sin verificaciones complejas
 */
export function getUser() {
  try {
    const sessionData = localStorage.getItem(STORAGE_KEY);
    if (!sessionData) return null;
    
    const user = JSON.parse(sessionData);
    
    // Validación básica
    if (!user || !user.id || !user.role) return null;
    if (!VALID_ROLES.includes(user.role)) return null;
    
    return user;
  } catch (error) {
    // Si hay error, limpiar sesión corrupta
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Guarda el usuario en la sesión
 * Simple y directo - sin verificaciones post-guardado que causan race conditions
 */
export function setUser(userData) {
  try {
    // Validación básica
    if (!userData || !userData.id || !userData.role) {
      console.error('❌ setUser: Datos inválidos');
      return false;
    }
    
    if (!VALID_ROLES.includes(userData.role)) {
      console.error('❌ setUser: Rol inválido:', userData.role);
      return false;
    }
    
    // Preparar objeto de sesión simple
    const session = {
      id: String(userData.id).trim(),
      username: String(userData.username || userData.id).trim(),
      role: String(userData.role).toLowerCase(),
      nombre: String(userData.nombre || userData.id).trim(),
      timestamp: Date.now()
    };
    
    // Guardar directamente
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    
    console.log('✅ Usuario guardado:', session.id, session.role);
    return true;
  } catch (error) {
    console.error('❌ setUser: Error:', error);
    return false;
  }
}

/**
 * Limpia la sesión actual
 */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Sesión limpiada');
  } catch (error) {
    console.error('❌ Error al limpiar sesión:', error);
  }
}

/**
 * Cierra sesión y redirige al login
 */
export function logout() {
  clearSession();
  const loginUrl = buildUrl('index.html');
  window.location.href = loginUrl;
}

// ============================================
// AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated() {
  return getUser() !== null;
}

/**
 * Requiere autenticación - redirige al login si no hay sesión
 */
export function requireAuth() {
  const user = getUser();
  if (!user) {
    console.error('❌ requireAuth: No hay usuario autenticado');
    const loginUrl = buildUrl('index.html');
    window.location.replace(loginUrl);
    return null;
  }
  return user;
}

/**
 * Requiere un rol específico - redirige al login si no tiene el rol
 */
export function requireRole(requiredRole) {
  const user = requireAuth();
  if (!user) return null;
  
  if (user.role !== requiredRole.toLowerCase()) {
    console.error(`❌ Rol requerido: ${requiredRole}, rol actual: ${user.role}`);
    logout();
    return null;
  }
  
  return user;
}

// ============================================
// REDIRECCIÓN POR ROL
// ============================================

/**
 * Obtiene la URL del dashboard según el rol del usuario
 * Lógica simple y directa
 */
export function getDashboardUrl(role) {
  const roleLower = String(role).toLowerCase();
  
  switch (roleLower) {
    case 'admin':
    case 'super_admin':
      return buildUrl('admin/dashboard.html');
    
    case 'jurado':
    case 'docente':
      return buildUrl('jurado/dashboard.html');
    
    case 'estudiante':
      return buildUrl('equipo/dashboard.html');
    
    default:
      return buildUrl('index.html');
  }
}

/**
 * Redirige al usuario a su dashboard según su rol
 * Simple y directo - sin async innecesario
 */
export function redirectToDashboard() {
  const user = getUser();
  if (!user) {
    console.error('❌ redirectToDashboard: No hay usuario');
    logout();
    return;
  }
  
  const dashboardUrl = getDashboardUrl(user.role);
  console.log('🚀 Redirigiendo a:', dashboardUrl);
  
  // CRÍTICO: Usar replace para forzar navegación y evitar problemas
  // No usar href porque puede ser bloqueado o no ejecutarse
  window.location.replace(dashboardUrl);
  
  // Forzar navegación inmediata - si replace no funciona, usar href como fallback
  setTimeout(() => {
    if (window.location.href !== dashboardUrl) {
      console.warn('⚠️ Replace no funcionó, usando href como fallback');
      window.location.href = dashboardUrl;
    }
  }, 50);
}

// ============================================
// FUNCIONES DE UTILIDAD PARA COMPATIBILIDAD
// ============================================

/**
 * Obtiene la URL del login (para compatibilidad con código existente)
 */
export function getLoginUrl() {
  return buildUrl('index.html');
}

/**
 * Obtiene el base path exportado (para compatibilidad)
 */
export function getBasePathExported() {
  return getBasePath();
}
