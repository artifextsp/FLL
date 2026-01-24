import { querySupabase, insertSupabase, updateSupabase, deleteSupabase, supabase } from '../supabase.js';
import { mostrarAlerta, confirmarAccion } from '../utils.js';

// Estado local
let equipos = [];
let equiposFiltrados = [];
let eventos = [];
let equipoEditandoId = null;

// Elementos del DOM
const tablaEquipos = document.getElementById('tabla-equipos');
const modalEquipo = document.getElementById('modal-equipo');
const modalDetallesEquipo = document.getElementById('modal-detalles-equipo');
const contenidoDetallesEquipo = document.getElementById('contenido-detalles-equipo');
const formEquipo = document.getElementById('form-equipo');
const btnNuevoEquipo = document.getElementById('btn-nuevo-equipo');
const btnCancelar = document.getElementById('btn-cancelar');
const tituloModal = document.getElementById('titulo-modal');
const selectEvento = document.getElementById('evento_id');
const filtroEvento = document.getElementById('filtro-evento');
const filtroBusqueda = document.getElementById('filtro-busqueda');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();
    cargarEquipos();
    configurarEventListeners();
});

function configurarEventListeners() {
    btnNuevoEquipo.addEventListener('click', () => abrirModal());
    btnCancelar.addEventListener('click', () => cerrarModal());
    
    formEquipo.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarEquipo();
    });

    // Cerrar modal al hacer clic fuera
    modalEquipo.addEventListener('click', (e) => {
        if (e.target === modalEquipo) cerrarModal();
    });
    
    modalDetallesEquipo.addEventListener('click', (e) => {
        if (e.target === modalDetallesEquipo) cerrarModalDetalles();
    });
    
    // Botón cerrar detalles
    document.getElementById('btn-cerrar-detalles').addEventListener('click', () => cerrarModalDetalles());
    
    // Filtro de eventos
    filtroEvento.addEventListener('change', () => aplicarFiltros());
    
    // Filtro de búsqueda
    filtroBusqueda.addEventListener('input', () => aplicarFiltros());
}

/**
 * Cargar lista de eventos para los selects
 */
async function cargarEventos() {
    try {
        const data = await querySupabase('eventos', {
            orden: { campo: 'fecha_inicio', ascending: false },
            filtros: [{ campo: 'activo', valor: true }]
        });
        
        eventos = data || [];
        llenarSelectEventos();
        
    } catch (error) {
        console.error('Error cargando eventos:', error);
        mostrarAlerta('Error al cargar eventos', 'error');
    }
}

/**
 * Llenar selects de eventos (modal y filtro)
 */
function llenarSelectEventos() {
    // Select del modal
    selectEvento.innerHTML = '<option value="">-- Selecciona un evento --</option>';
    
    // Select del filtro
    const valorFiltroActual = filtroEvento.value;
    filtroEvento.innerHTML = '<option value="">Todos los eventos</option>';
    
    eventos.forEach(evento => {
        const opcion = document.createElement('option');
        opcion.value = evento.id;
        opcion.textContent = evento.nombre;
        
        selectEvento.appendChild(opcion.cloneNode(true));
        filtroEvento.appendChild(opcion);
    });
    
    if (valorFiltroActual) {
        filtroEvento.value = valorFiltroActual;
    }
}

/**
 * Cargar lista de equipos desde Supabase
 */
async function cargarEquipos() {
    try {
        mostrarCargando();
        
        const eventoId = filtroEvento.value;
        
        let query = supabase
            .from('equipos')
            .select(`
                *,
                eventos (nombre)
            `)
            .eq('activo', true)
            .order('nombre', { ascending: true });
            
        if (eventoId) {
            query = query.eq('evento_id', eventoId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        equipos = data || [];
        equiposFiltrados = [...equipos];
        aplicarFiltros();
        
    } catch (error) {
        console.error('Error cargando equipos:', error);
        mostrarAlerta('Error al cargar los equipos', 'error');
    }
}

/**
 * Aplicar filtros de búsqueda y evento
 */
function aplicarFiltros() {
    const textoBusqueda = (filtroBusqueda.value || '').toLowerCase().trim();
    const eventoId = filtroEvento.value;
    
    equiposFiltrados = equipos.filter(equipo => {
        // Filtro por evento
        if (eventoId && equipo.evento_id !== eventoId) {
            return false;
        }
        
        // Filtro por búsqueda de texto
        if (textoBusqueda) {
            const nombreEquipo = (equipo.nombre || '').toLowerCase();
            const nombreEvento = (equipo.eventos?.nombre || '').toLowerCase();
            return nombreEquipo.includes(textoBusqueda) || nombreEvento.includes(textoBusqueda);
        }
        
        return true;
    });
    
    renderizarTabla();
}

/**
 * Renderizar la tabla de equipos
 */
function renderizarTabla() {
    if (!tablaEquipos) return;
    
    tablaEquipos.innerHTML = '';
    
    if (equiposFiltrados.length === 0) {
        const mensaje = equipos.length === 0 
            ? 'No hay equipos registrados. ¡Crea el primero!'
            : 'No se encontraron equipos con los filtros aplicados.';
        tablaEquipos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary py-md">
                    ${mensaje}
                </td>
            </tr>
        `;
        return;
    }
    
    equiposFiltrados.forEach(equipo => {
        const tr = document.createElement('tr');
        const nombreEvento = equipo.eventos ? equipo.eventos.nombre : 'Sin evento';
        const contrasena = equipo.contrasena || 'Sin contraseña';
        
        tr.innerHTML = `
            <td><strong>${equipo.nombre}</strong></td>
            <td>${nombreEvento}</td>
            <td>
                <span class="badge ${equipo.activo ? 'badge-success' : 'badge-danger'}">
                    ${equipo.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: var(--primary-color);">
                    ${contrasena}
                </code>
            </td>
            <td class="text-right">
                <button class="btn-icon btn-view" data-id="${equipo.id}" title="Ver Detalles" style="color: var(--primary-color);">👁️</button>
                <button class="btn-icon btn-edit" data-id="${equipo.id}" title="Editar">✏️</button>
                <button class="btn-icon btn-delete" data-id="${equipo.id}" title="Eliminar">🗑️</button>
            </td>
        `;
        
        // Listeners para botones de acción
        const btnView = tr.querySelector('.btn-view');
        const btnEdit = tr.querySelector('.btn-edit');
        const btnDelete = tr.querySelector('.btn-delete');
        
        btnView.addEventListener('click', () => verDetallesEquipo(equipo.id));
        btnEdit.addEventListener('click', () => cargarEquipoParaEditar(equipo));
        btnDelete.addEventListener('click', () => eliminarEquipo(equipo.id));
        
        tablaEquipos.appendChild(tr);
    });
}

/**
 * Generar contraseña de 4 dígitos aleatoria
 */
function generarContrasena() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Guardar equipo (Crear o Actualizar)
 */
async function guardarEquipo() {
    const nombre = document.getElementById('nombre').value;
    const eventoId = document.getElementById('evento_id').value;
    
    if (!nombre || !eventoId) {
        mostrarAlerta('Por favor completa todos los campos', 'warning');
        return;
    }
    
    const datos = {
        nombre,
        evento_id: eventoId
    };
    
    // Si es un equipo nuevo, generar contraseña automáticamente
    if (!equipoEditandoId) {
        datos.contrasena = generarContrasena();
    }
    
    const btnSubmit = formEquipo.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Guardando...';
    
    try {
        if (equipoEditandoId) {
            // Actualizar
            await updateSupabase('equipos', equipoEditandoId, datos);
            mostrarAlerta('Equipo actualizado correctamente', 'success');
        } else {
            // Crear
            const { data } = await insertSupabase('equipos', datos);
            mostrarAlerta(`✅ Equipo creado correctamente\n\n🔑 Contraseña: ${datos.contrasena}\n\n⚠️ Guarda esta contraseña para que el equipo pueda acceder a sus calificaciones.`, 'success', 8000);
        }
        
        cerrarModal();
        cargarEquipos();
        
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarAlerta('Error al guardar el equipo', 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Guardar';
    }
}

/**
 * Preparar modal para editar
 */
function cargarEquipoParaEditar(equipo) {
    equipoEditandoId = equipo.id;
    tituloModal.textContent = 'Editar Equipo';
    
    document.getElementById('nombre').value = equipo.nombre;
    document.getElementById('evento_id').value = equipo.evento_id;
    
    // Mostrar contraseña actual si existe
    const contrasenaContainer = document.getElementById('contrasena-display-container');
    const contrasenaField = document.getElementById('contrasena-display');
    if (contrasenaContainer && contrasenaField) {
        contrasenaContainer.style.display = 'block';
        contrasenaField.textContent = equipo.contrasena || 'Sin contraseña';
    }
    
    modalEquipo.classList.remove('hidden');
}

/**
 * Eliminar equipo (Soft Delete)
 */
async function eliminarEquipo(id) {
    if (!confirmarAccion('¿Estás seguro de eliminar este equipo?')) {
        return;
    }
    
    try {
        await deleteSupabase('equipos', id);
        mostrarAlerta('Equipo eliminado correctamente', 'success');
        cargarEquipos();
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarAlerta('Error al eliminar el equipo', 'error');
    }
}

// Helpers de UI
function abrirModal() {
    equipoEditandoId = null;
    tituloModal.textContent = 'Nuevo Equipo';
    formEquipo.reset();
    
    // Ocultar campo de contraseña al crear nuevo equipo
    const contrasenaContainer = document.getElementById('contrasena-display-container');
    if (contrasenaContainer) {
        contrasenaContainer.style.display = 'none';
    }
    
    // Si hay un filtro activo, preseleccionar ese evento
    const filtroActivo = filtroEvento.value;
    if (filtroActivo) {
        selectEvento.value = filtroActivo;
    }
    
    modalEquipo.classList.remove('hidden');
}

function cerrarModal() {
    modalEquipo.classList.add('hidden');
    formEquipo.reset();
    equipoEditandoId = null;
    
    // Ocultar campo de contraseña
    const contrasenaContainer = document.getElementById('contrasena-display-container');
    if (contrasenaContainer) {
        contrasenaContainer.style.display = 'none';
    }
}

function mostrarCargando() {
    tablaEquipos.innerHTML = '<tr><td colspan="5" class="text-center py-lg"><div class="loading"></div></td></tr>';
}

/**
 * Ver detalles completos de un equipo
 */
async function verDetallesEquipo(equipoId) {
    try {
        contenidoDetallesEquipo.innerHTML = '<div class="text-center py-lg"><div class="loading"></div><p style="margin-top: 12px;">Cargando detalles...</p></div>';
        modalDetallesEquipo.classList.remove('hidden');
        modalDetallesEquipo.querySelector('.modal-content').classList.add('large');
        
        // Buscar equipo en la lista
        const equipo = equipos.find(e => e.id === equipoId);
        if (!equipo) {
            mostrarAlerta('Equipo no encontrado', 'error');
            cerrarModalDetalles();
            return;
        }
        
        // Cargar calificaciones del equipo
        const { data: calificaciones, error: errCal } = await supabase
            .from('calificaciones')
            .select(`
                *,
                rubricas (nombre),
                aspectos_rubrica (nombre),
                jurados (nombre_referencia)
            `)
            .eq('equipo_id', equipoId);
            
        if (errCal) throw errCal;
        
        // Cargar rúbricas del evento
        const { data: rubricas, error: errRubricas } = await supabase
            .from('rubricas')
            .select('*')
            .eq('evento_id', equipo.evento_id)
            .eq('activo', true);
            
        if (errRubricas) throw errRubricas;
        
        // Procesar datos
        const calificacionesArray = calificaciones || [];
        const totalCalificaciones = calificacionesArray.length;
        const sumaTotal = calificacionesArray.reduce((sum, cal) => sum + (cal.puntuacion || 0), 0);
        
        // Agrupar por jurado
        const porJurado = {};
        calificacionesArray.forEach(cal => {
            const juradoId = cal.jurado_id;
            if (!porJurado[juradoId]) {
                porJurado[juradoId] = {
                    jurado: cal.jurados,
                    calificaciones: []
                };
            }
            porJurado[juradoId].calificaciones.push(cal);
        });
        
        // Agrupar por rúbrica
        const porRubrica = {};
        calificacionesArray.forEach(cal => {
            if (!porRubrica[cal.rubrica_id]) {
                porRubrica[cal.rubrica_id] = {
                    rubrica: cal.rubricas,
                    calificaciones: [],
                    suma: 0
                };
            }
            porRubrica[cal.rubrica_id].calificaciones.push(cal);
            porRubrica[cal.rubrica_id].suma += cal.puntuacion || 0;
        });
        
        // Renderizar contenido
        const nombreEvento = equipo.eventos ? equipo.eventos.nombre : 'Sin evento';
        const contrasena = equipo.contrasena || 'Sin contraseña asignada';
        
        let html = `
            <div style="margin-bottom: 24px;">
                <h3 style="color: var(--primary-color); margin-bottom: 16px;">📋 Información del Equipo</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
                    <div style="background: #f9f9f9; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Nombre</div>
                        <div style="font-weight: bold; font-size: 1.1rem;">${equipo.nombre}</div>
                    </div>
                    <div style="background: #f9f9f9; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Evento</div>
                        <div style="font-weight: bold;">${nombreEvento}</div>
                    </div>
                    <div style="background: #f9f9f9; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Contraseña</div>
                        <div style="font-weight: bold; font-family: monospace; color: var(--primary-color); font-size: 1.1rem;">${contrasena}</div>
                    </div>
                    <div style="background: #f9f9f9; padding: 12px; border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Estado</div>
                        <div>
                            <span class="badge ${equipo.activo ? 'badge-success' : 'badge-danger'}">
                                ${equipo.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="color: var(--primary-color); margin-bottom: 16px;">📊 Estadísticas</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">Total Puntos</div>
                        <div style="font-size: 2rem; font-weight: bold;">${sumaTotal}</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">Calificaciones</div>
                        <div style="font-size: 2rem; font-weight: bold;">${totalCalificaciones}</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">Jurados</div>
                        <div style="font-size: 2rem; font-weight: bold;">${Object.keys(porJurado).length}</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">Rúbricas</div>
                        <div style="font-size: 2rem; font-weight: bold;">${Object.keys(porRubrica).length}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Detalles por rúbrica
        if (Object.keys(porRubrica).length > 0) {
            html += `
                <div style="margin-bottom: 24px;">
                    <h3 style="color: var(--primary-color); margin-bottom: 16px;">📋 Calificaciones por Rúbrica</h3>
            `;
            
            Object.values(porRubrica).forEach(rubricaData => {
                const observacionGeneral = rubricaData.calificaciones[0]?.observacion_general || '';
                
                html += `
                    <div style="background: white; border: 2px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: var(--primary-color);">${rubricaData.rubrica?.nombre || 'Rúbrica'}</h4>
                            <span style="font-weight: bold; font-size: 1.2rem; color: var(--success-color);">
                                ${rubricaData.suma} pts
                            </span>
                        </div>
                `;
                
                if (observacionGeneral) {
                    html += `
                        <div style="background: #fff9e6; padding: 12px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #ffc107;">
                            <strong>📝 Observación General:</strong>
                            <p style="margin: 4px 0 0 0; color: #333;">${observacionGeneral}</p>
                        </div>
                    `;
                }
                
                // Agrupar por aspecto
                const porAspecto = {};
                rubricaData.calificaciones.forEach(cal => {
                    if (!porAspecto[cal.aspecto_id]) {
                        porAspecto[cal.aspecto_id] = [];
                    }
                    porAspecto[cal.aspecto_id].push(cal);
                });
                
                Object.values(porAspecto).forEach(calificacionesAspecto => {
                    const cal = calificacionesAspecto[0];
                    const aspecto = cal.aspectos_rubrica;
                    const nivel = cal.nivel_seleccionado || 'N/A';
                    const observacion = cal.observacion_aspecto || '';
                    const sumaAspecto = calificacionesAspecto.reduce((sum, c) => sum + (c.puntuacion || 0), 0);
                    
                    html += `
                        <div style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                                <div>
                                    <strong>${aspecto?.nombre || 'Aspecto'}</strong>
                                    <span style="color: var(--text-secondary); font-size: 0.9rem; margin-left: 8px;">
                                        Nivel ${nivel}
                                    </span>
                                </div>
                                <span style="font-weight: bold; color: var(--success-color);">
                                    ${sumaAspecto} pts
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
                
                html += `</div>`;
            });
            
            html += `</div>`;
        }
        
        // Detalles por jurado
        if (Object.keys(porJurado).length > 0) {
            html += `
                <div>
                    <h3 style="color: var(--primary-color); margin-bottom: 16px;">👨‍⚖️ Calificaciones por Jurado</h3>
            `;
            
            Object.values(porJurado).forEach((juradoData, index) => {
                const nombreJurado = juradoData.jurado?.nombre_referencia || `Jurado ${index + 1}`;
                const sumaJurado = juradoData.calificaciones.reduce((sum, cal) => sum + (cal.puntuacion || 0), 0);
                
                html += `
                    <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid var(--primary-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="margin: 0;">${nombreJurado}</h4>
                            <span style="font-weight: bold; color: var(--primary-color);">
                                Total: ${sumaJurado} pts
                            </span>
                        </div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">
                            ${juradoData.calificaciones.length} calificación(es) realizada(s)
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        if (totalCalificaciones === 0) {
            html += `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 16px;">📭</div>
                    <p style="font-size: 1.1rem;">Este equipo aún no ha recibido calificaciones.</p>
                </div>
            `;
        }
        
        contenidoDetallesEquipo.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando detalles:', error);
        mostrarAlerta('Error al cargar los detalles del equipo', 'error');
        cerrarModalDetalles();
    }
}

function cerrarModalDetalles() {
    modalDetallesEquipo.classList.add('hidden');
    contenidoDetallesEquipo.innerHTML = '';
    modalDetallesEquipo.querySelector('.modal-content').classList.remove('large');
}
