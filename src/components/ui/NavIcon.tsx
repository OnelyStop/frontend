import {
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  ClipboardList,
  FileSearch,
  Home,
  Lightbulb,
  Library,
  Mic,
  PenLine,
  Settings,
  Shapes,
  Shuffle,
  StickyNote,
  User,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  library: Library,
  "file-search": FileSearch,
  shuffle: Shuffle,
  clipboard: ClipboardList,
  lightbulb: Lightbulb,
  book: BookOpen,
  pen: PenLine,
  shapes: Shapes,
  mic: Mic,
  bot: Bot,
  chart: BarChart3,
  brain: Brain,
  sticky: StickyNote,
  user: User,
  settings: Settings,
};

export function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? Home;
  return <Icon size={size} strokeWidth={1.75} />;
}
