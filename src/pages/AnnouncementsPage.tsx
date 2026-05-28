import { useCallback, useEffect, useState } from "react";

import AnnouncementsList from "../components/announcements/AnnouncementsList";
import AnnouncementDetail from "../components/announcements/AnnouncementDetail";
import AnnouncementFormModal from "../components/announcements/AnnouncementFormModal";
import ConfirmDialog from "../components/wiki/ConfirmDialog";

import { usePermissions } from "../hooks/usePermissions";
import {
  useAnnouncementBell,
  notifyAnnouncementsChanged,
} from "../hooks/useAnnouncementBell";
import {
  Announcement,
  AnnouncementType,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from "../types/models/Announcement";
import * as announcementService from "../service/announcementService";

type FormState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; announcement: Announcement };

interface AnnouncementsPageProps {
  pendingSelectedId?: number | null;
  onConsumeSelection?: () => void;
}

export default function AnnouncementsPage({
  pendingSelectedId,
  onConsumeSelection,
}: AnnouncementsPageProps = {}) {

  const { has } = usePermissions();
  const bell = useAnnouncementBell();
  const { markSeen: bellMarkSeen } = bell;
  // The downstream components treat isAdmin as a single "can manage" flag; we expose the
  // union of create/update/delete so the affordances remain visible and the backend remains
  // the source of truth for fine-grained checks.
  const isAdmin =
    has("announcements:create") ||
    has("announcements:update") ||
    has("announcements:delete");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "all">("all");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [formState, setFormState] = useState<FormState>({ kind: "closed" });
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const [globalError, setGlobalError] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    setListLoading(true);
    try {
      const params: Parameters<typeof announcementService.findAnnouncements>[0] = { limit: 50 };
      if (typeFilter !== "all") params.type = typeFilter;
      const res = await announcementService.findAnnouncements(params);
      setAnnouncements(res.data);
      setTotalCount(res.meta.total);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al cargar anuncios.");
    } finally {
      setListLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    if (selectedId == null) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    announcementService
      .getAnnouncement(selectedId)
      .then((detail) => {
        if (!cancelled) {
          setSelected(detail);
          bellMarkSeen(detail.id);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSelected(null);
          setGlobalError(err instanceof Error ? err.message : "Error al cargar el anuncio.");
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, bellMarkSeen]);

  useEffect(() => {
    if (
      selectedId != null &&
      announcements.length > 0 &&
      !announcements.some((a) => a.id === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [announcements, selectedId]);

  // Honor deep-link from the bell on other pages
  useEffect(() => {
    if (pendingSelectedId != null) {
      if (typeFilter !== "all") setTypeFilter("all");
      setSelectedId(pendingSelectedId);
      onConsumeSelection?.();
    }
  }, [pendingSelectedId, onConsumeSelection, typeFilter]);

  const handleCreate = async (payload: CreateAnnouncementPayload) => {
    const created = await announcementService.createAnnouncement(payload);
    setFormState({ kind: "closed" });
    await loadAnnouncements();
    setSelectedId(created.id);
    setSelected(created);
    notifyAnnouncementsChanged();
  };

  const handleUpdate = async (payload: UpdateAnnouncementPayload) => {
    if (formState.kind !== "edit") return;
    const updated = await announcementService.updateAnnouncement(
      formState.announcement.id,
      payload,
    );
    setFormState({ kind: "closed" });
    setSelected(updated);
    await loadAnnouncements();
    notifyAnnouncementsChanged();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await announcementService.deleteAnnouncement(deleteTarget.id);
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
        setSelected(null);
      }
      setDeleteTarget(null);
      await loadAnnouncements();
      notifyAnnouncementsChanged();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar el anuncio.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg">

      {globalError && (
        <div className="mx-8 mt-3 flex items-center justify-between rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-2 font-inter text-[12px] text-danger">
          <span>{globalError}</span>
          <button
            onClick={() => setGlobalError(null)}
            className="text-danger/70 hover:text-danger"
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AnnouncementsList
          announcements={announcements}
          selectedId={selectedId}
          loading={listLoading}
          isAdmin={isAdmin}
          typeFilter={typeFilter}
          totalCount={totalCount}
          onSelectType={(t) => {
            setTypeFilter(t);
            setSelectedId(null);
          }}
          onSelectAnnouncement={setSelectedId}
          onCreateClick={() => setFormState({ kind: "create" })}
        />

        <AnnouncementDetail
          announcement={selected}
          loading={detailLoading}
          isAdmin={isAdmin}
          onEditClick={() => {
            if (selected) setFormState({ kind: "edit", announcement: selected });
          }}
          onDeleteClick={() => {
            if (selected) setDeleteTarget(selected);
          }}
        />
      </div>

      {formState.kind === "create" && (
        <AnnouncementFormModal
          mode="create"
          onCancel={() => setFormState({ kind: "closed" })}
          onCreate={handleCreate}
        />
      )}

      {formState.kind === "edit" && (
        <AnnouncementFormModal
          mode="edit"
          initial={formState.announcement}
          onCancel={() => setFormState({ kind: "closed" })}
          onUpdate={handleUpdate}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar anuncio"
          message={`¿Eliminar este anuncio? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          tone="danger"
          loading={deleteLoading}
          error={deleteError}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
