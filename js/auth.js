// ============================================
// GESTIÓN DE AUTENTICACIÓN Y SESIÓN
// Reutilizado del sistema Ludens
// ============================================

import { CONFIG, Logger } from './config.js';

/** Base path de la app (ej. /FLL en Vercel, '' en dev). Una sola fuente de verdad. */
function getBasePath() {
  try {
    const host = (typeof location !== 'undefined' && location.hostname) || '';
    const p = ((typeof location !== 'undefined' && location.pathname) || '').toLowerCase();
    
    // Prioridad 1: Si el pathname contiene /fll, usar /FLL
    if (p.startsWith('/fll')) {
      console.log('🔍 getBasePath - Detectado /fll en pathname, retornando /FLL');
      return '/FLL';
    }
    
    // Prioridad 2: Si estamos en Vercel, usar /FLL
    if (host.includes('vercel.app')) {
      console.log('🔍 getBasePath - Detectado vercel.app, retornando /FLL');
      return '/FLL';
    }
    
    // Prioridad 3: Si estamos en root o index, no hay base path
    if (p === '/' || p === '/index.html' || !p) {
      console.log('🔍 getBasePath - Root o index, retornando ""');
      return '';
    }
    
    // Prioridad 4: Si el primer segmento es admin/jurado/equipo, no hay base path (son subcarpetas)
    const first = (p.match(/^\/([^/]+)/) || [])[1];
    if (first === 'admin' || first === 'jurado' || first === 'equipo') {
      console.log('🔍 getBasePath - Subcarpeta detectada (' + first + '), retornando ""');
      return '';
    }
    
    // Prioridad 5: Usar el primer segmento como base path
    const base = first ? '/' + first : '';
    console.log('🔍 getBasePath - Usando primer segmento como base:', base);
    return base;
  } catch (e) {
    console.error('❌ getBasePath - Error:', e);
    return '';
  }
}

/** URL absoluta al login. Usar en todos los redirects a login (admin, jurado, etc.). */
export function getLoginUrl() {
  const base = getBasePath();
  return (base || '') + '/index.html';
}

/**
 * Obtener usuario de la sesión actual
 */
export function getUser() {
  try {
    const userStr = localStorage.getItem('pcre_user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    Logger.error('Error al obtener usuario:', error);
    return null;
  }
}

/**
 * Guardar usuario en la sesión
 */
export function setUser(userData) {
  try {
    localStorage.setItem('pcre_user', JSON.stringify(userData));
    return true;
  } catch (error) {
    Logger.error('Error al guardar usuario:', error);
    return false;
  }
}

/**
 * Requerir autenticación (redirige si no está autenticado)
 */
export function requireAuth(tipoRequerido = null) {
  const user = getUser();
  console.log('🔍 requireAuth - Verificando autenticación. Tipo requerido:', tipoRequerido);
  console.log('🔍 requireAuth - Usuario:', user);
  
  if (!user || !user.id) {
    console.error('❌ requireAuth - No hay usuario, redirigiendo a login');
    window.location.href = getLoginUrl();
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
    if (user.tipo_usuario === 'super_admin' && tipoRequerido === 'admin') {
      console.log('✅ requireAuth - Super admin accediendo como admin (permiso especial)');
      return user;
    }
    
    // Verificación normal de roles
    if (tipoActivo !== tipoRequerido) {
      console.error(`❌ requireAuth - Permiso denegado. Requerido: ${tipoRequerido}, tu rol: ${tipoActivo}`);
      alert(`No tienes permisos. Requerido: ${tipoRequerido}, tu rol: ${tipoActivo}`);
      setTimeout(() => { window.location.href = getLoginUrl(); }, 1500);
      return null;
    }
  }
  
  console.log('✅ requireAuth - Autenticación exitosa');
  return user;
}

/**
 * Cerrar sesión
 */
export function logout() {
  try {
    localStorage.removeItem('pcre_user');
    const keys = Object.keys(localStorage);
    keys.forEach(key => { if (key.startsWith('pcre_')) localStorage.removeItem(key); });
    if (getUser()) localStorage.clear();
  } catch (e) { /* ignore */ }
  window.location.replace(getLoginUrl());
}

/**
 * Verificar si un usuario tiene múltiples roles disponibles
 * NOTA: En FLL no tenemos las tablas de Ludens, así que simplificamos esta función
 */
export async function tieneMultiplesRoles(user) {
  if (!user || !user.id) return false;
  
  // En FLL, los usuarios solo tienen un rol asignado directamente
  // No necesitamos verificar tablas externas de Ludens
  // Si en el futuro necesitamos múltiples roles, se manejará aquí
  
  // Por ahora, solo verificamos si es super_admin que puede acceder como admin
  if (user.tipo_usuario === 'super_admin' && user.colegio_id) {
    return true;
  }
  
  return false;
}

/**
 * Redirigir según tipo de usuario
 */
export async function redirigirPorTipoUsuario() {
  const user = getUser();
  if (!user) {
    console.error('❌ redirigirPorTipoUsuario: No hay usuario');
    window.location.href = getLoginUrl();
    return;
  }
  
  console.log('🔍 redirigirPorTipoUsuario - Usuario:', user);
  console.log('🔍 redirigirPorTipoUsuario - tipo_usuario:', user.tipo_usuario);
  console.log('🔍 redirigirPorTipoUsuario - rol_activo:', user.rol_activo);
  
  if (user.primera_vez) {
    console.log('⚠️ Primera vez, redirigiendo a cambiar_password');
    window.location.href = (getBasePath() || '') + '/cambiar_password.html';
    return;
  }
  
  const multiplesRoles = await tieneMultiplesRoles(user);
  if (multiplesRoles && !user.rol_activo) {
    console.log('⚠️ Múltiples roles, redirigiendo a seleccionar_rol');
    window.location.href = (getBasePath() || '') + '/seleccionar_rol.html';
    return;
  }
  
  const tipoActivo = user.rol_activo || user.tipo_usuario;
  console.log('🔍 Tipo activo:', tipoActivo);

  if ((tipoActivo === 'admin' || tipoActivo === 'super_admin') && user.tipo_usuario === 'admin' && !user.colegio_id) {
    console.error('❌ Admin sin colegio_id');
    mostrarAlerta('Tu cuenta no tiene colegio asignado. Contacta al administrador.', 'error');
    setTimeout(logout, 2000);
    return;
  }

  const base = getBasePath();
  const b = base ? base + '/' : '/';
  console.log('🔍 Base path:', base, '→ URL base:', b);
  
  let destino = '';
  switch (tipoActivo) {
    case 'estudiante':
      destino = b + 'equipo/dashboard.html';
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
  window.location.href = destino;
}

/**
 * Función auxiliar para mostrar alertas (debe ser implementada en cada página)
 */
function mostrarAlerta(mensaje, tipo = 'info') {
  // Esta función debe ser implementada en cada página o en un módulo de UI
  alert(mensaje); // Implementación temporal
}

/**
 * Exportar getBasePath para uso externo si es necesario
 */
export function getBasePathExported() {
  return getBasePath();
}
