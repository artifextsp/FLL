# Guía de Integración - Nuevo Sistema de Autenticación FLL

## Análisis del Problema Raíz

### Problemas Identificados en el Sistema Anterior:

1. **Complejidad Excesiva**: Múltiples funciones async, delays, verificaciones redundantes
2. **Race Conditions**: Verificaciones de localStorage con delays que causaban inconsistencias
3. **Lógica de Redirección Compleja**: Múltiples métodos que interferían entre sí
4. **Base Path Cacheado**: Causaba problemas cuando cambiaba el contexto
5. **Validaciones Redundantes**: Múltiples verificaciones que fallaban en diferentes momentos

### Síntomas Observados:

- Login de jurado funciona a veces, admin funciona a veces, pero nunca ambos simultáneamente
- Ciclos infinitos de redirección
- Sesiones que se pierden intermitentemente
- Problemas de timing entre guardado y verificación de sesión

## Solución Implementada

### Principios del Nuevo Sistema:

1. **Simplicidad**: Código síncrono donde sea posible, sin delays innecesarios
2. **Directo**: Lógica de redirección simple y directa
3. **Claro**: Manejo de roles sin ambigüedades
4. **Robusto**: Validaciones básicas pero efectivas
5. **Estable**: Sin race conditions ni problemas de timing

## Cambios Realizados

### 1. Nuevo Módulo `js/auth.js`

**Características principales:**
- Sistema de sesión simple con clave única `fll_user_session`
- Funciones síncronas para operaciones críticas
- Validación básica pero efectiva
- Redirección directa sin múltiples métodos

**API Simplificada:**
```javascript
// Obtener usuario actual
getUser() → { id, username, role, nombre, timestamp } | null

// Guardar usuario
setUser({ id, username, role, nombre }) → boolean

// Limpiar sesión
clearSession() → void

// Cerrar sesión y redirigir
logout() → void

// Verificar autenticación
isAuthenticated() → boolean

// Requerir autenticación (redirige si no hay sesión)
requireAuth() → user | null

// Requerir rol específico (redirige si no tiene el rol)
requireRole('admin' | 'jurado' | 'estudiante') → user | null

// Redirigir al dashboard según rol
redirectToDashboard() → void

// Obtener URL del dashboard según rol
getDashboardUrl(role) → string

// Utilidades
getLoginUrl() → string
getBasePathExported() → string
```

### 2. Login Simplificado (`index.html`)

**Cambios principales:**
- Lógica de login síncrona y directa
- Sin delays innecesarios
- Redirección inmediata después de guardar sesión
- Manejo de errores simple y claro

### 3. Dashboards Actualizados

**Cambios en `jurado/dashboard.html` y `admin/dashboard.html`:**
- Verificación síncrona sin delays
- Uso de `requireRole()` que maneja todo automáticamente
- Código más limpio y fácil de mantener

## Estructura de Datos de Sesión

```javascript
{
  id: string,           // ID del usuario (ej: "1234561")
  username: string,     // Nombre de usuario
  role: string,         // 'admin' | 'jurado' | 'estudiante'
  nombre: string,       // Nombre completo
  timestamp: number     // Timestamp de creación
}
```

## Roles Soportados

- **admin**: Usuario administrador (username: "94300774" o "admin")
- **jurado**: Usuario jurado (cualquier otro username)
- **estudiante**: Usuario estudiante (username: "equipo" o "estudiante")

## Medidas de Blindaje Implementadas

### 1. Validación de Entrada
- Validación básica de estructura de datos
- Validación de roles permitidos
- Sanitización de strings

### 2. Manejo de Errores
- Try-catch en operaciones críticas
- Limpieza automática de sesiones corruptas
- Logging para debugging

### 3. Prevención de Estados Inconsistentes
- Operaciones síncronas donde sea posible
- Sin verificaciones post-guardado que causan race conditions
- Redirección inmediata después de login

### 4. Seguridad
- Limpieza de sesión al cerrar
- Validación de roles antes de acceso
- Redirección automática si no hay sesión

## Pasos de Integración

### Paso 1: Verificar Archivos Actualizados

Los siguientes archivos ya han sido actualizados:
- ✅ `js/auth.js` - Nuevo módulo de autenticación
- ✅ `index.html` - Login simplificado
- ✅ `jurado/dashboard.html` - Dashboard de jurado actualizado
- ✅ `admin/dashboard.html` - Dashboard de admin actualizado

### Paso 2: Actualizar Otros Archivos (si es necesario)

Si hay otros archivos que usan el sistema de autenticación antiguo, actualízalos:

**Antes:**
```javascript
import { getUser, requireAuth } from '../js/auth.js';
const user = getUser();
if (!user || user.tipo_usuario !== 'jurado') {
  window.location.href = getLoginUrl();
}
```

**Después:**
```javascript
import { requireRole } from '../js/auth.js';
const user = requireRole('jurado');
// Si no tiene el rol, requireRole ya redirigió automáticamente
```

### Paso 3: Probar el Sistema

1. **Login como Jurado:**
   - Username: `1234561` (o cualquier otro excepto admin/equipo)
   - Debe redirigir a `/FLL/jurado/dashboard.html`

2. **Login como Admin:**
   - Username: `94300774` o `admin`
   - Debe redirigir a `/FLL/admin/dashboard.html`

3. **Login como Estudiante:**
   - Username: `equipo` o `estudiante`
   - Debe redirigir a `/FLL/equipo/dashboard.html`

4. **Verificar Logout:**
   - Click en "Salir" debe limpiar sesión y redirigir al login

5. **Verificar Protección de Rutas:**
   - Intentar acceder a `/FLL/admin/dashboard.html` sin sesión debe redirigir al login
   - Intentar acceder como jurado a admin debe redirigir al login

## Compatibilidad con Código Existente

El nuevo sistema mantiene compatibilidad con funciones utilizadas en otros módulos:

- `getLoginUrl()` - Retorna URL del login
- `getBasePathExported()` - Retorna el base path
- `getUser()` - Retorna usuario actual (pero con estructura diferente)

**Nota importante:** La estructura del objeto usuario cambió:
- **Antes:** `user.tipo_usuario`, `user.rol_activo`
- **Ahora:** `user.role`

Si hay código que usa `tipo_usuario` o `rol_activo`, necesita actualizarse a `role`.

## Troubleshooting

### Problema: No redirige después del login
**Solución:** Verificar que `redirectToDashboard()` se llame después de `setUser()`

### Problema: Redirige de vuelta al login inmediatamente
**Solución:** Verificar que el dashboard use `requireRole()` correctamente

### Problema: Sesión se pierde
**Solución:** Verificar que no haya código que limpie `localStorage` incorrectamente

### Problema: No reconoce el rol
**Solución:** Verificar que el rol sea exactamente 'admin', 'jurado' o 'estudiante' (lowercase)

## Próximos Pasos

1. Probar el sistema en desarrollo local
2. Verificar que todos los dashboards funcionen correctamente
3. Actualizar otros módulos que usen autenticación si es necesario
4. Desplegar y probar en producción

## Notas Finales

Este nuevo sistema está diseñado para ser:
- **Simple**: Fácil de entender y mantener
- **Robusto**: Maneja errores y casos edge
- **Estable**: Sin race conditions ni problemas de timing
- **Escalable**: Fácil de extender con nuevas funcionalidades

Si encuentras algún problema, revisa los logs de la consola del navegador para debugging.
