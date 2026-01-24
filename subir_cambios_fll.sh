#!/bin/bash

# ============================================
# Script para subir cambios al repositorio FLL
# ============================================

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    print_error "No se encontró un repositorio Git en el directorio actual"
    exit 1
fi

print_info "Verificando estado del repositorio..."

# Verificar si hay cambios
if git diff-index --quiet HEAD --; then
    print_warning "No hay cambios para commitear"
    
    # Verificar si hay commits locales sin push
    LOCAL=$(git rev-list @{u}..HEAD --count 2>/dev/null)
    if [ "$LOCAL" -gt 0 ]; then
        print_info "Hay $LOCAL commit(s) local(es) sin subir. ¿Deseas hacer push? (s/n)"
        read -r respuesta
        if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ] || [ "$respuesta" = "y" ] || [ "$respuesta" = "Y" ]; then
            print_info "Haciendo push de commits locales..."
            git push origin main
            if [ $? -eq 0 ]; then
                print_success "Push completado exitosamente"
            else
                print_error "Error al hacer push"
                exit 1
            fi
        fi
    else
        print_success "Todo está actualizado. No hay cambios pendientes."
    fi
    exit 0
fi

# Mostrar estado actual
print_info "Estado actual del repositorio:"
git status --short

# Obtener mensaje de commit
if [ -z "$1" ]; then
    echo ""
    print_info "Ingresa el mensaje del commit (o presiona Enter para usar mensaje por defecto):"
    read -r mensaje_commit
    
    if [ -z "$mensaje_commit" ]; then
        # Generar mensaje automático basado en los cambios
        fecha=$(date +"%Y-%m-%d %H:%M")
        mensaje_commit="Actualización: $fecha"
    fi
else
    mensaje_commit="$1"
fi

# Agregar todos los cambios
print_info "Agregando cambios al staging..."
git add .

if [ $? -ne 0 ]; then
    print_error "Error al agregar archivos"
    exit 1
fi

# Hacer commit
print_info "Creando commit con mensaje: '$mensaje_commit'"
git commit -m "$mensaje_commit"

if [ $? -ne 0 ]; then
    print_error "Error al crear commit"
    exit 1
fi

print_success "Commit creado exitosamente"

# Hacer push
print_info "Subiendo cambios al repositorio remoto..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "Cambios subidos exitosamente a GitHub"
    echo ""
    print_info "Repositorio: https://github.com/artifextsp/FLL"
    echo ""
    
    # Mostrar último commit
    print_info "Último commit:"
    git log -1 --oneline
else
    print_error "Error al hacer push. Verifica tu conexión y permisos."
    exit 1
fi

# Mostrar estado final
echo ""
print_info "Estado final del repositorio:"
git status --short

print_success "Proceso completado!"
