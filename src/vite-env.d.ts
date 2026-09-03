/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Desactiva únicamente la comprobación automática al iniciar la aplicación.
  readonly VITE_CHECK_UPDATES_ON_STARTUP?: "true" | "false";
  // Pusher Channels (real-time) — must match the backend PUSHER_* values.
  readonly VITE_PUSHER_APP_KEY: string;
  readonly VITE_PUSHER_APP_CLUSTER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
