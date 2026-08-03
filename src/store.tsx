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
  addClient: (partial?: Partial<Client>) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
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

function loadState(): AppState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem('orbit-workspace-v1');
    if (!raw) return createEmptyState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed.pages?.length) return createEmptyState();
    const seed = createEmptyState();
    const pages = ensureCorePages(parsed.pages);
    return {
      ...seed,
      ...parsed,
      pages,
      habits: parsed.habits ?? [],
      clients: parsed.clients ?? [],
      payments: (parsed.payments ?? []).map((p) => ({
        ...p,
        type: p.type ?? ('due' as const),
      })),
      goals: parsed.goals ?? [],
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
  return {
    ...fallback,
    pages,
    habits: cloud.habits ?? [],
    clients: cloud.clients ?? [],
    payments: (cloud.payments ?? []).map((p) => ({
      ...p,
      type: p.type ?? ('due' as const),
    })),
    goals: cloud.goals ?? fallback.goals ?? [],
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
        const cloud = await loadWorkspace(user.uid);
        if (cancelled) return;
        if (cloud?.pages?.length) {
          skipCloudSave.current = true;
          setState(fromCloud(cloud, stateRef.current));
        } else {
          // New account: always start blank (don't upload leftover local demo data).
          const fresh = createEmptyState();
          skipCloudSave.current = true;
          setState(fresh);
          await saveWorkspace(user.uid, fresh);
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
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !hydrated) return;
    if (skipCloudSave.current) {
      skipCloudSave.current = false;
      return;
    }

    setSyncStatus('syncing');
    const timer = window.setTimeout(() => {
      saveWorkspace(user.uid, state)
        .then(() => {
          setSyncStatus('synced');
          setSyncError(null);
        })
        .catch((err) => {
          console.error('Firestore save failed', err);
          setSyncStatus('error');
          setSyncError(syncErrorMessage(err));
        });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [state, user, hydrated]);

  const setActivePageId = useCallback((id: string) => {
    setState((s) => ({ ...s, activePageId: id }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }));
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
    const client: Client = {
      id: createId(),
      name: partial.name ?? 'New client',
      company: partial.company,
      email: partial.email,
      phone: partial.phone,
      notes: partial.notes,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, clients: [client, ...s.clients] }));
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
      pages: s.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          item.clientId === id ? { ...item, clientId: undefined } : item,
        ),
      })),
    }));
  }, []);

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
