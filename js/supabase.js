// ============================================
// CLIENTE SUPABASE
// ============================================

import { createClient } from '@supabase/supabase-js';
import { CONFIG, Logger } from './config.js';

// Validar configuración antes de crear el cliente
if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
  Logger.error('❌ ERROR CRÍTICO: Configuración de Supabase incompleta');
  Logger.error('- SUPABASE_URL:', CONFIG.SUPABASE_URL || 'NO DEFINIDA');
  Logger.error('- SUPABASE_KEY:', CONFIG.SUPABASE_KEY ? 'DEFINIDA' : 'NO DEFINIDA');
  Logger.error('⚠️ Esto no debería ocurrir. Los fallbacks deberían estar activos.');
  throw new Error('Configuración de Supabase incompleta. Los valores de fallback no se están aplicando correctamente.');
}

// Crear cliente de Supabase
export const supabase = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_KEY
);

Logger.log('✅ Cliente Supabase inicializado correctamente');

/**
 * Ejecutar consulta a Supabase
 */
export async function querySupabase(tabla, opciones = {}) {
  try {
    let query = supabase.from(tabla).select(opciones.select || '*');
    
    // Aplicar filtros
    if (opciones.filtros) {
      opciones.filtros.forEach(filtro => {
        query = query.eq(filtro.campo, filtro.valor);
      });
    }
    
    // Aplicar ordenamiento
    if (opciones.orden) {
      query = query.order(opciones.orden.campo, { ascending: opciones.orden.ascending !== false });
    }
    
    // Aplicar límite
    if (opciones.limit) {
      query = query.limit(opciones.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      Logger.error('Error en consulta Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    Logger.error('Error al ejecutar consulta:', error);
    throw error;
  }
}

/**
 * Insertar registro en Supabase
 */
export async function insertSupabase(tabla, datos) {
  try {
    const { data, error } = await supabase
      .from(tabla)
      .insert(datos)
      .select();
    
    if (error) {
      Logger.error('Error al insertar en Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    Logger.error('Error al insertar registro:', error);
    throw error;
  }
}

/**
 * Actualizar registro en Supabase
 */
export async function updateSupabase(tabla, id, datos) {
  try {
    const { data, error } = await supabase
      .from(tabla)
      .update(datos)
      .eq('id', id)
      .select();
    
    if (error) {
      Logger.error('Error al actualizar en Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    Logger.error('Error al actualizar registro:', error);
    throw error;
  }
}

/**
 * Eliminar registro en Supabase (soft delete)
 */
export async function deleteSupabase(tabla, id) {
  try {
    const { data, error } = await supabase
      .from(tabla)
      .update({ activo: false })
      .eq('id', id)
      .select();
    
    if (error) {
      Logger.error('Error al eliminar en Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    Logger.error('Error al eliminar registro:', error);
    throw error;
  }
}

/**
 * Borrado real (hard delete). Usar solo cuando sea necesario
 * (ej. niveles_aspecto al reemplazar: soft delete deja UNIQUE violado).
 */
export async function deleteHardSupabase(tabla, opciones) {
  try {
    let query = supabase.from(tabla).delete();
    if (opciones.campo && opciones.valor !== undefined) {
      query = query.eq(opciones.campo, opciones.valor);
    } else if (opciones.id) {
      query = query.eq('id', opciones.id);
    } else {
      throw new Error('deleteHardSupabase: falta campo+valor o id');
    }
    const { error } = await query;
    if (error) {
      Logger.error('Error en hard delete Supabase:', error);
      throw error;
    }
    return;
  } catch (error) {
    Logger.error('Error al eliminar registro (hard):', error);
    throw error;
  }
}
