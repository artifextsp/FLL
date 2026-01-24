import { querySupabase, insertSupabase, updateSupabase, deleteSupabase, supabase } from '../supabase.js';
import { mostrarAlerta, confirmarAccion } from '../utils.js';

// Estado local
let equipos = [];
let eventos = [];
let equipoEditandoId = null;

// Elementos del DOM
const tablaEquipos = document.getElementById('tabla-equipos');
const modalEquipo = document.getElementById('modal-equipo');
const formEquipo = document.getElementById('form-equipo');
const btnNuevoEquipo = document.getElementById('btn-nuevo-equipo');
const btnCancelar = document.getElementById('btn-cancelar');
const tituloModal = document.getElementById('titulo-modal');
const selectEvento = document.getElementById('evento_id');
const filtroEvento = document.getElementById('filtro-evento');

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
    
    // Filtro de eventos
    filtroEvento.addEventListener('change', () => cargarEquipos());
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
        renderizarTabla();
        
    } catch (error) {
        console.error('Error cargando equipos:', error);
        mostrarAlerta('Error al cargar los equipos', 'error');
    }
}

/**
 * Renderizar la tabla de equipos
 */
function renderizarTabla() {
    if (!tablaEquipos) return;
    
    tablaEquipos.innerHTML = '';
    
    if (equipos.length === 0) {
        tablaEquipos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary py-md">
                    No hay equipos registrados. ¡Crea el primero!
                </td>
            </tr>
        `;
        return;
    }
    
    equipos.forEach(equipo => {
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
                <button class="btn-icon btn-edit" data-id="${equipo.id}" title="Editar">✏️</button>
                <button class="btn-icon btn-delete" data-id="${equipo.id}" title="Eliminar">🗑️</button>
            </td>
        `;
        
        // Listeners para botones de acción
        const btnEdit = tr.querySelector('.btn-edit');
        const btnDelete = tr.querySelector('.btn-delete');
        
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
    tablaEquipos.innerHTML = '<tr><td colspan="4" class="text-center py-lg"><div class="loading"></div></td></tr>';
}
