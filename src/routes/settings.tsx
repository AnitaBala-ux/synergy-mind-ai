import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { getClientId } from "@/lib/client-id";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ResearchFlow AI" },
      { name: "description", content: "Manage your ResearchFlow AI workspace preferences, view your local workspace ID, and learn how your data is stored in your browser." },
      { property: "og:title", content: "Settings — ResearchFlow AI" },
      { property: "og:description", content: "Manage your ResearchFlow AI workspace preferences." },
      { property: "og:url", content: "https://synergy-mind-ai.lovable.app/settings" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://synergy-mind-ai.lovable.app/settings" }],
  }),
  component: Settings,
});

function Settings() {
  const [cid, setCid] = useState("");
  useEffect(() => { setCid(getClientId()); }, []);

  return (
    <>
      <TopBar title="Settings" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">Workspace</h2>
            <p className="text-xs text-muted-foreground mt-1">ResearchFlow AI runs without an account. Your data is scoped to this browser using a local workspace ID.</p>
            <div className="mt-4 text-xs">
              <div className="text-muted-foreground">Workspace ID</div>
              <code className="block mt-1 px-3 py-2 rounded-md bg-muted font-mono text-[11px] break-all">{cid}</code>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">About</h2>
            <p className="text-sm text-muted-foreground mt-2">
              <strong className="text-foreground">ResearchFlow AI</strong> — Research Smarter. Plan Better. Achieve More.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Powered by Lovable AI Gateway.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
