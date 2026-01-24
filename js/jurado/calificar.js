import { querySupabase, insertSupabase, updateSupabase, supabase } from '../supabase.js';
import { mostrarAlerta } from '../utils.js';
import { getUser, getLoginUrl, logout } from '../auth.js';

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
        window.location.href = getLoginUrl();
        return;
    }
    
    // Configurar botón de logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    await cargarDatosIniciales();
    configurarEventListeners();
});

function configurarEventListeners() {
    if (!selectEvento || !selectRubrica || !btnGuardar) return;
    
    selectEvento.addEventListener('change', async () => {
        eventoSeleccionado = selectEvento.value;
        selectRubrica.disabled = !eventoSeleccionado;
        selectRubrica.innerHTML = eventoSeleccionado 
            ? '<option value="">Cargando rúbricas...</option>' 
            : '<option value="">Primero selecciona un evento</option>';
        if (!eventoSeleccionado) {
            rubricasDisponibles = [];
            equiposDisponibles = [];
            ocultarSeccionCalificacion();
            return;
        }
        await cargarRubricas();
        await cargarEquipos();
        limpiarSelecciones();
    });
    
    selectRubrica.addEventListener('change', async () => {
        rubricaSeleccionada = selectRubrica.value;
        if (rubricaSeleccionada) {
            await cargarAspectos();
            mostrarSeccionCalificacion();
            if (selectEquipo) { selectEquipo.disabled = false; selectEquipo.style.display = 'none'; }
            if (filtroEquipo) { filtroEquipo.disabled = false; }
            const listaFiltro = document.getElementById('lista-equipos-filtro');
            if (listaFiltro) listaFiltro.style.display = 'block';
        } else {
            ocultarSeccionCalificacion();
            if (selectEquipo) { selectEquipo.disabled = true; }
            if (filtroEquipo) filtroEquipo.disabled = true;
            const listaFiltro = document.getElementById('lista-equipos-filtro');
            if (listaFiltro) listaFiltro.style.display = 'none';
        }
    });
    
    if (selectEquipo) selectEquipo.addEventListener('change', () => {
        equipoSeleccionado = selectEquipo.value;
        if (equipoSeleccionado && rubricaSeleccionada) {
            const equipo = equiposDisponibles.find(e => e.id === equipoSeleccionado);
            if (equipo) {
                document.getElementById('nombre-equipo-activo').textContent = equipo.nombre;
            }
            cargarCalificacionesExistentes();
        }
    });
    
    if (filtroEquipo) filtroEquipo.addEventListener('input', (e) => {
        filtrarEquipos(e.target.value);
    });
    
    btnGuardar.addEventListener('click', async () => {
        await guardarCalificacion();
    });
}

async function cargarDatosIniciales() {
    const user = getUser();
    
    try {
        // 1. Intentar cargar eventos donde el usuario es jurado
        const { data: jurados, error: errJurados } = await supabase
            .from('jurados')
            .select('evento_id, eventos(*)')
            .eq('usuario_id', String(user.id))
            .eq('activo', true);
        
        if (!errJurados && jurados && jurados.length > 0) {
            // Usuario es jurado: usar solo sus eventos
            eventosDisponibles = jurados
                .map(j => j.eventos)
                .filter(Boolean);
        }
        
        // 2. Si no hay eventos (no es jurado o sin asignaciones): cargar TODOS los eventos
        // Así admins pueden probar y jurados sin asignar ven la lista
        if (eventosDisponibles.length === 0) {
            const { data: todosEventos, error: errEventos } = await supabase
                .from('eventos')
                .select('*')
                .eq('activo', true)
                .order('fecha_inicio', { ascending: false });
            
            if (errEventos) throw errEventos;
            eventosDisponibles = todosEventos || [];
        }
        
        llenarSelectEventos();
        
        if (eventosDisponibles.length === 0) {
            mostrarAlerta('No hay eventos disponibles. Crea uno desde el panel de administración.', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error cargando eventos:', error);
        console.error('Detalles del error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        
        // Mostrar mensaje más específico según el tipo de error
        if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
            mostrarAlerta('Error de permisos: Las políticas RLS no están configuradas correctamente. Ejecuta el script SQL en Supabase.', 'error');
        } else if (error.message?.includes('Invalid API key')) {
            mostrarAlerta('Clave API inválida. Verifica la configuración de Supabase.', 'error');
        } else {
            mostrarAlerta(`Error al cargar eventos: ${error.message || 'Error desconocido'}. Revisa la consola.`, 'error');
        }
    }
}

function llenarSelectEventos() {
    if (!selectEvento) return;
    selectEvento.innerHTML = '<option value="">-- Selecciona un evento --</option>';
    selectEvento.disabled = false;
    
    eventosDisponibles.forEach(evento => {
        if (!evento || !evento.id) return;
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
    if (!selectRubrica) return;
    selectRubrica.innerHTML = '<option value="">-- Selecciona una rúbrica --</option>';
    selectRubrica.disabled = !eventoSeleccionado;
    
    rubricasDisponibles.forEach(rubrica => {
        if (!rubrica || !rubrica.id) return;
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
        
        // Cargar niveles para cada aspecto (si no hay en BD, usar 4 por defecto)
        for (const aspecto of aspectosRubrica) {
            const { data: niveles, error: errNiveles } = await supabase
                .from('niveles_aspecto')
                .select('*')
                .eq('aspecto_id', aspecto.id)
                .eq('activo', true)
                .order('orden', { ascending: true });
                
            let lista = (niveles && niveles.length) ? niveles : null;
            if (lista) {
                lista = [...lista].sort((a, b) => (a.orden ?? a.nivel) - (b.orden ?? b.nivel));
            } else {
                if (errNiveles) console.warn('Niveles para aspecto', aspecto.nombre, ':', errNiveles);
                lista = getDefaultNiveles();
            }
            nivelesPorAspecto[aspecto.id] = lista;
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

const ETIQUETAS_NIVEL = {
    1: 'Básico',
    2: 'En Desarrollo',
    3: 'Cumplido',
    4: 'Superado'
};

function getEtiquetaNivel(nivel) {
    return ETIQUETAS_NIVEL[nivel] || '';
}

/** Niveles por defecto (1–4) cuando un aspecto no tiene en BD */
function getDefaultNiveles() {
    return [
        { nivel: 1, descripcion: 'Evidencia mínima.', puntuacion: 1, orden: 1 },
        { nivel: 2, descripcion: 'Evidencia parcial.', puntuacion: 2, orden: 2 },
        { nivel: 3, descripcion: 'Evidencia clara.', puntuacion: 3, orden: 3 },
        { nivel: 4, descripcion: 'Supera expectativas.', puntuacion: 4, orden: 4 }
    ];
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
            // Usar maybeSingle() en lugar de single() para evitar error 406 cuando no hay resultados
            const { data: existente, error: errExistente } = await supabase
                .from('calificaciones')
                .select('id')
                .eq('jurado_id', jurado.id)
                .eq('equipo_id', equipoSeleccionado)
                .eq('rubrica_id', rubricaSeleccionada)
                .eq('aspecto_id', cal.aspecto_id)
                .maybeSingle(); // maybeSingle() no lanza error si no hay resultados
            
            // Ignorar errores de consulta si no hay resultados (es normal)
            if (errExistente && errExistente.code !== 'PGRST116') {
                console.warn('Advertencia al verificar calificación existente:', errExistente);
            }
            
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
            
            // Preparar datos asegurando tipos correctos
            const datosLimpios = {
                jurado_id: String(jurado.id),
                equipo_id: String(equipoSeleccionado),
                rubrica_id: String(rubricaSeleccionada),
                aspecto_id: String(cal.aspecto_id),
                puntuacion: parseInt(nivel.puntuacion) || 0,
                nivel_seleccionado: parseInt(cal.nivel) || null
            };
            
            // Agregar observaciones solo si tienen contenido
            if (cal.observacion && cal.observacion.trim() !== '') {
                datosLimpios.observacion_aspecto = cal.observacion.trim();
            }
            
            // Solo agregar observacion_general si tiene contenido (opcional)
            if (observacionGeneral && observacionGeneral.trim() !== '') {
                datosLimpios.observacion_general = observacionGeneral.trim();
            }
            
            console.log('📝 Guardando calificación:', JSON.stringify(datosLimpios, null, 2));
            
            if (existente) {
                // Actualizar registro existente
                const { data: updated, error: updateError } = await supabase
                    .from('calificaciones')
                    .update(datosLimpios)
                    .eq('id', existente.id)
                    .select();
                
                if (updateError) {
                    console.error('❌ Error al actualizar:', updateError);
                    console.error('Datos enviados:', JSON.stringify(datosLimpios, null, 2));
                    throw updateError;
                }
                console.log('✅ Calificación actualizada:', updated);
            } else {
                // Crear nuevo registro
                const { data: inserted, error: insertError } = await supabase
                    .from('calificaciones')
                    .insert([datosLimpios]) // Envolver en array para insert
                    .select();
                
                if (insertError) {
                    console.error('❌ Error al insertar:', insertError);
                    console.error('Código de error:', insertError.code);
                    console.error('Mensaje:', insertError.message);
                    console.error('Detalles:', insertError.details);
                    console.error('Hint:', insertError.hint);
                    console.error('Datos enviados:', JSON.stringify(datosLimpios, null, 2));
                    throw insertError;
                }
                console.log('✅ Calificación insertada:', inserted);
            }
        }
        
        mostrarAlerta('Calificación guardada correctamente', 'success');
        
        // Recargar calificaciones para mostrar estado actualizado
        await cargarCalificacionesExistentes();
        
    } catch (error) {
        console.error('❌ Error guardando calificación:', error);
        console.error('Detalles:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        
        let mensajeError = 'Error al guardar la calificación';
        if (error.message) {
            mensajeError += `: ${error.message}`;
        }
        if (error.hint) {
            mensajeError += ` (${error.hint})`;
        }
        
        mostrarAlerta(mensajeError, 'error');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar Calificación';
    }
}
