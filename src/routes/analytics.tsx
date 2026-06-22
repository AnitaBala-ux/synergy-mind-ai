import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/client-id";
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  Line, LineChart,
} from "recharts";
import { Flame, Clock, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — ResearchFlow AI" },
      { name: "description", content: "Productivity score, focus time, streaks, and weekly trends." },
    ],
  }),
  component: Analytics,
});

type DayRow = { day: string; date: string; completed: number; created: number; focusMins: number };

function Analytics() {
  const [days, setDays] = useState<DayRow[]>([]);
  const [totals, setTotals] = useState({
    completed: 0,
    research: 0,
    focusHours: 0,
    streak: 0,
    longestStreak: 0,
    score: 0,
  });

  useEffect(() => {
    (async () => {
      const cid = getClientId();
      const since = new Date();
      since.setDate(since.getDate() - 29); // 30-day window for streaks
      since.setHours(0, 0, 0, 0);

      const [{ data: tasks }, { data: research }, { data: focus }] = await Promise.all([
        supabase.from("tasks")
          .select("created_at,completed_at,status,priority")
          .eq("client_id", cid)
          .gte("created_at", since.toISOString()),
        supabase.from("research_sessions")
          .select("created_at")
          .eq("client_id", cid)
          .gte("created_at", since.toISOString()),
        supabase.from("focus_sessions")
          .select("started_at,duration_seconds")
          .eq("client_id", cid)
          .gte("started_at", since.toISOString()),
      ]);

      // last 7 days
      const week: DayRow[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        const completed = (tasks ?? []).filter((t) => t.completed_at?.slice(0, 10) === dayStr).length;
        const created = (tasks ?? []).filter((t) => t.created_at?.slice(0, 10) === dayStr).length;
        const focusMins = Math.round(
          (focus ?? [])
            .filter((f) => f.started_at?.slice(0, 10) === dayStr)
            .reduce((sum, f) => sum + (f.duration_seconds ?? 0), 0) / 60,
        );
        week.push({
          day: d.toLocaleDateString(undefined, { weekday: "short" }),
          date: dayStr,
          completed, created, focusMins,
        });
      }
      setDays(week);

      // Streak: consecutive days (ending today) with at least 1 completed task OR focus session OR research
      const activeByDay = new Map<string, boolean>();
      (tasks ?? []).forEach((t) => { if (t.completed_at) activeByDay.set(t.completed_at.slice(0, 10), true); });
      (focus ?? []).forEach((f) => { if (f.started_at) activeByDay.set(f.started_at.slice(0, 10), true); });
      (research ?? []).forEach((r) => { if (r.created_at) activeByDay.set(r.created_at.slice(0, 10), true); });

      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        if (activeByDay.get(d.toISOString().slice(0, 10))) streak++;
        else if (i === 0) continue; // grace for today not started yet
        else break;
      }
      // Longest streak in last 30 days
      let longest = 0, run = 0;
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        if (activeByDay.get(d.toISOString().slice(0, 10))) { run++; longest = Math.max(longest, run); }
        else run = 0;
      }

      // Productivity score (0-100) — weighted blend:
      //   completion rate (0-50) + focus volume (0-30) + research/streak (0-20)
      const weekTasks = (tasks ?? []).filter((t) => new Date(t.created_at) >= new Date(week[0].date));
      const weekCompleted = weekTasks.filter((t) => t.status === "completed").length;
      const completionRate = weekTasks.length ? weekCompleted / weekTasks.length : 0;
      const weekFocusMins = week.reduce((s, d) => s + d.focusMins, 0);
      const weekResearch = (research ?? []).filter((r) => new Date(r.created_at) >= new Date(week[0].date)).length;

      const completionScore = Math.round(completionRate * 50);
      const focusScore = Math.min(30, Math.round((weekFocusMins / 600) * 30)); // 10 hrs/week = full
      const engagementScore = Math.min(20, weekResearch * 4 + Math.min(streak, 7) * 2);
      const score = completionScore + focusScore + engagementScore;

      const totalFocusHours = Math.round(
        (focus ?? []).reduce((sum, f) => sum + (f.duration_seconds ?? 0), 0) / 3600,
      );

      setTotals({
        completed: (tasks ?? []).filter((t) => t.status === "completed").length,
        research: research?.length ?? 0,
        focusHours: totalFocusHours,
        streak,
        longestStreak: longest,
        score,
      });
    })();
  }, []);

  const scoreBand = useMemo(() => {
    if (totals.score >= 80) return { label: "Excellent", color: "text-emerald-600" };
    if (totals.score >= 60) return { label: "Strong", color: "text-primary" };
    if (totals.score >= 40) return { label: "Building", color: "text-amber-600" };
    return { label: "Getting started", color: "text-muted-foreground" };
  }, [totals.score]);

  const cards = [
    { label: "Tasks Completed (30d)", value: totals.completed, icon: Sparkles },
    { label: "Research Sessions", value: totals.research, icon: TrendingUp },
    { label: "Focus Hours (30d)", value: totals.focusHours, icon: Clock },
    { label: "Active Day Streak", value: totals.streak, icon: Flame, suffix: totals.longestStreak ? `best ${totals.longestStreak}` : undefined },
  ];

  return (
    <>
      <TopBar title="Productivity Analytics" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
        {/* Productivity score hero */}
        <section className="rounded-2xl border border-border bg-card p-6 grid lg:grid-cols-[280px_1fr] gap-6 items-center">
          <div className="relative size-56 mx-auto">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="42" stroke="var(--color-muted)" strokeWidth="10" fill="none" />
              <circle
                cx="50" cy="50" r="42"
                stroke="var(--color-primary)" strokeWidth="10" fill="none" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - totals.score / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-5xl font-bold tabular-nums">{totals.score}</div>
                <div className={`text-xs font-medium ${scoreBand.color}`}>{scoreBand.label}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Weekly Productivity Score</div>
            <h2 className="mt-1 text-xl font-semibold">Auto-calculated from your activity</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg">
              Blends task completion rate, logged focus time, research sessions, and your active-day streak into a single score out of 100.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <ScoreBreak label="Completion" max={50} val={Math.min(50, Math.round(totals.score * 0.5))} />
              <ScoreBreak label="Focus time" max={30} val={Math.min(30, Math.round(totals.score * 0.3))} />
              <ScoreBreak label="Engagement" max={20} val={Math.min(20, Math.round(totals.score * 0.2))} />
            </div>
          </div>
        </section>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-3 text-3xl font-semibold">{c.value}</div>
                {c.suffix && <div className="mt-1 text-[11px] text-muted-foreground">{c.suffix}</div>}
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-1">Weekly Task Activity</h3>
            <p className="text-xs text-muted-foreground mb-4">Tasks created vs completed (last 7 days)</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Bar dataKey="created" fill="var(--color-muted-foreground)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-1">Daily Focus Time</h3>
            <p className="text-xs text-muted-foreground mb-4">Minutes of tracked focus per day</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={days}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="focusMins" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function ScoreBreak({ label, val, max }: { label: string; val: number; max: number }) {
  const pct = Math.min(100, (val / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-muted-foreground">
        <span>{label}</span><span className="tabular-nums">{val}/{max}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
