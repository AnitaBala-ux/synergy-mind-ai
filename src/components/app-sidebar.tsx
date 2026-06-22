import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  CalendarClock,
  CheckSquare,
  BarChart3,
  FolderKanban,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "AI Assistant", icon: Bot },
  { to: "/research", label: "Research", icon: BookOpen },
  { to: "/planner", label: "Task Planner", icon: CalendarClock },
  { to: "/todo", label: "To-Do List", icon: CheckSquare },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/projects", label: "Projects", icon: FolderKanban },
];

const bottom = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/responsible-ai", label: "Responsible AI", icon: ShieldCheck },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
        <div className="size-9 rounded-lg bg-primary/20 grid place-items-center">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold text-sm leading-tight">ResearchFlow</div>
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">AI Workspace</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-1">
        {bottom.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
              }`}
            >
              <Icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
