# Sistema de Calificación FLL

Aplicación web para la gestión y calificación de equipos de robótica First Lego League (FLL), optimizada para dispositivos móviles y tablets.

## 🚀 Características Principales

- **Módulo de Administración**: Gestión de eventos, equipos, jurados y rúbricas
- **Módulo de Jurados**: Sistema de calificación con matrices interactivas
- **Módulo de Equipos**: Dashboard de resultados, rankings y visualizaciones

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Base de Datos**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Autenticación**: Sistema reutilizable de Ludens
- **Versionamiento**: GitHub

## 📋 Requisitos Previos

- Cuenta de Supabase
- Cuenta de Vercel
- Cuenta de GitHub
- Node.js (para desarrollo local)

## 🚦 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd FLL
```

### 2. Configurar variables de entorno

Crear archivo `.env.local` con:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
VITE_API_BASE=tu_url_de_api_supabase
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

### 5. Desplegar en Vercel

```bash
vercel deploy
```

## 📁 Estructura del Proyecto

```
FLL/
├── index.html              # Página de login
├── admin/                  # Módulo de administración
│   ├── dashboard.html
│   ├── eventos.html
│   ├── equipos.html
│   ├── jurados.html
│   └── rubricas.html
├── jurado/                 # Módulo de jurados
│   ├── dashboard.html
│   └── calificar.html
├── equipo/                 # Módulo de equipos
│   └── dashboard.html
├── js/                     # JavaScript
│   ├── auth.js            # Módulo de autenticación
│   ├── config.js          # Configuración
│   ├── supabase.js        # Cliente Supabase
│   └── utils.js           # Utilidades
├── css/                    # Estilos
│   └── styles.css
└── assets/                 # Recursos estáticos
```

## 📖 Documentación

Ver [ROADMAP.md](./ROADMAP.md) para el plan detallado de implementación por fases.

## 🤝 Contribución

Este es un proyecto en desarrollo activo. Las contribuciones son bienvenidas.

## 📝 Licencia

[Especificar licencia]

## 👥 Equipo

[Información del equipo]
