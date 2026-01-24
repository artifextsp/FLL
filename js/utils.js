// ============================================
// UTILIDADES GENERALES
// ============================================

import { Logger } from './config.js';

/**
 * Formatear fecha para mostrar
 */
export function formatearFecha(fecha, incluirHora = false) {
  if (!fecha) return '';
  
  try {
    const date = new Date(fecha);
    const opciones = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    if (incluirHora) {
      opciones.hour = '2-digit';
      opciones.minute = '2-digit';
    }
    
    return date.toLocaleDateString('es-ES', opciones);
  } catch (error) {
    Logger.error('Error al formatear fecha:', error);
    return fecha;
  }
}

/**
 * Mostrar alerta al usuario
 */
export function mostrarAlerta(mensaje, tipo = 'info', duracion = 3000) {
  // Crear elemento de alerta
  const alerta = document.createElement('div');
  alerta.className = `alerta alerta-${tipo}`;
  alerta.textContent = mensaje;
  alerta.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${tipo === 'error' ? '#f44336' : tipo === 'success' ? '#4caf50' : '#2196f3'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(alerta);
  
  setTimeout(() => {
    alerta.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(alerta);
    }, 300);
  }, duracion);
}

/**
 * Confirmar acción del usuario
 */
export function confirmarAccion(mensaje) {
  return window.confirm(mensaje);
}

/**
 * Validar email
 */
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Debounce para funciones
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Calcular promedio de un array de números
 */
export function calcularPromedio(numeros) {
  if (!numeros || numeros.length === 0) return 0;
  const suma = numeros.reduce((acc, num) => acc + num, 0);
  return suma / numeros.length;
}

/**
 * Redondear a 2 decimales
 */
export function redondear(numero, decimales = 2) {
  return Math.round(numero * Math.pow(10, decimales)) / Math.pow(10, decimales);
}
