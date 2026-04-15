import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import TaskList from "../components/tasks/TaskList";
import TaskDetail from "../components/tasks/TaskDetail";
import CreateTaskModal from "../components/tasks/CreateTaskModal";

export default function TasksPage() {
  const { data, isLoading } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center font-inter text-sm text-text-secondary">
        Cargando tareas...
      </div>
    );
  }

  const selectedTask = data.tasks.find((t) => t.id === selectedTaskId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="w-[497px] shrink-0 overflow-hidden">
        <TaskList
          tasks={data.tasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={(id) => {
            setSelectedTaskId(id);
            setShowCreateModal(false);
          }}
          onNewTask={() => setShowCreateModal(true)}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        {showCreateModal ? (
          <CreateTaskModal
            onClose={() => setShowCreateModal(false)}
            onCreate={() => setShowCreateModal(false)}
          />
        ) : selectedTask ? (
          <TaskDetail task={selectedTask} />
        ) : (
          <div className="flex h-full items-center justify-center font-inter text-sm text-text-secondary">
            Selecciona una tarea para ver los detalles
          </div>
        )}
      </div>
    </div>
  );
}
