// ============================================
// GESTIÓN DE AUTENTICACIÓN Y SESIÓN
// Reutilizado del sistema Ludens
// ============================================

import { CONFIG, Logger } from './config.js';

/** Base path de la app (ej. /FLL en Vercel, '' en dev). Una sola fuente de verdad. */
function getBasePath() {
  try {
    const p = (typeof location !== 'undefined' && location.pathname) || '';
    if (p.startsWith('/FLL')) return '/FLL';
    if (p === '/' || p === '/index.html' || !p) return '';
    const m = p.match(/^\/[^/]+/);
    return m ? m[0] : '';
  } catch {
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
  if (!user || !user.id) {
    window.location.href = getLoginUrl();
    return null;
  }
  
  const tipoActivo = user.rol_activo || user.tipo_usuario;
  if (tipoRequerido && tipoActivo !== tipoRequerido) {
    if (user.tipo_usuario === 'admin' && tipoRequerido === 'docente') return user;
    if (user.tipo_usuario === 'super_admin' && tipoRequerido === 'admin') return user;
    mostrarAlerta(`No tienes permisos. Requerido: ${tipoRequerido}, tu rol: ${tipoActivo}`, 'error');
    setTimeout(() => { window.location.href = getLoginUrl(); }, 1500);
    return null;
  }
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
    window.location.href = getLoginUrl();
    return;
  }
  if (user.primera_vez) {
    window.location.href = (getBasePath() || '') + '/cambiar_password.html';
    return;
  }
  const multiplesRoles = await tieneMultiplesRoles(user);
  if (multiplesRoles && !user.rol_activo) {
    window.location.href = (getBasePath() || '') + '/seleccionar_rol.html';
    return;
  }
  const tipoActivo = user.rol_activo || user.tipo_usuario;

  if ((tipoActivo === 'admin' || tipoActivo === 'super_admin') && user.tipo_usuario === 'admin' && !user.colegio_id) {
    mostrarAlerta('Tu cuenta no tiene colegio asignado. Contacta al administrador.', 'error');
    setTimeout(logout, 2000);
    return;
  }

  const base = getBasePath();
  const b = base ? base + '/' : '';
  switch (tipoActivo) {
    case 'estudiante':
      window.location.href = b + 'equipo/dashboard.html';
      break;
    case 'docente':
    case 'jurado':
      window.location.href = b + 'jurado/dashboard.html';
      break;
    case 'admin':
    case 'super_admin':
      window.location.href = b + 'admin/dashboard.html';
      break;
    default:
      window.location.href = getLoginUrl();
  }
}

/**
 * Función auxiliar para mostrar alertas (debe ser implementada en cada página)
 */
function mostrarAlerta(mensaje, tipo = 'info') {
  // Esta función debe ser implementada en cada página o en un módulo de UI
  alert(mensaje); // Implementación temporal
}
