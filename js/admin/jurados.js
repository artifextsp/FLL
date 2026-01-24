import { querySupabase, insertSupabase, updateSupabase, deleteSupabase, supabase } from '../supabase.js';
import { mostrarAlerta, confirmarAccion } from '../utils.js';

// Estado local
let jurados = [];
let eventos = [];
let juradoEditandoId = null;

// Elementos del DOM
const tablaJurados = document.getElementById('tabla-jurados');
const modalJurado = document.getElementById('modal-jurado');
const formJurado = document.getElementById('form-jurado');
const btnNuevoJurado = document.getElementById('btn-nuevo-jurado');
const btnCancelar = document.getElementById('btn-cancelar');
const tituloModal = document.getElementById('titulo-modal');
const selectEvento = document.getElementById('evento_id');
const filtroEvento = document.getElementById('filtro-evento');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();
    cargarJurados();
    configurarEventListeners();
});

function configurarEventListeners() {
    btnNuevoJurado.addEventListener('click', () => abrirModal());
    btnCancelar.addEventListener('click', () => cerrarModal());
    
    formJurado.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarJurado();
    });

    // Cerrar modal al hacer clic fuera
    modalJurado.addEventListener('click', (e) => {
        if (e.target === modalJurado) cerrarModal();
    });
    
    // Filtro de eventos
    filtroEvento.addEventListener('change', () => cargarJurados());
}

/**
 * Cargar lista de eventos
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

function llenarSelectEventos() {
    selectEvento.innerHTML = '<option value="">-- Selecciona un evento --</option>';
    filtroEvento.innerHTML = '<option value="">Todos los eventos</option>';
    
    const valorFiltro = filtroEvento.value;
    
    eventos.forEach(evento => {
        const opcion = document.createElement('option');
        opcion.value = evento.id;
        opcion.textContent = evento.nombre;
        
        selectEvento.appendChild(opcion.cloneNode(true));
        filtroEvento.appendChild(opcion);
    });
    
    if (valorFiltro) filtroEvento.value = valorFiltro;
}

/**
 * Cargar lista de jurados
 */
async function cargarJurados() {
    try {
        mostrarCargando();
        
        const eventoId = filtroEvento.value;
        
        let query = supabase
            .from('jurados')
            .select(`
                *,
                eventos (nombre)
            `)
            .eq('activo', true);
            
        if (eventoId) {
            query = query.eq('evento_id', eventoId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        jurados = data || [];
        renderizarTabla();
        
    } catch (error) {
        console.error('Error cargando jurados:', error);
        mostrarAlerta('Error al cargar los jurados', 'error');
    }
}

function renderizarTabla() {
    if (!tablaJurados) return;
    
    tablaJurados.innerHTML = '';
    
    if (jurados.length === 0) {
        tablaJurados.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-secondary py-md">
                    No hay jurados asignados.
                </td>
            </tr>
        `;
        return;
    }
    
    jurados.forEach(jurado => {
        const tr = document.createElement('tr');
        const nombreEvento = jurado.eventos ? jurado.eventos.nombre : 'Sin evento';
        
        tr.innerHTML = `
            <td>
                <strong>${jurado.nombre_referencia || 'Sin nombre'}</strong><br>
                <small class="text-secondary">ID: ${jurado.usuario_id}</small>
            </td>
            <td>${nombreEvento}</td>
            <td>
                <span class="badge ${jurado.activo ? 'badge-success' : 'badge-danger'}">
                    ${jurado.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="text-right">
                <button class="btn-icon btn-edit" data-id="${jurado.id}" title="Editar">✏️</button>
                <button class="btn-icon btn-delete" data-id="${jurado.id}" title="Eliminar">🗑️</button>
            </td>
        `;
        
        tr.querySelector('.btn-edit').addEventListener('click', () => cargarJuradoParaEditar(jurado));
        tr.querySelector('.btn-delete').addEventListener('click', () => eliminarJurado(jurado.id));
        
        tablaJurados.appendChild(tr);
    });
}

/**
 * Guardar jurado
 */
async function guardarJurado() {
    const nombre = document.getElementById('nombre_referencia').value;
    const usuarioId = document.getElementById('usuario_id').value;
    const eventoId = document.getElementById('evento_id').value;
    
    if (!nombre || !usuarioId || !eventoId) {
        mostrarAlerta('Completa todos los campos', 'warning');
        return;
    }
    
    const datos = {
        nombre_referencia: nombre,
        usuario_id: usuarioId,
        evento_id: eventoId
    };
    
    const btnSubmit = formJurado.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    
    try {
        if (juradoEditandoId) {
            await updateSupabase('jurados', juradoEditandoId, datos);
            mostrarAlerta('Jurado actualizado', 'success');
        } else {
            await insertSupabase('jurados', datos);
            mostrarAlerta('Jurado asignado', 'success');
        }
        
        cerrarModal();
        cargarJurados();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar. Verifica que el jurado no esté ya asignado a este evento.', 'error');
    } finally {
        btnSubmit.disabled = false;
    }
}

function cargarJuradoParaEditar(jurado) {
    juradoEditandoId = jurado.id;
    tituloModal.textContent = 'Editar Asignación';
    
    document.getElementById('nombre_referencia').value = jurado.nombre_referencia || '';
    document.getElementById('usuario_id').value = jurado.usuario_id;
    document.getElementById('evento_id').value = jurado.evento_id;
    
    modalJurado.classList.remove('hidden');
}

async function eliminarJurado(id) {
    if (!confirmarAccion('¿Eliminar asignación de jurado?')) return;
    
    try {
        await deleteSupabase('jurados', id);
        mostrarAlerta('Eliminado correctamente', 'success');
        cargarJurados();
    } catch (error) {
        mostrarAlerta('Error al eliminar', 'error');
    }
}

function abrirModal() {
    juradoEditandoId = null;
    tituloModal.textContent = 'Nuevo Jurado';
    formJurado.reset();
    if (filtroEvento.value) selectEvento.value = filtroEvento.value;
    modalJurado.classList.remove('hidden');
}

function cerrarModal() {
    modalJurado.classList.add('hidden');
    juradoEditandoId = null;
}

function mostrarCargando() {
    tablaJurados.innerHTML = '<tr><td colspan="4" class="text-center py-lg"><div class="loading"></div></td></tr>';
}
