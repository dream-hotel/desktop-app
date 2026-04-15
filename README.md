# Desktop App — Nexus

Aplicacion de escritorio para gestion de tareas y productividad, desarrollada con **Tauri 2**, **React 19**, **TypeScript** y **Tailwind CSS 4**.

## Tecnologias

| Capa       | Tecnologia                        |
|------------|-----------------------------------|
| Frontend   | React 19, TypeScript 5.8, Vite 7 |
| Estilos    | Tailwind CSS 4                    |
| Backend    | Tauri 2 (Rust)                    |
| Routing    | React Router DOM 7                |

## Funcionalidades

- **Autenticacion** — Inicio de sesion con contexto global (`AuthContext`).
- **Dashboard** — Panel principal con estadisticas, barra de estado, tareas recientes y notificaciones.
- **Gestion de tareas** — Listado, detalle y creacion de tareas.
- **Notificaciones** — Panel de notificaciones con modal de bienvenida.

## Estructura del proyecto

```
src/
├── components/
│   ├── dashboard/      # Header, Sidebar, StatsCard, StatusBar, Notificaciones
│   ├── login/          # Formulario de login
│   └── tasks/          # Lista, detalle y modal de creacion de tareas
├── hooks/              # useAuth, useDashboard, useTasks
├── pages/              # LoginPage, DashboardPage, TasksPage, UnderConstructionPage
├── service/            # authService, dashboardService, taskService
├── state/              # AuthContext (contexto global de autenticacion)
└── types/              # Tipos de request y response
src-tauri/              # Backend Rust (Tauri)
```

## Requisitos previos

- **Node.js** >= 18
- **npm** >= 9
- **Rust** >= 1.70 (con `cargo`)
- **Tauri CLI** (incluido como devDependency)
- Dependencias del sistema para Tauri:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`
  - **Windows**: Microsoft Visual Studio C++ Build Tools y WebView2

## Instalacion

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd desktop-app
```

2. Instalar dependencias de Node:

```bash
npm install
```

## Ejecucion

### Modo desarrollo

Inicia el frontend (Vite) y la ventana de Tauri con hot-reload:

```bash
npm run tauri dev
```

### Solo frontend (sin Tauri)

```bash
npm run dev
```

El servidor de desarrollo estara disponible en `http://localhost:1420`.

### Build de produccion

Genera el ejecutable nativo para tu sistema operativo:

```bash
npm run tauri build
```

El instalador se genera en `src-tauri/target/release/bundle/`.

## Scripts disponibles

| Comando              | Descripcion                                  |
|----------------------|----------------------------------------------|
| `npm run dev`        | Inicia el servidor de desarrollo (Vite)      |
| `npm run build`      | Compila TypeScript y genera el bundle        |
| `npm run preview`    | Previsualiza el build de produccion          |
| `npm run tauri dev`  | Inicia la app de escritorio en modo dev      |
| `npm run tauri build`| Genera el ejecutable nativo de produccion    |

## IDE recomendado

- [VS Code](https://code.visualstudio.com/) con las extensiones:
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
