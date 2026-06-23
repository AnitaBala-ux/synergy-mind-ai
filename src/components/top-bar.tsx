import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NotificationsBell } from "@/components/notifications-bell";
import { UserMenu } from "@/components/user-menu";
import { MobileSidebar } from "@/components/mobile-sidebar";

export function TopBar({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center gap-2 sm:gap-4 px-3 sm:px-6">
      <MobileSidebar />
      <h1 className="text-base font-semibold truncate min-w-0">{title}</h1>
      <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-sm w-64">
          <Search className="size-4" aria-hidden="true" />
          <input
            placeholder={t("common.search")}
            aria-label={t("common.search")}
            className="bg-transparent outline-none flex-1 text-sm text-foreground"
          />
        </div>
        <NotificationsBell />
        <UserMenu />
      </div>
    </header>
  );
}
