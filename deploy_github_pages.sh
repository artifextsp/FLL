#!/bin/bash

# Script para desplegar a GitHub Pages
# Uso: ./deploy_github_pages.sh

set -e

echo "🚀 Iniciando despliegue a GitHub Pages..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto.${NC}"
    exit 1
fi

# Verificar que git está inicializado
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: No se encontró el directorio .git. Asegúrate de que el repositorio esté inicializado.${NC}"
    exit 1
fi

# Build del proyecto
echo -e "${YELLOW}📦 Construyendo proyecto...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en el build. Revisa los errores arriba.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completado${NC}"

# Verificar que la carpeta dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: No se encontró la carpeta dist después del build.${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Preparando commit...${NC}"

# Agregar cambios
git add .

# Preguntar por mensaje de commit
read -p "Ingresa el mensaje del commit (o presiona Enter para usar mensaje por defecto): " commit_message

if [ -z "$commit_message" ]; then
    commit_message="Deploy a GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Crear commit
git commit -m "$commit_message"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  No hay cambios para commitear${NC}"
fi

# Push a GitHub
echo -e "${YELLOW}📤 Subiendo cambios a GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cambios subidos exitosamente${NC}"
    echo -e "${GREEN}🌐 GitHub Pages se actualizará automáticamente en unos minutos${NC}"
    echo -e "${YELLOW}📍 URL de la aplicación: https://artifextsp.github.io/FLL/${NC}"
else
    echo -e "${RED}❌ Error al hacer push. Verifica tu conexión y permisos.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Despliegue completado${NC}"
