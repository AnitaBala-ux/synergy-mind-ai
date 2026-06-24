import { useRef, useState } from "react";
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
  Menu,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileSidebar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstNavRef = useRef<HTMLAnchorElement>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  const items = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/chat", label: t("nav.assistant"), icon: Bot },
    { to: "/research", label: t("nav.research"), icon: BookOpen },
    { to: "/planner", label: t("nav.planner"), icon: CalendarClock },
    { to: "/todo", label: t("nav.todo"), icon: CheckSquare },
    { to: "/analytics", label: t("nav.analytics"), icon: BarChart3 },
    { to: "/projects", label: t("nav.projects"), icon: FolderKanban },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
    { to: "/responsible-ai", label: t("nav.responsible"), icon: ShieldCheck },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          ref={triggerRef}
          aria-label={t("common.openMenu")}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mobile-sidebar"
          className="md:hidden inline-flex size-10 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        id="mobile-sidebar"
        side="left"
        className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border focus:outline-none"
        // Move focus to first nav item when the drawer animates in
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          requestAnimationFrame(() => firstNavRef.current?.focus());
        }}
        // Return focus to the trigger when the drawer closes
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <SheetTitle className="sr-only">{t("common.workspace")}</SheetTitle>
        <SheetDescription className="sr-only">{t("common.openMenu")}</SheetDescription>

        <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
          <div className="size-9 rounded-lg bg-primary/20 grid place-items-center">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">SynergyMind AI</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              {t("common.workspace")}
            </div>
          </div>
        </div>
        <nav
          aria-label={t("common.workspace")}
          className="px-3 py-4 space-y-1 overflow-y-auto"
        >
          {items.map((it, idx) => {
            const Icon = it.icon;
            const active = isActive(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                ref={idx === 0 ? firstNavRef : undefined}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
