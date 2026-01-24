// ============================================
// GESTIÓN DE AUTENTICACIÓN Y SESIÓN
// Sistema FLL - Versión Blindada y Estable
// ============================================

import { CONFIG, Logger } from './config.js';

// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================

const STORAGE_KEY = 'pcre_user';
const STORAGE_TIMESTAMP_KEY = 'pcre_user_timestamp';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
const BASE_PATH_CACHE_KEY = 'fll_base_path_cache';

// ============================================
// UTILIDADES DE SEGURIDAD
// ============================================

/**
 * Sanitiza un string para prevenir inyección XSS
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, '') // Eliminar event handlers
    .trim()
    .substring(0, 255); // Limitar longitud
}

/**
 * Valida que un objeto de usuario tenga la estructura correcta
 * @param {object} user - Objeto de usuario a validar
 * @returns {boolean} - true si es válido
 */
function isValidUser(user) {
  if (!user || typeof user !== 'object') return false;
  if (!user.id || typeof user.id !== 'string') return false;
  if (!user.tipo_usuario || typeof user.tipo_usuario !== 'string') return false;
  const validRoles = ['admin', 'jurado', 'estudiante', 'super_admin'];
  if (!validRoles.includes(user.tipo_usuario)) return false;
  return true;
}

// ============================================
// GESTIÓN DE BASE PATH (CACHEADA Y ESTABLE)
// ============================================

let _basePathCache = null;

/**
 * Base path de la app (ej. /FLL en Vercel, '' en dev). 
 * CACHEADA para evitar inconsistencias.
 */
function getBasePath() {
  // Si ya está cacheada, retornar inmediatamente
  if (_basePathCache !== null) {
    return _basePathCache;
  }

  try {
    const host = (typeof location !== 'undefined' && location.hostname) || '';
    const p = ((typeof location !== 'undefined' && location.pathname) || '').toLowerCase();
    
    // Prioridad 1: Si el pathname contiene /fll, usar /FLL
    if (p.startsWith('/fll')) {
      _basePathCache = '/FLL';
      console.log('🔍 getBasePath - Detectado /fll en pathname, cacheando /FLL');
      return _basePathCache;
    }
    
    // Prioridad 2: Si estamos en Vercel, usar /FLL
    if (host.includes('vercel.app')) {
      _basePathCache = '/FLL';
      console.log('🔍 getBasePath - Detectado vercel.app, cacheando /FLL');
      return _basePathCache;
    }
    
    // Prioridad 3: Si estamos en root o index, no hay base path
    if (p === '/' || p === '/index.html' || !p) {
      _basePathCache = '';
      console.log('🔍 getBasePath - Root o index, cacheando ""');
      return _basePathCache;
    }
    
    // Prioridad 4: Si el primer segmento es admin/jurado/equipo, no hay base path
    const first = (p.match(/^\/([^/]+)/) || [])[1];
    if (first === 'admin' || first === 'jurado' || first === 'equipo') {
      _basePathCache = '';
      console.log('🔍 getBasePath - Subcarpeta detectada (' + first + '), cacheando ""');
      return _basePathCache;
    }
    
    // Prioridad 5: Usar el primer segmento como base path
    _basePathCache = first ? '/' + first : '';
    console.log('🔍 getBasePath - Usando primer segmento como base, cacheando:', _basePathCache);
    return _basePathCache;
  } catch (e) {
    console.error('❌ getBasePath - Error:', e);
    _basePathCache = '';
    return _basePathCache;
  }
}

/**
 * Forzar recálculo del base path (útil para testing)
 */
export function resetBasePathCache() {
  _basePathCache = null;
}

/** URL absoluta al login. Usar en todos los redirects a login. */
export function getLoginUrl() {
  const base = getBasePath();
  const url = (base || '') + '/index.html';
  console.log('🔍 getLoginUrl - Base:', base, '→ URL:', url);
  return url;
}

// ============================================
// GESTIÓN DE USUARIO Y SESIÓN
// ============================================

/**
 * Obtener usuario de la sesión actual (con validación y timeout)
 */
export function getUser() {
  try {
    const userStr = localStorage.getItem(STORAGE_KEY);
    if (!userStr) {
      console.log('🔍 getUser - No hay usuario en localStorage');
      return null;
    }

    // Verificar timestamp de sesión
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age > SESSION_TIMEOUT) {
        console.warn('⚠️ getUser - Sesión expirada, limpiando');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        return null;
      }
    }

    const user = JSON.parse(userStr);
    
    // Validar estructura del usuario
    if (!isValidUser(user)) {
      console.error('❌ getUser - Usuario inválido, limpiando');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      return null;
    }

    console.log('✅ getUser - Usuario válido:', user.id, user.tipo_usuario);
    return user;
  } catch (error) {
    Logger.error('Error al obtener usuario:', error);
    // Limpiar datos corruptos
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    return null;
  }
}

/**
 * Guardar usuario en la sesión (con sanitización y validación)
 */
export function setUser(userData) {
  try {
    // Validar estructura
    if (!isValidUser(userData)) {
      console.error('❌ setUser - Datos de usuario inválidos');
      return false;
    }

    // Sanitizar datos críticos
    const sanitizedUser = {
      ...userData,
      id: sanitizeInput(userData.id),
      username: userData.username ? sanitizeInput(userData.username) : userData.id,
      nombre: userData.nombre ? sanitizeInput(userData.nombre) : userData.id,
      tipo_usuario: sanitizeInput(userData.tipo_usuario),
      rol_activo: userData.rol_activo ? sanitizeInput(userData.rol_activo) : userData.tipo_usuario
    };

    // Guardar usuario y timestamp
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedUser));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    
    // Verificar que se guardó correctamente (prevenir race conditions)
    const verify = getUser();
    if (!verify || verify.id !== sanitizedUser.id) {
      console.error('❌ setUser - Fallo en verificación post-guardado');
      return false;
    }

    console.log('✅ setUser - Usuario guardado correctamente:', sanitizedUser.id);
    return true;
  } catch (error) {
    Logger.error('Error al guardar usuario:', error);
    return false;
  }
}

/**
 * Requerir autenticación (redirige si no está autenticado)
 * VERSIÓN BLINDADA con validación robusta
 */
export function requireAuth(tipoRequerido = null) {
  const user = getUser();
  console.log('🔍 requireAuth - Verificando autenticación. Tipo requerido:', tipoRequerido);
  console.log('🔍 requireAuth - Usuario:', user ? { id: user.id, tipo: user.tipo_usuario } : null);
  
  if (!user || !user.id) {
    console.error('❌ requireAuth - No hay usuario, redirigiendo a login');
    // Usar replace para evitar que el usuario pueda volver con el botón atrás
    window.location.replace(getLoginUrl());
    return null;
  }
  
  const tipoActivo = user.rol_activo || user.tipo_usuario;
  console.log('🔍 requireAuth - Tipo activo:', tipoActivo);
  
  if (tipoRequerido) {
    // Casos especiales de permisos cruzados
    if (user.tipo_usuario === 'admin' && tipoRequerido === 'docente') {
      console.log('✅ requireAuth - Admin accediendo como docente (permiso especial)');
      return user;
    }
    if (user.tipo_usuario === 'super_admin' && (tipoRequerido === 'admin' || tipoRequerido === 'super_admin')) {
      console.log('✅ requireAuth - Super admin accediendo como admin (permiso especial)');
      return user;
    }
    
    // Verificación normal de roles (case-insensitive para mayor robustez)
    const tipoActivoLower = tipoActivo.toLowerCase();
    const tipoRequeridoLower = tipoRequerido.toLowerCase();
    
    if (tipoActivoLower !== tipoRequeridoLower) {
      console.error(`❌ requireAuth - Permiso denegado. Requerido: ${tipoRequerido}, tu rol: ${tipoActivo}`);
      alert(`No tienes permisos para acceder a esta página.\nRequerido: ${tipoRequerido}\nTu rol: ${tipoActivo}`);
      setTimeout(() => { 
        window.location.replace(getLoginUrl()); 
      }, 1500);
      return null;
    }
  }
  
  console.log('✅ requireAuth - Autenticación exitosa');
  return user;
}

/**
 * Cerrar sesión (limpieza completa y segura)
 */
export function logout() {
  try {
    console.log('🔍 logout - Iniciando cierre de sesión');
    
    // Limpiar usuario
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    
    // Limpiar todas las claves relacionadas con pcre_
    const keys = Object.keys(localStorage);
    keys.forEach(key => { 
      if (key.startsWith('pcre_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Verificar que se limpió correctamente
    if (getUser()) {
      // Si aún hay usuario, limpiar todo
      localStorage.clear();
    }
    
    console.log('✅ logout - Sesión cerrada correctamente');
  } catch (e) { 
    console.error('❌ logout - Error al cerrar sesión:', e);
    // Aun así, intentar limpiar todo
    try {
      localStorage.clear();
    } catch (e2) {
      console.error('❌ logout - Error crítico al limpiar:', e2);
    }
  }
  
  // Redirigir usando replace para evitar botón atrás
  window.location.replace(getLoginUrl());
}

/**
 * Verificar si un usuario tiene múltiples roles disponibles
 * NOTA: En FLL simplificamos esta función (no hay tablas de Ludens)
 */
export async function tieneMultiplesRoles(user) {
  if (!user || !user.id) return false;
  
  // En FLL, los usuarios solo tienen un rol asignado directamente
  // Solo verificamos si es super_admin que puede acceder como admin
  if (user.tipo_usuario === 'super_admin' && user.colegio_id) {
    return true;
  }
  
  return false;
}

/**
 * Redirigir según tipo de usuario
 * VERSIÓN BLINDADA con manejo robusto de errores y sincronización
 */
export async function redirigirPorTipoUsuario() {
  try {
    // Esperar un tick para asegurar que localStorage esté sincronizado
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const user = getUser();
    if (!user) {
      console.error('❌ redirigirPorTipoUsuario: No hay usuario después de espera');
      window.location.replace(getLoginUrl());
      return;
    }
    
    console.log('🔍 redirigirPorTipoUsuario - Usuario:', user);
    console.log('🔍 redirigirPorTipoUsuario - tipo_usuario:', user.tipo_usuario);
    console.log('🔍 redirigirPorTipoUsuario - rol_activo:', user.rol_activo);
    
    // Verificar primera vez (si existe)
    if (user.primera_vez) {
      console.log('⚠️ Primera vez, redirigiendo a cambiar_password');
      const base = getBasePath();
      window.location.replace((base || '') + '/cambiar_password.html');
      return;
    }
    
    // Verificar múltiples roles (async)
    const multiplesRoles = await tieneMultiplesRoles(user);
    if (multiplesRoles && !user.rol_activo) {
      console.log('⚠️ Múltiples roles, redirigiendo a seleccionar_rol');
      const base = getBasePath();
      window.location.replace((base || '') + '/seleccionar_rol.html');
      return;
    }
    
    const tipoActivo = user.rol_activo || user.tipo_usuario;
    console.log('🔍 Tipo activo:', tipoActivo);

    // Validación especial para admin (solo si es admin, no super_admin)
    if (tipoActivo === 'admin' && user.tipo_usuario === 'admin' && !user.colegio_id) {
      console.error('❌ Admin sin colegio_id');
      alert('Tu cuenta no tiene colegio asignado. Contacta al administrador.');
      setTimeout(() => logout(), 2000);
      return;
    }

    // Construir URL de destino
    const base = getBasePath();
    const b = base ? base + '/' : '/';
    console.log('🔍 Base path:', base, '→ URL base:', b);
    
    let destino = '';
    const tipoActivoLower = tipoActivo.toLowerCase();
    
    switch (tipoActivoLower) {
      case 'estudiante':
        destino = b + 'equipo/dashboard.html';
        console.log('✅ Redirigiendo ESTUDIANTE a:', destino);
        break;
      case 'docente':
      case 'jurado':
        destino = b + 'jurado/dashboard.html';
        console.log('✅ Redirigiendo JURADO a:', destino);
        break;
      case 'admin':
      case 'super_admin':
        destino = b + 'admin/dashboard.html';
        console.log('✅ Redirigiendo ADMIN a:', destino);
        break;
      default:
        console.error('❌ Tipo no reconocido:', tipoActivo);
        destino = getLoginUrl();
    }
    
    console.log('🚀 Redirigiendo a:', destino);
    
    // Usar replace para evitar que el usuario pueda volver con el botón atrás
    // y asegurar que la redirección se complete
    window.location.replace(destino);
    
  } catch (error) {
    console.error('❌ redirigirPorTipoUsuario - Error crítico:', error);
    // En caso de error, redirigir al login
    window.location.replace(getLoginUrl());
  }
}

/**
 * Función auxiliar para mostrar alertas
 */
function mostrarAlerta(mensaje, tipo = 'info') {
  alert(mensaje); // Implementación temporal
}

/**
 * Exportar getBasePath para uso externo si es necesario
 */
export function getBasePathExported() {
  return getBasePath();
}
