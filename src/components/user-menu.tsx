import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LogOut, User as UserIcon, Languages, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGES } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { t, i18n } = useTranslation();
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();

  const initials = (profile?.display_name || user?.email || "SM")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "SM";

  const changeLanguage = async (code: string) => {
    i18n.changeLanguage(code);
    if (user) {
      await supabase.from("profiles").update({ preferred_language: code }).eq("id", user.id);
      if (profile) setProfile({ ...profile, preferred_language: code });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("common.account")}
          className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground text-sm font-semibold hover:opacity-90"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="font-semibold truncate">{profile?.display_name || user.email}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <UserIcon className="mr-2 size-4" /> {t("common.profile")}
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => navigate({ to: "/auth" })}>
            <LogIn className="mr-2 size-4" /> {t("common.signIn")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 size-4" /> {t("common.language")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={i18n.language?.split("-")[0]} onValueChange={changeLanguage}>
              {LANGUAGES.map((l) => (
                <DropdownMenuRadioItem key={l.code} value={l.code}>
                  {l.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 size-4" /> {t("common.signOut")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
