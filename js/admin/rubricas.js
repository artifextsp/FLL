import { querySupabase, insertSupabase, updateSupabase, deleteSupabase, supabase } from '../supabase.js';
import { mostrarAlerta, confirmarAccion } from '../utils.js';

// Estado local
let rubricas = [];
let eventos = [];
let rubricaSeleccionada = null;
let aspectoEditando = null; // Aspecto actual siendo editado
let nivelesAspecto = []; // Niveles del aspecto actual

// Elementos del DOM
const tablaRubricas = document.getElementById('tabla-rubricas');
const modalRubrica = document.getElementById('modal-rubrica');
const formRubrica = document.getElementById('form-rubrica');
const filtroEvento = document.getElementById('filtro-evento');
const selectEvento = document.getElementById('evento_id');
const seccionAspectos = document.getElementById('seccion-aspectos');
const tablaAspectos = document.getElementById('tabla-aspectos');
const modalAspecto = document.getElementById('modal-aspecto');
const formAspecto = document.getElementById('form-aspecto');
const tituloRubricaAspectos = document.getElementById('titulo-rubrica-aspectos');
const listaNiveles = document.getElementById('lista-niveles');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();
    cargarRubricas();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('btn-nueva-rubrica').addEventListener('click', () => abrirModalRubrica());
    document.getElementById('btn-cancelar-rubrica').addEventListener('click', () => cerrarModalRubrica());
    formRubrica.addEventListener('submit', async (e) => { e.preventDefault(); await guardarRubrica(); });
    filtroEvento.addEventListener('change', () => cargarRubricas());
    document.getElementById('btn-cerrar-aspectos').addEventListener('click', () => cerrarSeccionAspectos());
    document.getElementById('btn-cancelar-aspecto').addEventListener('click', () => cerrarModalAspecto());
    formAspecto.addEventListener('submit', async (e) => { e.preventDefault(); await guardarAspecto(); });
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
        selectEvento.add(new Option(evt.nombre, evt.id));
        filtroEvento.add(new Option(evt.nombre, evt.id));
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
            <td><button class="btn btn-sm btn-outline btn-aspectos" data-id="${rubrica.id}">📋 Gestionar Aspectos</button></td>
            <td class="text-right">
                <button class="btn-icon btn-edit" title="Editar">✏️</button>
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
// GESTIÓN DE ASPECTOS CON NIVELES
// ==========================================

async function abrirSeccionAspectos(rubrica) {
    rubricaSeleccionada = rubrica;
    tituloRubricaAspectos.textContent = `Aspectos de: ${rubrica.nombre}`;
    seccionAspectos.classList.remove('hidden');
    seccionAspectos.scrollIntoView({ behavior: 'smooth' });
    await cargarAspectos(rubrica.id);
}

async function cargarAspectos(rubricaId) {
    mostrarCargando(tablaAspectos, 3);
    const data = await querySupabase('aspectos_rubrica', {
        filtros: [{ campo: 'rubrica_id', valor: rubricaId }, { campo: 'activo', valor: true }],
        orden: { campo: 'orden', ascending: true }
    });
    const aspectos = data || [];
    
    // Cargar niveles para cada aspecto
    for (const aspecto of aspectos) {
        const niveles = await querySupabase('niveles_aspecto', {
            filtros: [{ campo: 'aspecto_id', valor: aspecto.id }, { campo: 'activo', valor: true }],
            orden: { campo: 'nivel', ascending: true }
        });
        aspecto.niveles = niveles || [];
    }
    
    renderizarTablaAspectos(aspectos);
}

function renderizarTablaAspectos(aspectos) {
    tablaAspectos.innerHTML = '';
    if (aspectos.length === 0) {
        tablaAspectos.innerHTML = '<tr><td colspan="3" class="text-center py-md text-secondary">No hay aspectos. Crea el primero.</td></tr>';
        return;
    }
    
    aspectos.forEach(aspecto => {
        const tr = document.createElement('tr');
        const nivelesInfo = aspecto.niveles && aspecto.niveles.length > 0 
            ? `${aspecto.niveles.length} niveles definidos` 
            : '<span class="text-warning">Sin niveles</span>';
        
        tr.innerHTML = `
            <td><strong>${aspecto.nombre}</strong><br><small class="text-secondary">${aspecto.descripcion || ''}</small></td>
            <td>${nivelesInfo}</td>
            <td class="text-right">
                <button class="btn-icon btn-edit-aspecto" data-id="${aspecto.id}">✏️</button>
                <button class="btn-icon btn-delete-aspecto" data-id="${aspecto.id}">🗑️</button>
            </td>
        `;
        tr.querySelector('.btn-edit-aspecto').addEventListener('click', () => abrirModalAspecto(aspecto));
        tr.querySelector('.btn-delete-aspecto').addEventListener('click', () => eliminarAspecto(aspecto.id));
        tablaAspectos.appendChild(tr);
    });
}

function abrirModalAspecto(aspecto = null) {
    aspectoEditando = aspecto;
    document.getElementById('modal-aspecto-titulo').textContent = aspecto ? 'Editar Aspecto' : 'Nuevo Aspecto';
    formAspecto.reset();
    listaNiveles.innerHTML = '';
    
    if (aspecto) {
        document.getElementById('aspecto_nombre').value = aspecto.nombre;
        document.getElementById('aspecto_descripcion').value = aspecto.descripcion || '';
        if (aspecto.niveles && aspecto.niveles.length > 0) {
            aspecto.niveles.forEach(nivel => agregarFilaNivel(nivel));
        } else {
            // Inicializar con 4 niveles vacíos
            for (let i = 1; i <= 4; i++) {
                agregarFilaNivel({ nivel: i, descripcion: '', puntuacion: i });
            }
        }
    } else {
        // Nuevo aspecto: 4 niveles por defecto
        for (let i = 1; i <= 4; i++) {
            agregarFilaNivel({ nivel: i, descripcion: '', puntuacion: i });
        }
    }
    
    modalAspecto.classList.remove('hidden');
}

function agregarFilaNivel(nivel) {
    const div = document.createElement('div');
    div.className = 'nivel-fila';
    div.dataset.nivel = nivel.nivel;
    div.innerHTML = `
        <div class="grid grid-4" style="gap: 8px; align-items: end;">
            <div>
                <label class="form-label">Nivel</label>
                <input type="number" class="form-input nivel-numero" value="${nivel.nivel}" min="1" max="4" readonly>
            </div>
            <div style="grid-column: span 2;">
                <label class="form-label">Descripción</label>
                <input type="text" class="form-input nivel-descripcion" value="${nivel.descripcion || ''}" placeholder="Ej: Definición del problema no clara">
            </div>
            <div>
                <label class="form-label">Puntos</label>
                <input type="number" class="form-input nivel-puntuacion" value="${nivel.puntuacion || nivel.nivel}" min="0">
            </div>
        </div>
    `;
    listaNiveles.appendChild(div);
}

async function guardarAspecto() {
    const nombre = document.getElementById('aspecto_nombre').value;
    const descripcion = document.getElementById('aspecto_descripcion').value;
    
    if (!nombre) {
        mostrarAlerta('El nombre del aspecto es obligatorio', 'warning');
        return;
    }
    
    // Validar que todos los niveles tengan descripción
    const filasNiveles = listaNiveles.querySelectorAll('.nivel-fila');
    const niveles = [];
    
    for (const fila of filasNiveles) {
        const nivel = parseInt(fila.querySelector('.nivel-numero').value);
        const desc = fila.querySelector('.nivel-descripcion').value.trim();
        const puntos = parseInt(fila.querySelector('.nivel-puntuacion').value) || nivel;
        
        if (!desc) {
            mostrarAlerta(`La descripción del nivel ${nivel} es obligatoria`, 'warning');
            return;
        }
        
        niveles.push({ nivel, descripcion: desc, puntuacion: puntos });
    }
    
    try {
        let aspectoId;
        
        if (aspectoEditando) {
            // Actualizar aspecto
            await updateSupabase('aspectos_rubrica', aspectoEditando.id, { nombre, descripcion });
            aspectoId = aspectoEditando.id;
            
            // Eliminar niveles antiguos
            const nivelesAntiguos = await querySupabase('niveles_aspecto', {
                filtros: [{ campo: 'aspecto_id', valor: aspectoId }]
            });
            for (const nivel of nivelesAntiguos || []) {
                await deleteSupabase('niveles_aspecto', nivel.id);
            }
        } else {
            // Crear nuevo aspecto
            const maxOrden = await querySupabase('aspectos_rubrica', {
                filtros: [{ campo: 'rubrica_id', valor: rubricaSeleccionada.id }]
            });
            const orden = (maxOrden?.length || 0) + 1;
            
            const nuevoAspecto = await insertSupabase('aspectos_rubrica', {
                rubrica_id: rubricaSeleccionada.id,
                nombre,
                descripcion,
                valor_maximo: Math.max(...niveles.map(n => n.puntuacion)),
                orden
            });
            aspectoId = nuevoAspecto[0].id;
        }
        
        // Crear niveles
        for (const nivel of niveles) {
            await insertSupabase('niveles_aspecto', {
                aspecto_id: aspectoId,
                nivel: nivel.nivel,
                descripcion: nivel.descripcion,
                puntuacion: nivel.puntuacion,
                orden: nivel.nivel
            });
        }
        
        mostrarAlerta('Aspecto guardado correctamente', 'success');
        cerrarModalAspecto();
        cargarAspectos(rubricaSeleccionada.id);
        
    } catch (e) {
        console.error('Error:', e);
        mostrarAlerta('Error al guardar aspecto', 'error');
    }
}

async function eliminarAspecto(id) {
    if (!confirmarAccion('¿Eliminar aspecto y todos sus niveles?')) return;
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
function cerrarModalAspecto() { 
    modalAspecto.classList.add('hidden'); 
    aspectoEditando = null;
    listaNiveles.innerHTML = '';
}

// Exponer función globalmente para el botón
window.abrirModalAspecto = abrirModalAspecto;

function mostrarCargando(tabla, cols) {
    tabla.innerHTML = `<tr><td colspan="${cols}" class="text-center py-lg"><div class="loading"></div></td></tr>`;
}
