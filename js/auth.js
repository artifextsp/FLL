// ============================================
// GESTIÓN DE AUTENTICACIÓN Y SESIÓN
// Reutilizado del sistema Ludens
// ============================================

import { CONFIG, Logger } from './config.js';

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
  
  Logger.log('🔒 requireAuth - tipoRequerido:', tipoRequerido);
  Logger.log('🔒 requireAuth - user:', user);
  
  if (!user || !user.id) {
    Logger.warn('❌ requireAuth - No hay usuario autenticado');
    window.location.href = 'index.html';
    return null;
  }
  
  // Usar rol activo si está disponible, sino usar tipo_usuario
  const tipoActivo = user.rol_activo || user.tipo_usuario;
  Logger.log('🔒 requireAuth - tipoActivo:', tipoActivo);
  
  if (tipoRequerido && tipoActivo !== tipoRequerido) {
    // Si el usuario tiene múltiples roles, verificar si puede cambiar de rol
    if (user.tipo_usuario === 'admin' && tipoRequerido === 'docente') {
      // Verificar si tiene asignaciones como docente
      // Por ahora, permitir acceso si es admin (tiene acceso total)
      Logger.log('✅ requireAuth - Admin accediendo como docente (permitido)');
      return user;
    }
    
    // Super admin tiene acceso a todo, incluyendo funciones de admin
    if (user.tipo_usuario === 'super_admin' && tipoRequerido === 'admin') {
      Logger.log('✅ requireAuth - Super admin accediendo como admin (permitido)');
      return user; // Super admin puede acceder a funciones de admin
    }
    
    Logger.warn(`❌ requireAuth - Permisos insuficientes. Requerido: ${tipoRequerido}, Actual: ${tipoActivo}`);
    mostrarAlerta(`No tienes permisos para acceder a esta página. Requerido: ${tipoRequerido}, Tu rol: ${tipoActivo}`, 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return null;
  }
  
  Logger.log('✅ requireAuth - Acceso permitido');
  return user;
}

/**
 * Cerrar sesión
 */
export function logout() {
  try {
    Logger.log('🚪 Cerrando sesión...');
    
    // Limpiar datos de usuario
    localStorage.removeItem('pcre_user');
    
    // Limpiar cualquier otro dato relacionado con la sesión
    try {
      const keys = Object.keys(localStorage);
      let limpiados = 0;
      keys.forEach(key => {
        if (key.startsWith('pcre_')) {
          localStorage.removeItem(key);
          limpiados++;
        }
      });
      Logger.log(`🧹 Limpiados ${limpiados} elementos de localStorage`);
    } catch (cleanError) {
      Logger.warn('Error al limpiar datos adicionales:', cleanError);
    }
    
    // Verificar que se limpió
    const userRestante = getUser();
    if (userRestante) {
      Logger.warn('⚠️ Aún hay datos de usuario después de logout, forzando limpieza');
      localStorage.clear(); // Último recurso
    }
    
    Logger.log('✅ Sesión cerrada correctamente');
    
    // Redirigir a la página de login
    window.location.replace('index.html');
  } catch (error) {
    Logger.error('Error al cerrar sesión:', error);
    // Aun así, intentar limpiar y redirigir
    try {
      localStorage.clear();
    } catch (e) {
      Logger.error('Error al limpiar localStorage:', e);
    }
    window.location.replace('index.html');
  }
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
    Logger.log('❌ redirigirPorTipoUsuario - No hay usuario');
    window.location.href = 'index.html';
    return;
  }
  
  Logger.log('🔍 redirigirPorTipoUsuario - Usuario:', user);
  Logger.log('🔍 redirigirPorTipoUsuario - tipo_usuario:', user.tipo_usuario);
  Logger.log('🔍 redirigirPorTipoUsuario - rol_activo:', user.rol_activo);
  
  if (user.primera_vez) {
    Logger.log('🔍 redirigirPorTipoUsuario - Primera vez, redirigiendo a cambiar_password');
    window.location.href = 'cambiar_password.html';
    return;
  }
  
  // Si tiene múltiples roles y no ha seleccionado uno, mostrar selección
  const multiplesRoles = await tieneMultiplesRoles(user);
  if (multiplesRoles && !user.rol_activo) {
    Logger.log('🔍 redirigirPorTipoUsuario - Múltiples roles, redirigiendo a seleccionar_rol');
    window.location.href = 'seleccionar_rol.html';
    return;
  }
  
  // Si tiene un rol activo seleccionado, usar ese
  const tipoActivo = user.rol_activo || user.tipo_usuario;
  Logger.log('🔍 redirigirPorTipoUsuario - Tipo activo:', tipoActivo);
  
  // CRÍTICO: Validar que admin tenga colegio_id antes de redirigir
  if (tipoActivo === 'admin' && user.tipo_usuario === 'admin' && !user.colegio_id) {
    Logger.error('❌ redirigirPorTipoUsuario - Admin sin colegio_id, bloqueando acceso');
    mostrarAlerta('Tu cuenta no tiene un colegio asignado. Contacta al super administrador.', 'error');
    setTimeout(() => {
      logout();
    }, 3000);
    return;
  }
  
  switch(tipoActivo) {
    case 'estudiante':
      window.location.href = 'equipo/dashboard.html';
      break;
    case 'docente':
    case 'jurado':
      window.location.href = 'jurado/dashboard.html';
      break;
    case 'admin':
    case 'super_admin':
      // Validación adicional antes de redirigir
      if (!user.colegio_id && user.tipo_usuario === 'admin') {
        Logger.error('❌ redirigirPorTipoUsuario - Admin sin colegio_id, bloqueando acceso');
        mostrarAlerta('Tu cuenta no tiene un colegio asignado. Contacta al super administrador.', 'error');
        setTimeout(() => {
          logout();
        }, 3000);
        return;
      }
      window.location.href = 'admin/dashboard.html';
      break;
    default:
      Logger.log('⚠️ redirigirPorTipoUsuario - Tipo no reconocido:', tipoActivo, '- Redirigiendo a index.html');
      window.location.href = 'index.html';
  }
}

/**
 * Función auxiliar para mostrar alertas (debe ser implementada en cada página)
 */
function mostrarAlerta(mensaje, tipo = 'info') {
  // Esta función debe ser implementada en cada página o en un módulo de UI
  alert(mensaje); // Implementación temporal
}
