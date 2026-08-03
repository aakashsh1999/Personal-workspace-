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
  | 'goals'
  | 'habits'
  | 'notes'
  | 'custom';

export type Status = 'backlog' | 'todo' | 'in_progress' | 'done' | 'blocked';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ViewMode = 'list' | 'board' | 'table';
export type PaymentStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'upi' | 'bank' | 'paypal' | 'card' | 'cash' | 'other';
export type PaymentType = 'advance' | 'due' | 'refund' | 'return';
export type GoalCategory =
  | 'vehicle'
  | 'home'
  | 'family'
  | 'financial'
  | 'career'
  | 'education'
  | 'travel'
  | 'health'
  | 'personal'
  | 'other';
export type GoalStatus =
  | 'planning'
  | 'in_progress'
  | 'on_track'
  | 'at_risk'
  | 'paused'
  | 'achieved'
  | 'cancelled';

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

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  status: GoalStatus;
  priority: Priority;
  targetAmount: number;
  savedAmount: number;
  currency: string;
  targetDate?: string;
  startDate?: string;
  achievedDate?: string;
  progress: number;
  why: string;
  notes: string;
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
  goals: Goal[];
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
  refund: 'Refund',
  return: 'Return',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI',
  bank: 'Bank transfer',
  paypal: 'PayPal',
  card: 'Card',
  cash: 'Cash',
  other: 'Other',
};

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  vehicle: 'Vehicle',
  home: 'Home / property',
  family: 'Family / marriage',
  financial: 'Financial',
  career: 'Career',
  education: 'Education',
  travel: 'Travel',
  health: 'Health',
  personal: 'Personal',
  other: 'Other',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  planning: 'Planning',
  in_progress: 'In progress',
  on_track: 'On track',
  at_risk: 'At risk',
  paused: 'Paused',
  achieved: 'Achieved',
  cancelled: 'Cancelled',
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
  goals: { label: 'Goals', description: 'Life goals & milestones' },
  habits: { label: 'Habits', description: 'Streaks & routines' },
  notes: { label: 'Notes', description: 'Freeform pages' },
  custom: { label: 'Trackers', description: 'Any custom board' },
};
