import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { getClientId } from "@/lib/client-id";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogIn, Save, Loader2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SynergyMind AI" },
      { name: "description", content: "Manage your SynergyMind AI profile, display name, avatar, and workspace preferences." },
      { property: "og:title", content: "Settings — SynergyMind AI" },
      { property: "og:description", content: "Manage your SynergyMind AI workspace preferences." },
      { property: "og:url", content: "https://synergy-mind-ai.lovable.app/settings" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://synergy-mind-ai.lovable.app/settings" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, setProfile, loading } = useAuth();

  const [cid, setCid] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setCid(getClientId()); }, []);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile?.id]);

  const initials =
    (displayName || user?.email || "SM")
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "SM";

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const update = {
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    };
    const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(t("settings.saveError")); return; }
    if (profile) setProfile({ ...profile, ...update });
    toast.success(t("settings.saved"));
  };

  return (
    <>
      <TopBar title={t("settings.title")} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Profile */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">{t("settings.profile")}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t("settings.profileIntro")}</p>

            {loading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("common.loading")}
              </div>
            ) : !user ? (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-border p-4">
                <p className="text-sm text-muted-foreground">{t("settings.signInToEdit")}</p>
                <button
                  onClick={() => navigate({ to: "/auth" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm"
                >
                  <LogIn className="size-4" /> {t("common.signIn")}
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground text-lg font-semibold overflow-hidden">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={displayName || user.email || "Avatar preview"}
                        className="size-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">{t("settings.preview")}</div>
                    <div className="truncate">{user.email}</div>
                  </div>
                </div>

                <div>
                  <label htmlFor="display_name" className="text-xs font-medium">
                    {t("settings.displayName")}
                  </label>
                  <input
                    id="display_name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t("settings.displayNamePh")}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="avatar_url" className="text-xs font-medium">
                    {t("settings.avatarUrl")}
                  </label>
                  <input
                    id="avatar_url"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder={t("settings.avatarUrlPh")}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {saving ? t("common.saving") : t("common.save")}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Workspace */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">{t("settings.workspace")}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t("settings.workspaceIntro")}</p>
            <div className="mt-4 text-xs">
              <div className="text-muted-foreground">{t("settings.workspaceId")}</div>
              <code className="block mt-1 px-3 py-2 rounded-md bg-muted font-mono text-[11px] break-all">{cid}</code>
            </div>
          </section>

          {/* About */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">{t("settings.about")}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t("settings.tagline")}</p>
            <p className="text-xs text-muted-foreground mt-2">{t("settings.poweredBy")}</p>
          </section>
        </div>
      </main>
    </>
  );
}
