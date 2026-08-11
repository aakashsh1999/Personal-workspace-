import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createEmptyState, createId } from './data/seed';
import { useAuth } from './lib/auth';
import {
  loadWorkspace,
  saveWorkspace,
  syncErrorMessage,
  type CloudWorkspace,
} from './lib/firestoreSync';
import type {
  AppState,
  Block,
  BlockType,
  Client,
  Goal,
  Habit,
  Page,
  Payment,
  Project,
  ProjectDeliverable,
  ProjectStatus,
  SavedNote,
  SpaceKind,
  ThemeSettings,
  TrackerItem,
  ViewMode,
} from './types';
import { DEFAULT_THEME } from './types';
import { applyTheme } from './theme';

const STORAGE_KEY = 'orbit-workspace-v2';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

type Store = {
  state: AppState;
  activePage: Page | undefined;
  syncStatus: SyncStatus;
  setActivePageId: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchQuery: (q: string) => void;
  updatePage: (id: string, patch: Partial<Page>) => void;
  addPage: (space: SpaceKind, isTracker?: boolean) => void;
  deletePage: (id: string) => void;
  reorderPages: (dragId: string, dropId: string) => void;
  updateBlock: (pageId: string, blockId: string, patch: Partial<Block>) => void;
  addBlock: (
    pageId: string,
    type?: BlockType,
    afterId?: string,
    extras?: Partial<Pick<Block, 'content' | 'checked' | 'indent'>>,
  ) => void;
  deleteBlock: (pageId: string, blockId: string) => void;
  reorderBlocks: (pageId: string, dragId: string, dropId: string) => void;
  addItem: (pageId: string, title?: string) => void;
  updateItem: (pageId: string, itemId: string, patch: Partial<TrackerItem>) => void;
  deleteItem: (pageId: string, itemId: string) => void;
  addNote: (pageId: string, title?: string) => string;
  updateNote: (
    pageId: string,
    noteId: string,
    patch: Partial<Pick<SavedNote, 'title' | 'content'>>,
  ) => void;
  deleteNote: (pageId: string, noteId: string) => void;
  setActiveNoteId: (pageId: string, noteId: string | undefined) => void;
  setViewMode: (pageId: string, mode: ViewMode) => void;
  toggleHabitToday: (habitId: string) => void;
  toggleHabitDay: (habitId: string, date: string) => void;
  addHabit: (name: string, color?: string) => void;
  updateHabit: (habitId: string, patch: Partial<Pick<Habit, 'name' | 'color'>>) => void;
  deleteHabit: (habitId: string) => void;
  addClient: (partial?: Partial<Client>) => string;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addProject: (partial?: Partial<Project>) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleProjectDeliverable: (projectId: string, deliverableId: string) => void;
  addPayment: (partial?: Partial<Payment>) => void;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  addGoal: (partial?: Partial<Goal>) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setTheme: (theme: Partial<ThemeSettings>) => void;
  resetData: () => void;
  allItems: TrackerItem[];
  syncError: string | null;
};

const StoreContext = createContext<Store | null>(null);

function ensureCorePages(pages: Page[]): Page[] {
  const seed = createEmptyState();
  let next = [...pages];
  if (!next.some((p) => p.id === 'page-freelance')) {
    const freelance = seed.pages.find((p) => p.id === 'page-freelance');
    if (freelance) next.push(freelance);
  } else {
    next = next.map((p) =>
      p.id === 'page-freelance' && p.title === 'Freelance'
        ? { ...p, title: 'Side Project' }
        : p,
    );
  }
  if (!next.some((p) => p.id === 'page-finance')) {
    const financePage = seed.pages.find((p) => p.id === 'page-finance');
    if (financePage) {
      const goalsIdx = next.findIndex((p) => p.id === 'page-goals');
      const freelanceIdx = next.findIndex((p) => p.id === 'page-freelance');
      if (goalsIdx >= 0) next.splice(goalsIdx, 0, financePage);
      else if (freelanceIdx >= 0) next.splice(freelanceIdx + 1, 0, financePage);
      else next.push(financePage);
    }
  }
  if (!next.some((p) => p.id === 'page-goals')) {
    const goalsPage = seed.pages.find((p) => p.id === 'page-goals');
    if (goalsPage) {
      const habitsIdx = next.findIndex((p) => p.id === 'page-habits');
      if (habitsIdx >= 0) next.splice(habitsIdx, 0, goalsPage);
      else next.push(goalsPage);
    }
  }
  return next;
}

function migrateProjectsFromFreelanceItems(
  pages: Page[],
  existing: Project[] | undefined,
): Project[] {
  if (existing && existing.length > 0) return existing;
  const freelance = pages.find(
    (p) => p.id === 'page-freelance' || p.space === 'freelance',
  );
  if (!freelance?.items?.length) return existing ?? [];
  const t = new Date().toISOString();
  return freelance.items.map((item) => {
    const statusMap: Record<string, ProjectStatus> = {
      backlog: 'planning',
      todo: 'planning',
      in_progress: 'in_progress',
      done: 'completed',
      blocked: 'on_hold',
    };
    return {
      id: item.id,
      clientId: item.clientId ?? '',
      title: item.title || 'Untitled project',
      description: item.notes || undefined,
      budget: item.budget ?? 0,
      currency: 'INR',
      status: statusMap[item.status] ?? 'planning',
      startDate: item.createdAt?.slice(0, 10) ?? t.slice(0, 10),
      deadline: item.dueDate,
      deliverables: [],
      createdAt: item.createdAt ?? t,
      updatedAt: item.updatedAt ?? t,
    };
  });
}

/** True when the workspace has user-created content (not just seed shell pages). */
function hasWorkspaceContent(state: AppState): boolean {
  if ((state.clients?.length ?? 0) > 0) return true;
  if ((state.projects?.length ?? 0) > 0) return true;
  if ((state.payments?.length ?? 0) > 0) return true;
  if ((state.goals?.length ?? 0) > 0) return true;
  if ((state.habits?.length ?? 0) > 0) return true;

  return state.pages.some((p) => {
    if ((p.items?.length ?? 0) > 0) return true;
    if ((p.savedNotes?.length ?? 0) > 0) return true;
    if (p.richContent) {
      const text = p.richContent.replace(/<[^>]+>/g, '').trim();
      if (text) return true;
    }
    // Seed home welcome copy does not count as user data.
    if (p.id === 'page-home') return false;
    return p.blocks.some((b) => (b.content || '').trim().length > 0);
  });
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeCloud(raw: CloudWorkspace | null): CloudWorkspace | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    pages: asArray(raw.pages),
    habits: asArray(raw.habits),
    clients: asArray(raw.clients),
    projects: asArray(raw.projects),
    payments: asArray(raw.payments),
    goals: asArray(raw.goals),
    theme: raw.theme ?? DEFAULT_THEME,
    activePageId: raw.activePageId ?? 'page-home',
    sidebarCollapsed: Boolean(raw.sidebarCollapsed),
  };
}

function loadState(): AppState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem('orbit-workspace-v1');
    if (!raw) return createEmptyState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed.pages?.length) return createEmptyState();
    const seed = createEmptyState();
    const pages = ensureCorePages(asArray(parsed.pages));
    const projects = migrateProjectsFromFreelanceItems(
      pages,
      asArray(parsed.projects),
    );
    return {
      ...seed,
      ...parsed,
      pages,
      habits: asArray(parsed.habits),
      clients: asArray(parsed.clients),
      projects,
      payments: asArray<Payment>(parsed.payments).map((p) => ({
        ...p,
        type: p.type ?? ('due' as const),
      })),
      goals: asArray(parsed.goals),
      theme: {
        ...DEFAULT_THEME,
        ...(parsed.theme ?? {}),
      },
      activePageId: parsed.activePageId ?? 'page-home',
      sidebarCollapsed: parsed.sidebarCollapsed ?? false,
      searchQuery: parsed.searchQuery ?? '',
    };
  } catch {
    return createEmptyState();
  }
}

function fromCloud(cloud: CloudWorkspace, fallback: AppState): AppState {
  const pages = ensureCorePages(
    cloud.pages?.length ? cloud.pages : fallback.pages,
  );
  const projects = migrateProjectsFromFreelanceItems(
    pages,
    cloud.projects?.length ? cloud.projects : fallback.projects,
  );
  return {
    ...fallback,
    pages,
    habits: asArray(cloud.habits),
    clients: asArray(cloud.clients),
    projects,
    payments: asArray<Payment>(cloud.payments).map((p) => ({
      ...p,
      type: p.type ?? ('due' as const),
    })),
    goals: asArray(cloud.goals).length
      ? asArray(cloud.goals)
      : (fallback.goals ?? []),
    theme: { ...DEFAULT_THEME, ...(cloud.theme ?? {}) },
    activePageId: cloud.activePageId ?? fallback.activePageId,
    sidebarCollapsed: cloud.sidebarCollapsed ?? fallback.sidebarCollapsed,
    searchQuery: '',
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => loadState());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const skipCloudSave = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
      } catch (err) {
        console.error('localStorage save failed', err);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    applyTheme(state.theme ?? DEFAULT_THEME);
  }, [state.theme]);

  useEffect(() => {
    if (!user) {
      setSyncStatus('local');
      setSyncError(null);
      setHydrated(true);
      return;
    }

    let cancelled = false;
    setHydrated(false);
    setSyncStatus('syncing');
    setSyncError(null);

    (async () => {
      try {
        const rawCloud = await loadWorkspace(user.uid);
        if (cancelled) return;

        const cloud = normalizeCloud(rawCloud);
        const local = stateRef.current;
        const cloudState = cloud
          ? fromCloud(cloud, createEmptyState())
          : null;
        const cloudHasContent = cloudState
          ? hasWorkspaceContent(cloudState)
          : false;
        const localHasContent = hasWorkspaceContent(local);

        if (cloudHasContent && cloud) {
          // Prefer cloud workspace for signed-in users.
          skipCloudSave.current = true;
          setState(fromCloud(cloud, local));
        } else if (localHasContent) {
          // Recover: keep local data and upload it (covers wiped/empty cloud docs).
          skipCloudSave.current = true;
          setState(local);
          await saveWorkspace(user.uid, local);
        } else {
          // Truly empty account — do not overwrite an existing cloud document.
          const fresh = createEmptyState();
          skipCloudSave.current = true;
          setState(fresh);
          if (!rawCloud) {
            await saveWorkspace(user.uid, fresh);
          }
        }

        if (!cancelled) {
          setSyncStatus('synced');
          setSyncError(null);
        }
      } catch (err) {
        console.error('Firestore load/save failed', err);
        if (!cancelled) {
          setSyncStatus('error');
          setSyncError(syncErrorMessage(err));
          // Keep whatever local state we already have instead of wiping.
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Cloud sync only when workspace data changes — not on page/nav/search toggles.
  useEffect(() => {
    if (!user || !hydrated) return;
    if (skipCloudSave.current) {
      skipCloudSave.current = false;
      return;
    }

    setSyncStatus('syncing');
    const timer = window.setTimeout(() => {
      saveWorkspace(user.uid, stateRef.current)
        .then(() => {
          setSyncStatus('synced');
          setSyncError(null);
        })
        .catch((err) => {
          console.error('Firestore save failed', err);
          setSyncStatus('error');
          setSyncError(syncErrorMessage(err));
        });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [
    state.pages,
    state.habits,
    state.clients,
    state.projects,
    state.payments,
    state.goals,
    state.theme,
    user,
    hydrated,
  ]);

  const setActivePageId = useCallback((id: string) => {
    setState((s) => (s.activePageId === id ? s : { ...s, activePageId: id }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }));
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState((s) =>
      s.sidebarCollapsed === collapsed ? s : { ...s, sidebarCollapsed: collapsed },
    );
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    setState((s) => ({ ...s, searchQuery: q }));
  }, []);

  const updatePage = useCallback((id: string, patch: Partial<Page>) => {
    setState((s) => ({
      ...s,
      pages: s.pages.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }, []);

  const addPage = useCallback((space: SpaceKind, isTracker = false) => {
    const id = createId();
    const page: Page = {
      id,
      title: isTracker ? 'Untitled tracker' : 'Untitled page',
      icon: isTracker ? 'grid' : 'note',
      space: space === 'home' ? 'notes' : space,
      blocks: [
        {
          id: createId(),
          type: 'paragraph',
          content: '',
        },
      ],
      items: isTracker
        ? [
            {
              id: createId(),
              title: 'First item',
              notes: '',
              status: 'todo',
              priority: 'medium',
              tags: [],
              progress: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]
        : [],
      viewMode: isTracker ? 'board' : 'list',
      isTracker,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      pages: [...s.pages, page],
      activePageId: id,
    }));
  }, []);

  const deletePage = useCallback((id: string) => {
    if (id === 'page-home' || id === 'page-finance') return;
    setState((s) => {
      const pages = s.pages.filter((p) => p.id !== id);
      return {
        ...s,
        pages,
        activePageId:
          s.activePageId === id ? pages[0]?.id ?? 'page-home' : s.activePageId,
      };
    });
  }, []);

  const reorderPages = useCallback((dragId: string, dropId: string) => {
    if (!dragId || !dropId || dragId === dropId) return;
    setState((s) => {
      const from = s.pages.findIndex((p) => p.id === dragId);
      const to = s.pages.findIndex((p) => p.id === dropId);
      if (from < 0 || to < 0) return s;
      const pages = [...s.pages];
      const [moved] = pages.splice(from, 1);
      pages.splice(to, 0, moved);
      return { ...s, pages };
    });
  }, []);

  const updateBlock = useCallback(
    (pageId: string, blockId: string, patch: Partial<Block>) => {
      setState((s) => ({
        ...s,
        pages: s.pages.map((p) =>
          p.id !== pageId
            ? p
            : {
                ...p,
                updatedAt: new Date().toISOString(),
                blocks: p.blocks.map((b) =>
                  b.id === blockId ? { ...b, ...patch } : b,
                ),
              },
        ),
      }));
    },
    [],
  );

  const addBlock = useCallback(
    (
      pageId: string,
      type: BlockType = 'paragraph',
      afterId?: string,
      extras: Partial<Pick<Block, 'content' | 'checked' | 'indent'>> = {},
    ) => {
      const newBlock: Block = {
        id: createId(),
        type,
        content: extras.content ?? '',
        checked: extras.checked ?? false,
        indent: extras.indent ?? 0,
      };
      setState((s) => ({
        ...s,
        pages: s.pages.map((p) => {
          if (p.id !== pageId) return p;
          const blocks = [...p.blocks];
          const idx = afterId ? blocks.findIndex((b) => b.id === afterId) : -1;
          if (idx >= 0) blocks.splice(idx + 1, 0, newBlock);
          else blocks.push(newBlock);
          return { ...p, blocks, updatedAt: new Date().toISOString() };
        }),
      }));
    },
    [],
  );

  const deleteBlock = useCallback((pageId: string, blockId: string) => {
    setState((s) => ({
      ...s,
      pages: s.pages.map((p) => {
        if (p.id !== pageId) return p;
        if (p.blocks.length <= 1) return p;
        return {
          ...p,
          blocks: p.blocks.filter((b) => b.id !== blockId),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const reorderBlocks = useCallback(
    (pageId: string, dragId: string, dropId: string) => {
      if (!dragId || !dropId || dragId === dropId) return;
      setState((s) => ({
        ...s,
        pages: s.pages.map((p) => {
          if (p.id !== pageId) return p;
          const from = p.blocks.findIndex((b) => b.id === dragId);
          const to = p.blocks.findIndex((b) => b.id === dropId);
          if (from < 0 || to < 0) return p;
          const blocks = [...p.blocks];
          const [moved] = blocks.splice(from, 1);
          blocks.splice(to, 0, moved);
          return { ...p, blocks, updatedAt: new Date().toISOString() };
        }),
      }));
    },
    [],
  );

  const addItem = useCallback((pageId: string, title?: string) => {
    const t = new Date().toISOString();
    setState((s) => {
      const page = s.pages.find((p) => p.id === pageId);
      const defaultTitle =
        title ?? (page?.space === 'tasks' ? 'New task' : 'New item');
      const newItem: TrackerItem = {
        id: createId(),
        title: defaultTitle,
        notes: '',
        status: 'todo',
        priority: 'medium',
        tags: [],
        progress: 0,
        dueDate:
          page?.space === 'tasks' ? t.slice(0, 10) : undefined,
        createdAt: t,
        updatedAt: t,
      };
      return {
        ...s,
        pages: s.pages.map((p) =>
          p.id === pageId
            ? { ...p, items: [newItem, ...p.items], updatedAt: t }
            : p,
        ),
      };
    });
  }, []);

  const updateItem = useCallback(
    (pageId: string, itemId: string, patch: Partial<TrackerItem>) => {
      const t = new Date().toISOString();
      setState((s) => ({
        ...s,
        pages: s.pages.map((p) =>
          p.id !== pageId
            ? p
            : {
                ...p,
                updatedAt: t,
                items: p.items.map((i) =>
                  i.id === itemId ? { ...i, ...patch, updatedAt: t } : i,
                ),
              },
        ),
      }));
    },
    [],
  );

  const deleteItem = useCallback((pageId: string, itemId: string) => {
    setState((s) => ({
      ...s,
      pages: s.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              items: p.items.filter((i) => i.id !== itemId),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    }));
  }, []);

  const addNote = useCallback((pageId: string, title = 'Untitled note') => {
    const id = createId();
    const now = new Date().toISOString();
    const note: SavedNote = {
      id,
      title,
      content: '<p></p>',
      createdAt: now,
      updatedAt: now,
    };
    setState((s) => ({
      ...s,
      pages: s.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              savedNotes: [note, ...(p.savedNotes ?? [])],
              activeNoteId: id,
              updatedAt: now,
            }
          : p,
      ),
    }));
    return id;
  }, []);

  const updateNote = useCallback(
    (
      pageId: string,
      noteId: string,
      patch: Partial<Pick<SavedNote, 'title' | 'content'>>,
    ) => {
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        pages: s.pages.map((p) =>
          p.id === pageId
            ? {
                ...p,
                savedNotes: (p.savedNotes ?? []).map((n) =>
                  n.id === noteId ? { ...n, ...patch, updatedAt: now } : n,
                ),
                updatedAt: now,
              }
            : p,
        ),
      }));
    },
    [],
  );

  const deleteNote = useCallback((pageId: string, noteId: string) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      pages: s.pages.map((p) => {
        if (p.id !== pageId) return p;
        const savedNotes = (p.savedNotes ?? []).filter((n) => n.id !== noteId);
        const activeNoteId =
          p.activeNoteId === noteId ? savedNotes[0]?.id : p.activeNoteId;
        return { ...p, savedNotes, activeNoteId, updatedAt: now };
      }),
    }));
  }, []);

  const setActiveNoteId = useCallback(
    (pageId: string, noteId: string | undefined) => {
      updatePage(pageId, { activeNoteId: noteId });
    },
    [updatePage],
  );

  const setViewMode = useCallback((pageId: string, mode: ViewMode) => {
    updatePage(pageId, { viewMode: mode });
  }, [updatePage]);

  const toggleHabitDay = useCallback((habitId: string, date: string) => {
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => {
        if (h.id !== habitId) return h;
        const existing = h.days.find((d) => d.date === date);
        if (existing) {
          return {
            ...h,
            days: h.days.map((d) =>
              d.date === date ? { ...d, done: !d.done } : d,
            ),
          };
        }
        return { ...h, days: [...h.days, { date, done: true }] };
      }),
    }));
  }, []);

  const toggleHabitToday = useCallback(
    (habitId: string) => {
      toggleHabitDay(habitId, new Date().toISOString().slice(0, 10));
    },
    [toggleHabitDay],
  );

  const addHabit = useCallback((name: string, color?: string) => {
    setState((s) => {
      const palette = [
        '#0d9488',
        '#0284c7',
        '#16a34a',
        '#d97706',
        '#ea580c',
        '#e11d48',
        '#7c3aed',
        '#2563eb',
        '#0891b2',
        '#ca8a04',
      ];
      const used = new Set(s.habits.map((h) => h.color.toLowerCase()));
      const next =
        color ??
        palette.find((c) => !used.has(c.toLowerCase())) ??
        palette[s.habits.length % palette.length];
      const habit: Habit = {
        id: createId(),
        name,
        color: next,
        days: [],
      };
      return { ...s, habits: [...s.habits, habit] };
    });
  }, []);

  const updateHabit = useCallback(
    (habitId: string, patch: Partial<Pick<Habit, 'name' | 'color'>>) => {
      setState((s) => ({
        ...s,
        habits: s.habits.map((h) =>
          h.id === habitId ? { ...h, ...patch } : h,
        ),
      }));
    },
    [],
  );

  const deleteHabit = useCallback((habitId: string) => {
    setState((s) => ({
      ...s,
      habits: s.habits.filter((h) => h.id !== habitId),
    }));
  }, []);

  const addClient = useCallback((partial: Partial<Client> = {}) => {
    const id = createId();
    const client: Client = {
      id,
      name: partial.name ?? 'New client',
      company: partial.company,
      email: partial.email,
      phone: partial.phone,
      notes: partial.notes,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, clients: [client, ...s.clients] }));
    return id;
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setState((s) => ({
      ...s,
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      clients: s.clients.filter((c) => c.id !== id),
      payments: s.payments.filter((p) => p.clientId !== id),
      projects: (s.projects ?? []).map((p) =>
        p.clientId === id ? { ...p, clientId: '' } : p,
      ),
      pages: s.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          item.clientId === id ? { ...item, clientId: undefined } : item,
        ),
      })),
    }));
  }, []);

  const addProject = useCallback((partial: Partial<Project> = {}) => {
    const id = createId();
    const t = new Date().toISOString();
    const defaults: ProjectDeliverable[] = [
      { id: createId(), title: 'Discovery & scope', completed: false },
      { id: createId(), title: 'Build / delivery', completed: false },
      { id: createId(), title: 'Handoff', completed: false },
    ];
    const project: Project = {
      id,
      clientId: partial.clientId ?? '',
      title: partial.title ?? 'New project',
      description: partial.description,
      budget: partial.budget ?? 0,
      currency: partial.currency ?? 'INR',
      status: partial.status ?? 'planning',
      startDate: partial.startDate ?? t.slice(0, 10),
      deadline: partial.deadline,
      deliverables: partial.deliverables ?? defaults,
      createdAt: t,
      updatedAt: t,
    };
    setState((s) => ({
      ...s,
      projects: [project, ...(s.projects ?? [])],
    }));
    return id;
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    const t = new Date().toISOString();
    setState((s) => ({
      ...s,
      projects: (s.projects ?? []).map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: t } : p,
      ),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      projects: (s.projects ?? []).filter((p) => p.id !== id),
      payments: s.payments.map((p) =>
        p.projectId === id ? { ...p, projectId: undefined } : p,
      ),
    }));
  }, []);

  const toggleProjectDeliverable = useCallback(
    (projectId: string, deliverableId: string) => {
      const t = new Date().toISOString();
      setState((s) => ({
        ...s,
        projects: (s.projects ?? []).map((p) =>
          p.id === projectId
            ? {
                ...p,
                updatedAt: t,
                deliverables: (p.deliverables ?? []).map((d) =>
                  d.id === deliverableId
                    ? { ...d, completed: !d.completed }
                    : d,
                ),
              }
            : p,
        ),
      }));
    },
    [],
  );

  const addPayment = useCallback((partial: Partial<Payment> = {}) => {
    const t = new Date().toISOString();
    setState((s) => {
      const payment: Payment = {
        id: createId(),
        clientId: partial.clientId ?? s.clients[0]?.id ?? '',
        projectId: partial.projectId,
        title: partial.title ?? 'New payment',
        amount: partial.amount ?? 0,
        currency: partial.currency ?? 'INR',
        type: partial.type ?? 'due',
        status: partial.status ?? 'draft',
        method: partial.method ?? 'upi',
        dueDate: partial.dueDate,
        paidDate: partial.paidDate,
        invoiceNumber: partial.invoiceNumber,
        notes: partial.notes,
        createdAt: t,
        updatedAt: t,
      };
      return { ...s, payments: [payment, ...s.payments] };
    });
  }, []);

  const updatePayment = useCallback((id: string, patch: Partial<Payment>) => {
    const t = new Date().toISOString();
    setState((s) => ({
      ...s,
      payments: s.payments.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: t } : p,
      ),
    }));
  }, []);

  const deletePayment = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      payments: s.payments.filter((p) => p.id !== id),
    }));
  }, []);

  const addGoal = useCallback((partial: Partial<Goal> = {}) => {
    const t = new Date().toISOString();
    const goal: Goal = {
      id: createId(),
      title: partial.title ?? 'New goal',
      category: partial.category ?? 'personal',
      status: partial.status ?? 'planning',
      priority: partial.priority ?? 'medium',
      targetAmount: partial.targetAmount ?? 0,
      savedAmount: partial.savedAmount ?? 0,
      currency: partial.currency ?? 'INR',
      targetDate: partial.targetDate,
      startDate: partial.startDate ?? t.slice(0, 10),
      achievedDate: partial.achievedDate,
      progress: partial.progress ?? 0,
      why: partial.why ?? '',
      notes: partial.notes ?? '',
      createdAt: t,
      updatedAt: t,
    };
    setState((s) => ({ ...s, goals: [goal, ...(s.goals ?? [])] }));
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    const t = new Date().toISOString();
    setState((s) => ({
      ...s,
      goals: (s.goals ?? []).map((g) =>
        g.id === id ? { ...g, ...patch, updatedAt: t } : g,
      ),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      goals: (s.goals ?? []).filter((g) => g.id !== id),
    }));
  }, []);

  const setTheme = useCallback((theme: Partial<ThemeSettings>) => {
    setState((s) => ({
      ...s,
      theme: { ...(s.theme ?? DEFAULT_THEME), ...theme },
    }));
  }, []);

  const resetData = useCallback(() => {
    const fresh = createEmptyState();
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  const activePage = useMemo(
    () => state.pages.find((p) => p.id === state.activePageId),
    [state.pages, state.activePageId],
  );

  const allItems = useMemo(
    () => state.pages.flatMap((p) => p.items.map((i) => ({ ...i, pageId: p.id } as TrackerItem))),
    [state.pages],
  );

  const value = useMemo(
    () => ({
      state,
      activePage,
      syncStatus,
      syncError,
      setActivePageId,
      toggleSidebar,
      setSidebarCollapsed,
      setSearchQuery,
      updatePage,
      addPage,
      deletePage,
      reorderPages,
      updateBlock,
      addBlock,
      deleteBlock,
      reorderBlocks,
      addItem,
      updateItem,
      deleteItem,
      addNote,
      updateNote,
      deleteNote,
      setActiveNoteId,
      setViewMode,
      toggleHabitToday,
      toggleHabitDay,
      addHabit,
      updateHabit,
      deleteHabit,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      toggleProjectDeliverable,
      addPayment,
      updatePayment,
      deletePayment,
      addGoal,
      updateGoal,
      deleteGoal,
      setTheme,
      resetData,
      allItems,
    }),
    [
      state,
      activePage,
      syncStatus,
      syncError,
      setActivePageId,
      toggleSidebar,
      setSidebarCollapsed,
      setSearchQuery,
      updatePage,
      addPage,
      deletePage,
      reorderPages,
      updateBlock,
      addBlock,
      deleteBlock,
      reorderBlocks,
      addItem,
      updateItem,
      deleteItem,
      addNote,
      updateNote,
      deleteNote,
      setActiveNoteId,
      setViewMode,
      toggleHabitToday,
      toggleHabitDay,
      addHabit,
      updateHabit,
      deleteHabit,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      toggleProjectDeliverable,
      addPayment,
      updatePayment,
      deletePayment,
      addGoal,
      updateGoal,
      deleteGoal,
      setTheme,
      resetData,
      allItems,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
