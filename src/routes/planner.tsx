import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { useServerFn } from "@tanstack/react-start";
import { runPlanner } from "@/lib/ai.functions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CalendarClock, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Task Planner — ResearchFlow AI" },
      { name: "description", content: "AI-powered weekly planner and scheduler." },
    ],
  }),
  component: Planner,
});

function Planner() {
  const run = useServerFn(runPlanner);
  const [goals, setGoals] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hoursPerDay, setHours] = useState(6);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const onRun = async () => {
    if (!goals.trim()) return;
    setLoading(true); setOutput("");
    try {
      const { result } = await run({ data: { goals, deadline: deadline || undefined, hoursPerDay, priority } });
      setOutput(result);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <TopBar title="Task Planner" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[360px_1fr] gap-6">
          <section className="rounded-xl border border-border bg-card p-6 h-fit">
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="size-4 text-primary" />
              <h2 className="font-semibold">Plan My Schedule</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Describe your goals; AI builds the schedule.</p>

            <label className="text-xs font-medium">Goals & Tasks</label>
            <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={6}
              placeholder="e.g. Finish literature review, draft 3 chapters, prepare slides for Friday seminar..."
              className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Deadline</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Hours / day</label>
                <input type="number" min={1} max={16} value={hoursPerDay} onChange={(e) => setHours(+e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
              </div>
            </div>

            <label className="mt-3 block text-xs font-medium">Priority</label>
            <div className="mt-1 flex gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs capitalize border ${priority === p ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{p}</button>
              ))}
            </div>

            <button onClick={onRun} disabled={loading || !goals.trim()}
              className="mt-4 w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
              {loading ? "Building plan..." : "Generate Plan"}
            </button>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Your Weekly Plan</h3>
              {output && (
                <button onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}
                  className="p-2 rounded-md hover:bg-muted"><Copy className="size-4" /></button>
              )}
            </div>
            {!output && !loading && (
              <div className="text-center py-16 text-sm text-muted-foreground">
                Your generated schedule will appear here.
              </div>
            )}
            {loading && !output && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Building your optimized plan...
              </div>
            )}
            {output && (
              <div className="prose-chat">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
