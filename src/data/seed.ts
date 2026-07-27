import type { AppState, Client, Habit, Page, Payment } from '../types';
import { DEFAULT_THEME } from '../types';

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

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

function item(
  title: string,
  extras: Partial<Page['items'][number]> = {},
): Page['items'][number] {
  const t = now();
  return {
    id: createId(),
    title,
    notes: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
    progress: 0,
    createdAt: t,
    updatedAt: t,
    ...extras,
  };
}

const pages: Page[] = [
  {
    id: 'page-home',
    title: 'Home',
    icon: 'home',
    space: 'home',
    blocks: [
      block('heading1', 'Welcome to Orbit'),
      block(
        'paragraph',
        'Your personal workspace for tasks, learning, career growth, and any kind of tracking — like Notion, tuned for daily use.',
      ),
      block('heading2', 'How to use'),
      block(
        'bullet',
        'Open a space from the sidebar — Tasks, Learning, Career, Office, Habits.',
      ),
      block(
        'bullet',
        'Add pages and tracker boards. Switch list / board / table views.',
      ),
      block(
        'bullet',
        'Everything saves automatically in this browser.',
      ),
      block('callout', 'Tip: Use the + button in the sidebar to create a new page or custom tracker.'),
    ],
    items: [],
    viewMode: 'list',
    isTracker: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'page-tasks',
    title: 'Daily Tasks',
    icon: 'check',
    space: 'tasks',
    blocks: [
      block('heading2', 'Focus for today'),
      block('todo', 'Review priorities for the week', false),
      block('todo', 'Block 90 minutes for deep work', false),
      block('paragraph', 'Move items through the board as you go.'),
    ],
    items: [
      item('Ship weekly status update', {
        status: 'in_progress',
        priority: 'high',
        tags: ['office'],
        progress: 40,
        dueDate: today(),
      }),
      item('Inbox zero before lunch', {
        status: 'todo',
        priority: 'medium',
        tags: ['daily'],
        dueDate: today(),
      }),
      item('Prepare 1:1 talking points', {
        status: 'backlog',
        priority: 'medium',
        tags: ['career'],
        dueDate: daysAgo(-2),
      }),
      item('Book dentist appointment', {
        status: 'done',
        priority: 'low',
        tags: ['personal'],
        progress: 100,
      }),
    ],
    viewMode: 'board',
    isTracker: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'page-learning',
    title: 'Learning Log',
    icon: 'book',
    space: 'learning',
    blocks: [
      block('heading2', 'This week’s focus'),
      block('paragraph', 'System design fundamentals + TypeScript advanced patterns.'),
      block('todo', 'Finish one chapter of system design notes', false),
      block('todo', 'Build a small practice project', false),
    ],
    items: [
      item('System Design — Load Balancing', {
        status: 'in_progress',
        priority: 'high',
        tags: ['systems', 'study'],
        progress: 55,
        notes: 'Notes on L4 vs L7, health checks, sticky sessions.',
      }),
      item('TypeScript — Utility Types deep dive', {
        status: 'todo',
        priority: 'medium',
        tags: ['typescript'],
        progress: 10,
      }),
      item('Read: Designing Data-Intensive Applications Ch.3', {
        status: 'backlog',
        priority: 'medium',
        tags: ['books'],
      }),
      item('Complete React performance course module 2', {
        status: 'done',
        priority: 'low',
        tags: ['frontend'],
        progress: 100,
      }),
    ],
    viewMode: 'table',
    isTracker: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'page-career',
    title: 'Career Growth',
    icon: 'rocket',
    space: 'career',
    blocks: [
      block('heading2', 'North star'),
      block(
        'quote',
        'Become a senior engineer who leads projects end-to-end and mentors others.',
      ),
      block('heading3', 'Q3 milestones'),
      block('bullet', 'Lead one cross-team initiative'),
      block('bullet', 'Publish 2 internal tech notes'),
      block('bullet', 'Complete promotion packet draft'),
    ],
    items: [
      item('Draft promotion self-review', {
        status: 'in_progress',
        priority: 'urgent',
        tags: ['promo'],
        progress: 35,
        dueDate: daysAgo(-14),
      }),
      item('Ask for feedback from 3 peers', {
        status: 'todo',
        priority: 'high',
        tags: ['feedback'],
      }),
      item('Update LinkedIn + portfolio projects', {
        status: 'backlog',
        priority: 'medium',
        tags: ['brand'],
      }),
      item('Shadow a design critique session', {
        status: 'done',
        priority: 'low',
        tags: ['growth'],
        progress: 100,
      }),
    ],
    viewMode: 'list',
    isTracker: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'page-office',
    title: 'Office Hub',
    icon: 'briefcase',
    space: 'office',
    blocks: [
      block('heading2', 'Active projects'),
      block('callout', 'Keep meeting notes and deliverables here so nothing lives only in chat.'),
      block('paragraph', 'Link related tasks from Daily Tasks when helpful.'),
    ],
    items: [
      item('Q3 roadmap planning deck', {
        status: 'in_progress',
        priority: 'high',
        tags: ['planning'],
        progress: 60,
        dueDate: daysAgo(-5),
      }),
      item('Customer feedback synthesis', {
        status: 'todo',
        priority: 'medium',
        tags: ['research'],
      }),
      item('Onboard new contractor checklist', {
        status: 'backlog',
        priority: 'medium',
        tags: ['people'],
      }),
      item('Migrate staging configs', {
        status: 'blocked',
        priority: 'high',
        tags: ['infra'],
        notes: 'Waiting on access from platform team.',
      }),
    ],
    viewMode: 'board',
    isTracker: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'page-freelance',
    title: 'Side Project',
    icon: 'freelance',
    space: 'freelance',
    blocks: [
      block('heading2', 'Side project work'),
      block(
        'paragraph',
        'Track side projects, clients, and payments in one place.',
      ),
    ],
    items: [
      item('Landing page redesign', {
        status: 'in_progress',
        priority: 'high',
        tags: ['web', 'design'],
        progress: 60,
        clientId: 'client-nova',
        budget: 45000,
        dueDate: daysAgo(-10),
        notes: 'Homepage + pricing section. 2 revision rounds included.',
      }),
      item('Shopify theme tweaks', {
        status: 'todo',
        priority: 'medium',
        tags: ['shopify'],
        progress: 0,
        clientId: 'client-bloom',
        budget: 18000,
      }),
      item('API integration for dashboard', {
        status: 'done',
        priority: 'high',
        tags: ['backend'],
        progress: 100,
        clientId: 'client-pulse',
        budget: 62000,
      }),
      item('Brand identity package', {
        status: 'backlog',
        priority: 'low',
        tags: ['brand'],
        clientId: 'client-bloom',
        budget: 30000,
      }),
    ],
    viewMode: 'list',
    isTracker: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'page-habits',
    title: 'Habits & Routines',
    icon: 'flame',
    space: 'habits',
    blocks: [
      block('heading2', 'Consistency over intensity'),
      block(
        'paragraph',
        'Mark habits each day. Small streaks compound into career and learning gains.',
      ),
    ],
    items: [],
    viewMode: 'list',
    isTracker: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'page-notes',
    title: 'Quick Notes',
    icon: 'note',
    space: 'notes',
    blocks: [
      block('heading1', 'Scratchpad'),
      block('paragraph', 'Dump ideas, meeting scribbles, and half-formed thoughts here.'),
      block('divider', ''),
      block('heading3', 'Ideas'),
      block('bullet', ''),
    ],
    items: [],
    viewMode: 'list',
    isTracker: false,
    createdAt: now(),
    updatedAt: now(),
  },
];

function habitDays(pattern: boolean[]): Habit['days'] {
  return pattern.map((done, i) => ({
    date: daysAgo(pattern.length - 1 - i),
    done,
  }));
}

const habits: Habit[] = [
  {
    id: 'habit-read',
    name: 'Read 20 minutes',
    color: '#0F766E',
    days: habitDays([true, true, false, true, true, true, false]),
  },
  {
    id: 'habit-deep',
    name: 'Deep work block',
    color: '#0369A1',
    days: habitDays([true, false, true, true, false, true, true]),
  },
  {
    id: 'habit-exercise',
    name: 'Move / exercise',
    color: '#C2410C',
    days: habitDays([false, true, true, true, false, false, true]),
  },
  {
    id: 'habit-journal',
    name: 'Evening journal',
    color: '#B45309',
    days: habitDays([true, true, true, false, true, false, false]),
  },
];

const clients: Client[] = [
  {
    id: 'client-nova',
    name: 'Aisha Khan',
    company: 'Nova Labs',
    email: 'aisha@novalabs.example',
    phone: '+91 98765 43210',
    notes: 'Prefers weekly updates on Fridays.',
    createdAt: now(),
  },
  {
    id: 'client-bloom',
    name: 'Rahul Mehta',
    company: 'Bloom Retail',
    email: 'rahul@bloom.example',
    notes: 'Shopify store — peak season Oct–Dec.',
    createdAt: now(),
  },
  {
    id: 'client-pulse',
    name: 'Sara Chen',
    company: 'Pulse Analytics',
    email: 'sara@pulse.example',
    phone: '+1 415 555 0199',
    notes: 'Pays via bank wire. Net 15.',
    createdAt: now(),
  },
];

const payments: Payment[] = [
  {
    id: 'pay-1',
    clientId: 'client-nova',
    title: 'Landing page — 50% advance',
    amount: 22500,
    currency: 'INR',
    type: 'advance',
    status: 'paid',
    method: 'upi',
    dueDate: daysAgo(14),
    paidDate: daysAgo(12),
    invoiceNumber: 'INV-1042',
    notes: 'Kickoff payment received.',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'pay-2',
    clientId: 'client-nova',
    title: 'Landing page — final balance',
    amount: 22500,
    currency: 'INR',
    type: 'due',
    status: 'sent',
    method: 'bank',
    dueDate: daysAgo(-7),
    invoiceNumber: 'INV-1048',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'pay-3',
    clientId: 'client-pulse',
    title: 'API integration — full due',
    amount: 62000,
    currency: 'INR',
    type: 'due',
    status: 'paid',
    method: 'bank',
    dueDate: daysAgo(20),
    paidDate: daysAgo(18),
    invoiceNumber: 'INV-1039',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'pay-4',
    clientId: 'client-bloom',
    title: 'Shopify tweaks — advance deposit',
    amount: 9000,
    currency: 'INR',
    type: 'advance',
    status: 'overdue',
    method: 'upi',
    dueDate: daysAgo(3),
    invoiceNumber: 'INV-1050',
    notes: 'Follow up this week.',
    createdAt: now(),
    updatedAt: now(),
  },
];

export const seedState: AppState = {
  pages,
  habits,
  clients,
  payments,
  theme: DEFAULT_THEME,
  activePageId: 'page-home',
  sidebarCollapsed: false,
  searchQuery: '',
};
