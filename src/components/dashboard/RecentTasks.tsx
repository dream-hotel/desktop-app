import { RecentTask } from "../../types/response/DashboardResponse";

interface RecentTasksProps {
  tasks: RecentTask[];
}

function getTurnoColor(turno: string): string {
  switch (turno) {
    case "Mañana": return "#f59e0b";
    case "Tarde": return "#492173";
    case "Noche": return "#6b7280";
    default: return "#6b7280";
  }
}

export default function RecentTasks({ tasks }: RecentTasksProps) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-white px-6 py-5">
      <h2 className="m-0 mb-4 font-inter text-lg leading-6 font-semibold text-text-primary">
        Tareas Recientes
      </h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-border pb-2 text-left font-inter text-xs leading-4 font-medium text-text-secondary">
              Tarea
            </th>
            <th className="border-b border-border pb-2 text-right font-inter text-xs leading-4 font-medium text-text-secondary">
              Turno
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="transition-colors hover:bg-primary-light">
              <td className="border-b border-black/4 py-3 font-inter text-sm leading-5 text-text-primary">
                {task.tarea}
              </td>
              <td className="border-b border-black/4 py-3 text-right">
                <span className="font-inter text-[13px] font-medium" style={{ color: getTurnoColor(task.turno) }}>
                  {task.turno}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
