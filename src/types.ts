export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bullet'
  | 'numbered'
  | 'divider'
  | 'callout'
  | 'quote';

export type SpaceKind =
  | 'home'
  | 'tasks'
  | 'learning'
  | 'career'
  | 'office'
  | 'freelance'
  | 'habits'
  | 'notes'
  | 'custom';

export type Status = 'backlog' | 'todo' | 'in_progress' | 'done' | 'blocked';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ViewMode = 'list' | 'board' | 'table';
export type PaymentStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'upi' | 'bank' | 'paypal' | 'card' | 'cash' | 'other';
export type PaymentType = 'advance' | 'due';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

export interface TrackerItem {
  id: string;
  title: string;
  notes: string;
  status: Status;
  priority: Priority;
  tags: string[];
  progress: number;
  dueDate?: string;
  clientId?: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  clientId: string;
  projectId?: string;
  title: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  method: PaymentMethod;
  dueDate?: string;
  paidDate?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  title: string;
  icon: string;
  space: SpaceKind;
  parentId?: string;
  blocks: Block[];
  items: TrackerItem[];
  viewMode: ViewMode;
  isTracker: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitDay {
  date: string;
  done: boolean;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  days: HabitDay[];
}

export interface AppState {
  pages: Page[];
  habits: Habit[];
  clients: Client[];
  payments: Payment[];
  theme: ThemeSettings;
  activePageId: string;
  sidebarCollapsed: boolean;
  searchQuery: string;
}

export interface ThemeSettings {
  preset: string;
  primary: string;
  accent: string;
}

export const THEME_PRESETS: {
  id: string;
  label: string;
  primary: string;
  accent: string;
}[] = [
  { id: 'teal', label: 'Teal', primary: '#0f766e', accent: '#0369a1' },
  { id: 'ocean', label: 'Ocean', primary: '#0369a1', accent: '#0e7490' },
  { id: 'forest', label: 'Forest', primary: '#166534', accent: '#3f6212' },
  { id: 'amber', label: 'Amber', primary: '#b45309', accent: '#c2410c' },
  { id: 'slate', label: 'Slate', primary: '#334155', accent: '#0f766e' },
  { id: 'rose', label: 'Rose', primary: '#be123c', accent: '#9f1239' },
];

export const DEFAULT_THEME: ThemeSettings = {
  preset: 'teal',
  primary: '#0f766e',
  accent: '#0369a1',
};

export const STATUS_LABELS: Record<Status, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  advance: 'Advance',
  due: 'Due',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI',
  bank: 'Bank transfer',
  paypal: 'PayPal',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

export const SPACE_META: Record<
  SpaceKind,
  { label: string; description: string }
> = {
  home: { label: 'Home', description: 'Your daily overview' },
  tasks: { label: 'Tasks', description: 'Day-to-day work' },
  learning: { label: 'Learning', description: 'Skills & study logs' },
  career: { label: 'Career', description: 'Growth & milestones' },
  office: { label: 'Office', description: 'Work projects & meetings' },
  freelance: { label: 'Side Project', description: 'Clients, projects & payments' },
  habits: { label: 'Habits', description: 'Streaks & routines' },
  notes: { label: 'Notes', description: 'Freeform pages' },
  custom: { label: 'Trackers', description: 'Any custom board' },
};
