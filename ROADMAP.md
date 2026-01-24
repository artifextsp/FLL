# Roadmap de Implementación - Sistema de Calificación FLL

## Visión General

Aplicación de calificación para equipos de robótica First Lego League (FLL) optimizada para dispositivos móviles y tablets. El sistema gestiona jurados, equipos, rúbricas de calificación y eventos organizados por fechas.

## Stack Tecnológico

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Base de Datos**: Supabase (PostgreSQL)
- **Hosting**: Vercel (dominio gratuito)
- **Versionamiento**: GitHub
- **Autenticación**: Sistema reutilizable de Ludens

## Objetivo Beta

Lanzar una versión funcional mínima viable (MVP) que permita:
- Administración básica de eventos, equipos, jurados y rúbricas
- Calificación de equipos por jurados
- Visualización de resultados y rankings
- Experiencia optimizada en móvil/tablet

---

## Fases de Implementación

### Fase 1: Infraestructura y Autenticación
**Duración estimada**: Semana 1  
**Complejidad**: Baja  
**Dependencias**: Ninguna

#### Componentes a desarrollar:
- [ ] Repositorio GitHub configurado con estructura base
- [ ] Integración del sistema de autenticación de Ludens
- [ ] Configuración de conexión a Supabase
- [ ] Esquema inicial de base de datos:
  - Tabla `usuarios` (reutilizar de Ludens o crear referencia)
  - Tabla `eventos` (id, nombre, fecha_inicio, fecha_fin, activo)
  - Tabla `equipos` (id, nombre, evento_id, activo)
  - Tabla `jurados` (id, usuario_id, evento_id, activo)
  - Tabla `rubricas` (id, nombre, descripcion, evento_id, activo)
  - Tabla `aspectos_rubrica` (id, rubrica_id, nombre, descripcion, valor_maximo, orden)
  - Tabla `calificaciones` (id, jurado_id, equipo_id, rubrica_id, aspecto_id, puntuacion, observacion_aspecto, observacion_general, fecha_calificacion)
- [ ] Despliegue inicial en Vercel con dominio gratuito
- [ ] Configuración de variables de entorno

#### Entregables:
- Repositorio funcional en GitHub
- Conexión a Supabase operativa
- Página de login funcional
- Aplicación desplegada en Vercel

---

### Fase 2: Módulo de Administración - Gestión de Datos
**Duración estimada**: Semana 1-2  
**Complejidad**: Media  
**Dependencias**: Fase 1

#### Componentes a desarrollar:
- [ ] Dashboard de administración (solo usuarios admin)
- [ ] CRUD de Eventos:
  - Crear evento (nombre, fecha inicio, fecha fin)
  - Listar eventos
  - Editar evento
  - Activar/desactivar evento
- [ ] CRUD de Equipos:
  - Crear equipo (nombre, asignar a evento)
  - Listar equipos por evento
  - Editar equipo
  - Activar/desactivar equipo
- [ ] CRUD de Jurados:
  - Crear jurado (asociar usuario existente, asignar a evento)
  - Listar jurados por evento
  - Editar asignación de jurado
  - Activar/desactivar jurado
- [ ] CRUD de Rúbricas:
  - Crear rúbrica (nombre, descripción, asignar a evento)
  - Listar rúbricas por evento
  - Editar rúbrica
  - Activar/desactivar rúbrica
- [ ] Gestión de Aspectos de Rúbrica:
  - Agregar aspectos a rúbrica (nombre, descripción, valor máximo, orden)
  - Editar aspectos
  - Eliminar aspectos
  - Reordenar aspectos

#### Consideraciones de diseño:
- Formularios simples sin validaciones complejas (MVP)
- Interfaz móvil-first con botones grandes y formularios verticales
- Priorizar velocidad de desarrollo sobre robustez

#### Entregables:
- Dashboard de administración funcional
- Todas las operaciones CRUD básicas operativas
- Asignación de rúbricas a eventos funcional

---

### Fase 3: Módulo de Jurados - Calificación Básica
**Duración estimada**: Semana 2-3  
**Complejidad**: Media-Alta  
**Dependencias**: Fase 1, Fase 2

#### Componentes a desarrollar:
- [ ] Dashboard de jurados (acceso autenticado)
- [ ] Selector de evento/rúbrica:
  - Listar eventos activos asignados al jurado
  - Listar rúbricas disponibles para el evento seleccionado
  - Selección mediante dropdowns o cards táctiles
- [ ] Selector de equipo:
  - Listar equipos del evento seleccionado
  - Mostrar estado de calificación (calificado/pendiente)
  - Selección mediante lista scrollable
- [ ] Matriz de calificación interactiva:
  - Mostrar aspectos de la rúbrica seleccionada
  - Mostrar valor máximo por aspecto
  - Input numérico o selector de puntuación (0 a valor máximo)
  - Campo de texto para observación por aspecto
  - Campo de texto para observación general de la rúbrica
- [ ] Guardado de calificaciones:
  - Botón "Guardar calificación"
  - Validación básica (todos los aspectos calificados)
  - Persistencia en Supabase
  - Feedback visual de éxito/error
- [ ] Optimización móvil:
  - Botones grandes (mínimo 44x44px)
  - Scroll vertical fluido
  - Sin elementos pequeños difíciles de tocar
  - Inputs numéricos con teclado numérico en móvil

#### Entregables:
- Dashboard de jurados funcional
- Proceso completo de calificación operativo
- Interfaz optimizada para dispositivos táctiles

---

### Fase 4: Filtros y Búsqueda en Módulo de Jurados
**Duración estimada**: Semana 3  
**Complejidad**: Baja  
**Dependencias**: Fase 3

#### Componentes a desarrollar:
- [ ] Filtro por nombre de equipo:
  - Input de búsqueda en tiempo real
  - Filtrado de lista de equipos mientras se escribe
- [ ] Filtro por nombre de rúbrica:
  - Input de búsqueda en selector de rúbricas
  - Filtrado de lista de rúbricas mientras se escribe
- [ ] Búsqueda simple:
  - Campo de búsqueda general
  - Búsqueda por texto en nombres de equipos y rúbricas

#### Consideraciones:
- Implementación simple sin debounce complejo (MVP)
- Búsqueda case-insensitive
- Feedback visual inmediato

#### Entregables:
- Filtros funcionales en módulo de jurados
- Búsqueda operativa

---

### Fase 5: Módulo de Equipos - Dashboard de Resultados
**Duración estimada**: Semana 3-4  
**Complejidad**: Media  
**Dependencias**: Fase 1, Fase 3

#### Componentes a desarrollar:
- [ ] Dashboard para equipos (acceso autenticado)
- [ ] Visualización por evento/sección:
  - Organizar resultados por fecha/evento
  - Mostrar eventos en los que participó el equipo
  - Navegación entre eventos mediante tabs o cards
- [ ] Cálculo y visualización de promedios:
  - Promedio por rúbrica
  - Promedio general del equipo
  - Mostrar número de calificaciones recibidas
- [ ] Ranking de equipos:
  - Lista ordenada por promedio general (descendente)
  - Mostrar posición del equipo en el ranking
  - Mostrar diferencia con equipos adyacentes
- [ ] Visualización de observaciones:
  - Mostrar observación general por rúbrica
  - (Opcional en beta) Mostrar observaciones por aspecto

#### Consideraciones:
- Cálculos en tiempo real desde Supabase
- Interfaz clara y fácil de entender
- Optimización móvil

#### Entregables:
- Dashboard de equipos funcional
- Visualización de resultados y rankings operativa

---

### Fase 6: Visualización de Datos - Gráficas
**Duración estimada**: Semana 4  
**Complejidad**: Baja-Media  
**Dependencias**: Fase 5

#### Componentes a desarrollar:
- [ ] Gráfico de barras:
  - Comparación de puntajes por aspecto
  - Mostrar puntaje del equipo vs promedio general
  - Librería: Chart.js (ligera y responsive)
- [ ] Gráfico de líneas (si aplica):
  - Evolución de puntaje si hay múltiples eventos
  - Mostrar tendencia del equipo
- [ ] Integración responsive:
  - Gráficas adaptables a tamaño de pantalla
  - Interacción táctil en móvil/tablet

#### Consideraciones:
- Usar Chart.js o similar (ligero)
- Gráficas opcionales si no hay datos suficientes
- Fallback a tablas si las gráficas no se pueden renderizar

#### Entregables:
- Gráficas funcionales en dashboard de equipos
- Visualización de datos mejorada

---

### Fase 7: Testing, Optimización y Ajustes
**Duración estimada**: Semana 4-5  
**Complejidad**: Media  
**Dependencias**: Todas las fases anteriores

#### Componentes a desarrollar:
- [ ] Testing en dispositivos reales:
  - iOS (Safari)
  - Android (Chrome)
  - Tablets (iPad, Android tablets)
- [ ] Ajustes de ergonomía táctil:
  - Verificar tamaños de botones
  - Optimizar espaciado entre elementos
  - Mejorar feedback visual de interacciones
- [ ] Optimización de rendimiento:
  - Carga inicial de datos
  - Renderizado de listas largas
  - Caché de datos cuando sea apropiado
- [ ] Corrección de bugs críticos:
  - Validación de datos
  - Manejo de errores de red
  - Estados de carga
- [ ] Documentación básica:
  - Guía rápida para administradores
  - Guía rápida para jurados
  - Guía rápida para equipos

#### Entregables:
- Aplicación probada en dispositivos móviles
- Optimizaciones aplicadas
- Documentación básica completa
- Versión beta lista para lanzamiento

---

## Orden de Ejecución Recomendado

```
Fase 1 (Infraestructura)
    ↓
Fase 2 (Administración)
    ↓
Fase 3 (Jurados - Calificación)
    ↓
    ├─→ Fase 4 (Filtros) ─┐
    └─→ Fase 5 (Equipos) ──┼─→ Fase 6 (Gráficas)
                           ↓
                      Fase 7 (Testing)
```

**Nota**: Las fases 4 y 5 pueden ejecutarse en paralelo después de completar la fase 3.

---

## Prioridades MVP

### Debe tener (Must Have):
- ✅ Autenticación funcional
- ✅ CRUD básico de eventos, equipos, jurados y rúbricas
- ✅ Calificación de equipos por jurados
- ✅ Visualización de resultados y rankings
- ✅ Funcionalidad en móvil/tablet

### Debería tener (Should Have):
- ⚠️ Filtros y búsqueda
- ⚠️ Gráficas básicas
- ⚠️ Observaciones por aspecto

### Podría tener (Could Have):
- 📋 Validaciones avanzadas
- 📋 Exportación de datos
- 📋 Notificaciones
- 📋 Historial de cambios

### No tendrá en Beta (Won't Have):
- ❌ Reportes avanzados
- ❌ Análisis estadísticos complejos
- ❌ Integraciones externas
- ❌ Sistema de permisos granular

---

## Métricas de Éxito Beta

- ✅ Usuarios pueden autenticarse correctamente
- ✅ Administradores pueden crear eventos y asignar equipos/jurados
- ✅ Jurados pueden calificar equipos sin errores
- ✅ Equipos pueden ver sus resultados
- ✅ La aplicación funciona correctamente en móvil y tablet
- ✅ Tiempo de carga < 3 segundos en conexión 3G
- ✅ Sin bugs críticos que bloqueen funcionalidad principal

---

## Próximos Pasos Post-Beta

1. **Funcionalidades Avanzadas**:
   - Sistema de notificaciones
   - Exportación de reportes (PDF, Excel)
   - Análisis estadísticos avanzados
   - Historial de cambios y auditoría

2. **Mejoras de UX**:
   - Modo oscuro
   - Personalización de interfaz
   - Accesibilidad mejorada
   - Internacionalización (i18n)

3. **Robustez**:
   - Validaciones avanzadas
   - Manejo de errores mejorado
   - Sistema de permisos granular
   - Backup y recuperación de datos

4. **Escalabilidad**:
   - Optimización de consultas
   - Caché avanzado
   - CDN para assets estáticos
   - Monitoreo y analytics
