// ============================================
// CLIENTE SUPABASE
// ============================================

import { createClient } from '@supabase/supabase-js';
import { CONFIG, Logger } from './config.js';

// Crear cliente de Supabase
export const supabase = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_KEY
);

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
