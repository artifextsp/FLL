import { querySupabase, insertSupabase, updateSupabase, supabase } from '../supabase.js';
import { mostrarAlerta } from '../utils.js';
import { getUser } from '../auth.js';

// Estado
let eventosDisponibles = [];
let rubricasDisponibles = [];
let equiposDisponibles = [];
let eventoSeleccionado = null;
let rubricaSeleccionada = null;
let equipoSeleccionado = null;
let aspectosRubrica = [];
let nivelesPorAspecto = {}; // { aspecto_id: [niveles] }
let calificacionesActuales = {}; // { aspecto_id: { nivel, observacion } }

// Elementos DOM
const selectEvento = document.getElementById('select-evento');
const selectRubrica = document.getElementById('select-rubrica');
const selectEquipo = document.getElementById('select-equipo');
const filtroEquipo = document.getElementById('filtro-equipo');
const seccionCalificacion = document.getElementById('seccion-calificacion');
const listaAspectos = document.getElementById('lista-aspectos');
const btnGuardar = document.getElementById('btn-guardar-calificacion');

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    const user = getUser();
    if (!user) {
        window.location.href = '../index.html';
        return;
    }
    
    await cargarDatosIniciales();
    configurarEventListeners();
});

function configurarEventListeners() {
    selectEvento.addEventListener('change', async () => {
        eventoSeleccionado = selectEvento.value;
        await cargarRubricas();
        await cargarEquipos();
        limpiarSelecciones();
    });
    
    selectRubrica.addEventListener('change', async () => {
        rubricaSeleccionada = selectRubrica.value;
        if (rubricaSeleccionada) {
            await cargarAspectos();
            mostrarSeccionCalificacion();
            
            // Habilitar selector de equipo y filtro
            selectEquipo.disabled = false;
            filtroEquipo.disabled = false;
            document.getElementById('lista-equipos-filtro').style.display = 'block';
            selectEquipo.style.display = 'none';
        } else {
            ocultarSeccionCalificacion();
            selectEquipo.disabled = true;
            filtroEquipo.disabled = true;
            document.getElementById('lista-equipos-filtro').style.display = 'none';
        }
    });
    
    selectEquipo.addEventListener('change', () => {
        equipoSeleccionado = selectEquipo.value;
        if (equipoSeleccionado && rubricaSeleccionada) {
            const equipo = equiposDisponibles.find(e => e.id === equipoSeleccionado);
            if (equipo) {
                document.getElementById('nombre-equipo-activo').textContent = equipo.nombre;
            }
            cargarCalificacionesExistentes();
        }
    });
    
    filtroEquipo.addEventListener('input', (e) => {
        filtrarEquipos(e.target.value);
    });
    
    btnGuardar.addEventListener('click', async () => {
        await guardarCalificacion();
    });
}

async function cargarDatosIniciales() {
    const user = getUser();
    
    // Cargar eventos donde el usuario es jurado
    try {
        const { data: jurados, error: errJurados } = await supabase
            .from('jurados')
            .select('evento_id, eventos(*)')
            .eq('usuario_id', user.id)
            .eq('activo', true);
            
        if (errJurados) throw errJurados;
        
        eventosDisponibles = jurados.map(j => j.eventos).filter(Boolean);
        llenarSelectEventos();
        
    } catch (error) {
        console.error('Error cargando eventos:', error);
        mostrarAlerta('Error al cargar eventos disponibles', 'error');
    }
}

function llenarSelectEventos() {
    selectEvento.innerHTML = '<option value="">-- Selecciona un evento --</option>';
    eventosDisponibles.forEach(evento => {
        const option = document.createElement('option');
        option.value = evento.id;
        option.textContent = evento.nombre;
        selectEvento.appendChild(option);
    });
}

async function cargarRubricas() {
    if (!eventoSeleccionado) return;
    
    try {
        const { data, error } = await supabase
            .from('rubricas')
            .select('*')
            .eq('evento_id', eventoSeleccionado)
            .eq('activo', true);
            
        if (error) throw error;
        
        rubricasDisponibles = data || [];
        llenarSelectRubricas();
        
    } catch (error) {
        mostrarAlerta('Error al cargar rúbricas', 'error');
    }
}

function llenarSelectRubricas() {
    selectRubrica.innerHTML = '<option value="">-- Selecciona una rúbrica --</option>';
    rubricasDisponibles.forEach(rubrica => {
        const option = document.createElement('option');
        option.value = rubrica.id;
        option.textContent = rubrica.nombre;
        selectRubrica.appendChild(option);
    });
}

async function cargarEquipos() {
    if (!eventoSeleccionado) return;
    
    try {
        const { data, error } = await supabase
            .from('equipos')
            .select('*')
            .eq('evento_id', eventoSeleccionado)
            .eq('activo', true)
            .order('nombre');
            
        if (error) throw error;
        
        equiposDisponibles = data || [];
        llenarSelectEquipos();
        
    } catch (error) {
        mostrarAlerta('Error al cargar equipos', 'error');
    }
}

function llenarSelectEquipos() {
    selectEquipo.innerHTML = '<option value="">-- Selecciona un equipo --</option>';
    equiposDisponibles.forEach(equipo => {
        const option = document.createElement('option');
        option.value = equipo.id;
        option.textContent = equipo.nombre;
        selectEquipo.appendChild(option);
    });
    
    // Actualizar lista de filtro también
    actualizarListaFiltro();
}

function actualizarListaFiltro() {
    const lista = document.getElementById('lista-equipos-filtro');
    lista.innerHTML = '';
    
    equiposDisponibles.forEach(equipo => {
        const li = document.createElement('li');
        li.className = 'equipo-item';
        li.dataset.equipoId = equipo.id;
        li.innerHTML = `
            <div class="equipo-card" style="padding: 12px; border: 2px solid var(--border); border-radius: 8px; margin-bottom: 8px; cursor: pointer;">
                <strong>${equipo.nombre}</strong>
            </div>
        `;
        li.addEventListener('click', () => {
            selectEquipo.value = equipo.id;
            equipoSeleccionado = equipo.id;
            document.getElementById('nombre-equipo-activo').textContent = equipo.nombre;
            cargarCalificacionesExistentes();
            // Scroll a la sección de calificación
            seccionCalificacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        lista.appendChild(li);
    });
}

function filtrarEquipos(texto) {
    const items = document.querySelectorAll('.equipo-item');
    const textoLower = texto.toLowerCase();
    
    items.forEach(item => {
        const nombre = item.textContent.toLowerCase();
        item.style.display = nombre.includes(textoLower) ? 'block' : 'none';
    });
}

async function cargarAspectos() {
    if (!rubricaSeleccionada) return;
    
    try {
        // Cargar aspectos
        const { data: aspectos, error: errAspectos } = await supabase
            .from('aspectos_rubrica')
            .select('*')
            .eq('rubrica_id', rubricaSeleccionada)
            .eq('activo', true)
            .order('orden');
            
        if (errAspectos) throw errAspectos;
        
        aspectosRubrica = aspectos || [];
        
        // Cargar niveles para cada aspecto
        for (const aspecto of aspectosRubrica) {
            const { data: niveles, error: errNiveles } = await supabase
                .from('niveles_aspecto')
                .select('*')
                .eq('aspecto_id', aspecto.id)
                .eq('activo', true)
                .order('nivel');
                
            if (!errNiveles && niveles) {
                nivelesPorAspecto[aspecto.id] = niveles;
            }
        }
        
        renderizarAspectos();
        
    } catch (error) {
        console.error('Error cargando aspectos:', error);
        mostrarAlerta('Error al cargar aspectos de la rúbrica', 'error');
    }
}

async function cargarCalificacionesExistentes() {
    if (!equipoSeleccionado || !rubricaSeleccionada) return;
    
    const user = getUser();
    
    try {
        // Buscar jurado_id del usuario actual
        const { data: jurado, error: errJurado } = await supabase
            .from('jurados')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('evento_id', eventoSeleccionado)
            .eq('activo', true)
            .single();
            
        if (errJurado || !jurado) {
            calificacionesActuales = {};
            renderizarAspectos();
            return;
        }
        
        // Cargar calificaciones existentes
        const { data: calificaciones, error: errCal } = await supabase
            .from('calificaciones')
            .select('*')
            .eq('jurado_id', jurado.id)
            .eq('equipo_id', equipoSeleccionado)
            .eq('rubrica_id', rubricaSeleccionada);
            
        if (errCal) throw errCal;
        
        // Organizar por aspecto
        calificacionesActuales = {};
        calificaciones.forEach(cal => {
            calificacionesActuales[cal.aspecto_id] = {
                nivel: cal.nivel_seleccionado,
                observacion: cal.observacion_aspecto || ''
            };
        });
        
        renderizarAspectos();
        
    } catch (error) {
        console.error('Error cargando calificaciones:', error);
        calificacionesActuales = {};
        renderizarAspectos();
    }
}

function renderizarAspectos() {
    listaAspectos.innerHTML = '';
    
    if (aspectosRubrica.length === 0) {
        listaAspectos.innerHTML = '<p class="text-center text-secondary">No hay aspectos definidos para esta rúbrica.</p>';
        return;
    }
    
    aspectosRubrica.forEach(aspecto => {
        const niveles = nivelesPorAspecto[aspecto.id] || [];
        const calificacion = calificacionesActuales[aspecto.id] || {};
        
        const div = document.createElement('div');
        div.className = 'aspecto-card';
        div.dataset.aspectoId = aspecto.id;
        
        div.innerHTML = `
            <div class="aspecto-header">
                <h3>${aspecto.nombre}</h3>
                ${aspecto.descripcion ? `<p class="text-secondary" style="font-size: 0.9rem; margin-top: 4px;">${aspecto.descripcion}</p>` : ''}
            </div>
            
            <div class="niveles-container">
                ${niveles.map(nivel => `
                    <label class="nivel-option ${calificacion.nivel === nivel.nivel ? 'selected' : ''}" 
                           data-nivel="${nivel.nivel}" 
                           data-aspecto="${aspecto.id}">
                        <input type="radio" 
                               name="nivel_${aspecto.id}" 
                               value="${nivel.nivel}" 
                               ${calificacion.nivel === nivel.nivel ? 'checked' : ''}
                               required>
                        <div class="nivel-content">
                            <div class="nivel-header">
                                <span class="nivel-numero">${nivel.nivel}</span>
                                <span class="nivel-etiqueta">${getEtiquetaNivel(nivel.nivel)}</span>
                                <span class="nivel-puntos">${nivel.puntuacion} pts</span>
                            </div>
                            <div class="nivel-descripcion">${nivel.descripcion}</div>
                        </div>
                    </label>
                `).join('')}
            </div>
            
            <div class="observacion-container">
                <label class="form-label">Observación para este aspecto</label>
                <textarea class="form-textarea observacion-input" 
                          data-aspecto="${aspecto.id}"
                          placeholder="Escribe tus observaciones sobre este aspecto..."
                          rows="2">${calificacion.observacion || ''}</textarea>
            </div>
        `;
        
        // Event listeners para radio buttons
        div.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const label = e.target.closest('.nivel-option');
                div.querySelectorAll('.nivel-option').forEach(l => l.classList.remove('selected'));
                label.classList.add('selected');
            });
        });
        
        listaAspectos.appendChild(div);
    });
}

function getEtiquetaNivel(nivel) {
    const etiquetas = {
        1: 'Básico',
        2: 'En Desarrollo',
        3: 'Cumplido',
        4: 'Superado'
    };
    return etiquetas[nivel] || '';
}

function mostrarSeccionCalificacion() {
    seccionCalificacion.classList.remove('hidden');
    
    // Actualizar nombres en info box
    const rubrica = rubricasDisponibles.find(r => r.id === rubricaSeleccionada);
    if (rubrica) {
        document.getElementById('nombre-rubrica-activa').textContent = rubrica.nombre;
    }
    
    // Mostrar botón guardar
    document.getElementById('btn-guardar-container').classList.remove('hidden');
    
    if (equipoSeleccionado) {
        const equipo = equiposDisponibles.find(e => e.id === equipoSeleccionado);
        if (equipo) {
            document.getElementById('nombre-equipo-activo').textContent = equipo.nombre;
        }
        cargarCalificacionesExistentes();
    }
}

function ocultarSeccionCalificacion() {
    seccionCalificacion.classList.add('hidden');
    document.getElementById('btn-guardar-container').classList.add('hidden');
}

function limpiarSelecciones() {
    rubricaSeleccionada = null;
    equipoSeleccionado = null;
    selectRubrica.value = '';
    selectEquipo.value = '';
    aspectosRubrica = [];
    nivelesPorAspecto = {};
    calificacionesActuales = {};
    ocultarSeccionCalificacion();
}

async function guardarCalificacion() {
    if (!equipoSeleccionado || !rubricaSeleccionada || !eventoSeleccionado) {
        mostrarAlerta('Por favor completa todas las selecciones', 'warning');
        return;
    }
    
    const user = getUser();
    
    // Validar que todos los aspectos tengan nivel seleccionado
    const calificaciones = [];
    let todosCompletos = true;
    
    for (const aspecto of aspectosRubrica) {
        const nivelRadio = document.querySelector(`input[name="nivel_${aspecto.id}"]:checked`);
        const observacionTextarea = document.querySelector(`textarea[data-aspecto="${aspecto.id}"]`);
        
        if (!nivelRadio) {
            todosCompletos = false;
            mostrarAlerta(`Debes seleccionar un nivel para: ${aspecto.nombre}`, 'warning');
            return;
        }
        
        calificaciones.push({
            aspecto_id: aspecto.id,
            nivel: parseInt(nivelRadio.value),
            observacion: observacionTextarea ? observacionTextarea.value.trim() : ''
        });
    }
    
    if (!todosCompletos) return;
    
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    
    try {
        // Obtener jurado_id
        const { data: jurado, error: errJurado } = await supabase
            .from('jurados')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('evento_id', eventoSeleccionado)
            .eq('activo', true)
            .single();
            
        if (errJurado || !jurado) {
            throw new Error('No se encontró tu asignación como jurado');
        }
        
        // Obtener observación general (si existe campo en el form)
        const observacionGeneral = document.getElementById('observacion-general')?.value || '';
        
        // Guardar cada calificación
        for (const cal of calificaciones) {
            const nivel = nivelesPorAspecto[cal.aspecto_id].find(n => n.nivel === cal.nivel);
            
            // Verificar si ya existe calificación
            const { data: existente } = await supabase
                .from('calificaciones')
                .select('id')
                .eq('jurado_id', jurado.id)
                .eq('equipo_id', equipoSeleccionado)
                .eq('rubrica_id', rubricaSeleccionada)
                .eq('aspecto_id', cal.aspecto_id)
                .single();
            
            const datosCalificacion = {
                jurado_id: jurado.id,
                equipo_id: equipoSeleccionado,
                rubrica_id: rubricaSeleccionada,
                aspecto_id: cal.aspecto_id,
                puntuacion: nivel.puntuacion,
                nivel_seleccionado: cal.nivel,
                observacion_aspecto: cal.observacion,
                observacion_general: observacionGeneral
            };
            
            if (existente) {
                // Actualizar
                await updateSupabase('calificaciones', existente.id, datosCalificacion);
            } else {
                // Crear
                await insertSupabase('calificaciones', datosCalificacion);
            }
        }
        
        mostrarAlerta('Calificación guardada correctamente', 'success');
        
        // Recargar calificaciones para mostrar estado actualizado
        await cargarCalificacionesExistentes();
        
    } catch (error) {
        console.error('Error guardando calificación:', error);
        mostrarAlerta('Error al guardar la calificación', 'error');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar Calificación';
    }
}
