import { supabase } from '../supabase.js';
import { mostrarAlerta } from '../utils.js';

/**
 * Generar PDF con todos los puntajes y comentarios de los jurados
 */
export async function generarPDFResultados() {
    try {
        mostrarAlerta('📄 Generando PDF... Esto puede tomar unos momentos.', 'info', 3000);
        
        // Cargar todos los eventos activos
        const { data: eventos, error: errEventos } = await supabase
            .from('eventos')
            .select('*')
            .eq('activo', true)
            .order('fecha_inicio', { ascending: false });
            
        if (errEventos) throw errEventos;
        
        if (!eventos || eventos.length === 0) {
            mostrarAlerta('No hay eventos activos para generar el reporte', 'warning');
            return;
        }
        
        // Importar jsPDF dinámicamente
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);
        
        // Función para agregar nueva página si es necesario
        function checkPageBreak(requiredSpace) {
            if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                yPos = margin;
            }
        }
        
        // Título principal
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Reporte Completo de Calificaciones FLL', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
        
        // Procesar cada evento
        for (const evento of eventos) {
            checkPageBreak(30);
            
            // Título del evento
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`Evento: ${evento.nombre}`, margin, yPos);
            yPos += 8;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const fechaInicio = new Date(evento.fecha_inicio).toLocaleDateString('es-ES');
            const fechaFin = new Date(evento.fecha_fin).toLocaleDateString('es-ES');
            doc.text(`Período: ${fechaInicio} - ${fechaFin}`, margin, yPos);
            yPos += 10;
            
            // Cargar equipos del evento
            const { data: equipos, error: errEquipos } = await supabase
                .from('equipos')
                .select('*')
                .eq('evento_id', evento.id)
                .eq('activo', true)
                .order('nombre');
                
            if (errEquipos) throw errEquipos;
            
            if (!equipos || equipos.length === 0) {
                doc.setFontSize(10);
                doc.text('No hay equipos registrados en este evento.', margin, yPos);
                yPos += 10;
                continue;
            }
            
            // Cargar rúbricas del evento
            const { data: rubricas, error: errRubricas } = await supabase
                .from('rubricas')
                .select('*')
                .eq('evento_id', evento.id)
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
            
            // Procesar cada equipo
            for (const equipo of equipos) {
                checkPageBreak(40);
                
                const calEquipo = (calificaciones || []).filter(c => c.equipo_id === equipo.id);
                
                if (calEquipo.length === 0) {
                    // Equipo sin calificaciones
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text(`Equipo: ${equipo.nombre}`, margin, yPos);
                    yPos += 6;
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    doc.text('Aún no hay calificaciones registradas.', margin + 5, yPos);
                    yPos += 10;
                    continue;
                }
                
                // Título del equipo
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`Equipo: ${equipo.nombre}`, margin, yPos);
                yPos += 8;
                
                // Agrupar por jurado
                const porJurado = {};
                calEquipo.forEach(cal => {
                    const juradoId = cal.jurado_id;
                    if (!porJurado[juradoId]) {
                        porJurado[juradoId] = {
                            jurado: cal.jurados,
                            calificaciones: []
                        };
                    }
                    porJurado[juradoId].calificaciones.push(cal);
                });
                
                // Mostrar calificaciones por jurado
                Object.values(porJurado).forEach((juradoData, index) => {
                    checkPageBreak(50);
                    
                    const nombreJurado = juradoData.jurado?.nombre_referencia || `Jurado ${index + 1}`;
                    
                    // Nombre del jurado
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text(`👨‍⚖️ Jurado: ${nombreJurado}`, margin + 5, yPos);
                    yPos += 7;
                    
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
                    
                    // Mostrar cada rúbrica
                    Object.values(porRubrica).forEach(rubricaData => {
                        checkPageBreak(30);
                        
                        const sumaRubrica = rubricaData.calificaciones.reduce((sum, cal) => sum + (cal.puntuacion || 0), 0);
                        const observacionGeneral = rubricaData.calificaciones[0]?.observacion_general || '';
                        
                        // Nombre de la rúbrica
                        doc.setFontSize(10);
                        doc.setFont(undefined, 'bold');
                        doc.text(`📋 ${rubricaData.rubrica?.nombre || 'Rúbrica'} - Total: ${sumaRubrica} pts`, margin + 10, yPos);
                        yPos += 6;
                        
                        // Observación general si existe
                        if (observacionGeneral) {
                            doc.setFontSize(9);
                            doc.setFont(undefined, 'italic');
                            const lines = doc.splitTextToSize(`📝 Observación General: ${observacionGeneral}`, maxWidth - 20);
                            doc.text(lines, margin + 15, yPos);
                            yPos += lines.length * 5;
                        }
                        
                        // Agrupar por aspecto
                        const porAspecto = {};
                        rubricaData.calificaciones.forEach(cal => {
                            if (!porAspecto[cal.aspecto_id]) {
                                porAspecto[cal.aspecto_id] = [];
                            }
                            porAspecto[cal.aspecto_id].push(cal);
                        });
                        
                        // Mostrar aspectos
                        Object.values(porAspecto).forEach(calificacionesAspecto => {
                            checkPageBreak(20);
                            
                            const cal = calificacionesAspecto[0];
                            const aspecto = cal.aspectos_rubrica;
                            const nivel = cal.nivel_seleccionado || 'N/A';
                            const observacion = cal.observacion_aspecto || '';
                            
                            doc.setFontSize(9);
                            doc.setFont(undefined, 'normal');
                            doc.text(`  • ${aspecto?.nombre || 'Aspecto'}: Nivel ${nivel} - ${cal.puntuacion} pts`, margin + 15, yPos);
                            yPos += 5;
                            
                            if (observacion) {
                                doc.setFontSize(8);
                                doc.setFont(undefined, 'italic');
                                const obsLines = doc.splitTextToSize(`    💬 ${observacion}`, maxWidth - 25);
                                doc.text(obsLines, margin + 20, yPos);
                                yPos += obsLines.length * 4;
                            }
                        });
                        
                        yPos += 3;
                    });
                    
                    yPos += 5;
                });
                
                yPos += 5;
            }
            
            yPos += 10;
        }
        
        // Guardar PDF
        const nombreArchivo = `Reporte_Calificaciones_FLL_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);
        
        mostrarAlerta('✅ PDF generado y descargado correctamente', 'success', 3000);
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarAlerta(`Error al generar PDF: ${error.message}`, 'error');
    }
}
