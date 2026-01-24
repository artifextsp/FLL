import { querySupabase, insertSupabase, updateSupabase, deleteSupabase, supabase } from '../supabase.js';
import { mostrarAlerta, confirmarAccion } from '../utils.js';

// Estado local
let rubricas = [];
let eventos = [];
let rubricaSeleccionada = null; // Rúbrica actual (para editar aspectos)
let aspectos = []; // Aspectos de la rúbrica seleccionada

// Elementos del DOM - Rúbricas
const tablaRubricas = document.getElementById('tabla-rubricas');
const modalRubrica = document.getElementById('modal-rubrica');
const formRubrica = document.getElementById('form-rubrica');
const filtroEvento = document.getElementById('filtro-evento');
const selectEvento = document.getElementById('evento_id');

// Elementos del DOM - Aspectos
const seccionAspectos = document.getElementById('seccion-aspectos');
const tablaAspectos = document.getElementById('tabla-aspectos');
const formAspecto = document.getElementById('form-aspecto');
const tituloRubricaAspectos = document.getElementById('titulo-rubrica-aspectos');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();
    cargarRubricas();
    configurarEventListeners();
});

function configurarEventListeners() {
    // Botones principales
    document.getElementById('btn-nueva-rubrica').addEventListener('click', () => abrirModalRubrica());
    document.getElementById('btn-cancelar-rubrica').addEventListener('click', () => cerrarModalRubrica());
    
    // Forms
    formRubrica.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarRubrica();
    });
    
    formAspecto.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarAspecto();
    });
    
    // Filtro
    filtroEvento.addEventListener('change', () => cargarRubricas());
    
    // Cerrar sección aspectos
    document.getElementById('btn-cerrar-aspectos').addEventListener('click', () => cerrarSeccionAspectos());
}

// ==========================================
// GESTIÓN DE RÚBRICAS
// ==========================================

async function cargarEventos() {
    const data = await querySupabase('eventos', { filtros: [{ campo: 'activo', valor: true }] });
    eventos = data || [];
    
    selectEvento.innerHTML = '<option value="">-- Selecciona --</option>';
    filtroEvento.innerHTML = '<option value="">Todos los eventos</option>';
    
    eventos.forEach(evt => {
        const op = new Option(evt.nombre, evt.id);
        selectEvento.add(op.cloneNode(true));
        filtroEvento.add(op);
    });
}

async function cargarRubricas() {
    mostrarCargando(tablaRubricas, 4);
    const eventoId = filtroEvento.value;
    
    let query = supabase.from('rubricas').select('*, eventos(nombre)').eq('activo', true);
    if (eventoId) query = query.eq('evento_id', eventoId);
    
    const { data, error } = await query;
    if (error) { mostrarAlerta('Error cargando rúbricas', 'error'); return; }
    
    rubricas = data || [];
    renderizarTablaRubricas();
}

function renderizarTablaRubricas() {
    tablaRubricas.innerHTML = '';
    if (rubricas.length === 0) {
        tablaRubricas.innerHTML = '<tr><td colspan="4" class="text-center py-md text-secondary">No hay rúbricas.</td></tr>';
        return;
    }
    
    rubricas.forEach(rubrica => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${rubrica.nombre}</strong><br><small class="text-secondary">${rubrica.descripcion || ''}</small></td>
            <td>${rubrica.eventos ? rubrica.eventos.nombre : 'Sin evento'}</td>
            <td>
                <button class="btn btn-sm btn-outline btn-aspectos" data-id="${rubrica.id}">📋 Gestionar Aspectos</button>
            </td>
            <td class="text-right">
                <button class="btn-icon btn-edit" title="Editar Nombre">✏️</button>
                <button class="btn-icon btn-delete" title="Eliminar">🗑️</button>
            </td>
        `;
        
        tr.querySelector('.btn-aspectos').addEventListener('click', () => abrirSeccionAspectos(rubrica));
        tr.querySelector('.btn-edit').addEventListener('click', () => abrirModalRubrica(rubrica));
        tr.querySelector('.btn-delete').addEventListener('click', () => eliminarRubrica(rubrica.id));
        
        tablaRubricas.appendChild(tr);
    });
}

async function guardarRubrica() {
    const nombre = document.getElementById('nombre').value;
    const eventoId = document.getElementById('evento_id').value;
    const descripcion = document.getElementById('descripcion').value;
    const id = formRubrica.dataset.id;
    
    const datos = { nombre, evento_id: eventoId, descripcion };
    
    try {
        if (id) await updateSupabase('rubricas', id, datos);
        else await insertSupabase('rubricas', datos);
        
        mostrarAlerta(id ? 'Actualizado' : 'Creado', 'success');
        cerrarModalRubrica();
        cargarRubricas();
    } catch (e) { mostrarAlerta('Error al guardar', 'error'); }
}

async function eliminarRubrica(id) {
    if (!confirmarAccion('¿Eliminar rúbrica y todos sus aspectos?')) return;
    try { await deleteSupabase('rubricas', id); cargarRubricas(); } 
    catch (e) { mostrarAlerta('Error al eliminar', 'error'); }
}

// ==========================================
// GESTIÓN DE ASPECTOS
// ==========================================

async function abrirSeccionAspectos(rubrica) {
    rubricaSeleccionada = rubrica;
    tituloRubricaAspectos.textContent = `Aspectos de: ${rubrica.nombre}`;
    seccionAspectos.classList.remove('hidden');
    
    // Scroll suave hacia la sección
    seccionAspectos.scrollIntoView({ behavior: 'smooth' });
    
    await cargarAspectos(rubrica.id);
}

async function cargarAspectos(rubricaId) {
    mostrarCargando(tablaAspectos, 3);
    const data = await querySupabase('aspectos_rubrica', {
        filtros: [{ campo: 'rubrica_id', valor: rubricaId }, { campo: 'activo', valor: true }],
        orden: { campo: 'orden', ascending: true }
    });
    
    aspectos = data || [];
    renderizarTablaAspectos();
}

function renderizarTablaAspectos() {
    tablaAspectos.innerHTML = '';
    let totalPuntos = 0;
    
    aspectos.forEach(aspecto => {
        totalPuntos += aspecto.valor_maximo;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${aspecto.nombre}</td>
            <td class="text-center">${aspecto.valor_maximo} pts</td>
            <td class="text-right">
                <button class="btn-icon btn-delete-aspecto" data-id="${aspecto.id}">🗑️</button>
            </td>
        `;
        tr.querySelector('.btn-delete-aspecto').addEventListener('click', () => eliminarAspecto(aspecto.id));
        tablaAspectos.appendChild(tr);
    });
    
    // Fila de total
    const trTotal = document.createElement('tr');
    trTotal.innerHTML = `
        <td class="text-right"><strong>TOTAL:</strong></td>
        <td class="text-center"><strong>${totalPuntos} pts</strong></td>
        <td></td>
    `;
    trTotal.style.backgroundColor = '#f5f5f5';
    tablaAspectos.appendChild(trTotal);
}

async function guardarAspecto() {
    if (!rubricaSeleccionada) return;
    
    const nombre = document.getElementById('aspecto_nombre').value;
    const valor = document.getElementById('aspecto_valor').value;
    
    const datos = {
        rubrica_id: rubricaSeleccionada.id,
        nombre,
        valor_maximo: parseInt(valor),
        orden: aspectos.length + 1
    };
    
    try {
        await insertSupabase('aspectos_rubrica', datos);
        formAspecto.reset();
        cargarAspectos(rubricaSeleccionada.id);
    } catch (e) { mostrarAlerta('Error al guardar aspecto', 'error'); }
}

async function eliminarAspecto(id) {
    if (!confirm('¿Eliminar aspecto?')) return;
    try { 
        await deleteSupabase('aspectos_rubrica', id);
        cargarAspectos(rubricaSeleccionada.id);
    } catch (e) { mostrarAlerta('Error al eliminar', 'error'); }
}

// Helpers UI
function abrirModalRubrica(rubrica = null) {
    formRubrica.reset();
    delete formRubrica.dataset.id;
    document.getElementById('modal-titulo').textContent = 'Nueva Rúbrica';
    
    if (rubrica) {
        formRubrica.dataset.id = rubrica.id;
        document.getElementById('nombre').value = rubrica.nombre;
        document.getElementById('descripcion').value = rubrica.descripcion || '';
        document.getElementById('evento_id').value = rubrica.evento_id;
        document.getElementById('modal-titulo').textContent = 'Editar Rúbrica';
    }
    modalRubrica.classList.remove('hidden');
}

function cerrarModalRubrica() { modalRubrica.classList.add('hidden'); }
function cerrarSeccionAspectos() { seccionAspectos.classList.add('hidden'); rubricaSeleccionada = null; }

function mostrarCargando(tabla, cols) {
    tabla.innerHTML = `<tr><td colspan="${cols}" class="text-center py-lg"><div class="loading"></div></td></tr>`;
}
