# Guía de Uso - Script de Subida de Cambios

## Script: `subir_cambios_fll.sh`

Script automatizado para subir cambios al repositorio GitHub de forma rápida y segura.

### Uso Básico

```bash
# Ejecutar el script (te pedirá el mensaje de commit)
./subir_cambios_fll.sh

# O pasar el mensaje como argumento
./subir_cambios_fll.sh "Agregar módulo de administración de eventos"
```

### ¿Qué hace el script?

1. ✅ Verifica que estás en un repositorio Git
2. ✅ Muestra el estado actual de los cambios
3. ✅ Te pide un mensaje de commit (o usa uno por defecto)
4. ✅ Agrega todos los cambios (`git add .`)
5. ✅ Crea el commit con tu mensaje
6. ✅ Sube los cambios a GitHub (`git push origin main`)
7. ✅ Muestra el estado final y el último commit

### Ejemplos de Uso

```bash
# Uso interactivo (te pedirá el mensaje)
./subir_cambios_fll.sh

# Con mensaje personalizado
./subir_cambios_fll.sh "Implementar CRUD de equipos"

# Mensaje descriptivo
./subir_cambios_fll.sh "Fase 2: Completar módulo de administración - eventos y equipos"
```

### Características

- 🎨 **Output con colores**: Fácil de leer y entender
- 🔍 **Verificación inteligente**: Detecta si hay cambios antes de proceder
- 📝 **Mensaje automático**: Si no proporcionas mensaje, usa uno por defecto con fecha
- ✅ **Validación de errores**: Te avisa si algo sale mal
- 🔗 **Enlace directo**: Muestra el link al repositorio después del push

### Notas

- El script siempre hace `git add .` (agrega todos los cambios)
- Siempre hace push a la rama `main`
- Si no hay cambios, te avisa y sale sin hacer nada
- Si hay commits locales sin push, te pregunta si quieres hacer push

### Troubleshooting

**Error: "Permission denied"**
```bash
chmod +x subir_cambios_fll.sh
```

**Error: "No se encontró un repositorio Git"**
- Asegúrate de estar en el directorio `/Users/hanselpenadiaz/Documents/FLL`

**Error al hacer push**
- Verifica tu conexión a internet
- Verifica que tienes permisos de escritura en el repositorio
- Verifica que la rama remota existe: `git branch -r`

### Flujo de Trabajo Recomendado

1. Hacer cambios en el código
2. Ejecutar `./subir_cambios_fll.sh`
3. Ingresar mensaje descriptivo del cambio
4. Verificar en GitHub que los cambios se subieron correctamente

### Alias Opcional (Opcional)

Puedes crear un alias para ejecutarlo más rápido:

```bash
# Agregar al ~/.zshrc o ~/.bashrc
alias subir='cd /Users/hanselpenadiaz/Documents/FLL && ./subir_cambios_fll.sh'

# Luego solo ejecutas:
subir
```
