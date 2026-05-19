export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error(
    "VITE_API_URL no está definido. Copiá .env.example a .env y configurá la URL del backend."
  );
}
