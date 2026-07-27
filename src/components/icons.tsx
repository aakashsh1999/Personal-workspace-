import {
  BookOpen,
  Briefcase,
  CheckSquare,
  Flame,
  Grid3X3,
  Home,
  LayoutList,
  NotebookPen,
  Rocket,
  StickyNote,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  home: Home,
  check: CheckSquare,
  book: BookOpen,
  rocket: Rocket,
  briefcase: Briefcase,
  freelance: Wallet,
  flame: Flame,
  note: StickyNote,
  grid: Grid3X3,
  list: LayoutList,
  notebook: NotebookPen,
};

export function PageIcon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = MAP[name] ?? StickyNote;
  return <Icon size={size} className={className} aria-hidden />;
}
