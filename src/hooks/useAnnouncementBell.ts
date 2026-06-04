import { useCallback, useEffect, useState } from "react";
import * as announcementService from "../service/announcementService";
import { Announcement } from "../types/models/Announcement";
import { useAuth } from "./useAuth";
import { usePolling } from "./usePolling";

const CHANGED_EVENT = "app:announcements-changed";
const SEEN_UPDATED_EVENT = "app:bell-seen-updated";

export function notifyAnnouncementsChanged(): void {
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

function loadSeen(userId: number | null): Set<number> {
  try {
    const key = userId ? `announcement-bell:seen:${userId}` : "announcement-bell:seen:guest";
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((v): v is number => typeof v === "number"));
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<number>, userId: number | null): void {
  try {
    const key = userId ? `announcement-bell:seen:${userId}` : "announcement-bell:seen:guest";
    localStorage.setItem(key, JSON.stringify([...seen]));
  } catch {
    /* localStorage might be unavailable; degrade silently */
  }
}

const NAVIGATE_EVENT = "app:navigate";

export interface NavigateRequest {
  section: string;
  announcementId?: number;
  taskId?: number;
  articleId?: number;
}

export function requestNavigate(req: NavigateRequest): void {
  window.dispatchEvent(new CustomEvent<NavigateRequest>(NAVIGATE_EVENT, { detail: req }));
}

export function onNavigateRequest(handler: (req: NavigateRequest) => void): () => void {
  const listener = (e: Event) => {
    const ce = e as CustomEvent<NavigateRequest>;
    if (ce.detail) handler(ce.detail);
  };
  window.addEventListener(NAVIGATE_EVENT, listener);
  return () => window.removeEventListener(NAVIGATE_EVENT, listener);
}

export interface UseAnnouncementBellResult {
  announcements: Announcement[];
  unreadCount: number;
  loading: boolean;
  seenIds: Set<number>;
  isUnread: (id: number) => boolean;
  markSeen: (id: number) => void;
  markAllSeen: () => void;
  reload: (silent?: boolean) => Promise<void>;
}

export function useAnnouncementBell(): UseAnnouncementBellResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenIds, setSeenIds] = useState<Set<number>>(() => loadSeen(userId));

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await announcementService.findAnnouncements({ limit: 20 });
      setAnnouncements(res.data);
    } catch {
      /* fail silently — bell is non-critical UI; errors surface on the Anuncios page */
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  usePolling(() => reload(true), { enabled: userId != null });

  useEffect(() => {
    setSeenIds(loadSeen(userId));
  }, [userId]);

  useEffect(() => {
    const handleChanged = () => reload();
    const handleSeenUpdated = () => setSeenIds(loadSeen(userId));
    window.addEventListener(CHANGED_EVENT, handleChanged);
    window.addEventListener(SEEN_UPDATED_EVENT, handleSeenUpdated);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handleChanged);
      window.removeEventListener(SEEN_UPDATED_EVENT, handleSeenUpdated);
    };
  }, [reload, userId]);

  const markSeen = useCallback((id: number) => {
    setSeenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveSeen(next, userId);
      window.dispatchEvent(new Event(SEEN_UPDATED_EVENT));
      return next;
    });
  }, [userId]);

  const markAllSeen = useCallback(() => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const a of announcements) {
        if (!next.has(a.id)) {
          next.add(a.id);
          changed = true;
        }
      }
      if (!changed) return prev;
      saveSeen(next, userId);
      window.dispatchEvent(new Event(SEEN_UPDATED_EVENT));
      return next;
    });
  }, [announcements, userId]);

  const isUnread = useCallback((id: number) => !seenIds.has(id), [seenIds]);

  const unreadCount = announcements.reduce(
    (acc, a) => acc + (seenIds.has(a.id) ? 0 : 1),
    0,
  );

  return {
    announcements,
    unreadCount,
    loading,
    seenIds,
    isUnread,
    markSeen,
    markAllSeen,
    reload,
  };
}
