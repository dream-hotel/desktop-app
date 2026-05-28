type HumanLog = {
  title: string;
  detail?: string;
};

const METHOD_TO_VERB: Record<string, { create: string; update: string; remove: string }> = {
  default: { create: "Se creó", update: "Se actualizó", remove: "Se eliminó" },
};

type Rule = {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  pattern: RegExp;
  build: () => HumanLog;
};

const RULES: Rule[] = [
  { method: "POST", pattern: /^\/auth\/login\/?$/, build: () => ({ title: "Inicio de sesión" }) },
  { method: "POST", pattern: /^\/auth\/logout\/?$/, build: () => ({ title: "Cierre de sesión" }) },
  { method: "POST", pattern: /^\/auth\/register\/?$/, build: () => ({ title: "Registro de un nuevo usuario" }) },
  { method: "POST", pattern: /^\/auth\/verify-password\/?$/, build: () => ({ title: "Verificación de contraseña" }) },
  { method: "POST", pattern: /^\/auth\/reset-password-request\/?$/, build: () => ({ title: "Solicitud de recuperación de contraseña" }) },
  { method: "POST", pattern: /^\/auth\/refresh\/?$/, build: () => ({ title: "Renovación de sesión" }) },

  { method: "POST", pattern: /^\/tasks\/?$/, build: () => ({ title: "Se creó una nueva tarea" }) },
  { method: "PATCH", pattern: /^\/tasks\/\d+\/?$/, build: () => ({ title: "Se actualizó una tarea" }) },
  { method: "DELETE", pattern: /^\/tasks\/\d+\/?$/, build: () => ({ title: "Se eliminó una tarea" }) },
  { method: "POST", pattern: /^\/tasks\/\d+\/files\/?$/, build: () => ({ title: "Se adjuntó un archivo a una tarea" }) },
  { method: "DELETE", pattern: /^\/tasks\/\d+\/files\/\d+\/?$/, build: () => ({ title: "Se eliminó un archivo de una tarea" }) },

  { method: "POST", pattern: /^\/users\/?$/, build: () => ({ title: "Se registró un nuevo usuario" }) },
  { method: "PATCH", pattern: /^\/users\/\d+\/?$/, build: () => ({ title: "Se actualizó la información de un usuario" }) },
  { method: "DELETE", pattern: /^\/users\/\d+\/?$/, build: () => ({ title: "Se dio de baja a un usuario" }) },

  { method: "POST", pattern: /^\/wiki\/articles\/?$/, build: () => ({ title: "Se creó un artículo en la wiki" }) },
  { method: "PATCH", pattern: /^\/wiki\/articles\/\d+\/?$/, build: () => ({ title: "Se actualizó un artículo de la wiki" }) },
  { method: "POST", pattern: /^\/wiki\/articles\/\d+\/publish\/?$/, build: () => ({ title: "Se publicó un artículo de la wiki" }) },
  { method: "DELETE", pattern: /^\/wiki\/articles\/\d+\/?$/, build: () => ({ title: "Se eliminó un artículo de la wiki" }) },
  { method: "POST", pattern: /^\/wiki\/categories\/?$/, build: () => ({ title: "Se creó una categoría en la wiki" }) },
  { method: "PATCH", pattern: /^\/wiki\/categories\/\d+\/?$/, build: () => ({ title: "Se actualizó una categoría de la wiki" }) },
  { method: "DELETE", pattern: /^\/wiki\/categories\/\d+\/?$/, build: () => ({ title: "Se eliminó una categoría de la wiki" }) },

  { method: "POST", pattern: /^\/announcements\/?$/, build: () => ({ title: "Se publicó un anuncio" }) },
  { method: "PATCH", pattern: /^\/announcements\/\d+\/?$/, build: () => ({ title: "Se actualizó un anuncio" }) },
  { method: "DELETE", pattern: /^\/announcements\/\d+\/?$/, build: () => ({ title: "Se eliminó un anuncio" }) },

  { method: "POST", pattern: /^\/schedules\/?$/, build: () => ({ title: "Se creó un horario" }) },
  { method: "PATCH", pattern: /^\/schedules\/\d+\/?$/, build: () => ({ title: "Se actualizó un horario" }) },
  { method: "DELETE", pattern: /^\/schedules\/\d+\/?$/, build: () => ({ title: "Se eliminó un horario" }) },
  { method: "POST", pattern: /^\/schedules\/\d+\/days\/?$/, build: () => ({ title: "Se agregó un día a un horario" }) },
  { method: "PATCH", pattern: /^\/schedules\/\d+\/days\/\d+\/?$/, build: () => ({ title: "Se actualizó un día del horario" }) },
  { method: "DELETE", pattern: /^\/schedules\/\d+\/days\/\d+\/?$/, build: () => ({ title: "Se eliminó un día del horario" }) },
];

const RESOURCE_LABEL: Record<string, { singular: string; gender: "m" | "f" }> = {
  tasks: { singular: "tarea", gender: "f" },
  users: { singular: "usuario", gender: "m" },
  announcements: { singular: "anuncio", gender: "m" },
  schedules: { singular: "horario", gender: "m" },
  "wiki/articles": { singular: "artículo", gender: "m" },
  "wiki/categories": { singular: "categoría", gender: "f" },
};

function genericFromUrl(method: string, urlPath: string): HumanLog | null {
  const cleanPath = urlPath.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!cleanPath) return null;
  const segments = cleanPath.split("/");
  const resourceCandidates = [segments.slice(0, 2).join("/"), segments[0]];

  for (const key of resourceCandidates) {
    const entry = RESOURCE_LABEL[key];
    if (!entry) continue;
    const verbs = METHOD_TO_VERB.default;
    const article = entry.gender === "f" ? "una" : "un";
    if (method === "POST") return { title: `${verbs.create} ${article} ${entry.singular}` };
    if (method === "PATCH" || method === "PUT") return { title: `${verbs.update} ${article} ${entry.singular}` };
    if (method === "DELETE") return { title: `${verbs.remove} ${article} ${entry.singular}` };
  }
  return null;
}

function humanizeInterceptorMessage(raw: string): HumanLog | null {
  const match = raw.match(/^Acción exitosa:\s+(GET|POST|PUT|PATCH|DELETE)\s+(\S+)/i);
  if (!match) return null;
  const method = match[1].toUpperCase();
  const fullUrl = match[2];
  const urlPath = fullUrl.split("?")[0];

  for (const rule of RULES) {
    if (rule.method === method && rule.pattern.test(urlPath)) {
      return rule.build();
    }
  }
  return genericFromUrl(method, urlPath);
}

function cleanAuthMessage(raw: string): HumanLog | null {
  if (/^Login exitoso/i.test(raw)) {
    const email = raw.split("—")[1]?.trim();
    return { title: "Inicio de sesión exitoso", detail: email };
  }
  if (/^Logout/i.test(raw)) {
    return { title: "Cierre de sesión" };
  }
  if (/^Intento de login fallido — correo no registrado/i.test(raw)) {
    return { title: "Intento de inicio de sesión con un correo no registrado" };
  }
  if (/^Intento de login en cuenta bloqueada/i.test(raw)) {
    return { title: "Intento de inicio de sesión en una cuenta bloqueada" };
  }
  if (/^Intento de login fallido — cuenta no verificada/i.test(raw)) {
    return { title: "Intento de inicio de sesión en una cuenta sin verificar" };
  }
  if (/^Intento de login fallido — contraseña incorrecta/i.test(raw)) {
    const email = raw.split(":")[1]?.trim();
    return { title: "Intento de inicio de sesión con contraseña incorrecta", detail: email };
  }
  if (/^Usuario registrado/i.test(raw)) {
    const email = raw.split("—")[1]?.trim();
    return { title: "Nuevo usuario registrado", detail: email };
  }
  if (/^Fallo de verificación/i.test(raw)) {
    return { title: "Fallo al verificar la cuenta — el enlace ya no es válido" };
  }
  if (/^Cuenta verificada/i.test(raw) || /^Contraseña establecida/i.test(raw) || /^Verificación exitosa/i.test(raw)) {
    return { title: "Cuenta verificada y contraseña establecida" };
  }
  if (/^Solicitud de reset fallida/i.test(raw)) {
    return { title: "Solicitud de recuperación de contraseña con un correo no registrado" };
  }
  if (/^Solicitud de recuperación de contraseña enviada/i.test(raw)) {
    const email = raw.split("—")[1]?.trim();
    return { title: "Se envió un correo de recuperación de contraseña", detail: email };
  }
  return null;
}

function stripTechnicalNoise(raw: string): string {
  return raw
    .replace(/\s*—\s*usuario ID \d+/gi, "")
    .replace(/ID \d+/g, "")
    .replace(/#\d+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function humanizeLog(raw: string): HumanLog | null {
  if (/^Acción exitosa:/i.test(raw)) {
    return humanizeInterceptorMessage(raw);
  }

  const fromAuth = cleanAuthMessage(raw);
  if (fromAuth) return fromAuth;

  const cleaned = stripTechnicalNoise(raw);
  return cleaned ? { title: cleaned } : null;
}

export function logTypeIcon(name: string): "auth" | "users" | "tasks" | "wiki" | "announcements" | "schedules" | "system" | "error" {
  const n = name.toLowerCase();
  if (n === "auth") return "auth";
  if (n === "users") return "users";
  if (n === "tasks") return "tasks";
  if (n === "wiki") return "wiki";
  if (n === "announcements") return "announcements";
  if (n === "schedules") return "schedules";
  if (n === "error") return "error";
  return "system";
}
