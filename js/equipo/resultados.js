import { querySupabase, supabase } from '../supabase.js';
import { calcularPromedio, redondear, formatearFecha } from '../utils.js';
import { getUser, getLoginUrl } from '../auth.js';

// Estado
let eventos = [];
let resultados = {}; // { evento_id: { equipos: [], rubricas: [] } }

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    const user = getUser();
    if (!user) {
        window.location.href = getLoginUrl();
        return;
    }
    
    await cargarEventos();
    configurarEventListeners();
});

function configurarEventListeners() {
    const selectEvento = document.getElementById('select-evento');
    if (selectEvento) {
        selectEvento.addEventListener('change', async (e) => {
            await cargarResultados(e.target.value);
        });
    }
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
        card.style.cssText = 'background: white; border: 2px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; cursor: pointer;';
        
        card.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: var(--primary-color);">${evento.nombre}</h3>
            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                ${formatearFecha(evento.fecha_inicio)} - ${formatearFecha(evento.fecha_fin)}
            </p>
        `;
        
        card.addEventListener('click', () => {
            cargarResultados(evento.id);
            // Scroll a resultados
            document.getElementById('resultados-section').scrollIntoView({ behavior: 'smooth' });
        });
        
        container.appendChild(card);
    });
}

async function cargarResultados(eventoId) {
    if (!eventoId) return;
    
    try {
        mostrarCargando();
        
        // Cargar equipos del evento
        const { data: equipos, error: errEquipos } = await supabase
            .from('equipos')
            .select('*')
            .eq('evento_id', eventoId)
            .eq('activo', true)
            .order('nombre');
            
        if (errEquipos) throw errEquipos;
        
        // Cargar rúbricas del evento
        const { data: rubricas, error: errRubricas } = await supabase
            .from('rubricas')
            .select('*')
            .eq('evento_id', eventoId)
            .eq('activo', true);
            
        if (errRubricas) throw errRubricas;
        
        // Cargar todas las calificaciones del evento
        const { data: calificaciones, error: errCal } = await supabase
            .from('calificaciones')
            .select(`
                *,
                equipos (nombre),
                rubricas (nombre),
                aspectos_rubrica (nombre),
                jurados (nombre_referencia)
            `)
            .in('equipo_id', equipos.map(e => e.id));
            
        if (errCal) throw errCal;
        
        // Procesar resultados
        const resultadosProcesados = procesarResultados(equipos, rubricas, calificaciones || []);
        
        renderizarResultados(resultadosProcesados, rubricas);
        
    } catch (error) {
        console.error('Error cargando resultados:', error);
        mostrarAlerta('Error al cargar resultados', 'error');
    }
}

function procesarResultados(equipos, rubricas, calificaciones) {
    const resultados = {};
    
    equipos.forEach(equipo => {
        resultados[equipo.id] = {
            equipo: equipo,
            rubricas: {},
            sumaGeneral: 0, // Cambiado de promedioGeneral a sumaGeneral
            totalCalificaciones: 0
        };
        
        rubricas.forEach(rubrica => {
            const calRubrica = calificaciones.filter(c => 
                c.equipo_id === equipo.id && c.rubrica_id === rubrica.id
            );
            
            if (calRubrica.length > 0) {
                // Agrupar por aspecto
                const porAspecto = {};
                calRubrica.forEach(cal => {
                    if (!porAspecto[cal.aspecto_id]) {
                        porAspecto[cal.aspecto_id] = {
                            aspecto: cal.aspectos_rubrica,
                            calificaciones: [],
                            suma: 0 // Cambiado de promedio a suma
                        };
                    }
                    porAspecto[cal.aspecto_id].calificaciones.push(cal);
                });
                
                // Calcular suma por aspecto (suma de todas las puntuaciones)
                Object.keys(porAspecto).forEach(aspectoId => {
                    const aspecto = porAspecto[aspectoId];
                    aspecto.suma = aspecto.calificaciones.reduce((sum, cal) => sum + (cal.puntuacion || 0), 0);
                });
                
                // Calcular suma de la rúbrica (suma de todas las puntuaciones)
                const sumaRubrica = calRubrica.reduce((sum, cal) => sum + (cal.puntuacion || 0), 0);
                
                resultados[equipo.id].rubricas[rubrica.id] = {
                    rubrica: rubrica,
                    aspectos: porAspecto,
                    suma: sumaRubrica, // Cambiado de promedio a suma
                    calificaciones: calRubrica
                };
                
                resultados[equipo.id].totalCalificaciones += calRubrica.length;
            }
        });
        
        // Calcular suma general (suma de todas las rúbricas)
        const sumasRubricas = Object.values(resultados[equipo.id].rubricas)
            .map(r => r.suma);
        resultados[equipo.id].sumaGeneral = sumasRubricas.reduce((sum, s) => sum + s, 0);
    });
    
    return resultados;
}

function renderizarResultados(resultadosProcesados, rubricas) {
    const container = document.getElementById('resultados-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Convertir a array y ordenar por suma general (de mayor a menor)
    const equiposOrdenados = Object.values(resultadosProcesados)
        .sort((a, b) => b.sumaGeneral - a.sumaGeneral);
    
    if (equiposOrdenados.length === 0) {
        container.innerHTML = '<p class="text-center text-secondary">No hay calificaciones registradas aún.</p>';
        return;
    }
    
    // Ranking
    const rankingDiv = document.createElement('div');
    rankingDiv.className = 'card';
    rankingDiv.innerHTML = '<h2 style="margin-bottom: 16px;">🏆 Ranking de Equipos</h2>';
    
    const tablaRanking = document.createElement('table');
    tablaRanking.style.cssText = 'width: 100%; border-collapse: collapse;';
    tablaRanking.innerHTML = `
        <thead>
            <tr style="background: var(--surface);">
                <th style="padding: 12px; text-align: left; width: 50px;">#</th>
                <th style="padding: 12px; text-align: left;">Equipo</th>
                <th style="padding: 12px; text-align: center;">Total Puntos</th>
                <th style="padding: 12px; text-align: center;">Calificaciones</th>
            </tr>
        </thead>
        <tbody id="tabla-ranking">
        </tbody>
    `;
    
    equiposOrdenados.forEach((resultado, index) => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom: 1px solid var(--border);';
        
        let medalla = '';
        if (index === 0) medalla = '🥇';
        else if (index === 1) medalla = '🥈';
        else if (index === 2) medalla = '🥉';
        
        tr.innerHTML = `
            <td style="padding: 12px; font-weight: bold; font-size: 1.2rem;">${medalla || (index + 1)}</td>
            <td style="padding: 12px;"><strong>${resultado.equipo.nombre}</strong></td>
            <td style="padding: 12px; text-align: center; font-size: 1.1rem; font-weight: bold; color: var(--primary-color);">
                ${resultado.sumaGeneral}
            </td>
            <td style="padding: 12px; text-align: center;">${resultado.totalCalificaciones}</td>
        `;
        
        tablaRanking.querySelector('tbody').appendChild(tr);
    });
    
    rankingDiv.appendChild(tablaRanking);
    container.appendChild(rankingDiv);
    
    // Detalles por equipo
    equiposOrdenados.forEach((resultado, index) => {
        const cardEquipo = document.createElement('div');
        cardEquipo.className = 'card';
        cardEquipo.style.marginTop = '20px';
        
        let posicion = index + 1;
        if (index === 0) posicion = '🥇 1ro';
        else if (index === 1) posicion = '🥈 2do';
        else if (index === 2) posicion = '🥉 3ro';
        else posicion = `#${posicion}`;
        
        cardEquipo.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0;">${resultado.equipo.nombre}</h3>
                <span style="font-size: 1.2rem; font-weight: bold;">${posicion}</span>
            </div>
            
            <div style="background: var(--surface); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Total Puntos</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">
                            ${resultado.sumaGeneral}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Calificaciones</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">
                            ${resultado.totalCalificaciones}
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="detalles-${resultado.equipo.id}">
                <!-- Se llena con detalles por rúbrica -->
            </div>
        `;
        
        // Detalles por rúbrica
        const detallesDiv = cardEquipo.querySelector(`#detalles-${resultado.equipo.id}`);
        Object.values(resultado.rubricas).forEach(rubricaData => {
            const rubricaCard = document.createElement('div');
            rubricaCard.style.cssText = 'background: #f9f9f9; padding: 12px; border-radius: 8px; margin-bottom: 12px;';
            
            rubricaCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>${rubricaData.rubrica.nombre}</strong>
                    <span style="font-weight: bold; color: var(--success-color);">
                        Total: ${rubricaData.suma} pts
                    </span>
                </div>
                
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">
                    ${rubricaData.calificaciones.length} calificación(es) recibida(s)
                </div>
                
                <div id="aspectos-${resultado.equipo.id}-${rubricaData.rubrica.id}">
                    <!-- Aspectos -->
                </div>
            `;
            
            // Mostrar aspectos
            const aspectosDiv = rubricaCard.querySelector(`#aspectos-${resultado.equipo.id}-${rubricaData.rubrica.id}`);
            Object.values(rubricaData.aspectos).forEach(aspectoData => {
                const aspectoP = document.createElement('div');
                aspectoP.style.cssText = 'padding: 8px; background: white; border-radius: 6px; margin-bottom: 6px; font-size: 0.9rem;';
                aspectoP.innerHTML = `
                    <strong>${aspectoData.aspecto.nombre}:</strong> 
                    ${aspectoData.suma} pts
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">
                        (${aspectoData.calificaciones.length} calificación${aspectoData.calificaciones.length > 1 ? 'es' : ''})
                    </span>
                `;
                aspectosDiv.appendChild(aspectoP);
            });
            
            detallesDiv.appendChild(rubricaCard);
        });
        
        container.appendChild(cardEquipo);
    });
}

function mostrarCargando() {
    const container = document.getElementById('resultados-container');
    if (container) {
        container.innerHTML = '<div class="text-center py-lg"><div class="loading"></div><p style="margin-top: 12px;">Cargando resultados...</p></div>';
    }
}
