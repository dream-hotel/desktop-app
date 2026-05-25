import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ListChecks,
  LogIn,
  Mail,
  Megaphone,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  items: FaqItem[];
}

const ICON_SIZE = 16;
const ICON_STROKE = 1.8;

const CATEGORIES: FaqCategory[] = [
  {
    id: "primeros-pasos",
    label: "Primeros pasos",
    description: "Inicio de sesión, navegación y panel principal.",
    icon: <LogIn size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    items: [
      {
        q: "¿Cómo inicio sesión en la aplicación?",
        a: "Abre Dream by Stannum, escribe tu correo y contraseña en la pantalla de inicio y presiona \"Iniciar sesión\". Si es tu primera vez, el administrador te entrega las credenciales. Si olvidaste la contraseña, solicita a un administrador que la restablezca desde la sección Usuarios.",
      },
      {
        q: "¿Qué muestra el Dashboard?",
        a: "El Dashboard reúne las tareas urgentes, los anuncios recientes y tarjetas con estadísticas relevantes según tu rol. Los administradores visualizan métricas globales; los demás roles ven principalmente la información asignada a ellos.",
      },
      {
        q: "¿Cómo navego entre las secciones?",
        a: "Utiliza la barra lateral izquierda para desplazarte entre Tareas, Wiki, Anuncios, Horarios, Usuarios, Actividad, Ayuda y Configuración. También es posible colapsar la barra con el botón de flecha para disponer de más espacio de trabajo.",
      },
      {
        q: "¿Por qué no veo algunas secciones?",
        a: "Cada sección requiere permisos específicos. Si una sección no aparece en la barra lateral, es porque tu rol no tiene acceso. Comunícate con un administrador para revisar tu rol o tus permisos.",
      },
    ],
  },
  {
    id: "tareas",
    label: "Tareas",
    description: "Creación, asignación y seguimiento de tareas.",
    icon: <ListChecks size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    items: [
      {
        q: "¿Cómo creo una nueva tarea?",
        a: "Ingresa a la sección Tareas y presiona \"Nueva tarea\". Completa el título, la descripción, la prioridad, la fecha de vencimiento y los responsables. Es posible adjuntar archivos e imágenes cuando la tarea lo requiera.",
      },
      {
        q: "¿Cómo cambio el estado de una tarea?",
        a: "Abre la tarea desde el listado y utiliza los controles de estado dentro del detalle. Los estados disponibles son pendiente, en progreso y completada. Cada cambio queda registrado en el historial.",
      },
      {
        q: "¿Puedo comentar dentro de una tarea?",
        a: "Sí. Dentro del detalle de la tarea existe una sección de comentarios donde puedes dejar notas y adjuntar imágenes. Los comentarios son visibles para todos los involucrados y para los administradores.",
      },
      {
        q: "¿Qué significa la prioridad de una tarea?",
        a: "La prioridad indica el nivel de urgencia: las tareas con prioridad alta o crítica aparecen primero en el Dashboard y en la lista de tareas urgentes. Defínela al crear la tarea o edítala más tarde si las condiciones cambian.",
      },
    ],
  },
  {
    id: "wiki",
    label: "Wiki",
    description: "Artículos, categorías y documentación interna.",
    icon: <BookOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    items: [
      {
        q: "¿Qué es la Wiki?",
        a: "La Wiki es el repositorio interno de documentación del hotel. Allí se encuentran manuales, procedimientos, políticas y artículos organizados por categorías.",
      },
      {
        q: "¿Cómo busco un artículo?",
        a: "Ingresa a la sección Wiki y utiliza la barra lateral para navegar por categorías. Cada categoría agrupa artículos relacionados; abre el que necesites para visualizarlo en pantalla completa.",
      },
      {
        q: "¿Quién puede crear o editar artículos?",
        a: "Únicamente los usuarios con permisos de edición sobre la Wiki pueden crear, editar o eliminar artículos. Si necesitas publicar contenido y no dispones del acceso, solicita el permiso al administrador.",
      },
      {
        q: "¿Puedo adjuntar archivos a un artículo?",
        a: "Sí. Al editar un artículo es posible subir archivos (PDF, imágenes, documentos) desde el cuadro de carga. Los archivos quedan vinculados al artículo y disponibles para su descarga.",
      },
    ],
  },
  {
    id: "anuncios",
    label: "Anuncios",
    description: "Comunicados internos y notificaciones globales.",
    icon: <Megaphone size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    items: [
      {
        q: "¿Para qué sirven los anuncios?",
        a: "Los anuncios son comunicados oficiales dirigidos a uno o varios roles del hotel. Permiten difundir cambios de turno, novedades, políticas internas o avisos urgentes.",
      },
      {
        q: "¿Cómo veo los anuncios nuevos?",
        a: "Los anuncios sin leer aparecen en la campana de notificaciones del encabezado y, si la opción está activada, en la ventana de bienvenida al iniciar sesión.",
      },
      {
        q: "¿Cómo marco un anuncio como leído?",
        a: "Al abrir el detalle del anuncio se marca automáticamente como leído. También puedes utilizar la opción \"Marcar todos como leídos\" desde el panel de notificaciones.",
      },
      {
        q: "¿Puedo dirigir un anuncio a un rol específico?",
        a: "Sí. Al crear un anuncio, en el selector de audiencia se eligen los roles que deben verlo. Únicamente esos roles recibirán la notificación.",
      },
    ],
  },
  {
    id: "horarios",
    label: "Horarios",
    description: "Turnos, personal y planificación semanal.",
    icon: <CalendarDays size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    items: [
      {
        q: "¿Cómo veo mi horario?",
        a: "Ingresa a la sección Horarios para visualizar la grilla semanal. Tu turno aparece resaltado según el día y la franja horaria asignados.",
      },
      {
        q: "¿Quién puede editar los horarios?",
        a: "Solo los administradores y los usuarios con el permiso correspondiente pueden crear, modificar o eliminar bloques de turnos. El resto del personal únicamente puede visualizarlos.",
      },
      {
        q: "¿Cómo se asigna personal a un turno?",
        a: "Abre el editor del bloque de turno y selecciona el personal desde el panel lateral. Es posible asignar varios usuarios al mismo bloque y guardar los cambios desde el cuadro de diálogo.",
      },
    ],
  },
  {
    id: "usuarios",
    label: "Usuarios y roles",
    description: "Cuentas, permisos y administración de personal.",
    icon: <Users size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    items: [
      {
        q: "¿Cómo creo un nuevo usuario?",
        a: "En la sección Usuarios presiona \"Nuevo usuario\", completa los datos personales, asigna un rol y establece una contraseña inicial. El usuario podrá ingresar de inmediato con esas credenciales.",
      },
      {
        q: "¿Qué diferencia hay entre los roles?",
        a: "Administrador: acceso completo a todas las secciones. Recepcionista: gestión operativa diaria (tareas, anuncios, wiki). Cliente: vista limitada a la información que le corresponde. Los permisos detallados se ajustan desde el editor de roles.",
      },
      {
        q: "¿Puedo deshabilitar un usuario sin eliminarlo?",
        a: "Sí. Edita el usuario y desactívalo; perderá el acceso a la aplicación, pero su historial y sus asignaciones permanecen intactos. Esta opción es preferible a eliminar usuarios con actividad registrada.",
      },
      {
        q: "¿Cómo creo o edito un rol?",
        a: "Desde Usuarios, en la pestaña Roles, es posible crear un rol nuevo o editar uno existente. Cada rol define qué permisos están habilitados (lectura, escritura, eliminación) sobre cada módulo.",
      },
    ],
  },
  {
    id: "cuenta",
    label: "Mi cuenta",
    description: "Perfil, contraseña y sesión activa.",
    icon: <Shield size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    items: [
      {
        q: "¿Cómo accedo a mi cuenta?",
        a: "Haz clic en tu nombre o avatar en la parte inferior de la barra lateral. Desde allí puedes ver tu información personal, cambiar la contraseña y cerrar sesión.",
      },
      {
        q: "¿Cómo cambio mi contraseña?",
        a: "Desde Mi cuenta utiliza la opción \"Cambiar contraseña\". Ingresa la contraseña actual y la nueva. Se recomienda utilizar una contraseña segura y única.",
      },
      {
        q: "¿Cómo cierro sesión?",
        a: "En Mi cuenta presiona \"Cerrar sesión\". Regresarás a la pantalla de inicio y la sesión actual quedará cerrada en este dispositivo.",
      },
    ],
  },
  {
    id: "configuracion",
    label: "Configuración",
    description: "Apariencia, notificaciones y preferencias.",
    icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    items: [
      {
        q: "¿Cómo cambio entre tema claro y oscuro?",
        a: "En Configuración → Apariencia selecciona entre Claro, Oscuro o Sistema. La opción \"Sistema\" sigue automáticamente la preferencia del sistema operativo.",
      },
      {
        q: "¿Puedo desactivar la ventana de anuncios al iniciar sesión?",
        a: "Sí. En Configuración → Notificaciones es posible desactivar el interruptor \"Mostrar anuncios al iniciar sesión\". Los anuncios continuarán disponibles desde la campana del encabezado.",
      },
      {
        q: "¿Dónde veo la versión de la aplicación?",
        a: "En Configuración → Acerca de la aplicación se encuentra la versión instalada, el entorno y otros datos del sistema.",
      },
    ],
  },
  {
    id: "actividad",
    label: "Actividad y auditoría",
    description: "Registro de cambios y eventos del sistema.",
    icon: <Sparkles size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    items: [
      {
        q: "¿Qué es la sección Actividad?",
        a: "Es el registro de auditoría del sistema. Muestra qué usuario realizó qué acción, sobre qué módulo y en qué momento. Resulta útil para investigar cambios o resolver dudas operativas.",
      },
      {
        q: "¿Puedo filtrar los eventos?",
        a: "Sí. Es posible filtrar por tipo de evento, usuario, módulo o rango de fechas para localizar registros específicos con rapidez.",
      },
      {
        q: "¿Quién puede ver la Actividad?",
        a: "Únicamente los usuarios con el permiso de auditoría (habitualmente los administradores) pueden acceder a esta sección.",
      },
    ],
  },
];

const SUPPORT_EMAIL = "soporte@stannum.com";

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const q = query.trim();
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark
        key={idx}
        className="rounded bg-primary/20 px-0.5 text-text-primary"
      >
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
  }
  return parts;
}

interface FaqRowProps {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
  highlightQuery: string;
}

function FaqRow({ item, open, onToggle, highlightQuery }: FaqRowProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 bg-transparent px-6 py-4 text-left transition-colors hover:bg-surface-hover"
        aria-expanded={open}
      >
        <span className="font-inter text-[13.5px] font-medium text-text-primary">
          {highlightText(item.q, highlightQuery)}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className={`shrink-0 text-text-secondary transition-transform ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-4 pt-0 font-inter text-[12.5px] leading-relaxed text-text-secondary">
          {highlightText(item.a, highlightQuery)}
        </div>
      )}
    </div>
  );
}

export default function HelpSupportPage() {
  const [query, setQuery] = useState("");
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (it) =>
          it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  const totalMatches = useMemo(
    () => filtered.reduce((sum, cat) => sum + cat.items.length, 0),
    [filtered],
  );

  function toggleItem(catId: string, idx: number) {
    const key = `${catId}::${idx}`;
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg">
      <header className="flex items-start justify-between border-b border-border bg-surface px-8 pb-4 pt-6">
        <div className="flex flex-col gap-[2px]">
          <h1 className="m-0 font-alexandria text-[28px] font-medium leading-9 text-text-primary">
            Ayuda & Soporte
          </h1>
          <p className="m-0 font-inter text-[13px] leading-[19.5px] text-text-secondary">
            Preguntas frecuentes sobre el uso de Dream by Stannum.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto flex max-w-[860px] flex-col gap-5">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en las preguntas frecuentes..."
              className="h-11 w-full rounded-[12px] border border-border bg-surface pl-11 pr-4 font-inter text-[13px] text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {query.trim() && (
            <div className="font-inter text-[12px] text-text-secondary">
              {totalMatches === 0
                ? "No se encontraron resultados. Intenta con otras palabras."
                : `${totalMatches} ${totalMatches === 1 ? "resultado" : "resultados"} para "${query.trim()}".`}
            </div>
          )}

          {filtered.map((cat) => (
            <section
              key={cat.id}
              className="overflow-hidden rounded-[14px] border border-border bg-surface"
            >
              <div className="flex items-start gap-3 border-b border-border px-6 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                  {cat.icon}
                </div>
                <div className="flex flex-col">
                  <h2 className="font-alexandria text-[16px] font-medium leading-tight text-text-primary">
                    {cat.label}
                  </h2>
                  <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div>
                {cat.items.map((item, idx) => {
                  const key = `${cat.id}::${idx}`;
                  return (
                    <FaqRow
                      key={key}
                      item={item}
                      open={openKeys.has(key) || Boolean(query.trim())}
                      onToggle={() => toggleItem(cat.id, idx)}
                      highlightQuery={query}
                    />
                  );
                })}
              </div>
            </section>
          ))}

          {/* Contact / support */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <CircleHelp size={ICON_SIZE} strokeWidth={ICON_STROKE} />
              </div>
              <div className="flex flex-col">
                <h2 className="font-alexandria text-[16px] font-medium leading-tight text-text-primary">
                  ¿No encontraste lo que buscabas?
                </h2>
                <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
                  Si tu consulta no aparece aquí, comunícate con el equipo de soporte.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-inter text-[13px] font-medium text-text-primary">
                  Soporte técnico
                </span>
                <span className="font-inter text-[12px] text-text-secondary">
                  Escríbenos describiendo el problema con el mayor detalle
                  posible. Si es posible, adjunta capturas de pantalla.
                </span>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] bg-primary px-4 font-inter text-[12.5px] font-medium text-white transition-colors hover:bg-primary/90"
              >
                <Mail size={14} strokeWidth={2} />
                {SUPPORT_EMAIL}
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
