import type { AppState, Page } from '../types';
import { DEFAULT_THEME } from '../types';

const now = () => new Date().toISOString();

export function createId() {
  return crypto.randomUUID();
}

function block(
  type: Page['blocks'][number]['type'],
  content: string,
  checked?: boolean,
) {
  return { id: createId(), type, content, checked };
}

function emptyPage(
  id: string,
  title: string,
  icon: string,
  space: Page['space'],
  extras: Partial<Page> = {},
): Page {
  const t = now();
  return {
    id,
    title,
    icon,
    space,
    blocks: [block('paragraph', '')],
    items: [],
    viewMode: extras.isTracker ? 'board' : 'list',
    isTracker: false,
    createdAt: t,
    updatedAt: t,
    ...extras,
  };
}

/** Blank starter workspace — structure only, no demo content. */
export function createEmptyState(): AppState {
  const pages: Page[] = [
    emptyPage('page-home', 'Home', 'home', 'home', {
      blocks: [
        block('heading1', 'Welcome to Orbit'),
        block(
          'paragraph',
          'Your personal workspace for tasks, learning, career growth, and tracking. Add pages from the sidebar and start from a blank slate.',
        ),
        block('callout', 'Tip: Use the + button in the sidebar to create a new page or custom tracker.'),
      ],
      viewMode: 'list',
      isTracker: false,
    }),
    emptyPage('page-tasks', 'Daily Tasks', 'check', 'tasks', {
      isTracker: true,
      viewMode: 'board',
    }),
    emptyPage('page-learning', 'Learning Log', 'book', 'learning', {
      isTracker: true,
      viewMode: 'table',
    }),
    emptyPage('page-career', 'Career Growth', 'rocket', 'career', {
      isTracker: true,
      viewMode: 'list',
    }),
    emptyPage('page-office', 'Office Hub', 'briefcase', 'office', {
      isTracker: true,
      viewMode: 'board',
    }),
    emptyPage('page-freelance', 'Side Project', 'freelance', 'freelance', {
      isTracker: true,
      viewMode: 'list',
    }),
    emptyPage('page-finance', 'Finances', 'finance', 'finance'),
    emptyPage('page-goals', 'Life Goals', 'target', 'goals'),
    emptyPage('page-habits', 'Habits & Routines', 'flame', 'habits'),
    emptyPage('page-notes', 'Quick Notes', 'note', 'notes', {
      blocks: [
        block('heading1', 'Scratchpad'),
        block('paragraph', ''),
      ],
    }),
  ];

  return {
    pages,
    habits: [],
    clients: [],
    payments: [],
    goals: [],
    theme: DEFAULT_THEME,
    activePageId: 'page-home',
    sidebarCollapsed: false,
    searchQuery: '',
  };
}

export const seedState: AppState = createEmptyState();
