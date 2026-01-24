import { supabase } from '../supabase.js';
import { formatearFecha, mostrarAlerta } from '../utils.js';
import { getUser, getLoginUrl } from '../auth.js';

// Estado
let eventos = [];
let equipoUsuario = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    const user = getUser();
    if (!user) {
        window.location.href = getLoginUrl();
        return;
    }
    
    // Buscar el equipo del usuario (asumiendo que el nombre del equipo coincide con algún identificador del usuario)
    // Por ahora cargamos todos los eventos y el usuario selecciona
    await cargarEventos();
    configurarEventListeners();
});

function configurarEventListeners() {
    // Los eventos se cargan como cards clickeables
}

async function cargarEventos() {
    try {
        const { data, error } = await supabase
            .from('eventos')
            .select('*')
            .eq('activo', true)
            .order('fecha_inicio', { ascending: false });
            
        if (error) throw error;
        
        eventos = data || [];
        renderizarEventos();
        
    } catch (error) {
        console.error('Error cargando eventos:', error);
        mostrarAlerta('Error al cargar eventos', 'error');
    }
}

function renderizarEventos() {
    const container = document.getElementById('eventos-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (eventos.length === 0) {
        container.innerHTML = '<p class="text-center text-secondary">No hay eventos disponibles.</p>';
        return;
    }
    
    eventos.forEach(evento => {
        const card = document.createElement('div');
        card.className = 'evento-card';
        card.style.cssText = 'background: white; border: 2px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; cursor: pointer; transition: all 0.2s;';
        card.onmouseover = () => card.style.borderColor = 'var(--primary-color)';
        card.onmouseout = () => card.style.borderColor = 'var(--border)';
        
        card.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: var(--primary-color);">${evento.nombre}</h3>
            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                ${formatearFecha(evento.fecha_inicio)} - ${formatearFecha(evento.fecha_fin)}
            </p>
        `;
        
        card.addEventListener('click', () => {
            cargarCalificacionesEquipo(evento.id);
            document.getElementById('calificaciones-section').scrollIntoView({ behavior: 'smooth' });
        });
        
        container.appendChild(card);
    });
}

async function cargarCalificacionesEquipo(eventoId) {
    if (!eventoId) return;
    
    try {
        mostrarCargando();
        
        const user = getUser();
        
        // Primero necesitamos identificar el equipo del usuario
        // Por ahora, vamos a mostrar un selector de equipos o buscar por nombre de usuario
        // Asumiendo que el usuario puede ver calificaciones de cualquier equipo del evento
        
        // Cargar equipos del evento
        const { data: equipos, error: errEquipos } = await supabase
            .from('equipos')
            .select('*')
            .eq('evento_id', eventoId)
            .eq('activo', true)
            .order('nombre');
            
        if (errEquipos) throw errEquipos;
        
        if (equipos.length === 0) {
            mostrarAlerta('No hay equipos en este evento', 'warning');
            return;
        }
        
        // Por ahora, mostrar calificaciones de todos los equipos
        // En producción, aquí se filtraría por el equipo del usuario logueado
        await mostrarCalificacionesPorEquipo(equipos, eventoId);
        
    } catch (error) {
        console.error('Error cargando calificaciones:', error);
        mostrarAlerta('Error al cargar calificaciones', 'error');
    }
}

async function mostrarCalificacionesPorEquipo(equipos, eventoId) {
    const container = document.getElementById('calificaciones-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Cargar todas las calificaciones del evento con información de jurados
    const { data: calificaciones, error: errCal } = await supabase
        .from('calificaciones')
        .select(`
            *,
            equipos (nombre),
            rubricas (nombre),
            aspectos_rubrica (nombre),
            jurados (
                id,
                nombre_referencia,
                usuario_id
            )
        `)
        .in('equipo_id', equipos.map(e => e.id));
        
    if (errCal) throw errCal;
    
    // Cargar rúbricas del evento
    const { data: rubricas, error: errRubricas } = await supabase
        .from('rubricas')
        .select('*')
        .eq('evento_id', eventoId)
        .eq('activo', true);
        
    if (errRubricas) throw errRubricas;
    
    // Agrupar por equipo
    equipos.forEach(equipo => {
        const calEquipo = calificaciones.filter(c => c.equipo_id === equipo.id);
        
        if (calEquipo.length === 0) {
            // Mostrar mensaje de que no hay calificaciones aún
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${equipo.nombre}</h3>
                <p class="text-secondary">Aún no hay calificaciones registradas para este equipo.</p>
            `;
            container.appendChild(card);
            return;
        }
        
        // Agrupar por jurado
        const porJurado = {};
        calEquipo.forEach(cal => {
            const juradoId = cal.jurado_id;
            if (!porJurado[juradoId]) {
                porJurado[juradoId] = {
                    jurado: cal.jurados,
                    calificaciones: [],
                    rubricas: {}
                };
            }
            porJurado[juradoId].calificaciones.push(cal);
        });
        
        // Crear card para el equipo
        const equipoCard = document.createElement('div');
        equipoCard.className = 'card';
        equipoCard.style.marginBottom = '24px';
        
        equipoCard.innerHTML = `
            <h2 style="margin-bottom: 16px; color: var(--primary-color);">${equipo.nombre}</h2>
            <div id="jurados-${equipo.id}">
                <!-- Se llena con calificaciones por jurado -->
            </div>
        `;
        
        const juradosDiv = equipoCard.querySelector(`#jurados-${equipo.id}`);
        
        // Mostrar calificaciones por jurado
        Object.values(porJurado).forEach((juradoData, index) => {
            const juradoCard = document.createElement('div');
            juradoCard.style.cssText = 'background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid var(--primary-color);';
            
            const nombreJurado = juradoData.jurado?.nombre_referencia || `Jurado ${index + 1}`;
            
            // Agrupar por rúbrica
            const porRubrica = {};
            juradoData.calificaciones.forEach(cal => {
                if (!porRubrica[cal.rubrica_id]) {
                    porRubrica[cal.rubrica_id] = {
                        rubrica: cal.rubricas,
                        calificaciones: []
                    };
                }
                porRubrica[cal.rubrica_id].calificaciones.push(cal);
            });
            
            // Crear contenido del jurado
            let contenidoRubricas = '';
            
            Object.values(porRubrica).forEach(rubricaData => {
                const sumaRubrica = rubricaData.calificaciones.reduce((sum, cal) => sum + (cal.puntuacion || 0), 0);
                const observacionGeneral = rubricaData.calificaciones[0]?.observacion_general || '';
                
                // Agrupar por aspecto
                const porAspecto = {};
                rubricaData.calificaciones.forEach(cal => {
                    if (!porAspecto[cal.aspecto_id]) {
                        porAspecto[cal.aspecto_id] = [];
                    }
                    porAspecto[cal.aspecto_id].push(cal);
                });
                
                // Construir HTML de aspectos
                let aspectosHTML = '';
                Object.values(porAspecto).forEach(calificacionesAspecto => {
                    const cal = calificacionesAspecto[0];
                    const aspecto = cal.aspectos_rubrica;
                    const nivel = cal.nivel_seleccionado || 'N/A';
                    const observacion = cal.observacion_aspecto || '';
                    
                    aspectosHTML += `
                        <div style="padding: 10px; background: #f5f5f5; border-radius: 6px; margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                                <div>
                                    <strong>${aspecto?.nombre || 'Aspecto'}</strong>
                                    <span style="color: var(--text-secondary); font-size: 0.9rem; margin-left: 8px;">
                                        Nivel ${nivel}
                                    </span>
                                </div>
                                <span style="font-weight: bold; color: var(--success-color);">
                                    ${cal.puntuacion} pts
                                </span>
                            </div>
                            ${observacion ? `
                                <div style="background: white; padding: 8px; border-radius: 4px; margin-top: 6px; font-size: 0.9rem; color: #555;">
                                    <strong>💬 Observación:</strong> ${observacion}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
                
                contenidoRubricas += `
                    <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="font-size: 1.1rem;">${rubricaData.rubrica?.nombre || 'Rúbrica'}</strong>
                            <span style="font-weight: bold; color: var(--primary-color); font-size: 1.1rem;">
                                Total: ${sumaRubrica} pts
                            </span>
                        </div>
                        ${observacionGeneral ? `
                            <div style="background: #fff9e6; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #ffc107;">
                                <strong>📝 Observación General:</strong>
                                <p style="margin: 4px 0 0 0; color: #333;">${observacionGeneral}</p>
                            </div>
                        ` : ''}
                        ${aspectosHTML}
                    </div>
                `;
            });
            
            juradoCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; color: var(--primary-color);">👨‍⚖️ ${nombreJurado}</h3>
                </div>
                ${contenidoRubricas}
            `;
            
            juradosDiv.appendChild(juradoCard);
        });
        
        container.appendChild(equipoCard);
    });
}

function mostrarCargando() {
    const container = document.getElementById('calificaciones-container');
    if (container) {
        container.innerHTML = '<div class="text-center py-lg"><div class="loading"></div><p style="margin-top: 12px;">Cargando calificaciones...</p></div>';
    }
}
