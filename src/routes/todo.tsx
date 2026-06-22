import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import { Plus, Trash2, Check, Circle, CircleDot, Play, Square, Timer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/todo")({
  head: () => ({
    meta: [
      { title: "To-Do List — ResearchFlow AI" },
      { name: "description", content: "Smart to-do list with priorities, categories, deadlines, and a built-in focus timer." },
      { property: "og:title", content: "Smart To-Do List — ResearchFlow AI" },
      { property: "og:description", content: "Prioritized tasks, deadlines, and a built-in Pomodoro focus timer." },
      { property: "og:url", content: "https://synergy-mind-ai.lovable.app/todo" },
    ],
    links: [{ rel: "canonical", href: "https://synergy-mind-ai.lovable.app/todo" }],
  }),
  component: Todo,
});

type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
};

const CATEGORIES = ["research", "academic", "work", "personal"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;
const STATUSES = [
  { id: "not_started", label: "Not Started", icon: Circle },
  { id: "in_progress", label: "In Progress", icon: CircleDot },
  { id: "completed", label: "Completed", icon: Check },
] as const;

function Todo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "work", priority: "medium", due_date: "" });

  // Focus timer state (single active timer)
  const [activeTimer, setActiveTimer] = useState<{ taskId: string; startedAt: number } | null>(null);
  const [tick, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeTimer) {
      tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
      return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }
  }, [activeTimer]);

  const load = async () => {
    const cid = getClientId();
    const { data } = await supabase
      .from("tasks").select("*").eq("client_id", cid)
      .order("created_at", { ascending: false });
    setTasks((data ?? []) as Task[]);
  };
  useEffect(() => { load(); }, []);

  const addTask = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from("tasks").insert({
      client_id: getClientId(),
      title: form.title,
      description: form.description || null,
      category: form.category,
      priority: form.priority,
      due_date: form.due_date || null,
    });
    if (error) { toast.error(error.message); return; }
    setForm({ title: "", description: "", category: "work", priority: "medium", due_date: "" });
    setShowForm(false);
    load();
  };

  const recordFocusSession = async (taskId: string | null, durationSeconds: number, source: "manual" | "auto") => {
    if (durationSeconds < 5) return;
    await supabase.from("focus_sessions").insert({
      client_id: getClientId(),
      task_id: taskId,
      source,
      duration_seconds: durationSeconds,
      started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    });
  };

  const setStatus = async (id: string, status: string) => {
    const prev = tasks.find((t) => t.id === id);
    await supabase.from("tasks").update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    }).eq("id", id);
    // Auto focus session estimate when task completes (and no manual timer is/was active for it)
    if (status === "completed" && prev?.status !== "completed" && activeTimer?.taskId !== id) {
      const estimate = prev?.priority === "high" ? 45 * 60 : prev?.priority === "medium" ? 25 * 60 : 15 * 60;
      await recordFocusSession(id, estimate, "auto");
    }
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    if (activeTimer?.taskId === id) setActiveTimer(null);
    load();
  };

  const startTimer = (taskId: string) => {
    if (activeTimer && activeTimer.taskId !== taskId) {
      stopTimer(); // stop previous first
    }
    setActiveTimer({ taskId, startedAt: Date.now() });
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    const duration = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
    await recordFocusSession(activeTimer.taskId, duration, "manual");
    setActiveTimer(null);
    toast.success(`Logged ${formatDuration(duration)} of focus time`);
  };

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter || t.category === filter || t.priority === filter);

  const priorityColors: Record<string, string> = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-amber-500/10 text-amber-600",
    low: "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <>
      <TopBar title="To-Do List" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold">Your Tasks</h2>
              <p className="text-xs text-muted-foreground">{tasks.length} total · {tasks.filter((t) => t.status === "completed").length} completed</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
              <Plus className="size-4" /> New Task
            </button>
          </div>

          {activeTimer && (
            <div className="mb-4 p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Timer className="size-4 text-primary animate-pulse" />
                <span className="font-medium">Focus session active</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono tabular-nums">{formatDuration(Math.floor((Date.now() - activeTimer.startedAt) / 1000))}</span>
                <span className="text-muted-foreground truncate max-w-xs">
                  on "{tasks.find((t) => t.id === activeTimer.taskId)?.title}"
                </span>
                <span className="sr-only">{tick}</span>
              </div>
              <button onClick={stopTimer}
                className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium flex items-center gap-1.5">
                <Square className="size-3.5" /> Stop & log
              </button>
            </div>
          )}

          {showForm && (
            <div className="mb-5 p-5 rounded-xl border border-border bg-card space-y-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task title" className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description (optional)" rows={2}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
              <div className="grid grid-cols-3 gap-3">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm capitalize">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm capitalize">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-md text-sm border border-border">Cancel</button>
                <button onClick={addTask} className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground">Add task</button>
              </div>
            </div>
          )}

          <div className="flex gap-1.5 mb-4 flex-wrap text-xs">
            {["all", ...STATUSES.map((s) => s.id), ...CATEGORIES, ...PRIORITIES].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-full border capitalize ${filter === f ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-sm text-muted-foreground">No tasks here yet.</div>
            )}
            {filtered.map((t) => {
              const nextStatus = t.status === "not_started" ? "in_progress" : t.status === "in_progress" ? "completed" : "not_started";
              const StatusIcon = STATUSES.find((s) => s.id === t.status)?.icon ?? Circle;
              const timerHere = activeTimer?.taskId === t.id;
              return (
                <div key={t.id} className={`p-4 rounded-lg border ${timerHere ? "border-primary" : "border-border"} bg-card flex items-start gap-3 ${t.status === "completed" ? "opacity-60" : ""}`}>
                  <button onClick={() => setStatus(t.id, nextStatus)}
                    className={`mt-0.5 size-6 rounded-full grid place-items-center border ${t.status === "completed" ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
                    <StatusIcon className="size-3.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${t.status === "completed" ? "line-through" : ""}`}>{t.title}</div>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full ${priorityColors[t.priority]}`}>{t.priority}</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{t.category}</span>
                      {t.due_date && <span className="text-muted-foreground">Due {new Date(t.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  {t.status !== "completed" && (
                    timerHere ? (
                      <button onClick={stopTimer}
                        className="p-1.5 rounded-md text-primary hover:bg-primary/10" aria-label="Stop timer" title="Stop focus timer">
                        <Square className="size-4" />
                      </button>
                    ) : (
                      <button onClick={() => startTimer(t.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted" aria-label="Start timer" title="Start focus timer">
                        <Play className="size-4" />
                      </button>
                    )
                  )}
                  <button onClick={() => remove(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}
