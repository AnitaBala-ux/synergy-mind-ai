import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — SynergyMind AI" },
      { name: "description", content: "Sign in or create your SynergyMind AI account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success(t("auth.checkEmail"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error instanceof Error ? result.error.message : "Sign-in failed");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="size-9 rounded-lg bg-primary/20 grid place-items-center">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">SynergyMind AI</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("common.workspace")}
            </div>
          </div>
        </Link>

        <h1 className="text-2xl font-bold">{t("auth.welcome")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.subtitle")}</p>

        <div className="mt-6 space-y-2">
          <button
            onClick={() => oauth("google")}
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
          >
            {t("common.continueWithGoogle")}
          </button>
          <button
            onClick={() => oauth("apple")}
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
          >
            {t("common.continueWithApple")}
          </button>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase">{t("common.or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("common.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("common.password")}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {mode === "signin" ? t("common.signIn") : t("auth.createAccount")}
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-4">
          {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary font-medium hover:underline"
          >
            {mode === "signin" ? t("common.signUp") : t("common.signIn")}
          </button>
        </p>
      </div>
    </main>
  );
}
