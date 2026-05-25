import { useEffect, useState } from "react";
import { useTaskActivity, useTaskCatalogs, useTaskDetail, useTasks } from "../hooks/useTasks";
import { useAuth } from "../hooks/useAuth";
import TaskList from "../components/tasks/TaskList";
import TaskDetail from "../components/tasks/TaskDetail";
import TaskFullView from "../components/tasks/TaskFullView";
import TaskFormModal from "../components/tasks/TaskFormModal";
import { deleteTask } from "../service/taskService";
import { notifyAnnouncementsChanged } from "../hooks/useAnnouncementBell";

type EditorMode = { kind: "create" } | { kind: "edit" } | { kind: "closed" };

interface TasksPageProps {
  pendingSelectedId?: number | null;
  onConsumeSelection?: () => void;
}

export default function TasksPage({
  pendingSelectedId,
  onConsumeSelection,
}: TasksPageProps = {}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "administrador";

  const { tasks, isLoading, refresh } = useTasks();
  const { statuses, priorities } = useTaskCatalogs();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorMode>({ kind: "closed" });
  const [fullScreen, setFullScreen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (pendingSelectedId != null) {
      setSelectedTaskId(pendingSelectedId);
      onConsumeSelection?.();
    }
  }, [pendingSelectedId, onConsumeSelection]);

  useEffect(() => {
    if (!isLoading && selectedTaskId == null && tasks.length > 0) {
      setSelectedTaskId(tasks[0].id);
    }
    if (selectedTaskId != null && tasks.length > 0 && tasks.every((t) => t.id !== selectedTaskId)) {
      setSelectedTaskId(tasks[0]?.id ?? null);
    }
  }, [isLoading, tasks, selectedTaskId]);

  const {
    task: detail,
    isLoading: isLoadingDetail,
    refresh: refreshDetail,
  } = useTaskDetail(selectedTaskId);
  const {
    entries,
    isLoading: isLoadingActivity,
    refresh: refreshActivity,
  } = useTaskActivity(selectedTaskId);

  const commentEntries = entries.filter((e) => e.field === "comment");

  function handleCommentAdded() {
    refreshActivity();
  }

  function handleTaskSaved() {
    setEditor({ kind: "closed" });
    refresh();
    refreshDetail();
    // Backend creates an announcement when a new task is created.
    notifyAnnouncementsChanged();
  }

  async function handleDelete() {
    if (!detail) return;
    const ok = window.confirm(
      `¿Eliminar la tarea "${detail.title}"? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setDeleteError(null);
    try {
      await deleteTask(detail.id);
      setFullScreen(false);
      setSelectedTaskId(null);
      refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "No se pudo eliminar la tarea");
    }
  }

  // Full-screen view takes over
  if (fullScreen && detail) {
    return (
      <>
        <TaskFullView
          task={detail}
          comments={commentEntries}
          isLoadingComments={isLoadingActivity}
          canManage={isAdmin}
          canDelete={isAdmin}
          onClose={() => setFullScreen(false)}
          onCommentAdded={handleCommentAdded}
          onEdit={() => setEditor({ kind: "edit" })}
          onDelete={handleDelete}
        />
        {editor.kind === "edit" && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
            <div className="h-full w-[500px] max-w-full">
              <TaskFormModal
                mode="edit"
                initialTask={detail}
                statuses={statuses}
                priorities={priorities}
                onClose={() => setEditor({ kind: "closed" })}
                onSaved={handleTaskSaved}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="w-[497px] shrink-0 overflow-hidden">
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          selectedTaskId={selectedTaskId}
          onSelectTask={(id) => {
            setSelectedTaskId(id);
            setEditor({ kind: "closed" });
          }}
          onNewTask={() => setEditor({ kind: "create" })}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        {editor.kind === "create" ? (
          <TaskFormModal
            mode="create"
            statuses={statuses}
            priorities={priorities}
            onClose={() => setEditor({ kind: "closed" })}
            onSaved={handleTaskSaved}
          />
        ) : editor.kind === "edit" && detail ? (
          <TaskFormModal
            mode="edit"
            initialTask={detail}
            statuses={statuses}
            priorities={priorities}
            onClose={() => setEditor({ kind: "closed" })}
            onSaved={handleTaskSaved}
          />
        ) : selectedTaskId == null ? (
          <div className="flex h-full items-center justify-center font-inter text-sm text-text-secondary">
            Selecciona una tarea para ver los detalles
          </div>
        ) : isLoadingDetail || !detail ? (
          <div className="flex h-full items-center justify-center font-inter text-sm text-text-secondary">
            Cargando tarea...
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {deleteError && (
              <div className="border-b border-danger/30 bg-danger/10 px-4 py-2 font-inter text-[12px] text-danger">
                {deleteError}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <TaskDetail
                task={detail}
                comments={commentEntries}
                isLoadingComments={isLoadingActivity}
                canManage={isAdmin}
                canDelete={isAdmin}
                onCommentAdded={handleCommentAdded}
                onEdit={() => setEditor({ kind: "edit" })}
                onDelete={handleDelete}
                onExpand={() => {
                  refreshDetail();
                  setFullScreen(true);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
