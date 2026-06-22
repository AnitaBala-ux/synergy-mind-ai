import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { useServerFn } from "@tanstack/react-start";
import { runResearch } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — ResearchFlow AI" },
      { name: "description", content: "Conduct academic and workplace research with AI-powered templates." },
    ],
  }),
  component: ResearchPage,
});

const TEMPLATES = [
  { id: "academic", label: "Academic Research" },
  { id: "business", label: "Business Research" },
  { id: "policy", label: "Policy Analysis" },
  { id: "literature", label: "Literature Review" },
  { id: "summary", label: "Report Summary" },
] as const;

type Session = { id: string; template: string; query: string; result: string; created_at: string };

function ResearchPage() {
  const run = useServerFn(runResearch);
  const [query, setQuery] = useState("");
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]["id"]>("academic");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  const loadSessions = async () => {
    const cid = getClientId();
    const { data } = await supabase
      .from("research_sessions")
      .select("*")
      .eq("client_id", cid)
      .order("created_at", { ascending: false })
      .limit(20);
    setSessions((data ?? []) as Session[]);
  };
  useEffect(() => { loadSessions(); }, []);

  const onRun = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const { result } = await run({ data: { query, template } });
      setOutput(result);
    } catch (e) {
      toast.error((e as Error).message || "Research failed");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!output) return;
    await supabase.from("research_sessions").insert({
      client_id: getClientId(), template, query, result: output,
    });
    toast.success("Saved to workspace");
    loadSessions();
  };

  const onCopy = () => { navigator.clipboard.writeText(output); toast.success("Copied"); };
  const onDownload = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `research-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSession = async (id: string) => {
    await supabase.from("research_sessions").delete().eq("id", id);
    loadSessions();
  };

  return (
    <>
      <TopBar title="Research Assistant" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            {/* Input card */}
            <section className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-4 text-primary" />
                <h2 className="font-semibold">New Research Query</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Choose a template and describe what you want to research.</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${
                      template === t.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary text-muted-foreground"
                    }`}
                  >{t.label}</button>
                ))}
              </div>

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Summarize recent advances in retrieval-augmented generation for legal research..."
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />

              <div className="mt-3 flex gap-2">
                <button onClick={onRun} disabled={loading || !query.trim()}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {loading ? "Researching..." : "Run Research"}
                </button>
                <button onClick={() => { setQuery(""); setOutput(""); }} className="px-4 py-2 rounded-md border border-border text-sm">Clear</button>
              </div>
            </section>

            {/* Output */}
            {(output || loading) && (
              <section className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">AI Output</h3>
                  <div className="flex gap-1.5">
                    <button onClick={onCopy} disabled={!output} className="p-2 rounded-md hover:bg-muted disabled:opacity-40" aria-label="Copy"><Copy className="size-4" /></button>
                    <button onClick={onDownload} disabled={!output} className="p-2 rounded-md hover:bg-muted disabled:opacity-40" aria-label="Download"><Download className="size-4" /></button>
                    <button onClick={onSave} disabled={!output} className="p-2 rounded-md hover:bg-muted disabled:opacity-40" aria-label="Save"><Save className="size-4" /></button>
                  </div>
                </div>
                {loading && !output ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                    <Loader2 className="size-4 animate-spin" /> Generating insights...
                  </div>
                ) : (
                  <div className="prose-chat">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* History */}
          <aside className="rounded-xl border border-border bg-card p-4 h-fit">
            <h3 className="font-semibold text-sm mb-3">Saved Sessions</h3>
            {sessions.length === 0 && <p className="text-xs text-muted-foreground">No saved research yet.</p>}
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="group p-3 rounded-lg border border-border hover:border-primary cursor-pointer text-xs"
                  onClick={() => { setQuery(s.query); setTemplate(s.template as never); setOutput(s.result); }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{s.query}</div>
                      <div className="text-muted-foreground mt-1">{TEMPLATES.find((t) => t.id === s.template)?.label}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
