import { useEffect, useState } from "react";
import { useTaskActivity, useTaskCatalogs, useTaskDetail, useTasks } from "../hooks/useTasks";
import TaskList from "../components/tasks/TaskList";
import TaskDetail from "../components/tasks/TaskDetail";
import TaskFullView from "../components/tasks/TaskFullView";
import CreateTaskModal from "../components/tasks/CreateTaskModal";

export default function TasksPage() {
  const { tasks, isLoading, refresh } = useTasks();
  const { statuses, priorities } = useTaskCatalogs();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  // Auto-select first task once loaded
  useEffect(() => {
    if (!isLoading && selectedTaskId == null && tasks.length > 0) {
      setSelectedTaskId(tasks[0].id);
    }
    // Clear selection if the task no longer exists
    if (selectedTaskId != null && tasks.every((t) => t.id !== selectedTaskId)) {
      setSelectedTaskId(tasks[0]?.id ?? null);
    }
  }, [isLoading, tasks, selectedTaskId]);

  const { task: detail, isLoading: isLoadingDetail, refresh: refreshDetail } =
    useTaskDetail(selectedTaskId);
  const { entries, isLoading: isLoadingActivity, refresh: refreshActivity } =
    useTaskActivity(selectedTaskId);

  const commentEntries = entries.filter((e) => e.field === "comment");

  function handleCommentAdded() {
    refreshActivity();
  }

  function handleTaskCreated() {
    setShowCreateModal(false);
    refresh();
  }

  // Full-screen view takes over the page area
  if (fullScreen && detail) {
    return (
      <TaskFullView
        task={detail}
        comments={commentEntries}
        isLoadingComments={isLoadingActivity}
        onClose={() => setFullScreen(false)}
        onCommentAdded={handleCommentAdded}
      />
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
            setShowCreateModal(false);
          }}
          onNewTask={() => setShowCreateModal(true)}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        {showCreateModal ? (
          <CreateTaskModal
            statuses={statuses}
            priorities={priorities}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleTaskCreated}
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
          <TaskDetail
            task={detail}
            comments={commentEntries}
            isLoadingComments={isLoadingActivity}
            onCommentAdded={handleCommentAdded}
            onExpand={() => {
              refreshDetail();
              setFullScreen(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
