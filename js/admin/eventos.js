import { querySupabase, insertSupabase, updateSupabase, deleteSupabase } from '../supabase.js';
import { formatearFecha, mostrarAlerta, confirmarAccion } from '../utils.js';

// Estado local
let eventos = [];
let eventoEditandoId = null;

// Elementos del DOM
const tablaEventos = document.getElementById('tabla-eventos');
const modalEvento = document.getElementById('modal-evento');
const formEvento = document.getElementById('form-evento');
const btnNuevoEvento = document.getElementById('btn-nuevo-evento');
const btnCancelar = document.getElementById('btn-cancelar');
const tituloModal = document.getElementById('titulo-modal');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();
    configurarEventListeners();
});

function configurarEventListeners() {
    btnNuevoEvento.addEventListener('click', () => abrirModal());
    btnCancelar.addEventListener('click', () => cerrarModal());
    
    formEvento.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarEvento();
    });

    // Cerrar modal al hacer clic fuera
    modalEvento.addEventListener('click', (e) => {
        if (e.target === modalEvento) cerrarModal();
    });
}

/**
 * Cargar lista de eventos desde Supabase
 */
async function cargarEventos() {
    try {
        mostrarCargando();
        
        const data = await querySupabase('eventos', {
            orden: { campo: 'fecha_inicio', ascending: false },
            filtros: [{ campo: 'activo', valor: true }]
        });
        
        eventos = data || [];
        renderizarTabla();
        
    } catch (error) {
        console.error('Error cargando eventos:', error);
        mostrarAlerta('Error al cargar los eventos', 'error');
    }
}

/**
 * Renderizar la tabla de eventos
 */
function renderizarTabla() {
    if (!tablaEventos) return;
    
    tablaEventos.innerHTML = '';
    
    if (eventos.length === 0) {
        tablaEventos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary py-md">
                    No hay eventos registrados. ¡Crea el primero!
                </td>
            </tr>
        `;
        return;
    }
    
    eventos.forEach(evento => {
        const tr = document.createElement('tr');
        const fechaInicio = formatearFecha(evento.fecha_inicio);
        const fechaFin = formatearFecha(evento.fecha_fin);
        
        tr.innerHTML = `
            <td><strong>${evento.nombre}</strong></td>
            <td>${fechaInicio}</td>
            <td>${fechaFin}</td>
            <td>
                <span class="badge ${evento.activo ? 'badge-success' : 'badge-danger'}">
                    ${evento.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="text-right">
                <button class="btn-icon btn-edit" data-id="${evento.id}" title="Editar">✏️</button>
                <button class="btn-icon btn-delete" data-id="${evento.id}" title="Eliminar">🗑️</button>
            </td>
        `;
        
        // Listeners para botones de acción
        const btnEdit = tr.querySelector('.btn-edit');
        const btnDelete = tr.querySelector('.btn-delete');
        
        btnEdit.addEventListener('click', () => cargarEventoParaEditar(evento));
        btnDelete.addEventListener('click', () => eliminarEvento(evento.id));
        
        tablaEventos.appendChild(tr);
    });
}

/**
 * Guardar evento (Crear o Actualizar)
 */
async function guardarEvento() {
    const nombre = document.getElementById('nombre').value;
    const fechaInicio = document.getElementById('fecha_inicio').value;
    const fechaFin = document.getElementById('fecha_fin').value;
    const descripcion = document.getElementById('descripcion').value;
    
    if (!nombre || !fechaInicio || !fechaFin) {
        mostrarAlerta('Por favor completa los campos obligatorios', 'warning');
        return;
    }
    
    const datos = {
        nombre,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        descripcion
    };
    
    const btnSubmit = formEvento.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Guardando...';
    
    try {
        if (eventoEditandoId) {
            // Actualizar
            await updateSupabase('eventos', eventoEditandoId, datos);
            mostrarAlerta('Evento actualizado correctamente', 'success');
        } else {
            // Crear
            await insertSupabase('eventos', datos);
            mostrarAlerta('Evento creado correctamente', 'success');
        }
        
        cerrarModal();
        cargarEventos();
        
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarAlerta('Error al guardar el evento', 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Guardar';
    }
}

/**
 * Preparar modal para editar
 */
function cargarEventoParaEditar(evento) {
    eventoEditandoId = evento.id;
    tituloModal.textContent = 'Editar Evento';
    
    document.getElementById('nombre').value = evento.nombre;
    document.getElementById('fecha_inicio').value = evento.fecha_inicio;
    document.getElementById('fecha_fin').value = evento.fecha_fin;
    document.getElementById('descripcion').value = evento.descripcion || '';
    
    modalEvento.classList.remove('hidden');
}

/**
 * Eliminar evento (Soft Delete)
 */
async function eliminarEvento(id) {
    if (!confirmarAccion('¿Estás seguro de eliminar este evento? Esto podría afectar a equipos y calificaciones asociadas.')) {
        return;
    }
    
    try {
        await deleteSupabase('eventos', id);
        mostrarAlerta('Evento eliminado correctamente', 'success');
        cargarEventos();
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarAlerta('Error al eliminar el evento', 'error');
    }
}

// Helpers de UI
function abrirModal() {
    eventoEditandoId = null;
    tituloModal.textContent = 'Nuevo Evento';
    formEvento.reset();
    // Establecer fechas por defecto (hoy)
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_inicio').value = hoy;
    document.getElementById('fecha_fin').value = hoy;
    
    modalEvento.classList.remove('hidden');
}

function cerrarModal() {
    modalEvento.classList.add('hidden');
    formEvento.reset();
    eventoEditandoId = null;
}

function mostrarCargando() {
    tablaEventos.innerHTML = '<tr><td colspan="5" class="text-center py-lg"><div class="loading"></div></td></tr>';
}
