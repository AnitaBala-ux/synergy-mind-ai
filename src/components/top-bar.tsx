import { Bell, Search } from "lucide-react";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center gap-4 px-6">
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-sm w-64">
          <Search className="size-4" aria-hidden="true" />
          <input
            placeholder="Search..."
            aria-label="Search"
            className="bg-transparent outline-none flex-1 text-sm text-foreground"
          />
        </div>
        <button aria-label="Notifications" className="size-9 grid place-items-center rounded-md hover:bg-muted">
          <Bell className="size-4" aria-hidden="true" />
        </button>
        <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground text-sm font-semibold">
          SM
        </div>
      </div>
    </header>
  );
}
