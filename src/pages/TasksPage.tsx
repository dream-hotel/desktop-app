import { useEffect, useState } from "react";
import { useTaskActivity, useTaskCatalogs, useTaskDetail, useTasks } from "../hooks/useTasks";
import { usePermissions } from "../hooks/usePermissions";
import TaskList, { FilterTab } from "../components/tasks/TaskList";
import TaskDetail from "../components/tasks/TaskDetail";
import TaskFullView from "../components/tasks/TaskFullView";
import TaskFormModal from "../components/tasks/TaskFormModal";
import { deleteTask } from "../service/taskService";
import { notifyAnnouncementsChanged } from "../hooks/useAnnouncementBell";
import ConfirmDialog from "../components/wiki/ConfirmDialog";

type EditorMode = { kind: "create" } | { kind: "edit" } | { kind: "closed" };

interface TasksPageProps {
  pendingSelectedId?: number | null;
  onConsumeSelection?: () => void;
  pendingTab?: FilterTab | null;
  pendingPriority?: string | null;
  pendingDueSoon?: boolean | null;
  onConsumeFilters?: () => void;
}

export default function TasksPage({
  pendingSelectedId,
  onConsumeSelection,
  pendingTab,
  pendingPriority,
  pendingDueSoon,
  onConsumeFilters,
}: TasksPageProps = {}) {
  const { has } = usePermissions();
  const canCreate = has("tasks:create");
  const canUpdate = has("tasks:update");
  const canDelete = has("tasks:delete");

  const { tasks, isLoading, refresh } = useTasks();
  const { statuses, priorities } = useTaskCatalogs();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorMode>({ kind: "closed" });
  const [fullScreen, setFullScreen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (pendingSelectedId != null) {
      setSelectedTaskId(pendingSelectedId);
      onConsumeSelection?.();
    }
  }, [pendingSelectedId, onConsumeSelection]);

  useEffect(() => {
    if (selectedTaskId != null && tasks.length > 0 && tasks.every((t) => t.id !== selectedTaskId)) {
      setSelectedTaskId(null);
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
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    if (!detail) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTask(detail.id);
      setFullScreen(false);
      setSelectedTaskId(null);
      setShowDeleteConfirm(false);
      refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "No se pudo eliminar la tarea");
    } finally {
      setDeleting(false);
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
          canManage={canUpdate}
          canDelete={canDelete}
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

  const showDetail = selectedTaskId != null || editor.kind !== "closed";

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className={`${showDetail ? "w-[497px]" : "flex-1"} shrink-0 overflow-hidden transition-all duration-300`}>
        <TaskList
          tasks={tasks}
          priorities={priorities}
          isLoading={isLoading}
          selectedTaskId={selectedTaskId}
          onSelectTask={(id) => {
            setSelectedTaskId(id);
            setEditor({ kind: "closed" });
          }}
          onNewTask={() => setEditor({ kind: "create" })}
          canCreate={canCreate}
          initialTab={pendingTab}
          initialPriority={pendingPriority}
          initialDueSoon={pendingDueSoon}
          onConsumeFilters={onConsumeFilters}
        />
      </div>
      {showDetail && (
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
          ) : isLoadingDetail || !detail ? (
            <div className="flex h-full items-center justify-center font-inter text-sm text-text-secondary bg-surface">
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
                  canManage={canUpdate}
                  canDelete={canDelete}
                  onCommentAdded={handleCommentAdded}
                  onEdit={() => setEditor({ kind: "edit" })}
                  onDelete={handleDelete}
                  onClose={() => setSelectedTaskId(null)}
                  onExpand={() => {
                    refreshDetail();
                    setFullScreen(true);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      {showDeleteConfirm && detail && (
        <ConfirmDialog
          title="Eliminar tarea"
          message={`¿Estás seguro de que deseas eliminar la tarea "${detail.title}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          tone="danger"
          loading={deleting}
          error={deleteError}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeleteError(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
