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
  
  if (!user || !user.id) {
    window.location.href = 'index.html';
    return null;
  }
  
  // Usar rol activo si está disponible, sino usar tipo_usuario
  const tipoActivo = user.rol_activo || user.tipo_usuario;
  
  if (tipoRequerido && tipoActivo !== tipoRequerido) {
    // Si el usuario tiene múltiples roles, verificar si puede cambiar de rol
    if (user.tipo_usuario === 'admin' && tipoRequerido === 'docente') {
      // Verificar si tiene asignaciones como docente
      // Por ahora, permitir acceso si es admin (tiene acceso total)
      return user;
    }
    
    // Super admin tiene acceso a todo, incluyendo funciones de admin
    if (user.tipo_usuario === 'super_admin' && tipoRequerido === 'admin') {
      return user; // Super admin puede acceder a funciones de admin
    }
    
    mostrarAlerta('No tienes permisos para acceder a esta página', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return null;
  }
  
  return user;
}

/**
 * Cerrar sesión
 */
export function logout() {
  try {
    // Limpiar datos de usuario
    localStorage.removeItem('pcre_user');
    
    // Limpiar cualquier otro dato relacionado con la sesión
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('pcre_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (cleanError) {
      Logger.warn('Error al limpiar datos adicionales:', cleanError);
    }
    
    // Redirigir a la página de login
    window.location.replace('index.html');
  } catch (error) {
    Logger.error('Error al cerrar sesión:', error);
    // Aun así, intentar redirigir
    window.location.replace('index.html');
  }
}

/**
 * Verificar si un usuario tiene múltiples roles disponibles
 */
export async function tieneMultiplesRoles(user) {
  if (!user || !user.id) return false;
  
  let rolesCount = 1; // Siempre tiene al menos su tipo_usuario
  
  // Verificar si es acudiente
  if (user.tipo_usuario !== 'estudiante') {
    try {
      const rAcudiente = await fetch(
        `${CONFIG.API_BASE}/acudientes?usuario_id=eq.${user.id}&activo=eq.true&select=id&limit=1`,
        {
          headers: {
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
          },
          mode: 'cors',
          credentials: 'omit'
        }
      );
      
      if (rAcudiente.ok) {
        const acudientes = await rAcudiente.json();
        if (acudientes && acudientes.length > 0) {
          rolesCount++;
        }
      }
    } catch (error) {
      Logger.warn('Error al verificar rol de acudiente:', error);
    }
  }
  
  // Verificar si tiene asignaciones como docente
  if (user.tipo_usuario !== 'estudiante' && user.tipo_usuario !== 'docente') {
    try {
      const rDocenteGrados = await fetch(
        `${CONFIG.API_BASE}/docente_grados?docente_id=eq.${user.id}&select=id&limit=1`,
        {
          headers: {
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
          },
          mode: 'cors',
          credentials: 'omit'
        }
      );
      
      if (rDocenteGrados.ok) {
        const docenteGrados = await rDocenteGrados.json();
        if (docenteGrados && docenteGrados.length > 0) {
          rolesCount++;
        }
      }
    } catch (error) {
      Logger.warn('Error al verificar asignaciones docentes:', error);
    }
  }
  
  // Verificar si es director de grupo
  if (user.tipo_usuario !== 'estudiante') {
    try {
      const rDirector = await fetch(
        `${CONFIG.API_BASE}/director_grupos?docente_id=eq.${user.id}&activo=eq.true&select=id&limit=1`,
        {
          headers: {
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
          },
          mode: 'cors',
          credentials: 'omit'
        }
      );
      
      if (rDirector.ok) {
        const directores = await rDirector.json();
        if (directores && directores.length > 0) {
          rolesCount++;
        }
      }
    } catch (error) {
      Logger.warn('Error al verificar rol de director de grupo:', error);
    }
  }
  
  // Si es super_admin con colegio_id, puede acceder como admin
  if (user.tipo_usuario === 'super_admin' && user.colegio_id) {
    rolesCount++;
  }
  
  // Para admin sin colegio_id, no permitir múltiples roles
  if (user.tipo_usuario === 'admin' && !user.colegio_id) {
    return false;
  }
  
  return rolesCount > 1;
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
