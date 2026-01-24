# 🔐 Sistema de Contraseñas para Equipos y Generación de PDF

## 📋 Resumen de Cambios

Se ha implementado un sistema de contraseñas de 4 dígitos para que cada equipo pueda acceder a sus calificaciones detalladas, y se ha agregado la funcionalidad de descargar un reporte completo en PDF desde el dashboard de administrador.

## 🔧 Paso 1: Actualizar Base de Datos

**IMPORTANTE:** Debes ejecutar el siguiente script SQL en Supabase antes de usar las nuevas funcionalidades:

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `database/add_contrasena_equipos.sql`
4. Ejecuta el script

Este script:
- Agrega la columna `contrasena` (VARCHAR(4)) a la tabla `equipos`
- Genera contraseñas aleatorias de 4 dígitos para todos los equipos existentes que no tengan contraseña

## 📱 Funcionalidades Implementadas

### 1. Contraseñas por Equipo

**En el Dashboard de Administrador (`admin/equipos.html`):**
- Al crear un nuevo equipo, se genera automáticamente una contraseña de 4 dígitos
- La contraseña se muestra en un mensaje de éxito después de crear el equipo
- La contraseña también se muestra en la tabla de equipos (columna "Contraseña")
- Al editar un equipo, puedes ver su contraseña actual

**En la Página de Calificaciones Detalladas (`equipo/mi-calificacion.html`):**
- Ahora es una página pública (no requiere login)
- Al acceder, se muestra un modal pidiendo la contraseña de 4 dígitos
- Solo se muestran las calificaciones del equipo cuya contraseña fue ingresada correctamente
- La navegación muestra solo "Inicio" y "Resultados Generales" (sin botón "Salir")

### 2. Generación de PDF desde Admin

**En el Dashboard de Administrador (`admin/dashboard.html`):**
- Nuevo botón: **"📄 Descargar Reporte PDF Completo"**
- Al hacer clic, genera un PDF con:
  - Todos los eventos activos
  - Todos los equipos de cada evento
  - Todas las calificaciones por jurado
  - Todas las observaciones (generales y por aspecto)
  - Puntajes totales por rúbrica y equipo
  - Organizado por evento → equipo → jurado → rúbrica → aspecto

**El PDF incluye:**
- Fecha de generación
- Información completa de cada evento
- Calificaciones agrupadas por jurado
- Observaciones generales de cada rúbrica
- Observaciones específicas de cada aspecto
- Niveles seleccionados y puntajes

## 🎯 Flujo de Uso

### Para Administradores:

1. **Crear Equipos:**
   - Ve a `admin/equipos.html`
   - Crea un nuevo equipo
   - **IMPORTANTE:** Guarda la contraseña que se muestra (se genera automáticamente)
   - La contraseña también aparece en la tabla de equipos

2. **Compartir Contraseñas:**
   - Cada equipo debe recibir su contraseña de 4 dígitos
   - Pueden acceder directamente a `equipo/mi-calificacion.html` sin login

3. **Descargar Reporte PDF:**
   - Ve a `admin/dashboard.html`
   - Haz clic en "📄 Descargar Reporte PDF Completo"
   - El PDF se descargará automáticamente con todos los datos

### Para Equipos:

1. **Acceder a Calificaciones:**
   - Ve a `equipo/mi-calificacion.html`
   - Ingresa la contraseña de 4 dígitos proporcionada por el administrador
   - Selecciona un evento para ver tus calificaciones detalladas

## 📝 Notas Técnicas

- Las contraseñas son de 4 dígitos numéricos (0000-9999)
- Se generan automáticamente al crear equipos
- Las contraseñas se almacenan en texto plano en la base de datos (adecuado para beta)
- El PDF se genera completamente en el navegador usando jsPDF
- El PDF incluye paginación automática cuando el contenido es extenso

## ⚠️ Importante

**Antes de usar estas funcionalidades:**
1. ✅ Ejecuta el script SQL `database/add_contrasena_equipos.sql` en Supabase
2. ✅ Verifica que los equipos existentes ahora tengan contraseñas asignadas
3. ✅ Comparte las contraseñas con los equipos correspondientes

## 🔄 Próximos Pasos

1. Hacer push de los cambios a GitHub
2. Esperar el despliegue automático en GitHub Pages
3. Ejecutar el script SQL en Supabase
4. Probar la creación de un equipo nuevo y verificar que se genera la contraseña
5. Probar el acceso con contraseña en `equipo/mi-calificacion.html`
6. Probar la generación del PDF desde el dashboard de admin
