import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import {
  Bot,
  BookOpen,
  CalendarClock,
  CheckSquare,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResearchFlow AI — Smart AI Research & Planning" },
      { name: "description", content: "Your unified AI workspace for academic research, planning, smart to-dos, and productivity analytics — all in one dashboard." },
      { property: "og:title", content: "ResearchFlow AI — Research Smarter. Plan Better. Achieve More." },
      { property: "og:description", content: "AI research, planning, and productivity in one unified workspace." },
      { property: "og:url", content: "https://synergy-mind-ai.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://synergy-mind-ai.lovable.app/" }],
  }),
  component: Dashboard,
});

type Stats = {
  tasksDue: number;
  inProgress: number;
  completed: number;
  research: number;
  projects: number;
};

function Dashboard() {
  const [stats, setStats] = useState<Stats>({ tasksDue: 0, inProgress: 0, completed: 0, research: 0, projects: 0 });

  useEffect(() => {
    const cid = getClientId();
    (async () => {
      const today = new Date(); today.setHours(23, 59, 59, 999);
      const [{ count: due }, { count: prog }, { count: done }, { count: research }, { count: projects }] = await Promise.all([
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("client_id", cid).neq("status", "completed").lte("due_date", today.toISOString()),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("client_id", cid).eq("status", "in_progress"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("client_id", cid).eq("status", "completed"),
        supabase.from("research_sessions").select("*", { count: "exact", head: true }).eq("client_id", cid),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("client_id", cid),
      ]);
      setStats({
        tasksDue: due ?? 0,
        inProgress: prog ?? 0,
        completed: done ?? 0,
        research: research ?? 0,
        projects: projects ?? 0,
      });
    })();
  }, []);

  const total = stats.completed + stats.inProgress + stats.tasksDue;
  const productivity = total ? Math.round((stats.completed / total) * 100) : 0;

  const cards = [
    { label: "Tasks Due Today", value: stats.tasksDue, icon: CheckSquare, color: "from-blue-500/20 to-blue-500/5" },
    { label: "In Progress", value: stats.inProgress, icon: CalendarClock, color: "from-amber-500/20 to-amber-500/5" },
    { label: "Research Sessions", value: stats.research, icon: BookOpen, color: "from-teal-500/20 to-teal-500/5" },
    { label: "Active Projects", value: stats.projects, icon: TrendingUp, color: "from-purple-500/20 to-purple-500/5" },
  ];

  const quick = [
    { to: "/chat", title: "AI Assistant", desc: "Chat with ResearchFlow AI for any question.", icon: Bot },
    { to: "/research", title: "Run Research", desc: "Summarize articles, generate literature reviews.", icon: BookOpen },
    { to: "/planner", title: "Plan My Week", desc: "Turn goals into an optimized schedule.", icon: CalendarClock },
    { to: "/todo", title: "Manage Tasks", desc: "Smart to-do list with priorities & deadlines.", icon: CheckSquare },
  ];

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="p-6 lg:p-8 space-y-8 overflow-y-auto">
        {/* Hero */}
        <section className="rounded-2xl p-8 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elegant">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
            <Sparkles className="size-3.5" /> Welcome back
          </div>
          <h2 className="mt-2 text-3xl font-semibold">Research Smarter. Plan Better. Achieve More.</h2>
          <p className="mt-2 text-sm opacity-90 max-w-xl">Your unified AI workspace for research, planning, and productivity.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/chat" className="px-4 py-2 rounded-md bg-white/15 hover:bg-white/25 text-sm font-medium backdrop-blur transition">Open AI Assistant</Link>
            <Link to="/research" className="px-4 py-2 rounded-md bg-white text-primary text-sm font-medium hover:bg-white/90 transition">Start Research</Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className={`rounded-xl border border-border bg-gradient-to-br ${c.color} bg-card p-5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-3 text-3xl font-semibold">{c.value}</div>
              </div>
            );
          })}
        </section>

        {/* Productivity + Quick actions */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold">Productivity Score</h3>
            <p className="text-xs text-muted-foreground">Tasks completed / total tracked</p>
            <div className="mt-6 flex items-center justify-center">
              <div className="relative size-40">
                <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                  <circle cx="50" cy="50" r="42" stroke="var(--color-muted)" strokeWidth="10" fill="none" />
                  <circle cx="50" cy="50" r="42" stroke="var(--color-primary)" strokeWidth="10" fill="none"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - productivity / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{productivity}%</div>
                    <div className="text-xs text-muted-foreground">{stats.completed}/{total}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Jump into any module</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {quick.map((q) => {
                const Icon = q.icon;
                return (
                  <Link key={q.to} to={q.to} className="group p-4 rounded-lg border border-border hover:border-primary hover:bg-muted/40 transition flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{q.title}</div>
                      <div className="text-xs text-muted-foreground">{q.desc}</div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
